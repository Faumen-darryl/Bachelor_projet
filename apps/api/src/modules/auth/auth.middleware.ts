import { Request, Response, NextFunction } from 'express';

import { verifyToken } from '../../utils/jwt';

// Étend la requête Express afin d'y ajouter les informations de l'utilisateur authentifié.
export interface AuthRequest extends Request {
  user?: {
    userId: number;
    role: string;
  };
}

// Vérifie la présence et la validité du token JWT avant d'autoriser l'accès à la route.
export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  // Vérifie que l'en-tête Authorization contient bien un token Bearer.
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Token manquant',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Vérifie le token et récupère les informations de l'utilisateur.
    const payload = verifyToken(token);

    req.user = payload;

    next();
  } catch {
    return res.status(401).json({
      message: 'Token invalide ou expiré',
    });
  }
};

// Vérifie que l'utilisateur possède l'un des rôles autorisés pour accéder à la route.
export const authorize = (...roles: string[]) => {
  return (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    // Refuse l'accès si l'utilisateur n'est pas authentifié ou si son rôle n'est pas autorisé.
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Accès refusé',
      });
    }

    next();
  };
};