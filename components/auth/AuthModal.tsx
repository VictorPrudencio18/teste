import React, { useState } from 'react';
import { LoginScreen } from './LoginScreen';
import { RegisterScreen } from './RegisterScreen';
import { ForgotPasswordScreen } from './ForgotPasswordScreen';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (email: string, password: string) => Promise<void>;
  onGoogleLogin?: () => Promise<void>;
  onForgotPassword?: (email: string) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

type AuthMode = 'login' | 'register' | 'forgot-password';

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  onLogin, 
  onRegister, 
  onGoogleLogin,
  onForgotPassword,
  isLoading = false, 
  error = null 
}) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);

  if (!isOpen) return null;

  const handleForgotPassword = async (email: string) => {
    if (onForgotPassword) {
      await onForgotPassword(email);
      setForgotPasswordSuccess(true);
    }
  };

  const handleBackToLogin = () => {
    setMode('login');
    setForgotPasswordSuccess(false);
  };

  const renderContent = () => {
    switch (mode) {
      case 'login':
        return (
          <LoginScreen
            onLogin={onLogin}
            onGoogleLogin={onGoogleLogin}
            onNavigateToRegister={() => setMode('register')}
            onNavigateToForgotPassword={() => setMode('forgot-password')}
            isLoading={isLoading}
            error={error}
          />
        );
      case 'register':
        return (
          <RegisterScreen
            onRegister={onRegister}
            onGoogleLogin={onGoogleLogin}
            onNavigateToLogin={() => setMode('login')}
            isLoading={isLoading}
            error={error}
          />
        );
      case 'forgot-password':
        return (
          <ForgotPasswordScreen
            onSendResetEmail={handleForgotPassword}
            onNavigateBack={handleBackToLogin}
            isLoading={isLoading}
            error={error}
            success={forgotPasswordSuccess}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg">
        {renderContent()}
      </div>
    </div>
  );
};

export default AuthModal;
