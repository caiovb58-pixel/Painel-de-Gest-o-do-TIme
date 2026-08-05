export interface RankingHistoryItem {
  date: string;
  score: number;
  rank: 'A' | 'B' | 'C';
}

export interface SDRMonthlyRecord {
  agendamentosCount: number;
  efetivacoesCount: number;
  contasAbertasCount?: number;
  callsCount?: number;
  metaAgendamentos: number;
  metaEfetivacoes?: number;
  metaEfetivacaoRate?: number;
  metaContasAbertas?: number;
  metaLigacoes?: number;
  // Store historical goal configurations in the monthly record
  configuredGoals?: IndividualGoal[];
}

export interface IndividualGoal {
  id: string;
  name: string;
  target: number;
  weight: number;
  type: 'quantity' | 'percentage' | 'currency' | string;
  period: 'mensal' | 'semanal' | 'diario' | string;
  realized?: number;
  startDate?: string; // Data de início da vigência (YYYY-MM-DD)
  endDate?: string;   // Data de término da vigência (YYYY-MM-DD)
  changedBy?: string; // Usuário que alterou
  changedAt?: string; // Timestamp ISO de alteração
}

export interface TimelineEvent {
  id: string;
  timestamp: string; // ISO String
  type: 'admission' | 'role_change' | 'team_change' | 'promotion' | 'goal_change' | 'weight_change' | 'feedback' | 'ranking_change' | 'audit' | 'custom';
  title: string;
  description: string;
  user: string; // Usuário responsável
  oldValue?: string;
  newValue?: string;
  reason?: string;
}

export interface SystemAuditLog {
  id: string;
  timestamp: string; // ISO String
  user: string;
  operation: string; // Operação realizada
  targetId: string;
  targetName: string;
  previousValue?: string;
  newValue?: string;
  reason?: string;
}

export interface SDR {
  id: string;
  name: string;
  agendamentosCount: number; // Número de agendamentos (default/legacy)
  efetivacoesCount: number; // Número de efetivações (default/legacy)
  contasAbertasCount?: number; // Número de contas abertas pelo SDR
  callsCount?: number; // Número de ligações registradas
  metaAgendamentos: number; // Meta de agendamentos para o SDR
  metaEfetivacoes?: number; // Meta absoluta de efetivações para o SDR
  metaEfetivacaoRate: number; // Meta de taxa de efetivação para o SDR (ex: 60 para 60%) (default/legacy)
  metaContasAbertas?: number; // Meta de contas abertas para o SDR
  metaLigacoes?: number; // Meta de ligações para o SDR
  individualGoals?: IndividualGoal[];
  active: boolean;
  admissionDate?: string; // Data de admissão do SDR
  team?: string; // Equipe à qual o SDR pertence
  monthlyRecords?: Record<string, SDRMonthlyRecord>; // Histórico de metas e entregas mensais
  promotedToAssessor?: boolean; // Se o SDR foi promovido para assessor
  promotedDate?: string; // Data da promoção
  promotedAssessorId?: string; // ID do assessor criado a partir de sua promoção
  professionalProfile?: string; // Perfil profissional: 'comercial' | 'gestao' | 'analitico' | 'operacional' e etc.
  photo?: string; // Foto do SDR (Base64 ou URL)
  cargo?: 'SDR'; // 'SDR'
  equipe?: 'PF' | 'PJ' | 'EMPRESAS' | string; // Equipe de vendas do SDR
  liderId?: string; // ID do líder do SDR
  leaderId?: string; // Keep both for backward compatibility and mapping!
  rankingHistory?: RankingHistoryItem[]; // Histórico de evolução de ranking
  timeline?: TimelineEvent[]; // Linha do tempo profissional permanente
  individualWeights?: {
    ligacoes: number;
    reunioes: number;
    comparecimento: number;
    indicacoes: number;
  };
  rotationLogs?: any[];
  rotationAuditLogs?: any[];
}

export interface Assessor {
  id: string;
  name: string;
  active: boolean;
  agendaLink?: string; // Link da agenda (ex: Calendly)
  exclusiveSdrId?: string; // Legacy parameter (optional)
  exclusiveSdrIds?: string[]; // IDs dos SDRs se for assessor exclusivo (permite mais de 1)
  participatesInRotation?: boolean; // Se participa do rodízio ativo no mês corrent
  team?: string; // Equipe à qual o assessor pertence
  captacaoMes?: number; // Captação do mês (R$)
  crossSellCount?: number; // Quantidade de cross-sell
  crossSellDetails?: string; // Detalhes de cross-sell
  professionalProfile?: string; // Perfil profissional: 'comercial' | 'gestao' | 'analitico' | 'operacional' e etc.
  admissionDate?: string; // Data de admissão do Assessor

  // --- New Goal Alignment Fields per Assessor & Consultant ---
  roleType?: 'assessor' | 'consultor'; // Typology (Assessor vs Consultor)
  
  metaLigacoes?: number; // Ligações Goal
  metaReunioesAgendadas?: number; // Reuniões Agendadas Goal
  metaReunioesRealizadas?: number; // Reuniões Realizadas Goal
  metaContasAbertas?: number; // Contas Abertas Goal
  metaNet?: number; // NET Inbound Goal
  metaCrossSell?: number; // Cross Sell Qty Goal
  metaClientes?: number; // Clientes Goal
  metaIndicacoes?: number; // Indicações Goal
  
  realizadoLigacoes?: number; // Ligações Accomplished
  realizadoReunioesAgendadas?: number; // Reuniões Agendadas Accomplished
  realizadoReunioesRealizadas?: number; // Reuniões Realizadas Accomplished
  realizadoContasAbertas?: number; // Contas Abertas Accomplished
  realizadoNet?: number; // NET Inbound Accomplished
  realizadoCrossSell?: number; // Cross Sell Qty Accomplished
  realizadoClientes?: number; // Clientes Accomplished
  realizadoIndicacoes?: number; // Indicações Accomplished

  // Detailed Cross-Sell Products Metas & Realizados (Seguro, Consórcio, Contabilidade, Plano de Saúde, Câmbio etc.)
  crossSellSeguroMeta?: number;
  crossSellSeguroRealizado?: number;
  
  crossSellConsorcioMeta?: number;
  crossSellConsorcioRealizado?: number;
  
  crossSellContabilidadeMeta?: number;
  crossSellContabilidadeRealizado?: number;
  
  crossSellPlanoSaudeMeta?: number;
  crossSellPlanoSaudeRealizado?: number;
  
  crossSellCambioMeta?: number;
  crossSellCambioRealizado?: number;
  
  crossSellOutrosMeta?: number;
  crossSellOutrosRealizado?: number;

  photo?: string; // Foto do Assessor/Consultor (Base64 ou URL)
  leaderId?: string; // ID do líder responsável
  leaderName?: string; // Nome do líder responsável
  customMonitorMetrics?: {
    key: string;
    name: string;
    target: number;
    real: number;
  }[];
  cargo?: 'ASSESSOR' | 'CONSULTOR'; // Cargo
  equipe?: 'PF' | 'PJ' | 'EMPRESAS' | string; // Equipe de vendas
  liderId?: string; // ID do líder
  rankingHistory?: RankingHistoryItem[]; // Histórico de evolução de ranking
  timeline?: TimelineEvent[]; // Linha do tempo profissional permanente
  monthlyRecords?: Record<string, SDRMonthlyRecord>; // Histórico de metas e entregas mensais
  individualWeights?: {
    ligacoes: number;
    reunioes: number;
    comparecimento: number;
    indicacoes: number;
  };
  individualGoals?: IndividualGoal[];
}

export interface TeamLeader {
  id: string;
  teamName: string;
  leaderTitle: string;
  passcode: string;
  name: string;
  photo?: string;
  role?: 'admin' | 'leader';
  cargo?: 'LIDER'; // Cargo do líder (sempre 'LIDER')
  equipe?: 'PF' | 'PJ' | 'EMPRESAS' | string; // Equipe liderada
  liderId?: string; // ID do líder do líder se aplicável (alias do próprio id)
}

export interface MatchResult {
  sdrId: string;
  sdrName: string;
  sdrConversionRate: number;
  assessorId: string;
  assessorName: string;
  startDate?: string;
  endDate?: string;
  isExclusive?: boolean;
  status?: 'Ativo' | 'Inativo';
  disponibilidade?: 'Disponível' | 'Ausente' | 'Férias' | 'Licença' | 'Inativo';
  ordem?: number;
  maxClientesDia?: number;
  maxClientesSemana?: number;
  maxClientesSimultaneos?: number;
  distribuicoesCount?: number;
  lastUsed?: boolean;
  lastUsedAt?: string;
}

export interface CustomMetric {
  id: string;
  name: string;
  target: number;
}

export interface PerformanceGoal {
  id: string;
  name: string;
  target: number;
  weight: number; // weight as percentage, e.g. 20 for 20%
  description?: string;
  type?: 'quantity' | 'percentage' | 'currency' | 'hours' | 'days' | string;
  order?: number;
}

export interface TeamGoals {
  agendamentos: number;
  efetivacoes: number;
  contasAbertas: number;
  teamSpecificAgendamentos?: Record<string, number>;
  customMetrics?: CustomMetric[];
  teamSpecificGoals?: Record<string, TeamGoals>;
  performanceGoals?: PerformanceGoal[];
  wealthDealsGoal?: number;
  wealthRevenueGoal?: number;
  monthlyPlans?: Record<string, Record<string, PerformanceGoal[]>>; // month -> teamName -> goals
}

export interface AuthUser {
  id?: string;
  role: 'admin' | 'leader';
  teamName?: string;
  leaderTitle?: string;
  name: string;
  photo?: string;
  cargo?: 'LIDER' | 'ADMIN'; // Cargo do usuário logado
  equipe?: 'PF' | 'PJ' | 'EMPRESAS' | string; // Equipe do usuário logado
  liderId?: string; // ID do líder
}

// --- NEW DATA SCHEMAS FOR STAFF+ COCKPIT ---
export interface AuditLog {
  id: string;
  sdrId: string;
  sdrName: string;
  leader: string;
  timestamp: string;
  score: {
    abordagem: number; // A - Abordagem
    conexao: number;   // C - Conexão
    especialidade: number; // E - Especialidade
    proposta: number;  // P - Proposta
    tomadaDecisao: number; // T - Tomada de Decisão
    objecoes: number;  // O - Objeções
  };
  totalScore: number;
  notes: string;
}

export interface OneOnOneLog {
  id: string;
  sdrId: string;
  sdrName: string;
  leader: string;
  timestamp: string;
  status: 'EM_RISCO' | 'NO_CAMINHO' | 'OUTLIER';
  actionPlan: string;
  nextMeeting: string;
  notes: string;
  aiFeedback?: string;
  professionalProfile?: string; // Avaliação de perfil profissional registrada
  answers?: Record<string, string>;
}

export interface IntegrationSettings {
  webhookUrl: string;
  lastSendStatus: 'success' | 'failed' | 'none';
  lastSendHttpStatus: number | null;
  lastSendTimestamp: string | null;
  enabled: boolean;
}

export interface TeamCampaign {
  id: string;
  name: string;
  team: string;
  subTeams?: string[];
  objective: 'agendamentos' | 'efetivacoes' | 'contas_abertas' | 'taxa_efetivacao' | 'taxa_conversao_contas';
  targetValue: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'draft';
  reward?: string;
}

export type ProductType = 
  | 'INVESTIMENTOS_XP'
  | 'OPERACAO_COMPROMISSADA'
  | 'CAMBIO'
  | 'PREVIDENCIA'
  | 'SEGURO_VIDA'
  | 'SEGURO_EM_VIDA'
  | 'RESPONSABILIDADE_CIVIL'
  | 'CONSORCIO_IMOBILIARIO'
  | 'CONSORCIO_AUTOMOTIVO'
  | 'SUCESSAO_PATRIMONIAL'
  | 'CONTABILIDADE';

export interface NegocioFechadoProduto {
  produtoCategoria: ProductType;
  receitaEstimada: number;
}

export interface NegocioFechado {
  id: string;
  sdrId?: string;
  sdrName?: string;
  assessorId?: string;
  assessorName?: string;
  clientName: string;
  dataCriacaoLead: string;
  dataFechamento: string;
  produtoCategoria: ProductType;
  status: 'GANHO' | 'PERDIDO' | 'EM_NEGOCIACAO';
  volumeFinanceiro: number;
  receitaEstimada: number;
  produtos?: NegocioFechadoProduto[];
  origemCliente?: 'TROCA_ASSESSORIA' | 'ABERTURA_CONTA';
  situacaoCliente?: 'ATIVO_APORTANDO' | 'INATIVO_SEM_APORTES';
  classificacao?: string;
}

export interface RotationParticipant {
  id: string;
  name: string;
  cargo: 'Assessor' | 'Consultor';
  equipe: string;
  status: 'Ativo' | 'Inativo' | 'Arquivado';
  cadastroType: 'Oficial' | 'Manual';
  observacoes?: string;
  officialId?: string;
  createdAt: string;
}

export interface RotationHistoryEntry {
  id: string;
  timestamp: string; // ISO timestamp
  user: string; // Responsible user
  operation: string; // e.g. "Criação", "Edição", "Arquivamento", "Reativação", "Criação de vínculo", "Remoção de vínculo"
  details: string; // Human-friendly description
  participantId?: string;
  participantName?: string;
  sdrId?: string;
  sdrName?: string;
}



