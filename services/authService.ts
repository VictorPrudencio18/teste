import { supabase } from './supabaseClient';

export interface AuthUser {
  id: string;
  email: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
}

export interface UserProfile {
  id: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  targetRole: string | null;
  dailyStudyHours: number;
  studyDays: string[];
  studyNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

const ensureSupabase = () => {
  if (!supabase) {
    throw new Error('Auth is not configured. Provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
};

export const signUpWithEmailPassword = async (email: string, password: string): Promise<AuthUser> => {
  ensureSupabase();
  
  if (password.length < 6) {
    throw new Error('A senha deve ter pelo menos 6 caracteres');
  }
  
  const { data, error } = await supabase.auth.signUp({ 
    email, 
    password,
    options: {
      emailRedirectTo: window.location.origin
    }
  });
  
  if (error) throw new Error(error.message || 'Erro ao criar conta');
  
  const user = data.user;
  if (!user) throw new Error('Falha ao criar usuário');
  
  return { 
    id: user.id, 
    email: user.email,
    fullName: user.user_metadata?.full_name || null,
    avatarUrl: user.user_metadata?.avatar_url || null
  };
};

export const signInWithEmailPassword = async (email: string, password: string): Promise<AuthUser> => {
  ensureSupabase();
  
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  
  if (error) {
    if (error.message === 'Invalid login credentials') {
      throw new Error('Email ou senha incorretos');
    }
    throw new Error(error.message || 'Erro ao fazer login');
  }
  
  const user = data.user;
  if (!user) throw new Error('Falha no login');
  
  return { 
    id: user.id, 
    email: user.email,
    fullName: user.user_metadata?.full_name || null,
    avatarUrl: user.user_metadata?.avatar_url || null
  };
};

export const signInWithGoogle = async (): Promise<void> => {
  ensureSupabase();
  
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  });
  
  if (error) throw new Error(error.message || 'Erro ao fazer login com Google');
};

export const signOutUser = async (): Promise<void> => {
  ensureSupabase();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message || 'Erro ao sair');
};

export const getCurrentUser = async (): Promise<AuthUser | null> => {
  if (!supabase) return null;
  
  const { data } = await supabase.auth.getUser();
  const user = data?.user;
  
  return user ? { 
    id: user.id, 
    email: user.email,
    fullName: user.user_metadata?.full_name || null,
    avatarUrl: user.user_metadata?.avatar_url || null
  } : null;
};

export const resetPassword = async (email: string): Promise<void> => {
  ensureSupabase();
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`
  });
  
  if (error) throw new Error(error.message || 'Erro ao enviar email de recuperação');
};

export const updatePassword = async (newPassword: string): Promise<void> => {
  ensureSupabase();
  
  if (newPassword.length < 6) {
    throw new Error('A senha deve ter pelo menos 6 caracteres');
  }
  
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  
  if (error) throw new Error(error.message || 'Erro ao atualizar senha');
};

export const updateProfile = async (updates: { 
  email?: string; 
  fullName?: string; 
  avatarUrl?: string; 
}): Promise<AuthUser> => {
  ensureSupabase();
  
  const { data, error } = await supabase.auth.updateUser({
    email: updates.email,
    data: {
      full_name: updates.fullName,
      avatar_url: updates.avatarUrl
    }
  });
  
  if (error) throw new Error(error.message || 'Erro ao atualizar perfil');
  
  const user = data.user;
  if (!user) throw new Error('Falha ao atualizar perfil');
  
  return { 
    id: user.id, 
    email: user.email,
    fullName: user.user_metadata?.full_name || null,
    avatarUrl: user.user_metadata?.avatar_url || null
  };
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  ensureSupabase();
  
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(error.message || 'Erro ao buscar perfil');
  }
  
  return {
    id: data.id,
    email: data.email,
    fullName: data.full_name,
    avatarUrl: data.avatar_url,
    targetRole: data.target_role,
    dailyStudyHours: data.daily_study_hours,
    studyDays: data.study_days,
    studyNotes: data.study_notes,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
};

export const updateUserProfile = async (userId: string, profile: Partial<UserProfile>): Promise<UserProfile> => {
  ensureSupabase();
  
  const { data, error } = await supabase
    .from('user_profiles')
    .update({
      full_name: profile.fullName,
      avatar_url: profile.avatarUrl,
      target_role: profile.targetRole,
      daily_study_hours: profile.dailyStudyHours,
      study_days: profile.studyDays,
      study_notes: profile.studyNotes
    })
    .eq('id', userId)
    .select()
    .single();
  
  if (error) throw new Error(error.message || 'Erro ao atualizar perfil');
  
  return {
    id: data.id,
    email: data.email,
    fullName: data.full_name,
    avatarUrl: data.avatar_url,
    targetRole: data.target_role,
    dailyStudyHours: data.daily_study_hours,
    studyDays: data.study_days,
    studyNotes: data.study_notes,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
};

export const recordStudySession = async (session: {
  subjectName: string;
  topicName: string;
  durationMinutes: number;
  sessionType: 'reading' | 'questions' | 'flashcards' | 'ai_coach';
  performanceScore?: number;
  notes?: string;
}): Promise<void> => {
  ensureSupabase();
  
  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');
  
  const { error } = await supabase
    .from('study_sessions')
    .insert({
      user_id: user.id,
      subject_name: session.subjectName,
      topic_name: session.topicName,
      duration_minutes: session.durationMinutes,
      session_type: session.sessionType,
      performance_score: session.performanceScore,
      notes: session.notes
    });
  
  if (error) throw new Error(error.message || 'Erro ao registrar sessão de estudo');
};

export const getStudySessions = async (limit = 50): Promise<Array<{
  id: string;
  subjectName: string;
  topicName: string;
  durationMinutes: number;
  sessionType: string;
  performanceScore: number | null;
  notes: string | null;
  createdAt: string;
}>> => {
  ensureSupabase();
  
  const user = await getCurrentUser();
  if (!user) return [];
  
  const { data, error } = await supabase
    .from('study_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw new Error(error.message || 'Erro ao buscar sessões de estudo');
  
  return data.map(session => ({
    id: session.id,
    subjectName: session.subject_name,
    topicName: session.topic_name,
    durationMinutes: session.duration_minutes,
    sessionType: session.session_type,
    performanceScore: session.performance_score,
    notes: session.notes,
    createdAt: session.created_at
  }));
};

export const onAuthStateChange = (
  callback: (event: string, user: AuthUser | null) => void
) => {
  if (!supabase) return { data: { subscription: { unsubscribe: () => {} } } } as any;
  
  const subscription = supabase.auth.onAuthStateChange((event, session) => {
    const user = session?.user ? { 
      id: session.user.id, 
      email: session.user.email,
      fullName: session.user.user_metadata?.full_name || null,
      avatarUrl: session.user.user_metadata?.avatar_url || null
    } : null;
    callback(event, user);
  });
  
  return subscription;
};
