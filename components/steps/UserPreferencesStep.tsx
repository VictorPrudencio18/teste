
import React, { useState } from 'react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Textarea } from '../common/Textarea';
import { Card } from '../common/Card';
import { UserProfile } from '../../types';
import { WeekDays, LightBulbIcon, SparklesIcon, CalendarDaysIcon, ClockIcon, ArrowLeftIcon, AcademicCapIcon } from '../../constants';

interface UserPreferencesStepProps {
  targetRole: string; // Recebido da fase anterior
  onPreferencesSubmit: (preferences: Omit<UserProfile, 'targetRole'>) => void;
  isLoading: boolean;
  initialProfile?: Partial<Omit<UserProfile, 'targetRole'>>;
  onGoBack: () => void; // Para voltar para RoleSelectionStep
}

export const UserPreferencesStep: React.FC<UserPreferencesStepProps> = ({ 
    targetRole, 
    onPreferencesSubmit, 
    isLoading, 
    initialProfile,
    onGoBack 
}) => {
  const [dailyStudyHours, setDailyStudyHours] = useState<number | string>(initialProfile?.dailyStudyHours || '');
  const [selectedStudyDays, setSelectedStudyDays] = useState<string[]>(initialProfile?.studyDays || ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta']);
  const [studyNotes, setStudyNotes] = useState(initialProfile?.studyNotes || '');
  const [error, setError] = useState('');

  const handleDayToggle = (day: string) => {
    setSelectedStudyDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = () => {
    const hours = Number(dailyStudyHours);
    if (isNaN(hours) || hours <= 0 || hours > 16) {
      setError('Por favor, insira um número válido de horas de estudo (entre 1 e 16).');
      return;
    }
    if (selectedStudyDays.length === 0) {
      setError('Por favor, selecione pelo menos um dia de estudo.');
      return;
    }
    setError('');
    onPreferencesSubmit({
      dailyStudyHours: hours,
      studyDays: selectedStudyDays,
      studyNotes
    });
  };

  return (
    <Card className="max-w-2xl mx-auto" title="2. Suas Preferências de Estudo">
        <Button onClick={onGoBack} variant="ghost" size="sm" className="absolute top-6 right-6 text-slate-500 hover:text-sky-600" leftIcon={<ArrowLeftIcon className="w-4 h-4"/>}>
            Alterar Cargo
        </Button>

       <div className="mb-6 p-4 bg-sky-50 border border-sky-200 rounded-lg">
            <p className="text-sm text-sky-700 flex items-center">
                <AcademicCapIcon className="w-5 h-5 mr-2 text-sky-600 flex-shrink-0"/>
                Preparando para o cargo: <strong className="ml-1">{targetRole || "Não especificado"}</strong>
            </p>
       </div>
       
       <p className="text-slate-600 mb-8 text-sm">
        Agora, conte-nos um pouco sobre sua rotina e disponibilidade. 
        Essas informações ajudarão a IA <SparklesIcon className="inline w-4 h-4 text-amber-500" /> a criar um plano de estudos ainda mais personalizado e eficaz para você.
      </p>
      
      <Input
        id="dailyStudyHours"
        label="Horas de Estudo Diárias (aproximadamente)"
        type="number"
        value={dailyStudyHours}
        onChange={(e) => setDailyStudyHours(e.target.value)}
        min="1"
        max="16"
        placeholder="Ex: 4"
        disabled={isLoading}
        leftIcon={<ClockIcon />}
      />
      
      <div className="mb-5">
        <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center">
          <CalendarDaysIcon className="w-5 h-5 text-slate-400 mr-2" />
          Dias de Estudo na Semana
        </label>
        <div className="flex flex-wrap gap-2">
          {WeekDays.map(day => (
            <Button
              key={day}
              variant={selectedStudyDays.includes(day) ? 'primary' : 'outline'}
              onClick={() => handleDayToggle(day)}
              size="md"
              className="flex-grow sm:flex-grow-0"
              disabled={isLoading}
            >
              {day}
            </Button>
          ))}
        </div>
      </div>

      <Textarea
        id="studyNotes"
        label="Notas Adicionais sobre sua Rotina (opcional)"
        value={studyNotes}
        onChange={(e) => setStudyNotes(e.target.value)}
        placeholder="Ex: Prefiro estudar de manhã, tenho 2h livres no almoço, trabalho em turnos, etc."
        rows={4}
        disabled={isLoading}
      />
      {error && <p className="text-red-600 text-sm mb-4 p-3 bg-red-50 rounded-md border border-red-200">{error}</p>}
      <Button 
        onClick={handleSubmit} 
        isLoading={isLoading} 
        disabled={isLoading || !targetRole} // Disable if targetRole is somehow missing 
        fullWidth 
        className="mt-6"
        size="lg" 
        leftIcon={<LightBulbIcon className="w-5 h-5" />}
      >
        {isLoading ? 'Gerando Plano...' : 'Gerar Plano de Estudos Otimizado'}
      </Button>
    </Card>
  );
};
