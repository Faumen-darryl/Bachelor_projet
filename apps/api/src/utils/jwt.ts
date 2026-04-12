import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET as string;
const EXPIRES_IN = '7d';

export interface JwtPayload {
  userId: number;
  role: string;
}

export const signToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, SECRET) as JwtPayload;
};