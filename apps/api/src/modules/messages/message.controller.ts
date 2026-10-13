import { Response } from 'express';

import * as messageService from './message.service';

import { AuthRequest } from '../auth/auth.middleware';

// Associe les erreurs métier aux statuts HTTP et messages retournés au client.
const errors: Record<string, [number, string]> = {
  RESERVATION_NOT_FOUND: [404, 'Réservation introuvable.'],
  FORBIDDEN: [403, 'Action non autorisée.'],
};

// Récupère les messages liés à une réservation donnée.
export const getReservationMessages = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const messages = await messageService.getReservationMessages(
      Number(req.params.reservationId),
      req.user!.userId
    );

    res.status(200).json(messages);
  } catch (err: any) {
    const [status, message] = errors[err.message] || [400, err.message];

    res.status(status).json({
      message,
    });
  }
};

// Récupère toutes les conversations de l'utilisateur connecté.
export const getConversations = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const conversations = await messageService.getConversations(
      req.user!.userId
    );

    res.status(200).json(conversations);
  } catch (err: any) {
    res.status(400).json({
      message: err.message,
    });
  }
};

// Récupère le nombre de messages non lus de l'utilisateur connecté.
export const getUnreadCount = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const count = await messageService.getUnreadCount(
      req.user!.userId
    );

    res.status(200).json({
      unread: count,
    });
  } catch (err: any) {
    res.status(400).json({
      message: err.message,
    });
  }
};

// Envoie le premier message d'une conversation liée à une réservation.
export const sendFirstMessage = async (
  req: AuthRequest,
  res: Response
) => {
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

    res.status(status).json({
      message,
    });
  }
};