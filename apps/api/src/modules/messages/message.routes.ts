import { Router } from 'express';
import { authenticate } from '../auth/auth.middleware';
import {
  getReservationMessages,
  getConversations,
  getUnreadCount,
  sendFirstMessage,
} from './message.controller';

const router = Router();

router.get('/conversations', authenticate, getConversations);
router.get('/unread', authenticate, getUnreadCount);
router.post('/send', authenticate, sendFirstMessage);
router.get('/:reservationId', authenticate, getReservationMessages);

export default router;