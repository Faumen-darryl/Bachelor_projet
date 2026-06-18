import { Router } from 'express';
import { register, verifyOtp, login, updateProfile } from './auth.controller';
import { authenticate } from './auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/verify-otp', verifyOtp);
router.post('/login', login);
router.put('/profile', authenticate, updateProfile);

export default router;