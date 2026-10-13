import { Request, Response } from 'express';

import * as authService from './auth.service';

import { AuthRequest } from './auth.middleware';

// Inscrit un nouvel utilisateur.
export const register = async (req: Request, res: Response) => {
  try {
    const result = await authService.registerUser(req.body);

    res.status(201).json(result);
  } catch (err: any) {
    // Associe les erreurs techniques à des messages compréhensibles côté client.
    const messages: Record<string, string> = {
      EMAIL_ALREADY_EXISTS: 'Cet email est déjà utilisé.',
    };

    res.status(400).json({
      message: messages[err.message] || err.message,
    });
  }
};

// Vérifie le code OTP envoyé à l'utilisateur après son inscription.
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

    res.status(400).json({
      message: messages[err.message] || err.message,
    });
  }
};

// Authentifie un utilisateur à partir de son email et de son mot de passe.
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const result = await authService.loginUser(email, password);

    res.status(200).json(result);
  } catch (err: any) {
    const messages: Record<string, string> = {
      INVALID_CREDENTIALS: 'Email ou mot de passe incorrect.',
      EMAIL_NOT_VERIFIED:
        'Veuillez vérifier votre email avant de vous connecter.',
    };

    res.status(401).json({
      message: messages[err.message] || err.message,
    });
  }
};

// Met à jour les informations du profil de l'utilisateur connecté.
export const updateProfile = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const result = await authService.updateProfile(
      req.user!.userId,
      req.body
    );

    res.status(200).json(result);
  } catch (err: any) {
    const messages: Record<string, string> = {
      USER_NOT_FOUND: 'Utilisateur introuvable.',
      WRONG_PASSWORD: 'Mot de passe actuel incorrect.',
    };

    res.status(400).json({
      message: messages[err.message] || err.message,
    });
  }
};

// Lance la procédure de réinitialisation du mot de passe.
export const forgotPasswordController = async (
  req: Request,
  res: Response
) => {
  try {
    const { email } = req.body;

    // L'adresse email est obligatoire pour demander une réinitialisation.
    if (!email) {
      return res.status(400).json({
        error: 'Email requis',
      });
    }

    const result = await authService.forgotPassword(email);

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({
      error: error.message,
    });
  }
};

// Réinitialise le mot de passe à partir du token reçu par l'utilisateur.
export const resetPasswordController = async (
  req: Request,
  res: Response
) => {
  try {
    const { token, newPassword } = req.body;

    // Le token et le nouveau mot de passe sont nécessaires pour continuer.
    if (!token || !newPassword) {
      return res.status(400).json({
        error: 'Token et nouveau mot de passe requis',
      });
    }

    // Vérifie la longueur minimale du nouveau mot de passe.
    if (newPassword.length < 8) {
      return res.status(400).json({
        error: 'Le mot de passe doit contenir au moins 8 caractères',
      });
    }

    const result = await authService.resetPassword(
      token,
      newPassword
    );

    return res.status(200).json(result);
  } catch (error: any) {
    // Retourne un message spécifique si le token n'est plus valide.
    if (error.message === 'TOKEN_INVALID_OR_EXPIRED') {
      return res.status(400).json({
        error: 'Lien de réinitialisation invalide ou expiré',
      });
    }

    return res.status(500).json({
      error: error.message,
    });
  }
};