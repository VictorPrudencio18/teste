import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
    AppPhase, EditalAnalysisData, UserProfile, AnalyzedTopic, 
    ContentType, ChatMessage, AISuggestion, 
    FlashcardSelfAssessment, DashboardData, TopicContent
} from './types';

// Components
// Removed Firebase-related imports
import { EditalUploadOnlyStep } from './components/steps/EditalUploadOnlyStep';
import { RoleSelectionStep } from './components/steps/RoleSelectionStep';
import { UserPreferencesStep } from './components/steps/UserPreferencesStep';
import { PlanViewStep } from './components/steps/PlanViewStep';
import { TopicStudyStep } from './components/steps/TopicStudyStep';
import { AICoachStep } from './components/steps/AICoachStep';
import { DashboardStep } from './components/steps/DashboardStep';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { Button } from './components/common/Button';
import { analyzeEditalWithAI, generateTopicContentWithAI, extractRolesFromEditalAI, getAIStudySuggestions, askAICoachQuestion, getDeeperUnderstandingAI } from './services/geminiService';
import { AcademicCapIcon, SparklesIcon, ChatBubbleLeftEllipsisIcon, HomeIcon, ChartPieIcon } from './constants'; // Removed ArrowRightOnRectangleIcon
import { v4 as uuidv4 } from 'uuid';

const LOCALSTORAGE_KEY = 'concursoGeniusAppState_v1';

const App: React.FC = () => {
  // --- STATE INITIALIZATION FROM LOCALSTORAGE ---
  const loadInitialState = () => {
    try {
      const savedStateJSON = localStorage.getItem(LOCALSTORAGE_KEY);
      if (savedStateJSON) {
        return JSON.parse(savedStateJSON);
      }
    } catch (error) {
      console.error("Failed to load state from localStorage:", error);
      localStorage.removeItem(LOCALSTORAGE_KEY); // Clear corrupted state
    }
    return {}; // Return empty object if nothing saved or on error
  };

  const [initialState] = useState(loadInitialState);

  // State Hooks
  const [currentPhase, setCurrentPhase] = useState<AppPhase>(initialState.currentPhase || AppPhase.UPLOAD_PDF_ONLY);
  const [editalText, setEditalText] = useState<string>(initialState.editalText || '');
  const [editalFileName, setEditalFileName] = useState<string | null>(initialState.editalFileName || null);
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(initialState.userProfile || {
    targetRole: '', 
    dailyStudyHours: 3, 
    studyDays: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'], 
    studyNotes: '' 
  });
  const [extractedRoles, setExtractedRoles] = useState<string[]>(initialState.extractedRoles || []);
  const [aiRoleClarificationQuestions, setAiRoleClarificationQuestions] = useState<string[] | undefined>(initialState.aiRoleClarificationQuestions || undefined);
  const [aiRoleExtractionError, setAiRoleExtractionError] = useState<string | null>(initialState.aiRoleExtractionError || null);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);

  const [analysisResult, setAnalysisResult] = useState<EditalAnalysisData | null>(initialState.analysisResult || null);

  const [currentStudyingSubjectId, setCurrentStudyingSubjectId] = useState<string | null>(initialState.currentStudyingSubjectId || null);
  const [currentStudyingTopicId, setCurrentStudyingTopicId] = useState<string | null>(initialState.currentStudyingTopicId || null);
  const [globalLoadingMessage, setGlobalLoadingMessage] = useState<string | null>(null);

  const [aiCoachChatMessages, setAiCoachChatMessages] = useState<ChatMessage[]>(initialState.aiCoachChatMessages || []);
  const [aiCoachSuggestions, setAiCoachSuggestions] = useState<AISuggestion[] | null>(null);
  const [aiCoachGeneralAdvice, setAiCoachGeneralAdvice] = useState<string | null>(null);
  const [isLoadingAICoachSuggestions, setIsLoadingAICoachSuggestions] = useState(false);
  const [isLoadingAICoachChatResponse, setIsLoadingAICoachChatResponse] = useState(false);
  const [aiCoachSuggestionsError, setAiCoachSuggestionsError] = useState<string | null>(null);
  const [aiCoachChatError, setAiCoachChatError] = useState<string | null>(null);

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(initialState.dashboardData || null);
  const [isProcessingSubmit, setIsProcessingSubmit] = useState(false); 
  
  // --- EFFECT TO SAVE STATE TO LOCALSTORAGE ---
  useEffect(() => {
    try {
      const stateToSave = {
        currentPhase,
        editalText,
        editalFileName,
        userProfile,
        extractedRoles,
        aiRoleClarificationQuestions,
        aiRoleExtractionError,
        analysisResult,
        currentStudyingSubjectId,
        currentStudyingTopicId,
        aiCoachChatMessages,
        dashboardData,
        // Transient states like isLoading*, *Error, globalLoadingMessage are not saved
      };
      const serializedState = JSON.stringify(stateToSave);
      localStorage.setItem(LOCALSTORAGE_KEY, serializedState);
    } catch (error) {
      console.error("Failed to save state to localStorage:", error);
    }
  }, [
    currentPhase, editalText, editalFileName, userProfile, extractedRoles, 
    aiRoleClarificationQuestions, aiRoleExtractionError, analysisResult,
    currentStudyingSubjectId, currentStudyingTopicId, aiCoachChatMessages, dashboardData
  ]);

  // useCallback Hooks
  const calculateDashboardData = useCallback(() => {
    if (!analysisResult || !analysisResult.subjects) {
      setDashboardData(null);
      return;
    }
    let totalTopics = 0;
    let completedTopics = 0;
    let pendingTopics = 0;
    let studyingTopics = 0;

    const subjectProgress = analysisResult.subjects.map(subject => {
      let sCompleted = 0;
      subject.topics.forEach(t => {
        totalTopics++;
        if (t.status === 'Concluído') { sCompleted++; completedTopics++;}
        else if (t.status === 'Pendente') { pendingTopics++;}
        else { studyingTopics++;}
      });
      return {
        id: subject.id, name: subject.name, totalTopics: subject.topics.length,
        completedTopics: sCompleted,
        percentage: subject.topics.length > 0 ? Math.round((sCompleted / subject.topics.length) * 100) : 0,
      };
    });

    setDashboardData({
      totalTopics, completedTopics, pendingTopics, studyingTopics,
      completionPercentage: totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0,
      subjectProgress,
    });
  }, [analysisResult]);

  const fetchRoles = useCallback(async (currentEditalText: string) => {
    if (!currentEditalText) return;
    setIsLoadingRoles(true); setAiRoleExtractionError(null); setAiRoleClarificationQuestions(undefined); setExtractedRoles([]);
    const roleResult = await extractRolesFromEditalAI(currentEditalText);
    if (roleResult.error) setAiRoleExtractionError(roleResult.error);
    if (roleResult.roles) setExtractedRoles(roleResult.roles);
    if (roleResult.clarificationQuestions) setAiRoleClarificationQuestions(roleResult.clarificationQuestions);
    setIsLoadingRoles(false);
  }, []);

  const handlePdfUploaded = useCallback(async (text: string, fileName: string) => {
    setEditalText(text); 
    setEditalFileName(fileName);
    setCurrentPhase(AppPhase.ROLE_SELECTION);
    await fetchRoles(text);
  }, [fetchRoles]);
  
  const updateTopicData = useCallback((topicId: string, updateFn: (topic: AnalyzedTopic) => AnalyzedTopic) => {
    setAnalysisResult(prevResult => {
      if (!prevResult) return null;
      const newResult = {
        ...prevResult,
        subjects: prevResult.subjects.map(subject => ({
          ...subject,
          topics: subject.topics.map(topic => 
            topic.id === topicId ? updateFn(topic) : topic
          )
        }))
      };
      return newResult;
    });
  }, []);


  const handleGenerateContent = useCallback(async (topicId: string, contentType: ContentType, existingSummary?: string) => {
    const subject = analysisResult?.subjects.find(s => s.topics.some(t => t.id === topicId));
    const currentTopicState = subject?.topics.find(t => t.id === topicId);
    if (!subject || !currentTopicState) return;

    await updateTopicData(topicId, t => ({ ...t, isLoadingContent: true, errorContent: undefined }));
    
    let summaryToUse = existingSummary || currentTopicState.content?.summary;

    if (!summaryToUse && contentType !== ContentType.SUMMARY && 
        (contentType === ContentType.QUESTIONS || contentType === ContentType.FLASHCARDS || contentType === ContentType.DISCURSIVE_QUESTIONS)) {
        const summaryResult = await generateTopicContentWithAI(subject.name, currentTopicState.name, ContentType.SUMMARY);
        if (!('error' in summaryResult) && summaryResult.summary) {
            summaryToUse = summaryResult.summary;
            await updateTopicData(topicId, t => ({
                 ...t, 
                 content: { ...(t.content || {}), summary: summaryToUse }
            }));
        } else if ('error' in summaryResult) {
            await updateTopicData(topicId, t => ({ ...t, isLoadingContent: false, errorContent: `Erro ao gerar resumo base necessário: ${summaryResult.error}` }));
            return;
        }
    }

    const contentResult = await generateTopicContentWithAI(subject.name, currentTopicState.name, contentType, summaryToUse);
    
    await updateTopicData(topicId, t => {
        const newTopicContent: TopicContent = { ...(t.content || {}) };
        if (!('error' in contentResult)) {
            if (contentType === ContentType.SUMMARY && contentResult.summary) newTopicContent.summary = contentResult.summary;
            if (contentType === ContentType.QUESTIONS && contentResult.questions) newTopicContent.questions = contentResult.questions;
            if (contentType === ContentType.FLASHCARDS && contentResult.flashcards) newTopicContent.flashcards = contentResult.flashcards;
            if (contentType === ContentType.DISCURSIVE_QUESTIONS && contentResult.discursiveQuestions) newTopicContent.discursiveQuestions = contentResult.discursiveQuestions;
        } else {
            if (contentType === ContentType.SUMMARY) newTopicContent.summary = undefined; // Keep previous if error? Or clear? Clearing for now.
            if (contentType === ContentType.QUESTIONS) newTopicContent.questions = t.content?.questions || [];
            if (contentType === ContentType.FLASHCARDS) newTopicContent.flashcards = t.content?.flashcards || [];
            if (contentType === ContentType.DISCURSIVE_QUESTIONS) newTopicContent.discursiveQuestions = t.content?.discursiveQuestions || [];
        }
        return { 
            ...t, 
            content: newTopicContent,
            isLoadingContent: false, 
            errorContent: ('error' in contentResult) ? contentResult.error : undefined,
        };
    });
  }, [analysisResult, updateTopicData]);

  const handleUpdateTopicStatus = useCallback((topicId: string, status: AnalyzedTopic['status']) => {
    updateTopicData(topicId, t => ({ ...t, status }));
  }, [updateTopicData]);

  const handleUpdateQuestionInteraction = useCallback((
    topicId: string, 
    questionId: string, 
    userAnswerIndex: number | undefined, 
    isRevealed: boolean, 
    isCorrect?: boolean, 
    newAttempts?: number
    ) => {
    updateTopicData(topicId, t => {
      const interactions = t.userInteractions ? { ...t.userInteractions } : { questions: {}, flashcards: {} };
      interactions.questions = interactions.questions ? { ...interactions.questions } : {};
      
      const existingInteraction = interactions.questions[questionId] || {};
      
      interactions.questions[questionId] = { 
        ...existingInteraction,
        userAnswerIndex, 
        isRevealed,
        isCorrect: isRevealed && isCorrect !== undefined ? isCorrect : existingInteraction.isCorrect,
        attempts: newAttempts !== undefined ? newAttempts : existingInteraction.attempts
      };
      return { ...t, userInteractions: interactions };
    });
  }, [updateTopicData]);

  const handleFlashcardSelfAssessment = useCallback((topicId: string, flashcardId: string, assessment: FlashcardSelfAssessment) => {
    updateTopicData(topicId, t => {
        const interactions = t.userInteractions ? { ...t.userInteractions } : { questions: {}, flashcards: {} };
        interactions.flashcards = interactions.flashcards ? { ...interactions.flashcards } : {};
        
        interactions.flashcards[flashcardId] = { 
            selfAssessment: assessment,
            reviewCount: (interactions.flashcards[flashcardId]?.reviewCount || 0) + 1,
            lastReviewedTimestamp: Date.now()
        };
        return { ...t, userInteractions: interactions };
    });
  }, [updateTopicData]);

  const handleGetDeeperUnderstanding = useCallback(async (topicId: string) => {
    const subject = analysisResult?.subjects.find(s => s.topics.some(t => t.id === topicId));
    const currentTopicState = subject?.topics.find(t => t.id === topicId);

    if (!subject || !currentTopicState) return;

    await updateTopicData(topicId, t => ({ ...t, isLoadingDeeperUnderstanding: true, errorDeeperUnderstanding: undefined }));

    const result = await getDeeperUnderstandingAI(
        subject.name,
        currentTopicState.name,
        currentTopicState.content?.summary,
        currentTopicState.userInteractions
    );

    await updateTopicData(topicId, t => {
        const newContent = { ...(t.content || {}) };
        if (!('error' in result)) {
            newContent.deeperUnderstanding = result;
        }
        return {
            ...t,
            content: newContent,
            isLoadingDeeperUnderstanding: false,
            errorDeeperUnderstanding: ('error' in result) ? result.error : undefined,
        };
    });
  }, [analysisResult, updateTopicData]);


  const fetchAICoachSuggestions = useCallback(async () => {
    if (!userProfile?.targetRole || !analysisResult || !editalText) return; 
    setIsLoadingAICoachSuggestions(true); setAiCoachSuggestionsError(null);
    const result = await getAIStudySuggestions(analysisResult, editalText, userProfile.targetRole);
    if (result.error) setAiCoachSuggestionsError(result.error);
    else { setAiCoachSuggestions(result.suggestions); setAiCoachGeneralAdvice(result.generalAdvice || null); }
    setIsLoadingAICoachSuggestions(false);
  }, [analysisResult, editalText, userProfile]);

  const handleNavigateToAICoach = useCallback(() => {
    setCurrentPhase(AppPhase.AI_COACH);
    fetchAICoachSuggestions(); 
  }, [fetchAICoachSuggestions]);

  const handleSendAICoachMessage = useCallback(async (userMessageText: string) => {
    if (!userMessageText.trim() || !userProfile?.targetRole || !editalText) return;
    const newUserMessage: ChatMessage = { id: uuidv4(), sender: 'user', text: userMessageText, timestamp: Date.now() };
    
    const updatedMessages = [...aiCoachChatMessages, newUserMessage];
    setAiCoachChatMessages(updatedMessages);

    setIsLoadingAICoachChatResponse(true); setAiCoachChatError(null);

    const limitedHistory = updatedMessages.slice(-6); 
    const result = await askAICoachQuestion(userMessageText, limitedHistory, editalText, userProfile.targetRole, analysisResult);
    
    let aiResponseText = "Desculpe, não consegui processar sua pergunta no momento.";
    let messageError = false;
    if (result.error) { aiResponseText = result.error; messageError = true; } 
    else if (result.answer) { aiResponseText = result.answer; }
    
    const aiResponseMessage: ChatMessage = { id: uuidv4(), sender: 'ai', text: aiResponseText, timestamp: Date.now(), error: messageError };
    const finalMessages = [...updatedMessages, aiResponseMessage];
    setAiCoachChatMessages(finalMessages);
    
    setIsLoadingAICoachChatResponse(false);
  }, [aiCoachChatMessages, editalText, userProfile, analysisResult]);
  
  const resetLocalAppState = () => {
    setEditalText(''); setEditalFileName(null); 
    setUserProfile({ 
        targetRole: '', 
        dailyStudyHours: 3, studyDays: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'], studyNotes: '' 
    });
    setExtractedRoles([]);
    setAiRoleClarificationQuestions(undefined); setAiRoleExtractionError(null); setIsLoadingRoles(false);
    setAnalysisResult(null); setCurrentStudyingSubjectId(null);
    setCurrentStudyingTopicId(null); setGlobalLoadingMessage(null); setAiCoachSuggestions(null);
    setAiCoachGeneralAdvice(null); setAiCoachChatMessages([]); setIsLoadingAICoachSuggestions(false);
    setIsLoadingAICoachChatResponse(false); setAiCoachSuggestionsError(null); setAiCoachChatError(null);
    setDashboardData(null);
    setIsProcessingSubmit(false);
    setCurrentPhase(AppPhase.UPLOAD_PDF_ONLY); // Reset to initial phase
  };

  const handleResetApp = () => { 
    setGlobalLoadingMessage("Limpando dados...");
    localStorage.removeItem(LOCALSTORAGE_KEY);
    resetLocalAppState();
    // Simulating a small delay for the message to be visible
    setTimeout(() => {
      setGlobalLoadingMessage(null);
    }, 500);
  };

  const handleRoleSelectedAndProceed = (selectedRole: string) => {
    setUserProfile(prev => ({
        ...(prev || { dailyStudyHours: 3, studyDays: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'], studyNotes: '' }), // Ensure default structure
        targetRole: selectedRole,
    }));
    setCurrentPhase(AppPhase.USER_PREFERENCES);
  };

  const handlePreferencesSubmitted = async (preferences: Omit<UserProfile, 'targetRole' | 'uid' | 'email'>) => {
    if (!userProfile?.targetRole || !editalText) {
        setGlobalLoadingMessage("Erro: Dados incompletos para gerar o plano.");
        if (!editalText) setCurrentPhase(AppPhase.UPLOAD_PDF_ONLY);
        else setCurrentPhase(AppPhase.ROLE_SELECTION);
        return;
    }

    setIsProcessingSubmit(true); 

    const completeProfile: UserProfile = { 
        ...userProfile, // Keeps existing targetRole
        ...preferences,
    };
    setUserProfile(completeProfile);

    try {
      setIsProcessingSubmit(false); 
      setCurrentPhase(AppPhase.GENERATING_PLAN);
      setGlobalLoadingMessage(`Analisando edital para "${completeProfile.targetRole}" e personalizando seu plano...`);

      const result = await analyzeEditalWithAI(editalText, completeProfile.targetRole);
      
      const resultWithInitializedFields = result.error ? result : {
        ...result,
        subjects: result.subjects.map(subject => ({
          ...subject,
          topics: subject.topics.map(topic => ({
            ...topic,
            content: topic.content || { summary: undefined, questions: [], flashcards: [], discursiveQuestions: [] },
            userInteractions: topic.userInteractions || { questions: {}, flashcards: {} }
          }))
        }))
      };
      
      setAnalysisResult(resultWithInitializedFields);
      setCurrentPhase(AppPhase.DASHBOARD); 
      setGlobalLoadingMessage(null);

    } catch (error) {
      console.error("Error during preferences submission or plan generation:", error);
      setIsProcessingSubmit(false); 
      setGlobalLoadingMessage(null); 
      setCurrentPhase(AppPhase.USER_PREFERENCES); 
    }
  };

  const handleSelectTopic = (subjectId: string, topicId: string) => {
    setCurrentStudyingSubjectId(subjectId);
    setCurrentStudyingTopicId(topicId);
    setCurrentPhase(AppPhase.STUDY_TOPIC);
  };

  const handleBackToPlan = () => {
    setCurrentStudyingSubjectId(null);
    setCurrentStudyingTopicId(null);
    if (dashboardData && (dashboardData.completedTopics > 0 || dashboardData.studyingTopics > 0 || dashboardData.pendingTopics > 0)){
        setCurrentPhase(AppPhase.DASHBOARD);
    } else if (analysisResult && analysisResult.subjects.length > 0) {
        setCurrentPhase(AppPhase.VIEW_PLAN);
    } else {
        setCurrentPhase(AppPhase.UPLOAD_PDF_ONLY);
    }
  };

  const handleNavigateToStudyTopicFromCoach = (subjectId: string, topicId: string) => {
    handleSelectTopic(subjectId, topicId); 
  };
  
  const handleNavigateToDashboard = () => setCurrentPhase(AppPhase.DASHBOARD);
  const handleNavigateToPlanView = () => setCurrentPhase(AppPhase.VIEW_PLAN);

  // useEffect Hooks
  useEffect(() => {
    // This effect ensures that when the app loads, if there's a plan, it calculates dashboard data.
    if ((currentPhase === AppPhase.DASHBOARD || currentPhase === AppPhase.VIEW_PLAN || currentPhase === AppPhase.STUDY_TOPIC) && analysisResult) {
      calculateDashboardData();
    }
  }, [currentPhase, analysisResult, calculateDashboardData]);
  
  const renderAppContent = () => {
    if (globalLoadingMessage && (currentPhase === AppPhase.GENERATING_PLAN || globalLoadingMessage.includes("Limpando"))) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center px-4">
          <LoadingSpinner size="lg" color="text-sky-600" />
          <h2 className="mt-6 text-2xl font-semibold text-sky-700">Aguarde um Momento</h2>
          <p className="mt-2 text-lg text-slate-600">{globalLoadingMessage}</p>
        </div>
      );
    }

    switch (currentPhase) {
      case AppPhase.UPLOAD_PDF_ONLY:
        return <EditalUploadOnlyStep onPdfUploaded={handlePdfUploaded} isLoading={isLoadingRoles} />;
      case AppPhase.ROLE_SELECTION:
        return <RoleSelectionStep 
                  editalFileName={editalFileName} extractedRoles={extractedRoles}
                  aiClarificationQuestions={aiRoleClarificationQuestions} aiRoleExtractionError={aiRoleExtractionError}
                  isLoadingRoles={isLoadingRoles} onRoleSelectAndProceed={handleRoleSelectedAndProceed}
                  onBackToUpload={() => setCurrentPhase(AppPhase.UPLOAD_PDF_ONLY)}
                  onRequestRoleExtraction={() => editalText ? fetchRoles(editalText) : setCurrentPhase(AppPhase.UPLOAD_PDF_ONLY)} />;
      case AppPhase.USER_PREFERENCES:
        if (!userProfile?.targetRole) { 
            setCurrentPhase(AppPhase.ROLE_SELECTION); 
            return (
               <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
                 <LoadingSpinner size="lg" />
                 <p className="mt-4 text-slate-600">Redirecionando para seleção de cargo...</p>
               </div>
            );
        }
        return <UserPreferencesStep 
                  targetRole={userProfile.targetRole} onPreferencesSubmit={handlePreferencesSubmitted} 
                  isLoading={isProcessingSubmit} 
                  initialProfile={{dailyStudyHours: userProfile.dailyStudyHours, studyDays: userProfile.studyDays, studyNotes: userProfile.studyNotes}}
                  onGoBack={() => setCurrentPhase(AppPhase.ROLE_SELECTION)} />;
      case AppPhase.GENERATING_PLAN: return null; 
      case AppPhase.DASHBOARD:
        return dashboardData ? (
          <DashboardStep dashboardData={dashboardData} userName={userProfile?.email?.split('@')[0]} onNavigateToPlan={handleNavigateToPlanView} onNavigateToTopic={handleSelectTopic} analysisResult={analysisResult}/>
        ) : (analysisResult && analysisResult.subjects.length === 0 && !analysisResult.error) ? 
           <PlanViewStep planData={analysisResult} targetRoleName={userProfile?.targetRole} onSelectTopic={handleSelectTopic} onGoBack={() => setCurrentPhase(AppPhase.USER_PREFERENCES)} />
           : <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]"><LoadingSpinner size="lg" /><p className="mt-4 text-slate-600">Carregando Dashboard...</p></div>;
      case AppPhase.VIEW_PLAN:
        return analysisResult ? (
          <PlanViewStep 
            planData={analysisResult} targetRoleName={userProfile?.targetRole}
            onSelectTopic={handleSelectTopic} 
            onGoBack={() => setCurrentPhase(AppPhase.DASHBOARD)} />
        ) : <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]"><LoadingSpinner size="lg" /><p className="mt-4 text-slate-600">Carregando Plano...</p></div>;
      case AppPhase.STUDY_TOPIC: {
        const subject = analysisResult?.subjects.find(s => s.id === currentStudyingSubjectId);
        const topic = subject?.topics.find(t => t.id === currentStudyingTopicId);
        if (!subject || !topic || !analysisResult) {
          setCurrentPhase(AppPhase.DASHBOARD); 
          return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-slate-600">Tópico não encontrado, redirecionando...</p>
            </div>
          );
        }

        let prevTopicInfo: { subjectId: string; topicId: string } | null = null;
        let nextTopicInfo: { subjectId: string; topicId: string } | null = null;

        const currentSubjectIndex = analysisResult.subjects.findIndex(s => s.id === currentStudyingSubjectId);
        const currentTopicIndex = subject.topics.findIndex(t => t.id === currentStudyingTopicId);
        
        // Find Previous Topic
        if (currentTopicIndex > 0) {
            const prevTopic = subject.topics[currentTopicIndex - 1];
            prevTopicInfo = { subjectId: subject.id, topicId: prevTopic.id };
        } else if (currentSubjectIndex > 0) {
            const prevSubject = analysisResult.subjects[currentSubjectIndex - 1];
            if (prevSubject.topics.length > 0) {
                const prevTopic = prevSubject.topics[prevSubject.topics.length - 1];
                prevTopicInfo = { subjectId: prevSubject.id, topicId: prevTopic.id };
            }
        }

        // Find Next Topic
        if (currentTopicIndex < subject.topics.length - 1) {
            const nextTopic = subject.topics[currentTopicIndex + 1];
            nextTopicInfo = { subjectId: subject.id, topicId: nextTopic.id };
        } else if (currentSubjectIndex < analysisResult.subjects.length - 1) {
            const nextSubject = analysisResult.subjects[currentSubjectIndex + 1];
            if (nextSubject.topics.length > 0) {
                const nextTopic = nextSubject.topics[0];
                nextTopicInfo = { subjectId: nextSubject.id, topicId: nextTopic.id };
            }
        }

        return <TopicStudyStep
            subjectName={subject.name} topic={topic} 
            onBackToPlan={handleBackToPlan}
            onGenerateContent={handleGenerateContent} 
            onUpdateTopicStatus={handleUpdateTopicStatus}
            onUpdateQuestionInteraction={handleUpdateQuestionInteraction} 
            onFlashcardSelfAssessment={handleFlashcardSelfAssessment}
            onGetDeeperUnderstanding={handleGetDeeperUnderstanding}
            prevTopicInfo={prevTopicInfo}
            nextTopicInfo={nextTopicInfo}
            onSelectTopic={handleSelectTopic}
            />;
      }
      case AppPhase.AI_COACH:
        return <AICoachStep
                  suggestions={aiCoachSuggestions} generalAdvice={aiCoachGeneralAdvice} chatMessages={aiCoachChatMessages}
                  isLoadingSuggestions={isLoadingAICoachSuggestions} isLoadingChatResponse={isLoadingAICoachChatResponse}
                  suggestionsError={aiCoachSuggestionsError} chatError={aiCoachChatError}
                  onRefreshSuggestions={fetchAICoachSuggestions} onSendMessage={handleSendAICoachMessage}
                  onNavigateToTopic={handleNavigateToStudyTopicFromCoach} onBackToPlan={handleBackToPlan}
                />;
      // Removed LOGIN and REGISTER cases
      default: 
        setCurrentPhase(AppPhase.UPLOAD_PDF_ONLY); return <LoadingSpinner size="lg" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center cursor-pointer" onClick={() => {
                if (analysisResult && analysisResult.subjects.length > 0) handleNavigateToDashboard();
                else if (editalText) setCurrentPhase(AppPhase.ROLE_SELECTION);
                else setCurrentPhase(AppPhase.UPLOAD_PDF_ONLY);
            }}
            role="button" tabIndex={0} aria-label="Ir para o Início / Dashboard"
          >
            <AcademicCapIcon className="w-10 h-10 text-sky-600 mr-3"/>
            <h1 className="text-3xl font-bold text-sky-700 tracking-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
              ConcursoGenius
            </h1>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
             {/* Simplified Header Buttons - No Logout */}
              <Button
                  variant="ghost" size="md" onClick={handleNavigateToDashboard}
                  leftIcon={<HomeIcon className="w-5 h-5"/>}
                  className={`font-semibold ${currentPhase === AppPhase.DASHBOARD ? 'text-sky-600 bg-sky-100' : 'text-slate-600 hover:text-sky-700 hover:bg-sky-50'}`}
                  disabled={!(analysisResult && analysisResult.subjects.length > 0)}
                  aria-current={currentPhase === AppPhase.DASHBOARD ? "page" : undefined}
              >
                  <span className="hidden sm:inline">Dashboard</span>
              </Button>
               <Button
                  variant="ghost" size="md" onClick={handleNavigateToPlanView}
                  leftIcon={<ChartPieIcon className="w-5 h-5"/>}
                  className={`font-semibold ${currentPhase === AppPhase.VIEW_PLAN || currentPhase === AppPhase.STUDY_TOPIC ? 'text-sky-600 bg-sky-100' : 'text-slate-600 hover:text-sky-700 hover:bg-sky-50'}`}
                  disabled={!(analysisResult && analysisResult.subjects.length > 0)}
                  aria-current={currentPhase === AppPhase.VIEW_PLAN || currentPhase === AppPhase.STUDY_TOPIC ? "page" : undefined}
              >
                  <span className="hidden sm:inline">Meu Plano</span>
              </Button>
              <Button
                  variant="ghost" size="md" onClick={handleNavigateToAICoach}
                  leftIcon={<ChatBubbleLeftEllipsisIcon className="w-5 h-5"/>}
                  className={`font-semibold ${currentPhase === AppPhase.AI_COACH ? 'text-sky-600 bg-sky-100' : 'text-slate-600 hover:text-sky-700 hover:bg-sky-50'}`}
                  aria-current={currentPhase === AppPhase.AI_COACH ? "page" : undefined}
              >
                  <span className="hidden sm:inline">Coach IA</span>
              </Button>
          </div>
        </div>
      </header>
      
      <main className="flex-grow w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {renderAppContent()}
      </main>

      <footer className="bg-slate-800 text-slate-300 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} ConcursoGenius. Todos os direitos reservados.
          </p>
          <p className="text-xs mt-1">
            Potencializado com <SparklesIcon className="inline w-3 h-3 text-amber-400" /> Inteligência Artificial para otimizar seus estudos.
          </p>
          <div className="mt-4">
            <Button 
              variant="link" size="sm" onClick={handleResetApp}
              className="text-slate-400 hover:text-sky-400"
              isLoading={globalLoadingMessage?.includes("Limpando")}
            > 
              {globalLoadingMessage?.includes("Limpando") ? "Limpando..." : 'Limpar Dados e Reiniciar'}
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
