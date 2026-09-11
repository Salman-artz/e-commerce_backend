import { OrderStatus, PaymentMethod, PaymentStatus, Prisma, ProductStatus, Role } from '@prisma/client';
import crypto from 'crypto';
import { env } from '../../config/env';
import { AppError } from '../../common/app-error';
import { addressRepository } from '../addresses/address.repository';
import { cartRepository } from '../cart/cart.repository';
import { orderRepository } from './order.repository';
import type { CheckoutInput, OrderQueryInput, OrderStatusUpdateInput } from './order.schemas';
import { prisma } from '../../config/prisma';
import { PaymentGatewayProvider, verifyGatewayWebhookSignature } from '../payments/payment-gateway';

function serializeOrder(order: any) {
  const serialized = { ...order };
  if (serialized.status === 'PENDING') {
    serialized.paymentUrl = `http://localhost:3000/mock-payment?orderId=${order.id}`;
  }
  return serialized;
}

function normalizeGatewayPaymentStatus(status: PaymentStatus | string): PaymentStatus {
  const normalized = String(status).trim().toLowerCase();

  if (normalized === 'settlement' || normalized === 'capture' || normalized === 'paid') {
    return PaymentStatus.PAID;
  }

  if (normalized === 'pending') {
    return PaymentStatus.PENDING;
  }

  if (normalized === 'deny' || normalized === 'failed') {
    return PaymentStatus.FAILED;
  }

  if (normalized === 'expire' || normalized === 'expired') {
    return PaymentStatus.EXPIRED;
  }

  if (normalized === 'cancel' || normalized === 'canceled' || normalized === 'cancelled') {
    return PaymentStatus.CANCELLED;
  }

  if (Object.values(PaymentStatus).includes(status as PaymentStatus)) {
    return status as PaymentStatus;
  }

  throw new AppError(400, 'UNSUPPORTED_PAYMENT_STATUS', `Unsupported payment status: ${status}`);
}

export const orderService = {
  async checkout(userId: number, input: CheckoutInput) {
    const result = await prisma.$transaction(async (tx) => {
      let itemsToCheckout: any[] = [];
      let cart: any = null;

      if (input.directPurchase) {
        const product = await tx.product.findUnique({
          where: { id: input.directPurchase.productId }
        });
        
        if (!product) {
          throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
        }

        itemsToCheckout = [{
          id: -1, // dummy id
          productId: product.id,
          quantity: input.directPurchase.quantity,
          product
        }];
      } else {
        cart = await cartRepository.getCartWithItemsTx(tx, userId);
        itemsToCheckout = cart?.items || [];
        
        if (input.cartItemIds && input.cartItemIds.length > 0) {
          itemsToCheckout = itemsToCheckout.filter(item => input.cartItemIds!.includes(item.id));
        }

        if (!cart || itemsToCheckout.length === 0) {
          throw new AppError(400, 'CART_EMPTY', 'No items selected for checkout');
        }
      }

      const address = input.addressId
        ? await tx.address.findFirst({
            where: {
              id: input.addressId,
              userId
            }
          })
        : await tx.address.findFirst({
            where: {
              userId,
              isDefault: true
            },
            orderBy: { createdAt: 'desc' }
          }) ?? await tx.address.findFirst({
            where: { userId },
            orderBy: { createdAt: 'asc' }
          });

      if (!address) {
        throw new AppError(400, 'ADDRESS_REQUIRED', 'Shipping address is required');
      }

      const shippingCost = input.shippingCost || 0;
      const totalAmount = (
        itemsToCheckout.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0)
        + shippingCost
      ).toFixed(2);

      for (const item of itemsToCheckout) {
        if (item.product.status !== ProductStatus.ACTIVE) {
          throw new AppError(400, 'PRODUCT_NOT_AVAILABLE', `Product ${item.product.name} is not available`);
        }

        const updated = await tx.product.updateMany({
          where: {
            id: item.productId,
            stock: { gte: item.quantity },
            status: ProductStatus.ACTIVE
          },
          data: {
            stock: { decrement: item.quantity },
            ...(item.quantity === item.product.stock ? { status: ProductStatus.OUT_OF_STOCK } : {})
          }
        });

        if (updated.count === 0) {
          throw new AppError(400, 'INSUFFICIENT_STOCK', `Insufficient stock for ${item.product.name}`);
        }
      }

      const order = await tx.order.create({
        data: {
          userId,
          addressId: address.id,
          status: OrderStatus.PENDING,
          totalAmount,
          shippingCost,
          items: {
            create: itemsToCheckout.map((item) => ({
              productId: item.productId,
              productNameSnapshot: item.product.name,
              priceSnapshot: item.product.price,
              quantity: item.quantity
            }))
          }
        },
        include: {
          items: true,
          payment: true,
          address: true,
          user: true
        }
      });

      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          method: input.paymentMethod,
          status: PaymentStatus.PENDING,
          gatewayReference: `${input.paymentMethod.toLowerCase()}-${order.id}-${Date.now()}`
        }
      });

      if (cart) {
        const checkedOutItemIds = itemsToCheckout.map(item => item.id);
        await tx.cartItem.deleteMany({ 
          where: { 
            cartId: cart.id,
            id: { in: checkedOutItemIds }
          } 
        });
      }

      return { order, payment };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    const finalOrder = await orderRepository.findById(result.order.id);
    return serializeOrder(finalOrder);
  },

  async listOrders(userId: number, role: Role, query: OrderQueryInput) {
    const filters = orderRepository.getWhereClause({
      status: query.status,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined
    });

    const pagination = {
      skip: (query.page - 1) * query.limit,
      take: query.limit
    };

    const [totalItems, items] = await Promise.all([
      orderRepository.count(role === Role.ADMIN ? filters : { userId, ...filters }),
      role === Role.ADMIN
        ? orderRepository.findMany(filters, pagination.skip, pagination.take)
        : orderRepository.findManyByUser(userId, filters, pagination.skip, pagination.take)
    ]);

    return {
      items: items.map(serializeOrder),
      pagination: {
        page: query.page,
        limit: query.limit,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / query.limit))
      }
    };
  },

  async getOrder(userId: number, role: Role, orderId: number) {
    const order = role === Role.ADMIN ? await orderRepository.findById(orderId) : await orderRepository.findByIdAndUser(orderId, userId);

    if (!order) {
      throw new AppError(404, 'ORDER_NOT_FOUND', 'Order not found');
    }

    return serializeOrder(order as never);
  },

  async updateStatus(role: Role, orderId: number, input: OrderStatusUpdateInput) {
    if (role !== Role.ADMIN) {
      throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions');
    }

    const order = await orderRepository.findById(orderId);

    if (!order) {
      throw new AppError(404, 'ORDER_NOT_FOUND', 'Order not found');
    }

    const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PAID]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.COMPLETED],
      [OrderStatus.COMPLETED]: [],
      [OrderStatus.CANCELLED]: []
    };

    if (!allowedTransitions[order.status].includes(input.status)) {
      throw new AppError(
        400,
        'INVALID_ORDER_STATUS_TRANSITION',
        `Cannot change order status from ${order.status} to ${input.status}`
      );
    }

    return orderRepository.updateStatus(orderId, input.status);
  },

  async getPaymentStatus(userId: number, role: Role, orderId: number) {
    const order = await this.getOrder(userId, role, orderId);

    return {
      orderId: order.id,
      orderStatus: order.status,
      payment: (await orderRepository.findPaymentByOrderId(orderId))
    };
  },

  async handleWebhook(payload: { orderId: number; provider: PaymentGatewayProvider; status: PaymentStatus | OrderStatus | string; gatewayReference: string; method?: PaymentMethod; eventId?: string }, context: { signature?: string; providerHeader?: string }) {
    const signature = context.signature;
    const providerHeader = context.providerHeader;

    const provider = payload.provider;

    if (providerHeader && providerHeader.toUpperCase() !== provider) {
      throw new AppError(400, 'PAYMENT_PROVIDER_MISMATCH', 'Payment provider header does not match webhook payload');
    }

    if (!Object.values(PaymentGatewayProvider).includes(provider)) {
      throw new AppError(400, 'UNSUPPORTED_PAYMENT_PROVIDER', `Unsupported payment gateway provider: ${provider}`);
    }

    if (!verifyGatewayWebhookSignature(provider, payload, signature)) {
      throw new AppError(401, 'INVALID_SIGNATURE', 'Invalid webhook signature');
    }

    const paymentStatus = normalizeGatewayPaymentStatus(payload.status);

    return prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { orderId: payload.orderId },
        include: { order: true }
      });

      if (!payment) {
        throw new AppError(404, 'PAYMENT_NOT_FOUND', 'Payment not found');
      }

      if (payload.gatewayReference && payment.gatewayReference && payload.gatewayReference !== payment.gatewayReference) {
        throw new AppError(409, 'PAYMENT_REFERENCE_MISMATCH', 'Gateway reference does not match the stored payment reference');
      }

      if (payload.method && payment.method !== payload.method) {
        throw new AppError(409, 'PAYMENT_METHOD_MISMATCH', 'Payment method does not match the stored payment method');
      }

      if (!payload.gatewayReference) {
        throw new AppError(400, 'PAYMENT_REFERENCE_REQUIRED', 'Gateway reference is required');
      }

      if (payment.status === paymentStatus) {
        return { payment, order: payment.order };
      }

      if (payment.status === PaymentStatus.PAID && paymentStatus !== PaymentStatus.PAID) {
        throw new AppError(409, 'PAYMENT_STATUS_LOCKED', 'Paid payments cannot be downgraded by webhook events');
      }

      const updatedPayment = await tx.payment.update({
        where: { orderId: payload.orderId },
        data: {
          status: paymentStatus,
          gatewayReference: payload.gatewayReference,
          ...(paymentStatus === PaymentStatus.PAID ? { paidAt: new Date() } : {})
        },
        include: { order: true }
      });

      let nextOrderStatus = payment.order.status;

      if (paymentStatus === PaymentStatus.PAID && payment.order.status === OrderStatus.PENDING) {
        nextOrderStatus = OrderStatus.PROCESSING;
      }

      if (
        (paymentStatus === PaymentStatus.FAILED || paymentStatus === PaymentStatus.EXPIRED || paymentStatus === PaymentStatus.CANCELLED) &&
        (payment.order.status === OrderStatus.PENDING || payment.order.status === OrderStatus.PAID)
      ) {
        nextOrderStatus = OrderStatus.CANCELLED;
      }

      const updatedOrder = nextOrderStatus === payment.order.status
        ? payment.order
        : await tx.order.update({
            where: { id: payload.orderId },
            data: { status: nextOrderStatus }
          });

      return { payment: updatedPayment, order: updatedOrder };
    });
  },

  async simulatePayment(orderId: number) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order) throw new AppError(404, 'ORDER_NOT_FOUND', 'Order not found');
      
      const payment = await tx.payment.findUnique({ where: { orderId } });
      if (!payment) throw new AppError(404, 'PAYMENT_NOT_FOUND', 'Payment not found');

      if (order.status !== OrderStatus.PENDING) {
        throw new AppError(400, 'ORDER_NOT_PENDING', 'Order is not pending');
      }

      await tx.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.PAID, paidAt: new Date() }
      });

      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.PROCESSING }
      });

      return serializeOrder(updatedOrder);
    });
  },

  async completeOrder(userId: number, orderId: number) {
    const order = await orderRepository.findByIdAndUser(orderId, userId);
    
    if (!order) {
      throw new AppError(404, 'ORDER_NOT_FOUND', 'Order not found or access denied');
    }

    if (order.status !== OrderStatus.SHIPPED) {
      throw new AppError(400, 'INVALID_ORDER_STATUS', 'Only shipped orders can be marked as completed by the customer');
    }

    return orderRepository.updateStatus(orderId, OrderStatus.COMPLETED);
  },

  async submitReviews(userId: number, orderId: number, input: import('./order.schemas').OrderReviewInput) {
    const order = await orderRepository.findByIdAndUser(orderId, userId);
    
    if (!order) {
      throw new AppError(404, 'ORDER_NOT_FOUND', 'Order not found or access denied');
    }

    if (order.status !== OrderStatus.COMPLETED) {
      throw new AppError(400, 'INVALID_ORDER_STATUS', 'Reviews can only be submitted for completed orders');
    }

    // Check if review already exists
    const existingReview = await prisma.review.findFirst({
      where: { orderId, userId }
    });

    if (existingReview) {
      throw new AppError(409, 'REVIEW_ALREADY_EXISTS', 'You have already submitted a review for this order');
    }

    // Ensure they only review products in this order
    const orderProductIds = order.items.map(i => i.productId);
    const validReviews = input.reviews.filter(r => orderProductIds.includes(r.productId));

    if (validReviews.length === 0) {
      throw new AppError(400, 'INVALID_REVIEWS', 'No valid products to review');
    }

    return prisma.review.createMany({
      data: validReviews.map(r => ({
        userId,
        orderId,
        productId: r.productId,
        rating: r.rating,
        comment: r.comment || null,
        isAnonymous: r.isAnonymous || false
      }))
    });
  }
};