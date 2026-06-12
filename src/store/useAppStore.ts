import { create } from 'zustand';
import { z } from 'zod';
import { 
  SDR, Assessor, MatchResult, TeamLeader, TeamGoals, AuthUser, SDRMonthlyRecord,
  AuditLog, OneOnOneLog, IntegrationSettings, TeamCampaign, NegocioFechado, NegociosArraySchema
} from '../shared/types';
import { 
  SDRSchema, AssessorSchema, MatchResultSchema, TeamLeaderSchema, TeamGoalsSchema,
  AuditLogSchema, OneOnOneLogSchema, IntegrationSettingsSchema
} from '../shared/types';
import { StorageService } from '../shared/services/storage.service';
import { DateService } from '../shared/services/date.service';
import { INITIAL_SDRS, INITIAL_ASSESSORES, INITIAL_NEGOCIOS } from '../mockData';
import { generateMatches as runMatchingAlgo } from '../matchingEngine';
import { IntegrationService } from '../shared/services/integration.service';
// Removed Supabase in favor of full-stack Neon backend PostgreSQL & local cache endpoints

const SDRsArraySchema = z.array(SDRSchema);
const AssessoresArraySchema = z.array(AssessorSchema);
const MatchesArraySchema = z.array(MatchResultSchema);
const LeadersArraySchema = z.array(TeamLeaderSchema);
const AuditLogsArraySchema = z.array(AuditLogSchema);
const OneOnOneLogsArraySchema = z.array(OneOnOneLogSchema);

const DEFAULT_LEADERS: TeamLeader[] = [
  { id: 'leader-caio', teamName: 'Equipe do Caio', leaderTitle: 'Líder de Estratégia Caio', passcode: 'VMB', name: 'Caio' },
  { id: 'leader-1', teamName: 'Equipe Alpha', leaderTitle: 'Líder de Contas Alpha', passcode: 'alpha123', name: 'Gestor Alpha' },
  { id: 'leader-2', teamName: 'Equipe Beta', leaderTitle: 'Gestor Comercial Beta', passcode: 'beta123', name: 'Gestor Beta' },
  { id: 'leader-3', teamName: 'Equipe Delta', leaderTitle: 'Diretor de Expansão Delta', passcode: 'delta123', name: 'Gestor Delta' }
];

const DEFAULT_GOALS: TeamGoals = { agendamentos: 150, efetivacoes: 80, contasAbertas: 35 };
const DEFAULT_TEAMS = ['Equipe do Caio', 'Equipe Alpha', 'Equipe Beta', 'Equipe Delta'];

// Zustand State Definition
interface AppState {
  currentUser: AuthUser | null;
  activeTab: 'matches' | 'sdrs' | 'assessores' | 'leaders' | 'reports' | 'leaders-admin';
  currentMonth: string;
  sdrs: SDR[];
  assessores: Assessor[];
  matches: MatchResult[];
  temporaryMatches: MatchResult[];
  auditLogs: AuditLog[];
  oneOnOneLogs: OneOnOneLog[];
  integrationSettings: IntegrationSettings;
  startDate: string;
  endDate: string;
  leaders: TeamLeader[];
  teamGoals: TeamGoals;
  teams: string[];
  campaigns: TeamCampaign[];
  negocios: NegocioFechado[];

  // Auth Operations
  setCurrentUser: (user: AuthUser | null) => void;
  setActiveTab: (tab: AppState['activeTab']) => void;
  setCurrentMonth: (month: string) => void;
  updateStartDate: (date: string) => void;
  updateEndDate: (date: string) => void;
  
  // Teams Operations
  addTeam: (teamName: string) => void;
  deleteTeam: (teamName: string) => void;
  renameTeam: (oldName: string, newName: string) => void;

  // SDR Operations
  addSDR: (sdr: Omit<SDR, 'id'>) => void;
  deleteSDR: (id: string) => void;
  toggleActiveSDR: (id: string) => void;
  updateSDRMetrics: (id: string, agendamentosCount: number, efetivacoesCount: number) => void;
  updateSDR: (id: string, fields: Partial<SDR>) => void;
  revertPromotion: (id: string) => void;

  // Assessor Operations
  addAssessor: (assessor: Omit<Assessor, 'id'>) => void;
  deleteAssessor: (id: string) => void;
  toggleActiveAssessor: (id: string) => void;
  updateAssessor: (id: string, fields: Partial<Assessor>) => void;

  // Matching operations
  generateMatches: (shuffle?: boolean, savePermanently?: boolean) => void;
  consolidateMatches: (leaderName: string) => Promise<{ success: boolean; message: string }>;
  clearTemporaryMatches: () => void;
  updateMatchDates: (sdrId: string, assessorId: string, startDate: string, endDate: string) => void;
  updateMatchAssessor: (sdrId: string, oldAssessorId: string, newAssessorId: string, newAssessorName: string) => void;
  addManualMatch: (match: MatchResult) => void;
  deleteMatch: (sdrId: string, assessorId: string) => void;

  // Leader operations
  addLeader: (leader: Omit<TeamLeader, 'id'>) => void;
  updateLeader: (id: string, fields: Partial<TeamLeader>) => void;
  deleteLeader: (id: string) => void;

  // Config Goal structure
  updateTeamGoals: (goals: TeamGoals) => void;
  resetToDefaults: () => void;

  // Audit Logs Operations
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp' | 'totalScore'>) => Promise<{ success: boolean; message: string }>;
  
  // One-on-One operations
  addOneOnOneLog: (log: Omit<OneOnOneLog, 'id' | 'timestamp'>) => Promise<{ success: boolean; message: string }>;
  deleteOneOnOneLog: (id: string) => void;

  // Integration operational control
  updateIntegrationSettings: (fields: Partial<IntegrationSettings>) => void;

  // Campaign Operations
  addCampaign: (campaign: Omit<TeamCampaign, 'id'>) => void;
  deleteCampaign: (id: string) => void;
  updateCampaignStatus: (id: string, status: TeamCampaign['status']) => void;

  // Negocios Operations
  addNegocio: (negocio: Omit<NegocioFechado, 'id'>) => void;
  deleteNegocio: (id: string) => void;
  updateNegocio: (id: string, fields: Partial<NegocioFechado>) => void;

  // Rotation visibility setting to make matches optional per leader
  disabledRotationTeams: string[];
  toggleRotationForTeam: (teamName: string) => void;
  syncFromSupabase: () => Promise<{ success: boolean; message: string }>;
  syncFromDatabase: () => Promise<{ success: boolean; message: string }>;
  saveToServer: () => Promise<{ success: boolean; message: string; savedToDb?: boolean }>;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: (() => {
    const raw = localStorage.getItem('rodizio_logged_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  })(),
  activeTab: (() => {
    const raw = localStorage.getItem('rodizio_logged_user');
    if (raw) {
      try {
        const user = JSON.parse(raw);
        if (user && user.role === 'leader') return 'sdrs' as AppState['activeTab'];
      } catch {}
    }
    return 'sdrs' as AppState['activeTab'];
  })(),
  currentMonth: (() => {
    const today = new Date();
    const currentMonthDefault = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    return StorageService.get('rodizio_current_month', currentMonthDefault);
  })(),
  sdrs: StorageService.getValidated('rodizio_sdrs', SDRsArraySchema, INITIAL_SDRS) as SDR[],
  assessores: StorageService.getValidated('rodizio_assessores', AssessoresArraySchema, INITIAL_ASSESSORES) as Assessor[],
  matches: StorageService.getValidated('rodizio_matches', MatchesArraySchema, []) as MatchResult[],
  temporaryMatches: StorageService.getValidated('rodizio_matches', MatchesArraySchema, []) as MatchResult[],
  auditLogs: StorageService.getValidated('rodizio_audit_logs', AuditLogsArraySchema, []) as AuditLog[],
  oneOnOneLogs: StorageService.getValidated('rodizio_one_on_one_logs', OneOnOneLogsArraySchema, []) as OneOnOneLog[],
  integrationSettings: StorageService.getValidated('rodizio_integration_settings', IntegrationSettingsSchema, {
    webhookUrl: '',
    lastSendStatus: 'none',
    lastSendHttpStatus: null,
    lastSendTimestamp: null,
    enabled: true
  }) as IntegrationSettings,
  startDate: (() => {
    const today = new Date();
    const currentMonthDefault = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const bounds = DateService.getMonthBounds(currentMonthDefault);
    return StorageService.get('rodizio_start_date', bounds.startDate);
  })(),
  endDate: (() => {
    const today = new Date();
    const currentMonthDefault = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const bounds = DateService.getMonthBounds(currentMonthDefault);
    return StorageService.get('rodizio_end_date', bounds.endDate);
  })(),
  leaders: StorageService.getValidated('rodizio_leaders', LeadersArraySchema, DEFAULT_LEADERS) as TeamLeader[],
  teamGoals: StorageService.getValidated('rodizio_team_goals', TeamGoalsSchema, DEFAULT_GOALS) as TeamGoals,
  teams: (() => {
    try {
      const saved = localStorage.getItem('rodizio_teams');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_TEAMS;
  })(),
  campaigns: (() => {
    try {
      const saved = localStorage.getItem('rodizio_campaigns');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  })() as TeamCampaign[],
  negocios: StorageService.getValidated('rodizio_negocios', NegociosArraySchema, INITIAL_NEGOCIOS) as NegocioFechado[],
  disabledRotationTeams: (() => {
    try {
      const saved = localStorage.getItem('rodizio_disabled_rotation_teams');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  })(),

  // Actions
  setCurrentUser: (user) => {
    set({ currentUser: user });
    StorageService.set('rodizio_logged_user', user);
    if (!user) {
      set({ activeTab: 'sdrs' });
    } else if (user.role === 'leader') {
      set({ activeTab: 'sdrs' });
    }
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  setCurrentMonth: (month) => {
    const bounds = DateService.getMonthBounds(month);
    const { sdrs, currentMonth: previousMonth } = get();
    
    const nextSdrs = sdrs.map(s => {
      const records = { ...(s.monthlyRecords || {}) } as Record<string, SDRMonthlyRecord>;
      
      // 1. Back up previous month's active metrics
      if (previousMonth) {
        records[previousMonth] = {
          agendamentosCount: s.agendamentosCount || 0,
          efetivacoesCount: s.efetivacoesCount || 0,
          contasAbertasCount: s.contasAbertasCount || 0,
          callsCount: s.callsCount || 0,
          metaAgendamentos: s.metaAgendamentos || 20,
          metaEfetivacaoRate: s.metaEfetivacaoRate || 50,
          metaEfetivacoes: s.metaEfetivacoes || 10,
          metaContasAbertas: s.metaContasAbertas || 5,
        };
      }

      // 2. Load target record or initialize a blank one with zero counts
      const targetRecord = records[month] || {
        agendamentosCount: 0,
        efetivacoesCount: 0,
        contasAbertasCount: 0,
        callsCount: 0,
        metaAgendamentos: s.metaAgendamentos || 20,
        metaEfetivacaoRate: s.metaEfetivacaoRate || 50,
        metaEfetivacoes: s.metaEfetivacoes || 10,
        metaContasAbertas: s.metaContasAbertas || 5,
      };

      return {
        ...s,
        agendamentosCount: targetRecord.agendamentosCount,
        efetivacoesCount: targetRecord.efetivacoesCount,
        contasAbertasCount: targetRecord.contasAbertasCount || 0,
        callsCount: targetRecord.callsCount || 0,
        metaAgendamentos: targetRecord.metaAgendamentos,
        metaEfetivacaoRate: targetRecord.metaEfetivacaoRate || 50,
        metaEfetivacoes: targetRecord.metaEfetivacoes || 10,
        metaContasAbertas: targetRecord.metaContasAbertas || 5,
        monthlyRecords: {
          ...records,
          [month]: targetRecord,
        }
      };
    });

    set({ 
      currentMonth: month,
      startDate: bounds.startDate,
      endDate: bounds.endDate,
      sdrs: nextSdrs
    });

    StorageService.set('rodizio_current_month', month);
    StorageService.set('rodizio_sdrs', nextSdrs);
    StorageService.set('rodizio_start_date', bounds.startDate);
    StorageService.set('rodizio_end_date', bounds.endDate);

    get().saveToServer();
  },

  updateStartDate: (start) => {
    const calculatedEnd = DateService.calculateEndPeriod(start);
    set({ startDate: start, endDate: calculatedEnd });
    StorageService.set('rodizio_start_date', start);
    StorageService.set('rodizio_end_date', calculatedEnd);
  },

  updateEndDate: (end) => {
    set({ endDate: end });
    StorageService.set('rodizio_end_date', end);
  },

  addTeam: (teamName) => {
    const trimmed = teamName.trim();
    if (!trimmed) return;
    const { teams } = get();
    if (teams.includes(trimmed)) return;
    const nextTeams = [...teams, trimmed];
    set({ teams: nextTeams });
    StorageService.set('rodizio_teams', nextTeams);
  },

  deleteTeam: (teamName) => {
    const nextTeams = get().teams.filter(t => t !== teamName);
    const nextSdrs = get().sdrs.map(s => s.team === teamName ? { ...s, team: "" } : s);
    const nextAssessores = get().assessores.map(a => a.team === teamName ? { ...a, team: "" } : a);
    const nextLeaders = get().leaders.map(l => l.teamName === teamName ? { ...l, teamName: "" } : l);

    set({ teams: nextTeams, sdrs: nextSdrs, assessores: nextAssessores, leaders: nextLeaders });
    StorageService.set('rodizio_teams', nextTeams);
    StorageService.set('rodizio_sdrs', nextSdrs);
    StorageService.set('rodizio_assessores', nextAssessores);
    StorageService.set('rodizio_leaders', nextLeaders);
  },

  renameTeam: (oldName, newName) => {
    const trimmed = newName.trim();
    if (!trimmed || oldName === trimmed) return;
    
    const nextTeams = get().teams.map(t => t === oldName ? trimmed : t);
    const nextSdrs = get().sdrs.map(s => s.team === oldName ? { ...s, team: trimmed } : s);
    const nextAssessores = get().assessores.map(a => a.team === oldName ? { ...a, team: trimmed } : a);
    const nextLeaders = get().leaders.map(l => l.teamName === oldName ? { ...l, teamName: trimmed } : l);

    set({ teams: nextTeams, sdrs: nextSdrs, assessores: nextAssessores, leaders: nextLeaders });
    StorageService.set('rodizio_teams', nextTeams);
    StorageService.set('rodizio_sdrs', nextSdrs);
    StorageService.set('rodizio_assessores', nextAssessores);
    StorageService.set('rodizio_leaders', nextLeaders);
  },

  toggleRotationForTeam: (teamName) => {
    if (!teamName) return;
    const { disabledRotationTeams } = get();
    const nextList = disabledRotationTeams.includes(teamName)
      ? disabledRotationTeams.filter(t => t !== teamName)
      : [...disabledRotationTeams, teamName];
    set({ disabledRotationTeams: nextList });
    StorageService.set('rodizio_disabled_rotation_teams', nextList);
    get().saveToServer();
  },

  syncFromSupabase: async () => {
    return get().syncFromDatabase();
  },

  syncFromDatabase: async () => {
    try {
      console.log("[useAppStore] Hydrating from full-stack service endpoints...");
      const res = await fetch("/api/db/load");
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      const data = await res.json();
      
      const updates: Partial<AppState> = {};
      const parts: string[] = [];
      
      if (data.sdrs && Array.isArray(data.sdrs)) {
        updates.sdrs = data.sdrs;
        StorageService.set('rodizio_sdrs', data.sdrs);
        parts.push(`SDRs (${data.sdrs.length})`);
      }
      if (data.assessores && Array.isArray(data.assessores)) {
        updates.assessores = data.assessores;
        StorageService.set('rodizio_assessores', data.assessores);
        parts.push(`Assessores (${data.assessores.length})`);
      }
      if (data.oneOnOneLogs && Array.isArray(data.oneOnOneLogs)) {
        updates.oneOnOneLogs = data.oneOnOneLogs;
        StorageService.set('rodizio_one_on_one_logs', data.oneOnOneLogs);
        parts.push(`Sessões 1:1 (${data.oneOnOneLogs.length})`);
      }
      if (data.negocios && Array.isArray(data.negocios)) {
        updates.negocios = data.negocios;
        StorageService.set('rodizio_negocios', data.negocios);
        parts.push(`Negócios (${data.negocios.length})`);
      }
      if (data.matches && Array.isArray(data.matches)) {
        updates.matches = data.matches;
        updates.temporaryMatches = data.matches;
        StorageService.set('rodizio_matches', data.matches);
      }
      if (data.campaigns && Array.isArray(data.campaigns)) {
        updates.campaigns = data.campaigns;
        localStorage.setItem('rodizio_campaigns', JSON.stringify(data.campaigns));
      }
      if (data.leaders && Array.isArray(data.leaders)) {
        updates.leaders = data.leaders;
        StorageService.set('rodizio_leaders', data.leaders);
      }
      if (data.teamGoals) {
        updates.teamGoals = data.teamGoals;
        StorageService.set('rodizio_team_goals', data.teamGoals);
      }
      if (data.disabledRotationTeams && Array.isArray(data.disabledRotationTeams)) {
        updates.disabledRotationTeams = data.disabledRotationTeams;
        localStorage.setItem('rodizio_disabled_rotation_teams', JSON.stringify(data.disabledRotationTeams));
      }

      if (Object.keys(updates).length > 0) {
        set(updates);
      }

      if (parts.length > 0) {
        const sourceFormatted = data.source === "database" ? "Nuvem Neon PostgreSQL" : "Cache Local de Servidor";
        return { 
          success: true, 
          message: `Dados sincronizados (${sourceFormatted}): ${parts.join(', ')}` 
        };
      }
      
      const sourceFormatted = data.source === "database" ? "Nuvem Neon PostgreSQL" : "Cache Local de Servidor";
      return { 
        success: true, 
        message: `Conectado à fonte (${sourceFormatted}) com sucesso. Painel operacional carregado.` 
      };
    } catch (error: any) {
      console.error('[useAppStore] Erro ao carregar dados do servidor:', error.message);
      return { success: false, message: `Falha na sincronização remota: ${error.message}` };
    }
  },

  saveToServer: async () => {
    const { 
      sdrs, 
      assessores, 
      oneOnOneLogs, 
      matches, 
      campaigns, 
      leaders, 
      teamGoals, 
      disabledRotationTeams,
      negocios
    } = get();
    
    try {
      const res = await fetch("/api/db/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sdrs,
          assessores,
          oneOnOneLogs,
          matches,
          campaigns,
          leaders,
          teamGoals,
          disabledRotationTeams,
          negocios
        })
      });
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      const data = await res.json();
      return { success: true, message: data.message, savedToDb: data.savedToDb };
    } catch (err: any) {
      console.error("[useAppStore] Erro ao sincronizar estado com o servidor:", err.message);
      return { success: false, message: err.message };
    }
  },

  addSDR: (newSdr) => {
    const { currentMonth, sdrs } = get();
    const sdrId = `sdr-${Date.now()}`;
    const sdr: SDR = {
      ...newSdr,
      id: sdrId,
      agendamentosCount: typeof newSdr.agendamentosCount === 'number' && !isNaN(newSdr.agendamentosCount) ? newSdr.agendamentosCount : 0,
      efetivacoesCount: typeof newSdr.efetivacoesCount === 'number' && !isNaN(newSdr.efetivacoesCount) ? newSdr.efetivacoesCount : 0,
      contasAbertasCount: typeof newSdr.contasAbertasCount === 'number' && !isNaN(newSdr.contasAbertasCount) ? newSdr.contasAbertasCount : 0,
      callsCount: typeof newSdr.callsCount === 'number' && !isNaN(newSdr.callsCount) ? newSdr.callsCount : 0,
      metaAgendamentos: typeof newSdr.metaAgendamentos === 'number' && !isNaN(newSdr.metaAgendamentos) ? newSdr.metaAgendamentos : 20,
      metaEfetivacaoRate: typeof newSdr.metaEfetivacaoRate === 'number' && !isNaN(newSdr.metaEfetivacaoRate) ? newSdr.metaEfetivacaoRate : 50,
      metaEfetivacoes: typeof newSdr.metaEfetivacoes === 'number' && !isNaN(newSdr.metaEfetivacoes) ? newSdr.metaEfetivacoes : 10,
      metaContasAbertas: typeof newSdr.metaContasAbertas === 'number' && !isNaN(newSdr.metaContasAbertas) ? newSdr.metaContasAbertas : 5,
      active: newSdr.active !== false,
      monthlyRecords: {
        [currentMonth]: {
          agendamentosCount: typeof newSdr.agendamentosCount === 'number' && !isNaN(newSdr.agendamentosCount) ? newSdr.agendamentosCount : 0,
          efetivacoesCount: typeof newSdr.efetivacoesCount === 'number' && !isNaN(newSdr.efetivacoesCount) ? newSdr.efetivacoesCount : 0,
          contasAbertasCount: typeof newSdr.contasAbertasCount === 'number' && !isNaN(newSdr.contasAbertasCount) ? newSdr.contasAbertasCount : 0,
          callsCount: typeof newSdr.callsCount === 'number' && !isNaN(newSdr.callsCount) ? newSdr.callsCount : 0,
          metaAgendamentos: typeof newSdr.metaAgendamentos === 'number' && !isNaN(newSdr.metaAgendamentos) ? newSdr.metaAgendamentos : 20,
          metaEfetivacaoRate: typeof newSdr.metaEfetivacaoRate === 'number' && !isNaN(newSdr.metaEfetivacaoRate) ? newSdr.metaEfetivacaoRate : 50,
          metaEfetivacoes: typeof newSdr.metaEfetivacoes === 'number' && !isNaN(newSdr.metaEfetivacoes) ? newSdr.metaEfetivacoes : 10,
          metaContasAbertas: typeof newSdr.metaContasAbertas === 'number' && !isNaN(newSdr.metaContasAbertas) ? newSdr.metaContasAbertas : 5,
        }
      }
    };

    const nextSdrs = [...sdrs, sdr];
    set({ sdrs: nextSdrs });
    StorageService.set('rodizio_sdrs', nextSdrs);
    get().saveToServer();
  },

  deleteSDR: (id) => {
    const nextSdrs = get().sdrs.filter(s => s.id !== id);
    const nextMatches = get().matches.filter(m => m.sdrId !== id);
    set({ sdrs: nextSdrs, matches: nextMatches });
    StorageService.set('rodizio_sdrs', nextSdrs);
    StorageService.set('rodizio_matches', nextMatches);
    get().saveToServer();
  },

  toggleActiveSDR: (id) => {
    const nextSdrs = get().sdrs.map(s => s.id === id ? { ...s, active: !s.active } : s);
    set({ sdrs: nextSdrs });
    StorageService.set('rodizio_sdrs', nextSdrs);
    get().saveToServer();
  },

  updateSDRMetrics: (id, agendamentosCount, efetivacoesCount) => {
    const { currentMonth } = get();
    const nextSdrs = get().sdrs.map(s => {
      if (s.id !== id) return s;
      const records = (s.monthlyRecords || {}) as Record<string, SDRMonthlyRecord>;
      const existing = records[currentMonth] || {
        agendamentosCount: 0,
        efetivacoesCount: 0,
        contasAbertasCount: 0,
        callsCount: 0,
        metaAgendamentos: s.metaAgendamentos || 20,
        metaEfetivacaoRate: s.metaEfetivacaoRate || 50,
        metaEfetivacoes: s.metaEfetivacoes || 10,
        metaContasAbertas: s.metaContasAbertas || 5,
      };

      return {
        ...s,
        agendamentosCount, // fallback
        efetivacoesCount, // fallback
        monthlyRecords: {
          ...records,
          [currentMonth]: {
            ...existing,
            agendamentosCount,
            efetivacoesCount
          }
        }
      };
    });
    set({ sdrs: nextSdrs });
    StorageService.set('rodizio_sdrs', nextSdrs);
    get().saveToServer();
  },

  updateSDR: (id, updatedFields) => {
    const { currentMonth } = get();
    const nextSdrs = get().sdrs.map(s => {
      if (s.id !== id) return s;
      const records = (s.monthlyRecords || {}) as Record<string, SDRMonthlyRecord>;
      const existing = records[currentMonth] || {
        agendamentosCount: 0,
        efetivacoesCount: 0,
        contasAbertasCount: 0,
        callsCount: 0,
        metaAgendamentos: s.metaAgendamentos || 20,
        metaEfetivacaoRate: s.metaEfetivacaoRate || 50,
        metaEfetivacoes: s.metaEfetivacoes || 10,
        metaContasAbertas: s.metaContasAbertas || 5,
      };

      const updatedRecord = { ...existing } as SDRMonthlyRecord;
      if (typeof updatedFields.agendamentosCount === 'number') updatedRecord.agendamentosCount = updatedFields.agendamentosCount;
      if (typeof updatedFields.efetivacoesCount === 'number') updatedRecord.efetivacoesCount = updatedFields.efetivacoesCount;
      if (typeof updatedFields.contasAbertasCount === 'number') updatedRecord.contasAbertasCount = updatedFields.contasAbertasCount;
      if (typeof updatedFields.callsCount === 'number') updatedRecord.callsCount = updatedFields.callsCount;
      if (typeof updatedFields.metaAgendamentos === 'number') updatedRecord.metaAgendamentos = updatedFields.metaAgendamentos;
      if (typeof updatedFields.metaEfetivacaoRate === 'number') updatedRecord.metaEfetivacaoRate = updatedFields.metaEfetivacaoRate;
      if (typeof updatedFields.metaEfetivacoes === 'number') updatedRecord.metaEfetivacoes = updatedFields.metaEfetivacoes;
      if (typeof updatedFields.metaContasAbertas === 'number') updatedRecord.metaContasAbertas = updatedFields.metaContasAbertas;

      return {
        ...s,
        ...updatedFields,
        monthlyRecords: {
          ...records,
          [currentMonth]: updatedRecord
        }
      };
    });
    set({ sdrs: nextSdrs });
    StorageService.set('rodizio_sdrs', nextSdrs);
    get().saveToServer();
  },

  revertPromotion: (sdrId) => {
    const nextSdrs = get().sdrs.map(s => {
      if (s.id !== sdrId) return s;
      return {
        ...s,
        promotedToAssessor: false,
        active: true,
        promotedDate: undefined,
        promotedAssessorId: undefined
      };
    });
    const nextAssessores = get().assessores.filter(a => a.exclusiveSdrId !== sdrId);
    const nextMatches = get().matches.filter(m => m.sdrId !== sdrId);

    set({ sdrs: nextSdrs, assessores: nextAssessores, matches: nextMatches });
    StorageService.set('rodizio_sdrs', nextSdrs);
    StorageService.set('rodizio_assessores', nextAssessores);
    StorageService.set('rodizio_matches', nextMatches);
    get().saveToServer();
  },

  addAssessor: (newAssr) => {
    const assessor: Assessor = {
      ...newAssr,
      id: `assr-${Date.now()}`,
      active: newAssr.active !== false,
      exclusiveSdrIds: Array.isArray(newAssr.exclusiveSdrIds) ? newAssr.exclusiveSdrIds : [],
      participatesInRotation: newAssr.participatesInRotation !== false,
    };
    const nextAssessores = [...get().assessores, assessor];
    set({ assessores: nextAssessores });
    StorageService.set('rodizio_assessores', nextAssessores);
    get().saveToServer();
  },

  deleteAssessor: (id) => {
    const nextAssessores = get().assessores.filter(a => a.id !== id);
    const nextMatches = get().matches.filter(m => m.assessorId !== id);
    set({ assessores: nextAssessores, matches: nextMatches });
    StorageService.set('rodizio_assessores', nextAssessores);
    StorageService.set('rodizio_matches', nextMatches);
    get().saveToServer();
  },

  toggleActiveAssessor: (id) => {
    const nextAssessores = get().assessores.map(a => a.id === id ? { ...a, active: !a.active } : a);
    set({ assessores: nextAssessores });
    StorageService.set('rodizio_assessores', nextAssessores);
    get().saveToServer();
  },

  updateAssessor: (id, updatedFields) => {
    const nextAssessores = get().assessores.map(a => a.id === id ? { ...a, ...updatedFields } : a);
    set({ assessores: nextAssessores });
    StorageService.set('rodizio_assessores', nextAssessores);
    get().saveToServer();
  },

  generateMatches: (shuffle = false, savePermanently = true) => {
    const { sdrs, assessores, currentMonth, startDate, endDate, integrationSettings, currentUser } = get();
    
    // Filter by team if logged-in user is a leader
    let teamSdrs = sdrs;
    let teamAssessores = assessores;
    if (currentUser && currentUser.role !== 'admin' && currentUser.teamName) {
      teamSdrs = sdrs.filter(s => s.team === currentUser.teamName);
      teamAssessores = assessores.filter(a => a.team === currentUser.teamName);
    }

    // Normalization calculations for active month to pass into generateMatches
    const derivedActiveSdrs = teamSdrs.map((sdr: SDR): SDR => {
      const record = (sdr.monthlyRecords as Record<string, SDRMonthlyRecord> | undefined)?.[currentMonth];
      return {
        ...sdr,
        agendamentosCount: record ? (record.agendamentosCount ?? 0) : 0,
        efetivacoesCount: record ? (record.efetivacoesCount ?? 0) : 0,
        contasAbertasCount: record ? (record.contasAbertasCount ?? 0) : 0,
        callsCount: record ? (record.callsCount ?? 0) : 0,
        metaAgendamentos: record ? (record.metaAgendamentos ?? 20) : (sdr.metaAgendamentos ?? 20),
        metaEfetivacaoRate: record ? (record.metaEfetivacaoRate ?? 50) : (sdr.metaEfetivacaoRate ?? 50),
      };
    });

    const relations = runMatchingAlgo(derivedActiveSdrs, teamAssessores, shuffle);
    const matchesWithDates = relations.map(r => ({
      ...r,
      startDate: r.startDate || startDate,
      endDate: r.endDate || endDate,
    }));
    
    if (savePermanently) {
      set({ matches: matchesWithDates, temporaryMatches: matchesWithDates });
      StorageService.set('rodizio_matches', matchesWithDates);
      get().saveToServer();
      
      const leaderName = currentUser?.name || 'Administrador';
      const timestamp = new Date().toISOString();
      IntegrationService.sendMatches(leaderName, matchesWithDates, integrationSettings.webhookUrl).then(response => {
        set({
          integrationSettings: {
            ...get().integrationSettings,
            lastSendStatus: response.success ? 'success' : 'failed',
            lastSendHttpStatus: response.status,
            lastSendTimestamp: timestamp
          }
        });
        StorageService.set('rodizio_integration_settings', get().integrationSettings);
        get().saveToServer();
      });
    } else {
      // Simulation / Temporário
      set({ temporaryMatches: matchesWithDates });
    }
  },

  consolidateMatches: async (leaderName) => {
    const { temporaryMatches, integrationSettings } = get();
    const timestamp = new Date().toISOString();

    set({ matches: temporaryMatches });
    StorageService.set('rodizio_matches', temporaryMatches);
    get().saveToServer();

    const response = await IntegrationService.sendMatches(
      leaderName,
      temporaryMatches,
      integrationSettings.webhookUrl
    );

    set({
      integrationSettings: {
        ...integrationSettings,
        lastSendStatus: response.success ? 'success' : 'failed',
        lastSendHttpStatus: response.status,
        lastSendTimestamp: timestamp
      }
    });
    StorageService.set('rodizio_integration_settings', get().integrationSettings);
    get().saveToServer();

    return response;
  },

  clearTemporaryMatches: () => {
    const { matches } = get();
    set({ temporaryMatches: [...matches] });
  },

  updateMatchDates: (sdrId, assessorId, newStart, newEnd) => {
    const update = (m: MatchResult) => 
      (m.sdrId === sdrId && m.assessorId === assessorId)
        ? { ...m, startDate: newStart, endDate: newEnd }
        : m;

    const nextTempMatches = get().temporaryMatches.map(update);
    const nextMatches = get().matches.map(update);

    set({ temporaryMatches: nextTempMatches, matches: nextMatches });
    StorageService.set('rodizio_matches', nextMatches);
    get().saveToServer();
  },

  updateMatchAssessor: (sdrId, oldAssessorId, newAssessorId, newAssessorName) => {
    const update = (m: MatchResult) => 
      (m.sdrId === sdrId && m.assessorId === oldAssessorId)
        ? { ...m, assessorId: newAssessorId, assessorName: newAssessorName }
        : m;

    const nextTempMatches = get().temporaryMatches.map(update);
    const nextMatches = get().matches.map(update);

    set({ temporaryMatches: nextTempMatches, matches: nextMatches });
    StorageService.set('rodizio_matches', nextMatches);
    get().saveToServer();
  },

  addManualMatch: (match) => {
    // Avoid double entries
    const exists = get().matches.some(m => m.sdrId === match.sdrId && m.assessorId === match.assessorId);
    if (exists) return;

    const nextMatches = [match, ...get().matches];
    const nextTempMatches = [match, ...get().temporaryMatches];

    set({ matches: nextMatches, temporaryMatches: nextTempMatches });
    StorageService.set('rodizio_matches', nextMatches);
    get().saveToServer();
  },

  deleteMatch: (sdrId, assessorId) => {
    const nextMatches = get().matches.filter(m => !(m.sdrId === sdrId && m.assessorId === assessorId));
    const nextTempMatches = get().temporaryMatches.filter(m => !(m.sdrId === sdrId && m.assessorId === assessorId));

    set({ matches: nextMatches, temporaryMatches: nextTempMatches });
    StorageService.set('rodizio_matches', nextMatches);
    get().saveToServer();
  },

  addLeader: (newLeader) => {
    const leader: TeamLeader = {
      ...newLeader,
      id: `leader-${Date.now()}`
    };
    const nextLeaders = [...get().leaders, leader];
    set({ leaders: nextLeaders });
    StorageService.set('rodizio_leaders', nextLeaders);
    get().saveToServer();
  },

  updateLeader: (id, updatedFields) => {
    const nextLeaders = get().leaders.map(l => l.id === id ? { ...l, ...updatedFields } : l);
    set({ leaders: nextLeaders });
    StorageService.set('rodizio_leaders', nextLeaders);
    get().saveToServer();
  },

  deleteLeader: (id) => {
    const nextLeaders = get().leaders.filter(l => l.id !== id);
    set({ leaders: nextLeaders });
    StorageService.set('rodizio_leaders', nextLeaders);
    get().saveToServer();
  },

  updateTeamGoals: (updated) => {
    const nextGoals = { ...get().teamGoals, ...updated };
    set({ teamGoals: nextGoals });
    StorageService.set('rodizio_team_goals', nextGoals);
    get().saveToServer();
  },

  addAuditLog: async (log) => {
    const id = `audit-${Date.now()}`;
    const timestamp = new Date().toISOString();
    const sum = Object.values(log.score).reduce((acc, v) => acc + v, 0);
    const newLog: AuditLog = {
      ...log,
      id,
      timestamp,
      totalScore: sum
    };

    const nextLogs = [newLog, ...get().auditLogs];
    set({ auditLogs: nextLogs });
    StorageService.set('rodizio_audit_logs', nextLogs);

    const settings = get().integrationSettings;
    const response = await IntegrationService.sendAudit(
      log.sdrName,
      log.leader,
      log.score,
      log.notes,
      settings.webhookUrl
    );

    set({
      integrationSettings: {
        ...settings,
        lastSendStatus: response.success ? 'success' : 'failed',
        lastSendHttpStatus: response.status,
        lastSendTimestamp: timestamp
      }
    });
    StorageService.set('rodizio_integration_settings', get().integrationSettings);

    return response;
  },

  addOneOnOneLog: async (log) => {
    const id = `oneone-${Date.now()}`;
    const timestamp = new Date().toISOString();
    const newLog: OneOnOneLog = {
      ...log,
      id,
      timestamp
    };

    const nextLogs = [newLog, ...get().oneOnOneLogs];
    set({ oneOnOneLogs: nextLogs });
    StorageService.set('rodizio_one_on_one_logs', nextLogs);
    get().saveToServer();

    const settings = get().integrationSettings;
    const response = await IntegrationService.sendOneOnOne(
      log.sdrName,
      log.leader,
      log.actionPlan,
      log.notes,
      log.nextMeeting,
      log.status,
      settings.webhookUrl
    );

    set({
      integrationSettings: {
        ...settings,
        lastSendStatus: response.success ? 'success' : 'failed',
        lastSendHttpStatus: response.status,
        lastSendTimestamp: timestamp
      }
    });
    StorageService.set('rodizio_integration_settings', get().integrationSettings);

    return response;
  },

  deleteOneOnOneLog: (id) => {
    const nextLogs = get().oneOnOneLogs.filter(log => log.id !== id);
    set({ oneOnOneLogs: nextLogs });
    StorageService.set('rodizio_one_on_one_logs', nextLogs);
    get().saveToServer();
  },

  updateIntegrationSettings: (fields) => {
    const nextSettings = { ...get().integrationSettings, ...fields };
    set({ integrationSettings: nextSettings });
    StorageService.set('rodizio_integration_settings', nextSettings);
  },

  addCampaign: (newCamp) => {
    const campaign: TeamCampaign = {
      ...newCamp,
      id: `camp-${Date.now()}`
    };
    const nextCampaigns = [...get().campaigns, campaign];
    set({ campaigns: nextCampaigns });
    StorageService.set('rodizio_campaigns', nextCampaigns);
    get().saveToServer();
  },

  deleteCampaign: (id) => {
    const nextCampaigns = get().campaigns.filter(c => c.id !== id);
    set({ campaigns: nextCampaigns });
    StorageService.set('rodizio_campaigns', nextCampaigns);
    get().saveToServer();
  },

  updateCampaignStatus: (id, status) => {
    const nextCampaigns = get().campaigns.map(c => c.id === id ? { ...c, status } : c);
    set({ campaigns: nextCampaigns });
    StorageService.set('rodizio_campaigns', nextCampaigns);
    get().saveToServer();
  },

  addNegocio: (newNeg) => {
    const negocio: NegocioFechado = {
      ...newNeg,
      id: `neg-${Date.now()}`
    };
    const nextNegocios = [negocio, ...get().negocios];
    set({ negocios: nextNegocios });
    StorageService.set('rodizio_negocios', nextNegocios);
    get().saveToServer();
  },

  deleteNegocio: (id) => {
    const nextNegocios = get().negocios.filter(n => n.id !== id);
    set({ negocios: nextNegocios });
    StorageService.set('rodizio_negocios', nextNegocios);
    get().saveToServer();
  },

  updateNegocio: (id, fields) => {
    const nextNegocios = get().negocios.map(n => n.id === id ? { ...n, ...fields } : n);
    set({ negocios: nextNegocios });
    StorageService.set('rodizio_negocios', nextNegocios);
    get().saveToServer();
  },

  resetToDefaults: () => {
    const today = new Date();
    const currentMonthDefault = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const bounds = DateService.getMonthBounds(currentMonthDefault);

    set({
      sdrs: INITIAL_SDRS,
      assessores: INITIAL_ASSESSORES,
      matches: [],
      temporaryMatches: [],
      auditLogs: [],
      oneOnOneLogs: [],
      integrationSettings: {
        webhookUrl: '',
        lastSendStatus: 'none',
        lastSendHttpStatus: null,
        lastSendTimestamp: null,
        enabled: true
      },
      currentMonth: currentMonthDefault,
      startDate: bounds.startDate,
      endDate: bounds.endDate,
      leaders: DEFAULT_LEADERS,
      teamGoals: DEFAULT_GOALS,
      teams: DEFAULT_TEAMS,
      campaigns: [],
      disabledRotationTeams: [],
      negocios: INITIAL_NEGOCIOS
    });
    
    StorageService.set('rodizio_sdrs', INITIAL_SDRS);
    StorageService.set('rodizio_assessores', INITIAL_ASSESSORES);
    StorageService.set('rodizio_matches', []);
    StorageService.set('rodizio_audit_logs', []);
    StorageService.set('rodizio_one_on_one_logs', []);
    StorageService.set('rodizio_integration_settings', {
      webhookUrl: '',
      lastSendStatus: 'none',
      lastSendHttpStatus: null,
      lastSendTimestamp: null,
      enabled: true
    });
    StorageService.set('rodizio_current_month', currentMonthDefault);
    StorageService.set('rodizio_start_date', bounds.startDate);
    StorageService.set('rodizio_end_date', bounds.endDate);
    StorageService.set('rodizio_leaders', DEFAULT_LEADERS);
    StorageService.set('rodizio_team_goals', DEFAULT_GOALS);
    StorageService.set('rodizio_teams', DEFAULT_TEAMS);
    StorageService.set('rodizio_campaigns', []);
    StorageService.set('rodizio_disabled_rotation_teams', []);
    StorageService.set('rodizio_negocios', INITIAL_NEGOCIOS);
  }
}));
export default useAppStore;
