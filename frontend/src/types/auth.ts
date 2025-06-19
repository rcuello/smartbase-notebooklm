export interface AuthUser {
  id: string;
  email: string;
  emailConfirmed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: AuthUser;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials {
  email: string;
  password: string;
}

export interface AuthResult<T = void> {
  data?: T;
  error?: AuthError;
}

export interface AuthError {
  code: string;
  message: string;
  details?: Record<string, any>;
}