import React from 'react';
import useAppStore from '../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import { jsPDF } from 'jspdf';
import { 
  Shield, Search, Filter, Calendar, Download, User, ArrowUpDown, 
  Activity, Clock, AlertCircle, RefreshCw, FileText
} from 'lucide-react';

export default function SystemAuditSection() {
  const { systemAuditLogs, syncFromDatabase, sdrs, assessores } = useAppStore(
    useShallow((state) => ({
      systemAuditLogs: state.systemAuditLogs || [],
      syncFromDatabase: state.syncFromDatabase,
      sdrs: state.sdrs || [],
      assessores: state.assessores || []
    }))
  );

  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedOperation, setSelectedOperation] = React.useState('ALL');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [sortOrder, setSortOrder] = React.useState<'DESC' | 'ASC'>('DESC');

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await syncFromDatabase();
    setIsRefreshing(false);
  };

  const filteredLogs = React.useMemo(() => {
    let logs = [...systemAuditLogs];

    // Search query filter (user, target, operation details, reason)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      logs = logs.filter(log => 
        log.user.toLowerCase().includes(q) ||
        log.targetName.toLowerCase().includes(q) ||
        log.operation.toLowerCase().includes(q) ||
        (log.reason && log.reason.toLowerCase().includes(q)) ||
        (log.previousValue && log.previousValue.toLowerCase().includes(q)) ||
        (log.newValue && log.newValue.toLowerCase().includes(q))
      );
    }

    // Operation type filter
    if (selectedOperation !== 'ALL') {
      logs = logs.filter(log => log.operation === selectedOperation);
    }

    // Date range filter
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      logs = logs.filter(log => new Date(log.timestamp) >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      logs = logs.filter(log => new Date(log.timestamp) <= end);
    }

    // Sorting
    logs.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return sortOrder === 'DESC' ? timeB - timeA : timeA - timeB;
    });

    return logs;
  }, [systemAuditLogs, searchQuery, selectedOperation, startDate, endDate, sortOrder]);

  const uniqueOperations = React.useMemo(() => {
    const ops = new Set<string>();
    systemAuditLogs.forEach(log => {
      if (log.operation) ops.add(log.operation);
    });
    return Array.from(ops);
  }, [systemAuditLogs]);

  const exportPDFReport = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Page margins and sizing
    const pageWidth = 210;
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    
    // Corporate Header
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(16);
    doc.text("CONSELHO COMERCIAL & ROTATIVIDADE VMB", margin, 15);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(203, 213, 225); // slate-300
    doc.text("RELATÓRIO DE AUDITORIA OPERACIONAL E SISTÊMICA", margin, 22);
    doc.text(`Período de Extração: ${startDate || 'Início'} até ${endDate || 'Hoje'}`, margin, 28);
    doc.text(`Emitido em: ${new Date().toLocaleString('pt-BR')}`, margin, 34);
    
    // Reset colors for table content
    doc.setTextColor(15, 23, 42);
    
    let y = 50;
    
    // Summary block
    doc.setFillColor(248, 250, 252); // slate-50
    doc.rect(margin, y, contentWidth, 22, 'F');
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.rect(margin, y, contentWidth, 22, 'S');
    
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9);
    doc.text("RESUMO DOS FILTROS DA AUDITORIA", margin + 5, y + 6);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Registros Encontrados: ${filteredLogs.length}`, margin + 5, y + 13);
    doc.text(`Operação Filtrada: ${selectedOperation === 'ALL' ? 'Todas' : selectedOperation}`, margin + 80, y + 13);
    doc.text(`Palavra-chave: ${searchQuery || 'Nenhuma'}`, margin + 140, y + 13);
    
    y += 32;
    
    // Table Header
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(margin, y, contentWidth, 8, 'F');
    
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8);
    doc.text("DATA/HORA", margin + 3, y + 5.5);
    doc.text("RESPONSÁVEL", margin + 35, y + 5.5);
    doc.text("OPERAÇÃO", margin + 70, y + 5.5);
    doc.text("COLABORADOR ALVO", margin + 110, y + 5.5);
    doc.text("JUSTIFICATIVA OBRIGATÓRIA", margin + 150, y + 5.5);
    
    y += 8;
    
    // Table Rows
    filteredLogs.forEach((log) => {
      // Page break protection
      if (y > 270) {
        doc.addPage();
        y = 20;
        
        // Header on next page
        doc.setFillColor(241, 245, 249);
        doc.rect(margin, y, contentWidth, 8, 'F');
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8);
        doc.text("DATA/HORA", margin + 3, y + 5.5);
        doc.text("RESPONSÁVEL", margin + 35, y + 5.5);
        doc.text("OPERAÇÃO", margin + 70, y + 5.5);
        doc.text("COLABORADOR ALVO", margin + 110, y + 5.5);
        doc.text("JUSTIFICATIVA OBRIGATÓRIA", margin + 150, y + 5.5);
        y += 8;
      }
      
      const dateStr = new Date(log.timestamp).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
      const userStr = log.user || 'N/A';
      const opStr = log.operation || 'N/A';
      const targetStr = log.targetName || 'N/A';
      const reasonStr = log.reason || 'Sem justificativa registrada.';
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7.5);
      
      // Print elements with safe text clipping
      doc.text(dateStr, margin + 3, y + 5);
      doc.text(userStr.substring(0, 16), margin + 35, y + 5);
      
      // Bold the operation in PDF
      doc.setFont("Helvetica", "bold");
      doc.text(opStr.substring(0, 22), margin + 70, y + 5);
      
      doc.setFont("Helvetica", "normal");
      doc.text(targetStr.substring(0, 20), margin + 110, y + 5);
      
      // Draw justification with red/grey emphasis
      doc.setTextColor(100, 116, 139);
      doc.text(reasonStr.substring(0, 30) + (reasonStr.length > 30 ? '...' : ''), margin + 150, y + 5);
      doc.setTextColor(15, 23, 42);
      
      // Bottom border for each row
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y + 7, margin + contentWidth, y + 7);
      
      y += 8;
    });
    
    // Download File
    doc.save(`relatorio_auditoria_sistema_${Date.now()}.pdf`);
  };

  return (
    <div className="space-y-6" id="system-audit-root">
      {/* Editorial Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b-2 border-neutral-900 pb-4 gap-4">
        <div>
          <span className="text-[10px] font-black uppercase text-neutral-500 tracking-wider flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-neutral-900" /> Auditoria de Operações Críticas
          </span>
          <h2 className="text-xl font-black text-neutral-900 font-display tracking-tight uppercase">
            Rastreamento de Sistema & Auditoria
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3.5 py-2 bg-neutral-100 border border-neutral-300 text-neutral-800 rounded-lg text-xs font-bold hover:bg-neutral-200 transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Sincronizar
          </button>
          <button
            onClick={exportPDFReport}
            disabled={filteredLogs.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-950 border border-neutral-900 text-white rounded-lg text-xs font-bold hover:bg-neutral-800 transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar PDF 📄
          </button>
        </div>
      </div>

      {/* Advanced Filters Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-neutral-50 p-4 rounded-xl border border-neutral-200">
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-1">
            <Search className="w-3 h-3" /> Pesquisa de Alvos / Usuários
          </label>
          <input
            type="text"
            placeholder="Ex: Nome, usuário, motivo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-neutral-300 text-neutral-900 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-neutral-900 focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-1">
            <Filter className="w-3 h-3" /> Operação Crítica
          </label>
          <select
            value={selectedOperation}
            onChange={(e) => setSelectedOperation(e.target.value)}
            className="w-full bg-white border border-neutral-300 text-neutral-900 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-neutral-900 focus:outline-none"
          >
            <option value="ALL">Todas as Operações</option>
            <option value="ADICAO_META">Adição de Metas</option>
            <option value="ALTERACAO_META">Alteração / Ajuste de Metas</option>
            <option value="EXCLUSAO_META">Exclusão de Metas</option>
            <option value="PROMOÇÃO_SDR_PARA_ASSESSOR">Promoções Realizadas</option>
            <option value="REVERSAO_PROMOÇÃO_SDR">Reversão de Promoções</option>
            <option value="MUDANÇA_EQUIPE">Mudanças de Equipes</option>
            {uniqueOperations
              .filter(op => !['ADICAO_META', 'ALTERACAO_META', 'EXCLUSAO_META', 'PROMOÇÃO_SDR_PARA_ASSESSOR', 'REVERSAO_PROMOÇÃO_SDR', 'MUDANÇA_EQUIPE'].includes(op))
              .map(op => (
                <option key={op} value={op}>{op}</option>
              ))
            }
          </select>
        </div>

        <div className="flex flex-col gap-1.5 col-span-2 md:col-span-2">
          <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Intervalo de Data de Ocorrência
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-white border border-neutral-300 text-neutral-900 rounded-lg px-3 py-1.5 text-xs focus:outline-none"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-white border border-neutral-300 text-neutral-900 rounded-lg px-3 py-1.5 text-xs focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Logs Table Area */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-neutral-500" />
            <span className="text-xs font-bold text-neutral-700">
              Registros Encontrados: <strong className="text-black font-black">{filteredLogs.length}</strong>
            </span>
          </div>
          <button
            onClick={() => setSortOrder(prev => prev === 'DESC' ? 'ASC' : 'DESC')}
            className="flex items-center gap-1.5 text-xs font-bold text-neutral-600 hover:text-black transition-all cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            {sortOrder === 'DESC' ? 'Mais Recentes' : 'Mais Antigos'}
          </button>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-neutral-400" />
            <h4 className="text-sm font-black uppercase text-neutral-700 tracking-wider">Nenhum Registro de Auditoria</h4>
            <p className="text-xs text-neutral-500 max-w-md">
              Não foram localizados logs de sistema correspondentes aos filtros definidos. Experimente limpar ou reajustar a pesquisa.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-[10px] font-black uppercase tracking-wider text-neutral-500">
                  <th className="px-5 py-3">Data / Hora</th>
                  <th className="px-5 py-3">Responsável</th>
                  <th className="px-5 py-3">Operação</th>
                  <th className="px-5 py-3">Membro Alvo</th>
                  <th className="px-5 py-3">Detalhes Históricos</th>
                  <th className="px-5 py-3">Justificativa Crítica</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-xs">
                {filteredLogs.map((log) => {
                  let opBadgeClass = "bg-neutral-100 text-neutral-800 border-neutral-200";
                  if (log.operation === 'ADICAO_META') opBadgeClass = "bg-blue-50 text-blue-700 border-blue-200";
                  if (log.operation === 'ALTERACAO_META') opBadgeClass = "bg-amber-50 text-amber-700 border-amber-200";
                  if (log.operation === 'EXCLUSAO_META') opBadgeClass = "bg-red-50 text-red-700 border-red-200";
                  if (log.operation === 'PROMOÇÃO_SDR_PARA_ASSESSOR') opBadgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
                  if (log.operation === 'REVERSAO_PROMOÇÃO_SDR') opBadgeClass = "bg-purple-50 text-purple-700 border-purple-200";
                  if (log.operation === 'MUDANÇA_EQUIPE') opBadgeClass = "bg-indigo-50 text-indigo-700 border-indigo-200";

                  return (
                    <tr key={log.id} className="hover:bg-neutral-50/50 transition-all">
                      {/* Date */}
                      <td className="px-5 py-3.5 whitespace-nowrap font-mono text-neutral-500 text-[11px]">
                        {new Date(log.timestamp).toLocaleString('pt-BR')}
                      </td>
                      
                      {/* Operator */}
                      <td className="px-5 py-3.5 font-bold text-neutral-800 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{log.user}</span>
                        </div>
                      </td>

                      {/* Operation */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`px-2 py-1 text-[9px] font-bold uppercase rounded-md border ${opBadgeClass}`}>
                          {log.operation.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Target member */}
                      <td className="px-5 py-3.5 font-semibold text-neutral-900 whitespace-nowrap">
                        {log.targetName}
                        <span className="block text-[9px] text-neutral-400 font-mono">ID: {log.targetId}</span>
                      </td>

                      {/* Values/Change details */}
                      <td className="px-5 py-3.5 max-w-xs">
                        <div className="space-y-1">
                          {log.previousValue && (
                            <div className="text-[10px] text-red-600 line-through truncate" title={log.previousValue}>
                              Antes: {log.previousValue}
                            </div>
                          )}
                          {log.newValue && (
                            <div className="text-[10px] text-emerald-700 font-bold truncate" title={log.newValue}>
                              Depois: {log.newValue}
                            </div>
                          )}
                          {!log.previousValue && !log.newValue && (
                            <span className="text-neutral-400 text-[10px]">Sem detalhes de valores</span>
                          )}
                        </div>
                      </td>

                      {/* Compulsory Justification */}
                      <td className="px-5 py-3.5 min-w-[200px] max-w-xs">
                        <div className="bg-neutral-50/50 border border-neutral-200 p-2 rounded-lg text-neutral-600 text-[11px] leading-relaxed italic">
                          "{log.reason || <span className="text-neutral-400">Nenhuma justificativa obrigatória registrada</span>}"
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
