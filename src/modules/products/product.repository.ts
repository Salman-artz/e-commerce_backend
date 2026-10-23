import { Prisma, ProductStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';

const productInclude = {
  category: true,
  images: true,
  reviews: {
    include: {
      user: {
        select: {
          name: true
        }
      }
    },
    orderBy: { createdAt: 'desc' as const }
  }
} satisfies Prisma.ProductInclude;

type ProductImageInput = {
  imageUrl: string;
  publicId?: string | null;
};

export const productRepository = {
  count(where: Prisma.ProductWhereInput) {
    return prisma.product.count({ where });
  },

  findMany(where: Prisma.ProductWhereInput, skip: number, take: number, orderBy?: Prisma.ProductOrderByWithRelationInput[]) {
    return prisma.product.findMany({
      where,
      include: productInclude,
      orderBy: orderBy && orderBy.length ? orderBy : [{ createdAt: 'desc' }, { id: 'desc' }],
      skip,
      take
    });
  },

  findById(id: number) {
    return prisma.product.findUnique({
      where: { id },
      include: productInclude
    });
  },

  findByName(name: string) {
    return prisma.product.findFirst({ where: { name } });
  },

  create(data: Prisma.ProductCreateInput, images: ProductImageInput[]) {
    return prisma.product.create({
      data: {
        ...data,
        images: images.length
          ? {
              create: images.map((image) => ({
                imageUrl: image.imageUrl,
                publicId: image.publicId ?? null
              }))
            }
          : undefined
      },
      include: productInclude
    });
  },

  appendImages(productId: number, images: ProductImageInput[]) {
    return prisma.product.update({
      where: { id: productId },
      data: {
        images: {
          create: images.map((image) => ({
            imageUrl: image.imageUrl,
            publicId: image.publicId ?? null
          }))
        }
      },
      include: productInclude
    });
  },

  update(id: number, data: Prisma.ProductUpdateInput, images?: ProductImageInput[]) {
    return prisma.product.update({
      where: { id },
      data: {
        ...data,
        ...(images
          ? {
              images: {
                deleteMany: {},
                create: images.map((image) => ({
                  imageUrl: image.imageUrl,
                  publicId: image.publicId ?? null
                }))
              }
            }
          : {})
      },
      include: productInclude
    });
  },

  remove(id: number) {
    return prisma.product.delete({ where: { id } });
  },

  findImageById(imageId: number) {
    return prisma.productImage.findUnique({
      where: { id: imageId }
    });
  },

  removeImage(imageId: number) {
    return prisma.productImage.delete({
      where: { id: imageId }
    });
  },

  getWhereClause(filters: {
    search?: string;
    categoryId?: number;
    minPrice?: number;
    maxPrice?: number;
    status?: ProductStatus;
  }) {
    const where: Prisma.ProductWhereInput = {};

    if (filters.search) {
      where.name = { contains: filters.search };
    }

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    // Pastikan produk yang ditampilkan wajib memiliki minimal 1 gambar
    where.images = { some: {} };

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {
        ...(filters.minPrice !== undefined ? { gte: filters.minPrice } : {}),
        ...(filters.maxPrice !== undefined ? { lte: filters.maxPrice } : {})
      };
    }

    return where;
  }
};
