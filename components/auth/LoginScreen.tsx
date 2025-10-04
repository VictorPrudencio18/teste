
import React, { useState } from 'react';
import { Card } from '../common/Card';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { SocialLogin } from './SocialLogin';
import { AcademicCapIcon, SparklesIcon, EnvelopeIcon, LockClosedIcon } from '../../constants';

interface LoginScreenProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onGoogleLogin?: () => Promise<void>;
  onNavigateToRegister: () => void;
  onNavigateToForgotPassword?: () => void;
  isLoading: boolean;
  error: string | null;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ 
  onLogin, 
  onGoogleLogin,
  onNavigateToRegister, 
  onNavigateToForgotPassword,
  isLoading, 
  error 
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <div className="min-h-[calc(100vh-250px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full" title="">
        <div className="text-center mb-8">
          <AcademicCapIcon className="w-16 h-16 text-sky-600 mx-auto mb-3"/>
          <h2 className="text-3xl font-extrabold text-slate-800 font-display">
            Acessar sua Conta
          </h2>
          <p className="mt-2 text-slate-600">
            Bem-vindo(a) de volta ao ConcursoGenius!
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            autoComplete="email"
            required
            leftIcon={<EnvelopeIcon />} 
          />
          <Input
            id="password"
            label="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Sua senha"
            autoComplete="current-password"
            required
            leftIcon={<LockClosedIcon />} 
          />
          
          {onNavigateToForgotPassword && (
            <div className="flex justify-end">
              <Button 
                variant="link" 
                onClick={onNavigateToForgotPassword}
                disabled={isLoading}
                className="text-sm text-sky-600 hover:text-sky-700"
              >
                Esqueceu sua senha?
              </Button>
            </div>
          )}
          
          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
              {error}
            </p>
          )}
          
          <Button 
            type="submit" 
            isLoading={isLoading} 
            fullWidth 
            size="lg" 
            leftIcon={<SparklesIcon className="w-5 h-5" />}
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        {onGoogleLogin && (
          <div className="mt-6">
            <SocialLogin
              onGoogleLogin={onGoogleLogin}
              isLoading={isLoading}
              disabled={isLoading}
            />
          </div>
        )}
        
        <p className="mt-8 text-center text-sm text-slate-600">
          Não tem uma conta?{' '}
          <Button 
            variant="link" 
            onClick={onNavigateToRegister} 
            disabled={isLoading} 
            className="font-medium text-sky-600 hover:text-sky-700"
          >
            Crie uma agora
          </Button>
        </p>
      </Card>
    </div>
  );
};
