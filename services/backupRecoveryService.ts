import { supabase } from './supabaseClient';
import { AppState, localStorageService } from './localStorageService';
import { saveUserStateToCloud, loadUserStateFromCloud } from './cloudSyncService';

export interface BackupEntry {
  id: string;
  user_id: string;
  state_json: AppState;
  backup_timestamp: string;
  created_at: string;
}

export interface RecoveryOptions {
  forceLocal?: boolean;
  forceCloud?: boolean;
  preferLatest?: boolean;
}

/**
 * Serviço robusto de backup e recuperação
 * Garante que os dados nunca sejam perdidos
 */
export class BackupRecoveryService {
  
  /**
   * Cria um backup manual do estado atual
   */
  static async createManualBackup(userId: string, state: AppState, label?: string): Promise<boolean> {
    try {
      // Backup local primeiro
      const localBackup = localStorageService.createBackup(`manual_${label || Date.now()}`);
      
      // Backup na nuvem se disponível
      if (supabase && userId) {
        await saveUserStateToCloud(userId, {
          ...state,
          backupLabel: label,
          backupType: 'manual',
          lastSaved: Date.now()
        });
      }
      
      console.log('Manual backup created successfully');
      return true;
    } catch (error) {
      console.error('Failed to create manual backup:', error);
      return false;
    }
  }
  
  /**
   * Lista todos os backups disponíveis para um usuário
   */
  static async listAvailableBackups(userId: string): Promise<BackupEntry[]> {
    if (!supabase || !userId) return [];
    
    try {
      const { data, error } = await supabase
        .from('user_state_backups')
        .select('*')
        .eq('user_id', userId)
        .order('backup_timestamp', { ascending: false })
        .limit(10);
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to list backups:', error);
      return [];
    }
  }
  
  /**
   * Recupera estado usando estratégia inteligente
   */
  static async smartRecover(userId: string, options: RecoveryOptions = {}): Promise<AppState | null> {
    console.log('Starting smart recovery for user:', userId);
    
    let cloudState: AppState | null = null;
    let localState: AppState | null = null;
    
    // Tentar carregar do local primeiro (mais rápido)
    try {
      localState = localStorageService.loadState();
      console.log('Local state loaded:', !!localState);
    } catch (error) {
      console.warn('Failed to load local state:', error);
    }
    
    // Tentar carregar da nuvem se autenticado
    if (userId && supabase) {
      try {
        cloudState = await loadUserStateFromCloud(userId);
        console.log('Cloud state loaded:', !!cloudState);
      } catch (error) {
        console.warn('Failed to load cloud state:', error);
      }
    }
    
    // Aplicar estratégia de recuperação
    return this.mergeStates(localState, cloudState, options);
  }
  
  /**
   * Merge inteligente de estados
   */
  private static mergeStates(
    localState: AppState | null, 
    cloudState: AppState | null, 
    options: RecoveryOptions
  ): AppState | null {
    
    // Se forçar local
    if (options.forceLocal) return localState;
    
    // Se forçar nuvem
    if (options.forceCloud) return cloudState;
    
    // Se só tem um estado
    if (!localState) return cloudState;
    if (!cloudState) return localState;
    
    // Comparar timestamps
    const localTime = localState.lastSaved || 0;
    const cloudTime = cloudState.lastSaved || 0;
    
    console.log('Comparing timestamps - Local:', new Date(localTime), 'Cloud:', new Date(cloudTime));
    
    // Se preferir o mais recente (padrão)
    if (options.preferLatest !== false) {
      const newerState = cloudTime > localTime ? cloudState : localState;
      console.log('Using newer state:', cloudTime > localTime ? 'cloud' : 'local');
      return newerState;
    }
    
    // Merge inteligente preservando dados importantes
    const mergedState: AppState = {
      ...localState,
      ...cloudState,
      
      // Preservar dados críticos que não devem ser perdidos
      editalText: cloudState.editalText || localState.editalText,
      editalFileName: cloudState.editalFileName || localState.editalFileName,
      analysisResult: cloudState.analysisResult || localState.analysisResult,
      userProfile: { ...localState.userProfile, ...cloudState.userProfile },
      
      // Usar o progresso mais avançado
      dashboardData: this.mergeProgress(localState.dashboardData, cloudState.dashboardData),
      
      // Manter conversas mais completas
      aiCoachChatMessages: this.mergeMessages(
        localState.aiCoachChatMessages || [], 
        cloudState.aiCoachChatMessages || []
      ),
      
      lastSaved: Math.max(localTime, cloudTime)
    };
    
    return mergedState;
  }
  
  /**
   * Merge de progresso de estudos
   */
  private static mergeProgress(local: any, cloud: any): any {
    if (!local) return cloud;
    if (!cloud) return local;
    
    // Preferir o progresso que tem mais tópicos completados
    const localCompleted = local.completedTopics || 0;
    const cloudCompleted = cloud.completedTopics || 0;
    
    return cloudCompleted >= localCompleted ? cloud : local;
  }
  
  /**
   * Merge de mensagens do chat
   */
  private static mergeMessages(local: any[], cloud: any[]): any[] {
    const allMessages = [...local, ...cloud];
    
    // Remover duplicatas baseado em timestamp e conteúdo
    const unique = allMessages.filter((msg, index, arr) => 
      arr.findIndex(m => 
        m.timestamp === msg.timestamp && 
        m.content === msg.content
      ) === index
    );
    
    // Ordenar por timestamp
    return unique.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  }
  
  /**
   * Verificação de integridade do estado
   */
  static validateState(state: AppState): boolean {
    try {
      // Verificações básicas de integridade
      if (!state || typeof state !== 'object') return false;
      
      // Se tem edital, deve ter texto
      if (state.currentPhase && state.currentPhase !== 'UPLOAD_PDF_ONLY' && !state.editalText) {
        console.warn('State inconsistency: Phase advanced but no edital text');
        return false;
      }
      
      // Se tem análise, deve ter edital
      if (state.analysisResult && !state.editalText) {
        console.warn('State inconsistency: Analysis exists but no edital text');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('State validation error:', error);
      return false;
    }
  }
  
  /**
   * Recuperação de emergência a partir de backups
   */
  static async emergencyRecover(userId: string): Promise<AppState | null> {
    console.log('Starting emergency recovery...');
    
    // Tentar backups automáticos
    const backups = await this.listAvailableBackups(userId);
    if (backups.length > 0) {
      console.log(`Found ${backups.length} backups, trying latest...`);
      const latestBackup = backups[0];
      if (this.validateState(latestBackup.state_json)) {
        return latestBackup.state_json;
      }
    }
    
    // Tentar backups locais
    const localBackups = localStorageService.listBackups();
    if (localBackups.length > 0) {
      console.log(`Found ${localBackups.length} local backups, trying latest...`);
      const latestLocal = localBackups[0];
      try {
        const restored = await localStorageService.restoreBackup(latestLocal.key);
        if (restored) return localStorageService.loadState();
      } catch (error) {
        console.error('Failed to restore local backup:', error);
      }
    }
    
    console.log('Emergency recovery failed - no valid backups found');
    return null;
  }
  
  /**
   * Sync seguro com retry e fallback
   */
  static async safeSyncToCloud(userId: string, state: AppState, retries = 3): Promise<boolean> {
    if (!userId || !supabase) return false;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        // Validar estado antes de salvar
        if (!this.validateState(state)) {
          console.warn(`Attempt ${attempt}: State validation failed`);
          continue;
        }
        
        await saveUserStateToCloud(userId, state);
        console.log(`Cloud sync successful on attempt ${attempt}`);
        return true;
        
      } catch (error) {
        console.error(`Cloud sync attempt ${attempt} failed:`, error);
        
        if (attempt === retries) {
          // Na última tentativa, salvar localmente como backup
          console.log('All cloud sync attempts failed, saving local backup');
          localStorageService.createBackup(`failed_sync_${Date.now()}`);
          return false;
        }
        
        // Aguardar antes da próxima tentativa
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    
    return false;
  }
}

export default BackupRecoveryService;