import React, { useState, useEffect, useMemo } from 'react';
import useAppStore from '../store/useAppStore';
import { PerformanceGoal, SDR, Assessor } from '../types';
import { 
  Target, Plus, Trash2, Edit3, Save, AlertCircle, 
  Check, Calendar, Users, User, RefreshCw, ArrowUp, ArrowDown, X, Info
} from 'lucide-react';

export const GoalsPlanEditor: React.FC = () => {
  const { 
    sdrs, 
    assessores, 
    teamGoals,
    saveTeamGoalsPlan,
    saveIndividualMonthlyGoals,
    restoreStandardMonthlyGoals,
    currentMonth,
    setCurrentMonth,
    currentUser
  } = useAppStore();

  // 1. Get unique teams
  const uniqueTeams = useMemo(() => {
    const teamsSet = new Set<string>();
    sdrs.forEach(s => {
      if (s.team) teamsSet.add(s.team);
      if (s.equipe) teamsSet.add(s.equipe);
    });
    assessores.forEach(a => {
      if (a.team) teamsSet.add(a.team);
      if (a.equipe) teamsSet.add(a.equipe);
    });
    
    const list = Array.from(teamsSet).filter(Boolean).sort();
    if (list.length === 0) {
      list.push('Equipe Alpha', 'Equipe Beta', 'Equipe do Caio');
    }
    return list;
  }, [sdrs, assessores]);

  // 2. Select default competence and team
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth || '2026-07');
  const [selectedTeam, setSelectedTeam] = useState<string>('');

  // Lock team if user is a leader and not admin
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'leader') {
        const leaderTeam = currentUser.teamName || currentUser.equipe || '';
        if (leaderTeam) {
          setSelectedTeam(leaderTeam);
          return;
        }
      }
    }
    if (uniqueTeams.length > 0 && !selectedTeam) {
      setSelectedTeam(uniqueTeams[0]);
    }
  }, [currentUser, uniqueTeams, selectedTeam]);

  // Synchronize store's currentMonth when we change selection
  useEffect(() => {
    if (selectedMonth && setCurrentMonth) {
      setCurrentMonth(selectedMonth);
    }
  }, [selectedMonth, setCurrentMonth]);

  // 3. Load team default plan
  const defaultTeamGoals = useMemo(() => {
    if (!selectedTeam || !selectedMonth) return [];
    
    const monthlyPlans = teamGoals?.monthlyPlans || {};
    const monthPlans = monthlyPlans[selectedMonth] || {};
    const teamGoalsList = monthPlans[selectedTeam];

    if (Array.isArray(teamGoalsList) && teamGoalsList.length > 0) {
      return teamGoalsList.map((g, idx) => ({ ...g, order: g.order ?? idx }));
    }

    // Base fallback default plans for SDR teams
    const defaultSdrPresets: PerformanceGoal[] = [
      { id: 'ligacoes', name: 'Ligações Efetuadas', target: 300, weight: 20, description: 'Meta de ligações ativas.', order: 0 },
      { id: 'reunioes', name: 'Reuniões Agendadas', target: 20, weight: 30, description: 'Meta de reuniões marcadas.', order: 1 },
      { id: 'comparecimento', name: 'Comparecimento (Efetivadas)', target: 12, weight: 30, description: 'Meta de reuniões realizadas.', order: 2 },
      { id: 'indicacoes', name: 'Contas Abertas (Indicações)', target: 5, weight: 20, description: 'Meta de novas contas indicadas.', order: 3 }
    ];

    return defaultSdrPresets;
  }, [selectedTeam, selectedMonth, teamGoals]);

  // Standard Plan local editing state
  const [teamLocalGoals, setTeamLocalGoals] = useState<any[]>([]);
  useEffect(() => {
    setTeamLocalGoals(JSON.parse(JSON.stringify(defaultTeamGoals)));
  }, [defaultTeamGoals]);

  // 4. Team members list & status for the selected competence
  const teamMembers = useMemo(() => {
    if (!selectedTeam) return [];
    
    const list: any[] = [];
    sdrs.forEach(s => {
      const sTeam = s.team || s.equipe || '';
      if (sTeam === selectedTeam && s.active) {
        list.push({ ...s, isSdr: true });
      }
    });

    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [sdrs, selectedTeam]);

  // Selected collaborator for individual custom exception
  const [selectedCollab, setSelectedCollab] = useState<any | null>(null);
  const [collabLocalGoals, setCollabLocalGoals] = useState<any[]>([]);

  // When collaborator is selected, load their custom goals or copy from team local goals
  const selectCollaboratorForCustomEdit = (member: any) => {
    setSelectedCollab(member);
    const record = member.monthlyRecords?.[selectedMonth];
    const configuredGoals = record?.configuredGoals;

    if (Array.isArray(configuredGoals) && configuredGoals.length > 0) {
      setCollabLocalGoals(JSON.parse(JSON.stringify(configuredGoals)));
    } else {
      // Create a fresh copy of the Team Plano Padrão goals
      setCollabLocalGoals(JSON.parse(JSON.stringify(teamLocalGoals)));
    }
  };

  // 5. Goal editing modal / form helper states
  // Editing state can be either 'team' or 'collab'
  const [editingTarget, setEditingTarget] = useState<'team' | 'collab' | null>(null);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [goalName, setGoalName] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [goalType, setGoalType] = useState('custom');
  const [goalTargetValue, setGoalTargetValue] = useState<number>(0);
  const [goalWeightValue, setGoalWeightValue] = useState<number>(0);

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Start creating or editing a goal
  const openGoalForm = (target: 'team' | 'collab', goal: any | null = null) => {
    setEditingTarget(target);
    if (goal) {
      setEditingGoalId(goal.id || goal.name);
      setGoalName(goal.name);
      setGoalDescription(goal.description || '');
      setGoalType(goal.id || 'custom');
      setGoalTargetValue(goal.target || 0);
      setGoalWeightValue(goal.weight || 0);
    } else {
      setEditingGoalId(null);
      setGoalName('');
      setGoalDescription('');
      setGoalType('custom');
      setGoalTargetValue(10);
      setGoalWeightValue(10);
    }
  };

  const closeGoalForm = () => {
    setEditingTarget(null);
    setEditingGoalId(null);
  };

  // Save the form inputs into local array
  const handleSaveGoalForm = () => {
    if (!goalName.trim()) {
      alert('Por favor, informe o nome da meta.');
      return;
    }

    const currentList = editingTarget === 'team' ? [...teamLocalGoals] : [...collabLocalGoals];
    
    const payload = {
      id: editingGoalId || goalType || `custom-${Date.now()}`,
      name: goalName.trim(),
      description: goalDescription.trim(),
      target: Number(goalTargetValue),
      weight: Number(goalWeightValue),
      order: editingGoalId ? currentList.find(g => (g.id || g.name) === editingGoalId)?.order ?? currentList.length : currentList.length
    };

    let newList;
    if (editingGoalId) {
      newList = currentList.map(g => (g.id || g.name) === editingGoalId ? payload : g);
    } else {
      newList = [...currentList, payload];
    }

    if (editingTarget === 'team') {
      setTeamLocalGoals(newList);
    } else {
      setCollabLocalGoals(newList);
    }

    closeGoalForm();
  };

  // Delete a goal from the local array
  const handleDeleteGoal = (target: 'team' | 'collab', idOrName: string) => {
    if (target === 'team') {
      const newList = teamLocalGoals.filter(g => (g.id || g.name) !== idOrName);
      setTeamLocalGoals(newList);
    } else {
      const newList = collabLocalGoals.filter(g => (g.id || g.name) !== idOrName);
      setCollabLocalGoals(newList);
    }
  };

  // Reorder local goals
  const moveGoal = (target: 'team' | 'collab', index: number, direction: 'up' | 'down') => {
    const list = target === 'team' ? [...teamLocalGoals] : [...collabLocalGoals];
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === list.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    // Refresh orders
    const updated = list.map((g, idx) => ({ ...g, order: idx }));

    if (target === 'team') {
      setTeamLocalGoals(updated);
    } else {
      setCollabLocalGoals(updated);
    }
  };

  // Sum weights
  const totalTeamWeight = useMemo(() => {
    return teamLocalGoals.reduce((sum, g) => sum + (g.weight || 0), 0);
  }, [teamLocalGoals]);

  const totalCollabWeight = useMemo(() => {
    return collabLocalGoals.reduce((sum, g) => sum + (g.weight || 0), 0);
  }, [collabLocalGoals]);

  // Persist Team Plano Padrão to backend/store
  const handlePersistTeamPlan = () => {
    if (totalTeamWeight !== 100) {
      setErrorMsg('A soma dos pesos deve ser exatamente igual a 100% para salvar o plano padrão.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    try {
      saveTeamGoalsPlan(selectedTeam, selectedMonth, teamLocalGoals);
      setSuccessMsg('Plano Padrão da Equipe salvo com sucesso!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(`Erro ao salvar plano: ${err.message || err}`);
    }
  };

  // Persist Collaborator custom plan to store
  const handlePersistCollabPlan = () => {
    if (!selectedCollab) return;
    if (totalCollabWeight !== 100) {
      alert('A soma dos pesos das metas personalizadas deve ser exatamente igual a 100%!');
      return;
    }

    try {
      saveIndividualMonthlyGoals(
        selectedCollab.id,
        selectedCollab.isSdr,
        selectedMonth,
        collabLocalGoals
      );
      
      // Update our selectedCollab local reference to reflect changes
      const updatedCollabs = [...sdrs, ...assessores];
      const match = updatedCollabs.find(c => c.id === selectedCollab.id);
      if (match) {
        setSelectedCollab({ ...match, isSdr: selectedCollab.isSdr });
      }

      alert('Metas personalizadas do colaborador salvas com sucesso!');
      setSelectedCollab(null);
    } catch (err: any) {
      alert(`Erro ao salvar: ${err.message || err}`);
    }
  };

  // Revert custom goals to team's standard plan
  const handleRevertToStandard = (member: any) => {
    const confirmRevert = window.confirm(
      `Deseja realmente restaurar o Plano Padrão para ${member.name}? Todas as customizações para este mês serão apagadas.`
    );
    if (!confirmRevert) return;

    try {
      restoreStandardMonthlyGoals(member.id, member.isSdr, selectedMonth);
      
      // Refresh reference
      if (selectedCollab && selectedCollab.id === member.id) {
        setSelectedCollab(null);
      }
      alert('Plano Padrão restaurado com sucesso para o colaborador!');
    } catch (err: any) {
      alert(`Erro ao restaurar plano: ${err.message || err}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6" id="central-metas-wrapper">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm" id="central-metas-title-block">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Target className="w-7 h-7 text-amber-500" />
            Central de Metas 🎯
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestão unificada e exclusiva de metas de equipe e personalizações individuais.
          </p>
        </div>
        
        {/* Filters Panel */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto" id="central-metas-filters">
          <div className="flex flex-col gap-1 w-full sm:w-auto">
            <span className="text-[10px] uppercase font-bold text-gray-400">Competência</span>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setSelectedCollab(null);
                }}
                className="pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1 w-full sm:w-auto">
            <span className="text-[10px] uppercase font-bold text-gray-400">Equipe</span>
            <div className="relative">
              <Users className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                value={selectedTeam}
                onChange={(e) => {
                  setSelectedTeam(e.target.value);
                  setSelectedCollab(null);
                }}
                disabled={currentUser?.role === 'leader'}
                className="pl-9 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium appearance-none min-w-[180px] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {uniqueTeams.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="central-metas-grid">
        
        {/* LEFT COLUMN: Team's Default Plan (Plano Padrão) */}
        <div className="lg:col-span-7 space-y-6" id="left-plano-padrao-column">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm uppercase tracking-wide">
                  <Target className="w-4 h-4 text-gray-500" />
                  Plano Padrão da Equipe
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Vigente para {selectedTeam} em {selectedMonth.split('-').reverse().join('/')}
                </p>
              </div>

              <button
                onClick={() => openGoalForm('team')}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Nova Meta
              </button>
            </div>

            {/* Total weights validation banner */}
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between text-xs font-semibold">
              <span className="text-gray-600">Soma dos Pesos:</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                totalTeamWeight === 100 
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {totalTeamWeight}% {totalTeamWeight === 100 ? '✓ Válido' : '⚠️ Deve ser 100%'}
              </span>
            </div>

            {/* List of default goals */}
            <div className="p-5 space-y-3">
              {teamLocalGoals.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  <Target className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm font-medium">Nenhuma meta configurada para este plano padrão.</p>
                  <p className="text-xs mt-1">Crie metas para estabelecer as regras do time.</p>
                </div>
              ) : (
                teamLocalGoals.map((g, idx) => (
                  <div 
                    key={g.id || g.name}
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-all gap-4"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 bg-gray-200 text-gray-700 rounded">
                          {(g.weight || 0)}%
                        </span>
                        <h4 className="font-bold text-gray-900 text-sm">{g.name}</h4>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded">
                          Meta: {g.target.toLocaleString('pt-BR')}
                        </span>
                      </div>
                      {g.description && (
                        <p className="text-xs text-gray-500 leading-relaxed max-w-md">{g.description}</p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      <button
                        onClick={() => moveGoal('team', idx, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                        title="Mover para cima"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveGoal('team', idx, 'down')}
                        disabled={idx === teamLocalGoals.length - 1}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                        title="Mover para baixo"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openGoalForm('team', g)}
                        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded"
                        title="Editar"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteGoal('team', g.id || g.name)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Error/Success alerts */}
            {errorMsg && (
              <div className="m-5 p-3.5 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700 flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="m-5 p-3.5 bg-green-50 border border-green-100 rounded-lg text-xs text-green-700 flex items-center gap-2 font-medium">
                <Check className="w-4 h-4 shrink-0 text-green-600" />
                {successMsg}
              </div>
            )}

            {/* Footer action */}
            <div className="p-5 border-t border-gray-100 flex justify-end bg-gray-50/50">
              <button
                onClick={handlePersistTeamPlan}
                disabled={totalTeamWeight !== 100}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-amber-500 rounded-xl hover:bg-amber-600 transition-all cursor-pointer shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                Salvar Plano Padrão da Equipe
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Collaborators list & customized exceptions */}
        <div className="lg:col-span-5 space-y-6" id="right-collaborators-column">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm uppercase tracking-wide">
                <Users className="w-4 h-4 text-gray-500" />
                Membros & Customizações
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Selecione um colaborador para ver ou editar as metas individuais deste mês.
              </p>
            </div>

            <div className="divide-y divide-gray-100">
              {teamMembers.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <User className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-xs font-medium">Nenhum colaborador ativo nesta equipe.</p>
                </div>
              ) : (
                teamMembers.map(m => {
                  const hasCustom = Array.isArray(m.monthlyRecords?.[selectedMonth]?.configuredGoals) && 
                                    m.monthlyRecords[selectedMonth].configuredGoals.length > 0;
                  
                  return (
                    <div key={m.id} className="p-4 hover:bg-gray-50/60 transition-all flex justify-between items-center gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-gray-900">{m.name}</span>
                          <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                            {m.isSdr ? 'SDR' : 'Assessor'}
                          </span>
                        </div>
                        
                        {/* Status badges */}
                        <div className="flex items-center gap-2">
                          {hasCustom ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              Configuração Personalizada
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                              Usa Plano Padrão (Herdado)
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => selectCollaboratorForCustomEdit(m)}
                          className="px-3 py-1.5 text-xs font-bold text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-all cursor-pointer"
                        >
                          Customizar
                        </button>
                        {hasCustom && (
                          <button
                            onClick={() => handleRevertToStandard(m)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                            title="Restaurar Plano Padrão"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>

      {/* MODAL / BOTTOM DRAWER: Edit collaborator's specific plan */}
      {selectedCollab && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Drawer Header */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <span className="text-[10px] uppercase font-black text-amber-500 tracking-wider">Metas Customizadas</span>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-1.5 mt-0.5">
                  <User className="w-5 h-5 text-gray-400" />
                  {selectedCollab.name}
                </h3>
                <p className="text-xs text-gray-500">
                  Customização de metas para o mês {selectedMonth.split('-').reverse().join('/')}
                </p>
              </div>

              <button 
                onClick={() => setSelectedCollab(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Total weight checking for custom */}
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between text-xs font-semibold bg-white">
              <span className="text-gray-600">Soma dos Pesos (Individual):</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                totalCollabWeight === 100 
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {totalCollabWeight}% {totalCollabWeight === 100 ? '✓ Válido' : '⚠️ Deve ser 100%'}
              </span>
            </div>

            {/* List of custom goals */}
            <div className="p-5 space-y-3 overflow-y-auto flex-grow max-h-[50vh]">
              
              <div className="flex justify-end">
                <button
                  onClick={() => openGoalForm('collab')}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-amber-600 border border-amber-200 bg-amber-50 rounded-lg hover:bg-amber-100 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar Meta Exclusiva
                </button>
              </div>

              {collabLocalGoals.map((g, idx) => (
                <div 
                  key={g.id || g.name}
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-gray-50 rounded-lg border border-gray-150 hover:border-gray-250 transition-all gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 bg-gray-200 text-gray-700 rounded">
                        {(g.weight || 0)}%
                      </span>
                      <h4 className="font-bold text-gray-900 text-xs">{g.name}</h4>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded">
                        Meta: {g.target.toLocaleString('pt-BR')}
                      </span>
                    </div>
                    {g.description && (
                      <p className="text-[11px] text-gray-500 leading-relaxed">{g.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 self-end sm:self-auto">
                    <button
                      onClick={() => moveGoal('collab', idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => moveGoal('collab', idx, 'down')}
                      disabled={idx === collabLocalGoals.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => openGoalForm('collab', g)}
                      className="p-1 text-amber-600 hover:bg-amber-50 rounded"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteGoal('collab', g.id || g.name)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer action bar */}
            <div className="p-5 border-t border-gray-100 flex justify-between bg-gray-50">
              <button
                onClick={() => handleRevertToStandard(selectedCollab)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-gray-700 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Restaurar Plano Padrão
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedCollab(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handlePersistCollabPlan}
                  disabled={totalCollabWeight !== 100}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-all cursor-pointer shadow disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  Salvar Metas Personalizadas
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* FORM MODAL: Create or Edit standard/collab Goal Card */}
      {editingTarget && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-md w-full overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h4 className="font-bold text-gray-900 text-sm">
                {editingGoalId ? 'Editar Meta' : 'Adicionar Nova Meta'}
              </h4>
              <button 
                onClick={closeGoalForm}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Nome da Meta</label>
                <input
                  type="text"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  placeholder="Ex: Ligações Realizadas, Reuniões Fechadas..."
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Descrição (opcional)</label>
                <textarea
                  value={goalDescription}
                  onChange={(e) => setGoalDescription(e.target.value)}
                  placeholder="Breve descrição dos critérios de alcance da meta."
                  rows={2}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Meta Alvo</label>
                  <input
                    type="number"
                    value={goalTargetValue}
                    onChange={(e) => setGoalTargetValue(Number(e.target.value))}
                    min={0}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Peso (%)</label>
                  <input
                    type="number"
                    value={goalWeightValue}
                    onChange={(e) => setGoalWeightValue(Number(e.target.value))}
                    min={0}
                    max={100}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Vincular a Indicador</label>
                <select
                  value={goalType}
                  onChange={(e) => setGoalType(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium bg-white"
                >
                  <option value="ligacoes">Ligações (Calls)</option>
                  <option value="reunioes">Reuniões Agendadas</option>
                  <option value="comparecimento">Reuniões Realizadas (Comparecimento)</option>
                  <option value="indicacoes">Indicações (Contas Abertas)</option>
                  <option value="net">Volume Financeiro (Net)</option>
                  <option value="cross_sell">Venda Cruzada (Cross Sell)</option>
                  <option value="custom">Outro (Indicador Customizado / Manual)</option>
                </select>
                <span className="text-[10px] text-gray-400 mt-0.5 flex items-start gap-1">
                  <Info className="w-3 h-3 shrink-0 mt-0.5 text-gray-400" />
                  Fazer este vínculo permite que os resultados sejam integrados dinamicamente com o dashboard.
                </span>
              </div>

            </div>

            <div className="p-5 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
              <button
                onClick={closeGoalForm}
                className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all cursor-pointer"
              >
                Voltar
              </button>
              <button
                onClick={handleSaveGoalForm}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-all cursor-pointer shadow"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
