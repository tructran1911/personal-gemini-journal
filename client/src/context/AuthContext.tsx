import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  idToken: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signInMock: (userType: 'alice' | 'bob') => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Khôi phục phiên làm việc an toàn từ session lưu trữ tạm
    const saved = sessionStorage.getItem('gemini_journal_session');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (e) {
        console.warn('Failed to restore session:', e);
      }
    }
    setLoading(false);
  }, []);

  const signInMock = (userType: 'alice' | 'bob') => {
    const mockProfiles: Record<'alice' | 'bob', UserProfile> = {
      alice: {
        uid: 'user_alice_84920',
        email: 'alice.engineer@zerotrust.security',
        displayName: 'Alice (Security Architect)',
        idToken: 'mock_token_user_alice_84920'
      },
      bob: {
        uid: 'user_bob_19384',
        email: 'bob.developer@cloudnative.dev',
        displayName: 'Bob (Frontend Lead)',
        idToken: 'mock_token_user_bob_19384'
      }
    };

    const selected = mockProfiles[userType];
    setUser(selected);
    sessionStorage.setItem('gemini_journal_session', JSON.stringify(selected));
  };

  const signOut = () => {
    setUser(null);
    sessionStorage.removeItem('gemini_journal_session');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInMock, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
