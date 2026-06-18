import { Response } from 'express';
import * as reservationService from './reservation.service';
import { AuthRequest } from '../auth/auth.middleware';

const errors: Record<string, [number, string]> = {
  VENUE_NOT_FOUND: [404, 'Lieu introuvable.'],
  VENUE_NOT_AVAILABLE: [400, 'Ce lieu n\'est pas disponible.'],
  VENUE_ALREADY_BOOKED: [409, 'Ce lieu est déjà réservé sur cette période.'],
  SERVICE_NOT_FOUND: [404, 'Service introuvable.'],
  SERVICE_NOT_AVAILABLE: [400, 'Ce service n\'est pas disponible.'],
  PROVIDER_HAS_NO_VENUE: [400, 'Ce prestataire n\'a pas encore de lieu associé.'],
  RESERVATION_NOT_FOUND: [404, 'Réservation introuvable.'],
  FORBIDDEN: [403, 'Action non autorisée.'],
  ALREADY_PAID: [400, 'Cette réservation est déjà payée.'],
  CANNOT_CANCEL: [400, 'Impossible d\'annuler une réservation terminée.'],
  INVOICE_NOT_AVAILABLE: [400, 'Facture disponible uniquement après confirmation.'],
  ALREADY_PROCESSED: [400, 'Cette réservation a déjà été traitée.'],
};

export const createReservation = async (req: AuthRequest, res: Response) => {
  try {
    const reservation = await reservationService.createReservation(
      req.user!.userId, req.body
    );
    res.status(201).json(reservation);
  } catch (err: any) {
    const [status, message] = errors[err.message] || [400, err.message];
    res.status(status).json({ message });
  }
};

export const bookService = async (req: AuthRequest, res: Response) => {
  try {
    const reservation = await reservationService.bookService(
      req.user!.userId, req.body
    );
    res.status(201).json(reservation);
  } catch (err: any) {
    const [status, message] = errors[err.message] || [400, err.message];
    res.status(status).json({ message });
  }
};

export const createPaymentIntent = async (req: AuthRequest, res: Response) => {
  try {
    const result = await reservationService.createPaymentIntent(
      Number(req.params.id), req.user!.userId
    );
    res.status(200).json(result);
  } catch (err: any) {
    const [status, message] = errors[err.message] || [400, err.message];
    res.status(status).json({ message });
  }
};

export const confirmPayment = async (req: AuthRequest, res: Response) => {
  try {
    const reservation = await reservationService.confirmPayment(
      Number(req.params.id)
    );
    res.status(200).json(reservation);
  } catch (err: any) {
    const [status, message] = errors[err.message] || [400, err.message];
    res.status(status).json({ message });
  }
};

export const getClientReservations = async (req: AuthRequest, res: Response) => {
  try {
    const reservations = await reservationService.getClientReservations(
      req.user!.userId
    );
    res.status(200).json(reservations);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const getProviderReservations = async (req: AuthRequest, res: Response) => {
  try {
    const reservations = await reservationService.getProviderReservations(
      req.user!.userId
    );
    res.status(200).json(reservations);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const getReservationById = async (req: AuthRequest, res: Response) => {
  try {
    const reservation = await reservationService.getReservationById(
      Number(req.params.id), req.user!.userId
    );
    res.status(200).json(reservation);
  } catch (err: any) {
    const [status, message] = errors[err.message] || [400, err.message];
    res.status(status).json({ message });
  }
};

export const cancelReservation = async (req: AuthRequest, res: Response) => {
  try {
    const result = await reservationService.cancelReservation(
      Number(req.params.id), req.user!.userId
    );
    res.status(200).json(result);
  } catch (err: any) {
    const [status, message] = errors[err.message] || [400, err.message];
    res.status(status).json({ message });
  }
};

export const providerConfirmReservation = async (req: AuthRequest, res: Response) => {
  try {
    const { action, reason } = req.body;
    const result = await reservationService.providerConfirmReservation(
      Number(req.params.id), req.user!.userId, action, reason,
    );
    res.status(200).json(result);
  } catch (err: any) {
    const [status, message] = errors[err.message] || [400, err.message];
    res.status(status).json({ message });
  }
};

export const getInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const pdfBuffer = await reservationService.getInvoice(
      Number(req.params.id), req.user!.userId
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=facture-${req.params.id}.pdf`
    );
    res.send(pdfBuffer);
  } catch (err: any) {
    const [status, message] = errors[err.message] || [400, err.message];
    res.status(status).json({ message });
  }
};