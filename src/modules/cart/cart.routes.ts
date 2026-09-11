import { Router } from 'express';
import { cartController } from './cart.controller';
import { cartItemCreateSchema, cartItemIdParamSchema, cartItemUpdateSchema } from './cart.schemas';
import { requireAuth } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';

export const cartRouter = Router();

cartRouter.use(requireAuth);
cartRouter.get('/', cartController.getCart);
cartRouter.post('/items', validate(cartItemCreateSchema), cartController.addItem);
cartRouter.patch('/items/:id', validate(cartItemIdParamSchema, 'params'), validate(cartItemUpdateSchema), cartController.updateItem);
cartRouter.delete('/items/:id', validate(cartItemIdParamSchema, 'params'), cartController.removeItem);