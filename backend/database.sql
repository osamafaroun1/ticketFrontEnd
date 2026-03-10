-- Database Schema

CREATE DATABASE IF NOT EXISTS ticket_system;
USE ticket_system;

-- 1. Roles
CREATE TABLE roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE -- 'CIVIL', 'ADMIN', 'SUPERADMIN'
);

-- 2. Provinces (المحافظات)
CREATE TABLE provinces (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL
);

-- 3. Departments (الدوائر)
CREATE TABLE departments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    province_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    FOREIGN KEY (province_id) REFERENCES provinces(id) ON DELETE CASCADE
);

-- 4. Users
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- Hashed password
    full_name VARCHAR(200) NOT NULL,
    phone VARCHAR(20),
    role_id INT NOT NULL,
    province_id INT, -- Nullable for SuperAdmin if they don't belong to one
    department_id INT, -- Nullable for Admins/SuperAdmins
    refresh_token VARCHAR(500),
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (province_id) REFERENCES provinces(id),
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- 5. Ticket Statuses
CREATE TABLE ticket_statuses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL -- 'OPEN', 'IN_PROGRESS', 'SOLVED', 'POSTPONED', 'CLOSED'
);

-- 6. Ticket Categories (Hardware/Software is the type, sub_type is specific)
CREATE TABLE ticket_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    type ENUM('HARDWARE', 'SOFTWARE') NOT NULL,
    name VARCHAR(100) NOT NULL -- 'Screen', 'Printer', 'OS', 'Network', etc.
);

-- 7. Tickets
CREATE TABLE tickets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    image_url VARCHAR(500),
    user_id INT NOT NULL,
    province_id INT NOT NULL, -- Copied from user for easy filtering
    department_id INT NOT NULL, -- Copied from user
    status_id INT DEFAULT 1,
    category_id INT NOT NULL,
    ip_address VARCHAR(45), -- IPv6 compatible
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (province_id) REFERENCES provinces(id),
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (status_id) REFERENCES ticket_statuses(id),
    FOREIGN KEY (category_id) REFERENCES ticket_categories(id)
);

-- SEED DATA (بيانات وهمية)

INSERT INTO roles (id, name) VALUES (1, 'CIVIL'), (2, 'ADMIN'), (3, 'SUPERADMIN');

INSERT INTO provinces (id, name) VALUES (1, 'Damascus'), (2, 'Aleppo'), (3, 'Homs');

INSERT INTO departments (id, province_id, name) VALUES 
(1, 1, 'Rukn Al-Din'), (2, 1, 'Al-Midan'), -- Damascus
(3, 2, 'Al-Jamilia'), -- Aleppo
(4, 3, 'Al-Wer'); -- Homs

INSERT INTO ticket_statuses (id, name) VALUES (1, 'OPEN'), (2, 'IN_PROGRESS'), (3, 'SOLVED'), (4, 'POSTPONED'), (5, 'CLOSED');

INSERT INTO ticket_categories (type, name) VALUES 
('HARDWARE', 'Screen'), ('HARDWARE', 'Printer'), ('HARDWARE', 'CPU/Case'), ('HARDWARE', 'Cashier'),
('SOFTWARE', 'Operating System'), ('SOFTWARE', 'Internet/Network'), ('SOFTWARE', 'Application Error');

-- Users (Password is '123456' hashed ideally, but plain here for demo reference)
-- 1. Civil Employee in Damascus (Rukn Al-Din)
INSERT INTO users (username, password, full_name, role_id, province_id, department_id) 
VALUES ('osama', '$2b$10$...', 'Osama Al-Civil', 1, 1, 1);

-- 2. Admin in Damascus
INSERT INTO users (username, password, full_name, role_id, province_id, department_id) 
VALUES ('admin_damascus', '$2b$10$...', 'Admin Damascus', 2, 1, null);

-- 3. Super Admin
INSERT INTO users (username, password, full_name, role_id, province_id, department_id) 
VALUES ('owner', '$2b$10$...', 'The Owner', 3, null, null);
