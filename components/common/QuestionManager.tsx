import React, { useState } from 'react';
import { Question, QuizSession } from '../../types';
import { questionService } from '../../services/questionService';
import { questionGeneratorService } from '../../services/questionGeneratorService';
import { QuestionSystem } from './QuestionSystem';
import { QuestionStats } from './QuestionStats';
import { Button } from './Button';
import { Card } from './Card';
import { Input } from './Input';
import { LoadingSpinner } from './LoadingSpinner';
import {
  QuestionMarkCircleIcon,
  BrainIcon,
  FireIcon,
  BeakerIcon,
  ChartPieIcon,
  SparklesIcon,
  CogIcon,
  ArrowLeftIcon,
  PlusIcon,
  StarIcon
} from '../../constants';

interface QuestionManagerProps {
  onBack?: () => void;
}

type ViewMode = 'home' | 'generate' | 'quiz' | 'stats' | 'custom';

export const QuestionManager: React.FC<QuestionManagerProps> = ({ onBack }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [loading, setLoading] = useState(false);
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [userStats] = useState(questionService.getUserStats());

  // Estados para geração de questões
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [quantity, setQuantity] = useState(10);
  const [category, setCategory] = useState('');
  const [customContent, setCustomContent] = useState('');

  const handleGenerateQuestions = async () => {
    if (!topic.trim()) {
      alert('Por favor, informe o tópico das questões');
      return;
    }

    setLoading(true);
    try {
      const questions = await questionGeneratorService.generateQuestions({
        topic: topic.trim(),
        difficulty,
        quantity,
        category: category.trim() || undefined
      });
      
      setCurrentQuestions(questions);
      setViewMode('quiz');
    } catch (error) {
      console.error('Erro ao gerar questões:', error);
      alert('Erro ao gerar questões. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFromContent = async () => {
    if (!customContent.trim()) {
      alert('Por favor, forneça o conteúdo para gerar questões');
      return;
    }

    setLoading(true);
    try {
      const questions = await questionGeneratorService.generateQuestionsFromContent(
        customContent.trim(),
        difficulty,
        quantity,
        category.trim() || undefined
      );
      
      setCurrentQuestions(questions);
      setViewMode('quiz');
    } catch (error) {
      console.error('Erro ao gerar questões do conteúdo:', error);
      alert('Erro ao gerar questões do conteúdo. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAdaptive = async () => {
    setLoading(true);
    try {
      const questions = await questionGeneratorService.generateAdaptiveQuestions(
        userStats.weakCategories,
        userStats.strongCategories,
        difficulty,
        quantity
      );
      
      setCurrentQuestions(questions);
      setViewMode('quiz');
    } catch (error) {
      console.error('Erro ao gerar questões adaptativas:', error);
      alert('Erro ao gerar questões adaptativas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuizComplete = (session: QuizSession) => {
    // Quiz completado, volta para home
    setViewMode('home');
    setCurrentQuestions([]);
  };

  if (loading) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <h3 className="text-lg font-medium text-gray-900 mt-4">Gerando questões...</h3>
          <p className="text-gray-500 mt-2">Isso pode levar alguns segundos</p>
        </div>
      </Card>
    );
  }

  // Modo Quiz
  if (viewMode === 'quiz' && currentQuestions.length > 0) {
    return (
      <QuestionSystem
        questions={currentQuestions}
        onComplete={handleQuizComplete}
        onBack={() => setViewMode('home')}
        category={category}
        title="Sistema de Questões"
      />
    );
  }

  // Modo Estatísticas
  if (viewMode === 'stats') {
    return (
      <QuestionStats onClose={() => setViewMode('home')} />
    );
  }

  // Modo de Geração Personalizada
  if (viewMode === 'generate') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <SparklesIcon className="h-8 w-8 mr-3 text-purple-600" />
            Gerar Questões
          </h2>
          <Button onClick={() => setViewMode('home')} variant="outline">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configurações básicas */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurações Básicas</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tópico/Assunto *
                </label>
                <Input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Ex: História do Brasil, Matemática Básica, Física..."
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria (opcional)
                </label>
                <Input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Ex: História, Ciências, Literatura..."
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dificuldade
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="easy">Fácil</option>
                    <option value="medium">Médio</option>
                    <option value="hard">Difícil</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantidade
                  </label>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                    min="1"
                    max="20"
                    className="w-full"
                  />
                </div>
              </div>

              <Button onClick={handleGenerateQuestions} className="w-full">
                <SparklesIcon className="h-4 w-4 mr-2" />
                Gerar Questões
              </Button>
            </div>
          </Card>

          {/* Geração a partir de conteúdo */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">A partir de Conteúdo</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cole seu conteúdo aqui
                </label>
                <textarea
                  value={customContent}
                  onChange={(e) => setCustomContent(e.target.value)}
                  placeholder="Cole aqui o texto, slides, anotações ou qualquer conteúdo para gerar questões..."
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <Button 
                onClick={handleGenerateFromContent} 
                className="w-full"
                disabled={!customContent.trim()}
              >
                <BeakerIcon className="h-4 w-4 mr-2" />
                Gerar do Conteúdo
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Home do Question Manager
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center">
          <QuestionMarkCircleIcon className="h-10 w-10 mr-3 text-blue-600" />
          Sistema de Questões
        </h2>
        {onBack && (
          <Button onClick={onBack} variant="outline">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        )}
      </div>

      {/* Estatísticas rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600 mb-1">{userStats.totalQuestions}</div>
          <div className="text-sm text-gray-600">Questões Respondidas</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600 mb-1">
            {Math.round(userStats.correctPercentage)}%
          </div>
          <div className="text-sm text-gray-600">Taxa de Acerto</div>
        </Card>

        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-orange-600 mb-1 flex items-center justify-center">
            <FireIcon className="h-6 w-6 mr-1" />
            {userStats.currentStreak}
          </div>
          <div className="text-sm text-gray-600">Sequência Atual</div>
        </Card>

        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-600 mb-1">{userStats.masteryDistribution.mastered}</div>
          <div className="text-sm text-gray-600">Tópicos Dominados</div>
        </Card>
      </div>

      {/* Opções principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Gerar Questões */}
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setViewMode('generate')}>
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-purple-100 mb-4">
              <SparklesIcon className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Gerar Questões</h3>
            <p className="text-gray-600 mb-4">
              Use IA para criar questões personalizadas sobre qualquer tópico
            </p>
            <Button className="w-full">
              <PlusIcon className="h-4 w-4 mr-2" />
              Criar Questões
            </Button>
          </div>
        </Card>

        {/* Questões Adaptativas */}
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={handleGenerateAdaptive}>
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <BrainIcon className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Questões Adaptativas</h3>
            <p className="text-gray-600 mb-4">
              Questões personalizadas baseadas no seu histórico de aprendizado
            </p>
            <Button 
              className="w-full" 
              variant="outline"
              disabled={userStats.totalQuestions < 5}
            >
              {userStats.totalQuestions < 5 ? 'Responda mais questões primeiro' : 'Começar Sessão'}
            </Button>
          </div>
        </Card>

        {/* Ver Estatísticas */}
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setViewMode('stats')}>
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
              <ChartPieIcon className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Minhas Estatísticas</h3>
            <p className="text-gray-600 mb-4">
              Acompanhe seu progresso e áreas de melhoria
            </p>
            <Button className="w-full" variant="outline">
              <ChartPieIcon className="h-4 w-4 mr-2" />
              Ver Detalhes
            </Button>
          </div>
        </Card>
      </div>

      {/* Recomendações baseadas no histórico */}
      {userStats.weakCategories.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <StarIcon className="h-5 w-5 mr-2 text-yellow-500" />
            Recomendações para Você
          </h3>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 mb-2">
              <strong>Áreas para focar:</strong> {userStats.weakCategories.join(', ')}
            </p>
            <p className="text-sm text-yellow-700 mb-3">
              Baseado no seu histórico, recomendamos praticar mais estas áreas.
            </p>
            <Button 
              onClick={handleGenerateAdaptive} 
              size="sm"
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              Praticar Áreas Fracas
            </Button>
          </div>
        </Card>
      )}

      {/* Dicas de uso */}
      <Card className="p-6 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
          <CogIcon className="h-5 w-5 mr-2 text-gray-600" />
          Como funciona
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div className="flex items-start">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-1">
              <span className="text-blue-600 font-bold">1</span>
            </div>
            <div>
              <div className="font-medium text-gray-900">Gere ou escolha questões</div>
              <div>Crie questões sobre qualquer tópico ou use questões adaptativas</div>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-1">
              <span className="text-green-600 font-bold">2</span>
            </div>
            <div>
              <div className="font-medium text-gray-900">Responda e aprenda</div>
              <div>O sistema registra seus acertos e erros para melhorar o aprendizado</div>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mr-3 mt-1">
              <span className="text-purple-600 font-bold">3</span>
            </div>
            <div>
              <div className="font-medium text-gray-900">Acompanhe o progresso</div>
              <div>Veja suas estatísticas e áreas que precisam de mais atenção</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};