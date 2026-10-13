import { Router } from 'express';
import { register, verifyOtp, login, updateProfile, forgotPasswordController, resetPasswordController} from './auth.controller';
import { authenticate } from './auth.middleware';


const router = Router();

router.post('/register', register);
router.post('/verify-otp', verifyOtp);
router.post('/login', login);
router.put('/profile', authenticate, updateProfile);
router.post('/forgot-password', forgotPasswordController);
router.post('/reset-password', resetPasswordController);

export default router;