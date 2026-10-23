import { ProductStatus } from '@prisma/client';
import { z } from 'zod';

export const productIdParamSchema = z.object({
  id: z.coerce.number().int().positive()
});

export const productImageParamSchema = z.object({
  id: z.coerce.number().int().positive(),
  imageId: z.coerce.number().int().positive()
});

export const productQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  status: z.nativeEnum(ProductStatus).optional(),
  sort: z.string().trim().optional(),
  sortBy: z.string().trim().optional()
});

const productImageSchema = z.object({
  imageUrl: z.string().trim().url().max(500)
});

export const productCreateSchema = z.object({
  name: z.string().trim().min(2).max(191),
  description: z.string().trim().min(10),
  price: z.coerce.number().positive(),
  stock: z.coerce.number().int().min(0),
  categoryId: z.coerce.number().int().positive(),
  status: z.nativeEnum(ProductStatus).default(ProductStatus.ACTIVE),
  images: z.array(productImageSchema).default([])
});

export const productUpdateSchema = z.object({
  name: z.string().trim().min(2).max(191).optional(),
  description: z.string().trim().min(10).optional(),
  price: z.coerce.number().positive().optional(),
  stock: z.coerce.number().int().min(0).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  status: z.nativeEnum(ProductStatus).optional(),
  images: z.array(productImageSchema).optional()
});

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;
