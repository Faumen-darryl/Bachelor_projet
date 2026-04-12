import { Request, Response } from 'express';
import * as serviceService from './service.service';
import { AuthRequest } from '../auth/auth.middleware';

const errors: Record<string, [number, string]> = {
  SERVICE_NOT_FOUND: [404, 'Service introuvable.'],
};

export const createService = async (req: AuthRequest, res: Response) => {
  try {
    const service = await serviceService.createService(req.user!.userId, req.body);
    res.status(201).json(service);
  } catch (err: any) {
    const [status, message] = errors[err.message] || [400, err.message];
    res.status(status).json({ message });
  }
};

export const getServices = async (req: Request, res: Response) => {
  try {
    const result = await serviceService.getServices(req.query as any);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const getServiceById = async (req: Request, res: Response) => {
  try {
    const service = await serviceService.getServiceById(Number(req.params.id));
    res.status(200).json(service);
  } catch (err: any) {
    const [status, message] = errors[err.message] || [400, err.message];
    res.status(status).json({ message });
  }
};