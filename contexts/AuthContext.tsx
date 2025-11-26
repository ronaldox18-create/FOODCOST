
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, PlanType } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string) => boolean;
  register: (name: string, email: string, storeName: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for active session
    const storedUser = localStorage.getItem('foodcost_current_session');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (email: string): boolean => {
    // Simulating backend check
    const usersDbStr = localStorage.getItem('foodcost_users_db');
    const usersDb: User[] = usersDbStr ? JSON.parse(usersDbStr) : [];
    
    const foundUser = usersDb.find(u => u.email === email);
    
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('foodcost_current_session', JSON.stringify(foundUser));
      return true;
    }
    return false;
  };

  const register = (name: string, email: string, storeName: string) => {
    const newUser: User = {
      id: crypto.randomUUID(),
      name,
      email,
      storeName,
      plan: 'free', // Default plan
      createdAt: new Date().toISOString()
    };

    // Save to "DB"
    const usersDbStr = localStorage.getItem('foodcost_users_db');
    const usersDb: User[] = usersDbStr ? JSON.parse(usersDbStr) : [];
    usersDb.push(newUser);
    localStorage.setItem('foodcost_users_db', JSON.stringify(usersDb));

    // Auto login
    setUser(newUser);
    localStorage.setItem('foodcost_current_session', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('foodcost_current_session');
  };

  if (loading) return null;

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      register,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
