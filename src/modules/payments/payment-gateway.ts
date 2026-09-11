import crypto from 'crypto';
import { env } from '../../config/env';
import { AppError } from '../../common/app-error';

export enum PaymentGatewayProvider {
  MIDTRANS = 'MIDTRANS',
  XENDIT = 'XENDIT'
}

export type PaymentGatewayWebhookContext = {
  provider: PaymentGatewayProvider;
  signature?: string;
  eventId?: string;
};

function getWebhookSecret(provider: PaymentGatewayProvider) {
  if (provider === PaymentGatewayProvider.MIDTRANS) {
    return env.MIDTRANS_WEBHOOK_SECRET || env.PAYMENT_WEBHOOK_SECRET;
  }

  return env.XENDIT_WEBHOOK_TOKEN || env.PAYMENT_WEBHOOK_SECRET;
}

export function verifyGatewayWebhookSignature(
  provider: PaymentGatewayProvider,
  payload: { orderId: number; status: string; gatewayReference?: string; method?: string; eventId?: string },
  signature?: string
) {
  const secret = getWebhookSecret(provider);

  if (!secret) {
    if (env.NODE_ENV === 'production') {
      throw new AppError(503, 'PAYMENT_GATEWAY_NOT_CONFIGURED', 'Payment gateway webhook secret is not configured');
    }

    return true;
  }

  if (!signature) {
    return false;
  }

  const message = [provider, payload.orderId, payload.status, payload.gatewayReference ?? '', payload.method ?? '', payload.eventId ?? ''].join('|');
  const expected = crypto.createHmac('sha256', secret).update(message).digest('hex');

  if (expected.length !== signature.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}