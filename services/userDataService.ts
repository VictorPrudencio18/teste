import { supabase } from './supabaseClient';
import { 
  EditalAnalysisData, 
  AnalyzedTopic, 
  UserProfile, 
  ChatMessage, 
  Question, 
  QuestionAttempt 
} from '../types';

// Interfaces para as tabelas do Supabase
interface UserEdital {
  id?: string;
  user_id: string;
  edital_text: string;
  edital_filename?: string;
  analysis_result?: EditalAnalysisData;
  selected_role?: string;
  processed_at?: string;
  updated_at?: string;
}

interface TopicProgress {
  id?: string;
  user_id: string;
  edital_id: string;
  subject_name: string;
  topic_name: string;
  topic_id: string;
  content_generated?: Record<string, any>;
  interactions?: Record<string, any>;
  study_time_minutes?: number;
  last_studied?: string;
  mastery_level?: 'not_started' | 'learning' | 'practicing' | 'mastered';
  created_at?: string;
  updated_at?: string;
}

interface QuestionAttemptRecord {
  id?: string;
  user_id: string;
  topic_progress_id: string;
  question_data: Record<string, any>;
  selected_answer_index: number;
  is_correct: boolean;
  time_spent_seconds: number;
  hints_used?: number;
  created_at?: string;
}

interface AICoachConversation {
  id?: string;
  user_id: string;
  topic_progress_id?: string;
  messages: ChatMessage[];
  created_at?: string;
  updated_at?: string;
}

class UserDataService {
  private ensureSupabase() {
    if (!supabase) {
      throw new Error('Supabase não configurado. Verifique as variáveis de ambiente.');
    }
  }

  // Salva o edital processado do usuário
  async saveUserEdital(
    userId: string,
    editalText: string,
    editalFileName?: string,
    analysisResult?: EditalAnalysisData,
    selectedRole?: string
  ): Promise<string | null> {
    this.ensureSupabase();

    try {
      const editalData: UserEdital = {
        user_id: userId,
        edital_text: editalText,
        edital_filename: editalFileName,
        analysis_result: analysisResult,
        selected_role: selectedRole,
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('user_editals')
        .upsert(editalData, { 
          onConflict: 'user_id,edital_filename',
          ignoreDuplicates: false 
        })
        .select('id')
        .single();

      if (error) {
        console.error('Erro ao salvar edital:', error);
        throw new Error(error.message);
      }

      console.log('Edital salvo com sucesso:', data?.id);
      return data?.id || null;
    } catch (error) {
      console.error('Falha ao salvar edital:', error);
      throw error;
    }
  }

  // Salva ou atualiza o progresso de um tópico
  async saveTopicProgress(
    userId: string,
    editalId: string,
    topic: AnalyzedTopic,
    subjectName: string,
    interactions?: Record<string, any>,
    studyTimeMinutes?: number
  ): Promise<string | null> {
    this.ensureSupabase();

    try {
      const progressData: TopicProgress = {
        user_id: userId,
        edital_id: editalId,
        subject_name: subjectName,
        topic_name: topic.name,
        topic_id: topic.id,
        content_generated: topic.content || {},
        interactions: interactions || {},
        study_time_minutes: studyTimeMinutes || 0,
        last_studied: new Date().toISOString(),
        mastery_level: this.calculateMasteryLevel(topic, interactions),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('topic_progress')
        .upsert(progressData, { 
          onConflict: 'user_id,topic_id',
          ignoreDuplicates: false 
        })
        .select('id')
        .single();

      if (error) {
        console.error('Erro ao salvar progresso do tópico:', error);
        throw new Error(error.message);
      }

      console.log('Progresso do tópico salvo:', data?.id);
      return data?.id || null;
    } catch (error) {
      console.error('Falha ao salvar progresso do tópico:', error);
      throw error;
    }
  }

  // Salva uma tentativa de resposta de questão
  async saveQuestionAttempt(
    userId: string,
    topicProgressId: string,
    question: Question,
    selectedAnswerIndex: number,
    isCorrect: boolean,
    timeSpentSeconds: number,
    hintsUsed?: number
  ): Promise<string | null> {
    this.ensureSupabase();

    try {
      const attemptData: QuestionAttemptRecord = {
        user_id: userId,
        topic_progress_id: topicProgressId,
        question_data: {
          id: question.id,
          questionText: question.questionText,
          options: question.options,
          correctAnswerIndex: question.correctAnswerIndex,
          explanation: question.explanation,
          difficulty: question.difficulty,
          topic: question.topic,
          category: question.category
        },
        selected_answer_index: selectedAnswerIndex,
        is_correct: isCorrect,
        time_spent_seconds: timeSpentSeconds,
        hints_used: hintsUsed || 0,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('user_question_attempts')
        .insert(attemptData)
        .select('id')
        .single();

      if (error) {
        console.error('Erro ao salvar tentativa de questão:', error);
        throw new Error(error.message);
      }

      console.log('Tentativa de questão salva:', data?.id);
      return data?.id || null;
    } catch (error) {
      console.error('Falha ao salvar tentativa de questão:', error);
      throw error;
    }
  }

  // Salva conversas do AI Coach
  async saveAICoachConversation(
    userId: string,
    messages: ChatMessage[],
    topicProgressId?: string
  ): Promise<string | null> {
    this.ensureSupabase();

    try {
      const conversationData: AICoachConversation = {
        user_id: userId,
        topic_progress_id: topicProgressId,
        messages: messages,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('ai_coach_conversations')
        .upsert(conversationData, { 
          onConflict: 'user_id,topic_progress_id',
          ignoreDuplicates: false 
        })
        .select('id')
        .single();

      if (error) {
        console.error('Erro ao salvar conversa do AI Coach:', error);
        throw new Error(error.message);
      }

      console.log('Conversa do AI Coach salva:', data?.id);
      return data?.id || null;
    } catch (error) {
      console.error('Falha ao salvar conversa do AI Coach:', error);
      throw error;
    }
  }

  // Salva uma sessão de estudo
  async saveStudySession(
    userId: string,
    subjectName: string,
    topicName: string,
    durationMinutes: number,
    sessionType: 'reading' | 'questions' | 'flashcards' | 'ai_coach',
    performanceScore?: number,
    notes?: string
  ): Promise<string | null> {
    this.ensureSupabase();

    try {
      const sessionData = {
        user_id: userId,
        subject_name: subjectName,
        topic_name: topicName,
        duration_minutes: durationMinutes,
        session_type: sessionType,
        performance_score: performanceScore,
        notes: notes,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('study_sessions')
        .insert(sessionData)
        .select('id')
        .single();

      if (error) {
        console.error('Erro ao salvar sessão de estudo:', error);
        throw new Error(error.message);
      }

      console.log('Sessão de estudo salva:', data?.id);
      return data?.id || null;
    } catch (error) {
      console.error('Falha ao salvar sessão de estudo:', error);
      throw error;
    }
  }

  // Obtém o edital mais recente do usuário
  async getUserLatestEdital(userId: string): Promise<UserEdital | null> {
    this.ensureSupabase();

    try {
      const { data, error } = await supabase
        .from('user_editals')
        .select('*')
        .eq('user_id', userId)
        .order('processed_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Não encontrado
        console.error('Erro ao buscar edital:', error);
        throw new Error(error.message);
      }

      return data as UserEdital;
    } catch (error) {
      console.error('Falha ao buscar edital:', error);
      return null;
    }
  }

  // Obtém o progresso de todos os tópicos do usuário
  async getUserTopicProgress(userId: string, editalId?: string): Promise<TopicProgress[]> {
    this.ensureSupabase();

    try {
      let query = supabase
        .from('topic_progress')
        .select('*')
        .eq('user_id', userId)
        .order('last_studied', { ascending: false });

      if (editalId) {
        query = query.eq('edital_id', editalId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar progresso de tópicos:', error);
        throw new Error(error.message);
      }

      return data as TopicProgress[];
    } catch (error) {
      console.error('Falha ao buscar progresso de tópicos:', error);
      return [];
    }
  }

  // Obtém estatísticas de questões do usuário
  async getUserQuestionStats(userId: string, topicProgressId?: string) {
    this.ensureSupabase();

    try {
      let query = supabase
        .from('user_question_attempts')
        .select('*')
        .eq('user_id', userId);

      if (topicProgressId) {
        query = query.eq('topic_progress_id', topicProgressId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar estatísticas de questões:', error);
        throw new Error(error.message);
      }

      // Calcular estatísticas
      const attempts = data || [];
      const totalAttempts = attempts.length;
      const correctAttempts = attempts.filter(a => a.is_correct).length;
      const accuracy = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;
      const averageTime = totalAttempts > 0 
        ? attempts.reduce((sum, a) => sum + a.time_spent_seconds, 0) / totalAttempts 
        : 0;

      return {
        totalAttempts,
        correctAttempts,
        accuracy,
        averageTimeSeconds: averageTime,
        attempts: data
      };
    } catch (error) {
      console.error('Falha ao buscar estatísticas de questões:', error);
      return {
        totalAttempts: 0,
        correctAttempts: 0,
        accuracy: 0,
        averageTimeSeconds: 0,
        attempts: []
      };
    }
  }

  // Métodos auxiliares
  private calculateMasteryLevel(
    topic: AnalyzedTopic, 
    interactions?: Record<string, any>
  ): 'not_started' | 'learning' | 'practicing' | 'mastered' {
    // Lógica para determinar nível de domínio baseado no conteúdo e interações
    const hasContent = topic.content && Object.keys(topic.content).length > 0;
    const hasInteractions = interactions && Object.keys(interactions).length > 0;

    if (!hasContent && !hasInteractions) {
      return 'not_started';
    } else if (hasContent && !hasInteractions) {
      return 'learning';
    } else if (hasContent && hasInteractions) {
      return 'practicing';
    } else {
      return 'mastered';
    }
  }

  // Método para salvar automaticamente todos os dados relevantes quando um edital é processado
  async saveCompleteUserData(
    userId: string,
    editalText: string,
    editalFileName: string,
    analysisResult: EditalAnalysisData,
    selectedRole: string,
    userProfile?: UserProfile
  ): Promise<{ editalId: string; topicProgressIds: string[] }> {
    this.ensureSupabase();

    try {
      console.log('Iniciando salvamento completo dos dados do usuário...');

      // 1. Salvar o edital
      const editalId = await this.saveUserEdital(
        userId,
        editalText,
        editalFileName,
        analysisResult,
        selectedRole
      );

      if (!editalId) {
        throw new Error('Falha ao salvar edital');
      }

      // 2. Salvar progresso inicial de todos os tópicos
      const topicProgressIds: string[] = [];

      for (const subject of analysisResult.subjects) {
        for (const topic of subject.topics) {
          const progressId = await this.saveTopicProgress(
            userId,
            editalId,
            topic,
            subject.name,
            {}, // interações iniciais vazias
            0 // tempo de estudo inicial
          );

          if (progressId) {
            topicProgressIds.push(progressId);
          }
        }
      }

      // 3. Atualizar perfil do usuário se fornecido
      if (userProfile) {
        await this.updateUserProfile(userId, userProfile);
      }

      console.log(`Dados completos salvos: edital ${editalId}, ${topicProgressIds.length} tópicos`);

      return {
        editalId,
        topicProgressIds
      };

    } catch (error) {
      console.error('Erro no salvamento completo:', error);
      throw error;
    }
  }

  // Atualiza o perfil do usuário
  private async updateUserProfile(userId: string, userProfile: UserProfile): Promise<void> {
    this.ensureSupabase();

    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: userId,
          target_role: userProfile.targetRole,
          daily_study_hours: userProfile.dailyStudyHours,
          study_days: userProfile.studyDays,
          study_notes: userProfile.studyNotes,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (error) {
        console.error('Erro ao atualizar perfil:', error);
        throw new Error(error.message);
      }

      console.log('Perfil do usuário atualizado com sucesso');
    } catch (error) {
      console.error('Falha ao atualizar perfil:', error);
      throw error;
    }
  }
}

// Instância singleton
export const userDataService = new UserDataService();
export default userDataService;