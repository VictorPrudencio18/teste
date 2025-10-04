
import React, { useState } from 'react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { SocialLogin } from './SocialLogin';
import { AcademicCapIcon, SparklesIcon, EnvelopeIcon, LockClosedIcon, EyeIcon } from '../../constants';

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
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Lado esquerdo - Imagem/Branding */}
      <div className="hidden md:flex md:w-2/5 lg:w-1/2 bg-gradient-to-br from-sky-600 via-blue-700 to-indigo-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 flex flex-col justify-center px-6 lg:px-12 text-white">
          <div className="mb-6 lg:mb-8">
            <AcademicCapIcon className="w-16 h-16 lg:w-20 lg:h-20 text-white mb-4 lg:mb-6"/>
            <h1 className="text-3xl lg:text-5xl font-bold mb-3 lg:mb-4">
              ConcursoGenius
            </h1>
            <p className="text-lg lg:text-xl text-blue-100 leading-relaxed">
              Sua plataforma inteligente para estudos de concursos públicos.
              Organize, estude e conquiste sua aprovação.
            </p>
          </div>
          <div className="space-y-3 lg:space-y-4 text-blue-100">
            <div className="flex items-center space-x-3">
              <SparklesIcon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm lg:text-base">Planos de estudo personalizados</span>
            </div>
            <div className="flex items-center space-x-3">
              <SparklesIcon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm lg:text-base">IA para otimização de estudos</span>
            </div>
            <div className="flex items-center space-x-3">
              <SparklesIcon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm lg:text-base">Sincronização em todos dispositivos</span>
            </div>
          </div>
        </div>
        {/* Elementos decorativos */}
        <div className="absolute top-0 right-0 w-64 h-64 lg:w-96 lg:h-96 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-56 h-56 lg:w-80 lg:h-80 bg-white/5 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
      </div>

      {/* Lado direito - Formulário */}
      <div className="flex-1 flex flex-col justify-center py-6 px-4 sm:py-8 sm:px-6 md:py-12 lg:px-20 xl:px-24 bg-white">
        <div className="mx-auto w-full max-w-xs sm:max-w-sm lg:max-w-md">
          {/* Logo mobile */}
          <div className="md:hidden text-center mb-6 sm:mb-8">
            <AcademicCapIcon className="w-12 h-12 sm:w-16 sm:h-16 text-sky-600 mx-auto mb-3 sm:mb-4"/>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">ConcursoGenius</h1>
          </div>

          <div className="mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
              Entrar na sua conta
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Bem-vindo de volta! Entre com suas credenciais.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="space-y-4 sm:space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1 sm:mb-2">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-9 sm:pl-10 pr-3 py-2.5 sm:py-3 text-sm sm:text-base border border-slate-300 rounded-lg sm:rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    placeholder="Digite seu email"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1 sm:mb-2">
                  Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-9 sm:pl-10 pr-9 sm:pr-10 py-2.5 sm:py-3 text-sm sm:text-base border border-slate-300 rounded-lg sm:rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    placeholder="Digite sua senha"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 hover:text-slate-600" />
                  </button>
                </div>
              </div>
            </div>

            {onNavigateToForgotPassword && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onNavigateToForgotPassword}
                  disabled={isLoading}
                  className="text-sm text-sky-600 hover:text-sky-700 font-medium transition-colors duration-200"
                >
                  Esqueceu sua senha?
                </button>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <Button 
              type="submit" 
              isLoading={isLoading} 
              fullWidth 
              size="lg"
              className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-semibold py-2.5 sm:py-3 px-4 rounded-lg sm:rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
                  <span className="text-sm sm:text-base">Entrando...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <SparklesIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  <span className="text-sm sm:text-base">Entrar</span>
                </div>
              )}
            </Button>
          </form>

          {onGoogleLogin && (
            <div className="mt-4 sm:mt-6">
              <SocialLogin
                onGoogleLogin={onGoogleLogin}
                isLoading={isLoading}
                disabled={isLoading}
              />
            </div>
          )}
          
          <p className="mt-6 sm:mt-8 text-center text-sm text-slate-600">
            Não tem uma conta?{' '}
            <button
              onClick={onNavigateToRegister}
              disabled={isLoading}
              className="font-semibold text-sky-600 hover:text-sky-700 transition-colors duration-200"
            >
              Criar conta gratuita
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
