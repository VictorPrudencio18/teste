import React, { useState, useEffect } from 'react';
import { AnalyzedTopic, Question, Flashcard, ContentType, DiscursiveQuestion, TopicContent, UserInteractions, FlashcardSelfAssessment, DeeperUnderstandingContent } from '../../types';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EnhancedSummary } from '../common/EnhancedSummary';
import { ArrowLeftIcon, ArrowRightIcon, CheckCircleIcon, XCircleIcon, SparklesIcon, DocumentTextIcon, QuestionMarkCircleIcon, RectangleStackIcon, PencilIcon, ChevronDownIcon, LightBulbIcon, BrainIcon, RefreshIcon } from '../../constants'; 
import { marked } from 'marked'; // For rendering markdown from deeper understanding

interface TopicStudyStepProps {
  subjectName: string;
  topic: AnalyzedTopic; 
  onBackToPlan: () => void;
  onGenerateContent: (topicId: string, contentType: ContentType, existingSummary?: string) => Promise<void>;
  onUpdateTopicStatus: (topicId: string, status: AnalyzedTopic['status']) => void;
  onUpdateQuestionInteraction: (topicId: string, questionId: string, userAnswerIndex: number | undefined, isRevealed: boolean, isCorrect?: boolean, attempts?: number) => void;
  onFlashcardSelfAssessment: (topicId: string, flashcardId: string, assessment: FlashcardSelfAssessment) => void;
  onGetDeeperUnderstanding: (topicId: string) => Promise<void>;
  prevTopicInfo: { subjectId: string; topicId: string } | null;
  nextTopicInfo: { subjectId: string; topicId: string } | null;
  onSelectTopic: (subjectId: string, topicId: string) => void;
}

const statusButtonVariant = (currentStatus: AnalyzedTopic['status'], buttonStatus: AnalyzedTopic['status']) => {
  if (currentStatus === buttonStatus) return 'primary';
  return 'secondary'; 
};

export const TopicStudyStep: React.FC<TopicStudyStepProps> = ({
  subjectName,
  topic,
  onBackToPlan,
  onGenerateContent,
  onUpdateTopicStatus,
  onUpdateQuestionInteraction,
  onFlashcardSelfAssessment,
  onGetDeeperUnderstanding,
  prevTopicInfo,
  nextTopicInfo,
  onSelectTopic,
}) => {
  const [activeTab, setActiveTab] = useState<ContentType>(ContentType.SUMMARY);
  const [flippedFlashcards, setFlippedFlashcards] = useState<Record<string, boolean>>({});
  const [visibleDiscursiveOutlines, setVisibleDiscursiveOutlines] = useState<Record<string, boolean>>({});
  const [showDeeperUnderstandingModal, setShowDeeperUnderstandingModal] = useState(false);

  const currentTopicContent = topic.content || {};
  const currentInteractions = topic.userInteractions || { questions: {}, flashcards: {} };

  useEffect(() => {
    // Reset local state when topic changes
    setFlippedFlashcards({});
    setVisibleDiscursiveOutlines({});
    setShowDeeperUnderstandingModal(false);
    setActiveTab(ContentType.SUMMARY); // Default to summary on new topic
  }, [topic.id]);

  useEffect(() => {
    const currentActualContentForTab = currentTopicContent?.[activeTab];
    const noContentFetchedForTab = !currentActualContentForTab || 
                             (Array.isArray(currentActualContentForTab) && currentActualContentForTab.length === 0) ||
                             (typeof currentActualContentForTab === 'string' && !currentActualContentForTab.trim());

    if (activeTab !== ContentType.DEEPER_UNDERSTANDING && noContentFetchedForTab && !topic.isLoadingContent && !topic.errorContent) {
       onGenerateContent(topic.id, activeTab, currentTopicContent.summary);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic.id, activeTab, topic.isLoadingContent, topic.errorContent]); // currentTopicContent derived from topic.content, so it's implicitly a dependency

  const handleToggleFlashcardLocal = (flashcardId: string) => {
    setFlippedFlashcards(prev => ({ ...prev, [flashcardId]: !prev[flashcardId] }));
  };

  const handleToggleDiscursiveOutlineLocal = (discursiveQuestionId: string) => {
    setVisibleDiscursiveOutlines(prev => ({ ...prev, [discursiveQuestionId]: !prev[discursiveQuestionId] }));
  };

  const handleDeeperUnderstandingRequest = () => {
    onGetDeeperUnderstanding(topic.id);
    setShowDeeperUnderstandingModal(true);
  };
  
  const renderDeeperUnderstandingContent = () => {
    if (topic.isLoadingDeeperUnderstanding) {
        return <div className="flex flex-col items-center justify-center py-6"><LoadingSpinner size="md" /><p className="mt-2 text-slate-500">IA está pensando em como te ajudar melhor...</p></div>;
    }
    if (topic.errorDeeperUnderstanding) {
        return <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"><strong>Erro:</strong> {topic.errorDeeperUnderstanding}</div>;
    }
    if (currentTopicContent.deeperUnderstanding) {
        const { title, content } = currentTopicContent.deeperUnderstanding;
        // Ensure content is not null or undefined before passing to marked
        const htmlContent = content ? marked.parse(content) : '<p>Conteúdo não disponível.</p>';
        return (
            <div>
                <h4 className="text-xl font-semibold text-sky-700 mb-3 font-display">{title}</h4>
                <div className="prose prose-md max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: htmlContent }} />
            </div>
        );
    }
    return <p className="text-slate-500">Nenhuma ajuda adicional disponível no momento. Tente gerar.</p>;
  };


  const renderContent = () => {
    const isLoadingCurrentTabContent = topic.isLoadingContent && 
                                      (!currentTopicContent || !currentTopicContent[activeTab] || 
                                       (activeTab === ContentType.QUESTIONS && !currentTopicContent.questions?.length) ||
                                       (activeTab === ContentType.FLASHCARDS && !currentTopicContent.flashcards?.length) ||
                                       (activeTab === ContentType.DISCURSIVE_QUESTIONS && !currentTopicContent.discursiveQuestions?.length)
                                      );

    if (isLoadingCurrentTabContent) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center py-10">
          <LoadingSpinner size="lg" color="text-sky-600" />
          <p className="mt-4 text-lg text-slate-600">
            <SparklesIcon className="inline w-5 h-5 mr-1.5 text-amber-500" />
            Nossa IA está preparando o material de {tabs.find(t => t.type === activeTab)?.label.toLowerCase().replace(" dinâmicos", "").replace(" práticas", "").replace(" detalhado","")}...
          </p>
          <p className="text-sm text-slate-500">Isso pode levar alguns segundos.</p>
        </div>
      );
    }
    if (topic.errorContent && (!currentTopicContent || !currentTopicContent[activeTab])) { 
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center">
            <XCircleIcon className="w-12 h-12 text-red-500 mx-auto mb-3"/>
            <p className="text-red-700 font-semibold">Erro ao gerar conteúdo</p>
            <p className="text-sm text-red-600 mt-1">{topic.errorContent}</p>
            <Button 
                onClick={() => onGenerateContent(topic.id, activeTab, currentTopicContent.summary)} 
                isLoading={topic.isLoadingContent} 
                leftIcon={<RefreshIcon />}
                variant="danger"
                className="mt-4"
            >
                Tentar Gerar Novamente
            </Button>
        </div>
      );
    }

    switch (activeTab) {
      case ContentType.SUMMARY:
        return currentTopicContent?.summary ? (
          <EnhancedSummary 
            summaryContent={currentTopicContent.summary}
            topicName={topic.name}
            onRegenerateSummary={() => onGenerateContent(topic.id, ContentType.SUMMARY)}
            isLoading={topic.isLoadingContent}
          />
        ) : <Button onClick={() => onGenerateContent(topic.id, ContentType.SUMMARY)} isLoading={topic.isLoadingContent} leftIcon={<SparklesIcon className="w-5 h-5"/>} size="lg" fullWidth>Gerar Resumo Inteligente</Button>;
      
      case ContentType.QUESTIONS:
        const questions = currentTopicContent?.questions || [];
        const questionInteractions = currentInteractions?.questions || {};
        if (questions.length === 0 && !topic.isLoadingContent) {
          return <Button onClick={() => onGenerateContent(topic.id, ContentType.QUESTIONS, currentTopicContent.summary)} isLoading={topic.isLoadingContent} leftIcon={<SparklesIcon className="w-5 h-5"/>} size="lg" fullWidth>Gerar Questões Desafiadoras</Button>;
        }
        return (
          <div className="space-y-8">
            {questions.map((qDef, index) => {
              const interaction = questionInteractions[qDef.id] || {};
              const userAnswerIndex = interaction.userAnswerIndex;
              const isRevealed = interaction.isRevealed || false;
              const currentAttempts = interaction.attempts || 0;
              
              const handleAnswerSelection = (optionIndex: number) => {
                if (!isRevealed) {
                   onUpdateQuestionInteraction(topic.id, qDef.id, optionIndex, false, undefined, currentAttempts);
                }
              };

              const handleVerifyAnswer = () => {
                const isCorrect = userAnswerIndex === qDef.correctAnswerIndex;
                onUpdateQuestionInteraction(topic.id, qDef.id, userAnswerIndex, true, isCorrect, currentAttempts + 1);
              };

              return (
                <Card key={qDef.id} className="bg-slate-50 shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-semibold text-lg text-slate-800">{index + 1}. {qDef.questionText}</p>
                    {isRevealed && <span className="text-xs text-slate-500">Tentativas: {interaction.attempts}</span>}
                  </div>
                  <div className="space-y-3 mb-4">
                    {qDef.options.map((opt, optIndex) => (
                      <label key={optIndex} className={`flex items-center p-3.5 rounded-lg border-2 transition-all duration-200 cursor-pointer 
                        ${ isRevealed && optIndex === qDef.correctAnswerIndex ? 'bg-green-100 border-green-500 ring-2 ring-green-500 shadow-lg' : 
                          isRevealed && optIndex === userAnswerIndex && optIndex !== qDef.correctAnswerIndex ? 'bg-red-100 border-red-500 ring-2 ring-red-500 shadow-lg' :
                          !isRevealed && optIndex === userAnswerIndex ? 'bg-sky-100 border-sky-500 ring-2 ring-sky-500' :
                          'hover:bg-slate-100 border-slate-300 hover:border-sky-400'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${qDef.id}`}
                          value={optIndex}
                          checked={userAnswerIndex === optIndex}
                          onChange={() => handleAnswerSelection(optIndex)}
                          className="form-radio h-5 w-5 text-sky-600 border-slate-400 focus:ring-sky-500 mr-3 flex-shrink-0"
                          disabled={isRevealed}
                        />
                        <span className="text-slate-700">{opt}</span>
                      </label>
                    ))}
                  </div>
                  {!isRevealed && userAnswerIndex !== undefined && (
                    <Button size="md" variant="primary" onClick={handleVerifyAnswer} fullWidth>
                      Verificar Resposta
                    </Button>
                  )}
                  {isRevealed && (
                    <div className={`p-4 rounded-lg mt-3 text-sm border-2 ${interaction.isCorrect ? 'bg-green-50 text-green-800 border-green-400' : 'bg-red-50 text-red-800 border-red-400'}`}>
                      <div className="flex items-center mb-2">
                          {interaction.isCorrect ? <CheckCircleIcon className="w-6 h-6 mr-2 text-green-600"/> : <XCircleIcon className="w-6 h-6 mr-2 text-red-600"/>}
                          <strong className="text-base">Sua resposta está {interaction.isCorrect ? 'correta!' : 'incorreta.'}</strong>
                      </div>
                      <p className="mb-1">A resposta correta é: <strong>{qDef.options[qDef.correctAnswerIndex]}</strong>.</p>
                      {interaction.isCorrect === false && userAnswerIndex !== undefined && (
                        <p className="mb-1">Sua resposta: <strong>{qDef.options[userAnswerIndex]}</strong>.</p>
                      )}
                      {qDef.explanation && <div className="mt-2 pt-2 border-t border-opacity-50 prose prose-sm" dangerouslySetInnerHTML={{ __html: `<strong>Explicação da IA:</strong> ${qDef.explanation.replace(/\n/g, '<br />')}` }} />}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        );

      case ContentType.FLASHCARDS:
        const flashcards = currentTopicContent?.flashcards || [];
        const flashcardInteractions = currentInteractions?.flashcards || {};
        if (flashcards.length === 0 && !topic.isLoadingContent) {
          return <Button onClick={() => onGenerateContent(topic.id, ContentType.FLASHCARDS, currentTopicContent.summary)} isLoading={topic.isLoadingContent} leftIcon={<SparklesIcon className="w-5 h-5"/>} size="lg" fullWidth>Gerar Flashcards Interativos</Button>;
        }
        return (
          <div className="space-y-6">
            {flashcards.map(fcDef => {
              const isFlipped = flippedFlashcards[fcDef.id] || false;
              const interactionState = flashcardInteractions[fcDef.id] || { selfAssessment: 'unseen', reviewCount: 0, lastReviewedTimestamp: 0 };
              const assessment = interactionState.selfAssessment;
              
              let assessmentColor = 'border-slate-300';
              if (assessment === 'easy') assessmentColor = 'border-green-500';
              else if (assessment === 'medium') assessmentColor = 'border-amber-500';
              else if (assessment === 'hard') assessmentColor = 'border-red-500';

              return (
                <Card key={fcDef.id} className={`shadow-lg hover:shadow-xl transition-shadow border-b-4 ${assessmentColor}`}>
                  <div 
                    className="perspective h-56 cursor-pointer group" 
                    onClick={() => handleToggleFlashcardLocal(fcDef.id)}
                    role="button" tabIndex={0}
                    onKeyPress={(e) => e.key === 'Enter' && handleToggleFlashcardLocal(fcDef.id)}
                    aria-pressed={isFlipped}
                    aria-label={`Flashcard: ${fcDef.front}. Clique para ver a resposta.`}
                  >
                    <div className={`relative w-full h-full preserve-3d transition-transform duration-700 ease-in-out rounded-lg ${isFlipped ? 'rotate-y-180' : ''}`}>
                      {/* Frente */}
                      <div className="absolute w-full h-full backface-hidden flex flex-col items-center justify-center bg-gradient-to-br from-white to-slate-100 rounded-lg p-5 border border-slate-200">
                        <p className="text-slate-800 font-semibold text-lg text-center">{fcDef.front}</p>
                        <span className="mt-3 text-xs text-slate-400 group-hover:text-sky-500 transition-colors">Clique para virar</span>
                      </div>
                      {/* Verso */}
                      <div className="absolute w-full h-full backface-hidden rotate-y-180 flex flex-col items-center justify-center bg-gradient-to-br from-sky-600 to-cyan-500 rounded-lg p-5 text-white">
                        <p className="font-medium text-md text-center overflow-y-auto max-h-full custom-scrollbar">{fcDef.back}</p>
                        <span className="absolute bottom-3 text-xs text-sky-200 group-hover:text-white transition-colors">Clique para virar</span>
                      </div>
                    </div>
                  </div>
                  {isFlipped && (
                    <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap justify-around items-center gap-2">
                      <Button size="sm" variant={assessment === 'hard' ? 'danger': 'outline'} onClick={() => onFlashcardSelfAssessment(topic.id, fcDef.id, 'hard')}>Errei / Revisar</Button>
                      <Button size="sm" variant={assessment === 'medium' ? 'primary': 'outline'} className={assessment === 'medium' ? 'bg-amber-500 hover:bg-amber-600 border-amber-500 text-white focus:ring-amber-500' : 'border-amber-500 text-amber-600 hover:bg-amber-50 focus:ring-amber-500'} onClick={() => onFlashcardSelfAssessment(topic.id, fcDef.id, 'medium')}>Difícil</Button>
                      <Button size="sm" variant={assessment === 'easy' ? 'primary': 'outline'} className={assessment === 'easy' ? 'bg-green-500 hover:bg-green-600 border-green-500 text-white focus:ring-green-500' : 'border-green-500 text-green-600 hover:bg-green-50 focus:ring-green-500'} onClick={() => onFlashcardSelfAssessment(topic.id, fcDef.id, 'easy')}>Fácil</Button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        );
      
      case ContentType.DISCURSIVE_QUESTIONS:
        const discursiveQuestions = currentTopicContent?.discursiveQuestions || [];
        if (discursiveQuestions.length === 0 && !topic.isLoadingContent) {
          return <Button onClick={() => onGenerateContent(topic.id, ContentType.DISCURSIVE_QUESTIONS, currentTopicContent.summary)} isLoading={topic.isLoadingContent} leftIcon={<SparklesIcon className="w-5 h-5"/>} size="lg" fullWidth>Gerar Questões Dissertativas</Button>;
        }
        return (
          <div className="space-y-8">
            {discursiveQuestions.map((dqDef, index) => {
              const isOutlineVisible = visibleDiscursiveOutlines[dqDef.id] || false;
              return (
                <Card key={dqDef.id} className="bg-slate-50 shadow-md hover:shadow-lg transition-shadow">
                  <h4 className="font-semibold text-xl text-slate-800 mb-3 font-display">Questão Dissertativa {index + 1}</h4>
                  <p className="text-lg text-slate-700 mb-5 leading-relaxed">{dqDef.questionText}</p>
                  <Button 
                      variant="outline" 
                      size="md" 
                      onClick={() => handleToggleDiscursiveOutlineLocal(dqDef.id)}
                      leftIcon={<ChevronDownIcon className={`w-5 h-5 transform transition-transform ${isOutlineVisible ? 'rotate-180' : ''}`} />}
                  >
                    {isOutlineVisible ? 'Ocultar Roteiro de Resposta' : 'Mostrar Roteiro de Resposta'}
                  </Button>
                  {isOutlineVisible && dqDef.modelAnswerOutline && (
                    <div className="mt-5 pt-4 border-t border-slate-200">
                      <h5 className="text-lg font-semibold text-sky-700 mb-2 font-display">Roteiro de Resposta Esperada (IA):</h5>
                      <div className="prose prose-md prose-slate max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: dqDef.modelAnswerOutline.replace(/\n/g, '<br />') }} />
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        );

      default:
        return <p className="text-center text-slate-500 py-10">Selecione um tipo de conteúdo para começar seus estudos.</p>;
    }
  };

  const tabs = [
    { type: ContentType.SUMMARY, label: "Resumo Detalhado", icon: <DocumentTextIcon /> },
    { type: ContentType.QUESTIONS, label: "Questões Práticas", icon: <QuestionMarkCircleIcon /> },
    { type: ContentType.FLASHCARDS, label: "Flashcards Dinâmicos", icon: <RectangleStackIcon /> },
    { type: ContentType.DISCURSIVE_QUESTIONS, label: "Questões Dissertativas", icon: <PencilIcon /> },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <Button onClick={onBackToPlan} variant="ghost" size="md" className="text-sky-700 hover:bg-sky-50 w-full sm:w-auto justify-start" leftIcon={<ArrowLeftIcon className="w-5 h-5" />}>
          Voltar ao Painel / Plano
        </Button>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            size="md" 
            disabled={!prevTopicInfo}
            onClick={() => prevTopicInfo && onSelectTopic(prevTopicInfo.subjectId, prevTopicInfo.topicId)}
            leftIcon={<ArrowLeftIcon className="w-4 h-4"/>}
            className="flex-1"
          >
            Anterior
          </Button>
          <Button 
            variant="outline" 
            size="md" 
            disabled={!nextTopicInfo}
            onClick={() => nextTopicInfo && onSelectTopic(nextTopicInfo.subjectId, nextTopicInfo.topicId)}
            rightIcon={<ArrowRightIcon className="w-4 h-4"/>}
            className="flex-1"
          >
            Próximo
          </Button>
        </div>
      </div>
      
      <Card className="shadow-2xl">
        <div className="mb-8 pb-6 border-b border-slate-200">
          <p className="text-base text-sky-600 font-semibold tracking-wide">{subjectName.toUpperCase()}</p>
          <h2 className="text-4xl font-bold text-slate-800 mt-1 font-display">{topic.name}</h2>
        </div>

        <div className="mb-6 border-b-2 border-slate-200">
          <nav className="-mb-0.5 flex space-x-1 sm:space-x-2 overflow-x-auto pb-px" aria-label="Tabs">
            {tabs.map(tabInfo => (
              <button
                key={tabInfo.type}
                onClick={() => setActiveTab(tabInfo.type)}
                className={`whitespace-nowrap pb-3 pt-1 px-2 sm:px-4 border-b-4 font-semibold text-xs sm:text-base transition-all duration-200 ease-in-out flex items-center group
                  ${activeTab === tabInfo.type 
                    ? 'border-sky-500 text-sky-600' 
                    : 'border-transparent text-slate-500 hover:text-sky-600 hover:border-sky-300'
                  }`}
                aria-current={activeTab === tabInfo.type ? "page" : undefined}
              >
                {React.cloneElement(tabInfo.icon as React.ReactElement<{ className?: string }>, {className: `w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 transition-colors ${activeTab === tabInfo.type ? 'text-sky-500' : 'text-slate-400 group-hover:text-sky-500'}`})}
                {tabInfo.label} 
                {(topic.isLoadingContent && activeTab === tabInfo.type && (!currentTopicContent || !currentTopicContent[tabInfo.type] || (Array.isArray(currentTopicContent[tabInfo.type]) && (currentTopicContent[tabInfo.type] as any[]).length === 0) )) && 
                  <LoadingSpinner size="sm" color="text-sky-500" className="ml-2" />}
              </button>
            ))}
          </nav>
        </div>
        
        {/* Deeper Understanding Button */}
        <div className="my-6 p-4 bg-sky-50 border border-sky-200 rounded-lg shadow-sm">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center">
                    <BrainIcon className="w-8 h-8 text-sky-600 mr-3 flex-shrink-0"/>
                    <div>
                        <h4 className="text-lg font-semibold text-sky-800">Sentindo Dificuldade?</h4>
                        <p className="text-sm text-sky-700">Nossa IA pode te ajudar a entender melhor este tópico!</p>
                    </div>
                </div>
                <Button 
                    variant="primary" 
                    size="md" 
                    onClick={handleDeeperUnderstandingRequest}
                    isLoading={topic.isLoadingDeeperUnderstanding}
                    disabled={topic.isLoadingDeeperUnderstanding}
                    leftIcon={<SparklesIcon className="w-5 h-5"/>}
                    className="mt-3 sm:mt-0 w-full sm:w-auto"
                >
                    Preciso de Mais Ajuda
                </Button>
            </div>
        </div>


        {/* Modal for Deeper Understanding */}
        {showDeeperUnderstandingModal && (
            <div 
                className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]" 
                onClick={() => setShowDeeperUnderstandingModal(false)} // Close on overlay click
                role="dialog"
                aria-modal="true"
                aria-labelledby="deeper-understanding-title"
            >
                <Card 
                    title="Assistência Personalizada da IA"
                    id="deeper-understanding-title" 
                    className="max-w-2xl w-full bg-white shadow-2xl max-h-[80vh] flex flex-col" 
                    onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside card
                >
                    <div className="overflow-y-auto p-1 custom-scrollbar flex-grow">
                        {renderDeeperUnderstandingContent()}
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end space-x-3">
                         <Button 
                            variant="outline" 
                            onClick={handleDeeperUnderstandingRequest} // Re-generate
                            isLoading={topic.isLoadingDeeperUnderstanding}
                            disabled={topic.isLoadingDeeperUnderstanding}
                            leftIcon={<RefreshIcon/>}
                        >
                            Gerar Outra Ajuda
                        </Button>
                        <Button variant="primary" onClick={() => setShowDeeperUnderstandingModal(false)}>
                            Entendido, Fechar
                        </Button>
                    </div>
                </Card>
            </div>
        )}


        <div className="min-h-[300px] py-4">
          {renderContent()}
        </div>
        
        <div className="mt-10 pt-8 border-t-2 border-slate-200">
          <h4 className="text-xl font-semibold text-slate-700 mb-4 font-display">Atualizar Status do Tópico:</h4>
          <div className="flex flex-wrap gap-3">
            {(['Pendente', 'Estudando', 'Concluído'] as AnalyzedTopic['status'][]).map(statusValue => (
              <Button
                key={statusValue}
                variant={statusButtonVariant(topic.status, statusValue)}
                onClick={() => onUpdateTopicStatus(topic.id, statusValue)}
                size="md"
                className={`
                  ${topic.status === statusValue && statusValue === 'Pendente' ? 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-400 text-white' : ''}
                  ${topic.status === statusValue && statusValue === 'Estudando' ? 'bg-sky-500 hover:bg-sky-600 focus:ring-sky-400 text-white' : ''}
                  ${topic.status === statusValue && statusValue === 'Concluído' ? 'bg-green-500 hover:bg-green-600 focus:ring-green-400 text-white' : ''}
                  ${topic.status !== statusValue ? 'bg-slate-200 hover:bg-slate-300 text-slate-700 focus:ring-slate-300' : ''}
                `}
              >
                {statusValue}
              </Button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};
