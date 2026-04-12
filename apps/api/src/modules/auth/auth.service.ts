import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma';
import { signToken } from '../../utils/jwt';
import { generateOtp, getOtpExpiry } from '../../utils/otp';
import { sendOtpEmail } from '../../utils/mailer';
import { Role } from '@prisma/client';

export const registerUser = async (data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: Role;
}) => {
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existing) throw new Error('EMAIL_ALREADY_EXISTS');

  const hashed = await bcrypt.hash(data.password, 12);
  const otp = generateOtp();
  const otpExpiry = getOtpExpiry();

  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashed,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      role: data.role || 'CLIENT',
      otpCode: otp,
      otpExpiry,
    },
  });

  await sendOtpEmail(user.email, otp, user.firstName);

  return { message: 'Inscription réussie. Vérifiez votre email.', userId: user.id };
};

export const verifyOtp = async (userId: number, otp: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('USER_NOT_FOUND');
  if (user.isVerified) throw new Error('ALREADY_VERIFIED');
  if (!user.otpCode || user.otpCode !== otp) throw new Error('INVALID_OTP');
  if (!user.otpExpiry || user.otpExpiry < new Date()) throw new Error('OTP_EXPIRED');

  await prisma.user.update({
    where: { id: userId },
    data: { isVerified: true, otpCode: null, otpExpiry: null },
  });

  const token = signToken({ userId: user.id, role: user.role });
  return { token, user: { id: user.id, email: user.email, role: user.role } };
};

export const loginUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('INVALID_CREDENTIALS');

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error('INVALID_CREDENTIALS');

  if (!user.isVerified) throw new Error('EMAIL_NOT_VERIFIED');

  const token = signToken({ userId: user.id, role: user.role });
  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      avatar: user.avatar,
    },
  };
};