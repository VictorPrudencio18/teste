import React, { useState } from 'react';
import { DataManager } from '../common/DataManager';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { AppState } from '../../services/localStorageService';
import { useAppStorage } from '../../hooks/useAppStorage';

interface DataManagementStepProps {
  onBack: () => void;
  onStateRestored?: (state: AppState) => void;
  currentState?: AppState;
}

export const DataManagementStep: React.FC<DataManagementStepProps> = ({ 
  onBack, 
  onStateRestored,
  currentState 
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { getStorageStats, exportData } = useAppStorage();

  const handleQuickExport = () => {
    try {
      const data = exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-rapido-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro no export rápido:', error);
    }
  };

  const stats = getStorageStats();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">💾 Gerenciamento de Dados</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Gerencie seus dados de estudo, crie backups, importe/exporte dados e monitore o uso do armazenamento local.
        </p>
      </div>

      {/* Status Rápido */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl mb-2">📊</div>
            <div className="text-lg font-semibold">
              {stats ? `${(stats.used / 1024 / 1024).toFixed(1)} MB` : 'Calculando...'}
            </div>
            <div className="text-sm text-gray-600">Dados Salvos</div>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">🔄</div>
            <div className="text-lg font-semibold">Ativo</div>
            <div className="text-sm text-gray-600">Auto-Save</div>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">🛡️</div>
            <div className="text-lg font-semibold">Seguro</div>
            <div className="text-sm text-gray-600">Armazenamento Local</div>
          </div>
        </div>
      </Card>

      {/* Ações Rápidas */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">🚀 Ações Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={handleQuickExport}
            className="bg-green-600 hover:bg-green-700 flex items-center justify-center space-x-2"
          >
            <span>📤</span>
            <span>Export Rápido</span>
          </Button>
          <Button
            onClick={() => setShowAdvanced(true)}
            className="bg-blue-600 hover:bg-blue-700 flex items-center justify-center space-x-2"
          >
            <span>⚙️</span>
            <span>Opções Avançadas</span>
          </Button>
        </div>
      </Card>

      {/* Tutorial Rápido */}
      {!showAdvanced && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">📚 Como Funciona</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-green-600 mb-2">✅ Automático</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Seus dados são salvos automaticamente a cada 30 segundos</li>
                <li>• Backups automáticos são criados regularmente</li>
                <li>• Não precisa se preocupar em perder o progresso</li>
                <li>• Sistema detecta e corrige dados corrompidos</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-blue-600 mb-2">🔧 Manual</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Export: salva uma cópia dos seus dados</li>
                <li>• Import: restaura dados de um arquivo</li>
                <li>• Backups: pontos de restauração específicos</li>
                <li>• Funciona offline, direto no seu navegador</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-3">
              <div className="text-blue-600 text-xl">💡</div>
              <div>
                <div className="font-semibold text-blue-800">Dica Importante</div>
                <div className="text-sm text-blue-700 mt-1">
                  Seus dados ficam salvos apenas neste navegador. Para usar em outro dispositivo, 
                  use a função "Export" para criar um arquivo de backup e depois "Import" no outro dispositivo.
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Gerenciador Avançado */}
      {showAdvanced && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">⚙️ Gerenciamento Avançado</h2>
            <Button
              onClick={() => setShowAdvanced(false)}
              variant="outline"
              size="sm"
            >
              Voltar ao Simples
            </Button>
          </div>
          
          <DataManager 
            onStateRestored={onStateRestored}
            currentState={currentState}
          />
        </div>
      )}

      {/* Navegação */}
      <div className="flex justify-center pt-6">
        <Button
          onClick={onBack}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <span>←</span>
          <span>Voltar</span>
        </Button>
      </div>
    </div>
  );
};

export default DataManagementStep;