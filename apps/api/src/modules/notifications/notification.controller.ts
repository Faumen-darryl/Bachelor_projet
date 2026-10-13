import { Response } from 'express';

import * as notificationService from './notification.service';

import { AuthRequest } from '../auth/auth.middleware';

// Associe les erreurs métier aux statuts HTTP et messages retournés au client.
const errors: Record<string, [number, string]> = {
  NOTIFICATION_NOT_FOUND: [404, 'Notification introuvable.'],
  FORBIDDEN: [403, 'Action non autorisée.'],
};

// Récupère toutes les notifications de l'utilisateur connecté.
export const getUserNotifications = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const notifications =
      await notificationService.getUserNotifications(
        req.user!.userId
      );

    res.status(200).json(notifications);
  } catch (err: any) {
    res.status(400).json({
      message: err.message,
    });
  }
};

// Récupère uniquement les notifications non lues de l'utilisateur.
export const getUnreadNotifications = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const notifications =
      await notificationService.getUnreadNotifications(
        req.user!.userId
      );

    res.status(200).json(notifications);
  } catch (err: any) {
    res.status(400).json({
      message: err.message,
    });
  }
};

// Marque toutes les notifications de l'utilisateur comme lues.
export const markAllAsRead = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const result = await notificationService.markAllAsRead(
      req.user!.userId
    );

    res.status(200).json(result);
  } catch (err: any) {
    res.status(400).json({
      message: err.message,
    });
  }
};

// Marque une notification précise comme lue.
export const markOneAsRead = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const notif = await notificationService.markOneAsRead(
      Number(req.params.id),
      req.user!.userId
    );

    res.status(200).json(notif);
  } catch (err: any) {
    const [status, message] = errors[err.message] || [
      400,
      err.message,
    ];

    res.status(status).json({
      message,
    });
  }
};