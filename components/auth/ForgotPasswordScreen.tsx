import React, { useState } from 'react';
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
      <div className="min-h-screen flex flex-col lg:flex-row">
        {/* Lado esquerdo - Branding */}
        <div className="hidden md:flex md:w-2/5 lg:w-1/2 bg-gradient-to-br from-green-600 via-emerald-700 to-teal-800 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10 flex flex-col justify-center px-6 lg:px-12 text-white">
            <div className="mb-6 lg:mb-8">
              <div className="w-16 h-16 lg:w-20 lg:h-20 bg-white/20 rounded-full flex items-center justify-center mb-4 lg:mb-6">
                <svg className="w-8 h-8 lg:w-10 lg:h-10 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <h1 className="text-3xl lg:text-5xl font-bold mb-3 lg:mb-4">
                Email Enviado!
              </h1>
              <p className="text-lg lg:text-xl text-green-100 leading-relaxed">
                Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
              </p>
            </div>
          </div>
          {/* Elementos decorativos */}
          <div className="absolute top-0 right-0 w-64 h-64 lg:w-96 lg:h-96 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-56 h-56 lg:w-80 lg:h-80 bg-white/5 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
        </div>

        {/* Lado direito - Sucesso */}
        <div className="flex-1 flex flex-col justify-center py-6 px-4 sm:py-8 sm:px-6 md:py-12 lg:px-20 xl:px-24 bg-white">
          <div className="mx-auto w-full max-w-xs sm:max-w-sm lg:max-w-md text-center">
            {/* Logo mobile */}
            <div className="md:hidden mb-6 sm:mb-8">
              <AcademicCapIcon className="w-12 h-12 sm:w-16 sm:h-16 text-green-600 mx-auto mb-3 sm:mb-4"/>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">ConcursoGenius</h1>
            </div>

            <div className="mb-6 sm:mb-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 sm:mb-4">
                Email enviado com sucesso!
              </h2>
              <p className="text-sm sm:text-base text-slate-600 mb-6 sm:mb-8">
                Enviamos um email com instruções para recuperar sua senha. Verifique também sua caixa de spam.
              </p>
            </div>

            <Button 
              onClick={onNavigateBack}
              fullWidth
              size="lg"
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-2.5 sm:py-3 px-4 rounded-lg sm:rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              <div className="flex items-center justify-center">
                <ArrowLeftIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                <span className="text-sm sm:text-base">Voltar ao login</span>
              </div>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Lado esquerdo - Branding */}
      <div className="hidden md:flex md:w-2/5 lg:w-1/2 bg-gradient-to-br from-purple-600 via-indigo-700 to-blue-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 flex flex-col justify-center px-6 lg:px-12 text-white">
          <div className="mb-6 lg:mb-8">
            <AcademicCapIcon className="w-16 h-16 lg:w-20 lg:h-20 text-white mb-4 lg:mb-6"/>
            <h1 className="text-3xl lg:text-5xl font-bold mb-3 lg:mb-4">
              Recuperar Senha
            </h1>
            <p className="text-lg lg:text-xl text-purple-100 leading-relaxed">
              Não se preocupe! Digite seu email e enviaremos instruções para redefinir sua senha.
            </p>
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
            <AcademicCapIcon className="w-12 h-12 sm:w-16 sm:h-16 text-purple-600 mx-auto mb-3 sm:mb-4"/>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">ConcursoGenius</h1>
          </div>

          <div className="mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
              Esqueceu sua senha?
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Digite seu email para receber instruções de recuperação.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
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
                  className="block w-full pl-9 sm:pl-10 pr-3 py-2.5 sm:py-3 text-sm sm:text-base border border-slate-300 rounded-lg sm:rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                  placeholder="Digite seu email"
                />
              </div>
            </div>

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

            <div className="space-y-3 sm:space-y-4">
              <Button 
                type="submit" 
                isLoading={isLoading} 
                fullWidth 
                size="lg"
                disabled={!email.trim()}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-2.5 sm:py-3 px-4 rounded-lg sm:rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:transform-none text-sm sm:text-base"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
                    <span className="text-sm sm:text-base">Enviando...</span>
                  </div>
                ) : (
                  <span className="text-sm sm:text-base">Enviar instruções</span>
                )}
              </Button>
              
              <Button 
                onClick={onNavigateBack}
                disabled={isLoading}
                fullWidth
                size="lg"
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 sm:py-3 px-4 rounded-lg sm:rounded-xl transition-all duration-200 text-sm sm:text-base"
              >
                <div className="flex items-center justify-center">
                  <ArrowLeftIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  <span className="text-sm sm:text-base">Voltar ao login</span>
                </div>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};