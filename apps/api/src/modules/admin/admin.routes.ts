import { Router } from 'express';
import { authenticate, authorize } from '../auth/auth.middleware';
import {
  getAllUsers, updateUserRole, deleteUser, validateKyc,
  getAllReservations, getAllServiceBookings,
  getAllServices, getAllVenues, getPlatformStats,
} from './admin.controller';

const router = Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/stats', getPlatformStats);
router.get('/users', getAllUsers);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/kyc', validateKyc);
router.delete('/users/:id', deleteUser);
router.get('/reservations', getAllReservations);
router.get('/service-bookings', getAllServiceBookings);
router.get('/services', getAllServices);
router.get('/venues', getAllVenues);

export default router;