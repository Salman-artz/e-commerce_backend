import type { Request, Response } from 'express';
import { cartService } from './cart.service';

export const cartController = {
  async getCart(req: Request, res: Response) {
    const cart = await cartService.getCart(req.user!.id);
    res.json({ success: true, message: 'Cart loaded', data: cart });
  },

  async addItem(req: Request, res: Response) {
    const cart = await cartService.addItem(req.user!.id, req.body);
    res.status(201).json({ success: true, message: 'Item added to cart', data: cart });
  },

  async updateItem(req: Request, res: Response) {
    const cart = await cartService.updateItem(req.user!.id, req.params.id as unknown as number, req.body);
    res.json({ success: true, message: 'Cart item updated', data: cart });
  },

  async removeItem(req: Request, res: Response) {
    const cart = await cartService.removeItem(req.user!.id, req.params.id as unknown as number);
    res.json({ success: true, message: 'Cart item removed', data: cart });
  }
};