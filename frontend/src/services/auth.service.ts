import { IAuthRepository } from '@/repositories/interfaces/auth.repository.interface';
import type {    
  AuthResult, 
  AuthSession, 
  SignInCredentials, 
  SignUpCredentials 
} from '@/types/auth';

import { createComponentLogger } from '@/services/logger';

const logger = createComponentLogger('AuthService');

export class AuthService {
  constructor(private authRepository: IAuthRepository) {}

  async signIn(credentials: SignInCredentials): Promise<AuthResult<AuthSession>> {
    logger.info('AuthService: Processing sign in request', { email: credentials.email });
    
    // Validaciones adicionales del servicio si es necesario
    if (!this.isValidEmail(credentials.email)) {
      return {
        error: {
          code: 'INVALID_EMAIL_FORMAT',
          message: 'Please enter a valid email address'
        }
      };
    }

    if (!this.isValidPassword(credentials.password)) {
      return {
        error: {
          code: 'INVALID_PASSWORD_FORMAT',
          message: 'Password must be at least 6 characters long'
        }
      };
    }

    return this.authRepository.signIn(credentials);
  }

  async signUp(credentials: SignUpCredentials): Promise<AuthResult<AuthSession>> {
    logger.info('AuthService: Processing sign up request', { email: credentials.email });
    
    if (!this.isValidEmail(credentials.email)) {
      return {
        error: {
          code: 'INVALID_EMAIL_FORMAT',
          message: 'Please enter a valid email address'
        }
      };
    }

    if (!this.isValidPassword(credentials.password)) {
      return {
        error: {
          code: 'INVALID_PASSWORD_FORMAT',
          message: 'Password must be at least 6 characters long'
        }
      };
    }

    return this.authRepository.signUp(credentials);
  }

  async signOut(): Promise<AuthResult> {
    logger.info('AuthService: Processing sign out request');
    return this.authRepository.signOut();
  }

  async getCurrentSession(): Promise<AuthResult<AuthSession>> {
    return this.authRepository.getCurrentSession();
  }

  async refreshSession(): Promise<AuthResult<AuthSession>> {
    return this.authRepository.refreshSession();
  }

  onAuthStateChange(callback: (session: AuthSession | null) => void): () => void {
    return this.authRepository.onAuthStateChange(callback);
  }

  // Helper methods
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPassword(password: string): boolean {
    return password.length >= 6;
  }

  // Método para obtener mensajes de error user-friendly
  getErrorMessage(errorCode: string): string {
    const errorMessages: Record<string, string> = {
      'INVALID_CREDENTIALS': 'Invalid email or password. Please try again.',
      'EMAIL_NOT_CONFIRMED': 'Please check your email and confirm your account before signing in.',
      'USER_ALREADY_EXISTS': 'An account with this email already exists. Please sign in instead.',
      'WEAK_PASSWORD': 'Password must be at least 6 characters long.',
      'INVALID_EMAIL_FORMAT': 'Please enter a valid email address.',
      'INVALID_PASSWORD_FORMAT': 'Password must be at least 6 characters long.',
      'EMAIL_CONFIRMATION_REQUIRED': 'Please check your email to confirm your account.',
      'UNEXPECTED_ERROR': 'An unexpected error occurred. Please try again.',
      'NO_SESSION': 'Authentication failed. Please try again.',
      'NO_USER': 'Account creation failed. Please try again.',
      'SIGNOUT_FAILED': 'Failed to sign out completely. Please refresh the page.',
      'SESSION_CHECK_FAILED': 'Failed to verify your session. Please refresh the page.',
      'REFRESH_FAILED': 'Session expired. Please sign in again.',
      'REFRESH_ERROR': 'Session refresh failed. Please sign in again.',
      'AUTH_ERROR': 'Authentication error. Please try again.'
    };

    return errorMessages[errorCode] || 'An error occurred. Please try again.';
  }
}