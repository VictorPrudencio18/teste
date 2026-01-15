
import React from 'react';
import { DashboardData, AnalyzedTopic, EditalAnalysisData } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { SparklesIcon, ListBulletIcon, BookOpenIcon, AcademicCapIcon, ArrowRightIcon, CheckCircleIcon, ClockIcon } from '../../constants';

interface DashboardStepProps {
  dashboardData: DashboardData;
  userName?: string; 
  onNavigateToPlan: () => void;
  onNavigateToTopic: (subjectId: string, topicId: string) => void;
  analysisResult: EditalAnalysisData | null; 
}

const ProgressBar: React.FC<{ percentage: number; colorClass?: string; heightClass?: string }> = ({ percentage, colorClass = "bg-sky-500", heightClass = "h-2.5" }) => (
  <div className={`w-full bg-slate-100 rounded-full ${heightClass} overflow-hidden`}>
    <div 
      className={`${colorClass} ${heightClass} rounded-full transition-all duration-1000 ease-out`} 
      style={{ width: `${percentage}%` }}
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
    ></div>
  </div>
);

const StatCard: React.FC<{ label: string; value: number; icon: React.ReactNode; colorBg: string; colorText: string }> = ({ label, value, icon, colorBg, colorText }) => (
    <div className={`p-5 rounded-2xl ${colorBg} flex flex-col items-center justify-center text-center shadow-sm border border-transparent hover:border-black/5 transition-all`}>
        <div className={`p-3 rounded-full bg-white/60 mb-3 ${colorText}`}>
            {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-6 h-6" })}
        </div>
        <div className={`text-3xl font-extrabold ${colorText} mb-1 font-display`}>{value}</div>
        <div className={`text-sm font-medium ${colorText} opacity-80 uppercase tracking-wide`}>{label}</div>
    </div>
);

export const DashboardStep: React.FC<DashboardStepProps> = ({ dashboardData, userName, onNavigateToPlan, onNavigateToTopic, analysisResult }) => {
  const { 
    totalTopics, completedTopics, pendingTopics, studyingTopics, 
    completionPercentage, subjectProgress 
  } = dashboardData;

  const findNextTopicToStudy = (): AnalyzedTopic | null => {
    if (!analysisResult) return null;
    for (const subject of analysisResult.subjects) {
      const studyingTopic = subject.topics.find(t => t.status === 'Estudando');
      if (studyingTopic) return studyingTopic;
    }
    for (const subject of analysisResult.subjects) {
      const pendingTopic = subject.topics.find(t => t.status === 'Pendente');
      if (pendingTopic) return pendingTopic;
    }
    return null;
  };
  const nextTopic = findNextTopicToStudy();
  const nextTopicSubject = nextTopic ? analysisResult?.subjects.find(s => s.topics.some(t => t.id === nextTopic.id)) : null;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center mb-6 sm:mb-10">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 font-display">
          Olá{userName ? `, ${userName}` : ''}! 
        </h2>
        <p className="text-lg sm:text-xl text-slate-500 mt-2">Vamos continuar sua jornada rumo à aprovação?</p>
      </div>

      {/* Stats Grid - Fully Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Main Progress - Spans 2 cols on tablet, 1 on desktop if needed, or create a featured card */}
        <div className="col-span-1 sm:col-span-2 lg:col-span-1 p-6 rounded-2xl bg-gradient-to-br from-sky-600 to-cyan-600 text-white shadow-lg flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white opacity-10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
            <div>
                <h3 className="text-lg font-semibold opacity-90">Progresso Geral</h3>
                <div className="flex items-end mt-2">
                    <span className="text-5xl font-extrabold font-display">{completionPercentage}%</span>
                </div>
            </div>
            <div className="mt-4">
                <div className="flex justify-between text-xs mb-1 opacity-80">
                    <span>{completedTopics} de {totalTopics}</span>
                    <span>Concluídos</span>
                </div>
                <div className="w-full bg-black/20 rounded-full h-2">
                    <div className="bg-amber-300 h-2 rounded-full transition-all duration-1000" style={{ width: `${completionPercentage}%` }}></div>
                </div>
            </div>
        </div>

        <StatCard 
            label="Concluídos" 
            value={completedTopics} 
            icon={<CheckCircleIcon />} 
            colorBg="bg-green-50" 
            colorText="text-green-700"
        />
        <StatCard 
            label="Estudando" 
            value={studyingTopics} 
            icon={<SparklesIcon />} 
            colorBg="bg-sky-50" 
            colorText="text-sky-700"
        />
        <StatCard 
            label="Pendentes" 
            value={pendingTopics} 
            icon={<ClockIcon />} 
            colorBg="bg-amber-50" 
            colorText="text-amber-700"
        />
      </div>

      {/* Next Step Action */}
      {nextTopic && nextTopicSubject && (
        <Card className="border-l-4 border-l-green-500 shadow-md transform hover:-translate-y-1 transition-transform duration-300">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="bg-green-100 p-3 rounded-full flex-shrink-0">
                         <AcademicCapIcon className="w-8 h-8 text-green-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-green-600 uppercase tracking-wider mb-1">Próximo Passo Recomendado</h3>
                        <h4 className="text-xl sm:text-2xl font-bold text-slate-800 leading-tight">{nextTopic.name}</h4>
                        <p className="text-slate-500 text-sm mt-1">Matéria: {nextTopicSubject.name}</p>
                    </div>
                </div>
                <Button 
                    variant="primary" 
                    size="lg"
                    className="w-full md:w-auto shadow-green-200"
                    onClick={() => onNavigateToTopic(nextTopicSubject.id, nextTopic.id)}
                    rightIcon={<ArrowRightIcon />}
                >
                    Continuar Estudando
                </Button>
            </div>
        </Card>
      )}

      {/* Subject Breakdown */}
      <Card title="Desempenho por Matéria" actions={
        <Button variant="ghost" size="sm" onClick={onNavigateToPlan} rightIcon={<ArrowRightIcon className="w-4 h-4" />}>
            Ver Detalhes
        </Button>
      }>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {subjectProgress.length > 0 ? subjectProgress.map(subject => (
              <div key={subject.id} className="group">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-medium text-slate-700 truncate pr-4 group-hover:text-sky-700 transition-colors">{subject.name}</span>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">{subject.percentage}%</span>
                </div>
                <ProgressBar percentage={subject.percentage} heightClass="h-2" colorClass={subject.percentage === 100 ? "bg-green-500" : "bg-sky-500"} />
              </div>
            )) : (
              <p className="text-slate-400 text-sm col-span-full text-center italic">Nenhum dado disponível ainda.</p>
            )}
        </div>
      </Card>

      {!nextTopic && totalTopics > 0 && completedTopics === totalTopics && (
         <Card className="bg-gradient-to-r from-emerald-500 to-green-600 text-white text-center py-12">
            <SparklesIcon className="w-16 h-16 mx-auto mb-4 text-yellow-300 animate-bounce"/>
            <h3 className="text-3xl font-extrabold font-display mb-3">Missão Cumprida!</h3>
            <p className="text-lg text-emerald-50 mb-8 max-w-lg mx-auto">Você zerou seu edital! Isso é incrível. Agora é hora de revisar e fazer simulados.</p>
            <Button 
                variant="outline" 
                className="bg-white/10 text-white border-white/40 hover:bg-white hover:text-emerald-600"
                size="lg"
                onClick={onNavigateToPlan}
                leftIcon={<BookOpenIcon/>}
            >
                Revisar Tudo
            </Button>
        </Card>
      )}
       {!nextTopic && totalTopics === 0 && (
         <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-slate-300">
            <BookOpenIcon className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h3 className="text-lg font-semibold text-slate-600 mb-1">Seu plano está vazio</h3>
             <Button variant="link" onClick={onNavigateToPlan}>Criar Novo Plano</Button>
        </div>
      )}
    </div>
  );
};
