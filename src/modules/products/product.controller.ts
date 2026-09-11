import type { Request, Response, NextFunction } from 'express';
import { productService } from './product.service';

export const productController = {
  async list(req: Request, res: Response) {
    const result = await productService.list(req.query as never);

    res.json({ success: true, message: 'Products loaded', data: result.items, pagination: result.pagination });
  },

  async detail(req: Request, res: Response) {
    const product = await productService.getById(req.params.id as unknown as number);

    res.json({ success: true, message: 'Product loaded', data: product });
  },

  async create(req: Request, res: Response) {
    const product = await productService.create(req.body);

    res.status(201).json({ success: true, message: 'Product created', data: product });
  },

  async update(req: Request, res: Response) {
    const product = await productService.update(req.params.id as unknown as number, req.body);

    res.json({ success: true, message: 'Product updated', data: product });
  },

  async remove(req: Request, res: Response) {
    await productService.remove(req.params.id as unknown as number);

    res.json({ success: true, message: 'Product deleted' });
  },

  async uploadImages(req: Request, res: Response, next: NextFunction) {
    try {
      const files = (req.files as Express.Multer.File[] | undefined) ?? [];
      const product = await productService.uploadImages(req.params.id as unknown as number, files);
      res.status(201).json({ success: true, message: 'Product images uploaded', data: product });
    } catch (error) {
      console.error('UPLOAD_ERROR:', error);
      next(error);
    }
  },

  async removeImage(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, imageId } = req.params as unknown as { id: number; imageId: number };
      await productService.removeImage(id, imageId);
      res.json({ success: true, message: 'Product image deleted' });
    } catch (error) {
      console.error('REMOVE_ERROR:', error);
      next(error);
    }
  }
};