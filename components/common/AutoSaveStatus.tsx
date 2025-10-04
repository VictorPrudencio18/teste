import React from 'react';
import { CheckCircleIcon, CogIcon, UserIcon } from '../../constants';

interface AutoSaveStatusProps {
  isAuthenticated: boolean;
  className?: string;
}

export const AutoSaveStatus: React.FC<AutoSaveStatusProps> = ({ 
  isAuthenticated, 
  className = "" 
}) => {
  if (!isAuthenticated) return null;

  return (
    <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <CheckCircleIcon className="h-5 w-5 text-green-400" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-green-800">
            Salvamento Automático Ativo
          </h3>
          <div className="mt-2 text-sm text-green-700">
            <p>Todos os seus dados são automaticamente salvos no seu perfil:</p>
            <ul className="mt-1 list-disc list-inside space-y-1">
              <li className="flex items-center">
                <CogIcon className="h-4 w-4 mr-2 text-green-600" />
                Edital processado e análise completa
              </li>
              <li className="flex items-center">
                <UserIcon className="h-4 w-4 mr-2 text-green-600" />
                Progresso de todos os tópicos estudados
              </li>
              <li className="flex items-center">
                <CheckCircleIcon className="h-4 w-4 mr-2 text-green-600" />
                Questões respondidas e performance
              </li>
              <li className="flex items-center">
                <CheckCircleIcon className="h-4 w-4 mr-2 text-green-600" />
                Conversas com o AI Coach
              </li>
              <li className="flex items-center">
                <CheckCircleIcon className="h-4 w-4 mr-2 text-green-600" />
                Configurações de estudo personalizadas
              </li>
            </ul>
            <p className="mt-2 text-xs opacity-75">
              ✨ Seus dados ficam sincronizados entre dispositivos e protegidos na nuvem
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoSaveStatus;