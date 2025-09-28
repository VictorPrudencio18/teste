import React, { useState, useEffect } from 'react';
import { questionService } from '../../services/questionService';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { 
  StarIcon,
  FireIcon,
  ChartPieIcon,
  ClockIcon,
  BeakerIcon,
  TrophyIcon,
  BoltIcon,
  EyeIcon,
  ArrowPathIcon,
  ArrowRightOnRectangleIcon
} from '../../constants';

interface QuestionStatsProps {
  onClose?: () => void;
}

export const QuestionStats: React.FC<QuestionStatsProps> = ({ onClose }) => {
  const [stats, setStats] = useState(questionService.getUserStats());
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'categories' | 'achievements'>('overview');

  useEffect(() => {
    setStats(questionService.getUserStats());
  }, []);

  const refreshStats = () => {
    setStats(questionService.getUserStats());
  };

  const handleResetData = () => {
    if (window.confirm('Tem certeza que deseja resetar todos os dados? Esta ação não pode ser desfeita.')) {
      questionService.resetUserData();
      refreshStats();
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getPerformanceLevel = (percentage: number): { text: string; color: string; icon: React.ReactNode } => {
    if (percentage >= 90) return { 
      text: 'Excelente', 
      color: 'text-green-600', 
      icon: <StarIcon className="h-5 w-5 text-green-500" /> 
    };
    if (percentage >= 80) return { 
      text: 'Muito Bom', 
      color: 'text-blue-600', 
      icon: <FireIcon className="h-5 w-5 text-blue-500" /> 
    };
    if (percentage >= 70) return { 
      text: 'Bom', 
      color: 'text-yellow-600', 
      icon: <BoltIcon className="h-5 w-5 text-yellow-500" /> 
    };
    if (percentage >= 60) return { 
      text: 'Regular', 
      color: 'text-orange-600', 
      icon: <BeakerIcon className="h-5 w-5 text-orange-500" /> 
    };
    return { 
      text: 'Precisa Melhorar', 
      color: 'text-red-600', 
      icon: <EyeIcon className="h-5 w-5 text-red-500" /> 
    };
  };

  const performance = getPerformanceLevel(stats.correctPercentage);

  const TabButton: React.FC<{ tab: typeof activeTab; children: React.ReactNode }> = ({ tab, children }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 text-sm font-medium rounded-lg ${
        activeTab === tab
          ? 'bg-blue-100 text-blue-700'
          : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <ChartPieIcon className="h-8 w-8 mr-3 text-blue-600" />
          Estatísticas de Questões
        </h2>
        <div className="flex items-center space-x-2">
          <Button onClick={refreshStats} variant="outline" size="sm">
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          {onClose && (
            <Button onClick={onClose} variant="outline" size="sm">
              <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
              Fechar
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Card className="p-1">
        <div className="flex space-x-1">
          <TabButton tab="overview">Visão Geral</TabButton>
          <TabButton tab="history">Histórico</TabButton>
          <TabButton tab="categories">Categorias</TabButton>
          <TabButton tab="achievements">Conquistas</TabButton>
        </div>
      </Card>

      {/* Visão Geral */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Métricas principais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{stats.totalQuestions}</div>
              <div className="text-sm text-gray-600">Questões Respondidas</div>
            </Card>
            
            <Card className="p-6 text-center">
              <div className={`text-3xl font-bold mb-2 ${performance.color}`}>
                {Math.round(stats.correctPercentage)}%
              </div>
              <div className="text-sm text-gray-600 flex items-center justify-center">
                {performance.icon}
                <span className="ml-1">{performance.text}</span>
              </div>
            </Card>

            <Card className="p-6 text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2 flex items-center justify-center">
                <FireIcon className="h-8 w-8 mr-2" />
                {stats.currentStreak}
              </div>
              <div className="text-sm text-gray-600">Sequência Atual</div>
            </Card>

            <Card className="p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {formatTime(stats.averageTimePerQuestion)}
              </div>
              <div className="text-sm text-gray-600">Tempo Médio</div>
            </Card>
          </div>

          {/* Distribuição de Maestria */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BeakerIcon className="h-5 w-5 mr-2 text-indigo-500" />
              Distribuição de Maestria
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-6 bg-red-50 rounded-xl">
                <div className="text-3xl font-bold text-red-600 mb-2">{stats.masteryDistribution.learning}</div>
                <div className="text-sm font-medium text-red-600 mb-1">Aprendendo</div>
                <div className="text-xs text-red-500">Questões em desenvolvimento</div>
              </div>
              <div className="text-center p-6 bg-yellow-50 rounded-xl">
                <div className="text-3xl font-bold text-yellow-600 mb-2">{stats.masteryDistribution.practicing}</div>
                <div className="text-sm font-medium text-yellow-600 mb-1">Praticando</div>
                <div className="text-xs text-yellow-500">Questões em progresso</div>
              </div>
              <div className="text-center p-6 bg-green-50 rounded-xl">
                <div className="text-3xl font-bold text-green-600 mb-2">{stats.masteryDistribution.mastered}</div>
                <div className="text-sm font-medium text-green-600 mb-1">Dominado</div>
                <div className="text-xs text-green-500">Questões dominadas</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Histórico */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <ClockIcon className="h-5 w-5 mr-2 text-gray-600" />
              Sessões Recentes
            </h3>
            {stats.recentSessions.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">Nenhuma sessão encontrada</div>
                <div className="text-sm text-gray-500">Suas sessões de questões aparecerão aqui</div>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentSessions.reverse().map((session, index) => (
                  <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">
                        {session.category || 'Sessão Geral'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(session.startTimestamp).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">
                        {Math.round(session.score)}%
                      </div>
                      <div className="text-sm text-gray-500">
                        {session.correctAnswers}/{session.totalQuestions}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recordes */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <StarIcon className="h-5 w-5 mr-2 text-yellow-500" />
              Recordes Pessoais
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600 mb-1">{stats.longestStreak}</div>
                <div className="text-sm text-yellow-600">Maior Sequência</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {Math.round(Math.max(...stats.recentSessions.map(s => s.score), 0))}%
                </div>
                <div className="text-sm text-blue-600">Melhor Pontuação</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Categorias */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Categorias Fortes */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-green-700 mb-4 flex items-center">
                <StarIcon className="h-5 w-5 mr-2 text-green-500" />
                Pontos Fortes
              </h3>
              {stats.strongCategories.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  Continue respondendo questões para descobrir seus pontos fortes!
                </div>
              ) : (
                <div className="space-y-2">
                  {stats.strongCategories.map((category, index) => (
                    <div key={index} className="flex items-center p-3 bg-green-50 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      <span className="text-green-800 font-medium">{category}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Categorias Fracas */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-red-700 mb-4 flex items-center">
                <BeakerIcon className="h-5 w-5 mr-2 text-red-500" />
                Áreas para Melhorar
              </h3>
              {stats.weakCategories.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  Ótimo! Você não tem áreas fracas identificadas.
                </div>
              ) : (
                <div className="space-y-2">
                  {stats.weakCategories.map((category, index) => (
                    <div key={index} className="flex items-center p-3 bg-red-50 rounded-lg">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                      <span className="text-red-800 font-medium">{category}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* Conquistas */}
      {activeTab === 'achievements' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrophyIcon className="h-5 w-5 mr-2 text-yellow-500" />
              Sistema de Conquistas
            </h3>
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">Em desenvolvimento</div>
              <div className="text-sm text-gray-500">Sistema de conquistas será implementado em breve!</div>
            </div>
          </Card>
        </div>
      )}

      {/* Ações avançadas */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Avançadas</h3>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => {
              const data = questionService.exportUserData();
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `question-stats-${Date.now()}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            variant="outline"
            size="sm"
          >
            Exportar Dados
          </Button>
          
          <Button
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.json';
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    const data = e.target?.result as string;
                    if (questionService.importUserData(data)) {
                      refreshStats();
                      alert('Dados importados com sucesso!');
                    } else {
                      alert('Erro ao importar dados!');
                    }
                  };
                  reader.readAsText(file);
                }
              };
              input.click();
            }}
            variant="outline"
            size="sm"
          >
            Importar Dados
          </Button>
          
          <Button
            onClick={handleResetData}
            variant="outline"
            size="sm"
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            Resetar Dados
          </Button>
        </div>
      </Card>
    </div>
  );
};