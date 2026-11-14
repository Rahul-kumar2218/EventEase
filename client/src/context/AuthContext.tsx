import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isOrganizer: boolean;
  isStaff: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string, role?: string) => Promise<User>;
  logout: () => void;
  quickLoginAs: (role: 'Admin' | 'Organizer' | 'Check-in Staff' | 'Participant') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('eventease_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const storedToken = localStorage.getItem('eventease_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        if (res.data.success) {
          setUser(res.data.user);
        } else {
          logout();
        }
      } catch (err) {
        console.error('Failed to load user session', err);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.post('/auth/login', { email, password });
    const { token: receivedToken, user: receivedUser } = res.data;
    localStorage.setItem('eventease_token', receivedToken);
    setToken(receivedToken);
    setUser(receivedUser);
    return receivedUser;
  };

  const register = async (name: string, email: string, password: string, role = 'Participant'): Promise<User> => {
    const res = await api.post('/auth/register', { name, email, password, role });
    const { token: receivedToken, user: receivedUser } = res.data;
    localStorage.setItem('eventease_token', receivedToken);
    setToken(receivedToken);
    setUser(receivedUser);
    return receivedUser;
  };

  const logout = () => {
    localStorage.removeItem('eventease_token');
    setToken(null);
    setUser(null);
  };

  const quickLoginAs = async (role: 'Admin' | 'Organizer' | 'Check-in Staff' | 'Participant') => {
    let email = 'organizer@eventease.com';
    if (role === 'Check-in Staff') email = 'staff@eventease.com';
    if (role === 'Participant') email = 'participant@eventease.com';
    if (role === 'Admin') email = 'admin@eventease.com';

    try {
      await login(email, 'password123');
    } catch (e) {
      // If admin doesn't exist yet, fallback to organizer
      if (role === 'Admin') {
        await login('organizer@eventease.com', 'password123');
      } else {
        throw e;
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'Admin',
        isOrganizer: user?.role === 'Organizer' || user?.role === 'Admin',
        isStaff: user?.role === 'Check-in Staff' || user?.role === 'Organizer' || user?.role === 'Admin',
        isLoading,
        login,
        register,
        logout,
        quickLoginAs,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
