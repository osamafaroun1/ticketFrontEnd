import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { User, Ticket, TicketStatus, CreateTicketPayload } from '../types';
import {
  loginRequest, logoutRequest,
  getTickets as apiGetTickets,
  createTicketRequest,
  updateTicketStatusRequest,
  deleteTicketRequest,
} from '../api/client';

interface AppContextType {
  user: User | null;
  tickets: Ticket[];
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  createTicket: (data: CreateTicketPayload) => Promise<boolean>;
  updateStatus: (id: number, status: TicketStatus) => Promise<boolean>;
  deleteTicket: (id: number) => Promise<boolean>;
  refreshTickets: () => Promise<void>;
  loading: boolean;
  loggingOut: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('ticket_user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { localStorage.removeItem('ticket_user'); }
    }
  }, []);

  useEffect(() => {
    if (user) fetchTickets();
    else setTickets([]);
  }, [user]);

  const fetchTickets = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await apiGetTickets();
      setTickets(data);
    } catch (error) {
      toast.error('فشل في جلب التذاكر');
      if ((error as any)?.response?.status === 401) {
        setUser(null); setTickets([]);
        localStorage.removeItem('ticket_user');
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      const userData = await loginRequest(username, password);
      setUser(userData);
      localStorage.setItem('ticket_user', JSON.stringify(userData));
      toast.success(`مرحباً ${userData.fullName}، تم تسجيل الدخول بنجاح`);
      return true;
    } catch {
      toast.error('فشل تسجيل الدخول. تحقق من اسم المستخدم وكلمة المرور');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoggingOut(true);
    try {
      await logoutRequest();
    } catch {
      // continue regardless
    } finally {
      setLoggingOut(false);
    }
    setUser(null);
    setTickets([]);
    localStorage.removeItem('ticket_user');
    toast.info('تم تسجيل الخروج');
  };

  const createTicket = async (data: CreateTicketPayload): Promise<boolean> => {
    setLoading(true);
    try {
      await createTicketRequest(data);
      await fetchTickets();
      toast.success('تم إنشاء التذكرة بنجاح');
      return true;
    } catch {
      toast.error('فشل في إنشاء التذكرة');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, status: TicketStatus): Promise<boolean> => {
    setLoading(true);
    try {
      await updateTicketStatusRequest(id, status);
      setTickets((prev) => prev.map((t) => t.id === id ? { ...t, status } : t));
      const messages: Record<TicketStatus, string> = {
        [TicketStatus.OPEN]: 'تم فتح التذكرة',
        [TicketStatus.IN_PROGRESS]: 'التذكرة قيد المعالجة الآن',
        [TicketStatus.SOLVED]: 'تم حل التذكرة بنجاح',
        [TicketStatus.POSTPONED]: 'تم تأجيل التذكرة',
        [TicketStatus.CLOSED]: 'تم إغلاق التذكرة',
      };
      toast.success(messages[status]);
      return true;
    } catch {
      toast.error('فشل في تحديث حالة التذكرة');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteTicket = async (id: number): Promise<boolean> => {
    setLoading(true);
    try {
      await deleteTicketRequest(id);
      setTickets((prev) => prev.filter((t) => t.id !== id));
      toast.success('تم حذف التذكرة بنجاح');
      return true;
    } catch {
      toast.error('فشل في حذف التذكرة');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppContext.Provider value={{
      user, tickets, login, logout, createTicket,
      updateStatus, deleteTicket, refreshTickets: fetchTickets,
      loading, loggingOut,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
