import { Router } from 'express';
import { authenticate, authorize } from '../auth/auth.middleware';
import { createService, getServices, getServiceById } from './service.controller';

const router = Router();

router.get('/', getServices);
router.get('/:id', getServiceById);
router.post('/', authenticate, authorize('PRESTATAIRE', 'ADMIN'), createService);

export default router;