export interface SDRMonthlyRecord {
  agendamentosCount: number;
  efetivacoesCount: number;
  contasAbertasCount?: number;
  callsCount?: number;
  metaAgendamentos: number;
  metaEfetivacoes?: number;
  metaEfetivacaoRate?: number;
  metaContasAbertas?: number;
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
  active: boolean;
  admissionDate?: string; // Data de admissão do SDR
  team?: string; // Equipe à qual o SDR pertence
  monthlyRecords?: Record<string, SDRMonthlyRecord>; // Histórico de metas e entregas mensais
  promotedToAssessor?: boolean; // Se o SDR foi promovido para assessor
  promotedDate?: string; // Data da promoção
  promotedAssessorId?: string; // ID do assessor criado a partir de sua promoção
  professionalProfile?: string; // Perfil profissional: 'comercial' | 'gestao' | 'analitico' | 'operacional' e etc.
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
}

export interface TeamLeader {
  id: string;
  teamName: string;
  leaderTitle: string;
  passcode: string;
  name: string;
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
}

export interface TeamGoals {
  agendamentos: number;
  efetivacoes: number;
  contasAbertas: number;
  teamSpecificAgendamentos?: Record<string, number>;
}

export interface AuthUser {
  role: 'admin' | 'leader';
  teamName?: string;
  leaderTitle?: string;
  name: string;
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
}



