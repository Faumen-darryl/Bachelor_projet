import { Router } from 'express';
import { authenticate, authorize } from '../auth/auth.middleware';
import {
  createReservation, bookService,
  createPaymentIntent, confirmPayment,
  getClientReservations, getProviderReservations,
  getReservationById, cancelReservation,
  providerConfirmReservation, getInvoice,
} from './reservation.controller';

const router = Router();

router.get('/client', authenticate, authorize('CLIENT'), getClientReservations);
router.get('/provider', authenticate, authorize('PRESTATAIRE', 'ADMIN'), getProviderReservations);
router.post('/', authenticate, authorize('CLIENT'), createReservation);
router.post('/book-service', authenticate, authorize('CLIENT'), bookService);
router.post('/:id/payment-intent', authenticate, authorize('CLIENT'), createPaymentIntent);
router.post('/:id/confirm-payment', authenticate, authorize('ADMIN'), confirmPayment);
router.post('/:id/provider-action', authenticate, authorize('PRESTATAIRE', 'ADMIN'), providerConfirmReservation);
router.put('/:id/cancel', authenticate, authorize('CLIENT'), cancelReservation);
router.get('/:id/invoice', authenticate, authorize('CLIENT'), getInvoice);
router.get('/', authenticate, getClientReservations);
router.get('/:id', authenticate, getReservationById);

export default router;