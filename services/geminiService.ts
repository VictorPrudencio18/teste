
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GEMINI_TEXT_MODEL } from '../constants';
import { EditalAnalysisData, AnalyzedSubject, Question, Flashcard, TopicContent, ContentType, DiscursiveQuestion, AISuggestion, ChatMessage, FlashcardSelfAssessment, AnalyzedTopic, UserInteractions, DeeperUnderstandingContent } from '../types';
import { v4 as uuidv4 } from 'uuid';

const API_KEY = process.env.API_KEY || import.meta.env.VITE_API_KEY;

const getAi = () => {
  if (!API_KEY) {
    console.warn("API_KEY não configurada. Usando dados mockados para Gemini API.");
    console.warn("Variáveis disponíveis:", { 
      processEnvApiKey: process.env.API_KEY, 
      viteApiKey: import.meta.env.VITE_API_KEY 
    });
    return null;
  }
  console.log("✅ Gemini AI configurado com sucesso!");
  return new GoogleGenAI({ apiKey: API_KEY });
};

const parseGeminiJsonResponse = <T,>(textResponse: string): T | { error: string } => {
  let jsonStr = textResponse.trim();
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
  const match = jsonStr.match(fenceRegex);
  if (match && match[2]) {
    jsonStr = match[2].trim();
  }
  try {
    return JSON.parse(jsonStr) as T;
  } catch (e) {
    console.error("Falha ao parsear JSON da resposta Gemini:", e, "String original:", jsonStr);
    return { error: `Falha ao parsear JSON: ${ (e as Error).message }` };
  }
};

export const extractRolesFromEditalAI = async (editalText: string): Promise<{ roles: string[]; clarificationQuestions?: string[]; error?: string }> => {
  const ai = getAi();
  if (!ai) {
    // Mock data
    return new Promise(resolve => setTimeout(() => {
      const scenario = Math.random();
      if (scenario < 0.6) {
        resolve({
          roles: ["Analista Judiciário (Mock)", "Técnico em Informática (Mock)", "Assistente Administrativo (Mock)"],
          clarificationQuestions: ["O edital especifica a área de formação para Analista Judiciário? (Mock)"]
        });
      } else if (scenario < 0.8) {
        resolve({
          roles: [],
          clarificationQuestions: ["O documento parece ser um anexo. Poderia fornecer o edital principal para identificação dos cargos? (Mock)"],
        });
      } else {
        resolve({
          roles: [],
          error: "Não foi possível processar o documento para extrair cargos. Verifique se é o edital correto. (Mock)",
        });
      }
    }, 1200));
  }

  const prompt = `
    Você é um assistente especializado em analisar editais de concursos públicos brasileiros para extrair os NOMES DOS CARGOS/VAGAS oferecidos.
    Dado o seguinte texto do edital:
    ---
    ${editalText.substring(0, 50000)} 
    ---
    Por favor, extraia e liste os nomes dos cargos (posições, vagas) disponíveis neste edital.
    Se houver muitos cargos, liste os principais ou até um máximo de 15 cargos distintos.
    Formate a saída como um JSON com a seguinte estrutura:
    {
      "roles": ["Nome do Cargo 1", "Nome do Cargo 2", ...],
      "clarification_questions": ["Pergunta de clarificação 1?", "Pergunta 2?"],
      "error": "Mensagem de erro se não puder extrair."
    }
    Importante: Os valores de string dentro do JSON devem ser strings JSON válidas (ex: aspas duplas internas devem ser escapadas como \\").
    Se nenhum cargo for encontrado, retorne um array "roles" vazio.
    Se tiver dúvidas sobre o conteúdo ou precisar de mais informações para identificar os cargos, use "clarification_questions".
    Se não houver perguntas de clarificação, omita o campo ou retorne um array vazio.
    Se não houver erro, omita o campo "error".
    Retorne apenas o JSON.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const parsedResult = parseGeminiJsonResponse<{
      roles?: string[];
      clarification_questions?: string[];
      error?: string; 
    }>(response.text);

    if ('error' in parsedResult && 
        !('roles' in parsedResult) && 
        !('clarification_questions' in parsedResult)) {
      return { roles: [], error: (parsedResult as { error: string }).error };
    }
    
    const aiData = parsedResult as { 
        roles?: string[]; 
        clarification_questions?: string[]; 
        error?: string; 
    };

    if (aiData.error && (!aiData.roles || aiData.roles.length === 0)) {
      return { 
        roles: [], 
        error: aiData.error, 
        clarificationQuestions: aiData.clarification_questions
      };
    }

    return {
      roles: aiData.roles || [],
      clarificationQuestions: aiData.clarification_questions,
      error: (aiData.roles && aiData.roles.length > 0) ? undefined : aiData.error
    };

  } catch (error) {
    console.error("Erro ao extrair cargos com IA:", error);
    return { roles: [], error: `Erro na API Gemini ao extrair cargos: ${ (error as Error).message }` };
  }
};


export const analyzeEditalWithAI = async (editalText: string, targetRole: string): Promise<EditalAnalysisData> => {
  const ai = getAi();
  if (!ai) {
    // Mock data
    return new Promise(resolve => setTimeout(() => {
      const mockSubjects: AnalyzedSubject[] = [
        { id: uuidv4(), name: `Língua Portuguesa (Mock para ${targetRole})`, topics: [
          { id: "lp-topic1-mock", name: "Interpretação de Texto Avançada (Mock)", status: 'Pendente', userInteractions: { questions: {}, flashcards: {} } },
          { id: "lp-topic2-mock", name: "Gramática Normativa e Variações Linguísticas (Mock)", status: 'Pendente', userInteractions: { questions: {}, flashcards: {} } },
          { id: "lp-topic3-mock", name: "Redação Oficial e Discursiva (Mock)", status: 'Pendente', userInteractions: { questions: {}, flashcards: {} } },
        ]},
        { id: uuidv4(), name: `Conhecimentos Específicos Detalhados de ${targetRole} (Mock)`, topics: [
          { id: "ce-topic1-mock", name: `Tópico Específico Aprofundado 1 para ${targetRole} (Mock)`, status: 'Pendente', userInteractions: { questions: {}, flashcards: {} } },
          { id: "ce-topic2-mock", name: `Legislação Chave para ${targetRole} (Mock)`, status: 'Pendente', userInteractions: { questions: {}, flashcards: {} } },
          { id: "ce-topic3-mock", name: `Estudo de Caso Prático para ${targetRole} (Mock)`, status: 'Pendente', userInteractions: { questions: {}, flashcards: {} } },
          { id: "ce-topic4-mock", name: `Atualidades Relevantes para ${targetRole} (Mock)`, status: 'Estudando', userInteractions: { questions: {}, flashcards: {} } },
        ]},
        { id: uuidv4(), name: `Raciocínio Lógico e Matemático (Mock)`, topics: [
            { id: "rlm-topic1-mock", name: "Lógica Proposicional (Mock)", status: 'Concluído', userInteractions: {}},
            { id: "rlm-topic2-mock", name: "Análise Combinatória e Probabilidade (Mock)", status: 'Pendente', userInteractions: {}},
        ]}
      ];
      resolve({ 
        subjects: mockSubjects, 
        clarificationQuestionsFromAI: [
            `Este é um plano mockado e aprofundado para ${targetRole}. (Mock)`,
            `Verifique se a legislação específica para ${targetRole} está atualizada. (Mock)`
        ] 
      });
    }, 1500));
  }

  const prompt = `
    Você é um assistente de IA ultra especializado em analisar editais de concursos públicos brasileiros para montar planos de estudo. Sua principal tarefa é identificar e extrair, com precisão cirúrgica, as MATÉRIAS (disciplinas) e seus respectivos TÓPICOS de estudo para um CARGO ESPECÍFICO.

    O cargo alvo para esta análise é: "${targetRole}".

    Analise o TEXTO DO EDITAL COMPLETO fornecido abaixo. O conteúdo programático pode estar em seções como 'Conteúdo Programático', 'Conhecimentos Básicos', 'Conhecimentos Específicos', 'Conhecimentos Comuns a todos os cargos', 'Anexos', ou listas de matérias ao final do documento. Sua tarefa é encontrá-lo, onde quer que esteja.
    Foque EXCLUSIVAMENTE nas seções que descrevem o que o candidato precisa estudar para o cargo de "${targetRole}". Ignore informações sobre inscrições, datas, requisitos gerais que não sejam conteúdo de estudo.
    Se o edital mencionar múltiplos cargos, filtre o conteúdo APENAS para "${targetRole}". Se o cargo "${targetRole}" não for encontrado explicitamente no detalhamento do conteúdo, tente inferir com base em cargos similares ou seções gerais que se aplicariam (ex: 'Conhecimentos Básicos para todos os cargos de Nível Superior'), mas indique isso nas "clarification_questions".

    Quando encontrar uma seção de "LEGISLAÇÃO", não a liste como um único tópico gigante. Em vez disso, tente agrupar leis relacionadas em tópicos menores e mais gerenciáveis. Por exemplo, se houver 'Lei 8.112/90', 'Lei 9.784/99', 'Decreto X', transforme-os em tópicos como "Regime Jurídico dos Servidores Públicos (Lei 8.112/90)", "Processo Administrativo Federal (Lei 9.784/99)", "Decreto Regulamentador X", ou agrupe-os sob uma matéria como "Direito Administrativo - Legislação Específica". Se uma lista de leis for muito extensa e variada, crie tópicos para as 2-3 leis mais importantes e um tópico genérico como "Demais legislações citadas" ou agrupe-as tematicamente se possível.

    TEXTO DO EDITAL (pode ser extenso, analise-o completamente):
    ---
    ${editalText.substring(0, 250000)} 
    ---

    OBJETIVO: Transformar o conteúdo programático encontrado em uma estrutura JSON clara, pronta para ser usada em um plano de estudos.

    ESTRUTURA JSON ESPERADA:
    {
      "subjects": [
        {
          "name": "Nome da Matéria 1 (ex: Língua Portuguesa)",
          "topics": [
            "Tópico 1.1 (ex: Interpretação de texto)",
            "Tópico 1.2 (ex: Concordância verbal e nominal)"
          ]
        },
        {
          "name": "Nome da Matéria 2 (ex: Direito Administrativo para ${targetRole})",
          "topics": [
            "Tópico 2.1 (ex: Atos Administrativos)",
            "Tópico 2.2 (ex: Licitações e Contratos - Lei 14.133/2021)"
          ]
        }
      ],
      "clarification_questions": [ 
        "Pergunta de clarificação específica sobre o conteúdo de ${targetRole}?",
        "Ex: O tópico 'Legislação XYZ' se refere a qual norma específica para ${targetRole}?"
      ],
      "error": "Mensagem de erro apenas se for IMPOSSÍVEL extrair o conteúdo programático para ${targetRole} do texto fornecido, mesmo após tentativa de inferência e busca exaustiva."
    }

    INSTRUÇÕES ADICIONAIS IMPORTANTES:
    1.  **PRECISÃO NO CARGO**: Extraia somente o que for de "${targetRole}". Seja meticuloso. Diferencie claramente entre conhecimentos básicos (comuns a vários cargos) e conhecimentos específicos do "${targetRole}". Se houver seções como "Conhecimentos Gerais para todos os cargos de Nível Superior" e o "${targetRole}" for de nível superior, inclua esses tópicos.
    2.  **IDENTIFICAÇÃO DE MATÉRIAS**: Procure por cabeçalhos ou divisões que indiquem diferentes matérias/disciplinas. Use nomes claros e concisos.
    3.  **EXTRAÇÃO DE TÓPICOS**:
        *   Dentro de cada matéria, liste os tópicos de estudo detalhados.
        *   LIMPEZA: Tente normalizar os tópicos: remova numeração excessiva (ex: "1.2.3. Assunto" deve virar "Assunto"), marcadores (como '*') ou prefixos muito genéricos (ex: "Conteúdo programático de: Assunto" para "Assunto"), mantendo a essência do que precisa ser estudado.
        *   DETALHAMENTO: Se um tópico principal tiver sub-tópicos importantes listados sequencialmente, liste-os como tópicos separados.
    4.  **CONTEÚDO INEXISTENTE/VAGO**: Se o texto fornecido não contiver um conteúdo programático claro para "${targetRole}", informe isso no campo "error".
    5.  **JSON VÁLIDO**: A saída DEVE ser um JSON estritamente válido. Todos os valores de string dentro do JSON devem ser strings JSON válidas (ex: aspas duplas internas devem ser escapadas como \\").

    Priorize a qualidade, relevância e detalhamento da extração para o cargo "${targetRole}".
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    
    const parsedResult = parseGeminiJsonResponse<{
      subjects?: Array<{ name: string, topics: string[] }>,
      clarification_questions?: string[],
      error?: string 
    }>(response.text);

    if ('error' in parsedResult && !('subjects' in parsedResult) && !('clarification_questions' in parsedResult)) {
      return {
        subjects: [],
        error: (parsedResult as { error: string }).error, 
        clarificationQuestionsFromAI: undefined 
      };
    }

    const aiData = parsedResult as { 
        subjects?: Array<{ name: string, topics: string[] }>,
        clarification_questions?: string[],
        error?: string
    };

    if (aiData.error || !aiData.subjects || aiData.subjects.length === 0) {
      const defaultError = `Não foi possível extrair as matérias e tópicos para o cargo "${targetRole}" a partir do edital fornecido. Verifique se o PDF contém o conteúdo programático detalhado para este cargo ou se o cargo foi digitado corretamente. Tente novamente ou verifique se o edital está completo.`;
      return {
        subjects: [],
        error: aiData.error || defaultError,
        clarificationQuestionsFromAI: aiData.clarification_questions
      };
    }
    
    const analysisResult: EditalAnalysisData = {
      subjects: aiData.subjects.map(s => ({
        id: uuidv4(),
        name: s.name,
        topics: s.topics.map(tName => ({ 
            id: uuidv4(), 
            name: tName, 
            status: 'Pendente', 
            userInteractions: { 
              questions: {}, 
              flashcards: {} 
            },
            content: { summary: undefined, questions: [], flashcards: [], discursiveQuestions: [] } // Initialize content structure
        }))
      })),
      clarificationQuestionsFromAI: aiData.clarification_questions
    };
    return analysisResult;

  } catch (error) {
    console.error("Erro ao analisar edital com IA:", error);
    return { subjects: [], error: `Erro na API Gemini ao analisar o edital: ${ (error as Error).message }. Verifique a conexão e a chave da API.` };
  }
};

export const generateTopicContentWithAI = async (
  subjectName: string,
  topicName: string,
  contentType: ContentType,
  existingSummaryText?: string 
): Promise<Partial<TopicContent> | { error: string }> => {
  const ai = getAi();
  if (!ai) {
    // Mock data
    return new Promise(resolve => setTimeout(() => {
      if (contentType === ContentType.SUMMARY) {
        resolve({ summary: `## ${topicName} (Resumo Mockado Aprimorado)\n\n### Introdução\nEste é um resumo **mockado** e aprimorado sobre "${topicName}", demonstrando uma estrutura mais rica. A IA real produzirá conteúdo mais detalhado e específico.\n\n### Conceitos Fundamentais (Mock)\n*   **Termo Chave A:** Explicação detalhada do Termo Chave A, com **negrito** em partes cruciais e *itálico* para ênfase. Exemplo prático: ...\n*   **Termo Chave B:** Abordagem aprofundada, incluindo um **ALERTA:** sobre um erro comum.\n\n#### Subconceito B.1 (Mock)\n   Detalhes sobre este subconceito importante.\n\n### Exemplos Práticos (Mock)\n| Situação      | Aplicação de ${topicName}      |\n|---------------|-----------------------------|\n| Cenário 1     | Descrição da aplicação aqui |\n| Cenário 2     | Outra descrição importante  |\n\n> **PONTO DE ATENÇÃO:** Lembre-se que a prática leva à perfeição neste tópico! (Mock)\n\n> **DICA DE OURO:** Revise este tópico utilizando flashcards para melhor fixação. (Mock)\n\n### Conclusão (Mock)\nEste resumo cobriu os aspectos essenciais de "${topicName}". Para aprofundar, consulte a bibliografia recomendada e resolva questões de concursos anteriores. (Mock)` });
      } else if (contentType === ContentType.QUESTIONS) {
        const mockQuestions: Question[] = [
          { id: uuidv4(), questionText: `Com base no resumo, qual é o principal aspecto de "${topicName}"? (Mock)`, options: ["Opção A (do resumo)", "Opção B (do resumo)", "Opção C (relacionada)", "Opção D (distrator)"], correctAnswerIndex: 0, explanation: "Explicação mockada detalhada baseada no resumo. (Mock)", attempts: 0 },
          { id: uuidv4(), questionText: `Considerando o resumo fornecido sobre "${topicName}", analise a seguinte afirmação: ... (Mock)`, options: ["Verdadeira", "Falsa", "Parcialmente Verdadeira", "Não abordado no resumo"], correctAnswerIndex: 1, explanation: "Justificativa baseada no resumo. (Mock)", attempts: 0 },
        ];
        resolve({ questions: mockQuestions });
      } else if (contentType === ContentType.FLASHCARDS) {
        const mockFlashcards: Flashcard[] = [
          { id: uuidv4(), front: `(Baseado no resumo) Defina: ${topicName} (Mock)`, back: `(Baseado no resumo) Definição completa de ${topicName}. (Mock)`, reviewCount: 0, lastReviewedTimestamp: 0 },
          { id: uuidv4(), front: `(Baseado no resumo) Ponto chave de ${topicName}? (Mock)`, back: `(Baseado no resumo) Explicação do ponto chave. (Mock)`, reviewCount: 0, lastReviewedTimestamp: 0 },
        ];
        resolve({ flashcards: mockFlashcards });
      } else if (contentType === ContentType.DISCURSIVE_QUESTIONS) {
        const mockDiscursiveQuestions: DiscursiveQuestion[] = [
          { id: uuidv4(), questionText: `Com base no resumo de "${topicName}", discorra sobre seus desafios e implicações. (Mock)`, modelAnswerOutline: "### Roteiro de Resposta (Baseado no Resumo - Mock):\n1.  **Introdução:** Reafirmar conceito principal do resumo.\n2.  **Desafio 1 (do resumo):** Detalhar.\n3.  **Implicação 1 (do resumo):** Detalhar.\n4.  **Conclusão:** Síntese." },
        ];
        resolve({ discursiveQuestions: mockDiscursiveQuestions });
      }
    }, 1000));
  }

  let prompt = "";
  let expectedResponseType: "text" | "json" = "text";
  let baseContextInstruction = `Para o tópico "${topicName}" da matéria "${subjectName}".`;

  if (existingSummaryText) {
    baseContextInstruction = `Considerando o seguinte resumo sobre o tópico "${topicName}" (matéria "${subjectName}"):\n---RESUMO---\n${existingSummaryText}\n---FIM DO RESUMO---\n`;
  }

  if (contentType === ContentType.SUMMARY) {
    prompt = `
      Você é um Mestre Catedrático e Didata Excepcional, especializado em criar materiais de estudo aprofundados e visualmente organizados para concursos públicos de alto nível.
      Seu objetivo é gerar um RESUMO COMPLETO E COMPLEXO para o tópico "${topicName}" da matéria "${subjectName}".
      ${baseContextInstruction}

      O resumo DEVE ser uma obra de arte didática, utilizando Markdown de forma rica e estruturada. Siga RIGOROSAMENTE as seguintes diretrizes:

      **ESTRUTURA E CONTEÚDO OBRIGATÓRIOS:**
      1.  **TÍTULO PRINCIPAL:** Use um H2 (##) para o título do resumo, que deve ser o nome do tópico. (O H1 é implícito).
      2.  **INTRODUÇÃO PERSUASIVA (H3 - ### Introdução):**
          *   Apresente o tópico de forma envolvente, destacando sua importância e relevância para o concurso.
          *   Forneça um breve roteiro do que será abordado no resumo.
      3.  **SEÇÕES DETALHADAS (Use H3 - ### para títulos de seção principal, e H4 - #### para subseções internas, se necessário):**
          *   **Conceitos Fundamentais (### Definições e Conceitos Essenciais):** Explique os pilares teóricos do tópico. Use listas (\`* Item\` ou \`1. Item\`) para clareza. Defina termos técnicos com **negrito**.
          *   **Aprofundamento e Exemplos Práticos (### Análise Aprofundada com Exemplos Detalhados):** Vá além do básico. Forneça explicações detalhadas, cenários de aplicação e exemplos práticos elaborados. Se pertinente, use subseções (#### Exemplo Prático 1, #### Estudo de Caso).
          *   **Legislação e Normas Aplicáveis (### Marco Legal e Normativo):** Se o tópico envolver leis, decretos, portarias, etc., liste as principais e explique seus pontos mais relevantes para o tópico. Use citações de artigos importantes se necessário.
          *   **Pontos Críticos e Controvérsias (### Pontos de Atenção e Controvérsias Doutrinárias):** Destaque as áreas mais complexas, pegadinhas comuns, ou diferentes entendimentos sobre o tema (se houver).
          *   **Como o Tema é Cobrado em Provas (### Incidência em Concursos e Dicas Estratégicas):** Forneça insights sobre como o tópico costuma aparecer em questões de concurso. Dê dicas de estudo específicas para este tópico.
          *   **(Opcional, se aplicável) Glossário de Termos Técnicos (### Glossário Chave):** Se o tópico for muito específico e utilizar jargões, crie um pequeno glossário. Formate como: \`**Termo:** Definição.\`
      4.  **CONCLUSÃO E PRÓXIMOS PASSOS (### Conclusão e Recomendações de Estudo):**
          *   Recapitule os pontos mais importantes do resumo.
          *   Sugira próximos passos para o estudante, como tópicos relacionados a revisar ou tipos de questões a praticar.

      **FORMATAÇÃO E DESTAQUES VISUAIS (Markdown):**
      *   **NÍVEIS DE CABEÇALHO:** Use H2 (##) para o título do resumo, H3 (###) para seções principais, e H4 (####) para subseções.
      *   **NEGITO E ITÁLICO:** Use \`**negrito**\` para termos cruciais, definições importantes, e títulos de elementos especiais. Use \`*itálico*\` para ênfase, termos estrangeiros, ou nomes de obras.
      *   **LISTAS:** Use listas numeradas ou com marcadores para enumerar itens, características, etc.
      *   **TABELAS (Simples):** Se apropriado (ex: para comparar conceitos, listar vantagens/desvantagens), use tabelas Markdown simples.
          Exemplo de Tabela:
          \`\`\`
          | Característica | Descrição A | Descrição B |
          |----------------|-------------|-------------|
          | Ponto 1        | Detalhe A1  | Detalhe B1  |
          | Ponto 2        | Detalhe A2  | Detalhe B2  |
          \`\`\`
      *   **BLOCOS DE DESTAQUE ESPECIAIS (OBRIGATÓRIO O USO DESTES PREFIXOS EXATOS EM BLOCKQUOTES):**
          *   \`> **PONTO DE ATENÇÃO:** Texto importante que requer cuidado.\`
          *   \`> **ALERTA DE PEGADINHA:** Cuidado com este erro comum ou detalhe que derruba candidatos.\`
          *   \`> **MNEMÔNICO (Nome do Mnemônico):** Para memorizar X, Y, Z, pense em A, B, C.\`
          *   \`> **DICA DE OURO:** Um conselho estratégico valioso para este tópico.\`
          *   \`> **JURISPRUDÊNCIA RELEVANTE:** STF/STJ: (Resumo da decisão e como afeta o tópico).\` (Se aplicável)
      *   **CITAÇÕES:** Se citar um autor ou trecho de lei, use blockquotes simples (\`> Texto citado.\`).

      **TOM E QUALIDADE:**
      *   Linguagem formal, precisa, clara e extremamente didática.
      *   Profundidade analítica, mas acessível.
      *   Evite redundâncias. Seja completo, mas conciso dentro de cada explicação.
      *   O resumo deve ser substancial, visando entre 600 e 1200 palavras, dependendo da complexidade inerente ao tópico.

      **REGRAS FINAIS:**
      *   Responda EXCLUSIVAMENTE com o conteúdo Markdown do resumo. Não inclua saudações, explicações sobre o que você está fazendo, ou qualquer texto fora do resumo em si.
      *   Assegure-se de que todo o Markdown seja sintaticamente correto e pronto para renderização.
    `;
  } else if (contentType === ContentType.QUESTIONS) {
    expectedResponseType = "json";
    prompt = `
      Você é um especialista em criar questões de múltipla escolha de alto nível para ${subjectName}.
      ${baseContextInstruction}
      Crie 3 (três) questões de múltipla escolha DESAFIADORAS e BEM ELABORADAS baseadas ${existingSummaryText ? "NO RESUMO FORNECIDO" : `no tópico "${topicName}"`}.
      Cada questão deve:
      1.  Ter 4 alternativas, apenas UMA correta.
      2.  Abordar aspectos relevantes, nuances ou pontos críticos ${existingSummaryText ? "do resumo" : "do tópico"}.
      3.  Possuir distratores plausíveis.
      4.  Incluir uma explicação DETALHADA para a resposta correta E para CADA DISTRATOR.
      Formate a saída como um array JSON de objetos (ESTRITAMENTE JSON).
      Importante: Os valores de string dentro do JSON devem ser strings JSON válidas (ex: aspas duplas internas devem ser escapadas como \\").
      Exemplo de formato:
      [
        {
          "questionText": "...", "options": ["A", "B", "C", "D"], "correctAnswerIndex": 0, "explanation": "..."
        }
      ]
    `;
  } else if (contentType === ContentType.FLASHCARDS) {
    expectedResponseType = "json";
    prompt = `
      Você é um especialista em criar flashcards eficazes para ${subjectName}.
      ${baseContextInstruction}
      Crie 3 (três) flashcards baseados ${existingSummaryText ? "NO RESUMO FORNECIDO" : `no tópico "${topicName}"`}.
      Frente: pergunta/termo. Verso: resposta/definição concisa mas completa.
      Formate a saída como um array JSON de objetos (ESTRITAMENTE JSON).
      Importante: Os valores de string dentro do JSON devem ser strings JSON válidas (ex: aspas duplas internas devem ser escapadas como \\").
      Exemplo de formato:
      [
        { "front": "...", "back": "..." }
      ]
    `;
  } else if (contentType === ContentType.DISCURSIVE_QUESTIONS) {
    expectedResponseType = "json";
    prompt = `
      Você é um especialista em elaborar questões dissertativas complexas para ${subjectName}.
      ${baseContextInstruction}
      Crie 1 ou 2 questões dissertativas que exijam análise crítica, baseadas ${existingSummaryText ? "NO RESUMO FORNECIDO" : `no tópico "${topicName}"`}.
      Para cada questão, forneça um "Roteiro de Resposta Esperada" detalhado em Markdown.
      Formate a saída como um array JSON de objetos (ESTRITAMENTE JSON).
      Importante: Os valores de string dentro do JSON (especialmente 'questionText' e 'modelAnswerOutline') devem ser strings JSON válidas. Isso significa que caracteres especiais como aspas duplas (") e barras invertidas (\\) dentro do texto do 'questionText' ou do 'modelAnswerOutline' DEVEM SER ESCAPADOS (ex: \\" para aspas duplas, \\\\ para barra invertida, \\n para nova linha DENTRO DA STRING JSON).
      Exemplo de formato:
      [
        {
          "questionText": "Considerando o resumo, discuta a aplicabilidade de X em Y. Inclua \\"exemplos práticos\\".",
          "modelAnswerOutline": "### Roteiro de Resposta Esperada:\\n1. Introdução: Defina X e Y.\\n2. Desenvolvimento: Detalhe a aplicação e os \\"exemplos práticos\\".\\n   - Ponto A\\n   - Ponto B\\n3. Conclusão: Resuma."
        }
      ]
    `;
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      config: { responseMimeType: expectedResponseType === "json" ? "application/json" : undefined }
    });

    if (contentType === ContentType.SUMMARY) {
      return { summary: response.text };
    } else if (contentType === ContentType.QUESTIONS) {
      const parsed = parseGeminiJsonResponse<Omit<Question, 'id' | 'attempts'>[]>(response.text);
      if ('error' in parsed) return { error: parsed.error };
      const questionsArray = Array.isArray(parsed) ? parsed : (parsed ? [parsed] : []); 
      return { 
          questions: questionsArray.map(q => ({ 
              ...q, 
              id: uuidv4(), 
              attempts: 0, // Initialize attempts
            })) 
        };
    } else if (contentType === ContentType.FLASHCARDS) {
      const parsed = parseGeminiJsonResponse<Omit<Flashcard, 'id' | 'reviewCount' | 'lastReviewedTimestamp'>[]>(response.text);
      if ('error' in parsed) return { error: parsed.error };
      const flashcardsArray = Array.isArray(parsed) ? parsed : (parsed ? [parsed] : []); 
      return { 
          flashcards: flashcardsArray.map(f => ({ 
              ...f, 
              id: uuidv4(), 
              reviewCount: 0, // Initialize review count
              lastReviewedTimestamp: 0 // Initialize timestamp
            })) 
        };
    } else if (contentType === ContentType.DISCURSIVE_QUESTIONS) {
      const parsed = parseGeminiJsonResponse<Omit<DiscursiveQuestion, 'id'>[]>(response.text);
      if ('error' in parsed) return { error: parsed.error };
      const discursiveQuestionsArray = Array.isArray(parsed) ? parsed : (parsed ? [parsed] : []);
      return { discursiveQuestions: discursiveQuestionsArray.map(dq => ({ ...dq, id: uuidv4() })) };
    }
    return { error: "Tipo de conteúdo desconhecido." };

  } catch (error) {
    console.error(`Erro ao gerar ${contentType} para ${topicName}:`, error);
    return { error: `Erro na API Gemini ao gerar ${contentType}: ${ (error as Error).message }` };
  }
};


export const getAIStudySuggestions = async (
    studyPlan: EditalAnalysisData | null,
    editalText: string, 
    targetRole: string
  ): Promise<{ suggestions: AISuggestion[]; generalAdvice?: string; error?: string }> => {
    const ai = getAi();
    if (!ai) {
      return new Promise(resolve => setTimeout(() => {
        const mockSuggestions: AISuggestion[] = [
          { subjectId: "lp-mock", topicId: "lp-topic1-mock", subjectName: "Língua Portuguesa (Mock)", topicName: "Interpretação de Texto Avançada (Mock)", reason: "Este é um tópico fundamental e ainda está pendente. (Mock)" },
          { subjectId: "ce-mock", topicId: "ce-topic4-mock", subjectName: `Conhecimentos Específicos de ${targetRole} (Mock)`, topicName: `Atualidades Relevantes para ${targetRole} (Mock)`, reason: "Você começou a estudar este tópico, continue para consolidar o conhecimento. (Mock)" },
          { subjectId: "rlm-mock", topicId: "rlm-topic1-mock", subjectName: "Raciocínio Lógico (Mock)", topicName: "Lógica Proposicional (Mock)", reason: "Este tópico foi marcado para revisão em flashcards. Ótima hora para consolidar! (Mock)" },
        ];
        resolve({ 
            suggestions: mockSuggestions, 
            generalAdvice: "Mantenha a consistência! Revisar tópicos com flashcards marcados como 'difíceis' ou 'médios' pode ser muito produtivo. (Mock)" 
        });
      }, 1000));
    }

    // Extract relevant parts of the study plan for the prompt
    const planSummaryForAI = studyPlan?.subjects.map(s => ({
      id: s.id,
      name: s.name,
      topics: s.topics.map(t => ({ 
        id: t.id, 
        name: t.name, 
        status: t.status,
        flashcardAssessments: t.userInteractions?.flashcards 
            ? Object.values(t.userInteractions.flashcards).map(fc => ({
                assessment: fc.selfAssessment, 
                reviewCount: fc.reviewCount,
                lastReviewed: fc.lastReviewedTimestamp ? new Date(fc.lastReviewedTimestamp).toLocaleDateString() : 'nunca'
              }))
            : [],
        questionPerformance: t.userInteractions?.questions
            ? Object.values(t.userInteractions.questions).map(q => ({
                attempts: q.attempts,
                correct: q.isCorrect
            })) : []
      }))
    }));
    
    const prompt = `
      Você é um Coach de Estudos especializado em concursos públicos brasileiros. Seu objetivo é analisar o progresso de estudo de um candidato e fornecer sugestões personalizadas de tópicos para estudar ou revisar, além de um conselho geral de estudo.
      
      Cargo Alvo do Candidato: "${targetRole}"
      
      Progresso Atual do Plano de Estudos (JSON), incluindo status dos tópicos, autoavaliação de flashcards ('easy', 'medium', 'hard', 'unseen'), contagem de revisões, última revisão, e performance em questões (tentativas, acerto):
      ${JSON.stringify(planSummaryForAI, null, 2).substring(0, 20000)}

      Com base no progresso atual, sugira de 2 a 4 tópicos para o candidato focar. Para cada sugestão, forneça:
      - subjectId, topicId, subjectName, topicName.
      - reason: Justificativa (1-2 frases concisas) do porquê este tópico é uma boa sugestão agora, considerando o progresso.

      Prioridades para sugestões (em ordem de importância):
      1.  Tópicos com flashcards avaliados como 'hard' e que não foram revisados recentemente (ex: >3 dias).
      2.  Tópicos onde o usuário errou múltiplas questões (ex: >50% de erro ou múltiplas tentativas).
      3.  Tópicos 'Pendente' que são cruciais (ex: "Fundamentos de...", "Introdução a...") ou pré-requisitos para outros.
      4.  Tópicos 'Estudando' para incentivar a conclusão, especialmente se o progresso parece estagnado.
      5.  Tópicos com flashcards avaliados como 'medium' para revisão, especialmente se não revisados recentemente.
      6.  Tópicos 'Concluído' importantes para revisão espaçada (ex: revisados há mais de 7-10 dias), especialmente se foram difíceis inicialmente.

      Além das sugestões de tópicos, forneça um "generalAdvice" (conselho geral de estudo) curto (1-3 frases), motivador e específico para a situação atual do progresso, se possível. Ex: "Você está indo bem em X, mas foque em revisar Y onde teve mais dificuldade."

      Formate sua resposta como um objeto JSON (ESTRITAMENTE JSON):
      {
        "suggestions": [
          { "subjectId": "...", "topicId": "...", "subjectName": "...", "topicName": "...", "reason": "..." }
        ],
        "generalAdvice": "Seu conselho geral aqui."
      }
      Importante: Os valores de string dentro do JSON devem ser strings JSON válidas (ex: aspas duplas internas devem ser escapadas como \\").
      Se não houver plano de estudos ou tópicos, retorne um array "suggestions" vazio e um conselho geral genérico sobre como começar.
    `;

    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: GEMINI_TEXT_MODEL,
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      const parsed = parseGeminiJsonResponse<{ suggestions: AISuggestion[]; generalAdvice?: string }>(response.text);
      if ('error' in parsed) return { suggestions: [], error: parsed.error };
      return { suggestions: parsed.suggestions || [], generalAdvice: parsed.generalAdvice };
    } catch (error) {
      console.error("Erro ao obter sugestões de estudo da IA:", error);
      return { suggestions: [], error: `Erro na API Gemini: ${ (error as Error).message }` };
    }
};

export const askAICoachQuestion = async (
  question: string,
  chatHistory: ChatMessage[], 
  editalText: string,
  targetRole: string,
  studyPlan: EditalAnalysisData | null 
): Promise<{ answer: string; error?: string }> => {
  const ai = getAi();
  if (!ai) {
    return new Promise(resolve => setTimeout(() => {
      resolve({ answer: `Resposta mockada para sua pergunta sobre "${question.substring(0,30)}...": A IA está aqui para ajudar com o edital e estratégias. (Mock)` });
    }, 800));
  }

  const planStructureSummary = studyPlan?.subjects.map(s => ({
    name: s.name,
    topics: s.topics.map(t => ({name: t.name, status: t.status})) // Include status
  }));

  const recentHistory = chatHistory.slice(-6).map(msg => `${msg.sender === 'user' ? 'Usuário' : 'CoachIA'}: ${msg.text}`).join('\n');

  const prompt = `
    Você é um Coach de Estudos Inteligente (CoachIA), especializado em auxiliar candidatos de concursos públicos no Brasil.
    Seu tom é amigável, prestativo e objetivo.

    Informações de Contexto:
    - Cargo Alvo do Usuário: "${targetRole}"
    - Edital Resumido (primeiras 15000 caracteres): 
      ---
      ${editalText.substring(0, 15000)}
      ---
    - Estrutura do Plano de Estudos do Usuário (Matérias, Tópicos e Status - PRIMEIROS 5000 CARACTERES JSON):
      ${JSON.stringify(planStructureSummary, null, 2).substring(0, 5000)}
    
    Histórico Recente da Conversa:
    ---
    ${recentHistory}
    ---

    Pergunta do Usuário: "${question}"

    Sua Tarefa:
    Responda à pergunta do usuário da forma mais útil e concisa possível, utilizando o contexto fornecido.
    Se a pergunta for sobre um tópico específico, tente relacioná-lo com o material do edital ou seu status no plano.
    Se a pergunta for sobre estratégia de estudo, forneça dicas práticas.
    Se você não souber a resposta ou a pergunta for muito fora do escopo de concursos, admita isso de forma educada.
    Evite respostas excessivamente longas. Mantenha o foco.

    Formate da Saída: Retorne um objeto JSON (ESTRITAMENTE JSON):
    {
      "answer": "Sua resposta aqui."
    }
    Importante: O valor da string "answer" deve ser uma string JSON válida (ex: aspas duplas internas devem ser escapadas como \\").
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    const parsed = parseGeminiJsonResponse<{ answer: string }>(response.text);
    if ('error' in parsed) return { answer: "", error: parsed.error };
    return { answer: parsed.answer || "Desculpe, não consegui processar uma resposta no momento." };
  } catch (error) {
    console.error("Erro ao obter resposta do Coach IA:", error);
    return { answer: "", error: `Erro na API Gemini: ${ (error as Error).message }` };
  }
};

export const getDeeperUnderstandingAI = async (
  subjectName: string,
  topicName: string,
  topicSummary: string | undefined,
  userInteractions: UserInteractions | undefined
): Promise<DeeperUnderstandingContent | { error: string }> => {
  const ai = getAi();
  if (!ai) {
    return new Promise(resolve => setTimeout(() => {
      resolve({ 
        type: 'general_advice',
        title: "Conselho Adicional (Mock)",
        content: `Para aprofundar em "${topicName}", revise os pontos chave do resumo e tente aplicar os conceitos em exemplos práticos. Se certas áreas ainda parecerem confusas, procure por vídeos ou artigos complementares. (Mock)`
      });
    }, 1200));
  }

  let interactionSummary = "O usuário solicitou ajuda adicional para este tópico.";
  if (userInteractions) {
    const questionStats = { total: 0, correct: 0, incorrect: 0, attemptsSum: 0 };
    if (userInteractions.questions) {
      Object.values(userInteractions.questions).forEach(q => {
        questionStats.total++;
        if (q.isCorrect) questionStats.correct++;
        else if (q.isRevealed) questionStats.incorrect++; // Only count if revealed and not correct
        questionStats.attemptsSum += (q.attempts || 0);
      });
    }
    const flashcardStats = { total: 0, easy: 0, medium: 0, hard: 0 };
    if (userInteractions.flashcards) {
      Object.values(userInteractions.flashcards).forEach(fc => {
        flashcardStats.total++;
        if (fc.selfAssessment === 'easy') flashcardStats.easy++;
        else if (fc.selfAssessment === 'medium') flashcardStats.medium++;
        else if (fc.selfAssessment === 'hard') flashcardStats.hard++;
      });
    }
    interactionSummary = `Resumo das interações do usuário com o tópico "${topicName}":
    - Questões: ${questionStats.correct} de ${questionStats.total} corretas. Média de ${questionStats.total > 0 ? (questionStats.attemptsSum / questionStats.total).toFixed(1) : 0} tentativas por questão.
    - Flashcards: ${flashcardStats.hard} marcados como 'difíceis', ${flashcardStats.medium} como 'médios', ${flashcardStats.easy} como 'fáceis' de ${flashcardStats.total} avaliados.`;
  }

  const prompt = `
    Você é um Tutor de IA especialista em ajudar estudantes a superar dificuldades em tópicos de estudo para concursos.
    O estudante está no tópico "${topicName}" da matéria "${subjectName}".
    
    Ele já possui o seguinte resumo do tópico:
    --- RESUMO ATUAL ---
    ${topicSummary || "Nenhum resumo foi gerado ainda para este tópico."}
    --- FIM DO RESUMO ---

    ${interactionSummary}

    O estudante clicou em "Preciso de mais ajuda com este tópico". Sua tarefa é fornecer UMA das seguintes formas de ajuda, escolhendo a mais apropriada com base no contexto e nas interações do usuário, ou se não houver informações de interação suficientes, uma explicação alternativa ou analogia:

    1.  **Explicação Alternativa (alternative_explanation)**: Se houver um conceito chave que parece complexo ou se o resumo for denso, forneça uma explicação alternativa, mais simples ou com uma perspectiva diferente sobre UM PONTO CRÍTICO do tópico.
    2.  **Analogia (analogy)**: Crie uma analogia do dia-a-dia ou de fácil compreensão para explicar o conceito principal do tópico ou um aspecto difícil dele.
    3.  **Conceitos Fundamentais (foundational_concepts)**: Se o tópico for avançado ou o usuário parecer estar com dificuldades básicas, liste 2-3 conceitos fundamentais (de outros tópicos ou da mesma matéria) que ele deveria revisar para entender melhor "${topicName}".
    4.  **Conselho Geral (general_advice)**: Se as opções acima não parecerem adequadas, forneça um conselho geral sobre como abordar o estudo deste tópico.

    Formate sua resposta como um objeto JSON (ESTRITAMENTE JSON) com a seguinte estrutura:
    {
      "type": "tipo_da_ajuda_escolhida (ex: 'analogy', 'alternative_explanation', 'foundational_concepts', 'general_advice')",
      "title": "Título para a Ajuda (ex: 'Entendendo ${topicName} com uma Analogia', 'Revisite Estes Conceitos Primeiro')",
      "content": "O conteúdo da sua ajuda em formato Markdown. Use parágrafos, listas, e **negrito** conforme apropriado para clareza."
    }
    Importante: O valor da string "content" deve ser uma string JSON válida (especialmente escape aspas duplas internas com \\").
    Seja conciso, mas útil. O objetivo é desbloquear o entendimento do estudante.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    const parsedResult = parseGeminiJsonResponse<DeeperUnderstandingContent>(response.text);
    if ('error' in parsedResult) {
      return { error: parsedResult.error };
    }
    return { ...parsedResult, promptUsed: process.env.NODE_ENV === 'development' ? prompt: undefined }; // Add prompt for debugging if in dev
  } catch (error) {
    console.error(`Erro ao gerar ajuda adicional para ${topicName}:`, error);
    return { error: `Erro na API Gemini ao gerar ajuda adicional: ${ (error as Error).message }` };
  }
};

// Função genérica para gerar conteúdo com Gemini
export const generateContent = async (prompt: string): Promise<string> => {
  const ai = getAi();
  if (!ai) {
    throw new Error('API_KEY não configurada para Gemini AI');
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: [
        { parts: [{ text: prompt }] }
      ],
    });

    return response.text || 'Resposta não disponível';
  } catch (error) {
    console.error('Erro ao gerar conteúdo com Gemini:', error);
    throw error;
  }
};
