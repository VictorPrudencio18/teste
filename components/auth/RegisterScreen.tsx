
import React, { useState } from 'react';
import { Button } from '../common/Button';
import { SocialLogin } from './SocialLogin';
import { AcademicCapIcon, SparklesIcon, EnvelopeIcon, LockClosedIcon, EyeIcon, UserIcon } from '../../constants';

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
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setFormError(null);
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setFormError("As senhas não coincidem");
      return false;
    }
    if (formData.password.length < 6) {
      setFormError("A senha deve ter pelo menos 6 caracteres");
      return false;
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onRegister(formData.email, formData.password);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Lado esquerdo - Branding */}
      <div className="hidden md:flex md:w-2/5 lg:w-1/2 bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 flex flex-col justify-center px-6 lg:px-12 text-white">
          <div className="mb-6 lg:mb-8">
            <AcademicCapIcon className="w-16 h-16 lg:w-20 lg:h-20 text-white mb-4 lg:mb-6"/>
            <h1 className="text-3xl lg:text-5xl font-bold mb-3 lg:mb-4">
              Junte-se a nós
            </h1>
            <p className="text-lg lg:text-xl text-emerald-100 leading-relaxed">
              Crie sua conta gratuita e comece sua jornada rumo à aprovação no concurso dos seus sonhos.
            </p>
          </div>
          <div className="space-y-3 lg:space-y-4 text-emerald-100">
            <div className="flex items-center space-x-3">
              <SparklesIcon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm lg:text-base">100% gratuito para começar</span>
            </div>
            <div className="flex items-center space-x-3">
              <SparklesIcon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm lg:text-base">Dados seguros e criptografados</span>
            </div>
            <div className="flex items-center space-x-3">
              <SparklesIcon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm lg:text-base">Acesso a todas as funcionalidades</span>
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
            <AcademicCapIcon className="w-12 h-12 sm:w-16 sm:h-16 text-emerald-600 mx-auto mb-3 sm:mb-4"/>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">ConcursoGenius</h1>
          </div>

          <div className="mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
              Criar conta gratuita
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Preencha os dados abaixo para começar.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="space-y-4 sm:space-y-5">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-1 sm:mb-2">
                  Nome completo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
                  </div>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    value={formData.fullName}
                    onChange={(e) => handleChange('fullName', e.target.value)}
                    className="block w-full pl-9 sm:pl-10 pr-3 py-2.5 sm:py-3 text-sm sm:text-base border border-slate-300 rounded-lg sm:rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    placeholder="Seu nome completo"
                  />
                </div>
              </div>

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
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="block w-full pl-9 sm:pl-10 pr-3 py-2.5 sm:py-3 text-sm sm:text-base border border-slate-300 rounded-lg sm:rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    placeholder="seu@email.com"
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
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    className="block w-full pl-9 sm:pl-10 pr-9 sm:pr-10 py-2.5 sm:py-3 text-sm sm:text-base border border-slate-300 rounded-lg sm:rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    placeholder="Mínimo 6 caracteres"
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

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1 sm:mb-2">
                  Confirmar senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    className="block w-full pl-9 sm:pl-10 pr-9 sm:pr-10 py-2.5 sm:py-3 text-sm sm:text-base border border-slate-300 rounded-lg sm:rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    placeholder="Digite a senha novamente"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 hover:text-slate-600" />
                  </button>
                </div>
              </div>
            </div>

            {(formError || error) && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-600">{formError || error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="text-xs text-slate-500">
              Ao criar uma conta, você concorda com nossos{' '}
              <a href="#" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Termos de Uso
              </a>{' '}
              e{' '}
              <a href="#" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Política de Privacidade
              </a>
              .
            </div>

            <Button 
              type="submit" 
              isLoading={isLoading} 
              fullWidth 
              size="lg"
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-2.5 sm:py-3 px-4 rounded-lg sm:rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
                  <span className="text-sm sm:text-base">Criando conta...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <SparklesIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  <span className="text-sm sm:text-base">Criar conta gratuita</span>
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
            Já tem uma conta?{' '}
            <button
              onClick={onNavigateToLogin}
              disabled={isLoading}
              className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors duration-200"
            >
              Fazer login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
