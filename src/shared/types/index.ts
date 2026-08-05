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
  TeamCampaign as IPTeamCampaign,
  ProductType as IPProductType,
  NegocioFechado as IPNegocioFechado,
  NegocioFechadoProduto as IPNegocioFechadoProduto,
  IndividualGoal as IPIndividualGoal,
  PerformanceGoal as IPPerformanceGoal,
  RotationParticipant as IPRotationParticipant,
  RotationHistoryEntry as IPRotationHistoryEntry,
  TimelineEvent as IPTimelineEvent,
  SystemAuditLog as IPSystemAuditLog
} from '../../types';

// Re-export original TypeScript interfaces for central reference
export type SDRMonthlyRecord = IPSDRMonthlyRecord;
export type IndividualGoal = IPIndividualGoal;
export type PerformanceGoal = IPPerformanceGoal;
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
export type ProductType = IPProductType;
export type NegocioFechado = IPNegocioFechado;
export type NegocioFechadoProduto = IPNegocioFechadoProduto;
export type RotationParticipant = IPRotationParticipant;
export type RotationHistoryEntry = IPRotationHistoryEntry;
export type TimelineEvent = IPTimelineEvent;
export type SystemAuditLog = IPSystemAuditLog;

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
  answers: z.record(z.string(), z.string()).optional().catch({}),
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
  metaLigacoes: z.number().optional().catch(100),
  configuredGoals: z.array(z.any()).optional().catch([]),
});

export const IndividualGoalSchema = z.object({
  id: z.string(),
  name: z.string(),
  target: z.number().catch(0),
  weight: z.number().catch(0),
  type: z.string().catch('quantity'),
  period: z.string().catch('mensal'),
  realized: z.number().optional().catch(0),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  changedBy: z.string().optional(),
  changedAt: z.string().optional(),
});

export const TimelineEventSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  type: z.enum(['admission', 'role_change', 'team_change', 'promotion', 'goal_change', 'weight_change', 'feedback', 'ranking_change', 'audit', 'custom']),
  title: z.string(),
  description: z.string(),
  user: z.string(),
  oldValue: z.string().optional(),
  newValue: z.string().optional(),
  reason: z.string().optional(),
});

export const SystemAuditLogSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  user: z.string(),
  operation: z.string(),
  targetId: z.string(),
  targetName: z.string(),
  previousValue: z.string().optional(),
  newValue: z.string().optional(),
  reason: z.string().optional(),
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
  metaLigacoes: z.number().optional().catch(100),
  individualGoals: z.array(IndividualGoalSchema).optional().catch([]),
  active: z.boolean().catch(true),
  admissionDate: z.string().optional().catch(''),
  team: z.string().optional().catch(''),
  monthlyRecords: z.record(z.string(), SDRMonthlyRecordSchema).optional().catch({}),
  promotedToAssessor: z.boolean().optional().catch(false),
  promotedDate: z.string().optional(),
  promotedAssessorId: z.string().optional(),
  professionalProfile: z.string().optional().catch('comercial'),
  photo: z.string().optional(),
  rankingHistory: z.array(z.any()).optional().catch([]),
  timeline: z.array(TimelineEventSchema).optional().catch([]),
  individualWeights: z.object({
    ligacoes: z.number().catch(20),
    reunioes: z.number().catch(35),
    comparecimento: z.number().catch(25),
    indicacoes: z.number().catch(20)
  }).optional(),
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
  admissionDate: z.string().optional().catch(''),
  roleType: z.enum(['assessor', 'consultor']).optional(),
  metaLigacoes: z.number().optional().catch(100),
  metaReunioesAgendadas: z.number().optional().catch(15),
  metaReunioesRealizadas: z.number().optional().catch(10),
  metaContasAbertas: z.number().optional().catch(5),
  metaNet: z.number().optional().catch(1000000),
  metaCrossSell: z.number().optional().catch(4),
  realizadoLigacoes: z.number().optional().catch(0),
  realizadoReunioesAgendadas: z.number().optional().catch(0),
  realizadoReunioesRealizadas: z.number().optional().catch(0),
  realizadoContasAbertas: z.number().optional().catch(0),
  realizadoNet: z.number().optional().catch(0),
  realizadoCrossSell: z.number().optional().catch(0),
  crossSellSeguroMeta: z.number().optional().catch(0),
  crossSellSeguroRealizado: z.number().optional().catch(0),
  crossSellConsorcioMeta: z.number().optional().catch(0),
  crossSellConsorcioRealizado: z.number().optional().catch(0),
  crossSellContabilidadeMeta: z.number().optional().catch(0),
  crossSellContabilidadeRealizado: z.number().optional().catch(0),
  crossSellPlanoSaudeMeta: z.number().optional().catch(0),
  crossSellPlanoSaudeRealizado: z.number().optional().catch(0),
  crossSellCambioMeta: z.number().optional().catch(0),
  crossSellCambioRealizado: z.number().optional().catch(0),
  crossSellOutrosMeta: z.number().optional().catch(0),
  crossSellOutrosRealizado: z.number().optional().catch(0),
  photo: z.string().optional(),
  leaderId: z.string().optional(),
  leaderName: z.string().optional(),
  customMonitorMetrics: z.array(z.object({
    key: z.string(),
    name: z.string(),
    target: z.number(),
    real: z.number(),
  })).optional().catch([]),
  individualGoals: z.array(IndividualGoalSchema).optional().catch([]),
  rankingHistory: z.array(z.any()).optional().catch([]),
  timeline: z.array(TimelineEventSchema).optional().catch([]),
  monthlyRecords: z.record(z.string(), SDRMonthlyRecordSchema).optional().catch({}),
  individualWeights: z.object({
    ligacoes: z.number().catch(20),
    reunioes: z.number().catch(35),
    comparecimento: z.number().catch(25),
    indicacoes: z.number().catch(20)
  }).optional(),
});

export const TeamLeaderSchema = z.object({
  id: z.string(),
  teamName: z.string(),
  leaderTitle: z.string(),
  passcode: z.string(),
  name: z.string(),
  photo: z.string().optional(),
  role: z.enum(['admin', 'leader']).optional()
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
  status: z.enum(['Ativo', 'Inativo']).optional().catch('Ativo'),
  disponibilidade: z.enum(['Disponível', 'Ausente', 'Férias', 'Licença', 'Inativo']).optional().catch('Disponível'),
  ordem: z.number().optional().catch(0),
  maxClientesDia: z.number().optional().catch(0),
  maxClientesSemana: z.number().optional().catch(0),
  maxClientesSimultaneos: z.number().optional().catch(0),
  distribuicoesCount: z.number().optional().catch(0),
  lastUsed: z.boolean().optional().catch(false),
  lastUsedAt: z.string().optional(),
});

export const PerformanceGoalSchema = z.object({
  id: z.string(),
  name: z.string(),
  target: z.number(),
  weight: z.number(),
});

export const TeamGoalsSchema = z.object({
  agendamentos: z.number().catch(150),
  efetivacoes: z.number().catch(80),
  contasAbertas: z.number().catch(35),
  teamSpecificAgendamentos: z.record(z.string(), z.number()).optional().catch({}),
  customMetrics: z.array(z.object({
    id: z.string(),
    name: z.string(),
    target: z.number(),
  })).optional().catch([]),
  teamSpecificGoals: z.record(z.string(), z.any()).optional().catch({}),
  performanceGoals: z.array(PerformanceGoalSchema).optional().catch([]),
  wealthDealsGoal: z.number().optional().catch(12),
  wealthRevenueGoal: z.number().optional().catch(1600000),
});

export const NegocioFechadoProdutoSchema = z.object({
  produtoCategoria: z.enum([
    'INVESTIMENTOS_XP',
    'OPERACAO_COMPROMISSADA',
    'CAMBIO',
    'PREVIDENCIA',
    'SEGURO_VIDA',
    'SEGURO_EM_VIDA',
    'RESPONSABILIDADE_CIVIL',
    'CONSORCIO_IMOBILIARIO',
    'CONSORCIO_AUTOMOTIVO',
    'SUCESSAO_PATRIMONIAL',
    'CONTABILIDADE'
  ]),
  receitaEstimada: z.number().catch(0),
});

export const NegocioFechadoSchema = z.object({
  id: z.string(),
  sdrId: z.string().optional().catch(''),
  sdrName: z.string().optional().catch(''),
  assessorId: z.string().optional().catch(''),
  assessorName: z.string().optional().catch(''),
  clientName: z.string(),
  dataCriacaoLead: z.string(),
  dataFechamento: z.string(),
  produtoCategoria: z.enum([
    'INVESTIMENTOS_XP',
    'OPERACAO_COMPROMISSADA',
    'CAMBIO',
    'PREVIDENCIA',
    'SEGURO_VIDA',
    'SEGURO_EM_VIDA',
    'RESPONSABILIDADE_CIVIL',
    'CONSORCIO_IMOBILIARIO',
    'CONSORCIO_AUTOMOTIVO',
    'SUCESSAO_PATRIMONIAL',
    'CONTABILIDADE'
  ]),
  status: z.enum(['GANHO', 'PERDIDO', 'EM_NEGOCIACAO']),
  volumeFinanceiro: z.number(),
  receitaEstimada: z.number(),
  produtos: z.array(NegocioFechadoProdutoSchema).optional().catch([]),
  origemCliente: z.enum(['TROCA_ASSESSORIA', 'ABERTURA_CONTA']).optional().catch('ABERTURA_CONTA'),
  situacaoCliente: z.enum(['ATIVO_APORTANDO', 'INATIVO_SEM_APORTES']).optional().catch('ATIVO_APORTANDO'),
});

export const NegociosArraySchema = z.array(NegocioFechadoSchema);
