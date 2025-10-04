import { useCallback, useEffect } from 'react';
import { userDataService } from '../services/userDataService';
import { Question, QuestionAttempt } from '../types';

interface UseSupabaseQuestionTrackingProps {
  userId?: string;
  topicId?: string;
  subjectName?: string;
  topicName?: string;
}

interface TopicProgressMap {
  [topicId: string]: string; // topicId -> topicProgressId
}

export const useSupabaseQuestionTracking = ({
  userId,
  topicId,
  subjectName,
  topicName
}: UseSupabaseQuestionTrackingProps) => {
  // Cache para IDs de progresso de tópicos
  const topicProgressMap: TopicProgressMap = {};

  // Função para obter ou criar o ID de progresso do tópico
  const getTopicProgressId = useCallback(async (
    currentTopicId: string,
    currentSubjectName: string,
    currentTopicName: string
  ): Promise<string | null> => {
    if (!userId) return null;

    // Verifica cache primeiro
    if (topicProgressMap[currentTopicId]) {
      return topicProgressMap[currentTopicId];
    }

    try {
      // Busca o edital mais recente do usuário
      const latestEdital = await userDataService.getUserLatestEdital(userId);
      if (!latestEdital?.id) {
        console.warn('Nenhum edital encontrado para o usuário');
        return null;
      }

      // Busca o progresso existente ou cria um novo
      const existingProgress = await userDataService.getUserTopicProgress(userId, latestEdital.id);
      const matchingProgress = existingProgress.find(p => p.topic_id === currentTopicId);

      if (matchingProgress?.id) {
        // Armazena no cache
        topicProgressMap[currentTopicId] = matchingProgress.id;
        return matchingProgress.id;
      }

      // Se não existe, cria um novo progresso de tópico
      const dummyTopic = {
        id: currentTopicId,
        name: currentTopicName,
        description: '',
        estimatedStudyTimeHours: 0,
        prerequisites: [],
        content: {},
        userInteractions: {},
        status: 'Pendente' as const
      };

      const newProgressId = await userDataService.saveTopicProgress(
        userId,
        latestEdital.id,
        dummyTopic,
        currentSubjectName,
        {},
        0
      );

      if (newProgressId) {
        topicProgressMap[currentTopicId] = newProgressId;
        return newProgressId;
      }

      return null;
    } catch (error) {
      console.error('Erro ao obter/criar progresso do tópico:', error);
      return null;
    }
  }, [userId, topicProgressMap]);

  // Função para salvar tentativa de questão no Supabase
  const saveQuestionAttempt = useCallback(async (
    question: Question,
    selectedAnswerIndex: number,
    isCorrect: boolean,
    timeSpentSeconds: number,
    hintsUsed?: number,
    currentTopicId?: string,
    currentSubjectName?: string,
    currentTopicName?: string
  ): Promise<void> => {
    if (!userId) {
      console.log('Usuário não logado - tentativa não salva no Supabase');
      return;
    }

    const actualTopicId = currentTopicId || topicId;
    const actualSubjectName = currentSubjectName || subjectName;
    const actualTopicName = currentTopicName || topicName;

    if (!actualTopicId || !actualSubjectName || !actualTopicName) {
      console.warn('Informações do tópico incompletas - tentativa não salva');
      return;
    }

    try {
      const topicProgressId = await getTopicProgressId(
        actualTopicId,
        actualSubjectName,
        actualTopicName
      );

      if (!topicProgressId) {
        console.warn('Não foi possível obter ID do progresso do tópico');
        return;
      }

      await userDataService.saveQuestionAttempt(
        userId,
        topicProgressId,
        question,
        selectedAnswerIndex,
        isCorrect,
        timeSpentSeconds,
        hintsUsed
      );

      console.log('✅ Tentativa de questão salva no Supabase');
    } catch (error) {
      console.error('Erro ao salvar tentativa de questão no Supabase:', error);
      // Não propagar o erro para não afetar a UX
    }
  }, [userId, getTopicProgressId, topicId, subjectName, topicName]);

  // Função para salvar sessão de estudo
  const saveStudySession = useCallback(async (
    durationMinutes: number,
    sessionType: 'reading' | 'questions' | 'flashcards' | 'ai_coach',
    performanceScore?: number,
    notes?: string,
    currentSubjectName?: string,
    currentTopicName?: string
  ): Promise<void> => {
    if (!userId) return;

    const actualSubjectName = currentSubjectName || subjectName || 'Matéria';
    const actualTopicName = currentTopicName || topicName || 'Tópico';

    try {
      await userDataService.saveStudySession(
        userId,
        actualSubjectName,
        actualTopicName,
        durationMinutes,
        sessionType,
        performanceScore,
        notes
      );

      console.log('✅ Sessão de estudo salva no Supabase');
    } catch (error) {
      console.error('Erro ao salvar sessão de estudo:', error);
    }
  }, [userId, subjectName, topicName]);

  // Função para salvar conversa do AI Coach
  const saveAICoachConversation = useCallback(async (
    messages: any[],
    currentTopicId?: string,
    currentSubjectName?: string,
    currentTopicName?: string
  ): Promise<void> => {
    if (!userId || !messages.length) return;

    const actualTopicId = currentTopicId || topicId;
    const actualSubjectName = currentSubjectName || subjectName;
    const actualTopicName = currentTopicName || topicName;

    try {
      let topicProgressId: string | undefined;
      
      if (actualTopicId && actualSubjectName && actualTopicName) {
        topicProgressId = await getTopicProgressId(
          actualTopicId,
          actualSubjectName,
          actualTopicName
        ) || undefined;
      }

      await userDataService.saveAICoachConversation(
        userId,
        messages,
        topicProgressId
      );

      console.log('✅ Conversa do AI Coach salva no Supabase');
    } catch (error) {
      console.error('Erro ao salvar conversa do AI Coach:', error);
    }
  }, [userId, getTopicProgressId, topicId, subjectName, topicName]);

  return {
    saveQuestionAttempt,
    saveStudySession,
    saveAICoachConversation,
    isEnabled: !!userId
  };
};

export default useSupabaseQuestionTracking;