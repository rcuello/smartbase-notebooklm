import { SupabaseAuthRepository } from '@/repositories/supabase-auth.repository';
import { AuthService } from '@/services/auth.service';

// Factory para crear instancias del servicio de auth
export const createAuthService = (): AuthService => {
  const authRepository = new SupabaseAuthRepository();
  return new AuthService(authRepository);
};

// Singleton instance
let authServiceInstance: AuthService | null = null;

export const getAuthService = (): AuthService => {
  if (!authServiceInstance) {
    authServiceInstance = createAuthService();
  }
  return authServiceInstance;
};