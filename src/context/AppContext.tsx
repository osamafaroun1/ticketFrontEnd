import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Ticket, TicketStatus, CreateTicketPayload } from '../types';
import { 
  loginRequest,
  logoutRequest,
  getTickets as apiGetTickets,
  createTicketRequest,
  updateTicketStatusRequest,
} from '../api/client';

interface AppContextType {
  user: User | null;
  tickets: Ticket[];
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  createTicket: (data: CreateTicketPayload) => Promise<void>;
  updateStatus: (id: number, status: TicketStatus) => Promise<void>;
  refreshTickets: () => Promise<void>;
  loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Load user from local storage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('ticket_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Fetch tickets whenever user changes
  useEffect(() => {
    if (user) {
      fetchTickets();
    } else {
      setTickets([]);
    }
  }, [user]);

  const fetchTickets = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await apiGetTickets();
      setTickets(data);
    } catch (error) {
      console.error("Error fetching tickets", error);
      if ((error as { response?: { status?: number } })?.response?.status === 401) {
        setUser(null);
        setTickets([]);
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
      if (userData) {
        setUser(userData);
        localStorage.setItem('ticket_user', JSON.stringify(userData));
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await logoutRequest();
    setUser(null);
    setTickets([]);
    localStorage.removeItem('ticket_user');
  };

  const createTicket = async (data: CreateTicketPayload) => {
    if (!user) return;
    setLoading(true);
    try {
      await createTicketRequest(data);
      // Re-fetch tickets to update the list immediately
      await fetchTickets();
    } catch (e) {
      console.error("Error creating ticket", e);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, status: TicketStatus) => {
    setLoading(true);
    try {
      await updateTicketStatusRequest(id, status);
      // Re-fetch to sync state
      await fetchTickets();
    } catch (e) {
      console.error("Error updating status", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppContext.Provider value={{ 
      user, 
      tickets, 
      login, 
      logout, 
      createTicket, 
      updateStatus, 
      refreshTickets: fetchTickets,
      loading 
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
