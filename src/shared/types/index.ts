import { z } from 'zod';
import { 
  SDRMonthlyRecord as IPSDRMonthlyRecord,
  SDR as IPSDR,
  Assessor as IPAssessor,
  TeamLeader as IPTeamLeader,
  MatchResult as IPMatchResult,
  TeamGoals as IPTeamGoals,
  AuthUser as IPAuthUser,
  AuditLog as IPAuditLog,
  OneOnOneLog as IPOneOnOneLog,
  IntegrationSettings as IPIntegrationSettings,
  TeamCampaign as IPTeamCampaign
} from '../../types';

// Re-export original TypeScript interfaces for central reference
export type SDRMonthlyRecord = IPSDRMonthlyRecord;
export type SDR = IPSDR;
export type Assessor = IPAssessor;
export type TeamLeader = IPTeamLeader;
export type MatchResult = IPMatchResult;
export type TeamGoals = IPTeamGoals;
export type AuthUser = IPAuthUser;
export type AuditLog = IPAuditLog;
export type OneOnOneLog = IPOneOnOneLog;
export type IntegrationSettings = IPIntegrationSettings;
export type TeamCampaign = IPTeamCampaign;

// --- ZOD SCHEMAS FOR RUNTIME SECURITY DISCIPLINE ---

export const AuditLogSchema = z.object({
  id: z.string(),
  sdrId: z.string(),
  sdrName: z.string(),
  leader: z.string(),
  timestamp: z.string(),
  score: z.object({
    abordagem: z.number().catch(1),
    conexao: z.number().catch(1),
    especialidade: z.number().catch(1),
    proposta: z.number().catch(1),
    tomadaDecisao: z.number().catch(1),
    objecoes: z.number().catch(1),
  }),
  totalScore: z.number().catch(6),
  notes: z.string().catch(''),
});

export const OneOnOneLogSchema = z.object({
  id: z.string(),
  sdrId: z.string(),
  sdrName: z.string(),
  leader: z.string(),
  timestamp: z.string(),
  status: z.enum(['EM_RISCO', 'NO_CAMINHO', 'OUTLIER']).catch('NO_CAMINHO'),
  actionPlan: z.string().catch(''),
  nextMeeting: z.string().catch(''),
  notes: z.string().catch(''),
  aiFeedback: z.string().optional().catch(''),
  professionalProfile: z.string().optional().catch('comercial'),
});

export const IntegrationSettingsSchema = z.object({
  webhookUrl: z.string().catch(''),
  lastSendStatus: z.enum(['success', 'failed', 'none']).catch('none'),
  lastSendHttpStatus: z.number().nullable().catch(null),
  lastSendTimestamp: z.string().nullable().catch(null),
  enabled: z.boolean().catch(true),
});

// --- ZOD SCHEMAS FOR RUNTIME SECURITY DISCIPLINE ---

export const SDRMonthlyRecordSchema = z.object({
  agendamentosCount: z.number().catch(0),
  efetivacoesCount: z.number().catch(0),
  contasAbertasCount: z.number().optional().catch(0),
  callsCount: z.number().optional().catch(0),
  metaAgendamentos: z.number().catch(20),
  metaEfetivacoes: z.number().optional().catch(10),
  metaEfetivacaoRate: z.number().optional().catch(50),
  metaContasAbertas: z.number().optional().catch(5),
});

export const SDRSchema = z.object({
  id: z.string(),
  name: z.string(),
  agendamentosCount: z.number().catch(0),
  efetivacoesCount: z.number().catch(0),
  contasAbertasCount: z.number().optional().catch(0),
  callsCount: z.number().optional().catch(0),
  metaAgendamentos: z.number().catch(20),
  metaEfetivacoes: z.number().optional().catch(10),
  metaEfetivacaoRate: z.number().catch(50),
  metaContasAbertas: z.number().optional().catch(5),
  active: z.boolean().catch(true),
  admissionDate: z.string().optional().catch(''),
  team: z.string().optional().catch(''),
  monthlyRecords: z.record(z.string(), SDRMonthlyRecordSchema).optional().catch({}),
  promotedToAssessor: z.boolean().optional().catch(false),
  promotedDate: z.string().optional(),
  promotedAssessorId: z.string().optional(),
  professionalProfile: z.string().optional().catch('comercial'),
});

export const AssessorSchema = z.object({
  id: z.string(),
  name: z.string(),
  active: z.boolean().catch(true),
  agendaLink: z.string().optional().catch(''),
  exclusiveSdrId: z.string().optional().catch(''),
  exclusiveSdrIds: z.array(z.string()).optional().catch([]),
  participatesInRotation: z.boolean().catch(true),
  team: z.string().optional().catch(''),
  captacaoMes: z.number().optional().catch(0),
  crossSellCount: z.number().optional().catch(0),
  crossSellDetails: z.string().optional().catch(''),
  professionalProfile: z.string().optional().catch('comercial'),
});

export const TeamLeaderSchema = z.object({
  id: z.string(),
  teamName: z.string(),
  leaderTitle: z.string(),
  passcode: z.string(),
  name: z.string(),
});

export const MatchResultSchema = z.object({
  sdrId: z.string(),
  sdrName: z.string(),
  sdrConversionRate: z.number().catch(0),
  assessorId: z.string(),
  assessorName: z.string(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isExclusive: z.boolean().optional().catch(false),
});

export const TeamGoalsSchema = z.object({
  agendamentos: z.number().catch(150),
  efetivacoes: z.number().catch(80),
  contasAbertas: z.number().catch(35),
});
