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
import { QuestionSystemStep } from './components/steps/QuestionSystemStep';
import { DataManagementStep } from './components/steps/DataManagementStep';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { Button } from './components/common/Button';
import { analyzeEditalWithAI, generateTopicContentWithAI, extractRolesFromEditalAI, getAIStudySuggestions, askAICoachQuestion, getDeeperUnderstandingAI } from './services/geminiService';
import { AcademicCapIcon, SparklesIcon, ChatBubbleLeftEllipsisIcon, HomeIcon, ChartPieIcon, QuestionMarkCircleIcon, CircleStackIcon } from './constants'; // Removed ArrowRightOnRectangleIcon
import { v4 as uuidv4 } from 'uuid';
import { useAppStorage } from './hooks/useAppStorage';
import { localStorageService, AppState } from './services/localStorageService';

const LOCALSTORAGE_KEY = 'concursoGeniusAppState_v1';

const App: React.FC = () => {
  // --- INITIALIZE NEW STORAGE SYSTEM ---
  const { 
    state: savedState, 
    loading: storageLoading, 
    saveState, 
    loadState,
    updateState
  } = useAppStorage();

  // State Hooks - Initialize from new storage system
  const [currentPhase, setCurrentPhase] = useState<AppPhase>(
    savedState?.currentPhase || AppPhase.UPLOAD_PDF_ONLY
  );
  const [editalText, setEditalText] = useState<string>(savedState?.editalText || '');
  const [editalFileName, setEditalFileName] = useState<string | null>(savedState?.editalFileName || null);
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(
    savedState?.userProfile || {
      targetRole: '', 
      dailyStudyHours: 3, 
      studyDays: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'], 
      studyNotes: '' 
    }
  );
  const [extractedRoles, setExtractedRoles] = useState<string[]>(savedState?.extractedRoles || []);
  const [aiRoleClarificationQuestions, setAiRoleClarificationQuestions] = useState<string[] | undefined>(
    savedState?.aiRoleClarificationQuestions || undefined
  );
  const [aiRoleExtractionError, setAiRoleExtractionError] = useState<string | null>(
    savedState?.aiRoleExtractionError || null
  );
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);

  const [analysisResult, setAnalysisResult] = useState<EditalAnalysisData | null>(
    savedState?.analysisResult || null
  );

  const [currentStudyingSubjectId, setCurrentStudyingSubjectId] = useState<string | null>(
    savedState?.currentStudyingSubjectId || null
  );
  const [currentStudyingTopicId, setCurrentStudyingTopicId] = useState<string | null>(
    savedState?.currentStudyingTopicId || null
  );
  const [globalLoadingMessage, setGlobalLoadingMessage] = useState<string | null>(null);

  const [aiCoachChatMessages, setAiCoachChatMessages] = useState<ChatMessage[]>(
    savedState?.aiCoachChatMessages || []
  );
  const [aiCoachSuggestions, setAiCoachSuggestions] = useState<AISuggestion[] | null>(null);
  const [aiCoachGeneralAdvice, setAiCoachGeneralAdvice] = useState<string | null>(null);
  const [isLoadingAICoachSuggestions, setIsLoadingAICoachSuggestions] = useState(false);
  const [isLoadingAICoachChatResponse, setIsLoadingAICoachChatResponse] = useState(false);
  const [aiCoachSuggestionsError, setAiCoachSuggestionsError] = useState<string | null>(null);
  const [aiCoachChatError, setAiCoachChatError] = useState<string | null>(null);

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(savedState?.dashboardData || null);
  const [isProcessingSubmit, setIsProcessingSubmit] = useState(false); 
  
  // --- AUTO-SAVE CURRENT STATE ---
  const getCurrentAppState = useCallback((): AppState => {
    return {
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
    };
  }, [
    currentPhase, editalText, editalFileName, userProfile, extractedRoles, 
    aiRoleClarificationQuestions, aiRoleExtractionError, analysisResult,
    currentStudyingSubjectId, currentStudyingTopicId, aiCoachChatMessages, dashboardData
  ]);

  // Auto-save when state changes
  useEffect(() => {
    if (!storageLoading) {
      const currentState = getCurrentAppState();
      saveState(currentState);
    }
  }, [getCurrentAppState, saveState, storageLoading]);

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
    // Use novo sistema de storage
    localStorageService.clearAllData();
    resetLocalAppState();
    // Simulating a small delay for the message to be visible
    setTimeout(() => {
      setGlobalLoadingMessage(null);
    }, 500);
  };

  // Handler para restaurar estado do gerenciador de dados
  const handleStateRestored = (restoredState: AppState) => {
    if (restoredState.currentPhase) setCurrentPhase(restoredState.currentPhase);
    if (restoredState.editalText) setEditalText(restoredState.editalText);
    if (restoredState.editalFileName !== undefined) setEditalFileName(restoredState.editalFileName);
    if (restoredState.userProfile) setUserProfile(restoredState.userProfile);
    if (restoredState.extractedRoles) setExtractedRoles(restoredState.extractedRoles);
    if (restoredState.aiRoleClarificationQuestions) setAiRoleClarificationQuestions(restoredState.aiRoleClarificationQuestions);
    if (restoredState.aiRoleExtractionError !== undefined) setAiRoleExtractionError(restoredState.aiRoleExtractionError);
    if (restoredState.analysisResult) setAnalysisResult(restoredState.analysisResult);
    if (restoredState.currentStudyingSubjectId !== undefined) setCurrentStudyingSubjectId(restoredState.currentStudyingSubjectId);
    if (restoredState.currentStudyingTopicId !== undefined) setCurrentStudyingTopicId(restoredState.currentStudyingTopicId);
    if (restoredState.aiCoachChatMessages) setAiCoachChatMessages(restoredState.aiCoachChatMessages);
    if (restoredState.dashboardData) setDashboardData(restoredState.dashboardData);
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
  const handleNavigateToQuestionSystem = () => setCurrentPhase(AppPhase.QUESTION_SYSTEM);
  const handleNavigateToDataManagement = () => setCurrentPhase(AppPhase.DATA_MANAGEMENT);

  // useEffect Hooks
  useEffect(() => {
    // This effect ensures that when the app loads, if there's a plan, it calculates dashboard data.
    if ((currentPhase === AppPhase.DASHBOARD || currentPhase === AppPhase.VIEW_PLAN || currentPhase === AppPhase.STUDY_TOPIC || currentPhase === AppPhase.QUESTION_SYSTEM || currentPhase === AppPhase.DATA_MANAGEMENT) && analysisResult) {
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
      case AppPhase.QUESTION_SYSTEM:
        return <QuestionSystemStep 
                  onBack={handleBackToPlan}
                  onNext={() => setCurrentPhase(AppPhase.DASHBOARD)}
                />;
      case AppPhase.DATA_MANAGEMENT:
        return <DataManagementStep 
                  onBack={handleNavigateToDashboard}
                  onStateRestored={handleStateRestored}
                  currentState={getCurrentAppState()}
                />;
      // Removed LOGIN and REGISTER cases
      default: 
        setCurrentPhase(AppPhase.UPLOAD_PDF_ONLY); return <LoadingSpinner size="lg" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Global Loading Overlay */}
      {globalLoadingMessage && (currentPhase === AppPhase.GENERATING_PLAN || globalLoadingMessage.includes("Limpando")) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-lg flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-10 shadow-2xl flex flex-col items-center space-y-6 max-w-md mx-4 border border-white/20">
            <div className="relative">
              <LoadingSpinner size="lg" />
              <div className="absolute inset-0 animate-ping rounded-full bg-sky-400/20"></div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {globalLoadingMessage || 'Processando...'}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Nossa IA está trabalhando para criar a melhor experiência de estudos para você.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Modern Header */}
      <header className="relative bg-white/70 backdrop-blur-xl border-b border-white/20 sticky top-0 z-40 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-600/5 via-indigo-600/5 to-purple-600/5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 cursor-pointer" onClick={() => {
                if (analysisResult && analysisResult.subjects.length > 0) handleNavigateToDashboard();
                else if (editalText) setCurrentPhase(AppPhase.ROLE_SELECTION);
                else setCurrentPhase(AppPhase.UPLOAD_PDF_ONLY);
              }}
              role="button" tabIndex={0} aria-label="Ir para o Início / Dashboard"
            >
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-200">
                  <AcademicCapIcon className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-sky-800 to-indigo-900 bg-clip-text text-transparent">
                  ConcursoGenius
                </h1>
                <p className="text-sm text-slate-600 font-medium flex items-center gap-1">
                  <SparklesIcon className="w-3 h-3 text-amber-500" />
                  Plano de Estudos Inteligente
                </p>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center space-x-2">
              <Button
                  variant="ghost" size="md" onClick={handleNavigateToDashboard}
                  leftIcon={<HomeIcon className="w-5 h-5"/>}
                  className={`font-semibold rounded-xl px-4 py-2 transition-all duration-200 ${
                    currentPhase === AppPhase.DASHBOARD 
                      ? 'text-emerald-700 bg-gradient-to-r from-emerald-100 to-teal-100 shadow-sm border border-emerald-200' 
                      : 'text-slate-600 hover:text-emerald-700 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50'
                  }`}
                  disabled={!(analysisResult && analysisResult.subjects.length > 0)}
                  aria-current={currentPhase === AppPhase.DASHBOARD ? "page" : undefined}
              >
                  <span className="hidden sm:inline">Dashboard</span>
              </Button>
              <Button
                  variant="ghost" size="md" onClick={handleNavigateToPlanView}
                  leftIcon={<ChartPieIcon className="w-5 h-5"/>}
                  className={`font-semibold rounded-xl px-4 py-2 transition-all duration-200 ${
                    currentPhase === AppPhase.VIEW_PLAN || currentPhase === AppPhase.STUDY_TOPIC 
                      ? 'text-sky-700 bg-gradient-to-r from-sky-100 to-blue-100 shadow-sm border border-sky-200' 
                      : 'text-slate-600 hover:text-sky-700 hover:bg-gradient-to-r hover:from-sky-50 hover:to-blue-50'
                  }`}
                  disabled={!(analysisResult && analysisResult.subjects.length > 0)}
                  aria-current={currentPhase === AppPhase.VIEW_PLAN || currentPhase === AppPhase.STUDY_TOPIC ? "page" : undefined}
              >
                  <span className="hidden sm:inline">Meu Plano</span>
              </Button>
              <Button
                  variant="ghost" size="md" onClick={handleNavigateToAICoach}
                  leftIcon={<ChatBubbleLeftEllipsisIcon className="w-5 h-5"/>}
                  className={`font-semibold rounded-xl px-4 py-2 transition-all duration-200 ${
                    currentPhase === AppPhase.AI_COACH 
                      ? 'text-purple-700 bg-gradient-to-r from-purple-100 to-indigo-100 shadow-sm border border-purple-200' 
                      : 'text-slate-600 hover:text-purple-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50'
                  }`}
                  aria-current={currentPhase === AppPhase.AI_COACH ? "page" : undefined}
              >
                  <span className="hidden sm:inline">Coach IA</span>
              </Button>
              <Button
                  variant="ghost" size="md" onClick={handleNavigateToQuestionSystem}
                  leftIcon={<QuestionMarkCircleIcon className="w-5 h-5"/>}
                  className={`font-semibold rounded-xl px-4 py-2 transition-all duration-200 ${
                    currentPhase === AppPhase.QUESTION_SYSTEM 
                      ? 'text-orange-700 bg-gradient-to-r from-orange-100 to-amber-100 shadow-sm border border-orange-200' 
                      : 'text-slate-600 hover:text-orange-700 hover:bg-gradient-to-r hover:from-orange-50 hover:to-amber-50'
                  }`}
                  aria-current={currentPhase === AppPhase.QUESTION_SYSTEM ? "page" : undefined}
              >
                  <span className="hidden sm:inline">Questões</span>
              </Button>
            </nav>
          </div>
        </div>
      </header>
      
      {/* Enhanced Main Content */}
      <main className="flex-grow w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="relative">
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/4 w-72 h-72 bg-gradient-to-br from-sky-300/10 to-blue-400/10 rounded-full blur-3xl"></div>
            <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-gradient-to-br from-indigo-300/10 to-purple-400/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-gradient-to-br from-emerald-300/10 to-teal-400/10 rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative z-10">
            {renderAppContent()}
          </div>
        </div>
      </main>

      {/* Modern Footer */}
      <footer className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 text-slate-300 py-12">
        <div className="absolute inset-0 opacity-20 bg-repeat" style={{
          backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.03\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"
        }}></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <AcademicCapIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">ConcursoGenius</h3>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                Revolucionando a forma como você estuda para concursos com inteligência artificial avançada.
              </p>
            </div>
            
            <div className="text-center">
              <h4 className="text-white font-semibold mb-4">Recursos</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="hover:text-sky-400 transition-colors cursor-pointer">• Análise de Editais</li>
                <li className="hover:text-sky-400 transition-colors cursor-pointer">• Planos Personalizados</li>
                <li className="hover:text-sky-400 transition-colors cursor-pointer">• Coach IA</li>
                <li className="hover:text-sky-400 transition-colors cursor-pointer">• Dashboard Inteligente</li>
              </ul>
            </div>
            
            <div className="text-center md:text-right">
              <h4 className="text-white font-semibold mb-4">Tecnologia</h4>
              <div className="flex flex-wrap justify-center md:justify-end gap-2">
                <span className="px-3 py-1 bg-sky-600/20 text-sky-300 rounded-full text-xs font-medium border border-sky-500/20">
                  IA Gemini
                </span>
                <span className="px-3 py-1 bg-indigo-600/20 text-indigo-300 rounded-full text-xs font-medium border border-indigo-500/20">
                  React + TypeScript
                </span>
                <span className="px-3 py-1 bg-purple-600/20 text-purple-300 rounded-full text-xs font-medium border border-purple-500/20">
                  Machine Learning
                </span>
              </div>
            </div>
          </div>
          
          <div className="border-t border-slate-700 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
              <p className="text-sm text-slate-400">
                &copy; {new Date().getFullYear()} ConcursoGenius. Todos os direitos reservados.
              </p>
              <div className="flex items-center space-x-6">
                <p className="text-xs text-slate-500 flex items-center gap-2">
                  Potencializado por <SparklesIcon className="w-4 h-4 text-amber-400 animate-pulse" /> 
                  <span className="font-medium text-amber-400">Inteligência Artificial</span>
                </p>
                <div className="h-4 w-px bg-slate-600"></div>
                <Button 
                  variant="link" size="sm" onClick={handleNavigateToDataManagement}
                  className="text-slate-400 hover:text-blue-400 transition-colors duration-200 font-medium"
                > 
                  💾 Gerenciar Dados
                </Button>
                <div className="h-4 w-px bg-slate-600"></div>
                <Button 
                  variant="link" size="sm" onClick={handleResetApp}
                  className="text-slate-400 hover:text-red-400 transition-colors duration-200 font-medium"
                  isLoading={globalLoadingMessage?.includes("Limpando")}
                > 
                  {globalLoadingMessage?.includes("Limpando") ? "Limpando..." : 'Resetar Sistema'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
