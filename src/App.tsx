import React from 'react';
import useAppStore from './store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import { useSDRMetrics } from './hooks/useSDRMetrics';
import { usePredictiveRunRate } from './hooks/usePredictiveRunRate';
import { getFiscalMonthsRange } from './utils/dateHelpers';
import { LoginGate } from './components/LoginGate';
import { DateService } from './shared/services/date.service';
import { MetricsService } from './shared/services/metrics.service';

// Components
import SDRSection from './components/SDRSection';
import MatchDashboard from './components/MatchDashboard';
import LeadersAdminSection from './components/LeadersAdminSection';
import ActiveMembersSection from './components/ActiveMembersSection';
import SyncHistory from './components/SyncHistory';
import SystemAuditSection from './components/SystemAuditSection';
import ReportsSection from './components/ReportsSection';
import { GoalsPlanEditor } from './components/GoalsPlanEditor';
import { IndividualProfileModal } from './components/IndividualProfileModal';
import { signOutLeader } from './lib/firebaseClient';

// Icons
import { 
  Users, Shield, Sparkles, FileText, RefreshCw, Info, Lock, LogOut, Calendar, Key,
  Crown, AlertTriangle, X, ArrowUpRight, Database, Sun, Moon, Workflow, TrendingUp, Search, Camera, Bell, Target
} from 'lucide-react';

export default function App() {
  const theme = 'light';
  const [sidebarOpen, setSidebarOpen] = React.useState<boolean>(true);
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [showSearchResults, setShowSearchResults] = React.useState<boolean>(false);
  const [selectedProfileEntity, setSelectedProfileEntity] = React.useState<{ type: 'sdr' | 'assessor' | 'consultor', id: string } | null>(null);
  const [gestaoSubTab, setGestaoSubTab] = React.useState<'integrantes' | 'runrate'>('integrantes');

  React.useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }, []);

  const ToggleThemeButton = () => null;

  // Environment variable and backend verification check
  const [envCheck, setEnvCheck] = React.useState<{
    checked: boolean;
    ok: boolean;
    message: string;
    missingKeys: string[];
  }>({
    checked: false,
    ok: true,
    message: '',
    missingKeys: [],
  });
  const [bypassWarning, setBypassWarning] = React.useState(false);

  React.useEffect(() => {
    async function verifyEnv() {
      try {
        const response = await fetch('/api/config/status');
        if (response.ok) {
          const data = await response.json();
          setEnvCheck({
            checked: true,
            ok: data.ok,
            message: data.message,
            missingKeys: data.missingKeys || [],
          });
        } else {
          setEnvCheck({
            checked: true,
            ok: true,
            message: 'Não foi possível verificar as credenciais no servidor. Operando em contingência local.',
            missingKeys: [],
          });
        }
      } catch (err) {
        setEnvCheck({
          checked: true,
          ok: true,
          message: 'Erro ao se conectar ao servidor de validação. Operando em contingência local.',
          missingKeys: [],
        });
      }
    }
    verifyEnv();
  }, []);

  // 1. Selector optimized Zustand Store calls to avoid unsolicited re-renders
  const {
    currentUser,
    activeTab,
    currentMonth,
    sdrs,
    assessores,
    matches,
    startDate,
    endDate,
    leaders,
    teamGoals: teamGoalsRaw,
    teams,
    oneOnOneLogs,
    campaigns,
    addOneOnOneLog,
    addCampaign,
    deleteCampaign,
    updateCampaignStatus,
    setCurrentUser,
    setActiveTab,
    setCurrentMonth,
    updateStartDate,
    updateEndDate,
    addTeam,
    deleteTeam,
    renameTeam,
    addSDR,
    deleteSDR,
    toggleActiveSDR,
    updateSDRMetrics,
    updateSDR,
    revertPromotion,
    addAssessor,
    deleteAssessor,
    toggleActiveAssessor,
    updateAssessor,
    generateMatches,
    updateMatchDates,
    addLeader,
    updateLeader,
    deleteLeader,
    updateTeamGoals,
    resetToDefaults,
    disabledRotationTeams,
    toggleRotationForTeam,
    updateMatchAssessor,
    addManualMatch,
    deleteMatch,
    deleteOneOnOneLog,
    syncFromSupabase,
  } = useAppStore(
    useShallow((state) => ({
      currentUser: state.currentUser,
      activeTab: state.activeTab,
      currentMonth: state.currentMonth,
      sdrs: state.sdrs,
      assessores: state.assessores,
      matches: state.matches,
      startDate: state.startDate,
      endDate: state.endDate,
      leaders: state.leaders,
      teamGoals: state.teamGoals,
      teams: state.teams,
      oneOnOneLogs: state.oneOnOneLogs,
      campaigns: state.campaigns,
      disabledRotationTeams: state.disabledRotationTeams,
      toggleRotationForTeam: state.toggleRotationForTeam,
      addOneOnOneLog: state.addOneOnOneLog,
      deleteOneOnOneLog: state.deleteOneOnOneLog,
      syncFromSupabase: state.syncFromSupabase,
      addCampaign: state.addCampaign,
      deleteCampaign: state.deleteCampaign,
      updateCampaignStatus: state.updateCampaignStatus,
      setCurrentUser: state.setCurrentUser,
      setActiveTab: state.setActiveTab,
      setCurrentMonth: state.setCurrentMonth,
      updateStartDate: state.updateStartDate,
      updateEndDate: state.updateEndDate,
      addTeam: state.addTeam,
      deleteTeam: state.deleteTeam,
      renameTeam: state.renameTeam,
      addSDR: state.addSDR,
      deleteSDR: state.deleteSDR,
      toggleActiveSDR: state.toggleActiveSDR,
      updateSDRMetrics: state.updateSDRMetrics,
      updateSDR: state.updateSDR,
      revertPromotion: state.revertPromotion,
      addAssessor: state.addAssessor,
      deleteAssessor: state.deleteAssessor,
      toggleActiveAssessor: state.toggleActiveAssessor,
      updateAssessor: state.updateAssessor,
      generateMatches: state.generateMatches,
      updateMatchDates: state.updateMatchDates,
      updateMatchAssessor: state.updateMatchAssessor,
      addManualMatch: state.addManualMatch,
      deleteMatch: state.deleteMatch,
      addLeader: state.addLeader,
      updateLeader: state.updateLeader,
      deleteLeader: state.deleteLeader,
      updateTeamGoals: state.updateTeamGoals,
      resetToDefaults: state.resetToDefaults,
    }))
  );

  const teamGoals = React.useMemo(() => {
    if (currentUser && currentUser.role === 'leader' && currentUser.teamName) {
      const specific = teamGoalsRaw.teamSpecificGoals?.[currentUser.teamName];
      if (specific) {
        return {
          ...teamGoalsRaw,
          ...specific,
        };
      }
    }
    return teamGoalsRaw;
  }, [teamGoalsRaw, currentUser]);

  // 2. Custom hook to handle SDR pool and filtering
  const {
    derivedSdrsForActiveMonth,
    activeSDRsCount,
    filteredAssessores,
    activeAssessoresCount,
    filteredMatches,
  } = useSDRMetrics();

  // For Rodízio Exception: Complete pool of SDRs for the active month ignoring team filters
  const unfilteredDerivedSdrsForActiveMonth = React.useMemo(() => {
    return (sdrs || []).filter(s => !s.promotedToAssessor).map((sdr): typeof sdr => {
      const record = sdr.monthlyRecords?.[currentMonth];
      return {
        ...sdr,
        agendamentosCount: record ? (record.agendamentosCount ?? 0) : 0,
        efetivacoesCount: record ? (record.efetivacoesCount ?? 0) : 0,
        contasAbertasCount: record ? (record.contasAbertasCount ?? 0) : 0,
        callsCount: record ? (record.callsCount ?? 0) : 0,
        metaAgendamentos: record ? (record.metaAgendamentos ?? 20) : (sdr.metaAgendamentos ?? 20),
        metaEfetivacaoRate: record ? (record.metaEfetivacaoRate ?? 50) : (sdr.metaEfetivacaoRate ?? 50),
        metaEfetivacoes: record ? (record.metaEfetivacoes ?? 10) : (sdr.metaEfetivacoes ?? 10),
        metaContasAbertas: record ? (record.metaContasAbertas ?? 5) : (sdr.metaContasAbertas ?? 5),
      };
    });
  }, [sdrs, currentMonth]);

  // 3. Custom hook for smart thermometer projections and predictive forecasting
  const {
    thermStats,
    sdrPredictions,
  } = usePredictiveRunRate(derivedSdrsForActiveMonth, currentMonth);

  // Database status tracking
  const [dbStatus, setDbStatus] = React.useState<{ 
    ok: boolean; 
    databaseConnected: boolean; 
    databaseType: string; 
    databaseUrl: string; 
    message: string;
    lastError?: string | null;
  } | null>(null);

  const [lastSyncTime, setLastSyncTime] = React.useState<Date>(new Date());
  const [isSyncing, setIsSyncing] = React.useState<boolean>(false);

  // Automatic Background Synchronization with Firebase Cloud Firestore on mount and polling every 12s
  React.useEffect(() => {
    const runSync = async () => {
      setIsSyncing(true);
      try {
        const res = await syncFromSupabase();
        
        // Fetch absolute database status and connection metadata
        const statusRes = await fetch("/api/db/status");
        const statusData = await statusRes.json();
        setDbStatus(statusData);

        if (res.success) {
          setLastSyncTime(new Date());
          console.log(`[Database Auto-Sync] Sincronização concluída com sucesso: ${res.message}`);
          console.info(`[Database Connection INFO] Conectado e ativo na nuvem. Endpoint/Host: ${statusData.databaseUrl} (Fingerprint: ${statusData.connectionHash || 'n/a'})`);
        } else {
          console.warn(`[Database Auto-Sync] Aviso: ${res.message}`);
          console.warn(`[Database Connection INFO] Modo contingência/offline. Endpoint/Host: ${statusData.databaseUrl} (Fingerprint: ${statusData.connectionHash || 'n/a'})`);
        }
      } catch (err: any) {
        console.error('[Database Auto-Sync] Erro inesperado durante sincronização:', err);
      } finally {
        setIsSyncing(false);
      }
    };

    // Run initial sync
    runSync();

    // Query server configuration and status
    fetch("/api/db/status")
      .then(res => res.json())
      .then(info => {
        setDbStatus(info);
        console.info(`[Database Init Connection INFO] Firebase Cloud Firestore ativo com host/cluster: ${info.databaseUrl} (Fingerprint único: ${info.connectionHash || 'n/a'})`);
      })
      .catch(err => console.error("Erro consultando status do DB:", err));

    // Setup background interval polling when tab is active and user is logged in
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && currentUser) {
        runSync();
      }
    }, 12000);

    return () => clearInterval(interval);
  }, [syncFromSupabase, currentUser]);

  // Banner state and calculations
  const [isBannerDismissed, setIsBannerDismissed] = React.useState(false);
  const [showSyncLogHistory, setShowSyncLogHistory] = React.useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = React.useState(false);

  // Reset dismissal state whenever currentMonth changes
  React.useEffect(() => {
    setIsBannerDismissed(false);
  }, [currentMonth]);

  const promotedSDRsCount = React.useMemo(() => {
    return sdrs.filter(s => s.promotedToAssessor).length;
  }, [sdrs]);

  const criticalSDRs = React.useMemo(() => {
    const { elapsedDays, totalDays } = DateService.getElapsedDays(currentMonth);
    let list = derivedSdrsForActiveMonth;
    if (currentUser && currentUser.role !== 'admin') {
      const leaderTeam = currentUser.teamName || currentUser.equipe;
      if (leaderTeam) {
        list = derivedSdrsForActiveMonth.filter(s => s.team === leaderTeam);
      }
    }
    return list
      .filter(s => s.active && !s.promotedToAssessor)
      .map(sdr => {
        const perf = MetricsService.calculateSDRPerformance(sdr, elapsedDays, totalDays);
        return { sdr, perf };
      })
      .filter(item => item.perf.pacingTrend === 'ALERTA CRÍTICO');
  }, [derivedSdrsForActiveMonth, currentMonth, currentUser]);

  // 4. Dynamic reference months list
  const fiscalMonths = getFiscalMonthsRange();

  // Log out mechanism with cloud auth signout
  const handleLogout = () => {
    setCurrentUser(null);
    signOutLeader().catch(e => console.warn("[App Logout] Error during Firebase signs off:", e));
  };

  // Profile image upload reader
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1200000) {
      alert("A imagem selecionada é muito grande. Escolha uma foto de até 1.2MB para maior velocidade de carregamento.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        // Set state session
        setCurrentUser({ ...currentUser, photo: base64 });
        
        // Save in global database collection
        if (currentUser?.id) {
          updateLeader(currentUser.id, { photo: base64 });
        } else {
          const matched = leaders.find(l => l.name.toLowerCase() === currentUser?.name.toLowerCase());
          if (matched) {
            updateLeader(matched.id, { photo: base64 });
          }
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Factory reset warning
  const handleResetToDefaults = () => {
    if (window.confirm('Deseja restaurar as configurações originais e dados de fábrica do rodízio?')) {
      resetToDefaults();
    }
  };

  // --- 0. RENDER CONFIGURATION WARNING GATE ---
  if (envCheck.checked && !envCheck.ok && !bypassWarning) {
    return (
      <div className="w-full min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors duration-250">
        <div className="min-h-screen flex flex-col justify-between p-4 selection:bg-neutral-900 selection:text-white font-sans animate-fade-in">
          
          {/* Transparent header */}
          <div className="w-full max-w-7xl mx-auto py-4 flex items-center justify-between border-b border-neutral-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-black leading-none border-2 border-neutral-900 shadow-sm animate-pulse">
                <Workflow className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-neutral-900 font-display">
                Corretora Rodízio Premium
              </span>
            </div>
            <span className="text-[10px] font-black py-1.5 px-3 bg-amber-50 rounded-lg border border-amber-300 text-amber-800 uppercase tracking-widest font-mono">
              Aviso de Sistema
            </span>
          </div>

          {/* Crisp High-Contrast Warning Gate */}
          <div className="w-full max-w-lg mx-auto py-12">
            <div className="bg-white border-2 border-neutral-900 p-8 rounded-2xl shadow-3xs space-y-6">
              
              <div className="space-y-4">
                <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 border-2 border-amber-400 mx-auto animate-bounce">
                  <Key className="w-6 h-6 text-amber-600" />
                </div>
                <div className="space-y-2 text-center animate-fade-in">
                  <span className="text-[9px] font-black tracking-widest uppercase bg-amber-100 border border-amber-300 text-amber-800 px-2 py-0.5 rounded font-mono">
                    Configuração Requerida
                  </span>
                  <h1 className="text-xl font-black text-neutral-950 font-display uppercase tracking-tight">
                    Chave Gemini API (GEMINI_API_KEY) Ausente
                  </h1>
                  <p className="text-xs text-neutral-600 leading-relaxed text-left bg-neutral-50 p-4 border border-neutral-250 rounded-xl mt-3">
                    {envCheck.message}
                  </p>
                </div>

                <div className="border-t border-neutral-200 pt-4 space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-neutral-500 font-mono">Como configurar a chave de API:</h4>
                  <ol className="text-[11px] text-neutral-650 space-y-2 list-decimal pl-4 font-medium leading-relaxed">
                    <li>Abra o menu de <strong className="text-neutral-900">Settings / Configurações</strong> no canto inferior esquerdo do AI Studio.</li>
                    <li>Clique em <strong className="text-neutral-900">Secrets</strong> ou <strong className="text-neutral-900">Variáveis de Ambiente</strong>.</li>
                    <li>Adicione uma nova variável com o nome <code className="bg-neutral-100 px-1 py-0.5 rounded font-mono font-bold text-black border border-neutral-250">GEMINI_API_KEY</code> e cole o seu token da Google Gemini.</li>
                    <li>O AI Studio reiniciará o contêiner automaticamente para aplicar as alterações.</li>
                  </ol>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => setBypassWarning(true)}
                    className="w-full py-2.5 bg-black hover:bg-neutral-900 text-brand-sand text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    Continuar em Contingência Local
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setEnvCheck((prev) => ({ ...prev, checked: false }));
                      try {
                        const response = await fetch('/api/config/status');
                        if (response.ok) {
                          const data = await response.json();
                          setEnvCheck({
                            checked: true,
                            ok: data.ok,
                            message: data.message,
                            missingKeys: data.missingKeys || [],
                          });
                        }
                      } catch (e) {
                        setEnvCheck((prev) => ({ ...prev, checked: true }));
                      }
                    }}
                    className="w-full sm:w-auto py-2.5 px-4 bg-white hover:bg-brand-sand text-neutral-900 border border-neutral-350 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer whitespace-nowrap"
                  >
                    Testar Novamente
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Minimal Swiss footer */}
          <div className="text-center text-[10px] text-neutral-450 uppercase font-bold tracking-widest pb-4">
            Autenticador do Sistema &bull; Segurança Operacional
          </div>

        </div>
      </div>
    );
  }

  // Unified Search logic for pages and data
  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return { pages: [], sdrs: [], assessores: [], leaders: [] };
    const query = searchQuery.toLowerCase().trim();

    // 1. Pages/Sections within the Hub
    const allPages = [
      { id: 'membros-ativos', label: 'Gestão de Equipe & Previsões SDR', path: 'Menu → Gestão de Equipe' },
      { id: 'central-metas', label: 'Central de Metas 🎯', path: 'Menu → Central de Metas' },
      { id: 'reports', label: 'Relatórios Executivos & Métricas', path: 'Menu → Relatórios' },
      { id: 'matches', label: 'Painel de Rodízio de Leads', path: 'Menu → Painel de Rodízio' },
      { id: 'leaders-admin', label: 'Cadastro de Líderes de Equipe', path: 'Menu → Líderes' },
      { id: 'system-audit', label: 'Auditoria de Sistema', path: 'Menu → Auditoria' },
    ];
    const filteredPages = allPages.filter(p => 
      p.label.toLowerCase().includes(query) || p.path.toLowerCase().includes(query)
    );

    // 2. SDRs
    const filteredSDRs = (derivedSdrsForActiveMonth || []).filter(s => 
      s.name.toLowerCase().includes(query) || (s.team && s.team.toLowerCase().includes(query))
    );

    // 3. Assessores
    const filteredAssessores = (assessores || []).filter(a => 
      a.name.toLowerCase().includes(query) || (a.team && a.team.toLowerCase().includes(query))
    );

    // 4. Leaders / Líderes
    const filteredLeaders = (leaders || []).filter(l => 
      l.name.toLowerCase().includes(query) || (l.leaderTitle && l.leaderTitle.toLowerCase().includes(query))
    );

    return {
      pages: filteredPages,
      sdrs: filteredSDRs,
      assessores: filteredAssessores,
      leaders: filteredLeaders,
    };
  }, [searchQuery, derivedSdrsForActiveMonth, assessores, leaders]);

  const hasSearchResults = 
    searchResults.pages.length > 0 || 
    searchResults.sdrs.length > 0 || 
    searchResults.assessores.length > 0 || 
    searchResults.leaders.length > 0;

  const renderSearchResults = (onSelect?: () => void) => {
    if (!searchQuery) return null;

    return (
      <div className="absolute top-full left-0 right-0 mt-1 bg-page-card border border-page-border rounded-xl shadow-xl z-50 max-h-[320px] overflow-y-auto divide-y divide-page-border text-left">
        <div className="p-2 bg-[#f59e0b]/5 flex justify-between items-center border-b border-page-border">
          <span className="text-[10px] font-black text-page-text-muted uppercase tracking-wider">
            Resultados para "{searchQuery}"
          </span>
          <button 
            type="button"
            onClick={() => { setSearchQuery(''); setShowSearchResults(false); }}
            className="text-[10px] font-extrabold text-[#f59e0b] hover:underline"
          >
            Limpar
          </button>
        </div>

        {/* 1. Pages/Tab sections */}
        {searchResults.pages.length > 0 && (
          <div className="p-1.5">
            <div className="px-1.5 py-0.5 text-[8.5px] font-black text-page-text-muted uppercase tracking-wider">Aba do Sistema</div>
            <div className="space-y-0.5">
              {searchResults.pages.map(page => (
                <button
                  key={page.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(page.id as any);
                    setSearchQuery('');
                    setShowSearchResults(false);
                    if (onSelect) onSelect();
                  }}
                  className="w-full text-left px-2 py-1 hover:bg-page-hover rounded text-xs font-semibold text-page-text flex items-center justify-between transition cursor-pointer"
                >
                  <span className="truncate">{page.label}</span>
                  <span className="text-[8px] text-[#f59e0b] bg-amber-500/10 px-1.5 py-0.5 rounded uppercase font-bold shrink-0">Ir</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 2. SDRs */}
        {searchResults.sdrs.length > 0 && (
          <div className="p-1.5">
            <div className="px-1.5 py-0.5 text-[8.5px] font-black text-page-text-muted uppercase tracking-wider">SDRs Relacionados</div>
            <div className="space-y-0.5">
              {searchResults.sdrs.map(sdr => (
                <button
                  key={sdr.id}
                  type="button"
                  onClick={() => {
                    setSelectedProfileEntity({ type: 'sdr', id: sdr.id });
                    setSearchQuery('');
                    setShowSearchResults(false);
                    if (onSelect) onSelect();
                  }}
                  className="w-full text-left px-2 py-1 hover:bg-page-hover rounded text-xs font-semibold text-page-text flex items-center justify-between transition cursor-pointer"
                >
                  <div className="truncate">
                    <span className="block font-bold truncate">{sdr.name}</span>
                    <span className="text-[9px] text-page-text-muted leading-tight truncate">{sdr.team || 'SDR Cadastrado'}</span>
                  </div>
                  <span className="text-[8px] text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded font-bold shrink-0">SDR</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 3. Assessores */}
        {searchResults.assessores.length > 0 && (
          <div className="p-1.5">
            <div className="px-1.5 py-0.5 text-[8.5px] font-black text-page-text-muted uppercase tracking-wider">Assessores Relacionados</div>
            <div className="space-y-0.5">
              {searchResults.assessores.map(assr => (
                <button
                  key={assr.id}
                  type="button"
                  onClick={() => {
                    setSelectedProfileEntity({ type: assr.roleType === 'consultor' ? 'consultor' : 'assessor', id: assr.id });
                    setSearchQuery('');
                    setShowSearchResults(false);
                    if (onSelect) onSelect();
                  }}
                  className="w-full text-left px-2 py-1 hover:bg-page-hover rounded text-xs font-semibold text-page-text flex items-center justify-between transition cursor-pointer"
                >
                  <div className="truncate">
                    <span className="block font-bold truncate">{assr.name}</span>
                    <span className="text-[9px] text-page-text-muted leading-tight truncate">{assr.team || 'Assessor'}</span>
                  </div>
                  <span className="text-[8px] text-amber-650 bg-amber-500/10 px-1.5 py-0.5 rounded font-bold shrink-0">{assr.roleType === 'consultor' ? 'Consultor' : 'Assessor'}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 4. Leaders */}
        {searchResults.leaders.length > 0 && (
          <div className="p-1.5">
            <div className="px-1.5 py-0.5 text-[8.5px] font-black text-page-text-muted uppercase tracking-wider">Líderes Relacionados</div>
            <div className="space-y-0.5">
              {searchResults.leaders.map(ldr => (
                <button
                  key={ldr.id}
                  type="button"
                  onClick={() => {
                    setActiveTab('leaders-admin');
                    setSearchQuery('');
                    setShowSearchResults(false);
                    if (onSelect) onSelect();
                  }}
                  className="w-full text-left px-2 py-1 hover:bg-page-hover rounded text-xs font-semibold text-page-text flex items-center justify-between transition cursor-pointer"
                >
                  <div className="truncate">
                    <span className="block font-bold truncate">{ldr.name}</span>
                    <span className="text-[9px] text-page-text-muted leading-tight truncate">{ldr.leaderTitle || 'Liderança'}</span>
                  </div>
                  <span className="text-[8px] text-indigo-600 bg-indigo-500/10 px-1.5 py-0.5 rounded font-bold shrink-0">Líder</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {!hasSearchResults && (
          <div className="p-3 text-xs text-page-text-muted italic text-center">
            Nenhum resultado para "{searchQuery}"
          </div>
        )}
      </div>
    );
  };

  // --- 1. RENDER LOGIN SCREEN (FIRST PAGE ENTRANCE GATE) ---
  if (!currentUser) {
    return (
      <LoginGate onLogin={setCurrentUser} leaders={leaders} />
    );
  }

  // --- 2. RENDER THE LOGGED-IN SYSTEM ---
  return (
    <div className="w-full min-h-screen bg-page-bg text-page-text transition-colors duration-150 flex selection:bg-neutral-900 selection:text-white relative">
      
      {/* SIDEBAR FOR DESKTOP & MOBILE DRAWER */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-page-card text-page-text border-r border-page-border flex flex-col justify-between transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } ${sidebarOpen ? 'md:relative md:translate-x-0' : 'md:hidden md:w-0'}`}>
        <div className="flex flex-col h-full">
          
          {/* Symmetrical Brand / Logo Compartment */}
          <div className="px-6 py-6 border-b border-page-border flex flex-col items-center">
            <div className="w-11 h-11 bg-black dark:bg-white text-white dark:text-black font-black text-2xl flex items-center justify-center rounded-xl shadow-xs tracking-tighter transition-colors">
              H
            </div>
            <div className="mt-2 text-center">
              <span className="text-[11px] font-black uppercase tracking-wider text-page-text">HUB Liderança</span>
              <div className="w-8 h-0.5 bg-[#f59e0b] mx-auto mt-1"></div>
            </div>
          </div>

          {/* Search Button Compartment */}
          <div className="px-4 py-3 relative">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-page-hover border border-page-border rounded-lg text-xs">
              <Search className="w-3.5 h-3.5 text-page-text-muted shrink-0" />
              <input
                type="text"
                placeholder="Pesquisar no Hub..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
                className="bg-transparent border-none text-[11px] text-page-text focus:outline-none w-full placeholder-page-text-muted/65"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-0.5 hover:bg-page-hover rounded-full transition"
                >
                  <X className="w-3 h-3 text-page-text-muted" />
                </button>
              )}
            </div>
            {showSearchResults && renderSearchResults(() => {})}
          </div>

          {/* Lateral Menu Items Navigation */}
          <nav className="flex-grow px-3 py-2 space-y-1 overflow-y-auto custom-scrollbar">
            <div className="px-3 py-1.5 text-[9px] font-black text-page-text-muted uppercase tracking-widest">
              Favoritos & Módulos
            </div>

            {(currentUser.role === 'admin' || currentUser.role === 'leader') && (
              <button
                onClick={() => { setActiveTab('membros-ativos'); if (window.innerWidth < 768) setSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer text-left ${
                  activeTab === 'membros-ativos'
                    ? 'bg-page-hover text-page-text border-l-4 border-[#f59e0b]'
                    : 'text-page-text-muted hover:bg-page-hover/50 hover:text-page-text'
                }`}
              >
                <Users className="w-4 h-4 shrink-0 text-[#f59e0b]" />
                Gestão de equipe
              </button>
            )}

            {(currentUser.role === 'admin' || currentUser.role === 'leader') && (
              <button
                onClick={() => { setActiveTab('central-metas'); if (window.innerWidth < 768) setSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer text-left ${
                  activeTab === 'central-metas'
                    ? 'bg-page-hover text-page-text border-l-4 border-[#f59e0b]'
                    : 'text-page-text-muted hover:bg-page-hover/50 hover:text-page-text'
                }`}
              >
                <Target className="w-4 h-4 shrink-0 text-[#f59e0b]" />
                Central de Metas 🎯
              </button>
            )}

            {(currentUser.role === 'admin' || currentUser.role === 'leader') && (
              <button
                onClick={() => { setActiveTab('reports'); if (window.innerWidth < 768) setSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer text-left ${
                  activeTab === 'reports' || activeTab === 'relatorios'
                    ? 'bg-page-hover text-page-text border-l-4 border-[#f59e0b]'
                    : 'text-page-text-muted hover:bg-page-hover/50 hover:text-page-text'
                }`}
              >
                <FileText className="w-4 h-4 shrink-0 text-[#f59e0b]" />
                Relatórios
              </button>
            )}

            {currentUser.role === 'admin' && (
              <button
                onClick={() => { setActiveTab('leaders-admin'); if (window.innerWidth < 768) setSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer text-left ${
                  activeTab === 'leaders-admin'
                    ? 'bg-page-hover text-page-text border-l-4 border-[#f59e0b]'
                    : 'text-page-text-muted hover:bg-page-hover/50 hover:text-page-text'
                }`}
              >
                <Key className="w-4 h-4 shrink-0 text-[#f59e0b]" />
                Cadastro Líderes ({leaders.length})
              </button>
            )}

            {(currentUser.role === 'admin' || currentUser.role === 'leader') && (
              <button
                onClick={() => { setActiveTab('system-audit'); if (window.innerWidth < 768) setSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer text-left ${
                  activeTab === 'system-audit'
                    ? 'bg-page-hover text-page-text border-l-4 border-[#f59e0b]'
                    : 'text-page-text-muted hover:bg-page-hover/50 hover:text-page-text'
                }`}
              >
                <Shield className="w-4 h-4 shrink-0 text-[#f59e0b]" />
                Auditoria de Sistema
              </button>
            )}
          </nav>

          <div className="p-4 border-t border-page-border text-[9px] text-page-text-muted uppercase tracking-widest text-center font-bold">
            HUB Liderança &bull; VMB PRO
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Overlay Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-45 backdrop-blur-xs md:hidden"
        />
      )}

      {/* RIGHT COLUMN MAIN LAYOUT */}
      <div className="flex-grow flex flex-col min-h-screen bg-page-bg transition-colors duration-150">
        
        {/* PREMIUM TOP BAR COMPONENT */}
        <header className="bg-page-card border-b border-page-border h-16 sticky top-0 z-40 flex items-center">
          <div className="w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            
            {/* Left Sector: Menu toggle + Search Input + Live badge */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="flex items-center justify-center p-2 rounded-lg bg-page-hover text-page-text hover:bg-page-border-light transition-all cursor-pointer"
                title="Minimizar / Expandir Menu Lateral"
              >
                <Users className="w-4 h-4 text-[#f59e0b]" />
              </button>

              <div className="relative hidden lg:flex items-center gap-2 px-3 py-1.5 bg-page-hover border border-page-border rounded-lg text-xs w-60">
                <Search className="w-3.5 h-3.5 text-page-text-muted shrink-0" />
                <input
                  type="text"
                  placeholder="Pesquisar no Hub..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchResults(true);
                  }}
                  onFocus={() => setShowSearchResults(true)}
                  className="bg-transparent border-none focus:outline-none text-page-text w-full text-[11px] placeholder-page-text-muted/65"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="p-0.5 hover:bg-page-hover rounded-full transition"
                  >
                    <X className="w-3 h-3 text-page-text-muted" />
                  </button>
                )}
                {showSearchResults && renderSearchResults(() => {})}
              </div>

            </div>

            {/* Right Sector: Switchees & User Info */}
            <div className="flex items-center gap-3">
              
              {/* Reference Fiscal Month Picker */}
              <div className="flex items-center gap-1.5 bg-white border border-page-border px-2.5 py-1 rounded-lg shadow-xs">
                <Calendar className="w-3.5 h-3.5 text-page-text-muted shrink-0" />
                <span className="text-[9px] font-bold text-page-text-muted uppercase tracking-wide hidden sm:inline">Mês Fiscal:</span>
                <select
                  value={currentMonth}
                  onChange={e => setCurrentMonth(e.target.value)}
                  className="bg-transparent border-none text-[11px] font-black text-page-text focus:outline-none cursor-pointer"
                >
                  {fiscalMonths.map((m) => (
                    <option key={m.value} value={m.value} className="bg-white text-page-text">
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Indicator pills */}
              <div className="hidden sm:flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-page-text-muted bg-white border border-page-border p-1 rounded-lg shadow-xs">
                <div className="px-1.5 py-0.5">SDRs: <span className="text-page-text font-black">{activeSDRsCount}</span></div>
                <div className="px-1.5 py-0.5 border-l border-page-border">ASSESSORES: <span className="text-page-text font-black">{activeAssessoresCount}</span></div>
              </div>

              {/* Real-time Cloud Firestore Database Sync Indicator */}
              {currentUser?.role === 'admin' && (
                <div className="flex items-center gap-2 bg-white border border-page-border px-2.5 py-1.5 rounded-lg shadow-xs text-[9px] font-black uppercase tracking-wider text-page-text-muted">
                  <span className="relative flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dbStatus?.ok ? 'bg-emerald-400' : 'bg-orange-400'}`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${dbStatus?.ok ? 'bg-emerald-500' : 'bg-orange-500'}`}></span>
                  </span>
                  <span className="hidden md:inline font-bold text-neutral-500 text-[8.5px]">Nuvem:</span>
                  <span className="text-page-text leading-none text-[9.5px]">
                    {isSyncing ? "Atualizando..." : `Sincronizado: ${lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`}
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      setIsSyncing(true);
                      const res = await syncFromSupabase();
                      try {
                        const statusRes = await fetch("/api/db/status");
                        const statusData = await statusRes.json();
                        setDbStatus(statusData);
                        console.log(`[Database Manual Sync] Sincronização manual concluída.`);
                        console.info(`[Database Connection INFO] Conectado e ativo na nuvem. Endpoint/Host: ${statusData.databaseUrl} (Fingerprint: ${statusData.connectionHash || 'n/a'})`);
                      } catch (e: any) {
                        console.error("Erro ao atualizar status da conexão:", e.message);
                      }
                      if (res.success) {
                        setLastSyncTime(new Date());
                      }
                      setIsSyncing(false);
                    }}
                    disabled={isSyncing}
                    className="p-0.5 ml-1 text-neutral-400 hover:text-[#f59e0b] rounded transition cursor-pointer"
                    title="Forçar sincronização remota agora"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-[#f59e0b]' : ''}`} />
                  </button>
                </div>
              )}

              {/* Profile Bubble */}
              <div className="flex items-center gap-3 border-l border-neutral-200 dark:border-neutral-800 pl-3">
                {/* Notification Bell next to Admin/User Name */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                    className="relative p-1.5 hover:bg-neutral-100 rounded-full transition cursor-pointer text-neutral-500 hover:text-neutral-950 flex items-center justify-center"
                    title="Alertas de Performance"
                  >
                    <Bell className="w-4 h-4" />
                    {criticalSDRs.length > 0 && (
                      <span className="absolute top-1 right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                    )}
                  </button>

                  {showNotificationDropdown && (
                    <div className="absolute right-0 mt-2 w-80 bg-white border border-neutral-200 rounded-2xl shadow-xl z-50 p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                        <h4 className="text-[11px] font-black uppercase tracking-wider text-neutral-800 font-mono">
                          Notificações ({criticalSDRs.length})
                        </h4>
                        <button
                          type="button"
                          onClick={() => setShowNotificationDropdown(false)}
                          className="text-neutral-400 hover:text-neutral-600 transition cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {criticalSDRs.length === 0 ? (
                        <p className="text-[10px] font-bold text-neutral-500 text-center py-2 uppercase tracking-wider">
                          ✓ Tudo em ordem! Nenhum SDR em performance crítica.
                        </p>
                      ) : (
                        <div className="max-h-64 overflow-y-auto space-y-2.5 pr-1">
                          <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest">
                            ⚠️ SDRs com performance crítica:
                          </p>
                          {criticalSDRs.map(({ sdr, perf }) => {
                            const progressPercent = Math.round(((sdr.agendamentosCount || 0) / (sdr.metaAgendamentos || 20)) * 100);
                            return (
                              <div 
                                key={sdr.id} 
                                onClick={() => {
                                  setSelectedProfileEntity({ type: 'sdr', id: sdr.id });
                                  setShowNotificationDropdown(false);
                                }}
                                className="bg-neutral-50 hover:bg-neutral-100 border border-neutral-150 hover:border-neutral-300 rounded-xl p-2.5 space-y-1.5 text-xs text-left cursor-pointer transition-all"
                                title="Clique para ver ficha completa"
                              >
                                <div className="flex justify-between items-center">
                                  <strong className="font-extrabold text-neutral-800 hover:text-[#f59e0b] transition">{sdr.name}</strong>
                                  <span className="text-[9px] font-mono bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-black">
                                    {progressPercent}% da Meta
                                  </span>
                                </div>
                                <p className="text-[10px] text-neutral-500 leading-relaxed font-medium">
                                  Entregou {sdr.agendamentosCount || 0} de {sdr.metaAgendamentos || 20} agendamentos. Projeção: {perf.monthlyProjection}.
                                </p>
                                <div className="flex justify-end pt-1 border-t border-neutral-100">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedProfileEntity({ type: 'sdr', id: sdr.id });
                                      setShowNotificationDropdown(false);
                                    }}
                                    className="text-[9px] font-black uppercase tracking-wider text-[#f59e0b] hover:underline cursor-pointer"
                                  >
                                    Intervir 1:1 &rarr;
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-[11px] font-black leading-none text-page-text">{currentUser.name}</span>
                  <span className="text-[8.5px] text-neutral-450 dark:text-neutral-550 font-black uppercase tracking-wider mt-0.5">
                    {currentUser.role === 'admin' ? 'ADMINISTRADOR' : `LÍDER • ${currentUser.teamName || 'Sem Equipe'}`}
                  </span>
                </div>
                
                {/* Customizable Photo / Avatar Bubble */}
                <div className="relative group w-8.5 h-8.5 shrink-0">
                  {currentUser.photo ? (
                    <img 
                      src={currentUser.photo} 
                      alt={currentUser.name} 
                      className="w-full h-full rounded-full object-cover border border-[#f59e0b]/20 shadow-xs"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20 flex items-center justify-center font-black text-xs uppercase shrink-0">
                      {currentUser.name ? currentUser.name.substring(0, 2).toUpperCase() : 'CS'}
                    </div>
                  )}
                  
                  {/* Small group hover overlay to upload custom avatar */}
                  <label 
                    className="absolute inset-0 flex items-center justify-center bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer"
                    title="Alterar foto de perfil"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handlePhotoChange} 
                    />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-1 text-neutral-400 hover:text-red-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition cursor-pointer"
                  title="Sair do sistema"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

            </div>

          </div>
        </header>

        {/* --- MAIN PAGE CONTENT --- */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-grow space-y-6">
        


        {/* Dynamic warning if active tables are missing */}
        {(activeSDRsCount === 0 || activeAssessoresCount === 0) && activeTab === 'matches' && (
          <div className="p-4 bg-amber-50 border-2 border-amber-400 rounded-xl flex items-start gap-3 text-neutral-850 text-xs shadow-3xs">
            <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <strong className="block font-bold mb-0.5 text-neutral-900 uppercase">Configuração Parcial</strong>
              Atualmente restam {activeSDRsCount} SDRs e {activeAssessoresCount} Assessores ativos para o mês {currentMonth}. 
              Ative e salve participantes no menu de Gestão.
            </div>
          </div>
        )}

        {/* --- 3. DOCK SUB-PAGES ACCORDING TO USER PERMISSIONS --- */}
        <div className="space-y-6">
          
          {activeTab === 'matches' && (currentUser.role === 'admin' || currentUser.role === 'leader') && (
            currentUser.role === 'leader' && currentUser.teamName && disabledRotationTeams.includes(currentUser.teamName) ? (
              <div className="bg-white border-2 border-neutral-300 border-dashed rounded-2xl p-10 text-center space-y-6 max-w-2xl mx-auto my-8 shadow-3xs animate-fade-in">
                <div className="w-14 h-14 bg-neutral-50 rounded-full flex items-center justify-center border border-neutral-200 mx-auto text-neutral-400">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xs font-black text-neutral-900 uppercase tracking-wider">Painel de Rodízio Opcional</h3>
                  <p className="text-xs text-readability-util-muted leading-relaxed max-w-md mx-auto">
                    A ferramenta de rodízio equilibra as agendas de fechamento entre os SDRs de forma automática. Atualmente, esta ferramenta está desabilitada para a equipe <strong>{currentUser.teamName}</strong>.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => toggleRotationForTeam(currentUser.teamName || '')}
                    className="px-5 py-2.5 bg-black hover:bg-neutral-900 text-white text-xs font-black uppercase tracking-tight rounded-lg cursor-pointer transition-all shadow-xs"
                  >
                    Ativar Ferramenta de Rodízio
                  </button>
                </div>
              </div>
            ) : (
              <MatchDashboard 
                sdrs={derivedSdrsForActiveMonth}
                assessores={filteredAssessores}
                matches={filteredMatches}
                onGenerateMatches={generateMatches}
                startDate={startDate}
                endDate={endDate}
                onUpdateStartDate={updateStartDate}
                onUpdateEndDate={updateEndDate}
                onAddManualMatch={addManualMatch}
                onDeleteMatch={deleteMatch}
                onViewProfile={(type, id) => setSelectedProfileEntity({ type, id })}
              />
            )
          )}

          {(activeTab === 'membros-ativos' || activeTab === 'sdrs') && (currentUser.role === 'admin' || currentUser.role === 'leader') && (
            <div className="space-y-6">
              {/* Sub-tab Navigation inside Gestão de Equipe */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-page-border p-3 rounded-2xl shadow-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setGestaoSubTab('integrantes')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wide transition cursor-pointer ${
                      gestaoSubTab === 'integrantes' && activeTab !== 'sdrs'
                        ? 'bg-neutral-900 text-amber-400 shadow-sm'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    Integrantes da Equipe
                  </button>
                  <button
                    type="button"
                    onClick={() => setGestaoSubTab('runrate')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wide transition cursor-pointer ${
                      gestaoSubTab === 'runrate' || activeTab === 'sdrs'
                        ? 'bg-neutral-900 text-amber-400 shadow-sm'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                    Previsões SDR (Run-Rate)
                  </button>
                </div>
              </div>

              {gestaoSubTab === 'integrantes' && activeTab !== 'sdrs' && (
                <ActiveMembersSection onViewProfile={(type, id) => setSelectedProfileEntity({ type, id })} />
              )}

              {(gestaoSubTab === 'runrate' || activeTab === 'sdrs') && (
                <div className="space-y-6">
                  {/* High-Contrast Dynamic AI Goals Thermometer */}
                  {activeSDRsCount > 0 && (
                    <div 
                      id="thermometer-main-card"
                      className="bg-[#FAF8F5] border border-neutral-300 p-5 rounded-2xl shadow-xs grid grid-cols-1 lg:grid-cols-12 gap-6 items-center text-black"
                    >
                      <div className="lg:col-span-12 xl:col-span-6 space-y-1">
                        <h2 className="text-base font-black font-display uppercase tracking-tight text-black">
                          Mês de Referência: {currentMonth.split('-')[1]}/2026
                        </h2>
                        <p className="text-xs leading-normal font-sans text-black">
                          O time realizou <strong className="text-black font-black">{thermStats.totalRealized} agendamentos</strong> frente à meta conjunta de <strong className="text-black font-black">{thermStats.totalTarget}</strong>. Hoje (Dia {thermStats.currentDaysElapsed} de {thermStats.totalDaysInMonth}), espera-se linearmente estar em {thermStats.expectedProgress}% da meta.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 max-w-md">
                          <div className="p-2 border border-neutral-300 bg-white/60 rounded-xl space-y-0.5 shadow-3xs">
                            <span className="text-[8px] font-black uppercase text-black tracking-wider">🏦 Contas Abertas Coletivas</span>
                            <div className="flex items-baseline justify-between gap-2">
                              <strong className="text-xs font-black text-black">{thermStats.totalContasRealized} / {thermStats.totalContasTarget}</strong>
                              <span className="text-[9px] font-mono font-black text-black bg-neutral-200/80 rounded px-1">{thermStats.realizedContasPercent}%</span>
                            </div>
                          </div>
                          <div className="p-2 border border-neutral-300 bg-white/60 rounded-xl space-y-0.5 shadow-3xs">
                            <span className="text-[8px] font-black uppercase text-black tracking-wider">🌟 Efetivações Coletivas</span>
                            <div className="flex items-baseline justify-between gap-2">
                              <strong className="text-xs font-black text-black">{thermStats.totalEfetivacoesRealized} / {thermStats.totalEfetivacoesTarget}</strong>
                              <span className="text-[9px] font-mono font-black text-black bg-neutral-200/80 rounded px-1">{thermStats.realizedEfetivacoesPercent}%</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="lg:col-span-12 xl:col-span-6 space-y-2 p-5 rounded-xl border border-neutral-300 bg-white/80">
                        <div className="flex justify-between items-end">
                          <div className="space-y-0.5">
                            <span className="text-[8px] font-black uppercase block text-black">AVANÇO REAL COMERCIAL</span>
                            <span className="font-mono font-black text-xs text-black">{thermStats.realizedProgress}% Concluído</span>
                          </div>
                          <div className="text-right space-y-0.5">
                            <span className="text-[8px] font-black uppercase block text-black">ALVO TEÓRICO LINEAR</span>
                            <span className="font-mono text-xs font-black text-black">{thermStats.expectedProgress}%</span>
                          </div>
                        </div>

                        <div className="relative w-full h-4 rounded-full overflow-hidden border bg-neutral-200 border-neutral-300">
                          <div 
                            className="h-full rounded-full transition-all duration-500 bg-black" 
                            style={{ width: `${Math.min(100, thermStats.realizedProgress)}%` }}
                          ></div>
                          <div 
                            className="absolute top-0 bottom-0 w-1 bg-amber-500 border-r border-dashed border-white"
                            style={{ left: `${Math.min(99, thermStats.expectedProgress)}%` }}
                            title="Alvo cronograma linear"
                          ></div>
                        </div>

                        <div className="flex justify-between items-center text-[10px] font-mono font-bold leading-none text-black">
                          <span>Mês {currentMonth}</span>
                          <span className="text-black font-black">
                            Ritmo: {thermStats.progressGap > 0 ? '+' : ''}{thermStats.progressGap}% {thermStats.progressGap >= 0 ? 'Adiantado' : 'Atrasado'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PREDICTIVE FORECASTING SALES RUN-RATE PANEL */}
                  {activeSDRsCount > 0 && (
                <div className="bg-white border-2 border-neutral-900 rounded-2xl p-6 space-y-5 shadow-xs">
                  <div className="flex flex-col md:flex-row md:items-center justify-between border-b-2 border-neutral-900 pb-4 gap-3">
                    <div>
                      <span className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">
                        PREVISÃO PREDITIVA DE VENDAS (RUN RATE)
                      </span>
                      <h3 className="text-lg font-black text-neutral-950 font-display tracking-tight uppercase">
                        Painel de Controle Preditivo dos SDRs
                      </h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-neutral-700 bg-neutral-50 border border-neutral-300 px-3 py-1.5 rounded-lg font-mono">
                      <span>Dias Úteis Passados: <strong className="text-black font-black">{DateService.getElapsedBusinessDays(currentMonth).elapsedBusinessDays}</strong></span>
                      <span className="text-neutral-300">|</span>
                      <span>Restantes: <strong className="text-black font-black">{DateService.getElapsedBusinessDays(currentMonth).totalBusinessDays - DateService.getElapsedBusinessDays(currentMonth).elapsedBusinessDays}</strong></span>
                    </div>
                  </div>

                  {/* 3 Columns Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    
                    {/* Coluna 1 (Alerta Vermelho): EM RISCO */}
                    <div className="bg-red-50/30 border-2 border-red-900 rounded-xl p-4 flex flex-col space-y-3">
                      <div className="flex items-center justify-between border-b border-red-200 pb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-ping shrink-0"></span>
                          <h4 className="text-xs font-black uppercase tracking-wider text-red-900">
                            Risco de Não Bater
                          </h4>
                        </div>
                        <span className="text-[9px] font-semibold font-mono px-1.5 py-0.5 bg-red-100 text-red-950 rounded border border-red-300">
                          🔴 EM RISCO
                        </span>
                      </div>

                      <div className="flex-1 space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
                        {sdrPredictions.filter(p => p.statusPreditivo === 'EM_RISCO').length === 0 ? (
                          <div className="text-center py-8 text-neutral-400 text-xs font-bold uppercase tracking-wide">
                            Nenhum SDR em Risco
                          </div>
                        ) : (
                          sdrPredictions.filter(p => p.statusPreditivo === 'EM_RISCO').map(sdr => {
                            const trendPercent = sdr.metaAgendamentos > 0 ? Math.round((sdr.forecastValue / sdr.metaAgendamentos) * 100) : 0;
                            return (
                              <div key={sdr.id} className="bg-white border border-red-300 p-3.5 rounded-xl flex flex-col justify-between hover:border-red-500 transition-all shadow-3xs space-y-3">
                                <div className="flex justify-between items-start gap-1 pb-1.5 border-b border-dashed border-neutral-100">
                                  <div>
                                    <span className="text-xs font-extrabold text-neutral-900 block">{sdr.name}</span>
                                    <span className="text-[8px] font-bold text-neutral-450 uppercase">{sdr.team || 'Sem Equipe'}</span>
                                  </div>
                                  <span className="text-[9px] font-mono font-black text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200 shrink-0">
                                    {trendPercent}% da Meta
                                  </span>
                                </div>

                                <div className="space-y-2">
                                  {/* Metric 1: Agendamentos */}
                                  <div className="flex items-center justify-between text-[11px] border-b border-neutral-50 pb-1">
                                    <span className="font-extrabold text-neutral-800 flex items-center gap-1">📅 Agendamentos</span>
                                    <div className="font-mono text-[10.5px] flex items-center gap-1.5">
                                      <span className="text-neutral-400">R: <strong className="text-neutral-700 font-black">{sdr.agendamentosCount}</strong></span>
                                      <span className="text-neutral-400">Ptv: <strong className="text-red-700 font-black">{sdr.forecastValue.toFixed(0)} ({sdr.forecastPercent.toFixed(0)}%)</strong></span>
                                    </div>
                                  </div>
                                  {/* Metric 2: Contas Abertas */}
                                  <div className="flex items-center justify-between text-[11px] border-b border-neutral-50 pb-1">
                                    <span className="font-extrabold text-neutral-800 flex items-center gap-1">🏦 Contas Abertas</span>
                                    <div className="font-mono text-[10.5px] flex items-center gap-1.5">
                                      <span className="text-neutral-400">R: <strong className="text-neutral-700 font-black">{sdr.contasAbertasCount || 0}</strong></span>
                                      <span className="text-neutral-400">Ptv: <strong className="text-neutral-800 font-black">{sdr.forecastContas.toFixed(0)} ({sdr.forecastContasPercent.toFixed(0)}%)</strong></span>
                                    </div>
                                  </div>
                                  {/* Metric 3: Efetivações */}
                                  <div className="flex items-center justify-between text-[11px] pb-0.5">
                                    <span className="font-extrabold text-neutral-800 flex items-center gap-1">🌟 Efetivações</span>
                                    <div className="font-mono text-[10.5px] flex items-center gap-1.5">
                                      <span className="text-neutral-400">R: <strong className="text-neutral-700 font-black">{sdr.efetivacoesCount || 0}</strong></span>
                                      <span className="text-neutral-400">Ptv: <strong className="text-neutral-800 font-black">{sdr.forecastEfetiv.toFixed(0)} ({sdr.forecastEfetivPercent.toFixed(0)}%)</strong></span>
                                    </div>
                                  </div>
                                </div>

                                {/* Intelligent AI action plan inside prediction card */}
                                {sdr.aiActionPlan && (
                                  <div className="p-2.5 bg-red-50/70 border border-red-150 rounded-lg text-[9.5px] text-neutral-700 leading-normal font-sans space-y-1">
                                    <div className="flex items-center gap-1 font-black uppercase text-red-950 tracking-wider">
                                      <Sparkles className="w-3 h-3 text-red-700 animate-pulse" />
                                      Roteiro Corretivo IA
                                    </div>
                                    <p className="whitespace-pre-line text-neutral-600 leading-relaxed font-medium">{sdr.aiActionPlan}</p>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Coluna 2 (Design System Off-white): NO CAMINHO */}
                    <div className="bg-brand-sand border-2 border-neutral-900 rounded-xl p-4 flex flex-col space-y-3">
                      <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 bg-neutral-900 rounded-full shrink-0"></span>
                          <h4 className="text-xs font-black uppercase tracking-wider text-neutral-900">
                            No Ritmo de Sucesso
                          </h4>
                        </div>
                        <span className="text-[9px] font-semibold font-mono px-1.5 py-0.5 bg-neutral-900 text-brand-sand rounded border border-neutral-900">
                          ⚪ NO CAMINHO
                        </span>
                      </div>

                      <div className="flex-1 space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
                        {sdrPredictions.filter(p => p.statusPreditivo === 'NO_CAMINHO').length === 0 ? (
                          <div className="text-center py-8 text-neutral-400 text-xs font-bold uppercase tracking-wide">
                            Nenhum SDR no caminho
                          </div>
                        ) : (
                          sdrPredictions.filter(p => p.statusPreditivo === 'NO_CAMINHO').map(sdr => {
                            const realTrendPercent = sdr.metaAgendamentos > 0 ? Math.round((sdr.forecastValue / sdr.metaAgendamentos) * 100) : 0;
                            return (
                              <div key={sdr.id} className="bg-white border border-neutral-250 p-3.5 rounded-xl flex flex-col justify-between hover:border-neutral-950 transition-all shadow-3xs space-y-3">
                                <div className="flex justify-between items-start gap-1 pb-1.5 border-b border-dashed border-neutral-200">
                                  <div>
                                    <span className="text-xs font-extrabold text-neutral-900 block">{sdr.name}</span>
                                    <span className="text-[8px] font-bold text-neutral-450 uppercase">{sdr.team || 'Sem Equipe'}</span>
                                  </div>
                                  <span className="text-[9px] font-mono font-black text-neutral-900 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-300 shrink-0">
                                    {realTrendPercent}% da Meta
                                  </span>
                                </div>

                                <div className="space-y-2">
                                  {/* Metric 1: Agendamentos */}
                                  <div className="flex items-center justify-between text-[11px] border-b border-neutral-50 pb-1">
                                    <span className="font-extrabold text-neutral-800 flex items-center gap-1">📅 Agendamentos</span>
                                    <div className="font-mono text-[10.5px] flex items-center gap-1.5">
                                      <span className="text-neutral-400">R: <strong className="text-neutral-700 font-black">{sdr.agendamentosCount}</strong></span>
                                      <span className="text-neutral-400">Ptv: <strong className="text-neutral-900 font-black">{sdr.forecastValue.toFixed(0)} ({sdr.forecastPercent.toFixed(0)}%)</strong></span>
                                    </div>
                                  </div>
                                  {/* Metric 2: Contas Abertas */}
                                  <div className="flex items-center justify-between text-[11px] border-b border-neutral-50 pb-1">
                                    <span className="font-extrabold text-neutral-800 flex items-center gap-1">🏦 Contas Abertas</span>
                                    <div className="font-mono text-[10.5px] flex items-center gap-1.5">
                                      <span className="text-neutral-400">R: <strong className="text-neutral-700 font-black">{sdr.contasAbertasCount || 0}</strong></span>
                                      <span className="text-neutral-400">Ptv: <strong className="text-neutral-800 font-black">{sdr.forecastContas.toFixed(0)} ({sdr.forecastContasPercent.toFixed(0)}%)</strong></span>
                                    </div>
                                  </div>
                                  {/* Metric 3: Efetivações */}
                                  <div className="flex items-center justify-between text-[11px] pb-0.5">
                                    <span className="font-extrabold text-neutral-800 flex items-center gap-1">🌟 Efetivações</span>
                                    <div className="font-mono text-[10.5px] flex items-center gap-1.5">
                                      <span className="text-neutral-400">R: <strong className="text-neutral-700 font-black">{sdr.efetivacoesCount || 0}</strong></span>
                                      <span className="text-neutral-400">Ptv: <strong className="text-neutral-800 font-black">{sdr.forecastEfetiv.toFixed(0)} ({sdr.forecastEfetivPercent.toFixed(0)}%)</strong></span>
                                    </div>
                                  </div>
                                </div>

                                {/* Intelligent AI action plan inside prediction card */}
                                {sdr.aiActionPlan && (
                                  <div className="p-2.5 bg-neutral-50/80 border border-neutral-200 rounded-lg text-[9.5px] text-neutral-700 leading-normal font-sans space-y-1">
                                    <div className="flex items-center gap-1 font-black uppercase text-neutral-800 tracking-wider">
                                      <Sparkles className="w-3 h-3 text-indigo-600 animate-pulse" />
                                      Plano de Ação Corretivo IA
                                    </div>
                                    <p className="whitespace-pre-line text-neutral-600 leading-relaxed font-medium">{sdr.aiActionPlan}</p>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Coluna 3 (Verde Esmeralda / Excelência): OUTLIERS */}
                    <div className="bg-emerald-50/20 border-2 border-emerald-900 rounded-xl p-4 flex flex-col space-y-3">
                      <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 bg-emerald-600 rounded-full animate-pulse shrink-0"></span>
                          <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900">
                            Excelente Performance
                          </h4>
                        </div>
                        <span className="text-[9px] font-semibold font-mono px-1.5 py-0.5 bg-emerald-100 text-emerald-900 rounded border border-emerald-300">
                          ⭐ OUTLIER
                        </span>
                      </div>

                      <div className="flex-1 space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
                        {sdrPredictions.filter(p => p.statusPreditivo === 'OUTLIER').length === 0 ? (
                          <div className="text-center py-8 text-neutral-400 text-xs font-bold uppercase tracking-wide">
                            Nenhum SDR em nível Outlier
                          </div>
                        ) : (
                          sdrPredictions.filter(p => p.statusPreditivo === 'OUTLIER').map(sdr => {
                            const trendPercent = sdr.metaAgendamentos > 0 ? Math.round((sdr.forecastValue / sdr.metaAgendamentos) * 100) : 0;
                            const surplusPercent = trendPercent - 100;
                            return (
                              <div key={sdr.id} className="bg-white border-2 border-emerald-600 p-3.5 rounded-xl flex flex-col justify-between hover:border-emerald-700 transition-all shadow-3xs space-y-3">
                                <div className="flex justify-between items-start gap-1 pb-1.5 border-b border-dashed border-emerald-100">
                                  <div>
                                    <span className="text-xs font-extrabold text-neutral-900 block">{sdr.name}</span>
                                    <span className="text-[8px] font-bold text-neutral-450 uppercase">{sdr.team || 'Sem Equipe'}</span>
                                  </div>
                                  <div className="flex flex-col items-end gap-0.5 shrink-0">
                                    <span className="text-[9px] font-mono font-black text-emerald-850 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-300">
                                      {trendPercent}% da Meta
                                    </span>
                                    {surplusPercent > 0 && (
                                      <span className="text-[8px] font-mono font-black text-emerald-600 bg-white border border-emerald-200 rounded px-1">
                                        +{surplusPercent}% Over
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  {/* Metric 1: Agendamentos */}
                                  <div className="flex items-center justify-between text-[11px] border-b border-neutral-50 pb-1">
                                    <span className="font-extrabold text-neutral-800 flex items-center gap-1">📅 Agendamentos</span>
                                    <div className="font-mono text-[10.5px] flex items-center gap-1.5">
                                      <span className="text-neutral-400">R: <strong className="text-neutral-700 font-black">{sdr.agendamentosCount}</strong></span>
                                      <span className="text-neutral-400">Ptv: <strong className="text-emerald-700 font-black">{sdr.forecastValue.toFixed(0)} ({sdr.forecastPercent.toFixed(0)}%)</strong></span>
                                    </div>
                                  </div>
                                  {/* Metric 2: Contas Abertas */}
                                  <div className="flex items-center justify-between text-[11px] border-b border-neutral-50 pb-1">
                                    <span className="font-extrabold text-neutral-800 flex items-center gap-1">🏦 Contas Abertas</span>
                                    <div className="font-mono text-[10.5px] flex items-center gap-1.5">
                                      <span className="text-neutral-400">R: <strong className="text-neutral-700 font-black">{sdr.contasAbertasCount || 0}</strong></span>
                                      <span className="text-neutral-400">Ptv: <strong className="text-neutral-800 font-black">{sdr.forecastContas.toFixed(0)} ({sdr.forecastContasPercent.toFixed(0)}%)</strong></span>
                                    </div>
                                  </div>
                                  {/* Metric 3: Efetivações */}
                                  <div className="flex items-center justify-between text-[11px] pb-0.5">
                                    <span className="font-extrabold text-neutral-800 flex items-center gap-1">🌟 Efetivações</span>
                                    <div className="font-mono text-[10.5px] flex items-center gap-1.5">
                                      <span className="text-neutral-400">R: <strong className="text-neutral-700 font-black">{sdr.efetivacoesCount || 0}</strong></span>
                                      <span className="text-neutral-400">Ptv: <strong className="text-neutral-800 font-black">{sdr.forecastEfetiv.toFixed(0)} ({sdr.forecastEfetivPercent.toFixed(0)}%)</strong></span>
                                    </div>
                                  </div>
                                </div>

                                {/* Intelligent AI action plan inside prediction card */}
                                {sdr.aiActionPlan && (
                                  <div className="p-2.5 bg-emerald-50/70 border border-emerald-150 rounded-lg text-[9.5px] text-neutral-700 leading-normal font-sans space-y-1">
                                    <div className="flex items-center gap-1 font-black uppercase text-emerald-950 tracking-wider">
                                      <Sparkles className="w-3 h-3 text-emerald-700 animate-pulse" />
                                      Plano de Ação Corretivo IA
                                    </div>
                                    <p className="whitespace-pre-line text-neutral-600 leading-relaxed font-medium">{sdr.aiActionPlan}</p>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}



          {activeTab === 'central-metas' && (currentUser.role === 'admin' || currentUser.role === 'leader') && (
            <GoalsPlanEditor />
          )}

          {(activeTab === 'reports' || activeTab === 'relatorios') && (currentUser.role === 'admin' || currentUser.role === 'leader') && (
            <ReportsSection 
              sdrs={derivedSdrsForActiveMonth}
              assessores={filteredAssessores}
              matches={filteredMatches}
              startDate={startDate}
              endDate={endDate}
              onResetToDefaults={resetToDefaults}
              currentMonth={currentMonth}
            />
          )}

          {activeTab === 'leaders-admin' && currentUser.role === 'admin' && (
            <LeadersAdminSection 
              leaders={leaders}
              onAddLeader={addLeader}
              onUpdateLeader={updateLeader}
              onDeleteLeader={deleteLeader}
            />
          )}



          {activeTab === 'system-audit' && (currentUser.role === 'admin' || currentUser.role === 'leader') && (
            <SystemAuditSection />
          )}

        </div>

      </main>

      {/* Symmetrical Swiss-Style Minimal Editorial Footer */}
      <footer className="bg-white border-t-2 border-neutral-900 mt-12 py-5 text-[10px] text-neutral-600 uppercase font-bold font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="tracking-widest">
            Conselho Comercial &copy; 2026 &bull; Distribuição Sóbria de Assessoria
          </div>
          <div className="flex gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded bg-black"></span>
              Padrão Editorial Offwhite-Preto
            </span>
            <span>
              Células Alpha - Beta - Delta
            </span>
          </div>
        </div>
      </footer>

      {/* INDIVIDUAL HISTORICAL PROFILE MODAL FOR SDR, ASSESSOR AND CONSULTOR */}
      {selectedProfileEntity && (
        <IndividualProfileModal 
          entityType={selectedProfileEntity.type}
          entityId={selectedProfileEntity.id}
          onClose={() => setSelectedProfileEntity(null)}
        />
      )}

      </div>
    </div>
  );
}
