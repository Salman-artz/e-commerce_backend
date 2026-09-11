import { z } from 'zod';

export const addressIdParamSchema = z.object({
  id: z.coerce.number().int().positive()
});

export const addressCreateSchema = z.object({
  recipientName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(30),
  fullAddress: z.string().trim().min(10),
  cityId: z.string().optional(),
  isDefault: z.boolean().optional().default(false)
});

export const addressUpdateSchema = z.object({
  recipientName: z.string().trim().min(2).max(120).optional(),
  phone: z.string().trim().min(6).max(30).optional(),
  fullAddress: z.string().trim().min(10).optional(),
  cityId: z.string().optional(),
  isDefault: z.boolean().optional()
});

export type AddressCreateInput = z.infer<typeof addressCreateSchema>;
export type AddressUpdateInput = z.infer<typeof addressUpdateSchema>;