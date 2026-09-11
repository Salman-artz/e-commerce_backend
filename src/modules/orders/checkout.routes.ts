import { Router } from 'express';
import { orderController } from './order.controller';
import { checkoutSchema } from './order.schemas';
import { requireAuth } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';

export const checkoutRouter = Router();

checkoutRouter.use(requireAuth);
checkoutRouter.post('/', validate(checkoutSchema), orderController.checkout);