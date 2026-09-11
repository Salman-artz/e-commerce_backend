import { z } from 'zod';

export const categoryIdParamSchema = z.object({
  id: z.coerce.number().int().positive()
});

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(2).max(120)
});

export const categoryUpdateSchema = z.object({
  name: z.string().trim().min(2).max(120)
});

export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;