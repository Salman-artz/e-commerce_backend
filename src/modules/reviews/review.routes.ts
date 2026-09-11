import { Router } from 'express';
import { reviewController } from './review.controller';
import { requireAuth } from '../../middlewares/auth';

export const reviewRouter = Router();

reviewRouter.use(requireAuth);

reviewRouter.get('/', reviewController.list);
reviewRouter.delete('/:id', reviewController.delete);
