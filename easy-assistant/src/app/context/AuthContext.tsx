import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { ApiError, fetchAuthSession, loginWithApi, logoutWithApi, signupWithApi } from '../api';
import type { AuthSession, SignupInput } from '../api';

interface AuthContextType {
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthSession>;
  signup: (input: SignupInput) => Promise<AuthSession>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<AuthSession | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async (): Promise<AuthSession | null> => {
    setIsLoading(true);

    try {
      const nextSession = await fetchAuthSession();
      setSession(nextSession);
      return nextSession;
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403 || error.status === 404)) {
        setSession(null);
        return null;
      }

      setSession(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const login = useCallback(async (email: string, password: string): Promise<AuthSession> => {
    const nextSession = await loginWithApi({ email, password });
    setSession(nextSession);
    return nextSession;
  }, []);

  const signup = useCallback(async (input: SignupInput): Promise<AuthSession> => {
    const nextSession = await signupWithApi(input);
    setSession(nextSession);
    return nextSession;
  }, []);

  const logout = useCallback(async () => {
    setSession(null);

    try {
      await logoutWithApi();
    } catch {
      // Best effort logout; local session state is cleared immediately.
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        isAuthenticated: session !== null,
        isLoading,
        login,
        signup,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
