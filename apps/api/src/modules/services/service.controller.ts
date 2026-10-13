import { Request, Response } from 'express';

import * as serviceService from './service.service';

import { AuthRequest } from '../auth/auth.middleware';

// Associe les erreurs métier aux statuts HTTP et messages retournés au client.
const errors: Record<string, [number, string]> = {
  SERVICE_NOT_FOUND: [404, 'Service introuvable.'],
  FORBIDDEN: [403, 'Action non autorisée.'],
};

// Crée un nouveau service pour l'utilisateur connecté.
export const createService = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const service = await serviceService.createService(
      req.user!.userId,
      req.body
    );

    res.status(201).json(service);
  } catch (err: any) {
    const [status, message] = errors[err.message] || [400, err.message];

    res.status(status).json({
      message,
    });
  }
};

// Récupère les services en fonction des filtres transmis dans la requête.
export const getServices = async (
  req: Request,
  res: Response
) => {
  try {
    const result = await serviceService.getServices(
      req.query as any
    );

    res.status(200).json(result);
  } catch (err: any) {
    res.status(400).json({
      message: err.message,
    });
  }
};

// Récupère le détail d'un service à partir de son identifiant.
export const getServiceById = async (
  req: Request,
  res: Response
) => {
  try {
    const service = await serviceService.getServiceById(
      Number(req.params.id)
    );

    res.status(200).json(service);
  } catch (err: any) {
    const [status, message] = errors[err.message] || [400, err.message];

    res.status(status).json({
      message,
    });
  }
};

// Récupère les services appartenant à l'utilisateur connecté.
export const getMyServices = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const services = await serviceService.getMyServices(
      req.user!.userId
    );

    res.status(200).json(services);
  } catch (err: any) {
    res.status(400).json({
      message: err.message,
    });
  }
};

// Supprime un service appartenant à l'utilisateur connecté.
export const deleteService = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const result = await serviceService.deleteService(
      Number(req.params.id),
      req.user!.userId
    );

    res.status(200).json(result);
  } catch (err: any) {
    const [status, message] = errors[err.message] || [400, err.message];

    res.status(status).json({
      message,
    });
  }
};

// Met à jour un service appartenant à l'utilisateur connecté.
export const updateService = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const result = await serviceService.updateService(
      Number(req.params.id),
      req.user!.userId,
      req.body
    );

    res.status(200).json(result);
  } catch (err: any) {
    const [status, message] = errors[err.message] || [400, err.message];

    res.status(status).json({
      message,
    });
  }
};

// Ajoute une photo à un service.
export const uploadServicePhoto = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.file) {
      throw new Error('Aucun fichier envoyé');
    }

    const photo = await serviceService.uploadServicePhoto(
      Number(req.params.id),
      req.user!.userId,
      req.file.buffer,
      req.body.isMain === 'true'
    );

    res.status(201).json(photo);
  } catch (err: any) {
    const [status, message] = errors[err.message] || [400, err.message];

    res.status(status).json({
      message,
    });
  }
};