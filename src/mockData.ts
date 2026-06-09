import { SDR, Assessor } from './types';

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
