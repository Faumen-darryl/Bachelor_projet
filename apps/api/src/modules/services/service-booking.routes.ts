import { Router } from 'express';
import { authenticate, authorize } from '../auth/auth.middleware';
import {
  bookService, getClientServiceBookings,
  getProviderServiceBookings, confirmServiceBooking,
  cancelServiceBooking, getServiceBookingMessages,
  sendServiceMessage, getServiceConversations,
} from './service-booking.controller';

const router = Router();

router.get('/conversations', authenticate, getServiceConversations);
router.get('/client', authenticate, authorize('CLIENT'), getClientServiceBookings);
router.get('/provider', authenticate, authorize('PRESTATAIRE', 'ADMIN'), getProviderServiceBookings);
router.post('/', authenticate, authorize('CLIENT'), bookService);
router.put('/:id/cancel', authenticate, authorize('CLIENT'), cancelServiceBooking);
router.post('/:id/action', authenticate, authorize('PRESTATAIRE', 'ADMIN'), confirmServiceBooking);
router.get('/:id/messages', authenticate, getServiceBookingMessages);
router.post('/messages', authenticate, sendServiceMessage);

export default router;