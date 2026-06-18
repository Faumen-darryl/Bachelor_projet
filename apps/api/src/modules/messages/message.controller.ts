import { Response } from 'express';
import * as messageService from './message.service';
import { AuthRequest } from '../auth/auth.middleware';

const errors: Record<string, [number, string]> = {
  RESERVATION_NOT_FOUND: [404, 'Réservation introuvable.'],
  FORBIDDEN: [403, 'Action non autorisée.'],
};

export const getReservationMessages = async (req: AuthRequest, res: Response) => {
  try {
    const messages = await messageService.getReservationMessages(
      Number(req.params.reservationId),
      req.user!.userId
    );
    res.status(200).json(messages);
  } catch (err: any) {
    const [status, message] = errors[err.message] || [400, err.message];
    res.status(status).json({ message });
  }
};

export const getConversations = async (req: AuthRequest, res: Response) => {
  try {
    const conversations = await messageService.getConversations(req.user!.userId);
    res.status(200).json(conversations);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const count = await messageService.getUnreadCount(req.user!.userId);
    res.status(200).json({ unread: count });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const sendFirstMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { reservationId, content } = req.body;
    const message = await messageService.sendFirstMessage(
      req.user!.userId,
      Number(reservationId),
      content
    );
    res.status(201).json(message);
  } catch (err: any) {
    const [status, message] = errors[err.message] || [400, err.message];
    res.status(status).json({ message });
  }
};