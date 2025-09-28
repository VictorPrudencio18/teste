import { useState, useEffect, useCallback, useRef } from 'react';
import { localStorageService, AppState } from '../services/localStorageService';

export interface UseAppStorageOptions {
  autoSave?: boolean;
  autoSaveInterval?: number;
  onSaveError?: (error: Error) => void;
  onLoadError?: (error: Error) => void;
}

export interface UseAppStorageReturn {
  state: AppState | null;
  loading: boolean;
  error: string | null;
  
  // Funções principais
  saveState: (state: AppState) => Promise<boolean>;
  loadState: () => Promise<AppState | null>;
  updateState: (updater: (prev: AppState | null) => AppState) => Promise<boolean>;
  
  // Gerenciamento de backups
  createBackup: (suffix?: string) => Promise<boolean>;
  listBackups: () => Array<{ key: string; date: Date; size: number }>;
  restoreBackup: (backupKey: string) => Promise<boolean>;
  
  // Utilitários
  clearAllData: () => Promise<boolean>;
  exportData: () => string;
  importData: (jsonData: string) => Promise<boolean>;
  getStorageStats: () => any;
  
  // Status do auto-save
  autoSaveEnabled: boolean;
  enableAutoSave: () => void;
  disableAutoSave: () => void;
}

export const useAppStorage = (
  initialState?: AppState,
  options: UseAppStorageOptions = {}
): UseAppStorageReturn => {
  const {
    autoSave = true,
    autoSaveInterval = 30000,
    onSaveError,
    onLoadError
  } = options;

  const [state, setState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);

  const stateRef = useRef<AppState | null>(null);
  const mountedRef = useRef(true);

  // Atualiza a referência sempre que o estado muda
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Cleanup na desmontagem
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      localStorageService.disableAutoSave();
    };
  }, []);

  // Carrega o estado inicial
  useEffect(() => {
    const loadInitialState = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const savedState = await loadState();
        if (mountedRef.current) {
          setState(savedState || initialState || null);
        }
      } catch (err) {
        const error = err as Error;
        if (mountedRef.current) {
          setError(error.message);
          onLoadError?.(error);
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    loadInitialState();
  }, []);

  // Configura auto-save se habilitado
  useEffect(() => {
    if (autoSave && state && !loading) {
      enableAutoSaveInternal();
    } else {
      disableAutoSaveInternal();
    }

    return () => {
      disableAutoSaveInternal();
    };
  }, [autoSave, state, loading, autoSaveInterval]);

  const saveState = useCallback(async (newState: AppState): Promise<boolean> => {
    try {
      const success = localStorageService.saveAppState(newState);
      if (success && mountedRef.current) {
        setState(newState);
        setError(null);
      }
      return success;
    } catch (err) {
      const error = err as Error;
      if (mountedRef.current) {
        setError(error.message);
        onSaveError?.(error);
      }
      return false;
    }
  }, [onSaveError]);

  const loadState = useCallback(async (): Promise<AppState | null> => {
    try {
      const loadedState = localStorageService.loadAppState();
      if (mountedRef.current) {
        setError(null);
      }
      return loadedState;
    } catch (err) {
      const error = err as Error;
      if (mountedRef.current) {
        setError(error.message);
        onLoadError?.(error);
      }
      return null;
    }
  }, [onLoadError]);

  const updateState = useCallback(async (
    updater: (prev: AppState | null) => AppState
  ): Promise<boolean> => {
    try {
      const newState = updater(stateRef.current);
      return await saveState(newState);
    } catch (err) {
      const error = err as Error;
      if (mountedRef.current) {
        setError(error.message);
        onSaveError?.(error);
      }
      return false;
    }
  }, [saveState, onSaveError]);

  const createBackup = useCallback(async (suffix?: string): Promise<boolean> => {
    try {
      const success = localStorageService.createBackup(suffix);
      if (mountedRef.current) {
        setError(null);
      }
      return success;
    } catch (err) {
      const error = err as Error;
      if (mountedRef.current) {
        setError(error.message);
      }
      return false;
    }
  }, []);

  const listBackups = useCallback(() => {
    return localStorageService.listBackups();
  }, []);

  const restoreBackup = useCallback(async (backupKey: string): Promise<boolean> => {
    try {
      const success = localStorageService.restoreBackup(backupKey);
      if (success) {
        const restoredState = await loadState();
        if (mountedRef.current) {
          setState(restoredState);
          setError(null);
        }
      }
      return success;
    } catch (err) {
      const error = err as Error;
      if (mountedRef.current) {
        setError(error.message);
      }
      return false;
    }
  }, [loadState]);

  const clearAllData = useCallback(async (): Promise<boolean> => {
    try {
      const success = localStorageService.clearAllData();
      if (success && mountedRef.current) {
        setState(null);
        setError(null);
      }
      return success;
    } catch (err) {
      const error = err as Error;
      if (mountedRef.current) {
        setError(error.message);
      }
      return false;
    }
  }, []);

  const exportData = useCallback((): string => {
    return localStorageService.exportAllData();
  }, []);

  const importData = useCallback(async (jsonData: string): Promise<boolean> => {
    try {
      const success = localStorageService.importAllData(jsonData);
      if (success) {
        const importedState = await loadState();
        if (mountedRef.current) {
          setState(importedState);
          setError(null);
        }
      }
      return success;
    } catch (err) {
      const error = err as Error;
      if (mountedRef.current) {
        setError(error.message);
      }
      return false;
    }
  }, [loadState]);

  const getStorageStats = useCallback(() => {
    return localStorageService.getStorageStats();
  }, []);

  const enableAutoSaveInternal = useCallback(() => {
    if (!autoSaveEnabled) {
      localStorageService.enableAutoSave(
        () => stateRef.current || {},
        { autoSaveInterval }
      );
      setAutoSaveEnabled(true);
    }
  }, [autoSaveEnabled, autoSaveInterval]);

  const disableAutoSaveInternal = useCallback(() => {
    if (autoSaveEnabled) {
      localStorageService.disableAutoSave();
      setAutoSaveEnabled(false);
    }
  }, [autoSaveEnabled]);

  const enableAutoSave = useCallback(() => {
    enableAutoSaveInternal();
  }, [enableAutoSaveInternal]);

  const disableAutoSave = useCallback(() => {
    disableAutoSaveInternal();
  }, [disableAutoSaveInternal]);

  return {
    state,
    loading,
    error,
    
    saveState,
    loadState,
    updateState,
    
    createBackup,
    listBackups,
    restoreBackup,
    
    clearAllData,
    exportData,
    importData,
    getStorageStats,
    
    autoSaveEnabled,
    enableAutoSave,
    disableAutoSave
  };
};

// Hook específico para progresso de tópicos
export const useTopicProgress = (topicId: string) => {
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProgress = async () => {
      try {
        const data = localStorageService.loadTopicProgress(topicId);
        setProgress(data);
      } catch (error) {
        console.error('Failed to load topic progress:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, [topicId]);

  const saveProgress = useCallback(async (interactions: any) => {
    try {
      const success = localStorageService.saveTopicProgress(topicId, interactions);
      if (success) {
        setProgress({ interactions, lastUpdated: Date.now() });
      }
      return success;
    } catch (error) {
      console.error('Failed to save topic progress:', error);
      return false;
    }
  }, [topicId]);

  return { progress, loading, saveProgress };
};

// Hook para configurações
export const useSettings = <T = Record<string, any>>(defaultSettings?: T) => {
  const [settings, setSettings] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = localStorageService.loadSettings();
        setSettings(savedSettings as T || defaultSettings || null);
      } catch (error) {
        console.error('Failed to load settings:', error);
        setSettings(defaultSettings || null);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const saveSettings = useCallback(async (newSettings: T) => {
    try {
      const success = localStorageService.saveSettings(newSettings);
      if (success) {
        setSettings(newSettings);
      }
      return success;
    } catch (error) {
      console.error('Failed to save settings:', error);
      return false;
    }
  }, []);

  const updateSettings = useCallback(async (updater: (prev: T | null) => T) => {
    const newSettings = updater(settings);
    return await saveSettings(newSettings);
  }, [settings, saveSettings]);

  return { settings, loading, saveSettings, updateSettings };
};

export default useAppStorage;