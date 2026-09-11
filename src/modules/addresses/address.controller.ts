import type { Request, Response } from 'express';
import { addressService } from './address.service';

export const addressController = {
  async list(req: Request, res: Response) {
    const addresses = await addressService.list(req.user!.id);
    res.json({ success: true, message: 'Addresses loaded', data: addresses });
  },

  async create(req: Request, res: Response) {
    const address = await addressService.create(req.user!.id, req.body);
    res.status(201).json({ success: true, message: 'Address created', data: address });
  },

  async update(req: Request, res: Response) {
    const address = await addressService.update(req.user!.id, req.params.id as unknown as number, req.body);
    res.json({ success: true, message: 'Address updated', data: address });
  },

  async remove(req: Request, res: Response) {
    await addressService.remove(req.user!.id, req.params.id as unknown as number);
    res.json({ success: true, message: 'Address deleted' });
  }
};