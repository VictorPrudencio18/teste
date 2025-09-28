# 🧠 Sistema Avançado de Questões com IA

## 📋 Visão Geral

O Sistema de Questões é um módulo completo e inteligente que utiliza Inteligência Artificial para criar uma experiência de aprendizado personalizada e adaptativa. O sistema inclui:

- **Geração automática de questões** com IA (Gemini AI)
- **Sistema de memória** que lembra acertos e erros
- **Aprendizado adaptativo** baseado no histórico do usuário
- **Análise detalhada** com estatísticas e insights
- **Interface responsiva** e intuitiva

## 🚀 Funcionalidades Principais

### 🤖 Geração Inteligente de Questões
- Criação automática de questões sobre qualquer tópico
- Questões baseadas em conteúdo personalizado (textos, slides, anotações)
- Diferentes níveis de dificuldade (fácil, médio, difícil)
- Explicações detalhadas para cada resposta
- Suporte a múltiplas categorias de estudo

### 🧠 Sistema de Memória Avançado
- Rastreamento individual de cada questão respondida
- Registro de acertos, erros e tempo de resposta
- Identificação automática de pontos fortes e fracos
- Cálculo de nível de maestria (aprendendo, praticando, dominado)
- Histórico completo de tentativas por questão

### 🎯 Aprendizado Adaptativo
- Questões personalizadas baseadas no histórico do usuário
- Foco automático em áreas que precisam de melhoria
- Repetição espaçada para melhor retenção
- Progressão inteligente de dificuldade
- Recomendações de estudo personalizadas

### 📊 Análise e Estatísticas Detalhadas
- Taxa de acerto geral e por categoria
- Tempo médio de resposta por questão
- Sequências de acertos (streaks)
- Histórico de sessões com detalhes completos
- Identificação de categorias fortes e fracas
- Distribuição de maestria por tópicos

## 🏗️ Arquitetura do Sistema

### Componentes Principais

#### 1. **QuestionManager** (`/components/common/QuestionManager.tsx`)
- Componente principal que gerencia todo o fluxo
- Interface para gerar questões e iniciar sessões
- Navegação entre diferentes modos (geração, quiz, estatísticas)
- Dashboard com métricas rápidas

#### 2. **QuestionSystem** (`/components/common/QuestionSystem.tsx`)
- Componente de execução de quizzes
- Interface para responder questões
- Feedback imediato com explicações
- Progressão visual e controles de navegação

#### 3. **QuestionStats** (`/components/common/QuestionStats.tsx`)
- Visualização detalhada de estatísticas
- Análise de desempenho por categoria
- Histórico de sessões e recordes pessoais
- Ferramentas de exportação/importação de dados

#### 4. **QuestionSystemStep** (`/components/steps/QuestionSystemStep.tsx`)
- Integração com o fluxo principal da aplicação
- Apresentação das funcionalidades
- Navegação entre etapas

#### 5. **QuestionSystemIntegration** (`/components/common/QuestionSystemIntegration.tsx`)
- Página de demonstração completa
- Explicação detalhada das funcionalidades
- Guia de como usar o sistema

### Serviços

#### 1. **QuestionService** (`/services/questionService.ts`)
- Classe principal de gerenciamento do sistema
- Persistência local com localStorage
- Cálculo de estatísticas e recomendações
- Algoritmos de aprendizado adaptativo

**Principais métodos:**
- `recordAttempt()`: Registra uma tentativa de resposta
- `startQuizSession()`: Inicia nova sessão de quiz
- `getUserStats()`: Obtém estatísticas completas
- `getQuestionRecommendations()`: Gera recomendações personalizadas

#### 2. **QuestionGeneratorService** (`/services/questionGeneratorService.ts`)
- Integração com Gemini AI para geração de questões
- Diferentes tipos de geração (tópico, conteúdo, adaptativa)
- Validação e formatação de questões
- Sistema de fallback para falhas de IA

**Principais métodos:**
- `generateQuestions()`: Gera questões por tópico
- `generateQuestionsFromContent()`: Gera questões de conteúdo personalizado
- `generateAdaptiveQuestions()`: Cria questões adaptativas

## 📝 Tipos e Interfaces

### Principais Types

```typescript
interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  explanation?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  topic?: string;
  category?: string;
}

interface QuestionMemory {
  questionId: string;
  totalAttempts: number;
  correctAttempts: number;
  averageTimeSpent: number;
  masteryLevel: 'learning' | 'practicing' | 'mastered';
  attempts: QuestionAttempt[];
}

interface UserQuestionProfile {
  questionsMemory: { [questionId: string]: QuestionMemory };
  totalQuestionsAnswered: number;
  averageScore: number;
  strongCategories: string[];
  weakCategories: string[];
  // ... mais propriedades
}
```

## 🔧 Como Usar

### 1. Integração Básica

```typescript
import { QuestionManager } from './components/common/QuestionManager';

function App() {
  return (
    <QuestionManager onBack={() => console.log('Voltar')} />
  );
}
```

### 2. Geração de Questões Programática

```typescript
import { questionGeneratorService } from './services/questionGeneratorService';

const questions = await questionGeneratorService.generateQuestions({
  topic: 'História do Brasil',
  difficulty: 'medium',
  quantity: 10,
  category: 'História'
});
```

### 3. Rastreamento Manual

```typescript
import { questionService } from './services/questionService';

// Registrar uma resposta
questionService.recordAttempt(
  'question_id',
  0, // índice da resposta selecionada
  true, // resposta correta
  15, // tempo em segundos
  question // objeto da questão
);

// Obter estatísticas
const stats = questionService.getUserStats();
```

## 💾 Persistência de Dados

O sistema utiliza `localStorage` para manter os dados do usuário:

- **Chave**: `user_question_profile`
- **Estrutura**: JSON com todas as informações de memória e estatísticas
- **Backup**: Funcionalidades de exportação/importação incluídas
- **Migração**: Sistema preparado para futuras atualizações

## 🎨 Customização

### Temas e Estilos
O sistema usa Tailwind CSS e é totalmente responsivo. Principais classes customizáveis:

- Cards: `bg-white shadow rounded-lg`
- Botões: Classes do componente `Button`
- Cores de status: Verde (correto), Vermelho (incorreto), Azul (neutro)

### Configurações
```typescript
// Configurações padrão no QuestionService
private readonly STORAGE_KEY = 'user_question_profile';
private createDefaultProfile(): UserQuestionProfile {
  return {
    preferredDifficulty: 'medium', // Personalizável
    // ... outras configurações
  };
}
```

## 🔄 Algoritmos de Aprendizado

### Sistema de Maestria
- **Learning**: < 3 tentativas ou precisão < 60%
- **Practicing**: 3+ tentativas, precisão 60-80%
- **Mastered**: 3+ tentativas, precisão > 80%, 3+ acertos consecutivos

### Repetição Espaçada
- Questões dominadas: repetição após 7+ dias
- Questões em prática: repetição regular
- Questões em aprendizado: alta prioridade

### Recomendações Personalizadas
1. **Áreas fracas**: Prioridade máxima (9/10)
2. **Questões novas**: Alta prioridade (7/10)
3. **Repetição espaçada**: Média prioridade (6/10)
4. **Questões dominadas recentes**: Baixa prioridade (2/10)

## 🚀 Futuras Melhorias

### Planejadas
- [ ] Sistema de conquistas e gamificação
- [ ] Integração com banco de dados remoto
- [ ] Análise preditiva de desempenho
- [ ] Exportação para PDF de relatórios
- [ ] Modo colaborativo/competitivo
- [ ] Integração com calendário de estudos

### Possíveis
- [ ] Suporte a questões discursivas
- [ ] Geração de questões por voz
- [ ] Integração com sistemas de vídeo aula
- [ ] Machine Learning local para recomendações

## 🐛 Troubleshooting

### Problemas Comuns

**1. Questões não são geradas**
- Verifique se a API_KEY do Gemini está configurada
- Verifique a conexão com internet
- Tópico muito específico pode resultar em falhas

**2. Dados não são salvos**
- Verifique se o localStorage está habilitado
- Navegação privada pode limitar persistência
- Use as funções de exportação como backup

**3. Performance lenta**
- Dados são processados localmente
- Grandes históricos podem impactar performance
- Use função de reset para dados de teste

## 📄 Licença

Este sistema faz parte do ConcursoGenius e segue as mesmas diretrizes de licenciamento do projeto principal.

## 🤝 Contribuição

Para contribuir com melhorias:

1. Entenda a arquitetura atual
2. Mantenha compatibilidade com dados existentes
3. Adicione testes adequados
4. Documente mudanças significativas
5. Considere impacto na performance

---

**Desenvolvido com ❤️ para otimizar seu aprendizado!**