import React, { useState } from 'react';
import { QuestionSystemIntegration } from '../common/QuestionSystemIntegration';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { 
  ArrowRightIcon,
  QuestionMarkCircleIcon 
} from '../../constants';

interface QuestionSystemStepProps {
  onBack: () => void;
  onNext: () => void;
}

export const QuestionSystemStep: React.FC<QuestionSystemStepProps> = ({ onBack, onNext }) => {
  const [showQuestionSystem, setShowQuestionSystem] = useState(false);

  if (showQuestionSystem) {
    return (
      <QuestionSystemIntegration onClose={() => setShowQuestionSystem(false)} />
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-purple-100 mb-4">
          <QuestionMarkCircleIcon className="h-10 w-10 text-purple-600" />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900">
          Sistema Avançado de Questões
        </h2>
        <p className="mt-4 text-xl text-gray-600">
          Pratique com questões personalizadas geradas por IA
        </p>
      </div>

      <div className="space-y-6">
        {/* Introdução */}
        <Card className="p-8 bg-gradient-to-r from-purple-50 to-blue-50">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            🚀 Novo Sistema de Questões Inteligente
          </h3>
          <p className="text-gray-700 mb-4 leading-relaxed">
            Apresentamos um sistema revolucionário de questões que usa inteligência artificial para 
            criar uma experiência de aprendizado personalizada e adaptativa.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">✨ O que há de novo:</h4>
              <ul className="space-y-1 text-gray-700 text-sm">
                <li>• Geração automática de questões com IA</li>
                <li>• Sistema de memória que lembra seus acertos/erros</li>
                <li>• Questões adaptativas baseadas no seu progresso</li>
                <li>• Estatísticas detalhadas e insights de aprendizado</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">🎯 Benefícios:</h4>
              <ul className="space-y-1 text-gray-700 text-sm">
                <li>• Estudo mais eficiente e direcionado</li>
                <li>• Identificação automática de pontos fracos</li>
                <li>• Repetição espaçada para melhor retenção</li>
                <li>• Acompanhamento de progresso em tempo real</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Demonstração rápida */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 text-center hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-3">🤖</div>
            <h4 className="font-semibold text-gray-900 mb-2">Geração por IA</h4>
            <p className="text-sm text-gray-600">
              Digite qualquer tópico e receba questões personalizadas
            </p>
          </Card>
          
          <Card className="p-6 text-center hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-3">🧠</div>
            <h4 className="font-semibold text-gray-900 mb-2">Sistema de Memória</h4>
            <p className="text-sm text-gray-600">
              Lembra suas respostas para otimizar o aprendizado
            </p>
          </Card>
          
          <Card className="p-6 text-center hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-3">📊</div>
            <h4 className="font-semibold text-gray-900 mb-2">Análise Detalhada</h4>
            <p className="text-sm text-gray-600">
              Veja seu progresso e áreas para melhorar
            </p>
          </Card>
        </div>

        {/* Call to action */}
        <Card className="p-8 text-center bg-purple-50 border-purple-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Pronto para experimentar?
          </h3>
          <p className="text-gray-600 mb-6">
            O sistema está totalmente funcional e pronto para uso. 
            Você pode começar a gerar questões sobre qualquer tópico que desejar estudar.
          </p>
          
          <div className="space-y-4">
            <Button 
              onClick={() => setShowQuestionSystem(true)}
              className="text-lg px-8 py-3 bg-purple-600 hover:bg-purple-700"
              size="lg"
            >
              🎯 Experimentar Agora
            </Button>
            
            <div className="text-sm text-gray-500">
              Não se preocupe, você pode voltar a qualquer momento
            </div>
          </div>
        </Card>

        {/* Navegação */}
        <div className="flex justify-between pt-6">
          <Button 
            onClick={onBack} 
            variant="outline"
          >
            Voltar
          </Button>
          
          <Button 
            onClick={onNext}
            className="flex items-center"
          >
            Continuar
            <ArrowRightIcon className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};