import { Request, Response } from 'express';
import * as venueService from './venue.service';
import { AuthRequest } from '../auth/auth.middleware';

const errors: Record<string, [number, string]> = {
  VENUE_NOT_FOUND: [404, 'Lieu introuvable.'],
  FORBIDDEN: [403, 'Action non autorisée.'],
};

export const createVenue = async (req: AuthRequest, res: Response) => {
  try {
    const venue = await venueService.createVenue(req.user!.userId, req.body);
    res.status(201).json(venue);
  } catch (err: any) {
    const [status, message] = errors[err.message] || [400, err.message];
    res.status(status).json({ message });
  }
};

export const getVenues = async (req: Request, res: Response) => {
  try {
    const result = await venueService.getVenues(req.query as any);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const getVenueById = async (req: Request, res: Response) => {
  try {
    const venue = await venueService.getVenueById(Number(req.params.id));
    res.status(200).json(venue);
  } catch (err: any) {
    const [status, message] = errors[err.message] || [400, err.message];
    res.status(status).json({ message });
  }
};

export const updateVenue = async (req: AuthRequest, res: Response) => {
  try {
    const venue = await venueService.updateVenue(
      Number(req.params.id),
      req.user!.userId,
      req.body
    );
    res.status(200).json(venue);
  } catch (err: any) {
    const [status, message] = errors[err.message] || [400, err.message];
    res.status(status).json({ message });
  }
};

export const deleteVenue = async (req: AuthRequest, res: Response) => {
  try {
    const result = await venueService.deleteVenue(
      Number(req.params.id),
      req.user!.userId
    );
    res.status(200).json(result);
  } catch (err: any) {
    const [status, message] = errors[err.message] || [400, err.message];
    res.status(status).json({ message });
  }
};

export const uploadVenuePhoto = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) throw new Error('Aucun fichier envoyé');
    const photo = await venueService.uploadVenuePhoto(
      Number(req.params.id),
      req.user!.userId,
      req.file.buffer,
      req.body.isMain === 'true'
    );
    res.status(201).json(photo);
  } catch (err: any) {
    const [status, message] = errors[err.message] || [400, err.message];
    res.status(status).json({ message });
  }
};