import { 
  Question, 
  QuestionAttempt, 
  QuestionMemory, 
  QuizSession, 
  UserQuestionProfile, 
  QuestionRecommendation 
} from '../types';

class QuestionService {
  private readonly STORAGE_KEY = 'user_question_profile';
  private userProfile: UserQuestionProfile | null = null;

  constructor() {
    this.loadUserProfile();
  }

  private loadUserProfile(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.userProfile = JSON.parse(stored);
      } else {
        this.userProfile = this.createDefaultProfile();
      }
    } catch (error) {
      console.error('Erro ao carregar perfil de questões:', error);
      this.userProfile = this.createDefaultProfile();
    }
  }

  private createDefaultProfile(): UserQuestionProfile {
    return {
      questionsMemory: {},
      totalQuestionsAnswered: 0,
      totalCorrectAnswers: 0,
      averageScore: 0,
      strongCategories: [],
      weakCategories: [],
      preferredDifficulty: 'medium',
      totalStudyTime: 0,
      quizSessions: [],
      lastActivityTimestamp: Date.now(),
      streakDays: 0,
      longestStreak: 0,
      achievements: []
    };
  }

  private saveUserProfile(): void {
    if (this.userProfile) {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.userProfile));
      } catch (error) {
        console.error('Erro ao salvar perfil de questões:', error);
      }
    }
  }

  // Registra uma tentativa de resposta
  recordAttempt(
    questionId: string, 
    selectedAnswerIndex: number, 
    isCorrect: boolean, 
    timeSpent: number,
    question: Question
  ): void {
    if (!this.userProfile) return;

    const attempt: QuestionAttempt = {
      questionId,
      isCorrect,
      selectedAnswerIndex,
      timeSpent,
      timestamp: Date.now(),
      hintsUsed: 0
    };

    // Atualiza ou cria memória da questão
    if (!this.userProfile.questionsMemory[questionId]) {
      this.userProfile.questionsMemory[questionId] = {
        questionId,
        totalAttempts: 0,
        correctAttempts: 0,
        incorrectAttempts: 0,
        averageTimeSpent: 0,
        lastAttemptTimestamp: Date.now(),
        consecutiveCorrect: 0,
        consecutiveIncorrect: 0,
        difficultyRating: question.difficulty || 'medium',
        masteryLevel: 'learning',
        topicId: question.topic,
        category: question.category,
        attempts: []
      };
    }

    const memory = this.userProfile.questionsMemory[questionId];
    memory.attempts.push(attempt);
    memory.totalAttempts++;
    memory.lastAttemptTimestamp = Date.now();

    if (isCorrect) {
      memory.correctAttempts++;
      memory.consecutiveCorrect++;
      memory.consecutiveIncorrect = 0;
    } else {
      memory.incorrectAttempts++;
      memory.consecutiveIncorrect++;
      memory.consecutiveCorrect = 0;
    }

    // Recalcula tempo médio
    memory.averageTimeSpent = memory.attempts.reduce((sum, att) => sum + att.timeSpent, 0) / memory.attempts.length;

    // Atualiza nível de maestria
    this.updateMasteryLevel(memory);

    // Atualiza estatísticas gerais
    this.userProfile.totalQuestionsAnswered++;
    if (isCorrect) {
      this.userProfile.totalCorrectAnswers++;
    }
    this.userProfile.averageScore = (this.userProfile.totalCorrectAnswers / this.userProfile.totalQuestionsAnswered) * 100;
    this.userProfile.totalStudyTime += timeSpent;
    this.userProfile.lastActivityTimestamp = Date.now();

    // Atualiza streak
    this.updateStreak();

    // Atualiza categorias fortes/fracas
    this.updateCategoriesStrength();

    this.saveUserProfile();
  }

  private updateMasteryLevel(memory: QuestionMemory): void {
    const accuracy = memory.correctAttempts / memory.totalAttempts;
    
    if (memory.totalAttempts < 3) {
      memory.masteryLevel = 'learning';
    } else if (accuracy >= 0.8 && memory.consecutiveCorrect >= 3) {
      memory.masteryLevel = 'mastered';
    } else if (accuracy >= 0.6) {
      memory.masteryLevel = 'practicing';
    } else {
      memory.masteryLevel = 'learning';
    }
  }

  private updateStreak(): void {
    if (!this.userProfile) return;

    const today = new Date().toDateString();
    const lastActivity = new Date(this.userProfile.lastActivityTimestamp).toDateString();
    
    if (today === lastActivity) {
      // Mesmo dia, mantém streak
      return;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (lastActivity === yesterday.toDateString()) {
      // Atividade ontem, incrementa streak
      this.userProfile.streakDays++;
      if (this.userProfile.streakDays > this.userProfile.longestStreak) {
        this.userProfile.longestStreak = this.userProfile.streakDays;
      }
    } else {
      // Perdeu o streak
      this.userProfile.streakDays = 1;
    }
  }

  private updateCategoriesStrength(): void {
    if (!this.userProfile) return;

    const categoryStats: { [category: string]: { correct: number; total: number } } = {};

    Object.values(this.userProfile.questionsMemory).forEach(memory => {
      if (memory.category) {
        if (!categoryStats[memory.category]) {
          categoryStats[memory.category] = { correct: 0, total: 0 };
        }
        categoryStats[memory.category].correct += memory.correctAttempts;
        categoryStats[memory.category].total += memory.totalAttempts;
      }
    });

    const categoryAccuracies = Object.entries(categoryStats)
      .map(([category, stats]) => ({
        category,
        accuracy: stats.correct / stats.total
      }))
      .filter(item => !isNaN(item.accuracy))
      .sort((a, b) => b.accuracy - a.accuracy);

    this.userProfile.strongCategories = categoryAccuracies
      .filter(item => item.accuracy >= 0.7)
      .slice(0, 5)
      .map(item => item.category);

    this.userProfile.weakCategories = categoryAccuracies
      .filter(item => item.accuracy < 0.5)
      .slice(-5)
      .map(item => item.category);
  }

  // Inicia uma nova sessão de quiz
  startQuizSession(questions: Question[], category?: string, topicId?: string): QuizSession {
    const session: QuizSession = {
      id: `quiz_${Date.now()}`,
      userId: this.userProfile?.userId,
      startTimestamp: Date.now(),
      questions,
      attempts: [],
      score: 0,
      totalQuestions: questions.length,
      correctAnswers: 0,
      timeSpent: 0,
      category,
      topicId,
      difficulty: this.determineDifficulty(questions),
      isCompleted: false
    };

    return session;
  }

  // Finaliza uma sessão de quiz
  completeQuizSession(session: QuizSession): void {
    if (!this.userProfile) return;

    session.endTimestamp = Date.now();
    session.timeSpent = session.endTimestamp - session.startTimestamp;
    session.isCompleted = true;
    session.score = (session.correctAnswers / session.totalQuestions) * 100;

    this.userProfile.quizSessions.push(session);
    
    // Mantém apenas as últimas 50 sessões
    if (this.userProfile.quizSessions.length > 50) {
      this.userProfile.quizSessions = this.userProfile.quizSessions.slice(-50);
    }

    this.saveUserProfile();
  }

  private determineDifficulty(questions: Question[]): 'easy' | 'medium' | 'hard' {
    const difficulties = questions.map(q => q.difficulty || 'medium');
    const counts = {
      easy: difficulties.filter(d => d === 'easy').length,
      medium: difficulties.filter(d => d === 'medium').length,
      hard: difficulties.filter(d => d === 'hard').length
    };

    if (counts.hard > counts.medium && counts.hard > counts.easy) return 'hard';
    if (counts.easy > counts.medium && counts.easy > counts.hard) return 'easy';
    return 'medium';
  }

  // Obtém recomendações de questões baseadas no histórico
  getQuestionRecommendations(availableQuestions: Question[], limit: number = 10): QuestionRecommendation[] {
    if (!this.userProfile) return [];

    const recommendations: QuestionRecommendation[] = [];

    availableQuestions.forEach(question => {
      const memory = this.userProfile!.questionsMemory[question.id];
      let priority = 5; // prioridade base
      let reason: QuestionRecommendation['reason'] = 'new_topic';

      if (!memory) {
        // Questão nunca respondida
        priority = 7;
        reason = 'new_topic';
      } else if (memory.masteryLevel === 'learning' || memory.consecutiveIncorrect > 1) {
        // Questão com dificuldades
        priority = 9;
        reason = 'weak_category';
      } else if (memory.masteryLevel === 'mastered') {
        // Repetição espaçada para questões dominadas
        const daysSinceLastAttempt = (Date.now() - memory.lastAttemptTimestamp) / (1000 * 60 * 60 * 24);
        if (daysSinceLastAttempt > 7) {
          priority = 6;
          reason = 'spaced_repetition';
        } else {
          priority = 2; // baixa prioridade para questões recentemente dominadas
        }
      } else {
        // Questões em prática
        priority = 5;
        reason = 'difficulty_progression';
      }

      // Ajusta prioridade baseada em categoria fraca
      if (question.category && this.userProfile!.weakCategories.includes(question.category)) {
        priority += 2;
        reason = 'weak_category';
      }

      recommendations.push({
        questionId: question.id,
        reason,
        priority,
        estimatedDifficulty: question.difficulty || 'medium'
      });
    });

    return recommendations
      .sort((a, b) => b.priority - a.priority)
      .slice(0, limit);
  }

  // Obtém estatísticas do usuário
  getUserStats(): {
    totalQuestions: number;
    correctPercentage: number;
    averageTimePerQuestion: number;
    strongCategories: string[];
    weakCategories: string[];
    currentStreak: number;
    longestStreak: number;
    recentSessions: QuizSession[];
    masteryDistribution: { learning: number; practicing: number; mastered: number };
  } {
    if (!this.userProfile) {
      return {
        totalQuestions: 0,
        correctPercentage: 0,
        averageTimePerQuestion: 0,
        strongCategories: [],
        weakCategories: [],
        currentStreak: 0,
        longestStreak: 0,
        recentSessions: [],
        masteryDistribution: { learning: 0, practicing: 0, mastered: 0 }
      };
    }

    const memories = Object.values(this.userProfile.questionsMemory);
    const averageTimePerQuestion = memories.length > 0 
      ? memories.reduce((sum, m) => sum + m.averageTimeSpent, 0) / memories.length 
      : 0;

    const masteryDistribution = memories.reduce(
      (acc, memory) => {
        acc[memory.masteryLevel]++;
        return acc;
      },
      { learning: 0, practicing: 0, mastered: 0 }
    );

    return {
      totalQuestions: this.userProfile.totalQuestionsAnswered,
      correctPercentage: this.userProfile.averageScore,
      averageTimePerQuestion,
      strongCategories: this.userProfile.strongCategories,
      weakCategories: this.userProfile.weakCategories,
      currentStreak: this.userProfile.streakDays,
      longestStreak: this.userProfile.longestStreak,
      recentSessions: this.userProfile.quizSessions.slice(-5),
      masteryDistribution
    };
  }

  // Obtém histórico de uma questão específica
  getQuestionHistory(questionId: string): QuestionMemory | null {
    if (!this.userProfile) return null;
    return this.userProfile.questionsMemory[questionId] || null;
  }

  // Reseta dados do usuário (útil para desenvolvimento/teste)
  resetUserData(): void {
    this.userProfile = this.createDefaultProfile();
    this.saveUserProfile();
  }

  // Exporta dados do usuário (para backup)
  exportUserData(): string {
    return JSON.stringify(this.userProfile, null, 2);
  }

  // Importa dados do usuário (para restaurar backup)
  importUserData(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      this.userProfile = parsed;
      this.saveUserProfile();
      return true;
    } catch (error) {
      console.error('Erro ao importar dados:', error);
      return false;
    }
  }
}

// Singleton instance
export const questionService = new QuestionService();