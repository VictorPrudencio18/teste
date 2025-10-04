import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, XMarkIcon } from '../../constants';

export type NotificationType = 'success' | 'warning' | 'error' | 'info';

export interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationProps {
  notification: NotificationData;
  onDismiss: (id: string) => void;
}

const Notification: React.FC<NotificationProps> = ({ notification, onDismiss }) => {
  const { id, type, title, message, duration = 5000, action } = notification;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onDismiss(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onDismiss]);

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'warning':
      case 'error':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <CheckCircleIcon className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className={`flex items-start p-4 border rounded-lg shadow-lg max-w-md w-full ${getTypeStyles()}`}>
      <div className="flex-shrink-0 mr-3">
        {getIcon()}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        {message && (
          <p className="mt-1 text-sm opacity-75">{message}</p>
        )}
        
        {action && (
          <button
            onClick={action.onClick}
            className="mt-2 text-sm font-medium underline hover:no-underline"
          >
            {action.label}
          </button>
        )}
      </div>
      
      <button
        onClick={() => onDismiss(id)}
        className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600"
      >
        <XMarkIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

interface NotificationSystemProps {
  notifications: NotificationData[];
  onDismiss: (id: string) => void;
}

export const NotificationSystem: React.FC<NotificationSystemProps> = ({ 
  notifications, 
  onDismiss 
}) => {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          notification={notification}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
};

// Hook para gerenciar notificações
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const addNotification = (notification: Omit<NotificationData, 'id'>) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { ...notification, id }]);
    return id;
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  // Notificações pré-definidas para saves críticos
  const notifyDataSaved = (context: string) => {
    addNotification({
      type: 'success',
      title: 'Dados salvos com sucesso',
      message: `${context} foi salvo automaticamente`,
      duration: 3000
    });
  };

  const notifyDataSyncError = (onRetry?: () => void) => {
    addNotification({
      type: 'error',
      title: 'Erro na sincronização',
      message: 'Seus dados estão seguros localmente',
      duration: 7000,
      action: onRetry ? {
        label: 'Tentar novamente',
        onClick: onRetry
      } : undefined
    });
  };

  const notifyOfflineMode = () => {
    addNotification({
      type: 'warning',
      title: 'Modo offline',
      message: 'Dados serão sincronizados quando voltar online',
      duration: 5000
    });
  };

  const notifyDataRecovered = () => {
    addNotification({
      type: 'success',
      title: 'Dados recuperados',
      message: 'Seu progresso foi restaurado com sucesso',
      duration: 5000
    });
  };

  const notifyBackupCreated = (type: string) => {
    addNotification({
      type: 'info',
      title: 'Backup criado',
      message: `Backup ${type} salvo com segurança`,
      duration: 3000
    });
  };

  return {
    notifications,
    addNotification,
    dismissNotification,
    clearAll,
    // Helpers específicos
    notifyDataSaved,
    notifyDataSyncError,
    notifyOfflineMode,
    notifyDataRecovered,
    notifyBackupCreated
  };
};

export default NotificationSystem;