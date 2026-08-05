import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { SDR, Assessor, TeamLeader } from '../types';
import { 
  Users, UserPlus, Trash2, Edit2, Check, X, Shield, Settings,
  Activity, Briefcase, Calendar, Phone, CheckCircle2, TrendingUp, 
  Plus, AlertCircle, Award, Target, HelpCircle, BarChart3, ChevronDown, ChevronUp, Lock
} from 'lucide-react';

export default function MyTeamSection() {
  const { 
    currentUser, 
    sdrs = [], 
    assessores = [], 
    leaders = [], 
    teams = [],
    addTeam,
    renameTeam,
    addSDR,
    updateSDR,
    deleteSDR,
    addAssessor,
    updateAssessor,
    deleteAssessor,
    updateLeader,
    setCurrentUser,
    currentMonth
  } = useAppStore();

  // Find the leader record corresponding to logged-in leader (if any)
  const currentLeader = useMemo(() => {
    if (!currentUser || currentUser.role !== 'leader') return null;
    return leaders.find(l => l.name.toLowerCase() === currentUser.name.toLowerCase()) || null;
  }, [currentUser, leaders]);

  // Active team filter: if leader, locked to leader's team. If admin, can select any.
  const [selectedTeam, setSelectedTeam] = useState<string>(() => {
    if (currentUser?.role === 'leader') {
      return currentUser.teamName || 'Mesa Inv. Private';
    }
    return teams[0] || 'Mesa Inv. Private';
  });

  // Keep selectedTeam synced in case leader's team name updates
  React.useEffect(() => {
    if (currentUser?.role === 'leader' && currentUser.teamName) {
      setSelectedTeam(currentUser.teamName);
    }
  }, [currentUser]);

  // States for renaming or creating teamName
  const [teamNameInput, setTeamNameInput] = useState('');
  const [isRenamingTeam, setIsRenamingTeam] = useState(false);
  const [newTeamCreationInput, setNewTeamCreationInput] = useState('');
  const [isCreatingNewTeam, setIsCreatingNewTeam] = useState(false);

  // Modal or form for adding a new member
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [memberRole, setMemberRole] = useState<'sdr' | 'assessor' | 'consultor'>('sdr');
  const [memberName, setMemberName] = useState('');
  const [memberAdmissionDate, setMemberAdmissionDate] = useState(new Date().toISOString().split('T')[0]);
  const [memberProfile, setMemberProfile] = useState('Comercial');
  const [memberAgendaLink, setMemberAgendaLink] = useState('');

  // Sdr-specific goals:
  const [sdrMetaAgendamentos, setSdrMetaAgendamentos] = useState(20);
  const [sdrMetaEfetivacaoRate, setSdrMetaEfetivacaoRate] = useState(50);
  const [sdrMetaEfetivacoes, setSdrMetaEfetivacoes] = useState(10);
  const [sdrMetaContasAbertas, setSdrMetaContasAbertas] = useState(5);

  // Assessor/Consultor-specific goals:
  const [assMetaLigacoes, setAssMetaLigacoes] = useState(100);
  const [assMetaReunioesAgendadas, setAssMetaReunioesAgendadas] = useState(15);
  const [assMetaReunioesRealizadas, setAssMetaReunioesRealizadas] = useState(10);
  const [assMetaContasAbertas, setAssMetaContasAbertas] = useState(5);
  const [assMetaNet, setAssMetaNet] = useState(1000000);
  const [assMetaCrossSell, setAssMetaCrossSell] = useState(4);

  // Edit Member Inline State
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingMemberRole, setEditingMemberRole] = useState<'sdr' | 'assessor' | 'consultor'>('sdr');
  const [editName, setEditName] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [editAdmissionDate, setEditAdmissionDate] = useState('');
  const [editProfile, setEditProfile] = useState('');
  const [editAgendaLink, setEditAgendaLink] = useState('');
  const [editTeamState, setEditTeamState] = useState('');
  const [editRoleState, setEditRoleState] = useState<'sdr' | 'assessor' | 'consultor'>('sdr');

  // Editing values for SDR
  const [editSdrAgendamentos, setEditSdrAgendamentos] = useState(0);
  const [editSdrEfetivacoes, setEditSdrEfetivacoes] = useState(0);
  const [editSdrCalls, setEditSdrCalls] = useState(0);
  const [editSdrContasAbertas, setEditSdrContasAbertas] = useState(0);
  const [editSdrMetaAgendamentos, setEditSdrMetaAgendamentos] = useState(0);
  const [editSdrMetaEfetivacoes, setEditSdrMetaEfetivacoes] = useState(0);
  const [editSdrMetaEfetivacaoRate, setEditSdrMetaEfetivacaoRate] = useState(0);
  const [editSdrMetaContasAbertas, setEditSdrMetaContasAbertas] = useState(0);

  // Editing values for Assessor/Consultor
  const [editAssMetaLigacoes, setEditAssMetaLigacoes] = useState(0);
  const [editAssRealizadoLigacoes, setEditAssRealizadoLigacoes] = useState(0);
  const [editAssMetaReunioesAgendadas, setEditAssMetaReunioesAgendadas] = useState(0);
  const [editAssRealizadoReunioesAgendadas, setEditAssRealizadoReunioesAgendadas] = useState(0);
  const [editAssMetaReunioesRealizadas, setEditAssMetaReunioesRealizadas] = useState(0);
  const [editAssRealizadoReunioesRealizadas, setEditAssRealizadoReunioesRealizadas] = useState(0);
  const [editAssMetaContasAbertas, setEditAssMetaContasAbertas] = useState(0);
  const [editAssRealizadoContasAbertas, setEditAssRealizadoContasAbertas] = useState(0);
  const [editAssMetaNet, setEditAssMetaNet] = useState(0);
  const [editAssRealizadoNet, setEditAssRealizadoNet] = useState(0);
  const [editAssMetaCrossSell, setEditAssMetaCrossSell] = useState(0);
  const [editAssRealizadoCrossSell, setEditAssRealizadoCrossSell] = useState(0);

  // Detailed cross-sell products editing
  const [editCSSeguroMeta, setEditCSSeguroMeta] = useState(0);
  const [editCSSeguroReal, setEditCSSeguroReal] = useState(0);
  const [editCSConsorcioMeta, setEditCSConsorcioMeta] = useState(0);
  const [editCSConsorcioReal, setEditCSConsorcioReal] = useState(0);
  const [editCSContabilidadeMeta, setEditCSContabilidadeMeta] = useState(0);
  const [editCSContabilidadeReal, setEditCSContabilidadeReal] = useState(0);
  const [editCSSaudeMeta, setEditCSSaudeMeta] = useState(0);
  const [editCSSaudeReal, setEditCSSaudeReal] = useState(0);
  const [editCSCambioMeta, setEditCSCambioMeta] = useState(0);
  const [editCSCambioReal, setEditCSCambioReal] = useState(0);
  const [editCSOutrosMeta, setEditCSOutrosMeta] = useState(0);
  const [editCSOutrosReal, setEditCSOutrosReal] = useState(0);

  // Filter members of active team
  const teamSDRs = useMemo(() => {
    return sdrs.filter(s => s.team === selectedTeam);
  }, [sdrs, selectedTeam]);

  const teamAssessores = useMemo(() => {
    return assessores.filter(a => a.team === selectedTeam && (!a.roleType || a.roleType === 'assessor'));
  }, [assessores, selectedTeam]);

  const teamConsultores = useMemo(() => {
    return assessores.filter(a => a.team === selectedTeam && a.roleType === 'consultor');
  }, [assessores, selectedTeam]);

  // --- 📝 STATE & HANDLERS FOR SIMPLIFIED BULK GOALS MANAGEMENT (LÍDER EXCLUSIVE OPTION) ---
  const [isBulkGoalEditing, setIsBulkGoalEditing] = useState(false);
  const [bulkGoalsState, setBulkGoalsState] = useState<Record<string, {
    metaLigacoes: number;
    metaReunioesAgendadas: number;
    metaReunioesRealizadas: number;
    metaContasAbertas: number;
    metaNet: number;
    metaCrossSell: number;
  }>>({});
  const [bulkSdrState, setBulkSdrState] = useState<Record<string, {
    metaAgendamentos: number;
    metaEfetivacaoRate: number;
    metaEfetivacoes: number;
    metaContasAbertas: number;
  }>>({});

  const startBulkEditing = () => {
    const initialAdvisors: typeof bulkGoalsState = {};
    [...teamAssessores, ...teamConsultores].forEach(a => {
      initialAdvisors[a.id] = {
        metaLigacoes: a.metaLigacoes ?? 100,
        metaReunioesAgendadas: a.metaReunioesAgendadas ?? 15,
        metaReunioesRealizadas: a.metaReunioesRealizadas ?? 10,
        metaContasAbertas: a.metaContasAbertas ?? 5,
        metaNet: a.metaNet ?? 1000000,
        metaCrossSell: a.metaCrossSell ?? 4
      };
    });

    const initialSdrs: typeof bulkSdrState = {};
    teamSDRs.forEach(s => {
      initialSdrs[s.id] = {
        metaAgendamentos: s.metaAgendamentos ?? 20,
        metaEfetivacaoRate: s.metaEfetivacaoRate ?? 50,
        metaEfetivacoes: s.metaEfetivacoes ?? 10,
        metaContasAbertas: s.metaContasAbertas ?? 5
      };
    });

    setBulkGoalsState(initialAdvisors);
    setBulkSdrState(initialSdrs);
    setIsBulkGoalEditing(true);
  };

  const handleBulkAdvisorGoalChange = (id: string, key: keyof typeof bulkGoalsState[string], value: number) => {
    setBulkGoalsState(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [key]: value
      }
    }));
  };

  const handleBulkSdrGoalChange = (id: string, key: keyof typeof bulkSdrState[string], value: number) => {
    setBulkSdrState(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [key]: value
      }
    }));
  };

  const handleSaveBulkGoals = () => {
    // 1. Save advisors
    Object.entries(bulkGoalsState).forEach(([id, goals]) => {
      const existing = assessores.find(a => a.id === id);
      updateAssessor(id, {
        metaLigacoes: goals.metaLigacoes,
        metaReunioesAgendadas: goals.metaReunioesAgendadas,
        metaReunioesRealizadas: goals.metaReunioesRealizadas,
        metaContasAbertas: goals.metaContasAbertas,
        metaNet: goals.metaNet,
        metaCrossSell: goals.metaCrossSell,
        customMonitorMetrics: [
          { key: 'ligacoes', name: 'Ligações', target: goals.metaLigacoes, real: existing?.realizadoLigacoes ?? 0 },
          { key: 'agendadas', name: 'Reun. Agendadas', target: goals.metaReunioesAgendadas, real: existing?.realizadoReunioesAgendadas ?? 0 },
          { key: 'realizadas', name: 'Reuniões Realizadas', target: goals.metaReunioesRealizadas, real: existing?.realizadoReunioesRealizadas ?? 0 },
          { key: 'contas_abertas', name: 'Contas Novas', target: goals.metaContasAbertas, real: existing?.realizadoContasAbertas ?? 0 },
          { key: 'net', name: 'Captação Líquida (NET)', target: goals.metaNet, real: existing?.realizadoNet ?? 0 },
          { key: 'cross_sell', name: 'Qtd. Cross-Sell', target: goals.metaCrossSell, real: existing?.realizadoCrossSell ?? 0 },
        ]
      });
    });

    // 2. Save SDRs
    Object.entries(bulkSdrState).forEach(([id, goals]) => {
      updateSDR(id, {
        metaAgendamentos: goals.metaAgendamentos,
        metaEfetivacaoRate: goals.metaEfetivacaoRate,
        metaEfetivacoes: goals.metaEfetivacoes,
        metaContasAbertas: goals.metaContasAbertas
      });
    });

    setIsBulkGoalEditing(false);
    alert("Todas as metas operacionais dos colaboradores foram registradas e sincronizadas!");
  };

  const totalMembersCount = teamSDRs.length + teamAssessores.length + teamConsultores.length;

  // Aggregate Metrics Calculations
  const teamAggregates = useMemo(() => {
    let callsMeta = 0;
    let callsReal = 0;
    let appointmentsMeta = 0;
    let appointmentsReal = 0;
    let completedMeta = 0;
    let completedReal = 0;
    let accountsMeta = 0;
    let accountsReal = 0;
    let netMeta = 0;
    let netReal = 0;
    let crossSellMeta = 0;
    let crossSellReal = 0;

    // Collect SDR aggregates
    teamSDRs.forEach(s => {
      // In active version of state, current month records are fallback
      appointmentsMeta += s.metaAgendamentos || 20;
      appointmentsReal += s.agendamentosCount || 0;
      completedReal += s.efetivacoesCount || 0;
      accountsMeta += s.metaContasAbertas || 5;
      accountsReal += s.contasAbertasCount || 0;
      callsReal += s.callsCount || 0;
    });

    // Collect Assessor & Consultor aggregates
    const teamAdvisors = [...teamAssessores, ...teamConsultores];
    teamAdvisors.forEach(a => {
      callsMeta += a.metaLigacoes || 0;
      callsReal += a.realizadoLigacoes || 0;
      appointmentsMeta += a.metaReunioesAgendadas || 0;
      appointmentsReal += a.realizadoReunioesAgendadas || 0;
      completedMeta += a.metaReunioesRealizadas || 0;
      completedReal += a.realizadoReunioesRealizadas || 0;
      accountsMeta += a.metaContasAbertas || 0;
      accountsReal += a.realizadoContasAbertas || 0;
      netMeta += a.metaNet || 0;
      netReal += a.realizadoNet || a.captacaoMes || 0;
      crossSellMeta += a.metaCrossSell || 0;
      crossSellReal += a.realizadoCrossSell || a.crossSellCount || 0;
    });

    return {
      callsMeta, callsReal,
      appointmentsMeta, appointmentsReal,
      completedMeta, completedReal,
      accountsMeta, accountsReal,
      netMeta, netReal,
      crossSellMeta, crossSellReal,
    };
  }, [teamSDRs, teamAssessores, teamConsultores]);

  // Actions
  const handleRenameTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const oldName = selectedTeam;
    const nextName = teamNameInput.trim();
    if (!nextName || oldName === nextName) {
      setIsRenamingTeam(false);
      return;
    }

    // Rename in store: handles sdrs, assessores, team leaders
    renameTeam(oldName, nextName);

    // If leader, update session state also
    if (currentUser && currentUser.role === 'leader') {
      setCurrentUser({
        ...currentUser,
        teamName: nextName
      });
      if (currentLeader) {
        updateLeader(currentLeader.id, { teamName: nextName });
      }
    }

    setSelectedTeam(nextName);
    setIsRenamingTeam(false);
    alert(`Equipe comercial renomeada com sucesso de "${oldName}" para "${nextName}"!`);
  };

  const handleCreateNewTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newName = newTeamCreationInput.trim();
    if (!newName) return;

    if (teams.includes(newName)) {
      alert("Uma equipe com este nome já existe.");
      return;
    }

    addTeam(newName);
    setSelectedTeam(newName);
    setNewTeamCreationInput('');
    setIsCreatingNewTeam(false);
    alert(`Nova equipe comercial/mesa "${newName}" criada com sucesso de maneira ampla!`);
  };

  const handleRegisterMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName.trim()) {
      alert("Por favor insira o nome do integrante do time.");
      return;
    }

    if (memberRole === 'sdr') {
      addSDR({
        name: memberName.trim(),
        team: selectedTeam,
        active: true,
        callsCount: 0,
        agendamentosCount: 0,
        efetivacoesCount: 0,
        contasAbertasCount: 0,
        metaAgendamentos: Number(sdrMetaAgendamentos),
        metaEfetivacaoRate: Number(sdrMetaEfetivacaoRate),
        metaEfetivacoes: Number(sdrMetaEfetivacoes),
        metaContasAbertas: Number(sdrMetaContasAbertas),
        admissionDate: memberAdmissionDate,
        professionalProfile: memberProfile
      });
    } else {
      addAssessor({
        name: memberName.trim(),
        team: selectedTeam,
        active: true,
        roleType: memberRole,
        admissionDate: memberAdmissionDate,
        professionalProfile: memberProfile,
        agendaLink: memberAgendaLink.trim(),
        metaLigacoes: Number(assMetaLigacoes),
        metaReunioesAgendadas: Number(assMetaReunioesAgendadas),
        metaReunioesRealizadas: Number(assMetaReunioesRealizadas),
        metaContasAbertas: Number(assMetaContasAbertas),
        metaNet: Number(assMetaNet),
        metaCrossSell: Number(assMetaCrossSell),
        realizadoLigacoes: 0,
        realizadoReunioesAgendadas: 0,
        realizadoReunioesRealizadas: 0,
        realizadoContasAbertas: 0,
        realizadoNet: 0,
        realizadoCrossSell: 0,
        crossSellSeguroMeta: 0,
        crossSellSeguroRealizado: 0,
        crossSellConsorcioMeta: 0,
        crossSellConsorcioRealizado: 0,
        crossSellContabilidadeMeta: 0,
        crossSellContabilidadeRealizado: 0,
        crossSellPlanoSaudeMeta: 0,
        crossSellPlanoSaudeRealizado: 0,
        crossSellCambioMeta: 0,
        crossSellCambioRealizado: 0,
        crossSellOutrosMeta: 0,
        crossSellOutrosRealizado: 0
      });
    }

    // Reset Form
    setIsAddingMember(false);
    setMemberName('');
    setMemberProfile('Comercial');
    setMemberAgendaLink('');
  };

  const handleStartEditMember = (member: any, roleType: 'sdr' | 'assessor' | 'consultor') => {
    setEditingMemberId(member.id);
    setEditingMemberRole(roleType);
    setEditName(member.name || '');
    setEditActive(member.active !== false);
    setEditAdmissionDate(member.admissionDate || '');
    setEditProfile(member.professionalProfile || 'Comercial');
    setEditAgendaLink(member.agendaLink || '');
    setEditTeamState(member.team || '');
    setEditRoleState(roleType);

    if (roleType === 'sdr') {
      setEditSdrAgendamentos(member.agendamentosCount ?? 0);
      setEditSdrEfetivacoes(member.efetivacoesCount ?? 0);
      setEditSdrCalls(member.callsCount ?? 0);
      setEditSdrContasAbertas(member.contasAbertasCount ?? 0);
      setEditSdrMetaAgendamentos(member.metaAgendamentos ?? 20);
      setEditSdrMetaEfetivacoes(member.metaEfetivacoes ?? 10);
      setEditSdrMetaEfetivacaoRate(member.metaEfetivacaoRate ?? 50);
      setEditSdrMetaContasAbertas(member.metaContasAbertas ?? 5);
    } else {
      setEditAssMetaLigacoes(member.metaLigacoes ?? 0);
      setEditAssRealizadoLigacoes(member.realizadoLigacoes ?? 0);
      setEditAssMetaReunioesAgendadas(member.metaReunioesAgendadas ?? 0);
      setEditAssRealizadoReunioesAgendadas(member.realizadoReunioesAgendadas ?? 0);
      setEditAssMetaReunioesRealizadas(member.metaReunioesRealizadas ?? 0);
      setEditAssRealizadoReunioesRealizadas(member.realizadoReunioesRealizadas ?? 0);
      setEditAssMetaContasAbertas(member.metaContasAbertas ?? 0);
      setEditAssRealizadoContasAbertas(member.realizadoContasAbertas ?? 0);
      setEditAssMetaNet(member.metaNet ?? 0);
      setEditAssRealizadoNet(member.realizadoNet ?? 0);
      setEditAssMetaCrossSell(member.metaCrossSell ?? 0);
      setEditAssRealizadoCrossSell(member.realizadoCrossSell ?? 0);

      // Detail Cross Sell Products
      setEditCSSeguroMeta(member.crossSellSeguroMeta ?? 0);
      setEditCSSeguroReal(member.crossSellSeguroRealizado ?? 0);
      setEditCSConsorcioMeta(member.crossSellConsorcioMeta ?? 0);
      setEditCSConsorcioReal(member.crossSellConsorcioRealizado ?? 0);
      setEditCSContabilidadeMeta(member.crossSellContabilidadeMeta ?? 0);
      setEditCSContabilidadeReal(member.crossSellContabilidadeRealizado ?? 0);
      setEditCSSaudeMeta(member.crossSellPlanoSaudeMeta ?? 0);
      setEditCSSaudeReal(member.crossSellPlanoSaudeRealizado ?? 0);
      setEditCSCambioMeta(member.crossSellCambioMeta ?? 0);
      setEditCSCambioReal(member.crossSellCambioRealizado ?? 0);
      setEditCSOutrosMeta(member.crossSellOutrosMeta ?? 0);
      setEditCSOutrosReal(member.crossSellOutrosRealizado ?? 0);
    }
  };

  const handleSaveEditMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMemberId) return;

    const normalizedNewRole = editRoleState === 'sdr' ? 'sdr' : 'assessor';
    const normalizedOldRole = editingMemberRole === 'sdr' ? 'sdr' : 'assessor';
    const hasRoleChanged = normalizedNewRole !== normalizedOldRole;

    if (hasRoleChanged) {
      if (normalizedOldRole === 'sdr') {
        // SDR -> Assessor/Consultor
        deleteSDR(editingMemberId);
        addAssessor({
          name: editName.trim(),
          active: editActive,
          admissionDate: editAdmissionDate,
          professionalProfile: editProfile,
          team: editTeamState,
          roleType: editRoleState === 'consultor' ? 'consultor' : 'assessor',
          agendaLink: editAgendaLink.trim(),
          participatesInRotation: true,
          captacaoMes: 0,
          crossSellCount: 0,
          crossSellDetails: '',
          metaLigacoes: Number(editAssMetaLigacoes),
          realizadoLigacoes: Number(editAssRealizadoLigacoes),
          metaReunioesAgendadas: Number(editAssMetaReunioesAgendadas),
          realizadoReunioesAgendadas: Number(editAssRealizadoReunioesAgendadas),
          metaReunioesRealizadas: Number(editAssMetaReunioesRealizadas),
          realizadoReunioesRealizadas: Number(editAssRealizadoReunioesRealizadas),
          metaContasAbertas: Number(editAssMetaContasAbertas),
          realizadoContasAbertas: Number(editAssRealizadoContasAbertas),
          metaNet: Number(editAssMetaNet),
          realizadoNet: Number(editAssRealizadoNet),
          metaCrossSell: Number(editAssMetaCrossSell),
          realizadoCrossSell: Number(editAssRealizadoCrossSell)
        });
      } else {
        // Assessor/Consultor -> SDR
        deleteAssessor(editingMemberId);
        addSDR({
          name: editName.trim(),
          active: editActive,
          admissionDate: editAdmissionDate,
          professionalProfile: editProfile,
          team: editTeamState,
          agendamentosCount: Number(editSdrAgendamentos),
          efetivacoesCount: Number(editSdrEfetivacoes),
          callsCount: Number(editSdrCalls),
          contasAbertasCount: Number(editSdrContasAbertas),
          metaAgendamentos: Number(editSdrMetaAgendamentos),
          metaEfetivacoes: Number(editSdrMetaEfetivacoes),
          metaEfetivacaoRate: Number(editSdrMetaEfetivacaoRate),
          metaContasAbertas: Number(editSdrMetaContasAbertas),
        });
      }
    } else {
      // Role didn't change (only values, team or subclass assessor<->consultor changed)
      if (editingMemberRole === 'sdr') {
        updateSDR(editingMemberId, {
          name: editName.trim(),
          active: editActive,
          admissionDate: editAdmissionDate,
          professionalProfile: editProfile,
          team: editTeamState,
          agendamentosCount: Number(editSdrAgendamentos),
          efetivacoesCount: Number(editSdrEfetivacoes),
          callsCount: Number(editSdrCalls),
          contasAbertasCount: Number(editSdrContasAbertas),
          metaAgendamentos: Number(editSdrMetaAgendamentos),
          metaEfetivacoes: Number(editSdrMetaEfetivacoes),
          metaEfetivacaoRate: Number(editSdrMetaEfetivacaoRate),
          metaContasAbertas: Number(editSdrMetaContasAbertas),
        });
      } else {
        updateAssessor(editingMemberId, {
          name: editName.trim(),
          active: editActive,
          admissionDate: editAdmissionDate,
          professionalProfile: editProfile,
          agendaLink: editAgendaLink.trim(),
          team: editTeamState,
          roleType: editRoleState === 'consultor' ? 'consultor' : 'assessor',
          
          metaLigacoes: Number(editAssMetaLigacoes),
          realizadoLigacoes: Number(editAssRealizadoLigacoes),
          metaReunioesAgendadas: Number(editAssMetaReunioesAgendadas),
          realizadoReunioesAgendadas: Number(editAssRealizadoReunioesAgendadas),
          metaReunioesRealizadas: Number(editAssMetaReunioesRealizadas),
          realizadoReunioesRealizadas: Number(editAssRealizadoReunioesRealizadas),
          metaContasAbertas: Number(editAssMetaContasAbertas),
          realizadoContasAbertas: Number(editAssRealizadoContasAbertas),
          metaNet: Number(editAssMetaNet),
          realizadoNet: Number(editAssRealizadoNet),
          metaCrossSell: Number(editAssMetaCrossSell),
          realizadoCrossSell: Number(editAssRealizadoCrossSell),
          
          // Product Cross Sell
          crossSellSeguroMeta: Number(editCSSeguroMeta),
          crossSellSeguroRealizado: Number(editCSSeguroReal),
          crossSellConsorcioMeta: Number(editCSConsorcioMeta),
          crossSellConsorcioRealizado: Number(editCSConsorcioReal),
          crossSellContabilidadeMeta: Number(editCSContabilidadeMeta),
          crossSellContabilidadeRealizado: Number(editCSContabilidadeReal),
          crossSellPlanoSaudeMeta: Number(editCSSaudeMeta),
          crossSellPlanoSaudeRealizado: Number(editCSSaudeReal),
          crossSellCambioMeta: Number(editCSCambioMeta),
          crossSellCambioRealizado: Number(editCSCambioReal),
          crossSellOutrosMeta: Number(editCSOutrosMeta),
          crossSellOutrosRealizado: Number(editCSOutrosReal),
  
          // Update customized monitor helper arrays as well
          customMonitorMetrics: [
            { key: 'ligacoes', name: 'Ligações', target: Number(editAssMetaLigacoes), real: Number(editAssRealizadoLigacoes) },
            { key: 'agendadas', name: 'Reun. Agendadas', target: Number(editAssMetaReunioesAgendadas), real: Number(editAssRealizadoReunioesAgendadas) },
            { key: 'realizadas', name: 'Reuniões Realizadas', target: Number(editAssMetaReunioesRealizadas), real: Number(editAssRealizadoReunioesRealizadas) },
            { key: 'contas_abertas', name: 'Contas Novas', target: Number(editAssMetaContasAbertas), real: Number(editAssRealizadoContasAbertas) },
            { key: 'net', name: 'Captação Líquida (NET)', target: Number(editAssMetaNet), real: Number(editAssRealizadoNet) },
            { key: 'cross_sell', name: 'Qtd. Cross-Sell', target: Number(editAssMetaCrossSell), real: Number(editAssRealizadoCrossSell) },
          ]
        });
      }
    }

    setEditingMemberId(null);
    alert("Dados, cargo e equipe do integrante do time salvos com sucesso.");
  };

  const handleDeleteMember = (memberId: string, role: 'sdr' | 'advisor') => {
    if (!window.confirm("Deseja realmente remover este integrante do seu time comercial? Dados históricos e metas associadas serão excluídos permanentemente.")) return;
    
    if (role === 'sdr') {
      deleteSDR(memberId);
    } else {
      deleteAssessor(memberId);
    }
    alert("Integrante removido com sucesso.");
  };

  const getPercentString = (realized: number, goal: number) => {
    if (goal <= 0) return realized > 0 ? "100%" : "—";
    const percent = Math.min(Math.round((realized / goal) * 100), 200);
    return `${percent}%`;
  };

  const getPercentClass = (realized: number, goal: number) => {
    if (goal <= 0) return 'text-neutral-500';
    const percent = (realized / goal) * 100;
    if (percent >= 100) return 'text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-150 font-bold';
    if (percent >= 70) return 'text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-150 font-semibold';
    return 'text-red-600 bg-red-50/50 px-1.5 py-0.5 rounded border border-red-100 font-medium';
  };

  return (
    <div className="space-y-6 pt-1">
      {/* HEADER SECTION WITH KEY PERFORMANCE CAPABILITIES */}
      <div className="bg-white border-2 border-neutral-900 p-6 rounded-2xl shadow-sm text-left">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-neutral-900" />
              <h1 className="text-base font-black uppercase tracking-wider text-neutral-950 font-display">
                Gestão Consolidada de Equipe Comercial
              </h1>
            </div>
            <p className="text-xs text-neutral-505 font-medium leading-relaxed font-sans max-w-3xl">
              Crie mesas de assessoria e coordene múltiplos perfis sob sua liderança. Gerencie metas e resultados mensais de forma unificada para assessores, consultores de investimentos e sdr comerciais.
            </p>
          </div>

          <div className="bg-neutral-50 border border-neutral-250 p-3 rounded-xl shrink-0 flex items-center gap-3">
            <div className="text-right">
              <span className="block text-[8px] font-black uppercase tracking-widest text-neutral-450">Vigência Ativa</span>
              <span className="text-xs font-mono font-black text-neutral-900 uppercase">
                📅 {currentMonth.split('-')[1]}/{(currentMonth.split('-')[0])}
              </span>
            </div>
            <div className="w-px h-6 bg-neutral-350"></div>
            <div>
              <span className="block text-[8px] font-black uppercase tracking-widest text-neutral-450">Integrantes</span>
              <span className="text-xs font-black text-neutral-900 font-sans block">
                👥 {totalMembersCount} Profissionais
              </span>
            </div>
          </div>
        </div>

        {/* TEAM NAME SELECTION & EDITING BAR */}
        <div className="mt-5 pt-5 border-t border-neutral-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[10px] font-black uppercase text-neutral-500 tracking-wider font-mono">Liderando a Mesa:</span>

            {currentUser?.role === 'admin' ? (
              <select
                value={selectedTeam}
                onChange={e => setSelectedTeam(e.target.value)}
                className="px-3 py-1.5 bg-white border-2 border-neutral-900 rounded-lg text-xs font-bold text-neutral-900 cursor-pointer focus:outline-none focus:ring-1 focus:ring-black"
              >
                {teams.map(t => (
                  <option key={t} value={t}>{t.toUpperCase()}</option>
                ))}
              </select>
            ) : (
              <span className="px-3 py-1 bg-black text-white text-xs font-black uppercase rounded-lg tracking-wider">
                {selectedTeam.toUpperCase()}
              </span>
            )}

            {currentUser?.role === 'admin' ? (
              isRenamingTeam ? (
                <form onSubmit={handleRenameTeamSubmit} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={teamNameInput}
                    onChange={e => setTeamNameInput(e.target.value)}
                    className="px-2.5 py-1 text-xs font-bold border border-neutral-905 rounded-lg focus:outline-none"
                    placeholder="Novo Nome do Time"
                    required
                  />
                  <button
                    type="submit"
                    className="p-1.5 bg-emerald-700 hover:bg-emerald-850 text-white rounded-lg cursor-pointer"
                    title="Salvar Nome"
                  >
                    <Check className="w-3.5 h-3.5 text-white" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsRenamingTeam(false)}
                    className="p-1.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 rounded-lg cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setTeamNameInput(selectedTeam);
                    setIsRenamingTeam(true);
                  }}
                  className="text-[10px] font-extrabold text-neutral-550 border border-neutral-250 hover:border-neutral-400 hover:text-black px-2.5 py-1.5 rounded-lg transition-all cursor-pointer font-sans"
                >
                  ✏️ Renomear Mesa
                </button>
              )
            ) : null}

            {currentUser?.role === 'admin' && (
              isCreatingNewTeam ? (
                <form onSubmit={handleCreateNewTeamSubmit} className="flex items-center gap-1.5 border border-dashed p-1 rounded-xl border-neutral-400">
                  <input
                    type="text"
                    value={newTeamCreationInput}
                    onChange={e => setNewTeamCreationInput(e.target.value)}
                    className="px-2 py-1 text-xs font-bold border rounded focus:outline-none"
                    placeholder="Nome da Nova Equipe"
                    required
                  />
                  <button type="submit" className="px-2.5 py-1 bg-black hover:bg-neutral-900 text-white text-[10px] font-black uppercase rounded">
                    Salvar Mesa
                  </button>
                  <button type="button" onClick={() => setIsCreatingNewTeam(false)} className="p-1 text-neutral-400 hover:text-black">
                    <X className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsCreatingNewTeam(true)}
                  className="text-[10px] font-black text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-250 px-2.5 py-1.5 rounded-lg cursor-pointer transition-all uppercase tracking-wider font-sans"
                >
                  ➕ Criar Nova Mesa
                </button>
              )
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            {!isBulkGoalEditing && (
              <button
                type="button"
                onClick={startBulkEditing}
                className="px-4 py-2 border-2 border-neutral-900 bg-[#FAF9F5] hover:bg-neutral-100 text-black text-xs font-black uppercase tracking-wider rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer font-sans"
              >
                🎯 Ajuste Rápido de Metas (Lote)
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsAddingMember(true)}
              className="px-4 py-2 bg-black hover:bg-neutral-900 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer font-sans"
            >
              <UserPlus className="w-4 h-4 text-white" /> Cadastrar Colaborador
            </button>
          </div>
        </div>
      </div>

      {/* AGGREGATED TEAM DASHBOARD CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3.5 text-left">
        <div className="bg-[#FAF9F5] border border-neutral-250 hover:border-neutral-450 p-4 rounded-xl space-y-1">
          <Phone className="w-4 h-4 text-neutral-600 block mb-1" />
          <span className="block text-[8.5px] font-black text-neutral-450 uppercase tracking-wider">📞 Ligações Mesa</span>
          <span className="text-base font-black text-neutral-900 font-mono block">
            {teamAggregates.callsReal} <span className="text-[10px] text-neutral-400 font-normal">/ {teamAggregates.callsMeta}</span>
          </span>
          <div className="w-full bg-neutral-200 h-1 rounded overflow-hidden">
            <div 
              className="bg-black h-1 rounded" 
              style={{ width: `${Math.min((teamAggregates.callsReal / (teamAggregates.callsMeta || 1)) * 100, 100)}%` }}
            />
          </div>
          <span className="block text-[8px] font-mono font-bold text-neutral-500 text-right">
            {getPercentString(teamAggregates.callsReal, teamAggregates.callsMeta)}
          </span>
        </div>

        <div className="bg-[#FAF9F5] border border-neutral-250 hover:border-neutral-450 p-4 rounded-xl space-y-1">
          <Activity className="w-4 h-4 text-neutral-650 block mb-1" />
          <span className="block text-[8.5px] font-black text-neutral-450 uppercase tracking-wider">📅 Agendadas</span>
          <span className="text-base font-black text-neutral-900 font-mono block">
            {teamAggregates.appointmentsReal} <span className="text-[10px] text-neutral-400 font-normal">/ {teamAggregates.appointmentsMeta}</span>
          </span>
          <div className="w-full bg-neutral-200 h-1 rounded overflow-hidden">
            <div 
              className="bg-black h-1 rounded" 
              style={{ width: `${Math.min((teamAggregates.appointmentsReal / (teamAggregates.appointmentsMeta || 1)) * 100, 100)}%` }}
            />
          </div>
          <span className="block text-[8px] font-mono font-bold text-neutral-500 text-right">
            {getPercentString(teamAggregates.appointmentsReal, teamAggregates.appointmentsMeta)}
          </span>
        </div>

        <div className="bg-[#FAF9F5] border border-neutral-250 hover:border-neutral-450 p-4 rounded-xl space-y-1">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 block mb-1" />
          <span className="block text-[8.5px] font-black text-neutral-450 uppercase tracking-wider">🤝 Realizadas</span>
          <span className="text-base font-black text-neutral-900 font-mono block">
            {teamAggregates.completedReal} <span className="text-[10px] text-neutral-400 font-normal">/ {teamAggregates.completedMeta}</span>
          </span>
          <div className="w-full bg-neutral-200 h-1 rounded overflow-hidden">
            <div 
              className="bg-emerald-600 h-1 rounded" 
              style={{ width: `${Math.min((teamAggregates.completedReal / (teamAggregates.completedMeta || 1)) * 100, 100)}%` }}
            />
          </div>
          <span className="block text-[8px] font-mono font-black text-emerald-700 text-right">
            {getPercentString(teamAggregates.completedReal, teamAggregates.completedMeta)}
          </span>
        </div>

        <div className="bg-[#FAF9F5] border border-neutral-250 hover:border-neutral-450 p-4 rounded-xl space-y-1">
          <Award className="w-4 h-4 text-[#f59e0b] block mb-1" />
          <span className="block text-[8.5px] font-black text-neutral-450 uppercase tracking-wider">✨ Contas Novas</span>
          <span className="text-base font-black text-neutral-900 font-mono block">
            {teamAggregates.accountsReal} <span className="text-[10px] text-neutral-400 font-normal">/ {teamAggregates.accountsMeta}</span>
          </span>
          <div className="w-full bg-neutral-200 h-1 rounded overflow-hidden">
            <div 
              className="bg-amber-500 h-1 rounded" 
              style={{ width: `${Math.min((teamAggregates.accountsReal / (teamAggregates.accountsMeta || 1)) * 100, 100)}%` }}
            />
          </div>
          <span className="block text-[8px] font-mono font-black text-amber-700 text-right">
            {getPercentString(teamAggregates.accountsReal, teamAggregates.accountsMeta)}
          </span>
        </div>

        <div className="bg-[#FAF9F5] border border-neutral-250 hover:border-neutral-450 p-4 rounded-xl space-y-1">
          <TrendingUp className="w-4 h-4 text-emerald-800 block mb-1" />
          <span className="block text-[8.5px] font-black text-neutral-450 uppercase tracking-wider">💸 Captação Líquida</span>
          <span className="text-[13px] font-black text-neutral-900 font-mono block truncate" title={`R$ ${teamAggregates.netReal.toLocaleString('pt-BR')}`}>
            R$ {(teamAggregates.netReal / 1000000).toFixed(2)}M <span className="text-[9px] text-neutral-400 font-normal">/ {(teamAggregates.netMeta / 1000000).toFixed(1)}M</span>
          </span>
          <div className="w-full bg-neutral-200 h-1 rounded overflow-hidden">
            <div 
              className="bg-emerald-750 h-1 rounded" 
              style={{ width: `${Math.min((teamAggregates.netReal / (teamAggregates.netMeta || 1)) * 100, 100)}%` }}
            />
          </div>
          <span className="block text-[8px] font-mono font-black text-emerald-800 text-right">
            {getPercentString(teamAggregates.netReal, teamAggregates.netMeta)}
          </span>
        </div>

        <div className="bg-[#FAF9F5] border border-neutral-250 hover:border-neutral-450 p-4 rounded-xl space-y-1">
          <Target className="w-4 h-4 text-purple-700 block mb-1" />
          <span className="block text-[8.5px] font-black text-neutral-450 uppercase tracking-wider">🛡️ Qtd. Cross-Sell</span>
          <span className="text-base font-black text-neutral-900 font-mono block">
            {teamAggregates.crossSellReal} <span className="text-[10px] text-neutral-400 font-normal">/ {teamAggregates.crossSellMeta}</span>
          </span>
          <div className="w-full bg-neutral-200 h-1 rounded overflow-hidden">
            <div 
              className="bg-purple-650 h-1 rounded" 
              style={{ width: `${Math.min((teamAggregates.crossSellReal / (teamAggregates.crossSellMeta || 1)) * 100, 100)}%` }}
            />
          </div>
          <span className="block text-[8px] font-mono font-black text-purple-700 text-right">
            {getPercentString(teamAggregates.crossSellReal, teamAggregates.crossSellMeta)}
          </span>
        </div>
      </div>

      {/* POPUP MODAL FOR REGISTERING TEAM MEMBERS */}
      {isAddingMember && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#FCFBF9] border-2 border-neutral-900 w-full max-w-lg p-6 rounded-2xl shadow-xl text-left animate-fade-in space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-black uppercase text-neutral-900 tracking-wider">
                👤 Cadastrar Novo Integrante na Equipe
              </h3>
              <button 
                type="button"
                onClick={() => setIsAddingMember(false)}
                className="text-neutral-400 hover:text-black"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterMemberSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-black text-neutral-450 uppercase tracking-wider mb-1">
                    Categoria Operacional
                  </label>
                  <select
                    value={memberRole}
                    onChange={e => setMemberRole(e.target.value as 'sdr' | 'assessor' | 'consultor')}
                    className="w-full px-3 py-2 bg-white border border-neutral-250 rounded-lg text-xs font-bold focus:outline-none"
                  >
                    <option value="sdr">SDR Comercial</option>
                    <option value="assessor">Assessor de Investimentos</option>
                    <option value="consultor">Consultor de Negócios</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-black text-neutral-450 uppercase tracking-wider mb-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={memberName}
                    onChange={e => setMemberName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-neutral-250 rounded-lg text-xs font-bold focus:outline-none"
                    placeholder="Nome do Profissional"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-black text-neutral-450 uppercase tracking-wider mb-1">
                    Perfil / Foco
                  </label>
                  <input
                    type="text"
                    value={memberProfile}
                    onChange={e => setMemberProfile(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-neutral-250 rounded-lg text-xs font-bold focus:outline-none"
                    placeholder="Ex: Hunter, Farmer, Closer"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-black text-neutral-450 uppercase tracking-wider mb-1">
                    Data de Admissão
                  </label>
                  <input
                    type="date"
                    required
                    value={memberAdmissionDate}
                    onChange={e => setMemberAdmissionDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-neutral-250 rounded-lg text-xs font-bold focus:outline-none"
                  />
                </div>
              </div>

              {memberRole !== 'sdr' && (
                <div>
                  <label className="block text-[9px] font-black text-neutral-450 uppercase tracking-wider mb-1">
                    Link da Agenda de Calendário (Opcional)
                  </label>
                  <input
                    type="url"
                    value={memberAgendaLink}
                    onChange={e => setMemberAgendaLink(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-neutral-250 rounded-lg text-xs font-mono font-medium focus:outline-none"
                    placeholder="Ex: https://calendly.com/nome"
                  />
                </div>
              )}

              {/* DYNAMIC GOALS LAYOUT BASED ON ROLE */}
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
                <h4 className="text-[10px] font-black text-neutral-800 uppercase tracking-wider flex items-center gap-1">
                  <Target className="w-3.5 h-3.5" /> Metas de Partida Vigentes
                </h4>

                {memberRole === 'sdr' ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[8px] font-bold text-neutral-500 uppercase tracking-wide mb-1">Meta Agendamentos</label>
                      <input
                        type="number"
                        min="0"
                        value={sdrMetaAgendamentos}
                        onChange={e => setSdrMetaAgendamentos(Number(e.target.value))}
                        className="w-full p-1.5 border rounded font-mono text-xs text-center font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-neutral-500 uppercase tracking-wide mb-1">Meta Taxa Efetiv.(%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={sdrMetaEfetivacaoRate}
                        onChange={e => setSdrMetaEfetivacaoRate(Number(e.target.value))}
                        className="w-full p-1.5 border rounded font-mono text-xs text-center font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-neutral-500 uppercase tracking-wide mb-1">Meta Realizadas Absoluta</label>
                      <input
                        type="number"
                        min="0"
                        value={sdrMetaEfetivacoes}
                        onChange={e => setSdrMetaEfetivacoes(Number(e.target.value))}
                        className="w-full p-1.5 border rounded font-mono text-xs text-center font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-neutral-500 uppercase tracking-wide mb-1">Meta Contas Abertas</label>
                      <input
                        type="number"
                        min="0"
                        value={sdrMetaContasAbertas}
                        onChange={e => setSdrMetaContasAbertas(Number(e.target.value))}
                        className="w-full p-1.5 border rounded font-mono text-xs text-center font-bold"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[8.5px] font-extrabold text-neutral-550 uppercase mb-0.5">Ligações</label>
                      <input
                        type="number"
                        value={assMetaLigacoes}
                        onChange={e => setAssMetaLigacoes(Number(e.target.value))}
                        className="w-full p-1 border rounded text-xs text-center font-bold font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[8.5px] font-extrabold text-neutral-550 uppercase mb-0.5">Reun. Agend.</label>
                      <input
                        type="number"
                        value={assMetaReunioesAgendadas}
                        onChange={e => setAssMetaReunioesAgendadas(Number(e.target.value))}
                        className="w-full p-1 border rounded text-xs text-center font-bold font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[8.5px] font-extrabold text-neutral-550 uppercase mb-0.5">Reun. Realiz.</label>
                      <input
                        type="number"
                        value={assMetaReunioesRealizadas}
                        onChange={e => setAssMetaReunioesRealizadas(Number(e.target.value))}
                        className="w-full p-1 border rounded text-xs text-center font-bold font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[8.5px] font-extrabold text-neutral-550 uppercase mb-0.5">Contas</label>
                      <input
                        type="number"
                        value={assMetaContasAbertas}
                        onChange={e => setAssMetaContasAbertas(Number(e.target.value))}
                        className="w-full p-1 border rounded text-xs text-center font-bold font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[8.5px] font-extrabold text-neutral-550 uppercase mb-0.5">Captação (R$)</label>
                      <input
                        type="number"
                        value={assMetaNet}
                        onChange={e => setAssMetaNet(Number(e.target.value))}
                        className="w-full p-1 border rounded text-xs text-center font-bold font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[8.5px] font-extrabold text-neutral-550 uppercase mb-0.5">Qtd Cross-Sell</label>
                      <input
                        type="number"
                        value={assMetaCrossSell}
                        onChange={e => setAssMetaCrossSell(Number(e.target.value))}
                        className="w-full p-1 border rounded text-xs text-center font-bold font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddingMember(false)}
                  className="px-4 py-2 border rounded-xl hover:bg-neutral-100 text-xs font-bold text-neutral-600 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-black hover:bg-neutral-900 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-sm cursor-pointer"
                >
                  Confirmar Cadastro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TEAM MEMBERS TABLES & METRICS LIST */}
      <div className="bg-white border-2 border-neutral-900 p-6 rounded-2xl shadow-sm space-y-8 text-left">
        <h2 className="text-xs font-black uppercase tracking-widest text-neutral-850 flex items-center gap-1.5 border-b pb-2">
          <Briefcase className="w-4.5 h-4.5 text-neutral-700" />
          Acompanhamento e Metas do Corpo de Colaboradores
        </h2>

        {currentUser?.role === 'leader' && (
          <div className="bg-[#FAF9F5] border-2 border-neutral-300 p-4 rounded-xl flex items-start gap-3">
            <div className="p-2 bg-black text-white rounded-lg select-none">
              🛡️
            </div>
            <div>
              <h4 className="text-xs font-black uppercase text-neutral-900 tracking-wider">Modo Liderança Ativo ({selectedTeam})</h4>
              <p className="text-[11px] text-neutral-600 mt-0.5 leading-relaxed">
                Você está logado como gestor de time. Todas as funcionalidades foram adaptadas para você focar <strong>exclusivamente</strong> nos assessores, consultores de investimentos e SDRs do time <strong>{selectedTeam}</strong>. Chaves e metas amplas de outras áreas foram omitidas para manter sua mesa simplificada.
              </p>
            </div>
          </div>
        )}

        {isBulkGoalEditing && (
          <div className="bg-amber-50 border-2 border-amber-500 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-black text-amber-900 uppercase">⚠️ Modo Edição de Metas Coletivo Ativo</h4>
              <p className="text-[10.5px] text-amber-500 font-medium leading-normal">
                As metas operacionais de todos os SDRs, Assessores e Consultores estão abertas para edição simplificada abaixo. Modifique os valores e confirme.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsBulkGoalEditing(false)}
                className="px-3 py-1.5 border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-800 text-xs font-semibold rounded-lg cursor-pointer transition-all font-sans"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveBulkGoals}
                className="px-4 py-1.5 bg-black hover:bg-neutral-900 text-white text-xs font-black uppercase tracking-wider rounded-lg cursor-pointer transition-all shadow-sm font-sans"
              >
                💾 Salvar Todas as Metas
              </button>
            </div>
          </div>
        )}

        {totalMembersCount === 0 ? (
          <div className="p-12 border border-dashed border-neutral-250 rounded-2xl text-center space-y-2">
            <Users className="w-8 h-8 text-neutral-400 mx-auto" />
            <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Nenhum Profissional neste Colegiado</h4>
            <p className="text-[11px] text-neutral-500 leading-normal max-w-md mx-auto">
              Sua equipe de atendimento ou mesa comercial ainda não possui integrantes cadastrados. Use o botão <strong>Cadastrar Colaborador</strong> acima para iniciar.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* 1. SDR CO COMERCIALS SECTOR */}
            {teamSDRs.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-neutral-900" />
                  <h3 className="text-xs font-black text-neutral-900 uppercase tracking-widest">
                    SDRs Comerciais ({teamSDRs.length})
                  </h3>
                </div>

                <div className="overflow-x-auto border border-neutral-200 rounded-xl bg-white shadow-3xs">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-neutral-50 border-b text-[9px] font-mono font-black text-neutral-400 uppercase tracking-wider">
                      <tr>
                        <th className="p-3 pl-4">Colaborador</th>
                        <th className="p-3">Admissão</th>
                        <th className="p-3">Perfil</th>
                        <th className="p-3 text-center">Ligações Real.</th>
                        <th className="p-3 text-center">Agendadas (Realiz./Meta)</th>
                        <th className="p-3 text-center">Reuniões Efetiv. (Realiz./Meta)</th>
                        <th className="p-3 text-center">Conversão SDR</th>
                        <th className="p-3 text-center">Contas (Realiz./Meta)</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-right pr-4">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-[11px]">
                      {teamSDRs.map(s => {
                        const isEditing = editingMemberId === s.id;
                        const sdrConv = s.agendamentosCount > 0 ? Math.round((s.efetivacoesCount / s.agendamentosCount) * 100) : 0;
                        const metaRateGoal = s.metaEfetivacaoRate || 50;

                        if (isEditing) {
                          return (
                            <tr key={s.id} className="bg-neutral-50/70">
                              <td colSpan={10} className="p-4">
                                <form onSubmit={handleSaveEditMemberSubmit} className="space-y-4">
                                  <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
                                    <div>
                                      <label className="block text-[8px] font-black uppercase text-neutral-500 mb-1">Nome</label>
                                      <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full p-1.5 text-xs bg-white border border-neutral-300 rounded font-bold" />
                                    </div>
                                    <div>
                                      <label className="block text-[8px] font-black uppercase text-neutral-500 mb-1">Perfil</label>
                                      <input type="text" value={editProfile} onChange={e => setEditProfile(e.target.value)} className="w-full p-1.5 text-xs bg-white border border-neutral-300 rounded font-semibold" />
                                    </div>
                                    <div>
                                      <label className="block text-[8px] font-black uppercase text-neutral-500 mb-1">Admissão</label>
                                      <input type="date" value={editAdmissionDate} onChange={e => setEditAdmissionDate(e.target.value)} className="w-full p-1.5 text-xs bg-white border border-neutral-300 rounded" />
                                    </div>
                                    <div>
                                      <label className="block text-[8px] font-black uppercase text-neutral-500 mb-1">Profissional Ativo</label>
                                      <select value={editActive ? "true" : "false"} onChange={e => setEditActive(e.target.value === "true")} className="w-full p-1.5 text-xs bg-white border border-neutral-300 rounded font-bold">
                                        <option value="true">Sim (Produtivo)</option>
                                        <option value="false">Não (Bloqueado/Inativo)</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-[8px] font-black uppercase text-neutral-500 mb-1">Equipe liderada por</label>
                                      <select 
                                        value={editTeamState} 
                                        onChange={e => setEditTeamState(e.target.value)} 
                                        disabled={currentUser?.role === 'leader'}
                                        className="w-full p-1.5 text-xs bg-white disabled:bg-neutral-100 disabled:text-neutral-500 border border-neutral-350 rounded font-bold"
                                      >
                                        {teams.map(t => (
                                          <option key={t} value={t}>{t}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-[8px] font-black uppercase text-neutral-500 mb-1">Função / Cargo</label>
                                      <select value={editRoleState} onChange={e => setEditRoleState(e.target.value as any)} className="w-full p-1.5 text-xs bg-white border border-neutral-350 rounded font-bold uppercase text-[10px]">
                                        <option value="sdr">SDR (Prospector)</option>
                                        <option value="assessor">Assessor de Investimentos</option>
                                        <option value="consultor">Consultor Comercial</option>
                                      </select>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 bg-white p-3 border border-neutral-250 rounded-lg">
                                    <div>
                                      <label className="block text-[8px] font-black uppercase text-neutral-500 mb-0.5">Calls Real.</label>
                                      <input type="number" value={editSdrCalls} onChange={e => setEditSdrCalls(Number(e.target.value))} className="w-full p-1 text-center font-mono border text-xs" />
                                    </div>
                                    <div>
                                      <label className="block text-[8px] font-black uppercase text-neutral-500 mb-0.5">Agend. Real.</label>
                                      <input type="number" value={editSdrAgendamentos} onChange={e => setEditSdrAgendamentos(Number(e.target.value))} className="w-full p-1 text-center font-mono border text-xs" />
                                    </div>
                                    <div>
                                      <label className="block text-[8px] font-black uppercase text-neutral-500 mb-0.5">Agend. Meta</label>
                                      <input type="number" value={editSdrMetaAgendamentos} onChange={e => setEditSdrMetaAgendamentos(Number(e.target.value))} className="w-full p-1 text-center font-mono border text-xs" />
                                    </div>
                                    <div>
                                      <label className="block text-[8px] font-black uppercase text-neutral-500 mb-0.5">Reun. Real.</label>
                                      <input type="number" value={editSdrEfetivacoes} onChange={e => setEditSdrEfetivacoes(Number(e.target.value))} className="w-full p-1 text-center font-mono border text-xs" />
                                    </div>
                                    <div>
                                      <label className="block text-[8px] font-black uppercase text-neutral-500 mb-0.5">Reun. Meta</label>
                                      <input type="number" value={editSdrMetaEfetivacoes} onChange={e => setEditSdrMetaEfetivacoes(Number(e.target.value))} className="w-full p-1 text-center font-mono border text-xs" />
                                    </div>
                                    <div>
                                      <label className="block text-[8px] font-black uppercase text-neutral-500 mb-0.5">Meta Taxa (%)</label>
                                      <input type="number" value={editSdrMetaEfetivacaoRate} onChange={e => setEditSdrMetaEfetivacaoRate(Number(e.target.value))} className="w-full p-1 text-center font-mono border text-xs" />
                                    </div>
                                    <div>
                                      <label className="block text-[8px] font-black uppercase text-neutral-500 mb-0.5">Contas Real.</label>
                                      <input type="number" value={editSdrContasAbertas} onChange={e => setEditSdrContasAbertas(Number(e.target.value))} className="w-full p-1 text-center font-mono border text-xs" />
                                    </div>
                                    <div>
                                      <label className="block text-[8px] font-black uppercase text-neutral-500 mb-0.5">Contas Meta</label>
                                      <input type="number" value={editSdrMetaContasAbertas} onChange={e => setEditSdrMetaContasAbertas(Number(e.target.value))} className="w-full p-1 text-center font-mono border text-xs" />
                                    </div>
                                  </div>

                                  <div className="flex justify-end gap-2 text-xs font-semibold">
                                    <button type="button" onClick={() => setEditingMemberId(null)} className="px-2 py-1 border rounded bg-white hover:bg-neutral-100 uppercase">Cancelar</button>
                                    <button type="submit" className="px-3 py-1 bg-black hover:bg-neutral-900 text-white rounded uppercase text-[10px] font-black">Salvar Metas</button>
                                  </div>
                                </form>
                              </td>
                            </tr>
                          );
                        }

                        return (
                          <tr key={s.id} className="hover:bg-neutral-50/50 transition-all">
                            <td className="p-3 pl-4 font-bold text-neutral-900">{s.name}</td>
                            <td className="p-3 text-neutral-500 font-mono">
                              {s.admissionDate ? s.admissionDate.split('-').reverse().join('/') : '—'}
                            </td>
                            <td className="p-3">
                              <span className="text-[10px] bg-neutral-100 hover:bg-neutral-200 border text-neutral-600 px-2 py-0.5 rounded font-medium">
                                {s.professionalProfile || 'Hunter'}
                              </span>
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-neutral-700">{s.callsCount ?? 0}</td>
                            <td className="p-3 text-center font-mono">
                              <span className="font-bold text-neutral-900">{s.agendamentosCount}</span> 
                              <span className="text-neutral-400"> / </span>
                              {isBulkGoalEditing ? (
                                <input
                                  type="number"
                                  min="0"
                                  value={bulkSdrState[s.id]?.metaAgendamentos ?? s.metaAgendamentos ?? 20}
                                  onChange={e => handleBulkSdrGoalChange(s.id, 'metaAgendamentos', Number(e.target.value))}
                                  className="w-14 px-1 py-1 text-center font-mono font-black border-2 border-neutral-900 bg-amber-50 text-neutral-900 text-[10.5px] rounded outline-none focus:ring-1 focus:ring-amber-500"
                                />
                              ) : (
                                <span className="text-neutral-605 font-bold">{s.metaAgendamentos}</span>
                              )}
                              {!isBulkGoalEditing && (
                                <span className={`ml-1 px-1 py-0.5 rounded text-[8px] ${getPercentClass(s.agendamentosCount, s.metaAgendamentos)}`}>
                                  {getPercentString(s.agendamentosCount, s.metaAgendamentos)}
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center font-mono">
                              <span className="font-extrabold text-neutral-900">{s.efetivacoesCount}</span> 
                              <span className="text-neutral-400"> / </span>
                              {isBulkGoalEditing ? (
                                <input
                                  type="number"
                                  min="0"
                                  value={bulkSdrState[s.id]?.metaEfetivacoes ?? s.metaEfetivacoes ?? 10}
                                  onChange={e => handleBulkSdrGoalChange(s.id, 'metaEfetivacoes', Number(e.target.value))}
                                  className="w-14 px-1 py-1 text-center font-mono font-black border-2 border-neutral-900 bg-amber-50 text-neutral-900 text-[10.5px] rounded outline-none focus:ring-1 focus:ring-amber-500"
                                />
                              ) : (
                                <span className="text-neutral-605 font-bold">{s.metaEfetivacoes || 10}</span>
                              )}
                              {!isBulkGoalEditing && (
                                <span className={`ml-1 px-1 py-0.5 rounded text-[8px] ${getPercentClass(s.efetivacoesCount, s.metaEfetivacoes || 10)}`}>
                                  {getPercentString(s.efetivacoesCount, s.metaEfetivacoes || 10)}
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <span className={`font-mono font-black ${sdrConv >= metaRateGoal ? 'text-emerald-700 bg-emerald-50 px-1 border border-emerald-150' : 'text-neutral-600 bg-neutral-100 px-1 border border-neutral-200'} rounded text-[10px]`}>
                                ★ {sdrConv}% <span className="font-normal text-neutral-400">({metaRateGoal}% mta)</span>
                              </span>
                            </td>
                            <td className="p-3 text-center font-mono">
                              <span className="font-bold text-neutral-900">{s.contasAbertasCount ?? 0}</span> 
                              <span className="text-neutral-400"> / </span>
                              {isBulkGoalEditing ? (
                                <input
                                  type="number"
                                  min="0"
                                  value={bulkSdrState[s.id]?.metaContasAbertas ?? s.metaContasAbertas ?? 5}
                                  onChange={e => handleBulkSdrGoalChange(s.id, 'metaContasAbertas', Number(e.target.value))}
                                  className="w-14 px-1 py-1 text-center font-mono font-black border-2 border-neutral-900 bg-amber-50 text-neutral-900 text-[10.5px] rounded outline-none focus:ring-1 focus:ring-amber-500"
                                />
                              ) : (
                                <span className="text-neutral-605 font-bold">{s.metaContasAbertas || 5}</span>
                              )}
                              {!isBulkGoalEditing && (
                                <span className={`ml-1 px-1 py-0.5 rounded text-[8px] ${getPercentClass(s.contasAbertasCount ?? 0, s.metaContasAbertas || 5)}`}>
                                  {getPercentString(s.contasAbertasCount ?? 0, s.metaContasAbertas || 5)}
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              {s.active !== false ? (
                                <span className="inline-block px-1.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-150 font-black uppercase text-[8px] leading-none shrink-0 rounded">Ativo</span>
                              ) : (
                                <span className="inline-block px-1.5 py-0.5 bg-neutral-100 text-neutral-450 border border-neutral-250 font-black uppercase text-[8px] leading-none shrink-0 rounded">Inativo</span>
                              )}
                            </td>
                            <td className="p-3 text-right pr-4 shrink-0">
                              <div className="flex items-center justify-end gap-1.5">
                                <button type="button" onClick={() => handleStartEditMember(s, 'sdr')} className="p-1 px-2 border rounded hover:bg-neutral-100 text-neutral-600 cursor-pointer text-[10px] font-black uppercase">
                                  Editar
                                </button>
                                <button type="button" onClick={() => handleDeleteMember(s.id, 'sdr')} className="p-1 text-red-650 hover:bg-red-50 rounded cursor-pointer" title="Remover Integrante">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 2. ASSESSORES DE INVESTIMENTO SECTOR */}
            {teamAssessores.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <h3 className="text-xs font-black text-neutral-900 uppercase tracking-widest">
                    Assessores de Investimentos ({teamAssessores.length})
                  </h3>
                </div>

                <div className="overflow-x-auto border border-neutral-200 rounded-xl bg-white shadow-3xs">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-neutral-50 border-b text-[9px] font-mono font-black text-neutral-400 uppercase tracking-wider">
                      <tr>
                        <th className="p-3 pl-4">Colaborador</th>
                        <th className="p-3">Admissão</th>
                        <th className="p-3">Perfil</th>
                        <th className="p-3 text-center">Ligações (R./M.)</th>
                        <th className="p-3 text-center">Agendadas (R./M.)</th>
                        <th className="p-3 text-center">Realizadas (R./M.)</th>
                        <th className="p-3 text-center">Contas (R./M.)</th>
                        <th className="p-3 text-right">NET Captação (Realizado/Meta)</th>
                        <th className="p-3 text-center">Cross-Sell</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-right pr-4">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-[11px]">
                      {teamAssessores.map(a => {
                        const isEditing = editingMemberId === a.id;
                        const netRealVal = a.realizadoNet ?? a.captacaoMes ?? 0;
                        const csRealVal = a.realizadoCrossSell ?? a.crossSellCount ?? 0;

                        if (isEditing) {
                          return (
                            <tr key={a.id} className="bg-neutral-50/70">
                              <td colSpan={11} className="p-4">
                                <form onSubmit={handleSaveEditMemberSubmit} className="space-y-4">
                                  <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
                                    <div>
                                      <label className="block text-[8px] font-black uppercase text-neutral-500 mb-1">Nome</label>
                                      <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full p-1.5 text-xs bg-white border border-neutral-300 rounded font-bold" />
                                    </div>
                                    <div>
                                      <label className="block text-[8px] font-black uppercase text-neutral-500 mb-1">Calendly Agenda URL</label>
                                      <input type="url" value={editAgendaLink} onChange={e => setEditAgendaLink(e.target.value)} className="w-full p-1.5 text-xs bg-white border border-neutral-300 rounded font-mono" />
                                    </div>
                                    <div>
                                      <label className="block text-[8px] font-black uppercase text-neutral-500 mb-1">Admissão</label>
                                      <input type="date" value={editAdmissionDate} onChange={e => setEditAdmissionDate(e.target.value)} className="w-full p-1.5 text-xs bg-white border border-neutral-300 rounded" />
                                    </div>
                                    <div>
                                      <label className="block text-[8px] font-black uppercase text-neutral-500 mb-1">Status Ativo</label>
                                      <select value={editActive ? "true" : "false"} onChange={e => setEditActive(e.target.value === "true")} className="w-full p-1.5 text-xs bg-white border border-neutral-300 rounded font-bold">
                                        <option value="true">Ativo (Em Rodízio)</option>
                                        <option value="false">Bloqueado (Inativo)</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-[8px] font-black uppercase text-neutral-500 mb-1">Equipe liderada por</label>
                                      <select 
                                        value={editTeamState} 
                                        onChange={e => setEditTeamState(e.target.value)} 
                                        disabled={currentUser?.role === 'leader'}
                                        className="w-full p-1.5 text-xs bg-white disabled:bg-neutral-100 disabled:text-neutral-500 border border-neutral-350 rounded font-bold"
                                      >
                                        {teams.map(t => (
                                          <option key={t} value={t}>{t}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-[8px] font-black uppercase text-neutral-500 mb-1">Função / Cargo</label>
                                      <select value={editRoleState} onChange={e => setEditRoleState(e.target.value as any)} className="w-full p-1.5 text-xs bg-white border border-neutral-350 rounded font-bold uppercase text-[10px]">
                                        <option value="sdr">SDR (Prospector)</option>
                                        <option value="assessor">Assessor de Investimentos</option>
                                        <option value="consultor">Consultor Comercial</option>
                                      </select>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 bg-white p-3 border border-neutral-250 rounded-lg">
                                    <div>
                                      <label className="block text-[8px] font-extrabold text-neutral-500 mb-0.5">📞 Lig. Real.</label>
                                      <input type="number" value={editAssRealizadoLigacoes} onChange={e => setEditAssRealizadoLigacoes(Number(e.target.value))} className="w-full p-1 text-center font-mono border text-xs" />
                                    </div>
                                    <div>
                                      <label className="block text-[8px] font-extrabold text-neutral-500 mb-0.5">📞 Lig. Meta</label>
                                      <input type="number" value={editAssMetaLigacoes} onChange={e => setEditAssMetaLigacoes(Number(e.target.value))} className="w-full p-1 text-center font-mono border text-xs" />
                                    </div>
                                    <div>
                                      <label className="block text-[8px] font-extrabold text-neutral-500 mb-0.5">📅 Agend. Real.</label>
                                      <input type="number" value={editAssRealizadoReunioesAgendadas} onChange={e => setEditAssRealizadoReunioesAgendadas(Number(e.target.value))} className="w-full p-1 text-center font-mono border text-xs" />
                                    </div>
                                    <div>
                                      <label className="block text-[8px] font-extrabold text-neutral-500 mb-0.5">📅 Agend. Meta</label>
                                      <input type="number" value={editAssMetaReunioesAgendadas} onChange={e => setEditAssMetaReunioesAgendadas(Number(e.target.value))} className="w-full p-1 text-center font-mono border text-xs" />
                                    </div>
                                    <div>
                                      <label className="block text-[8px] font-extrabold text-neutral-500 mb-0.5">🤝 Realiz. Real.</label>
                                      <input type="number" value={editAssRealizadoReunioesRealizadas} onChange={e => setEditAssRealizadoReunioesRealizadas(Number(e.target.value))} className="w-full p-1 text-center font-mono border text-xs" />
                                    </div>
                                    <div>
                                      <label className="block text-[8px] font-extrabold text-neutral-500 mb-0.5">🤝 Realiz. Meta</label>
                                      <input type="number" value={editAssMetaReunioesRealizadas} onChange={e => setEditAssMetaReunioesRealizadas(Number(e.target.value))} className="w-full p-1 text-center font-mono border text-xs" />
                                    </div>
                                    <div>
                                      <label className="block text-[8px] font-extrabold text-neutral-500 mb-0.5">✨ Contas Real.</label>
                                      <input type="number" value={editAssRealizadoContasAbertas} onChange={e => setEditAssRealizadoContasAbertas(Number(e.target.value))} className="w-full p-1 text-center font-mono border text-xs" />
                                    </div>
                                    <div>
                                      <label className="block text-[8px] font-extrabold text-neutral-500 mb-0.5">✨ Contas Meta</label>
                                      <input type="number" value={editAssMetaContasAbertas} onChange={e => setEditAssMetaContasAbertas(Number(e.target.value))} className="w-full p-1 text-center font-mono border text-xs" />
                                    </div>
                                    <div>
                                      <label className="block text-[8px] font-extrabold text-neutral-500 mb-0.5">💸 Captação Real.(R$)</label>
                                      <input type="number" value={editAssRealizadoNet} onChange={e => setEditAssRealizadoNet(Number(e.target.value))} className="w-full p-1 text-center font-mono border text-xs" />
                                    </div>
                                    <div>
                                      <label className="block text-[8px] font-extrabold text-neutral-500 mb-0.5">💸 Captação Meta(R$)</label>
                                      <input type="number" value={editAssMetaNet} onChange={e => setEditAssMetaNet(Number(e.target.value))} className="w-full p-1 text-center font-mono border text-xs" />
                                    </div>
                                    <div>
                                      <label className="block text-[8px] font-extrabold text-neutral-500 mb-0.5">🛡️ CS Qtd Real.</label>
                                      <input type="number" value={editAssRealizadoCrossSell} onChange={e => setEditAssRealizadoCrossSell(Number(e.target.value))} className="w-full p-1 text-center font-mono border text-xs" />
                                    </div>
                                    <div>
                                      <label className="block text-[8px] font-extrabold text-neutral-500 mb-0.5">🛡️ CS Qtd Meta</label>
                                      <input type="number" value={editAssMetaCrossSell} onChange={e => setEditAssMetaCrossSell(Number(e.target.value))} className="w-full p-1 text-center font-mono border text-xs" />
                                    </div>
                                  </div>

                                  {/* PRODUCT-LEVEL GOALS AND ACTUAL ACCOMPLISHMENTS SECTION */}
                                  <div className="bg-neutral-50 p-3 border border-neutral-200 rounded-lg space-y-2">
                                    <h5 className="text-[9px] font-black uppercase text-neutral-700 tracking-wider">📦 Detalhamento de Metas e Realizados Cross-Selling por Produto</h5>
                                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                                      <div className="bg-white p-2 border rounded-lg text-center font-mono">
                                        <span className="block text-[8px] text-neutral-450 uppercase mb-0.5">Shield Seguro (R./M.)</span>
                                        <div className="flex gap-1">
                                          <input type="number" value={editCSSeguroReal} onChange={e => setEditCSSeguroReal(Number(e.target.value))} className="w-1/2 p-0.5 text-center text-[10px] border" />
                                          <input type="number" value={editCSSeguroMeta} onChange={e => setEditCSSeguroMeta(Number(e.target.value))} className="w-1/2 p-0.5 text-center text-[10px] border" />
                                        </div>
                                      </div>
                                      <div className="bg-white p-2 border rounded-lg text-center font-mono">
                                        <span className="block text-[8px] text-neutral-450 uppercase mb-0.5">Consórcio (R./M.)</span>
                                        <div className="flex gap-1">
                                          <input type="number" value={editCSConsorcioReal} onChange={e => setEditCSConsorcioReal(Number(e.target.value))} className="w-1/2 p-0.5 text-center text-[10px] border" />
                                          <input type="number" value={editCSConsorcioMeta} onChange={e => setEditCSConsorcioMeta(Number(e.target.value))} className="w-1/2 p-0.5 text-center text-[10px] border" />
                                        </div>
                                      </div>
                                      <div className="bg-white p-2 border rounded-lg text-center font-mono">
                                        <span className="block text-[8px] text-neutral-450 uppercase mb-0.5">Manual Contab (R./M.)</span>
                                        <div className="flex gap-1">
                                          <input type="number" value={editCSContabilidadeReal} onChange={e => setEditCSContabilidadeReal(Number(e.target.value))} className="w-1/2 p-0.5 text-center text-[10px] border" />
                                          <input type="number" value={editCSContabilidadeMeta} onChange={e => setEditCSContabilidadeMeta(Number(e.target.value))} className="w-1/2 p-0.5 text-center text-[10px] border" />
                                        </div>
                                      </div>
                                      <div className="bg-white p-2 border rounded-lg text-center font-mono">
                                        <span className="block text-[8px] text-neutral-450 uppercase mb-0.5">Plano Saúde (R./M.)</span>
                                        <div className="flex gap-1">
                                          <input type="number" value={editCSSaudeReal} onChange={e => setEditCSSaudeReal(Number(e.target.value))} className="w-1/2 p-0.5 text-center text-[10px] border" />
                                          <input type="number" value={editCSSaudeMeta} onChange={e => setEditCSSaudeMeta(Number(e.target.value))} className="w-1/2 p-0.5 text-center text-[10px] border" />
                                        </div>
                                      </div>
                                      <div className="bg-white p-2 border rounded-lg text-center font-mono">
                                        <span className="block text-[8px] text-neutral-450 uppercase mb-0.5">FX Câmbio (R./M.)</span>
                                        <div className="flex gap-1">
                                          <input type="number" value={editCSCambioReal} onChange={e => setEditCSCambioReal(Number(e.target.value))} className="w-1/2 p-0.5 text-center text-[10px] border" />
                                          <input type="number" value={editCSCambioMeta} onChange={e => setEditCSCambioMeta(Number(e.target.value))} className="w-1/2 p-0.5 text-center text-[10px] border" />
                                        </div>
                                      </div>
                                      <div className="bg-white p-2 border rounded-lg text-center font-mono">
                                        <span className="block text-[8px] text-neutral-450 uppercase mb-0.5">Outros Hubs (R./M.)</span>
                                        <div className="flex gap-1">
                                          <input type="number" value={editCSOutrosReal} onChange={e => setEditCSOutrosReal(Number(e.target.value))} className="w-1/2 p-0.5 text-center text-[10px] border" />
                                          <input type="number" value={editCSOutrosMeta} onChange={e => setEditCSOutrosMeta(Number(e.target.value))} className="w-1/2 p-0.5 text-center text-[10px] border" />
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex justify-end gap-2 text-xs font-semibold">
                                    <button type="button" onClick={() => setEditingMemberId(null)} className="px-2 py-1 border rounded bg-white hover:bg-neutral-100 uppercase">Cancelar</button>
                                    <button type="submit" className="px-3 py-1 bg-black hover:bg-neutral-900 text-white rounded uppercase text-[10px] font-black">Salvar Metas</button>
                                  </div>
                                </form>
                              </td>
                            </tr>
                          );
                        }

                        return (
                          <tr key={a.id} className="hover:bg-neutral-50/50 transition-all">
                            <td className="p-3 pl-4 font-bold text-neutral-950">
                              {a.name}
                              {a.agendaLink && (
                                <a href={a.agendaLink} target="_blank" rel="noopener noreferrer" className="block text-[9px] text-emerald-800 font-mono underline hover:text-emerald-950 mt-0.5">
                                  🔗 link-agenda
                                </a>
                              )}
                            </td>
                            <td className="p-3 text-neutral-500 font-mono">
                              {a.admissionDate ? a.admissionDate.split('-').reverse().join('/') : '—'}
                            </td>
                            <td className="p-3">
                              <span className="text-[10px] bg-neutral-100 border text-neutral-600 px-2 py-0.5 rounded font-black uppercase">
                                {a.professionalProfile || 'Closer'}
                              </span>
                            </td>
                            <td className="p-3 text-center font-mono">
                              <span className="font-bold text-neutral-900">{a.realizadoLigacoes ?? 0}</span>
                              <span className="text-neutral-400"> / </span>
                              {isBulkGoalEditing ? (
                                <input
                                  type="number"
                                  min="0"
                                  value={bulkGoalsState[a.id]?.metaLigacoes ?? a.metaLigacoes ?? 100}
                                  onChange={e => handleBulkAdvisorGoalChange(a.id, 'metaLigacoes', Number(e.target.value))}
                                  className="w-14 px-1 py-1 text-center font-mono font-black border-2 border-neutral-900 bg-amber-50 text-neutral-900 text-[10.5px] rounded outline-none focus:ring-1 focus:ring-amber-500"
                                />
                              ) : (
                                <span className="text-neutral-605 font-bold">{a.metaLigacoes || 100}</span>
                              )}
                              {!isBulkGoalEditing && (
                                <span className={`block text-[8px] ${getPercentClass(a.realizadoLigacoes ?? 0, a.metaLigacoes || 100)}`}>
                                  {getPercentString(a.realizadoLigacoes ?? 0, a.metaLigacoes || 100)}
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center font-mono">
                              <span className="font-bold text-neutral-900">{a.realizadoReunioesAgendadas ?? 0}</span>
                              <span className="text-neutral-400"> / </span>
                              {isBulkGoalEditing ? (
                                <input
                                  type="number"
                                  min="0"
                                  value={bulkGoalsState[a.id]?.metaReunioesAgendadas ?? a.metaReunioesAgendadas ?? 15}
                                  onChange={e => handleBulkAdvisorGoalChange(a.id, 'metaReunioesAgendadas', Number(e.target.value))}
                                  className="w-14 px-1 py-1 text-center font-mono font-black border-2 border-neutral-900 bg-amber-50 text-neutral-900 text-[10.5px] rounded outline-none focus:ring-1 focus:ring-amber-500"
                                />
                              ) : (
                                <span className="text-neutral-605 font-bold">{a.metaReunioesAgendadas || 15}</span>
                              )}
                              {!isBulkGoalEditing && (
                                <span className={`block text-[8px] ${getPercentClass(a.realizadoReunioesAgendadas ?? 0, a.metaReunioesAgendadas || 15)}`}>
                                  {getPercentString(a.realizadoReunioesAgendadas ?? 0, a.metaReunioesAgendadas || 15)}
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center font-mono">
                              <span className="font-bold text-neutral-900">{a.realizadoReunioesRealizadas ?? 0}</span>
                              <span className="text-neutral-400"> / </span>
                              {isBulkGoalEditing ? (
                                <input
                                  type="number"
                                  min="0"
                                  value={bulkGoalsState[a.id]?.metaReunioesRealizadas ?? a.metaReunioesRealizadas ?? 10}
                                  onChange={e => handleBulkAdvisorGoalChange(a.id, 'metaReunioesRealizadas', Number(e.target.value))}
                                  className="w-14 px-1 py-1 text-center font-mono font-black border-2 border-neutral-900 bg-amber-50 text-neutral-900 text-[10.5px] rounded outline-none focus:ring-1 focus:ring-amber-500"
                                />
                              ) : (
                                <span className="text-neutral-605 font-bold">{a.metaReunioesRealizadas || 10}</span>
                              )}
                              {!isBulkGoalEditing && (
                                <span className={`block text-[8px] ${getPercentClass(a.realizadoReunioesRealizadas ?? 0, a.metaReunioesRealizadas || 10)}`}>
                                  {getPercentString(a.realizadoReunioesRealizadas ?? 0, a.metaReunioesRealizadas || 10)}
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center font-mono">
                              <span className="font-bold text-neutral-900">{a.realizadoContasAbertas ?? 0}</span>
                              <span className="text-neutral-400"> / </span>
                              {isBulkGoalEditing ? (
                                <input
                                  type="number"
                                  min="0"
                                  value={bulkGoalsState[a.id]?.metaContasAbertas ?? a.metaContasAbertas ?? 5}
                                  onChange={e => handleBulkAdvisorGoalChange(a.id, 'metaContasAbertas', Number(e.target.value))}
                                  className="w-14 px-1 py-1 text-center font-mono font-black border-2 border-neutral-900 bg-amber-50 text-neutral-900 text-[10.5px] rounded outline-none focus:ring-1 focus:ring-amber-500"
                                />
                              ) : (
                                <span className="text-neutral-605 font-bold">{a.metaContasAbertas || 5}</span>
                              )}
                              {!isBulkGoalEditing && (
                                <span className={`block text-[8px] ${getPercentClass(a.realizadoContasAbertas ?? 0, a.metaContasAbertas || 5)}`}>
                                  {getPercentString(a.realizadoContasAbertas ?? 0, a.metaContasAbertas || 5)}
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-right font-mono">
                              <span className="font-extrabold text-neutral-900">R$ {netRealVal.toLocaleString('pt-BR')}</span>
                              {isBulkGoalEditing ? (
                                <div className="flex items-center gap-1 mt-1 justify-end">
                                  <span className="text-[10px] text-neutral-500 font-bold">Meta R$</span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={bulkGoalsState[a.id]?.metaNet ?? a.metaNet ?? 1000000}
                                    onChange={e => handleBulkAdvisorGoalChange(a.id, 'metaNet', Number(e.target.value))}
                                    className="w-24 px-1 py-1 font-mono font-black border-2 border-neutral-900 bg-amber-50 text-neutral-900 text-[10.5px] rounded outline-none focus:ring-1 focus:ring-amber-500 text-right"
                                  />
                                </div>
                              ) : (
                                <>
                                  <span className="text-neutral-450 block text-[10px]">Meta: R$ {(a.metaNet ?? 1000000).toLocaleString('pt-BR')}</span>
                                  <span className={`inline-block text-[8.5px] mt-0.5 ${getPercentClass(netRealVal, a.metaNet || 1000000)}`}>
                                    {getPercentString(netRealVal, a.metaNet || 1000000)}
                                  </span>
                                </>
                              )}
                            </td>
                            <td className="p-3 text-center font-mono">
                              <span className="font-extrabold text-neutral-900">{csRealVal}</span>
                              <span className="text-neutral-400"> / </span>
                              {isBulkGoalEditing ? (
                                <input
                                  type="number"
                                  min="0"
                                  value={bulkGoalsState[a.id]?.metaCrossSell ?? a.metaCrossSell ?? 4}
                                  onChange={e => handleBulkAdvisorGoalChange(a.id, 'metaCrossSell', Number(e.target.value))}
                                  className="w-12 px-1 py-1 text-center font-mono font-black border-2 border-neutral-900 bg-amber-50 text-neutral-900 text-[10.5px] rounded outline-none focus:ring-1 focus:ring-amber-500"
                                />
                              ) : (
                                <span className="text-neutral-605 font-bold">{a.metaCrossSell || 4}</span>
                              )}
                              {!isBulkGoalEditing && (
                                <span className={`block text-[8px] ${getPercentClass(csRealVal, a.metaCrossSell || 4)}`}>
                                  {getPercentString(csRealVal, a.metaCrossSell || 4)}
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              {a.active !== false ? (
                                <span className="inline-block px-1.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-150 font-black uppercase text-[8px] leading-none shrink-0 rounded">Ativo</span>
                              ) : (
                                <span className="inline-block px-1.5 py-0.5 bg-neutral-100 text-neutral-450 border border-neutral-250 font-black uppercase text-[8px] leading-none shrink-0 rounded">Inativo</span>
                              )}
                            </td>
                            <td className="p-3 text-right pr-4 shrink-0">
                              <div className="flex items-center justify-end gap-1.5">
                                <button type="button" onClick={() => handleStartEditMember(a, 'assessor')} className="p-1 px-2 border rounded hover:bg-neutral-100 text-neutral-600 cursor-pointer text-[10px] font-black uppercase">
                                  Editar
                                </button>
                                <button type="button" onClick={() => handleDeleteMember(a.id, 'advisor')} className="p-1 text-red-650 hover:bg-red-50 rounded cursor-pointer" title="Remover Assessor">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. CONSULTORES DE INVESTIMENTO SECTOR */}
            {teamConsultores.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-700" />
                  <h3 className="text-xs font-black text-emerald-900 uppercase tracking-widest">
                    Consultores de Negócios ({teamConsultores.length})
                  </h3>
                </div>

                <div className="overflow-x-auto border border-neutral-200 rounded-xl bg-white shadow-3xs">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-neutral-50 border-b text-[9px] font-mono font-black text-neutral-400 uppercase tracking-wider">
                      <tr>
                        <th className="p-3 pl-4">Colaborador</th>
                        <th className="p-3">Admissão</th>
                        <th className="p-3">Perfil</th>
                        <th className="p-3 text-center">Ligações (R./M.)</th>
                        <th className="p-3 text-center">Agendadas (R./M.)</th>
                        <th className="p-3 text-center">Realizadas (R./M.)</th>
                        <th className="p-3 text-center">Contas (R./M.)</th>
                        <th className="p-3 text-right">NET Captação (Realizado/Meta)</th>
                        <th className="p-3 text-center">Cross-Sell</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-right pr-4">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-[11px]">
                      {teamConsultores.map(c => {
                        const isEditing = editingMemberId === c.id;
                        const netRealVal = c.realizadoNet ?? c.captacaoMes ?? 0;
                        const csRealVal = c.realizadoCrossSell ?? c.crossSellCount ?? 0;

                        if (isEditing) {
                          return (
                            <tr key={c.id} className="bg-neutral-50/70">
                              <td colSpan={11} className="p-4">
                                <form onSubmit={handleSaveEditMemberSubmit} className="space-y-4">
                                  <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
                                    <div>
                                      <label className="block text-[8px] font-black uppercase text-neutral-500 mb-1">Nome</label>
                                      <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full p-1.5 text-xs bg-white border border-neutral-300 rounded font-bold" />
                                    </div>
                                    <div>
                                      <label className="block text-[8px] font-black uppercase text-neutral-500 mb-1">Calendly Agenda URL</label>
                                      <input type="url" value={editAgendaLink} onChange={e => setEditAgendaLink(e.target.value)} className="w-full p-1.5 text-xs bg-white border border-neutral-300 rounded font-mono" />
                                    </div>
                                    <div>
                                      <label className="block text-[8px] font-black uppercase text-neutral-500 mb-1">Admissão</label>
                                      <input type="date" value={editAdmissionDate} onChange={e => setEditAdmissionDate(e.target.value)} className="w-full p-1.5 text-xs bg-white border border-neutral-300 rounded" />
                                    </div>
                                    <div>
                                      <label className="block text-[8px] font-black uppercase text-neutral-500 mb-1">Status Ativo</label>
                                      <select value={editActive ? "true" : "false"} onChange={e => setEditActive(e.target.value === "true")} className="w-full p-1.5 text-xs bg-white border border-neutral-300 rounded font-bold">
                                        <option value="true">Ativo (Em Rodízio)</option>
                                        <option value="false">Bloqueado (Inativo)</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-[8px] font-black uppercase text-neutral-500 mb-1">Equipe liderada por</label>
                                      <select 
                                        value={editTeamState} 
                                        onChange={e => setEditTeamState(e.target.value)} 
                                        disabled={currentUser?.role === 'leader'}
                                        className="w-full p-1.5 text-xs bg-white disabled:bg-neutral-100 disabled:text-neutral-500 border border-neutral-350 rounded font-bold"
                                      >
                                        {teams.map(t => (
                                          <option key={t} value={t}>{t}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-[8px] font-black uppercase text-neutral-500 mb-1">Função / Cargo</label>
                                      <select value={editRoleState} onChange={e => setEditRoleState(e.target.value as any)} className="w-full p-1.5 text-xs bg-white border border-neutral-350 rounded font-bold uppercase text-[10px]">
                                        <option value="sdr">SDR (Prospector)</option>
                                        <option value="assessor">Assessor de Investimentos</option>
                                        <option value="consultor">Consultor Comercial</option>
                                      </select>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 bg-white p-3 border border-neutral-250 rounded-lg">
                                    <div>
                                      <label className="block text-[8px] font-extrabold text-neutral-500 mb-0.5">📞 Lig. Real.</label>
                                      <input type="number" value={editAssRealizadoLigacoes} onChange={e => setEditAssRealizadoLigacoes(Number(e.target.value))} className="w-full p-1 text-center font-mono border text-xs" />
                                    </div>
                                    <div>
                                      <label className="block text-[8px] font-extrabold text-neutral-500 mb-0.5">📞 Lig. Meta</label>
                                      <input type="number" value={editAssMetaLigacoes} onChange={e => setEditAssMetaLigacoes(Number(e.target.value))} className="w-full p-1 text-center font-mono border text-xs" />
                                    </div>
                                    <div>
                                      <label className="block text-[8px] font-extrabold text-neutral-500 mb-0.5">📅 Agend. Real.</label>
                                      <input type="number" value={editAssRealizadoReunioesAgendadas} onChange={e => setEditAssRealizadoReunioesAgendadas(Number(e.target.value))} className="w-full p-1 text-center font-mono border text-xs" />
                                    </div>
                                    <div>
                                      <label className="block text-[8px] font-extrabold text-neutral-500 mb-0.5">📅 Agend. Meta</label>
                                      <input type="number" value={editAssMetaReunioesAgendadas} onChange={e => setEditAssMetaReunioesAgendadas(Number(e.target.value))} className="w-full p-1 text-center font-mono border text-xs" />
                                    </div>
                                    <div>
                                      <label className="block text-[8px] font-extrabold text-neutral-500 mb-0.5">🤝 Realiz. Real.</label>
                                      <input type="number" value={editAssRealizadoReunioesRealizadas} onChange={e => setEditAssRealizadoReunioesRealizadas(Number(e.target.value))} className="w-full p-1 text-center font-mono border text-xs" />
                                    </div>
                                    <div>
                                      <label className="block text-[8px] font-extrabold text-neutral-500 mb-0.5">🤝 Realiz. Meta</label>
                                      <input type="number" value={editAssMetaReunioesRealizadas} onChange={e => setEditAssMetaReunioesRealizadas(Number(e.target.value))} className="w-full p-1 text-center font-mono border text-xs" />
                                    </div>
                                    <div>
                                      <label className="block text-[8px] font-extrabold text-neutral-500 mb-0.5">✨ Contas Real.</label>
                                      <input type="number" value={editAssRealizadoContasAbertas} onChange={e => setEditAssRealizadoContasAbertas(Number(e.target.value))} className="w-full p-1 text-center font-mono border text-xs" />
                                    </div>
                                    <div>
                                      <label className="block text-[8px] font-extrabold text-neutral-500 mb-0.5">✨ Contas Meta</label>
                                      <input type="number" value={editAssMetaContasAbertas} onChange={e => setEditAssMetaContasAbertas(Number(e.target.value))} className="w-full p-1 text-center font-mono border text-xs" />
                                    </div>
                                    <div>
                                      <label className="block text-[8px] font-extrabold text-neutral-500 mb-0.5">💸 Captação Real.(R$)</label>
                                      <input type="number" value={editAssRealizadoNet} onChange={e => setEditAssRealizadoNet(Number(e.target.value))} className="w-full p-1 text-center font-mono border text-xs" />
                                    </div>
                                    <div>
                                      <label className="block text-[8px] font-extrabold text-neutral-500 mb-0.5">💸 Captação Meta(R$)</label>
                                      <input type="number" value={editAssMetaNet} onChange={e => setEditAssMetaNet(Number(e.target.value))} className="w-full p-1 text-center font-mono border text-xs" />
                                    </div>
                                    <div>
                                      <label className="block text-[8px] font-extrabold text-neutral-500 mb-0.5">🛡️ CS Qtd Real.</label>
                                      <input type="number" value={editAssRealizadoCrossSell} onChange={e => setEditAssRealizadoCrossSell(Number(e.target.value))} className="w-full p-1 text-center font-mono border text-xs" />
                                    </div>
                                    <div>
                                      <label className="block text-[8px] font-extrabold text-neutral-500 mb-0.5">🛡️ CS Qtd Meta</label>
                                      <input type="number" value={editAssMetaCrossSell} onChange={e => setEditAssMetaCrossSell(Number(e.target.value))} className="w-full p-1 text-center font-mono border text-xs" />
                                    </div>
                                  </div>

                                  {/* PRODUCT-LEVEL GOALS AND ACTUAL ACCOMPLISHMENTS SECTION */}
                                  <div className="bg-neutral-50 p-3 border border-neutral-200 rounded-lg space-y-2">
                                    <h5 className="text-[9px] font-black uppercase text-neutral-700 tracking-wider">📦 Detalhamento de Metas e Realizados Cross-Selling por Produto</h5>
                                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                                      <div className="bg-white p-2 border rounded-lg text-center font-mono">
                                        <span className="block text-[8px] text-neutral-450 uppercase mb-0.5">Shield Seguro (R./M.)</span>
                                        <div className="flex gap-1">
                                          <input type="number" value={editCSSeguroReal} onChange={e => setEditCSSeguroReal(Number(e.target.value))} className="w-1/2 p-0.5 text-center text-[10px] border" />
                                          <input type="number" value={editCSSeguroMeta} onChange={e => setEditCSSeguroMeta(Number(e.target.value))} className="w-1/2 p-0.5 text-center text-[10px] border" />
                                        </div>
                                      </div>
                                      <div className="bg-white p-2 border rounded-lg text-center font-mono">
                                        <span className="block text-[8px] text-neutral-450 uppercase mb-0.5">Consórcio (R./M.)</span>
                                        <div className="flex gap-1">
                                          <input type="number" value={editCSConsorcioReal} onChange={e => setEditCSConsorcioReal(Number(e.target.value))} className="w-1/2 p-0.5 text-center text-[10px] border" />
                                          <input type="number" value={editCSConsorcioMeta} onChange={e => setEditCSConsorcioMeta(Number(e.target.value))} className="w-1/2 p-0.5 text-center text-[10px] border" />
                                        </div>
                                      </div>
                                      <div className="bg-white p-2 border rounded-lg text-center font-mono">
                                        <span className="block text-[8px] text-neutral-450 uppercase mb-0.5">Manual Contab (R./M.)</span>
                                        <div className="flex gap-1">
                                          <input type="number" value={editCSContabilidadeReal} onChange={e => setEditCSContabilidadeReal(Number(e.target.value))} className="w-1/2 p-0.5 text-center text-[10px] border" />
                                          <input type="number" value={editCSContabilidadeMeta} onChange={e => setEditCSContabilidadeMeta(Number(e.target.value))} className="w-1/2 p-0.5 text-center text-[10px] border" />
                                        </div>
                                      </div>
                                      <div className="bg-white p-2 border rounded-lg text-center font-mono">
                                        <span className="block text-[8px] text-neutral-450 uppercase mb-0.5">Plano Saúde (R./M.)</span>
                                        <div className="flex gap-1">
                                          <input type="number" value={editCSSaudeReal} onChange={e => setEditCSSaudeReal(Number(e.target.value))} className="w-1/2 p-0.5 text-center text-[10px] border" />
                                          <input type="number" value={editCSSaudeMeta} onChange={e => setEditCSSaudeMeta(Number(e.target.value))} className="w-1/2 p-0.5 text-center text-[10px] border" />
                                        </div>
                                      </div>
                                      <div className="bg-white p-2 border rounded-lg text-center font-mono">
                                        <span className="block text-[8px] text-neutral-450 uppercase mb-0.5">FX Câmbio (R./M.)</span>
                                        <div className="flex gap-1">
                                          <input type="number" value={editCSCambioReal} onChange={e => setEditCSCambioReal(Number(e.target.value))} className="w-1/2 p-0.5 text-center text-[10px] border" />
                                          <input type="number" value={editCSCambioMeta} onChange={e => setEditCSCambioMeta(Number(e.target.value))} className="w-1/2 p-0.5 text-center text-[10px] border" />
                                        </div>
                                      </div>
                                      <div className="bg-white p-2 border rounded-lg text-center font-mono">
                                        <span className="block text-[8px] text-neutral-450 uppercase mb-0.5">Outros Hubs (R./M.)</span>
                                        <div className="flex gap-1">
                                          <input type="number" value={editCSOutrosReal} onChange={e => setEditCSOutrosReal(Number(e.target.value))} className="w-1/2 p-0.5 text-center text-[10px] border" />
                                          <input type="number" value={editCSOutrosMeta} onChange={e => setEditCSOutrosMeta(Number(e.target.value))} className="w-1/2 p-0.5 text-center text-[10px] border" />
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex justify-end gap-2 text-xs font-semibold">
                                    <button type="button" onClick={() => setEditingMemberId(null)} className="px-2 py-1 border rounded bg-white hover:bg-neutral-100 uppercase">Cancelar</button>
                                    <button type="submit" className="px-3 py-1 bg-black hover:bg-neutral-900 text-white rounded uppercase text-[10px] font-black">Salvar Metas</button>
                                  </div>
                                </form>
                              </td>
                            </tr>
                          );
                        }

                        return (
                          <tr key={c.id} className="hover:bg-neutral-50/50 transition-all">
                            <td className="p-3 pl-4 font-bold text-neutral-950">
                              {c.name}
                              {c.agendaLink && (
                                <a href={c.agendaLink} target="_blank" rel="noopener noreferrer" className="block text-[9px] text-emerald-800 font-mono underline hover:text-emerald-950 mt-0.5">
                                  🔗 link-agenda
                                </a>
                              )}
                            </td>
                            <td className="p-3 text-neutral-500 font-mono">
                              {c.admissionDate ? c.admissionDate.split('-').reverse().join('/') : '—'}
                            </td>
                            <td className="p-3">
                              <span className="text-[10px] bg-neutral-200 border text-neutral-700 px-2 py-0.5 rounded font-black uppercase">
                                {c.professionalProfile || 'Partner'}
                              </span>
                            </td>
                            <td className="p-3 text-center font-mono">
                              <span className="font-bold text-neutral-900">{c.realizadoLigacoes ?? 0}</span>
                              <span className="text-neutral-400"> / </span>
                              {isBulkGoalEditing ? (
                                <input
                                  type="number"
                                  min="0"
                                  value={bulkGoalsState[c.id]?.metaLigacoes ?? c.metaLigacoes ?? 100}
                                  onChange={e => handleBulkAdvisorGoalChange(c.id, 'metaLigacoes', Number(e.target.value))}
                                  className="w-14 px-1 py-1 text-center font-mono font-black border-2 border-neutral-900 bg-amber-50 text-neutral-900 text-[10.5px] rounded outline-none focus:ring-1 focus:ring-amber-500"
                                />
                              ) : (
                                <span className="text-neutral-605 font-bold">{c.metaLigacoes || 100}</span>
                              )}
                              {!isBulkGoalEditing && (
                                <span className={`block text-[8px] ${getPercentClass(c.realizadoLigacoes ?? 0, c.metaLigacoes || 100)}`}>
                                  {getPercentString(c.realizadoLigacoes ?? 0, c.metaLigacoes || 100)}
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center font-mono">
                              <span className="font-bold text-neutral-900">{c.realizadoReunioesAgendadas ?? 0}</span>
                              <span className="text-neutral-400"> / </span>
                              {isBulkGoalEditing ? (
                                <input
                                  type="number"
                                  min="0"
                                  value={bulkGoalsState[c.id]?.metaReunioesAgendadas ?? c.metaReunioesAgendadas ?? 15}
                                  onChange={e => handleBulkAdvisorGoalChange(c.id, 'metaReunioesAgendadas', Number(e.target.value))}
                                  className="w-14 px-1 py-1 text-center font-mono font-black border-2 border-neutral-900 bg-amber-50 text-neutral-900 text-[10.5px] rounded outline-none focus:ring-1 focus:ring-amber-500"
                                />
                              ) : (
                                <span className="text-neutral-605 font-bold">{c.metaReunioesAgendadas || 15}</span>
                              )}
                              {!isBulkGoalEditing && (
                                <span className={`block text-[8px] ${getPercentClass(c.realizadoReunioesAgendadas ?? 0, c.metaReunioesAgendadas || 15)}`}>
                                  {getPercentString(c.realizadoReunioesAgendadas ?? 0, c.metaReunioesAgendadas || 15)}
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center font-mono">
                              <span className="font-bold text-neutral-900">{c.realizadoReunioesRealizadas ?? 0}</span>
                              <span className="text-neutral-400"> / </span>
                              {isBulkGoalEditing ? (
                                <input
                                  type="number"
                                  min="0"
                                  value={bulkGoalsState[c.id]?.metaReunioesRealizadas ?? c.metaReunioesRealizadas ?? 10}
                                  onChange={e => handleBulkAdvisorGoalChange(c.id, 'metaReunioesRealizadas', Number(e.target.value))}
                                  className="w-14 px-1 py-1 text-center font-mono font-black border-2 border-neutral-900 bg-amber-50 text-neutral-900 text-[10.5px] rounded outline-none focus:ring-1 focus:ring-amber-500"
                                />
                              ) : (
                                <span className="text-neutral-605 font-bold">{c.metaReunioesRealizadas || 10}</span>
                              )}
                              {!isBulkGoalEditing && (
                                <span className={`block text-[8px] ${getPercentClass(c.realizadoReunioesRealizadas ?? 0, c.metaReunioesRealizadas || 10)}`}>
                                  {getPercentString(c.realizadoReunioesRealizadas ?? 0, c.metaReunioesRealizadas || 10)}
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center font-mono">
                              <span className="font-bold text-neutral-900">{c.realizadoContasAbertas ?? 0}</span>
                              <span className="text-neutral-400"> / </span>
                              {isBulkGoalEditing ? (
                                <input
                                  type="number"
                                  min="0"
                                  value={bulkGoalsState[c.id]?.metaContasAbertas ?? c.metaContasAbertas ?? 5}
                                  onChange={e => handleBulkAdvisorGoalChange(c.id, 'metaContasAbertas', Number(e.target.value))}
                                  className="w-14 px-1 py-1 text-center font-mono font-black border-2 border-neutral-900 bg-amber-50 text-neutral-900 text-[10.5px] rounded outline-none focus:ring-1 focus:ring-amber-500"
                                />
                              ) : (
                                <span className="text-neutral-605 font-bold">{c.metaContasAbertas || 5}</span>
                              )}
                              {!isBulkGoalEditing && (
                                <span className={`block text-[8px] ${getPercentClass(c.realizadoContasAbertas ?? 0, c.metaContasAbertas || 5)}`}>
                                  {getPercentString(c.realizadoContasAbertas ?? 0, c.metaContasAbertas || 5)}
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-right font-mono">
                              <span className="font-extrabold text-neutral-950">R$ {netRealVal.toLocaleString('pt-BR')}</span>
                              {isBulkGoalEditing ? (
                                <div className="flex items-center gap-1 mt-1 justify-end">
                                  <span className="text-[10px] text-neutral-500 font-bold">Meta R$</span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={bulkGoalsState[c.id]?.metaNet ?? c.metaNet ?? 1000000}
                                    onChange={e => handleBulkAdvisorGoalChange(c.id, 'metaNet', Number(e.target.value))}
                                    className="w-24 px-1 py-1 font-mono font-black border-2 border-neutral-900 bg-amber-50 text-neutral-900 text-[10.5px] rounded outline-none focus:ring-1 focus:ring-amber-500 text-right"
                                  />
                                </div>
                              ) : (
                                <>
                                  <span className="text-neutral-400 block text-[10px]">Meta: R$ {(c.metaNet ?? 1000000).toLocaleString('pt-BR')}</span>
                                  <span className={`inline-block text-[8.5px] mt-0.5 ${getPercentClass(netRealVal, c.metaNet || 1000000)}`}>
                                    {getPercentString(netRealVal, c.metaNet || 1000000)}
                                  </span>
                                </>
                              )}
                            </td>
                            <td className="p-3 text-center font-mono">
                              <span className="font-extrabold text-neutral-950">{csRealVal}</span>
                              <span className="text-neutral-400"> / </span>
                              {isBulkGoalEditing ? (
                                <input
                                  type="number"
                                  min="0"
                                  value={bulkGoalsState[c.id]?.metaCrossSell ?? c.metaCrossSell ?? 4}
                                  onChange={e => handleBulkAdvisorGoalChange(c.id, 'metaCrossSell', Number(e.target.value))}
                                  className="w-12 px-1 py-1 text-center font-mono font-black border-2 border-neutral-900 bg-amber-50 text-neutral-900 text-[10.5px] rounded outline-none focus:ring-1 focus:ring-amber-500"
                                />
                              ) : (
                                <span className="text-neutral-605 font-bold">{c.metaCrossSell || 4}</span>
                              )}
                              {!isBulkGoalEditing && (
                                <span className={`block text-[8px] ${getPercentClass(csRealVal, c.metaCrossSell || 4)}`}>
                                  {getPercentString(csRealVal, c.metaCrossSell || 4)}
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              {c.active !== false ? (
                                <span className="inline-block px-1.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-150 font-black uppercase text-[8px] leading-none shrink-0 rounded">Ativo</span>
                              ) : (
                                <span className="inline-block px-1.5 py-0.5 bg-neutral-100 text-neutral-450 border border-neutral-250 font-black uppercase text-[8px] leading-none shrink-0 rounded">Inativo</span>
                              )}
                            </td>
                            <td className="p-3 text-right pr-4 shrink-0">
                              <div className="flex items-center justify-end gap-1.5">
                                <button type="button" onClick={() => handleStartEditMember(c, 'consultor')} className="p-1 px-2 border rounded hover:bg-neutral-100 text-neutral-600 cursor-pointer text-[10px] font-black uppercase">
                                  Editar
                                </button>
                                <button type="button" onClick={() => handleDeleteMember(c.id, 'advisor')} className="p-1 text-red-650 hover:bg-red-50 rounded cursor-pointer" title="Remover Consultor">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
