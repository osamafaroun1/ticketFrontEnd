import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const SECRET_KEY = process.env.SECRET_KEY || 'your-secret-key';

// Database Connection
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ticket_system',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Middleware for Auth
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- ROUTES ---

// Login
app.post('/api/auth/login', async (req, res) => {
  const { username } = req.body; // In real app, check password too
  try {
    const [rows]: any = await pool.query(
      `SELECT u.*, r.name as role_name, p.name as province_name, d.name as department_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       LEFT JOIN provinces p ON u.province_id = p.id 
       LEFT JOIN departments d ON u.department_id = d.id 
       WHERE u.username = ?`, 
      [username]
    );

    if (rows.length === 0) return res.status(401).json({ message: 'User not found' });

    const user = rows[0];
    // const validPassword = await bcrypt.compare(password, user.password);
    // if (!validPassword) return res.status(403).json({ message: 'Invalid password' });

    const token = jwt.sign({ id: user.id, role: user.role_id, provinceId: user.province_id }, SECRET_KEY, { expiresIn: '1h' });
    
    res.json({ 
      token, 
      user: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        role: user.role_id,
        provinceId: user.province_id,
        departmentId: user.department_id,
        provinceName: user.province_name,
        departmentName: user.department_name
      }
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

// Get Tickets
app.get('/api/tickets', authenticateToken, async (req: any, res) => {
  try {
    let query = `
      SELECT t.*, u.full_name as userName, p.name as provinceName, d.name as departmentName, 
             s.name as statusName, c.type as categoryType, c.name as categorySubType
      FROM tickets t
      JOIN users u ON t.user_id = u.id
      JOIN provinces p ON t.province_id = p.id
      JOIN departments d ON t.department_id = d.id
      JOIN ticket_statuses s ON t.status_id = s.id
      JOIN ticket_categories c ON t.category_id = c.id
    `;
    
    const params = [];

    if (req.user.role === 2) { // ADMIN
      query += ' WHERE t.province_id = ?';
      params.push(req.user.provinceId);
    } else if (req.user.role === 1) { // CIVIL
      query += ' WHERE t.user_id = ?';
      params.push(req.user.id);
    }
    // SUPERADMIN sees all (no WHERE clause needed for basic filter)

    query += ' ORDER BY t.created_at DESC';

    const [tickets] = await pool.query(query, params);
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

// Create Ticket
app.post('/api/tickets', authenticateToken, async (req: any, res) => {
  const { title, description, categoryType, categorySubType, ipAddress } = req.body;
  const userId = req.user.id;
  
  try {
    // Get User Details for Province/Dept
    const [users]: any = await pool.query('SELECT province_id, department_id FROM users WHERE id = ?', [userId]);
    const user = users[0];

    // Find Category ID
    const [cats]: any = await pool.query('SELECT id FROM ticket_categories WHERE type = ? AND name = ?', [categoryType, categorySubType]);
    const categoryId = cats[0]?.id || 1; // Default to 1 if not found

    await pool.query(
      `INSERT INTO tickets (title, description, user_id, province_id, department_id, status_id, category_id, ip_address)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
      [title, description, userId, user.province_id, user.department_id, categoryId, ipAddress]
    );

    res.status(201).json({ message: 'Ticket created' });
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

// Update Status
app.put('/api/tickets/:id/status', authenticateToken, async (req: any, res) => {
  const { status } = req.body; // 'OPEN', 'CLOSED', etc.
  const ticketId = req.params.id;

  try {
    // Get Status ID
    const [statuses]: any = await pool.query('SELECT id FROM ticket_statuses WHERE name = ?', [status]);
    const statusId = statuses[0]?.id;

    if (!statusId) return res.status(400).json({ message: 'Invalid status' });

    // Check permissions (Admin only for their province, SuperAdmin for all)
    // Simplified for this demo code:
    await pool.query('UPDATE tickets SET status_id = ? WHERE id = ?', [statusId, ticketId]);

    res.json({ message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
