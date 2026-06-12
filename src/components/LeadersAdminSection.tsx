import React, { useState } from 'react';
import { TeamLeader } from '../types';
import { 
  Key, UserPlus, Trash2, Edit2, Check, X, Shield, Lock, Users, 
  Settings, Link2, Wifi, WifiOff, RefreshCw, Send, AlertCircle, Search
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { IntegrationService } from '../shared/services/integration.service';

interface LeadersAdminSectionProps {
  leaders: TeamLeader[];
  onAddLeader: (leader: Omit<TeamLeader, 'id'>) => void;
  onUpdateLeader: (id: string, updatedFields: Partial<TeamLeader>) => void;
  onDeleteLeader: (id: string) => void;
}

export default function LeadersAdminSection({
  leaders,
  onAddLeader,
  onUpdateLeader,
  onDeleteLeader,
}: LeadersAdminSectionProps) {
  // Pull integration settings directly from global Zustand Store
  const { 
    integrationSettings, 
    updateIntegrationSettings,
    sdrs = [],
    assessores = [],
    teams = []
  } = useAppStore();

  // Local states for custom teams selection and viewing options
  const [selectedTeamsFilter, setSelectedTeamsFilter] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'teams' | 'sdrs'>('teams');
  const [sdrSearchAdmin, setSdrSearchAdmin] = useState('');
  
  // Custom date range, professional category and granular timeframe filtering
  const [professionalType, setProfessionalType] = useState<'all' | 'sdrs' | 'assessores'>('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [quickPeriodFilter, setQuickPeriodFilter] = useState('all');

  // Predefined role designation options specifically requested:
  const PREDEFINED_TITLES = [
    'Líder de SDR',
    'Líder de SDR PJ',
    'Líder de SDR VMB',
    'Líder de SDR Advisor',
    'Líder de Assessores Tier 1',
    'Líder de Assessores Tier 2',
    'Líder de Assessores Tier 3'
  ];

  // Input form states for leaders
  const [formData, setFormData] = useState({
    name: '',
    teamName: '',
    passcode: ''
  });
  
  const [titleType, setTitleType] = useState('Líder de SDR');
  const [customTitle, setCustomTitle] = useState('');

  const [formError, setFormError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    teamName: '',
    passcode: ''
  });

  const [editTitleType, setEditTitleType] = useState('Líder de SDR');
  const [customEditTitle, setCustomEditTitle] = useState('');

  // Local Webhook settings editor
  const [webhookUrlInput, setWebhookUrlInput] = useState(() => integrationSettings.webhookUrl);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);
  const [testing, setTesting] = useState(false);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const resolvedTitle = titleType === 'Outro' ? customTitle.trim() : titleType;

    if (!formData.name.trim() || !formData.teamName.trim() || !resolvedTitle || !formData.passcode.trim()) {
      setFormError('Todos os campos são obrigatórios para o cadastro.');
      return;
    }

    // Check duplicate team names
    const duplicateTeam = leaders.some(l => l.teamName.toLowerCase() === formData.teamName.trim().toLowerCase());
    if (duplicateTeam) {
      setFormError('Já existe um líder cadastrado para esta equipe. Cada equipe comercial deve possuir um líder responsável.');
      return;
    }

    onAddLeader({
      name: formData.name.trim(),
      teamName: formData.teamName.trim(),
      leaderTitle: resolvedTitle,
      passcode: formData.passcode.trim()
    });

    // Clear form
    setFormData({
      name: '',
      teamName: '',
      passcode: ''
    });
    setCustomTitle('');
    setTitleType('Líder de SDR');
  };

  const handleStartEdit = (leader: TeamLeader) => {
    setEditingId(leader.id);
    setEditFormData({
      name: leader.name,
      teamName: leader.teamName,
      passcode: leader.passcode
    });

    if (PREDEFINED_TITLES.includes(leader.leaderTitle)) {
      setEditTitleType(leader.leaderTitle);
      setCustomEditTitle('');
    } else {
      setEditTitleType('Outro');
      setCustomEditTitle(leader.leaderTitle);
    }
  };

  const handleSaveEdit = (id: string) => {
    const resolvedTitle = editTitleType === 'Outro' ? customEditTitle.trim() : editTitleType;

    if (!editFormData.name.trim() || !editFormData.teamName.trim() || !resolvedTitle || !editFormData.passcode.trim()) {
      alert('Preencha todos os campos do gestor.');
      return;
    }

    // Check duplicate team (excluding current leader is fine)
    const duplicateTeam = leaders.some(l => l.id !== id && l.teamName.toLowerCase() === editFormData.teamName.trim().toLowerCase());
    if (duplicateTeam) {
      alert('Outro líder já responde por esta equipe.');
      return;
    }

    onUpdateLeader(id, {
      name: editFormData.name.trim(),
      teamName: editFormData.teamName.trim(),
      leaderTitle: resolvedTitle,
      passcode: editFormData.passcode.trim()
    });

    setEditingId(null);
  };

  const handleSaveWebhookSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateIntegrationSettings({
      webhookUrl: webhookUrlInput.trim()
    });
    alert('Configurações de integração atualizadas e replicadas com sucesso!');
  };

  const handleTestIntegration = async () => {
    if (!webhookUrlInput.trim()) {
      setTestResult({ success: false, msg: 'Insira um URL de Webhook válido antes de realizar o disparo diagnóstico.' });
      return;
    }
    setTesting(true);
    setTestResult(null);

    try {
      const timestamp = new Date().toISOString();
      const response = await IntegrationService.sendMatches(
        'INTEGRATION_CHECKPORTAL',
        [
          {
            sdrId: 'test-user',
            sdrName: 'SDR Palestrante (Disparo Diagnóstico)',
            sdrConversionRate: 85,
            assessorId: 'test-assr',
            assessorName: 'Assessor Líder de Mesa',
            startDate: '2026-05-01',
            endDate: '2026-05-31'
          }
        ],
        webhookUrlInput.trim()
      );

      updateIntegrationSettings({
        lastSendStatus: response.success ? 'success' : 'failed',
        lastSendHttpStatus: response.status,
        lastSendTimestamp: timestamp,
        webhookUrl: webhookUrlInput.trim()
      });

      setTestResult({
        success: response.success,
        msg: response.success
          ? `Disparo efetuado com sucesso! Código HTTP ${response.status} retornado pelo webhook.`
          : `Falha no disparo diagnótico: ${response.message} (Status HTTP: ${response.status})`
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        msg: `Falha crítica de conexão de rede ou política de CORS: ${err.message || 'Erro de barramento externo'}`
      });
    } finally {
      setTesting(false);
    }
  };

  const handleToggleIntegration = () => {
    updateIntegrationSettings({
      enabled: !integrationSettings.enabled
    });
  };

  // Grouping logic for separate visualization of available teams
  const sdrTeams = leaders.filter(l => l.leaderTitle.toUpperCase().includes('SDR'));
  const advisorTeams = leaders.filter(l => l.leaderTitle.toUpperCase().includes('ASSESSOR'));
  const otherTeams = leaders.filter(l => !l.leaderTitle.toUpperCase().includes('SDR') && !l.leaderTitle.toUpperCase().includes('ASSESSOR'));

  // Logic to calculate unique teams and get active / inactive states with participant counters
  const allTeamNames = Array.from(new Set([
    ...teams,
    ...leaders.map(l => l.teamName),
    ...sdrs.map(s => s.team || '').filter(Boolean),
    ...assessores.map(a => a.team || '').filter(Boolean)
  ])).filter(Boolean);

  const teamData = allTeamNames.map(teamName => {
    const teamSdrs = sdrs.filter(s => s.team === teamName);
    const teamAssessores = assessores.filter(a => a.team === teamName);
    const leader = leaders.find(l => l.teamName.toLowerCase().trim() === teamName.toLowerCase().trim());
    
    const activeSdrs = teamSdrs.filter(s => s.active).length;
    const activeAssessores = teamAssessores.filter(a => a.active).length;
    
    const totalParticipants = teamSdrs.length + teamAssessores.length;
    const activeParticipants = activeSdrs + activeAssessores;
    
    // Team is active if it has active participants or if it has an assigned leader
    const isActive = activeParticipants > 0;

    return {
      name: teamName,
      leader,
      totalSdr: teamSdrs.length,
      activeSdr: activeSdrs,
      totalAssessor: teamAssessores.length,
      activeAssessor: activeAssessores,
      totalParticipants,
      activeParticipants,
      isActive
    };
  });

  const activeTeams = teamData.filter(t => t.isActive);
  const inactiveTeams = teamData.filter(t => !t.isActive);

  const renderLeaderCard = (l: TeamLeader) => {
    const isEditing = editingId === l.id;
    return (
      <div 
        key={l.id} 
        className={`p-4 border transition-all rounded-xl flex flex-col justify-between gap-4 ${
          isEditing 
            ? 'bg-neutral-50 border-neutral-900 ring-1 ring-neutral-950/5' 
            : 'bg-[#FCFBF8] hover:bg-white border-neutral-250 hover:border-neutral-400 hover:shadow-xs'
        }`}
      >
        {isEditing ? (
          <div className="space-y-3 w-full">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-neutral-400">Nome do Gestor</label>
                <input 
                  type="text"
                  value={editFormData.name}
                  onChange={e => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2 bg-white border border-neutral-300 rounded text-xs font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-neutral-400">Canal / Equipe</label>
                <input 
                  type="text"
                  value={editFormData.teamName}
                  onChange={e => setEditFormData(prev => ({ ...prev, teamName: e.target.value }))}
                  className="w-full p-2 bg-white border border-neutral-300 rounded text-xs font-bold text-neutral-800"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-neutral-400">Cargo</label>
                <select
                  value={editTitleType}
                  onChange={e => setEditTitleType(e.target.value)}
                  className="w-full p-2 bg-white border border-neutral-300 rounded text-xs font-bold text-neutral-800 cursor-pointer"
                >
                  {PREDEFINED_TITLES.map(title => (
                    <option key={title} value={title}>{title}</option>
                  ))}
                  <option value="Outro">Customizado / Outro</option>
                </select>
                {editTitleType === 'Outro' && (
                  <input 
                    type="text"
                    placeholder="Título Personalizado"
                    value={customEditTitle}
                    onChange={e => setCustomEditTitle(e.target.value)}
                    className="w-full mt-1.5 p-2 bg-white border border-neutral-300 rounded text-xs font-medium focus:outline-none"
                    required
                  />
                )}
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-neutral-400">Senha (Passcode)</label>
                <input 
                  type="text"
                  value={editFormData.passcode}
                  onChange={e => setEditFormData(prev => ({ ...prev, passcode: e.target.value }))}
                  className="w-full p-2 bg-white border border-neutral-300 rounded text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button
                onClick={() => setEditingId(null)}
                className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-neutral-650 bg-neutral-200 hover:bg-neutral-300 rounded flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3 h-3" /> Cancelar
              </button>
              <button
                onClick={() => handleSaveEdit(l.id)}
                className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white bg-black hover:opacity-95 rounded flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3 h-3 text-white" /> Salvar Alterações
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-2 w-full">
            
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-extrabold text-neutral-900 text-xs">
                  {l.name}
                </span>
                <span className="text-[9px] bg-black text-brand-sand font-black px-1.5 py-0.5 rounded leading-none">
                  {l.teamName}
                </span>
              </div>
              
              <p className="text-[10px] font-medium text-neutral-500 font-sans">
                {l.leaderTitle}
              </p>

              <div className="flex items-center gap-3 pt-1.5">
                <div className="flex items-center gap-1 text-[10px] text-neutral-600 font-mono">
                  <Key className="w-3 h-3 text-neutral-400" />
                  <span>Chave:</span>
                  <span className="font-bold text-neutral-900 bg-neutral-100 border border-neutral-200 px-1 rounded">
                    {l.passcode}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleStartEdit(l)}
                className="p-1.5 text-neutral-500 hover:text-black hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                title="Editar Gestor comercial"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  if (confirm(`Deseja revogar o acesso comercial de ${l.name} (${l.teamName})?`)) {
                    onDeleteLeader(l.id);
                  }
                }}
                className="p-1.5 text-neutral-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                title="Remover Acesso do Gestor"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 text-left font-sans pb-12">
      
      {/* Symmetrical Header Banner */}
      <div className="bg-white border-2 border-neutral-900 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 bg-black text-brand-sand text-[9px] font-black uppercase tracking-widest rounded leading-none">
              Acesso Master
            </span>
            <h2 className="text-xl font-black uppercase tracking-tight text-neutral-950 font-display">
              Painel Geral de Líderes & Integração Webhook
            </h2>
          </div>
          <p className="text-xs text-neutral-600 max-w-2xl font-sans">
            Adicione gestores de times, gerencie as chaves de passcode locais e customize a URL de integração webhook para envio em real-time dos dados de rodízio e auditorias.
          </p>
        </div>
        <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-center md:text-right shrink-0">
          <span className="block text-[8px] font-black uppercase tracking-widest text-neutral-450 leading-none">
            Total Células Ativas
          </span>
          <span className="text-2xl font-black font-display text-neutral-950 align-baseline leading-none">
            {leaders.length}
          </span>
          <span className="text-xs text-neutral-500 font-bold ml-1 uppercase">Líderes</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Form left block */}
        <div className="lg:col-span-5 bg-white border-2 border-neutral-900 p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-105">
            <UserPlus className="w-4 h-4 text-neutral-900" />
            <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900 font-display">
              Registrar Novo Líder
            </h3>
          </div>

          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 text-xs font-bold text-red-700 rounded-lg text-center animate-fade-in">
              {formError}
            </div>
          )}

          <form onSubmit={handleAddSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="block text-[9px] font-black text-neutral-500 uppercase tracking-widest">
                Nome do Gestor (Ex: Caio Santos)
              </label>
              <input
                type="text"
                placeholder="Insira o nome completo"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-xs font-medium focus:outline-none focus:border-neutral-900 focus:bg-white transition-colors"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[9px] font-black text-neutral-500 uppercase tracking-widest">
                Nome da Equipe Comercial
              </label>
              <input
                type="text"
                placeholder="Ex: Equipe Hunter, Equipe Gamma, Equipe Alpha..."
                value={formData.teamName}
                onChange={e => setFormData(prev => ({ ...prev, teamName: e.target.value }))}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-xs font-semibold text-neutral-850 focus:outline-none focus:border-neutral-900 focus:bg-white transition-colors"
                required
              />
              <span className="block text-[8px] text-neutral-450 italic mt-0.5">
                Note: o líder acessará o sistema sob as métricas vinculadas a esse nome de equipe.
              </span>
            </div>

            <div className="space-y-1">
              <label className="block text-[9px] font-black text-neutral-500 uppercase tracking-widest">
                Designação da Liderança
              </label>
              <select
                value={titleType}
                onChange={e => setTitleType(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-100 border border-neutral-300 rounded-lg text-xs font-black uppercase text-neutral-800 cursor-pointer focus:outline-none focus:border-neutral-900 transition-colors"
              >
                {PREDEFINED_TITLES.map(title => (
                  <option key={title} value={title}>{title}</option>
                ))}
                <option value="Outro">Customizado / Outro</option>
              </select>
            </div>

            {titleType === 'Outro' && (
              <div className="space-y-1 animate-fade-in">
                <label className="block text-[9px] font-black text-neutral-500 uppercase tracking-widest">
                  Título Personalizado
                </label>
                <input
                  type="text"
                  placeholder="Ex: Head de Distribuição, Supervisor Comercial..."
                  value={customTitle}
                  onChange={e => setCustomTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-xs font-medium focus:outline-none focus:border-neutral-900 focus:bg-white transition-colors"
                  required
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-[9px] font-black text-neutral-500 uppercase tracking-widest">
                Chave de Acesso (Passcode de Login)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Defina a senha/chave de acesso para este líder"
                  value={formData.passcode}
                  onChange={e => setFormData(prev => ({ ...prev, passcode: e.target.value }))}
                  className="w-full pl-8 pr-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-xs font-mono font-bold text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white transition-colors"
                  required
                />
                <Lock className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-850 text-brand-sand hover:text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              Salvar e Cadastrar Gestor
            </button>
          </form>
        </div>

        {/* Leaders Grid/List Block right */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border-2 border-neutral-900 p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-105">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-neutral-900" />
                <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900 font-display">
                  Gestores Cadastrados no Ecossistema
                </h3>
              </div>
              <span className="text-[9px] font-bold text-neutral-450 uppercase">
                Conselho de Distribuição
              </span>
            </div>

            <div className="space-y-5 max-h-[465px] overflow-y-auto pr-1">
              {leaders.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-450">
                  Nenhum líder cadastrado no momento. Cadastre gestores no painel de controle esquerdo.
                </div>
              ) : (
                <div className="space-y-5">
                  {sdrTeams.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 pb-1 border-b border-neutral-100">
                        <span className="w-2.0 h-2.0 rounded-full bg-indigo-500 inline-block shrink-0" />
                        <h4 className="text-[10px] font-mono font-black uppercase text-neutral-600 tracking-wider">
                          Equipes de Prospecção & SDR ({sdrTeams.length})
                        </h4>
                      </div>
                      <div className="space-y-2.5">
                        {sdrTeams.map(l => renderLeaderCard(l))}
                      </div>
                    </div>
                  )}

                  {advisorTeams.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 pb-1 border-b border-neutral-100 pt-1">
                        <span className="w-2.0 h-2.0 rounded-full bg-emerald-500 inline-block shrink-0" />
                        <h4 className="text-[10px] font-mono font-black uppercase text-neutral-600 tracking-wider">
                          Mesas de Distribuição & Assessores ({advisorTeams.length})
                        </h4>
                      </div>
                      <div className="space-y-2.5">
                        {advisorTeams.map(l => renderLeaderCard(l))}
                      </div>
                    </div>
                  )}

                  {otherTeams.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 pb-1 border-b border-neutral-100 pt-1">
                        <span className="w-2.0 h-2.0 rounded-full bg-amber-500 inline-block shrink-0" />
                        <h4 className="text-[10px] font-mono font-black uppercase text-neutral-600 tracking-wider">
                          Outras Células & Gestão Geral ({otherTeams.length})
                        </h4>
                      </div>
                      <div className="space-y-2.5">
                        {otherTeams.map(l => renderLeaderCard(l))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Divisão de Times Ativos vs Inativos & Filtro Inteligente */}
          <div className="bg-white border-2 border-neutral-900 p-6 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-neutral-105 gap-3">
              <div className="space-y-0.5 text-left">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-neutral-900" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900 font-display">
                    Saúde Operacional dos Times Comerciais
                  </h3>
                </div>
                <p className="text-[10px] text-neutral-500 font-sans leading-tight">
                  Selecione os times específicos que deseja analisar ou veja a listagem integrada de SDRs.
                </p>
              </div>
              
              {/* Tabs Switch */}
              <div className="flex bg-neutral-100 p-0.5 rounded-lg border border-neutral-250 self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => setViewMode('teams')}
                  className={`px-3 py-1 text-[9px] uppercase font-black tracking-wider rounded-md transition-all cursor-pointer ${
                    viewMode === 'teams' 
                      ? 'bg-neutral-900 text-white shadow-3xs' 
                      : 'text-neutral-500 hover:text-black'
                  }`}
                >
                  Filtrar por Times
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('sdrs')}
                  className={`px-3 py-1 text-[9px] uppercase font-black tracking-wider rounded-md transition-all cursor-pointer ${
                    viewMode === 'sdrs' 
                      ? 'bg-neutral-900 text-white shadow-3xs' 
                      : 'text-neutral-500 hover:text-black'
                  }`}
                >
                  Todos os SDRs
                </button>
              </div>
            </div>

            {/* Quick Multi-select Filters */}
            <div className="bg-[#FAF9F5] p-3.5 rounded-xl border border-neutral-200/90 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200/50 pb-2">
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-mono font-black uppercase tracking-wider text-neutral-500">
                    Times Selecionados:
                  </span>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setSelectedTeamsFilter([])}
                    className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded transition-all cursor-pointer ${
                      selectedTeamsFilter.length === 0
                        ? 'bg-neutral-900 text-white'
                        : 'bg-neutral-200 hover:bg-neutral-300 text-neutral-650'
                    }`}
                  >
                    Visualizar Todos ({allTeamNames.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTeamsFilter(allTeamNames)}
                    className="text-[9px] font-bold uppercase text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-250 cursor-pointer transition-all"
                  >
                    Marcar Todos
                  </button>
                </div>
              </div>

              {allTeamNames.length === 0 ? (
                <p className="text-[10px] text-neutral-400 italic text-left">Nenhum canal/equipe comercial registrado.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {allTeamNames.map(name => {
                    const isSelected = selectedTeamsFilter.includes(name);
                    const sdrCount = sdrs.filter(s => s.team === name).length;
                    const assessorCount = assessores.filter(a => a.team === name).length;
                    
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedTeamsFilter(prev => prev.filter(t => t !== name));
                          } else {
                            setSelectedTeamsFilter(prev => [...prev, name]);
                          }
                        }}
                        className={`text-[9.5px] font-extrabold px-2.5 py-1 rounded-md border flex items-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-white border-neutral-900 text-neutral-950 ring-1 ring-neutral-900 shadow-3xs'
                            : 'bg-neutral-50 border-neutral-250 hover:border-neutral-400 text-neutral-550'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-emerald-500' : 'bg-neutral-300'}`} />
                        <span className="uppercase">{name}</span>
                        <span className="text-[8px] opacity-75 font-mono">
                          ({sdrCount + assessorCount})
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {viewMode === 'teams' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Times Ativos */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-1 border-b border-emerald-100 text-left">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                    <h4 className="text-[10px] font-mono font-black uppercase text-emerald-800 tracking-wider">
                      Times Ativos ({activeTeams.filter(t => selectedTeamsFilter.length === 0 || selectedTeamsFilter.includes(t.name)).length})
                    </h4>
                  </div>

                  {activeTeams.filter(t => selectedTeamsFilter.length === 0 || selectedTeamsFilter.includes(t.name)).length === 0 ? (
                    <div className="p-4 border border-dashed border-neutral-200 rounded-xl text-center text-[10px] text-neutral-450 leading-relaxed font-semibold">
                      Sem times ativos correspondentes ao filtro.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {activeTeams
                        .filter(t => selectedTeamsFilter.length === 0 || selectedTeamsFilter.includes(t.name))
                        .map(team => (
                          <div 
                            key={team.name}
                            className="bg-[#F4FBF7] border border-emerald-250 p-3.5 rounded-xl space-y-2 transition-all hover:bg-emerald-50/45 text-left"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-0.5">
                                <span className="block text-xs font-black text-emerald-950 uppercase font-display">
                                  {team.name}
                                </span>
                                {team.leader ? (
                                  <span className="block text-[9px] text-neutral-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                                    Gestor: {team.leader.name} ({team.leader.leaderTitle})
                                  </span>
                                ) : (
                                  <span className="block text-[9px] text-neutral-400 italic text-left">
                                    Sem gestor atribuído
                                  </span>
                                )}
                              </div>
                              <span className="text-[8px] bg-emerald-600 text-white font-mono font-black px-1.5 py-0.5 rounded leading-none shrink-0 uppercase tracking-wider">
                                {team.activeParticipants} ATIVOS
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[10px] pt-1.5 border-t border-emerald-150">
                              <div className="bg-white/80 p-1.5 rounded border border-emerald-100">
                                <span className="block text-[8px] text-neutral-400 uppercase font-mono">SDRs</span>
                                <strong className="block text-emerald-950 font-extrabold font-mono pt-0.5 text-[11px]">
                                  {team.activeSdr} <span className="text-[9px] font-normal text-neutral-500">({team.totalSdr} tot)</span>
                                </strong>
                              </div>
                              <div className="bg-white/80 p-1.5 rounded border border-emerald-100">
                                <span className="block text-[8px] text-neutral-400 uppercase font-mono">Assessores</span>
                                <strong className="block text-emerald-950 font-extrabold font-mono pt-0.5 text-[11px]">
                                  {team.activeAssessor} <span className="text-[9px] font-normal text-neutral-500">({team.totalAssessor} tot)</span>
                                </strong>
                              </div>
                            </div>
                          </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Times Inativos */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-1 border-b border-neutral-200 text-left">
                    <span className="w-2.5 h-2.5 rounded-full bg-neutral-400 shrink-0" />
                    <h4 className="text-[10px] font-mono font-black uppercase text-neutral-500 tracking-wider">
                      Times Inativos ({inactiveTeams.filter(t => selectedTeamsFilter.length === 0 || selectedTeamsFilter.includes(t.name)).length})
                    </h4>
                  </div>

                  {inactiveTeams.filter(t => selectedTeamsFilter.length === 0 || selectedTeamsFilter.includes(t.name)).length === 0 ? (
                    <div className="p-4 border border-dashed border-neutral-200 rounded-xl text-center text-[10px] text-neutral-450 font-medium">
                      Nenhum time comercial inativo correspondente ao filtro.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {inactiveTeams
                        .filter(t => selectedTeamsFilter.length === 0 || selectedTeamsFilter.includes(t.name))
                        .map(team => (
                          <div 
                            key={team.name}
                            className="bg-neutral-50/70 border border-neutral-200 p-3.5 text-left rounded-xl space-y-2 transition-all hover:bg-neutral-100/40"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-0.5">
                                <span className="block text-xs font-black text-neutral-700 uppercase font-display">
                                  {team.name}
                                </span>
                                {team.leader ? (
                                  <span className="block text-[9px] text-neutral-500 font-medium">
                                    Gestor: {team.leader.name}
                                  </span>
                                ) : (
                                  <span className="block text-[9px] text-neutral-400 italic">
                                    Sem gestor atribuído
                                  </span>
                                )}
                              </div>
                              <span className="text-[8px] bg-neutral-250 text-neutral-600 font-mono font-black px-1.5 py-0.5 rounded leading-none shrink-0 font-bold">
                                INATIVO
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[10px] pt-1.5 border-t border-neutral-200">
                              <div className="bg-white p-1.5 rounded border border-neutral-200">
                                <span className="block text-[8px] text-neutral-400 uppercase font-mono">SDRs</span>
                                <strong className="block text-neutral-600 font-semibold font-mono pt-0.5 text-[11px]">
                                  {team.totalSdr} <span className="text-[9px] font-normal text-neutral-400">Total</span>
                                </strong>
                              </div>
                              <div className="bg-white p-1.5 rounded border border-neutral-200">
                                <span className="block text-[8px] text-neutral-400 uppercase font-mono">Assessores</span>
                                <strong className="block text-neutral-600 font-semibold font-mono pt-0.5 text-[11px]">
                                  {team.totalAssessor} <span className="text-[9px] font-normal text-neutral-400">Total</span>
                                </strong>
                              </div>
                            </div>
                          </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* TODOS OS PROFISSIONAIS (SDRs e Assessores) COM FILTRO DE DATA RETROATIVA */
              <div className="space-y-4 text-left">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1.5 border-b border-neutral-100">
                  <div className="space-y-0.5">
                    <h4 className="text-[10px] font-mono font-black uppercase text-neutral-850 tracking-wider">
                      Painel Operacional Integrado & Filtro Calendário
                    </h4>
                    <p className="text-[9px] text-neutral-450 leading-none">
                      Lista consolidada filtrada por vigência de contratação/admissão retroativa.
                    </p>
                  </div>
                  
                  {/* Search box with Search icon */}
                  <div className="relative max-w-full sm:max-w-xs flex-grow sm:flex-grow-0">
                    <input
                      type="text"
                      placeholder="Buscar profissional..."
                      value={sdrSearchAdmin}
                      onChange={(e) => setSdrSearchAdmin(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-neutral-50 border border-neutral-300 rounded-lg text-xs font-semibold focus:outline-none focus:border-black transition-all animate-none"
                    />
                    <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>

                {/* ADVANCED MULTIPERIOD & PROFESSIONAL TYPE FILTERS */}
                <div id="filter-audit-panel" className="bg-[#FAF9F5]/60 border border-neutral-250 p-4 rounded-xl space-y-4 text-left font-sans">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    
                    {/* Filter 1: Professional Category */}
                    <div className="space-y-1.5 md:col-span-5">
                      <label className="block text-[8.5px] font-mono font-black text-neutral-500 uppercase tracking-widest leading-none">
                        Cargo / Tipo de Profissional
                      </label>
                      <div className="flex bg-neutral-100/90 p-0.5 rounded-lg border border-neutral-250">
                        <button
                          type="button"
                          onClick={() => setProfessionalType('all')}
                          className={`flex-1 py-1.5 text-[8.5px] font-black uppercase tracking-wider rounded transition-all cursor-pointer ${
                            professionalType === 'all'
                              ? 'bg-neutral-900 text-white shadow-3xs'
                              : 'text-neutral-500 hover:text-black'
                          }`}
                        >
                          Ambos
                        </button>
                        <button
                          type="button"
                          onClick={() => setProfessionalType('sdrs')}
                          className={`flex-1 py-1.5 text-[8.5px] font-black uppercase tracking-wider rounded transition-all cursor-pointer ${
                            professionalType === 'sdrs'
                              ? 'bg-neutral-900 text-white shadow-3xs'
                              : 'text-neutral-500 hover:text-black'
                          }`}
                        >
                          SDRs ({sdrs.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setProfessionalType('assessores')}
                          className={`flex-1 py-1.5 text-[8.5px] font-black uppercase tracking-wider rounded transition-all cursor-pointer ${
                            professionalType === 'assessores'
                              ? 'bg-neutral-900 text-white shadow-3xs'
                              : 'text-neutral-500 hover:text-black'
                          }`}
                        >
                          Assessores ({assessores.length})
                        </button>
                      </div>
                    </div>

                    {/* Filter 2: Custom Date Range Interval (dates, days, intervals) */}
                    <div className="space-y-1.5 md:col-span-7">
                      <label className="block text-[8.5px] font-mono font-black text-neutral-500 uppercase tracking-widest leading-none">
                        Filtrar por Intervalo Customizado de Datas (Dias / Períodos)
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 relative">
                          <span className="absolute left-2.5 top-2 text-[8px] font-black text-neutral-400 font-mono">DE:</span>
                          <input
                            type="date"
                            value={filterStartDate}
                            onChange={(e) => {
                              setFilterStartDate(e.target.value);
                              setQuickPeriodFilter('custom');
                            }}
                            className="w-full bg-white border border-neutral-300 rounded-lg text-xs pl-8 pr-2 py-1.5 font-bold focus:outline-none focus:border-black cursor-pointer"
                          />
                        </div>
                        <div className="text-neutral-500 font-bold text-[10px] uppercase font-mono">Até</div>
                        <div className="flex-1 relative">
                          <span className="absolute left-2.5 top-2 text-[8px] font-black text-neutral-400 font-mono">ATÉ:</span>
                          <input
                            type="date"
                            value={filterEndDate}
                            onChange={(e) => {
                              setFilterEndDate(e.target.value);
                              setQuickPeriodFilter('custom');
                            }}
                            className="w-full bg-white border border-neutral-300 rounded-lg text-xs pl-9 pr-2 py-1.5 font-bold focus:outline-none focus:border-black cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Filter 3: Quick Temporal Shortcuts */}
                  <div className="pt-3 border-t border-neutral-200/50 flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-mono text-[9px] text-neutral-500 font-black uppercase tracking-wider">
                      🗓️ Filtros Rápidos (meses / anos):
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setQuickPeriodFilter('all');
                          setFilterStartDate('');
                          setFilterEndDate('');
                        }}
                        className={`px-2 py-1 text-[8.5px] font-black uppercase rounded border transition-all cursor-pointer ${
                          quickPeriodFilter === 'all'
                            ? 'bg-black text-white border-black shadow-3xs'
                            : 'bg-white hover:bg-neutral-100 text-neutral-600 border-neutral-300'
                        }`}
                      >
                        Sem Restrição (Tudo)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setQuickPeriodFilter('ref_month');
                          setFilterStartDate('2026-06-01');
                          setFilterEndDate('2026-06-30');
                        }}
                        className={`px-2 py-1 text-[8.5px] font-black uppercase rounded border transition-all cursor-pointer ${
                          quickPeriodFilter === 'ref_month'
                            ? 'bg-black text-white border-black shadow-3xs'
                            : 'bg-white hover:bg-neutral-100 text-neutral-600 border-neutral-300'
                        }`}
                      >
                        Mês de Junho/2026
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setQuickPeriodFilter('may_2026');
                          setFilterStartDate('2026-05-01');
                          setFilterEndDate('2026-05-31');
                        }}
                        className={`px-2 py-1 text-[8.5px] font-black uppercase rounded border transition-all cursor-pointer ${
                          quickPeriodFilter === 'may_2026'
                            ? 'bg-black text-white border-black shadow-3xs'
                            : 'bg-white hover:bg-neutral-100 text-neutral-600 border-neutral-300'
                        }`}
                      >
                        Mês de Maio/2026
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setQuickPeriodFilter('year_2026');
                          setFilterStartDate('2026-01-01');
                          setFilterEndDate('2026-12-31');
                        }}
                        className={`px-2 py-1 text-[8.5px] font-black uppercase rounded border transition-all cursor-pointer ${
                          quickPeriodFilter === 'year_2026'
                            ? 'bg-black text-white border-black shadow-3xs'
                            : 'bg-white hover:bg-neutral-100 text-neutral-600 border-neutral-300'
                        }`}
                      >
                        Ano de 2026 Completo
                      </button>
                    </div>
                  </div>

                  {/* Retroactivity check live status wrapper */}
                  {filterEndDate && (
                    <div className="p-2 border border-blue-200 bg-blue-50/50 text-[10px] text-blue-900 rounded-lg font-semibold flex items-center gap-1.5 animate-fade-in leading-relaxed">
                      <span>ℹ️ <strong>Auditoria Retroativa Ativa:</strong> O sistema removeu profissionais admitidos após <strong>{filterEndDate.split('-')[2]}/{filterEndDate.split('-')[1]}/{filterEndDate.split('-')[0]}</strong>, evitando que apareçam em relatórios e logs retroativos anteriores à sua contratação real.</span>
                    </div>
                  )}

                </div>

                {(() => {
                  const brFormat = (dateStr?: string) => {
                    if (!dateStr) return '—';
                    const parts = dateStr.split('-');
                    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
                    return dateStr;
                  };

                  const mergedList = [
                    ...sdrs.map(s => ({ ...s, isSdr: true, roleLabel: 'SDR' })),
                    ...assessores.map(a => ({ ...a, isSdr: false, roleLabel: 'Assessor', agendamentosCount: 0, efetivacoesCount: 0, callsCount: 0 }))
                  ];

                  const filteredList = mergedList.filter(p => {
                    const matchesTeam = selectedTeamsFilter.length === 0 || (p.team && selectedTeamsFilter.includes(p.team));
                    
                    const matchesSearch = p.name.toLowerCase().includes(sdrSearchAdmin.toLowerCase()) || 
                                          (p.team && p.team.toLowerCase().includes(sdrSearchAdmin.toLowerCase()));

                    const matchesType = professionalType === 'all' ||
                                        (professionalType === 'sdrs' && p.isSdr) ||
                                        (professionalType === 'assessores' && !p.isSdr);

                    // If a date range/filter is set, prevent members from appearing in date periods before their admissionDate
                    if (p.admissionDate && filterEndDate) {
                      if (p.admissionDate > filterEndDate) {
                        return false; 
                      }
                    }

                    return matchesTeam && matchesSearch && matchesType;
                  });

                  if (filteredList.length === 0) {
                    return (
                      <div className="p-8 border border-dashed border-neutral-250 rounded-xl text-center text-xs text-neutral-450 font-medium">
                        Nenhum profissional comercial (SDR ou Assessor) localizado para os critérios aplicados de busca, time e data de admissão.
                      </div>
                    );
                  }

                  return (
                    <div className="overflow-x-auto border border-neutral-200 rounded-xl bg-white shadow-3xs max-h-[380px] overflow-y-auto font-sans">
                      <table className="w-full text-[11px] border-collapse font-sans">
                        <thead>
                          <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-mono font-black uppercase text-[8.5px] tracking-wider sticky top-0 bg-neutral-50 z-20 text-left">
                            <th className="p-3 text-left pl-4">Colaborador / Profissional</th>
                            <th className="p-3 text-left">Equipe Comercial</th>
                            <th className="p-3 text-center">Cargo</th>
                            <th className="p-3 text-center">Data de Admissão</th>
                            <th className="p-3 text-center">Status</th>
                            <th className="p-3 text-right">Métrica Chave A</th>
                            <th className="p-3 text-right">Métrica Chave B</th>
                            <th className="p-3 text-right pr-4">Resultado / Histórico</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {filteredList.map((p: any) => {
                            let tagClass = 'bg-neutral-100 text-neutral-650 border border-neutral-200';
                            const teamNameUpper = (p.team || '').toUpperCase();
                            if (teamNameUpper.includes('PJ')) {
                              tagClass = 'bg-blue-50 text-blue-800 border border-blue-200';
                            } else if (teamNameUpper.includes('VMB')) {
                              tagClass = 'bg-purple-50 text-purple-800 border border-purple-200';
                            } else if (teamNameUpper.includes('TIER') || teamNameUpper.includes('ASSESSOR') || teamNameUpper.includes('ADVISOR') || teamNameUpper.includes('ADVISORY')) {
                              tagClass = 'bg-emerald-50 text-emerald-800 border border-emerald-200';
                            } else if (teamNameUpper.includes('PF') || teamNameUpper.includes('HUNTER')) {
                              tagClass = 'bg-amber-50 text-amber-800 border border-amber-200';
                            }

                            if (p.isSdr) {
                              const conversionRate = p.agendamentosCount > 0 
                                ? Math.round((p.efetivacoesCount / p.agendamentosCount) * 100) 
                                : 0;
                              return (
                                <tr key={`sdr-${p.id}`} className="hover:bg-neutral-50/55 transition-colors">
                                  <td className="p-3 pl-4 font-bold text-neutral-900 leading-tight">
                                    {p.name}
                                  </td>
                                  <td className="p-3">
                                    <span className={`inline-block px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider ${tagClass}`}>
                                      {p.team || 'Sem Equipe'}
                                    </span>
                                  </td>
                                  <td className="p-3 text-center">
                                    <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-black bg-neutral-900 text-white uppercase tracking-wider leading-none">
                                      SDR Comercial
                                    </span>
                                  </td>
                                  <td className="p-3 text-center font-mono font-bold text-neutral-500">
                                    {brFormat(p.admissionDate)}
                                  </td>
                                  <td className="p-3 text-center">
                                    {p.active ? (
                                      <span className="inline-flex items-center gap-1 text-[8px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-150 uppercase tracking-wider leading-none">
                                        Ativo
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[8px] font-black text-neutral-450 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200 uppercase tracking-wider leading-none">
                                        Inativo
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-3 text-right font-mono font-bold text-neutral-800">
                                    📞 {p.callsCount ?? 0} Calls
                                  </td>
                                  <td className="p-3 text-right font-mono font-extrabold text-neutral-800">
                                    📅 {p.agendamentosCount} Agend.
                                  </td>
                                  <td className="p-3 text-right font-mono font-black text-emerald-750 pr-4">
                                    ★ {conversionRate}% conv
                                  </td>
                                </tr>
                              );
                            } else {
                              return (
                                <tr key={`assr-${p.id}`} className="hover:bg-neutral-50/55 transition-colors">
                                  <td className="p-3 pl-4 font-bold text-neutral-900 leading-tight">
                                    {p.name}
                                  </td>
                                  <td className="p-3">
                                    <span className={`inline-block px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider ${tagClass}`}>
                                      {p.team || 'Sem Equipe'}
                                    </span>
                                  </td>
                                  <td className="p-3 text-center">
                                    <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-black bg-amber-500 text-neutral-900 uppercase tracking-wider leading-none">
                                      Assessor RP
                                    </span>
                                  </td>
                                  <td className="p-3 text-center font-mono font-bold text-neutral-500">
                                    {brFormat(p.admissionDate)}
                                  </td>
                                  <td className="p-3 text-center">
                                    {p.active ? (
                                      <span className="inline-flex items-center gap-1 text-[8px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-150 uppercase tracking-wider leading-none">
                                        Ativo
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[8px] font-black text-neutral-450 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200 uppercase tracking-wider leading-none">
                                        Inativo
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-3 text-right font-mono text-neutral-600 font-semibold">
                                    💰 R$ {(p.captacaoMes || 0).toLocaleString('pt-BR')}
                                  </td>
                                  <td className="p-3 text-right font-mono text-neutral-600 font-bold">
                                    🛒 {p.crossSellCount || 0} cross
                                  </td>
                                  <td className="p-3 text-right font-mono text-neutral-400 font-black pr-4">
                                    —
                                  </td>
                                </tr>
                              );
                            }
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}

              </div>
            )}
          </div>
        </div>

      </div>

      {/* --- DESIGN CRITICAL: INTEGRATION SETTINGS SECTION --- */}
      <div className="bg-white border-2 border-neutral-900 p-6 rounded-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-105 pb-3 gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Settings className="w-4.5 h-4.5 text-neutral-900" />
              <h3 className="text-sm font-black uppercase tracking-wider text-neutral-950 font-display">
                Configurações Globais de Integração (Webhooks)
              </h3>
            </div>
            <p className="text-xs text-neutral-505 font-medium leading-relaxed font-sans">
              Encaminhe dados operacionais em real-time para ferramentas auxiliares de automação (ActiveCampaign, n8n, Make, CRM Interno, Zapier, Google Sheets).
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggleIntegration}
            className={`px-3 py-1.5 rounded-lg border text-xs font-bold font-sans flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              integrationSettings.enabled
                ? 'bg-emerald-50 border-emerald-250 text-emerald-850'
                : 'bg-neutral-100 border-neutral-250 text-neutral-500'
            }`}
          >
            {integrationSettings.enabled ? (
              <>
                <Wifi className="w-4 h-4 text-emerald-600 animate-pulse" />
                INTEGRAÇÃO ATIVA (ONLINE)
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-neutral-500" />
                CONEXÃO INATIVA (PAUSADA)
              </>
            )}
          </button>
        </div>

        <form onSubmit={handleSaveWebhookSettings} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          <div className="lg:col-span-7 space-y-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-neutral-550 uppercase tracking-widest leading-none">
                URL Endpoint do Webhook de Produção (HTTPS)
              </label>
              <div className="relative">
                <input
                  type="url"
                  placeholder="Ex: https://n8n.seumodulo.com.br/webhook/0192a8..."
                  value={webhookUrlInput}
                  onChange={e => setWebhookUrlInput(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-semibold text-neutral-805 font-mono focus:outline-none focus:border-black focus:bg-white transition-all shadow-3xs"
                />
                <Link2 className="w-4 h-4 text-neutral-400 absolute left-2.5 top-3.5" />
              </div>
              <span className="block text-[9px] text-neutral-450 italic">
                O cockpit emitirá payloads estruturados nos eventos de: <strong>matches_consolidated, audit_completed, sales_predictions</strong> e <strong>one_on_one_saved</strong>.
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-black hover:opacity-90 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                Salvar URL de Envio
              </button>

              <button
                type="button"
                disabled={testing}
                onClick={handleTestIntegration}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-extrabold text-xs rounded-xl border border-neutral-250 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {testing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Buscando Webhook...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Testar Conexão Médio
                  </>
                )}
              </button>
            </div>

            {testResult && (
              <div className={`p-4 rounded-xl border flex gap-2.5 text-xs font-semibold text-left animate-fade-in ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-250 text-emerald-805'
                  : 'bg-amber-50 border-amber-305 text-amber-900'
              }`}>
                {testResult.success ? (
                  <Check className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <strong className="block text-[11px] uppercase tracking-wider mb-0.5">Resposta do Diagnóstico</strong>
                  <span>{testResult.msg}</span>
                </div>
              </div>
            )}
          </div>

          {/* Right layout metadata info */}
          <div className="lg:col-span-5 bg-[#FCFBF8] border border-neutral-205 p-5 rounded-2xl text-xs space-y-4">
            <span className="block text-[10px] font-black uppercase text-neutral-450 tracking-wider font-mono border-b border-neutral-200 pb-1.5">
              PAINEL STATUS RETROATIVO
            </span>

            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-0.5 text-left">
                <span className="block text-[8px] text-neutral-405 font-bold uppercase font-mono">STATUS DE DISPARO</span>
                {integrationSettings.lastSendStatus === 'success' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase font-sans">
                    ● Sincronizado
                  </span>
                ) : integrationSettings.lastSendStatus === 'failed' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-black text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200 uppercase font-sans">
                    ● Falha Envio
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-black text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200 uppercase font-sans">
                    Aguardando...
                  </span>
                )}
              </div>

              <div className="space-y-0.5 text-left">
                <span className="block text-[8px] text-neutral-405 font-bold uppercase font-mono">ÚLTIMO RETORNO HTTP</span>
                <strong className="font-mono font-black text-xs text-neutral-900 block pt-0.5">
                  {integrationSettings.lastSendHttpStatus !== null 
                    ? `Código ${integrationSettings.lastSendHttpStatus}` 
                    : 'Sem registros'}
                </strong>
              </div>
            </div>

            <div className="space-y-0.5 text-left pt-2 border-t border-neutral-150">
              <span className="block text-[8px] text-neutral-405 font-bold uppercase font-mono text-left">TIMESTAMP INTEGRADO</span>
              <span className="font-mono text-[11px] text-neutral-700 font-bold block pt-0.5">
                {integrationSettings.lastSendTimestamp 
                  ? new Date(integrationSettings.lastSendTimestamp).toLocaleDateString('pt-BR') + ' às ' + new Date(integrationSettings.lastSendTimestamp).toLocaleTimeString('pt-BR')
                  : 'Nenhum payload enviado ainda'}
              </span>
            </div>
          </div>

        </form>
      </div>

    </div>
  );
}
