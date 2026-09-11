import { prisma } from '../../config/prisma';

export const addressRepository = {
  findMany(userId: number) {
    return prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }]
    });
  },

  findById(id: number) {
    return prisma.address.findUnique({ where: { id } });
  },

  findByIdAndUser(id: number, userId: number) {
    return prisma.address.findFirst({ where: { id, userId } });
  },

  findDefault(userId: number) {
    return prisma.address.findFirst({
      where: { userId, isDefault: true },
      orderBy: { createdAt: 'desc' }
    });
  },

  create(userId: number, data: { recipientName: string; phone: string; fullAddress: string; cityId?: string; isDefault: boolean }) {
    return prisma.address.create({
      data: { userId, ...data }
    });
  },

  update(id: number, data: Partial<{ recipientName: string; phone: string; fullAddress: string; cityId: string; isDefault: boolean }>) {
    return prisma.address.update({
      where: { id },
      data
    });
  },

  delete(id: number) {
    return prisma.address.delete({ where: { id } });
  },

  clearDefaultForUser(userId: number, excludeId?: number) {
    return prisma.address.updateMany({
      where: {
        userId,
        isDefault: true,
        ...(excludeId ? { id: { not: excludeId } } : {})
      },
      data: { isDefault: false }
    });
  }
};