import React, { 
  createContext, 
  useContext, 
  useEffect, 
  useState, 
  ReactNode, 
  useCallback,
  useMemo 
} from 'react';
import { getAuthService } from '@/services/auth.factory';
import type { AuthSession, AuthError } from '@/types/auth';
import { createComponentLogger } from '@/services/logger';

const logger = createComponentLogger('AuthContext');

interface AuthContextType {
  user: AuthSession['user'] | null;
  session: AuthSession | null;
  loading: boolean;
  error: AuthError | null;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  
  // Initialize auth service once
  // This ensures we don't create a new instance on every render
  const authService = useMemo(() => getAuthService(), []);

  const updateAuthState = useCallback((newSession: AuthSession | null) => {
    logger.info('Updating auth state', { 
      hasSession: !!newSession, 
      userEmail: newSession?.user?.email,
      //sessionId: newSession?.access_token ? 'present' : 'absent'
    });
    
    setSession(newSession);
    
    // Clear any previous errors on successful auth
    if (newSession && error) {
      setError(null);
    }
  }, [error]);

  const clearAuthState = useCallback(() => {
    logger.info('Clearing auth state');
    setSession(null);
    setError(null);
  }, []);

  const handleAuthError = useCallback((authError: AuthError, context: string) => {
    logger.error(`Auth error in ${context}`, { 
      code: authError.code, 
      message: authError.message 
    });
    setError(authError);
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    const startTime = Date.now();
    logger.info('Starting sign out process');

    try {
      // Clear local state immediately for better UX
      clearAuthState();
      setLoading(true);

      const result = await authService.signOut();
      const duration = Date.now() - startTime;

      if (result.error) {
        logger.warn('Sign out completed with warnings', { 
          error: result.error,
          duration 
        });
        
        // Even with errors, we've cleared local state
        // Don't show error to user unless it's critical
        if (result.error.code !== 'SESSION_ALREADY_INVALID') {
          handleAuthError(result.error, 'signOut');
        }
      } else {
        logger.info('Sign out completed successfully', { duration });
      }
    } catch (err) {
      const duration = Date.now() - startTime;
      const unexpectedError: AuthError = {
        code: 'UNEXPECTED_ERROR',
        message: err instanceof Error ? err.message : 'Unknown error during sign out'
      };
      
      logger.error('Unexpected error during sign out', { 
        error: unexpectedError,
        duration 
      });
      handleAuthError(unexpectedError, 'signOut');
    } finally {
      setLoading(false);
    }
  }, [authService, clearAuthState, handleAuthError]);

  const refreshSession = useCallback(async (): Promise<void> => {
    const startTime = Date.now();
    logger.info('Starting session refresh');

    try {
      setLoading(true);
      const result = await authService.refreshSession();
      const duration = Date.now() - startTime;

      if (result.error) {
        logger.error('Session refresh failed', { 
          error: result.error,
          duration 
        });
        handleAuthError(result.error, 'refreshSession');
        
        // If refresh fails, clear the session
        clearAuthState();
      } else if (result.data) {
        logger.info('Session refreshed successfully', { 
          userEmail: result.data.user?.email,
          duration 
        });
        updateAuthState(result.data);
      }
    } catch (err) {
      const duration = Date.now() - startTime;
      const unexpectedError: AuthError = {
        code: 'UNEXPECTED_ERROR',
        message: err instanceof Error ? err.message : 'Unknown error during session refresh'
      };
      
      logger.error('Unexpected error during session refresh', { 
        error: unexpectedError,
        duration 
      });
      handleAuthError(unexpectedError, 'refreshSession');
      clearAuthState();
    } finally {
      setLoading(false);
    }
  }, [authService, updateAuthState, clearAuthState, handleAuthError]);

  const clearError = useCallback(() => {
    logger.debug('Clearing auth error');
    setError(null);
  }, []);

  // Initialize auth state and set up listeners
  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | null = null;

    const initializeAuth = async () => {
      const startTime = Date.now();
      logger.info('Initializing auth context');

      try {
        // Set up auth state change listener first
        unsubscribe = authService.onAuthStateChange((newSession) => {
          if (!mounted) return;
          
          logger.debug('Auth state change detected', { 
            hasSession: !!newSession,
            userEmail: newSession?.user?.email 
          });
          
          const wasLoading = loading;
          updateAuthState(newSession);
          
          // Only set loading to false if we were loading
          if (wasLoading) {
            setLoading(false);
          }
        });

        // Get initial session
        const result = await authService.getCurrentSession();
        const duration = Date.now() - startTime;

        if (!mounted) return;

        if (result.error) {
          logger.error('Failed to get initial session', { 
            error: result.error,
            duration 
          });
          handleAuthError(result.error, 'initialization');
        } else {
          logger.info('Auth initialization completed', { 
            hasSession: !!result.data,
            userEmail: result.data?.user?.email,
            duration 
          });
          updateAuthState(result.data || null);
        }
      } catch (err) {
        const duration = Date.now() - startTime;
        const unexpectedError: AuthError = {
          code: 'UNEXPECTED_ERROR',
          message: err instanceof Error ? err.message : 'Unknown error during auth initialization'
        };
        
        logger.error('Unexpected error during auth initialization', { 
          error: unexpectedError,
          duration 
        });
        
        if (mounted) {
          handleAuthError(unexpectedError, 'initialization');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      if (unsubscribe) {
        logger.debug('Cleaning up auth state listener');
        unsubscribe();
      }
    };
  }, [authService, updateAuthState, handleAuthError, loading]);

  // Computed values
  const user = useMemo(() => session?.user || null, [session]);
  const isAuthenticated = useMemo(() => !!user && !!session, [user, session]);

  // Context value with memoization to prevent unnecessary re-renders
  const value = useMemo<AuthContextType>(() => ({
    user,
    session,
    loading,
    error,
    isAuthenticated,
    signOut,
    refreshSession,
    clearError,
  }), [
    user,
    session,
    loading,
    error,
    isAuthenticated,
    signOut,
    refreshSession,
    clearError,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};