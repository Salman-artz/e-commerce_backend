import { Router } from 'express';
import { orderController } from './order.controller';
import { checkoutSchema, orderIdParamSchema, orderQuerySchema, orderStatusUpdateSchema, orderReviewSchema } from './order.schemas';
import { requireAuth } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';

export const orderRouter = Router();

orderRouter.use(requireAuth);

orderRouter.post('/', validate(checkoutSchema), orderController.checkout);
orderRouter.get('/', validate(orderQuerySchema, 'query'), orderController.list);
orderRouter.get('/:id', validate(orderIdParamSchema, 'params'), orderController.detail);
orderRouter.post('/:id/simulate-payment', validate(orderIdParamSchema, 'params'), orderController.simulatePayment);
orderRouter.post('/:id/complete', validate(orderIdParamSchema, 'params'), orderController.complete);
orderRouter.post('/:id/reviews', validate(orderIdParamSchema, 'params'), validate(orderReviewSchema), orderController.submitReviews);
orderRouter.patch('/:id/status', validate(orderIdParamSchema, 'params'), validate(orderStatusUpdateSchema), orderController.updateStatus);