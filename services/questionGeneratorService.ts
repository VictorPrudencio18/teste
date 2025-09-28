import { generateContent } from './geminiService';
import { Question } from '../types';

interface QuestionGenerationRequest {
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  quantity: number;
  category?: string;
  language?: string;
}

export class QuestionGeneratorService {
  private generatePrompt(request: QuestionGenerationRequest): string {
    const { topic, difficulty, quantity, category, language = 'pt-BR' } = request;
    
    const difficultyDescriptions = {
      easy: 'básico - conceitos fundamentais e definições',
      medium: 'intermediário - aplicação de conceitos e análise',
      hard: 'avançado - síntese, avaliação crítica e resolução de problemas complexos'
    };

    return `
Você é um especialista em educação e criação de questões. Crie ${quantity} questões de múltipla escolha sobre o tópico "${topic}" com nível de dificuldade ${difficultyDescriptions[difficulty]}.

INSTRUÇÕES IMPORTANTES:
1. Cada questão deve ter exatamente 4 alternativas (A, B, C, D)
2. Apenas uma alternativa deve estar correta
3. Inclua uma explicação clara para a resposta correta
4. As questões devem ser educativas e bem formuladas
5. Evite pegadinhas desnecessárias, foque no conhecimento real
6. Use linguagem clara e acessível em português brasileiro
${category ? `7. Categoria: ${category}` : ''}

FORMATO DE RESPOSTA (JSON):
{
  "questions": [
    {
      "questionText": "Pergunta aqui?",
      "options": ["Alternativa A", "Alternativa B", "Alternativa C", "Alternativa D"],
      "correctAnswerIndex": 0,
      "explanation": "Explicação detalhada da resposta correta",
      "difficulty": "${difficulty}",
      "topic": "${topic}",
      "category": "${category || 'Geral'}"
    }
  ]
}

Certifique-se de retornar um JSON válido com exatamente ${quantity} questões.
`;
  }

  async generateQuestions(request: QuestionGenerationRequest): Promise<Question[]> {
    try {
      const prompt = this.generatePrompt(request);
      const response = await generateContent(prompt);
      
      // Tenta extrair JSON da resposta
      let jsonStr = response;
      
      // Remove markdown code blocks se existirem
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.split('```json')[1].split('```')[0];
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.split('```')[1].split('```')[0];
      }
      
      const parsed = JSON.parse(jsonStr.trim());
      
      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        throw new Error('Formato de resposta inválido - não contém array de questões');
      }

      // Valida e formata as questões
      const questions: Question[] = parsed.questions.map((q: any, index: number) => {
        if (!q.questionText || !Array.isArray(q.options) || q.options.length !== 4) {
          throw new Error(`Questão ${index + 1} está malformada`);
        }

        if (typeof q.correctAnswerIndex !== 'number' || q.correctAnswerIndex < 0 || q.correctAnswerIndex > 3) {
          throw new Error(`Índice de resposta correta inválido na questão ${index + 1}`);
        }

        return {
          id: `generated_${Date.now()}_${index}`,
          questionText: q.questionText,
          options: q.options,
          correctAnswerIndex: q.correctAnswerIndex,
          explanation: q.explanation || 'Explicação não fornecida',
          difficulty: request.difficulty,
          topic: request.topic,
          category: request.category || 'Geral'
        };
      });

      return questions;

    } catch (error) {
      console.error('Erro ao gerar questões:', error);
      
      // Fallback: retorna questões de exemplo se a geração falhar
      return this.getFallbackQuestions(request);
    }
  }

  private getFallbackQuestions(request: QuestionGenerationRequest): Question[] {
    const fallbackQuestions: Question[] = [
      {
        id: `fallback_${Date.now()}_0`,
        questionText: `Questão de exemplo sobre ${request.topic} (nível ${request.difficulty})`,
        options: [
          'Alternativa A - Esta é a resposta correta',
          'Alternativa B - Esta é incorreta',
          'Alternativa C - Esta também é incorreta',
          'Alternativa D - Esta também é incorreta'
        ],
        correctAnswerIndex: 0,
        explanation: `Esta é uma questão de exemplo gerada automaticamente sobre ${request.topic}. A resposta correta é a alternativa A.`,
        difficulty: request.difficulty,
        topic: request.topic,
        category: request.category || 'Geral'
      }
    ];

    return fallbackQuestions.slice(0, request.quantity);
  }

  // Gera questões baseadas em conteúdo específico (texto, slides, etc.)
  async generateQuestionsFromContent(
    content: string,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium',
    quantity: number = 5,
    category?: string
  ): Promise<Question[]> {
    const prompt = `
Baseando-se no conteúdo fornecido abaixo, crie ${quantity} questões de múltipla escolha de nível ${difficulty}.

CONTEÚDO:
${content}

INSTRUÇÕES:
1. As questões devem ser baseadas exclusivamente no conteúdo fornecido
2. Cada questão deve ter 4 alternativas
3. Inclua explicação para cada resposta correta
4. Varie o tipo de questão (definições, aplicações, comparações, etc.)
5. Mantenha a dificuldade ${difficulty}

FORMATO DE RESPOSTA (JSON):
{
  "questions": [
    {
      "questionText": "Pergunta baseada no conteúdo?",
      "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
      "correctAnswerIndex": 0,
      "explanation": "Explicação baseada no conteúdo fornecido",
      "difficulty": "${difficulty}",
      "topic": "Tópico extraído do conteúdo",
      "category": "${category || 'Conteúdo Personalizado'}"
    }
  ]
}
`;

    try {
      const response = await generateContent(prompt);
      let jsonStr = response;
      
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.split('```json')[1].split('```')[0];
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.split('```')[1].split('```')[0];
      }
      
      const parsed = JSON.parse(jsonStr.trim());
      
      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        throw new Error('Formato de resposta inválido');
      }

      return parsed.questions.map((q: any, index: number) => ({
        id: `content_${Date.now()}_${index}`,
        questionText: q.questionText,
        options: q.options,
        correctAnswerIndex: q.correctAnswerIndex,
        explanation: q.explanation || 'Explicação não fornecida',
        difficulty: difficulty,
        topic: q.topic || 'Conteúdo Personalizado',
        category: category || 'Conteúdo Personalizado'
      }));

    } catch (error) {
      console.error('Erro ao gerar questões do conteúdo:', error);
      throw error;
    }
  }

  // Gera questões adaptativas baseadas no histórico do usuário
  async generateAdaptiveQuestions(
    userWeakCategories: string[],
    userStrongCategories: string[],
    preferredDifficulty: 'easy' | 'medium' | 'hard',
    quantity: number = 10
  ): Promise<Question[]> {
    const focusAreas = userWeakCategories.length > 0 
      ? userWeakCategories 
      : userStrongCategories.length > 0 
        ? userStrongCategories 
        : ['Conhecimentos Gerais'];

    const prompt = `
Crie ${quantity} questões adaptativas focando nas seguintes áreas que precisam de reforço: ${focusAreas.join(', ')}.

DIRETRIZES:
1. 70% das questões devem focar nas áreas fracas: ${userWeakCategories.join(', ')}
2. 30% das questões podem abordar áreas conhecidas para reforço: ${userStrongCategories.join(', ')}
3. Dificuldade base: ${preferredDifficulty}
4. Varie ligeiramente a dificuldade para desafio progressivo
5. Questões devem ser educativas e construtivas

FORMATO DE RESPOSTA (JSON):
{
  "questions": [
    {
      "questionText": "Pergunta adaptativa?",
      "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
      "correctAnswerIndex": 0,
      "explanation": "Explicação educativa",
      "difficulty": "easy|medium|hard",
      "topic": "Tópico específico",
      "category": "Categoria da área de foco"
    }
  ]
}
`;

    try {
      const response = await generateContent(prompt);
      let jsonStr = response;
      
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.split('```json')[1].split('```')[0];
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.split('```')[1].split('```')[0];
      }
      
      const parsed = JSON.parse(jsonStr.trim());
      
      return parsed.questions.map((q: any, index: number) => ({
        id: `adaptive_${Date.now()}_${index}`,
        questionText: q.questionText,
        options: q.options,
        correctAnswerIndex: q.correctAnswerIndex,
        explanation: q.explanation || 'Explicação não fornecida',
        difficulty: q.difficulty || preferredDifficulty,
        topic: q.topic || 'Adaptativo',
        category: q.category || 'Personalizado'
      }));

    } catch (error) {
      console.error('Erro ao gerar questões adaptativas:', error);
      throw error;
    }
  }
}

// Singleton instance
export const questionGeneratorService = new QuestionGeneratorService();