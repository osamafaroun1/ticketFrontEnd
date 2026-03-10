import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware.js';
import { pool } from '../db.js';


export const ticketRouter = Router();

const createTicketSchema = z.object({
  title: z.string().min(3).max(160),
  description: z.string().min(3),
  imageUrl: z.string().url().optional().nullable(),
  issueTypeId: z.number().int(),
  issueSubtypeId: z.number().int().optional().nullable(),
  ipAddress: z.string().max(64).optional().nullable(),
});

// CIVIL creates a ticket (province/department come from token)
ticketRouter.post('/tickets', requireAuth, requireRole(['CIVIL']), async (req, res) => {
  const parsed = createTicketSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid payload' });

  const user = req.user!;
  if (!user.provinceId || !user.departmentId) {
    return res.status(400).json({ message: 'User missing province/department' });
  }

  // assign to an ADMIN of same province (latest admin)
  const [admins] = await pool.query<any[]>(
    `SELECT id FROM users WHERE role_id = 2 AND province_id = :provinceId AND is_active = 1 ORDER BY id DESC LIMIT 1`,
    { provinceId: user.provinceId }
  );
  const assignedAdminId = admins?.[0]?.id ?? null;

  const payload = parsed.data;

  const [result] = await pool.query<any>(
    `INSERT INTO tickets
      (title, description, image_url, ip_address, created_by, province_id, department_id, status_id, issue_type_id, issue_subtype_id, assigned_admin_id)
     VALUES
      (:title, :description, :imageUrl, :ipAddress, :createdBy, :provinceId, :departmentId, 1, :issueTypeId, :issueSubtypeId, :assignedAdminId)`,
    {
      title: payload.title,
      description: payload.description,
      imageUrl: payload.imageUrl ?? null,
      ipAddress: payload.ipAddress ?? null,
      createdBy: user.userId,
      provinceId: user.provinceId,
      departmentId: user.departmentId,
      issueTypeId: payload.issueTypeId,
      issueSubtypeId: payload.issueSubtypeId ?? null,
      assignedAdminId,
    }
  );

  const ticketId = result.insertId;

  await pool.query(
    `INSERT INTO ticket_status_history (ticket_id, from_status_id, to_status_id, changed_by, note)
     VALUES (:ticketId, NULL, 1, :changedBy, 'Created')`,
    { ticketId, changedBy: user.userId }
  );

  res.status(201).json({ id: ticketId });
});

// List tickets by role: CIVIL own tickets, ADMIN province tickets, SUPERADMIN all tickets
ticketRouter.get('/tickets', requireAuth, requireRole(['CIVIL', 'ADMIN', 'SUPERADMIN']), async (req, res) => {
  const user = req.user!;
  const statusId = req.query.statusId ? Number(req.query.statusId) : null;

  const where: string[] = [];
  const params: any = {};
  if (user.roleName === 'CIVIL') {
    where.push('t.created_by = :createdBy');
    params.createdBy = user.userId;
  } else if (user.roleName === 'ADMIN') {
    where.push('t.province_id = :provinceId');
    params.provinceId = user.provinceId;
  }
  if (statusId) {
    where.push('t.status_id = :statusId');
    params.statusId = statusId;
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const [rows] = await pool.query<any[]>(
    `SELECT
      t.id, t.title, t.description, t.image_url as imageUrl, t.ip_address as ipAddress,
      t.created_at as createdAt, t.updated_at as updatedAt,
      t.created_by as createdById,
      t.status_id as statusId, ts.code as statusCode, ts.name_ar as statusNameAr,
      t.issue_type_id as issueTypeId, it.code as issueTypeCode, it.name_ar as issueTypeNameAr,
      t.issue_subtype_id as issueSubtypeId, ist.name_ar as issueSubtypeNameAr,
      t.province_id as provinceId, p.name as provinceName,
      t.department_id as departmentId, d.name as departmentName,
      u.username as createdByUsername, u.full_name as createdByFullName
     FROM tickets t
     JOIN ticket_statuses ts ON ts.id = t.status_id
     JOIN issue_types it ON it.id = t.issue_type_id
     LEFT JOIN issue_subtypes ist ON ist.id = t.issue_subtype_id
     JOIN provinces p ON p.id = t.province_id
     JOIN departments d ON d.id = t.department_id
     JOIN users u ON u.id = t.created_by
     ${whereSql}
     ORDER BY t.created_at DESC
     LIMIT 500`,
    params
  );

  res.json(rows);
});

// Ticket detail
ticketRouter.get('/tickets/:id', requireAuth, requireRole(['CIVIL', 'ADMIN', 'SUPERADMIN']), async (req, res) => {
  const user = req.user!;
  const id = Number(req.params.id);

  const [rows] = await pool.query<any[]>(
    `SELECT
      t.id, t.title, t.description, t.image_url as imageUrl, t.ip_address as ipAddress,
      t.created_at as createdAt, t.updated_at as updatedAt,
      t.created_by as createdById,
      t.status_id as statusId, ts.code as statusCode, ts.name_ar as statusNameAr,
      t.issue_type_id as issueTypeId, it.code as issueTypeCode, it.name_ar as issueTypeNameAr,
      t.issue_subtype_id as issueSubtypeId, ist.name_ar as issueSubtypeNameAr,
      t.province_id as provinceId, p.name as provinceName,
      t.department_id as departmentId, d.name as departmentName,
      u.username as createdByUsername, u.full_name as createdByFullName
     FROM tickets t
     JOIN ticket_statuses ts ON ts.id = t.status_id
     JOIN issue_types it ON it.id = t.issue_type_id
     LEFT JOIN issue_subtypes ist ON ist.id = t.issue_subtype_id
     JOIN provinces p ON p.id = t.province_id
     JOIN departments d ON d.id = t.department_id
     JOIN users u ON u.id = t.created_by
     WHERE t.id = :id
     LIMIT 1`,
    { id }
  );

  const ticket = rows?.[0];
  if (!ticket) return res.status(404).json({ message: 'Not found' });

  if (user.roleName === 'CIVIL' && ticket.createdById !== user.userId) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  if (user.roleName === 'ADMIN' && ticket.provinceId !== user.provinceId) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const [history] = await pool.query<any[]>(
    `SELECT h.id, h.from_status_id as fromStatusId, h.to_status_id as toStatusId,
            ts1.code as fromCode, ts2.code as toCode,
            h.changed_by as changedBy, u.username as changedByUsername, u.full_name as changedByFullName,
            h.note, h.created_at as createdAt
     FROM ticket_status_history h
     LEFT JOIN ticket_statuses ts1 ON ts1.id = h.from_status_id
     JOIN ticket_statuses ts2 ON ts2.id = h.to_status_id
     JOIN users u ON u.id = h.changed_by
     WHERE h.ticket_id = :id
     ORDER BY h.created_at ASC`,
    { id }
  );

  res.json({ ticket, history });
});

const updateStatusSchema = z.object({
  statusId: z.number().int().min(1).max(5),
  note: z.string().max(255).optional().nullable(),
});

// Update ticket status (ADMIN within province, SUPERADMIN any)
ticketRouter.patch('/tickets/:id/status', requireAuth, requireRole(['ADMIN', 'SUPERADMIN']), async (req, res) => {
  const user = req.user!;
  const id = Number(req.params.id);
  const parsed = updateStatusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid payload' });

  const [rows] = await pool.query<any[]>(`SELECT id, province_id as provinceId, status_id as statusId FROM tickets WHERE id = :id`, { id });
  const t = rows?.[0];
  if (!t) return res.status(404).json({ message: 'Not found' });

  if (user.roleName === 'ADMIN' && t.provinceId !== user.provinceId) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const fromStatusId = t.statusId;
  const toStatusId = parsed.data.statusId;

  await pool.query(`UPDATE tickets SET status_id = :toStatusId WHERE id = :id`, { id, toStatusId });
  await pool.query(
    `INSERT INTO ticket_status_history (ticket_id, from_status_id, to_status_id, changed_by, note)
     VALUES (:ticketId, :fromStatusId, :toStatusId, :changedBy, :note)`,
    { ticketId: id, fromStatusId, toStatusId, changedBy: user.userId, note: parsed.data.note ?? null }
  );

  res.json({ ok: true });
});
