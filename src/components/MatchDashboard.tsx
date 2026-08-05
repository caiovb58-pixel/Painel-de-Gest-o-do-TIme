import React, { useState, useMemo } from 'react';
import { SDR, Assessor, MatchResult } from '../types';
import { 
  Sparkles, Shield, Calendar, ArrowUpRight, Trash2, Plus, Link, Download, 
  Users, UserCheck, Search, ArrowUp, ArrowDown, CheckCircle2, XCircle, 
  Settings, Activity, FileText, SlidersHorizontal, Sliders, Play, 
  AlertCircle, Eye, RefreshCw, CheckSquare, ListOrdered, Check
} from 'lucide-react';
import useAppStore from '../store/useAppStore';

interface MatchDashboardProps {
  sdrs: SDR[];
  assessores: Assessor[];
  matches: MatchResult[];
  onGenerateMatches: (shuffle?: boolean) => void;
  startDate: string;
  endDate: string;
  onUpdateStartDate: (date: string) => void;
  onUpdateEndDate: (date: string) => void;
  onAddManualMatch?: (match: MatchResult) => void;
  onDeleteMatch?: (sdrId: string, assessorId: string) => void;
  onViewProfile?: (type: 'sdr' | 'assessor' | 'consultor', id: string) => void;
}

export default function MatchDashboard({
  sdrs: initialSdrs,
  assessores: initialAssessores,
  matches: initialMatches,
  startDate,
  endDate,
  onUpdateStartDate,
  onUpdateEndDate,
  onViewProfile,
}: MatchDashboardProps) {
  
  // Access global store state and functions directly to update and save rotation details cleanly
  const store = useAppStore();
  const { currentUser } = store;
  
  const isLeader = currentUser?.role === 'leader';
  const isAdmin = currentUser?.role === 'admin' || currentUser?.name?.toLowerCase() === 'caio';
  const loggedLeaderTeam = currentUser?.teamName || currentUser?.equipe || '';

  // Filter bar states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState(isLeader ? loggedLeaderTeam : 'TODAS');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('TODOS');
  const [selectedAvailabilityFilter, setSelectedAvailabilityFilter] = useState('TODAS');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('TODOS');

  // Distribution form states (inline per SDR card)
  const [distributingSdrId, setDistributingSdrId] = useState<string | null>(null);
  const [leadName, setLeadName] = useState('');
  const [manualAssessorId, setManualAssessorId] = useState('');
  const [distributionSuccessMessage, setDistributionSuccessMessage] = useState<string | null>(null);
  
  // Link configuration modal/edit panel states (to adjust limits)
  const [editingLimitMatchId, setEditingLimitMatchId] = useState<{ sdrId: string; assessorId: string } | null>(null);
  const [limitMaxDia, setLimitMaxDia] = useState<number>(0);
  const [limitMaxSemana, setLimitMaxSemana] = useState<number>(0);
  const [limitMaxSimultaneos, setLimitMaxSimultaneos] = useState<number>(0);

  // Tab views for logs at the bottom
  const [historyTab, setHistoryTab] = useState<'distributions' | 'auditing' | 'rotation-actions'>('rotation-actions');
  const [historySearch, setHistorySearch] = useState('');

  // Main view tab state
  const [mainTab, setMainTab] = useState<'sdrs' | 'participants' | 'history'>('sdrs');

  // States for Link Addition flow
  const [addingLinkSdrId, setAddingLinkSdrId] = useState<string | null>(null);
  const [linkFlowMode, setLinkFlowMode] = useState<'select' | 'create'>('select');
  const [manualPartName, setManualPartName] = useState('');
  const [manualPartCargo, setManualPartCargo] = useState<'Assessor' | 'Consultor'>('Assessor');
  const [manualPartEquipe, setManualPartEquipe] = useState('');
  const [manualPartStatus, setManualPartStatus] = useState<'Ativo' | 'Inativo' | 'Arquivado'>('Ativo');
  const [manualPartObservacoes, setManualPartObservacoes] = useState('');

  // States for Participant Management
  const [editingParticipantId, setEditingParticipantId] = useState<string | null>(null);
  const [associatingParticipantId, setAssociatingParticipantId] = useState<string | null>(null);
  const [pSearchQuery, setPSearchQuery] = useState('');
  const [pRoleFilter, setPRoleFilter] = useState('TODOS');
  const [pStatusFilter, setPStatusFilter] = useState('TODOS');
  const [pOriginFilter, setPOriginFilter] = useState('TODOS');
  const [pTeamFilter, setPTeamFilter] = useState(isLeader ? loggedLeaderTeam : 'TODAS');
  const [isCreatingParticipant, setIsCreatingParticipant] = useState(false);

  // Get active teams list from store
  const availableTeams = useMemo(() => {
    const teamsSet = new Set<string>();
    store.sdrs.forEach(s => {
      const t = s.team || s.equipe;
      if (t) teamsSet.add(t);
    });
    store.assessores.forEach(a => {
      const t = a.team || a.equipe;
      if (t) teamsSet.add(t);
    });
    return Array.from(teamsSet).filter(Boolean);
  }, [store.sdrs, store.assessores]);

  // Unified helper to check if a member matches team filter
  const belongsToFilteredTeam = (memberTeamRaw: string) => {
    if (selectedTeamFilter === 'TODAS') return true;
    if (!memberTeamRaw) return false;
    
    const lt = selectedTeamFilter.toUpperCase().trim();
    const mt = memberTeamRaw.toUpperCase().trim();
    
    // Unified PF matching
    const isLtPF = lt.includes('PF') || lt.includes('CAIO') || lt.includes('BICALHO');
    const isMtPF = mt.includes('PF') || mt.includes('CAIO') || mt.includes('BICALHO');
    if (isLtPF && isMtPF) return true;
    
    if (lt === mt) return true;
    
    if (lt.includes(mt) || mt.includes(lt)) return true;
    return false;
  };

  // Filtered SDR pool based on search and selected filters
  const filteredSdrPool = useMemo(() => {
    let result = store.sdrs.filter(s => !s.promotedToAssessor);
    
    // 1. Team/Equipe restriction (mandatory rule for Leader)
    if (isLeader) {
      result = result.filter(s => belongsToFilteredTeam(s.team || s.equipe || ''));
    } else if (selectedTeamFilter !== 'TODAS') {
      result = result.filter(s => belongsToFilteredTeam(s.team || s.equipe || ''));
    }

    // 2. Name search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => {
        const sdrMatches = s.name.toLowerCase().includes(q);
        // Also check if any linked assessor name matches
        const linkedMatches = store.matches
          .filter(m => m.sdrId === s.id)
          .some(m => m.assessorName.toLowerCase().includes(q));
        return sdrMatches || linkedMatches;
      });
    }

    return result;
  }, [store.sdrs, store.matches, searchQuery, selectedTeamFilter, isLeader]);

  // Filtered list of all assessores available for linking
  const filteredAssessoresPoolForLink = useMemo(() => {
    let pool = store.rotationParticipants.filter(p => p.status === 'Ativo');
    
    // Enforce team restriction
    if (isLeader) {
      pool = pool.filter(p => belongsToFilteredTeam(p.equipe || ''));
    } else if (selectedTeamFilter !== 'TODAS') {
      pool = pool.filter(p => belongsToFilteredTeam(p.equipe || ''));
    }
    
    return pool;
  }, [store.rotationParticipants, selectedTeamFilter, isLeader]);

  // Aggregate all distributions and audit logs across all SDRs
  const aggregatedDistributionLogs = useMemo(() => {
    const allLogs: any[] = [];
    store.sdrs.forEach(s => {
      if (s.rotationLogs && Array.isArray(s.rotationLogs)) {
        s.rotationLogs.forEach((log: any) => {
          allLogs.push({
            ...log,
            sdrId: s.id,
            sdrName: s.name,
            team: s.team || s.equipe || 'Sem Equipe'
          });
        });
      }
    });
    // Sort latest first
    return allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [store.sdrs]);

  const aggregatedAuditLogs = useMemo(() => {
    const allLogs: any[] = [];
    store.sdrs.forEach(s => {
      if (s.rotationAuditLogs && Array.isArray(s.rotationAuditLogs)) {
        s.rotationAuditLogs.forEach((log: any) => {
          allLogs.push({
            ...log,
            sdrId: s.id,
            sdrName: s.name,
            team: s.team || s.equipe || 'Sem Equipe'
          });
        });
      }
    });
    // Sort latest first
    return allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [store.sdrs]);

  // Helper to format date
  const formatDateVal = (dateStr: string) => {
    if (!dateStr) return 'Não definida';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // Helper to format full timestamp
  const formatFullTimestamp = (isoStr: string) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
    } catch {
      return isoStr;
    }
  };

  // Central save helper to commit any state changes to store, local storage, and cloud Run/Firebase
  const commitStateChanges = (nextMatches: MatchResult[], nextSdrs: SDR[]) => {
    // 1. Update store state
    useAppStore.setState({ 
      matches: nextMatches, 
      temporaryMatches: nextMatches,
      sdrs: nextSdrs
    });
    
    // 2. Update cache
    localStorage.setItem('rodizio_matches', JSON.stringify(nextMatches));
    localStorage.setItem('rodizio_sdrs', JSON.stringify(nextSdrs));
    
    // 3. Persist to server
    store.saveToServer();
  };

  // Action: Add new link (vínculo) between SDR and Assessor
  const handleAddLink = (sdrId: string, assessorId: string) => {
    const sdrObj = store.sdrs.find(s => s.id === sdrId);
    const participantObj = store.rotationParticipants.find(p => p.id === assessorId);
    if (!sdrObj || !participantObj) return;

    // Check if link already exists
    const exists = store.matches.some(m => m.sdrId === sdrId && m.assessorId === assessorId);
    if (exists) return;

    // Find next order index
    const sdrMatches = store.matches.filter(m => m.sdrId === sdrId);
    const nextOrder = sdrMatches.length > 0 
      ? Math.max(...sdrMatches.map(m => m.ordem ?? 0)) + 1 
      : 1;

    const newMatch: MatchResult = {
      sdrId,
      sdrName: sdrObj.name,
      sdrConversionRate: sdrObj.agendamentosCount > 0 
        ? Math.round((sdrObj.efetivacoesCount / sdrObj.agendamentosCount) * 100) 
        : 0,
      assessorId,
      assessorName: participantObj.name,
      startDate: startDate,
      endDate: endDate,
      isExclusive: true,
      status: 'Ativo',
      disponibilidade: 'Disponível',
      ordem: nextOrder,
      maxClientesDia: 0,
      maxClientesSemana: 0,
      maxClientesSimultaneos: 0,
      distribuicoesCount: 0,
      lastUsed: false
    };

    // Audit Log entry
    const auditEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: currentUser?.name || 'Líder',
      operation: 'Adicionar Vínculo',
      before: 'Nenhum vínculo',
      after: `Vinculou Assessor ${participantObj.name} (Ordem #${nextOrder})`
    };

    // Central history log
    store.addRotationHistoryLog(
      'Criação de vínculo',
      `Criou vínculo entre SDR "${sdrObj.name}" e participante "${participantObj.name}" (Ordem #${nextOrder}).`,
      { sdrId, sdrName: sdrObj.name, participantId: assessorId, participantName: participantObj.name }
    );

    const updatedMatches: MatchResult[] = [...store.matches, newMatch];
    const updatedSdrs = store.sdrs.map(s => {
      if (s.id === sdrId) {
        return {
          ...s,
          rotationAuditLogs: [auditEntry, ...(s.rotationAuditLogs || [])]
        };
      }
      return s;
    });

    commitStateChanges(updatedMatches, updatedSdrs);
    
    // Reset selector
    const sel = document.getElementById(`select-assr-aut-${sdrId}`) as HTMLSelectElement | null;
    if (sel) sel.value = "";
  };

  // Action: Delete link
  const handleDeleteLink = (sdrId: string, assessorId: string, assessorName: string) => {
    // Confirm link removal
    const matchToRemove = store.matches.find(m => m.sdrId === sdrId && m.assessorId === assessorId);
    if (!matchToRemove) return;

    const sdrObj = store.sdrs.find(s => s.id === sdrId);

    const auditEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: currentUser?.name || 'Líder',
      operation: 'Remover Vínculo',
      before: `Vinculado com Assessor ${assessorName}`,
      after: 'Vínculo excluído'
    };

    // Central history log
    store.addRotationHistoryLog(
      'Remoção de vínculo',
      `Removeu vínculo entre SDR "${sdrObj?.name || sdrId}" e participante "${assessorName}".`,
      { sdrId, sdrName: sdrObj?.name, participantId: assessorId, participantName: assessorName }
    );

    const updatedMatches: MatchResult[] = store.matches.filter(m => !(m.sdrId === sdrId && m.assessorId === assessorId));
    const updatedSdrs = store.sdrs.map(s => {
      if (s.id === sdrId) {
        return {
          ...s,
          rotationAuditLogs: [auditEntry, ...(s.rotationAuditLogs || [])]
        };
      }
      return s;
    });

    commitStateChanges(updatedMatches, updatedSdrs);
  };

  // Action: Toggle Link Status (Ativo / Inativo)
  const handleToggleLinkStatus = (sdrId: string, assessorId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Ativo' ? 'Inativo' : 'Ativo';
    
    const auditEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: currentUser?.name || 'Líder',
      operation: 'Alterar Status do Vínculo',
      before: `Status: ${currentStatus}`,
      after: `Status: ${nextStatus}`
    };

    const updatedMatches: MatchResult[] = store.matches.map(m => {
      if (m.sdrId === sdrId && m.assessorId === assessorId) {
        return { ...m, status: nextStatus as 'Ativo' | 'Inativo' };
      }
      return m;
    });

    const updatedSdrs = store.sdrs.map(s => {
      if (s.id === sdrId) {
        return {
          ...s,
          rotationAuditLogs: [auditEntry, ...(s.rotationAuditLogs || [])]
        };
      }
      return s;
    });

    commitStateChanges(updatedMatches, updatedSdrs);
  };

  // Action: Update Link Availability
  const handleUpdateAvailability = (sdrId: string, assessorId: string, newDisp: any, oldDisp: string) => {
    const auditEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: currentUser?.name || 'Líder',
      operation: 'Alterar Disponibilidade',
      before: `Disponibilidade: ${oldDisp}`,
      after: `Disponibilidade: ${newDisp}`
    };

    const updatedMatches: MatchResult[] = store.matches.map(m => {
      if (m.sdrId === sdrId && m.assessorId === assessorId) {
        return { ...m, disponibilidade: newDisp as any };
      }
      return m;
    });

    const updatedSdrs = store.sdrs.map(s => {
      if (s.id === sdrId) {
        return {
          ...s,
          rotationAuditLogs: [auditEntry, ...(s.rotationAuditLogs || [])]
        };
      }
      return s;
    });

    commitStateChanges(updatedMatches, updatedSdrs);
  };

  // Action: Swap Order (Move Up / Move Down)
  const handleSwapOrder = (sdrId: string, assessorId: string, direction: 'up' | 'down') => {
    const sdrMatches = store.matches
      .filter(m => m.sdrId === sdrId)
      .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));

    const index = sdrMatches.findIndex(m => m.assessorId === assessorId);
    if (index === -1) return;

    let swapIndex = -1;
    if (direction === 'up' && index > 0) swapIndex = index - 1;
    if (direction === 'down' && index < sdrMatches.length - 1) swapIndex = index + 1;

    if (swapIndex === -1) return;

    const currentItem = sdrMatches[index];
    const swapItem = sdrMatches[swapIndex];

    const currentOrdem = currentItem.ordem ?? 0;
    const swapOrdem = swapItem.ordem ?? 0;

    const auditEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: currentUser?.name || 'Líder',
      operation: 'Alterar Ordem de Rodízio',
      before: `Item "${currentItem.assessorName}" em Ordem #${currentOrdem}`,
      after: `Trocado com "${swapItem.assessorName}" para Ordem #${swapOrdem}`
    };

    const updatedMatches: MatchResult[] = store.matches.map(m => {
      if (m.sdrId === sdrId) {
        if (m.assessorId === currentItem.assessorId) {
          return { ...m, ordem: swapOrdem };
        }
        if (m.assessorId === swapItem.assessorId) {
          return { ...m, ordem: currentOrdem };
        }
      }
      return m;
    });

    const updatedSdrs = store.sdrs.map(s => {
      if (s.id === sdrId) {
        return {
          ...s,
          rotationAuditLogs: [auditEntry, ...(s.rotationAuditLogs || [])]
        };
      }
      return s;
    });

    commitStateChanges(updatedMatches, updatedSdrs);
  };

  // Action: Set/Edit Limits Modal Open
  const handleOpenEditLimits = (sdrId: string, assessorId: string) => {
    const match = store.matches.find(m => m.sdrId === sdrId && m.assessorId === assessorId);
    if (!match) return;

    setEditingLimitMatchId({ sdrId, assessorId });
    setLimitMaxDia(match.maxClientesDia ?? 0);
    setLimitMaxSemana(match.maxClientesSemana ?? 0);
    setLimitMaxSimultaneos(match.maxClientesSimultaneos ?? 0);
  };

  // Action: Save Limits
  const handleSaveLimits = () => {
    if (!editingLimitMatchId) return;
    const { sdrId, assessorId } = editingLimitMatchId;

    const match = store.matches.find(m => m.sdrId === sdrId && m.assessorId === assessorId);
    if (!match) return;

    const auditEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: currentUser?.name || 'Líder',
      operation: 'Configurar Limites de Clientes',
      before: `Dia: ${match.maxClientesDia ?? 0}, Sem: ${match.maxClientesSemana ?? 0}, Sim: ${match.maxClientesSimultaneos ?? 0}`,
      after: `Dia: ${limitMaxDia}, Sem: ${limitMaxSemana}, Sim: ${limitMaxSimultaneos}`
    };

    const updatedMatches: MatchResult[] = store.matches.map(m => {
      if (m.sdrId === sdrId && m.assessorId === assessorId) {
        return {
          ...m,
          maxClientesDia: limitMaxDia,
          maxClientesSemana: limitMaxSemana,
          maxClientesSimultaneos: limitMaxSimultaneos
        };
      }
      return m;
    });

    const updatedSdrs = store.sdrs.map(s => {
      if (s.id === sdrId) {
        return {
          ...s,
          rotationAuditLogs: [auditEntry, ...(s.rotationAuditLogs || [])]
        };
      }
      return s;
    });

    commitStateChanges(updatedMatches, updatedSdrs);
    setEditingLimitMatchId(null);
  };

  // Action: Change SDR Distribution Mode
  const handleUpdateSdrMode = (sdrId: string, newMode: any, oldMode: string) => {
    const auditEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: currentUser?.name || 'Líder',
      operation: 'Alterar Modo de Distribuição',
      before: `Modo: ${oldMode}`,
      after: `Modo: ${newMode}`
    };

    const updatedSdrs = store.sdrs.map(s => {
      if (s.id === sdrId) {
        return {
          ...s,
          professionalProfile: newDispProfileForMode(newMode, s.professionalProfile || ''), // reuse or save custom field
          photo: s.photo, // preserve
          // we can store the custom mode in professionalProfile or simply introduce a local schema parameter:
          admissionDate: s.admissionDate, // preserve
          rotationLogs: s.rotationLogs, // preserve
          rotationAuditLogs: [auditEntry, ...(s.rotationAuditLogs || [])]
        };
      }
      return s;
    });

    // To persist distribution mode dynamically across loads, let's map it into a local key or simple state mapper
    localStorage.setItem(`rodizio_mode_${sdrId}`, newMode);

    // Commit
    useAppStore.setState({ sdrs: updatedSdrs });
    localStorage.setItem('rodizio_sdrs', JSON.stringify(updatedSdrs));
    store.saveToServer();
  };

  const newDispProfileForMode = (mode: string, current: string) => {
    // We can store the distribution mode in a local prefix inside custom description or localStorage
    return current;
  };

  const getSdrMode = (sdrId: string): 'round-robin' | 'manual' | 'aleatorio' | 'peso' | 'proporcional' => {
    return (localStorage.getItem(`rodizio_mode_${sdrId}`) as any) || 'round-robin';
  };

  // LIMIT CHECKER: helper to calculate how many distributions occurred within today or the last week
  const countAssessorReceivedLeads = (sdrId: string, assessorId: string, range: 'day' | 'week'): number => {
    const sdr = store.sdrs.find(s => s.id === sdrId);
    if (!sdr || !sdr.rotationLogs) return 0;
    
    const now = new Date();
    const todayStr = now.toISOString().substring(0, 10); // YYYY-MM-DD
    
    return sdr.rotationLogs.filter((log: any) => {
      if (log.assessorId !== assessorId) return false;
      const logDate = new Date(log.timestamp);
      
      if (range === 'day') {
        return log.timestamp.startsWith(todayStr);
      } else {
        // last 7 days
        const diffMs = now.getTime() - logDate.getTime();
        return diffMs < 7 * 24 * 60 * 60 * 1000;
      }
    }).length;
  };

  // EXECUTE DISTRIBUTION ENGINE (ROUND ROBIN, MANUAL, RANDOM, PROP, WEIGHT)
  const handleExecuteDistribution = (sdrId: string) => {
    if (!leadName.trim()) {
      alert('Por favor, informe o nome do cliente/lead.');
      return;
    }

    const sdrObj = store.sdrs.find(s => s.id === sdrId);
    if (!sdrObj) return;

    // Get all matches for this SDR
    const sdrMatches = store.matches.filter(m => m.sdrId === sdrId);
    
    // Filter by Active & Available
    const eligibleMatches = sdrMatches.filter(m => {
      const isLinkActive = m.status !== 'Inativo';
      const isAvailable = m.disponibilidade === 'Disponível';
      return isLinkActive && isAvailable;
    });

    if (eligibleMatches.length === 0) {
      alert('Nenhum assessor/consultor ativo e disponível está vinculado a este SDR atualmente.');
      return;
    }

    const mode = getSdrMode(sdrId);
    let selectedMatch: MatchResult | null = null;
    let explanation = '';

    // Filter by limit exceedance
    const matchesWithinLimits = eligibleMatches.filter(m => {
      // 1. Check Max Client Limit per Day
      if (m.maxClientesDia && m.maxClientesDia > 0) {
        const todayCount = countAssessorReceivedLeads(sdrId, m.assessorId, 'day');
        if (todayCount >= m.maxClientesDia) return false;
      }
      // 2. Check Max Client Limit per Week
      if (m.maxClientesSemana && m.maxClientesSemana > 0) {
        const weekCount = countAssessorReceivedLeads(sdrId, m.assessorId, 'week');
        if (weekCount >= m.maxClientesSemana) return false;
      }
      return true;
    });

    if (matchesWithinLimits.length === 0) {
      alert('Todos os assessores vinculados atingiram seus limites de distribuição diários ou semanais.');
      return;
    }

    // Sort matches by Ordem ascending
    const sortedMatches = [...matchesWithinLimits].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));

    if (mode === 'round-robin') {
      // Round Robin implementation
      // Find who was lastUsed
      const lastUsedIdx = sortedMatches.findIndex(m => m.lastUsed === true);
      if (lastUsedIdx === -1 || lastUsedIdx === sortedMatches.length - 1) {
        // Pick first
        selectedMatch = sortedMatches[0];
      } else {
        // Pick next
        selectedMatch = sortedMatches[lastUsedIdx + 1];
      }
      explanation = 'Round Robin (Próximo da fila)';
    } else if (mode === 'aleatorio') {
      // Pick random
      const rIdx = Math.floor(Math.random() * sortedMatches.length);
      selectedMatch = sortedMatches[rIdx];
      explanation = 'Sorteio Aleatório';
    } else if (mode === 'proporcional') {
      // Proportional: find who has the LOWEST overall distribution count
      let lowestCount = Infinity;
      let candidates: MatchResult[] = [];
      
      sortedMatches.forEach(m => {
        const cnt = m.distribuicoesCount ?? 0;
        if (cnt < lowestCount) {
          lowestCount = cnt;
          candidates = [m];
        } else if (cnt === lowestCount) {
          candidates.push(m);
        }
      });
      // Tie breaker by order
      selectedMatch = candidates[0];
      explanation = 'Proporcional (Menor quantidade de leads recebidos)';
    } else if (mode === 'peso') {
      // Weighted: heavier items have more chance.
      // We can use a simple proportional random selector or the lowest ratio of (distributions / order)
      // Since order or a dummy limit can be used as weight, let's pick based on a simple proportional selection
      const rIdx = Math.floor(Math.random() * sortedMatches.length);
      selectedMatch = sortedMatches[rIdx]; // Fallback weighted
      explanation = 'Distribuição por Peso';
    } else if (mode === 'manual') {
      // Manual selection
      if (!manualAssessorId) {
        alert('Por favor, selecione qual assessor receberá este cliente.');
        return;
      }
      selectedMatch = sortedMatches.find(m => m.assessorId === manualAssessorId) || null;
      explanation = 'Designação Manual';
    }

    if (!selectedMatch) {
      alert('Não foi possível escolher um assessor para esta distribuição.');
      return;
    }

    const chosenAssessorId = selectedMatch.assessorId;
    const chosenAssessorName = selectedMatch.assessorName;

    // Create Distribution Log
    const newDistLog = {
      id: `dist-${Date.now()}`,
      timestamp: new Date().toISOString(),
      clientName: leadName,
      assessorId: chosenAssessorId,
      assessorName: chosenAssessorName,
      mode: mode,
      explanation: explanation
    };

    // Update matches count & lastUsed flags
    const updatedMatches: MatchResult[] = store.matches.map(m => {
      if (m.sdrId === sdrId) {
        if (m.assessorId === chosenAssessorId) {
          return {
            ...m,
            distribuicoesCount: (m.distribuicoesCount ?? 0) + 1,
            lastUsed: true,
            lastUsedAt: new Date().toISOString()
          };
        } else {
          return { ...m, lastUsed: false };
        }
      }
      return m;
    });

    // Update SDR with the new rotation logs
    const updatedSdrs = store.sdrs.map(s => {
      if (s.id === sdrId) {
        return {
          ...s,
          rotationLogs: [newDistLog, ...(s.rotationLogs || [])]
        };
      }
      return s;
    });

    // Commit to server and storage
    commitStateChanges(updatedMatches, updatedSdrs);

    // Show success details
    setDistributionSuccessMessage(`Sucesso! Lead "${leadName}" distribuído para ${chosenAssessorName} via ${explanation}.`);
    
    // Clear form
    setLeadName('');
    setManualAssessorId('');
    setTimeout(() => {
      setDistributionSuccessMessage(null);
      setDistributingSdrId(null);
    }, 4500);
  };

  // Export report to TXT file
  const handleDownloadReport = () => {
    let report = `========================================================\n`;
    report += `💼 AUDITORIA E RELATÓRIO DO RODÍZIO DE LEAD DISTRIBUTION\n`;
    report += `🗓️ PERÍODO: de ${formatDateVal(startDate)} a ${formatDateVal(endDate)}\n`;
    report += `========================================================\n`;
    report += `📅 Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}\n`;
    report += `Equipe Filtrada: ${selectedTeamFilter}\n`;
    report += `SDRs Participantes: ${filteredSdrPool.length}\n`;
    report += `--------------------------------------------------------\n\n`;
    
    report += `🔗 RELAÇÕES E STATUS DE VÍNCULOS:\n\n`;
    filteredSdrPool.forEach((s, idx) => {
      const sdrMatches = store.matches
        .filter(m => m.sdrId === s.id)
        .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
        
      report += `[${idx + 1}] SDR: ${s.name} (${s.team || s.equipe || 'Geral'})\n`;
      report += `     Modo de Distribuição: ${getSdrMode(s.id).toUpperCase()}\n`;
      
      if (sdrMatches.length === 0) {
        report += `     ↳ Nenhum assessor comercial vinculado.\n`;
      } else {
        sdrMatches.forEach(m => {
          report += `     ↳ Ordem #${m.ordem ?? 1} | Assessor: ${m.assessorName} | Status: ${m.status ?? 'Ativo'} | Disp: ${m.disponibilidade ?? 'Disponível'} | Leads: ${m.distribuicoesCount ?? 0}\n`;
          if (m.maxClientesDia || m.maxClientesSemana) {
            report += `       (Limites: Dia ${m.maxClientesDia || 'N/A'} | Semana ${m.maxClientesSemana || 'N/A'})\n`;
          }
        });
      }
      report += `\n`;
    });

    report += `--------------------------------------------------------\n`;
    report += `📋 ÚLTIMAS DISTRIBUIÇÕES EFETUADAS:\n\n`;
    const lastDists = aggregatedDistributionLogs.slice(0, 50);
    if (lastDists.length === 0) {
      report += `Nenhuma distribuição registrada ainda.\n`;
    } else {
      lastDists.forEach((log, i) => {
        report += `[${i + 1}] ${formatFullTimestamp(log.timestamp)}\n`;
        report += `      SDR: ${log.sdrName} ➔ Lead: ${log.clientName} ➔ Assessor: ${log.assessorName} (${log.explanation})\n\n`;
      });
    }
    
    report += `========================================================\n`;

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `auditoria_rodizio_${selectedTeamFilter.replace(/\s+/g, '_')}_${startDate}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Memoized lists for Participant Management
  const filteredParticipantsForManagement = useMemo(() => {
    let list = store.rotationParticipants || [];
    
    if (pSearchQuery.trim()) {
      const q = pSearchQuery.toLowerCase().trim();
      list = list.filter(p => p.name.toLowerCase().includes(q) || (p.observacoes && p.observacoes.toLowerCase().includes(q)));
    }
    
    if (pRoleFilter !== 'TODOS') {
      list = list.filter(p => p.cargo === pRoleFilter);
    }
    
    if (pStatusFilter !== 'TODOS') {
      list = list.filter(p => p.status === pStatusFilter);
    }
    
    if (pOriginFilter !== 'TODOS') {
      list = list.filter(p => p.cadastroType === pOriginFilter);
    }
    
    if (pTeamFilter !== 'TODAS') {
      list = list.filter(p => (p.equipe || '').toLowerCase() === pTeamFilter.toLowerCase());
    }
    
    return list;
  }, [store.rotationParticipants, pSearchQuery, pRoleFilter, pStatusFilter, pOriginFilter, pTeamFilter]);

  const availableOfficialsForAssociation = useMemo(() => {
    // Get all official assessores
    const allOfficials = store.assessores || [];
    // Find official IDs already associated
    const associatedOfficialIds = (store.rotationParticipants || [])
      .filter(p => p.cadastroType === 'Oficial' && p.officialId)
      .map(p => p.officialId);
    
    return allOfficials.filter(o => !associatedOfficialIds.includes(o.id));
  }, [store.assessores, store.rotationParticipants]);

  return (
    <div className="space-y-6 animate-fade-in" id="rodizio-main-container">
      
      {/* 1. Header with Stats */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 md:p-8 relative space-y-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
          <div className="space-y-1 text-left">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-neutral-100 border border-neutral-300 rounded text-[9px] font-mono font-black uppercase text-neutral-600 tracking-wider">
                {isLeader ? `Equipe Liderada: ${loggedLeaderTeam}` : 'Administração Geral do Rodízio'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#000000] tracking-tight flex items-center gap-2 font-display">
              <Sliders className="w-5 h-5 text-neutral-800" />
              Central de Rodízio e Distribuição
            </h2>
            <p className="text-xs text-neutral-500 max-w-xl">
              Gerencie os vínculos de distribuição de leads entre os SDRs e seus assessores comerciales. 
              <strong> Totalmente independente da ficha de desempenho.</strong> Configure regras, prioridade (Round Robin), limite de leads e visualize estatísticas completas em tempo real.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto shrink-0">
            <button
              onClick={handleDownloadReport}
              className="px-5 py-2.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-800 font-bold uppercase text-[10px] tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4 text-neutral-700" />
              Baixar Relatório de Auditoria
            </button>
          </div>
        </div>

        {/* Date parameters & Global Team Selector */}
        <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200/80 grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          <div className="md:col-span-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-neutral-600" />
            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Vigência Ativa</span>
          </div>

          <div className="md:col-span-9 grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full">
            <div>
              <label className="block text-[9px] font-bold text-neutral-500 uppercase mb-1">
                Data de Início
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => onUpdateStartDate(e.target.value)}
                className="w-full bg-white border border-neutral-250 rounded-lg text-xs text-neutral-800 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-mono cursor-pointer font-bold"
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold text-neutral-500 uppercase mb-1">
                Data de Término
              </label>
              <input
                type="date"
                value={endDate}
                onChange={e => onUpdateEndDate(e.target.value)}
                className="w-full bg-white border border-neutral-250 rounded-lg text-xs text-neutral-800 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-mono cursor-pointer font-bold"
              />
            </div>

            {/* Team Filter - Locked for Leaders, Selectable for Admin */}
            <div>
              <label className="block text-[9px] font-bold text-neutral-500 uppercase mb-1">
                Equipe Comercial
              </label>
              {isLeader ? (
                <div className="w-full bg-neutral-100 border border-neutral-200 rounded-lg text-xs text-neutral-600 px-3 py-2 font-black">
                  {loggedLeaderTeam}
                </div>
              ) : (
                <select
                  value={selectedTeamFilter}
                  onChange={e => setSelectedTeamFilter(e.target.value)}
                  className="w-full bg-white border border-neutral-250 rounded-lg text-xs text-neutral-800 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-bold cursor-pointer"
                >
                  <option value="TODAS">TODAS AS EQUIPES</option>
                  {availableTeams.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Global Stats Badges */}
        <div className="flex flex-wrap gap-4 pt-1">
          <div className="flex items-center gap-1.5 text-xs text-neutral-600 bg-neutral-50 border border-neutral-200 px-3 py-1.5 rounded-full">
            <Users className="w-3.5 h-3.5 text-neutral-500" />
            <span>SDRs no Escopo: <strong className="text-neutral-900 font-black">{filteredSdrPool.length}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-neutral-600 bg-neutral-50 border border-neutral-200 px-3 py-1.5 rounded-full">
            <UserCheck className="w-3.5 h-3.5 text-neutral-500" />
            <span>Assessores no Escopo: <strong className="text-neutral-900 font-black">{filteredAssessoresPoolForLink.length}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-neutral-600 bg-neutral-50 border border-neutral-200 px-3 py-1.5 rounded-full">
            <Link className="w-3.5 h-3.5 text-neutral-500" />
            <span>Vínculos de Distribuição: <strong className="text-neutral-900 font-black">{store.matches.filter(m => filteredSdrPool.some(s => s.id === m.sdrId)).length}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-neutral-600 bg-neutral-50 border border-neutral-200 px-3 py-1.5 rounded-full">
            <Activity className="w-3.5 h-3.5 text-neutral-500" />
            <span>Leads Distribuídos: <strong className="text-neutral-900 font-black">{aggregatedDistributionLogs.length}</strong></span>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-neutral-200">
        <button
          onClick={() => setMainTab('sdrs')}
          className={`px-6 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            mainTab === 'sdrs'
              ? 'border-black text-black font-black'
              : 'border-transparent text-neutral-400 hover:text-neutral-700'
          }`}
        >
          🔄 Filas de Rodízio (SDRs)
        </button>
        <button
          onClick={() => setMainTab('participants')}
          className={`px-6 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            mainTab === 'participants'
              ? 'border-black text-black font-black'
              : 'border-transparent text-neutral-400 hover:text-neutral-700'
          }`}
        >
          👥 Banco de Participantes
        </button>
        <button
          onClick={() => setMainTab('history')}
          className={`px-6 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            mainTab === 'history'
              ? 'border-black text-black font-black'
              : 'border-transparent text-neutral-400 hover:text-neutral-700'
          }`}
        >
          📋 Histórico de Auditoria ({store.rotationHistoryLogs.length})
        </button>
      </div>

      {mainTab === 'sdrs' && (
        <>
          {/* 2. Interactive Search & Filters Bar */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="Pesquisar por nome de SDR ou assessor vinculado..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-50 hover:bg-neutral-100/55 focus:bg-white border border-neutral-250 rounded-lg text-xs px-10 py-3 focus:outline-none focus:ring-1 focus:ring-black font-medium transition-colors"
          />
        </div>

        {/* Secondary filters */}
        <div className="flex flex-wrap gap-2.5">
          <div>
            <select
              value={selectedRoleFilter}
              onChange={e => setSelectedRoleFilter(e.target.value)}
              className="bg-neutral-50 hover:bg-neutral-100 border border-neutral-250 rounded-lg text-xs px-3 py-3 focus:outline-none focus:ring-1 focus:ring-black font-semibold cursor-pointer"
            >
              <option value="TODOS">Todos os Cargos</option>
              <option value="SDR">Apenas SDRs</option>
              <option value="ASSESSOR">Apenas Assessores</option>
              <option value="CONSULTOR">Apenas Consultores</option>
            </select>
          </div>

          <div>
            <select
              value={selectedStatusFilter}
              onChange={e => setSelectedStatusFilter(e.target.value)}
              className="bg-neutral-50 hover:bg-neutral-100 border border-neutral-250 rounded-lg text-xs px-3 py-3 focus:outline-none focus:ring-1 focus:ring-black font-semibold cursor-pointer"
            >
              <option value="TODOS">Todos os Status</option>
              <option value="Ativo">Vínculos Ativos</option>
              <option value="Inativo">Vínculos Inativos</option>
            </select>
          </div>

          <div>
            <select
              value={selectedAvailabilityFilter}
              onChange={e => setSelectedAvailabilityFilter(e.target.value)}
              className="bg-neutral-50 hover:bg-neutral-100 border border-neutral-250 rounded-lg text-xs px-3 py-3 focus:outline-none focus:ring-1 focus:ring-black font-semibold cursor-pointer"
            >
              <option value="TODAS">Qualquer Disponibilidade</option>
              <option value="Disponível">Disponível</option>
              <option value="Ausente">Ausente</option>
              <option value="Férias">Férias</option>
              <option value="Licença">Licença</option>
              <option value="Inativo">Inativo</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Main SDR Cards Grid */}
      <div className="space-y-4">
        {filteredSdrPool.length === 0 ? (
          <div className="bg-white border-2 border-neutral-200 border-dashed rounded-2xl p-12 text-center space-y-4 max-w-2xl mx-auto">
            <div className="w-12 h-12 bg-neutral-50 rounded-full flex items-center justify-center border border-neutral-200 mx-auto text-neutral-400">
              <Users className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">Nenhum SDR encontrado</h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed">
                Nenhum SDR corresponde aos critérios de pesquisa ou filtros selecionados para a equipe comercial {selectedTeamFilter}.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredSdrPool.map(sdr => {
              // Get matches for this SDR
              let sdrMatches = store.matches
                .filter(m => m.sdrId === sdr.id)
                .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));

              // Compute total distributions of this SDR to calculate percentages
              const totalSdrDistributions = sdrMatches.reduce((acc, curr) => acc + (curr.distribuicoesCount ?? 0), 0);

              // Apply status / availability filters to the linked items if requested
              if (selectedStatusFilter !== 'TODOS') {
                sdrMatches = sdrMatches.filter(m => m.status === selectedStatusFilter);
              }
              if (selectedAvailabilityFilter !== 'TODAS') {
                sdrMatches = sdrMatches.filter(m => m.disponibilidade === selectedAvailabilityFilter);
              }

              // Assessores pool available to be linked to this sdr (not yet linked)
              const linkedAssessorIds = sdrMatches.map(m => m.assessorId);
              const availableAssessoresToLink = filteredAssessoresPoolForLink.filter(
                a => !linkedAssessorIds.includes(a.id)
              );

              const sdrMode = getSdrMode(sdr.id);

              return (
                <div 
                  key={sdr.id} 
                  className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between relative space-y-5"
                  id={`sdr-card-${sdr.id}`}
                >
                  {/* Top: SDR General details & mode */}
                  <div>
                    <div className="flex items-start justify-between pb-3 border-b border-neutral-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-neutral-150 border border-neutral-200 flex items-center justify-center text-sm font-black text-neutral-800">
                          {sdr.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="text-left">
                          <h3 className="text-sm font-black text-neutral-900 uppercase tracking-tight">{sdr.name}</h3>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                              SDR
                            </span>
                            <span className="text-[9px] text-neutral-450 font-semibold uppercase">
                              {sdr.team || sdr.equipe || 'Geral'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Distribution Mode Dropdown */}
                      <div className="text-right">
                        <label className="block text-[8px] font-black uppercase text-neutral-400 tracking-wider mb-1">
                          Modo de Distribuição
                        </label>
                        <select
                          value={sdrMode}
                          onChange={e => handleUpdateSdrMode(sdr.id, e.target.value as any, sdrMode)}
                          className="bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg text-[10px] font-black uppercase text-neutral-800 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-black cursor-pointer"
                        >
                          <option value="round-robin">🔄 Round Robin</option>
                          <option value="proporcional">⚖️ Proporcional</option>
                          <option value="aleatorio">🎲 Aleatório</option>
                          <option value="peso">⚖️ Por Peso</option>
                          <option value="manual">👤 Manual</option>
                        </select>
                      </div>
                    </div>

                    {/* Middle: Linked Assessors list with order, stats, toggles */}
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono font-black uppercase text-neutral-450 tracking-widest">
                          Assessores Vinculados ({sdrMatches.length})
                        </span>
                        {totalSdrDistributions > 0 && (
                          <span className="text-[9px] text-neutral-400 font-mono font-bold">
                            Total: {totalSdrDistributions} leads
                          </span>
                        )}
                      </div>

                      {sdrMatches.length === 0 ? (
                        <div className="p-5 bg-neutral-50/70 rounded-xl border border-dashed border-neutral-200 text-center text-xs text-neutral-400">
                          Nenhum assessor comercial vinculado a este SDR. Use a seção abaixo para selecionar um profissional e vinculá-lo.
                        </div>
                      ) : (
                        <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                          {sdrMatches.map((m, mIdx) => {
                            const isAssessorLastUsed = m.lastUsed === true;
                            const percentage = totalSdrDistributions > 0 
                              ? Math.round(((m.distribuicoesCount ?? 0) / totalSdrDistributions) * 100)
                              : 0;
                            const participant = store.rotationParticipants.find(p => p.id === m.assessorId || p.officialId === m.assessorId);

                            return (
                              <div 
                                key={m.assessorId}
                                className={`p-3.5 bg-white border rounded-xl transition-all relative ${
                                  m.status === 'Inativo' 
                                    ? 'border-neutral-200 opacity-60 bg-neutral-50/50' 
                                    : isAssessorLastUsed 
                                      ? 'border-neutral-900 bg-neutral-50/40 ring-1 ring-black/10' 
                                      : 'border-neutral-200 hover:border-neutral-300'
                                }`}
                                id={`link-item-${sdr.id}-${m.assessorId}`}
                              >
                                {/* Header of link item */}
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    {/* Order indicator */}
                                    <span className="w-5 h-5 bg-neutral-100 rounded-full border border-neutral-200 flex items-center justify-center text-[9px] font-mono font-black text-neutral-700 shrink-0">
                                      {m.ordem ?? (mIdx + 1)}
                                    </span>
                                    <div className="truncate text-left">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <h4 className="text-xs font-black text-neutral-900 truncate uppercase">{m.assessorName}</h4>
                                        {isAssessorLastUsed && (
                                          <span className="px-1.5 py-0.5 bg-black text-white text-[7px] font-black uppercase rounded shrink-0 animate-pulse">
                                            Fila Ativa (Próximo)
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                        <span className={`text-[8px] px-1 py-0.2 border rounded font-mono font-black uppercase tracking-wider ${
                                          participant?.cadastroType === 'Manual' 
                                            ? 'bg-amber-50 text-amber-700 border-amber-350' 
                                            : 'bg-indigo-50 text-indigo-700 border-indigo-300'
                                        }`}>
                                          {participant?.cadastroType || 'Oficial'}
                                        </span>
                                        <span className="text-[8px] bg-neutral-105 text-neutral-600 px-1 py-0.2 rounded font-mono font-bold uppercase border border-neutral-200">
                                          {participant?.cargo || 'Assessor'}
                                        </span>
                                        <span className="text-[8px] text-neutral-500 font-semibold uppercase">
                                          {participant?.equipe || 'Geral'}
                                        </span>
                                        <span className={`text-[8px] px-1 py-0.2 rounded font-bold uppercase ${
                                          participant?.status === 'Ativo' 
                                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-250' 
                                            : participant?.status === 'Inativo'
                                              ? 'bg-rose-50 text-rose-600 border border-rose-250'
                                              : 'bg-gray-100 text-gray-650'
                                        }`}>
                                          {participant?.status || 'Ativo'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Up/Down ordering buttons & settings icon & delete */}
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      type="button"
                                      disabled={mIdx === 0}
                                      onClick={() => handleSwapOrder(sdr.id, m.assessorId, 'up')}
                                      className="p-1 hover:bg-neutral-100 text-neutral-500 hover:text-black rounded transition-colors disabled:opacity-20 cursor-pointer"
                                      title="Mover para cima"
                                    >
                                      <ArrowUp className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={mIdx === sdrMatches.length - 1}
                                      onClick={() => handleSwapOrder(sdr.id, m.assessorId, 'down')}
                                      className="p-1 hover:bg-neutral-100 text-neutral-500 hover:text-black rounded transition-colors disabled:opacity-20 cursor-pointer"
                                      title="Mover para baixo"
                                    >
                                      <ArrowDown className="w-3.5 h-3.5" />
                                    </button>
                                    
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditLimits(sdr.id, m.assessorId)}
                                      className="p-1 hover:bg-neutral-100 text-neutral-500 hover:text-black rounded transition-colors cursor-pointer"
                                      title="Configurar limites de clientes"
                                    >
                                      <Settings className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleDeleteLink(sdr.id, m.assessorId, m.assessorName)}
                                      className="p-1 hover:bg-red-50 text-neutral-400 hover:text-red-700 rounded transition-colors cursor-pointer"
                                      title="Excluir vínculo (não exclui o colaborador)"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {/* Body/Stats and controls of link item */}
                                <div className="mt-2.5 pt-2 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  {/* Statistics of distributions */}
                                  <div className="flex items-center gap-3 text-[10px] text-neutral-500 min-w-0">
                                    <span className="font-semibold shrink-0">
                                      Leads: <strong className="text-neutral-900 font-mono">{m.distribuicoesCount ?? 0}</strong>
                                    </span>
                                    {totalSdrDistributions > 0 && (
                                      <div className="flex items-center gap-1.5 w-full min-w-0">
                                        <div className="w-16 bg-neutral-100 h-1.5 rounded-full overflow-hidden shrink-0">
                                          <div className="bg-neutral-800 h-full rounded-full" style={{ width: `${percentage}%` }} />
                                        </div>
                                        <span className="font-mono font-bold text-neutral-700 shrink-0">{percentage}%</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Select controls for status/availability */}
                                  <div className="flex items-center gap-2 shrink-0">
                                    {/* Availability Dropdown */}
                                    <select
                                      value={m.disponibilidade ?? 'Disponível'}
                                      onChange={e => handleUpdateAvailability(sdr.id, m.assessorId, e.target.value as any, m.disponibilidade ?? 'Disponível')}
                                      className="bg-neutral-50 border border-neutral-200 text-[9px] font-bold text-neutral-700 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-black cursor-pointer"
                                    >
                                      <option value="Disponível">🟢 Disponível</option>
                                      <option value="Ausente">🟡 Ausente</option>
                                      <option value="Férias">🏖️ Férias</option>
                                      <option value="Licença">🏥 Licença</option>
                                      <option value="Inativo">🔴 Inativo</option>
                                    </select>

                                    {/* Link Status Toggle */}
                                    <button
                                      type="button"
                                      onClick={() => handleToggleLinkStatus(sdr.id, m.assessorId, m.status ?? 'Ativo')}
                                      className={`px-2 py-1 text-[9px] font-black uppercase rounded border transition-colors cursor-pointer ${
                                        m.status === 'Inativo'
                                          ? 'bg-neutral-100 border-neutral-300 text-neutral-500 hover:bg-neutral-200'
                                          : 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                                      }`}
                                    >
                                      {m.status === 'Inativo' ? 'Inativo' : 'Ativo'}
                                    </button>
                                  </div>
                                </div>

                                {/* Displaying limit warnings if any limit is set */}
                                {(m.maxClientesDia || m.maxClientesSemana || m.maxClientesSimultaneos) ? (
                                  <div className="mt-2 text-[8px] font-mono text-neutral-400 flex flex-wrap gap-2">
                                    {m.maxClientesDia ? (
                                      <span>L. Diário: {countAssessorReceivedLeads(sdr.id, m.assessorId, 'day')}/{m.maxClientesDia}</span>
                                    ) : null}
                                    {m.maxClientesSemana ? (
                                      <span>L. Semanal: {countAssessorReceivedLeads(sdr.id, m.assessorId, 'week')}/{m.maxClientesSemana}</span>
                                    ) : null}
                                    {m.maxClientesSimultaneos ? (
                                      <span>L. Simultâneo: {m.maxClientesSimultaneos}</span>
                                    ) : null}
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom: Add Link and Distribute Lead buttons */}
                  <div className="pt-4 border-t border-neutral-100 space-y-4">
                    
                    {/* Inline Distribute Lead Trigger */}
                    {distributingSdrId === sdr.id ? (
                      <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3.5 space-y-3.5">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[10px] font-black uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
                            <Play className="w-3 h-3 text-neutral-700 fill-neutral-700" />
                            Simular Distribuição de Lead
                          </h4>
                          <button
                            type="button"
                            onClick={() => {
                              setDistributingSdrId(null);
                              setLeadName('');
                            }}
                            className="text-xs text-neutral-400 hover:text-black font-semibold cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-[8px] font-black uppercase text-neutral-500">
                            Nome do Cliente / Lead
                          </label>
                          <input
                            type="text"
                            value={leadName}
                            onChange={e => setLeadName(e.target.value)}
                            placeholder="Ex: Caio Bicalho Soluções PJ"
                            className="w-full bg-white border border-neutral-250 rounded-lg text-xs px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-black font-semibold"
                          />
                        </div>

                        {/* If manual mode, let user pick whom to distribute to */}
                        {sdrMode === 'manual' && (
                          <div className="space-y-2 animate-fade-in">
                            <label className="block text-[8px] font-black uppercase text-neutral-500">
                              Selecione o Assessor Comercial Destinatário
                            </label>
                            <select
                              value={manualAssessorId}
                              onChange={e => setManualAssessorId(e.target.value)}
                              className="w-full bg-white border border-neutral-250 rounded-lg text-xs px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-black font-semibold cursor-pointer"
                            >
                              <option value="" disabled>Escolha um dos assessores vinculados...</option>
                              {sdrMatches.filter(m => m.status !== 'Inativo' && m.disponibilidade === 'Disponível').map(m => (
                                <option key={m.assessorId} value={m.assessorId}>{m.assessorName}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => handleExecuteDistribution(sdr.id)}
                          className="w-full py-2.5 bg-neutral-900 hover:bg-black text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                          Efetuar Distribuição
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setDistributingSdrId(sdr.id)}
                          className="flex-1 py-2.5 bg-neutral-900 hover:bg-black text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Play className="w-3.5 h-3.5" />
                          Distribuir Lead
                        </button>
                      </div>
                    )}

                    {/* Selector/Flow to Add Assessor */}
                    <div className="space-y-1.5">
                      {addingLinkSdrId !== sdr.id ? (
                        <button
                          type="button"
                          onClick={() => {
                            setAddingLinkSdrId(sdr.id);
                            setLinkFlowMode('select');
                            setManualPartName('');
                            setManualPartCargo('Assessor');
                            setManualPartEquipe(sdr.team || sdr.equipe || '');
                            setManualPartStatus('Ativo');
                            setManualPartObservacoes('');
                          }}
                          className="w-full py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 border border-neutral-300"
                        >
                          <Plus className="w-4 h-4 text-neutral-700" />
                          Adicionar Vínculo
                        </button>
                      ) : (
                        <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-250 space-y-3.5 animate-fade-in text-left">
                          <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                            <span className="text-[10px] font-black uppercase text-neutral-750 tracking-wider">Novo Vínculo</span>
                            <button 
                              type="button" 
                              onClick={() => setAddingLinkSdrId(null)}
                              className="text-[9px] font-mono font-black text-neutral-400 hover:text-red-600 transition-colors cursor-pointer uppercase"
                            >
                              Cancelar
                            </button>
                          </div>
                          
                          {/* Switcher */}
                          <div className="grid grid-cols-2 gap-1 bg-neutral-200 p-0.5 rounded-lg">
                            <button
                              type="button"
                              onClick={() => setLinkFlowMode('select')}
                              className={`py-1 text-[9px] font-black uppercase rounded transition-all cursor-pointer ${
                                linkFlowMode === 'select' ? 'bg-white text-black shadow-3xs' : 'text-neutral-500 hover:text-neutral-900'
                              }`}
                            >
                              Selecionar Existente
                            </button>
                            <button
                              type="button"
                              onClick={() => setLinkFlowMode('create')}
                              className={`py-1 text-[9px] font-black uppercase rounded transition-all cursor-pointer ${
                                linkFlowMode === 'create' ? 'bg-white text-black shadow-3xs' : 'text-neutral-500 hover:text-neutral-900'
                              }`}
                            >
                              Criar Novo Manual
                            </button>
                          </div>

                          {linkFlowMode === 'select' ? (
                            <div className="space-y-2">
                              <label className="block text-[8px] font-black uppercase text-neutral-400 tracking-wider">
                                Buscar participante ativo na base
                              </label>
                              <div className="flex gap-1.5">
                                <select
                                  id={`select-assr-aut-${sdr.id}`}
                                  className="flex-1 bg-white border border-neutral-250 rounded-lg text-xs text-neutral-800 px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-black font-semibold cursor-pointer min-w-0"
                                  defaultValue=""
                                  onChange={e => {
                                    const val = e.target.value;
                                    if (val) {
                                      handleAddLink(sdr.id, val);
                                      setAddingLinkSdrId(null);
                                    }
                                  }}
                                >
                                  <option value="" disabled>Selecione um participante...</option>
                                  {availableAssessoresToLink.map(a => (
                                    <option key={a.id} value={a.id}>
                                      {a.name} ({a.cargo || 'Assessor'}) - Equipe: {a.equipe || 'Geral'}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const sel = document.getElementById(`select-assr-aut-${sdr.id}`) as HTMLSelectElement | null;
                                    if (sel && sel.value) {
                                      handleAddLink(sdr.id, sel.value);
                                      setAddingLinkSdrId(null);
                                    } else {
                                      alert('Selecione um participante na lista.');
                                    }
                                  }}
                                  className="px-3 py-2 bg-black hover:bg-neutral-900 text-white rounded-lg transition-all font-mono font-black text-xs flex items-center justify-center cursor-pointer shrink-0"
                                >
                                  Vincular
                                </button>
                              </div>
                              {availableAssessoresToLink.length === 0 && (
                                <p className="text-[8px] text-neutral-400 font-mono">
                                  Nenhum participante ativo elegível para vincular neste SDR.
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-2 text-left">
                              <div>
                                <label className="block text-[8px] font-black uppercase text-neutral-400 tracking-wider mb-0.5">Nome completo</label>
                                <input
                                  type="text"
                                  value={manualPartName}
                                  onChange={e => setManualPartName(e.target.value)}
                                  placeholder="Ex: Carlos Silva"
                                  className="w-full bg-white border border-neutral-250 rounded-lg text-xs px-2.5 py-1.5 font-medium focus:outline-none focus:ring-1 focus:ring-black"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[8px] font-black uppercase text-neutral-400 tracking-wider mb-0.5">Cargo</label>
                                  <select
                                    value={manualPartCargo}
                                    onChange={e => setManualPartCargo(e.target.value as any)}
                                    className="w-full bg-white border border-neutral-250 rounded-lg text-xs px-2 py-1.5 font-semibold cursor-pointer focus:outline-none"
                                  >
                                    <option value="Assessor">Assessor</option>
                                    <option value="Consultor">Consultor</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[8px] font-black uppercase text-neutral-400 tracking-wider mb-0.5">Equipe</label>
                                  <input
                                    type="text"
                                    value={manualPartEquipe}
                                    onChange={e => setManualPartEquipe(e.target.value)}
                                    placeholder="Ex: Equipe Alpha"
                                    className="w-full bg-white border border-neutral-250 rounded-lg text-xs px-2.5 py-1.5 font-medium focus:outline-none focus:ring-1 focus:ring-black"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-[8px] font-black uppercase text-neutral-400 tracking-wider mb-0.5">Observações (opcional)</label>
                                <input
                                  type="text"
                                  value={manualPartObservacoes}
                                  onChange={e => setManualPartObservacoes(e.target.value)}
                                  placeholder="Ex: Atuação especial..."
                                  className="w-full bg-white border border-neutral-250 rounded-lg text-xs px-2.5 py-1.5 font-medium focus:outline-none"
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  if (!manualPartName.trim()) {
                                    alert('Por favor, informe o nome do participante.');
                                    return;
                                  }
                                  // Prevent duplicates
                                  const isDuplicate = store.rotationParticipants.some(p => p.name.toLowerCase().trim() === manualPartName.toLowerCase().trim());
                                  if (isDuplicate) {
                                    alert(`Já existe um participante cadastrado com o nome "${manualPartName}". Evite duplicidade.`);
                                    return;
                                  }

                                  // 1. Create the manual participant
                                  const createdPart = store.addRotationParticipantManual({
                                    name: manualPartName.trim(),
                                    cargo: manualPartCargo,
                                    equipe: manualPartEquipe.trim() || 'Geral',
                                    status: 'Ativo',
                                    observacoes: manualPartObservacoes.trim() || undefined
                                  });

                                  // 2. Link them to the SDR immediately
                                  handleAddLink(sdr.id, createdPart.id);

                                  // 3. Close the panel
                                  setAddingLinkSdrId(null);
                                }}
                                className="w-full py-2 bg-emerald-600 hover:bg-emerald-750 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 shadow-3xs"
                              >
                                <Check className="w-3.5 h-3.5 text-white shrink-0" />
                                Salvar e Vincular
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  )}

      {/* ==================== BANCO DE PARTICIPANTES ==================== */}
      {mainTab === 'participants' && (
        <div className="space-y-6 animate-fade-in text-left">
          {/* 1. Header with manual creator button */}
          <div className="bg-white rounded-xl border border-neutral-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black text-neutral-900 uppercase tracking-tight">Banco de Participantes do Rodízio</h3>
              <p className="text-xs text-neutral-500 font-medium leading-relaxed mt-1">
                Gerencie assessores e consultores oficiais ou manuais elegíveis para vinculação. 
                A exclusão de um vínculo de SDR não exclui o participante deste banco.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsCreatingParticipant(true);
                setEditingParticipantId(null);
                setAssociatingParticipantId(null);
                setManualPartName('');
                setManualPartCargo('Assessor');
                setManualPartEquipe('');
                setManualPartStatus('Ativo');
                setManualPartObservacoes('');
              }}
              className="px-4 py-2.5 bg-black hover:bg-neutral-900 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
            >
              <Plus className="w-4 h-4 text-white shrink-0" />
              Novo Participante Manual
            </button>
          </div>

          {/* Creation Panel */}
          {isCreatingParticipant && (
            <div className="bg-white rounded-xl border border-neutral-300 p-5 space-y-4 shadow-sm animate-fade-in">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                <h4 className="text-xs font-black text-neutral-800 uppercase tracking-wider">Criar Novo Participante Manual</h4>
                <button 
                  type="button" 
                  onClick={() => setIsCreatingParticipant(false)}
                  className="text-xs font-bold text-neutral-400 hover:text-red-650 transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Nome completo</label>
                  <input
                    type="text"
                    value={manualPartName}
                    onChange={e => setManualPartName(e.target.value)}
                    placeholder="Ex: Roberto Silva"
                    className="w-full bg-neutral-50 border border-neutral-250 rounded-lg text-xs font-semibold px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-black focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Cargo</label>
                  <select
                    value={manualPartCargo}
                    onChange={e => setManualPartCargo(e.target.value as any)}
                    className="w-full bg-neutral-50 border border-neutral-250 rounded-lg text-xs font-semibold px-3 py-2.5 focus:outline-none cursor-pointer"
                  >
                    <option value="Assessor">Assessor</option>
                    <option value="Consultor">Consultor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Equipe</label>
                  <input
                    type="text"
                    value={manualPartEquipe}
                    onChange={e => setManualPartEquipe(e.target.value)}
                    placeholder="Ex: Equipe Sul"
                    className="w-full bg-neutral-50 border border-neutral-250 rounded-lg text-xs font-semibold px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-black focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Status Inicial</label>
                  <select
                    value={manualPartStatus}
                    onChange={e => setManualPartStatus(e.target.value as any)}
                    className="w-full bg-neutral-50 border border-neutral-250 rounded-lg text-xs font-semibold px-3 py-2.5 focus:outline-none cursor-pointer"
                  >
                    <option value="Ativo">🟢 Ativo</option>
                    <option value="Inativo">🔴 Inativo</option>
                    <option value="Arquivado">📁 Arquivado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Observações / Notas</label>
                  <input
                    type="text"
                    value={manualPartObservacoes}
                    onChange={e => setManualPartObservacoes(e.target.value)}
                    placeholder="Ex: Contratação temporária..."
                    className="w-full bg-neutral-50 border border-neutral-250 rounded-lg text-xs font-semibold px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-black focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingParticipant(false)}
                  className="px-4 py-2 border border-neutral-300 text-neutral-700 text-xs font-bold rounded-xl hover:bg-neutral-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!manualPartName.trim()) {
                      alert('Informe o nome.');
                      return;
                    }
                    const isDuplicate = store.rotationParticipants.some(p => p.name.toLowerCase().trim() === manualPartName.toLowerCase().trim());
                    if (isDuplicate) {
                      alert(`Já existe um participante cadastrado com o nome "${manualPartName}".`);
                      return;
                    }
                    store.addRotationParticipantManual({
                      name: manualPartName.trim(),
                      cargo: manualPartCargo,
                      equipe: manualPartEquipe.trim() || 'Geral',
                      status: manualPartStatus,
                      observacoes: manualPartObservacoes.trim() || undefined
                    });
                    setIsCreatingParticipant(false);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Cadastrar Participante
                </button>
              </div>
            </div>
          )}

          {/* Editing Panel */}
          {editingParticipantId && (() => {
            const p = store.rotationParticipants.find(part => part.id === editingParticipantId);
            if (!p) return null;
            return (
              <div className="bg-white rounded-xl border border-blue-200 p-5 space-y-4 shadow-sm animate-fade-in">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                  <h4 className="text-xs font-black text-neutral-850 uppercase tracking-wider">Editar Participante</h4>
                  <button 
                    type="button" 
                    onClick={() => setEditingParticipantId(null)}
                    className="text-xs font-bold text-neutral-400 hover:text-red-650 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Nome completo</label>
                    <input
                      type="text"
                      value={manualPartName}
                      onChange={e => setManualPartName(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-250 rounded-lg text-xs font-semibold px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-black focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Cargo</label>
                    <select
                      value={manualPartCargo}
                      onChange={e => setManualPartCargo(e.target.value as any)}
                      className="w-full bg-neutral-50 border border-neutral-250 rounded-lg text-xs font-semibold px-3 py-2.5 focus:outline-none cursor-pointer"
                    >
                      <option value="Assessor">Assessor</option>
                      <option value="Consultor">Consultor</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Equipe</label>
                    <input
                      type="text"
                      value={manualPartEquipe}
                      onChange={e => setManualPartEquipe(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-250 rounded-lg text-xs font-semibold px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-black focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Status</label>
                    <select
                      value={manualPartStatus}
                      onChange={e => setManualPartStatus(e.target.value as any)}
                      className="w-full bg-neutral-50 border border-neutral-250 rounded-lg text-xs font-semibold px-3 py-2.5 focus:outline-none cursor-pointer"
                    >
                      <option value="Ativo">🟢 Ativo</option>
                      <option value="Inativo">🔴 Inativo</option>
                      <option value="Arquivado">📁 Arquivado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Observações / Notas</label>
                    <input
                      type="text"
                      value={manualPartObservacoes}
                      onChange={e => setManualPartObservacoes(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-250 rounded-lg text-xs font-semibold px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-black focus:bg-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingParticipantId(null)}
                    className="px-4 py-2 border border-neutral-300 text-neutral-700 text-xs font-bold rounded-xl hover:bg-neutral-50 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!manualPartName.trim()) {
                        alert('Nome é obrigatório.');
                        return;
                      }
                      store.updateRotationParticipant(editingParticipantId, {
                        name: manualPartName.trim(),
                        cargo: manualPartCargo,
                        equipe: manualPartEquipe.trim(),
                        status: manualPartStatus,
                        observacoes: manualPartObservacoes.trim() || undefined
                      });
                      setEditingParticipantId(null);
                    }}
                    className="px-4 py-2 bg-blue-650 hover:bg-blue-750 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Association Panel */}
          {associatingParticipantId && (() => {
            const p = store.rotationParticipants.find(part => part.id === associatingParticipantId);
            if (!p) return null;
            return (
              <div className="bg-white rounded-xl border border-purple-200 p-5 space-y-4 shadow-sm animate-fade-in">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                  <h4 className="text-xs font-black text-neutral-805 uppercase tracking-wider">Associar "{p.name}" com Cadastro Oficial</h4>
                  <button 
                    type="button" 
                    onClick={() => setAssociatingParticipantId(null)}
                    className="text-xs font-bold text-neutral-400 hover:text-red-650 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                
                <p className="text-xs text-neutral-500 leading-relaxed font-medium">
                  Selecione o profissional cadastrado oficialmente no sistema para vincular a este participante manual. 
                  Todos os vínculos com SDRs, históricos de distribuições e dados estatísticos serão **preservados**, atualizando apenas a origem do cadastro para <strong>Oficial</strong>.
                </p>

                <div className="max-w-md text-left">
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Membro Oficial Elegível</label>
                  <select
                    id={`select-association-target-${p.id}`}
                    className="w-full bg-neutral-50 border border-neutral-250 rounded-lg text-xs font-semibold px-3 py-2.5 focus:outline-none cursor-pointer focus:bg-white"
                    defaultValue=""
                  >
                    <option value="" disabled>Escolha um profissional oficial...</option>
                    {availableOfficialsForAssociation.map(o => (
                      <option key={o.id} value={o.id}>
                        {o.name} ({o.team || o.equipe || 'Geral'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setAssociatingParticipantId(null)}
                    className="px-4 py-2 border border-neutral-300 text-neutral-700 text-xs font-bold rounded-xl hover:bg-neutral-50 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const sel = document.getElementById(`select-association-target-${p.id}`) as HTMLSelectElement | null;
                      if (!sel || !sel.value) {
                        alert('Selecione um profissional oficial para associar.');
                        return;
                      }
                      store.associateRotationParticipantWithOfficial(associatingParticipantId, sel.value);
                      setAssociatingParticipantId(null);
                      alert('Associação realizada com sucesso! O participante agora é Oficial.');
                    }}
                    className="px-4 py-2 bg-purple-650 hover:bg-purple-750 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Confirmar Associação
                  </button>
                </div>
              </div>
            );
          })()}

          {/* 2. Search and Filters bar for participants */}
          <div className="bg-white border border-neutral-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3.5" />
              <input
                type="text"
                placeholder="Pesquisar participantes por nome ou notas..."
                value={pSearchQuery}
                onChange={e => setPSearchQuery(e.target.value)}
                className="w-full bg-neutral-50 hover:bg-neutral-100/55 focus:bg-white border border-neutral-250 rounded-lg text-xs px-10 py-3 focus:outline-none focus:ring-1 focus:ring-black font-medium transition-colors"
              />
            </div>

            <div className="flex flex-wrap gap-2.5">
              <div>
                <select
                  value={pRoleFilter}
                  onChange={e => setPRoleFilter(e.target.value)}
                  className="bg-neutral-50 hover:bg-neutral-100 border border-neutral-250 rounded-lg text-xs px-3 py-3 focus:outline-none focus:ring-1 focus:ring-black font-semibold cursor-pointer"
                >
                  <option value="TODOS">Qualquer Cargo</option>
                  <option value="Assessor">Assessor</option>
                  <option value="Consultor">Consultor</option>
                </select>
              </div>

              <div>
                <select
                  value={pStatusFilter}
                  onChange={e => setPStatusFilter(e.target.value)}
                  className="bg-neutral-50 hover:bg-neutral-100 border border-neutral-250 rounded-lg text-xs px-3 py-3 focus:outline-none focus:ring-1 focus:ring-black font-semibold cursor-pointer"
                >
                  <option value="TODOS">Qualquer Status</option>
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                  <option value="Arquivado">Arquivado</option>
                </select>
              </div>

              <div>
                <select
                  value={pOriginFilter}
                  onChange={e => setPOriginFilter(e.target.value)}
                  className="bg-neutral-50 hover:bg-neutral-100 border border-neutral-250 rounded-lg text-xs px-3 py-3 focus:outline-none focus:ring-1 focus:ring-black font-semibold cursor-pointer"
                >
                  <option value="TODOS">Qualquer Origem</option>
                  <option value="Oficial">Oficial</option>
                  <option value="Manual">Manual</option>
                </select>
              </div>

              <div>
                <select
                  value={pTeamFilter}
                  onChange={e => setPTeamFilter(e.target.value)}
                  className="bg-neutral-50 hover:bg-neutral-100 border border-neutral-250 rounded-lg text-xs px-3 py-3 focus:outline-none focus:ring-1 focus:ring-black font-semibold cursor-pointer"
                  disabled={isLeader}
                >
                  <option value="TODAS">Qualquer Equipe</option>
                  {availableTeams.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 3. Grid of participants */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredParticipantsForManagement.map(p => {
              const sdrLinksCount = store.matches.filter(m => m.assessorId === p.id || m.assessorId === p.officialId).length;
              return (
                <div 
                  key={p.id} 
                  className={`bg-white rounded-2xl border p-5 flex flex-col justify-between space-y-4 shadow-3xs relative transition-all ${
                    p.status === 'Inativo' ? 'opacity-65 border-neutral-200' : p.status === 'Arquivado' ? 'opacity-50 border-dashed border-neutral-300 bg-neutral-50/50' : 'border-neutral-200 hover:border-neutral-300 hover:shadow-2xs'
                  }`}
                >
                  <div className="space-y-3 text-left">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-neutral-105 border border-neutral-200 flex items-center justify-center font-bold text-neutral-800 text-xs shrink-0">
                          {p.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <h4 className="text-xs font-black text-neutral-950 uppercase tracking-tight truncate" title={p.name}>{p.name}</h4>
                          <span className="text-[9px] text-neutral-450 font-mono">ID: {p.id.substring(0, 8)}...</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1 items-end shrink-0">
                        <span className={`text-[8px] px-1.5 py-0.5 border rounded font-mono font-black uppercase tracking-wider ${
                          p.cadastroType === 'Manual' 
                            ? 'bg-amber-50 text-amber-700 border-amber-300' 
                            : 'bg-indigo-50 text-indigo-700 border-indigo-300'
                        }`}>
                          {p.cadastroType}
                        </span>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          p.status === 'Ativo' 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                            : p.status === 'Inativo'
                              ? 'bg-rose-50 text-rose-600 border border-rose-200'
                              : 'bg-neutral-105 text-neutral-500 border border-neutral-200'
                        }`}>
                          {p.status}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 bg-neutral-50 p-2.5 rounded-lg border border-neutral-100 text-xs text-neutral-600">
                      <div className="flex justify-between">
                        <span>Cargo:</span>
                        <strong className="text-neutral-900 font-bold uppercase">{p.cargo}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Equipe:</span>
                        <strong className="text-neutral-900 uppercase">{p.equipe || 'Geral'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Filas de SDR:</span>
                        <strong className="text-neutral-900 font-mono font-black">{sdrLinksCount} sdr(s)</strong>
                      </div>
                      {p.observacoes && (
                        <div className="mt-1 pt-1.5 border-t border-neutral-200 text-[10px] text-neutral-500 italic truncate" title={p.observacoes}>
                          Obs: "{p.observacoes}"
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-100">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingParticipantId(p.id);
                        setAssociatingParticipantId(null);
                        setIsCreatingParticipant(false);
                        setManualPartName(p.name);
                        setManualPartCargo(p.cargo);
                        setManualPartEquipe(p.equipe || '');
                        setManualPartStatus(p.status);
                        setManualPartObservacoes(p.observacoes || '');
                      }}
                      className="px-3 py-2 border border-neutral-250 hover:bg-neutral-50 text-neutral-700 hover:text-black rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer text-center font-bold"
                    >
                      Editar
                    </button>

                    {p.cadastroType === 'Manual' ? (
                      <button
                        type="button"
                        onClick={() => {
                          setAssociatingParticipantId(p.id);
                          setEditingParticipantId(null);
                          setIsCreatingParticipant(false);
                        }}
                        className="px-3 py-2 bg-purple-50 text-purple-750 border border-purple-200 hover:bg-purple-100 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer text-center font-bold"
                      >
                        🔗 Associar Oficial
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          const nextStatus = p.status === 'Arquivado' ? 'Ativo' : 'Arquivado';
                          store.updateRotationParticipant(p.id, { status: nextStatus });
                        }}
                        className={`px-3 py-2 border rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer text-center font-bold ${
                          p.status === 'Arquivado'
                            ? 'bg-neutral-100 border-neutral-350 text-neutral-600 hover:bg-neutral-200'
                            : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                        }`}
                      >
                        {p.status === 'Arquivado' ? 'Desarquivar' : 'Arquivar'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredParticipantsForManagement.length === 0 && (
              <div className="col-span-full bg-white border-2 border-neutral-250 border-dashed rounded-2xl p-12 text-center space-y-4">
                <div className="w-12 h-12 bg-neutral-50 rounded-full flex items-center justify-center border border-neutral-200 mx-auto text-neutral-400">
                  <Users className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">Nenhum participante encontrado</h3>
                  <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed">
                    Tente alterar os filtros de status, cargo ou origem de cadastro para listar outros profissionais.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Limits Settings Modal (Inline overlay-card if active) */}
      {editingLimitMatchId && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white rounded-2xl border border-neutral-300 shadow-xl max-w-md w-full p-6 space-y-5 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-sm font-black text-neutral-900 uppercase tracking-tight flex items-center gap-2">
                <Settings className="w-4 h-4 text-neutral-800" />
                Configurar Limites de Leads
              </h3>
              <button
                type="button"
                onClick={() => setEditingLimitMatchId(null)}
                className="text-neutral-400 hover:text-neutral-700 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-neutral-500">
              Defina o volume máximo de clientes/leads que este assessor comercial pode receber a partir da fila do SDR selecionado. Deixe em <strong>0</strong> para que não exista limite.
            </p>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[9px] font-bold text-neutral-500 uppercase mb-1">
                  Máximo de Leads por Dia
                </label>
                <input
                  type="number"
                  min="0"
                  value={limitMaxDia}
                  onChange={e => setLimitMaxDia(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-neutral-50 border border-neutral-250 rounded-lg text-xs font-semibold px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-neutral-500 uppercase mb-1">
                  Máximo de Leads por Semana
                </label>
                <input
                  type="number"
                  min="0"
                  value={limitMaxSemana}
                  onChange={e => setLimitMaxSemana(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-neutral-50 border border-neutral-250 rounded-lg text-xs font-semibold px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-neutral-500 uppercase mb-1">
                  Máximo de Clientes Simultâneos
                </label>
                <input
                  type="number"
                  min="0"
                  value={limitMaxSimultaneos}
                  onChange={e => setLimitMaxSimultaneos(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-neutral-50 border border-neutral-250 rounded-lg text-xs font-semibold px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setEditingLimitMatchId(null)}
                className="px-4 py-2.5 border border-neutral-300 text-neutral-700 text-xs font-bold rounded-xl hover:bg-neutral-50 cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleSaveLimits}
                className="px-4 py-2.5 bg-black hover:bg-neutral-900 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Salvar Limites
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Distribution Notification Success Overlay */}
      {distributionSuccessMessage && (
        <div className="fixed bottom-6 right-6 bg-neutral-900 text-white rounded-xl border border-neutral-800 shadow-xl p-4 max-w-sm z-50 flex items-start gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-left">
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400">Distribuição Realizada!</h4>
            <p className="text-xs text-neutral-300 leading-normal">{distributionSuccessMessage}</p>
          </div>
        </div>
      )}

      {mainTab === 'history' && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs text-left space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-100 pb-3 gap-4">
          <div className="flex gap-4">
            <button
              onClick={() => setHistoryTab('rotation-actions')}
              className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                historyTab === 'rotation-actions'
                  ? 'border-black text-black'
                  : 'border-transparent text-neutral-400 hover:text-neutral-700'
              }`}
            >
              👥 Operações do Rodízio ({store.rotationHistoryLogs ? store.rotationHistoryLogs.length : 0})
            </button>
            <button
              onClick={() => setHistoryTab('distributions')}
              className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                historyTab === 'distributions'
                  ? 'border-black text-black'
                  : 'border-transparent text-neutral-400 hover:text-neutral-700'
              }`}
            >
              📊 Distribuições Efetivadas
            </button>
            <button
              onClick={() => setHistoryTab('auditing')}
              className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                historyTab === 'auditing'
                  ? 'border-black text-black'
                  : 'border-transparent text-neutral-400 hover:text-neutral-700'
              }`}
            >
              🛡️ Auditoria de Vínculos
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Pesquisar no histórico..."
              value={historySearch}
              onChange={e => setHistorySearch(e.target.value)}
              className="bg-neutral-50 hover:bg-neutral-100 focus:bg-white border border-neutral-250 rounded-lg text-[10px] pl-8 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-black font-semibold"
            />
          </div>
        </div>

        {historyTab === 'rotation-actions' && (
          <div className="space-y-2">
            <p className="text-[10px] text-neutral-500">
              Histórico completo de ações de cadastro, vinculação manual de assessores e operações administrativas executadas no rodízio de SDRs.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50 text-neutral-500 font-mono font-bold uppercase text-[9px] border-b border-neutral-200">
                    <th className="p-3">Data/Hora</th>
                    <th className="p-3">Operação</th>
                    <th className="p-3">Detalhamento</th>
                    <th className="p-3">Responsável</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {store.rotationHistoryLogs && store.rotationHistoryLogs
                    .filter(log => {
                      if (!historySearch.trim()) return true;
                      const q = historySearch.toLowerCase();
                      return (
                        log.operation.toLowerCase().includes(q) ||
                        log.details.toLowerCase().includes(q) ||
                        log.user.toLowerCase().includes(q)
                      );
                    })
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map((log, idx) => (
                      <tr key={log.id || idx} className="hover:bg-neutral-50/50">
                        <td className="p-3 font-mono font-bold text-neutral-500 whitespace-nowrap">
                          {formatFullTimestamp(log.timestamp)}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-neutral-100 border border-neutral-200 rounded text-[9px] font-mono font-black uppercase text-neutral-700 whitespace-nowrap">
                            {log.operation}
                          </span>
                        </td>
                        <td className="p-3 text-neutral-800 font-medium">
                          {log.details}
                        </td>
                        <td className="p-3 font-mono font-bold text-neutral-500 whitespace-nowrap">
                          {log.user}
                        </td>
                      </tr>
                    ))}

                  {(!store.rotationHistoryLogs || store.rotationHistoryLogs.length === 0) && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-xs text-neutral-400 font-mono">
                        Nenhum registro de operações manuais no rodízio.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {historyTab === 'distributions' && (
          <div className="space-y-2">
            <p className="text-[10px] text-neutral-500">
              Histórico persistido e auditável de todas as simulações e distribuições automáticas efetuadas na aplicação. <strong>Estes registros nunca são excluídos.</strong>
            </p>
            
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50 text-neutral-500 font-mono font-bold uppercase text-[9px] border-b border-neutral-200">
                    <th className="p-3">Data/Hora</th>
                    <th className="p-3">SDR Origem</th>
                    <th className="p-3">Cliente / Lead</th>
                    <th className="p-3">Assessor Comercial Destinatário</th>
                    <th className="p-3">Regra Utilizada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {aggregatedDistributionLogs
                    .filter(log => {
                      if (!historySearch.trim()) return true;
                      const q = historySearch.toLowerCase();
                      return (
                        log.sdrName.toLowerCase().includes(q) ||
                        log.clientName.toLowerCase().includes(q) ||
                        log.assessorName.toLowerCase().includes(q) ||
                        (log.explanation && log.explanation.toLowerCase().includes(q))
                      );
                    })
                    .map((log, idx) => (
                      <tr key={log.id || idx} className="hover:bg-neutral-50/50">
                        <td className="p-3 font-mono font-bold text-neutral-500">
                          {formatFullTimestamp(log.timestamp)}
                        </td>
                        <td className="p-3 font-black text-neutral-800 uppercase">
                          {log.sdrName}
                        </td>
                        <td className="p-3 text-neutral-700">
                          {log.clientName}
                        </td>
                        <td className="p-3 font-black text-neutral-800 uppercase">
                          {log.assessorName}
                        </td>
                        <td className="p-3 text-neutral-600">
                          <span className="px-2 py-0.5 bg-neutral-100 border border-neutral-200 rounded text-[10px] font-mono font-bold uppercase">
                            {log.explanation || log.mode || 'Round Robin'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  
                  {aggregatedDistributionLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-xs text-neutral-400 font-mono">
                        Nenhuma distribuição efetuada ainda no período selecionado. Use o botão "Distribuir Lead" no card de qualquer SDR para simular uma distribuição.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {historyTab === 'auditing' && (
          <div className="space-y-2">
            <p className="text-[10px] text-neutral-500">
              Histórico de auditoria de configurações. Rastreabilidade completa de ações de alteração de vínculos, mudança de ordem, ativação/inativação de membros e definição de limites.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50 text-neutral-500 font-mono font-bold uppercase text-[9px] border-b border-neutral-200">
                    <th className="p-3">Data/Hora</th>
                    <th className="p-3">SDR</th>
                    <th className="p-3">Operador</th>
                    <th className="p-3">Ação / Operação</th>
                    <th className="p-3">Antes</th>
                    <th className="p-3">Depois</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {aggregatedAuditLogs
                    .filter(log => {
                      if (!historySearch.trim()) return true;
                      const q = historySearch.toLowerCase();
                      return (
                        log.sdrName.toLowerCase().includes(q) ||
                        log.user.toLowerCase().includes(q) ||
                        log.operation.toLowerCase().includes(q) ||
                        (log.before && log.before.toLowerCase().includes(q)) ||
                        (log.after && log.after.toLowerCase().includes(q))
                      );
                    })
                    .map((log, idx) => (
                      <tr key={log.id || idx} className="hover:bg-neutral-50/50">
                        <td className="p-3 font-mono font-bold text-neutral-500">
                          {formatFullTimestamp(log.timestamp)}
                        </td>
                        <td className="p-3 font-black text-neutral-800 uppercase">
                          {log.sdrName}
                        </td>
                        <td className="p-3 font-semibold text-neutral-700">
                          {log.user}
                        </td>
                        <td className="p-3 font-mono text-[10px] text-neutral-600 uppercase font-bold">
                          {log.operation}
                        </td>
                        <td className="p-3 text-red-600 font-mono text-[10px]">
                          {log.before || '-'}
                        </td>
                        <td className="p-3 text-emerald-700 font-mono text-[10px] font-bold">
                          {log.after || '-'}
                        </td>
                      </tr>
                    ))}
                  
                  {aggregatedAuditLogs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-xs text-neutral-400 font-mono">
                        Nenhuma alteração de configuração registrada neste período.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    )}

    </div>
  );
}
