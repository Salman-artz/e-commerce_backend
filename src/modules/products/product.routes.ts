import { Router } from 'express';
import { Role } from '@prisma/client';
import { productController } from './product.controller';
import { productCreateSchema, productIdParamSchema, productQuerySchema, productUpdateSchema, productImageParamSchema } from './product.schemas';
import { validate } from '../../middlewares/validate';
import { requireAuth, requireRole } from '../../middlewares/auth';
import { memoryUpload } from '../../middlewares/upload';

export const productRouter = Router();

productRouter.get('/', validate(productQuerySchema, 'query'), productController.list);
productRouter.get('/:id', validate(productIdParamSchema, 'params'), productController.detail);
productRouter.post('/', requireAuth, requireRole(Role.ADMIN), validate(productCreateSchema), productController.create);
productRouter.patch('/:id', requireAuth, requireRole(Role.ADMIN), validate(productIdParamSchema, 'params'), validate(productUpdateSchema), productController.update);
productRouter.delete('/:id', requireAuth, requireRole(Role.ADMIN), validate(productIdParamSchema, 'params'), productController.remove);
productRouter.post('/:id/images', requireAuth, requireRole(Role.ADMIN), validate(productIdParamSchema, 'params'), memoryUpload.array('images', 10), productController.uploadImages);
productRouter.delete('/:id/images/:imageId', requireAuth, requireRole(Role.ADMIN), validate(productImageParamSchema, 'params'), productController.removeImage);