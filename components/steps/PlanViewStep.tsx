
import React, { useState } from 'react';
import { EditalAnalysisData, AnalyzedSubject, AnalyzedTopic } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { AcademicCapIcon, BookOpenIcon, ChevronDownIcon, SparklesIcon, CheckCircleIcon, ClockIcon, ListBulletIcon, InformationCircleIcon, XCircleIcon, ArrowLeftIcon } from '../../constants'; 

interface PlanViewStepProps {
  planData: EditalAnalysisData;
  targetRoleName?: string; // Display the target role
  onSelectTopic: (subjectId: string, topicId: string) => void;
  onGoBack: () => void; // This should now go to UserPreferencesStep
}

const statusStyles: Record<AnalyzedTopic['status'], { icon: React.ReactNode, textClass: string, bgClass: string, pillClass: string }> = {
  'Pendente': { icon: <ClockIcon className="w-3.5 h-3.5" />, textClass: "text-amber-700", bgClass: "bg-amber-100", pillClass: "border-amber-500" },
  'Estudando': { icon: <SparklesIcon className="w-3.5 h-3.5" />, textClass: "text-sky-700", bgClass: "bg-sky-100", pillClass: "border-sky-500" },
  'Concluído': { icon: <CheckCircleIcon className="w-3.5 h-3.5" />, textClass: "text-green-700", bgClass: "bg-green-100", pillClass: "border-green-500" },
};

const TopicItem: React.FC<{ subject: AnalyzedSubject, topic: AnalyzedTopic, onSelectTopic: (subjectId: string, topicId: string) => void }> = ({ subject, topic, onSelectTopic }) => {
  const style = statusStyles[topic.status];
  return (
    <li className="py-4 px-1 hover:bg-slate-50 rounded-md transition-colors duration-150 group">
      <div className="flex items-center justify-between space-x-3">
        <div className="flex-1 min-w-0">
          <p className="text-base font-medium text-slate-800 group-hover:text-sky-700 truncate">{topic.name}</p>
          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bgClass} ${style.textClass} border ${style.pillClass} mt-1`}>
            {React.cloneElement(style.icon as React.ReactElement<{ className?: string }>, { className: `w-3.5 h-3.5 mr-1.5 ${style.textClass}` })}
            {topic.status}
          </div>
        </div>
        <Button 
          size="md" 
          variant="primary" 
          onClick={() => onSelectTopic(subject.id, topic.id)} 
          leftIcon={<AcademicCapIcon className="w-4 h-4"/>}
          className="shadow-md hover:shadow-lg transform hover:scale-105"
        >
          Estudar Tópico
        </Button>
      </div>
    </li>
  );
};

const SubjectCard: React.FC<{ subject: AnalyzedSubject, index: number, onSelectTopic: (subjectId: string, topicId: string) => void }> = ({ subject, index, onSelectTopic }) => {
  const [isOpen, setIsOpen] = useState(index === 0); 

  return (
    <Card className="mb-6 overflow-hidden shadow-lg hover:shadow-xl transition-shadow" title="">
      <div 
        className="flex justify-between items-center cursor-pointer p-5 -m-6 sm:-m-8 mb-0 rounded-t-xl bg-gradient-to-r from-slate-700 via-slate-800 to-black hover:from-slate-800 hover:via-black hover:to-black transition-all duration-300"
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        aria-expanded={isOpen}
        aria-controls={`subject-topics-${subject.id}`}
      >
        <h4 className="text-xl font-semibold text-white font-display tracking-wide">{subject.name}</h4>
        <ChevronDownIcon className={`w-6 h-6 text-white transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      {isOpen && (
        <div id={`subject-topics-${subject.id}`} className="mt-6 pt-4 border-t border-slate-200">
          {subject.topics.length > 0 ? (
            <ul className="divide-y divide-slate-200">
              {subject.topics.map(topic => (
                <TopicItem key={topic.id} subject={subject} topic={topic} onSelectTopic={onSelectTopic} />
              ))}
            </ul>
          ) : (
            <div className="py-6 text-center text-slate-500">
              <ListBulletIcon className="w-12 h-12 mx-auto text-slate-400 mb-3" />
              <p className="text-lg font-medium">Nenhum tópico detalhado.</p>
              <p className="text-sm">Parece que não foram encontrados tópicos específicos para esta matéria no edital fornecido.</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export const PlanViewStep: React.FC<PlanViewStepProps> = ({ planData, targetRoleName, onSelectTopic, onGoBack }) => {
  if (!planData || (!planData.subjects && !planData.error)) {
    return <div className="flex flex-col items-center justify-center h-96 text-center"><LoadingSpinner size="lg" color="text-sky-600" /> <p className="mt-4 text-lg text-slate-600">Montando seu plano de estudos personalizado...</p></div>;
  }

  if (planData.error) {
    return (
      <Card className="max-w-2xl mx-auto text-center shadow-xl border-2 border-red-200 bg-red-50">
        <XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-red-700 mb-3 font-display">Ops! Algo deu Errado</h2>
        <p className="text-slate-700 mb-5 text-base">{planData.error}</p>
        {planData.clarificationQuestionsFromAI && planData.clarificationQuestionsFromAI.length > 0 && (
          <div className="mt-6 text-left bg-yellow-50 border border-yellow-300 p-4 rounded-lg shadow-sm">
            <h4 className="font-semibold text-yellow-800 text-lg mb-2 flex items-center">
              <InformationCircleIcon className="w-5 h-5 mr-2 text-yellow-700" />
              Sugestões da IA para Melhorar:
            </h4>
            <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
              {planData.clarificationQuestionsFromAI.map((q, i) => <li key={i}>{q}</li>)}
            </ul>
            <p className="text-xs text-yellow-600 mt-3">Considere revisar o edital fornecido com base nestas sugestões.</p>
          </div>
        )}
        <Button onClick={onGoBack} variant="danger" size="lg" fullWidth className="mt-8" leftIcon={<ArrowLeftIcon />}>
          Voltar e Corrigir Preferências
        </Button>
      </Card>
    );
  }
  
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-10 pb-6 border-b-2 border-sky-200">
        <div>
            <h2 className="text-4xl font-extrabold text-slate-800 font-display">Seu Plano de Estudos Inteligente</h2>
            {targetRoleName && <p className="text-xl font-medium text-slate-600 mt-1">Para o cargo: <span className="text-sky-700 font-semibold">{targetRoleName}</span></p>}
            <p className="mt-1 text-lg text-sky-600 flex items-center">
                Gerado por IA <SparklesIcon className="inline h-5 w-5 text-amber-500 ml-1.5" /> para sua aprovação!
            </p>
        </div>
        <Button onClick={onGoBack} variant="outline" size="md" leftIcon={<BookOpenIcon className="w-4 h-4"/>} className="mt-4 sm:mt-0">
          Revisar Preferências
        </Button>
      </div>

      {planData.clarificationQuestionsFromAI && planData.clarificationQuestionsFromAI.length > 0 && (
        <Card className="mb-8 bg-amber-50 border-2 border-amber-300 shadow-lg">
          <div className="flex items-start">
            <InformationCircleIcon className="w-8 h-8 text-amber-500 mr-4 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-semibold text-amber-800 mb-2 font-display">Observações Importantes da IA</h3>
              <p className="text-sm text-amber-700 mb-3">
                A IA identificou alguns pontos no edital que merecem sua atenção. Isso pode ajudar a refinar ainda mais seus estudos:
              </p>
              <ul className="list-disc list-inside text-sm text-amber-700 space-y-1.5">
                {planData.clarificationQuestionsFromAI.map((question, index) => (
                  <li key={index}>{question}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {planData.subjects && planData.subjects.length > 0 ? (
        planData.subjects.map((subject, index) => (
          <SubjectCard key={subject.id} subject={subject} index={index} onSelectTopic={onSelectTopic} />
        ))
      ) : (
        <Card className="text-center py-12">
          <ListBulletIcon className="w-16 h-16 mx-auto text-slate-400 mb-4" />
          <h3 className="text-2xl font-semibold text-slate-700 mb-2">Nenhuma Matéria Encontrada</h3>
          <p className="text-slate-500">
            Não foi possível extrair matérias ou tópicos do edital fornecido para o cargo selecionado. 
            Por favor, verifique o texto do edital ou tente novamente.
          </p>
        </Card>
      )}
      
      <Card className="mt-10 bg-gradient-to-br from-sky-600 to-cyan-500 text-white shadow-xl">
        <div className="flex flex-col md:flex-row items-center">
            <SparklesIcon className="w-16 h-16 text-amber-300 mb-4 md:mb-0 md:mr-6 flex-shrink-0"/>
            <div>
                <h3 className="text-2xl font-bold mb-2 font-display tracking-wide">Pronto para Mergulhar nos Estudos?</h3>
                <p className="text-sky-100 text-opacity-90">
                Seu plano está traçado! Explore cada matéria e clique em "Estudar Tópico" para acessar resumos, questões e flashcards gerados por IA. 
                Marque os tópicos como 'Concluído' à medida que avança. 
                Lembre-se, a consistência é a chave para o sucesso. Bons estudos!
                </p>
            </div>
        </div>
      </Card>
    </div>
  );
};
