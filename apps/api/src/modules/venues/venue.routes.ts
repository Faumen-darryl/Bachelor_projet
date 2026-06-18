import { Router } from 'express';
import { authenticate, authorize } from '../auth/auth.middleware';
import { upload } from '../../utils/upload';
import {
  createVenue, getVenues, getVenueById,
  updateVenue, deleteVenue, uploadVenuePhoto,
} from './venue.controller';

const router = Router();

router.get('/', getVenues);
router.get('/:id', getVenueById);
router.post('/', authenticate, authorize('PRESTATAIRE', 'ADMIN'), createVenue);
router.put('/:id', authenticate, authorize('PRESTATAIRE', 'ADMIN'), updateVenue);
router.delete('/:id', authenticate, authorize('PRESTATAIRE', 'ADMIN'), deleteVenue);
router.post('/:id/photos', authenticate, authorize('PRESTATAIRE', 'ADMIN'), upload.single('photo'), uploadVenuePhoto);

export default router;