import React, { useState, useEffect } from 'react';
import { CloudArrowUpIcon, CloudArrowDownIcon, ExclamationTriangleIcon, CheckCircleIcon } from '../../constants';

interface SyncStatusProps {
  isOnline: boolean;
  lastSyncTime?: Date | null;
  isSyncing?: boolean;
  hasError?: boolean;
  onManualSync?: () => void;
  onEmergencyRecover?: () => void;
}

export const SyncStatus: React.FC<SyncStatusProps> = ({
  isOnline,
  lastSyncTime,
  isSyncing = false,
  hasError = false,
  onManualSync,
  onEmergencyRecover
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const formatLastSync = (time: Date | null) => {
    if (!time) return 'Nunca sincronizado';
    
    const now = new Date();
    const diff = now.getTime() - time.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (minutes < 1) return 'Agora mesmo';
    if (minutes < 60) return `${minutes} min atrás`;
    if (hours < 24) return `${hours}h atrás`;
    return `${days} dias atrás`;
  };

  const getStatusColor = () => {
    if (hasError) return 'text-red-600 bg-red-50 border-red-200';
    if (isSyncing) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (!isOnline) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getStatusIcon = () => {
    if (hasError) return <ExclamationTriangleIcon className="w-4 h-4" />;
    if (isSyncing) return <CloudArrowUpIcon className="w-4 h-4 animate-pulse" />;
    if (!isOnline) return <ExclamationTriangleIcon className="w-4 h-4" />;
    return <CheckCircleIcon className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (hasError) return 'Erro na sincronização';
    if (isSyncing) return 'Sincronizando...';
    if (!isOnline) return 'Offline';
    return 'Dados salvos';
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div 
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg border shadow-lg cursor-pointer transition-all duration-200 ${getStatusColor()}`}
        onClick={() => setShowDetails(!showDetails)}
      >
        {getStatusIcon()}
        <span className="text-sm font-medium">{getStatusText()}</span>
      </div>

      {showDetails && (
        <div className="absolute bottom-full right-0 mb-2 w-64 bg-white border border-gray-200 rounded-lg shadow-xl p-4">
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Status da Sincronização</h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Conexão:</span>
                  <span className={isOnline ? 'text-green-600' : 'text-red-600'}>
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Última sync:</span>
                  <span className="text-gray-800">{formatLastSync(lastSyncTime)}</span>
                </div>
                
                {hasError && (
                  <div className="text-red-600 text-xs mt-2">
                    Houve um problema na sincronização. Seus dados estão salvos localmente.
                  </div>
                )}
                
                {!isOnline && (
                  <div className="text-yellow-600 text-xs mt-2">
                    Sem conexão. Os dados serão sincronizados quando voltar online.
                  </div>
                )}
              </div>
            </div>

            <div className="border-t pt-3 space-y-2">
              {onManualSync && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onManualSync();
                    setShowDetails(false);
                  }}
                  disabled={isSyncing || !isOnline}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CloudArrowUpIcon className="w-4 h-4" />
                  <span>Sincronizar Agora</span>
                </button>
              )}
              
              {onEmergencyRecover && hasError && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEmergencyRecover();
                    setShowDetails(false);
                  }}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-orange-500 text-white rounded-md text-sm hover:bg-orange-600"
                >
                  <CloudArrowDownIcon className="w-4 h-4" />
                  <span>Recuperar Dados</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SyncStatus;