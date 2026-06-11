import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Database, HelpCircle, RefreshCw, ChevronDown, ChevronUp, Search, Clock, Info, ArrowUpRight } from 'lucide-react';

interface SyncLog {
  id: string;
  timestamp: string;
  type: "LOAD" | "SAVE" | "INIT";
  status: "success" | "error";
  message: string;
  details?: string;
  error?: string | null;
}

export default function SyncHistory() {
  const [logs, setLogs] = React.useState<SyncLog[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [filter, setFilter] = React.useState<'all' | 'success' | 'error'>('all');
  const [search, setSearch] = React.useState('');
  const [expandedLogId, setExpandedLogId] = React.useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = React.useState(true);

  const fetchHistory = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/db/history');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Error fetching sync history logs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  React.useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchHistory, 12000);
      return () => clearInterval(interval);
    }
  }, [fetchHistory, autoRefresh]);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  const getTroubleshootingHint = (errorStr: string | null | undefined) => {
    if (!errorStr) return null;
    const err = errorStr.toLowerCase();
    
    if (err.includes("enotfound") && err.includes("ep-***")) {
      return (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-3 text-xs space-y-1.5 leading-relaxed font-sans mt-2">
          <strong className="block text-amber-950 uppercase font-black tracking-wider text-[9px] font-sans">💡 Dica de Diagnóstico Crítico:</strong>
          <span>Sua string de conexão contém os asteriscos literais <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">ep-***.neon.tech</code>. O console da Neon oculta o endereço do host com asteriscos apenas como exemplo de segurança. Você deve acessar o console do seu projeto na Neon, copiar a connection string real completa (que possui o ID verdadeiro do seu banco, ex: <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">ep-cool-snowflake-123456</code>) e colar na chave <code className="font-bold font-sans">DATABASE_URL</code> das configurações de segredos do AI Studio!</span>
        </div>
      );
    }
    if (err.includes("password authentication failed")) {
      return (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-3 text-xs space-y-1.5 leading-relaxed font-sans mt-2">
          <strong className="block text-amber-950 uppercase font-black tracking-wider text-[9px] font-sans">💡 Dica de Autenticação:</strong>
          <span>A senha fornecida na connection string está incorreta ou desatualizada. Certifique-se de que não incluiu colchetes <code className="font-mono bg-amber-100 px-1 py-0.5 rounded font-bold">{"[]"}</code> ou símbolos especiais de senha de forma corrompida.</span>
        </div>
      );
    }
    if (err.includes("sslmode")) {
      return (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-3 text-xs space-y-1.5 leading-relaxed font-sans mt-2">
          <strong className="block text-amber-950 uppercase font-black tracking-wider text-[9px] font-sans">💡 Dica de SSL/Configuração:</strong>
          <span>Conexões sem SSL habilitado são rejeitadas pelo Neon. Certifique-se de incluir o parâmetro de consulta <code className="font-mono bg-amber-100 px-1 py-0.5 rounded font-bold">?sslmode=require</code> no final de sua connection string.</span>
        </div>
      );
    }
    return (
      <div className="bg-neutral-50 border border-neutral-200 text-neutral-800 rounded-lg p-3 text-xs space-y-1 mt-2">
        <strong className="block text-neutral-900 font-bold font-sans">💡 Dica Geral:</strong>
        <span>Verifique se o seu banco de dados na Neon está com status ativo e se não ultrapassou os limites de cota da conta gratuita ou de tempo de cold start.</span>
      </div>
    );
  };

  const filteredLogs = logs.filter(log => {
    const matchesFilter = 
      filter === 'all' || 
      (filter === 'success' && log.status === 'success') || 
      (filter === 'error' && log.status === 'error');
    
    const matchesSearch = 
      !search || 
      log.message.toLowerCase().includes(search.toLowerCase()) ||
      (log.error && log.error.toLowerCase().includes(search.toLowerCase())) ||
      log.type.toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const formatDate = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ' + 
             date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    } catch {
      return isoStr;
    }
  };

  const successCount = logs.filter(l => l.status === 'success').length;
  const errorCount = logs.filter(l => l.status === 'error').length;
  const successRate = logs.length > 0 ? Math.round((successCount / logs.length) * 100) : 100;

  return (
    <div id="sync-history-panel" className="bg-white border-2 border-neutral-900 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-neutral-900 text-brand-sand p-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-b-2 border-neutral-900">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-left">
            <h3 className="text-xs font-black uppercase tracking-wider font-mono">Painel de Histórico de Sincronização</h3>
            <p className="text-[9px] text-brand-sand/70 uppercase tracking-widest mt-0.5 font-bold">Diagnósticos de persistência da nuvem e cache</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Auto Refresh toggle */}
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={autoRefresh} 
              onChange={(e) => setAutoRefresh(e.target.checked)} 
              className="w-3 h-3 rounded text-neutral-900 focus:ring-0 border-neutral-700 bg-neutral-800"
            />
            <span className="text-[9px] font-mono tracking-widest text-brand-sand/80 uppercase font-black">Auto-Recarregar</span>
          </label>

          <button 
            type="button"
            onClick={fetchHistory}
            disabled={loading}
            className="p-1 px-2 text-brand-sand/80 hover:text-white rounded-lg transition-colors border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 cursor-pointer text-[10px] uppercase font-bold tracking-wider flex items-center gap-1"
            title="Sincronizar logs agora"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Recarregar
          </button>
        </div>
      </div>

      {/* Mini Stats Banner */}
      <div className="bg-neutral-50 px-5 py-3 border-b border-neutral-200 grid grid-cols-3 divide-x divide-neutral-200 text-center">
        <div>
          <span className="text-[9px] block text-neutral-500 font-mono font-black uppercase tracking-wider">Total de Eventos</span>
          <span className="text-sm font-black text-neutral-900 font-mono">{logs.length}</span>
        </div>
        <div>
          <span className="text-[9px] block text-neutral-500 font-mono font-black uppercase tracking-wider font-sans">Taxa de Sucessos</span>
          <span className={`text-sm font-black font-mono ${successRate > 80 ? 'text-emerald-700' : successRate > 30 ? 'text-amber-700' : 'text-red-750'}`}>
            {successRate}%
          </span>
        </div>
        <div>
          <span className="text-[9px] block text-neutral-500 font-mono font-black uppercase tracking-wider">Anomalias</span>
          <span className={`text-sm font-black font-mono ${errorCount > 0 ? 'text-red-650 animate-pulse' : 'text-neutral-500'}`}>
            {errorCount}
          </span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="p-4 bg-white border-b border-neutral-200 flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative w-full md:w-64">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400 pointer-events-none">
            <Search className="w-3.5 h-3.5" />
          </span>
          <input 
            type="text" 
            placeholder="Filtrar por mensagem de erro..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs font-medium pl-9 pr-3 py-1.5 bg-neutral-50 hover:bg-neutral-100 focus:bg-white border border-neutral-300 rounded-lg text-neutral-900 placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-1.5 self-start md:self-auto ml-auto">
          {(['all', 'success', 'error'] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setFilter(opt)}
              className={`px-3 py-1 bg-white hover:bg-neutral-50 text-[10px] uppercase font-black tracking-wider rounded-lg border transition-all cursor-pointer ${
                filter === opt 
                  ? 'border-neutral-900 text-neutral-900 bg-neutral-100 font-black' 
                  : 'border-neutral-300 text-neutral-500'
              }`}
            >
              {opt === 'all' ? 'Ver Todos' : opt === 'success' ? 'Sucessos' : 'Falhas'}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table / List */}
      <div className="p-4 max-h-[350px] overflow-y-auto space-y-2.5">
        <AnimatePresence initial={false}>
          {filteredLogs.length === 0 ? (
            <div className="py-8 text-center text-neutral-500">
              <Info className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
              <p className="text-xs font-semibold uppercase tracking-wider">Nenhum evento registrado</p>
              <p className="text-[10px] text-neutral-400 mt-0.5">Mude o filtro ou execute uma operação para gravar logs.</p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isError = log.status === 'error';
              const isExpanded = expandedLogId === log.id;
              
              return (
                <motion.div
                  key={log.id}
                  layout
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  onClick={(e) => toggleExpand(log.id, e)}
                  className={`border rounded-xl p-3 px-3.5 transition-all text-left cursor-pointer select-none leading-relaxed ${
                    isExpanded 
                      ? 'shadow-sm border-neutral-900 bg-neutral-50/70' 
                      : isError 
                        ? 'border-red-250 bg-red-50/30 hover:bg-red-50 hover:border-red-400' 
                        : 'border-neutral-250 hover:bg-neutral-50 hover:border-neutral-400'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className={`mt-0.5 shrink-0 p-1 rounded-md ${isError ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {isError ? (
                          <AlertCircle className="w-4 h-4" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-start gap-2 flex-wrap items-center">
                          <span className={`text-[8px] font-mono font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            log.type === 'INIT' 
                              ? 'bg-neutral-800 text-white' 
                              : log.type === 'LOAD' 
                                ? 'bg-sky-100 text-sky-800 border border-sky-200' 
                                : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          }`}>
                            {log.type === 'INIT' ? 'Conexão' : log.type === 'LOAD' ? 'Leitura (Load)' : 'Escrita (Save)'}
                          </span>
                          <span className="text-[10px] text-neutral-500 font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(log.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-neutral-900 leading-snug">{log.message}</p>
                      </div>
                    </div>

                    <div className="text-neutral-500 hover:text-black">
                      {isExpanded ? <ChevronUp className="w-4.5 h-4.5" /> : <ChevronDown className="w-4.5 h-4.5" />}
                    </div>
                  </div>

                  {/* Expanded Section for Detailed Troubleshooting */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.15 }}
                        className="mt-3 pt-3 border-t border-neutral-250 space-y-2 overflow-hidden text-xs"
                        onClick={(e) => e.stopPropagation()} /* Prevent toggle on clicking inside */
                      >
                        {log.error ? (
                          <div className="space-y-2">
                            <div className="bg-neutral-950 text-red-400 font-mono p-3 rounded-lg text-[10.5px] overflow-x-auto border border-neutral-900 select-all font-bold">
                              {log.error}
                            </div>
                            {getTroubleshootingHint(log.error)}
                          </div>
                        ) : (
                          <p className="text-neutral-600 leading-relaxed font-sans">
                            Esta operação foi concluída perfeitamente pelo módulo de sincronização do aplicativo. Nenhuma anomalia de comunicação ou estouro de cota do banco foi reportada.
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Helpful Info Footer */}
      <div className="bg-neutral-50 p-2.5 px-4 border-t border-neutral-200 text-[9.5px] text-neutral-500 flex items-center gap-1.5 justify-between">
        <span className="flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5 font-bold text-neutral-650" />
          <span>Precisa resetar seus dados? Clique na engrenagem no topo direito.</span>
        </span>
        <span className="font-mono text-[9px] uppercase font-black text-neutral-400">Time-Zone: UTC</span>
      </div>
    </div>
  );
}
