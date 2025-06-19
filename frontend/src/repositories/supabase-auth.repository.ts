import { supabase } from '@/integrations/supabase/client';
import { IAuthRepository } from '@/repositories/interfaces/auth.repository.interface';

import type { 
  AuthResult, 
  AuthSession, 
  SignInCredentials, 
  SignUpCredentials,
  AuthUser,
  AuthError 
} from '@/types/auth';

import { createComponentLogger } from '@/services/logger';

const logger = createComponentLogger('SupabaseAuthRepository');

export class SupabaseAuthRepository implements IAuthRepository {
  async signIn(credentials: SignInCredentials): Promise<AuthResult<AuthSession>> {
    const startTime = Date.now();
    logger.info('Sign in attempt started', { email: credentials.email });

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      const duration = Date.now() - startTime;

      if (error) {
        logger.error('Sign in failed', {
          email: credentials.email,
          error: error.message,
          duration,
          errorCode: error.status
        });

        return {
          error: this.mapSupabaseError(error)
        };
      }

      if (!data.user || !data.session) {
        logger.error('Sign in failed - no user or session returned', {
          email: credentials.email,
          duration
        });

        return {
          error: {
            code: 'NO_SESSION',
            message: 'Authentication failed - no session created'
          }
        };
      }

      const authSession = this.mapToAuthSession(data.session, data.user);
      
      logger.info('Sign in successful', {
        email: credentials.email,
        userId: data.user.id,
        duration
      });

      return { data: authSession };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Unexpected sign in error', {
        email: credentials.email,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration
      });

      return {
        error: {
          code: 'UNEXPECTED_ERROR',
          message: 'An unexpected error occurred during sign in'
        }
      };
    }
  }

  async signUp(credentials: SignUpCredentials): Promise<AuthResult<AuthSession>> {
    const startTime = Date.now();
    logger.info('Sign up attempt started', { email: credentials.email });

    try {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
      });

      const duration = Date.now() - startTime;

      if (error) {
        logger.error('Sign up failed', {
          email: credentials.email,
          error: error.message,
          duration
        });

        return {
          error: this.mapSupabaseError(error)
        };
      }

      if (!data.user) {
        logger.error('Sign up failed - no user returned', {
          email: credentials.email,
          duration
        });

        return {
          error: {
            code: 'NO_USER',
            message: 'Sign up failed - no user created'
          }
        };
      }

      logger.info('Sign up successful', {
        email: credentials.email,
        userId: data.user.id,
        duration,
        needsConfirmation: !data.session
      });

      // Si hay sesión, el usuario se registró y logueó automáticamente
      if (data.session) {
        const authSession = this.mapToAuthSession(data.session, data.user);
        return { data: authSession };
      }

      // Si no hay sesión, necesita confirmar email
      return {
        error: {
          code: 'EMAIL_CONFIRMATION_REQUIRED',
          message: 'Please check your email to confirm your account'
        }
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Unexpected sign up error', {
        email: credentials.email,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration
      });

      return {
        error: {
          code: 'UNEXPECTED_ERROR',
          message: 'An unexpected error occurred during sign up'
        }
      };
    }
  }

  async signOut(): Promise<AuthResult> {
    logger.info('Sign out attempt started');

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        logger.warn('Sign out error from server', { error: error.message });
        
        // Si la sesión ya no existe en el servidor, consideramos exitoso
        if (error.message.includes('session_not_found') || 
            error.message.includes('Session not found') ||
            error.status === 403) {
          logger.info('Session already invalid on server - sign out successful');
          return {};
        }

        // Para otros errores, intentamos limpiar localmente
        await supabase.auth.signOut({ scope: 'local' });
        logger.info('Local sign out successful despite server error');
        return {};
      }

      logger.info('Sign out successful');
      return {};
    } catch (error) {
      logger.error('Unexpected sign out error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Intentar limpiar sesión local como fallback
      try {
        await supabase.auth.signOut({ scope: 'local' });
        logger.info('Fallback local sign out successful');
        return {};
      } catch (localError) {
        logger.error('Failed to clear local session', {
          error: localError instanceof Error ? localError.message : 'Unknown error'
        });
        
        return {
          error: {
            code: 'SIGNOUT_FAILED',
            message: 'Failed to sign out completely'
          }
        };
      }
    }
  }

  async getCurrentSession(): Promise<AuthResult<AuthSession>> {
    logger.debug('Getting current session');

    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        logger.error('Error getting current session', { error: error.message });
        
        if (error.message.includes('session_not_found') || 
            error.message.includes('Session not found')) {
          return {}; // No error, just no session
        }

        return {
          error: this.mapSupabaseError(error)
        };
      }

      if (!session) {
        logger.debug('No current session found');
        return {};
      }

      const authSession = this.mapToAuthSession(session, session.user);
      logger.debug('Current session retrieved', { userId: session.user.id });
      
      return { data: authSession };
    } catch (error) {
      logger.error('Unexpected error getting current session', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        error: {
          code: 'SESSION_CHECK_FAILED',
          message: 'Failed to check current session'
        }
      };
    }
  }

  async refreshSession(): Promise<AuthResult<AuthSession>> {
    logger.debug('Refreshing session');

    try {
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        logger.error('Session refresh failed', { error: error.message });
        return {
          error: this.mapSupabaseError(error)
        };
      }

      if (!data.session || !data.user) {
        logger.error('Session refresh failed - no session returned');
        return {
          error: {
            code: 'REFRESH_FAILED',
            message: 'Failed to refresh session'
          }
        };
      }

      const authSession = this.mapToAuthSession(data.session, data.user);
      logger.debug('Session refreshed successfully', { userId: data.user.id });
      
      return { data: authSession };
    } catch (error) {
      logger.error('Unexpected error refreshing session', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        error: {
          code: 'REFRESH_ERROR',
          message: 'Unexpected error during session refresh'
        }
      };
    }
  }

  onAuthStateChange(callback: (session: AuthSession | null) => void): () => void {
    logger.debug('Setting up auth state change listener');

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        logger.debug('Auth state changed', { 
          event, 
          hasSession: !!session,
          userId: session?.user?.id 
        });

        if (session && session.user) {
          const authSession = this.mapToAuthSession(session, session.user);
          callback(authSession);
        } else {
          callback(null);
        }
      }
    );

    return () => {
      logger.debug('Unsubscribing from auth state changes');
      subscription.unsubscribe();
    };
  }

  private mapToAuthSession(session: any, user: any): AuthSession {
    return {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresAt: session.expires_at * 1000, // Convert to milliseconds
      user: {
        id: user.id,
        email: user.email,
        emailConfirmed: user.email_confirmed_at !== null,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    };
  }

  private mapSupabaseError(error: any): AuthError {
    const errorMap: Record<string, { code: string; message: string }> = {
      'Invalid login credentials': {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password'
      },
      'Email not confirmed': {
        code: 'EMAIL_NOT_CONFIRMED',
        message: 'Please check your email and confirm your account'
      },
      'User already registered': {
        code: 'USER_ALREADY_EXISTS',
        message: 'An account with this email already exists'
      },
      'Password should be at least 6 characters': {
        code: 'WEAK_PASSWORD',
        message: 'Password must be at least 6 characters long'
      }
    };

    const mapped = errorMap[error.message];
    if (mapped) {
      return mapped;
    }

    // Fallback para errores no mapeados
    return {
      code: 'AUTH_ERROR',
      message: error.message || 'Authentication error occurred',
      details: { originalError: error }
    };
  }
}