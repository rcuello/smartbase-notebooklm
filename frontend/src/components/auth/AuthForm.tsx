
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { createComponentLogger } from '@/services/logger';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

const logger = createComponentLogger('AuthForm');


const AuthForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      //console.log('User is authenticated, redirecting to dashboard');
      logger.info('User already authenticated, redirecting', { email });
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate, email]);

  // Limpiar errores cuando el usuario escribe
  const clearError = (field: string) => {
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Validación simple
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      logger.warn('Form validation failed');
      return;
    }
    setLoading(true);
    setErrors({}); // Reset errors on new submission

    const startTime = Date.now();
    logger.info('Sign in attempt started', { email });

    try {
      //console.log('Attempting sign in for:', email);
      
      
      
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      const duration = Date.now() - startTime;
      
      
      if (error) {
        logger.error('Sign in failed', { 
          email, 
          error: error.message, 
          duration 
        });

        let errorMessage = 'Sign in failed. Please try again.';
        
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please check your email and confirm your account';
        }

        setErrors({ general: errorMessage });
        toast({
          title: "Sign In Error",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }
      
      //console.log('Sign in successful:', data.user?.email);
      logger.info('Sign in successful', { 
        email, 
        userId: data.user?.id,
        duration 
      });
      
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });

      // The AuthContext will handle the redirect automatically
      
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error('Unexpected sign in error', { 
        email, 
        error: error instanceof Error ? error.message : 'Unknown error',
        duration 
      });

      setErrors({ general: 'An unexpected error occurred. Please try again.' });
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>
          Enter your credentials to access your notebooks
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                  setEmail(e.target.value);
                  clearError('email');
                }
              }
              required
              placeholder="Enter your email"
              disabled={loading}
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearError('password');
                }}
                required
                placeholder="Enter your password"
                disabled={loading}
                className={`pr-10 ${errors.password ? "border-red-500" : ""}`}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AuthForm;
