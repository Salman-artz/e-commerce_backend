import { prisma } from '../../config/prisma';

export const categoryRepository = {
  findAll() {
    return prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
  },

  findById(id: number) {
    return prisma.category.findUnique({ where: { id } });
  },

  findByName(name: string) {
    return prisma.category.findUnique({ where: { name } });
  },

  create(data: { name: string }) {
    return prisma.category.create({ data });
  },

  update(id: number, data: { name: string }) {
    return prisma.category.update({ where: { id }, data });
  },

  delete(id: number) {
    return prisma.category.delete({ where: { id } });
  }
};