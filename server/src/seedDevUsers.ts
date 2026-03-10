import bcrypt from 'bcryptjs';
import { pool } from './db.js';

// Run once manually (node ts-node) or adapt later. In this demo we won't execute automatically.
export async function seedDevUserPasswords() {
  const password = '1234';
  const hash = await bcrypt.hash(password, 10);
  await pool.query(`UPDATE users SET password_hash = :hash WHERE password_hash = 'DUMMY'`, { hash });
}
