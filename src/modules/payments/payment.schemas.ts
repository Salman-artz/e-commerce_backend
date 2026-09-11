import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { z } from 'zod';
import { PaymentGatewayProvider } from './payment-gateway';

const gatewayStatusSchema = z.union([
  z.nativeEnum(PaymentStatus),
  z.enum(['pending', 'settlement', 'capture', 'deny', 'cancel', 'canceled', 'expire', 'expired', 'paid', 'failed'])
]);

export const paymentOrderIdParamSchema = z.object({
  orderId: z.coerce.number().int().positive()
});

export const paymentWebhookSchema = z.object({
  orderId: z.coerce.number().int().positive(),
  provider: z.nativeEnum(PaymentGatewayProvider),
  status: gatewayStatusSchema,
  gatewayReference: z.string().trim().min(1),
  eventId: z.string().trim().min(1).optional(),
  method: z.nativeEnum(PaymentMethod).optional()
});
