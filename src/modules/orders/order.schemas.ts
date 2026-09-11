import { OrderStatus, PaymentMethod } from '@prisma/client';
import { z } from 'zod';

export const checkoutSchema = z.object({
  addressId: z.coerce.number().int().positive().optional(),
  paymentMethod: z.nativeEnum(PaymentMethod).default(PaymentMethod.MIDTRANS),
  shippingCost: z.coerce.number().min(0).default(0),
  cartItemIds: z.array(z.number()).optional(),
  directPurchase: z.object({
    productId: z.coerce.number().int().positive(),
    quantity: z.coerce.number().int().positive()
  }).optional()
});

export const orderIdParamSchema = z.object({
  id: z.coerce.number().int().positive()
});

export const orderStatusUpdateSchema = z.object({
  status: z.nativeEnum(OrderStatus)
});

export const orderReviewSchema = z.object({
  reviews: z.array(z.object({
    productId: z.coerce.number().int().positive(),
    rating: z.coerce.number().int().min(1).max(5),
    comment: z.string().optional(),
    isAnonymous: z.boolean().optional().default(false)
  }))
});

export const orderQuerySchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10)
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type OrderStatusUpdateInput = z.infer<typeof orderStatusUpdateSchema>;
export type OrderQueryInput = z.infer<typeof orderQuerySchema>;
export type OrderReviewInput = z.infer<typeof orderReviewSchema>;