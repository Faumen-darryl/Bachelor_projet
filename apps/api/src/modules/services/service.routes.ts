import { Router } from 'express';
import { authenticate, authorize } from '../auth/auth.middleware';
import { upload } from '../../utils/upload';
import {
  createService, getServices, getServiceById,
  getMyServices, deleteService, updateService,
  uploadServicePhoto,
} from './service.controller';

const router = Router();

router.get('/', getServices);
router.get('/my', authenticate, authorize('PRESTATAIRE', 'ADMIN'), getMyServices);
router.get('/:id', getServiceById);
router.post('/', authenticate, authorize('PRESTATAIRE', 'ADMIN'), createService);
router.put('/:id', authenticate, authorize('PRESTATAIRE', 'ADMIN'), updateService);
router.delete('/:id', authenticate, authorize('PRESTATAIRE', 'ADMIN'), deleteService);
router.post('/:id/photos',authenticate, authorize('PRESTATAIRE', 'ADMIN'), upload.single('photo'), uploadServicePhoto);

export default router;