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
import AssessorSection from './components/AssessorSection';
import MatchDashboard from './components/MatchDashboard';
import ReportsSection from './components/ReportsSection';
import LeadersAdminSection from './components/LeadersAdminSection';

// Icons
import { 
  Users, Shield, Sparkles, FileText, RefreshCw, Info, Lock, LogOut, Calendar, Key,
  Crown, AlertTriangle, X, ArrowUpRight
} from 'lucide-react';

export default function App() {
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
    startDate,
    endDate,
    leaders,
    teamGoals,
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
  } = useAppStore(
    useShallow((state) => ({
      currentUser: state.currentUser,
      activeTab: state.activeTab,
      currentMonth: state.currentMonth,
      sdrs: state.sdrs,
      assessores: state.assessores,
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
      addLeader: state.addLeader,
      updateLeader: state.updateLeader,
      deleteLeader: state.deleteLeader,
      updateTeamGoals: state.updateTeamGoals,
      resetToDefaults: state.resetToDefaults,
    }))
  );

  // 2. Custom hook to handle SDR pool and filtering
  const {
    derivedSdrsForActiveMonth,
    activeSDRsCount,
    filteredAssessores,
    activeAssessoresCount,
    filteredMatches,
  } = useSDRMetrics();

  // 3. Custom hook for smart thermometer projections and predictive forecasting
  const {
    thermStats,
    sdrPredictions,
  } = usePredictiveRunRate(derivedSdrsForActiveMonth, currentMonth);

  // Banner state and calculations
  const [isBannerDismissed, setIsBannerDismissed] = React.useState(false);

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
    if (currentUser && currentUser.role !== 'admin' && currentUser.teamName) {
      list = derivedSdrsForActiveMonth.filter(s => s.team === currentUser.teamName);
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

  // Log out mechanism
  const handleLogout = () => {
    setCurrentUser(null);
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
      <div className="min-h-screen bg-[#FAF9F5] flex flex-col justify-between p-4 selection:bg-neutral-900 selection:text-white font-sans animate-fade-in">
        
        {/* Transparent header */}
        <div className="w-full max-w-7xl mx-auto py-4 flex items-center justify-between border-b border-neutral-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#111] rounded flex items-center justify-center text-[#FAF9F5] font-black text-xs uppercase tracking-widest leading-none">
              RD
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
                  className="w-full py-2.5 bg-black hover:bg-neutral-900 text-[#FAF9F5] text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
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
                  className="w-full sm:w-auto py-2.5 px-4 bg-white hover:bg-[#FAF9F5] text-neutral-900 border border-neutral-350 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer whitespace-nowrap"
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
    );
  }

  // --- 1. RENDER LOGIN SCREEN (FIRST PAGE ENTRANCE GATE) ---
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] flex flex-col justify-between p-4 selection:bg-neutral-900 selection:text-white">
        
        {/* Transparent header */}
        <div className="w-full max-w-7xl mx-auto py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#111] rounded flex items-center justify-center text-[#FAF9F5] font-black text-xs uppercase tracking-widest leading-none">
              RD
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-neutral-900 font-display">
              Corretora Rodízio Premium
            </span>
          </div>
          <span className="text-[10px] font-bold py-1 px-2.5 bg-[#FAF9F5] rounded border border-neutral-300 text-neutral-500 uppercase tracking-widest">
            SAFE-NET v3.1
          </span>
        </div>

        {/* Crisp High-Contrast Login Gate */}
        <div className="w-full max-w-md mx-auto py-12">
          <div className="bg-white border-2 border-neutral-900 p-8 rounded-2xl shadow-sm space-y-6">
            
            <div className="space-y-2 text-center">
              <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center text-black font-bold border border-neutral-900 mx-auto">
                <Lock className="w-5 h-5 text-neutral-900" />
              </div>
              <h1 className="text-xl font-black text-neutral-950 font-display uppercase tracking-tight">
                Log In Operacional
              </h1>
              <p className="text-xs text-neutral-600 leading-relaxed font-sans">
                Insira suas credenciais de acesso para a gestão de rodízios, metas comerciais e análises automatizadas de performance por equipe.
              </p>
            </div>

            <LoginGate onLogin={setCurrentUser} leaders={leaders} />

          </div>
        </div>

        {/* Minimal Swiss footer */}
        <div className="text-center text-[10px] text-neutral-400 uppercase font-bold tracking-widest pb-4">
          Conselho Operacional de Investimentos &bull; Sistema Criptografado
        </div>

      </div>
    );
  }

  // --- 2. RENDER THE LOGGED-IN SYSTEM ---
  return (
    <div className="min-h-screen bg-[#FAF9F5] text-neutral-900 antialiased font-sans flex flex-col justify-between selection:bg-[#111] selection:text-white">
      
      {/* Pristine Swiss-Style Symmetrical Header */}
      <header className="bg-white border-b-2 border-neutral-900 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Logo and Session Info */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black rounded flex items-center justify-center text-white font-black text-sm uppercase tracking-widest leading-none">
                RD
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-black tracking-tight text-neutral-950 flex items-center gap-1.5 font-display uppercase">
                    Painel de Gestão
                  </h1>
                  <span className="text-[9px] bg-black text-white font-black px-1.5 py-0.5 rounded leading-none uppercase tracking-widest">
                    {currentUser.role === 'admin' ? 'ADMIN' : 'LEADER'}
                  </span>
                </div>
                <p className="text-[10px] text-neutral-600 mt-0.5 max-w-md font-medium flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span>Atuando como <strong className="text-black font-bold">{currentUser.name}</strong> {currentUser.teamName && `(${currentUser.teamName})`}</span>
                  {promotedSDRsCount > 0 && (
                    <>
                      <span className="text-neutral-300">|</span>
                      <span className="inline-flex items-center gap-1 text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded font-extrabold border border-amber-200">
                        <Crown className="w-3 h-3 text-amber-500 animate-pulse" />
                        {promotedSDRsCount} {promotedSDRsCount === 1 ? 'SDR Promovido' : 'SDRs Promovidos'}
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Quick Symmetrical Actions, Month Picker & Logout */}
            <div className="flex flex-wrap items-center gap-3">
              
              {/* Dynamic Reference Month Select Dropdown for goals definition */}
              <div className="flex items-center gap-1.5 bg-neutral-100 border border-neutral-300 px-2.5 py-1.5 rounded-lg">
                <Calendar className="w-3.5 h-3.5 text-neutral-700" />
                <span className="text-[9px] font-bold text-neutral-550 uppercase tracking-wider">Mês Fiscal:</span>
                <select
                  value={currentMonth}
                  onChange={e => setCurrentMonth(e.target.value)}
                  className="bg-transparent border-none text-xs font-black text-neutral-900 focus:outline-none cursor-pointer"
                >
                  {fiscalMonths.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="hidden lg:flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
                <div className="bg-neutral-100 border border-neutral-300 px-3 py-1.5 rounded-lg text-neutral-700">
                  SDRs Ativos: <span className="text-neutral-900 font-black">{activeSDRsCount}</span>
                </div>
                <div className="bg-neutral-100 border border-neutral-300 px-3 py-1.5 rounded-lg text-neutral-700">
                  Assessores Ativos: <span className="text-neutral-900 font-black">{activeAssessoresCount}</span>
                </div>
                {promotedSDRsCount > 0 && (
                  <div className="bg-amber-50 border border-amber-300 px-3 py-1.5 rounded-lg text-amber-800 flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>SDRs Promovidos: <span className="text-amber-950 font-black">{promotedSDRsCount}</span></span>
                  </div>
                )}
              </div>

              {/* Reset defaults button for Admin only */}
              {currentUser.role === 'admin' && (
                <button
                  onClick={handleResetToDefaults}
                  title="Restaurar dados de fábrica"
                  className="p-2 text-neutral-500 hover:text-red-700 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer border border-neutral-350"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Exit/Logout Button */}
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-extrabold text-[10px] rounded-lg transition-colors cursor-pointer uppercase flex items-center gap-1.5"
                title="Efetuar Logout do Sistema"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sair
              </button>
            </div>

          </div>

          {/* Symmetrical tab Menu Bar with Access Control Rules */}
          <div className="flex space-x-1 border-t border-neutral-200 pt-3 mt-4 -mb-px overflow-x-auto scrollbar-none">
            {currentUser.role === 'admin' ? (
              <>
                {/* 1. Gestão de Time */}
                <button
                  onClick={() => setActiveTab('sdrs')}
                  className={`pb-2.5 pt-1 px-3.5 font-black text-[10px] uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'sdrs'
                      ? 'border-black text-black'
                      : 'border-transparent text-neutral-500 hover:text-black'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 text-black" />
                  Gestão de Time ({derivedSdrsForActiveMonth.length})
                </button>

                {/* 2. Cadastro de Assessores */}
                <button
                  onClick={() => setActiveTab('assessores')}
                  className={`pb-2.5 pt-1 px-3.5 font-black text-[10px] uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'assessores'
                      ? 'border-black text-black'
                      : 'border-transparent text-neutral-500 hover:text-black'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-black" />
                  Cadastro de Assessores ({assessores.length})
                </button>

                {/* 3. Cadastro de Líderes */}
                <button
                  onClick={() => setActiveTab('leaders-admin')}
                  className={`pb-2.5 pt-1 px-3.5 font-black text-[10px] uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'leaders-admin'
                      ? 'border-black text-black'
                      : 'border-transparent text-neutral-500 hover:text-black'
                  }`}
                >
                  <Key className="w-3.5 h-3.5 text-black" />
                  Cadastro de Líderes ({leaders.length})
                </button>

                {/* 4. Painel de Rodízio */}
                <button
                  onClick={() => setActiveTab('matches')}
                  className={`pb-2.5 pt-1 px-3.5 font-black text-[10px] uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'matches'
                      ? 'border-black text-black'
                      : 'border-transparent text-neutral-500 hover:text-black'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-black" />
                  Painel de Rodízio
                </button>

                {/* 5. Relatórios e Métricas */}
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`pb-2.5 pt-1 px-3.5 font-black text-[10px] uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'reports'
                      ? 'border-black text-black'
                      : 'border-transparent text-neutral-500 hover:text-black'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-black" />
                  Relatórios e Métricas
                </button>
              </>
            ) : (
              <>
                {/* 1. Gestão de Time */}
                <button
                  onClick={() => setActiveTab('sdrs')}
                  className={`pb-2.5 pt-1 px-3.5 font-black text-[10px] uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'sdrs'
                      ? 'border-black text-black'
                      : 'border-transparent text-neutral-500 hover:text-black'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-black" />
                  Gestão de Time ({derivedSdrsForActiveMonth.length})
                </button>

                {/* 2. Painel de Rodízio */}
                <button
                  onClick={() => setActiveTab('matches')}
                  className={`pb-2.5 pt-1 px-3.5 font-black text-[10px] uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'matches'
                      ? 'border-black text-black'
                      : 'border-transparent text-neutral-500 hover:text-black'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-black" />
                  Painel de Rodízio
                </button>

                {/* 3. Relatórios e Métricas */}
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`pb-2.5 pt-1 px-3.5 font-black text-[10px] uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'reports'
                      ? 'border-black text-black'
                      : 'border-transparent text-neutral-500 hover:text-black'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-black" />
                  Relatórios e Métricas
                </button>
              </>
            )}
          </div>

        </div>
      </header>

      {/* Main Container Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-grow space-y-6">
        
        {/* --- HIGH-CONTRAST DYNAMIC AI GOALS THERMOMETER --- */}
        {activeTab === 'sdrs' && activeSDRsCount > 0 && (
          <div className="bg-white border-2 border-neutral-900 p-5 rounded-2xl shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            {/* Thermometer Status Gauge metadata */}
            <div className="lg:col-span-12 xl:col-span-6 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">
                  Termômetro de Metas por IA
                </span>
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${thermStats.labelColor}`}>
                  {thermStats.temperature}
                </span>
              </div>
              <h3 className="text-base font-black text-neutral-950 font-display uppercase tracking-tight">
                Mês de Referência: {currentMonth.split('-')[1]}/2026
              </h3>
              <p className="text-xs text-neutral-600 leading-normal font-sans">
                O time realizou <strong className="text-[#111111]">{thermStats.totalRealized} agendamentos</strong> frente à meta conjunta de <strong className="text-[#111111]">{thermStats.totalTarget}</strong>. Hoje (Dia {thermStats.currentDaysElapsed} de {thermStats.totalDaysInMonth}), espera-se linearmente estar em <strong>{thermStats.expectedProgress}%</strong> da meta.
              </p>
            </div>

            {/* Visual Glass Thermometer bar */}
            <div className="lg:col-span-12 xl:col-span-6 space-y-2">
              <div className="flex justify-between items-end">
                <div className="space-y-0.5">
                  <span className="text-[8px] font-bold text-neutral-450 uppercase block">AVANÇO REAL COMERCIAL</span>
                  <span className="font-mono font-black text-xs text-black">{thermStats.realizedProgress}% Concluído</span>
                </div>
                <div className="text-right space-y-0.5">
                  <span className="text-[8px] font-bold text-neutral-450 uppercase block">ALVO TEÓRICO LINEAR</span>
                  <span className="font-mono text-xs text-neutral-600 font-bold">{thermStats.expectedProgress}%</span>
                </div>
              </div>

              {/* Double progression bars */}
              <div className="relative w-full h-4 bg-neutral-100 border border-neutral-300 rounded-full overflow-hidden">
                {/* Realized bar */}
                <div 
                  className="h-full rounded-full transition-all duration-500 bg-[#111]" 
                  style={{ width: `${Math.min(100, thermStats.realizedProgress)}%` }}
                ></div>

                {/* Dotted cursor target mark representing EXPECTED day of month */}
                <div 
                  className="absolute top-0 bottom-0 w-1 bg-red-600 border-r border-dashed border-white"
                  style={{ left: `${Math.min(99, thermStats.expectedProgress)}%` }}
                  title="Alvocronograma linear"
                ></div>
              </div>

              <div className="flex justify-between items-center text-[10px] font-mono font-bold leading-none">
                <span className="text-neutral-500">Mês {currentMonth}</span>
                <span className={thermStats.progressGap >= 0 ? 'text-green-700' : 'text-red-700'}>
                  Ritmo: {thermStats.progressGap > 0 ? '+' : ''}{thermStats.progressGap}% {thermStats.progressGap >= 0 ? 'Adiantado' : 'Atrasado'}
                </span>
              </div>
            </div>

          </div>
        )}

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
                  <p className="text-xs text-neutral-500 leading-relaxed max-w-md mx-auto">
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
                onUpdateMatchDates={updateMatchDates}
              />
            )
          )}

          {activeTab === 'sdrs' && (currentUser.role === 'admin' || currentUser.role === 'leader') && (
            <div className="space-y-6">
              <SDRSection 
                sdrs={derivedSdrsForActiveMonth}
                assessores={filteredAssessores}
                currentUser={currentUser}
                onAddSDR={addSDR}
                onDeleteSDR={deleteSDR}
                onToggleActiveSDR={toggleActiveSDR}
                onUpdateSDRMetrics={updateSDRMetrics}
                onUpdateSDR={updateSDR}
                onUpdateAssessor={updateAssessor}
                onAddAssessor={addAssessor}
                teamGoals={teamGoals}
                onUpdateTeamGoals={updateTeamGoals}
                teams={teams}
                onAddTeam={addTeam}
                onDeleteTeam={deleteTeam}
                onRenameTeam={renameTeam}
                onRevertPromotion={revertPromotion}
                oneOnOneLogs={oneOnOneLogs}
                onAddOneOnOneLog={addOneOnOneLog}
                campaigns={campaigns}
                onAddCampaign={addCampaign}
                onDeleteCampaign={deleteCampaign}
                onUpdateCampaignStatus={updateCampaignStatus}
              />

              {/* --- NEW PREDICTIVE FORECASTING SALES RUN-RATE PANEL --- */}
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

                      <div className="flex-1 space-y-2 max-h-[300px] overflow-y-auto pr-1">
                        {sdrPredictions.filter(p => p.statusPreditivo === 'EM_RISCO').length === 0 ? (
                          <div className="text-center py-8 text-neutral-400 text-xs font-bold uppercase tracking-wide">
                            Nenhum SDR em Risco
                          </div>
                        ) : (
                          sdrPredictions.filter(p => p.statusPreditivo === 'EM_RISCO').map(sdr => {
                            const trendPercent = sdr.metaAgendamentos > 0 ? Math.round((sdr.forecastValue / sdr.metaAgendamentos) * 100) : 0;
                            return (
                              <div key={sdr.id} className="bg-white border border-red-300 p-3 rounded-lg flex flex-col justify-between hover:border-red-500 transition-all shadow-3xs">
                                <div className="flex justify-between items-start gap-1 pb-1.5 border-b border-dashed border-neutral-100">
                                  <div>
                                    <span className="text-xs font-extrabold text-neutral-900 block">{sdr.name}</span>
                                    <span className="text-[8px] font-bold text-neutral-450 uppercase">{sdr.team || 'Sem Equipe'}</span>
                                  </div>
                                  <span className="text-[9px] font-mono font-black text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                                    {trendPercent}% da Meta
                                  </span>
                                </div>
                                <div className="grid grid-cols-3 gap-1 pt-2 text-[10.5px] font-mono leading-none">
                                  <div className="space-y-0.5">
                                    <span className="text-[8px] text-neutral-400 font-bold block uppercase">REALIZADO</span>
                                    <strong className="text-neutral-800 font-extrabold">{sdr.agendamentosCount}/{sdr.metaAgendamentos}</strong>
                                  </div>
                                  <div className="space-y-0.5">
                                    <span className="text-[8px] text-neutral-400 font-bold block uppercase">MÉDIA DIÁRIA</span>
                                    <strong className="text-red-700 font-extrabold">{sdr.dailyAvg.toFixed(1)}/d</strong>
                                  </div>
                                  <div className="space-y-0.5">
                                    <span className="text-[8px] text-neutral-400 font-bold block uppercase">PREVISTO</span>
                                    <strong className="text-red-900 font-black font-sans">{sdr.forecastValue.toFixed(1)}</strong>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Coluna 2 (Design System Off-white): NO CAMINHO */}
                    <div className="bg-[#FAF9F5] border-2 border-neutral-900 rounded-xl p-4 flex flex-col space-y-3">
                      <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 bg-neutral-900 rounded-full shrink-0"></span>
                          <h4 className="text-xs font-black uppercase tracking-wider text-neutral-900">
                            No Ritmo de Sucesso
                          </h4>
                        </div>
                        <span className="text-[9px] font-semibold font-mono px-1.5 py-0.5 bg-neutral-900 text-[#FAF9F5] rounded border border-neutral-900">
                          ⚪ NO CAMINHO
                        </span>
                      </div>

                      <div className="flex-1 space-y-2 max-h-[300px] overflow-y-auto pr-1">
                        {sdrPredictions.filter(p => p.statusPreditivo === 'NO_CAMINHO').length === 0 ? (
                          <div className="text-center py-8 text-neutral-400 text-xs font-bold uppercase tracking-wide">
                            Nenhum SDR no caminho
                          </div>
                        ) : (
                          sdrPredictions.filter(p => p.statusPreditivo === 'NO_CAMINHO').map(sdr => {
                            const realTrendPercent = sdr.metaAgendamentos > 0 ? Math.round((sdr.forecastValue / sdr.metaAgendamentos) * 100) : 0;
                            return (
                              <div key={sdr.id} className="bg-white border border-neutral-250 p-3 rounded-lg flex flex-col justify-between hover:border-neutral-950 transition-all shadow-3xs">
                                <div className="flex justify-between items-start gap-1 pb-1.5 border-b border-dashed border-neutral-200">
                                  <div>
                                    <span className="text-xs font-extrabold text-neutral-900 block">{sdr.name}</span>
                                    <span className="text-[8px] font-bold text-neutral-450 uppercase">{sdr.team || 'Sem Equipe'}</span>
                                  </div>
                                  <span className="text-[9px] font-mono font-black text-neutral-900 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-300">
                                    {realTrendPercent}% da Meta
                                  </span>
                                </div>
                                <div className="grid grid-cols-3 gap-1 pt-2 text-[10.5px] font-mono leading-none">
                                  <div className="space-y-0.5">
                                    <span className="text-[8px] text-neutral-400 font-bold block uppercase">REALIZADO</span>
                                    <strong className="text-neutral-800 font-extrabold">{sdr.agendamentosCount}/{sdr.metaAgendamentos}</strong>
                                  </div>
                                  <div className="space-y-0.5">
                                    <span className="text-[8px] text-neutral-400 font-bold block uppercase">MÉDIA DIÁRIA</span>
                                    <strong className="text-neutral-800 font-bold">{sdr.dailyAvg.toFixed(1)}/d</strong>
                                  </div>
                                  <div className="space-y-0.5">
                                    <span className="text-[8px] text-neutral-400 font-bold block uppercase">PREVISTO</span>
                                    <strong className="text-neutral-900 font-black font-sans">{sdr.forecastValue.toFixed(1)}</strong>
                                  </div>
                                </div>
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

                      <div className="flex-1 space-y-2 max-h-[300px] overflow-y-auto pr-1">
                        {sdrPredictions.filter(p => p.statusPreditivo === 'OUTLIER').length === 0 ? (
                          <div className="text-center py-8 text-neutral-400 text-xs font-bold uppercase tracking-wide">
                            Nenhum SDR em nível Outlier
                          </div>
                        ) : (
                          sdrPredictions.filter(p => p.statusPreditivo === 'OUTLIER').map(sdr => {
                            const trendPercent = sdr.metaAgendamentos > 0 ? Math.round((sdr.forecastValue / sdr.metaAgendamentos) * 100) : 0;
                            const surplusPercent = trendPercent - 100;
                            return (
                              <div key={sdr.id} className="bg-white border-2 border-emerald-600 p-3 rounded-lg flex flex-col justify-between hover:border-emerald-700 transition-all shadow-3xs">
                                <div className="flex justify-between items-start gap-1 pb-1.5 border-b border-dashed border-emerald-100">
                                  <div>
                                    <span className="text-xs font-extrabold text-neutral-900 block">{sdr.name}</span>
                                    <span className="text-[8px] font-bold text-neutral-450 uppercase">{sdr.team || 'Sem Equipe'}</span>
                                  </div>
                                  <div className="flex flex-col items-end gap-0.5">
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
                                <div className="grid grid-cols-3 gap-1 pt-2 text-[10.5px] font-mono leading-none">
                                  <div className="space-y-0.5">
                                    <span className="text-[8px] text-neutral-400 font-bold block uppercase">REALIZADO</span>
                                    <strong className="text-neutral-800 font-extrabold">{sdr.agendamentosCount}/{sdr.metaAgendamentos}</strong>
                                  </div>
                                  <div className="space-y-0.5">
                                    <span className="text-[8px] text-neutral-400 font-bold block uppercase">MÉDIA DIÁRIA</span>
                                    <strong className="text-emerald-700 font-extrabold">{sdr.dailyAvg.toFixed(1)}/d</strong>
                                  </div>
                                  <div className="space-y-0.5">
                                    <span className="text-[8px] text-neutral-400 font-bold block uppercase">PREVISTO</span>
                                    <strong className="text-emerald-800 font-black font-sans">{sdr.forecastValue.toFixed(1)}</strong>
                                  </div>
                                </div>
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

          {activeTab === 'assessores' && currentUser.role === 'admin' && (
            <AssessorSection 
              assessores={filteredAssessores}
              sdrs={derivedSdrsForActiveMonth}
              onAddAssessor={addAssessor}
              onDeleteAssessor={deleteAssessor}
              onToggleActiveAssessor={toggleActiveAssessor}
              onUpdateAssessor={updateAssessor}
              teams={teams}
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

          {activeTab === 'reports' && (
            <ReportsSection 
              sdrs={derivedSdrsForActiveMonth}
              assessores={filteredAssessores}
              matches={filteredMatches}
              startDate={startDate}
              endDate={endDate}
              onResetToDefaults={handleResetToDefaults}
              currentMonth={currentMonth}
            />
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

      {/* FLOATING BANNER ALERT FOR CRITICAL SDRs */}
      {criticalSDRs.length > 0 && !isBannerDismissed && (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm bg-neutral-950 text-[#FAF9F5] border-2 border-neutral-900 rounded-2xl shadow-2xl p-5 animate-fade-in select-none">
          <div className="flex items-start justify-between border-b border-neutral-800 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
              <h3 className="text-xs font-black uppercase tracking-widest text-[#FAF9F5] font-mono">
                Alerta de Performance Crítica
              </h3>
            </div>
            <button 
              onClick={() => setIsBannerDismissed(true)}
              className="text-neutral-400 hover:text-neutral-200 transition-colors p-0.5 cursor-pointer"
              title="Dispensar Notificação"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {(() => {
            const first = criticalSDRs[0];
            const sdr = first.sdr;
            const perf = first.perf;
            
            const callsPerScheduled = perf.callsPerScheduled > 0 ? perf.callsPerScheduled : 12;
            const progressPercent = Math.round(((sdr.agendamentosCount || 0) / (sdr.metaAgendamentos || 20)) * 100);
            const daysLeft = DateService.getElapsedBusinessDays(currentMonth).totalBusinessDays - DateService.getElapsedBusinessDays(currentMonth).elapsedBusinessDays;
            const dailySDRRateRequired = daysLeft > 0 ? parseFloat((perf.gapToMeta / daysLeft).toFixed(1)) : perf.gapToMeta;

            return (
              <div className="space-y-3">
                <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                  SDR <strong className="text-white font-extrabold">{sdr.name}</strong> está com ritmo crítico. Entregou <span className="text-red-450 font-bold">{sdr.agendamentosCount || 0} de {sdr.metaAgendamentos} agendamentos</span> ({progressPercent}% da meta) com projeção de fechar o mês com apenas <strong className="text-red-450">{perf.monthlyProjection}</strong>.
                </p>

                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-[10px] space-y-2 leading-relaxed">
                  <span className="text-[9px] uppercase font-black text-amber-400 tracking-wider font-mono block">🎯 Ação Sugerida pelo Sistema:</span>
                  <p className="text-neutral-300 font-medium">
                    Inicie uma intervenção rápida de feedback. Recomendamos agendar um <strong className="text-white">Alinhamento 1:1</strong> focado em funil telefônico. 
                    Estimule o aumento para <strong className="text-white">{Math.ceil(dailySDRRateRequired * callsPerScheduled)} ligações diárias individuais</strong> para superar o gap de <strong className="text-amber-400">{perf.gapToMeta} agendamentos</strong> restantes.
                  </p>
                </div>

                <div className="flex gap-2.5 pt-1 items-center">
                  {criticalSDRs.length > 1 && (
                    <span className="text-[9px] font-bold text-neutral-400 uppercase font-mono">
                      + {criticalSDRs.length - 1} outros críticos
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setActiveTab('sdrs');
                    }}
                    className="ml-auto flex items-center gap-1 bg-white hover:bg-neutral-200 text-neutral-950 font-black text-[10px] uppercase tracking-wider py-2 px-3.5 rounded-lg transition-colors cursor-pointer animate-pulse"
                  >
                    Intervir 1:1
                    <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

    </div>
  );
}
