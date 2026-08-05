import React, { useState, useMemo } from 'react';
import useAppStore from '../store/useAppStore';
import { useSDRMetrics } from '../hooks/useSDRMetrics';
import { SDR, SDRMonthlyRecord } from '../types';
import { 
  Users, Phone, FileText, Trash2, Edit3, Target, Plus, Calendar, 
  BarChart2, Check, Info, User, X, Save, TrendingUp, Sparkles, AlertTriangle
} from 'lucide-react';

interface ActiveMembersSectionProps {
  onViewProfile?: (type: 'sdr', id: string) => void;
}

export default function ActiveMembersSection({ onViewProfile }: ActiveMembersSectionProps) {
  const { 
    currentMonth, 
    updateSDR, 
    deleteSDR,
    addSDR,
    sdrs = [],
    teams = [],
    currentUser,
    leaders = [],
    setActiveTab
  } = useAppStore();

  const { derivedSdrsForActiveMonth } = useSDRMetrics();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const allowedTeams = useMemo(() => ['PF', 'PJ', 'Advisor'], []);
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>(() => {
    if (currentUser?.role === 'leader' && currentUser.teamName) {
      return currentUser.teamName;
    }
    return 'PF';
  });

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);

  // Ficha (Full Profile) Edit Modal
  const [editingFichaSdr, setEditingFichaSdr] = useState<SDR | null>(null);
  const [fichaName, setFichaName] = useState('');
  const [fichaTeam, setFichaTeam] = useState('PF');
  const [fichaRole, setFichaRole] = useState('SDR Outbound');
  const [fichaAdmissionDate, setFichaAdmissionDate] = useState('');
  const [fichaActive, setFichaActive] = useState(true);
  const [fichaPhotoUrl, setFichaPhotoUrl] = useState('');
  const [fichaLeaderId, setFichaLeaderId] = useState('');
  const [fichaProfileNotes, setFichaProfileNotes] = useState('');
  
  // Progress (Avanço) Edit Modal
  const [editingProgressSdr, setEditingProgressSdr] = useState<SDR | null>(null);
  const [editCalls, setEditCalls] = useState<number>(0);
  const [editAgendamentos, setEditAgendamentos] = useState<number>(0);
  const [editEfetivacoes, setEditEfetivacoes] = useState<number>(0);
  const [editContasAbertas, setEditContasAbertas] = useState<number>(0);

  // Goal (Metas) Edit Modal
  const [editingGoalSdr, setEditingGoalSdr] = useState<SDR | null>(null);
  const [targetCalls, setTargetCalls] = useState<number>(250);
  const [targetAgendamentos, setTargetAgendamentos] = useState<number>(20);
  const [targetEfetivacoes, setTargetEfetivacoes] = useState<number>(10);
  const [targetContasAbertas, setTargetContasAbertas] = useState<number>(5);

  // Add SDR Form State
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'SDR Outbound' | 'SDR Inbound' | 'SDR Enterprise' | 'SDR PF' | 'SDR PJ'>('SDR Outbound');
  const [newAdmissionDate, setNewAdmissionDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newTeam, setNewTeam] = useState(selectedTeamFilter !== 'TODAS' ? selectedTeamFilter : 'PF');
  const [newLeaderId, setNewLeaderId] = useState<string>('');

  // Handle Open Ficha Edit
  const handleOpenEditFicha = (sdr: SDR) => {
    setEditingFichaSdr(sdr);
    setFichaName(sdr.name || '');
    setFichaTeam(sdr.team || 'PF');
    setFichaRole(sdr.professionalProfile || 'SDR Outbound');
    setFichaAdmissionDate(sdr.admissionDate || new Date().toISOString().split('T')[0]);
    setFichaActive(sdr.active !== false);
    setFichaPhotoUrl(sdr.photo || '');
    setFichaLeaderId(sdr.leaderId || sdr.liderId || '');
    setFichaProfileNotes(sdr.professionalProfile || '');
  };

  // Save Ficha Edit
  const handleSaveFicha = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFichaSdr) return;

    updateSDR(editingFichaSdr.id, {
      name: fichaName.trim(),
      team: fichaTeam,
      professionalProfile: fichaRole,
      admissionDate: fichaAdmissionDate,
      active: fichaActive,
      photo: fichaPhotoUrl,
      leaderId: fichaLeaderId,
      liderId: fichaLeaderId
    });

    setEditingFichaSdr(null);
  };

  // SDR List for current team & search
  const filteredSdrs = useMemo(() => {
    let list = derivedSdrsForActiveMonth.filter(s => s.active);

    // Filter by team
    if (selectedTeamFilter && selectedTeamFilter !== 'TODAS') {
      list = list.filter(s => (s.team || s.equipe || '') === selectedTeamFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s => 
        s.name.toLowerCase().includes(q) || 
        (s.professionalProfile && s.professionalProfile.toLowerCase().includes(q)) ||
        (s.team && s.team.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [derivedSdrsForActiveMonth, selectedTeamFilter, searchQuery]);

  // Handle Quick Edit Progress (Avanço) Open
  const handleOpenEditProgress = (sdr: SDR) => {
    const record = sdr.monthlyRecords?.[currentMonth];
    setEditingProgressSdr(sdr);
    setEditCalls(record?.callsCount ?? sdr.callsCount ?? 0);
    setEditAgendamentos(record?.agendamentosCount ?? sdr.agendamentosCount ?? 0);
    setEditEfetivacoes(record?.efetivacoesCount ?? sdr.efetivacoesCount ?? 0);
    setEditContasAbertas(record?.contasAbertasCount ?? sdr.contasAbertasCount ?? 0);
  };

  // Save Progress (Avanço)
  const handleSaveProgress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProgressSdr) return;

    const sdrObj = sdrs.find(s => s.id === editingProgressSdr.id);
    if (!sdrObj) return;

    const records = { ...(sdrObj.monthlyRecords || {}) };
    records[currentMonth] = {
      ...records[currentMonth],
      callsCount: Number(editCalls),
      agendamentosCount: Number(editAgendamentos),
      efetivacoesCount: Number(editEfetivacoes),
      contasAbertasCount: Number(editContasAbertas),
      metaAgendamentos: sdrObj.metaAgendamentos || 20,
      metaEfetivacoes: sdrObj.metaEfetivacoes || 10,
      metaContasAbertas: sdrObj.metaContasAbertas || 5,
      metaLigacoes: sdrObj.metaLigacoes || 250
    } as SDRMonthlyRecord;

    updateSDR(editingProgressSdr.id, {
      callsCount: Number(editCalls),
      agendamentosCount: Number(editAgendamentos),
      efetivacoesCount: Number(editEfetivacoes),
      contasAbertasCount: Number(editContasAbertas),
      monthlyRecords: records
    });

    setEditingProgressSdr(null);
  };

  // Handle Goal Editing Open
  const handleOpenEditGoal = (sdr: SDR) => {
    setEditingGoalSdr(sdr);
    setTargetCalls(sdr.metaLigacoes || 250);
    setTargetAgendamentos(sdr.metaAgendamentos || 20);
    setTargetEfetivacoes(sdr.metaEfetivacoes || 10);
    setTargetContasAbertas(sdr.metaContasAbertas || 5);
  };

  // Save Goal Editing
  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGoalSdr) return;

    const sdrObj = sdrs.find(s => s.id === editingGoalSdr.id);
    if (!sdrObj) return;

    const records = { ...(sdrObj.monthlyRecords || {}) };
    const currRecord = records[currentMonth] || {
      agendamentosCount: sdrObj.agendamentosCount || 0,
      efetivacoesCount: sdrObj.efetivacoesCount || 0,
      contasAbertasCount: sdrObj.contasAbertasCount || 0,
      callsCount: sdrObj.callsCount || 0,
    };

    records[currentMonth] = {
      ...currRecord,
      metaLigacoes: Number(targetCalls),
      metaAgendamentos: Number(targetAgendamentos),
      metaEfetivacoes: Number(targetEfetivacoes),
      metaContasAbertas: Number(targetContasAbertas)
    } as SDRMonthlyRecord;

    updateSDR(editingGoalSdr.id, {
      metaLigacoes: Number(targetCalls),
      metaAgendamentos: Number(targetAgendamentos),
      metaEfetivacoes: Number(targetEfetivacoes),
      metaContasAbertas: Number(targetContasAbertas),
      monthlyRecords: records
    });

    setEditingGoalSdr(null);
  };

  // Handle Delete SDR
  const handleDeleteSdr = (sdr: SDR) => {
    if (window.confirm(`Tem certeza de que deseja excluir o SDR "${sdr.name}" da equipe?`)) {
      deleteSDR(sdr.id);
    }
  };

  // Handle Add SDR Form
  const handleAddSdrSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      alert('Por favor, informe o nome do SDR.');
      return;
    }

    const initialRecords: Record<string, SDRMonthlyRecord> = {};
    initialRecords[currentMonth] = {
      agendamentosCount: 0,
      efetivacoesCount: 0,
      contasAbertasCount: 0,
      callsCount: 0,
      metaAgendamentos: Number(targetAgendamentos),
      metaEfetivacoes: Number(targetEfetivacoes),
      metaEfetivacaoRate: 50,
      metaContasAbertas: Number(targetContasAbertas),
      metaLigacoes: Number(targetCalls)
    };

    addSDR({
      name: newName.trim(),
      team: newTeam,
      equipe: newTeam,
      active: true,
      admissionDate: newAdmissionDate,
      professionalProfile: newRole,
      leaderId: newLeaderId || undefined,
      liderId: newLeaderId || undefined,
      metaAgendamentos: Number(targetAgendamentos),
      metaEfetivacoes: Number(targetEfetivacoes),
      metaEfetivacaoRate: 50,
      metaContasAbertas: Number(targetContasAbertas),
      metaLigacoes: Number(targetCalls),
      callsCount: 0,
      agendamentosCount: 0,
      efetivacoesCount: 0,
      contasAbertasCount: 0,
      photo: newPhotoUrl || undefined,
      monthlyRecords: initialRecords
    });

    setNewName('');
    setNewPhotoUrl('');
    setShowAddModal(false);
  };

  // Month portuguese name helper
  const getMonthNamePortuguese = (monthStr: string) => {
    const parts = monthStr.split('-');
    if (parts.length < 2) return monthStr;
    const map: Record<string, string> = {
      '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
      '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
      '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro'
    };
    return `${map[parts[1]] || 'Competência'} / ${parts[0]}`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6" id="sdr-management-wrapper">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 rounded-md">
              Módulo Comercial SDR
            </span>
            <span className="text-xs font-semibold text-neutral-500">
              {getMonthNamePortuguese(currentMonth)}
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-neutral-900 mt-1 flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-500" /> Gestão de Equipe SDR
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Acompanhe o desempenho dos SDRs, defina metas operacionais, edite avanços e gerencie a equipe comercial.
          </p>
        </div>

        {/* TOP ACTIONS */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setActiveTab('central-metas')}
            className="flex items-center gap-1.5 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold rounded-xl border border-neutral-200 transition cursor-pointer"
          >
            <Target className="w-4 h-4 text-amber-600" /> Central de Metas
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Cadastrar SDR
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-neutral-50 p-4 rounded-xl border border-neutral-200">
        
        {/* TEAM SELECTOR */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider mr-1 shrink-0">
            Equipe:
          </span>
          {currentUser?.role === 'leader' ? (
            <span className="px-3 py-1.5 text-xs font-bold bg-white text-neutral-900 rounded-lg border border-neutral-200 shadow-2xs">
              👥 {currentUser.teamName || currentUser.equipe}
            </span>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setSelectedTeamFilter('TODAS')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                  selectedTeamFilter === 'TODAS'
                    ? 'bg-neutral-900 text-white shadow-2xs'
                    : 'bg-white text-neutral-600 hover:bg-neutral-200 border border-neutral-200'
                }`}
              >
                Todas
              </button>
              {allowedTeams.map((tName) => (
                <button
                  key={tName}
                  type="button"
                  onClick={() => setSelectedTeamFilter(tName)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all whitespace-nowrap ${
                    selectedTeamFilter === tName
                      ? 'bg-neutral-900 text-white shadow-2xs'
                      : 'bg-white text-neutral-600 hover:bg-neutral-200 border border-neutral-200'
                  }`}
                >
                  👥 {tName}
                </button>
              ))}
            </>
          )}
        </div>

        {/* SEARCH INPUT */}
        <div className="relative min-w-[220px]">
          <input
            type="text"
            placeholder="Buscar por nome ou função..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <Users className="w-4 h-4 text-neutral-400 absolute left-2.5 top-2 pointer-events-none" />
        </div>
      </div>

      {/* SDR TEAM MEMBERS LIST */}
      {filteredSdrs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
          <Users className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-neutral-800">Nenhum SDR encontrado</h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            Não existem colaboradores ativos nesta equipe para o filtro selecionado.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Cadastrar SDR
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSdrs.map((sdr) => {
            const record = sdr.monthlyRecords?.[currentMonth] || {
              callsCount: sdr.callsCount || 0,
              agendamentosCount: sdr.agendamentosCount || 0,
              efetivacoesCount: sdr.efetivacoesCount || 0,
              contasAbertasCount: sdr.contasAbertasCount || 0,
              metaAgendamentos: sdr.metaAgendamentos || 20,
              metaEfetivacoes: sdr.metaEfetivacoes || 10,
              metaContasAbertas: sdr.metaContasAbertas || 5,
              metaLigacoes: sdr.metaLigacoes || 250
            };

            const calls = record.callsCount ?? 0;
            const agendamentos = record.agendamentosCount ?? 0;
            const efetivacoes = record.efetivacoesCount ?? 0;
            const contasAbertas = record.contasAbertasCount ?? 0;

            const mCalls = record.metaLigacoes || 250;
            const mAgendamentos = record.metaAgendamentos || 20;
            const mEfetivacoes = record.metaEfetivacoes || 10;
            const mContasAbertas = record.metaContasAbertas || 5;

            // Compute overall Pacing against agendamentos target
            const pacingAgendamentos = mAgendamentos > 0 ? Math.round((agendamentos / mAgendamentos) * 100) : 0;

            return (
              <div 
                key={sdr.id} 
                className="bg-white rounded-2xl border border-neutral-200 shadow-xs hover:border-neutral-300 transition-all flex flex-col justify-between overflow-hidden"
              >
                {/* SDR CARD HEADER */}
                <div className="p-5 border-b border-neutral-100 bg-linear-to-r from-neutral-50/50 to-white">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-amber-200 bg-amber-50 shrink-0 flex items-center justify-center font-bold text-amber-700 text-base">
                        {sdr.photo ? (
                          <img src={sdr.photo} alt={sdr.name} className="w-full h-full object-cover" />
                        ) : (
                          sdr.name.substring(0, 2).toUpperCase()
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-neutral-900 text-sm">{sdr.name}</h3>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide bg-neutral-100 text-neutral-700 rounded border border-neutral-200">
                            {sdr.professionalProfile || 'SDR'}
                          </span>
                          <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide bg-amber-50 text-amber-800 rounded border border-amber-100">
                            👥 {sdr.team || 'Equipe PF'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* DELETE BUTTON */}
                    <button
                      onClick={() => handleDeleteSdr(sdr)}
                      className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                      title="Excluir SDR"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* PACING PROGRESS BAR */}
                  <div className="mt-4 pt-3 border-t border-neutral-100">
                    <div className="flex justify-between items-center text-xs font-semibold mb-1">
                      <span className="text-neutral-500 text-[11px]">Atingimento de Agendamentos</span>
                      <span className={`font-black ${pacingAgendamentos >= 100 ? 'text-green-600' : 'text-amber-600'}`}>
                        {pacingAgendamentos}%
                      </span>
                    </div>
                    <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${pacingAgendamentos >= 100 ? 'bg-green-500' : 'bg-amber-500'}`}
                        style={{ width: `${Math.min(pacingAgendamentos, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* SDR METRICS GRID */}
                <div className="p-5 grid grid-cols-2 gap-3 bg-white">
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 block flex items-center gap-1">
                      <Phone className="w-3 h-3 text-neutral-400" /> Ligações
                    </span>
                    <span className="text-base font-black text-neutral-900 mt-1 block">
                      {calls} <span className="text-xs font-normal text-neutral-400">/ {mCalls}</span>
                    </span>
                  </div>

                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 block flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-amber-500" /> Agendamentos
                    </span>
                    <span className="text-base font-black text-neutral-900 mt-1 block">
                      {agendamentos} <span className="text-xs font-normal text-neutral-400">/ {mAgendamentos}</span>
                    </span>
                  </div>

                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 block flex items-center gap-1">
                      <Check className="w-3 h-3 text-green-500" /> Efetivações
                    </span>
                    <span className="text-base font-black text-neutral-900 mt-1 block">
                      {efetivacoes} <span className="text-xs font-normal text-neutral-400">/ {mEfetivacoes}</span>
                    </span>
                  </div>

                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 block flex items-center gap-1">
                      <BarChart2 className="w-3 h-3 text-blue-500" /> Contas Abertas
                    </span>
                    <span className="text-base font-black text-neutral-900 mt-1 block">
                      {contasAbertas} <span className="text-xs font-normal text-neutral-400">/ {mContasAbertas}</span>
                    </span>
                  </div>
                </div>

                {/* SDR CARD ACTIONS FOOTER */}
                <div className="p-4 border-t border-neutral-100 bg-neutral-50/50 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleOpenEditFicha(sdr)}
                    className="flex-1 min-w-[100px] flex items-center justify-center gap-1.5 py-2 px-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-2xs"
                    title="Editar Ficha do SDR (Nome, Time, Cargo, Admissão)"
                  >
                    <User className="w-3.5 h-3.5" /> Editar Ficha
                  </button>

                  <button
                    onClick={() => handleOpenEditProgress(sdr)}
                    className="flex-1 min-w-[100px] flex items-center justify-center gap-1.5 py-2 px-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-2xs"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-amber-400" /> Avanço
                  </button>

                  <button
                    onClick={() => handleOpenEditGoal(sdr)}
                    className="flex-1 min-w-[100px] flex items-center justify-center gap-1.5 py-2 px-2 bg-white hover:bg-neutral-100 text-neutral-800 text-xs font-bold rounded-xl border border-neutral-200 transition cursor-pointer"
                  >
                    <Target className="w-3.5 h-3.5 text-neutral-500" /> Metas
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: EDITAR AVANÇO (PROGRESS EDITOR) */}
      {editingProgressSdr && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 max-w-md w-full overflow-hidden">
            <div className="p-5 border-b border-neutral-100 bg-neutral-50 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider">
                  Editar Entregas Realizadas
                </span>
                <h3 className="text-base font-bold text-neutral-900 mt-0.5">
                  {editingProgressSdr.name}
                </h3>
              </div>
              <button 
                onClick={() => setEditingProgressSdr(null)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProgress} className="p-5 space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0 text-amber-600" />
                Sua alteração atualizará o histórico de entregas do mês {getMonthNamePortuguese(currentMonth)}.
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-neutral-600 uppercase block mb-1">
                    Ligações Realizadas
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editCalls}
                    onChange={(e) => setEditCalls(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-600 uppercase block mb-1">
                    Reuniões Agendadas
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editAgendamentos}
                    onChange={(e) => setEditAgendamentos(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-600 uppercase block mb-1">
                    Reuniões Realizadas (Efetivações)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editEfetivacoes}
                    onChange={(e) => setEditEfetivacoes(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-600 uppercase block mb-1">
                    Contas Abertas / Indicações
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editContasAbertas}
                    onChange={(e) => setEditContasAbertas(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingProgressSdr(null)}
                  className="px-4 py-2 text-xs font-bold text-neutral-600 hover:bg-neutral-100 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" /> Salvar Avanço
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DEFINIR METAS (GOALS EDITOR) */}
      {editingGoalSdr && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 max-w-md w-full overflow-hidden">
            <div className="p-5 border-b border-neutral-100 bg-neutral-50 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider">
                  Definir Metas do SDR
                </span>
                <h3 className="text-base font-bold text-neutral-900 mt-0.5">
                  {editingGoalSdr.name}
                </h3>
              </div>
              <button 
                onClick={() => setEditingGoalSdr(null)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="p-5 space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-neutral-600 uppercase block mb-1">
                    Meta de Ligações Realizadas
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={targetCalls}
                    onChange={(e) => setTargetCalls(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-600 uppercase block mb-1">
                    Meta de Reuniões Agendadas
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={targetAgendamentos}
                    onChange={(e) => setTargetAgendamentos(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-600 uppercase block mb-1">
                    Meta de Reuniões Realizadas (Efetivações)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={targetEfetivacoes}
                    onChange={(e) => setTargetEfetivacoes(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-600 uppercase block mb-1">
                    Meta de Contas Abertas
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={targetContasAbertas}
                    onChange={(e) => setTargetContasAbertas(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingGoalSdr(null)}
                  className="px-4 py-2 text-xs font-bold text-neutral-600 hover:bg-neutral-100 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" /> Salvar Metas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CADASTRAR SDR */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 max-w-md w-full overflow-hidden">
            <div className="p-5 border-b border-neutral-100 bg-neutral-50 flex justify-between items-center">
              <h3 className="text-base font-bold text-neutral-900">
                Novo Membro SDR
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSdrSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-neutral-600 uppercase block mb-1">
                  Nome do SDR
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Lucas Silva"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-600 uppercase block mb-1">
                  Função / Subperfil
                </label>
                <select
                  value={newRole}
                  onChange={(e: any) => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white font-medium"
                >
                  <option value="SDR Outbound">SDR Outbound</option>
                  <option value="SDR Inbound">SDR Inbound</option>
                  <option value="SDR Enterprise">SDR Enterprise</option>
                  <option value="SDR PF">SDR PF</option>
                  <option value="SDR PJ">SDR PJ</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-600 uppercase block mb-1">
                  Equipe
                </label>
                <select
                  value={newTeam}
                  onChange={(e) => setNewTeam(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white font-medium"
                >
                  {allowedTeams.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-600 uppercase block mb-1">
                  Data de Admissão
                </label>
                <input
                  type="date"
                  value={newAdmissionDate}
                  onChange={(e) => setNewAdmissionDate(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-600 uppercase block mb-1">
                  URL da Foto (opcional)
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={newPhotoUrl}
                  onChange={(e) => setNewPhotoUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-4 border-t border-neutral-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-neutral-600 hover:bg-neutral-100 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Cadastrar SDR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR FICHA COMPLETA DO SDR */}
      {editingFichaSdr && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-neutral-100 bg-neutral-50 flex justify-between items-center shrink-0">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider">
                  Ficha do Colaborador
                </span>
                <h3 className="text-base font-bold text-neutral-900 mt-0.5">
                  Editar Ficha — {editingFichaSdr.name}
                </h3>
              </div>
              <button 
                onClick={() => setEditingFichaSdr(null)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFicha} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="text-xs font-bold text-neutral-600 uppercase block mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={fichaName}
                  onChange={(e) => setFichaName(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-600 uppercase block mb-1">
                    Equipe / Time
                  </label>
                  <select
                    value={fichaTeam}
                    onChange={(e) => setFichaTeam(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm font-bold bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {allowedTeams.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-600 uppercase block mb-1">
                    Função / Cargo
                  </label>
                  <select
                    value={fichaRole}
                    onChange={(e) => setFichaRole(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm font-bold bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="SDR Outbound">SDR Outbound</option>
                    <option value="SDR Inbound">SDR Inbound</option>
                    <option value="SDR Enterprise">SDR Enterprise</option>
                    <option value="SDR PF">SDR PF</option>
                    <option value="SDR PJ">SDR PJ</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-600 uppercase block mb-1">
                    Data de Admissão
                  </label>
                  <input
                    type="date"
                    value={fichaAdmissionDate}
                    onChange={(e) => setFichaAdmissionDate(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-600 uppercase block mb-1">
                    Status do SDR
                  </label>
                  <select
                    value={fichaActive ? 'active' : 'inactive'}
                    onChange={(e) => setFichaActive(e.target.value === 'active')}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm font-bold bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="active">🟢 Ativo no Time</option>
                    <option value="inactive">🔴 Inativo / Saída</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-600 uppercase block mb-1">
                  URL da Foto Perfil
                </label>
                <input
                  type="text"
                  value={fichaPhotoUrl}
                  onChange={(e) => setFichaPhotoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-4 border-t border-neutral-100 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingFichaSdr(null)}
                  className="px-4 py-2 text-xs font-bold text-neutral-600 hover:bg-neutral-100 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl shadow cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5 text-amber-400" /> Salvar Ficha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
