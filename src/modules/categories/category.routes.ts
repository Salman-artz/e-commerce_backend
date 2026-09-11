import { Router } from 'express';
import { categoryController } from './category.controller';
import { categoryCreateSchema, categoryIdParamSchema, categoryUpdateSchema } from './category.schemas';
import { validate } from '../../middlewares/validate';
import { requireAuth, requireRole } from '../../middlewares/auth';
import { Role } from '@prisma/client';

export const categoryRouter = Router();

categoryRouter.get('/', categoryController.list);
categoryRouter.get('/:id', validate(categoryIdParamSchema, 'params'), categoryController.detail);
categoryRouter.post('/', requireAuth, requireRole(Role.ADMIN), validate(categoryCreateSchema), categoryController.create);
categoryRouter.patch('/:id', requireAuth, requireRole(Role.ADMIN), validate(categoryIdParamSchema, 'params'), validate(categoryUpdateSchema), categoryController.update);
categoryRouter.delete('/:id', requireAuth, requireRole(Role.ADMIN), validate(categoryIdParamSchema, 'params'), categoryController.remove);