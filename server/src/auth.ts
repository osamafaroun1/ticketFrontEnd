import jwt from 'jsonwebtoken';
import { JwtUser, RoleName } from './types.js';

const accessSecret = process.env.JWT_ACCESS_SECRET || 'dev_access';
const refreshSecret = process.env.JWT_REFRESH_SECRET || 'dev_refresh';

export function signAccessToken(payload: JwtUser) {
  const ttl = process.env.ACCESS_TOKEN_TTL || '15m';
  return jwt.sign(payload, accessSecret, { expiresIn: ttl as any });
}

export function signRefreshToken(payload: JwtUser) {
  const days = Number(process.env.REFRESH_TOKEN_TTL_DAYS || 30);
  return jwt.sign(payload, refreshSecret, { expiresIn: `${days}d` });
}

export function verifyAccessToken(token: string): JwtUser | null {
  try {
    return jwt.verify(token, accessSecret) as JwtUser;
  } catch (error) {
    return null;
  }
}

export function verifyRefreshToken(token: string): JwtUser | null {
  try {
    return jwt.verify(token, refreshSecret) as JwtUser;
  } catch (error) {
    return null;
  }
}

export function roleNameFromId(roleId: number): RoleName {
  if (roleId === 1) return 'CIVIL';
  if (roleId === 2) return 'ADMIN';
  return 'SUPERADMIN';
}
