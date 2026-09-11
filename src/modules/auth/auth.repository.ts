import { prisma } from '../../config/prisma';

export const authRepository = {
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  findById(id: number) {
    return prisma.user.findUnique({ where: { id } });
  },

  createUser(data: { name: string; email: string; passwordHash: string }) {
    return prisma.user.create({ data });
  },

  createCart(userId: number) {
    return prisma.cart.create({ data: { userId } });
  },

  updateRefreshTokenHash(userId: number, refreshTokenHash: string | null) {
    return prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash }
    });
  },

  updateProfile(userId: number, data: { name: string }) {
    return prisma.user.update({
      where: { id: userId },
      data
    });
  }
};