import { SignInCredentials,SignUpCredentials,AuthSession,AuthResult } from "@/types/auth";


export interface IAuthRepository {
  signIn(credentials: SignInCredentials): Promise<AuthResult<AuthSession>>;
  signUp(credentials: SignUpCredentials): Promise<AuthResult<AuthSession>>;
  signOut(): Promise<AuthResult>;
  getCurrentSession(): Promise<AuthResult<AuthSession>>;
  refreshSession(): Promise<AuthResult<AuthSession>>;
  onAuthStateChange(callback: (session: AuthSession | null) => void): () => void;
}