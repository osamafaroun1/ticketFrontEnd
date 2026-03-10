export enum Role {
  CIVIL = 1,
  ADMIN = 2,
  SUPERADMIN = 3
}

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  SOLVED = 'SOLVED',
  POSTPONED = 'POSTPONED',
  CLOSED = 'CLOSED'
}

export enum CategoryType {
  HARDWARE = 'HARDWARE',
  SOFTWARE = 'SOFTWARE'
}

export interface User {
  id: number;
  username: string;
  fullName: string;
  role: Role;
  roleName?: 'CIVIL' | 'ADMIN' | 'SUPERADMIN';
  provinceId?: number; // Optional for SuperAdmin
  departmentId?: number; // Optional for Admin/SuperAdmin
  provinceName?: string;
  departmentName?: string;
  phone?: string | null;
}

export interface Ticket {
  id: number;
  title: string;
  description: string;
  imageUrl?: string | null;
  status: TicketStatus;
  statusId?: number;
  categoryType: CategoryType;
  categorySubType: string;
  issueTypeId?: number;
  issueSubtypeId?: number | null;
  userId: number;
  userName: string;
  provinceId: number;
  departmentId: number;
  provinceName: string; 
  departmentName: string;
  ipAddress?: string | null;
  createdAt: string;
}

export interface Province {
  id: number;
  name: string;
}

export interface Department {
  id: number;
  provinceId: number;
  name: string;
}

export interface IssueType {
  id: number;
  code: CategoryType;
  nameAr: string;
}

export interface IssueSubtype {
  id: number;
  issueTypeId: number;
  code: string;
  nameAr: string;
}

export interface CreateTicketPayload {
  title: string;
  description: string;
  imageUrl?: string | null;
  issueTypeId: number;
  issueSubtypeId?: number | null;
  ipAddress?: string | null;
}
