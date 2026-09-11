import { Router } from 'express';
import { addressController } from './address.controller';
import { addressCreateSchema, addressIdParamSchema, addressUpdateSchema } from './address.schemas';
import { validate } from '../../middlewares/validate';
import { requireAuth } from '../../middlewares/auth';

export const addressRouter = Router();

addressRouter.use(requireAuth);
addressRouter.get('/', addressController.list);
addressRouter.post('/', validate(addressCreateSchema), addressController.create);
addressRouter.patch('/:id', validate(addressIdParamSchema, 'params'), validate(addressUpdateSchema), addressController.update);
addressRouter.delete('/:id', validate(addressIdParamSchema, 'params'), addressController.remove);