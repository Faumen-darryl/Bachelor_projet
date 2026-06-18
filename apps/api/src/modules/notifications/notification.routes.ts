import { Router } from 'express';
import { authenticate } from '../auth/auth.middleware';
import {
  getUserNotifications,
  getUnreadNotifications,
  markAllAsRead,
  markOneAsRead,
} from './notification.controller';

const router = Router();

router.get('/', authenticate, getUserNotifications);
router.get('/unread', authenticate, getUnreadNotifications);
router.put('/read-all', authenticate, markAllAsRead);
router.put('/:id/read', authenticate, markOneAsRead);

export default router;