import type { Request, Response } from 'express';
import { orderService } from './order.service';

export const orderController = {
  async checkout(req: Request, res: Response) {
    const order = await orderService.checkout(req.user!.id, req.body);

    res.status(201).json({
      success: true,
      message: 'Checkout successful',
      data: order
    });
  },

  async list(req: Request, res: Response) {
    const orders = await orderService.listOrders(req.user!.id, req.user!.role, req.query as never);

    res.json({ success: true, message: 'Orders loaded', data: orders.items, pagination: orders.pagination });
  },

  async detail(req: Request, res: Response) {
    const order = await orderService.getOrder(req.user!.id, req.user!.role, req.params.id as unknown as number);

    res.json({ success: true, message: 'Order loaded', data: order });
  },

  async updateStatus(req: Request, res: Response) {
    const order = await orderService.updateStatus(req.user!.role, req.params.id as unknown as number, req.body);

    res.json({ success: true, message: 'Order status updated', data: order });
  },

  async simulatePayment(req: Request, res: Response) {
    const order = await orderService.simulatePayment(req.params.id as unknown as number);
    res.json({ success: true, message: 'Payment simulated successfully', data: order });
  },

  async complete(req: Request, res: Response) {
    const order = await orderService.completeOrder(req.user!.id, req.params.id as unknown as number);
    res.json({ success: true, message: 'Order marked as completed', data: order });
  },

  async submitReviews(req: Request, res: Response) {
    const reviews = await orderService.submitReviews(req.user!.id, req.params.id as unknown as number, req.body);
    res.json({ success: true, message: 'Reviews submitted successfully', data: reviews });
  }
};