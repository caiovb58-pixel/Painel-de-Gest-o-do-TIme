import { SDR, Assessor, NegocioFechado } from './types';

export const INITIAL_SDRS: SDR[] = [
  {
    id: 'sdr-caio-1',
    name: 'Thiago Nobre',
    agendamentosCount: 0,
    efetivacoesCount: 0,
    metaAgendamentos: 30,
    metaEfetivacaoRate: 55,
    active: true,
    admissionDate: '2023-05-12',
    team: 'Equipe do Caio',
    callsCount: 0,
    monthlyRecords: {
      '2026-05': {
        agendamentosCount: 28,
        efetivacoesCount: 17,
        callsCount: 140,
        metaAgendamentos: 30,
        metaEfetivacaoRate: 55,
        metaEfetivacoes: 16,
        metaContasAbertas: 5,
        contasAbertasCount: 4,
      }
    }
  },
  {
    id: 'sdr-caio-2',
    name: 'Amanda Rebouças',
    agendamentosCount: 0,
    efetivacoesCount: 0,
    metaAgendamentos: 25,
    metaEfetivacaoRate: 50,
    active: true,
    admissionDate: '2024-02-18',
    team: 'Equipe do Caio',
    callsCount: 0,
    monthlyRecords: {
      '2026-05': {
        agendamentosCount: 22,
        efetivacoesCount: 12,
        callsCount: 112,
        metaAgendamentos: 25,
        metaEfetivacaoRate: 50,
        metaEfetivacoes: 12,
        metaContasAbertas: 5,
        contasAbertasCount: 3,
      }
    }
  },
  {
    id: 'sdr-1',
    name: 'Ana Silva',
    agendamentosCount: 0,
    efetivacoesCount: 0,
    metaAgendamentos: 30,
    metaEfetivacaoRate: 50,
    active: true,
    admissionDate: '2024-03-10',
    team: 'Equipe Alpha',
    callsCount: 0,
    monthlyRecords: {
      '2026-05': {
        agendamentosCount: 25,
        efetivacoesCount: 15,
        callsCount: 95,
        metaAgendamentos: 30,
        metaEfetivacaoRate: 50,
        metaEfetivacoes: 15,
        metaContasAbertas: 5,
        contasAbertasCount: 4,
      }
    }
  },
  {
    id: 'sdr-2',
    name: 'Bruno Ramos',
    agendamentosCount: 0,
    efetivacoesCount: 0,
    metaAgendamentos: 20,
    metaEfetivacaoRate: 50,
    active: true,
    admissionDate: '2024-06-15',
    team: 'Equipe Beta',
    callsCount: 0,
    monthlyRecords: {
      '2026-05': {
        agendamentosCount: 18,
        efetivacoesCount: 9,
        callsCount: 88,
        metaAgendamentos: 20,
        metaEfetivacaoRate: 50,
        metaEfetivacoes: 10,
        metaContasAbertas: 5,
        contasAbertasCount: 2,
      }
    }
  },
  {
    id: 'sdr-3',
    name: 'Carlos Oliveira',
    agendamentosCount: 0,
    efetivacoesCount: 0,
    metaAgendamentos: 35,
    metaEfetivacaoRate: 60,
    active: true,
    admissionDate: '2023-11-01',
    team: 'Equipe Alpha',
    callsCount: 0,
    monthlyRecords: {
      '2026-05': {
        agendamentosCount: 32,
        efetivacoesCount: 24,
        callsCount: 150,
        metaAgendamentos: 35,
        metaEfetivacaoRate: 60,
        metaEfetivacoes: 21,
        metaContasAbertas: 7,
        contasAbertasCount: 6,
      }
    }
  },
  {
    id: 'sdr-4',
    name: 'Daniela Costa',
    agendamentosCount: 0,
    efetivacoesCount: 0,
    metaAgendamentos: 15,
    metaEfetivacaoRate: 50,
    active: true,
    admissionDate: '2025-01-20',
    team: 'Equipe Delta',
    callsCount: 0,
    monthlyRecords: {
      '2026-05': {
        agendamentosCount: 14,
        efetivacoesCount: 7,
        callsCount: 60,
        metaAgendamentos: 15,
        metaEfetivacaoRate: 50,
        metaEfetivacoes: 7,
        metaContasAbertas: 4,
        contasAbertasCount: 3,
      }
    }
  },
  {
    id: 'sdr-5',
    name: 'Eduardo Santos',
    agendamentosCount: 0,
    efetivacoesCount: 0,
    metaAgendamentos: 15,
    metaEfetivacaoRate: 40,
    active: false,
    admissionDate: '2025-02-15',
    team: 'Equipe Beta',
    callsCount: 0,
    monthlyRecords: {
      '2026-05': {
        agendamentosCount: 10,
        efetivacoesCount: 3,
        callsCount: 45,
        metaAgendamentos: 15,
        metaEfetivacaoRate: 40,
        metaEfetivacoes: 6,
        metaContasAbertas: 4,
        contasAbertasCount: 1,
      }
    }
  }
];

export const INITIAL_ASSESSORES: Assessor[] = [
  {
    id: 'assr-caio-1',
    name: 'Marcelo Costa (Horizon)',
    active: true,
    agendaLink: 'https://calendly.com/marcelo-costa-horizon',
    exclusiveSdrId: '',
    participatesInRotation: true,
    team: 'Equipe do Caio',
  },
  {
    id: 'assr-caio-2',
    name: 'Rafaela Nogueira (Vinci)',
    active: true,
    agendaLink: 'https://calendly.com/rafaela-nogueira-vinci',
    exclusiveSdrId: '',
    participatesInRotation: true,
    team: 'Equipe do Caio',
  },
  {
    id: 'assr-1',
    name: 'Mariana Lima (Ápice Invest)',
    active: true,
    agendaLink: 'https://calendly.com/mariana-lima-apice',
    exclusiveSdrId: '',
    participatesInRotation: true,
    team: 'Equipe Alpha',
  },
  {
    id: 'assr-2',
    name: 'Rodrigo Mello (Sul Capital)',
    active: true,
    agendaLink: 'https://calendly.com/rodrigo-mello',
    exclusiveSdrId: '',
    participatesInRotation: true,
    team: 'Equipe Beta',
  },
  {
    id: 'assr-3',
    name: 'Fernanda Albuquerque (Solidez)',
    active: true,
    agendaLink: 'https://calendly.com/fernanda-albuquerque',
    exclusiveSdrId: '',
    participatesInRotation: true,
    team: 'Equipe Delta',
  },
  {
    id: 'assr-4',
    name: 'Gabriel Rezende (Forte)',
    active: false,
    agendaLink: '',
    exclusiveSdrId: '',
    participatesInRotation: false,
    team: 'Equipe Beta',
  },
  {
    id: 'assr-5',
    name: 'Priscila Nogueira (Horizonte)',
    active: true,
    agendaLink: 'https://calendly.com/priscila-nogueira',
    exclusiveSdrId: 'sdr-1', // Exclusive to Ana Silva
    participatesInRotation: false,
    team: 'Equipe Alpha',
  },
  {
    id: 'assr-6',
    name: 'Thiago Martins (Vanguard)',
    active: true,
    agendaLink: 'https://calendly.com/thiago-vanguard',
    exclusiveSdrId: '',
    participatesInRotation: true,
    team: 'Equipe Delta',
  }
];

export const INITIAL_NEGOCIOS: NegocioFechado[] = [
  {
    id: 'neg-1',
    sdrId: 'sdr-caio-1',
    sdrName: 'Thiago Nobre',
    assessorId: 'assr-caio-1',
    assessorName: 'Marcel Costa (Horizon)',
    clientName: 'Grupo Aliança',
    dataCriacaoLead: '2026-03-05T00:00:00Z',
    dataFechamento: '2026-05-10T00:00:00Z',
    produtoCategoria: 'INVESTIMENTOS_XP',
    status: 'GANHO',
    volumeFinanceiro: 10000000,
    receitaEstimada: 50000
  },
  {
    id: 'neg-2',
    sdrId: 'sdr-caio-2',
    sdrName: 'Amanda Rebouças',
    assessorId: 'assr-caio-2',
    assessorName: 'Rafaela Nogueira (Vinci)',
    clientName: 'Dra. Rebeca Carvalho',
    dataCriacaoLead: '2026-04-12T00:00:00Z',
    dataFechamento: '2026-05-18T00:00:00Z',
    produtoCategoria: 'SUCESSAO_PATRIMONIAL',
    status: 'GANHO',
    volumeFinanceiro: 5000000,
    receitaEstimada: 75000
  },
  {
    id: 'neg-3',
    sdrId: 'sdr-1',
    sdrName: 'Ana Silva',
    assessorId: 'assr-1',
    assessorName: 'Mariana Lima (Ápice Invest)',
    clientName: 'Holding JHB',
    dataCriacaoLead: '2026-02-15T00:00:00Z',
    dataFechamento: '2026-05-20T00:00:00Z',
    produtoCategoria: 'OPERACAO_COMPROMISSADA',
    status: 'GANHO',
    volumeFinanceiro: 15000000,
    receitaEstimada: 90000
  },
  {
    id: 'neg-4',
    sdrId: 'sdr-2',
    sdrName: 'Bruno Ramos',
    assessorId: 'assr-2',
    assessorName: 'Rodrigo Mello (Sul Capital)',
    clientName: 'Lojas Sul Var',
    dataCriacaoLead: '2026-05-02T00:00:00Z',
    dataFechamento: '2026-05-28T00:00:00Z',
    produtoCategoria: 'CAMBIO',
    status: 'GANHO',
    volumeFinanceiro: 3500000,
    receitaEstimada: 35000
  },
  {
    id: 'neg-5',
    sdrId: 'sdr-3',
    sdrName: 'Carlos Oliveira',
    assessorId: 'assr-1',
    assessorName: 'Mariana Lima (Ápice Invest)',
    clientName: 'Agro S.A.',
    dataCriacaoLead: '2026-04-20T00:00:00Z',
    dataFechamento: '2026-06-02T00:00:00Z',
    produtoCategoria: 'INVESTIMENTOS_XP',
    status: 'GANHO',
    volumeFinanceiro: 20000000,
    receitaEstimada: 100000
  },
  {
    id: 'neg-6',
    sdrId: 'sdr-caio-2',
    sdrName: 'Amanda Rebouças',
    assessorId: 'assr-caio-2',
    assessorName: 'Rafaela Nogueira (Vinci)',
    clientName: 'Clínica Médica Premium',
    dataCriacaoLead: '2026-05-10T00:00:00Z',
    dataFechamento: '2026-06-08T00:00:00Z',
    produtoCategoria: 'SEGURO_EM_VIDA',
    status: 'GANHO',
    volumeFinanceiro: 1500000,
    receitaEstimada: 22000
  },
  {
    id: 'neg-7',
    sdrId: 'sdr-1',
    sdrName: 'Ana Silva',
    assessorId: 'assr-1',
    assessorName: 'Mariana Lima (Ápice Invest)',
    clientName: 'Eduardo Fonseca',
    dataCriacaoLead: '2026-04-05T00:00:00Z',
    dataFechamento: '2026-06-05T00:00:00Z',
    produtoCategoria: 'CONSORCIO_IMOBILIARIO',
    status: 'GANHO',
    volumeFinanceiro: 4000000,
    receitaEstimada: 40000
  },
  {
    id: 'neg-8',
    sdrId: 'sdr-caio-1',
    sdrName: 'Thiago Nobre',
    assessorId: 'assr-caio-1',
    assessorName: 'Marcel Costa (Horizon)',
    clientName: 'Smart Logística',
    dataCriacaoLead: '2026-05-15T00:00:00Z',
    dataFechamento: '2026-06-09T00:00:00Z',
    produtoCategoria: 'CONTABILIDADE',
    status: 'GANHO',
    volumeFinanceiro: 1200000,
    receitaEstimada: 18000
  },
  {
    id: 'neg-9',
    sdrId: 'sdr-caio-1',
    sdrName: 'Thiago Nobre',
    assessorId: 'assr-caio-1',
    assessorName: 'Marcel Costa (Horizon)',
    clientName: 'Condomínio Solaris',
    dataCriacaoLead: '2026-05-20T00:00:00Z',
    dataFechamento: '2026-06-10T00:00:00Z',
    produtoCategoria: 'RESPONSABILIDADE_CIVIL',
    status: 'EM_NEGOCIACAO',
    volumeFinanceiro: 600000,
    receitaEstimada: 9000
  },
  {
    id: 'neg-10',
    sdrId: 'sdr-2',
    sdrName: 'Bruno Ramos',
    assessorId: 'assr-2',
    assessorName: 'Rodrigo Mello (Sul Capital)',
    clientName: 'Renato Albuquerque',
    dataCriacaoLead: '2026-05-01T00:00:00Z',
    dataFechamento: '2026-05-25T00:00:00Z',
    produtoCategoria: 'PREVIDENCIA',
    status: 'PERDIDO',
    volumeFinanceiro: 2000000,
    receitaEstimada: 15000
  }
];

