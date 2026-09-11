import { prisma } from '../../config/prisma';
import { AppError } from '../../common/app-error';
import { Role } from '@prisma/client';

export const reviewService = {
  async getReviews(role: Role, query: { page?: number, limit?: number }) {
    if (role !== Role.ADMIN) {
      throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions');
    }

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      prisma.review.count(),
      prisma.review.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
          product: { select: { name: true } }
        }
      })
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  async deleteReview(role: Role, id: number) {
    if (role !== Role.ADMIN) {
      throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions');
    }

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      throw new AppError(404, 'REVIEW_NOT_FOUND', 'Review not found');
    }

    return prisma.review.delete({ where: { id } });
  }
};
