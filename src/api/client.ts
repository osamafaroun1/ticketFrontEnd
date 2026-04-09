import axios from 'axios';
import { CategoryType, CreateTicketPayload, IssueSubtype, IssueType, Role, Ticket, TicketStatus, User } from '../types';

export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

export const api = axios.create({
  baseURL: API_BASE,
});

type RetriableConfig = {
  _retry?: boolean;
  headers?: Record<string, string>;
};

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    username: string;
    fullName: string;
    phone: string | null;
    roleId: number;
    roleName: 'CIVIL' | 'ADMIN' | 'SUPERADMIN';
    provinceId: number | null;
    provinceName: string | null;
    departmentId: number | null;
    departmentName: string | null;
  };
};

type TicketApiRow = {
  id: number;
  title: string;
  description: string;
  imageUrl: string | null;
  ipAddress: string | null;
  createdAt: string;
  createdById: number;
  createdByFullName: string;
  provinceId: number;
  provinceName: string;
  departmentId: number;
  departmentName: string;
  statusId: number;
  statusCode: TicketStatus;
  issueTypeId: number;
  issueTypeCode: CategoryType;
  issueSubtypeId: number | null;
  issueSubtypeNameAr: string | null;
};

export type TicketFilters = {
  statusId?: number;
  provinceId?: number;
  departmentId?: number;
  issueTypeId?: number;
  dateFrom?: string;
  dateTo?: string;
};

const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

const mapRole = (roleId: number): Role => {
  if (roleId === 1) return Role.CIVIL;
  if (roleId === 2) return Role.ADMIN;
  return Role.SUPERADMIN;
};

const mapUser = (payload: LoginResponse['user']): User => ({
  id: payload.id,
  username: payload.username,
  fullName: payload.fullName,
  phone: payload.phone,
  role: mapRole(payload.roleId),
  roleName: payload.roleName,
  provinceId: payload.provinceId ?? undefined,
  provinceName: payload.provinceName ?? undefined,
  departmentId: payload.departmentId ?? undefined,
  departmentName: payload.departmentName ?? undefined,
});

const mapTicket = (ticket: TicketApiRow): Ticket => ({
  id: ticket.id,
  title: ticket.title,
  description: ticket.description,
  imageUrl: ticket.imageUrl,
  ipAddress: ticket.ipAddress,
  createdAt: ticket.createdAt,
  userId: ticket.createdById,
  userName: ticket.createdByFullName,
  provinceId: ticket.provinceId,
  provinceName: ticket.provinceName,
  departmentId: ticket.departmentId,
  departmentName: ticket.departmentName,
  status: ticket.statusCode,
  statusId: ticket.statusId,
  categoryType: ticket.issueTypeCode,
  categorySubType: ticket.issueSubtypeNameAr || ticket.issueTypeCode,
  issueTypeId: ticket.issueTypeId,
  issueSubtypeId: ticket.issueSubtypeId,
});

const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) throw new Error('Missing refresh token');
  const response = await axios.post<{ accessToken: string }>(`${API_BASE}/auth/refresh`, { refreshToken });
  localStorage.setItem('accessToken', response.data.accessToken);
  return response.data.accessToken;
};

api.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem('accessToken');
  if (accessToken) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = (error.config || {}) as RetriableConfig;
    if (error.response?.status === 401 && !originalRequest._retry && localStorage.getItem('refreshToken')) {
      originalRequest._retry = true;
      try {
        const accessToken = await refreshAccessToken();
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        clearTokens();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export async function loginRequest(username: string, password: string) {
  const response = await api.post<LoginResponse>('/auth/login', { username, password });
  localStorage.setItem('accessToken', response.data.accessToken);
  localStorage.setItem('refreshToken', response.data.refreshToken);
  return mapUser(response.data.user);
}

export async function logoutRequest() {
  const refreshToken = localStorage.getItem('refreshToken');
  try {
    if (refreshToken) await api.post('/auth/logout', { refreshToken });
  } finally {
    clearTokens();
  }
}

export async function getTickets(filters?: TicketFilters) {
  const params: Record<string, string | number> = {};
  if (filters?.statusId) params.statusId = filters.statusId;
  if (filters?.provinceId) params.provinceId = filters.provinceId;
  if (filters?.departmentId) params.departmentId = filters.departmentId;
  if (filters?.issueTypeId) params.issueTypeId = filters.issueTypeId;
  if (filters?.dateFrom) params.dateFrom = filters.dateFrom;
  if (filters?.dateTo) params.dateTo = filters.dateTo;

  const response = await api.get<TicketApiRow[]>('/tickets', { params });
  return response.data.map(mapTicket);
}

export async function createTicketRequest(payload: CreateTicketPayload) {
  await api.post('/tickets', payload);
}

export async function deleteTicketRequest(ticketId: number) {
  await api.delete(`/tickets/${ticketId}`);
}

const statusToId: Record<TicketStatus, number> = {
  [TicketStatus.OPEN]: 1,
  [TicketStatus.IN_PROGRESS]: 2,
  [TicketStatus.SOLVED]: 3,
  [TicketStatus.POSTPONED]: 4,
  [TicketStatus.CLOSED]: 5,
};

export async function updateTicketStatusRequest(ticketId: number, status: TicketStatus) {
  await api.patch(`/tickets/${ticketId}/status`, { statusId: statusToId[status] });
}

export async function getIssueTypes() {
  const response = await api.get<IssueType[]>('/meta/issue-types');
  return response.data;
}

export async function getIssueSubtypes(issueTypeId: number) {
  const response = await api.get<IssueSubtype[]>('/meta/issue-subtypes', {
    params: { issueTypeId },
  });
  return response.data;
}

export async function getProvinces() {
  const response = await api.get<{ id: number; name: string }[]>('/meta/provinces');
  return response.data;
}

export async function getDepartments(provinceId: number) {
  const response = await api.get<{ id: number; provinceId: number; name: string }[]>('/meta/departments', {
    params: { provinceId },
  });
  return response.data;
}

export async function fetchPublicIp() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = (await response.json()) as { ip?: string };
    return data.ip || null;
  } catch {
    return null;
  }
}