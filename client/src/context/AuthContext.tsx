import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/index.js';
import { api } from '../lib/api.js';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from '../lib/firebase.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: { name: string; email: string; password: string }) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  demoLogin: () => Promise<void>;
  logout: () => void;
  updateUser: (updatedUser: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('exper_user') || localStorage.getItem('finora_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('exper_token') || localStorage.getItem('finora_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const verifyAuth = async () => {
      const storedToken = localStorage.getItem('exper_token') || localStorage.getItem('finora_token');
      if (storedToken) {
        try {
          const res = await api.getMe();
          if (res.success && res.user) {
            setUser(res.user);
            localStorage.setItem('exper_user', JSON.stringify(res.user));
          }
        } catch (error) {
          console.warn('Session expired or invalid:', error);
          logout();
        }
      }
      setIsLoading(false);
    };

    verifyAuth();

    const handleExternalLogout = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('finora_auth_logout', handleExternalLogout);
    return () => window.removeEventListener('finora_auth_logout', handleExternalLogout);
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    try {
      // 1. Authenticate with Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
      const fbUser = userCredential.user;

      // 2. Synchronize user profile with Supabase PostgreSQL backend
      const res = await api.firebaseSync({
        uid: fbUser.uid,
        email: fbUser.email!,
        name: fbUser.displayName || undefined,
        photoUrl: fbUser.photoURL || undefined,
      });

      if (res.success && res.token && res.user) {
        setToken(res.token);
        setUser(res.user);
        localStorage.setItem('exper_token', res.token);
        localStorage.setItem('exper_user', JSON.stringify(res.user));
        return;
      }
    } catch (fbErr: any) {
      // Fallback: If demo account (e.g. demo@exper.app) or local backend account
      const res = await api.login(credentials);
      if (res.success && res.token && res.user) {
        setToken(res.token);
        setUser(res.user);
        localStorage.setItem('exper_token', res.token);
        localStorage.setItem('exper_user', JSON.stringify(res.user));
        return;
      }
      throw fbErr;
    }
  };

  const register = async (data: { name: string; email: string; password: string }) => {
    try {
      // 1. Create account in Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      if (auth.currentUser && data.name) {
        await updateProfile(auth.currentUser, { displayName: data.name });
      }
      const fbUser = userCredential.user;

      // 2. Provision user in Supabase PostgreSQL
      const res = await api.firebaseSync({
        uid: fbUser.uid,
        email: fbUser.email!,
        name: data.name,
      });

      if (res.success && res.token && res.user) {
        setToken(res.token);
        setUser(res.user);
        localStorage.setItem('exper_token', res.token);
        localStorage.setItem('exper_user', JSON.stringify(res.user));
      }
    } catch (err: any) {
      // If Firebase failed, fallback to direct registration
      const res = await api.register(data);
      if (res.success && res.token && res.user) {
        setToken(res.token);
        setUser(res.user);
        localStorage.setItem('exper_token', res.token);
        localStorage.setItem('exper_user', JSON.stringify(res.user));
        return;
      }
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const fbUser = result.user;

    const res = await api.firebaseSync({
      uid: fbUser.uid,
      email: fbUser.email!,
      name: fbUser.displayName || undefined,
      photoUrl: fbUser.photoURL || undefined,
    });

    if (res.success && res.token && res.user) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('exper_token', res.token);
      localStorage.setItem('exper_user', JSON.stringify(res.user));
    }
  };

  const sendPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const demoLogin = async () => {
    const res = await api.demoLogin();
    if (res.success && res.token && res.user) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('exper_token', res.token);
      localStorage.setItem('exper_user', JSON.stringify(res.user));
    }
  };

  const logout = () => {
    signOut(auth).catch(() => {});
    api.logout().catch(() => {});
    setUser(null);
    setToken(null);
    localStorage.removeItem('exper_token');
    localStorage.removeItem('exper_user');
    localStorage.removeItem('finora_token');
    localStorage.removeItem('finora_user');
  };

  const updateUser = (updatedUser: Partial<User>) => {
    if (user) {
      const newUser = { ...user, ...updatedUser };
      setUser(newUser);
      localStorage.setItem('exper_user', JSON.stringify(newUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        register,
        loginWithGoogle,
        sendPasswordReset,
        demoLogin,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
