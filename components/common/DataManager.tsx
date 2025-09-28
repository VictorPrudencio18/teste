import React, { useState, useEffect } from 'react';
import { localStorageService, AppState } from '../../services/localStorageService';
import { Button } from './Button';
import { Card } from './Card';

interface DataManagerProps {
  onStateRestored?: (state: AppState) => void;
  currentState?: AppState;
}

export const DataManager: React.FC<DataManagerProps> = ({ 
  onStateRestored, 
  currentState 
}) => {
  const [backups, setBackups] = useState<Array<{ key: string; date: Date; size: number }>>([]);
  const [storageStats, setStorageStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setBackups(localStorageService.listBackups());
    setStorageStats(localStorageService.getStorageStats());
  };

  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleCreateBackup = async () => {
    setIsLoading(true);
    try {
      const success = localStorageService.createBackup();
      if (success) {
        showMessage('success', 'Backup criado com sucesso!');
        refreshData();
      } else {
        showMessage('error', 'Falha ao criar backup');
      }
    } catch (error) {
      showMessage('error', 'Erro ao criar backup');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreBackup = async (backupKey: string) => {
    setIsLoading(true);
    try {
      const success = localStorageService.restoreBackup(backupKey);
      if (success) {
        const restoredState = localStorageService.loadAppState();
        if (restoredState && onStateRestored) {
          onStateRestored(restoredState);
        }
        showMessage('success', 'Backup restaurado com sucesso!');
        refreshData();
      } else {
        showMessage('error', 'Falha ao restaurar backup');
      }
    } catch (error) {
      showMessage('error', 'Erro ao restaurar backup');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = () => {
    try {
      const exportData = localStorageService.exportAllData();
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `concurso-genius-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showMessage('success', 'Dados exportados com sucesso!');
    } catch (error) {
      showMessage('error', 'Erro ao exportar dados');
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = e.target?.result as string;
        const success = localStorageService.importAllData(jsonData);
        if (success) {
          const restoredState = localStorageService.loadAppState();
          if (restoredState && onStateRestored) {
            onStateRestored(restoredState);
          }
          showMessage('success', 'Dados importados com sucesso!');
          refreshData();
        } else {
          showMessage('error', 'Falha ao importar dados');
        }
      } catch (error) {
        showMessage('error', 'Erro ao processar arquivo de importação');
      }
    };
    reader.readAsText(file);
    // Limpa o input para permitir reimportar o mesmo arquivo
    event.target.value = '';
  };

  const handleClearAllData = () => {
    if (window.confirm('⚠️ ATENÇÃO: Esta ação irá remover TODOS os seus dados salvos e não pode ser desfeita. Tem certeza que deseja continuar?')) {
      setIsLoading(true);
      try {
        const success = localStorageService.clearAllData();
        if (success) {
          showMessage('success', 'Todos os dados foram removidos');
          refreshData();
          // Recarrega a página para resetar o estado da aplicação
          setTimeout(() => window.location.reload(), 1500);
        } else {
          showMessage('error', 'Erro ao limpar dados');
        }
      } catch (error) {
        showMessage('error', 'Erro ao limpar dados');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleString('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-md ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
          message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
          'bg-blue-50 text-blue-700 border border-blue-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Estatísticas de Armazenamento */}
      {storageStats && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">📊 Uso do Armazenamento Local</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{formatFileSize(storageStats.used)}</div>
              <div className="text-sm text-gray-600">Usado</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{formatFileSize(storageStats.available)}</div>
              <div className="text-sm text-gray-600">Disponível</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{storageStats.percentage.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Percentual</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{storageStats.keys}</div>
              <div className="text-sm text-gray-600">Registros</div>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${Math.min(storageStats.percentage, 100)}%` }}
            />
          </div>
        </Card>
      )}

      {/* Ações Principais */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">🔧 Gerenciar Dados</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button
            onClick={handleCreateBackup}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            💾 Criar Backup
          </Button>
          
          <Button
            onClick={handleExportData}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            📤 Exportar Dados
          </Button>
          
          <label className="cursor-pointer">
            <Button
              as="span"
              disabled={isLoading}
              className="bg-orange-600 hover:bg-orange-700 w-full"
            >
              📥 Importar Dados
            </Button>
            <input
              type="file"
              accept=".json"
              onChange={handleImportData}
              className="hidden"
              disabled={isLoading}
            />
          </label>
          
          <Button
            onClick={handleClearAllData}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            🗑️ Limpar Tudo
          </Button>
        </div>
      </Card>

      {/* Lista de Backups */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">📋 Backups Automáticos</h3>
          <Button
            onClick={refreshData}
            size="sm"
            variant="outline"
            disabled={isLoading}
          >
            🔄 Atualizar
          </Button>
        </div>
        
        {backups.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📪</div>
            <p>Nenhum backup encontrado</p>
            <p className="text-sm">Crie seu primeiro backup clicando no botão acima</p>
          </div>
        ) : (
          <div className="space-y-3">
            {backups.map((backup, index) => (
              <div
                key={backup.key}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div>
                  <div className="font-medium">
                    {backup.key.includes('corrupted') ? '⚠️ Backup de Recuperação' :
                     backup.key.includes('before_restore') ? '🔄 Antes da Restauração' :
                     backup.key.includes('before_import') ? '📥 Antes da Importação' :
                     backup.key.includes('final_backup') ? '🏁 Backup Final' :
                     `💾 Backup #${backups.length - index}`}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatDate(backup.date)} • {formatFileSize(backup.size)}
                  </div>
                </div>
                <Button
                  onClick={() => handleRestoreBackup(backup.key)}
                  size="sm"
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Restaurar
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Informações Técnicas */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">ℹ️ Informações do Sistema</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="font-semibold mb-2">🔄 Salvamento Automático</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• Salva automaticamente a cada 30 segundos</li>
              <li>• Mantém até 5 backups automáticos</li>
              <li>• Detecta e recupera dados corrompidos</li>
              <li>• Migração automática entre versões</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">💾 O que é salvo</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• Texto do edital e análise completa</li>
              <li>• Seu progresso em cada tópico</li>
              <li>• Respostas e autoavaliações</li>
              <li>• Histórico de conversas com IA</li>
              <li>• Configurações e preferências</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DataManager;