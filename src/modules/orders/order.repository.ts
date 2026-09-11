import { OrderStatus, PaymentStatus, Prisma, ProductStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';

const orderInclude = {
  items: {
    orderBy: { createdAt: 'asc' as const }
  },
  payment: true,
  address: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  },
  reviews: {
    select: { id: true }
  }
} satisfies Prisma.OrderInclude;

export const orderRepository = {
  findManyByUser(userId: number, filters: Prisma.OrderWhereInput, skip: number, take: number) {
    return prisma.order.findMany({
      where: { userId, ...filters },
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
      skip,
      take
    });
  },

  findMany(filters: Prisma.OrderWhereInput, skip: number, take: number) {
    return prisma.order.findMany({
      where: filters,
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
      skip,
      take
    });
  },

  count(filters: Prisma.OrderWhereInput) {
    return prisma.order.count({ where: filters });
  },

  findById(id: number) {
    return prisma.order.findUnique({
      where: { id },
      include: orderInclude
    });
  },

  findByIdAndUser(id: number, userId: number) {
    return prisma.order.findFirst({
      where: { id, userId },
      include: orderInclude
    });
  },

  findPaymentByOrderId(orderId: number) {
    return prisma.payment.findUnique({
      where: { orderId },
      include: { order: true }
    });
  },

  findPendingForExpiration(cutoff: Date) {
    return prisma.order.findMany({
      where: {
        status: OrderStatus.PENDING,
        createdAt: { lt: cutoff },
        payment: {
          is: {
            status: PaymentStatus.PENDING
          }
        }
      },
      include: {
        payment: true,
        items: true
      }
    });
  },

  updateStatus(id: number, status: OrderStatus) {
    return prisma.order.update({
      where: { id },
      data: { status },
      include: orderInclude
    });
  },

  expirePendingOrder(orderId: number) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
          payment: true
        }
      });

      if (!order || !order.payment) {
        throw new Error('Order or payment not found for expiration');
      }

      for (const item of order.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: {
            status: true
          }
        });

        if (!product) {
          continue;
        }

        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { increment: item.quantity },
            status: product.status === ProductStatus.DISCONTINUED ? ProductStatus.DISCONTINUED : ProductStatus.ACTIVE
          }
        });
      }

      await tx.payment.update({
        where: { orderId },
        data: { status: PaymentStatus.EXPIRED }
      });

      return tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
        include: orderInclude
      });
    });
  },

  getWhereClause(filters: { status?: OrderStatus; startDate?: Date; endDate?: Date }) {
    const where: Prisma.OrderWhereInput = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {
        ...(filters.startDate ? { gte: filters.startDate } : {}),
        ...(filters.endDate ? { lte: filters.endDate } : {})
      };
    }

    return where;
  }
};