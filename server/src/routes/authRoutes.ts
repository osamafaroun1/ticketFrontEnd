import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { pool } from '../db.js';
import { roleNameFromId, signAccessToken, signRefreshToken, verifyRefreshToken } from '../auth.js';


export const authRouter = Router();

const loginSchema = z.object({
  username: z.string().min(2),
  password: z.string().min(4),
});

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid payload' });

  const { username, password } = parsed.data;
  const [rows] = await pool.query<any[]>(
    `SELECT u.id, u.username, u.password_hash, u.full_name, u.phone, u.role_id, u.province_id, u.department_id,
            r.name as role_name,
            p.name as province_name,
            d.name as department_name
     FROM users u
     JOIN roles r ON r.id = u.role_id
     LEFT JOIN provinces p ON p.id = u.province_id
     LEFT JOIN departments d ON d.id = u.department_id
     WHERE u.username = :username AND u.is_active = 1
     LIMIT 1`,
    { username }
  );

  const user = rows?.[0];
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  let ok = false;
  if (user.password_hash === 'DUMMY') {
    const seedPassword = process.env.SEED_DEFAULT_PASSWORD || '123456';
    ok = password === seedPassword;
    if (ok) {
      const upgradedHash = await bcrypt.hash(password, 10);
      await pool.query(`UPDATE users SET password_hash = :passwordHash WHERE id = :id`, {
        passwordHash: upgradedHash,
        id: user.id,
      });
    }
  } else {
    ok = await bcrypt.compare(password, user.password_hash);
  }
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

  const roleName = roleNameFromId(user.role_id);
  const jwtPayload = {
    userId: user.id,
    roleId: user.role_id,
    roleName,
    provinceId: user.province_id ?? null,
    departmentId: user.department_id ?? null,
    username: user.username,
  };

  const accessToken = signAccessToken(jwtPayload);
  const refreshToken = signRefreshToken(jwtPayload);

  // store refresh hash
  const refreshHash = await bcrypt.hash(refreshToken, 10);
  const days = Number(process.env.REFRESH_TOKEN_TTL_DAYS || 30);
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (:userId, :tokenHash, :expiresAt)`,
    { userId: user.id, tokenHash: refreshHash, expiresAt: expires }
  );

  return res.json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      phone: user.phone,
      roleId: user.role_id,
      roleName: user.role_name,
      provinceId: user.province_id ?? null,
      provinceName: user.province_name ?? null,
      departmentId: user.department_id ?? null,
      departmentName: user.department_name ?? null,
    },
  });
});

authRouter.post('/refresh', async (req, res) => {
  const token = (req.body?.refreshToken as string) || '';
  if (!token) return res.status(400).json({ message: 'Missing refreshToken' });

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }

  // verify exists and not revoked
  const [rows] = await pool.query<any[]>(
    `SELECT id, token_hash, expires_at, revoked_at FROM refresh_tokens
     WHERE user_id = :userId AND revoked_at IS NULL AND expires_at > NOW()
     ORDER BY id DESC LIMIT 20`,
    { userId: payload.userId }
  );

  const matches = await Promise.all(rows.map((r) => bcrypt.compare(token, r.token_hash)));
  const idx = matches.findIndex(Boolean);
  if (idx === -1) return res.status(401).json({ message: 'Refresh token not recognized' });

  const accessToken = signAccessToken(payload);
  return res.json({ accessToken });
});

authRouter.post('/logout', async (req, res) => {
  const token = (req.body?.refreshToken as string) || '';
  if (token) {
    // best-effort revoke (by matching hashes in last tokens)
    try {
      const payload = verifyRefreshToken(token);
      const [rows] = await pool.query<any[]>(
        `SELECT id, token_hash FROM refresh_tokens WHERE user_id = :userId AND revoked_at IS NULL ORDER BY id DESC LIMIT 50`,
        { userId: payload.userId }
      );
      for (const r of rows) {
        // eslint-disable-next-line no-await-in-loop
        if (await bcrypt.compare(token, r.token_hash)) {
          // eslint-disable-next-line no-await-in-loop
          await pool.query(`UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = :id`, { id: r.id });
          break;
        }
      }
    } catch {
      // ignore
    }
  }
  return res.json({ ok: true });
});
