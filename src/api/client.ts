import axios from 'axios';
import { CategoryType, CreateTicketPayload, IssueSubtype, IssueType, Role, Ticket, TicketStatus, User } from '../types';

export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

export const api = axios.create({ baseURL: API_BASE });

type RetriableConfig = { _retry?: boolean; headers?: Record<string, string> };

type LoginResponse = {
  accessToken: string; refreshToken: string;
  user: {
    id: number; username: string; fullName: string; phone: string | null;
    roleId: number; roleName: 'CIVIL' | 'ADMIN' | 'SUPERADMIN';
    provinceId: number | null; provinceName: string | null;
    departmentId: number | null; departmentName: string | null;
  };
};

type TicketApiRow = {
  id: number; title: string; description: string;
  imageUrl: string | null; ipAddress: string | null; createdAt: string;
  createdById: number; createdByFullName: string;
  provinceId: number; provinceName: string;
  departmentId: number; departmentName: string;
  statusId: number; statusCode: TicketStatus;
  issueTypeId: number; issueTypeCode: CategoryType;
  issueSubtypeId: number | null; issueSubtypeNameAr: string | null;
};

export type TicketFilters = {
  statusId?: number; provinceId?: number; departmentId?: number;
  issueTypeId?: number; dateFrom?: string; dateTo?: string;
};

const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

const mapRole = (id: number): Role => id === 1 ? Role.CIVIL : id === 2 ? Role.ADMIN : Role.SUPERADMIN;

const mapUser = (p: LoginResponse['user']): User => ({
  id: p.id, username: p.username, fullName: p.fullName, phone: p.phone,
  role: mapRole(p.roleId), roleName: p.roleName,
  provinceId: p.provinceId ?? undefined, provinceName: p.provinceName ?? undefined,
  departmentId: p.departmentId ?? undefined, departmentName: p.departmentName ?? undefined,
});

const mapTicket = (t: TicketApiRow): Ticket => ({
  id: t.id, title: t.title, description: t.description,
  imageUrl: t.imageUrl, ipAddress: t.ipAddress, createdAt: t.createdAt,
  userId: t.createdById, userName: t.createdByFullName,
  provinceId: t.provinceId, provinceName: t.provinceName,
  departmentId: t.departmentId, departmentName: t.departmentName,
  status: t.statusCode, statusId: t.statusId,
  categoryType: t.issueTypeCode,
  categorySubType: t.issueSubtypeNameAr || t.issueTypeCode,
  issueTypeId: t.issueTypeId, issueSubtypeId: t.issueSubtypeId,
});

const refreshAccessToken = async () => {
  const rt = localStorage.getItem('refreshToken');
  if (!rt) throw new Error('Missing refresh token');
  const r = await axios.post<{ accessToken: string }>(`${API_BASE}/auth/refresh`, { refreshToken: rt });
  localStorage.setItem('accessToken', r.data.accessToken);
  return r.data.accessToken;
};

api.interceptors.request.use((config) => {
  const at = localStorage.getItem('accessToken');
  if (at) { config.headers = config.headers || {}; config.headers.Authorization = `Bearer ${at}`; }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const orig = (error.config || {}) as RetriableConfig;
    if (error.response?.status === 401 && !orig._retry && localStorage.getItem('refreshToken')) {
      orig._retry = true;
      try {
        const at = await refreshAccessToken();
        orig.headers = orig.headers || {};
        orig.headers.Authorization = `Bearer ${at}`;
        return api(orig);
      } catch { clearTokens(); }
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export async function loginRequest(username: string, password: string) {
  const r = await api.post<LoginResponse>('/auth/login', { username, password });
  localStorage.setItem('accessToken', r.data.accessToken);
  localStorage.setItem('refreshToken', r.data.refreshToken);
  return mapUser(r.data.user);
}

export async function logoutRequest() {
  const rt = localStorage.getItem('refreshToken');
  try { if (rt) await api.post('/auth/logout', { refreshToken: rt }); }
  finally { clearTokens(); }
}

// ── Tickets ───────────────────────────────────────────────────────────────────
export async function getTickets(filters?: TicketFilters) {
  const params: Record<string, string | number> = {};
  if (filters?.statusId)     params.statusId     = filters.statusId;
  if (filters?.provinceId)   params.provinceId   = filters.provinceId;
  if (filters?.departmentId) params.departmentId = filters.departmentId;
  if (filters?.issueTypeId)  params.issueTypeId  = filters.issueTypeId;
  if (filters?.dateFrom)     params.dateFrom     = filters.dateFrom;
  if (filters?.dateTo)       params.dateTo       = filters.dateTo;
  const r = await api.get<TicketApiRow[]>('/tickets', { params });
  return r.data.map(mapTicket);
}

export async function createTicketRequest(payload: CreateTicketPayload) {
  await api.post('/tickets', payload);
}

export async function deleteTicketRequest(ticketId: number) {
  await api.delete(`/tickets/${ticketId}`);
}

/**
 * Convert a File to base64 data URI — stored directly in the DB.
 * No server upload needed, works perfectly on Render.
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

const statusToId: Record<TicketStatus, number> = {
  [TicketStatus.OPEN]: 1, [TicketStatus.IN_PROGRESS]: 2,
  [TicketStatus.SOLVED]: 3, [TicketStatus.POSTPONED]: 4, [TicketStatus.CLOSED]: 5,
};

export async function updateTicketStatusRequest(ticketId: number, status: TicketStatus) {
  await api.patch(`/tickets/${ticketId}/status`, { statusId: statusToId[status] });
}

// ── Meta ──────────────────────────────────────────────────────────────────────
export async function getIssueTypes() {
  const r = await api.get<IssueType[]>('/meta/issue-types');
  return r.data;
}

export async function getIssueSubtypes(issueTypeId: number) {
  const r = await api.get<IssueSubtype[]>('/meta/issue-subtypes', { params: { issueTypeId } });
  return r.data;
}

export async function getProvinces() {
  const r = await api.get<{ id: number; name: string }[]>('/meta/provinces');
  return r.data;
}

export async function getDepartments(provinceId: number) {
  const r = await api.get<{ id: number; provinceId: number; name: string }[]>('/meta/departments', {
    params: { provinceId },
  });
  return r.data;
}

export async function fetchPublicIp() {
  try {
    const r = await fetch('https://api.ipify.org?format=json');
    const d = (await r.json()) as { ip?: string };
    return d.ip || null;
  } catch { return null; }
}
