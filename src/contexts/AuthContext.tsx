import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo
const mockUsers: Record<string, User> = {
  'mandataire@demo.fr': {
    id: '1',
    email: 'mandataire@demo.fr',
    role: 'mandataire',
    mandataireId: 'm1',
    nom: 'Dupont',
    prenom: 'Marie'
  },
  'comptable@demo.fr': {
    id: '2',
    email: 'comptable@demo.fr',
    role: 'comptable',
    nom: 'Martin',
    prenom: 'Jean'
  },
  'candidat@demo.fr': {
    id: '3',
    email: 'candidat@demo.fr',
    role: 'candidat',
    mandataireId: 'm1',
    nom: 'Durand',
    prenom: 'Pierre'
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    // Auto-login as mandataire for demo
    return mockUsers['mandataire@demo.fr'];
  });

  const login = async (email: string, password: string): Promise<boolean> => {
    const foundUser = mockUsers[email];
    if (foundUser) {
      setUser(foundUser);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  const switchRole = (role: UserRole) => {
    if (role === 'mandataire') {
      setUser(mockUsers['mandataire@demo.fr']);
    } else if (role === 'comptable') {
      setUser(mockUsers['comptable@demo.fr']);
    } else {
      setUser(mockUsers['candidat@demo.fr']);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
