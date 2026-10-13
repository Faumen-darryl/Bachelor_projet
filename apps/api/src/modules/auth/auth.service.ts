import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

import { prisma } from '../../lib/prisma';

import { sendOtpEmail } from '../../utils/mailer';
import { sendResetPasswordEmail } from '../../utils/mailer';

// Crée un nouvel utilisateur et lui envoie un code OTP par email.
export const registerUser = async (data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: string;
  companyName?: string;
  siret?: string;
  companyAddress?: string;
  companyCity?: string;
  companyZip?: string;
  rib?: string;
}) => {
  // Vérifie qu'aucun compte n'existe déjà avec cette adresse email.
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existing) throw new Error('EMAIL_ALREADY_EXISTS');

  // Sécurise le mot de passe avant son enregistrement en base.
  const hashed = await bcrypt.hash(data.password, 12);

  // Génère un code OTP valable pendant 10 minutes.
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  // Crée l'utilisateur avec les informations liées à son rôle.
  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashed,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      role: (data.role as any) || 'CLIENT',
      otpCode: otp,
      otpExpiry,
      ...(data.role === 'PRESTATAIRE' && {
        companyName: data.companyName,
        siret: data.siret,
        companyAddress: data.companyAddress,
        companyCity: data.companyCity,
        companyZip: data.companyZip,
        rib: data.rib,
        kycStatus: 'EN_ATTENTE',
        kycSubmittedAt: new Date(),
      }),
    },
  });

  // Envoie le code OTP à l'adresse email de l'utilisateur.
  await sendOtpEmail(user.email, user.firstName, otp);

  return {
    userId: user.id,
    message: 'OTP envoyé par email.',
  };
};

// Vérifie le code OTP saisi par l'utilisateur.
export const verifyOtp = async (userId: number, otp: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) throw new Error('USER_NOT_FOUND');
  if (user.isVerified) throw new Error('ALREADY_VERIFIED');
  if (user.otpCode !== otp) throw new Error('INVALID_OTP');
  if (!user.otpExpiry || user.otpExpiry < new Date()) {
    throw new Error('OTP_EXPIRED');
  }

  // Valide le compte et supprime les informations OTP devenues inutiles.
  await prisma.user.update({
    where: { id: userId },
    data: {
      isVerified: true,
      otpCode: null,
      otpExpiry: null,
    },
  });

  return {
    message: 'Compte vérifié avec succès.',
  };
};

// Authentifie l'utilisateur avec son email et son mot de passe.
export const loginUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) throw new Error('INVALID_CREDENTIALS');

  // Compare le mot de passe fourni avec le mot de passe enregistré.
  const valid = await bcrypt.compare(password, user.password);

  if (!valid) throw new Error('INVALID_CREDENTIALS');

  // Empêche la connexion si l'adresse email n'a pas encore été vérifiée.
  if (!user.isVerified) throw new Error('EMAIL_NOT_VERIFIED');

  // Génère un token JWT valable pendant 7 jours.
  const token = jwt.sign(
    {
      userId: user.id,
      role: user.role,
    },
    process.env.JWT_SECRET || 'secret',
    {
      expiresIn: '7d',
    }
  );

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      avatar: user.avatar,
      phone: user.phone,
      kycStatus: user.kycStatus,
    },
  };
};

// Met à jour les informations du profil d'un utilisateur.
export const updateProfile = async (
  userId: number,
  data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    currentPassword?: string;
    newPassword?: string;
  }
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) throw new Error('USER_NOT_FOUND');

  // Contient uniquement les informations réellement fournies à mettre à jour.
  const updateData: any = {};

  if (data.firstName) updateData.firstName = data.firstName;
  if (data.lastName) updateData.lastName = data.lastName;
  if (data.phone) updateData.phone = data.phone;

  // Vérifie l'ancien mot de passe avant d'autoriser son remplacement.
  if (data.currentPassword && data.newPassword) {
    const valid = await bcrypt.compare(
      data.currentPassword,
      user.password
    );

    if (!valid) throw new Error('WRONG_PASSWORD');

    updateData.password = await bcrypt.hash(
      data.newPassword,
      12
    );
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      avatar: true,
      kycStatus: true,
    },
  });

  return updated;
};

// Lance une demande de réinitialisation du mot de passe.
export const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  // Ne révèle pas si l'adresse email existe afin d'éviter l'énumération des comptes.
  if (!user) {
    return {
      message:
        'Si cet email existe, un lien de réinitialisation a été envoyé.',
    };
  }

  // Génère un token sécurisé valable pendant 30 minutes.
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetExpiry = new Date(Date.now() + 30 * 60 * 1000);

  // Enregistre le token et sa date d'expiration.
  await prisma.user.update({
    where: { email },
    data: {
      resetPasswordToken: resetToken,
      resetPasswordExpiry: resetExpiry,
    },
  });

  // Construit le lien de réinitialisation puis l'envoie par email.
  const resetLink =
    `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;

  await sendResetPasswordEmail(
    user.email,
    user.firstName,
    resetLink
  );

  return {
    message:
      'Si cet email existe, un lien de réinitialisation a été envoyé.',
  };
};

// Réinitialise le mot de passe à partir d'un token encore valide.
export const resetPassword = async (
  token: string,
  newPassword: string
) => {
  // Recherche l'utilisateur correspondant au token non expiré.
  const user = await prisma.user.findFirst({
    where: {
      resetPasswordToken: token,
      resetPasswordExpiry: {
        gt: new Date(),
      },
    },
  });

  if (!user) throw new Error('TOKEN_INVALID_OR_EXPIRED');

  // Sécurise le nouveau mot de passe avant son enregistrement.
  const hashed = await bcrypt.hash(newPassword, 12);

  // Met à jour le mot de passe puis invalide le token utilisé.
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashed,
      resetPasswordToken: null,
      resetPasswordExpiry: null,
    },
  });

  return {
    message: 'Mot de passe réinitialisé avec succès.',
  };
};
