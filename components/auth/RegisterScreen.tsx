
import React, { useState } from 'react';
import { Card } from '../common/Card';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { SocialLogin } from './SocialLogin';
import { AcademicCapIcon, SparklesIcon, EnvelopeIcon, LockClosedIcon } from '../../constants';

interface RegisterScreenProps {
  onRegister: (email: string, password: string) => Promise<void>;
  onGoogleLogin?: () => Promise<void>;
  onNavigateToLogin: () => void;
  isLoading: boolean;
  error: string | null;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ 
  onRegister, 
  onGoogleLogin,
  onNavigateToLogin, 
  isLoading, 
  error 
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (password !== confirmPassword) {
      setFormError("As senhas não coincidem.");
      return;
    }
    if (password.length < 6) {
      setFormError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    
    onRegister(email, password);
  };

  return (
    <div className="min-h-[calc(100vh-250px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full" title="">
        <div className="text-center mb-8">
          <AcademicCapIcon className="w-16 h-16 text-sky-600 mx-auto mb-3"/>
          <h2 className="text-3xl font-extrabold text-slate-800 font-display">
            Criar Nova Conta
          </h2>
          <p className="mt-2 text-slate-600">
            Junte-se ao ConcursoGenius e turbine seus estudos!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            id="register-email"
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
            id="register-password"
            label="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Crie uma senha (mín. 6 caracteres)"
            autoComplete="new-password"
            required
            leftIcon={<LockClosedIcon />}
          />
          <Input
            id="confirm-password"
            label="Confirmar Senha"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirme sua senha"
            autoComplete="new-password"
            required
            leftIcon={<LockClosedIcon />}
          />
          
          {formError && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
              {formError}
            </p>
          )}
          
          {error && !formError && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
              {error}
            </p>
          )}
          
          <Button 
            type="submit" 
            isLoading={isLoading} 
            fullWidth 
            size="lg" 
            leftIcon={<SparklesIcon className="w-5 h-5"/>}
          >
            {isLoading ? 'Registrando...' : 'Registrar'}
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
          Já tem uma conta?{' '}
          <Button 
            variant="link" 
            onClick={onNavigateToLogin} 
            disabled={isLoading} 
            className="font-medium text-sky-600 hover:text-sky-700"
          >
            Faça login
          </Button>
        </p>
      </Card>
    </div>
  );
};
