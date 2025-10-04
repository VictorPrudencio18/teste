import React, { useState, useEffect } from 'react';
import { Question, QuizSession } from '../../types';
import { questionService } from '../../services/questionService';
import { useSupabaseQuestionTracking } from '../../hooks/useSupabaseQuestionTracking';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  QuestionMarkCircleIcon,
  StarIcon,
  FireIcon,
  ChartPieIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  BeakerIcon
} from '../../constants';

interface QuestionSystemProps {
  questions: Question[];
  onComplete?: (session: QuizSession) => void;
  onBack?: () => void;
  category?: string;
  topicId?: string;
  title?: string;
  userId?: string;
  subjectName?: string;
  topicName?: string;
}

export const QuestionSystem: React.FC<QuestionSystemProps> = ({
  questions,
  onComplete,
  onBack,
  category,
  topicId,
  title = "Sistema de Questões",
  userId,
  subjectName,
  topicName
}) => {
  const [currentSession, setCurrentSession] = useState<QuizSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [showResults, setShowResults] = useState(false);
  const [userStats, setUserStats] = useState(questionService.getUserStats());

  // Hook para sincronização com Supabase
  const { saveQuestionAttempt, saveStudySession } = useSupabaseQuestionTracking({
    userId,
    topicId,
    subjectName,
    topicName
  });

  useEffect(() => {
    if (questions.length > 0) {
      const session = questionService.startQuizSession(questions, category, topicId);
      setCurrentSession(session);
      setQuestionStartTime(Date.now());
    }
  }, [questions, category, topicId]);

  useEffect(() => {
    // Atualiza estatísticas quando o componente carrega
    setUserStats(questionService.getUserStats());
  }, []);

  const currentQuestion = currentSession?.questions[currentQuestionIndex];

  const handleAnswerSelect = (answerIndex: number) => {
    if (selectedAnswer !== null) return; // Já respondeu
    setSelectedAnswer(answerIndex);
  };

  const handleSubmitAnswer = async () => {
    if (!currentSession || !currentQuestion || selectedAnswer === null) return;

    const timeSpent = (Date.now() - questionStartTime) / 1000; // em segundos
    const isCorrect = selectedAnswer === currentQuestion.correctAnswerIndex;

    // Registra a tentativa no serviço local
    questionService.recordAttempt(
      currentQuestion.id,
      selectedAnswer,
      isCorrect,
      timeSpent,
      currentQuestion
    );

    // Salva no Supabase (em background, não bloqueia UX)
    saveQuestionAttempt(
      currentQuestion,
      selectedAnswer,
      isCorrect,
      Math.round(timeSpent),
      0, // hints usados
      topicId,
      subjectName,
      topicName
    ).catch(error => {
      console.warn('Falha ao salvar questão no Supabase:', error);
    });

    // Atualiza a sessão atual
    const attempt = {
      questionId: currentQuestion.id,
      isCorrect,
      selectedAnswerIndex: selectedAnswer,
      timeSpent,
      timestamp: Date.now(),
      hintsUsed: 0
    };

    currentSession.attempts.push(attempt);
    if (isCorrect) {
      currentSession.correctAnswers++;
    }

    setShowExplanation(true);
    setUserStats(questionService.getUserStats()); // Atualiza estatísticas
  };

  const handleNextQuestion = () => {
    if (!currentSession) return;

    if (currentQuestionIndex < currentSession.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setQuestionStartTime(Date.now());
    } else {
      // Finaliza sessão
      questionService.completeQuizSession(currentSession);
      
      // Salva sessão de estudo no Supabase
      const durationMinutes = Math.round((Date.now() - currentSession.startTime) / 60000);
      const performanceScore = Math.round((currentSession.correctAnswers / currentSession.questions.length) * 100);
      
      saveStudySession(
        durationMinutes,
        'questions',
        performanceScore,
        `Sessão de questões: ${currentSession.correctAnswers}/${currentSession.questions.length} corretas`,
        subjectName,
        topicName
      ).catch(error => {
        console.warn('Falha ao salvar sessão de estudo no Supabase:', error);
      });
      
      setShowResults(true);
      if (onComplete) {
        onComplete(currentSession);
      }
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setQuestionStartTime(Date.now());
    }
  };

  const getAnswerButtonClass = (index: number): string => {
    if (selectedAnswer === null) {
      return 'bg-white hover:bg-blue-50 border-gray-300 text-gray-700';
    }

    if (index === currentQuestion?.correctAnswerIndex) {
      return 'bg-green-100 border-green-500 text-green-700';
    }

    if (index === selectedAnswer && index !== currentQuestion?.correctAnswerIndex) {
      return 'bg-red-100 border-red-500 text-red-700';
    }

    return 'bg-gray-100 border-gray-300 text-gray-500';
  };

  const getQuestionHistory = () => {
    if (!currentQuestion) return null;
    return questionService.getQuestionHistory(currentQuestion.id);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentSession || questions.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <QuestionMarkCircleIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma questão disponível</h3>
          <p className="text-gray-500 mb-4">Não há questões para exibir no momento.</p>
          {onBack && (
            <Button onClick={onBack} variant="outline">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          )}
        </div>
      </Card>
    );
  }

  if (showResults) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
              <ChartPieIcon className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Sessão Concluída!</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{currentSession.correctAnswers}</div>
                <div className="text-sm text-gray-500">Acertos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{currentSession.totalQuestions}</div>
                <div className="text-sm text-gray-500">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(currentSession.score)}%
                </div>
                <div className="text-sm text-gray-500">Pontuação</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {formatTime(currentSession.timeSpent / 1000)}
                </div>
                <div className="text-sm text-gray-500">Tempo</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Estatísticas Gerais */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <StarIcon className="h-5 w-5 mr-2 text-yellow-500" />
            Suas Estatísticas
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">{userStats.totalQuestions}</div>
              <div className="text-sm text-gray-500">Questões Respondidas</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">
                {Math.round(userStats.correctPercentage)}%
              </div>
              <div className="text-sm text-gray-500">Taxa de Acerto</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-orange-600 flex items-center justify-center">
                <FireIcon className="h-5 w-5 mr-1" />
                {userStats.currentStreak}
              </div>
              <div className="text-sm text-gray-500">Sequência Atual</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-purple-600">
                {formatTime(userStats.averageTimePerQuestion)}
              </div>
              <div className="text-sm text-gray-500">Tempo Médio</div>
            </div>
          </div>
        </Card>

        {/* Distribuição de Maestria */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BeakerIcon className="h-5 w-5 mr-2 text-indigo-500" />
            Nível de Maestria
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{userStats.masteryDistribution.learning}</div>
              <div className="text-sm text-red-600">Aprendendo</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{userStats.masteryDistribution.practicing}</div>
              <div className="text-sm text-yellow-600">Praticando</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{userStats.masteryDistribution.mastered}</div>
              <div className="text-sm text-green-600">Dominado</div>
            </div>
          </div>
        </Card>

        <div className="flex justify-center space-x-4">
          {onBack && (
            <Button onClick={onBack} variant="outline">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com progresso */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-sm text-gray-500">
              <ClockIcon className="h-4 w-4 mr-1" />
              {formatTime((Date.now() - questionStartTime) / 1000)}
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <FireIcon className="h-4 w-4 mr-1" />
              Sequência: {userStats.currentStreak}
            </div>
          </div>
        </div>
        
        {/* Barra de progresso */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / currentSession.questions.length) * 100}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-sm text-gray-500 mt-2">
          <span>Questão {currentQuestionIndex + 1} de {currentSession.questions.length}</span>
          <span>{currentSession.correctAnswers} acertos</span>
        </div>
      </Card>

      {/* Questão atual */}
      <Card className="p-6">
        <div className="mb-6">
          {/* Histórico da questão */}
          {getQuestionHistory() && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Histórico:</span> {getQuestionHistory()!.totalAttempts} tentativas, {' '}
                {Math.round((getQuestionHistory()!.correctAttempts / getQuestionHistory()!.totalAttempts) * 100)}% de acerto, {' '}
                Nível: <span className="capitalize font-medium">{getQuestionHistory()!.masteryLevel}</span>
              </div>
            </div>
          )}

          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {currentQuestion?.questionText}
          </h3>
          
          <div className="space-y-3">
            {currentQuestion?.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                disabled={selectedAnswer !== null}
                className={`w-full p-4 text-left border-2 rounded-lg transition-all ${getAnswerButtonClass(index)} ${
                  selectedAnswer === null ? 'hover:shadow-md' : ''
                }`}
              >
                <div className="flex items-center">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-300 text-white text-sm mr-3">
                    {String.fromCharCode(65 + index)}
                  </span>
                  {option}
                  {selectedAnswer !== null && index === currentQuestion.correctAnswerIndex && (
                    <CheckCircleIcon className="ml-auto h-5 w-5" />
                  )}
                  {selectedAnswer === index && index !== currentQuestion.correctAnswerIndex && (
                    <XCircleIcon className="ml-auto h-5 w-5" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Explicação */}
        {showExplanation && currentQuestion?.explanation && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Explicação:</h4>
            <p className="text-blue-800 text-sm">{currentQuestion.explanation}</p>
          </div>
        )}

        {/* Botões de ação */}
        <div className="flex justify-between mt-6">
          <Button
            onClick={handlePreviousQuestion}
            variant="outline"
            disabled={currentQuestionIndex === 0}
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Anterior
          </Button>

          {selectedAnswer === null ? (
            <Button
              onClick={handleSubmitAnswer}
              disabled={selectedAnswer === null}
            >
              Confirmar Resposta
            </Button>
          ) : (
            <Button onClick={handleNextQuestion}>
              {currentQuestionIndex === currentSession.questions.length - 1 ? 'Finalizar' : 'Próxima'}
              <ArrowRightIcon className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};