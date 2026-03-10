import { Router } from 'express';
import { pool } from '../db.js';

export const metaRouter = Router();

metaRouter.get('/provinces', async (_req, res) => {
  const [rows] = await pool.query<any[]>(`SELECT id, name FROM provinces ORDER BY name`);
  res.json(rows);
});

metaRouter.get('/departments', async (req, res) => {
  const provinceId = Number(req.query.provinceId);
  if (!provinceId) return res.status(400).json({ message: 'provinceId is required' });
  const [rows] = await pool.query<any[]>(
    `SELECT id, province_id as provinceId, name FROM departments WHERE province_id = :provinceId ORDER BY name`,
    { provinceId }
  );
  res.json(rows);
});

metaRouter.get('/ticket-statuses', async (_req, res) => {
  const [rows] = await pool.query<any[]>(`SELECT id, code, name_ar as nameAr FROM ticket_statuses ORDER BY id`);
  res.json(rows);
});

metaRouter.get('/issue-types', async (_req, res) => {
  const [rows] = await pool.query<any[]>(`SELECT id, code, name_ar as nameAr FROM issue_types ORDER BY id`);
  res.json(rows);
});

metaRouter.get('/issue-subtypes', async (req, res) => {
  const issueTypeId = Number(req.query.issueTypeId);
  if (!issueTypeId) return res.status(400).json({ message: 'issueTypeId is required' });
  const [rows] = await pool.query<any[]>(
    `SELECT id, issue_type_id as issueTypeId, code, name_ar as nameAr FROM issue_subtypes WHERE issue_type_id = :issueTypeId AND is_active = 1 ORDER BY name_ar`,
    { issueTypeId }
  );
  res.json(rows);
});
