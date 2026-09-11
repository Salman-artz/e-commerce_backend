import { z } from 'zod';

export const cartItemIdParamSchema = z.object({
  id: z.coerce.number().int().positive()
});

export const cartItemCreateSchema = z.object({
  productId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().min(1).max(999)
});

export const cartItemUpdateSchema = z.object({
  quantity: z.coerce.number().int().min(1).max(999)
});

export type CartItemCreateInput = z.infer<typeof cartItemCreateSchema>;
export type CartItemUpdateInput = z.infer<typeof cartItemUpdateSchema>;