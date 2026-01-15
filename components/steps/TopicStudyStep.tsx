
import React, { useState, useEffect } from 'react';
import { AnalyzedTopic, ContentType, FlashcardSelfAssessment } from '../../types';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ArrowLeftIcon, ArrowRightIcon, CheckCircleIcon, XCircleIcon, SparklesIcon, DocumentTextIcon, QuestionMarkCircleIcon, RectangleStackIcon, PencilIcon, ChevronDownIcon, BrainIcon, RefreshIcon } from '../../constants'; 
import { marked } from 'marked'; 

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
    setFlippedFlashcards({});
    setVisibleDiscursiveOutlines({});
    setShowDeeperUnderstandingModal(false);
    setActiveTab(ContentType.SUMMARY); 
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
  }, [topic.id, activeTab, topic.isLoadingContent, topic.errorContent]);

  const handleToggleFlashcardLocal = (flashcardId: string) => {
    setFlippedFlashcards(prev => ({ ...prev, [flashcardId]: !prev[flashcardId] }));
  };

  const renderDeeperUnderstandingContent = () => {
    if (topic.isLoadingDeeperUnderstanding) {
        return <div className="flex flex-col items-center justify-center py-10"><LoadingSpinner size="md" /><p className="mt-3 text-slate-500 font-medium">IA analisando suas dificuldades...</p></div>;
    }
    if (topic.errorDeeperUnderstanding) {
        return <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"><strong>Erro:</strong> {topic.errorDeeperUnderstanding}</div>;
    }
    if (currentTopicContent.deeperUnderstanding) {
        const { title, content } = currentTopicContent.deeperUnderstanding;
        const htmlContent = content ? marked.parse(content) : '<p>Conteúdo não disponível.</p>';
        return (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h4 className="text-xl font-bold text-sky-800 mb-4 font-display flex items-center">
                    <SparklesIcon className="w-6 h-6 mr-2 text-amber-500"/>
                    {title}
                </h4>
                <div className="prose prose-sm sm:prose-base max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: htmlContent }} />
            </div>
        );
    }
    return <p className="text-slate-500 text-center">Nenhuma ajuda adicional disponível.</p>;
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
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center py-10 px-4">
          <LoadingSpinner size="lg" color="text-sky-600" />
          <p className="mt-6 text-lg font-medium text-slate-700 animate-pulse">
            Preparando material de {tabs.find(t => t.type === activeTab)?.label.toLowerCase()}...
          </p>
          <p className="text-sm text-slate-500 mt-1">Usando IA para gerar conteúdo exclusivo.</p>
        </div>
      );
    }
    if (topic.errorContent && (!currentTopicContent || !currentTopicContent[activeTab])) { 
      return (
        <div className="p-8 bg-red-50 border border-red-100 rounded-2xl text-center max-w-md mx-auto my-8">
            <XCircleIcon className="w-12 h-12 text-red-400 mx-auto mb-3"/>
            <p className="text-red-800 font-bold text-lg">Ops! Tivemos um problema.</p>
            <p className="text-sm text-red-600 mt-1 mb-4">{topic.errorContent}</p>
            <Button 
                onClick={() => onGenerateContent(topic.id, activeTab, currentTopicContent.summary)} 
                leftIcon={<RefreshIcon />}
                variant="danger"
                size="sm"
            >
                Tentar Novamente
            </Button>
        </div>
      );
    }

    switch (activeTab) {
      case ContentType.SUMMARY:
        return currentTopicContent?.summary ? (
          <div 
            className="prose prose-slate prose-lg max-w-none text-slate-700 leading-relaxed 
                       prose-headings:font-display prose-headings:font-bold prose-headings:text-slate-800
                       prose-a:text-sky-600 prose-img:rounded-xl
                       sm:px-2"
            dangerouslySetInnerHTML={{ __html: marked.parse(currentTopicContent.summary) }} 
          />
        ) : <Button onClick={() => onGenerateContent(topic.id, ContentType.SUMMARY)} leftIcon={<SparklesIcon className="w-5 h-5"/>} size="lg" fullWidth className="py-8">Gerar Resumo Inteligente</Button>;
      
      case ContentType.QUESTIONS:
        const questions = currentTopicContent?.questions || [];
        const questionInteractions = currentInteractions?.questions || {};
        if (questions.length === 0 && !topic.isLoadingContent) {
          return <Button onClick={() => onGenerateContent(topic.id, ContentType.QUESTIONS, currentTopicContent.summary)} leftIcon={<SparklesIcon className="w-5 h-5"/>} size="lg" fullWidth className="py-8">Gerar Questões Desafiadoras</Button>;
        }
        return (
          <div className="space-y-6">
            {questions.map((qDef, index) => {
              const interaction = questionInteractions[qDef.id] || {};
              const userAnswerIndex = interaction.userAnswerIndex;
              const isRevealed = interaction.isRevealed || false;
              
              const handleVerifyAnswer = () => {
                const isCorrect = userAnswerIndex === qDef.correctAnswerIndex;
                onUpdateQuestionInteraction(topic.id, qDef.id, userAnswerIndex, true, isCorrect, (interaction.attempts || 0) + 1);
              };

              return (
                <Card key={qDef.id} className="bg-white border border-slate-200 !p-5 sm:!p-6">
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide mb-2 inline-block">Questão {index + 1}</span>
                    {isRevealed && <span className="text-xs text-slate-400 font-mono">Tentativas: {interaction.attempts}</span>}
                  </div>
                  <p className="font-semibold text-lg text-slate-800 mb-6">{qDef.questionText}</p>
                  
                  <div className="space-y-3 mb-6">
                    {qDef.options.map((opt, optIndex) => (
                      <label key={optIndex} className={`flex items-start p-4 rounded-xl border transition-all duration-200 cursor-pointer 
                        ${ isRevealed && optIndex === qDef.correctAnswerIndex ? 'bg-green-50 border-green-500 shadow-sm' : 
                          isRevealed && optIndex === userAnswerIndex && optIndex !== qDef.correctAnswerIndex ? 'bg-red-50 border-red-500 shadow-sm' :
                          !isRevealed && optIndex === userAnswerIndex ? 'bg-sky-50 border-sky-500 ring-1 ring-sky-500' :
                          'bg-white border-slate-200 hover:border-sky-300 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${qDef.id}`}
                          value={optIndex}
                          checked={userAnswerIndex === optIndex}
                          onChange={() => !isRevealed && onUpdateQuestionInteraction(topic.id, qDef.id, optIndex, false, undefined, interaction.attempts)}
                          className="mt-1 form-radio h-4 w-4 text-sky-600 border-slate-300 focus:ring-sky-500 mr-3 flex-shrink-0"
                          disabled={isRevealed}
                        />
                        <span className={`text-sm sm:text-base ${isRevealed && optIndex === qDef.correctAnswerIndex ? 'text-green-800 font-medium' : 'text-slate-700'}`}>{opt}</span>
                      </label>
                    ))}
                  </div>
                  {!isRevealed && userAnswerIndex !== undefined && (
                    <Button size="md" variant="primary" onClick={handleVerifyAnswer} fullWidth className="font-bold">
                      Confirmar Resposta
                    </Button>
                  )}
                  {isRevealed && (
                    <div className={`p-5 rounded-xl mt-4 text-sm border ${interaction.isCorrect ? 'bg-green-50/50 border-green-200' : 'bg-red-50/50 border-red-200'}`}>
                      <div className="flex items-center mb-2 font-bold">
                          {interaction.isCorrect ? <CheckCircleIcon className="w-5 h-5 mr-2 text-green-600"/> : <XCircleIcon className="w-5 h-5 mr-2 text-red-600"/>}
                          <span className={interaction.isCorrect ? 'text-green-800' : 'text-red-800'}>
                             {interaction.isCorrect ? 'Resposta Correta!' : 'Resposta Incorreta.'}
                          </span>
                      </div>
                      {qDef.explanation && <div className="mt-2 text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: qDef.explanation.replace(/\n/g, '<br />') }} />}
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
          return <Button onClick={() => onGenerateContent(topic.id, ContentType.FLASHCARDS, currentTopicContent.summary)} leftIcon={<SparklesIcon className="w-5 h-5"/>} size="lg" fullWidth className="py-8">Gerar Flashcards Interativos</Button>;
        }
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {flashcards.map(fcDef => {
              const isFlipped = flippedFlashcards[fcDef.id] || false;
              const interactionState = flashcardInteractions[fcDef.id] || { selfAssessment: 'unseen' };
              const assessment = interactionState.selfAssessment;
              
              const borderClass = assessment === 'easy' ? 'border-b-4 border-b-green-500' : 
                                  assessment === 'medium' ? 'border-b-4 border-b-amber-500' : 
                                  assessment === 'hard' ? 'border-b-4 border-b-red-500' : 'border-b-4 border-b-slate-200';

              return (
                <div key={fcDef.id} className={`bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col ${borderClass} overflow-hidden h-full`}>
                  <div 
                    className="perspective h-64 sm:h-72 cursor-pointer group relative w-full" 
                    onClick={() => handleToggleFlashcardLocal(fcDef.id)}
                  >
                    <div className={`relative w-full h-full preserve-3d transition-transform duration-500 ease-out ${isFlipped ? 'rotate-y-180' : ''}`}>
                      {/* Front */}
                      <div className="absolute w-full h-full backface-hidden flex flex-col items-center justify-center p-6 bg-white text-center">
                        <span className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-4">Pergunta</span>
                        <p className="text-slate-800 font-semibold text-lg sm:text-xl leading-snug">{fcDef.front}</p>
                        <span className="absolute bottom-4 text-xs text-sky-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">Toque para ver a resposta</span>
                      </div>
                      {/* Back */}
                      <div className="absolute w-full h-full backface-hidden rotate-y-180 flex flex-col items-center justify-center p-6 bg-slate-800 text-white text-center rounded-t-xl sm:rounded-none">
                        <span className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-4">Resposta</span>
                        <div className="overflow-y-auto max-h-full custom-scrollbar w-full">
                             <p className="text-base sm:text-lg leading-relaxed">{fcDef.back}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Controls - Only visible when flipped or previously assessed */}
                  <div className={`p-3 bg-slate-50 border-t border-slate-100 flex justify-center gap-2 transition-opacity duration-300 ${isFlipped || assessment !== 'unseen' ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                      <button onClick={(e) => { e.stopPropagation(); onFlashcardSelfAssessment(topic.id, fcDef.id, 'hard'); }} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${assessment === 'hard' ? 'bg-red-500 text-white' : 'bg-white text-red-500 border border-red-200 hover:bg-red-50'}`}>Difícil</button>
                      <button onClick={(e) => { e.stopPropagation(); onFlashcardSelfAssessment(topic.id, fcDef.id, 'medium'); }} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${assessment === 'medium' ? 'bg-amber-500 text-white' : 'bg-white text-amber-500 border border-amber-200 hover:bg-amber-50'}`}>Médio</button>
                      <button onClick={(e) => { e.stopPropagation(); onFlashcardSelfAssessment(topic.id, fcDef.id, 'easy'); }} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${assessment === 'easy' ? 'bg-green-500 text-white' : 'bg-white text-green-500 border border-green-200 hover:bg-green-50'}`}>Fácil</button>
                  </div>
                </div>
              );
            })}
          </div>
        );
      
      case ContentType.DISCURSIVE_QUESTIONS:
         // ... implementation similar to questions but tailored for discursive ...
          const discursiveQuestions = currentTopicContent?.discursiveQuestions || [];
        if (discursiveQuestions.length === 0 && !topic.isLoadingContent) {
          return <Button onClick={() => onGenerateContent(topic.id, ContentType.DISCURSIVE_QUESTIONS, currentTopicContent.summary)} leftIcon={<SparklesIcon className="w-5 h-5"/>} size="lg" fullWidth className="py-8">Gerar Questões Dissertativas</Button>;
        }
        return (
          <div className="space-y-6">
            {discursiveQuestions.map((dqDef, index) => {
              const isOutlineVisible = visibleDiscursiveOutlines[dqDef.id] || false;
              return (
                <Card key={dqDef.id} className="!p-6 bg-white border border-slate-200">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Questão {index + 1}</span>
                  <p className="text-lg text-slate-800 mb-6 font-medium">{dqDef.questionText}</p>
                  
                  <div className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
                      <button 
                        onClick={() => setVisibleDiscursiveOutlines(prev => ({ ...prev, [dqDef.id]: !prev[dqDef.id] }))}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-100 transition-colors"
                      >
                          <span className="text-sm font-semibold text-slate-600">Ver Roteiro de Resposta Sugerido</span>
                          <ChevronDownIcon className={`w-5 h-5 text-slate-400 transform transition-transform ${isOutlineVisible ? 'rotate-180' : ''}`} />
                      </button>
                      {isOutlineVisible && dqDef.modelAnswerOutline && (
                        <div className="p-5 border-t border-slate-200 bg-white">
                          <div className="prose prose-sm max-w-none text-slate-600" dangerouslySetInnerHTML={{ __html: dqDef.modelAnswerOutline.replace(/\n/g, '<br />') }} />
                        </div>
                      )}
                  </div>
                </Card>
              );
            })}
          </div>
        );

      default:
        return null;
    }
  };

  const tabs = [
    { type: ContentType.SUMMARY, label: "Resumo", icon: <DocumentTextIcon /> },
    { type: ContentType.QUESTIONS, label: "Questões", icon: <QuestionMarkCircleIcon /> },
    { type: ContentType.FLASHCARDS, label: "Flashcards", icon: <RectangleStackIcon /> },
    { type: ContentType.DISCURSIVE_QUESTIONS, label: "Dissertativas", icon: <PencilIcon /> },
  ];

  return (
    <div className="max-w-5xl mx-auto pb-20">
      {/* Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <Button onClick={onBackToPlan} variant="ghost" size="sm" className="pl-0 text-slate-500 hover:text-sky-700" leftIcon={<ArrowLeftIcon className="w-4 h-4" />}>
          Voltar
        </Button>
        <div className="flex space-x-2 w-full sm:w-auto">
             <Button 
                variant="secondary" size="sm" 
                disabled={!prevTopicInfo}
                onClick={() => prevTopicInfo && onSelectTopic(prevTopicInfo.subjectId, prevTopicInfo.topicId)}
                leftIcon={<ArrowLeftIcon className="w-3 h-3"/>}
                className="flex-1 sm:flex-none"
              >
                Anterior
              </Button>
              <Button 
                variant="secondary" size="sm"
                disabled={!nextTopicInfo}
                onClick={() => nextTopicInfo && onSelectTopic(nextTopicInfo.subjectId, nextTopicInfo.topicId)}
                rightIcon={<ArrowRightIcon className="w-3 h-3"/>}
                className="flex-1 sm:flex-none"
              >
                Próximo
              </Button>
        </div>
      </div>

      <div className="mb-8">
          <p className="text-sm font-bold text-sky-600 tracking-wide uppercase mb-1">{subjectName}</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display leading-tight">{topic.name}</h2>
      </div>

      {/* Scrollable Tabs - Mobile Optimized */}
      <div className="sticky top-[60px] z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 mb-8 -mx-4 px-4 sm:mx-0 sm:px-0 sm:rounded-xl sm:border sm:top-20 shadow-sm">
        <nav className="flex space-x-6 overflow-x-auto no-scrollbar py-3 sm:justify-center sm:p-2" aria-label="Tabs">
          {tabs.map(tabInfo => (
            <button
              key={tabInfo.type}
              onClick={() => setActiveTab(tabInfo.type)}
              className={`whitespace-nowrap flex items-center px-3 py-2 rounded-lg text-sm font-bold transition-all duration-200
                ${activeTab === tabInfo.type 
                  ? 'bg-sky-50 text-sky-700 ring-1 ring-sky-200 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
            >
              {React.cloneElement(tabInfo.icon as React.ReactElement<{ className?: string }>, {className: `w-4 h-4 mr-2 ${activeTab === tabInfo.type ? 'text-sky-600' : 'text-slate-400'}`})}
              {tabInfo.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="min-h-[400px]">
         {renderContent()}
      </div>

      {/* Bottom Actions Area */}
      <div className="mt-12 pt-8 border-t border-slate-200">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
           <div>
              <h4 className="font-bold text-slate-800 text-lg mb-1">Terminou este tópico?</h4>
              <p className="text-sm text-slate-500">Atualize o status para acompanhar seu progresso.</p>
           </div>
           <div className="flex gap-3">
              {(['Pendente', 'Estudando', 'Concluído'] as AnalyzedTopic['status'][]).map(statusValue => (
                <button
                  key={statusValue}
                  onClick={() => onUpdateTopicStatus(topic.id, statusValue)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ring-1 ring-inset
                    ${topic.status === statusValue && statusValue === 'Concluído' ? 'bg-green-600 text-white ring-green-600 shadow-md' : 
                      topic.status === statusValue && statusValue === 'Estudando' ? 'bg-sky-600 text-white ring-sky-600 shadow-md' :
                      topic.status === statusValue ? 'bg-amber-500 text-white ring-amber-500 shadow-md' :
                      'bg-white text-slate-600 ring-slate-300 hover:bg-slate-100'
                    }`}
                >
                  {statusValue}
                </button>
              ))}
           </div>
        </div>

        {/* AI Help CTA */}
        <div className="mt-6 text-center">
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => { onGetDeeperUnderstanding(topic.id); setShowDeeperUnderstandingModal(true); }}
                className="text-sky-600 hover:bg-sky-50"
                leftIcon={<BrainIcon className="w-4 h-4"/>}
            >
                Estou com dificuldade neste tópico
            </Button>
        </div>
      </div>

      {/* Modal */}
      {showDeeperUnderstandingModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-lg text-slate-800">Assistente de Estudo IA</h3>
                    <button onClick={() => setShowDeeperUnderstandingModal(false)} className="text-slate-400 hover:text-slate-600"><XCircleIcon className="w-6 h-6"/></button>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {renderDeeperUnderstandingContent()}
                </div>
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <Button variant="ghost" onClick={() => setShowDeeperUnderstandingModal(false)}>Fechar</Button>
                    <Button variant="primary" onClick={() => onGetDeeperUnderstanding(topic.id)} leftIcon={<RefreshIcon/>}>Gerar Outra Explicação</Button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
