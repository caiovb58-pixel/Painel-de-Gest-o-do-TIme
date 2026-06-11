import { createClient } from '@supabase/supabase-js';
import { SDR, Assessor, OneOnOneLog } from '../types';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

/**
 * Instância do cliente Supabase pré-configurada.
 * Caso as variáveis de ambiente não estejam prontas, aponta para valores temporários
 * para evitar falhas em tempo de compilação ou carregamento.
 */
export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder');

/**
 * Verifica se as variáveis de ambiente do Supabase estão devidamente configuradas.
 */
export function isSupabaseConfigured(): boolean {
  return !!supabaseUrl && !!supabaseAnonKey && supabaseUrl !== 'https://placeholder.supabase.co';
}

/**
 * Retorna o cliente do Supabase de forma segura.
 */
export function getSupabase() {
  if (!isSupabaseConfigured()) {
    console.warn(
      '⚠️ SUPABASE SETUP WARNING: VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não estão configuradas em seu ambiente. ' +
      'Por favor, configure-as em Configurações -> Segredos (Secrets).'
    );
  }
  return supabase;
}

// ----------------------------------------------------
// 1. SDR SYNCHRONIZATION HELPERS
// ----------------------------------------------------

export async function syncSDRToSupabase(sdr: SDR) {
  if (!isSupabaseConfigured()) return { success: false, error: 'Supabase not configured' };
  try {
    const payload = {
      id: sdr.id,
      name: sdr.name,
      agendamentos_count: sdr.agendamentosCount ?? 0,
      efetivacoes_count: sdr.efetivacoesCount ?? 0,
      contas_abertas_count: sdr.contasAbertasCount ?? 0,
      calls_count: sdr.callsCount ?? 0,
      meta_agendamentos: sdr.metaAgendamentos ?? 20,
      meta_efetivacoes: sdr.metaEfetivacoes ?? 10,
      meta_efetivacao_rate: sdr.metaEfetivacaoRate ?? 50,
      meta_contas_abertas: sdr.metaContasAbertas ?? 5,
      active: sdr.active !== false,
      admission_date: sdr.admissionDate || null,
      team: sdr.team || null,
      monthly_records: sdr.monthlyRecords || {},
      promoted_to_assessor: sdr.promotedToAssessor || false,
      promoted_date: sdr.promotedDate || null,
      promoted_assessor_id: sdr.promotedAssessorId || null,
      professional_profile: sdr.professionalProfile || null,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('sdrs')
      .upsert(payload, { onConflict: 'id' });

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error(`Erro ao sincronizar SDR (${sdr.name}):`, error.message);
    return { success: false, error: error.message };
  }
}

export async function deleteSDRFromSupabase(id: string) {
  if (!isSupabaseConfigured()) return { success: false, error: 'Supabase not configured' };
  try {
    const { error } = await supabase
      .from('sdrs')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error(`Erro ao deletar SDR (${id}):`, error.message);
    return { success: false, error: error.message };
  }
}

// ----------------------------------------------------
// 2. ASSESSOR SYNCHRONIZATION HELPERS
// ----------------------------------------------------

export async function syncAssessorToSupabase(assessor: Assessor) {
  if (!isSupabaseConfigured()) return { success: false, error: 'Supabase not configured' };
  try {
    const payload = {
      id: assessor.id,
      name: assessor.name,
      active: assessor.active !== false,
      agenda_link: assessor.agendaLink || null,
      exclusive_sdr_id: assessor.exclusiveSdrId || null,
      exclusive_sdr_ids: assessor.exclusiveSdrIds || [],
      participates_in_rotation: assessor.participatesInRotation !== false,
      team: assessor.team || null,
      captacao_mes: assessor.captacaoMes || 0,
      cross_sell_count: assessor.crossSellCount || 0,
      cross_sell_details: assessor.crossSellDetails || null,
      professional_profile: assessor.professionalProfile || null,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('assessores')
      .upsert(payload, { onConflict: 'id' });

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error(`Erro ao sincronizar Assessor (${assessor.name}):`, error.message);
    return { success: false, error: error.message };
  }
}

export async function deleteAssessorFromSupabase(id: string) {
  if (!isSupabaseConfigured()) return { success: false, error: 'Supabase not configured' };
  try {
    const { error } = await supabase
      .from('assessores')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error(`Erro ao deletar Assessor (${id}):`, error.message);
    return { success: false, error: error.message };
  }
}

// ----------------------------------------------------
// 3. ONE-ON-ONE LOGS SYNCHRONIZATION HELPERS
// ----------------------------------------------------

export async function syncOneOnOneLogToSupabase(log: OneOnOneLog) {
  if (!isSupabaseConfigured()) return { success: false, error: 'Supabase not configured' };
  try {
    const payload = {
      id: log.id,
      sdr_id: log.sdrId,
      sdr_name: log.sdrName,
      leader: log.leader,
      timestamp: log.timestamp,
      status: log.status,
      action_plan: log.actionPlan,
      next_meeting: log.nextMeeting,
      notes: log.notes,
      ai_feedback: log.aiFeedback || null,
      professional_profile: log.professionalProfile || null,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('one_on_one_logs')
      .upsert(payload, { onConflict: 'id' });

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error(`Erro ao sincronizar One-on-One Log (${log.sdrName}):`, error.message);
    return { success: false, error: error.message };
  }
}

export async function deleteOneOnOneLogFromSupabase(id: string) {
  if (!isSupabaseConfigured()) return { success: false, error: 'Supabase not configured' };
  try {
    const { error } = await supabase
      .from('one_on_one_logs')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error(`Erro ao deletar OneOnOneLog (${id}):`, error.message);
    return { success: false, error: error.message };
  }
}

// ----------------------------------------------------
// 4. FETCH DATA FROM SUPABASE FOR HYDRATION
// ----------------------------------------------------

export async function fetchAllDataFromSupabase() {
  if (!isSupabaseConfigured()) return { sdrs: null, assessores: null, oneOnOneLogs: null };
  
  const results: {
    sdrs: SDR[] | null;
    assessores: Assessor[] | null;
    oneOnOneLogs: OneOnOneLog[] | null;
  } = {
    sdrs: null,
    assessores: null,
    oneOnOneLogs: null
  };

  try {
    // Buscar SDRs
    const { data: sdrData, error: sdrError } = await supabase
      .from('sdrs')
      .select('*');
    
    if (!sdrError && sdrData) {
      results.sdrs = sdrData.map((row: any): SDR => ({
        id: row.id,
        name: row.name,
        agendamentosCount: row.agendamentos_count ?? 0,
        efetivacoesCount: row.efetivacoes_count ?? 0,
        contasAbertasCount: row.contas_abertas_count ?? 0,
        callsCount: row.calls_count ?? 0,
        metaAgendamentos: row.meta_agendamentos ?? 20,
        metaEfetivacoes: row.meta_efetivacoes ?? 10,
        metaEfetivacaoRate: row.meta_efetivacao_rate ?? 50,
        metaContasAbertas: row.meta_contas_abertas ?? 5,
        active: row.active !== false,
        admissionDate: row.admission_date ?? undefined,
        team: row.team ?? undefined,
        monthlyRecords: row.monthly_records ?? {},
        promotedToAssessor: row.promoted_to_assessor ?? false,
        promotedDate: row.promoted_date ?? undefined,
        promotedAssessorId: row.promoted_assessor_id ?? undefined,
        professionalProfile: row.professional_profile ?? undefined,
      }));
    } else if (sdrError) {
      console.warn('Erro ao carregar sdrs de Supabase (tabela pode não existir ainda):', sdrError.message);
    }

    // Buscar Assessores
    const { data: assrData, error: assrError } = await supabase
      .from('assessores')
      .select('*');

    if (!assrError && assrData) {
      results.assessores = assrData.map((row: any): Assessor => ({
        id: row.id,
        name: row.name,
        active: row.active !== false,
        agendaLink: row.agenda_link ?? undefined,
        exclusiveSdrId: row.exclusive_sdr_id ?? undefined,
        exclusiveSdrIds: row.exclusive_sdr_ids ?? [],
        participatesInRotation: row.participates_in_rotation !== false,
        team: row.team ?? undefined,
        captacaoMes: row.captacao_mes ?? 0,
        crossSellCount: row.cross_sell_count ?? 0,
        crossSellDetails: row.cross_sell_details ?? undefined,
        professionalProfile: row.professional_profile ?? undefined,
      }));
    } else if (assrError) {
      console.warn('Erro ao carregar assessores de Supabase (tabela pode não existir ainda):', assrError.message);
    }

    // Buscar OneOnOneLogs
    const { data: logsData, error: logsError } = await supabase
      .from('one_on_one_logs')
      .select('*');

    if (!logsError && logsData) {
      results.oneOnOneLogs = logsData.map((row: any): OneOnOneLog => ({
        id: row.id,
        sdrId: row.sdr_id,
        sdrName: row.sdr_name,
        leader: row.leader,
        timestamp: row.timestamp,
        status: row.status,
        actionPlan: row.action_plan,
        nextMeeting: row.next_meeting,
        notes: row.notes,
        aiFeedback: row.ai_feedback ?? undefined,
        professionalProfile: row.professional_profile ?? undefined,
      }));
    } else if (logsError) {
      console.warn('Erro ao carregar one_on_one_logs de Supabase (tabela pode não existir ainda):', logsError.message);
    }
  } catch (err: any) {
    console.error('Falha geral ao conectar ou consultar o Supabase:', err.message);
  }

  return results;
}

// ----------------------------------------------------
// 5. AUTHENTICATION SERVICES ACCESSIBLE TO THE FRONTEND
// ----------------------------------------------------
export async function loginWithSupabase(email: string, pass: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass
    });

    if (error) throw error;
    return { success: true, user: data.user, session: data.session };
  } catch (error: any) {
    console.error('Erro na autenticação via Supabase:', error.message);
    return { success: false, error: error.message };
  }
}
