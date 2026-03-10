-- Seed data for Ticket Management System
SET NAMES utf8mb4;

-- Roles
INSERT INTO roles (id, name) VALUES
  (1, 'CIVIL'),
  (2, 'ADMIN'),
  (3, 'SUPERADMIN')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Provinces (Syria)
INSERT INTO provinces (id, name) VALUES
  (1, 'دمشق'),
  (2, 'حلب'),
  (3, 'حمص'),
  (4, 'اللاذقية'),
  (5, 'حماة'),
  (6, 'طرطوس'),
  (7, 'درعا'),
  (8, 'السويداء'),
  (9, 'القنيطرة'),
  (10, 'دير الزور'),
  (11, 'الحسكة'),
  (12, 'الرقة'),
  (13, 'إدلب')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Departments (sample)
INSERT INTO departments (province_id, name) VALUES
  (1, 'ركن الدين'),
  (1, 'الميدان'),
  (1, 'البرامكة'),
  (2, 'السكري'),
  (2, 'المشارقة'),
  (3, 'الإنشاءات'),
  (3, 'الوعر')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Ticket statuses
INSERT INTO ticket_statuses (id, code, name_ar) VALUES
  (1, 'OPEN', 'مفتوحة'),
  (2, 'IN_PROGRESS', 'قيد المعالجة'),
  (3, 'SOLVED', 'تم الحل'),
  (4, 'POSTPONED', 'مؤجلة'),
  (5, 'CLOSED', 'مغلقة')
ON DUPLICATE KEY UPDATE code=VALUES(code), name_ar=VALUES(name_ar);

-- Issue types
INSERT INTO issue_types (id, code, name_ar) VALUES
  (1, 'HARDWARE', 'عتاد'),
  (2, 'SOFTWARE', 'برمجيات')
ON DUPLICATE KEY UPDATE code=VALUES(code), name_ar=VALUES(name_ar);

-- Issue subtypes (manual list)
INSERT INTO issue_subtypes (issue_type_id, code, name_ar) VALUES
  (1, 'SCREEN', 'شاشة'),
  (1, 'CASE', 'كيس'),
  (1, 'PRINTER', 'طابعة'),
  (1, 'CASHIER', 'كاشير'),
  (2, 'OS', 'نظام تشغيل'),
  (2, 'OFFICE', 'حزمة أوفيس'),
  (2, 'BROWSER', 'متصفح'),
  (2, 'APP', 'تطبيق داخلي')
ON DUPLICATE KEY UPDATE name_ar=VALUES(name_ar);

-- Users (passwords are placeholders; backend will have its own seed script to hash)
-- NOTE: For demo, set password_hash to a bcrypt hash in backend seeding.
-- Here we insert users with dummy hash; backend seed endpoint/script can update.
INSERT INTO users (username, password_hash, full_name, phone, role_id, province_id, department_id) VALUES
  ('osama', 'DUMMY', 'أسامة أحمد محمد', '0999000001', 1, 1, (SELECT id FROM departments WHERE province_id=1 AND name='ركن الدين' LIMIT 1)),
  ('sara',  'DUMMY', 'سارة خالد علي', '0999000002', 1, 1, (SELECT id FROM departments WHERE province_id=1 AND name='الميدان' LIMIT 1)),

  ('dam_admin', 'DUMMY', 'أحمد مسؤول دمشق', '0999000010', 2, 1, NULL),
  ('aleppo_admin', 'DUMMY', 'ليلى مسؤول حلب', '0999000011', 2, 2, NULL),

  ('owner', 'DUMMY', 'مالك النظام', '0999000099', 3, NULL, NULL)
ON DUPLICATE KEY UPDATE full_name=VALUES(full_name), phone=VALUES(phone), role_id=VALUES(role_id), province_id=VALUES(province_id), department_id=VALUES(department_id);

-- Tickets demo
INSERT INTO tickets (title, description, image_url, ip_address, created_by, province_id, department_id, status_id, issue_type_id, issue_subtype_id, assigned_admin_id)
VALUES
  (
    'تعطل الطابعة',
    'الطابعة لا تطبع نهائياً وتظهر رسالة خطأ.',
    NULL,
    '192.168.1.12',
    (SELECT id FROM users WHERE username='osama'),
    1,
    (SELECT department_id FROM users WHERE username='osama'),
    1,
    1,
    (SELECT id FROM issue_subtypes WHERE code='PRINTER' LIMIT 1),
    (SELECT id FROM users WHERE username='dam_admin')
  ),
  (
    'مشكلة نظام تشغيل',
    'الجهاز بطيء جداً بعد آخر تحديث.',
    NULL,
    '192.168.1.20',
    (SELECT id FROM users WHERE username='sara'),
    1,
    (SELECT department_id FROM users WHERE username='sara'),
    2,
    2,
    (SELECT id FROM issue_subtypes WHERE code='OS' LIMIT 1),
    (SELECT id FROM users WHERE username='dam_admin')
  );
