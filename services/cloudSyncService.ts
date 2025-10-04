import { supabase } from './supabaseClient';
import { AppState } from './localStorageService';

// Table: user_app_state
// Columns: user_id (uuid, pk/fk), state_json (jsonb), last_saved (timestamp), updated_at (timestamp)

const ensureSupabase = () => {
  if (!supabase) throw new Error('Cloud sync not configured. Provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
};

export const saveUserStateToCloud = async (userId: string, state: AppState): Promise<boolean> => {
  ensureSupabase();
  
  const stateWithTimestamp = {
    ...state,
    lastSaved: Date.now()
  };
  
  const payload = { 
    user_id: userId, 
    state_json: stateWithTimestamp, 
    last_saved: new Date().toISOString(),
    updated_at: new Date().toISOString() 
  };
  
  const { error } = await supabase
    .from('user_app_state')
    .upsert(payload, { onConflict: 'user_id' });
    
  if (error) {
    console.error('Error saving state to cloud:', error);
    throw new Error(error.message || 'Erro ao salvar estado na nuvem');
  }
  
  return true;
};

export const loadUserStateFromCloud = async (userId: string): Promise<AppState | null> => {
  ensureSupabase();
  
  const { data, error } = await supabase
    .from('user_app_state')
    .select('state_json, last_saved')
    .eq('user_id', userId)
    .single();
    
  if (error) {
    if (error.code === 'PGRST116') return null; // not found
    console.error('Error loading state from cloud:', error);
    throw new Error(error.message || 'Erro ao carregar estado da nuvem');
  }
  
  return (data?.state_json as AppState) || null;
};

export const deleteUserStateFromCloud = async (userId: string): Promise<boolean> => {
  ensureSupabase();
  
  const { error } = await supabase
    .from('user_app_state')
    .delete()
    .eq('user_id', userId);
    
  if (error) {
    console.error('Error deleting state from cloud:', error);
    throw new Error(error.message || 'Erro ao deletar estado da nuvem');
  }
  
  return true;
};

export const getLastSyncTime = async (userId: string): Promise<Date | null> => {
  ensureSupabase();
  
  const { data, error } = await supabase
    .from('user_app_state')
    .select('last_saved')
    .eq('user_id', userId)
    .single();
    
  if (error) {
    if (error.code === 'PGRST116') return null; // not found
    return null;
  }
  
  return data?.last_saved ? new Date(data.last_saved) : null;
};

export interface SyncStatus {
  isOnline: boolean;
  lastSync: Date | null;
  hasLocalChanges: boolean;
  hasCloudChanges: boolean;
}

export const getSyncStatus = async (userId: string, localState: AppState): Promise<SyncStatus> => {
  const isOnline = navigator.onLine && !!supabase;
  
  if (!isOnline) {
    return {
      isOnline: false,
      lastSync: null,
      hasLocalChanges: true,
      hasCloudChanges: false
    };
  }
  
  try {
    const lastSync = await getLastSyncTime(userId);
    const cloudState = await loadUserStateFromCloud(userId);
    
    const localTimestamp = localState.lastSaved || 0;
    const cloudTimestamp = cloudState?.lastSaved || 0;
    
    return {
      isOnline: true,
      lastSync,
      hasLocalChanges: localTimestamp > cloudTimestamp,
      hasCloudChanges: cloudTimestamp > localTimestamp
    };
  } catch (error) {
    console.error('Error getting sync status:', error);
    return {
      isOnline: false,
      lastSync: null,
      hasLocalChanges: true,
      hasCloudChanges: false
    };
  }
};
