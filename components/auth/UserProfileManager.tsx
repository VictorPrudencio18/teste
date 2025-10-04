import React, { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Textarea } from '../common/Textarea';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { 
  UserCircleIcon, 
  EnvelopeIcon, 
  ClockIcon, 
  CalendarDaysIcon,
  UserIcon,
  DocumentTextIcon
} from '../../constants';
import { 
  AuthUser, 
  UserProfile, 
  getUserProfile, 
  updateUserProfile, 
  updateProfile 
} from '../../services/authService';
import { WeekDays } from '../../constants';

interface UserProfileManagerProps {
  user: AuthUser;
  onProfileUpdate?: (profile: UserProfile) => void;
  onClose?: () => void;
}

export const UserProfileManager: React.FC<UserProfileManagerProps> = ({ 
  user, 
  onProfileUpdate,
  onClose 
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    fullName: user.fullName || '',
    email: user.email || '',
    targetRole: '',
    dailyStudyHours: 3,
    studyDays: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'],
    studyNotes: ''
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const userProfile = await getUserProfile(user.id);
        
        if (userProfile) {
          setProfile(userProfile);
          setFormData({
            fullName: userProfile.fullName || '',
            email: userProfile.email || '',
            targetRole: userProfile.targetRole || '',
            dailyStudyHours: userProfile.dailyStudyHours,
            studyDays: userProfile.studyDays,
            studyNotes: userProfile.studyNotes || ''
          });
        }
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar perfil');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user.id]);

  const handleStudyDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      studyDays: prev.studyDays.includes(day)
        ? prev.studyDays.filter(d => d !== day)
        : [...prev.studyDays, day]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      // Update auth profile if name or email changed
      if (formData.fullName !== user.fullName || formData.email !== user.email) {
        await updateProfile({
          email: formData.email,
          fullName: formData.fullName
        });
      }

      // Update user profile in database
      const updatedProfile = await updateUserProfile(user.id, {
        fullName: formData.fullName,
        targetRole: formData.targetRole,
        dailyStudyHours: formData.dailyStudyHours,
        studyDays: formData.studyDays,
        studyNotes: formData.studyNotes
      });

      setProfile(updatedProfile);
      setSuccess(true);
      
      if (onProfileUpdate) {
        onProfileUpdate(updatedProfile);
      }

      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar perfil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="max-w-2xl mx-auto" title="Carregando Perfil">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto" title="">
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <UserCircleIcon className="w-12 h-12 text-sky-600" />
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Meu Perfil</h2>
            <p className="text-slate-600">Gerencie suas informações pessoais e preferências de estudo</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Pessoais */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center">
            <UserIcon className="w-5 h-5 mr-2" />
            Informações Pessoais
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              id="fullName"
              label="Nome Completo"
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
              placeholder="Seu nome completo"
              leftIcon={<UserIcon />}
            />
            
            <Input
              id="email"
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="seu@email.com"
              leftIcon={<EnvelopeIcon />}
              required
            />
          </div>
        </div>

        {/* Preferências de Estudo */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center">
            <DocumentTextIcon className="w-5 h-5 mr-2" />
            Preferências de Estudo
          </h3>
          
          <Input
            id="targetRole"
            label="Cargo de Interesse"
            type="text"
            value={formData.targetRole}
            onChange={(e) => setFormData(prev => ({ ...prev, targetRole: e.target.value }))}
            placeholder="Ex: Analista Judiciário, Técnico em Informática..."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center">
                <ClockIcon className="w-4 h-4 mr-1" />
                Horas de Estudo por Dia
              </label>
              <select
                value={formData.dailyStudyHours}
                onChange={(e) => setFormData(prev => ({ ...prev, dailyStudyHours: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(hour => (
                  <option key={hour} value={hour}>
                    {hour} {hour === 1 ? 'hora' : 'horas'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center">
                <CalendarDaysIcon className="w-4 h-4 mr-1" />
                Dias da Semana
              </label>
              <div className="grid grid-cols-2 gap-2">
                {WeekDays.slice(1, 6).map(day => (
                  <label key={day} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.studyDays.includes(day)}
                      onChange={() => handleStudyDayToggle(day)}
                      className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span className="ml-2 text-sm text-slate-700">{day}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <Textarea
            id="studyNotes"
            label="Observações sobre Estudos"
            value={formData.studyNotes}
            onChange={(e) => setFormData(prev => ({ ...prev, studyNotes: e.target.value }))}
            placeholder="Anote suas preferências, horários ideais, materiais favoritos..."
            rows={3}
          />
        </div>

        {/* Messages */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-600">Perfil atualizado com sucesso!</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            type="submit"
            isLoading={saving}
            className="sm:flex-1"
            size="lg"
          >
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
          
          {onClose && (
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="sm:flex-1"
              size="lg"
            >
              Fechar
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
};