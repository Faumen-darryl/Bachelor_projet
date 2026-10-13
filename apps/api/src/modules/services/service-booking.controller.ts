import { Response } from 'express';

import * as bookingService from './service-booking.service';

import { AuthRequest } from '../auth/auth.middleware';

// Associe les erreurs métier aux statuts HTTP et messages retournés au client.
const errors: Record<string, [number, string]> = {
  SERVICE_NOT_FOUND: [404, 'Service introuvable.'],
  SERVICE_NOT_AVAILABLE: [400, 'Ce service n\'est pas disponible.'],
  CANNOT_BOOK_OWN_SERVICE: [400, 'Vous ne pouvez pas réserver votre propre service.'],
  BOOKING_NOT_FOUND: [404, 'Réservation introuvable.'],
  FORBIDDEN: [403, 'Action non autorisée.'],
  ALREADY_PROCESSED: [400, 'Cette réservation a déjà été traitée.'],
  CANNOT_CANCEL: [400, 'Impossible d\'annuler.'],
};

// Crée une nouvelle réservation pour un service.
export const bookService = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const booking = await bookingService.bookService(
      req.user!.userId,
      req.body
    );

    res.status(201).json(booking);
  } catch (err: any) {
    const [status, message] = errors[err.message] || [400, err.message];

    res.status(status).json({
      message,
    });
  }
};

// Récupère les réservations de services effectuées par le client connecté.
export const getClientServiceBookings = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const bookings =
      await bookingService.getClientServiceBookings(
        req.user!.userId
      );

    res.status(200).json(bookings);
  } catch (err: any) {
    res.status(400).json({
      message: err.message,
    });
  }
};

// Récupère les réservations de services reçues par le prestataire connecté.
export const getProviderServiceBookings = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const bookings =
      await bookingService.getProviderServiceBookings(
        req.user!.userId
      );

    res.status(200).json(bookings);
  } catch (err: any) {
    res.status(400).json({
      message: err.message,
    });
  }
};

// Permet au prestataire de confirmer ou de refuser une réservation de service.
export const confirmServiceBooking = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { action, reason } = req.body;

    const result = await bookingService.confirmServiceBooking(
      Number(req.params.id),
      req.user!.userId,
      action,
      reason
    );

    res.status(200).json(result);
  } catch (err: any) {
    const [status, message] = errors[err.message] || [400, err.message];

    res.status(status).json({
      message,
    });
  }
};

// Annule une réservation de service pour l'utilisateur connecté.
export const cancelServiceBooking = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const result = await bookingService.cancelServiceBooking(
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

// Récupère les messages liés à une réservation de service.
export const getServiceBookingMessages = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const messages =
      await bookingService.getServiceBookingMessages(
        Number(req.params.id),
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

// Envoie un message dans une conversation liée à une réservation de service.
export const sendServiceMessage = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { bookingId, content } = req.body;

    const message = await bookingService.sendServiceMessage(
      req.user!.userId,
      Number(bookingId),
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

// Récupère les conversations liées aux réservations de services de l'utilisateur.
export const getServiceConversations = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const conversations =
      await bookingService.getServiceConversations(
        req.user!.userId
      );

    res.status(200).json(conversations);
  } catch (err: any) {
    res.status(400).json({
      message: err.message,
    });
  }
};