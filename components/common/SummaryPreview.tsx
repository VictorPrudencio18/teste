import React from 'react';
import { Card } from './Card';
import { StarIcon, CheckCircleIcon, ClockIcon, BookOpenIcon } from '../../constants';

interface SummaryPreviewProps {
  sections: number;
  estimatedTime: number;
  completionRate: number;
  difficulty: 'easy' | 'medium' | 'hard';
  topicName: string;
}

export const SummaryPreview: React.FC<SummaryPreviewProps> = ({
  sections,
  estimatedTime,
  completionRate,
  difficulty,
  topicName
}) => {
  const difficultyConfig = {
    easy: { color: 'text-green-600', bg: 'bg-green-100', label: 'Fácil' },
    medium: { color: 'text-amber-600', bg: 'bg-amber-100', label: 'Médio' },
    hard: { color: 'text-red-600', bg: 'bg-red-100', label: 'Desafiador' }
  };

  const config = difficultyConfig[difficulty];

  return (
    <Card className="bg-gradient-to-br from-white to-slate-50 border-2 border-slate-200 hover:border-sky-300 transition-all duration-300 hover:shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <BookOpenIcon className="w-6 h-6 text-sky-600" />
          <h3 className="text-lg font-semibold text-slate-800 font-display">
            Resumo: {topicName}
          </h3>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.color}`}>
          {config.label}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-700">{sections}</div>
          <div className="text-xs text-slate-500">Seções</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-700 flex items-center justify-center">
            <ClockIcon className="w-5 h-5 mr-1" />
            {estimatedTime}min
          </div>
          <div className="text-xs text-slate-500">Leitura</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-700">{completionRate}%</div>
          <div className="text-xs text-slate-500">Completo</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-sky-600 flex items-center justify-center">
            <StarIcon className="w-5 h-5 mr-1" />
            4.8
          </div>
          <div className="text-xs text-slate-500">Qualidade</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-slate-700">Progresso</span>
          <span className="text-sm text-slate-600">{completionRate}%</span>
        </div>
        <div className="bg-slate-200 rounded-full h-2.5 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-sky-500 to-cyan-500 h-full rounded-full transition-all duration-500 ease-out relative"
            style={{ width: `${completionRate}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full"></div>
          </div>
        </div>
      </div>

      {completionRate === 100 && (
        <div className="flex items-center space-x-2 text-green-600 text-sm">
          <CheckCircleIcon className="w-4 h-4" />
          <span className="font-medium">Resumo completado! 🎉</span>
        </div>
      )}
    </Card>
  );
};