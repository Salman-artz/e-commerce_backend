import { Router } from 'express';
import { paymentController } from './payment.controller';
import { paymentOrderIdParamSchema, paymentWebhookSchema } from './payment.schemas';
import { requireAuth } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';

export const paymentRouter = Router();

paymentRouter.post('/webhook', validate(paymentWebhookSchema), paymentController.webhook);
paymentRouter.get('/:orderId/status', requireAuth, validate(paymentOrderIdParamSchema, 'params'), paymentController.status);