import React, { useState } from 'react';
import { Card } from '../common/Card';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { AcademicCapIcon, EnvelopeIcon, ArrowLeftIcon } from '../../constants';

interface ForgotPasswordScreenProps {
  onSendResetEmail: (email: string) => Promise<void>;
  onNavigateBack: () => void;
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ 
  onSendResetEmail, 
  onNavigateBack, 
  isLoading, 
  error,
  success 
}) => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    onSendResetEmail(email);
  };

  if (success) {
    return (
      <div className="min-h-[calc(100vh-250px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Card className="max-w-md w-full" title="">
          <div className="text-center">
            <AcademicCapIcon className="w-16 h-16 text-green-600 mx-auto mb-3"/>
            <h2 className="text-3xl font-extrabold text-slate-800 font-display mb-4">
              Email Enviado!
            </h2>
            <p className="text-slate-600 mb-8">
              Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
            </p>
            <Button 
              variant="outline" 
              onClick={onNavigateBack}
              leftIcon={<ArrowLeftIcon className="w-5 h-5" />}
              fullWidth
            >
              Voltar ao Login
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-250px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full" title="">
        <div className="text-center mb-8">
          <AcademicCapIcon className="w-16 h-16 text-sky-600 mx-auto mb-3"/>
          <h2 className="text-3xl font-extrabold text-slate-800 font-display">
            Recuperar Senha
          </h2>
          <p className="mt-2 text-slate-600">
            Digite seu email para receber instruções de recuperação
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            id="reset-email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            autoComplete="email"
            required
            leftIcon={<EnvelopeIcon />}
          />
          
          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
              {error}
            </p>
          )}
          
          <div className="space-y-4">
            <Button 
              type="submit" 
              isLoading={isLoading} 
              fullWidth 
              size="lg"
              disabled={!email.trim()}
            >
              {isLoading ? 'Enviando...' : 'Enviar Email de Recuperação'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={onNavigateBack}
              disabled={isLoading}
              leftIcon={<ArrowLeftIcon className="w-5 h-5" />}
              fullWidth
            >
              Voltar ao Login
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};