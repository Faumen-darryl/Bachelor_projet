import { Router } from 'express';
import { authenticate, authorize } from '../auth/auth.middleware';
import {
  createService, getServices, getServiceById,
  getMyServices, deleteService, updateService,
} from './service.controller';

const router = Router();

router.get('/', getServices);
router.get('/my', authenticate, authorize('PRESTATAIRE', 'ADMIN'), getMyServices);
router.get('/:id', getServiceById);
router.post('/', authenticate, authorize('PRESTATAIRE', 'ADMIN'), createService);
router.put('/:id', authenticate, authorize('PRESTATAIRE', 'ADMIN'), updateService);
router.delete('/:id', authenticate, authorize('PRESTATAIRE', 'ADMIN'), deleteService);

export default router;