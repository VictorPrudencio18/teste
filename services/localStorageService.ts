import { 
  UserProfile, 
  EditalAnalysisData, 
  ChatMessage, 
  DashboardData, 
  AppPhase,
  AnalyzedTopic,
  UserInteractions 
} from '../types';

// Interface para o estado completo da aplicação
export interface AppState {
  currentPhase?: AppPhase;
  editalText?: string;
  editalFileName?: string | null;
  userProfile?: UserProfile | null;
  extractedRoles?: string[];
  aiRoleClarificationQuestions?: string[];
  aiRoleExtractionError?: string | null;
  analysisResult?: EditalAnalysisData | null;
  currentStudyingSubjectId?: string | null;
  currentStudyingTopicId?: string | null;
  aiCoachChatMessages?: ChatMessage[];
  dashboardData?: DashboardData | null;
  lastSaved?: number; // timestamp
  version?: string; // versão do schema para futuras migrações
}

// Interface para configurações de backup
export interface BackupConfig {
  autoSaveInterval?: number; // intervalo em ms para salvamento automático
  maxBackups?: number; // número máximo de backups a manter
  compressionEnabled?: boolean; // se deve comprimir os dados
}

class LocalStorageService {
  private readonly MAIN_KEY = 'concursoGeniusAppState_v2';
  private readonly BACKUP_PREFIX = 'concursoGeniusBackup_';
  private readonly SETTINGS_KEY = 'concursoGeniusSettings';
  private readonly PERFORMANCE_KEY = 'concursoGeniusPerformance';
  private readonly VERSION = '2.0.0';
  
  private autoSaveTimer: NodeJS.Timeout | null = null;
  private defaultConfig: BackupConfig = {
    autoSaveInterval: 30000, // 30 segundos
    maxBackups: 5,
    compressionEnabled: true
  };

  /**
   * Salva o estado principal da aplicação
   */
  saveAppState(state: AppState): boolean {
    try {
      const stateToSave: AppState = {
        ...state,
        lastSaved: Date.now(),
        version: this.VERSION
      };

      const serializedState = JSON.stringify(stateToSave);
      
      // Verifica se o localStorage tem espaço suficiente
      if (this.checkStorageQuota(serializedState)) {
        localStorage.setItem(this.MAIN_KEY, serializedState);
        this.logPerformance('save', serializedState.length);
        return true;
      } else {
        console.warn('LocalStorage quota exceeded, attempting cleanup...');
        this.cleanupOldData();
        localStorage.setItem(this.MAIN_KEY, serializedState);
        return true;
      }
    } catch (error) {
      console.error('Failed to save app state:', error);
      return false;
    }
  }

  /**
   * Carrega o estado principal da aplicação
   */
  loadAppState(): AppState | null {
    try {
      const savedStateJSON = localStorage.getItem(this.MAIN_KEY);
      if (!savedStateJSON) {
        return null;
      }

      const state = JSON.parse(savedStateJSON) as AppState;
      
      // Verifica se precisa de migração
      if (this.needsMigration(state.version)) {
        return this.migrateState(state);
      }

      this.logPerformance('load', savedStateJSON.length);
      return state;
    } catch (error) {
      console.error('Failed to load app state:', error);
      this.createBackup('corrupted_' + Date.now());
      localStorage.removeItem(this.MAIN_KEY);
      return null;
    }
  }

  /**
   * Cria um backup do estado atual
   */
  createBackup(suffix?: string): boolean {
    try {
      const currentState = this.loadAppState();
      if (!currentState) return false;

      const backupKey = `${this.BACKUP_PREFIX}${suffix || Date.now()}`;
      localStorage.setItem(backupKey, JSON.stringify(currentState));
      
      this.cleanupOldBackups();
      return true;
    } catch (error) {
      console.error('Failed to create backup:', error);
      return false;
    }
  }

  /**
   * Lista todos os backups disponíveis
   */
  listBackups(): Array<{ key: string; date: Date; size: number }> {
    const backups: Array<{ key: string; date: Date; size: number }> = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.BACKUP_PREFIX)) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const timestamp = key.replace(this.BACKUP_PREFIX, '').replace('corrupted_', '');
            const date = new Date(parseInt(timestamp) || 0);
            backups.push({
              key,
              date,
              size: data.length
            });
          }
        } catch (error) {
          console.warn(`Invalid backup found: ${key}`);
        }
      }
    }
    
    return backups.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  /**
   * Restaura um backup específico
   */
  restoreBackup(backupKey: string): boolean {
    try {
      const backupData = localStorage.getItem(backupKey);
      if (!backupData) return false;

      // Cria backup do estado atual antes de restaurar
      this.createBackup('before_restore_' + Date.now());
      
      localStorage.setItem(this.MAIN_KEY, backupData);
      return true;
    } catch (error) {
      console.error('Failed to restore backup:', error);
      return false;
    }
  }

  /**
   * Salva dados específicos de um tópico (progresso detalhado)
   */
  saveTopicProgress(topicId: string, interactions: UserInteractions): boolean {
    try {
      const key = `topic_progress_${topicId}`;
      const data = {
        topicId,
        interactions,
        lastUpdated: Date.now()
      };
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Failed to save topic progress:', error);
      return false;
    }
  }

  /**
   * Carrega dados específicos de um tópico
   */
  loadTopicProgress(topicId: string): { interactions: UserInteractions; lastUpdated: number } | null {
    try {
      const key = `topic_progress_${topicId}`;
      const data = localStorage.getItem(key);
      if (!data) return null;
      
      const parsed = JSON.parse(data);
      return {
        interactions: parsed.interactions,
        lastUpdated: parsed.lastUpdated
      };
    } catch (error) {
      console.error('Failed to load topic progress:', error);
      return null;
    }
  }

  /**
   * Salva configurações do usuário
   */
  saveSettings(settings: Record<string, any>): boolean {
    try {
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify({
        ...settings,
        lastUpdated: Date.now()
      }));
      return true;
    } catch (error) {
      console.error('Failed to save settings:', error);
      return false;
    }
  }

  /**
   * Carrega configurações do usuário
   */
  loadSettings(): Record<string, any> | null {
    try {
      const data = localStorage.getItem(this.SETTINGS_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load settings:', error);
      return null;
    }
  }

  /**
   * Exporta todos os dados para JSON
   */
  exportAllData(): string {
    const exportData = {
      mainState: this.loadAppState(),
      backups: this.listBackups().map(backup => ({
        ...backup,
        data: JSON.parse(localStorage.getItem(backup.key) || '{}')
      })),
      settings: this.loadSettings(),
      topicProgress: this.getAllTopicProgress(),
      exportDate: new Date().toISOString(),
      version: this.VERSION
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Importa dados de um JSON exportado
   */
  importAllData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      // Valida a estrutura dos dados
      if (!this.validateImportData(data)) {
        throw new Error('Invalid import data structure');
      }

      // Cria backup antes da importação
      this.createBackup('before_import_' + Date.now());

      // Importa o estado principal
      if (data.mainState) {
        this.saveAppState(data.mainState);
      }

      // Importa as configurações
      if (data.settings) {
        this.saveSettings(data.settings);
      }

      // Importa progresso dos tópicos
      if (data.topicProgress) {
        for (const [topicId, progress] of Object.entries(data.topicProgress)) {
          this.saveTopicProgress(topicId, (progress as any).interactions);
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }

  /**
   * Limpa todos os dados salvos
   */
  clearAllData(): boolean {
    try {
      // Cria um último backup antes de limpar
      this.createBackup('final_backup_' + Date.now());

      // Remove dados principais
      localStorage.removeItem(this.MAIN_KEY);
      localStorage.removeItem(this.SETTINGS_KEY);
      localStorage.removeItem(this.PERFORMANCE_KEY);

      // Remove progresso dos tópicos
      this.clearAllTopicProgress();

      return true;
    } catch (error) {
      console.error('Failed to clear all data:', error);
      return false;
    }
  }

  /**
   * Habilita salvamento automático
   */
  enableAutoSave(callback: () => AppState, config?: Partial<BackupConfig>): void {
    this.disableAutoSave(); // Remove timer anterior se existir

    const finalConfig = { ...this.defaultConfig, ...config };
    
    this.autoSaveTimer = setInterval(() => {
      try {
        const currentState = callback();
        this.saveAppState(currentState);
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, finalConfig.autoSaveInterval);
  }

  /**
   * Desabilita salvamento automático
   */
  disableAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  /**
   * Retorna estatísticas de uso do localStorage
   */
  getStorageStats(): {
    used: number;
    total: number;
    available: number;
    percentage: number;
    keys: number;
  } {
    let used = 0;
    let keys = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          used += key.length + value.length;
        }
        keys++;
      }
    }

    const total = 5 * 1024 * 1024; // 5MB (estimado)
    const available = total - used;
    const percentage = (used / total) * 100;

    return { used, total, available, percentage, keys };
  }

  // Métodos privados

  private checkStorageQuota(data: string): boolean {
    try {
      const testKey = 'quota_test';
      localStorage.setItem(testKey, data);
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  private cleanupOldData(): void {
    // Remove backups antigos se necessário
    const backups = this.listBackups();
    if (backups.length > this.defaultConfig.maxBackups!) {
      const toRemove = backups.slice(this.defaultConfig.maxBackups!);
      toRemove.forEach(backup => {
        localStorage.removeItem(backup.key);
      });
    }
  }

  private cleanupOldBackups(): void {
    const backups = this.listBackups();
    if (backups.length > this.defaultConfig.maxBackups!) {
      const toRemove = backups.slice(this.defaultConfig.maxBackups!);
      toRemove.forEach(backup => {
        localStorage.removeItem(backup.key);
      });
    }
  }

  private needsMigration(version?: string): boolean {
    if (!version) return true;
    
    const [major, minor, patch] = version.split('.').map(Number);
    const [currentMajor, currentMinor, currentPatch] = this.VERSION.split('.').map(Number);
    
    return major < currentMajor || 
           (major === currentMajor && minor < currentMinor) ||
           (major === currentMajor && minor === currentMinor && patch < currentPatch);
  }

  private migrateState(state: AppState): AppState {
    // Implementa migrações futuras aqui
    console.log('Migrating state from version:', state.version, 'to:', this.VERSION);
    
    // Por enquanto, apenas atualiza a versão
    return {
      ...state,
      version: this.VERSION
    };
  }

  private logPerformance(action: 'save' | 'load', dataSize: number): void {
    try {
      const perfData = localStorage.getItem(this.PERFORMANCE_KEY);
      const performance = perfData ? JSON.parse(perfData) : { saves: [], loads: [] };
      
      const entry = {
        timestamp: Date.now(),
        dataSize,
        action
      };

      if (action === 'save') {
        performance.saves.push(entry);
        // Mantém apenas os últimos 10 registros
        if (performance.saves.length > 10) {
          performance.saves = performance.saves.slice(-10);
        }
      } else {
        performance.loads.push(entry);
        if (performance.loads.length > 10) {
          performance.loads = performance.loads.slice(-10);
        }
      }

      localStorage.setItem(this.PERFORMANCE_KEY, JSON.stringify(performance));
    } catch (error) {
      // Ignora erros de performance logging
    }
  }

  private getAllTopicProgress(): Record<string, any> {
    const topicProgress: Record<string, any> = {};
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('topic_progress_')) {
        const topicId = key.replace('topic_progress_', '');
        const data = this.loadTopicProgress(topicId);
        if (data) {
          topicProgress[topicId] = data;
        }
      }
    }
    
    return topicProgress;
  }

  private clearAllTopicProgress(): void {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('topic_progress_')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  private validateImportData(data: any): boolean {
    // Validação básica da estrutura dos dados
    return typeof data === 'object' && 
           data !== null && 
           'exportDate' in data && 
           'version' in data;
  }
}

// Instância singleton
export const localStorageService = new LocalStorageService();

// Hooks personalizados para uso em React
export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = React.useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  };

  return [storedValue, setValue] as const;
};

// Importa React se ainda não estiver disponível
import React from 'react';

export default localStorageService;