

import React from 'react';
import { DashboardData, AnalyzedSubject, AnalyzedTopic, EditalAnalysisData } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { AutoSaveStatus } from '../common/AutoSaveStatus';
// FIX: Import ArrowRightIcon
import { ChartPieIcon, SparklesIcon, ListBulletIcon, BookOpenIcon, AcademicCapIcon, ArrowRightIcon, CheckCircleIcon } from '../../constants';

interface DashboardStepProps {
  dashboardData: DashboardData;
  userName?: string; // From userProfile.targetRole, first name
  onNavigateToPlan: () => void;
  onNavigateToTopic: (subjectId: string, topicId: string) => void;
  analysisResult: EditalAnalysisData | null; // To find topics to continue studying
  isAuthenticated?: boolean;
}

const ProgressBar: React.FC<{ percentage: number; colorClass?: string }> = ({ percentage, colorClass = "bg-sky-500" }) => (
  <div className="w-full bg-slate-200 rounded-full h-3.5 dark:bg-slate-700 shadow-inner">
    <div 
      className={`${colorClass} h-3.5 rounded-full transition-all duration-500 ease-out`} 
      style={{ width: `${percentage}%` }}
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
    ></div>
  </div>
);

export const DashboardStep: React.FC<DashboardStepProps> = ({ 
  dashboardData, 
  userName, 
  onNavigateToPlan, 
  onNavigateToTopic, 
  analysisResult,
  isAuthenticated = false 
}) => {
  const { 
    totalTopics, completedTopics, pendingTopics, studyingTopics, 
    completionPercentage, subjectProgress 
  } = dashboardData;

  const findNextTopicToStudy = (): AnalyzedTopic | null => {
    if (!analysisResult) return null;
    // Priority 1: Topics currently 'Estudando'
    for (const subject of analysisResult.subjects) {
      const studyingTopic = subject.topics.find(t => t.status === 'Estudando');
      if (studyingTopic) return studyingTopic;
    }
    // Priority 2: First 'Pendente' topic
    for (const subject of analysisResult.subjects) {
      const pendingTopic = subject.topics.find(t => t.status === 'Pendente');
      if (pendingTopic) return pendingTopic;
    }
    return null;
  };
  const nextTopic = findNextTopicToStudy();
  const nextTopicSubject = nextTopic ? analysisResult?.subjects.find(s => s.topics.some(t => t.id === nextTopic.id)) : null;


  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-10 text-center">
        <h2 className="text-4xl font-extrabold text-slate-800 font-display">
          Olá{userName ? `, ${userName}` : ''}! Bem-vindo(a) de volta.
        </h2>
        <p className="text-xl text-slate-600 mt-2">Seu progresso e próximos passos estão aqui.</p>
      </div>

      {/* Overall Progress Card */}
      <Card className="mb-8 bg-gradient-to-r from-sky-600 to-cyan-500 text-white shadow-xl">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div>
            <h3 className="text-3xl font-bold mb-1 font-display">Visão Geral do Progresso</h3>
            <p className="text-sky-100 text-lg">Você completou <strong className="text-amber-300">{completedTopics}</strong> de <strong className="text-amber-300">{totalTopics}</strong> tópicos.</p>
          </div>
          <div className="text-5xl font-extrabold mt-4 md:mt-0">
            {completionPercentage}%
            <SparklesIcon className="inline-block w-10 h-10 ml-2 text-amber-300" />
          </div>
        </div>
        <div className="mt-6">
          <ProgressBar percentage={completionPercentage} colorClass="bg-amber-400 h-5 shadow-md" />
        </div>
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4 text-center text-sm">
            <div className="bg-sky-700 bg-opacity-50 p-3 rounded-lg">
                <div className="font-bold text-2xl">{pendingTopics}</div>
                <div className="text-sky-200">Pendentes</div>
            </div>
            <div className="bg-sky-700 bg-opacity-50 p-3 rounded-lg">
                <div className="font-bold text-2xl">{studyingTopics}</div>
                <div className="text-sky-200">Estudando</div>
            </div>
            <div className="bg-sky-700 bg-opacity-50 p-3 rounded-lg col-span-2 sm:col-span-1">
                <div className="font-bold text-2xl">{completedTopics}</div>
                <div className="text-sky-200">Concluídos</div>
            </div>
        </div>
      </Card>

      {/* Subject Progress */}
      <Card className="mb-8" title="Progresso por Matéria" actions={
        <Button variant="primary" size="md" onClick={onNavigateToPlan} leftIcon={<ListBulletIcon />}>
            Ver Plano Detalhado
        </Button>
      }>
        {subjectProgress.length > 0 ? (
          <div className="space-y-5">
            {subjectProgress.map(subject => (
              <div key={subject.id}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-lg font-semibold text-slate-700">{subject.name}</span>
                  <span className="text-sm font-medium text-sky-600">{subject.completedTopics} / {subject.totalTopics} tópicos ({subject.percentage}%)</span>
                </div>
                <ProgressBar percentage={subject.percentage} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-center py-4">Nenhuma matéria encontrada no seu plano ainda.</p>
        )}
      </Card>

      {/* Next Steps / Call to Action */}
      {nextTopic && nextTopicSubject && (
        <Card className="bg-green-50 border-green-300 shadow-lg">
            <div className="flex flex-col md:flex-row items-center">
                <CheckCircleIcon className="w-12 h-12 text-green-500 mb-4 md:mb-0 md:mr-6 flex-shrink-0" />
                <div>
                    <h3 className="text-2xl font-bold text-green-800 mb-2 font-display">Seu Próximo Passo!</h3>
                    <p className="text-green-700 mb-1">
                        Que tal continuar com: <strong className="text-green-900">{nextTopic.name}</strong>
                    </p>
                    <p className="text-xs text-green-600 mb-4">
                        Matéria: {nextTopicSubject.name}
                    </p>
                    <Button 
                        variant="primary" 
                        className="bg-green-600 hover:bg-green-700 focus:ring-green-500"
                        onClick={() => onNavigateToTopic(nextTopicSubject.id, nextTopic.id)}
                        leftIcon={<AcademicCapIcon />}
                        rightIcon={<ArrowRightIcon />}
                    >
                        Estudar Agora
                    </Button>
                </div>
            </div>
        </Card>
      )}

      {!nextTopic && totalTopics > 0 && completedTopics === totalTopics && (
         <Card className="bg-emerald-500 text-white text-center py-10 shadow-2xl">
            <SparklesIcon className="w-20 h-20 mx-auto mb-4 text-amber-300"/>
            <h3 className="text-4xl font-extrabold font-display mb-3">Parabéns!</h3>
            <p className="text-xl text-emerald-100 mb-6">Você concluiu todos os tópicos do seu plano de estudos!</p>
            <Button 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-emerald-600"
                size="lg"
                onClick={onNavigateToPlan}
                leftIcon={<BookOpenIcon/>}
            >
                Revisar Plano Completo
            </Button>
        </Card>
      )}
       {!nextTopic && totalTopics === 0 && (
         <Card className="text-center py-10">
            <BookOpenIcon className="w-16 h-16 mx-auto text-slate-400 mb-4" />
            <h3 className="text-2xl font-semibold text-slate-700 mb-2">Seu plano de estudos está vazio.</h3>
            <p className="text-slate-500 mb-6">
                Parece que você ainda não gerou um plano. Envie um edital para começar!
            </p>
             <Button 
                variant="primary" 
                size="lg"
                onClick={onNavigateToPlan} // Should navigate to UPLOAD_PDF_ONLY or similar
                leftIcon={<SparklesIcon/>}
            >
                Criar Novo Plano
            </Button>
        </Card>
      )}

      {/* Auto Save Status */}
      <AutoSaveStatus 
        isAuthenticated={isAuthenticated} 
        className="mt-8"
      />

    </div>
  );
};
