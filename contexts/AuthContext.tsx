
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { supabase } from '../src/lib/supabaseClient';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string, storeName: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check active session on load
    const checkSession = async () => {
      // Supabase v1 uses session() which is synchronous and returns Session | null
      const session = supabase.auth.session();
      
      if (session?.user) {
        await fetchUserProfile(session.user.id, session.user.email!);
      } else {
        setLoading(false);
      }
    };

    checkSession();

    // 2. Listen for auth changes
    // Supabase v1 returns { data: Subscription, error }
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await fetchUserProfile(session.user.id, session.user.email!);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      authListener?.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data) {
        setUser({
          id: data.id,
          name: data.name,
          email: data.email || email,
          storeName: data.store_name,
          plan: data.plan || 'free',
          createdAt: data.created_at
        });
      } else if (error) {
        console.error("Profile fetch error", error);
        // Fallback if profile doesn't exist yet (latency)
        setUser({
            id: userId,
            name: 'Usuário',
            email: email,
            storeName: 'Minha Loja',
            plan: 'free',
            createdAt: new Date().toISOString()
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    // Supabase v1 uses signIn
    const { error } = await supabase.auth.signIn({ email, password });
    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  const register = async (name: string, email: string, password: string, storeName: string) => {
    // Supabase v1 uses signUp with options as second argument
    const { error } = await supabase.auth.signUp(
      { email, password },
      {
        data: {
          name,
          store_name: storeName
        }
      }
    );

    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      loading
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
