import { create } from 'zustand';
import { z } from 'zod';
import { 
  SDR, Assessor, MatchResult, TeamLeader, TeamGoals, AuthUser, SDRMonthlyRecord,
  AuditLog, OneOnOneLog, IntegrationSettings, TeamCampaign, NegocioFechado, NegociosArraySchema,
  RotationParticipant, RotationHistoryEntry, SystemAuditLog, TimelineEvent, IndividualGoal, PerformanceGoal
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
import { getFilteredMembers, getMemberPerformanceScore, getTeamGoalsForTeam } from '../utils/teamFilters';
// Removed Supabase in favor of full-stack Neon backend PostgreSQL & local cache endpoints

const SDRsArraySchema = z.array(SDRSchema);
const AssessoresArraySchema = z.array(AssessorSchema);
const MatchesArraySchema = z.array(MatchResultSchema);
const LeadersArraySchema = z.array(TeamLeaderSchema);
const AuditLogsArraySchema = z.array(AuditLogSchema);
const OneOnOneLogsArraySchema = z.array(OneOnOneLogSchema);

const DEFAULT_LEADERS: TeamLeader[] = [
  { id: 'leader-pf', teamName: 'PF', leaderTitle: 'Gestor Comercial PF', passcode: 'PF123', name: 'Gestor PF' },
  { id: 'leader-pj', teamName: 'PJ', leaderTitle: 'Gestor Comercial PJ', passcode: 'PJ123', name: 'Gestor PJ' },
  { id: 'leader-advisor', teamName: 'Advisor', leaderTitle: 'Líder Advisor', passcode: 'ADV123', name: 'Gestor Advisor' }
];

const DEFAULT_GOALS: TeamGoals = { 
  agendamentos: 150, 
  efetivacoes: 80, 
  contasAbertas: 35,
  performanceGoals: [
    { id: 'ligacoes', name: 'Ligações', target: 300, weight: 20 },
    { id: 'reunioes', name: 'Reuniões', target: 20, weight: 35 },
    { id: 'comparecimento', name: 'Comparecimento', target: 15, weight: 25 },
    { id: 'indicacoes', name: 'Indicações', target: 10, weight: 20 }
  ],
  wealthDealsGoal: 12,
  wealthRevenueGoal: 1600000
};
const DEFAULT_TEAMS = ['PF', 'PJ', 'Advisor'];

let saveTimeoutId: any = null;

// Zustand State Definition
interface AppState {
  currentUser: AuthUser | null;
  activeTab: 'matches' | 'sdrs' | 'assessores' | 'leaders' | 'reports' | 'relatorios' | 'leaders-admin' | 'membros-ativos' | 'system-audit' | 'plano-metas' | 'central-metas';
  currentMonth: string;
  sdrs: SDR[];
  assessores: Assessor[];
  matches: MatchResult[];
  temporaryMatches: MatchResult[];
  auditLogs: AuditLog[];
  oneOnOneLogs: OneOnOneLog[];
  systemAuditLogs: SystemAuditLog[];
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
  editTeammateProfile: (id: string, wasSdr: boolean, updatedData: {
    name: string;
    team: string;
    admissionDate: string;
    photo?: string;
    professionalProfile: string;
    leaderId?: string;
    liderId?: string;
    metaAgendamentos?: number;
    metaEfetivacoes?: number;
    metaContasAbertas?: number;
    metaLigacoes?: number;
    metaNet?: number;
    metaClientes?: number;
    metaIndicacoes?: number;
    metaCrossSell?: number;
    individualWeights?: {
      ligacoes: number;
      reunioes: number;
      comparecimento: number;
      indicacoes: number;
    };
  }) => void;

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
  getActiveTeamGoals: () => TeamGoals;
  updateTeamGoals: (goals: TeamGoals) => void;
  saveTeamGoalsPlan: (teamName: string, month: string, goals: PerformanceGoal[]) => void;
  saveIndividualMonthlyGoals: (memberId: string, isSdr: boolean, month: string, goals: any[]) => void;
  restoreStandardMonthlyGoals: (memberId: string, isSdr: boolean, month: string) => void;
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

  // Rodizio decouple entities
  rotationParticipants: RotationParticipant[];
  rotationHistoryLogs: RotationHistoryEntry[];
  addRotationParticipantManual: (participant: Omit<RotationParticipant, 'id' | 'cadastroType' | 'createdAt'>) => RotationParticipant;
  updateRotationParticipant: (id: string, fields: Partial<RotationParticipant>) => void;
  associateRotationParticipantWithOfficial: (manualId: string, officialAssessorId: string) => void;
  addRotationHistoryLog: (operation: string, details: string, extra?: { participantId?: string; participantName?: string; sdrId?: string; sdrName?: string }) => void;
  syncRotationParticipants: () => void;

  // Member Management & Architecture actions
  addSystemAuditLog: (log: Omit<SystemAuditLog, 'id' | 'timestamp'>) => void;
  addTimelineEvent: (memberId: string, memberType: 'sdr' | 'assessor' | 'consultor', event: Omit<TimelineEvent, 'id' | 'timestamp'>) => void;
  addIndividualGoal: (memberId: string, memberType: 'sdr' | 'assessor' | 'consultor', goal: Omit<IndividualGoal, 'id' | 'startDate' | 'changedBy' | 'changedAt'>, reason: string) => void;
  updateIndividualGoal: (memberId: string, memberType: 'sdr' | 'assessor' | 'consultor', goalId: string, fields: Partial<IndividualGoal>, reason: string) => void;
  deleteIndividualGoal: (memberId: string, memberType: 'sdr' | 'assessor' | 'consultor', goalId: string, reason: string) => void;
  promoteSDRToAssessor: (sdrId: string, promotionData: { date: string; cargo: 'ASSESSOR' | 'CONSULTOR'; team: string; leaderId: string; reason: string }) => void;
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
        if (user && user.role === 'leader') return 'membros-ativos' as AppState['activeTab'];
      } catch {}
    }
    return 'membros-ativos' as AppState['activeTab'];
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
  systemAuditLogs: StorageService.getValidated('rodizio_system_audit_logs', z.array(z.any()), []) as SystemAuditLog[],
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
  teams: ['PF', 'PJ', 'Advisor'],
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
  rotationParticipants: (() => {
    try {
      const saved = localStorage.getItem('rodizio_rotation_participants');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  })() as RotationParticipant[],
  rotationHistoryLogs: (() => {
    try {
      const saved = localStorage.getItem('rodizio_rotation_history_logs');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  })() as RotationHistoryEntry[],

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
      if (data.systemAuditLogs && Array.isArray(data.systemAuditLogs)) {
        updates.systemAuditLogs = data.systemAuditLogs;
        StorageService.set('rodizio_system_audit_logs', data.systemAuditLogs);
        parts.push(`Logs Auditoria (${data.systemAuditLogs.length})`);
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
      if (data.rotationParticipants && Array.isArray(data.rotationParticipants)) {
        updates.rotationParticipants = data.rotationParticipants;
        localStorage.setItem('rodizio_rotation_participants', JSON.stringify(data.rotationParticipants));
      }
      if (data.rotationHistoryLogs && Array.isArray(data.rotationHistoryLogs)) {
        updates.rotationHistoryLogs = data.rotationHistoryLogs;
        localStorage.setItem('rodizio_rotation_history_logs', JSON.stringify(data.rotationHistoryLogs));
      }
      if (data.leaders && Array.isArray(data.leaders) && data.leaders.length > 0) {
        updates.leaders = data.leaders;
        StorageService.set('rodizio_leaders', data.leaders);
      } else {
        const localCurrent = get().leaders;
        if (!localCurrent || localCurrent.length === 0) {
          updates.leaders = DEFAULT_LEADERS;
          StorageService.set('rodizio_leaders', DEFAULT_LEADERS);
        }
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

      // Sync official members to rotation participants
      get().syncRotationParticipants();

      if (parts.length > 0) {
        const sourceFormatted = data.source === "database" ? "Nuvem Firebase Firestore" : "Cache Local de Servidor";
        return { 
          success: true, 
          message: `Dados sincronizados (${sourceFormatted}): ${parts.join(', ')}` 
        };
      }
      
      const sourceFormatted = data.source === "database" ? "Nuvem Firebase Firestore" : "Cache Local de Servidor";
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
    if (saveTimeoutId) {
      clearTimeout(saveTimeoutId);
    }

    return new Promise((resolve) => {
      saveTimeoutId = setTimeout(async () => {
        const { 
          sdrs, 
          assessores, 
          oneOnOneLogs, 
          matches, 
          campaigns, 
          leaders, 
          teamGoals, 
          disabledRotationTeams,
          negocios,
          rotationParticipants,
          rotationHistoryLogs,
          systemAuditLogs
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
              negocios,
              rotationParticipants,
              rotationHistoryLogs,
              systemAuditLogs
            })
          });
          if (!res.ok) {
            throw new Error(`HTTP error ${res.status}`);
          }
          const data = await res.json();
          resolve({ success: true, message: data.message, savedToDb: data.savedToDb });
        } catch (err: any) {
          console.error("[useAppStore] Erro ao sincronizar estado com o servidor:", err.message);
          resolve({ success: false, message: err.message });
        }
      }, 1000);
    });
  },

  addSDR: (newSdr) => {
    const { currentMonth, sdrs, leaders } = get();
    const sdrId = `sdr-${Date.now()}`;
    const sdrTeam = newSdr.team || newSdr.equipe || '';
    const selectedLeader = leaders.find(l => {
      const normalizedL = l.teamName.toUpperCase();
      const normalizedS = sdrTeam.toUpperCase();
      return normalizedL === normalizedS || normalizedL.includes(normalizedS) || normalizedS.includes(normalizedL);
    });
    const sdr: SDR = {
      ...newSdr,
      id: sdrId,
      cargo: 'SDR',
      team: sdrTeam,
      equipe: sdrTeam,
      liderId: newSdr.liderId || newSdr.leaderId || selectedLeader?.id,
      leaderId: newSdr.liderId || newSdr.leaderId || selectedLeader?.id,
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

      const updatedRecord = {
        ...existing,
        agendamentosCount,
        efetivacoesCount
      };

      let sdrUpdated = {
        ...s,
        agendamentosCount, // fallback
        efetivacoesCount, // fallback
        monthlyRecords: {
          ...records,
          [currentMonth]: updatedRecord
        }
      } as SDR;

      // Update ranking history
      const teamGoals = getTeamGoalsForTeam(sdrUpdated.team, get().teamGoals);
      const { score, rank } = getMemberPerformanceScore(sdrUpdated, teamGoals, currentMonth);
      const history = sdrUpdated.rankingHistory ? [...sdrUpdated.rankingHistory] : [];
      const lastItem = history[history.length - 1];
      const todayDate = new Date().toLocaleDateString('pt-BR');
      if (!lastItem || lastItem.score !== score || lastItem.rank !== rank) {
        history.push({ date: todayDate, score, rank });
      }
      sdrUpdated.rankingHistory = history;

      return sdrUpdated;
    });
    set({ sdrs: nextSdrs });
    StorageService.set('rodizio_sdrs', nextSdrs);
    get().saveToServer();
  },

  updateSDR: (id, updatedFields) => {
    const { currentMonth, leaders } = get();
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

      const sdrTeam = updatedFields.team || updatedFields.equipe || s.team || s.equipe || '';
      const selectedLeader = leaders.find(l => {
        const normalizedL = l.teamName.toUpperCase();
        const normalizedS = sdrTeam.toUpperCase();
        return normalizedL === normalizedS || normalizedL.includes(normalizedS) || normalizedS.includes(normalizedL);
      });
      const leaderId = updatedFields.liderId || updatedFields.leaderId || s.liderId || s.leaderId || selectedLeader?.id;

      let sdrUpdated = {
        ...s,
        ...updatedFields,
        cargo: 'SDR' as const,
        team: sdrTeam,
        equipe: sdrTeam,
        liderId: leaderId,
        leaderId: leaderId,
        monthlyRecords: {
          ...records,
          [currentMonth]: updatedRecord
        }
      } as SDR;

      // Update ranking history
      const teamGoals = getTeamGoalsForTeam(sdrUpdated.team, get().teamGoals);
      const { score, rank } = getMemberPerformanceScore(sdrUpdated, teamGoals, currentMonth);
      const history = sdrUpdated.rankingHistory ? [...sdrUpdated.rankingHistory] : [];
      const lastItem = history[history.length - 1];
      const todayDate = new Date().toLocaleDateString('pt-BR');
      if (!lastItem || lastItem.score !== score || lastItem.rank !== rank) {
        history.push({ date: todayDate, score, rank });
      }
      sdrUpdated.rankingHistory = history;

      const oldTeam = s.team || s.equipe;
      const newTeam = sdrUpdated.team || sdrUpdated.equipe;
      const oldLeader = s.liderId || s.leaderId;
      const newLeader = sdrUpdated.liderId || sdrUpdated.leaderId;

      if ((oldTeam && newTeam && oldTeam !== newTeam) || (oldLeader && newLeader && oldLeader !== newLeader)) {
        const oldLeaderName = leaders.find(l => l.id === oldLeader)?.name || 'Desconhecido';
        const newLeaderName = leaders.find(l => l.id === newLeader)?.name || 'Desconhecido';
        
        const changeEvent: TimelineEvent = {
          id: `tl-ch-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'team_change',
          title: 'Mudança de Equipe / Líder',
          description: `Transferido de ${oldTeam} (${oldLeaderName}) para ${newTeam} (${newLeaderName}).`,
          user: get().currentUser?.name || 'Administrador',
          oldValue: `${oldTeam} (${oldLeaderName})`,
          newValue: `${newTeam} (${newLeaderName})`
        };

        sdrUpdated.timeline = [changeEvent, ...(sdrUpdated.timeline || [])];

        get().addSystemAuditLog({
          user: get().currentUser?.name || 'Administrador',
          operation: 'MUDANÇA_EQUIPE',
          targetId: id,
          targetName: s.name,
          previousValue: `${oldTeam} (${oldLeaderName})`,
          newValue: `${newTeam} (${newLeaderName})`,
          reason: 'Movimentação estrutural de equipe'
        });
      }

      return sdrUpdated;
    });
    set({ sdrs: nextSdrs });
    StorageService.set('rodizio_sdrs', nextSdrs);
    get().saveToServer();
  },

  revertPromotion: (sdrId) => {
    const { currentUser } = get();
    const userName = currentUser?.name || 'Administrador';
    const sdr = get().sdrs.find(s => s.id === sdrId);
    const sdrName = sdr ? sdr.name : '';
    const promotedAssrId = sdr?.promotedAssessorId;

    const nextSdrs = get().sdrs.map(s => {
      if (s.id !== sdrId) return s;
      
      const revertTimelineEvent: TimelineEvent = {
        id: `tl-revert-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'role_change',
        title: 'Promoção Revertida',
        description: `Promoção para assessoria revertida. Cargo restaurado para SDR Ativo.`,
        user: userName,
      };

      return {
        ...s,
        promotedToAssessor: false,
        active: true,
        promotedDate: undefined,
        promotedAssessorId: undefined,
        timeline: [revertTimelineEvent, ...(s.timeline || [])]
      };
    });

    const nextAssessores = get().assessores.filter(a => 
      a.id !== promotedAssrId &&
      a.exclusiveSdrId !== sdrId && 
      (!a.exclusiveSdrIds || !a.exclusiveSdrIds.includes(sdrId)) &&
      (!sdrName || a.name !== sdrName)
    );
    const nextMatches = get().matches.filter(m => m.sdrId !== sdrId);

    set({ sdrs: nextSdrs, assessores: nextAssessores, matches: nextMatches });
    StorageService.set('rodizio_sdrs', nextSdrs);
    StorageService.set('rodizio_assessores', nextAssessores);
    StorageService.set('rodizio_matches', nextMatches);

    get().addSystemAuditLog({
      user: userName,
      operation: 'REVERSAO_PROMOÇÃO_SDR',
      targetId: sdrId,
      targetName: sdrName,
      previousValue: `Cargo: Assessor (Promovido)`,
      newValue: 'Cargo: SDR Ativo',
      reason: 'Correção de promoção realizada por engano / reversão operacional'
    });
  },

  addAssessor: (newAssr) => {
    const { leaders } = get();
    const assrTeam = newAssr.team || newAssr.equipe || '';
    const selectedLeader = leaders.find(l => {
      const normalizedL = l.teamName.toUpperCase();
      const normalizedS = assrTeam.toUpperCase();
      return normalizedL === normalizedS || normalizedL.includes(normalizedS) || normalizedS.includes(normalizedL);
    });
    const leaderId = newAssr.liderId || newAssr.leaderId || selectedLeader?.id;
    const leaderName = newAssr.leaderName || selectedLeader?.name;
    const cargoType: 'ASSESSOR' | 'CONSULTOR' = newAssr.roleType === 'consultor' || newAssr.cargo === 'CONSULTOR' ? 'CONSULTOR' : 'ASSESSOR';

    const assessor: Assessor = {
      ...newAssr,
      id: `assr-${Date.now()}`,
      active: newAssr.active !== false,
      exclusiveSdrIds: Array.isArray(newAssr.exclusiveSdrIds) ? newAssr.exclusiveSdrIds : [],
      participatesInRotation: newAssr.participatesInRotation !== false,
      cargo: cargoType,
      roleType: cargoType === 'CONSULTOR' ? 'consultor' : 'assessor',
      team: assrTeam,
      equipe: assrTeam,
      liderId: leaderId,
      leaderId: leaderId,
      leaderName: leaderName
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
    const { currentMonth } = get();
    const nextAssessores = get().assessores.map(a => {
      if (a.id !== id) return a;
      const assrTeam = updatedFields.team || updatedFields.equipe || a.team || a.equipe || '';
      const selectedLeader = get().leaders.find(l => {
        const normalizedL = l.teamName.toUpperCase();
        const normalizedS = assrTeam.toUpperCase();
        return normalizedL === normalizedS || normalizedL.includes(normalizedS) || normalizedS.includes(normalizedL);
      });
      const leaderId = updatedFields.liderId || updatedFields.leaderId || a.liderId || a.leaderId || selectedLeader?.id;
      const leaderName = updatedFields.leaderName || selectedLeader?.name;
      const cargoType: 'ASSESSOR' | 'CONSULTOR' = updatedFields.roleType === 'consultor' || updatedFields.cargo === 'CONSULTOR' || a.roleType === 'consultor' || a.cargo === 'CONSULTOR' ? 'CONSULTOR' : 'ASSESSOR';
      
      let assessorUpdated = {
        ...a,
        ...updatedFields,
        cargo: cargoType,
        roleType: (cargoType === 'CONSULTOR' ? 'consultor' : 'assessor') as 'assessor' | 'consultor',
        team: assrTeam,
        equipe: assrTeam,
        liderId: leaderId,
        leaderId: leaderId,
        leaderName: leaderName
      } as Assessor;

      // Update ranking history
      const teamGoals = getTeamGoalsForTeam(assessorUpdated.team, get().teamGoals);
      const { score, rank } = getMemberPerformanceScore(assessorUpdated, teamGoals, currentMonth);
      const history = assessorUpdated.rankingHistory ? [...assessorUpdated.rankingHistory] : [];
      const lastItem = history[history.length - 1];
      const todayDate = new Date().toLocaleDateString('pt-BR');
      if (!lastItem || lastItem.score !== score || lastItem.rank !== rank) {
        history.push({ date: todayDate, score, rank });
      }
      assessorUpdated.rankingHistory = history;

      const oldTeam = a.team || a.equipe;
      const newTeam = assessorUpdated.team || assessorUpdated.equipe;
      const oldLeader = a.liderId || a.leaderId;
      const newLeader = assessorUpdated.liderId || assessorUpdated.leaderId;

      if ((oldTeam && newTeam && oldTeam !== newTeam) || (oldLeader && newLeader && oldLeader !== newLeader)) {
        const oldLeaderName = get().leaders.find(l => l.id === oldLeader)?.name || 'Desconhecido';
        const newLeaderName = get().leaders.find(l => l.id === newLeader)?.name || 'Desconhecido';
        
        const changeEvent: TimelineEvent = {
          id: `tl-ch-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'team_change',
          title: 'Mudança de Equipe / Líder',
          description: `Transferido de ${oldTeam} (${oldLeaderName}) para ${newTeam} (${newLeaderName}).`,
          user: get().currentUser?.name || 'Administrador',
          oldValue: `${oldTeam} (${oldLeaderName})`,
          newValue: `${newTeam} (${newLeaderName})`
        };

        assessorUpdated.timeline = [changeEvent, ...(assessorUpdated.timeline || [])];

        get().addSystemAuditLog({
          user: get().currentUser?.name || 'Administrador',
          operation: 'MUDANÇA_EQUIPE',
          targetId: id,
          targetName: a.name,
          previousValue: `${oldTeam} (${oldLeaderName})`,
          newValue: `${newTeam} (${newLeaderName})`,
          reason: 'Movimentação estrutural de equipe'
        });
      }

      return assessorUpdated;
    });
    set({ assessores: nextAssessores });
    StorageService.set('rodizio_assessores', nextAssessores);
    get().saveToServer();
  },

  editTeammateProfile: (id, wasSdr, updatedData) => {
    const { currentMonth, sdrs, assessores, leaders } = get();
    const isSdrNow = ['SDR PF', 'SDR PJ', 'SDR Advisor', 'SDR VMB'].includes(updatedData.professionalProfile);

    // Helpers to filter history based on admission date
    const cleanHistory = (history: any[] | undefined, admissionDate: string | undefined) => {
      if (!history || !admissionDate) return history || [];
      return history.filter(item => {
        const parts = item.date.split('/');
        if (parts.length !== 3) return true;
        const itemDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        const [admYear, admMonth, admDay] = admissionDate.split('-').map(Number);
        const admDate = new Date(admYear, admMonth - 1, admDay);
        return itemDate >= admDate;
      });
    };

    const resolvedTeam = updatedData.team || 'Equipe PF';
    const selectedLeader = (updatedData.leaderId || updatedData.liderId)
      ? leaders.find(l => l.id === (updatedData.leaderId || updatedData.liderId))
      : leaders.find(l => {
          const normalizedL = l.teamName.toUpperCase();
          const normalizedS = resolvedTeam.toUpperCase();
          return normalizedL === normalizedS || normalizedL.includes(normalizedS) || normalizedS.includes(normalizedL);
        });
    const leaderId = selectedLeader?.id;
    const leaderName = selectedLeader?.name;

    let nextSdrs = [...sdrs];
    let nextAssessores = [...assessores];

    if (wasSdr && !isSdrNow) {
      // SDR transitioned to Assessor/Consultor
      const oldSdr = sdrs.find(s => s.id === id);
      const rankingHistory = cleanHistory(oldSdr?.rankingHistory || [], updatedData.admissionDate);
      
      const newAssr: Assessor = {
        id,
        name: updatedData.name,
        active: oldSdr ? oldSdr.active : true,
        team: resolvedTeam,
        equipe: resolvedTeam,
        admissionDate: updatedData.admissionDate,
        photo: updatedData.photo || oldSdr?.photo,
        cargo: updatedData.professionalProfile === 'Consultor' ? 'CONSULTOR' : 'ASSESSOR',
        roleType: updatedData.professionalProfile === 'Consultor' ? 'consultor' : 'assessor',
        professionalProfile: updatedData.professionalProfile,
        liderId: leaderId,
        leaderId: leaderId,
        leaderName: leaderName,
        metaNet: updatedData.metaNet || 0,
        metaClientes: updatedData.metaClientes || 0,
        metaIndicacoes: updatedData.metaIndicacoes || 0,
        metaCrossSell: updatedData.metaCrossSell || 0,
        individualWeights: updatedData.individualWeights,
        rankingHistory: rankingHistory,
        exclusiveSdrIds: [],
        participatesInRotation: true
      };
      
      nextSdrs = sdrs.filter(s => s.id !== id);
      nextAssessores = [...assessores, newAssr];
    } else if (!wasSdr && isSdrNow) {
      // Assessor/Consultor transitioned to SDR
      const oldAssr = assessores.find(a => a.id === id);
      const rankingHistory = cleanHistory(oldAssr?.rankingHistory || [], updatedData.admissionDate);
      
      const initialRecords: Record<string, SDRMonthlyRecord> = {};
      initialRecords[currentMonth] = {
        agendamentosCount: 0,
        efetivacoesCount: 0,
        contasAbertasCount: 0,
        callsCount: 0,
        metaAgendamentos: updatedData.metaAgendamentos || 20,
        metaEfetivacoes: updatedData.metaEfetivacoes || 10,
        metaEfetivacaoRate: 50,
        metaContasAbertas: updatedData.metaContasAbertas || 5,
        metaLigacoes: updatedData.metaLigacoes || 100
      };

      const newSdr: SDR = {
        id,
        name: updatedData.name,
        active: oldAssr ? oldAssr.active : true,
        team: resolvedTeam,
        equipe: resolvedTeam,
        admissionDate: updatedData.admissionDate,
        photo: updatedData.photo || oldAssr?.photo,
        cargo: 'SDR',
        professionalProfile: updatedData.professionalProfile,
        liderId: leaderId,
        leaderId: leaderId,
        metaAgendamentos: updatedData.metaAgendamentos || 20,
        metaEfetivacoes: updatedData.metaEfetivacoes || 10,
        metaEfetivacaoRate: 50,
        metaContasAbertas: updatedData.metaContasAbertas || 5,
        metaLigacoes: updatedData.metaLigacoes || 100,
        callsCount: 0,
        agendamentosCount: 0,
        efetivacoesCount: 0,
        contasAbertasCount: 0,
        rankingHistory: rankingHistory,
        monthlyRecords: initialRecords,
        individualWeights: updatedData.individualWeights
      };

      nextAssessores = assessores.filter(a => a.id !== id);
      nextSdrs = [...sdrs, newSdr];
    } else if (isSdrNow) {
      // Remains SDR, simply update
      nextSdrs = sdrs.map(s => {
        if (s.id !== id) return s;
        const rankingHistory = cleanHistory(s.rankingHistory || [], updatedData.admissionDate);
        
        // Update monthly records
        const records = s.monthlyRecords ? { ...s.monthlyRecords } : {};
        const existing = records[currentMonth] || {
          agendamentosCount: s.agendamentosCount || 0,
          efetivacoesCount: s.efetivacoesCount || 0,
          contasAbertasCount: s.contasAbertasCount || 0,
          callsCount: s.callsCount || 0
        };
        
        records[currentMonth] = {
          ...existing,
          metaAgendamentos: updatedData.metaAgendamentos || 20,
          metaEfetivacoes: updatedData.metaEfetivacoes || 10,
          metaContasAbertas: updatedData.metaContasAbertas || 5,
          metaLigacoes: updatedData.metaLigacoes || 100
        };

        return {
          ...s,
          name: updatedData.name,
          team: resolvedTeam,
          equipe: resolvedTeam,
          admissionDate: updatedData.admissionDate,
          photo: updatedData.photo || s.photo,
          professionalProfile: updatedData.professionalProfile,
          metaAgendamentos: updatedData.metaAgendamentos || 20,
          metaEfetivacoes: updatedData.metaEfetivacoes || 10,
          metaContasAbertas: updatedData.metaContasAbertas || 5,
          metaLigacoes: updatedData.metaLigacoes || 100,
          liderId: leaderId,
          leaderId: leaderId,
          rankingHistory,
          monthlyRecords: records,
          individualWeights: updatedData.individualWeights
        };
      });
    } else {
      // Remains Assessor/Consultor, simply update
      nextAssessores = assessores.map(a => {
        if (a.id !== id) return a;
        const rankingHistory = cleanHistory(a.rankingHistory || [], updatedData.admissionDate);

        return {
          ...a,
          name: updatedData.name,
          team: resolvedTeam,
          equipe: resolvedTeam,
          admissionDate: updatedData.admissionDate,
          photo: updatedData.photo || a.photo,
          cargo: updatedData.professionalProfile === 'Consultor' ? 'CONSULTOR' : 'ASSESSOR',
          roleType: updatedData.professionalProfile === 'Consultor' ? 'consultor' : 'assessor',
          professionalProfile: updatedData.professionalProfile,
          liderId: leaderId,
          leaderId: leaderId,
          leaderName: leaderName,
          metaNet: updatedData.metaNet || 0,
          metaClientes: updatedData.metaClientes || 0,
          metaIndicacoes: updatedData.metaIndicacoes || 0,
          metaCrossSell: updatedData.metaCrossSell || 0,
          individualWeights: updatedData.individualWeights,
          rankingHistory
        };
      });
    }

    set({ sdrs: nextSdrs, assessores: nextAssessores });
    StorageService.set('rodizio_sdrs', nextSdrs);
    StorageService.set('rodizio_assessores', nextAssessores);
    get().saveToServer();
  },

  generateMatches: (shuffle = false, savePermanently = true) => {
    const { sdrs, assessores, matches, currentMonth, startDate, endDate, integrationSettings, currentUser } = get();
    
    // EXCEÇÃO: A única exceção é a área de Rodízio. Na tela de Rodízio: Exibir todos os assessores disponíveis.
    // Independentemente da equipe. Apenas essa tela deve ignorar a segmentação.
    const teamSdrs = sdrs;
    const teamAssessores = assessores;

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
    
    let finalMatches = matchesWithDates;
    if (currentUser && currentUser.role !== 'admin' && currentUser.name.toLowerCase() !== 'caio') {
      // Preserve matches belonging to other leaders/teams
      const otherMatches = matches.filter(m => !teamSdrs.some(s => s.id === m.sdrId));
      const mappedOtherMatches = otherMatches.map(m => ({
        ...m,
        startDate: m.startDate || startDate,
        endDate: m.endDate || endDate
      })) as typeof matchesWithDates;
      finalMatches = [...mappedOtherMatches, ...matchesWithDates];
    }

    if (savePermanently) {
      set({ matches: finalMatches, temporaryMatches: finalMatches });
      StorageService.set('rodizio_matches', finalMatches);
      get().saveToServer();
      
      const leaderName = currentUser?.name || 'Administrador';
      const timestamp = new Date().toISOString();
      IntegrationService.sendMatches(leaderName, finalMatches, integrationSettings.webhookUrl).then(response => {
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
      set({ temporaryMatches: finalMatches });
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

  getActiveTeamGoals: () => {
    const user = get().currentUser;
    const currentGoals = get().teamGoals;
    if (user && user.role === 'leader' && user.teamName) {
      const specific = currentGoals.teamSpecificGoals?.[user.teamName];
      if (specific) {
        return {
          ...currentGoals,
          ...specific,
        };
      }
    }
    return currentGoals;
  },

  updateTeamGoals: (updated) => {
    const user = get().currentUser;
    const currentGoals = get().teamGoals;
    let nextGoals;
    if (user && user.role === 'leader' && user.teamName) {
      const specific = (currentGoals.teamSpecificGoals || {})[user.teamName] || {
        agendamentos: currentGoals.agendamentos,
        efetivacoes: currentGoals.efetivacoes,
        contasAbertas: currentGoals.contasAbertas,
        customMetrics: currentGoals.customMetrics,
        performanceGoals: currentGoals.performanceGoals,
        wealthDealsGoal: currentGoals.wealthDealsGoal,
        wealthRevenueGoal: currentGoals.wealthRevenueGoal,
      };
      const updatedSpecific = { ...specific, ...updated };
      nextGoals = {
        ...currentGoals,
        teamSpecificGoals: {
          ...(currentGoals.teamSpecificGoals || {}),
          [user.teamName]: updatedSpecific,
        }
      };
    } else {
      nextGoals = { ...currentGoals, ...updated };
    }
    set({ teamGoals: nextGoals });
    StorageService.set('rodizio_team_goals', nextGoals);
    get().saveToServer();
  },

  saveTeamGoalsPlan: (teamName: string, month: string, goals: PerformanceGoal[]) => {
    const currentGoals = get().teamGoals;
    const monthlyPlans = currentGoals.monthlyPlans || {};
    const monthPlans = monthlyPlans[month] || {};

    const updatedMonthlyPlans = {
      ...monthlyPlans,
      [month]: {
        ...monthPlans,
        [teamName]: goals
      }
    };

    const nextGoals = {
      ...currentGoals,
      monthlyPlans: updatedMonthlyPlans
    };

    // Synchronize individualGoals for all members of this team
    const updatedSdrs = get().sdrs.map(sdr => {
      const sdrTeam = sdr.team || sdr.equipe || '';
      if (sdrTeam && sdrTeam === teamName) {
        const existingIndGoals = sdr.individualGoals || [];
        const newIndGoals = goals.map(tg => {
          const matched = existingIndGoals.find(ig => ig.name.toLowerCase() === tg.name.toLowerCase() || ig.id === tg.id);
          return {
            id: tg.id,
            name: tg.name,
            target: tg.target,
            weight: tg.weight,
            type: tg.type || 'quantity',
            period: 'mensal',
            realized: matched ? matched.realized || 0 : 0,
            description: tg.description || ''
          } as IndividualGoal;
        });
        return {
          ...sdr,
          individualGoals: newIndGoals
        };
      }
      return sdr;
    });

    const updatedAssessores = get().assessores.map(assr => {
      const assrTeam = assr.team || assr.equipe || '';
      if (assrTeam && assrTeam === teamName) {
        const existingIndGoals = assr.individualGoals || [];
        const newIndGoals = goals.map(tg => {
          const matched = existingIndGoals.find(ig => ig.name.toLowerCase() === tg.name.toLowerCase() || ig.id === tg.id);
          return {
            id: tg.id,
            name: tg.name,
            target: tg.target,
            weight: tg.weight,
            type: tg.type || 'quantity',
            period: 'mensal',
            realized: matched ? matched.realized || 0 : 0,
            description: tg.description || ''
          } as IndividualGoal;
        });
        return {
          ...assr,
          individualGoals: newIndGoals
        };
      }
      return assr;
    });

    set({ 
      teamGoals: nextGoals,
      sdrs: updatedSdrs,
      assessores: updatedAssessores
    });

    StorageService.set('rodizio_team_goals', nextGoals);
    StorageService.set('rodizio_sdrs', updatedSdrs);
    StorageService.set('rodizio_assessores', updatedAssessores);

    get().saveToServer();
  },

  saveIndividualMonthlyGoals: (memberId: string, isSdr: boolean, month: string, goals: any[]) => {
    if (isSdr) {
      const updatedSdrs = get().sdrs.map(sdr => {
        if (sdr.id === memberId) {
          const records = { ...(sdr.monthlyRecords || {}) };
          records[month] = {
            ...(records[month] || {}),
            configuredGoals: goals
          } as any;
          
          let sdrUpdated = {
            ...sdr,
            monthlyRecords: records
          } as SDR;

          // Re-calculate performance rank and score for ranking history
          const teamGoals = getTeamGoalsForTeam(sdrUpdated.team, get().teamGoals);
          const { score, rank } = getMemberPerformanceScore(sdrUpdated, teamGoals, month);
          
          const history = sdrUpdated.rankingHistory ? [...sdrUpdated.rankingHistory] : [];
          const todayDate = new Date().toLocaleDateString('pt-BR');
          
          history.push({ date: todayDate, score, rank });
          sdrUpdated.rankingHistory = history;

          return sdrUpdated;
        }
        return sdr;
      });

      set({ sdrs: updatedSdrs });
      StorageService.set('rodizio_sdrs', updatedSdrs);
    } else {
      const updatedAssessores = get().assessores.map(assr => {
        if (assr.id === memberId) {
          const records = { ...(assr.monthlyRecords || {}) };
          records[month] = {
            ...(records[month] || {}),
            configuredGoals: goals
          } as any;
          
          let assrUpdated = {
            ...assr,
            monthlyRecords: records
          } as Assessor;

          // Re-calculate performance rank and score for ranking history
          const teamGoals = getTeamGoalsForTeam(assrUpdated.team, get().teamGoals);
          const { score, rank } = getMemberPerformanceScore(assrUpdated, teamGoals, month);
          
          const history = assrUpdated.rankingHistory ? [...assrUpdated.rankingHistory] : [];
          const todayDate = new Date().toLocaleDateString('pt-BR');
          
          history.push({ date: todayDate, score, rank });
          assrUpdated.rankingHistory = history;

          return assrUpdated;
        }
        return assr;
      });

      set({ assessores: updatedAssessores });
      StorageService.set('rodizio_assessores', updatedAssessores);
    }

    get().saveToServer();
  },

  restoreStandardMonthlyGoals: (memberId: string, isSdr: boolean, month: string) => {
    if (isSdr) {
      const updatedSdrs = get().sdrs.map(sdr => {
        if (sdr.id === memberId) {
          const records = { ...(sdr.monthlyRecords || {}) };
          if (records[month]) {
            const { configuredGoals, ...rest } = records[month] as any;
            records[month] = rest;
          }
          let sdrUpdated = {
            ...sdr,
            monthlyRecords: records
          } as SDR;

          // Re-calculate performance rank and score for ranking history
          const teamGoals = getTeamGoalsForTeam(sdrUpdated.team, get().teamGoals);
          const { score, rank } = getMemberPerformanceScore(sdrUpdated, teamGoals, month);
          
          const history = sdrUpdated.rankingHistory ? [...sdrUpdated.rankingHistory] : [];
          const todayDate = new Date().toLocaleDateString('pt-BR');
          
          history.push({ date: todayDate, score, rank });
          sdrUpdated.rankingHistory = history;

          return sdrUpdated;
        }
        return sdr;
      });

      set({ sdrs: updatedSdrs });
      StorageService.set('rodizio_sdrs', updatedSdrs);
    } else {
      const updatedAssessores = get().assessores.map(assr => {
        if (assr.id === memberId) {
          const records = { ...(assr.monthlyRecords || {}) };
          if (records[month]) {
            const { configuredGoals, ...rest } = records[month] as any;
            records[month] = rest;
          }
          let assrUpdated = {
            ...assr,
            monthlyRecords: records
          } as Assessor;

          // Re-calculate performance rank and score for ranking history
          const teamGoals = getTeamGoalsForTeam(assrUpdated.team, get().teamGoals);
          const { score, rank } = getMemberPerformanceScore(assrUpdated, teamGoals, month);
          
          const history = assrUpdated.rankingHistory ? [...assrUpdated.rankingHistory] : [];
          const todayDate = new Date().toLocaleDateString('pt-BR');
          
          history.push({ date: todayDate, score, rank });
          assrUpdated.rankingHistory = history;

          return assrUpdated;
        }
        return assr;
      });

      set({ assessores: updatedAssessores });
      StorageService.set('rodizio_assessores', updatedAssessores);
    }

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

  addRotationHistoryLog: (operation, details, extra) => {
    const { currentUser } = get();
    const newLog: RotationHistoryEntry = {
      id: `rot-log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      user: currentUser?.name || 'Líder',
      operation,
      details,
      participantId: extra?.participantId,
      participantName: extra?.participantName,
      sdrId: extra?.sdrId,
      sdrName: extra?.sdrName,
    };
    const nextLogs = [newLog, ...get().rotationHistoryLogs];
    set({ rotationHistoryLogs: nextLogs });
    localStorage.setItem('rodizio_rotation_history_logs', JSON.stringify(nextLogs));
  },

  addRotationParticipantManual: (newParticipant) => {
    const newId = `part-manual-${Date.now()}`;
    const participant: RotationParticipant = {
      ...newParticipant,
      id: newId,
      cadastroType: 'Manual',
      createdAt: new Date().toISOString(),
    };
    
    const nextParticipants = [...get().rotationParticipants, participant];
    set({ rotationParticipants: nextParticipants });
    localStorage.setItem('rodizio_rotation_participants', JSON.stringify(nextParticipants));
    
    // Log history
    get().addRotationHistoryLog(
      'Criação',
      `Participante manual "${participant.name}" criado com cargo ${participant.cargo} e equipe ${participant.equipe}.`,
      { participantId: participant.id, participantName: participant.name }
    );
    
    get().saveToServer();
    return participant;
  },

  updateRotationParticipant: (id, fields) => {
    const prevParticipant = get().rotationParticipants.find(p => p.id === id);
    if (!prevParticipant) return;

    // Detect field changes for history
    const changes: string[] = [];
    if (fields.name && fields.name !== prevParticipant.name) changes.push(`Nome alterado de "${prevParticipant.name}" para "${fields.name}"`);
    if (fields.cargo && fields.cargo !== prevParticipant.cargo) changes.push(`Cargo alterado de "${prevParticipant.cargo}" para "${fields.cargo}"`);
    if (fields.equipe && fields.equipe !== prevParticipant.equipe) changes.push(`Equipe alterada de "${prevParticipant.equipe}" para "${fields.equipe}"`);
    if (fields.status && fields.status !== prevParticipant.status) {
      if (fields.status === 'Arquivado') changes.push(`Status alterado para Arquivado`);
      else if (prevParticipant.status === 'Arquivado' && fields.status === 'Ativo') changes.push(`Participante reativado para Ativo`);
      else changes.push(`Status alterado de "${prevParticipant.status}" para "${fields.status}"`);
    }
    if (fields.observacoes && fields.observacoes !== prevParticipant.observacoes) changes.push(`Observações atualizadas`);

    const nextParticipants = get().rotationParticipants.map(p => {
      if (p.id === id) {
        return { ...p, ...fields };
      }
      return p;
    });

    set({ rotationParticipants: nextParticipants });
    localStorage.setItem('rodizio_rotation_participants', JSON.stringify(nextParticipants));

    // Determine the main operation label
    let op = 'Edição';
    if (fields.status === 'Arquivado' && prevParticipant.status !== 'Arquivado') op = 'Arquivamento';
    if (fields.status === 'Ativo' && prevParticipant.status === 'Arquivado') op = 'Reativação';

    if (changes.length > 0) {
      get().addRotationHistoryLog(
        op,
        `Participante "${prevParticipant.name}": ${changes.join(', ')}.`,
        { participantId: id, participantName: prevParticipant.name }
      );
    }

    get().saveToServer();
  },

  associateRotationParticipantWithOfficial: (manualId, officialAssessorId) => {
    const { rotationParticipants, assessores } = get();
    const manualPart = rotationParticipants.find(p => p.id === manualId);
    const officialAssessor = assessores.find(a => a.id === officialAssessorId);

    if (!manualPart || !officialAssessor) return;

    const nextParticipants = rotationParticipants.map(p => {
      if (p.id === manualId) {
        return {
          ...p,
          cadastroType: 'Oficial' as const,
          officialId: officialAssessorId,
          // Sync current official properties
          name: officialAssessor.name,
          cargo: (officialAssessor.roleType === 'consultor' ? 'Consultor' : 'Assessor') as 'Assessor' | 'Consultor',
          equipe: officialAssessor.team || 'Geral'
        };
      }
      return p;
    });

    set({ rotationParticipants: nextParticipants });
    localStorage.setItem('rodizio_rotation_participants', JSON.stringify(nextParticipants));

    get().addRotationHistoryLog(
      'Edição',
      `Associou participante manual "${manualPart.name}" ao cadastro oficial de "${officialAssessor.name}".`,
      { participantId: manualId, participantName: manualPart.name }
    );

    get().saveToServer();
  },

  syncRotationParticipants: () => {
    const { assessores, rotationParticipants } = get();
    let hasChanged = false;
    const updatedParticipants = [...rotationParticipants];

    assessores.forEach(assessor => {
      // Find if this official assessor is already represented (by officialId or original id)
      const exists = updatedParticipants.some(p => p.officialId === assessor.id || p.id === assessor.id);
      if (!exists) {
        // Create an Official participant
        const participant: RotationParticipant = {
          id: assessor.id,
          name: assessor.name,
          cargo: assessor.roleType === 'consultor' ? 'Consultor' : 'Assessor',
          equipe: assessor.team || 'Geral',
          status: assessor.active ? 'Ativo' : 'Inativo',
          cadastroType: 'Oficial',
          officialId: assessor.id,
          createdAt: new Date().toISOString()
        };
        updatedParticipants.push(participant);
        hasChanged = true;
      } else {
        // Update name, cargo, team from the official record if it's Oficial to keep it synced
        const idx = updatedParticipants.findIndex(p => p.officialId === assessor.id || p.id === assessor.id);
        if (idx !== -1 && updatedParticipants[idx].cadastroType === 'Oficial') {
          const current = updatedParticipants[idx];
          const newCargo = assessor.roleType === 'consultor' ? 'Consultor' : 'Assessor';
          const newEquipe = assessor.team || 'Geral';
          const newStatus = assessor.active ? 'Ativo' : 'Inativo';
          
          if (current.name !== assessor.name || current.cargo !== newCargo || current.equipe !== newEquipe || current.status !== newStatus) {
            updatedParticipants[idx] = {
              ...current,
              name: assessor.name,
              cargo: newCargo as 'Assessor' | 'Consultor',
              equipe: newEquipe,
              status: newStatus as 'Ativo' | 'Inativo' | 'Arquivado'
            };
            hasChanged = true;
          }
        }
      }
    });

    if (hasChanged) {
      set({ rotationParticipants: updatedParticipants });
      localStorage.setItem('rodizio_rotation_participants', JSON.stringify(updatedParticipants));
    }
  },

  addSystemAuditLog: (log) => {
    const timestamp = new Date().toISOString();
    const id = `sys-audit-${Date.now()}`;
    const newLog: SystemAuditLog = {
      ...log,
      id,
      timestamp
    };
    const nextLogs = [newLog, ...(get().systemAuditLogs || [])];
    set({ systemAuditLogs: nextLogs });
    StorageService.set('rodizio_system_audit_logs', nextLogs);
    get().saveToServer();
  },

  addTimelineEvent: (memberId, memberType, event) => {
    const timestamp = new Date().toISOString();
    const id = `tl-${Date.now()}`;
    const newEvent: TimelineEvent = {
      ...event,
      id,
      timestamp
    };
    if (memberType === 'sdr') {
      const nextSdrs = get().sdrs.map(s => {
        if (s.id !== memberId) return s;
        return {
          ...s,
          timeline: [newEvent, ...(s.timeline || [])]
        };
      });
      set({ sdrs: nextSdrs });
      StorageService.set('rodizio_sdrs', nextSdrs);
    } else {
      const nextAssessores = get().assessores.map(a => {
        if (a.id !== memberId) return a;
        return {
          ...a,
          timeline: [newEvent, ...(a.timeline || [])]
        };
      });
      set({ assessores: nextAssessores });
      StorageService.set('rodizio_assessores', nextAssessores);
    }
    get().saveToServer();
  },

  addIndividualGoal: (memberId, memberType, goal, reason) => {
    const { currentUser } = get();
    const userName = currentUser?.name || 'Administrador';
    const timestamp = new Date().toISOString();
    const goalId = `goal-${Date.now()}`;

    const newGoal: IndividualGoal = {
      ...goal,
      id: goalId,
      startDate: timestamp.split('T')[0],
      changedBy: userName,
      changedAt: timestamp
    };

    if (memberType === 'sdr') {
      const member = get().sdrs.find(s => s.id === memberId);
      if (!member) return;
      const currentGoals = member.individualGoals || [];
      const updatedGoals = [...currentGoals, newGoal];

      const nextSdrs = get().sdrs.map(s => {
        if (s.id !== memberId) return s;
        return {
          ...s,
          individualGoals: updatedGoals
        };
      });

      set({ sdrs: nextSdrs });
      StorageService.set('rodizio_sdrs', nextSdrs);

      get().addTimelineEvent(memberId, 'sdr', {
        type: 'goal_change',
        title: 'Nova Meta Adicionada',
        description: `Meta "${goal.name}" (Meta: ${goal.target}, Peso: ${goal.weight}%) cadastrada com início de vigência em ${newGoal.startDate}.`,
        user: userName,
        newValue: `${goal.target}`,
        reason
      });

      get().addSystemAuditLog({
        user: userName,
        operation: 'ADICAO_META',
        targetId: memberId,
        targetName: member.name,
        newValue: `Meta: ${goal.name} (Meta: ${goal.target}, Peso: ${goal.weight}%)`,
        reason
      });
    } else {
      const member = get().assessores.find(a => a.id === memberId);
      if (!member) return;
      const currentGoals = member.individualGoals || [];
      const updatedGoals = [...currentGoals, newGoal];

      const nextAssessores = get().assessores.map(a => {
        if (a.id !== memberId) return a;
        return {
          ...a,
          individualGoals: updatedGoals
        };
      });

      set({ assessores: nextAssessores });
      StorageService.set('rodizio_assessores', nextAssessores);

      get().addTimelineEvent(memberId, member.roleType || 'assessor', {
        type: 'goal_change',
        title: 'Nova Meta Adicionada',
        description: `Meta "${goal.name}" (Meta: ${goal.target}, Peso: ${goal.weight}%) cadastrada com início de vigência em ${newGoal.startDate}.`,
        user: userName,
        newValue: `${goal.target}`,
        reason
      });

      get().addSystemAuditLog({
        user: userName,
        operation: 'ADICAO_META',
        targetId: memberId,
        targetName: member.name,
        newValue: `Meta: ${goal.name} (Meta: ${goal.target}, Peso: ${goal.weight}%)`,
        reason
      });
    }
  },

  updateIndividualGoal: (memberId, memberType, goalId, fields, reason) => {
    const { currentUser } = get();
    const userName = currentUser?.name || 'Administrador';
    const timestamp = new Date().toISOString();

    if (memberType === 'sdr') {
      const member = get().sdrs.find(s => s.id === memberId);
      if (!member) return;
      const currentGoals = member.individualGoals || [];
      const originalGoal = currentGoals.find(g => g.id === goalId);
      if (!originalGoal) return;

      const previousDesc = `Meta: ${originalGoal.target}, Peso: ${originalGoal.weight}%, Realizado: ${originalGoal.realized || 0}`;

      const updatedGoals = currentGoals.map(g => {
        if (g.id !== goalId) return g;
        
        const isCriticalChange = (fields.target !== undefined && fields.target !== g.target) || 
                                 (fields.weight !== undefined && fields.weight !== g.weight);
                                 
        return {
          ...g,
          ...fields,
          endDate: isCriticalChange ? timestamp.split('T')[0] : g.endDate,
          changedBy: userName,
          changedAt: timestamp
        };
      });

      const nextSdrs = get().sdrs.map(s => {
        if (s.id !== memberId) return s;
        return {
          ...s,
          individualGoals: updatedGoals
        };
      });

      set({ sdrs: nextSdrs });
      StorageService.set('rodizio_sdrs', nextSdrs);

      const updatedGoal = updatedGoals.find(g => g.id === goalId)!;
      const newDesc = `Meta: ${updatedGoal.target}, Peso: ${updatedGoal.weight}%, Realizado: ${updatedGoal.realized || 0}`;

      get().addTimelineEvent(memberId, 'sdr', {
        type: 'goal_change',
        title: `Meta "${originalGoal.name}" Atualizada`,
        description: `Meta "${originalGoal.name}" reajustada. Anterior: (${previousDesc}) -> Nova: (${newDesc}).`,
        user: userName,
        oldValue: previousDesc,
        newValue: newDesc,
        reason
      });

      get().addSystemAuditLog({
        user: userName,
        operation: 'ALTERACAO_META',
        targetId: memberId,
        targetName: member.name,
        previousValue: previousDesc,
        newValue: newDesc,
        reason
      });
    } else {
      const member = get().assessores.find(a => a.id === memberId);
      if (!member) return;
      const currentGoals = member.individualGoals || [];
      const originalGoal = currentGoals.find(g => g.id === goalId);
      if (!originalGoal) return;

      const previousDesc = `Meta: ${originalGoal.target}, Peso: ${originalGoal.weight}%, Realizado: ${originalGoal.realized || 0}`;

      const updatedGoals = currentGoals.map(g => {
        if (g.id !== goalId) return g;
        const isCriticalChange = (fields.target !== undefined && fields.target !== g.target) || 
                                 (fields.weight !== undefined && fields.weight !== g.weight);
        return {
          ...g,
          ...fields,
          endDate: isCriticalChange ? timestamp.split('T')[0] : g.endDate,
          changedBy: userName,
          changedAt: timestamp
        };
      });

      const nextAssessores = get().assessores.map(a => {
        if (a.id !== memberId) return a;
        return {
          ...a,
          individualGoals: updatedGoals
        };
      });

      set({ assessores: nextAssessores });
      StorageService.set('rodizio_assessores', nextAssessores);

      const updatedGoal = updatedGoals.find(g => g.id === goalId)!;
      const newDesc = `Meta: ${updatedGoal.target}, Peso: ${updatedGoal.weight}%, Realizado: ${updatedGoal.realized || 0}`;

      get().addTimelineEvent(memberId, member.roleType || 'assessor', {
        type: 'goal_change',
        title: `Meta "${originalGoal.name}" Atualizada`,
        description: `Meta "${originalGoal.name}" reajustada. Anterior: (${previousDesc}) -> Nova: (${newDesc}).`,
        user: userName,
        oldValue: previousDesc,
        newValue: newDesc,
        reason
      });

      get().addSystemAuditLog({
        user: userName,
        operation: 'ALTERACAO_META',
        targetId: memberId,
        targetName: member.name,
        previousValue: previousDesc,
        newValue: newDesc,
        reason
      });
    }
  },

  deleteIndividualGoal: (memberId, memberType, goalId, reason) => {
    const { currentUser } = get();
    const userName = currentUser?.name || 'Administrador';

    if (memberType === 'sdr') {
      const member = get().sdrs.find(s => s.id === memberId);
      if (!member) return;
      const currentGoals = member.individualGoals || [];
      const originalGoal = currentGoals.find(g => g.id === goalId);
      if (!originalGoal) return;

      const updatedGoals = currentGoals.filter(g => g.id !== goalId);

      const nextSdrs = get().sdrs.map(s => {
        if (s.id !== memberId) return s;
        return {
          ...s,
          individualGoals: updatedGoals
        };
      });

      set({ sdrs: nextSdrs });
      StorageService.set('rodizio_sdrs', nextSdrs);

      get().addTimelineEvent(memberId, 'sdr', {
        type: 'goal_change',
        title: `Meta "${originalGoal.name}" Removida`,
        description: `Meta "${originalGoal.name}" (Meta anterior: ${originalGoal.target}) foi excluída do perfil do colaborador.`,
        user: userName,
        oldValue: `${originalGoal.target}`,
        reason
      });

      get().addSystemAuditLog({
        user: userName,
        operation: 'EXCLUSAO_META',
        targetId: memberId,
        targetName: member.name,
        previousValue: `Meta: ${originalGoal.name} (Meta: ${originalGoal.target})`,
        reason
      });
    } else {
      const member = get().assessores.find(a => a.id === memberId);
      if (!member) return;
      const currentGoals = member.individualGoals || [];
      const originalGoal = currentGoals.find(g => g.id === goalId);
      if (!originalGoal) return;

      const updatedGoals = currentGoals.filter(g => g.id !== goalId);

      const nextAssessores = get().assessores.map(a => {
        if (a.id !== memberId) return a;
        return {
          ...a,
          individualGoals: updatedGoals
        };
      });

      set({ assessores: nextAssessores });
      StorageService.set('rodizio_assessores', nextAssessores);

      get().addTimelineEvent(memberId, member.roleType || 'assessor', {
        type: 'goal_change',
        title: `Meta "${originalGoal.name}" Removida`,
        description: `Meta "${originalGoal.name}" (Meta anterior: ${originalGoal.target}) foi excluída do perfil do colaborador.`,
        user: userName,
        oldValue: `${originalGoal.target}`,
        reason
      });

      get().addSystemAuditLog({
        user: userName,
        operation: 'EXCLUSAO_META',
        targetId: memberId,
        targetName: member.name,
        previousValue: `Meta: ${originalGoal.name} (Meta: ${originalGoal.target})`,
        reason
      });
    }
  },

  promoteSDRToAssessor: (sdrId, promotionData) => {
    const { sdrs, assessores, leaders, currentUser } = get();
    const sdr = sdrs.find(s => s.id === sdrId);
    if (!sdr) return;

    const userName = currentUser?.name || 'Administrador';
    const promotionDate = promotionData.date || new Date().toISOString().split('T')[0];
    const destinationLeader = leaders.find(l => l.id === promotionData.leaderId);

    const updatedSdr: SDR = {
      ...sdr,
      active: false,
      promotedToAssessor: true,
      promotedDate: promotionDate,
    };

    const assrId = `assr-promoted-${Date.now()}`;
    const cargoType = promotionData.cargo || 'ASSESSOR';
    
    const newAssessor: Assessor = {
      id: assrId,
      name: sdr.name,
      photo: sdr.photo,
      active: true,
      roleType: cargoType === 'CONSULTOR' ? 'consultor' : 'assessor',
      cargo: cargoType,
      team: promotionData.team,
      equipe: promotionData.team,
      liderId: promotionData.leaderId,
      leaderId: promotionData.leaderId,
      leaderName: destinationLeader?.name || '',
      admissionDate: sdr.admissionDate,
      participatesInRotation: true,
      exclusiveSdrIds: [sdr.id],
      timeline: []
    };

    const promoTimelineEvent: TimelineEvent = {
      id: `tl-promo-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'promotion',
      title: 'Promovido para Assessor/Consultor',
      description: `Promovido de SDR para ${cargoType} na equipe "${promotionData.team}" sob a liderança de ${destinationLeader?.name || 'Líder Não Cadastrado'}.`,
      user: userName,
      oldValue: 'Cargo: SDR',
      newValue: `Cargo: ${cargoType} | Equipe: ${promotionData.team}`,
      reason: promotionData.reason
    };

    updatedSdr.timeline = [promoTimelineEvent, ...(sdr.timeline || [])];
    
    const admissionTimelineEvent: TimelineEvent = {
      id: `tl-adm-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'admission',
      title: 'Cadastro Criado via Promoção',
      description: `Início da trajetória como ${cargoType} originada pela promoção do SDR "${sdr.name}".`,
      user: userName,
      reason: promotionData.reason
    };
    newAssessor.timeline = [admissionTimelineEvent];

    const nextSdrs = sdrs.map(s => s.id === sdrId ? { ...updatedSdr, promotedAssessorId: assrId } : s);
    const nextAssessores = [...assessores, newAssessor];

    set({ sdrs: nextSdrs, assessores: nextAssessores });
    StorageService.set('rodizio_sdrs', nextSdrs);
    StorageService.set('rodizio_assessores', nextAssessores);

    get().addSystemAuditLog({
      user: userName,
      operation: 'PROMOÇÃO_SDR_PARA_ASSESSOR',
      targetId: sdrId,
      targetName: sdr.name,
      previousValue: 'Cargo: SDR',
      newValue: `Cargo: ${cargoType} | Novo Assessor ID: ${assrId}`,
      reason: promotionData.reason
    });
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
