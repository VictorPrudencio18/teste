import React, { useState } from 'react';
import { QuestionManager } from './QuestionManager';
import { Button } from './Button';
import { Card } from './Card';
import { 
  QuestionMarkCircleIcon,
  BookOpenIcon,
  AcademicCapIcon,
  ChartPieIcon 
} from '../../constants';

interface QuestionSystemIntegrationProps {
  onClose?: () => void;
}

export const QuestionSystemIntegration: React.FC<QuestionSystemIntegrationProps> = ({ onClose }) => {
  const [showQuestionManager, setShowQuestionManager] = useState(false);

  if (showQuestionManager) {
    return (
      <QuestionManager onBack={() => setShowQuestionManager(false)} />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-blue-100 mb-4">
          <QuestionMarkCircleIcon className="h-10 w-10 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Sistema Avançado de Questões
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Sistema inteligente de questões com IA, memória adaptativa e acompanhamento de progresso
        </p>
      </div>

      {/* Características principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-purple-100 mb-4">
            <BookOpenIcon className="h-8 w-8 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Geração Inteligente</h3>
          <p className="text-gray-600 text-sm">
            Crie questões personalizadas sobre qualquer tópico usando inteligência artificial avançada
          </p>
        </Card>

        <Card className="p-6 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <AcademicCapIcon className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Sistema de Memória</h3>
          <p className="text-gray-600 text-sm">
            O sistema lembra suas respostas e adapta futuras questões baseadas no seu desempenho
          </p>
        </Card>

        <Card className="p-6 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
            <ChartPieIcon className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Análise Detalhada</h3>
          <p className="text-gray-600 text-sm">
            Acompanhe seu progresso com estatísticas detalhadas e recomendações personalizadas
          </p>
        </Card>
      </div>

      {/* Funcionalidades */}
      <Card className="p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Funcionalidades Principais
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">🤖 Inteligência Artificial</h3>
            <ul className="space-y-2 text-gray-600">
              <li>• Geração automática de questões sobre qualquer tópico</li>
              <li>• Questões baseadas em conteúdo personalizado (textos, slides)</li>
              <li>• Diferentes níveis de dificuldade (fácil, médio, difícil)</li>
              <li>• Explicações detalhadas para cada resposta</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mt-6">🧠 Sistema de Memória</h3>
            <ul className="space-y-2 text-gray-600">
              <li>• Rastreamento de acertos e erros por questão</li>
              <li>• Identificação de pontos fortes e fracos</li>
              <li>• Repetição espaçada baseada no desempenho</li>
              <li>• Níveis de maestria (aprendendo, praticando, dominado)</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">📊 Análise e Estatísticas</h3>
            <ul className="space-y-2 text-gray-600">
              <li>• Taxa de acerto geral e por categoria</li>
              <li>• Tempo médio de resposta</li>
              <li>• Sequências de acertos (streaks)</li>
              <li>• Histórico detalhado de sessões</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mt-6">🎯 Aprendizado Adaptativo</h3>
            <ul className="space-y-2 text-gray-600">
              <li>• Questões personalizadas baseadas no histórico</li>
              <li>• Foco automático em áreas fracas</li>
              <li>• Progressão de dificuldade inteligente</li>
              <li>• Recomendações de estudo personalizadas</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Como usar */}
      <Card className="p-8 bg-gradient-to-r from-blue-50 to-purple-50">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Como Usar
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-blue-600 font-bold text-lg">1</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Escolha o Tópico</h4>
            <p className="text-sm text-gray-600">
              Digite qualquer assunto ou cole conteúdo personalizado
            </p>
          </div>
          
          <div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-green-600 font-bold text-lg">2</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Configure as Questões</h4>
            <p className="text-sm text-gray-600">
              Defina dificuldade, quantidade e categoria desejada
            </p>
          </div>
          
          <div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-purple-600 font-bold text-lg">3</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Responda e Aprenda</h4>
            <p className="text-sm text-gray-600">
              Responda as questões e receba feedback imediato
            </p>
          </div>
          
          <div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-orange-600 font-bold text-lg">4</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Acompanhe o Progresso</h4>
            <p className="text-sm text-gray-600">
              Veja suas estatísticas e áreas para melhorar
            </p>
          </div>
        </div>
      </Card>

      {/* Botões de ação */}
      <div className="text-center space-y-4">
        <Button 
          onClick={() => setShowQuestionManager(true)}
          className="text-lg px-8 py-3"
          size="lg"
        >
          🚀 Começar Agora
        </Button>
        
        {onClose && (
          <div>
            <Button onClick={onClose} variant="outline">
              Voltar
            </Button>
          </div>
        )}
      </div>

      {/* Informações técnicas */}
      <Card className="p-6 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🛠️ Informações Técnicas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Tecnologias Utilizadas:</h4>
            <ul className="space-y-1">
              <li>• React + TypeScript para interface</li>
              <li>• Gemini AI para geração de questões</li>
              <li>• localStorage para persistência de dados</li>
              <li>• Sistema de algoritmos adaptativos</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Recursos Avançados:</h4>
            <ul className="space-y-1">
              <li>• Análise preditiva de desempenho</li>
              <li>• Exportação/importação de dados</li>
              <li>• Interface responsiva e acessível</li>
              <li>• Atualização em tempo real das estatísticas</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};