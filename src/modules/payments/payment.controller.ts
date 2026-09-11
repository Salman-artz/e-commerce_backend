import type { Request, Response } from 'express';
import { orderService } from '../orders/order.service';

export const paymentController = {
  async webhook(req: Request, res: Response) {
    const result = await orderService.handleWebhook(req.body, {
      signature:
        req.header('x-webhook-signature') ??
        req.header('x-midtrans-signature') ??
        req.header('x-xendit-signature') ??
        undefined,
      providerHeader: req.header('x-webhook-provider') ?? undefined
    });

    res.json({
      success: true,
      message: 'Webhook processed',
      data: result
    });
  },

  async status(req: Request, res: Response) {
    const result = await orderService.getPaymentStatus(req.user!.id, req.user!.role, req.params.orderId as unknown as number);

    res.json({
      success: true,
      message: 'Payment status loaded',
      data: result
    });
  }
};