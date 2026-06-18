import { Request, Response } from 'express';
import * as authService from './auth.service';
import { AuthRequest } from './auth.middleware';

export const register = async (req: Request, res: Response) => {
  try {
    const result = await authService.registerUser(req.body);
    res.status(201).json(result);
  } catch (err: any) {
    const messages: Record<string, string> = {
      EMAIL_ALREADY_EXISTS: 'Cet email est déjà utilisé.',
    };
    res.status(400).json({ message: messages[err.message] || err.message });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { userId, otp } = req.body;
    const result = await authService.verifyOtp(Number(userId), otp);
    res.status(200).json(result);
  } catch (err: any) {
    const messages: Record<string, string> = {
      USER_NOT_FOUND: 'Utilisateur introuvable.',
      ALREADY_VERIFIED: 'Compte déjà vérifié.',
      INVALID_OTP: 'Code OTP incorrect.',
      OTP_EXPIRED: 'Code OTP expiré. Réinscrivez-vous.',
    };
    res.status(400).json({ message: messages[err.message] || err.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);
    res.status(200).json(result);
  } catch (err: any) {
    const messages: Record<string, string> = {
      INVALID_CREDENTIALS: 'Email ou mot de passe incorrect.',
      EMAIL_NOT_VERIFIED: 'Veuillez vérifier votre email avant de vous connecter.',
    };
    res.status(401).json({ message: messages[err.message] || err.message });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const result = await authService.updateProfile(req.user!.userId, req.body);
    res.status(200).json(result);
  } catch (err: any) {
    const messages: Record<string, string> = {
      USER_NOT_FOUND: 'Utilisateur introuvable.',
      WRONG_PASSWORD: 'Mot de passe actuel incorrect.',
    };
    res.status(400).json({ message: messages[err.message] || err.message });
  }
};