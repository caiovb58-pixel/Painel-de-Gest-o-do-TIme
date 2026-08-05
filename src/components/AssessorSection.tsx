import React, { useState } from 'react';
import { Assessor, SDR, AuthUser } from '../types';
import { 
  Users, Plus, Trash2, ToggleLeft, ToggleRight, X, 
  User, Edit2, Check, AlertTriangle, Info, Link, RefreshCcw, 
  Filter, Phone, Calendar, Briefcase, UserPlus, TrendingUp, 
  Sparkles, Award, Shield, CheckCircle2, ChevronDown, ChevronUp, Clock, FileText, Lock
} from 'lucide-react';

interface AssessorSectionProps {
  assessores: Assessor[];
  sdrs: SDR[];
  onAddAssessor: (assessor: Omit<Assessor, 'id'>) => void;
  onDeleteAssessor: (id: string) => void;
  onToggleActiveAssessor: (id: string) => void;
  onUpdateAssessor: (id: string, updatedFields: Partial<Assessor>) => void;
  teams: string[];
  currentUser: AuthUser;
  onViewProfile?: (type: 'sdr' | 'assessor' | 'consultor', id: string) => void;
}

const ASSESSOR_TEAMS = ['Tier 3 A', 'Tier 3 B', 'Tier 3 C', 'Tier 3 D', 'Tier 2', 'Tier 1'];
const CONSULTOR_TEAMS = ['Consultoria'];
const ALL_ASSESSOR_CONSULTOR_TEAMS = [...ASSESSOR_TEAMS, ...CONSULTOR_TEAMS];

export default function AssessorSection({
  assessores,
  sdrs,
  onAddAssessor,
  onDeleteAssessor,
  onToggleActiveAssessor,
  onUpdateAssessor,
  teams,
  currentUser,
  onViewProfile,
}: AssessorSectionProps) {
  const isAdmin = currentUser.role === 'admin';

  // State handles for adding new assessor / consultant
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [agendaLink, setAgendaLink] = useState('');
  const [team, setTeam] = useState(() => {
    if (currentUser?.role === 'leader' && currentUser.teamName) {
      return currentUser.teamName;
    }
    return 'Tier 3 A';
  });
  const [exclusiveSdrIds, setExclusiveSdrIds] = useState<string[]>([]);
  const [participatesInRotation, setParticipatesInRotation] = useState(true);
  const [roleType, setRoleType] = useState<'assessor' | 'consultor'>('assessor');
  const [admissionDate, setAdmissionDate] = useState(new Date().toISOString().substring(0, 10));
  const [professionalProfile, setProfessionalProfile] = useState('Comercial');
  const [error, setError] = useState('');

  // Auto-sync team select option when roleType changes (only if admin)
  React.useEffect(() => {
    if (currentUser?.role === 'leader' && currentUser.teamName) {
      setTeam(currentUser.teamName);
      return;
    }
    if (roleType === 'assessor') {
      setTeam('Tier 3 A');
    } else {
      setTeam('Consultoria');
    }
  }, [roleType, currentUser]);

  // Primary goals states
  const [metaLigacoes, setMetaLigacoes] = useState(0);
  const [metaReunioesAgendadas, setMetaReunioesAgendadas] = useState(0);
  const [metaReunioesRealizadas, setMetaReunioesRealizadas] = useState(0);
  const [metaContasAbertas, setMetaContasAbertas] = useState(0);
  const [metaNet, setMetaNet] = useState(0);
  const [metaCrossSell, setMetaCrossSell] = useState(0);

  const [realizadoLigacoes, setRealizadoLigacoes] = useState(0);
  const [realizadoReunioesAgendadas, setRealizadoReunioesAgendadas] = useState(0);
  const [realizadoReunioesRealizadas, setRealizadoReunioesRealizadas] = useState(0);
  const [realizadoContasAbertas, setRealizadoContasAbertas] = useState(0);
  const [realizadoNet, setRealizadoNet] = useState(0);
  const [realizadoCrossSell, setRealizadoCrossSell] = useState(0);

  // Detailed Cross Sell Goals & Results
  const [crossSellSeguroMeta, setCrossSellSeguroMeta] = useState(1);
  const [crossSellSeguroRealizado, setCrossSellSeguroRealizado] = useState(0);
  const [crossSellConsorcioMeta, setCrossSellConsorcioMeta] = useState(1);
  const [crossSellConsorcioRealizado, setCrossSellConsorcioRealizado] = useState(0);
  const [crossSellContabilidadeMeta, setCrossSellContabilidadeMeta] = useState(1);
  const [crossSellContabilidadeRealizado, setCrossSellContabilidadeRealizado] = useState(0);
  const [crossSellPlanoSaudeMeta, setCrossSellPlanoSaudeMeta] = useState(1);
  const [crossSellPlanoSaudeRealizado, setCrossSellPlanoSaudeRealizado] = useState(0);
  const [crossSellCambioMeta, setCrossSellCambioMeta] = useState(0);
  const [crossSellCambioRealizado, setCrossSellCambioRealizado] = useState(0);
  const [crossSellOutrosMeta, setCrossSellOutrosMeta] = useState(0);
  const [crossSellOutrosRealizado, setCrossSellOutrosRealizado] = useState(0);

  // Editing state handles
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editAgendaLink, setEditAgendaLink] = useState('');
  const [editTeam, setEditTeam] = useState('');
  const [editExclusiveSdrIds, setEditExclusiveSdrIds] = useState<string[]>([]);
  const [editParticipatesInRotation, setEditParticipatesInRotation] = useState(true);
  const [editRoleType, setEditRoleType] = useState<'assessor' | 'consultor'>('assessor');
  const [editAdmissionDate, setEditAdmissionDate] = useState('');
  const [editProfessionalProfile, setEditProfessionalProfile] = useState('');
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [editPhoto, setEditPhoto] = useState<string | undefined>(undefined);

  // Dynamic metrics list for monitor
  const [customMetrics, setCustomMetrics] = useState<{key: string; name: string; target: number; real: number;}[]>([
    { key: 'ligacoes', name: 'Ligações', target: 0, real: 0 },
    { key: 'agendadas', name: 'Agendadas', target: 0, real: 0 },
    { key: 'realizadas', name: 'Realizadas', target: 0, real: 0 },
    { key: 'contas_abertas', name: 'Contas Abertas', target: 0, real: 0 },
    { key: 'net', name: 'NET Captação', target: 0, real: 0 },
    { key: 'cross_sell', name: 'Cross-Sell', target: 0, real: 0 },
  ]);
  const [editCustomMetrics, setEditCustomMetrics] = useState<{key: string; name: string; target: number; real: number;}[]>([]);

  // Auto-sync editTeam select option when editRoleType changes
  React.useEffect(() => {
    if (editingId) {
      if (editRoleType === 'assessor') {
        if (!ASSESSOR_TEAMS.includes(editTeam)) {
          setEditTeam('Tier 3 A');
        }
      } else {
        if (!CONSULTOR_TEAMS.includes(editTeam)) {
          setEditTeam('Consultoria');
        }
      }
    }
  }, [editRoleType, editingId]);

  // Editing goals states
  const [editMetaLigacoes, setEditMetaLigacoes] = useState(0);
  const [editMetaReunioesAgendadas, setEditMetaReunioesAgendadas] = useState(0);
  const [editMetaReunioesRealizadas, setEditMetaReunioesRealizadas] = useState(0);
  const [editMetaContasAbertas, setEditMetaContasAbertas] = useState(0);
  const [editMetaNet, setEditMetaNet] = useState(0);
  const [editMetaCrossSell, setEditMetaCrossSell] = useState(0);

  const [editRealizadoLigacoes, setEditRealizadoLigacoes] = useState(0);
  const [editRealizadoReunioesAgendadas, setEditRealizadoReunioesAgendadas] = useState(0);
  const [editRealizadoReunioesRealizadas, setEditRealizadoReunioesRealizadas] = useState(0);
  const [editRealizadoContasAbertas, setEditRealizadoContasAbertas] = useState(0);
  const [editRealizadoNet, setEditRealizadoNet] = useState(0);
  const [editRealizadoCrossSell, setEditRealizadoCrossSell] = useState(0);

  // Editing cross products
  const [editCrossSellSeguroMeta, setEditCrossSellSeguroMeta] = useState(1);
  const [editCrossSellSeguroRealizado, setEditCrossSellSeguroRealizado] = useState(0);
  const [editCrossSellConsorcioMeta, setEditCrossSellConsorcioMeta] = useState(1);
  const [editCrossSellConsorcioRealizado, setEditCrossSellConsorcioRealizado] = useState(0);
  const [editCrossSellContabilidadeMeta, setEditCrossSellContabilidadeMeta] = useState(1);
  const [editCrossSellContabilidadeRealizado, setEditCrossSellContabilidadeRealizado] = useState(0);
  const [editCrossSellPlanoSaudeMeta, setEditCrossSellPlanoSaudeMeta] = useState(1);
  const [editCrossSellPlanoSaudeRealizado, setEditCrossSellPlanoSaudeRealizado] = useState(0);
  const [editCrossSellCambioMeta, setEditCrossSellCambioMeta] = useState(0);
  const [editCrossSellCambioRealizado, setEditCrossSellCambioRealizado] = useState(0);
  const [editCrossSellOutrosMeta, setEditCrossSellOutrosMeta] = useState(0);
  const [editCrossSellOutrosRealizado, setEditCrossSellOutrosRealizado] = useState(0);

  // UI state
  const [expandedPerformanceId, setExpandedPerformanceId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<'all' | 'assessor' | 'consultor'>('all');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('all');
  const [showOnlyMyTeam, setShowOnlyMyTeam] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const activeSDRs = sdrs.filter(s => s.active);

  const getMetricVal = (metricsList: {key: string; name: string; target: number; real: number;}[], key: string, field: 'target' | 'real') => {
    const found = metricsList.find(m => m.key === key);
    return found ? found[field] : 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nome do profissional é obrigatório');
      return;
    }

    const mList = customMetrics;
    const finalMetaLigacoes = getMetricVal(mList, 'ligacoes', 'target');
    const finalRealizadoLigacoes = getMetricVal(mList, 'ligacoes', 'real');
    const finalMetaAgendadas = getMetricVal(mList, 'agendadas', 'target');
    const finalRealizadoAgendadas = getMetricVal(mList, 'agendadas', 'real');
    const finalMetaRealizadas = getMetricVal(mList, 'realizadas', 'target');
    const finalRealizadoRealizadas = getMetricVal(mList, 'realizadas', 'real');
    const finalMetaContas = getMetricVal(mList, 'contas_abertas', 'target');
    const finalRealizadoContas = getMetricVal(mList, 'contas_abertas', 'real');
    const finalMetaNet = getMetricVal(mList, 'net', 'target');
    const finalRealizadoNetResult = getMetricVal(mList, 'net', 'real');
    const finalMetaCross = getMetricVal(mList, 'cross_sell', 'target');
    const finalRealizadoCross = getMetricVal(mList, 'cross_sell', 'real');

    onAddAssessor({
      name: name.trim(),
      active: true,
      agendaLink: agendaLink.trim(),
      exclusiveSdrId: exclusiveSdrIds[0] || '',
      exclusiveSdrIds: exclusiveSdrIds,
      participatesInRotation: exclusiveSdrIds.length > 0 ? false : participatesInRotation,
      team: team,
      roleType: roleType,
      admissionDate: admissionDate,
      professionalProfile: professionalProfile,
      photo: photo,
      
      // Core Metrics & Goals
      metaLigacoes: finalMetaLigacoes,
      metaReunioesAgendadas: finalMetaAgendadas,
      metaReunioesRealizadas: finalMetaRealizadas,
      metaContasAbertas: finalMetaContas,
      metaNet: finalMetaNet,
      metaCrossSell: finalMetaCross,

      realizadoLigacoes: finalRealizadoLigacoes,
      realizadoReunioesAgendadas: finalRealizadoAgendadas,
      realizadoReunioesRealizadas: finalRealizadoRealizadas,
      realizadoContasAbertas: finalRealizadoContas,
      realizadoNet: finalRealizadoNetResult,
      realizadoCrossSell: finalRealizadoCross,

      // Cross sell details
      crossSellSeguroMeta,
      crossSellSeguroRealizado,
      crossSellConsorcioMeta,
      crossSellConsorcioRealizado,
      crossSellContabilidadeMeta,
      crossSellContabilidadeRealizado,
      crossSellPlanoSaudeMeta,
      crossSellPlanoSaudeRealizado,
      crossSellCambioMeta,
      crossSellCambioRealizado,
      crossSellOutrosMeta,
      crossSellOutrosRealizado,
      
      // Legacy params
      captacaoMes: finalRealizadoNetResult,
      crossSellCount: finalRealizadoCross,
      crossSellDetails: `Seguro: ${realizadoCrossSellSeguro}, Consórcio: ${realizadoCrossSellConsorcio}`,
      customMonitorMetrics: customMetrics
    });

    // Reset fields
    setName('');
    setAgendaLink('');
    setExclusiveSdrIds([]);
    setParticipatesInRotation(true);
    if (currentUser?.role === 'leader' && currentUser.teamName) {
      setTeam(currentUser.teamName);
    } else {
      setTeam('Tier 3 A');
    }
    setRoleType('assessor');
    setAdmissionDate(new Date().toISOString().substring(0, 10));
    setProfessionalProfile('Comercial');
    setError('');
    
    setMetaLigacoes(0);
    setMetaReunioesAgendadas(0);
    setMetaReunioesRealizadas(0);
    setMetaContasAbertas(0);
    setMetaNet(0);
    setMetaCrossSell(0);

    setRealizadoLigacoes(0);
    setRealizadoReunioesAgendadas(0);
    setRealizadoReunioesRealizadas(0);
    setRealizadoContasAbertas(0);
    setRealizadoNet(0);
    setRealizadoCrossSell(0);

    setCrossSellSeguroMeta(1);
    setCrossSellSeguroRealizado(0);
    setCrossSellConsorcioMeta(1);
    setCrossSellConsorcioRealizado(0);
    setCrossSellContabilidadeMeta(1);
    setCrossSellContabilidadeRealizado(0);
    setCrossSellPlanoSaudeMeta(1);
    setCrossSellPlanoSaudeRealizado(0);
    setCrossSellCambioMeta(0);
    setCrossSellCambioRealizado(0);
    setCrossSellOutrosMeta(0);
    setCrossSellOutrosRealizado(0);
    setPhoto(undefined);

    setCustomMetrics([
      { key: 'ligacoes', name: 'Ligações', target: 0, real: 0 },
      { key: 'agendadas', name: 'Agendadas', target: 0, real: 0 },
      { key: 'realizadas', name: 'Realizadas', target: 0, real: 0 },
      { key: 'contas_abertas', name: 'Contas Abertas', target: 0, real: 0 },
      { key: 'net', name: 'NET Captação', target: 0, real: 0 },
      { key: 'cross_sell', name: 'Cross-Sell', target: 0, real: 0 },
    ]);

    setIsAdding(false);
  };

  const handleStartEdit = (assessor: Assessor) => {
    setEditingId(assessor.id);
    setEditName(assessor.name);
    setEditAgendaLink(assessor.agendaLink || '');
    setEditTeam(assessor.team || 'Equipe Alpha');
    setEditRoleType(assessor.roleType || 'assessor');
    setEditAdmissionDate(assessor.admissionDate || new Date().toISOString().substring(0, 10));
    setEditProfessionalProfile(assessor.professionalProfile || 'Comercial');
    setEditPhoto(assessor.photo);
    
    let existingIds: string[] = [];
    if (Array.isArray(assessor.exclusiveSdrIds)) {
      existingIds = [...assessor.exclusiveSdrIds];
    } else if (assessor.exclusiveSdrId) {
      existingIds = [assessor.exclusiveSdrId];
    }
    setEditExclusiveSdrIds(existingIds);
    setEditParticipatesInRotation(assessor.participatesInRotation !== false);

    // Populate goals
    setEditMetaLigacoes(assessor.metaLigacoes || 0);
    setEditMetaReunioesAgendadas(assessor.metaReunioesAgendadas || 0);
    setEditMetaReunioesRealizadas(assessor.metaReunioesRealizadas || 0);
    setEditMetaContasAbertas(assessor.metaContasAbertas || 0);
    setEditMetaNet(assessor.metaNet || 0);
    setEditMetaCrossSell(assessor.metaCrossSell || 0);

    setEditRealizadoLigacoes(assessor.realizadoLigacoes || 0);
    setEditRealizadoReunioesAgendadas(assessor.realizadoReunioesAgendadas || 0);
    setEditRealizadoReunioesRealizadas(assessor.realizadoReunioesRealizadas || 0);
    setEditRealizadoContasAbertas(assessor.realizadoContasAbertas || 0);
    setEditRealizadoNet(assessor.realizadoNet || 0);
    setEditRealizadoCrossSell(assessor.realizadoCrossSell || 0);

    setEditCrossSellSeguroMeta(assessor.crossSellSeguroMeta || 1);
    setEditCrossSellSeguroRealizado(assessor.crossSellSeguroRealizado || 0);
    setEditCrossSellConsorcioMeta(assessor.crossSellConsorcioMeta || 1);
    setEditCrossSellConsorcioRealizado(assessor.crossSellConsorcioRealizado || 0);
    setEditCrossSellContabilidadeMeta(assessor.crossSellContabilidadeMeta || 1);
    setEditCrossSellContabilidadeRealizado(assessor.crossSellContabilidadeRealizado || 0);
    setEditCrossSellPlanoSaudeMeta(assessor.crossSellPlanoSaudeMeta || 1);
    setEditCrossSellPlanoSaudeRealizado(assessor.crossSellPlanoSaudeRealizado || 0);
    setEditCrossSellCambioMeta(assessor.crossSellCambioMeta || 0);
    setEditCrossSellCambioRealizado(assessor.crossSellCambioRealizado || 0);
    setEditCrossSellOutrosMeta(assessor.crossSellOutrosMeta || 0);
    setEditCrossSellOutrosRealizado(assessor.crossSellOutrosRealizado || 0);

    const existingCustomMetrics = assessor.customMonitorMetrics || [
      { key: 'ligacoes', name: 'Ligações', target: assessor.metaLigacoes || 0, real: assessor.realizadoLigacoes || 0 },
      { key: 'agendadas', name: 'Agendadas', target: assessor.metaReunioesAgendadas || 0, real: assessor.realizadoReunioesAgendadas || 0 },
      { key: 'realizadas', name: 'Realizadas', target: assessor.metaReunioesRealizadas || 0, real: assessor.realizadoReunioesRealizadas || 0 },
      { key: 'contas_abertas', name: 'Contas Abertas', target: assessor.metaContasAbertas || 0, real: assessor.realizadoContasAbertas || 0 },
      { key: 'net', name: 'NET Captação', target: assessor.metaNet || 0, real: assessor.realizadoNet || 0 },
      { key: 'cross_sell', name: 'Cross-Sell', target: assessor.metaCrossSell || 0, real: assessor.realizadoCrossSell || 0 },
    ];
    setEditCustomMetrics(existingCustomMetrics);
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) return;

    const mList = editCustomMetrics;
    const finalMetaLigacoes = getMetricVal(mList, 'ligacoes', 'target');
    const finalRealizadoLigacoes = getMetricVal(mList, 'ligacoes', 'real');
    const finalMetaAgendadas = getMetricVal(mList, 'agendadas', 'target');
    const finalRealizadoAgendadas = getMetricVal(mList, 'agendadas', 'real');
    const finalMetaRealizadas = getMetricVal(mList, 'realizadas', 'target');
    const finalRealizadoRealizadas = getMetricVal(mList, 'realizadas', 'real');
    const finalMetaContas = getMetricVal(mList, 'contas_abertas', 'target');
    const finalRealizadoContas = getMetricVal(mList, 'contas_abertas', 'real');
    const finalMetaNet = getMetricVal(mList, 'net', 'target');
    const finalRealizadoNetResult = getMetricVal(mList, 'net', 'real');
    const finalMetaCross = getMetricVal(mList, 'cross_sell', 'target');
    const finalRealizadoCross = getMetricVal(mList, 'cross_sell', 'real');

    if (onUpdateAssessor) {
      onUpdateAssessor(id, {
        name: editName.trim(),
        agendaLink: editAgendaLink.trim(),
        team: editTeam,
        exclusiveSdrId: editExclusiveSdrIds[0] || '',
        exclusiveSdrIds: editExclusiveSdrIds,
        participatesInRotation: editExclusiveSdrIds.length > 0 ? false : editParticipatesInRotation,
        roleType: editRoleType,
        admissionDate: editAdmissionDate,
        professionalProfile: editProfessionalProfile,
        photo: editPhoto,

        metaLigacoes: finalMetaLigacoes,
        metaReunioesAgendadas: finalMetaAgendadas,
        metaReunioesRealizadas: finalMetaRealizadas,
        metaContasAbertas: finalMetaContas,
        metaNet: finalMetaNet,
        metaCrossSell: finalMetaCross,

        realizadoLigacoes: finalRealizadoLigacoes,
        realizadoReunioesAgendadas: finalRealizadoAgendadas,
        realizadoReunioesRealizadas: finalRealizadoRealizadas,
        realizadoContasAbertas: finalRealizadoContas,
        realizadoNet: finalRealizadoNetResult,
        realizadoCrossSell: finalRealizadoCross,

        crossSellSeguroMeta: Number(editCrossSellSeguroMeta),
        crossSellSeguroRealizado: Number(editCrossSellSeguroRealizado),
        crossSellConsorcioMeta: Number(editCrossSellConsorcioMeta),
        crossSellConsorcioRealizado: Number(editCrossSellConsorcioRealizado),
        crossSellContabilidadeMeta: Number(editCrossSellContabilidadeMeta),
        crossSellContabilidadeRealizado: Number(editCrossSellContabilidadeRealizado),
        crossSellPlanoSaudeMeta: Number(editCrossSellPlanoSaudeMeta),
        crossSellPlanoSaudeRealizado: Number(editCrossSellPlanoSaudeRealizado),
        crossSellCambioMeta: Number(editCrossSellCambioMeta),
        crossSellCambioRealizado: Number(editCrossSellCambioRealizado),
        crossSellOutrosMeta: Number(editCrossSellOutrosMeta),
        crossSellOutrosRealizado: Number(editCrossSellOutrosRealizado),
        customMonitorMetrics: editCustomMetrics
      });
    }
    setEditingId(null);
  };

  // Derived filters
  const filteredByRole = typeFilter === 'all' 
    ? assessores 
    : assessores.filter(a => a.roleType === typeFilter || (!a.roleType && typeFilter === 'assessor'));

  const filteredByMyTeam = (currentUser && currentUser.role === 'leader' && currentUser.teamName && showOnlyMyTeam)
    ? filteredByRole.filter(a => a.team === currentUser.teamName)
    : filteredByRole;

  const finalFiltered = selectedTeamFilter === 'all'
    ? filteredByMyTeam
    : filteredByMyTeam.filter(a => a.team === selectedTeamFilter);

  // Counts
  const totalAssessores = assessores.filter(a => !a.roleType || a.roleType === 'assessor').length;
  const totalConsultores = assessores.filter(a => a.roleType === 'consultor').length;

  // Render variables for safe calculations
  const realizadoCrossSellSeguro = crossSellSeguroRealizado;
  const realizadoCrossSellConsorcio = crossSellConsorcioRealizado;

  // Render custom metric progress bar
  const renderProgressBar = (value: number, max: number, isMoney = false) => {
    const percentage = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
    const formattedValue = isMoney 
      ? `R$ ${(value / 1000).toFixed(0)}k` 
      : value.toString();
    const formattedMax = isMoney 
      ? `R$ ${(max / 1000).toFixed(0)}k` 
      : max.toString();

    return (
      <div className="space-y-1">
        <div className="flex justify-between text-[11px] font-mono">
          <span className="text-neutral-500">Progresso</span>
          <span className="text-neutral-800 font-extrabold">{formattedValue} / {formattedMax} ({percentage}%)</span>
        </div>
        <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden border border-neutral-200">
          <div 
            className={`h-full rounded-full transition-all duration-300 ${
              percentage >= 100 ? 'bg-emerald-600' : 'bg-neutral-800'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  // --- RENDERING SHARED VIEW FOR NON-ADMIN AND NON-LEADER USERS (READ-ONLY CALENDAR & ROTATION LIST) ---
  const isLeader = currentUser.role === 'leader';
  if (!isAdmin && !isLeader) {
    return (
      <div className="space-y-6">
        {/* Header Read Only Panel */}
        <div className="bg-white rounded-xl border border-neutral-200/90 p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-sm font-black text-neutral-900 tracking-tight flex items-center gap-2 font-display uppercase">
              <Users className="w-4.5 h-4.5 text-neutral-850" />
              Agendas & Rodízio Compartilhado
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Visualização de controle rápida de links de agendamentos e prontidão de rodízio para Assessores & Consultores parceiros.
            </p>
          </div>
          
          <div className="flex gap-1.5">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                typeFilter === 'all' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
              }`}
            >
              Todos ({assessores.length})
            </button>
            <button
              onClick={() => setTypeFilter('assessor')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                typeFilter === 'assessor' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
              }`}
            >
              Assessores ({totalAssessores})
            </button>
            <button
              onClick={() => setTypeFilter('consultor')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                typeFilter === 'consultor' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
              }`}
            >
              Consultores ({totalConsultores})
            </button>
          </div>
        </div>

        {/* Filters bar */}
        <div className="bg-white border border-neutral-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-neutral-550" />
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Filtrar Canal:</span>
            <div className="flex gap-1 flex-wrap">
              {['all', ...ALL_ASSESSOR_CONSULTOR_TEAMS, ''].map(teamOpt => (
                <button
                  key={teamOpt}
                  onClick={() => setSelectedTeamFilter(teamOpt)}
                  className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold transition-all cursor-pointer ${
                    selectedTeamFilter === teamOpt 
                      ? 'bg-neutral-900 text-white' 
                      : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
                  }`}
                >
                  {teamOpt === 'all' ? 'Todos' : (teamOpt === '' ? 'Sem Equipe' : teamOpt)}
                </button>
              ))}
            </div>
          </div>
          
          <div className="text-[11px] font-semibold text-neutral-500">
            Total exibido: <strong className="text-black font-bold">{finalFiltered.length}</strong> profissionais
          </div>
        </div>

        {/* Read-only Table */}
        <div className="bg-white border border-neutral-250 rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-[10px] font-black uppercase text-neutral-500 tracking-wider">
                <th className="px-6 py-4">Nome Profissional</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Canal / Célula</th>
                <th className="px-6 py-4">Link da Agenda</th>
                <th className="px-6 py-4 text-center">Status de Rodízio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-xs text-neutral-800">
              {finalFiltered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-neutral-400 font-bold uppercase tracking-wide">
                    Nenhum profissional correspondente encontrado
                  </td>
                </tr>
              ) : (
                finalFiltered.map(assr => (
                  <tr key={assr.id} className="hover:bg-neutral-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-black text-white rounded flex items-center justify-center font-black text-[10px]">
                          {assr.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-extrabold text-neutral-900 text-xs">{assr.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-black ${
                        assr.roleType === 'consultor' 
                          ? 'bg-blue-50 text-blue-800 border border-blue-200' 
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {assr.roleType === 'consultor' ? 'Consultor' : 'Assessor'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-neutral-600">{assr.team || 'Sem Equipe'}</span>
                    </td>
                    <td className="px-6 py-4">
                      {assr.agendaLink ? (
                        <a 
                          href={assr.agendaLink.startsWith('http') ? assr.agendaLink : `https://${assr.agendaLink}`}
                          target="_blank" 
                          rel="noreferrer"
                          className="text-neutral-900 font-bold hover:underline inline-flex items-center gap-1 bg-neutral-100 px-2.5 py-1 rounded-lg hover:bg-neutral-200 transition"
                        >
                          <Clock className="w-3.5 h-3.5 text-neutral-650" />
                          <span>Acessar Cronograma</span>
                        </a>
                      ) : (
                        <span className="text-neutral-400 italic">Sem link cadastrado</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {assr.participatesInRotation !== false && !assr.exclusiveSdrIds?.length ? (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Apto para o Rodízio</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-full border border-neutral-300">
                          <X className="w-3.5 h-3.5 text-neutral-400" />
                          <span>Inapto / Fora de Rodízio</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // --- FULL INTERACTIVE ADMINISTRATIVE VIEW (ADMIN ONLY) ---
  return (
    <div className="space-y-6">
      
      {/* Header Info Panel */}
      <div className="bg-white rounded-xl border border-neutral-200/90 p-6 shadow-xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">
        <div>
          <h2 className="text-sm font-bold text-neutral-900 tracking-tight flex items-center gap-2 font-display uppercase">
            <Users className="w-4.5 h-4.5 text-neutral-850" />
            Configuração de Assessores & Consultores de Negócio
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Painel Geral de Gestão do Escritório de Investimentos. Configure metas mensais detalhadas, filtre consultores por segmento, e gerencie calendários e parâmetros de rodízio.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => {
              setRoleType('assessor');
              setIsAdding(!isAdding);
            }}
            className={`px-3.5 py-2.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isAdding && roleType === 'assessor'
                ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-300' 
                : 'bg-black hover:bg-neutral-900 text-white shadow-xs'
            }`}
          >
            {isAdding && roleType === 'assessor' ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            Assessor
          </button>
          
          <button
            onClick={() => {
              setRoleType('consultor');
              setIsAdding(!isAdding);
            }}
            className={`px-3.5 py-2.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isAdding && roleType === 'consultor'
                ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-300' 
                : 'bg-blue-900 hover:bg-blue-950 text-white shadow-xs'
            }`}
          >
            {isAdding && roleType === 'consultor' ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            Consultor
          </button>
        </div>
      </div>

      {/* Addition View Form */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="p-6 bg-white border-2 border-neutral-950 rounded-2xl shadow-xs space-y-6 animate-fade-in">
          <h3 className="text-xs font-black text-neutral-900 uppercase tracking-widest flex items-center gap-1.5">
            <User className="w-4.5 h-4.5 text-neutral-750" />
            Cadastrar Novo {roleType === 'consultor' ? 'Consultor' : 'Assessor'} do Escritório
          </h3>
          
          {error && (
            <div className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg">
              {error}
            </div>
          )}

          {/* BASIC METADATA CONFIGURATION */}
          <div className="bg-neutral-50/50 p-4 border border-neutral-200 rounded-xl space-y-4">
            <h4 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">1. Dados Importantes de Entrada</h4>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  placeholder="Ex: Pedro Alvares (Assessoria)"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs text-black font-bold focus:ring-1 focus:ring-black focus:outline-none"
                  style={{ color: '#000000' }}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  Link de Calendário (Agenda)
                </label>
                <input
                  type="url"
                  placeholder="Ex: https://calendly.com/pedro"
                  value={agendaLink}
                  onChange={e => setAgendaLink(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs font-mono text-black font-bold focus:ring-1 focus:ring-black focus:outline-none"
                  style={{ color: '#000000' }}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  Data de Entrada (Admissão)
                </label>
                <input
                  type="date"
                  value={admissionDate}
                  onChange={e => setAdmissionDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs text-black font-bold focus:outline-none focus:ring-1 focus:ring-black"
                  style={{ color: '#000000' }}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  Célula / Canal
                </label>
                {currentUser?.role === 'leader' ? (
                  <div className="w-full px-3 py-2 bg-neutral-100 border border-neutral-250 rounded-lg text-xs text-neutral-600 font-mono font-black uppercase flex items-center gap-1.5 cursor-not-allowed">
                    🔒 {currentUser.teamName || 'Sua Equipe'}
                  </div>
                ) : (
                  <select
                    value={team}
                    onChange={e => setTeam(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs text-black font-bold focus:outline-none cursor-pointer"
                    style={{ color: '#000000' }}
                  >
                    {(roleType === 'assessor' ? ASSESSOR_TEAMS : CONSULTOR_TEAMS).map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                    <option value="">Sem Equipe</option>
                  </select>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  Foto de Perfil
                </label>
                <div className="flex items-center gap-2 mt-1">
                  {photo ? (
                    <div className="relative w-9 h-9 rounded-lg border border-neutral-350 overflow-hidden shrink-0">
                      <img src={photo} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setPhoto(undefined)}
                        className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-full hover:bg-red-650 cursor-pointer"
                        title="Remover"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-lg border border-dashed border-neutral-350 flex items-center justify-center shrink-0 bg-neutral-100 text-neutral-400">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                  <label className="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-250 text-[10px] font-bold uppercase rounded border border-neutral-350 cursor-pointer transition-all text-neutral-700 select-none">
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setPhoto(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* PRIMARY METRICS GOALS AND ACTUALS CONFIGURATION */}
          <div className="bg-neutral-50/50 p-4 border border-neutral-200 rounded-xl space-y-4">
            <h4 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">2. Alinhamento de Metas Mensais no Monitor</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {customMetrics.map((metric, idx) => (
                <div key={metric.key} className="bg-white border border-neutral-200 p-3 rounded-lg space-y-1.5 relative shadow-xs">
                  <div className="flex items-center justify-between gap-1.5">
                    <input 
                      type="text" 
                      value={metric.name} 
                      onChange={e => {
                        const updated = [...customMetrics];
                        updated[idx].name = e.target.value;
                        setCustomMetrics(updated);
                      }} 
                      className="bg-transparent font-bold text-xs text-neutral-800 border-b border-transparent hover:border-neutral-300 focus:border-black focus:outline-none w-full"
                      placeholder="Nome da Métrica"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setCustomMetrics(customMetrics.filter(m => m.key !== metric.key));
                      }}
                      className="text-red-500 hover:text-red-700 p-0.5 rounded hover:bg-red-50 cursor-pointer shrink-0"
                      title="Excluir Métrica"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <div className="w-1/2">
                      <span className="block text-[8px] text-neutral-400 uppercase font-bold">Target</span>
                      <input 
                        type="number" 
                        value={metric.target} 
                        onChange={e => {
                          const updated = [...customMetrics];
                          updated[idx].target = Number(e.target.value);
                          setCustomMetrics(updated);
                        }} 
                        className="w-full text-center p-1 border font-bold text-xs text-black rounded bg-neutral-50/50" 
                        placeholder="Meta"
                      />
                    </div>
                    <div className="w-1/2">
                      <span className="block text-[8px] text-neutral-400 uppercase font-bold">Realizado</span>
                      <input 
                        type="number" 
                        value={metric.real} 
                        onChange={e => {
                          const updated = [...customMetrics];
                          updated[idx].real = Number(e.target.value);
                          setCustomMetrics(updated);
                        }} 
                        className="w-full text-center p-1 border text-xs text-black rounded bg-neutral-50/50" 
                        placeholder="Real"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                const newKey = `metric_${Date.now()}`;
                setCustomMetrics([...customMetrics, { key: newKey, name: 'Nova Métrica', target: 0, real: 0 }]);
              }}
              className="mt-2 w-full py-2 border border-dashed border-neutral-300 rounded-lg text-xs font-bold text-neutral-600 hover:border-black hover:text-black flex items-center justify-center gap-1.5 cursor-pointer bg-white"
            >
              <Plus className="w-4 h-4" />
              Adicionar Métrica ao Monitor
            </button>
          </div>

          {/* DETAILED CROSS SELL PRODUCTS GOALS */}
          <div className="bg-neutral-50/50 p-4 border border-neutral-200 rounded-xl space-y-4">
            <h4 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
              3. Metas Detalhadas por Produto de Cross-Selling (Seguro, Consórcio, Contabilidade, Câmbio etc.)
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              <div className="bg-white border border-neutral-150 p-2.5 rounded-lg text-xs space-y-1">
                <span className="text-[9px] font-black text-[#f59e0b] uppercase block">🛡️ Seguro (Fixo: 1)</span>
                <div className="flex gap-1">
                  <input type="number" placeholder="Meta" value={1} disabled className="w-1/2 p-1 bg-neutral-100 text-neutral-400 border text-[11px] font-mono text-center cursor-not-allowed"/>
                  <input type="number" placeholder="Real." value={crossSellSeguroRealizado} onChange={e => setCrossSellSeguroRealizado(Number(e.target.value))} className="w-1/2 p-1 bg-neutral-50 border text-[11px] font-mono text-black text-center"/>
                </div>
              </div>

              <div className="bg-white border border-neutral-150 p-2.5 rounded-lg text-xs space-y-1">
                <span className="text-[9px] font-black text-[#f59e0b] uppercase block">🏢 Consórcio (Fixo: 1)</span>
                <div className="flex gap-1">
                  <input type="number" placeholder="Meta" value={1} disabled className="w-1/2 p-1 bg-neutral-100 text-neutral-400 border text-[11px] font-mono text-center cursor-not-allowed"/>
                  <input type="number" placeholder="Real." value={crossSellConsorcioRealizado} onChange={e => setCrossSellConsorcioRealizado(Number(e.target.value))} className="w-1/2 p-1 bg-neutral-50 border text-[11px] font-mono text-black text-center"/>
                </div>
              </div>

              <div className="bg-white border border-neutral-150 p-2.5 rounded-lg text-xs space-y-1">
                <span className="text-[9px] font-black text-[#f59e0b] uppercase block">📑 Contabilidade (Fixo: 1)</span>
                <div className="flex gap-1">
                  <input type="number" placeholder="Meta" value={1} disabled className="w-1/2 p-1 bg-neutral-100 text-neutral-400 border text-[11px] font-mono text-center cursor-not-allowed"/>
                  <input type="number" placeholder="Real." value={crossSellContabilidadeRealizado} onChange={e => setCrossSellContabilidadeRealizado(Number(e.target.value))} className="w-1/2 p-1 bg-neutral-50 border text-[11px] font-mono text-black text-center"/>
                </div>
              </div>

              <div className="bg-white border border-neutral-150 p-2.5 rounded-lg text-xs space-y-1">
                <span className="text-[9px] font-black text-[#f59e0b] uppercase block">🩺 Plano Saúde (Fixo: 1)</span>
                <div className="flex gap-1">
                  <input type="number" placeholder="Meta" value={1} disabled className="w-1/2 p-1 bg-neutral-100 text-neutral-400 border text-[11px] font-mono text-center cursor-not-allowed"/>
                  <input type="number" placeholder="Real." value={crossSellPlanoSaudeRealizado} onChange={e => setCrossSellPlanoSaudeRealizado(Number(e.target.value))} className="w-1/2 p-1 bg-neutral-50 border text-[11px] font-mono text-black text-center"/>
                </div>
              </div>

              <div className="bg-white border border-neutral-150 p-2.5 rounded-lg text-xs space-y-1">
                <span className="text-[9px] font-black text-[#f59e0b] uppercase block">💱 Câmbio</span>
                <div className="flex gap-1">
                  <input type="number" placeholder="Meta" value={crossSellCambioMeta} onChange={e => setCrossSellCambioMeta(Number(e.target.value))} className="w-1/2 p-1 bg-neutral-50 border text-[11px] font-mono text-black text-center"/>
                  <input type="number" placeholder="Real." value={crossSellCambioRealizado} onChange={e => setCrossSellCambioRealizado(Number(e.target.value))} className="w-1/2 p-1 bg-neutral-50 border text-[11px] font-mono text-black text-center"/>
                </div>
              </div>

              <div className="bg-white border border-neutral-150 p-2.5 rounded-lg text-xs space-y-1">
                <span className="text-[9px] font-black text-[#f59e0b] uppercase block">📦 Outros</span>
                <div className="flex gap-1">
                  <input type="number" placeholder="Meta" value={crossSellOutrosMeta} onChange={e => setCrossSellOutrosMeta(Number(e.target.value))} className="w-1/2 p-1 bg-neutral-50 border text-[11px] font-mono text-black text-center"/>
                  <input type="number" placeholder="Real." value={crossSellOutrosRealizado} onChange={e => setCrossSellOutrosRealizado(Number(e.target.value))} className="w-1/2 p-1 bg-neutral-50 border text-[11px] font-mono text-black text-center"/>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-3 border-t border-neutral-100 items-start">
            
            {/* Multi SDR selection and exclusiveness toggle */}
            <div className="md:col-span-8 space-y-2">
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex justify-between items-center">
                <span>Vínculos Exclusivos com SDRs</span>
                <span className="text-[9px] text-amber-600 font-extrabold font-mono">Permite Múltiplos</span>
              </label>
              <p className="text-[10px] text-neutral-500 leading-normal mb-1.5">
                Vincule o profissional com SDRs específicos para desativar automaticamente do rodízio compartilhado.
              </p>
              
              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 max-h-36 overflow-y-auto space-y-1.5 custom-scrollbar">
                {activeSDRs.length === 0 ? (
                  <div className="text-[10px] text-neutral-450 italic p-1">Nenhum SDR Ativo Registrado</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activeSDRs.map(sdr => {
                      const isChecked = exclusiveSdrIds.includes(sdr.id);
                      return (
                        <label key={sdr.id} className="flex items-center gap-2 p-1.5 hover:bg-white rounded border border-transparent hover:border-neutral-200 cursor-pointer text-xs font-medium text-neutral-700 transition-[#151515]">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              if (checked) {
                                setExclusiveSdrIds(prev => [...prev, sdr.id]);
                                setParticipatesInRotation(false);
                              } else {
                                setExclusiveSdrIds(prev => prev.filter(id => id !== sdr.id));
                              }
                            }}
                            className="rounded border-neutral-300 text-black focus:ring-black w-3.5 h-3.5"
                          />
                          <span className="truncate text-black">{sdr.name} <span className="text-[9px] text-neutral-400 font-mono">({sdr.team})</span></span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Custom switcher for participates in rotation */}
            <div className="md:col-span-4 bg-neutral-50 border border-neutral-200 p-4 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Habilitar no Rodízio</span>
                <button
                  type="button"
                  disabled={exclusiveSdrIds.length > 0}
                  onClick={() => setParticipatesInRotation(!participatesInRotation)}
                  className={`p-1 rounded cursor-pointer transition-opacity ${exclusiveSdrIds.length > 0 ? 'opacity-40 cursor-not-allowed' : 'opacity-100'}`}
                >
                  {participatesInRotation && exclusiveSdrIds.length === 0 ? (
                    <ToggleRight className="w-7 h-7 text-black" />
                  ) : (
                    <ToggleLeft className="w-7 h-7 text-neutral-300" />
                  )}
                </button>
              </div>
              <p className="text-[10px] text-neutral-500 leading-normal font-sans">
                {exclusiveSdrIds.length > 0 
                  ? "Indisponível: Profissionais com vínculos exclusivos de SDR não entram no rodízio do mês." 
                  : "Se habilitado, o profissional participará das escolhas e rodízios automatizados."}
              </p>
            </div>

          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-lg text-xs font-semibold text-neutral-700 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-black hover:bg-neutral-900 text-white text-xs font-bold rounded-lg cursor-pointer"
            >
              Salvar {roleType === 'consultor' ? 'Consultor' : 'Assessor'}
            </button>
          </div>
        </form>
      )}

      {/* FILTER BAR FOR ROLES & TEAMS */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                typeFilter === 'all' ? 'bg-white text-black shadow-3xs' : 'text-neutral-500 hover:text-black'
              }`}
            >
              Ver Todos ({assessores.length})
            </button>
            <button
              onClick={() => setTypeFilter('assessor')}
              className={`px-3 py-1 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                typeFilter === 'assessor' ? 'bg-white text-black shadow-3xs' : 'text-neutral-500 hover:text-black'
              }`}
            >
              SÓ ASSESSORES ({totalAssessores})
            </button>
            <button
              onClick={() => setTypeFilter('consultor')}
              className={`px-3 py-1 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                typeFilter === 'consultor' ? 'bg-white text-black shadow-3xs' : 'text-neutral-500 hover:text-black'
              }`}
            >
              SÓ CONSULTORES ({totalConsultores})
            </button>
            {currentUser && currentUser.role === 'leader' && currentUser.teamName && (
              <button
                type="button"
                onClick={() => setShowOnlyMyTeam(!showOnlyMyTeam)}
                className={`ml-1 px-3 py-1 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  showOnlyMyTeam
                    ? 'bg-amber-100 text-amber-900 shadow-3xs border border-amber-300'
                    : 'text-neutral-500 hover:text-black border border-transparent'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${showOnlyMyTeam ? 'bg-amber-600 animate-pulse' : 'bg-neutral-450'}`} />
                Meus Liderados ({currentUser.teamName})
              </button>
            )}
          </div>

          <div className="h-4 w-px bg-neutral-300 hidden md:block"></div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-neutral-550" />
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Mesa/Canal:</span>
            <div className="flex gap-1">
              {['all', ...ALL_ASSESSOR_CONSULTOR_TEAMS, ''].map(teamOpt => (
                <button
                  key={teamOpt}
                  onClick={() => setSelectedTeamFilter(teamOpt)}
                  className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold transition-all cursor-pointer ${
                    selectedTeamFilter === teamOpt 
                      ? 'bg-neutral-900 text-white' 
                      : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-650'
                  }`}
                >
                  {teamOpt === 'all' ? 'Todos' : (teamOpt === '' ? 'Sem Equipe' : teamOpt)}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="text-[11px] text-neutral-500 font-semibold text-right">
          Total de <strong className="text-black font-bold">{finalFiltered.length}</strong> profissionais filtrados
        </div>
      </div>

      {/* RENDER GRID CARDS LIST FOR ADMIN */}
      {finalFiltered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-neutral-200 rounded-2xl">
          <Users className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <h3 className="text-xs font-black text-neutral-700 uppercase tracking-wider">Nenhum profissional cadastrado com esses parâmetros</h3>
          <p className="text-xs text-neutral-500 mt-1">Cadastre novos assessores ou consultores utilizando as opções acima</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {finalFiltered.map(assr => {
            const isEditing = editingId === assr.id;
            const isDeleting = deletingId === assr.id;
            const isPerformanceExpanded = expandedPerformanceId === assr.id;
            const canEditOrDelete = isAdmin || (currentUser && currentUser.role === 'leader' && assr.team === currentUser.teamName);

            // Exclusive SDR info
            let exclusiveSdrNames: string[] = [];
            let associatedIds: string[] = [];
            if (Array.isArray(assr.exclusiveSdrIds)) {
              associatedIds = assr.exclusiveSdrIds;
            } else if (assr.exclusiveSdrId) {
              associatedIds = [assr.exclusiveSdrId];
            }
            exclusiveSdrNames = associatedIds
              .map(id => sdrs.find(s => s.id === id)?.name || null)
              .filter((name): name is string => name !== null);

            return (
              <div 
                key={assr.id}
                className={`bg-white border rounded-xl overflow-hidden p-5 flex flex-col justify-between relative transition-all ${
                  assr.active 
                    ? 'border-neutral-200 hover:border-neutral-400 shadow-xs' 
                    : 'border-neutral-200 bg-neutral-50 opacity-60'
                }`}
              >
                <div className="space-y-4">
                  
                  {/* Card Title Header Sector */}
                  {isEditing ? (
                    <div className="space-y-3.5 border-b border-neutral-100 pb-3">
                      <div className="flex justify-between items-center bg-neutral-900 text-white p-2 text-xs rounded font-bold">
                        <span>EDITAR INFORMAÇÕES</span>
                        <span className="text-[10px] uppercase font-black bg-[#f59e0b] text-neutral-900 px-1 rounded">
                          {editRoleType}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-2.5">
                        <div className="flex gap-2 items-end">
                          <div className="flex-1">
                            <label className="block text-[9px] font-bold text-neutral-400 uppercase">Nome</label>
                            <input
                              type="text"
                              value={editName}
                              onChange={e => setEditName(e.target.value)}
                              className="w-full bg-neutral-50 border border-neutral-300 rounded px-2 py-1.5 font-bold text-xs text-black"
                            />
                          </div>
                          <div className="shrink-0 w-24">
                            <label className="block text-[9px] font-bold text-neutral-400 uppercase">Foto</label>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {editPhoto ? (
                                <div className="relative w-8 h-8 rounded border border-neutral-300 overflow-hidden shrink-0">
                                  <img src={editPhoto} alt="Preview" className="w-full h-full object-cover" />
                                  <button
                                    type="button"
                                    onClick={() => setEditPhoto(undefined)}
                                    className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-full hover:bg-red-650 cursor-pointer flex items-center justify-center"
                                    style={{ width: '12px', height: '12px', padding: 0 }}
                                    title="Remover"
                                  >
                                    <X style={{ width: '8px', height: '8px' }} />
                                  </button>
                                </div>
                              ) : (
                                <div className="w-8 h-8 rounded border border-dashed border-neutral-350 flex items-center justify-center shrink-0 bg-neutral-100 text-neutral-400">
                                  <User className="w-4 h-4" />
                                </div>
                              )}
                              <label className="px-1.5 py-1.5 bg-neutral-100 hover:bg-neutral-250 text-[8.5px] font-extrabold uppercase rounded border border-neutral-350 cursor-pointer transition-all text-neutral-700 select-none leading-none">
                                Upload
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onloadend = () => {
                                        setEditPhoto(reader.result as string);
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] font-bold text-neutral-400 uppercase">Tipo</label>
                            <select
                              value={editRoleType}
                              onChange={e => setEditRoleType(e.target.value as 'assessor' | 'consultor')}
                              className="w-full bg-neutral-50 border border-neutral-300 rounded px-1.5 py-1 text-xs font-bold text-black cursor-pointer"
                            >
                              <option value="assessor">Assessor</option>
                              <option value="consultor">Consultor</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-neutral-400 uppercase">Mesa / Canal</label>
                            {currentUser?.role === 'leader' ? (
                              <span className="block w-full bg-neutral-100 border border-neutral-300 rounded px-1.5 py-1 text-xs font-mono font-black text-neutral-600">
                                {editTeam || 'Nenhuma'}
                              </span>
                            ) : (
                              <select
                                value={editTeam}
                                onChange={e => setEditTeam(e.target.value)}
                                className="w-full bg-neutral-50 border border-neutral-300 rounded px-1.5 py-1 text-xs text-black cursor-pointer animate-fade-in"
                              >
                                {(editRoleType === 'assessor' ? ASSESSOR_TEAMS : CONSULTOR_TEAMS).map(t => (
                                  <option key={t} value={t}>{t}</option>
                                ))}
                                <option value="">Sem Equipe</option>
                              </select>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] font-bold text-neutral-400 uppercase">Data Admissão</label>
                            <input
                              type="date"
                              value={editAdmissionDate}
                              onChange={e => setEditAdmissionDate(e.target.value)}
                              className="w-full bg-neutral-50 border border-neutral-300 rounded px-2 py-1 text-xs text-black"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-neutral-400 uppercase">Agenda Link</label>
                            <input
                              type="text"
                              value={editAgendaLink}
                              onChange={e => setEditAgendaLink(e.target.value)}
                              className="w-full bg-neutral-50 border border-neutral-300 rounded px-2 py-1 font-mono text-[10.5px] text-black"
                            />
                          </div>
                        </div>

                        {/* Exclusive SDR checkboxes inside editing mode */}
                        <div className="border border-neutral-150 rounded-lg p-2 bg-neutral-50">
                          <label className="block text-[9px] font-bold text-neutral-400 uppercase mb-1">Vínculos Exclusivos SDRs</label>
                          <div className="max-h-24 overflow-y-auto space-y-1">
                            {activeSDRs.map(sdr => {
                              const checked = editExclusiveSdrIds.includes(sdr.id);
                              return (
                                <label key={sdr.id} className="flex items-center gap-1.5 text-[10px] hover:bg-white p-1 rounded cursor-pointer text-black font-semibold">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => {
                                      const isCheckedNow = e.target.checked;
                                      if (isCheckedNow) {
                                        setEditExclusiveSdrIds(prev => [...prev, sdr.id]);
                                        setEditParticipatesInRotation(false);
                                      } else {
                                        setEditExclusiveSdrIds(prev => prev.filter(id => id !== sdr.id));
                                      }
                                    }}
                                    className="rounded text-black focus:ring-black w-3 h-3"
                                  />
                                  <span>{sdr.name}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>

                        <div className="flex items-center justify-between bg-neutral-100 p-2 rounded text-[10px] font-mono">
                          <span className="font-bold text-neutral-600">Apto ao Rodízio</span>
                          <button
                            type="button"
                            disabled={editExclusiveSdrIds.length > 0}
                            onClick={() => setEditParticipatesInRotation(!editParticipatesInRotation)}
                            className="bg-white border rounded px-2 py-0.5"
                          >
                            {editParticipatesInRotation && editExclusiveSdrIds.length === 0 ? 'Sim, Ativo' : 'Não, Fora'}
                          </button>
                        </div>
                      </div>

                      {/* Config Goals sub form within direct editing */}
                      <div className="border-t border-dashed border-neutral-200 mt-2 pt-2.5 space-y-2.5">
                        <span className="text-[10px] font-black text-[#f59e0b] block uppercase">Estipular Target no Monitor</span>
                        
                        <div className="grid grid-cols-1 gap-2.5">
                          {editCustomMetrics.map((metric, idx) => (
                            <div key={metric.key} className="bg-white border rounded p-2 space-y-1 relative group shadow-2xs">
                              <div className="flex items-center justify-between gap-1.5">
                                <input 
                                  type="text" 
                                  value={metric.name} 
                                  onChange={e => {
                                    const updated = [...editCustomMetrics];
                                    updated[idx].name = e.target.value;
                                    setEditCustomMetrics(updated);
                                  }} 
                                  className="bg-transparent font-bold text-[11px] text-neutral-800 border-b border-transparent hover:border-neutral-300 focus:border-black focus:outline-none w-full"
                                  placeholder="Nome da Métrica"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditCustomMetrics(editCustomMetrics.filter(m => m.key !== metric.key));
                                  }}
                                  className="text-red-500 hover:text-red-700 p-0.5 rounded hover:bg-red-50 cursor-pointer shrink-0"
                                  title="Excluir Métrica"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="flex gap-2">
                                <div className="w-1/2">
                                  <span className="block text-[8px] text-neutral-400 uppercase font-bold">Target</span>
                                  <input 
                                    type="number" 
                                    value={metric.target} 
                                    onChange={e => {
                                      const updated = [...editCustomMetrics];
                                      updated[idx].target = Number(e.target.value);
                                      setEditCustomMetrics(updated);
                                    }} 
                                    className="w-full text-center p-0.5 border font-bold text-xs text-black rounded bg-neutral-50/50" 
                                    placeholder="Meta"
                                  />
                                </div>
                                <div className="w-1/2">
                                  <span className="block text-[8px] text-neutral-400 uppercase font-bold">Realizado</span>
                                  <input 
                                    type="number" 
                                    value={metric.real} 
                                    onChange={e => {
                                      const updated = [...editCustomMetrics];
                                      updated[idx].real = Number(e.target.value);
                                      setEditCustomMetrics(updated);
                                    }} 
                                    className="w-full text-center p-0.5 border text-xs text-black rounded bg-neutral-50/50" 
                                    placeholder="Real"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const newKey = `metric_${Date.now()}`;
                            setEditCustomMetrics([...editCustomMetrics, { key: newKey, name: 'Nova Métrica', target: 0, real: 0 }]);
                          }}
                          className="mt-1.5 w-full py-1.5 border border-dashed border-neutral-300 rounded text-[11px] font-bold text-neutral-600 hover:border-black hover:text-black flex items-center justify-center gap-1 cursor-pointer bg-white"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Adicionar Métrica ao Monitor
                        </button>
                      </div>

                        {/* Detailed product edit inside edit state */}
                        <div className="bg-neutral-50 rounded p-2 text-[10px] space-y-2">
                          <span className="font-extrabold text-neutral-500 block uppercase">Realizados de Cross-Sell Detalhados:</span>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span>Seguro Target (Fixo: 1) / Real</span>
                              <div className="flex gap-1">
                                <input type="number" value={1} disabled className="w-1/2 border p-0.5 text-center bg-neutral-100 text-neutral-450 cursor-not-allowed font-bold"/>
                                <input type="number" value={editCrossSellSeguroRealizado} onChange={e => setEditCrossSellSeguroRealizado(Number(e.target.value))} className="w-1/2 border p-0.5 text-center text-black"/>
                              </div>
                            </div>
                            <div>
                              <span>Consórcio Target (Fixo: 1) / Real</span>
                              <div className="flex gap-1">
                                <input type="number" value={1} disabled className="w-1/2 border p-0.5 text-center bg-neutral-100 text-neutral-450 cursor-not-allowed font-bold"/>
                                <input type="number" value={editCrossSellConsorcioRealizado} onChange={e => setEditCrossSellConsorcioRealizado(Number(e.target.value))} className="w-1/2 border p-0.5 text-center text-black"/>
                              </div>
                            </div>
                            <div>
                              <span>Contabilidade Target (Fixo: 1) / Real</span>
                              <div className="flex gap-1">
                                <input type="number" value={1} disabled className="w-1/2 border p-0.5 text-center bg-neutral-100 text-neutral-450 cursor-not-allowed font-bold"/>
                                <input type="number" value={editCrossSellContabilidadeRealizado} onChange={e => setEditCrossSellContabilidadeRealizado(Number(e.target.value))} className="w-1/2 border p-0.5 text-center text-black"/>
                              </div>
                            </div>
                            <div>
                              <span>Plano de Saúde Target (Fixo: 1) / Real</span>
                              <div className="flex gap-1">
                                <input type="number" value={1} disabled className="w-1/2 border p-0.5 text-center bg-neutral-100 text-neutral-450 cursor-not-allowed font-bold"/>
                                <input type="number" value={editCrossSellPlanoSaudeRealizado} onChange={e => setEditCrossSellPlanoSaudeRealizado(Number(e.target.value))} className="w-1/2 border p-0.5 text-center text-black"/>
                              </div>
                            </div>
                            <div>
                              <span>Câmbio Target / Real</span>
                              <div className="flex gap-1">
                                <input type="number" value={editCrossSellCambioMeta} onChange={e => setEditCrossSellCambioMeta(Number(e.target.value))} className="w-1/2 border p-0.5 text-center text-black"/>
                                <input type="number" value={editCrossSellCambioRealizado} onChange={e => setEditCrossSellCambioRealizado(Number(e.target.value))} className="w-1/2 border p-0.5 text-center text-black"/>
                              </div>
                            </div>
                            <div>
                              <span>Outros Target / Real</span>
                              <div className="flex gap-1">
                                <input type="number" value={editCrossSellOutrosMeta} onChange={e => setEditCrossSellOutrosMeta(Number(e.target.value))} className="w-1/2 border p-0.5 text-center text-black"/>
                                <input type="number" value={editCrossSellOutrosRealizado} onChange={e => setEditCrossSellOutrosRealizado(Number(e.target.value))} className="w-1/2 border p-0.5 text-center text-black"/>
                              </div>
                            </div>
                          </div>
                        </div>

                      <div className="flex gap-1 justify-end pt-2">
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1 bg-neutral-100 text-xs text-neutral-600 font-bold rounded"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleSaveEdit(assr.id)}
                          className="px-4 py-1 bg-neutral-900 text-xs text-white font-bold rounded"
                        >
                          Salvar Alterações
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {/* Normal presentation view state */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2.5">
                          <div 
                            onClick={() => onViewProfile && onViewProfile(assr.roleType === 'consultor' ? 'consultor' : 'assessor', assr.id)}
                            className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs border overflow-hidden cursor-pointer hover:border-black transition-all shadow-sm shrink-0 ${
                            assr.roleType === 'consultor'
                              ? 'bg-blue-50 border-blue-200 text-blue-900'
                              : 'bg-amber-50 border-amber-200 text-amber-900'
                          }`}
                            title="Clique para abrir a ficha de histórico"
                          >
                            {assr.photo ? (
                              <img src={assr.photo} alt={assr.name} className="w-full h-full object-cover animate-fade-in" referrerPolicy="no-referrer" />
                            ) : (
                              <span className="uppercase font-display font-black leading-none">{assr.name.substring(0,2)}</span>
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 
                                onClick={() => onViewProfile && onViewProfile(assr.roleType === 'consultor' ? 'consultor' : 'assessor', assr.id)}
                                className="font-extrabold text-neutral-900 text-xs leading-none cursor-pointer hover:text-black hover:underline inline-flex items-center gap-0.5"
                                title="Clique para abrir a ficha de histórico"
                              >
                                {assr.name}
                              </h3>
                              <span className={`px-1 rounded text-[8px] font-black uppercase tracking-wider ${
                                assr.roleType === 'consultor' ? 'bg-blue-100 text-blue-800' : 'bg-neutral-100 text-neutral-800'
                              }`}>
                                {assr.roleType === 'consultor' ? 'Consultor' : 'Assessor'}
                              </span>
                              {!canEditOrDelete && (
                                <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-neutral-100 text-neutral-500 border border-neutral-200 flex items-center gap-0.5" title="Apenas leitura (outro time)">
                                  <Lock className="w-2.5 h-2.5 text-neutral-400 shrink-0" /> Leitura
                                </span>
                              )}
                            </div>
                            
                            <div className="flex flex-col gap-0.5 mt-1 text-[9px] font-mono font-black text-neutral-450 uppercase leading-none">
                              <span>{assr.team || 'Célula Alpha'} &bull; {assr.active ? 'Ativo' : 'Inativo'}</span>
                              
                              {assr.admissionDate && (
                                <span className="text-[8.5px] text-neutral-400 mt-0.5 flex items-center gap-1">
                                  <FileText className="w-2.5 h-2.5 shrink-0" />
                                  <span>Admissão: {new Date(assr.admissionDate + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                                </span>
                              )}

                              {assr.agendaLink && (
                                <a 
                                  href={assr.agendaLink.startsWith('http') ? assr.agendaLink : `https://${assr.agendaLink}`}
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="text-[10px] font-extrabold text-neutral-700 hover:text-black underline mt-1 truncate max-w-[170px] lowercase inline-flex items-center gap-0.5"
                                >
                                  🔗 link de agenda
                                </a>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Top bar control buttons */}
                        {canEditOrDelete ? (
                          <div className="flex items-center gap-1 text-[11px] font-bold">
                            <button
                              type="button"
                              onClick={() => onViewProfile && onViewProfile(assr.roleType === 'consultor' ? 'consultor' : 'assessor', assr.id)}
                              className="p-1 px-1.5 rounded bg-amber-55 hover:bg-amber-100 text-amber-800 hover:text-amber-950 border border-amber-250 transition cursor-pointer flex items-center gap-1 shrink-0"
                              title="Ver Ficha / Histórico Completo"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span className="text-[9.5px]">Ficha</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => onToggleActiveAssessor(assr.id)}
                              className="p-1 rounded hover:bg-neutral-100 text-neutral-400 transition"
                              title={assr.active ? 'Desativar' : 'Ativar'}
                            >
                              {assr.active ? (
                                <ToggleRight className="w-5.5 h-5.5 text-neutral-850" />
                              ) : (
                                <ToggleLeft className="w-5.5 h-5.5 text-neutral-300" />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStartEdit(assr)}
                              className="p-1 border text-black hover:bg-neutral-50 rounded cursor-pointer text-xs"
                              title="Editar Dados e Metas"
                              style={{ color: '#000000' }}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Deleting protection frame */}
                            {isDeleting ? (
                              <div 
                                onClick={(e) => e.stopPropagation()} 
                                className="absolute inset-0 bg-neutral-950/95 backdrop-blur-[1px] rounded-xl z-30 flex flex-col items-center justify-center p-4 text-center text-brand-sand select-none animate-fade-in"
                              >
                                <div className="w-9 h-9 bg-red-500/15 border border-red-500/40 rounded-full flex items-center justify-center text-red-100 mb-2 font-mono">
                                  <AlertTriangle className="w-5 h-5 text-red-500" />
                                </div>
                                <div className="space-y-1 mb-4 text-xs font-semibold">
                                  <h4 className="text-[10px] font-black uppercase tracking-widest text-red-500">Excluir Profissional</h4>
                                  <p className="text-neutral-300 max-w-[200px] leading-relaxed">
                                    Deseja de fato excluir o cadastro de <strong className="text-white font-black">{assr.name}</strong>?
                                  </p>
                                </div>
                                <div className="flex gap-2 w-full max-w-[190px]">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeletingId(null);
                                    }}
                                    className="flex-1 py-1.5 bg-neutral-800 text-[10px] uppercase font-black rounded-lg text-neutral-300 cursor-pointer"
                                  >
                                    Não
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteAssessor(assr.id);
                                      setDeletingId(null);
                                    }}
                                    className="flex-1 py-1.5 bg-red-600 text-[10px] uppercase font-black rounded-lg text-white cursor-pointer"
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
                                  setDeletingId(assr.id);
                                }}
                                className="p-1 border text-red-500 hover:bg-red-50 rounded cursor-pointer"
                                title="Excluir"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => onViewProfile && onViewProfile(assr.roleType === 'consultor' ? 'consultor' : 'assessor', assr.id)}
                              className="p-1 px-1.5 rounded bg-amber-55 hover:bg-amber-100 text-amber-800 hover:text-amber-950 border border-amber-250 transition cursor-pointer flex items-center gap-1 shrink-0"
                              title="Ver Ficha / Histórico Completo de Outro Time"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span className="text-[9.5px]">Ficha</span>
                            </button>
                            <div className="text-[10px] text-neutral-450 font-bold uppercase tracking-wider flex items-center gap-1 bg-neutral-100 px-2.5 py-1 rounded border border-neutral-200">
                              <Lock className="w-3 h-3 text-neutral-400" /> Outro Time
                            </div>
                          </div>
                        )}
                      </div>

                      {/* DISPLAY METRIC SUMMARY & HIGHLIGHTS ON THE CARD */}
                      <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-150 space-y-2 mt-3 text-xs">
                        <div className="flex justify-between items-center text-[10px] font-black text-neutral-400 uppercase tracking-widest pb-1 border-b">
                          <span>📊 Monitor de Metas Atuais</span>
                          <span className="text-neutral-800">Mês {assr.team || 'Alpha'}</span>
                        </div>

                        {(() => {
                          const formatValLocal = (key: string, name: string, val: number) => {
                            const isNet = key === 'net' || name.toLowerCase().includes('net') || name.toLowerCase().includes('captação') || name.toLowerCase().includes('capto') || name.toLowerCase().includes('capta');
                            if (isNet) {
                              if (val >= 1000 || val <= -1000) {
                                return `R$ ${(val / 1000).toFixed(0)}k`;
                              }
                              return `R$ ${val}`;
                            }
                            return val.toString();
                          };

                          const displayMetrics = assr.customMonitorMetrics || [
                            { key: 'contas_abertas', name: 'Contas', target: assr.metaContasAbertas || 0, real: assr.realizadoContasAbertas || 0 },
                            { key: 'net', name: 'NET Captação', target: assr.metaNet || 0, real: assr.realizadoNet || 0 },
                            { key: 'ligacoes', name: 'Ligações', target: assr.metaLigacoes || 0, real: assr.realizadoLigacoes || 0 },
                            { key: 'cross_sell', name: 'Cross Sell Qtd', target: assr.metaCrossSell || 0, real: assr.realizadoCrossSell || 0 },
                          ];

                          return (
                            <div className="grid grid-cols-2 gap-2 text-[11px] leading-snug">
                              {displayMetrics.map(m => (
                                <div key={m.key} className="flex justify-between border-b pb-0.5">
                                  <span className="text-neutral-500 truncate max-w-[100px]" title={m.name}>{m.name}:</span>
                                  <span className="font-bold text-neutral-900 shrink-0">
                                    {formatValLocal(m.key, m.name, m.real)} / {formatValLocal(m.key, m.name, m.target)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          );
                        })()}

                        {/* Interactive toggle block for detailed performance charts and cross sell breakdown */}
                        <button
                          type="button"
                          onClick={() => setExpandedPerformanceId(isPerformanceExpanded ? null : assr.id)}
                          className="w-full py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-600 hover:text-black hover:bg-neutral-100 rounded border flex items-center justify-center gap-1 cursor-pointer"
                        >
                          {isPerformanceExpanded ? (
                            <>
                              <span>Recolher Detalhamento</span>
                              <ChevronUp className="w-3.5 h-3.5" />
                            </>
                          ) : (
                            <>
                              <span>Ver Progresso Detalhado e Cross-Sell</span>
                              <ChevronDown className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      </div>

                      {/* EXPANDED PROGRESS AND GOAL METERS COMPONENT */}
                      {isPerformanceExpanded && (
                        <div className="mt-3.5 pt-3.5 border-t border-neutral-200 space-y-4 text-xs animate-fade-in">
                          <h4 className="text-[10px] font-black text-[#f59e0b] uppercase tracking-widest">Desempenho Geral de Funil</h4>
                          
                          <div className="space-y-3 bg-neutral-50/50 p-3 rounded-lg border">
                            {(assr.customMonitorMetrics || [
                              { key: 'ligacoes', name: 'Ligações efetuadas', target: assr.metaLigacoes || 0, real: assr.realizadoLigacoes || 0 },
                              { key: 'agendadas', name: 'Reuniões agendadas', target: assr.metaReunioesAgendadas || 0, real: assr.realizadoReunioesAgendadas || 0 },
                              { key: 'realizadas', name: 'Reuniões realizadas', target: assr.metaReunioesRealizadas || 0, real: assr.realizadoReunioesRealizadas || 0 },
                              { key: 'contas_abertas', name: 'Contas abertas', target: assr.metaContasAbertas || 0, real: assr.realizadoContasAbertas || 0 },
                              { key: 'net', name: 'NET (Captação Financeira)', target: assr.metaNet || 0, real: assr.realizadoNet || 0 }
                            ]).map(m => {
                              const isNet = m.key === 'net' || m.name.toLowerCase().includes('net') || m.name.toLowerCase().includes('captação') || m.name.toLowerCase().includes('capto') || m.name.toLowerCase().includes('capta');
                              return (
                                <div key={m.key}>
                                  <span className="text-[10px] font-bold text-neutral-500 block uppercase mb-1">{m.name}</span>
                                  {renderProgressBar(m.real, m.target, isNet)}
                                </div>
                              );
                            })}
                          </div>

                          <h4 className="text-[10px] font-black text-[#f59e0b] uppercase tracking-widest pt-2">Breakdown de Cross-Sell</h4>
                          <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                            {(() => {
                              const renderProductCard = (title: string, icon: string, real: number, meta: number, isFixed: boolean) => {
                                const target = isFixed ? 1 : (meta || 0);
                                const pct = target > 0 ? Math.min(100, Math.round((real / target) * 100)) : 0;
                                const status = target > 0 
                                  ? (real >= target ? { text: 'Concluído', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' } : real > 0 ? { text: 'Em andamento', cls: 'bg-amber-50 text-amber-700 border-amber-200' } : { text: 'Não iniciado', cls: 'bg-neutral-50 text-neutral-500 border-neutral-200' })
                                  : { text: 'Sem Meta', cls: 'bg-neutral-50 text-neutral-450 border-neutral-200' };

                                return (
                                  <div className="p-2.5 border border-neutral-150 rounded-xl bg-white space-y-1.5 shadow-2xs">
                                    <div className="flex justify-between items-center">
                                      <span className="font-bold text-neutral-800">{icon} {title}</span>
                                      <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-black border uppercase tracking-wider ${status.cls}`}>
                                        {status.text}
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                                      <span>Realizado: <strong>{real}</strong> / {target}</span>
                                      <span>{pct}%</span>
                                    </div>
                                    <div className="w-full bg-neutral-100 h-1 rounded overflow-hidden">
                                      <div className="bg-neutral-900 h-full transition-all duration-300" style={{ width: `${pct}%` }} />
                                    </div>
                                  </div>
                                );
                              };

                              return (
                                <>
                                  {renderProductCard('Seguro', '🛡️', assr.crossSellSeguroRealizado || 0, 1, true)}
                                  {renderProductCard('Consórcio', '🏢', assr.crossSellConsorcioRealizado || 0, 1, true)}
                                  {renderProductCard('Contabilidade', '📑', assr.crossSellContabilidadeRealizado || 0, 1, true)}
                                  {renderProductCard('Plano Saúde', '🩺', assr.crossSellPlanoSaudeRealizado || 0, 1, true)}
                                  {renderProductCard('Câmbio', '💱', assr.crossSellCambioRealizado || 0, assr.crossSellCambioMeta || 0, false)}
                                  {renderProductCard('Outros', '📦', assr.crossSellOutrosRealizado || 0, assr.crossSellOutrosMeta || 0, false)}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      )}

                      {/* ROTATION & SDR VINCULES STATUS COMPONENT */}
                      <div className="mt-3.5 pt-3.5 border-t border-neutral-100 text-xs">
                        {exclusiveSdrNames.length > 0 ? (
                          <div className="p-2 rounded-lg bg-amber-50/50 border border-amber-200">
                            <span className="text-[9px] text-amber-700 font-extrabold uppercase tracking-wide block">💎 SDRs Exclusivos de Atendimento</span>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {exclusiveSdrNames.map((sdName, sdId) => (
                                <span key={sdId} className="bg-white border border-amber-200 text-amber-900 font-bold text-[9px] px-1.5 py-0.5 rounded">
                                  {sdName}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : assr.participatesInRotation !== false ? (
                          <div className="p-2 rounded-lg bg-emerald-50/50 border border-emerald-100">
                            <span className="text-[9px] text-emerald-800 font-black uppercase tracking-wider block">🔄 Rodízio Livre Ativado</span>
                            <span className="text-[10px] text-emerald-750 block mt-0.5">Integrado no fluxo mensal balanceado de agendas livres.</span>
                          </div>
                        ) : (
                          <div className="p-2 rounded-lg bg-neutral-100 border text-neutral-450">
                            <span className="text-[9px] font-black uppercase tracking-wider block">⏹️ Fora do Rodízio Ativo</span>
                            <span className="text-[10px] block mt-0.5 animate-pulse">Bloqueado para recepção automática de e-mails/indicações.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
