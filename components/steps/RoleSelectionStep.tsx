
import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Card } from '../common/Card';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { SparklesIcon, InformationCircleIcon, CheckCircleIcon, XCircleIcon, ArrowLeftIcon, AcademicCapIcon, ListBulletIcon } from '../../constants';

interface RoleSelectionStepProps {
  editalFileName: string | null;
  extractedRoles: string[];
  aiClarificationQuestions?: string[];
  aiRoleExtractionError?: string | null;
  isLoadingRoles: boolean;
  onRoleSelectAndProceed: (selectedRole: string) => void;
  onBackToUpload: () => void;
  onRequestRoleExtraction?: () => void; // Optional: if roles need to be re-fetched
}

export const RoleSelectionStep: React.FC<RoleSelectionStepProps> = ({
  editalFileName,
  extractedRoles,
  aiClarificationQuestions,
  aiRoleExtractionError,
  isLoadingRoles,
  onRoleSelectAndProceed,
  onBackToUpload,
  onRequestRoleExtraction
}) => {
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [manualRole, setManualRole] = useState<string>('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // If roles are extracted, pre-select the first one or clear selection
    if (extractedRoles.length > 0) {
        setSelectedRole(extractedRoles[0]); // Pre-select the first role
        setShowManualInput(false); // Hide manual input if roles are found
        setManualRole('');
    } else if (!isLoadingRoles && !aiRoleExtractionError) {
        // No roles found, no loading, no error -> suggest manual input
        setShowManualInput(true);
    }
    if (aiRoleExtractionError){
        setShowManualInput(true); // If AI errored, allow manual input
    }
  }, [extractedRoles, isLoadingRoles, aiRoleExtractionError]);

  const handleSubmit = () => {
    const roleToSubmit = showManualInput ? manualRole.trim() : selectedRole.trim();
    if (!roleToSubmit) {
      setError('Por favor, selecione ou informe o cargo desejado.');
      return;
    }
    setError('');
    onRoleSelectAndProceed(roleToSubmit);
  };

  const handleRoleSelectionChange = (role: string) => {
    setSelectedRole(role);
    if (role === "MANUAL_INPUT_TRIGGER") {
        setShowManualInput(true);
        setSelectedRole(''); // Clear radio selection
    } else {
        setShowManualInput(false);
        setManualRole('');
    }
  };

  return (
    <Card className="max-w-2xl mx-auto" title="1. Selecione seu Cargo">
      <Button onClick={onBackToUpload} variant="ghost" size="sm" className="absolute top-6 right-6 text-slate-500 hover:text-sky-600" leftIcon={<ArrowLeftIcon className="w-4 h-4"/>}>
        Enviar Outro Edital
      </Button>

      <p className="text-slate-600 mb-2 text-sm">
        Analisamos o edital <strong className="text-sky-700">{editalFileName || "fornecido"}</strong>.
      </p>
      
      {isLoadingRoles && (
        <div className="flex flex-col items-center justify-center my-10">
          <LoadingSpinner size="md" />
          <p className="mt-3 text-sky-700 flex items-center">
            <SparklesIcon className="inline w-5 h-5 mr-1.5 text-amber-500" />
            Identificando cargos no edital...
          </p>
        </div>
      )}

      {!isLoadingRoles && aiRoleExtractionError && (
        <div className="my-4 p-4 bg-red-50 border border-red-300 rounded-lg">
          <div className="flex items-center text-red-700">
            <XCircleIcon className="w-6 h-6 mr-2 flex-shrink-0" />
            <h4 className="font-semibold text-lg">Erro ao Identificar Cargos</h4>
          </div>
          <p className="text-red-600 text-sm mt-1 mb-3">{aiRoleExtractionError}</p>
          <p className="text-sm text-slate-600">
            Não se preocupe! Você pode informar o cargo manualmente abaixo.
          </p>
           {onRequestRoleExtraction && (
            <Button onClick={onRequestRoleExtraction} variant="outline" size="sm" className="mt-3" leftIcon={<SparklesIcon />}>Tentar Extrair Cargos Novamente</Button>
          )}
        </div>
      )}

      {!isLoadingRoles && !aiRoleExtractionError && extractedRoles.length > 0 && (
        <div className="my-4 p-4 bg-green-50 border border-green-300 rounded-lg">
          <div className="flex items-center text-green-700">
            <CheckCircleIcon className="w-6 h-6 mr-2 flex-shrink-0" />
            <h4 className="font-semibold text-lg">Cargos Identificados pela IA!</h4>
          </div>
          <p className="text-slate-600 text-sm mt-1">
            Selecione o cargo para o qual você está estudando. Se não estiver na lista, você pode informá-lo manualmente.
          </p>
        </div>
      )}
      
      {!isLoadingRoles && !aiRoleExtractionError && extractedRoles.length === 0 && !showManualInput && (
         <div className="my-4 p-4 bg-amber-50 border border-amber-300 rounded-lg">
          <div className="flex items-center text-amber-700">
            <InformationCircleIcon className="w-6 h-6 mr-2 flex-shrink-0" />
            <h4 className="font-semibold text-lg">Nenhum Cargo Identificado Automaticamente</h4>
          </div>
          <p className="text-slate-600 text-sm mt-1">
            Não encontramos cargos listados automaticamente. Por favor, informe seu cargo alvo manualmente abaixo.
          </p>
        </div>
      )}


      {!isLoadingRoles && (extractedRoles.length > 0 || showManualInput) && (
        <div className="space-y-4 my-6">
          <label className="block text-md font-semibold text-slate-800 mb-2">
            <ListBulletIcon className="inline w-5 h-5 mr-2 text-sky-600" />
            Qual o seu cargo alvo?
          </label>
          {extractedRoles.map(role => (
            <label key={role} className={`flex items-center p-3.5 rounded-lg border-2 transition-all duration-200 cursor-pointer ${selectedRole === role && !showManualInput ? 'bg-sky-100 border-sky-500 ring-2 ring-sky-500' : 'hover:bg-slate-100 border-slate-300 hover:border-sky-400'}`}>
              <input
                type="radio"
                name="extractedRole"
                value={role}
                checked={selectedRole === role && !showManualInput}
                onChange={() => handleRoleSelectionChange(role)}
                className="form-radio h-5 w-5 text-sky-600 border-slate-400 focus:ring-sky-500 mr-3 flex-shrink-0"
              />
              <span className="text-slate-700 font-medium">{role}</span>
            </label>
          ))}
          
          {/* Option to switch to manual input */}
          {extractedRoles.length > 0 && (
             <label className={`flex items-center p-3.5 rounded-lg border-2 transition-all duration-200 cursor-pointer ${showManualInput ? 'bg-sky-100 border-sky-500 ring-2 ring-sky-500' : 'hover:bg-slate-100 border-slate-300 hover:border-sky-400'}`}>
                <input
                    type="radio"
                    name="extractedRole"
                    value="MANUAL_INPUT_TRIGGER"
                    checked={showManualInput}
                    onChange={() => handleRoleSelectionChange("MANUAL_INPUT_TRIGGER")}
                    className="form-radio h-5 w-5 text-sky-600 border-slate-400 focus:ring-sky-500 mr-3 flex-shrink-0"
                />
                <span className="text-slate-700 font-medium">Outro (informar manualmente)</span>
            </label>
          )}

          {showManualInput && (
            <Input
              id="manualTargetRole"
              label={extractedRoles.length > 0 ? "Informe seu cargo aqui:" : "Informe o Cargo Desejado:"}
              value={manualRole}
              onChange={(e) => setManualRole(e.target.value)}
              placeholder="Ex: Analista Judiciário - Área Administrativa"
              containerClassName="mt-4"
              leftIcon={<AcademicCapIcon />}
            />
          )}
        </div>
      )}

      {aiClarificationQuestions && aiClarificationQuestions.length > 0 && (
        <div className="my-6 p-4 bg-blue-50 border border-blue-300 rounded-lg">
            <div className="flex items-center text-blue-700">
                <InformationCircleIcon className="w-6 h-6 mr-2 flex-shrink-0" />
                <h4 className="font-semibold text-lg">Sugestões da IA:</h4>
            </div>
            <ul className="list-disc list-inside text-sm text-blue-600 mt-2 space-y-1">
                {aiClarificationQuestions.map((q, i) => <li key={i}>{q}</li>)}
            </ul>
        </div>
      )}

      {error && <p className="text-red-600 text-sm mb-4 p-3 bg-red-50 rounded-md border border-red-200">{error}</p>}
      
      <Button 
        onClick={handleSubmit} 
        isLoading={isLoadingRoles} // Assuming global loading might be active too
        disabled={isLoadingRoles || (!showManualInput && !selectedRole) || (showManualInput && !manualRole.trim())}
        fullWidth
        size="lg"
        className="mt-6"
        leftIcon={<SparklesIcon className="w-5 h-5" />}
      >
        Confirmar Cargo e Definir Preferências
      </Button>
    </Card>
  );
};
