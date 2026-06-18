import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';
import { sendOtpEmail } from '../../utils/mailer';

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
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new Error('EMAIL_ALREADY_EXISTS');

  const hashed = await bcrypt.hash(data.password, 12);
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

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

  await sendOtpEmail(user.email, user.firstName, otp);

  return { userId: user.id, message: 'OTP envoyé par email.' };
};

export const verifyOtp = async (userId: number, otp: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('USER_NOT_FOUND');
  if (user.isVerified) throw new Error('ALREADY_VERIFIED');
  if (user.otpCode !== otp) throw new Error('INVALID_OTP');
  if (!user.otpExpiry || user.otpExpiry < new Date()) throw new Error('OTP_EXPIRED');

  await prisma.user.update({
    where: { id: userId },
    data: { isVerified: true, otpCode: null, otpExpiry: null },
  });

  return { message: 'Compte vérifié avec succès.' };
};

export const loginUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('INVALID_CREDENTIALS');

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error('INVALID_CREDENTIALS');

  if (!user.isVerified) throw new Error('EMAIL_NOT_VERIFIED');

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '7d' }
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
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('USER_NOT_FOUND');

  const updateData: any = {};

  if (data.firstName) updateData.firstName = data.firstName;
  if (data.lastName) updateData.lastName = data.lastName;
  if (data.phone) updateData.phone = data.phone;

  if (data.currentPassword && data.newPassword) {
    const valid = await bcrypt.compare(data.currentPassword, user.password);
    if (!valid) throw new Error('WRONG_PASSWORD');
    updateData.password = await bcrypt.hash(data.newPassword, 12);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true, email: true,
      firstName: true, lastName: true,
      phone: true, role: true, avatar: true,
      kycStatus: true,
    },
  });

  return updated;
};