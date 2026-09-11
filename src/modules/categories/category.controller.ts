import type { Request, Response } from 'express';
import { categoryService } from './category.service';

export const categoryController = {
  async list(_req: Request, res: Response) {
    const categories = await categoryService.list();

    res.json({ success: true, message: 'Categories loaded', data: categories });
  },

  async detail(req: Request, res: Response) {
    const category = await categoryService.getById(req.params.id as unknown as number);

    res.json({ success: true, message: 'Category loaded', data: category });
  },

  async create(req: Request, res: Response) {
    const category = await categoryService.create(req.body);

    res.status(201).json({ success: true, message: 'Category created', data: category });
  },

  async update(req: Request, res: Response) {
    const category = await categoryService.update(req.params.id as unknown as number, req.body);

    res.json({ success: true, message: 'Category updated', data: category });
  },

  async remove(req: Request, res: Response) {
    await categoryService.remove(req.params.id as unknown as number);

    res.json({ success: true, message: 'Category deleted' });
  }
};