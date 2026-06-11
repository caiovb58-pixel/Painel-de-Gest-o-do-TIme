import React, { useState, useMemo, useEffect } from 'react';
import Markdown from 'react-markdown';
import { SDR, Assessor, TeamGoals, OneOnOneLog, TeamCampaign } from '../types';
import useAppStore from '../store/useAppStore';
import { DateService } from '../shared/services/date.service';
import { 
  Plus, Trash2, Shield, User, ToggleLeft, ToggleRight, X, Search,
  Target, TrendingUp, Edit2, Check, AlertTriangle, HelpCircle, 
  Save, Filter, Award, CheckCircle2, Award as Crown, RefreshCw, Calendar, Sparkles, AlertCircle, PhoneCall, Building2,
  Cpu, Send, Compass, UserMinus, ShieldAlert, Award as Trophy, Activity, Gift, Clock, History
} from 'lucide-react';

interface SDRSectionProps {
  sdrs: SDR[];
  assessores?: Assessor[];
  currentUser?: any;
  onAddSDR: (sdr: Omit<SDR, 'id'>) => void;
  onDeleteSDR: (id: string) => void;
  onToggleActiveSDR: (id: string) => void;
  onUpdateSDRMetrics: (id: string, agendamentos: number, efetivacoes: number) => void;
  onUpdateSDR?: (id: string, updatedFields: Partial<SDR>) => void;
  onUpdateAssessor?: (id: string, updatedFields: Partial<Assessor>) => void;
  onAddAssessor?: (assr: Omit<Assessor, 'id'>) => void;
  teamGoals?: TeamGoals;
  onUpdateTeamGoals?: (goals: Partial<TeamGoals>) => void;
  teams: string[];
  onAddTeam: (name: string) => void;
  onDeleteTeam: (name: string) => void;
  onRenameTeam: (oldName: string, newName: string) => void;
  onRevertPromotion: (sdrId: string) => void;
  oneOnOneLogs?: OneOnOneLog[];
  onAddOneOnOneLog?: (log: Omit<OneOnOneLog, 'id' | 'timestamp'>) => void;
  onDeleteOneOnOneLog?: (id: string) => void;
  campaigns?: TeamCampaign[];
  onAddCampaign?: (campaign: Omit<TeamCampaign, 'id'>) => void;
  onDeleteCampaign?: (id: string) => void;
  onUpdateCampaignStatus?: (id: string, status: TeamCampaign['status']) => void;
}

export default function SDRSection({
  sdrs,
  assessores = [],
  currentUser,
  onAddSDR,
  onDeleteSDR,
  onToggleActiveSDR,
  onUpdateSDRMetrics,
  onUpdateSDR,
  onUpdateAssessor,
  onAddAssessor,
  teamGoals = { agendamentos: 100, efetivacoes: 50, contasAbertas: 30 },
  onUpdateTeamGoals,
  teams,
  onAddTeam,
  onDeleteTeam,
  onRenameTeam,
  onRevertPromotion,
  oneOnOneLogs = [],
  onAddOneOnOneLog,
  onDeleteOneOnOneLog,
  campaigns = [],
  onAddCampaign,
  onDeleteCampaign,
  onUpdateCampaignStatus,
}: SDRSectionProps) {
  const currentMonth = useAppStore(state => state.currentMonth);
  const disabledRotationTeams = useAppStore(state => state.disabledRotationTeams) || [];
  const toggleRotationForTeam = useAppStore(state => state.toggleRotationForTeam);
  // Sub-tabs inside the SDR Section to centralize registration and targets
  const [subTab, setSubTab] = useState<'list' | 'goals' | 'teams' | 'campaigns' | 'one_on_one'>('list');
  const [customAIPrompt, setCustomAIPrompt] = useState<string>('');
  const [aiReport, setAiReport] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  // 1:1 local states
  const activeSDRsOnly = useMemo(() => sdrs.filter(s => s.active), [sdrs]);
  
  // A combined memo for easy lookup and select list rendering with team information
  const allProfessionals = useMemo(() => {
    const list: Array<{ id: string; name: string; isAssessor: boolean; active: boolean; professionalProfile?: string; data: any; team?: string }> = [];
    sdrs.forEach(s => {
      list.push({ id: s.id, name: `${s.name} (SDR)`, isAssessor: false, active: s.active, professionalProfile: s.professionalProfile, data: s, team: s.team });
    });
    (assessores || []).forEach(a => {
      list.push({ id: a.id, name: `${a.name} (Assessor)`, isAssessor: true, active: a.active, professionalProfile: a.professionalProfile, data: a, team: a.team });
    });
    return list;
  }, [sdrs, assessores]);

  // Local state for 1:1 team selection filter
  const [oneOnOneTeamFilter, setOneOnOneTeamFilter] = useState<string>('all');

  const filteredProfessionals = useMemo(() => {
    if (oneOnOneTeamFilter === 'all') {
      return allProfessionals;
    }
    return allProfessionals.filter(p => p.team === oneOnOneTeamFilter);
  }, [allProfessionals, oneOnOneTeamFilter]);

  const [sessionSdrId, setSessionSdrId] = useState<string>('');
  const [sessionLeaderName, setSessionLeaderName] = useState<string>('Líder do Time');
  const [sessionStatus, setSessionStatus] = useState<'EM_RISCO' | 'NO_CAMINHO' | 'OUTLIER'>('NO_CAMINHO');
  const [sessionProfessionalProfile, setSessionProfessionalProfile] = useState<string>('comercial');
  const [sessionPsychNotes, setSessionPsychNotes] = useState<string>('');
  const [sessionTacticalNotes, setSessionTacticalNotes] = useState<string>('');
  const [sessionActionPlan, setSessionActionPlan] = useState<string>('');
  const [sessionNextMeeting, setSessionNextMeeting] = useState<string>('');
  const [sessionAiLoading, setSessionAiLoading] = useState<boolean>(false);
  const [sessionAiFeedback, setSessionAiFeedback] = useState<string>('');
  const [sessionError, setSessionError] = useState<string>('');
  const [sessionSuccess, setSessionSuccess] = useState<string>('');
  const [diagnosedByAI, setDiagnosedByAI] = useState<string>('');

  // Local state for editing metrics directly in 1:1 scorecard card
  const [isEditingScorecard, setIsEditingScorecard] = useState<boolean>(false);
  const [editSdrAgendamentos, setEditSdrAgendamentos] = useState<number>(0);
  const [editSdrEfetivacoes, setEditSdrEfetivacoes] = useState<number>(0);
  const [editSdrCalls, setEditSdrCalls] = useState<number>(0);
  const [editSdrContasAbertas, setEditSdrContasAbertas] = useState<number>(0);

  const [editAssrCaptacao, setEditAssrCaptacao] = useState<number>(0);
  const [editAssrCrossSell, setEditAssrCrossSell] = useState<number>(0);
  const [editAssrCrossSellDetails, setEditAssrCrossSellDetails] = useState<string>('');

  // 1:1 Scheduler & Planner States
  const [oneOnOneSection, setOneOnOneSection] = useState<'scheduler' | 'registration' | 'history'>('scheduler');
  const [oneOnOneSchedules, setOneOnOneSchedules] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('rodizio_one_on_one_schedules');
      if (saved) return JSON.parse(saved);
    } catch {}
    
    // Initial high-fidelity schedules
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    return [
      {
        id: 'sched-1',
        sdrId: '1',
        sdrName: 'Arthur Dent',
        leader: 'Priscilla Vance',
        dateTime: `${todayStr}T14:30`,
        topic: 'Pitch Comercial',
        status: 'AGENDADA',
        notes: 'Alinhamento fino de qualificação de leads de topo de funil.'
      },
      {
        id: 'sched-2',
        sdrId: '2',
        sdrName: 'Beatriz Santos',
        leader: 'Marcus Aurelius',
        dateTime: `${tomorrowStr}T10:00`,
        topic: 'Objeções de Corretagem',
        status: 'AGENDADA',
        notes: 'Simulação tática e refinamento do script de gatilhos mentais.'
      },
      {
        id: 'sched-3',
        sdrId: '3',
        sdrName: 'Carlos Silva',
        leader: 'Marcus Aurelius',
        dateTime: `${yesterdayStr}T15:00`,
        topic: 'Alinhamento de Metas',
        status: 'AGENDADA',
        notes: 'Verificar pipeline de agendamentos pendentes.'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('rodizio_one_on_one_schedules', JSON.stringify(oneOnOneSchedules));
  }, [oneOnOneSchedules]);

  // Schedule form states
  const [schedSdrId, setSchedSdrId] = useState<string>('');
  const [schedLeader, setSchedLeader] = useState<string>('Líder do Time');
  const [schedDateTime, setSchedDateTime] = useState<string>('');
  const [schedTopic, setSchedTopic] = useState<string>('Alinhamento de Metas');
  const [schedNotes, setSchedNotes] = useState<string>('');
  const [schedSuccess, setSchedSuccess] = useState<string>('');
  const [schedError, setSchedError] = useState<string>('');
  const [schedFilterSdr, setSchedFilterSdr] = useState<string>('');
  const [schedFilterStatus, setSchedFilterStatus] = useState<string>('');

  // Selected professional lookup
  const selectedProfessional = useMemo(() => {
    const found = allProfessionals.find(p => p.id === sessionSdrId);
    if (found) return found;
    const activeFirst = allProfessionals.find(p => p.active);
    if (activeFirst) return activeFirst;
    return allProfessionals[0] || null;
  }, [sessionSdrId, allProfessionals]);

  // Team filtered One-on-One logs & schedules list for multi-team managers
  const displayedOneOnOneLogs = useMemo(() => {
    if (oneOnOneTeamFilter === 'all') {
      return oneOnOneLogs;
    }
    return oneOnOneLogs.filter(log => {
      const p = allProfessionals.find(prof => prof.id === log.sdrId);
      return p && p.team === oneOnOneTeamFilter;
    });
  }, [oneOnOneLogs, allProfessionals, oneOnOneTeamFilter]);

  const displayedOneOnOneSchedules = useMemo(() => {
    if (oneOnOneTeamFilter === 'all') {
      return oneOnOneSchedules;
    }
    return oneOnOneSchedules.filter(sched => {
      const p = allProfessionals.find(prof => prof.id === sched.sdrId);
      return p && p.team === oneOnOneTeamFilter;
    });
  }, [oneOnOneSchedules, allProfessionals, oneOnOneTeamFilter]);

  // Synchronize local edit states with selected professional
  useEffect(() => {
    if (selectedProfessional) {
      if (selectedProfessional.isAssessor) {
        setEditAssrCaptacao(selectedProfessional.data.captacaoMes || 0);
        setEditAssrCrossSell(selectedProfessional.data.crossSellCount || 0);
        setEditAssrCrossSellDetails(selectedProfessional.data.crossSellDetails || '');
      } else {
        setEditSdrAgendamentos(selectedProfessional.data.agendamentosCount || 0);
        setEditSdrEfetivacoes(selectedProfessional.data.efetivacoesCount || 0);
        setEditSdrCalls(selectedProfessional.data.callsCount || 0);
        setEditSdrContasAbertas(selectedProfessional.data.contasAbertasCount || 0);
      }
    }
  }, [selectedProfessional]);

  const handleSaveScorecardMetrics = () => {
    const prof = selectedProfessional;
    if (!prof) return;

    if (prof.isAssessor) {
      if (onUpdateAssessor) {
        onUpdateAssessor(prof.id, {
          captacaoMes: Number(editAssrCaptacao),
          crossSellCount: Number(editAssrCrossSell),
          crossSellDetails: editAssrCrossSellDetails
        });
      }
    } else {
      if (onUpdateSDR) {
        onUpdateSDR(prof.id, {
          agendamentosCount: Number(editSdrAgendamentos),
          efetivacoesCount: Number(editSdrEfetivacoes),
          callsCount: Number(editSdrCalls),
          contasAbertasCount: Number(editSdrContasAbertas)
        });
      }
    }
    setIsEditingScorecard(false);
  };

  // Sync sessionSdrId to first professional if empty
  useEffect(() => {
    if (!sessionSdrId && selectedProfessional) {
      setSessionSdrId(selectedProfessional.id);
    }
  }, [sessionSdrId, selectedProfessional]);

  useEffect(() => {
    if (selectedProfessional) {
      setSessionProfessionalProfile(selectedProfessional.professionalProfile || 'comercial');
    }
  }, [selectedProfessional]);

  const handleTriggerSessionAICoach = async () => {
    const prof = selectedProfessional;
    if (!prof) {
      setSessionError('Selecione um profissional habilitado para a análise de desempenho.');
      return;
    }

    setSessionAiLoading(true);
    setSessionAiFeedback('');
    setSessionError('');
    setDiagnosedByAI('');

    try {
      const leaderNotes = `[Notas Psicologia] ${sessionPsychNotes || 'Não informado'} | [Notas Tática] ${sessionTacticalNotes || 'Não informado'}`;
      
      const payload: any = {
        mode: 'one_on_one',
        sdrName: prof.data.name,
        leaderNotes,
        actionPlan: sessionActionPlan || 'Alinhamento geral de metas corporativas táticas e operacionais.',
        status: sessionStatus,
        professionalProfile: sessionProfessionalProfile,
        role: prof.isAssessor ? 'assessor' : 'sdr'
      };

      if (prof.isAssessor) {
        payload.sdrStats = {
          captacaoMes: prof.data.captacaoMes || 0,
          crossSellCount: prof.data.crossSellCount || 0,
          crossSellDetails: prof.data.crossSellDetails || ''
        };
      } else {
        payload.sdrStats = {
          agendamentosCount: prof.data.agendamentosCount || 0,
          efetivacoesCount: prof.data.efetivacoesCount || 0,
          metaAgendamentos: prof.data.metaAgendamentos || 20,
          metaEfetivacaoRate: prof.data.metaEfetivacaoRate || 50,
          callsCount: prof.data.callsCount || 0,
          contasAbertasCount: prof.data.contasAbertasCount || 0
        };
      }

      const response = await fetch('/api/gemini/guidance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Falha ao obter conselho do servidor Gemini. Verifique os relatos inseridos.');
      }

      const data = await response.json();
      setSessionAiFeedback(data.advice || data.text || 'Relatório de Inteligência coaching indisponível.');
      if (data.diagnosedProfile) {
        setSessionProfessionalProfile(data.diagnosedProfile);
        setDiagnosedByAI(data.diagnosedProfile);
      }
    } catch (err: any) {
      setSessionError(err?.message || 'Erro de comunicação na rede com o motor de IA.');
    } finally {
      setSessionAiLoading(false);
    }
  };

  const handleConfirmOneOnOne = () => {
    const prof = selectedProfessional;
    if (!prof) {
      setSessionError('Selecione um profissional antes de registrar.');
      return;
    }
    if (!sessionLeaderName.trim()) {
      setSessionError('Insira o nome do líder responsável pela reunião.');
      return;
    }
    if (!sessionTacticalNotes.trim() && !sessionPsychNotes.trim()) {
      setSessionError('Por favor insira relatos das observações táticas ou do comportamento psicológico.');
      return;
    }

    const combinedNotes = `[Relatos] ${sessionTacticalNotes || 'Sem observações táticas específicas.'} | [Controle Motivacional] ${sessionPsychNotes || 'Não detalhadas.'}`;

    if (onAddOneOnOneLog) {
      onAddOneOnOneLog({
        sdrId: prof.id,
        sdrName: prof.isAssessor ? `${prof.data.name} (Assessor)` : `${prof.data.name} (SDR)`,
        leader: sessionLeaderName.trim(),
        status: sessionStatus,
        professionalProfile: sessionProfessionalProfile,
        actionPlan: sessionActionPlan.trim(),
        nextMeeting: sessionNextMeeting || new Date().toISOString().split('T')[0],
        notes: combinedNotes,
        aiFeedback: sessionAiFeedback || undefined
      });
    }

    if (prof.isAssessor) {
      if (onUpdateAssessor) {
        onUpdateAssessor(prof.id, {
          professionalProfile: sessionProfessionalProfile
        });
      }
    } else {
      if (onUpdateSDR) {
        onUpdateSDR(prof.id, {
          professionalProfile: sessionProfessionalProfile
        });
      }
    }

    setSessionSuccess('Sessão 1:1 registrada com sucesso na base estratégica!');
    
    // Clean states safely
    setSessionPsychNotes('');
    setSessionTacticalNotes('');
    setSessionActionPlan('');
    setSessionNextMeeting('');
    setSessionAiFeedback('');
    setSessionError('');
    setDiagnosedByAI('');
    
    setTimeout(() => {
      setSessionSuccess('');
    }, 4000);
  };

  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    setSchedSuccess('');
    setSchedError('');

    if (!schedSdrId) {
      setSchedError('Escolha um SDR/Assessor para o agendamento.');
      return;
    }
    if (!schedLeader.trim()) {
      setSchedError('Por favor, informe quem será o Líder Responsável.');
      return;
    }
    if (!schedDateTime) {
      setSchedError('Defina a data e o horário para a reunião.');
      return;
    }

    const professional = allProfessionals.find(p => p.id === schedSdrId);
    const newSched = {
      id: `sched-${Date.now()}`,
      sdrId: schedSdrId,
      sdrName: professional ? professional.name : 'Colaborador',
      leader: schedLeader.trim(),
      dateTime: schedDateTime,
      topic: schedTopic,
      status: 'AGENDADA',
      notes: schedNotes
    };

    setOneOnOneSchedules(prev => [newSched, ...prev]);
    setSchedSuccess('Próxima reunião 1:1 agendada com sucesso!');
    setSchedSdrId('');
    setSchedNotes('');
    setSchedDateTime('');
    
    setTimeout(() => setSchedSuccess(''), 4550);
  };

  const handleDeleteSchedule = (id: string) => {
    setOneOnOneSchedules(prev => prev.filter(s => s.id !== id));
  };

  const handleUpdateScheduleStatus = (id: string, status: string) => {
    setOneOnOneSchedules(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  const handleCompleteAndGoToLog = (sched: any) => {
    handleUpdateScheduleStatus(sched.id, 'CONCLUIDA');
    setSessionSdrId(sched.sdrId);
    setSessionLeaderName(sched.leader);
    setSessionTacticalNotes(`Reunião realizada com base no agendamento de pauta: ${sched.topic}. ${sched.notes || ''}`);
    setOneOnOneSection('registration');
  };

  const handleTriggerAIConsult = async () => {
    setAiLoading(true);
    setAiReport('');
    
    try {
      const response = await fetch('/api/gemini/guidance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leaderName: 'Liderança Comercial - Cockpit de Gestão',
          teamName: 'Operação Consolidada de Vendas',
          sdrStats: sdrs.map(s => ({
            name: s.name,
            agendamentosCount: s.agendamentosCount,
            efetivacoesCount: s.efetivacoesCount,
            metaAgendamentos: s.metaAgendamentos,
            metaEfetivacaoRate: s.metaEfetivacaoRate,
            active: s.active,
            team: s.team
          })),
          assessorStats: (assessores || []).map(a => ({
            name: a.name,
            agendaLink: a.agendaLink,
            participatesInRotation: a.participatesInRotation,
            team: a.team
          })),
          customPrompt: customAIPrompt
        })
      });

      const data = await response.json();
      if (response.ok) {
        setAiReport(data.text);
      } else {
        setAiReport(`### ❌ Erro ao Gerar Relatório de IA\n\nNossos servidores relataram uma falha: *${data.error || 'Erro desconhecido'}*`);
      }
    } catch (err: any) {
      setAiReport(`### ⚠️ Erro de Rede\n\nNão foi possível fazer contato com a inteligência artificial na nuvem. Verifique o servidor local. Detalhes: *${err.message}*`);
    } finally {
      setAiLoading(false);
    }
  };

  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [team, setTeam] = useState(teams[0] || '');
  const [professionalProfile, setProfessionalProfile] = useState<string>('comercial');
  const [agendamentosCount, setAgendamentosCount] = useState<number>(0);
  const [efetivacoesCount, setEfetivacoesCount] = useState<number>(0);
  const [contasAbertasCount, setContasAbertasCount] = useState<number>(0);
  
  const [metaAgendamentos, setMetaAgendamentos] = useState<number>(20);
  const [metaEfetivacaoRate, setMetaEfetivacaoRate] = useState<number>(50);
  const [metaEfetivacoes, setMetaEfetivacoes] = useState<number>(10);
  const [metaContasAbertas, setMetaContasAbertas] = useState<number>(5);
  const [admissionDate, setAdmissionDate] = useState('');
  const [error, setError] = useState('');

  // New role-based registration states
  const [registrationRole, setRegistrationRole] = useState<'sdr' | 'assessor'>('sdr');
  const [agendaLink, setAgendaLink] = useState('');
  const [participatesInRotation, setParticipatesInRotation] = useState(true);

  // Campaign Form States
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignTeam, setNewCampaignTeam] = useState('all');
  const [newCampaignMetric, setNewCampaignMetric] = useState<'agendamentos' | 'efetivacoes' | 'contas_abertas' | 'taxa_efetivacao' | 'taxa_conversao_contas'>('agendamentos');
  const [newCampaignTarget, setNewCampaignTarget] = useState(25);
  const [newCampaignReward, setNewCampaignReward] = useState('');
  const [newCampaignStart, setNewCampaignStart] = useState('');
  const [newCampaignEnd, setNewCampaignEnd] = useState('');

  // Team Filter for the list
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'all' | 'PJ' | 'PF' | 'VMB' | 'ADVISOR'>('all');
  const [sdrSearchQuery, setSdrSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'tempo' | 'ranking' | 'efetivacao' | 'agendamento' | 'ligacao' | 'none'>('none');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Editing component states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editTeam, setEditTeam] = useState(teams[0] || '');
  const [editAgendamentos, setEditAgendamentos] = useState(0);
  const [editEfetivacoes, setEditEfetivacoes] = useState(0);
  const [editContasAbertas, setEditContasAbertas] = useState(0);
  const [editAdmissionDate, setEditAdmissionDate] = useState('');
  const [editMetaAgend, setEditMetaAgend] = useState<number>(20);
  const [editMetaEfet, setEditMetaEfet] = useState<number>(50);
  const [editMetaEfetivacoes, setEditMetaEfetivacoes] = useState<number>(10);
  const [editMetaContasAbertas, setEditMetaContasAbertas] = useState<number>(5);
  const [editProfessionalProfile, setEditProfessionalProfile] = useState<string>('comercial');

  // SDR Promotion states
  const [promotingSdrId, setPromotingSdrId] = useState<string | null>(null);
  const [promotingAgendaLink, setPromotingAgendaLink] = useState('');
  const [promotingRotation, setPromotingRotation] = useState(true);

  // Local editing states for Team Goals
  const [isEditingTeamGoals, setIsEditingTeamGoals] = useState(false);
  const [localTeamGoalAgend, setLocalTeamGoalAgend] = useState(teamGoals.agendamentos);
  const [localTeamGoalEfet, setLocalTeamGoalEfet] = useState(teamGoals.efetivacoes);
  const [localTeamGoalContas, setLocalTeamGoalContas] = useState(teamGoals.contasAbertas);

  // Deletion helper
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Não informada';
    try {
      const parts = dateStr.split('-');
      if (parts.length !== 3) return dateStr;
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nome é de preenchimento obrigatório');
      return;
    }

    const finalTeam = currentUser?.role === 'leader' ? (currentUser.teamName || '') : team;

    if (registrationRole === 'assessor') {
      if (onAddAssessor) {
        onAddAssessor({
          name: name.trim(),
          active: true,
          agendaLink: agendaLink.trim() || undefined,
          participatesInRotation: participatesInRotation,
          team: finalTeam,
          captacaoMes: 0,
          crossSellCount: 0,
          crossSellDetails: '',
          exclusiveSdrIds: []
        });
      }
    } else {
      onAddSDR({
        name: name.trim(),
        agendamentosCount: Number(agendamentosCount),
        efetivacoesCount: Number(efetivacoesCount),
        contasAbertasCount: Number(contasAbertasCount),
        callsCount: 0,
        metaAgendamentos: Number(metaAgendamentos),
        metaEfetivacaoRate: Number(metaEfetivacaoRate),
        metaEfetivacoes: Number(metaEfetivacoes),
        metaContasAbertas: Number(metaContasAbertas),
        active: true,
        admissionDate: admissionDate,
        team: finalTeam,
        professionalProfile: professionalProfile || 'comercial',
      });
    }

    // Reset Form
    setName('');
    setAgendamentosCount(0);
    setEfetivacoesCount(0);
    setContasAbertasCount(0);
    setMetaAgendamentos(20);
    setMetaEfetivacaoRate(50);
    setMetaEfetivacoes(10);
    setMetaContasAbertas(5);
    setAdmissionDate('');
    setTeam(teams[0] || '');
    setAgendaLink('');
    setParticipatesInRotation(true);
    setRegistrationRole('sdr');
    setProfessionalProfile('comercial');
    setError('');
    setIsAdding(false);
  };

  const handleStartEdit = (sdr: SDR) => {
    setEditingId(sdr.id);
    setEditName(sdr.name);
    setEditTeam(sdr.team || (teams[0] || ''));
    setEditAgendamentos(sdr.agendamentosCount || 0);
    setEditEfetivacoes(sdr.efetivacoesCount || 0);
    setEditContasAbertas(sdr.contasAbertasCount || 0);
    setEditAdmissionDate(sdr.admissionDate || '');
    setEditMetaAgend(sdr.metaAgendamentos || 20);
    setEditMetaEfet(sdr.metaEfetivacaoRate || 50);
    setEditMetaEfetivacoes(sdr.metaEfetivacoes || Math.round((sdr.metaAgendamentos || 20) * (sdr.metaEfetivacaoRate || 50) / 100));
    setEditMetaContasAbertas(sdr.metaContasAbertas || 5);
    setEditProfessionalProfile(sdr.professionalProfile || 'comercial');
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) return;

    if (onUpdateSDR) {
      onUpdateSDR(id, {
        name: editName.trim(),
        team: editTeam,
        agendamentosCount: editAgendamentos,
        efetivacoesCount: editEfetivacoes,
        contasAbertasCount: editContasAbertas,
        admissionDate: editAdmissionDate,
        metaAgendamentos: editMetaAgend,
        metaEfetivacaoRate: editMetaEfet,
        metaEfetivacoes: editMetaEfetivacoes,
        metaContasAbertas: editMetaContasAbertas,
        professionalProfile: editProfessionalProfile,
      });
    } else {
      onUpdateSDRMetrics(id, editAgendamentos, editEfetivacoes);
    }
    setEditingId(null);
  };

  // Team summary calculations (only for active SDRs)
  const activeSDRs = sdrs.filter(s => s.active);
  const teamTotalAgendamentos = activeSDRs.reduce((sum, s) => sum + (s.agendamentosCount || 0), 0);
  const teamTotalMetaAgendamentos = activeSDRs.reduce((sum, s) => sum + (s.metaAgendamentos || 20), 0);
  const teamTotalEfetivacoes = activeSDRs.reduce((sum, s) => sum + (s.efetivacoesCount || 0), 0);
  const teamConversionRate = teamTotalAgendamentos > 0 
    ? Math.round((teamTotalEfetivacoes / teamTotalAgendamentos) * 100) 
    : 0;

  const teamAverageMetaRate = activeSDRs.length > 0
    ? Math.round(activeSDRs.reduce((sum, s) => sum + (s.metaEfetivacaoRate || 50), 0) / activeSDRs.length)
    : 0;

  // Filter list by category, team and search query
  const tempSDRs = sdrs.filter(s => {
    // Check custom category classification (PJ, PF, VMB, ADVISOR)
    if (selectedCategoryFilter !== 'all') {
      const teamUpper = (s.team || '').toUpperCase();
      const isPJ = teamUpper.includes('PJ');
      const isVMB = teamUpper.includes('VMB') || s.team === 'Equipe do Caio';
      const isADVISOR = teamUpper.includes('ADVISOR') || teamUpper.includes('ASSESSOR') || teamUpper.includes('TIER') || teamUpper.includes('ADVISORY');
      const isPF = !isPJ && !isVMB && !isADVISOR && s.team !== 'Equipe do Caio';

      if (selectedCategoryFilter === 'PJ' && !isPJ) return false;
      if (selectedCategoryFilter === 'VMB' && !isVMB) return false;
      if (selectedCategoryFilter === 'PF' && !isPF) return false;
      if (selectedCategoryFilter === 'ADVISOR' && !isADVISOR) return false;
    }

    const matchesTeamFilter = selectedTeamFilter === 'all' || s.team === selectedTeamFilter;
    if (!matchesTeamFilter) return false;

    if (sdrSearchQuery.trim() !== '') {
      const q = sdrSearchQuery.toLowerCase().trim();
      const sdrName = (s.name || '').toLowerCase();
      const sdrTeam = (s.team || '').toLowerCase();
      return sdrName.includes(q) || sdrTeam.includes(q);
    }

    return true;
  });

  const filteredSDRs = [...tempSDRs].sort((a, b) => {
    if (sortBy === 'tempo') {
      const dateA = a.admissionDate ? new Date(a.admissionDate).getTime() : 0;
      const dateB = b.admissionDate ? new Date(b.admissionDate).getTime() : 0;
      // Tempo de casa: oldest (smaller timestamp, longer history) goes first for desc by default
      return sortDirection === 'desc' ? dateA - dateB : dateB - dateA;
    }

    if (sortBy === 'ranking') {
      const getRankValue = (sdr: SDR) => {
        const completed = sdr.agendamentosCount || 0;
        const expected = Math.round((sdr.metaAgendamentos || 20) * (28 / 31));
        if (completed >= expected) return 3; // Rank A
        if (completed >= expected * 0.6) return 2; // Rank B
        return 1; // Rank C
      };
      const rankA = getRankValue(a);
      const rankB = getRankValue(b);
      return sortDirection === 'desc' ? rankB - rankA : rankA - rankB;
    }

    if (sortBy === 'efetivacao') {
      const rateA = a.agendamentosCount > 0 ? (a.efetivacoesCount / a.agendamentosCount) * 100 : 0;
      const rateB = b.agendamentosCount > 0 ? (b.efetivacoesCount / b.agendamentosCount) * 100 : 0;
      return sortDirection === 'desc' ? rateB - rateA : rateA - rateB;
    }

    if (sortBy === 'agendamento') {
      const valA = a.agendamentosCount || 0;
      const valB = b.agendamentosCount || 0;
      return sortDirection === 'desc' ? valB - valA : valA - valB;
    }

    if (sortBy === 'ligacao') {
      const valA = a.callsCount || 0;
      const valB = b.callsCount || 0;
      return sortDirection === 'desc' ? valB - valA : valA - valB;
    }

    return 0;
  });

  // Critical items (SDRs active that are below target either on total booking or conversion rate)
  const criticalSDRs = activeSDRs.filter(s => {
    const rate = s.agendamentosCount > 0 ? Math.round((s.efetivacoesCount / s.agendamentosCount) * 100) : 0;
    const belowBooking = s.agendamentosCount < (s.metaAgendamentos || 20);
    const belowRate = rate < (s.metaEfetivacaoRate || 50);
    return belowBooking || belowRate;
  });

  return (
    <div className="space-y-6">
      
      {/* Visual Header card */}
      <div className="bg-white rounded-xl border border-neutral-200/90 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-neutral-900 tracking-tight font-display flex items-center gap-2">
              <Shield className="w-5 h-5 text-neutral-800" />
              Gestão de Time / Equipe
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              Gerencie a base de SDRs e Assessores, associe equipes, controle as metas do mês, crie campanhas de incentivo e monitore as sessões 1:1.
            </p>
            {currentUser?.role === 'leader' || currentUser?.role === 'admin' ? (() => {
              const currentTeamName = currentUser?.role === 'leader' ? (currentUser.teamName || '') : (selectedTeamFilter !== 'all' && selectedTeamFilter !== '' ? selectedTeamFilter : '');
              if (!currentTeamName) return null;
              const isRotActive = !disabledRotationTeams.includes(currentTeamName);
              return (
                <div className="mt-3 inline-flex items-center gap-3 bg-neutral-50 px-3.5 py-1.5 rounded-full border border-neutral-200 shadow-3xs hover:bg-neutral-100 transition-all">
                  <span className="text-[10px] font-black text-neutral-550 uppercase tracking-wider flex items-center gap-1.5 select-none">
                    <RefreshCw className={`w-3 h-3 text-neutral-500 ${isRotActive ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
                    Rodízio Comercial ({currentTeamName})
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleRotationForTeam(currentTeamName)}
                    className="flex items-center justify-center focus:outline-none cursor-pointer"
                    title={isRotActive ? "Clique para desativar a ferramenta de rodízio" : "Clique para ativar a ferramenta de rodízio"}
                  >
                    {isRotActive ? (
                      <div className="flex items-center gap-1 bg-black text-white rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider transition-all">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        Habilitado
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 bg-neutral-200 text-neutral-600 border border-neutral-300 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider transition-all">
                        <span className="w-1.5 h-1.5 rounded-full bg-neutral-400"></span>
                        Opcional (Inativo)
                      </div>
                    )}
                  </button>
                </div>
              );
            })() : null}
          </div>
          
          <div className="flex items-center gap-2 w-full lg:w-auto">
            {/* Embedded sub-tab switchers */}
            <div className="bg-neutral-100 p-1 rounded-lg flex gap-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setSubTab('list')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  subTab === 'list' 
                    ? 'bg-white shadow-xs text-black font-bold' 
                    : 'text-neutral-550 hover:text-black'
                }`}
              >
                Membros Ativos ({sdrs.filter(s => s.active).length + assessores.filter(a => a.active).length})
              </button>
              <button
                type="button"
                onClick={() => setSubTab('goals')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  subTab === 'goals' 
                    ? 'bg-white shadow-xs text-black font-bold' 
                    : 'text-neutral-550 hover:text-black'
                }`}
              >
                Pontos de Atenção & Metas
              </button>
              <button
                type="button"
                onClick={() => setSubTab('teams')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  subTab === 'teams' 
                    ? 'bg-white shadow-xs text-black font-bold' 
                    : 'text-neutral-550 hover:text-black'
                }`}
              >
                Dividir em Equipes ({teams.length})
              </button>
              <button
                type="button"
                onClick={() => setSubTab('campaigns')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  subTab === 'campaigns' 
                    ? 'bg-white shadow-xs text-black font-bold' 
                    : 'text-neutral-550 hover:text-black'
                }`}
              >
                Campanhas do Time 🏆
              </button>
              <button
                type="button"
                onClick={() => setSubTab('one_on_one')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  subTab === 'one_on_one' 
                    ? 'bg-white shadow-xs text-black font-bold' 
                    : 'text-neutral-550 hover:text-black'
                }`}
              >
                Sessões 1:1 🗣️
              </button>
            </div>
 
            <button
              onClick={() => setIsAdding(!isAdding)}
              className={`px-3.5 py-2.5 rounded-lg text-xs font-bold font-sans flex items-center gap-1.5 transition-all cursor-pointer ml-auto ${
                isAdding 
                  ? 'bg-neutral-100 border border-neutral-300 hover:bg-neutral-200 text-neutral-700' 
                  : 'bg-black hover:bg-neutral-900 text-white shadow-xs'
              }`}
            >
              {isAdding ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              {isAdding ? 'Cancelar' : 'Cadastrar Membro'}
            </button>
          </div>
        </div>
      </div>
 
      {/* Creation form */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="p-6 bg-white border border-neutral-200/90 rounded-xl shadow-xs space-y-5 animate-fade-in">
          <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-neutral-500" />
            Cadastrar Novo Profissional no Time
          </h3>
          
          {error && (
            <div className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200/80 p-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Toggle Role Selector */}
          <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-3xs">
            <div>
              <span className="text-xs font-extrabold text-neutral-800 uppercase tracking-wider block">Cargo do Membro</span>
              <span className="text-[10px] text-neutral-500">Defina se este profissional atuará prospectando ou recebendo leads</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRegistrationRole('sdr')}
                className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer uppercase tracking-tight ${
                  registrationRole === 'sdr'
                    ? 'bg-black text-white shadow-xs scale-102'
                    : 'bg-white hover:bg-neutral-100 text-neutral-600 border border-neutral-200'
                }`}
              >
                SDR (Prospecção)
              </button>
              <button
                type="button"
                onClick={() => setRegistrationRole('assessor')}
                className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer uppercase tracking-tight ${
                  registrationRole === 'assessor'
                    ? 'bg-black text-white shadow-xs scale-102'
                    : 'bg-white hover:bg-neutral-100 text-neutral-600 border border-neutral-200'
                }`}
              >
                Assessor (Fechamento)
              </button>
            </div>
          </div>
 
          <div className={`grid grid-cols-1 ${registrationRole === 'sdr' ? 'md:grid-cols-5' : 'md:grid-cols-4'} gap-4`}>
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                Nome Completo
              </label>
              <input
                type="text"
                placeholder="Ex: Ana Silva"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-black font-bold focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all"
                style={{ color: '#000000' }}
              />
            </div>
 
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                Equipe / Canal
              </label>
              {currentUser?.role === 'leader' ? (
                <div className="w-full px-3 py-2 bg-neutral-100 border border-neutral-250 rounded-lg text-xs text-black font-bold flex items-center gap-1.5 cursor-not-allowed" style={{ color: '#000000' }}>
                  <Shield className="w-3.5 h-3.5 text-neutral-500" />
                  {currentUser.teamName || 'Sua Equipe'}
                </div>
              ) : (
                <select
                  value={team}
                  onChange={e => setTeam(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-black font-bold focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all cursor-pointer"
                  style={{ color: '#000000' }}
                >
                  {teams.map(t => (
                    <option key={t} value={t} className="text-black font-bold">{t}</option>
                  ))}
                  <option value="" className="text-black font-bold">Sem Equipe</option>
                </select>
              )}
            </div>

            {registrationRole === 'sdr' && (
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  Perfil Profissional
                </label>
                <select
                  value={professionalProfile}
                  onChange={e => setProfessionalProfile(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-black font-bold focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all cursor-pointer"
                  style={{ color: '#000000' }}
                >
                  <option value="comercial" className="text-black font-bold">Comercial (Prospecção)</option>
                  <option value="gestao" className="text-black font-bold">Gestão / Liderança</option>
                  <option value="analitico" className="text-black font-bold">Analítico (Dados/Padrões)</option>
                  <option value="operacional" className="text-black font-bold">Operacional (Backoffice)</option>
                </select>
              </div>
            )}
 
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                Data de Admissão
              </label>
              <input
                type="date"
                value={admissionDate}
                onChange={e => setAdmissionDate(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-black font-bold focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all font-mono cursor-pointer"
                style={{ color: '#000000' }}
              />
            </div>

            {registrationRole === 'sdr' && (
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                    Agendados
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={agendamentosCount}
                    onChange={e => setAgendamentosCount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-2.5 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-black font-bold focus:outline-none focus:ring-1 focus:ring-black"
                    style={{ color: '#000000' }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                    Efetivados
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={efetivacoesCount}
                    onChange={e => setEfetivacoesCount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-2.5 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-black font-bold focus:outline-none focus:ring-1 focus:ring-black"
                    style={{ color: '#000000' }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                    Contas Ab.
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={contasAbertasCount}
                    onChange={e => setContasAbertasCount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-2.5 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-black font-bold focus:outline-none focus:ring-1 focus:ring-black"
                    style={{ color: '#000000' }}
                  />
                </div>
              </div>
            )}

            {registrationRole === 'assessor' && (
              <div className="col-span-1 border-t sm:border-t-0 border-neutral-100 sm:pt-0 pt-2">
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  Link Calendly / Agenda
                </label>
                <input
                  type="url"
                  placeholder="https://calendly.com/sua-agenda"
                  value={agendaLink}
                  onChange={e => setAgendaLink(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-black font-bold focus:outline-none focus:ring-1 focus:ring-black"
                  style={{ color: '#000000' }}
                />
              </div>
            )}
          </div>

          {/* Sub-panels depending on role */}
          {registrationRole === 'sdr' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-3 border-t border-neutral-100 animate-fade-in">
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  Meta Agendamentos
                </label>
                <input
                  type="number"
                  min="1"
                  value={metaAgendamentos}
                  onChange={e => setMetaAgendamentos(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-black font-bold focus:outline-none"
                  style={{ color: '#000000' }}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  Meta Efetivadas (Abs.)
                </label>
                <input
                  type="number"
                  min="0"
                  value={metaEfetivacoes}
                  onChange={e => setMetaEfetivacoes(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-black font-bold focus:outline-none"
                  style={{ color: '#000000' }}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  Meta Conversão (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={metaEfetivacaoRate}
                  onChange={e => setMetaEfetivacaoRate(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-black font-bold"
                  style={{ color: '#000000' }}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  Meta Contas Abertas
                </label>
                <input
                  type="number"
                  min="0"
                  value={metaContasAbertas}
                  onChange={e => setMetaContasAbertas(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-black font-bold"
                  style={{ color: '#000000' }}
                />
              </div>
            </div>
          )}

          {registrationRole === 'assessor' && (
            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between animate-fade-in shadow-3xs">
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-extrabold text-neutral-800 uppercase tracking-wider">Habilitado ao Rodízio Comercial</span>
                <span className="text-[10px] text-neutral-500">Irá receber agendamentos automáticos de leads e clientes do sistema</span>
              </div>
              <button
                type="button"
                onClick={() => setParticipatesInRotation(!participatesInRotation)}
                className="text-neutral-800 focus:outline-none cursor-pointer"
              >
                {participatesInRotation ? (
                  <ToggleRight className="w-8 h-8 text-black" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-neutral-350" />
                )}
              </button>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 bg-neutral-150 hover:bg-neutral-200 border border-neutral-250 rounded-lg text-xs font-bold text-neutral-700 cursor-pointer transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-black hover:bg-neutral-900 text-white text-xs font-black uppercase tracking-tight rounded-lg cursor-pointer transition-all shadow-xs"
            >
              {registrationRole === 'sdr' ? 'Salvar SDR no Time' : 'Salvar Assessor no Time'}
            </button>
          </div>
        </form>
      )}

      {/* RENDER VIEW TAB: LIST */}
      {subTab === 'list' && (
        <div className="space-y-5">
          {/* List Toolbar for filtering & sorting */}
          <div className="bg-white border border-neutral-200/90 rounded-xl p-5 flex flex-col gap-4 shadow-xs">
            {/* Row 0: Real-time Search Bar */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                <Search className="w-3.5 h-3.5 text-neutral-400" />
              </span>
              <input
                type="text"
                value={sdrSearchQuery}
                onChange={e => setSdrSearchQuery(e.target.value)}
                placeholder="Buscar SDR por nome ou equipe em tempo real..."
                className="w-full pl-9 pr-10 py-2 bg-neutral-50 hover:bg-neutral-100/40 focus:bg-white border border-neutral-200 focus:border-black rounded-lg text-xs text-neutral-800 placeholder-neutral-400 font-medium focus:outline-none focus:ring-1 focus:ring-black transition-all"
              />
              {sdrSearchQuery && (
                <button
                  type="button"
                  onClick={() => setSdrSearchQuery('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-400 hover:text-black transition-colors cursor-pointer"
                  title="Limpar busca"
                >
                  <X className="w-3.5 h-3.5 rounded-full hover:bg-neutral-100 p-0.5" />
                </button>
              )}
            </div>

            {/* Row 0.5: Category Quick-Filters (PJ, PF, VMB) */}
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-dashed border-neutral-150">
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-neutral-900 text-neutral-100 font-mono font-black px-1.5 py-0.5 rounded leading-none uppercase tracking-wider block">
                  Categoria
                </span>
                <span className="text-xs font-extrabold text-neutral-500 uppercase tracking-wider">Filtrar Time:</span>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {/* Button Todos */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategoryFilter('all');
                    setSelectedTeamFilter('all');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[10.5px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedCategoryFilter === 'all'
                      ? 'bg-neutral-900 border border-neutral-900 text-white shadow-3xs'
                      : 'bg-neutral-50 border border-neutral-200 hover:border-neutral-350 text-neutral-600'
                  }`}
                >
                  Todos os SDRs
                  <span className={`text-[9px] font-mono font-bold px-1 rounded-full ${selectedCategoryFilter === 'all' ? 'bg-white/20 text-white' : 'bg-neutral-200 text-neutral-600'}`}>
                    {sdrs.length}
                  </span>
                </button>

                {/* Button PJ */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategoryFilter('PJ');
                    setSelectedTeamFilter('all');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[10.5px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedCategoryFilter === 'PJ'
                      ? 'bg-blue-600 border border-blue-600 text-white shadow-3xs'
                      : 'bg-blue-50/50 border border-blue-150 hover:border-blue-300 text-blue-900'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${selectedCategoryFilter === 'PJ' ? 'bg-white' : 'bg-blue-500'}`} />
                  SDR PJ
                  <span className={`text-[9px] font-mono font-bold px-1 rounded-full ${selectedCategoryFilter === 'PJ' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'}`}>
                    {sdrs.filter(s => (s.team || '').toUpperCase().includes('PJ')).length}
                  </span>
                </button>

                {/* Button PF */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategoryFilter('PF');
                    setSelectedTeamFilter('all');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[10.5px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedCategoryFilter === 'PF'
                      ? 'bg-amber-600 border border-amber-600 text-white shadow-3xs'
                      : 'bg-amber-50/50 border border-amber-200 hover:border-amber-300 text-amber-900'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${selectedCategoryFilter === 'PF' ? 'bg-white' : 'bg-amber-500'}`} />
                  SDR PF
                  <span className={`text-[9px] font-mono font-bold px-1 rounded-full ${selectedCategoryFilter === 'PF' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'}`}>
                    {sdrs.filter(s => {
                      const tUpper = (s.team || '').toUpperCase();
                      const isPJ = tUpper.includes('PJ');
                      const isVMB = tUpper.includes('VMB') || s.team === 'Equipe do Caio';
                      const isADVISOR = tUpper.includes('ADVISOR') || tUpper.includes('ASSESSOR') || tUpper.includes('TIER') || tUpper.includes('ADVISORY');
                      return !isPJ && !isVMB && !isADVISOR && s.team !== 'Equipe do Caio';
                    }).length}
                  </span>
                </button>

                {/* Button VMB */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategoryFilter('VMB');
                    setSelectedTeamFilter('all');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[10.5px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedCategoryFilter === 'VMB'
                      ? 'bg-purple-600 border border-purple-600 text-white shadow-3xs'
                      : 'bg-purple-50/50 border border-purple-200 hover:border-purple-300 text-purple-900'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${selectedCategoryFilter === 'VMB' ? 'bg-white' : 'bg-purple-500'}`} />
                  SDR VMB
                  <span className={`text-[9px] font-mono font-bold px-1 rounded-full ${selectedCategoryFilter === 'VMB' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'}`}>
                    {sdrs.filter(s => (s.team || '').toUpperCase().includes('VMB') || s.team === 'Equipe do Caio').length}
                  </span>
                </button>

                {/* Button Advisor */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategoryFilter('ADVISOR');
                    setSelectedTeamFilter('all');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[10.5px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedCategoryFilter === 'ADVISOR'
                      ? 'bg-emerald-600 border border-emerald-600 text-white shadow-3xs'
                      : 'bg-emerald-50/50 border border-emerald-250 hover:border-emerald-350 text-emerald-950'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${selectedCategoryFilter === 'ADVISOR' ? 'bg-white' : 'bg-emerald-500'}`} />
                  SDR Advisor
                  <span className={`text-[9px] font-mono font-bold px-1 rounded-full ${selectedCategoryFilter === 'ADVISOR' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                    {sdrs.filter(s => {
                      const tUpper = (s.team || '').toUpperCase();
                      return tUpper.includes('ADVISOR') || tUpper.includes('ASSESSOR') || tUpper.includes('TIER') || tUpper.includes('ADVISORY');
                    }).length}
                  </span>
                </button>
              </div>
            </div>

            {/* Row 1: Team Filter */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-dashed border-neutral-150">
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="w-3.5 h-3.5 text-neutral-400" />
                <span className="text-xs font-extrabold text-neutral-500 uppercase tracking-wider">Filtrar Canal:</span>
                <div className="flex gap-1 flex-wrap">
                  {['all', ...teams.filter(t => {
                    if (selectedCategoryFilter === 'all') return true;
                    const teamUpper = t.toUpperCase();
                    const isPJ = teamUpper.includes('PJ');
                    const isVMB = teamUpper.includes('VMB') || t === 'Equipe do Caio';
                    const isADVISOR = teamUpper.includes('ADVISOR') || teamUpper.includes('ASSESSOR') || teamUpper.includes('TIER') || teamUpper.includes('ADVISORY');
                    const isPF = !isPJ && !isVMB && !isADVISOR && t !== 'Equipe do Caio';
                    
                    if (selectedCategoryFilter === 'PJ') return isPJ;
                    if (selectedCategoryFilter === 'VMB') return isVMB;
                    if (selectedCategoryFilter === 'PF') return isPF;
                    if (selectedCategoryFilter === 'ADVISOR') return isADVISOR;
                    return true;
                  }), ''].map(teamOpt => (
                    <button
                      key={teamOpt}
                      onClick={() => setSelectedTeamFilter(teamOpt)}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                        selectedTeamFilter === teamOpt 
                          ? 'bg-neutral-900 text-white shadow-3xs' 
                          : 'bg-neutral-100 hover:bg-neutral-250 text-neutral-650'
                      }`}
                    >
                      {teamOpt === 'all' ? 'Ver Todos' : (teamOpt === '' ? 'Sem Equipe' : teamOpt)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-[11px] font-bold text-neutral-450 uppercase">
                Total: <strong className="text-black font-black">{filteredSDRs.length}</strong> SDRs
              </div>
            </div>

            {/* Row 2: Sort Actions */}
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-neutral-100">
              <TrendingUp className="w-3.5 h-3.5 text-neutral-450" />
              <span className="text-xs font-extrabold text-neutral-500 uppercase tracking-wider mr-2">Ordenar por:</span>
              <div className="flex gap-1.5 flex-wrap">
                {[
                  { key: 'tempo', label: 'Tempo de Casa' },
                  { key: 'ranking', label: 'Ranking' },
                  { key: 'efetivacao', label: 'Efetivação (%)' },
                  { key: 'agendamento', label: 'Agendamentos' },
                  { key: 'ligacao', label: 'Ligações' }
                ].map(opt => {
                  const active = sortBy === opt.key;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => {
                        if (active) {
                          setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy(opt.key as any);
                          setSortDirection('desc');
                        }
                      }}
                      className={`px-3 py-1 rounded-lg border text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        active 
                          ? 'bg-neutral-950 border-neutral-950 text-white' 
                          : 'bg-white border-neutral-250 hover:bg-neutral-50 text-neutral-650'
                      }`}
                    >
                      {opt.label}
                      {active && (
                        <span className="text-[9px] opacity-75 font-mono">
                          {sortDirection === 'desc' ? '▼' : '▲'}
                        </span>
                      )}
                    </button>
                  );
                })}
                {sortBy !== 'none' && (
                  <button
                    onClick={() => {
                      setSortBy('none');
                    }}
                    className="px-2 py-1 text-[11px] font-bold text-neutral-450 hover:text-black cursor-pointer underline underline-offset-2 transition-all animate-fade-in"
                  >
                    Limpar Ordenação
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Grid Layout of SDRs in cards */}
          {filteredSDRs.length === 0 ? (
            <div className="text-center py-16 bg-white border border-neutral-200/90 rounded-xl">
              <User className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-neutral-800">
                {sdrSearchQuery.trim() !== '' 
                  ? 'Nenhum SDR corresponde aos termos buscados' 
                  : 'Nenhum SDR Ativo no Filtro Selecionado'}
              </h3>
              <p className="text-xs text-neutral-550 mt-1">
                {sdrSearchQuery.trim() !== '' 
                  ? 'Tente buscar por termos diferentes ou limpe o termo de busca.' 
                  : 'Troque o filtro ou clique em "Cadastrar Membro".'}
              </p>
              {sdrSearchQuery.trim() !== '' && (
                <button
                  type="button"
                  onClick={() => setSdrSearchQuery('')}
                  className="mt-3.5 px-4 py-2 bg-black hover:bg-neutral-900 text-white text-[11px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-3xs"
                >
                  Limpar Busca
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredSDRs.map(sdr => {
                const isEditing = editingId === sdr.id;
                const isDeleting = deletingId === sdr.id;
                
                const conversionRate = sdr.agendamentosCount > 0
                  ? Math.round((sdr.efetivacoesCount / sdr.agendamentosCount) * 100)
                  : 0;

                const hasMetMetas = sdr.agendamentosCount >= (sdr.metaAgendamentos || 20) && conversionRate >= (sdr.metaEfetivacaoRate || 50);

                const { elapsedDays, totalDays } = DateService.getElapsedDays(currentMonth);
                const progressRatio = totalDays > 0 ? elapsedDays / totalDays : 0;
                const sdrExpected = Math.round((sdr.metaAgendamentos || 20) * progressRatio);
                const sdrCompleted = sdr.agendamentosCount || 0;

                let rankBadge = { rank: 'A', text: 'Rank A', bgClass: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-extrabold', tip: 'Meta atendida conforme andamento do mês' };
                if (sdrCompleted >= sdrExpected) {
                  rankBadge = { rank: 'A', text: 'Rank A', bgClass: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-extrabold', tip: 'Meta atendida conforme andamento do mês' };
                } else if (sdrCompleted >= sdrExpected * 0.6) {
                  rankBadge = { rank: 'B', text: 'Rank B', bgClass: 'bg-amber-100/70 text-amber-850 border-amber-300 font-bold', tip: 'Acompanhando o esperado' };
                } else {
                  rankBadge = { rank: 'C', text: 'Rank C', bgClass: 'bg-red-50 text-red-750 border-red-200 font-bold', tip: 'Abaixo do esperado para o andamento do mês' };
                }

                return (
                  <div
                    key={sdr.id}
                    className={`bg-white border rounded-xl p-5 flex flex-col justify-between transition-all relative ${
                      sdr.active 
                        ? 'border-neutral-200 hover:border-neutral-400 shadow-xs' 
                        : 'border-neutral-250 bg-neutral-50 opacity-60'
                    }`}
                  >
                    <div>
                      {/* Form validation while editing */}
                      {isEditing ? (
                        <div className="space-y-3 mb-4 text-xs">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[9px] font-bold text-neutral-500 uppercase mb-0.5">Nome Completo</label>
                              <input
                                type="text"
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                className="w-full bg-neutral-50 border border-neutral-300 rounded px-2 py-1 text-xs text-neutral-850 font-semibold focus:outline-none focus:ring-1 focus:ring-black"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-neutral-500 uppercase mb-0.5">Perfil Profissional</label>
                              <select
                                value={editProfessionalProfile}
                                onChange={e => setEditProfessionalProfile(e.target.value)}
                                className="w-full bg-neutral-50 border border-neutral-300 rounded px-2  py-1 text-[11px] focus:outline-none"
                              >
                                <option value="comercial">Comercial</option>
                                <option value="gestao">Gestão/Líder</option>
                                <option value="analitico">Analítico</option>
                                <option value="operacional">Operacional</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[9px] font-bold text-neutral-500 uppercase mb-0.5">Equipe</label>
                              <select
                                value={editTeam}
                                onChange={e => setEditTeam(e.target.value)}
                                className="w-full bg-neutral-50 border border-neutral-300 rounded px-2 py-1 text-[11px] focus:outline-none"
                              >
                                {teams.map(t => (
                                  <option key={t} value={t}>{t}</option>
                                ))}
                                <option value="">Sem Equipe</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-neutral-500 uppercase mb-0.5">Data de Adm.</label>
                              <input
                                type="date"
                                value={editAdmissionDate}
                                onChange={e => setEditAdmissionDate(e.target.value)}
                                className="w-full bg-neutral-50 border border-neutral-300 rounded px-2 py-1 text-[10px] font-mono"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="block text-[9px] font-bold text-neutral-500 uppercase mb-0.5">Agendados</label>
                              <input
                                type="number"
                                min="0"
                                value={editAgendamentos}
                                onChange={e => setEditAgendamentos(Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-full bg-neutral-50 border border-neutral-300 rounded px-2 py-1 text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-neutral-500 uppercase mb-0.5">Efetivados</label>
                              <input
                                type="number"
                                min="0"
                                value={editEfetivacoes}
                                onChange={e => setEditEfetivacoes(Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-full bg-neutral-50 border border-neutral-300 rounded px-2 py-1 text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-neutral-500 uppercase mb-0.5">Contas Ab.</label>
                              <input
                                type="number"
                                min="0"
                                value={editContasAbertas}
                                onChange={e => setEditContasAbertas(Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-full bg-neutral-50 border border-neutral-300 rounded px-2 py-1 text-xs"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[9px] font-bold text-neutral-500 uppercase mb-0.5">Meta Agend.</label>
                              <input
                                type="number"
                                min="1"
                                value={editMetaAgend}
                                onChange={e => setEditMetaAgend(Math.max(1, parseInt(e.target.value) || 0))}
                                className="w-full bg-neutral-50 border border-neutral-300 rounded px-2 py-1 text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-neutral-500 uppercase mb-0.5">Meta Efetiv. (Abs)</label>
                              <input
                                type="number"
                                min="0"
                                value={editMetaEfetivacoes}
                                onChange={e => setEditMetaEfetivacoes(Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-full bg-neutral-50 border border-neutral-300 rounded px-2 py-1 text-xs"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pb-2 border-b border-neutral-100">
                            <div>
                              <label className="block text-[9px] font-bold text-neutral-500 uppercase mb-0.5">Meta Taxa%</label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={editMetaEfet}
                                onChange={e => setEditMetaEfet(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                                className="w-full bg-neutral-50 border border-neutral-300 rounded px-2 py-1 text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-neutral-500 uppercase mb-0.5">Meta Contas Ab.</label>
                              <input
                                type="number"
                                min="0"
                                value={editMetaContasAbertas}
                                onChange={e => setEditMetaContasAbertas(Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-full bg-neutral-50 border border-neutral-300 rounded px-2 py-1 text-xs"
                              />
                            </div>
                          </div>

                          <div className="flex gap-1.5 justify-end">
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="px-2 py-0.5 bg-neutral-150 text-[10px] text-neutral-600 font-bold rounded"
                            >
                              Sair
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(sdr.id)}
                              className="px-3 py-0.5 bg-black text-[10px] text-white font-black rounded"
                            >
                              Aplicar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center font-bold text-xs border ${
                              sdr.active 
                                ? 'bg-neutral-50 border-neutral-200 text-black' 
                                : 'bg-neutral-200 border-neutral-250 text-neutral-400'
                            }`}>
                              <span className="font-display font-bold uppercase">
                                {sdr.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                              </span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-neutral-900 text-sm leading-snug">
                                  {sdr.name}
                                </h3>
                                {sdr.active && (
                                  <span 
                                    className={`text-[9.5px] border px-1.5 py-0.5 rounded flex items-center gap-1 leading-none cursor-help ${rankBadge.bgClass}`}
                                    title={rankBadge.tip}
                                  >
                                    <Sparkles className="w-2.5 h-2.5 shrink-0" />
                                    {rankBadge.text}
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-col gap-0.5 mt-0.5">
                                <span className="font-mono text-[9px] text-neutral-450 uppercase font-black">
                                  {sdr.team || 'Sem Equipe'} &bull; {sdr.active ? 'SDR ativo' : 'desativado'}
                                </span>
                                <span className="text-[10px] text-neutral-500 flex items-center gap-1 font-sans">
                                  📅 Admissão: <strong className="text-neutral-700 font-semibold">{formatDate(sdr.admissionDate)}</strong>
                                </span>
                                <span className={`self-start mt-1 text-[8.5px] font-extrabold uppercase px-1.5 py-0.5 rounded border flex items-center gap-1 leading-none ${
                                  sdr.professionalProfile === 'gestao' 
                                    ? 'bg-purple-50 text-purple-700 border-purple-200' 
                                    : sdr.professionalProfile === 'analitico' 
                                    ? 'bg-sky-50 text-sky-700 border-sky-100' 
                                    : sdr.professionalProfile === 'operacional' 
                                    ? 'bg-teal-50 text-teal-700 border-teal-150' 
                                    : 'bg-orange-50 text-orange-700 border-orange-205'
                                }`}>
                                  {sdr.professionalProfile === 'gestao' ? '🛡️ Gestão/Líder' : sdr.professionalProfile === 'analitico' ? '📊 Analítico' : sdr.professionalProfile === 'operacional' ? '⚙️ Operacional' : '⚡ Comercial'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Topbar controllers */}
                          <div className="flex items-center gap-0.5">
                            <button
                              onClick={() => onToggleActiveSDR(sdr.id)}
                              className="p-1 rounded text-neutral-405 hover:bg-neutral-100 transition-colors cursor-pointer"
                              title={sdr.active ? 'Mudar para Inativo' : 'Ativar novamente'}
                            >
                              {sdr.active ? (
                                <ToggleRight className="w-5 h-5 text-neutral-800" />
                              ) : (
                                <ToggleLeft className="w-5 h-5 text-neutral-350" />
                              )}
                            </button>

                            <button
                              onClick={() => handleStartEdit(sdr)}
                              className="p-1 rounded text-neutral-450 hover:bg-neutral-100 hover:text-black transition-colors cursor-pointer"
                              title="Editar"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Guarded dynamic deletion drawer - Premium full-card overlay */}
                            {isDeleting ? (
                              <div 
                                onClick={(e) => e.stopPropagation()} 
                                className="absolute inset-0 bg-neutral-950/95 backdrop-blur-[1px] rounded-xl z-30 flex flex-col items-center justify-center p-4 text-center text-brand-sand select-none animate-fade-in"
                              >
                                <div className="w-9 h-9 bg-red-500/15 border border-red-500/40 rounded-full flex items-center justify-center text-red-400 mb-2.5 animate-pulse">
                                  <AlertCircle className="w-5 h-5" />
                                </div>
                                <div className="space-y-1 mb-4">
                                  <h4 className="text-[11px] font-black uppercase tracking-widest text-red-500 font-mono">Confirmar Exclusão</h4>
                                  <p className="text-[11px] text-neutral-300 max-w-[200px] leading-relaxed">
                                    Deseja de fato excluir <strong className="text-white font-black">{sdr.name}</strong>? Seus registros passados de performance serão preservados.
                                  </p>
                                </div>
                                <div className="flex gap-2 w-full max-w-[190px]">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeletingId(null);
                                    }}
                                    className="flex-1 py-1.5 bg-neutral-800 hover:bg-neutral-700 hover:text-white border border-neutral-700 text-[10px] uppercase font-black tracking-wider rounded-lg text-neutral-300 cursor-pointer transition-colors"
                                  >
                                    Não
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteSDR(sdr.id);
                                      setDeletingId(null);
                                    }}
                                    className="flex-1 py-1.5 bg-red-650 hover:bg-red-700 text-[10px] uppercase font-black tracking-wider rounded-lg text-white cursor-pointer transition-colors"
                                  >
                                    Sim
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingId(sdr.id);
                                }}
                                className="p-1 rounded text-neutral-400 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
                                title="Excluir SDR"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                     {/* Operational metrics sliders with increment buttons */}
                    {!isEditing && (
                      <div className="bg-neutral-50 p-3.5 rounded-lg border border-neutral-200/50 mt-2 space-y-3">
                        {sdr.promotedToAssessor && (
                          <div className="bg-amber-50 text-amber-950 px-2 py-1.5 rounded border border-amber-200 flex items-center gap-1 text-[10px] font-bold uppercase mb-2">
                            <Crown className="w-3.5 h-3.5 text-amber-600 shrink-0 animate-pulse" /> Promovido a Assessor {sdr.promotedDate ? `em ${formatDate(sdr.promotedDate)}` : ''}
                          </div>
                        )}

                        <div className="grid grid-cols-3 gap-1.5 text-center">
                          <div className="bg-white border border-neutral-200/80 rounded-lg p-1">
                            <span className="text-[8px] font-bold text-neutral-450 uppercase block">Agendados</span>
                            <div className="flex items-center justify-center gap-1 mt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  const currentAgend = sdr.agendamentosCount || 0;
                                  const currentEfet = sdr.efetivacoesCount || 0;
                                  onUpdateSDRMetrics(sdr.id, Math.max(0, currentAgend - 1), currentEfet);
                                }}
                                disabled={(sdr.agendamentosCount || 0) === 0}
                                className="w-4.5 h-4.5 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center text-xs font-bold disabled:opacity-40 cursor-pointer"
                                title="Decrementar agendamentos"
                              >
                                -
                              </button>
                              <span className="font-mono font-bold text-xs text-neutral-900">{sdr.agendamentosCount || 0}</span>
                              <button
                                type="button"
                                onClick={() => onUpdateSDRMetrics(sdr.id, (sdr.agendamentosCount || 0) + 1, sdr.efetivacoesCount || 0)}
                                className="w-4.5 h-4.5 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center text-xs font-bold cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          <div className="bg-white border border-neutral-200/80 rounded-lg p-1">
                            <span className="text-[8px] font-bold text-neutral-450 uppercase block">Efetivados</span>
                            <div className="flex items-center justify-center gap-1 mt-1">
                              <button
                                type="button"
                                onClick={() => onUpdateSDRMetrics(sdr.id, sdr.agendamentosCount || 0, Math.max(0, (sdr.efetivacoesCount || 0) - 1))}
                                disabled={(sdr.efetivacoesCount || 0) === 0}
                                className="w-4.5 h-4.5 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center text-xs font-bold disabled:opacity-40 cursor-pointer"
                              >
                                -
                              </button>
                              <span className="font-mono font-bold text-xs text-neutral-900">{sdr.efetivacoesCount || 0}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const nextVal = (sdr.efetivacoesCount || 0) + 1;
                                  onUpdateSDRMetrics(sdr.id, sdr.agendamentosCount || 0, nextVal);
                                }}
                                className="w-4.5 h-4.5 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center text-xs font-bold cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          <div className="bg-white border border-neutral-200/80 rounded-lg p-1">
                            <span className="text-[8px] font-bold text-neutral-450 uppercase block">Contas Ab.</span>
                            <div className="flex items-center justify-center gap-1 mt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  if (onUpdateSDR) {
                                    onUpdateSDR(sdr.id, { contasAbertasCount: Math.max(0, (sdr.contasAbertasCount || 0) - 1) });
                                  }
                                }}
                                disabled={(sdr.contasAbertasCount || 0) === 0}
                                className="w-4.5 h-4.5 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center text-xs font-bold disabled:opacity-40 cursor-pointer"
                              >
                                -
                              </button>
                              <span className="font-mono font-bold text-xs text-neutral-900">{sdr.contasAbertasCount || 0}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  if (onUpdateSDR) {
                                    onUpdateSDR(sdr.id, { contasAbertasCount: (sdr.contasAbertasCount || 0) + 1 });
                                  }
                                }}
                                className="w-4.5 h-4.5 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center text-xs font-bold cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Quick Calls Registrator Toolbar */}
                        <div className="bg-neutral-100 p-2.5 rounded-lg border border-neutral-205">
                          <div className="flex justify-between items-center text-[9px] font-bold text-neutral-500 uppercase tracking-tight mb-1.5">
                            <span className="flex items-center gap-1 text-neutral-605">
                              <PhoneCall className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                              Ligações feitas:
                            </span>
                            <input
                              type="number"
                              min="0"
                              value={sdr.callsCount || 0}
                              onChange={(e) => {
                                const val = Math.max(0, parseInt(e.target.value) || 0);
                                if (onUpdateSDR) {
                                  onUpdateSDR(sdr.id, { callsCount: val });
                                }
                              }}
                              className="w-16 font-mono text-center text-black text-xs font-black bg-white px-1.5 py-0.5 rounded border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-black shadow-3xs"
                            />
                          </div>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                if (onUpdateSDR) {
                                  onUpdateSDR(sdr.id, { callsCount: Math.max(0, (sdr.callsCount || 0) - 1) });
                                }
                              }}
                              disabled={(sdr.callsCount || 0) === 0}
                              className="px-2 py-1 bg-white hover:bg-neutral-200 text-[10px] text-neutral-700 font-bold border border-neutral-300 rounded-md disabled:opacity-40 cursor-pointer shrink-0"
                            >
                              -1
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => {
                                if (onUpdateSDR) {
                                  onUpdateSDR(sdr.id, { callsCount: (sdr.callsCount || 0) + 1 });
                                }
                              }}
                              className="flex-grow py-1 bg-neutral-900 hover:bg-black text-white text-[10px] font-bold rounded-md cursor-pointer flex justify-center items-center gap-1"
                            >
                              +1 Ligação
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (onUpdateSDR) {
                                  onUpdateSDR(sdr.id, { callsCount: (sdr.callsCount || 0) + 10 });
                                }
                              }}
                              className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[10px] border border-neutral-300 font-bold rounded-md cursor-pointer shrink-0"
                            >
                              +10
                            </button>
                          </div>
                          
                          {/* Prospect Efficiency */}
                          <div className="mt-1.5 pt-1.5 border-t border-neutral-200 flex justify-between gap-2.5 items-center text-[9.5px] text-neutral-500 leading-none">
                            <span>Média Ligações p/ Agendar:</span>
                            <strong className="text-neutral-900 font-bold font-mono">
                              {sdr.agendamentosCount && sdr.agendamentosCount > 0
                                ? `${((sdr.callsCount || 0) / sdr.agendamentosCount).toFixed(1)} lig.`
                                : '—'}
                            </strong>
                          </div>
                        </div>

                        {/* Progress bar to Agendamento target */}
                        <div className="space-y-0.5 pt-1">
                          <div className="flex justify-between items-center text-[9px] text-neutral-450">
                            <span>Atingimento Reuniões:</span>
                            <span className="font-mono font-bold text-neutral-800">
                              {sdr.agendamentosCount}/{sdr.metaAgendamentos || 20} ({Math.round(((sdr.agendamentosCount || 0) / (sdr.metaAgendamentos || 20)) * 100)}%)
                            </span>
                          </div>
                          <div className="w-full bg-neutral-200 h-1 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${
                                sdr.agendamentosCount >= (sdr.metaAgendamentos || 20) ? 'bg-emerald-500' : 'bg-neutral-900'
                              }`}
                              style={{ width: `${Math.min(100, Math.round(((sdr.agendamentosCount || 0) / (sdr.metaAgendamentos || 20)) * 100))}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Progress bar to Contas Abertas target */}
                        <div className="space-y-0.5">
                          <div className="flex justify-between items-center text-[9px] text-neutral-450">
                            <span>Atingimento Contas:</span>
                            <span className="font-mono font-bold text-neutral-800">
                              {sdr.contasAbertasCount || 0}/{sdr.metaContasAbertas || 5} ({Math.round(((sdr.contasAbertasCount || 0) / (sdr.metaContasAbertas || 5)) * 100)}%)
                            </span>
                          </div>
                          <div className="w-full bg-neutral-200 h-1 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${
                                (sdr.contasAbertasCount || 0) >= (sdr.metaContasAbertas || 5) ? 'bg-emerald-500' : 'bg-[#111]'
                              }`}
                              style={{ width: `${Math.min(100, Math.round(((sdr.contasAbertasCount || 0) / (sdr.metaContasAbertas || 5)) * 100))}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Ratio Conversion */}
                        <div className="text-[10px] text-neutral-500 font-sans border-t border-neutral-200/50 pt-2 flex justify-between">
                          <span>Conversão Real: <strong className="text-black font-semibold">{conversionRate}%</strong></span>
                          <span>Meta: <strong className="text-neutral-700 font-semibold">{sdr.metaEfetivacaoRate || 50}%</strong></span>
                        </div>

                        {/* Promote to Assessor Button */}
                        {sdr.active && !sdr.promotedToAssessor && onAddAssessor && (
                          <button
                            type="button"
                            onClick={() => {
                              setPromotingSdrId(sdr.id);
                              setPromotingAgendaLink(`https://calendly.com/${sdr.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-')}`);
                              setPromotingRotation(true);
                            }}
                            className="w-full py-1.5 bg-brand-sand border border-neutral-300 text-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-97 text-center"
                          >
                            <Crown className="w-3.5 h-3.5 text-amber-500" /> Promover a Assessor
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Promoted SDRs Rollback Section */}
          {sdrs.some(s => s.promotedToAssessor) && (
            <div className="bg-white border border-neutral-250 p-6 rounded-2xl mt-10 space-y-4 shadow-3xs">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500 animate-pulse" />
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 tracking-tight">SDRs Promovidos a Assessor de Negócios</h3>
                  <p className="text-xs text-neutral-500">Mapeamento histórico de SDRs que subiram de cargo. Se você errou ou deseja reverter a promoção, clique no botão para restabelecê-lo como SDR ativo.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-sans">
                {sdrs.filter(s => s.promotedToAssessor).map(s => (
                  <div key={s.id} className="border border-neutral-200 bg-neutral-50 px-4 py-3.5 rounded-lg flex flex-col justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex justify-between items-start">
                        <strong className="text-sm font-bold text-neutral-900">{s.name}</strong>
                        <span className="text-[9px] font-bold text-neutral-450 uppercase">{s.team || 'Sem Equipe'}</span>
                      </div>
                      <p className="text-[10px] text-neutral-500">
                        Promovido em: <strong className="text-neutral-700 font-semibold">{s.promotedDate ? formatDate(s.promotedDate) : 'Recente'}</strong>
                      </p>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Deseja desfazer a promoção de ${s.name}? Ele voltará ao rodízio de SDRs e o Assessor correspondente será removido.`)) {
                          onRevertPromotion?.(s.id);
                        }
                      }}
                      className="w-full py-1.5 bg-white hover:bg-neutral-100 border border-neutral-300 rounded-md text-[10px] font-black uppercase text-neutral-750 flex items-center justify-center gap-1.5 transition-all"
                    >
                      <RefreshCw className="w-3 h-3 text-neutral-600 animate-spin" style={{ animationDuration: '4s' }} /> Corrigir e Reverter Promoção
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* RENDER VIEW TAB: GOALS & ATTENTION POINTS */}
      {subTab === 'goals' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Top critical warning panel representing: "Atenção aos pontos do mês" */}
          <div className="bg-amber-50 border border-amber-250 p-5 rounded-xl">
            <h3 className="text-sm font-bold text-amber-900 flex items-center gap-2 mb-2 font-display">
              <AlertTriangle className="w-4.5 h-4.5 text-amber-600" />
              Pontos de Atenção Crítica no Mês Corrente
            </h3>
            <p className="text-xs text-amber-700 leading-relaxed max-w-4xl">
              Estes SDRs abaixo possuem metas desalinhadas ou estão operando abaixo das taxas mínimas de conversão. 
              Ao rodar o acasalamento do rodízio, o sistema poderá equilibrar os fluxos distribuindo assessores com melhores taxas de fechamento para compensá-los.
            </p>

            {/* Critical list overview */}
            <div className="mt-4 space-y-2">
              {criticalSDRs.length === 0 ? (
                <div className="bg-white border border-amber-100/50 p-3 rounded-lg text-xs text-neutral-500">
                  ✓ Excelente desempenho de equipe! Todos os SDRs ativos superaram ou igualaram as metas corporativas.
                </div>
              ) : (
                criticalSDRs.map(sdr => {
                  const rate = sdr.agendamentosCount > 0 ? Math.round((sdr.efetivacoesCount / sdr.agendamentosCount) * 100) : 0;
                  const isBelowBooking = sdr.agendamentosCount < (sdr.metaAgendamentos || 20);
                  const isBelowRate = rate < (sdr.metaEfetivacaoRate || 50);

                  return (
                    <div key={sdr.id} className="bg-white border border-amber-200 p-3 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-800">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-550 block"></span>
                        <strong className="font-bold">{sdr.name}</strong>
                        <span className="text-[10px] text-neutral-400 font-mono">({sdr.team})</span>
                      </div>
                      <div className="flex items-center gap-3 font-mono font-bold text-[11px]">
                        {isBelowBooking && (
                          <span className="text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
                            Vol. Agend.: {sdr.agendamentosCount} / meta {sdr.metaAgendamentos || 20}
                          </span>
                        )}
                        {isBelowRate && (
                          <span className="text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded border border-amber-200/60">
                            Taxa Conv.: {rate}% / meta {sdr.metaEfetivacaoRate || 50}%
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* NEW: Team Goals Card with full editing capabilities */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-neutral-800" />
                <div>
                  <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider font-display">Metas Globais do Time (Consolidado)</h4>
                  <p className="text-[11px] text-neutral-450 mt-0.5">Defina os objetivos globais acumulados para o período corrente.</p>
                </div>
              </div>
              {!isEditingTeamGoals ? (
                onUpdateTeamGoals && (
                  <button
                    type="button"
                    onClick={() => {
                      setLocalTeamGoalAgend(teamGoals.agendamentos);
                      setLocalTeamGoalEfet(teamGoals.efetivacoes);
                      setLocalTeamGoalContas(teamGoals.contasAbertas);
                      setIsEditingTeamGoals(true);
                    }}
                    className="px-3 py-1 bg-black text-white hover:bg-[#111] rounded-lg text-[11px] font-bold tracking-tight flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" /> Editar Metas do Time
                  </button>
                )
              ) : (
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsEditingTeamGoals(false)}
                    className="px-2.5 py-1 bg-neutral-100 text-neutral-600 hover:bg-neutral-200 rounded-lg text-[11px] font-semibold transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onUpdateTeamGoals) {
                        onUpdateTeamGoals({
                          agendamentos: localTeamGoalAgend,
                          efetivacoes: localTeamGoalEfet,
                          contasAbertas: localTeamGoalContas,
                        });
                      }
                      setIsEditingTeamGoals(false);
                    }}
                    className="px-3 py-1 bg-black text-white hover:bg-neutral-900 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                  >
                    Salvar
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Target Agendamentos */}
              <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-150">
                <span className="text-[9px] font-black uppercase tracking-wider text-neutral-450 block mb-1">Meta de Agendamentos</span>
                {isEditingTeamGoals ? (
                  <input
                    type="number"
                    min="1"
                    value={localTeamGoalAgend}
                    onChange={e => setLocalTeamGoalAgend(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full bg-white border border-neutral-350 rounded px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-black"
                  />
                ) : (
                  <div>
                    <div className="text-2xl font-black text-neutral-900 tracking-tight font-display">{teamGoals.agendamentos}</div>
                    <div className="text-[10px] text-neutral-500 mt-1 flex items-center gap-1 flex-wrap">
                      Realizado: <strong className="text-neutral-800 font-bold">{teamTotalAgendamentos}</strong> ({teamGoals.agendamentos > 0 ? Math.round((teamTotalAgendamentos / teamGoals.agendamentos) * 100) : 0}%)
                    </div>
                  </div>
                )}
              </div>

              {/* Target Efetivacoes */}
              <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-150">
                <span className="text-[9px] font-black uppercase tracking-wider text-neutral-450 block mb-1">Meta de Efetivações</span>
                {isEditingTeamGoals ? (
                  <input
                    type="number"
                    min="1"
                    value={localTeamGoalEfet}
                    onChange={e => setLocalTeamGoalEfet(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full bg-white border border-neutral-350 rounded px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-black"
                  />
                ) : (
                  <div>
                    <div className="text-2xl font-black text-neutral-900 tracking-tight font-display">{teamGoals.efetivacoes}</div>
                    <div className="text-[10px] text-neutral-500 mt-1 flex items-center gap-1 flex-wrap">
                      Realizado: <strong className="text-neutral-800 font-bold">{teamTotalEfetivacoes}</strong> ({teamGoals.efetivacoes > 0 ? Math.round((teamTotalEfetivacoes / teamGoals.efetivacoes) * 100) : 0}%)
                    </div>
                  </div>
                )}
              </div>

              {/* Target Contas Abertas */}
              <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-150">
                <span className="text-[9px] font-black uppercase tracking-wider text-neutral-450 block mb-1">Meta de Contas Abertas</span>
                {isEditingTeamGoals ? (
                  <input
                    type="number"
                    min="1"
                    value={localTeamGoalContas}
                    onChange={e => setLocalTeamGoalContas(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full bg-white border border-neutral-350 rounded px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-black"
                  />
                ) : (
                  <div>
                    <div className="text-2xl font-black text-neutral-900 tracking-tight font-display">{teamGoals.contasAbertas}</div>
                    <div className="text-[10px] text-neutral-500 mt-1 flex items-center gap-1 flex-wrap">
                      Realizado: <strong className="text-neutral-800 font-bold">{activeSDRs.reduce((sum, s) => sum + (s.contasAbertasCount || 0), 0)}</strong> ({teamGoals.contasAbertas > 0 ? Math.round((activeSDRs.reduce((sum, s) => sum + (s.contasAbertasCount || 0), 0) / teamGoals.contasAbertas) * 100) : 0}%)
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Combined Team Summary stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-neutral-450 font-bold uppercase tracking-wider block">Volume Acumulado do Time (Ativo)</span>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2.5xl font-black text-black tracking-tight">{teamTotalAgendamentos}</span>
                  <span className="text-xs text-neutral-500">de {teamTotalMetaAgendamentos} agendamentos planejados</span>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex justify-between text-[11px] font-mono mb-1 text-neutral-500">
                  <span>Porcentagem atingida:</span>
                  <span className="font-bold text-black">
                    {teamTotalMetaAgendamentos > 0 ? Math.round((teamTotalAgendamentos / teamTotalMetaAgendamentos) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden border border-neutral-200/50">
                  <div 
                    className="bg-black h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, teamTotalMetaAgendamentos > 0 ? (teamTotalAgendamentos / teamTotalMetaAgendamentos) * 100 : 0)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-neutral-450 font-bold uppercase tracking-wider block">Eficiência de Efetivação Média</span>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2.5xl font-black text-black tracking-tight">{teamConversionRate}%</span>
                  <span className="text-xs text-neutral-500">vs {teamAverageMetaRate}% média meta corporativa</span>
                </div>
              </div>

              <div className="mt-4 font-sans">
                <div className="flex justify-between text-[11px] font-mono mb-1 text-neutral-500">
                  <span>Status Operacional:</span>
                  <span className={`font-bold uppercase tracking-wider text-[10px] ${teamConversionRate >= teamAverageMetaRate ? 'text-neutral-800' : 'text-neutral-550'}`}>
                    {teamConversionRate >= teamAverageMetaRate ? '✓ Acima da Expectativa' : 'Abaixo da Expectativa'}
                  </span>
                </div>
                <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden border border-neutral-200/50">
                  <div 
                    className="bg-black h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, teamConversionRate)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick config individual metrics goals in tabulated view */}
          <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5 font-display mb-2">
              <Target className="w-4 h-4 text-neutral-800" />
              Editar Políticas e Metas Individuais de SDRs
            </h3>

            {activeSDRs.length === 0 ? (
              <div className="text-center py-6 text-xs text-neutral-500">
                Sem SDRs ativos para ajustar metas.
              </div>
            ) : (
              <div className="border border-neutral-200 rounded-lg overflow-hidden">
                <div className="bg-neutral-50 p-3 border-b border-neutral-200 grid grid-cols-12 text-[10px] font-bold text-neutral-500 uppercase tracking-wider gap-1 text-center">
                  <div className="col-span-3 text-left">SDR</div>
                  <div className="col-span-2">Meta Agend.</div>
                  <div className="col-span-2">Meta Efetiv. (Abs)</div>
                  <div className="col-span-2">Meta Conv.%</div>
                  <div className="col-span-1">Meta Contas</div>
                  <div className="col-span-2 text-right">Caderno de Ação</div>
                </div>

                <div className="divide-y divide-neutral-150">
                  {activeSDRs.map(sdr => {
                    const isSdrEditing = editingId === sdr.id;
                    return (
                      <div key={sdr.id} className="p-3 grid grid-cols-12 text-xs items-center gap-1 text-center">
                        <div className="col-span-3 font-bold text-neutral-800 text-left">
                          {sdr.name}
                          <span className="block text-[9px] text-neutral-450 font-normal">{sdr.team}</span>
                        </div>
                        
                        <div className="col-span-2">
                          {isSdrEditing ? (
                            <input
                              type="number"
                              min="1"
                              value={editMetaAgend}
                              onChange={e => setEditMetaAgend(Math.max(1, parseInt(e.target.value) || 0))}
                              className="w-16 bg-neutral-50 border border-neutral-300 rounded text-center px-1 py-0.5 text-xs focus:outline-none"
                            />
                          ) : (
                            <span className="font-mono font-bold text-neutral-700">{sdr.metaAgendamentos || 20}</span>
                          )}
                        </div>

                        <div className="col-span-2">
                          {isSdrEditing ? (
                            <input
                              type="number"
                              min="0"
                              value={editMetaEfetivacoes}
                              onChange={e => setEditMetaEfetivacoes(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-16 bg-neutral-50 border border-neutral-300 rounded text-center px-1 py-0.5 text-xs focus:outline-none"
                            />
                          ) : (
                            <span className="font-mono font-bold text-neutral-700">{sdr.metaEfetivacoes || 10}</span>
                          )}
                        </div>

                        <div className="col-span-2">
                          {isSdrEditing ? (
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={editMetaEfet}
                              onChange={e => setEditMetaEfet(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                              className="w-16 bg-neutral-50 border border-neutral-300 rounded text-center px-1 py-0.5 text-xs focus:outline-none"
                            />
                          ) : (
                            <span className="font-mono font-bold text-neutral-700">{sdr.metaEfetivacaoRate || 50}%</span>
                          )}
                        </div>

                        <div className="col-span-1">
                          {isSdrEditing ? (
                            <input
                              type="number"
                              min="0"
                              value={editMetaContasAbertas}
                              onChange={e => setEditMetaContasAbertas(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-12 bg-neutral-50 border border-neutral-300 rounded text-center px-1 py-0.5 text-xs focus:outline-none"
                            />
                          ) : (
                            <span className="font-mono font-bold text-neutral-700">{sdr.metaContasAbertas || 5}</span>
                          )}
                        </div>

                        <div className="col-span-2 text-right">
                          {isSdrEditing ? (
                            <div className="flex gap-1 justify-end">
                              <button
                                onClick={() => setEditingId(null)}
                                className="px-1.5 py-0.5 text-[9px] bg-neutral-100 hover:bg-neutral-200 rounded text-neutral-600 font-bold"
                              >
                                Sair
                              </button>
                              <button
                                onClick={() => handleSaveEdit(sdr.id)}
                                className="px-1.5 py-0.5 text-[9px] bg-black hover:bg-neutral-900 rounded text-white font-black"
                              >
                                Gravar
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleStartEdit(sdr)}
                              className="px-2 py-0.5 text-[9px] font-bold bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-lg text-neutral-700 transition-colors cursor-pointer"
                            >
                              Editar
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          
          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 text-neutral-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-neutral-500 leading-relaxed font-sans">
              <strong>Métrica unificada de afinidade comercial:</strong> Unificar os indicadores de atenção mensais ajuda a entender a ociosidade ou sobrecarga sobre Assessores. O painel é sincronizado com as premissas de rodízio dinâmico mensal.
            </p>
          </div>

        </div>
      )}

      {/* Promotion to Assessor Modal */}
      {promotingSdrId && (
        (() => {
          const sdr = sdrs.find(s => s.id === promotingSdrId);
          if (!sdr) return null;
          return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="promotion-modal">
              <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xl w-full max-w-md animate-fade-in space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-amber-500 animate-bounce" />
                    <div>
                      <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-tight">Promover SDR a Assessor</h3>
                      <p className="text-[11px] text-neutral-500">Mapear a transição de carreira de <strong>{sdr.name}</strong></p>
                    </div>
                  </div>
                  <button
                    onClick={() => setPromotingSdrId(null)}
                    className="p-1 text-neutral-400 hover:text-neutral-600 rounded bg-neutral-50 border border-neutral-150 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-lg text-[11px] text-amber-900 leading-relaxed space-y-1">
                  <p><strong>A transição estipula as seguintes regras:</strong></p>
                  <ul className="list-disc list-inside space-y-0.5 text-[10px] text-amber-800">
                    <li>O SDR será marcado como <strong>promovido</strong> e desativado da lista de SDRs ativos.</li>
                    <li>Um novo registro de Assessor será criado com as metas de rodízio configuradas.</li>
                    <li>Todo o histórico de conquistas do SDR continuará salvo nos registros mensais.</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Equipe de Assessores Alvo</label>
                    <select
                      value={editTeam}
                      onChange={e => setEditTeam(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-semibold focus:outline-none"
                    >
                      <option value="Equipe Alpha">Equipe Alpha</option>
                      <option value="Equipe Beta">Equipe Beta</option>
                      <option value="Equipe Delta">Equipe Delta</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Calendly / Agenda do Novo Assessor</label>
                    <input
                      type="url"
                      placeholder="Ex: https://calendly.com/... ou link de reuniões"
                      value={promotingAgendaLink}
                      onChange={e => setPromotingAgendaLink(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs focus:ring-1 focus:ring-black"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-neutral-50 rounded-lg border border-neutral-200">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-neutral-800">Participar do Rodízio Ativo</span>
                      <span className="text-[10px] text-neutral-500">Irá receber agendamentos de leads no rodízio de acasalamento.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPromotingRotation(!promotingRotation)}
                      className="text-neutral-800"
                    >
                      {promotingRotation ? (
                        <ToggleRight className="w-8 h-8 text-neutral-900" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-neutral-350" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setPromotingSdrId(null)}
                    className="flex-1 py-1.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-250 rounded-lg text-xs font-bold text-neutral-600"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onUpdateSDR && onAddAssessor) {
                        const promotionDateStr = new Date().toISOString().substring(0, 10);
                        onAddAssessor({
                          name: sdr.name,
                          active: true,
                          agendaLink: promotingAgendaLink || `https://calendly.com/${sdr.name.toLowerCase().replace(/\s+/g, '-')}`,
                          team: editTeam,
                          participatesInRotation: promotingRotation,
                          exclusiveSdrId: sdr.id,
                        });

                        onUpdateSDR(sdr.id, {
                          promotedToAssessor: true,
                          active: false,
                          promotedDate: promotionDateStr,
                        });

                        setPromotingSdrId(null);
                        alert(`Parabéns! ${sdr.name} foi promovido(a) a Assessor(a) com sucesso!`);
                      }
                    }}
                    className="flex-1 py-1.5 bg-black hover:bg-neutral-900 rounded-lg text-xs font-black text-white uppercase tracking-tight flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4 text-emerald-400" /> Confirmar
                  </button>
                </div>
              </div>
            </div>
          );
        })()
      )}

      {/* RENDER VIEW TAB: TEAMS MANAGEMENT */}
      {subTab === 'teams' && (
        <div className="space-y-6 animate-fade-in font-sans">
          <div className="bg-white border-2 border-neutral-950 rounded-2xl p-6 shadow-sm space-y-6">
            
            {/* Descriptive Title */}
            <div>
              <h3 className="text-sm font-bold text-neutral-950 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-neutral-800" />
                Estrutura de Equipes Comerciais
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Crie, exclua ou edite as células comerciais do escritório. Modificar os nomes atualizará automaticamente todos os SDRs, Assessores e Líderes vinculados. Excluir uma equipe manterá os registros dos SDRs intactos como "Sem Equipe".
              </p>
            </div>

            {/* Quick Team Creator */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 md:flex items-center justify-between gap-4">
              <div className="space-y-0.5 flex-grow mb-2 md:mb-0">
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Criar Nova Célula / Equipe</label>
                <input
                  type="text"
                  placeholder="Ex: Equipe Esmeralda"
                  id="new-team-input-val"
                  className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = (e.currentTarget as HTMLInputElement).value.trim();
                      if (val) {
                        onAddTeam(val);
                        (e.currentTarget as HTMLInputElement).value = '';
                      }
                    }
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById('new-team-input-val') as HTMLInputElement | null;
                  if (input && input.value.trim()) {
                    onAddTeam(input.value.trim());
                    input.value = '';
                  }
                }}
                className="px-5 py-2.5 bg-black text-white hover:bg-neutral-900 rounded-lg text-xs font-bold shrink-0 shadow-xs cursor-pointer"
              >
                Criar Equipe
              </button>
            </div>

            {/* Teams Listing Table/Cards */}
            {teams.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-neutral-300 rounded-xl">
                <p className="text-xs text-neutral-500">Nenhuma equipe cadastrada. Crie uma acima para começar.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams.map(t => {
                  const sdrTeamCount = sdrs.filter(s => s.team === t).length;

                  return (
                    <div key={t} className="border border-neutral-300 p-4.5 rounded-xl flex flex-col justify-between gap-4 bg-white relative hover:border-neutral-500 group transition-all">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="p-1 px-2.5 bg-neutral-100 text-[10.5px] font-extrabold uppercase tracking-widest rounded leading-none text-neutral-800">
                            Equipe Comercial
                          </span>
                          
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Deseja mesmo excluir o espaço da ${t}? Nenhum SDR ou Assessor associado será excluído, eles passarão a constar como "Sem Equipe".`)) {
                                onDeleteTeam(t);
                              }
                            }}
                            className="text-neutral-400 hover:text-red-650 p-1 rounded hover:bg-red-50 cursor-pointer"
                            title="Apagar Espaço de Equipes"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Editing Name Field inside card */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-neutral-400 uppercase">Nome da Célula</label>
                          <div className="flex gap-1.5 items-center">
                            <input
                              type="text"
                              defaultValue={t}
                              id={`edit-team-val-${t}`}
                              className="bg-neutral-50 text-xs font-semibold px-2 py-1.5 rounded-lg border border-neutral-250 flex-grow"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const input = document.getElementById(`edit-team-val-${t}`) as HTMLInputElement | null;
                                if (input && input.value.trim() && input.value.trim() !== t) {
                                  onRenameTeam(t, input.value.trim());
                                }
                              }}
                              className="p-2 bg-neutral-900 text-brand-sand hover:bg-black rounded-lg cursor-pointer"
                              title="Salvar Novo Nome"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="text-[10px] text-neutral-500 pt-2 border-t border-neutral-100 flex justify-between">
                        <span>{sdrTeamCount} SDRs vinculados</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>
      )}

      {/* RENDER VIEW TAB: CAMPANHAS DO TIME */}
      {subTab === 'campaigns' && (
        <div className="space-y-6 animate-fade-in font-sans">
          
          {/* Create Campaign Panel */}
          <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-neutral-800" />
              <div>
                <h3 className="text-xs font-extrabold text-neutral-900 uppercase tracking-wider">
                  Criar Nova Campanha de Incentivo / Sprint do Time
                </h3>
                <p className="text-[11px] text-neutral-500">
                  Desafie sua equipe com sprints focados em impulsionar agendamentos, efetivações, contas abertas ou taxas de conversão.
                </p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newCampaignName.trim()) {
                  alert('Insira um nome para a campanha');
                  return;
                }
                if (!onAddCampaign) return;

                const campaignTeam = currentUser?.role === 'leader' ? (currentUser.teamName || '') : newCampaignTeam;

                onAddCampaign({
                  name: newCampaignName.trim(),
                  team: campaignTeam,
                  objective: newCampaignMetric,
                  targetValue: Number(newCampaignTarget),
                  reward: newCampaignReward.trim() || 'Prêmio de Performance',
                  status: 'active',
                  startDate: newCampaignStart || new Date().toISOString().split('T')[0],
                  endDate: newCampaignEnd || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                });

                // Reset state
                setNewCampaignName('');
                setNewCampaignReward('');
                setNewCampaignStart('');
                setNewCampaignEnd('');
                setNewCampaignTarget(25);
              }}
              className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-neutral-50 border border-neutral-200/80 rounded-xl"
            >
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  Nome do Desafio / Campanha
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Operação Escudo - Recorde de Contas Abertas"
                  value={newCampaignName}
                  onChange={(e) => setNewCampaignName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-neutral-250 rounded-lg text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  Equipe Alvo
                </label>
                {currentUser?.role === 'leader' ? (
                  <div className="w-full px-3 py-2 bg-neutral-100 border border-neutral-250 rounded-lg text-xs text-neutral-700 font-bold flex items-center gap-1.5 cursor-not-allowed">
                    <Shield className="w-3.5 h-3.5 text-neutral-500" />
                    {currentUser.teamName || 'Sua Equipe'}
                  </div>
                ) : (
                  <select
                    value={newCampaignTeam}
                    onChange={(e) => setNewCampaignTeam(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-neutral-250 rounded-lg text-xs text-neutral-800 focus:outline-none cursor-pointer"
                  >
                    <option value="all">Todo o Time</option>
                    {teams.map((t) => (
                      <option key={t} value={t}>
                        Equipe {t}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  Métrica de Foco
                </label>
                <select
                  value={newCampaignMetric}
                  onChange={(e: any) => setNewCampaignMetric(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-neutral-250 rounded-lg text-xs text-neutral-800 focus:outline-none cursor-pointer"
                >
                  <option value="agendamentos">Mais Agendamentos no Mês</option>
                  <option value="efetivacoes">Mais Reuniões Efetivadas</option>
                  <option value="contas_abertas">Mais Contas Abertas</option>
                  <option value="taxa_efetivacao">Taxa de Efetivação / Comparecimento (%)</option>
                  <option value="taxa_conversao_contas">Taxa Contas / Efetivação (%)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  Meta / Valor Alvo
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={newCampaignTarget}
                  onChange={(e) => setNewCampaignTarget(Math.max(1, parseFloat(e.target.value) || 0))}
                  className="w-full px-3 py-2 bg-white border border-neutral-250 rounded-lg text-xs text-neutral-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  Recompensa / Prêmio
                </label>
                <input
                  type="text"
                  required
                  placeholder="EX: R$ 500 Gift Card ou Jantar"
                  value={newCampaignReward}
                  onChange={(e) => setNewCampaignReward(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-neutral-250 rounded-lg text-xs text-neutral-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  Data Início
                </label>
                <input
                  type="date"
                  value={newCampaignStart}
                  onChange={(e) => setNewCampaignStart(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-neutral-250 rounded-lg text-xs text-neutral-800 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  Data Término
                </label>
                <input
                  type="date"
                  value={newCampaignEnd}
                  onChange={(e) => setNewCampaignEnd(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-neutral-250 rounded-lg text-xs text-neutral-800 focus:outline-none font-mono"
                />
              </div>

              <div className="md:col-span-4 flex justify-end pt-2 border-t border-neutral-200/50">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-black hover:bg-neutral-900 border border-black rounded-lg text-xs font-black uppercase tracking-wider text-white transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4 text-white" />
                  Iniciar Sprint e Lançar Campanha
                </button>
              </div>
            </form>
          </div>

          {/* Active Campaigns List */}
          <div className="space-y-4">
            <h4 className="text-xs font-extrabold text-neutral-800 uppercase tracking-widest pl-1 font-sans">
              Campanhas Ativas & Desafios Históricos
            </h4>

            {campaigns && campaigns.length === 0 ? (
              <div className="border border-dashed border-neutral-200 rounded-xl p-12 text-center text-xs text-neutral-400">
                <Award className="w-8 h-8 text-neutral-300 mx-auto mb-2 animate-pulse" />
                Nenhuma campanha de vendas cadastrada para sua operação. Crie uma acima para começar!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {campaigns
                  .filter((camp) => {
                    // Leaders can only see their team's campaigns or 'all'
                    if (currentUser?.role === 'leader') {
                      return camp.team === currentUser.teamName || camp.team === 'all';
                    }
                    return true;
                  })
                  .map((camp) => {
                    // Compute actual stats live!
                    const relevantSDRs = sdrs.filter((s) => {
                      if (camp.team && camp.team !== 'all') {
                        return s.team === camp.team;
                      }
                      return true;
                    });

                    // Dynamic aggregators
                    let currentRawProgress = 0;
                    if (camp.objective === 'agendamentos') {
                      currentRawProgress = relevantSDRs.reduce((sum, s) => sum + (s.agendamentosCount || 0), 0);
                    } else if (camp.objective === 'efetivacoes') {
                      currentRawProgress = relevantSDRs.reduce((sum, s) => sum + (s.efetivacoesCount || 0), 0);
                    } else if (camp.objective === 'contas_abertas') {
                      currentRawProgress = relevantSDRs.reduce((sum, s) => sum + (s.contasAbertasCount || 0), 0);
                    } else if (camp.objective === 'taxa_efetivacao') {
                      const totalAgendados = relevantSDRs.reduce((sum, s) => sum + (s.agendamentosCount || 0), 0);
                      const totalEfetivados = relevantSDRs.reduce((sum, s) => sum + (s.efetivacoesCount || 0), 0);
                      currentRawProgress = totalAgendados > 0 ? Math.round((totalEfetivados / totalAgendados) * 100) : 0;
                    } else if (camp.objective === 'taxa_conversao_contas') {
                      const totalEfetivados = relevantSDRs.reduce((sum, s) => sum + (s.efetivacoesCount || 0), 0);
                      const totalContas = relevantSDRs.reduce((sum, s) => sum + (s.contasAbertasCount || 0), 0);
                      currentRawProgress = totalEfetivados > 0 ? Math.round((totalContas / totalEfetivados) * 100) : 0;
                    }

                    const progressPct = Math.min(100, Math.round((currentRawProgress / camp.targetValue) * 100));

                    // Text definitions
                    const metricLabel = 
                      camp.objective === 'agendamentos' ? 'Agendamentos Totais' :
                      camp.objective === 'efetivacoes' ? 'Reuniões Efetivadas' :
                      camp.objective === 'contas_abertas' ? 'Contas Abertas' :
                      camp.objective === 'taxa_efetivacao' ? 'Taxa Efetivação / Comparecimento %' :
                      'Taxa Contas / Efetivação %';

                    const suffix = 
                      camp.objective.startsWith('taxa') ? '%' : ' un';

                    return (
                      <div
                        key={camp.id}
                        className={`bg-white border rounded-xl p-5 space-y-4 shadow-sm relative overflow-hidden transition-all duration-300 ${
                          camp.status === 'active'
                            ? 'border-neutral-900/40 ring-1 ring-neutral-900/5'
                            : 'border-neutral-200 opacity-70 bg-neutral-50/50'
                        }`}
                      >
                        {/* Header card details */}
                        <div className="flex justify-between items-start">
                          <div>
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest ${
                              camp.status === 'active'
                                ? 'bg-black text-white'
                                : 'bg-neutral-250 text-neutral-600'
                            }`}>
                              {camp.status === 'active' ? 'Ativa' : 'Encerrada'}
                            </span>
                            <h5 className="text-xs font-black text-neutral-900 mt-1 uppercase tracking-tight leading-snug">
                              {camp.name}
                            </h5>
                            <span className="text-[10px] text-neutral-500 block font-semibold mt-0.5">
                              Público: <span className="text-neutral-800 font-bold">{camp.team === 'all' ? 'Todo o Time' : `Equipe ${camp.team}`}</span>
                            </span>
                          </div>

                          <div className="flex gap-1.5">
                            {onUpdateCampaignStatus && (
                              <button
                                onClick={() =>
                                  onUpdateCampaignStatus(
                                    camp.id,
                                    camp.status === 'active' ? 'completed' : 'active'
                                  )
                                }
                                title={camp.status === 'active' ? 'Finalizar Desafio' : 'Reativar Desafio'}
                                className="p-1 px-2 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-black text-[10px] font-bold cursor-pointer transition-all uppercase tracking-wider"
                              >
                                Terminar
                              </button>
                            )}
                            {onDeleteCampaign && (
                              <button
                                onClick={() => {
                                  if (confirm('Tem certeza que deseja excluir esta campanha?')) {
                                    onDeleteCampaign(camp.id);
                                  }
                                }}
                                title="Excluir"
                                className="p-1 text-neutral-400 hover:text-red-600 rounded-md hover:bg-neutral-50 transition-all cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Mid block with goal metrics */}
                        <div className="space-y-1.5 p-3.5 bg-neutral-50 border border-neutral-150 rounded-xl relative">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                              {metricLabel}
                            </span>
                            <span className="text-xs font-black text-neutral-900 font-mono">
                              {currentRawProgress}{suffix} / {camp.targetValue}{suffix}
                            </span>
                          </div>

                          {/* Beautiful linear nested progress bar */}
                          <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-black transition-all duration-700 ease-out"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>

                          <div className="flex justify-between items-center text-[10px] font-bold text-neutral-550 pt-1">
                            <span>Sprints Ativo</span>
                            <span className="text-neutral-900 font-mono text-[11px]">{progressPct}%</span>
                          </div>
                        </div>

                        {/* Reward tag & timeline footer */}
                        <div className="flex items-center justify-between pt-1 text-[10px] border-t border-neutral-100">
                          <div className="flex items-center gap-1.5 text-neutral-900">
                            <Gift className="w-3.5 h-3.5 text-neutral-600" />
                            <span className="font-extrabold text-neutral-950 uppercase tracking-wider bg-black/5 px-2 py-0.5 rounded-lg border border-neutral-200/50">
                              🎁 {camp.reward}
                            </span>
                          </div>
                          <span className="text-neutral-500 font-sans tracking-wide">
                            Até {formatDate(camp.endDate)}
                          </span>
                        </div>

                      </div>
                    );
                  })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* RENDER VIEW TAB: SESSÕES ONE-ON-ONE (1:1) */}
      {subTab === 'one_on_one' && (
        <div className="space-y-6 animate-fade-in font-sans">
          
          {/* Header */}
          <div className="bg-white border-2 border-neutral-900 rounded-2xl p-6 shadow-3xs space-y-2">
            <h3 className="text-base font-black text-neutral-950 flex items-center gap-2 uppercase tracking-wide font-display">
              <Sparkles className="w-5 h-5 text-neutral-800 animate-pulse" />
              Sessões de Desenvolvimento & Mentoria Tática (Alinhamento 1:1)
            </h3>
            <p className="text-xs text-neutral-550">
              Registre reuniões individuais periódicas, avalie o alinhamento cultural/emocional e obtenha diagnósticos táticos automatizados fornecidos por inteligência artificial baseando-se no esforço telefônico de cada SDR.
            </p>
          </div>

          {/* Sub-section tab selection for One-on-Ones */}
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-neutral-300 pb-3 mt-4 gap-4">
            <div className="flex gap-1 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setOneOnOneSection('scheduler')}
                className={`pb-2 pt-1 px-4 font-black text-[10px] uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  oneOnOneSection === 'scheduler'
                    ? 'border-black text-black'
                    : 'border-transparent text-neutral-500 hover:text-black hover:border-neutral-300'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Planejamento & Lembretes
                {displayedOneOnOneSchedules.filter(s => s.status === 'AGENDADA' || s.status === 'REAGENDADA').length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-[8px] bg-red-100 text-red-700 font-black rounded-full animate-pulse border border-red-250 leading-none">
                    {displayedOneOnOneSchedules.filter(s => s.status === 'AGENDADA' || s.status === 'REAGENDADA').length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setOneOnOneSection('registration')}
                className={`pb-2 pt-1 px-4 font-black text-[10px] uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  oneOnOneSection === 'registration'
                    ? 'border-black text-black'
                    : 'border-transparent text-neutral-500 hover:text-black hover:border-neutral-300'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                Nova Sessão & Mentoria IA
              </button>
              <button
                onClick={() => setOneOnOneSection('history')}
                className={`pb-2 pt-1 px-4 font-black text-[10px] uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  oneOnOneSection === 'history'
                    ? 'border-black text-black'
                    : 'border-transparent text-neutral-500 hover:text-black hover:border-neutral-300'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                Histórico Geral ({displayedOneOnOneLogs.length})
              </button>
            </div>

            {/* Team selection filter specifically requested for 1:1 area */}
            <div className="flex items-center gap-2 self-start md:self-auto bg-neutral-100 border border-neutral-300 py-1.5 px-3 rounded-lg">
              <span className="text-[10px] font-black uppercase text-neutral-550 whitespace-nowrap">Equipe:</span>
              <select
                value={oneOnOneTeamFilter}
                onChange={(e) => {
                  setOneOnOneTeamFilter(e.target.value);
                  setSessionSdrId(''); // Reset selected contributor when filter changes
                }}
                className="bg-transparent border-none text-xs font-black text-neutral-900 focus:outline-none cursor-pointer"
              >
                <option value="all">Todas as Equipes</option>
                {teams.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {oneOnOneSection === 'registration' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in">
            
            {/* Form Column - Left */}
            <div className="lg:col-span-12 xl:col-span-7 bg-white border-2 border-neutral-900 rounded-2xl p-6 shadow-3xs space-y-5">
              <h4 className="text-xs font-black uppercase text-neutral-950 tracking-wider flex items-center gap-1.5 border-b border-neutral-200 pb-2">
                <Plus className="w-3.5 h-3.5 text-neutral-800" />
                Registrar Reunião de 1:1
              </h4>

              {sessionError && (
                <div className="p-3 bg-red-50 border border-red-300 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2 animate-bounce">
                  <AlertCircle className="w-4 h-4" />
                  {sessionError}
                </div>
              )}

              {sessionSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  {sessionSuccess}
                </div>
              )}

              {/* Informações básicas do Colaborador e Líder */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Professional Selection dropdown (SDR and Assessor) */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-neutral-550">SDR ou Assessor em Sessão</label>
                  <select
                    value={sessionSdrId}
                    onChange={(e) => setSessionSdrId(e.target.value)}
                    className="w-full text-xs font-bold uppercase rounded-xl border border-neutral-300 p-2.5 bg-neutral-50 text-neutral-800 cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-black"
                  >
                    <option value="">-- Selecione o Colaborador --</option>
                    {filteredProfessionals.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} {!p.active ? ' (Inativo)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Leader Name */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-neutral-550">Líder Responsável</label>
                  <input
                    type="text"
                    value={sessionLeaderName}
                    onChange={(e) => setSessionLeaderName(e.target.value)}
                    placeholder="Nome do Executivo/Líder"
                    className="w-full text-xs font-bold rounded-xl border border-neutral-300 p-2.5 bg-neutral-50 text-neutral-800 focus:outline-hidden focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>

              {/* GRUPO 1: RELATOS DO DESENVOLVIMENTO (Primeira Seção) */}
              <div className="border-t border-neutral-100 pt-3 space-y-4">
                <div className="flex items-center gap-1.5 pb-1">
                  <span className="text-xs">📝</span>
                  <span className="text-[11px] font-black uppercase tracking-wider text-black">Relatos e Observações de Desempenho</span>
                </div>
                
                {/* Psychological Input */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-neutral-550 flex items-center gap-1">
                    <span>🎈</span> Relato de Comportamento Psicológico / Suporte Motivacional
                  </label>
                  <textarea
                    placeholder="Descreva o comportamento, humor, fadiga ou nível de energia do colaborador. Ex: Mostrou-se muito entusiasmado com a prospecção mas ansioso..."
                    value={sessionPsychNotes}
                    onChange={(e) => setSessionPsychNotes(e.target.value)}
                    className="w-full h-18 text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-black"
                  />
                </div>

                {/* Tactical Input */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-neutral-550 flex items-center gap-1">
                    <span>🎯</span> Relato de Evolução Tática / Insumos Técnicos
                  </label>
                  <textarea
                    placeholder="Que gargalos táticos ou pontos de melhoria técnica foram observados? Ex: Apresenta excelente abordagem inicial, mas tem dificuldades para rebater objeções..."
                    value={sessionTacticalNotes}
                    onChange={(e) => setSessionTacticalNotes(e.target.value)}
                    className="w-full h-18 text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>

              {/* GRUPO 3: AVALIAÇÃO E DIAGNÓSTICO DO PERFIL VIA IA */}
              <div className="bg-neutral-50/70 border-2 border-neutral-900 rounded-2xl p-4.5 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span className="text-[10.5px] font-black uppercase tracking-wider text-indigo-950 font-display">Diagnóstico do Perfil Comercial via IA</span>
                  </div>
                  {diagnosedByAI ? (
                    <span className="text-[9px] bg-indigo-100 text-indigo-800 font-black px-2 py-0.5 rounded border border-indigo-300 uppercase font-mono tracking-wider">
                      ✨ IA DIAGNOSTICADO
                    </span>
                  ) : (
                    <span className="text-[9px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded border border-amber-200 uppercase font-mono tracking-wider">
                      ⏳ Diagnóstico Pendente
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-neutral-600 leading-normal">
                  A avaliação do perfil profissional é gerada por Inteligência Artificial a partir de uma auditoria minuciosa das notas e relatos que você inseriu acima.
                </p>

                {/* Diagnosed Profile Output */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  <div className="md:col-span-6 space-y-1">
                    <span className="text-[9px] font-extrabold uppercase text-neutral-400 block tracking-wide">Perfil Diagnosticado Atual</span>
                    <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${
                      sessionProfessionalProfile === 'gestao' 
                        ? 'bg-purple-50/80 text-purple-900 border-purple-200'
                        : sessionProfessionalProfile === 'analitico'
                        ? 'bg-sky-50/80 text-sky-900 border-sky-200'
                        : sessionProfessionalProfile === 'operacional'
                        ? 'bg-teal-50/80 text-teal-900 border-teal-200'
                        : 'bg-orange-50/80 text-orange-900 border-orange-200'
                    }`}>
                      <span className="text-lg">
                        {sessionProfessionalProfile === 'gestao' ? '🛡️' : sessionProfessionalProfile === 'analitico' ? '📊' : sessionProfessionalProfile === 'operacional' ? '⚙️' : '⚡'}
                      </span>
                      <div className="space-y-0.5">
                        <span className="text-xs font-black uppercase block">
                          {sessionProfessionalProfile === 'gestao' ? 'Gestão / Liderança' : sessionProfessionalProfile === 'analitico' ? 'Analítico (Métricas)' : sessionProfessionalProfile === 'operacional' ? 'Operacional / Backoffice' : 'Comercial / Vendas'}
                        </span>
                        <span className="text-[9.5px] opacity-75 font-medium block">
                          {diagnosedByAI ? 'Mapeado de forma autônoma pela IA' : 'Selecione ou clique para rodar análise'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-6 space-y-1">
                    <span className="text-[9px] font-extrabold uppercase text-neutral-450 tracking-wide block">Ajuste de Classificação</span>
                    <select
                      value={sessionProfessionalProfile}
                      onChange={(e) => {
                        setSessionProfessionalProfile(e.target.value);
                        setDiagnosedByAI(''); // clear diagnostic label if adjusted manually to keep honest
                      }}
                      className="w-full text-xs font-bold uppercase rounded-xl border border-neutral-300 p-2.5 bg-white text-neutral-800 cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-black"
                    >
                      <option value="comercial">⚡ Comercial / Vendas</option>
                      <option value="gestao">🛡️ Gestão / Liderança</option>
                      <option value="analitico">📊 Analítico (Dados)</option>
                      <option value="operacional">⚙️ Operacional / Processos</option>
                    </select>
                  </div>
                </div>

                {/* Profile Dynamic Insight Description Box */}
                <div className={`p-2.5 rounded-xl border text-[11px] leading-relaxed ${
                  sessionProfessionalProfile === 'gestao' 
                    ? 'bg-purple-50/50 text-purple-800 border-purple-150'
                    : sessionProfessionalProfile === 'analitico'
                    ? 'bg-sky-50/50 text-sky-800 border-sky-150'
                    : sessionProfessionalProfile === 'operacional'
                    ? 'bg-teal-50/50 text-teal-850 border-teal-150'
                    : 'bg-orange-50/50 text-orange-850 border-orange-150'
                }`}>
                  {sessionProfessionalProfile === 'gestao' && (
                    <p>🛡️ <strong>Selo de Liderança:</strong> Ideal para coordenar metas e mentorar pares. Direcione o profissional para ajudar na integração de novos membros do time.</p>
                  )}
                  {sessionProfessionalProfile === 'analitico' && (
                    <p>📊 <strong>Selo Analítico:</strong> Excelente em identificar gargalos táticos em dados, mas atenção com paralisia. Estimule conversões práticas sem hesitações.</p>
                  )}
                  {sessionProfessionalProfile === 'operacional' && (
                    <p>⚙️ <strong>Selo Operacional:</strong> Rigor absoluto na execução e governança de dados/CRM. Forneça playbooks de objeções comerciais agressivas para expandir a agilidade.</p>
                  )}
                  {sessionProfessionalProfile === 'comercial' && (
                    <p>⚡ <strong>Selo Comercial:</strong> Foco total em tração, chamadas telefônicas e persuasão. Oriente na disciplina de preenchimento do CRM e follow-ups consistentes.</p>
                  )}
                </div>
              </div>

              {/* GRUPO 2: METAS E PLANO DE AÇÃO */}
              <div className="border-t border-neutral-100 pt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Rating Status */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-neutral-550">Status Operacional</label>
                  <select
                    value={sessionStatus}
                    onChange={(e) => setSessionStatus(e.target.value as any)}
                    className="w-full text-xs font-bold uppercase rounded-xl border border-neutral-300 p-2.5 bg-neutral-50 text-neutral-800 cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-black font-mono"
                  >
                    <option value="NO_CAMINHO">🟢 NO CAMINHO (ENTREGA CONFORME)</option>
                    <option value="EM_RISCO">🚨 EM RISCO (ALERTA DE DESVIO)</option>
                    <option value="OUTLIER">🌟 DESTAQUE (SURPREENDENDO)</option>
                  </select>
                </div>

                {/* Next Date Picker */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-neutral-550">Próxima Sessão 1:1</label>
                  <input
                    type="date"
                    value={sessionNextMeeting}
                    onChange={(e) => setSessionNextMeeting(e.target.value)}
                    className="w-full text-xs font-bold rounded-xl border border-neutral-300 p-2.5 bg-neutral-50 text-neutral-800 focus:outline-hidden focus:ring-1 focus:ring-black font-mono cursor-pointer"
                  />
                </div>
              </div>

              {/* Action Plan */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase text-neutral-550">
                  🗺️ Plano de Ação & Roteiro Corretivo Estipulado
                </label>
                <textarea
                  placeholder="Metas de curto prazo e guias estabelecidas. Ex: Realizar 10 escutas de cold-calls de outliers e rever script de objeção patrimonial até quarta-feira..."
                  value={sessionActionPlan}
                  onChange={(e) => setSessionActionPlan(e.target.value)}
                  className="w-full h-18 text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-black"
                />
              </div>

              {/* AI Guidance Actions */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleTriggerSessionAICoach}
                  disabled={sessionAiLoading}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                >
                  {sessionAiLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                      A IA está analisando os relatos...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      Consultar IA e Gerar Diagnóstico
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleConfirmOneOnOne}
                  className="sm:ml-auto px-5 py-2.5 bg-black hover:bg-neutral-900 border-2 border-black text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Salvar Registro de 1:1
                </button>
              </div>

            </div>

            {/* AI Coaching Insight Column - Right */}
            <div className="lg:col-span-12 xl:col-span-5 space-y-4">
              
              {/* Selected SDR or Assessor Scorecard Preview */}
              {(() => {
                const prof = selectedProfessional;
                if (!prof) return null;
                
                if (prof.isAssessor) {
                  return (
                    <div className="bg-white border-2 border-neutral-900 rounded-2xl p-5 shadow-3xs space-y-2.5 relative">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[9px] font-black uppercase text-neutral-400 block tracking-widest leading-none">Métricas de Captação e Cross-Sell</span>
                          <h5 className="text-sm font-bold text-neutral-950 uppercase mt-1">{prof.data.name} (Assessor)</h5>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (isEditingScorecard) {
                              handleSaveScorecardMetrics();
                            } else {
                              setIsEditingScorecard(true);
                            }
                          }}
                          className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                            isEditingScorecard 
                              ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700' 
                              : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-300'
                          }`}
                        >
                          {isEditingScorecard ? (
                            <>
                              <Check className="w-3 h-3 text-white" />
                              Salvar
                            </>
                          ) : (
                            <>
                              <Edit2 className="w-3 h-3 text-neutral-600" />
                              Editar
                            </>
                          )}
                        </button>
                      </div>

                      {isEditingScorecard ? (
                        <div className="space-y-3 pt-1 text-xs">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="block text-[9px] font-extrabold uppercase text-neutral-500">Captação (R$)</label>
                              <input
                                type="number"
                                value={editAssrCaptacao}
                                onChange={(e) => setEditAssrCaptacao(Math.max(0, parseFloat(e.target.value) || 0))}
                                className="w-full text-xs font-mono font-bold rounded-lg border border-neutral-300 p-2 bg-neutral-50 text-neutral-900 focus:ring-1 focus:ring-black"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block text-[9px] font-extrabold uppercase text-neutral-500">Qtd Cross-Sells</label>
                              <input
                                type="number"
                                value={editAssrCrossSell}
                                onChange={(e) => setEditAssrCrossSell(Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-full text-xs font-mono font-bold rounded-lg border border-neutral-300 p-2 bg-neutral-50 text-neutral-900 focus:ring-1 focus:ring-black"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[9px] font-extrabold uppercase text-neutral-500">Detalhes de Cross-Sell</label>
                            <input
                              type="text"
                              value={editAssrCrossSellDetails}
                              onChange={(e) => setEditAssrCrossSellDetails(e.target.value)}
                              className="w-full text-xs font-bold rounded-lg border border-neutral-300 p-2 bg-neutral-50 text-neutral-900 focus:ring-1 focus:ring-black"
                              placeholder="Ex: Fundos multimercado, Previdência"
                            />
                          </div>
                          <div className="flex gap-2 justify-end pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setIsEditingScorecard(false);
                                if (prof.data) {
                                  setEditAssrCaptacao(prof.data.captacaoMes || 0);
                                  setEditAssrCrossSell(prof.data.crossSellCount || 0);
                                  setEditAssrCrossSellDetails(prof.data.crossSellDetails || '');
                                }
                              }}
                              className="px-2.5 py-1 text-[10px] font-bold text-neutral-500 hover:text-black uppercase"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3 pt-1">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-200 text-center">
                              <div className="text-[9px] font-bold text-neutral-450 uppercase leading-none">Captação no Mês</div>
                              <div className="font-mono text-sm font-black text-black mt-1">R$ {(prof.data.captacaoMes || 0).toLocaleString('pt-BR')}</div>
                            </div>
                            <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-200 text-center">
                              <div className="text-[9px] font-bold text-neutral-450 uppercase leading-none">Cross-Sells</div>
                              <div className="font-mono text-sm font-black text-black mt-1">{prof.data.crossSellCount || 0} realizado(s)</div>
                            </div>
                          </div>
                          <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-200">
                            <div className="text-[9px] font-bold text-neutral-450 uppercase leading-none mb-1">Produtos em Cross-Sell</div>
                            <div className="text-xs font-semibold text-neutral-800 leading-relaxed">
                              {prof.data.crossSellDetails || <span className="text-neutral-400 italic">Nenhum detalhe informado.</span>}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                } else {
                  const currentMonthRate = prof.data.agendamentosCount > 0 
                    ? Math.round((prof.data.efetivacoesCount / prof.data.agendamentosCount) * 100) 
                    : 0;

                  return (
                    <div className="bg-white border-2 border-neutral-900 rounded-2xl p-5 shadow-3xs space-y-2.5 relative">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[9px] font-black uppercase text-neutral-400 block tracking-widest leading-none">Métricas de Fundo de Funil do Período</span>
                          <h5 className="text-sm font-bold text-neutral-950 uppercase mt-1">{prof.data.name} (SDR)</h5>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (isEditingScorecard) {
                              handleSaveScorecardMetrics();
                            } else {
                              setIsEditingScorecard(true);
                            }
                          }}
                          className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                            isEditingScorecard 
                              ? 'bg-emerald-650 text-white border-emerald-700 hover:bg-emerald-700' 
                              : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-300'
                          }`}
                        >
                          {isEditingScorecard ? (
                            <>
                              <Check className="w-3 h-3 text-white" />
                              Salvar
                            </>
                          ) : (
                            <>
                              <Edit2 className="w-3 h-3 text-neutral-600" />
                              Editar
                            </>
                          )}
                        </button>
                      </div>

                      {isEditingScorecard ? (
                        <div className="space-y-3 pt-1 text-xs">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="block text-[9px] font-extrabold uppercase text-neutral-500">Sessões Agendadas</label>
                              <input
                                type="number"
                                value={editSdrAgendamentos}
                                onChange={(e) => setEditSdrAgendamentos(Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-full text-xs font-mono font-bold rounded-lg border border-neutral-300 p-2 bg-neutral-50 text-neutral-900 focus:ring-1 focus:ring-black"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block text-[9px] font-extrabold uppercase text-neutral-500">Sessões Convertidas</label>
                              <input
                                type="number"
                                value={editSdrEfetivacoes}
                                onChange={(e) => setEditSdrEfetivacoes(Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-full text-xs font-mono font-bold rounded-lg border border-neutral-300 p-2 bg-neutral-50 text-neutral-900 focus:ring-1 focus:ring-black"
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="block text-[9px] font-extrabold uppercase text-neutral-500">Ligações Realizadas</label>
                              <input
                                type="number"
                                value={editSdrCalls}
                                onChange={(e) => setEditSdrCalls(Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-full text-xs font-mono font-bold rounded-lg border border-neutral-300 p-2 bg-neutral-50 text-neutral-900 focus:ring-1 focus:ring-black"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block text-[9px] font-extrabold uppercase text-neutral-500">Contas Abertas</label>
                              <input
                                type="number"
                                value={editSdrContasAbertas}
                                onChange={(e) => setEditSdrContasAbertas(Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-full text-xs font-mono font-bold rounded-lg border border-neutral-300 p-2 bg-neutral-50 text-neutral-900 focus:ring-1 focus:ring-black"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between bg-neutral-50 border p-2 rounded-xl text-[10px] font-extrabold text-neutral-600">
                            <span>TAXA DE EFETIVAÇÃO:</span>
                            <span className="font-mono text-neutral-900 text-xs">
                              {editSdrAgendamentos > 0 ? Math.round((editSdrEfetivacoes / editSdrAgendamentos) * 100) : 0}%
                            </span>
                          </div>

                          <div className="flex gap-2 justify-end pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setIsEditingScorecard(false);
                                // reset to stored values
                                if (prof.data) {
                                  setEditSdrAgendamentos(prof.data.agendamentosCount || 0);
                                  setEditSdrEfetivacoes(prof.data.efetivacoesCount || 0);
                                  setEditSdrCalls(prof.data.callsCount || 0);
                                  setEditSdrContasAbertas(prof.data.contasAbertasCount || 0);
                                }
                              }}
                              className="px-2.5 py-1 text-[10px] font-bold text-neutral-500 hover:text-black uppercase"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3 pt-1">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-200 text-center">
                              <div className="text-[9px] font-bold text-neutral-450 uppercase leading-none">Sessões / Meta</div>
                              <div className="font-mono text-sm font-black text-black mt-1">
                                {prof.data.agendamentosCount} / {prof.data.metaAgendamentos || 20}
                              </div>
                            </div>
                            <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-200 text-center">
                              <div className="text-[9px] font-bold text-neutral-450 uppercase leading-none">Efetivadas / Conversão</div>
                              <div className="font-mono text-sm font-black text-black mt-1">
                                {prof.data.efetivacoesCount} ({currentMonthRate}%)
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-200 text-center">
                              <div className="text-[9px] font-bold text-neutral-450 uppercase leading-none">Ligações Efetuadas</div>
                              <div className="font-mono text-sm font-black text-black mt-1">
                                {prof.data.callsCount || 0}
                              </div>
                            </div>
                            <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-200 text-center">
                              <div className="text-[9px] font-bold text-neutral-450 uppercase leading-none">Contas Abertas</div>
                              <div className="font-mono text-sm font-black text-black mt-1">
                                {prof.data.contasAbertasCount || 0}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }
              })()}

              <div className="bg-neutral-900 text-white rounded-2xl p-5 border-2 border-neutral-950 space-y-4 shadow-3xs">
                <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-black text-amber-400 uppercase tracking-widest">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Parecer Estratégico Coaxial IA
                  </div>
                  <span className="font-mono text-[9px] text-neutral-400 bg-neutral-800 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider leading-none">Gemini 1.5 Pro</span>
                </div>

                {sessionAiFeedback ? (
                  <div className="text-neutral-200 text-xs leading-relaxed space-y-3 prose prose-invert overflow-y-auto max-h-[460px] custom-scrollbar text-justify pr-1">
                    <div className="markdown-body">
                      {/* Explicit clean type-safe implementation of markdown parsing using standard React Markdown */}
                      <Markdown>{sessionAiFeedback}</Markdown>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20 text-neutral-450 text-xs">
                    <Cpu className="w-7 h-7 mx-auto text-neutral-600 mb-2.5 animate-pulse" />
                    <p className="max-w-[250px] mx-auto text-[10px] text-neutral-450 uppercase font-black tracking-wider leading-relaxed">
                      Insira os relatos táticos no formulário e clique em <strong className="text-neutral-300">"Consultar Feedback Coaching"</strong> para computar o parecer conceitual.
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>
          )}

          {oneOnOneSection === 'history' && (
          /* Timeline of Logs list */
          <div className="bg-white border-2 border-neutral-900 rounded-2xl overflow-hidden shadow-3xs space-y-0.5 animate-fade-in">
            <div className="p-4 border-b-2 border-neutral-950 bg-neutral-50">
              <h4 className="text-xs font-black uppercase text-neutral-950 tracking-white font-display">
                Histórico Geral de Alinhamento 1:1 ({displayedOneOnOneLogs.length} Reuniões Registradas)
              </h4>
            </div>

            {displayedOneOnOneLogs.length === 0 ? (
              <div className="text-center py-16 text-neutral-400 text-xs border-dashed border-2 border-neutral-150 m-5 rounded-xl">
                Nenhum registro de Sessão 1:1 encontrado para este ciclo mensal ou equipe selecionada.
              </div>
            ) : (
              <div className="divide-y divide-neutral-200">
                {displayedOneOnOneLogs.map((log) => {
                  return (
                    <div key={log.id} className="p-5 hover:bg-neutral-50/70 transition-colors space-y-4">
                      
                      {/* Log Header metadata */}
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <div className="space-y-0.5">
                          <span className="text-xs font-black text-black tracking-tight">{log.sdrName}</span>
                          <div className="flex items-center gap-1.5 text-[9px] font-bold text-neutral-400 uppercase font-mono">
                            <span>Líder: {log.leader}</span>
                            <span>•</span>
                            <span>Realizado em: {new Date(log.timestamp).toLocaleString('pt-BR')}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {log.professionalProfile && (
                            <span className={`text-[9.5px] font-extrabold px-2 py-0.5 rounded-lg border uppercase ${
                              log.professionalProfile === 'gestao' 
                                ? 'bg-purple-150 text-purple-800 border-purple-300 font-bold' 
                                : log.professionalProfile === 'analitico' 
                                ? 'bg-sky-150 text-sky-850 border-sky-300 font-bold' 
                                : log.professionalProfile === 'operacional' 
                                ? 'bg-teal-150 text-teal-850 border-teal-300 font-bold' 
                                : 'bg-orange-150 text-orange-850 border-orange-300 font-bold'
                            }`}>
                              {log.professionalProfile === 'gestao' ? '🛡️ Gestão' : log.professionalProfile === 'analitico' ? '📊 Analítico' : log.professionalProfile === 'operacional' ? '⚙️ Operacional' : '⚡ Comercial'}
                            </span>
                          )}
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${
                            log.status === 'OUTLIER' 
                              ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                              : log.status === 'EM_RISCO' 
                              ? 'bg-red-50 text-red-700 border border-red-200' 
                              : 'bg-neutral-100 text-neutral-700 border border-neutral-300'
                          }`}>
                            {log.status === 'OUTLIER' ? '🌟 DESTAQUE' : log.status === 'EM_RISCO' ? '🚨 EM RISCO' : '🟢 NO CAMINHO'}
                          </span>
                          <span className="text-[9px] font-semibold text-neutral-500 font-mono">
                            Próxima data: {log.nextMeeting ? log.nextMeeting.split('-').reverse().join('/') : '—'}
                          </span>
                          {onDeleteOneOnOneLog && (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Deseja de fato excluir o registro de reunião individual de ${log.sdrName} realizada em ${new Date(log.timestamp).toLocaleDateString('pt-BR')}?`)) {
                                  onDeleteOneOnOneLog(log.id);
                                }
                              }}
                              className="p-1 px-1.5 hover:bg-red-50 text-neutral-450 hover:text-red-750 transition-colors rounded border border-transparent hover:border-red-150 cursor-pointer flex items-center justify-center shrink-0"
                              title="Excluir este registro"
                            >
                              <Trash2 className="w-3.5 h-3.5 animate-pulse" style={{ animationDuration: '3s' }} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Notes & Action Plan */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                        <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl space-y-1">
                          <span className="text-[9px] font-black uppercase text-neutral-450 block">Notas de Discussão & Diagnóstico</span>
                          <p className="text-neutral-750 leading-relaxed font-sans">{log.notes}</p>
                        </div>

                        <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl space-y-1">
                          <span className="text-[9px] font-black uppercase text-neutral-450 block">Plano de Ação Traçado / Entregáveis</span>
                          <p className="text-neutral-750 leading-relaxed font-semibold font-sans">{log.actionPlan}</p>
                        </div>
                      </div>

                      {/* Display appended AI Feedback */}
                      {log.aiFeedback && (
                        <div className="bg-neutral-900 text-white rounded-xl p-4.5 border border-amber-400 text-xs leading-relaxed space-y-3 prose prose-invert">
                          <div className="flex items-center gap-1.5 border-b border-neutral-800 pb-2 text-[10px] font-black text-amber-400 uppercase tracking-wider">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            Parecer Analítico Consolidado pela IA na Data do Registro
                          </div>
                          <div className="markdown-body pr-1 whitespace-pre-wrap font-sans text-neutral-200 leading-normal">
                            <Markdown>{log.aiFeedback}</Markdown>
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}
          </div>
          )}

          {oneOnOneSection === 'scheduler' && (
            <div className="space-y-6 animate-fade-in font-sans">
              
              {/* Lembretes e Status Widgets */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Lembrete de Reunião de Hoje */}
                {(() => {
                  const today = new Date().toISOString().split('T')[0];
                  const todayMeetings = displayedOneOnOneSchedules.filter(s => s.dateTime.split('T')[0] === today && (s.status === 'AGENDADA' || s.status === 'REAGENDADA'));
                  
                  if (todayMeetings.length > 0) {
                    return (
                      <div className="bg-amber-50/50 border-2 border-amber-500 rounded-2xl p-4.5 flex flex-col justify-between gap-3 shadow-3xs">
                        <div className="flex items-start gap-2.5">
                          <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping shrink-0 mt-1" />
                          <div>
                            <span className="text-[8px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 border border-amber-300 rounded px-1.5 py-0.5 font-mono">Status: Hoje</span>
                            <h5 className="text-xs font-black text-neutral-900 mt-1.5 uppercase tracking-wide">Convocações de 1:1 para hoje</h5>
                            <p className="text-[10px] text-neutral-600 mt-1 leading-relaxed font-sans">
                              Há <strong className="text-amber-800 font-extrabold">{todayMeetings.length} alinhamento(s)</strong> agendado(s) para hoje. Verifique os relatórios individuais de performance.
                            </p>
                          </div>
                        </div>
                        <div className="border-t border-amber-200/60 pt-2.5 flex flex-wrap gap-1.5">
                          {todayMeetings.map(m => (
                            <span key={m.id} className="text-[9px] font-mono font-bold text-neutral-800 bg-white border border-amber-300 rounded px-2.5 py-0.5 shadow-3xs">
                              👤 {m.sdrName.split(' ')[0]} ({m.dateTime.split('T')[1]})
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div className="bg-stone-50 border border-neutral-250 rounded-2xl p-4 flex items-center gap-3">
                      <div className="p-2 bg-neutral-100 rounded-xl text-neutral-400 border border-neutral-200">
                        <Check className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <span className="text-[8px] font-black uppercase text-neutral-400 block tracking-widest font-mono">Sem convocações hoje</span>
                        <p className="text-[10.5px] leading-tight text-neutral-500 mt-0.5">Calendário de 1:1 limpo para as próximas horas.</p>
                      </div>
                    </div>
                  );
                })()}

                {/* Lembrete de Reunião Atrasada */}
                {(() => {
                  const now = new Date();
                  const overdueMeetings = displayedOneOnOneSchedules.filter(s => {
                    const schedDate = new Date(s.dateTime);
                    return schedDate < now && (s.status === 'AGENDADA' || s.status === 'REAGENDADA');
                  });
                  
                  if (overdueMeetings.length > 0) {
                    return (
                      <div className="bg-red-50/50 border-2 border-red-500 rounded-2xl p-4.5 flex flex-col justify-between gap-3 shadow-3xs">
                        <div className="flex items-start gap-2.5">
                          <span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-ping shrink-0 mt-1" />
                          <div>
                            <span className="text-[8px] font-black uppercase tracking-wider text-red-800 bg-red-100 border border-red-300 rounded px-1.5 py-0.5 font-mono">Alerta: Atrasada</span>
                            <h5 className="text-xs font-black text-neutral-900 mt-1.5 uppercase tracking-wide">Reuniões pendentes anteriores</h5>
                            <p className="text-[10px] text-neutral-600 mt-1 leading-relaxed font-sans">
                              Atenção: <strong className="text-red-700 font-extrabold">{overdueMeetings.length} alinhamento(s)</strong> agendado(s) está com a data vencida sem registro.
                            </p>
                          </div>
                        </div>
                        <div className="border-t border-red-200/50 pt-2.5 flex flex-wrap gap-1.5">
                          {overdueMeetings.map(m => (
                            <span key={m.id} className="text-[9px] font-mono text-red-950 bg-white border border-red-200 rounded px-2.5 py-0.5 shadow-3xs font-bold">
                              📅 {m.sdrName.split(' ')[0]} ({m.dateTime.split('T')[0].split('-').reverse().slice(0, 2).join('/')})
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div className="bg-stone-50 border border-neutral-250 rounded-2xl p-4 flex items-center gap-3">
                      <div className="p-2 bg-neutral-100 rounded-xl text-neutral-400 border border-neutral-200">
                        <Check className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <span className="text-[8px] font-black uppercase text-neutral-400 block tracking-widest font-mono">Status da Agenda em dia</span>
                        <p className="text-[10.5px] leading-tight text-neutral-500 mt-0.5">Nenhum agendamento pendente anterior sem registro tático.</p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Main Scheduler View Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Form Column - Left */}
                <div className="lg:col-span-12 xl:col-span-4 bg-white border-2 border-neutral-900 rounded-2xl p-6 shadow-3xs space-y-5">
                  <h4 className="text-xs font-black uppercase text-neutral-950 tracking-wider flex items-center gap-1.5 border-b border-neutral-200 pb-2">
                    <Plus className="w-3.5 h-3.5 text-neutral-800" />
                    Agendar Próximo 1:1
                  </h4>

                  <form onSubmit={handleCreateSchedule} className="space-y-4">
                    {schedError && (
                      <div className="p-3 bg-red-50 border border-red-250 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {schedError}
                      </div>
                    )}

                    {schedSuccess && (
                      <div className="p-3 bg-emerald-50 border border-emerald-250 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2 animate-pulse">
                        <Check className="w-4 h-4 shrink-0" />
                        {schedSuccess}
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="block text-[9px] font-black uppercase text-neutral-550">SDR ou Assessor Convocado</label>
                      <select
                        value={schedSdrId}
                        onChange={(e) => setSchedSdrId(e.target.value)}
                        className="w-full text-xs font-bold uppercase rounded-xl border border-neutral-300 p-2.5 bg-white text-black cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-black"
                        style={{ color: '#000000' }}
                      >
                        <option value="" className="text-black font-bold">-- Selecione o Colaborador --</option>
                        {allProfessionals.map(p => (
                          <option key={p.id} value={p.id} className="text-black font-bold">
                            {p.name} {!p.active ? ' (Inativo)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[9px] font-black uppercase text-neutral-550">Líder Responsável</label>
                      <input
                        type="text"
                        value={schedLeader}
                        onChange={(e) => setSchedLeader(e.target.value)}
                        placeholder="Nome do Líder Responsável"
                        className="w-full text-xs font-bold rounded-xl border border-neutral-300 p-2.5 bg-white text-black focus:outline-hidden focus:ring-1 focus:ring-black"
                        style={{ color: '#000000' }}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[9px] font-black uppercase text-neutral-550">Data e Horário</label>
                        <input
                          type="datetime-local"
                          value={schedDateTime}
                          onChange={(e) => setSchedDateTime(e.target.value)}
                          className="w-full text-xs font-bold rounded-xl border border-neutral-300 p-2 bg-white text-black focus:outline-hidden focus:ring-1 focus:ring-black cursor-pointer"
                          style={{ color: '#000000' }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[9px] font-black uppercase text-neutral-550">Foco Principal / Pauta</label>
                      <select
                        value={schedTopic}
                        onChange={(e) => setSchedTopic(e.target.value)}
                        className="w-full text-xs font-bold uppercase rounded-xl border border-neutral-300 p-2 bg-white text-black cursor-pointer focus:outline-hidden"
                        style={{ color: '#000000' }}
                      >
                        <option value="Alinhamento de Metas" className="text-black font-bold">Alinhamento de Metas & KPIs</option>
                        <option value="Pitch Comercial" className="text-black font-bold">Simulação de Pitch & Qualificação</option>
                        <option value="Objeções de Corretagem" className="text-black font-bold">Contorno de Objeções complexas</option>
                        <option value="Alinhamento Cultural" className="text-black font-bold">Alinhamento de Cultura & Clima</option>
                        <option value="Plano de Carreira" className="text-black font-bold">Plano de Carreira & Evolução</option>
                        <option value="Comportamental/Motivacional" className="text-black font-bold">Comportamental & Equilíbrio Motivacional</option>
                        <option value="Outro" className="text-black font-bold">Outro de interesse operacional</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[9px] font-black uppercase text-neutral-550 font-display">Notas Prévias / Alinhamentos</label>
                      <textarea
                        rows={2}
                        value={schedNotes}
                        onChange={(e) => setSchedNotes(e.target.value)}
                        placeholder="Ex: Discutir metas de agendamentos pendentes ou dificuldades..."
                        className="w-full text-xs font-bold rounded-xl border border-neutral-300 p-2.5 bg-white text-black focus:outline-hidden focus:ring-1 focus:ring-black custom-scrollbar resize-none"
                        style={{ color: '#000000' }}
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-black hover:bg-neutral-900 text-brand-sand text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Calendar className="w-4 h-4" />
                      Confirmar Planificação
                    </button>
                  </form>
                </div>

                {/* List Column - Right */}
                <div className="lg:col-span-12 xl:col-span-8 space-y-4">
                  {/* Toolbar */}
                  <div className="bg-white border-2 border-neutral-900 rounded-2xl p-4.5 shadow-3xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-50/20">
                    <div>
                      <h5 className="text-xs font-black uppercase text-neutral-900 font-display">Planejamento de Encontros</h5>
                      <p className="text-[9.5px] text-neutral-500 font-medium">Filtre e controle o status do andamento dos encontros 1:1.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={schedFilterSdr}
                        onChange={(e) => setSchedFilterSdr(e.target.value)}
                        className="text-[9px] font-black uppercase rounded-lg border border-neutral-350 p-2 bg-white text-neutral-800 cursor-pointer focus:outline-hidden max-w-[130px]"
                      >
                        <option value="">Filtro: SDRs</option>
                        {Array.from(new Set(displayedOneOnOneSchedules.map(s => s.sdrName))).map(name => (
                          <option key={name} value={name}>{name.split(' (')[0]}</option>
                        ))}
                      </select>

                      <select
                        value={schedFilterStatus}
                        onChange={(e) => setSchedFilterStatus(e.target.value)}
                        className="text-[9px] font-black uppercase rounded-lg border border-neutral-350 p-2 bg-white text-neutral-800 cursor-pointer focus:outline-hidden"
                      >
                        <option value="">Filtro: Status</option>
                        <option value="AGENDADA">Agendada</option>
                        <option value="REAGENDADA">Reagendada</option>
                        <option value="CONCLUIDA">Concluída</option>
                        <option value="CANCELADA">Cancelada</option>
                      </select>
                    </div>
                  </div>

                  {/* List Board */}
                  <div className="bg-white border-2 border-neutral-900 rounded-2xl shadow-3xs overflow-hidden">
                    {(() => {
                      const filtered = displayedOneOnOneSchedules.filter(s => {
                        if (schedFilterSdr && s.sdrName !== schedFilterSdr) return false;
                        if (schedFilterStatus && s.status !== schedFilterStatus) return false;
                        return true;
                      });

                      if (filtered.length === 0) {
                        return (
                          <div className="text-center py-20 text-neutral-450 text-xs border-dashed border-2 border-neutral-200 m-5 rounded-2xl">
                            <Clock className="w-8 h-8 text-neutral-400 mx-auto mb-2 animate-pulse" />
                            Nenhum compromisso agendado com os filtros atuais.
                          </div>
                        );
                      }

                      return (
                        <div className="divide-y divide-neutral-250">
                          {filtered.map(sched => {
                            const schedDate = new Date(sched.dateTime);
                            const isPast = schedDate < new Date();
                            const dateFormatted = sched.dateTime ? `${sched.dateTime.split('T')[0].split('-').reverse().join('/')} às ${sched.dateTime.split('T')[1]}` : '—';
                            
                            return (
                              <div key={sched.id} className="p-4 hover:bg-neutral-50/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-1.5 flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs font-black text-neutral-900">{sched.sdrName}</span>
                                    <span className="text-[9px] font-bold text-neutral-400 uppercase font-mono">Líder: {sched.leader}</span>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="text-[9px] font-mono bg-brand-sand text-neutral-700 px-2 py-0.5 rounded border border-neutral-300 flex items-center gap-1 font-bold">
                                      <Calendar className="w-3 h-3 text-neutral-500" />
                                      {dateFormatted}
                                    </span>

                                    <span className="text-[9px] font-black uppercase text-neutral-600 bg-stone-50 border border-neutral-250 rounded px-1.5 py-0.5">
                                      🎯 {sched.topic}
                                    </span>

                                    {isPast && (sched.status === 'AGENDADA' || sched.status === 'REAGENDADA') && (
                                      <span className="text-[8px] font-black font-mono uppercase bg-red-100/70 text-red-700 border border-red-200 rounded px-1.5 py-0.5 animate-pulse leading-none">
                                        ⚠️ Atrasada
                                      </span>
                                    )}
                                  </div>

                                  {sched.notes && (
                                    <p className="text-[10px] text-neutral-500 leading-relaxed font-sans italic max-w-xl truncate">
                                      "{sched.notes}"
                                    </p>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                                  <select
                                    value={sched.status}
                                    onChange={(e) => handleUpdateScheduleStatus(sched.id, e.target.value)}
                                    className={`text-[9px] font-black uppercase rounded px-2 py-1.5 border hover:border-black cursor-pointer focus:outline-hidden transition-all ${
                                      sched.status === 'CONCLUIDA'
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                        : sched.status === 'CANCELADA'
                                        ? 'bg-red-50/70 text-red-700 border-red-250'
                                        : sched.status === 'REAGENDADA'
                                        ? 'bg-amber-50 text-amber-800 border-amber-350'
                                        : 'bg-stone-50 text-neutral-800 border-neutral-300'
                                    }`}
                                  >
                                    <option value="AGENDADA">Agendada</option>
                                    <option value="REAGENDADA">Reagendado</option>
                                    <option value="CONCLUIDA">Concluída</option>
                                    <option value="CANCELADA">Cancelada</option>
                                  </select>

                                  {sched.status !== 'CONCLUIDA' && sched.status !== 'CANCELADA' && (
                                    <button
                                      type="button"
                                      onClick={() => handleCompleteAndGoToLog(sched)}
                                      title="Registrar ata e coaching tático desta reunião"
                                      className="px-2.5 py-1.5 bg-black hover:bg-neutral-900 border border-black font-black uppercase text-[9px] text-brand-sand tracking-widest rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-3xs hover:border-neutral-950"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                      Realizar 1:1
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSchedule(sched.id)}
                                    className="p-1.5 hover:bg-red-50 text-neutral-400 hover:text-red-600 rounded-lg transition-all border border-transparent hover:border-red-200 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}
