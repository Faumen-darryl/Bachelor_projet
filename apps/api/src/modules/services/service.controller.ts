import { Request, Response } from 'express';
import * as serviceService from './service.service';
import { AuthRequest } from '../auth/auth.middleware';

const errors: Record<string, [number, string]> = {
  SERVICE_NOT_FOUND: [404, 'Service introuvable.'],
  FORBIDDEN: [403, 'Action non autorisée.'],
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

export const getMyServices = async (req: AuthRequest, res: Response) => {
  try {
    const services = await serviceService.getMyServices(req.user!.userId);
    res.status(200).json(services);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteService = async (req: AuthRequest, res: Response) => {
  try {
    const result = await serviceService.deleteService(
      Number(req.params.id), req.user!.userId
    );
    res.status(200).json(result);
  } catch (err: any) {
    const [status, message] = errors[err.message] || [400, err.message];
    res.status(status).json({ message });
  }
};

export const updateService = async (req: AuthRequest, res: Response) => {
  try {
    const result = await serviceService.updateService(
      Number(req.params.id),
      req.user!.userId,
      req.body
    );
    res.status(200).json(result);
  } catch (err: any) {
    const [status, message] = errors[err.message] || [400, err.message];
    res.status(status).json({ message });
  }
};