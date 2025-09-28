
import React, { useState, useEffect, useRef } from 'react';
import { AISuggestion, ChatMessage } from '../../types';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Textarea } from '../common/Textarea'; 
import { ArrowLeftIcon, SparklesIcon, LightBulbIcon, AcademicCapIcon, PaperAirplaneIcon, ArrowPathIcon, ChatBubbleLeftEllipsisIcon, InformationCircleIcon } from '../../constants';

interface AICoachStepProps {
  suggestions: AISuggestion[] | null;
  generalAdvice: string | null;
  chatMessages: ChatMessage[];
  isLoadingSuggestions: boolean;
  isLoadingChatResponse: boolean;
  suggestionsError: string | null;
  chatError: string | null;
  onRefreshSuggestions: () => void;
  onSendMessage: (message: string) => void;
  onNavigateToTopic: (subjectId: string, topicId: string) => void;
  onBackToPlan: () => void;
}

export const AICoachStep: React.FC<AICoachStepProps> = ({
  suggestions,
  generalAdvice,
  chatMessages,
  isLoadingSuggestions,
  isLoadingChatResponse,
  suggestionsError,
  chatError,
  onRefreshSuggestions,
  onSendMessage,
  onNavigateToTopic,
  onBackToPlan,
}) => {
  const [userMessage, setUserMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = () => {
    if (userMessage.trim()) {
      onSendMessage(userMessage.trim());
      setUserMessage('');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };
  
  const renderSuggestions = () => {
    if (isLoadingSuggestions) {
      return (
        <div className="text-center py-8">
          <LoadingSpinner />
          <p className="mt-2 text-slate-500">Buscando sugestões personalizadas...</p>
        </div>
      );
    }
    if (suggestionsError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <p><strong>Erro ao buscar sugestões:</strong> {suggestionsError}</p>
        </div>
      );
    }
    if (!suggestions || suggestions.length === 0) {
      return (
        <div className="text-center py-6 px-4">
            <InformationCircleIcon className="w-10 h-10 text-sky-400 mx-auto mb-2" />
            <p className="text-slate-600 font-medium">Nenhuma sugestão específica no momento.</p>
            <p className="text-sm text-slate-500">Continue progredindo no seu plano ou me faça uma pergunta no chat!</p>
        </div>
      );
    }
    return (
      <ul className="space-y-4">
        {suggestions.map((sugg) => (
          <li key={`${sugg.subjectId}-${sugg.topicId}`} className="p-4 border border-slate-200 rounded-lg hover:bg-sky-50 transition-colors group">
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="font-semibold text-sky-700 group-hover:text-sky-800 text-lg">{sugg.topicName}</h4>
                    <p className="text-xs text-slate-500 mb-1">{sugg.subjectName}</p>
                    <p className="text-sm text-slate-600">{sugg.reason}</p>
                </div>
                <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={() => onNavigateToTopic(sugg.subjectId, sugg.topicId)}
                    leftIcon={<AcademicCapIcon className="w-4 h-4"/>}
                    className="ml-4 flex-shrink-0"
                >
                    Estudar
                </Button>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="max-w-5xl mx-auto">
      <Button onClick={onBackToPlan} variant="ghost" size="md" className="mb-6 text-sky-700 hover:bg-sky-50" leftIcon={<ArrowLeftIcon className="w-5 h-5" />}>
        Voltar ao Painel / Plano
      </Button>

      <Card className="shadow-xl">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 pb-6 border-b border-slate-200">
            <div>
                <h2 className="text-4xl font-bold text-slate-800 font-display flex items-center">
                    <ChatBubbleLeftEllipsisIcon className="w-10 h-10 text-sky-600 mr-3"/> Coach IA
                </h2>
                <p className="text-slate-600 mt-1 text-lg">Seu assistente pessoal para otimizar seus estudos!</p>
            </div>
             <SparklesIcon className="w-12 h-12 text-amber-400 mt-4 md:mt-0" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Coluna de Sugestões e Conselhos */}
          <div className="space-y-6">
            <Card title="Sugestões de Estudo da IA" className="bg-slate-50 shadow-md" actions={
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={onRefreshSuggestions} 
                    isLoading={isLoadingSuggestions}
                    leftIcon={<ArrowPathIcon className="w-4 h-4"/>}
                >
                    Atualizar
                </Button>
            }>
              {renderSuggestions()}
            </Card>

            {isLoadingSuggestions && !generalAdvice && (
                 <div className="text-center py-4">
                    <LoadingSpinner size="sm"/>
                    <p className="mt-1 text-xs text-slate-400">Carregando conselho...</p>
                 </div>
            )}
            {!isLoadingSuggestions && generalAdvice && (
              <Card title="Conselho do Coach" className="bg-sky-50 border-sky-200 shadow-md">
                <div className="flex items-start">
                    <LightBulbIcon className="w-8 h-8 text-sky-500 mr-3 mt-1 flex-shrink-0"/>
                    <p className="text-sky-700">{generalAdvice}</p>
                </div>
              </Card>
            )}
             {!isLoadingSuggestions && !generalAdvice && !suggestionsError && (
                <Card className="bg-slate-50 border-slate-200 shadow-md">
                    <div className="flex items-center text-slate-500">
                        <LightBulbIcon className="w-6 h-6 text-slate-400 mr-2 mt-px flex-shrink-0"/>
                        <p>Nenhum conselho geral no momento. Mantenha o foco!</p>
                    </div>
                </Card>
            )}
          </div>

          {/* Coluna de Chat */}
          <Card title="Converse com o Coach" className="shadow-md flex flex-col h-[600px]">
            <div className="flex-grow overflow-y-auto mb-4 pr-2 space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200 custom-scrollbar">
              {chatMessages.length === 0 && !isLoadingChatResponse && (
                <div className="text-center text-slate-400 pt-10">
                  <ChatBubbleLeftEllipsisIcon className="w-16 h-16 mx-auto mb-3 opacity-50"/>
                  <p>Faça uma pergunta sobre seu edital, tópicos de estudo ou peça dicas!</p>
                </div>
              )}
              {chatMessages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-xl shadow ${
                    msg.sender === 'user' 
                      ? 'bg-sky-500 text-white rounded-br-none' 
                      : `bg-white text-slate-700 border border-slate-200 rounded-bl-none ${msg.error ? 'border-red-300 bg-red-50 text-red-700' : ''}`
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                    <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-sky-200 text-right' : (msg.error ? 'text-red-400' : 'text-slate-400') }`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {msg.sender === 'ai' && msg.error && " (Erro da IA)"}
                    </p>
                  </div>
                </div>
              ))}
              {isLoadingChatResponse && (
                <div className="flex justify-start">
                    <div className="max-w-[80%] p-3 rounded-xl shadow bg-white text-slate-700 border border-slate-200 rounded-bl-none">
                        <LoadingSpinner size="sm" color="text-sky-600"/>
                    </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            {chatError && !isLoadingChatResponse && (
                 <p className="text-xs text-red-600 mb-2 p-2 bg-red-50 rounded-md border border-red-200">{chatError}</p>
            )}
            <div className="flex items-center space-x-2 pt-2 border-t border-slate-200">
              <Textarea
                id="userMessage"
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Pergunte algo sobre o edital, tópicos, ou peça dicas..."
                rows={2}
                className="flex-grow !mb-0"
                disabled={isLoadingChatResponse}
                containerClassName="!mb-0 flex-grow"
              />
              <Button 
                onClick={handleSendMessage} 
                isLoading={isLoadingChatResponse} 
                disabled={isLoadingChatResponse || !userMessage.trim()}
                className="h-full px-5"
                aria-label="Enviar mensagem"
              >
                <PaperAirplaneIcon className="w-5 h-5"/>
              </Button>
            </div>
          </Card>
        </div>
      </Card>
    </div>
  );
};

// Basic custom scrollbar styling if needed for chat
const style = document.createElement('style');
style.textContent = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f5f9; /* bg-slate-100 */
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #94a3b8; /* bg-slate-400 */
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #64748b; /* bg-slate-500 */
  }
`;
document.head.append(style);
