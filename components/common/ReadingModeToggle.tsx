import React from 'react';
import { StarIcon, BoltIcon, FireIcon, ShieldCheckIcon } from '../../constants';

interface ReadingModeToggleProps {
  currentMode: 'structured' | 'linear' | 'focus';
  onModeChange: (mode: 'structured' | 'linear' | 'focus') => void;
}

export const ReadingModeToggle: React.FC<ReadingModeToggleProps> = ({
  currentMode,
  onModeChange
}) => {
  const modes = [
    {
      id: 'structured' as const,
      label: 'Estruturado',
      icon: StarIcon,
      description: 'Seções organizadas por importância',
      color: 'bg-purple-500',
      activeColor: 'bg-purple-600',
    },
    {
      id: 'linear' as const,
      label: 'Linear',
      icon: BoltIcon,
      description: 'Leitura sequencial tradicional',
      color: 'bg-blue-500',
      activeColor: 'bg-blue-600',
    },
    {
      id: 'focus' as const,
      label: 'Foco',
      icon: FireIcon,
      description: 'Apenas conteúdo essencial',
      color: 'bg-red-500',
      activeColor: 'bg-red-600',
    },
  ];

  return (
    <div className="flex flex-wrap gap-2 p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
      <div className="flex items-center mr-3">
        <ShieldCheckIcon className="w-4 h-4 text-slate-600 mr-2" />
        <span className="text-sm font-medium text-slate-700">Modo de Leitura:</span>
      </div>
      
      {modes.map((mode) => {
        const isActive = currentMode === mode.id;
        const IconComponent = mode.icon;
        
        return (
          <button
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
            className={`
              flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium
              transition-all duration-200 transform hover:scale-105
              ${isActive 
                ? `${mode.activeColor} text-white shadow-md` 
                : `${mode.color} bg-opacity-10 text-slate-700 hover:bg-opacity-20`
              }
            `}
            title={mode.description}
          >
            <IconComponent className="w-4 h-4" />
            <span>{mode.label}</span>
          </button>
        );
      })}
    </div>
  );
};