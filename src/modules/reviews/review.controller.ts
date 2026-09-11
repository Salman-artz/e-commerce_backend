import type { Request, Response } from 'express';
import { reviewService } from './review.service';

export const reviewController = {
  async list(req: Request, res: Response) {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const reviews = await reviewService.getReviews(req.user!.role, { page, limit });
    res.json({ success: true, message: 'Reviews loaded', data: reviews.items, pagination: reviews.pagination });
  },

  async delete(req: Request, res: Response) {
    const review = await reviewService.deleteReview(req.user!.role, parseInt(req.params.id as string));
    res.json({ success: true, message: 'Review deleted', data: review });
  }
};
