import { Router } from 'express';
import { register, verifyOtp, login } from './auth.controller';

const router = Router();

router.post('/register', register);
router.post('/verify-otp', verifyOtp);
router.post('/login', login);

export default router;