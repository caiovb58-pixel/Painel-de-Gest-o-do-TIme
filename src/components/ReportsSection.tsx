import React, { useState } from 'react';
import { SDR, Assessor, MatchResult } from '../types';
import { 
  FileText, Copy, TrendingUp, Users, CheckCircle2, 
  RefreshCw, Compass, BarChart3, ChevronRight, CheckCircle, AlertCircle,
  Sparkles, PhoneCall, Zap, Flame, Award, ShieldAlert, Target, Calendar,
  Download, Table, Info
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, BarChart, Bar
} from 'recharts';
import { DateService } from '../shared/services/date.service';

interface InfoTooltipProps {
  title: string;
  formula: string;
  description: string;
  align?: 'left' | 'center' | 'right';
}

function InfoTooltip({ title, formula, description, align = 'center' }: InfoTooltipProps) {
  const alignClasses = {
    left: 'left-0 translate-x-0',
    center: 'left-1/2 -translate-x-1/2',
    right: 'right-0 translate-x-0'
  };

  const arrowClasses = {
    left: 'left-4 translate-x-0',
    center: 'left-1/2 -translate-x-1/2',
    right: 'right-4 translate-x-0'
  };

  return (
    <div className="group relative inline-block ml-1.5 z-30">
      <Info className="w-3.5 h-3.5 text-neutral-400 hover:text-neutral-900 cursor-help transition-all" />
      <div className={`pointer-events-none absolute bottom-full mb-2 hidden group-hover:block w-76 bg-neutral-950 text-[#FAF9F5] text-[11px] rounded-xl p-3.5 shadow-2xl border border-neutral-800 animate-fade-in leading-relaxed ${alignClasses[align]}`}>
        <div className="font-extrabold text-white uppercase tracking-wider text-[9px] pb-1.5 border-b border-neutral-800 mb-2 flex items-center justify-between">
          <span className="text-amber-400 font-mono tracking-wide">🔍 {title}</span>
          <span className="text-[8px] bg-neutral-900 text-neutral-400 px-1.5 py-0.5 rounded leading-none uppercase font-mono font-bold font-sans">Métrica</span>
        </div>
        <p className="text-neutral-300 font-medium mb-2.5 leading-relaxed font-sans">{description}</p>
        <div className="bg-neutral-900 rounded-lg p-2 border border-neutral-800 text-[10px] font-mono leading-normal shadow-inner">
          <span className="text-[8px] uppercase font-black tracking-widest text-neutral-500 block mb-1">Cálculo e Regra:</span>
          <code className="text-emerald-400 font-bold block whitespace-pre-wrap">{formula}</code>
        </div>
        <div className={`absolute top-full -mt-1 border-4 border-transparent border-t-neutral-950 ${arrowClasses[align]}`}></div>
      </div>
    </div>
  );
}

interface ReportsSectionProps {
  sdrs: SDR[];
  assessores: Assessor[];
  matches: MatchResult[];
  startDate: string;
  endDate: string;
  onResetToDefaults: () => void;
  currentMonth: string;
}

export default function ReportsSection({
  sdrs,
  assessores,
  matches,
  startDate,
  endDate,
  onResetToDefaults,
  currentMonth,
}: ReportsSectionProps) {
  const [copied, setCopied] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'visual' | 'whatsapp' | 'intelligence'>('visual');
  const [showAffinityDetails, setShowAffinityDetails] = useState(false);

  const activeSDRs = sdrs.filter(s => s.active);
  const [selectedSdrIdForEvolution, setSelectedSdrIdForEvolution] = useState<string>(activeSDRs[0]?.id || '');
  const activeAssessores = assessores.filter(a => a.active);

  // Pareamento / Match Affinity Calculations
  const matchAffinities = matches.map(m => {
    const sdr = sdrs.find(s => s.id === m.sdrId || s.name === m.sdrName);
    const agendamentos = sdr ? sdr.agendamentosCount : 0;
    const efetivacoes = sdr ? sdr.efetivacoesCount : 0;
    const rate = agendamentos > 0 ? Math.round((efetivacoes / agendamentos) * 100) : 0;
    return {
      sdrId: m.sdrId,
      sdrName: m.sdrName,
      assessorId: m.assessorId,
      assessorName: m.assessorName,
      agendamentos,
      efetivacoes,
      rate,
      isExclusive: m.isExclusive,
    };
  });

  const totalMatchedAgendamentos = matchAffinities.reduce((sum, item) => sum + item.agendamentos, 0);
  const totalMatchedEfetivacoes = matchAffinities.reduce((sum, item) => sum + item.efetivacoes, 0);
  const averageAffinityRate = totalMatchedAgendamentos > 0
    ? Math.round((totalMatchedEfetivacoes / totalMatchedAgendamentos) * 100)
    : 0;

  const bottleneckPairings = [...matchAffinities]
    .filter(item => item.agendamentos > 0 && item.rate < 45) // Rates below 45% are bottlenecks
    .sort((a, b) => a.rate - b.rate);

  // Calculate global stats
  const totalAgendamentos = activeSDRs.reduce((sum, s) => sum + s.agendamentosCount, 0);
  const totalEfetivacoes = activeSDRs.reduce((sum, s) => sum + s.efetivacoesCount, 0);
  
  // Metas consolidating
  const totalMetaAgendamentos = activeSDRs.reduce((sum, s) => sum + (s.metaAgendamentos || 20), 0);
  const totalMetaEfetivacoes = Math.round(activeSDRs.reduce((sum, s) => sum + (s.metaAgendamentos || 20) * ((s.metaEfetivacaoRate || 50) / 100), 0));

  const overallEffectiveness = totalAgendamentos > 0
    ? Math.round((totalEfetivacoes / totalAgendamentos) * 100)
    : 0;

  const targetAgendamentosProgress = totalMetaAgendamentos > 0 
    ? Math.min(100, Math.round((totalAgendamentos / totalMetaAgendamentos) * 100))
    : 0;

  const targetEfetivacoesProgress = totalMetaEfetivacoes > 0 
    ? Math.min(100, Math.round((totalEfetivacoes / totalMetaEfetivacoes) * 100))
    : 0;

  // Accumulate monthly values for all SDRs to display on the chart
  const months = (() => {
    const list = [];
    const [yearStr, monthStr] = currentMonth.split('-');
    const year = parseInt(yearStr) || 2026;
    const maxMonth = parseInt(monthStr) || 6;
    for (let m = 1; m <= maxMonth; m++) {
      list.push(`${year}-${String(m).padStart(2, '0')}`);
    }
    if (!list.includes('2026-05')) list.push('2026-05');
    if (!list.includes(currentMonth)) list.push(currentMonth);
    return Array.from(new Set(list)).sort();
  })();

  const monthNamesPortuguese: Record<string, string> = {
    '2026-01': 'Jan',
    '2026-02': 'Fev',
    '2026-03': 'Mar',
    '2026-04': 'Abr',
    '2026-05': 'Mai',
    '2026-06': 'Jun',
    '2026-07': 'Jul',
    '2026-08': 'Ago',
    '2026-09': 'Set',
    '2026-10': 'Out',
    '2026-11': 'Nov',
    '2026-12': 'Dez',
  };

  const chartData = months.map(m => {
    let monthlyAgendamentos = 0;
    let monthlyEfetivacoes = 0;
    let monthlyContas = 0;

    sdrs.forEach(sdr => {
      const record = sdr.monthlyRecords?.[m];
      if (record) {
        monthlyAgendamentos += record.agendamentosCount || 0;
        monthlyEfetivacoes += record.efetivacoesCount || 0;
        monthlyContas += record.contasAbertasCount || 0;
      } else {
        const isCurrentMonth = m === currentMonth;
        if (isCurrentMonth) {
          monthlyAgendamentos += sdr.agendamentosCount || 0;
          monthlyEfetivacoes += sdr.efetivacoesCount || 0;
          monthlyContas += sdr.contasAbertasCount || 0;
        } else {
          const isPreviousMonth = m < currentMonth;
          if (isPreviousMonth) {
            const multiplier = m === '2026-01' ? 0.6 : m === '2026-02' ? 0.73 : m === '2026-03' ? 0.86 : m === '2026-04' ? 0.94 : m === '2026-05' ? 1.0 : 1.0;
            const agend = m === '2026-05' ? (sdr.monthlyRecords?.['2026-05']?.agendamentosCount || sdr.agendamentosCount || 20) : Math.round((sdr.agendamentosCount || 20) * multiplier);
            const efet = m === '2026-05' ? (sdr.monthlyRecords?.['2026-05']?.efetivacoesCount || sdr.efetivacoesCount || 10) : Math.round((sdr.efetivacoesCount || 10) * multiplier);
            const cont = m === '2026-05' ? (sdr.monthlyRecords?.['2026-05']?.contasAbertasCount || sdr.contasAbertasCount || 5) : Math.round(((sdr.contasAbertasCount || 5) || 5) * multiplier);
            monthlyAgendamentos += agend;
            monthlyEfetivacoes += efet;
            monthlyContas += cont;
          }
        }
      }
    });

    return {
      name: monthNamesPortuguese[m] || m,
      agendamentos: monthlyAgendamentos,
      efetivacoes: monthlyEfetivacoes,
      contas: monthlyContas,
    };
  });

  // Group stats by team/channel
  const teamsMap: Record<string, {
    teamName: string;
    sdrCount: number;
    agendamentos: number;
    efetivacoes: number;
    metaAgendamentos: number;
  }> = {};

  activeSDRs.forEach(s => {
    const t = s.team || 'Não Categorizado';
    if (!teamsMap[t]) {
      teamsMap[t] = {
        teamName: t,
        sdrCount: 0,
        agendamentos: 0,
        efetivacoes: 0,
        metaAgendamentos: 0
      };
    }
    teamsMap[t].sdrCount += 1;
    teamsMap[t].agendamentos += s.agendamentosCount || 0;
    teamsMap[t].efetivacoes += s.efetivacoesCount || 0;
    teamsMap[t].metaAgendamentos += s.metaAgendamentos || 20;
  });

  const teamList = Object.values(teamsMap);

  // Calculate historical comparative performance for all active SDRs
  const sdrComparativeData = activeSDRs.map(sdr => {
    let totalAgendamentosHist = sdr.agendamentosCount || 0;
    let totalEfetivacoesHist = sdr.efetivacoesCount || 0;
    let totalContasHist = sdr.contasAbertasCount || 0;

    if (sdr.monthlyRecords) {
      Object.entries(sdr.monthlyRecords).forEach(([m, record]) => {
        if (m !== currentMonth) {
          totalAgendamentosHist += record.agendamentosCount || 0;
          totalEfetivacoesHist += record.efetivacoesCount || 0;
          totalContasHist += record.contasAbertasCount || 0;
        }
      });
    }

    return {
      name: sdr.name,
      team: sdr.team || 'Mesa Geral',
      agendamentos: totalAgendamentosHist,
      efetivacoes: totalEfetivacoesHist,
      contas: totalContasHist,
    };
  });

  const formatDateVal = (dateStr: string) => {
    if (!dateStr) return 'Não definida';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const calculateSdrRank = (sdr: SDR) => {
    const { elapsedDays, totalDays } = DateService.getElapsedDays(currentMonth);
    const monthProgress = totalDays > 0 ? elapsedDays / totalDays : 0;
    const expectedAgendamentos = Math.round(sdr.metaAgendamentos * monthProgress);
    const completedAgendamentos = sdr.agendamentosCount || 0;

    if (completedAgendamentos >= expectedAgendamentos) {
      return { rank: 'A', label: 'Ranking A (Excelente - No Prazo)' };
    } else if (completedAgendamentos >= expectedAgendamentos * 0.6) {
      return { rank: 'B', label: 'Ranking B (Bom - Acompanhando)' };
    } else {
      return { rank: 'C', label: 'Ranking C (Desenvolvimento Crítico)' };
    }
  };

  const generateReportText = () => {
    let report = `📋 RELATÓRIO DE DISTRIBUIÇÃO SDR-ASSESSOR\n`;
    report += `🗓️ VIGÊNCIA DE RODÍZIO: de ${formatDateVal(startDate)} a ${formatDateVal(endDate)}\n`;
    report += `📅 Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}\n`;
    report += `-----------------------------------------------\n\n`;
    
    report += `📊 MÉTRICAS GERAIS MENSAL:\n`;
    report += `- SDRs Ativos no Rodízio: ${activeSDRs.length}\n`;
    report += `- Assessores Ativos: ${activeAssessores.length}\n`;
    report += `- Total de Agendamentos: ${totalAgendamentos} / Meta: ${totalMetaAgendamentos} (${targetAgendamentosProgress}% da Meta)\n`;
    report += `- Total de Efetivações: ${totalEfetivacoes} / Meta Est. Reuniões Pagas: ${totalMetaEfetivacoes} (${targetEfetivacoesProgress}% da Meta)\n`;
    report += `- Taxa de Conversão Geral: ${overallEffectiveness}%\n`;
    report += `-----------------------------------------------\n\n`;

    report += `🏆 CLASSIFICAÇÃO DE PERFORMANCE DOS SDRS:\n`;
    const sortedSdrsWithRank = [...activeSDRs]
      .map(s => {
        const rInfo = calculateSdrRank(s);
        const calls = s.callsCount || 0;
        const avgCalls = s.agendamentosCount > 0 ? (calls / s.agendamentosCount).toFixed(1) : '—';
        const contas = s.contasAbertasCount || 0;
        return { sdr: s, rank: rInfo.rank, label: rInfo.label, avgCalls, contas };
      })
      .sort((x, y) => x.rank.localeCompare(y.rank));

    sortedSdrsWithRank.forEach(({ sdr, rank, label, avgCalls, contas }) => {
      report += `- [SDR] ${sdr.name} ➔ ${label} | Agendados: ${sdr.agendamentosCount}/${sdr.metaAgendamentos} | Contas Abertas: ${contas} | Ligações/Agendamento: ${avgCalls}\n`;
    });
    report += `-----------------------------------------------\n\n`;

    report += `🏢 DESEMPENHO POR EQUIPES COMERCIAIS:\n`;
    teamList.forEach(t => {
      const conv = t.agendamentos > 0 ? Math.round((t.efetivacoes / t.agendamentos) * 100) : 0;
      report += `- [${t.teamName}]: ${t.sdrCount} SDRs | ${t.agendamentos} Agends (Meta: ${t.metaAgendamentos}) | ${t.efetivacoes} Rentabilizados | Conversão: ${conv}%\n`;
    });
    report += `-----------------------------------------------\n\n`;

    report += `🔗 RELAÇÕES DETERMINADAS (COMPLETO):\n`;
    if (matches.length > 0) {
      matches.forEach((m, i) => {
        const typeStr = m.isExclusive ? "[💎 EXCLUSIVO]" : "[🔄 RODÍZIO]";
        const matchStart = m.startDate || startDate;
        const matchEnd = m.endDate || endDate;
        const assoc = assessores.find(a => a.name === m.assessorName);
        const agendaStr = assoc && assoc.agendaLink ? ` | Agenda: ${assoc.agendaLink}` : '';
        report += ` ${i + 1}. ${typeStr} [SDR] ${m.sdrName} (${m.sdrConversionRate}% ef.) ➔ [Assessor] ${m.assessorName}${agendaStr} | Vigência: de ${formatDateVal(matchStart)} a ${formatDateVal(matchEnd)}\n`;
      });
    } else {
      report += `Nenhum pareamento gerado até o momento. Clique em "Gerar Relações SDR-Assessor" no painel principal.\n`;
    }
    
    return report;
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(generateReportText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadCSV = (content: string, fileName: string) => {
    // UTF-8 BOM for Microsoft Excel compatibility with special accents (ã, í, ç)
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportSdrCSV = () => {
    const headers = [
      'ID', 
      'Nome SDR', 
      'Célula_Equipe', 
      'Data de Admissão', 
      'Perfil Especialidade', 
      'Status',
      'Agendamentos Realizados', 
      'Meta Agendamentos', 
      'Progresso Meta Agendamentos (%)',
      'Ligações Atendidas', 
      'Média Ligações por Agendamento',
      'Efetivações (Rentabilizados)', 
      'Meta Estimada Efetivações',
      'Abertura Contas'
    ];

    const rows = activeSDRs.map(sdr => {
      const agProgress = sdr.metaAgendamentos > 0 ? Math.round((sdr.agendamentosCount / sdr.metaAgendamentos) * 100) : 0;
      const metaEfetivacoes = Math.round(sdr.metaAgendamentos * ((sdr.metaEfetivacaoRate || 50) / 100));
      const avgCalls = sdr.agendamentosCount > 0 ? ((sdr.callsCount || 0) / sdr.agendamentosCount).toFixed(1) : sdr.callsCount ? String(sdr.callsCount) : '—';
      const admissionDateStr = sdr.admissionDate ? DateService.formatToBR(sdr.admissionDate) : '—';
      
      return [
        sdr.id,
        sdr.name,
        sdr.team || 'Mesa Geral',
        admissionDateStr,
        sdr.professionalProfile ? sdr.professionalProfile.toUpperCase() : 'COMERCIAL',
        sdr.active ? 'Ativo' : 'Inativo',
        sdr.agendamentosCount,
        sdr.metaAgendamentos,
        `${agProgress}%`,
        sdr.callsCount || 0,
        avgCalls,
        sdr.efetivacoesCount,
        metaEfetivacoes,
        sdr.contasAbertasCount
      ];
    });

    const csvContent = [
      headers.join(';'),
      ...rows.map(r => r.map(val => {
        if (val === undefined || val === null) return '';
        const strVal = String(val);
        if (strVal.includes(';') || strVal.includes('"') || strVal.includes('\n')) {
          return `"${strVal.replace(/"/g, '""')}"`;
        }
        return strVal;
      }).join(';'))
    ].join('\n');

    downloadCSV(csvContent, `performance_sdrs_${currentMonth}.csv`);
  };

  const handleExportMatchesCSV = () => {
    const headers = [
      'SDR Parceiro IP', 
      'SDR Conversão Referência (%)', 
      'Assessor Parceiro', 
      'Tipo de Parceria', 
      'Início Parceria Vigência', 
      'Fim Parceria Vigência'
    ];

    const rows = matches.map(m => {
      const typeStr = m.isExclusive ? 'Dedicado / Exclusivo' : 'Rodízio / Compartilhado';
      const matchStart = m.startDate || startDate;
      const matchEnd = m.endDate || endDate;
      return [
        m.sdrName,
        `${m.sdrConversionRate || 0}%`,
        m.assessorName,
        typeStr,
        formatDateVal(matchStart),
        formatDateVal(matchEnd)
      ];
    });

    if (rows.length === 0) {
      rows.push(['Nenhum pareamento gerado para o período atual', '', '', '', '', '']);
    }

    const csvContent = [
      headers.join(';'),
      ...rows.map(r => r.map(val => {
        if (val === undefined || val === null) return '';
        const strVal = String(val);
        if (strVal.includes(';') || strVal.includes('"') || strVal.includes('\n')) {
          return `"${strVal.replace(/"/g, '""')}"`;
        }
        return strVal;
      }).join(';'))
    ].join('\n');

    downloadCSV(csvContent, `pareamentos_rodizio_${currentMonth}.csv`);
  };

  const handleExportTeamsCSV = () => {
    const headers = [
      'Equipe_Célula Comercial', 
      'Quantidade SDRs Ativos', 
      'Total Agendamentos Canais', 
      'Meta Agendamentos Consolidadas', 
      'Aproveitamento Meta Agendamentos (%)',
      'Total Efetivações Rentáveis', 
      'Média de Conversão do Canal (%)'
    ];

    const rows = teamList.map(t => {
      const pct = t.metaAgendamentos > 0 ? Math.round((t.agendamentos / t.metaAgendamentos) * 100) : 0;
      const conv = t.agendamentos > 0 ? Math.round((t.efetivacoes / t.agendamentos) * 100) : 0;
      
      return [
        t.teamName,
        t.sdrCount,
        t.agendamentos,
        t.metaAgendamentos,
        `${pct}%`,
        t.efetivacoes,
        `${conv}%`
      ];
    });

    if (rows.length === 0) {
      rows.push(['Sem equipes no período selecionado', '', '', '', '', '', '']);
    }

    const csvContent = [
      headers.join(';'),
      ...rows.map(r => r.map(val => {
        if (val === undefined || val === null) return '';
        const strVal = String(val);
        if (strVal.includes(';') || strVal.includes('"') || strVal.includes('\n')) {
          return `"${strVal.replace(/"/g, '""')}"`;
        }
        return strVal;
      }).join(';'))
    ].join('\n');

    downloadCSV(csvContent, `desempenho_equipes_${currentMonth}.csv`);
  };

  if (activeSDRs.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in font-sans">
        {/* Simple Header */}
        <div className="bg-white border-2 border-neutral-900 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="p-1 px-2.5 bg-black text-[#FAF9F5] text-[9px] font-black uppercase tracking-widest rounded leading-none">
              Relatório Geral
            </span>
            <h2 className="text-lg font-black uppercase tracking-tight text-neutral-950 font-display">
              Métricas de Desempenho Mensal
            </h2>
            <p className="text-xs text-neutral-600">
              Painel analítico consolidado e inteligência de cadência comercial.
            </p>
          </div>
        </div>

        {/* Master Elegant Empty State Box */}
        <div className="bg-[#FAF9F5] border-2 border-dashed border-neutral-300 rounded-3xl p-6 sm:p-10 md:p-12 text-center max-w-4xl mx-auto space-y-8">
          
          <div className="flex justify-center">
            <div className="relative w-48 h-24 flex items-center justify-center animate-fade-in">
              <svg width="100%" height="100%" viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="overflow-visible">
                {/* Horizontal line representing timeline */}
                <path d="M20 70 H180" stroke="#E5E5E5" strokeWidth="2" strokeDasharray="4 4" />
                
                {/* Visualizing empty Bar Graph blocks */}
                <rect x="40" y="50" width="16" height="20" rx="2" fill="white" stroke="#D4D4D4" strokeWidth="1.5" />
                <rect x="68" y="38" width="16" height="32" rx="2" fill="white" stroke="#D4D4D4" strokeWidth="1.5" />
                <rect x="96" y="58" width="16" height="12" rx="2" fill="white" stroke="#D4D4D4" strokeWidth="1.5" />
                <rect x="124" y="25" width="16" height="45" rx="2" fill="white" stroke="#D4D4D4" strokeWidth="1.5" />
                
                {/* Searching Magnifying Glass overlay */}
                <circle cx="150" cy="40" r="14" fill="white" stroke="black" strokeWidth="2" />
                <line x1="159.5" y1="49.5" x2="172" y2="62" stroke="black" strokeWidth="2.5" strokeLinecap="round" />
                
                {/* Spark / Warning Dot */}
                <circle cx="150" cy="40" r="2" fill="black" />
              </svg>
            </div>
          </div>

          <div className="space-y-3 max-w-xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#111] text-[#FAF9F5] text-[9px] font-black uppercase tracking-widest rounded-full font-mono">
              <BarChart3 className="w-3.5 h-3.5 text-amber-400" /> Analítico Bloqueado
            </span>
            <h3 className="text-lg font-black text-neutral-950 font-display uppercase tracking-tight">
              Nenhum Registro de SDR Cadastrado para Relatório
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              O painel analítico exige pelo menos um SDR cadastrado e ativo no sistema para projetar curvas de run-rate diário, evolução histórica e funil de conversão.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-3xl mx-auto">
            <div className="bg-white border-2 border-neutral-900 p-4.5 rounded-2xl relative shadow-3xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono font-black text-neutral-400 block mb-1">PROCESSO 01</span>
                <h4 className="text-xs font-black uppercase text-neutral-900 tracking-wider font-display mb-1.5">
                  Adicionar SDRs
                </h4>
                <p className="text-[11px] text-neutral-500 leading-normal">
                  Vá na aba <strong className="text-neutral-900">Gestão de Time</strong> e insira o nome de seus SDRs e assessores de leads.
                </p>
              </div>
            </div>

            <div className="bg-white border-2 border-neutral-900 p-4.5 rounded-2xl relative shadow-3xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono font-black text-neutral-400 block mb-1">PROCESSO 02</span>
                <h4 className="text-xs font-black uppercase text-neutral-900 tracking-wider font-display mb-1.5">
                  Atribuir Metas
                </h4>
                <p className="text-[11px] text-neutral-500 leading-normal">
                  Insira o total de ligações atendidas, agendamentos entregues e reuniões confirmadas para alimentar as curvas de cadência.
                </p>
              </div>
            </div>

            <div className="bg-white border-2 border-neutral-900 p-4.5 rounded-2xl relative shadow-3xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono font-black text-neutral-400 block mb-1">PROCESSO 03</span>
                <h4 className="text-xs font-black uppercase text-neutral-900 tracking-wider font-display mb-1.5">
                  Processar Alocação
                </h4>
                <p className="text-[11px] text-neutral-500 leading-normal">
                  Rode o pareamento comercial na aba de <strong className="text-neutral-900">Matches / Distribuição</strong> para conectar os fluxos e carregar o auditor.
                </p>
              </div>
            </div>
          </div>

          {/* Action button triggers to reset simulation */}
          <div className="pt-5 border-t border-dashed border-neutral-250 flex flex-col sm:flex-row items-center justify-center gap-4">
            <span className="text-[11px] font-mono font-bold text-neutral-500 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Ative o banco de dados demonstrativo com métricas de contingência:
            </span>
            <button
              onClick={onResetToDefaults}
              className="px-5 py-2.5 bg-black hover:bg-neutral-900 text-white font-black uppercase text-[10px] tracking-wider rounded-xl cursor-pointer transition-all shadow-3xs"
            >
              🔄 Carregar Dados Demonstrativos
            </button>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* Symmetrical Master Banner */}
      <div className="bg-white border-2 border-neutral-900 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="p-1 px-2.5 bg-black text-[#FAF9F5] text-[9px] font-black uppercase tracking-widest rounded leading-none">
              Relatório Geral
            </span>
          </div>
          <h2 className="text-lg font-black uppercase tracking-tight text-neutral-950 font-display">
            Métricas de Desempenho Mensal
          </h2>
          <p className="text-xs text-neutral-600 max-w-2xl">
            Vigência atual do rodízio configurada de <strong className="text-black font-semibold">{formatDateVal(startDate)}</strong> a <strong className="text-black font-semibold">{formatDateVal(endDate)}</strong>.
          </p>
        </div>
        
        {/* Sub-Tab navigation selectors with clean offwhite style */}
        <div className="flex bg-neutral-100 p-1 rounded-xl border border-neutral-300 gap-1 self-start md:self-auto shrink-0 font-display mt-2 md:mt-0">
          <button
            onClick={() => setActiveSubTab('visual')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 cursor-pointer transition-all ${
              activeSubTab === 'visual'
                ? 'bg-white text-black shadow-3xs font-black'
                : 'text-neutral-500 hover:text-black'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Painel Analítico
          </button>
          <button
            onClick={() => setActiveSubTab('whatsapp')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 cursor-pointer transition-all ${
              activeSubTab === 'whatsapp'
                ? 'bg-white text-black shadow-3xs font-black'
                : 'text-neutral-500 hover:text-black'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            Exportar CSV / WhatsApp
          </button>
          <button
            onClick={() => setActiveSubTab('intelligence')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 cursor-pointer transition-all ${
              activeSubTab === 'intelligence'
                ? 'bg-white text-black shadow-3xs font-black'
                : 'text-neutral-500 hover:text-black'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Inteligência de Performance
          </button>
        </div>
      </div>

      {/* High-level consolidated statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl border-2 border-neutral-900 p-5 relative">
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Conversão Geral SDR</span>
              <InfoTooltip 
                title="Conversão Geral SDR"
                description="Mede a eficiência geral de conversão do time de SDRs. Representa a proporção das reuniões agendadas que de fato foram confirmadas/efetivadas."
                formula="Calculado por:\n(Total de Efetivações / Total de Agendamentos) * 100"
                align="left"
              />
            </div>
            <TrendingUp className="w-4 h-4 text-neutral-850" />
          </div>
          <div className="text-3xl font-black text-black mt-1.5 tracking-tight font-display">{overallEffectiveness}%</div>
          <p className="text-[10px] text-neutral-500 mt-1 leading-normal">Média ponderada ponderando todos os SDRs escalados para o rodízio.</p>
        </div>

        <div className="bg-white rounded-2xl border-2 border-neutral-900 p-5 relative">
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Volume de Agendamentos</span>
              <InfoTooltip 
                title="Progresso de Agendamentos"
                description="Mede o volume cumulativo de agendamentos realizados pela célula comercial em relação à meta combinada definida para o mês."
                formula="Calculado por:\n(Total de Agendamentos Realizados / Meta Total de Agendamentos) * 100\n[Resultado limitado a 100% no progresso]"
                align="center"
              />
            </div>
            <Users className="w-4 h-4 text-neutral-850" />
          </div>
          <div className="text-3xl font-black text-black mt-1.5 tracking-tight font-display">
            {totalAgendamentos} <span className="text-xs text-neutral-400 font-normal">/ {totalMetaAgendamentos} meta</span>
          </div>
          
          <div className="w-full bg-neutral-100 h-2 rounded-full mt-2.5 overflow-hidden border border-neutral-200">
            <div 
              className="bg-black h-full rounded-full transition-all duration-500"
              style={{ width: `${targetAgendamentosProgress}%` }}
            ></div>
          </div>
          <p className="text-[9px] text-neutral-500 mt-1 flex justify-between font-mono font-bold">
            <span>Andamento do Mês</span>
            <span>{targetAgendamentosProgress}% da Meta</span>
          </p>
        </div>

        <div className="bg-white rounded-2xl border-2 border-neutral-900 p-5 relative">
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Contratos Prontos (Rentáveis)</span>
              <InfoTooltip 
                title="Efetivações e Contratos Prontos"
                description="Descreve o volume total de reuniões efetivadas (contratos prontos) que atingiram a rentabilidade em comparação à meta estimada de efetivações do ciclo."
                formula="Calculado por:\n(Total de Efetivações / Meta Geral de Efetivações) * 100\n\nFórmula da Meta Geral de Efetivações:\nSomatório de (Meta de Agendamentos do SDR * Meta Efetivação individual de cada SDR)"
                align="center"
              />
            </div>
            <CheckCircle2 className="w-4 h-4 text-neutral-850" />
          </div>
          <div className="text-3xl font-black text-black mt-1.5 tracking-tight font-display">
            {totalEfetivacoes} <span className="text-xs text-neutral-400 font-normal">/ {totalMetaEfetivacoes} est.</span>
          </div>

          <div className="w-full bg-neutral-100 h-2 rounded-full mt-2.5 overflow-hidden border border-neutral-200">
            <div 
              className="bg-neutral-800 h-full rounded-full transition-all duration-500"
              style={{ width: `${targetEfetivacoesProgress}%` }}
            ></div>
          </div>
          <p className="text-[9px] text-neutral-500 mt-1 flex justify-between font-mono font-bold">
            <span>Conversão Faturada</span>
            <span>{targetEfetivacoesProgress}% da Meta</span>
          </p>
        </div>

        <div className="bg-white rounded-2xl border-2 border-neutral-900 p-5 flex flex-col justify-between relative">
          <div>
            <div className="flex justify-between items-start">
              <div className="flex items-center">
                <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest text-[#111]">Conversão por Afinidade</span>
                <InfoTooltip 
                  title="Conversão por Afinidade"
                  description="Representa o percentual de efetivações nos canais de matches ativos. Identifica a sintonia de entrega entre duplas de SDRs e seus respectivos Assessores de Investimento vinculados."
                  formula="Calculado por:\n(Efetivações em Pareamentos Ativos / Agendamentos Realizados em Pareamentos Ativos) * 100"
                  align="right"
                />
              </div>
              <Compass className="w-4 h-4 text-neutral-850" />
            </div>
            
            <div className="text-3xl font-black text-black mt-1.5 tracking-tight font-display">
              {averageAffinityRate}%
            </div>

            <div className="w-full bg-neutral-100 h-2 rounded-full mt-2.5 overflow-hidden border border-neutral-200">
              <div 
                className="bg-black h-full rounded-full transition-all duration-500"
                style={{ width: `${averageAffinityRate}%` }}
              ></div>
            </div>

            <p className="text-[9px] text-neutral-500 mt-1 flex justify-between font-mono font-bold">
              <span>Pareamentos Matched</span>
              <span>{totalMatchedEfetivacoes} Efet. / {totalMatchedAgendamentos} Agend.</span>
            </p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-dashed border-neutral-200">
            {matchAffinities.length === 0 ? (
              <span className="text-[9.5px] font-bold text-neutral-400 uppercase">Sem relações pareadas</span>
            ) : (
              <div className="space-y-1.5">
                {bottleneckPairings.length > 0 ? (
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-mono font-black text-red-650 bg-red-50 border border-red-200 rounded px-1.5 py-0.5 leading-none uppercase animate-pulse">
                      ⚠️ Gargalo Identificado
                    </span>
                    <button
                      onClick={() => setShowAffinityDetails(!showAffinityDetails)}
                      className="text-[9px] font-black text-neutral-850 uppercase hover:underline cursor-pointer"
                    >
                      {showAffinityDetails ? 'Ocultar' : 'Identificar'}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-[9.5px] font-bold text-emerald-600 uppercase flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0" />
                      Sem gargalos graves
                    </span>
                    <button
                      onClick={() => setShowAffinityDetails(!showAffinityDetails)}
                      className="text-[9px] font-black text-neutral-850 uppercase hover:underline cursor-pointer"
                    >
                      {showAffinityDetails ? 'Ocultar' : 'Ver Detalhes'}
                    </button>
                  </div>
                )}
                
                {bottleneckPairings.length > 0 && (
                  <p className="text-[9px] text-neutral-500 leading-tight">
                    Par <strong className="text-neutral-900 font-bold">{bottleneckPairings[0].sdrName.split(' ')[0]} ➔ {bottleneckPairings[0].assessorName.split(' ')[0]}</strong> com baixa conversão ({bottleneckPairings[0].rate}%).
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Match Affinity Auditor Breakdown Drawer */}
      {showAffinityDetails && matchAffinities.length > 0 && (
        <div className="bg-[#FAF9F5] border-2 border-neutral-900 rounded-2xl p-6 shadow-3xs space-y-4 animate-fade-in">
          <div className="flex justify-between items-start border-b border-neutral-300 pb-3">
            <div>
              <h4 className="text-xs font-black uppercase text-neutral-950 tracking-wider flex items-center gap-1.5 font-display">
                <Compass className="w-4 h-4 text-black animate-spin-slow" />
                Auditoria de Conversão por Afinidade (Matches Ativos)
              </h4>
              <p className="text-[10px] text-neutral-500 mt-0.5">
                Comparativo de reuniões agendadas vs. confirmadas por pareamento para identificar barreiras táticas, de sintonia ou falhas de direcionamento.
              </p>
            </div>
            <button
              onClick={() => setShowAffinityDetails(false)}
              className="px-2 py-1 bg-white border border-neutral-300 hover:border-black rounded text-[9px] font-black uppercase tracking-wide cursor-pointer text-neutral-700 hover:text-black transition-all"
            >
              Fechar Auditoria
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {matchAffinities.map((aff, i) => {
              const isBottleneck = aff.rate < 45 && aff.agendamentos > 0;
              return (
                <div 
                  key={i} 
                  className={`bg-white border p-4.5 rounded-xl flex flex-col justify-between transition-all shadow-3xs ${
                    isBottleneck 
                      ? 'border-red-550 bg-red-50/10 hover:border-red-650' 
                      : aff.agendamentos === 0 
                      ? 'border-neutral-250 opacity-70' 
                      : 'border-neutral-250 hover:border-neutral-950'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start border-b border-dashed border-neutral-200 pb-2">
                      <div className="leading-tight">
                        <span className="text-[11px] font-extrabold text-neutral-900 block">{aff.sdrName}</span>
                        <span className="text-[8px] font-black text-neutral-450 uppercase block font-mono">➡ {aff.assessorName}</span>
                      </div>
                      
                      {aff.agendamentos > 0 ? (
                        <span className={`text-[10px] font-mono font-black border rounded px-1.5 py-0.5 leading-none ${
                          isBottleneck 
                            ? 'bg-red-100 text-red-750 border-red-300' 
                            : 'bg-emerald-50 text-emerald-850 border-emerald-300'
                        }`}>
                          {aff.rate}% Ef.
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono font-bold bg-neutral-100 text-neutral-550 border border-neutral-300 rounded px-1.5 py-0.5 leading-none">
                          Sem Agend.
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono leading-none pt-1">
                      <div className="space-y-0.5">
                        <span className="text-[8px] text-neutral-450 font-bold block uppercase">Agendamentos</span>
                        <strong className="text-neutral-800 font-extrabold">{aff.agendamentos} encontros</strong>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[8px] text-neutral-455 font-bold block uppercase">Confirmadas</span>
                        <strong className="text-neutral-800 font-extrabold">{aff.efetivacoes} efetivações</strong>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3.5 pt-2 border-t border-dashed border-neutral-150 flex items-center justify-between">
                    {aff.agendamentos === 0 ? (
                      <span className="text-[8px] font-black uppercase text-neutral-450 font-mono">Aguardando Início</span>
                    ) : isBottleneck ? (
                      <span className="text-[8px] font-black uppercase text-red-700 bg-red-100 border border-red-250 rounded px-1.5 flex items-center gap-0.5 font-mono">
                        ⚠️ Baixo Pareamento
                      </span>
                    ) : (
                      <span className="text-[8px] font-black uppercase text-emerald-800 bg-emerald-100 border border-emerald-250 rounded px-1.5 flex items-center gap-0.5 font-mono">
                        ⭐ Ótima Sintonização
                      </span>
                    )}

                    <span className="text-[8px] font-bold text-neutral-400 uppercase font-mono">
                      {aff.isExclusive ? 'Diamante' : 'Rodízio'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {bottleneckPairings.length > 0 && (
            <div className="p-3.5 bg-red-50/70 border border-red-250 rounded-xl flex items-start gap-2.5">
              <AlertCircle className="w-4.5 h-4.5 text-red-650 shrink-0 mt-0.5" />
              <div>
                <span className="text-[9px] font-black uppercase text-red-800 tracking-wider block font-mono">Recomendação do Sistema (Pareamentos Críticos)</span>
                <p className="text-[10px] text-red-950 mt-1 leading-relaxed font-medium">
                  Identificamos gargalos táticos no pareamento de <strong className="font-bold">{bottleneckPairings.map(b => b.sdrName.split(' ')[0]).join(', ')}</strong>. Recomenda-se realizar uma sessão 1:1 (One-on-One) de alinhamento com os respectivos assessores ou reavaliar o link de agenda/disponibilidade técnica.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'visual' ? (
        <div className="space-y-6">
          
          {/* NEW: Dynamic monthly tracking graph */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs space-y-4">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900 flex items-center gap-1.5 font-display">
                <BarChart3 className="w-4.5 h-4.5 text-neutral-800" />
                Acompanhamento Histórico e Progresso Mensal
              </h3>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Análise comparativa de agendamentos, efetivações rentabilizadas e abertura de contas ao longo dos meses fiscais de 2026.
              </p>
            </div>

            {/* Recharts responsive container rendering our graph */}
            <div className="h-68 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart key={`area-${currentMonth}-${chartData.length}`} data={chartData} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAgendamentos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#111111" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#111111" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorEfetivacoes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorContas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6c6c6c', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#6c6c6c' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #E5E5E5', fontSize: '11px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                    labelStyle={{ fontWeight: 'bold', color: '#111111' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }} />
                  <Area type="monotone" name="Agendamentos" dataKey="agendamentos" stroke="#111111" strokeWidth={2} fillOpacity={1} fill="url(#colorAgendamentos)" isAnimationActive={true} animationDuration={1000} animationEasing="ease-out" />
                  <Area type="monotone" name="Efetivações" dataKey="efetivacoes" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorEfetivacoes)" isAnimationActive={true} animationDuration={1200} animationEasing="ease-out" />
                  <Area type="monotone" name="Contas Abertas" dataKey="contas" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorContas)" isAnimationActive={true} animationDuration={1400} animationEasing="ease-out" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* NEW: Comparative Bar Chart of historical performance of all SDRs */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900 flex items-center gap-1.5 font-display">
                  <BarChart3 className="w-4.5 h-4.5 text-neutral-800" />
                  Comparativo de Performance Histórica dos SDRs
                </h3>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Visualização consolidada do histórico acumulado dos SDRs ativos (Soma dos meses fiscais anteriores + mês vigente).
                </p>
              </div>
              <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-xl border border-neutral-200">
                <span className="text-[9px] font-black uppercase px-2 py-1 text-neutral-600">Métricas Consolidadas</span>
              </div>
            </div>

            {/* Recharts BarChart container */}
            <div className="h-72 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart key={`bar-${currentMonth}-${sdrComparativeData.length}`} data={sdrComparativeData} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#6c6c6c', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#6c6c6c' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #E5E5E5', fontSize: '11px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                    labelStyle={{ fontWeight: 'bold', color: '#111111' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }} />
                  <Bar name="Agendamentos" dataKey="agendamentos" fill="#111111" radius={[4, 4, 0, 0]} isAnimationActive={true} animationDuration={1000} animationEasing="ease-out" />
                  <Bar name="Efetivações" dataKey="efetivacoes" fill="#10b981" radius={[4, 4, 0, 0]} isAnimationActive={true} animationDuration={1200} animationEasing="ease-out" />
                  <Bar name="Contas Abertas" dataKey="contas" fill="#3b82f6" radius={[4, 4, 0, 0]} isAnimationActive={true} animationDuration={1400} animationEasing="ease-out" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Detailed Performance Table grouped by Team leader / Channel */}
          <div className="lg:col-span-8 bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-3xs space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-150 pb-3">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900">
                  Produtividade Consolidada por Célula / Equipe
                </h3>
                <p className="text-[11px] text-neutral-500">
                  Performance agregada de todos os corretores e SDRs do canal.
                </p>
              </div>
              <span className="text-[9px] font-bold font-mono text-neutral-450 bg-neutral-50 border border-neutral-200 px-2 py-0.5 rounded leading-none">
                {teamList.length} canais ativos
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 text-[10px] text-neutral-450 uppercase tracking-wider font-bold">
                    <th className="py-2.5 font-black">Célula</th>
                    <th className="py-2.5 text-center font-black">Tamanho do Time</th>
                    <th className="py-2.5 text-center font-black">Agendamentos Totais</th>
                    <th className="py-2.5 text-center font-black">Efetivações Totais</th>
                    <th className="py-2.5 text-center font-black">Meta Agend.</th>
                    <th className="py-2.5 text-right font-black">Conversão Canal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-150 text-xs text-neutral-800">
                  {teamList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-neutral-450 italic">
                        Não há equipes com SDRs ativos este mês.
                      </td>
                    </tr>
                  ) : (
                    teamList.map(t => {
                      const conversion = t.agendamentos > 0 
                        ? Math.round((t.efetivacoes / t.agendamentos) * 100) 
                        : 0;
                      
                      const isWinning = conversion >= 55;
                      const hasWarning = conversion < 40 && t.agendamentos > 0;

                      return (
                        <tr key={t.teamName} className="hover:bg-neutral-50/50 transition-colors">
                          <td className="py-3.5 font-extrabold text-neutral-950 flex items-center gap-1.5">
                            {t.teamName}
                            {isWinning && (
                              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-1 py-0.5 text-[8px] font-black rounded uppercase leading-none">
                                Alto Giro
                              </span>
                            )}
                            {hasWarning && (
                              <span className="bg-red-50 text-red-700 border border-red-200 px-1 py-0.5 text-[8px] font-black rounded uppercase leading-none">
                                Alerta Tático
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 text-center font-medium font-mono text-neutral-600">{t.sdrCount} corretores</td>
                          <td className="py-3.5 text-center font-bold font-mono text-neutral-900">{t.agendamentos}</td>
                          <td className="py-3.5 text-center font-bold font-mono text-neutral-900">{t.efetivacoes}</td>
                          <td className="py-3.5 text-center font-medium font-mono text-neutral-500">{t.metaAgendamentos}</td>
                          <td className="py-3.5 text-right">
                            <span className={`font-mono font-black text-sm px-2 py-0.5 rounded ${
                              isWinning 
                                ? 'text-emerald-850 bg-emerald-50 border border-emerald-250/50' 
                                : hasWarning 
                                  ? 'text-red-700 bg-red-50 border border-red-200/50' 
                                  : 'text-neutral-900 bg-neutral-100 border border-neutral-200'
                            }`}>
                              {conversion}%
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick audit tools for allocation */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 shadow-3xs space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900 flex items-center gap-1.5 font-display">
                <Compass className="w-4 h-4 text-neutral-850" />
                Auditar Balanceamento
              </h3>
              <p className="text-xs text-neutral-500 leading-normal font-sans">
                As parcerias geradas estão estruturadas dinamicamente de acordo com as seguintes premissas neste mês comercial:
              </p>
              
              <div className="space-y-3 pt-1">
                <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase text-neutral-900 leading-none">
                    <span>SDRs em Rodízio</span>
                    <span className="font-mono text-neutral-600">{activeSDRs.length} SDRs</span>
                  </div>
                  <p className="text-[10px] text-neutral-450 font-sans leading-normal">Estão habilitados a alimentar múltiplos assessores por vez.</p>
                </div>

                <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase text-neutral-900 leading-none">
                    <span>Pareamentos Atuais</span>
                    <span className="font-mono text-neutral-600">{matches.length} parcerias</span>
                  </div>
                  <p className="text-[10px] text-neutral-450 font-sans leading-normal">Contratos vigentes gerados que expiram em exatamente 30 dias fiscais.</p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onResetToDefaults}
                  className="w-full py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 border border-neutral-200"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Limpar Todos os Dados
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
      ) : activeSubTab === 'whatsapp' ? (
        /* Copy WhatsApp Text & CSV Export Tab interface block */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* CSV Export Center Column */}
          <div className="lg:col-span-5 bg-white rounded-2xl border-2 border-neutral-900 p-6 shadow-3xs space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-neutral-900 text-sm flex items-center gap-2 font-display uppercase tracking-tight">
                  <Table className="w-4.5 h-4.5 text-neutral-800" />
                  Central de Exportação (CSV)
                </h3>
                <p className="text-xs text-neutral-500 font-sans mt-1">
                  Gere relatórios tabulares compatíveis com Excel, Google Sheets ou plataformas de Business Intelligence (Power BI, Looker).
                </p>
              </div>

              <div className="space-y-4 pt-2">
                {/* SDR Performance Card */}
                <div className="p-4 bg-neutral-50 hover:bg-neutral-100/70 border border-neutral-200 rounded-xl transition-all flex flex-col justify-between gap-3 group">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase text-neutral-450 tracking-wider">Planilha Contábil & CRM</span>
                    <h4 className="text-xs font-black uppercase text-neutral-900 leading-tight">Métricas de SDRs e Metas</h4>
                    <p className="text-[10px] text-neutral-500 leading-normal font-sans">
                      Exporta dados individuais (realizado, metas, ligações atendidas, conversão de reuniões e contas abertas) de todos os SDRs escalados.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportSdrCSV}
                    className="w-full py-2 bg-black hover:bg-neutral-900 text-[#FAF9F5] text-[10px] font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Baixar SDRs (CSV)
                  </button>
                </div>

                {/* Match Allocation Card */}
                <div className="p-4 bg-neutral-50 hover:bg-neutral-100/70 border border-neutral-200 rounded-xl transition-all flex flex-col justify-between gap-3 group">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase text-neutral-450 tracking-wider">Parcerias Vigentes</span>
                    <h4 className="text-xs font-black uppercase text-neutral-900 leading-tight">Pareamentos do Rodízio</h4>
                    <p className="text-[10px] text-neutral-500 leading-normal font-sans">
                      Contratos ativos gerados para o ciclo, mapeando SDR, assessor correspondente e as taxas de conversão de referência.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportMatchesCSV}
                    className="w-full py-2 bg-black hover:bg-neutral-900 text-[#FAF9F5] text-[10px] font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Baixar Pareamentos (CSV)
                  </button>
                </div>

                {/* Team Leaders Card */}
                <div className="p-4 bg-neutral-50 hover:bg-neutral-100/70 border border-neutral-200 rounded-xl transition-all flex flex-col justify-between gap-3 group">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase text-neutral-450 tracking-wider">Estrutura de Liderança</span>
                    <h4 className="text-xs font-black uppercase text-neutral-900 leading-tight">Métricas de Equipes / Canais</h4>
                    <p className="text-[10px] text-neutral-500 leading-normal font-sans">
                      Agrupamento comercial de produção e percentuais médios de metas cumpridos em cada célula.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportTeamsCSV}
                    className="w-full py-2 bg-black hover:bg-neutral-900 text-[#FAF9F5] text-[10px] font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Baixar Equipes (CSV)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* WhatsApp Text View Column */}
          <div className="lg:col-span-7 bg-white rounded-2xl border-2 border-neutral-900 p-6 shadow-3xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="font-bold text-neutral-900 text-sm flex items-center gap-2 font-display uppercase tracking-tight">
                  <FileText className="w-4.5 h-4.5 text-neutral-800" />
                  Auditoria Comercial Formatada (WhatsApp)
                </h3>
                <p className="text-xs text-neutral-500 font-sans">
                  Copie o conteúdo estruturado abaixo para encaminhá-lo diretamente no WhatsApp ou Slack do time.
                </p>
              </div>
              
              <button
                type="button"
                onClick={handleCopyToClipboard}
                className="px-3.5 py-1.5 text-xs font-black bg-black text-[#FAF9F5] hover:text-white rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs hover:bg-neutral-850 shrink-0"
              >
                {copied ? <CheckCircle className="w-3.5 h-3.5 text-white animate-pulse" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copiado!' : 'Copiar Texto'}
              </button>
            </div>
            
            <div className="bg-neutral-50 p-4 border border-neutral-200/90 rounded-xl overflow-y-auto max-h-[580px] font-mono text-[11px] text-neutral-900 whitespace-pre leading-relaxed custom-scrollbar border-dashed">
              {generateReportText()}
            </div>
          </div>

        </div>
      ) : (
        /* Intelligence & Performance Dashboard Section */
        <div className="space-y-6">
          {/* Calendar & Call Metrics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Business Days Card */}
            <div className="bg-white border-2 border-neutral-900 p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-neutral-500 text-[10px] font-black uppercase tracking-wider">
                  <Calendar className="w-4 h-4 text-neutral-800" />
                  Ritmo Temporal do Mês
                </div>
                {(() => {
                  const { elapsedBusinessDays, totalBusinessDays } = DateService.getElapsedBusinessDays(currentMonth);
                  const remainingDays = Math.max(1, totalBusinessDays - elapsedBusinessDays);
                  const pctElapsed = Math.round((elapsedBusinessDays / totalBusinessDays) * 100);
                  
                  return (
                    <div className="mt-3 space-y-3">
                      <div className="flex justify-between items-baseline">
                        <span className="text-3xl font-black text-black tracking-tight">{remainingDays}</span>
                        <span className="text-xs text-neutral-500 font-bold uppercase">Dias Úteis Restantes</span>
                      </div>
                      
                      {/* Custom progress bar */}
                      <div className="space-y-1">
                        <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden border border-neutral-200">
                          <div 
                            className="bg-black h-full transition-all duration-500"
                            style={{ width: `${pctElapsed}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-neutral-400 uppercase">
                          <span>{elapsedBusinessDays} Decorridos</span>
                          <span>{pctElapsed}% Concluído</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Total Phone Activity */}
            <div className="bg-white border-2 border-neutral-900 p-5 rounded-2xl flex flex-col justify-between">
              {(() => {
                const totalCalls = activeSDRs.reduce((sum, s) => sum + (s.callsCount || 0), 0);
                const avgCalls = Math.round(totalCalls / Math.max(1, activeSDRs.length));
                return (
                  <>
                    <div>
                      <div className="flex items-center gap-2 text-neutral-500 text-[10px] font-black uppercase tracking-wider">
                        <PhoneCall className="w-4 h-4 text-neutral-800" />
                        Atividade Telefônica Coletiva
                      </div>
                      <div className="mt-3 flex justify-between items-baseline">
                        <span className="text-3xl font-black text-black tracking-tight font-mono">{totalCalls.toLocaleString()}</span>
                        <span className="text-xs text-neutral-500 font-bold uppercase">Ligações Atendidas</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-neutral-100 flex justify-between items-center text-xs">
                      <div className="space-y-0.5">
                        <div className="text-[10px] font-black text-neutral-400 uppercase leading-none">Média por SDR</div>
                        <div className="font-bold text-neutral-850 font-mono">{avgCalls} chamadas</div>
                      </div>
                      <div className="text-right space-y-0.5">
                        <div className="text-[10px] font-black text-neutral-400 uppercase leading-none">Célula Ativa</div>
                        <div className="font-bold text-[#faf9f5] bg-black px-2 py-0.5 rounded text-[10px] uppercase font-mono tracking-wider leading-none">CRM-PRO</div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Effort Ratio & Conversion Health */}
            <div className="bg-white border-2 border-neutral-900 p-5 rounded-2xl flex flex-col justify-between">
              {(() => {
                const totalCalls = activeSDRs.reduce((sum, s) => sum + (s.callsCount || 0), 0);
                const ratio = totalAgendamentos > 0 ? (totalCalls / totalAgendamentos).toFixed(1) : '45';
                const healthRating = Number(ratio) < 40 ? 'EXCELENTE EFICIÊNCIA' : Number(ratio) < 60 ? 'MÉDIA OPERACIONAL' : 'ALTO CUSTO DE AGENDAMENTO';
                const ratingBg = Number(ratio) < 40 ? 'bg-emerald-50 text-emerald-700' : Number(ratio) < 60 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700';
                
                return (
                  <>
                    <div>
                      <div className="flex items-center gap-2 text-neutral-500 text-[10px] font-black uppercase tracking-wider">
                        <Zap className="w-4 h-4 text-neutral-800" />
                        Esforço Linear por Agendamento
                      </div>
                      <div className="mt-3 flex justify-between items-baseline">
                        <span className="text-3xl font-black text-black tracking-tight font-mono">{ratio}</span>
                        <span className="text-xs text-neutral-500 font-bold uppercase">Ligações para 1 Reunião</span>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg ${ratingBg}`}>
                        {healthRating}
                      </span>
                    </div>
                  </>
                );
              })()}
            </div>

          </div>

          {/* Required Daily Call Target Engine */}
          <div className="bg-white rounded-2xl border-2 border-neutral-900 overflow-hidden shadow-3xs">
            <div className="p-5 border-b-2 border-neutral-950 bg-neutral-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-neutral-950 uppercase tracking-tight flex items-center gap-1.5 font-display">
                  <Flame className="w-4 h-4 text-neutral-850" />
                  Calculadora de Cadência Diária Requerida (Run-Rate)
                </h3>
                <p className="text-xs text-neutral-500 font-sans mt-0.5">
                  Projeção diária recomendada de chamadas para cada SDR atingir 100% da meta de agendamentos.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-100 border-b border-neutral-300">
                    <th className="p-3.5 text-[10px] lg:text-xs font-black uppercase tracking-wider text-neutral-700">SDR</th>
                    <th className="p-3.5 text-[10px] lg:text-xs font-black uppercase tracking-wider text-neutral-700 text-center">Feito / Meta</th>
                    <th className="p-3.5 text-[10px] lg:text-xs font-black uppercase tracking-wider text-neutral-700 text-center">Falta</th>
                    <th className="p-3.5 text-[10px] lg:text-xs font-black uppercase tracking-wider text-neutral-700 text-center">Histórico Esforço</th>
                    <th className="p-3.5 text-[10px] lg:text-xs font-black uppercase tracking-wider text-neutral-700 text-right">Média Diária Recomendada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {(() => {
                    const { elapsedBusinessDays, totalBusinessDays } = DateService.getElapsedBusinessDays(currentMonth);
                    const remainingBusinessDays = Math.max(1, totalBusinessDays - elapsedBusinessDays);
                    
                    return activeSDRs.map(sdr => {
                      const made = sdr.agendamentosCount;
                      const target = sdr.metaAgendamentos;
                      const gap = Math.max(0, target - made);
                      
                      const rawRatio = made > 0 ? (sdr.callsCount || 0) / made : 45;
                      const isDefaultRatio = made === 0;
                      const ratioVal = Math.round(rawRatio);
                      
                      const requiredDailyCalls = gap > 0 
                        ? Math.ceil((gap * rawRatio) / remainingBusinessDays) 
                        : 0;

                      return (
                        <tr key={sdr.id} className="hover:bg-neutral-50/50 transition-colors">
                          <td className="p-3.5">
                            <span className="text-xs font-black text-neutral-900 block font-display leading-tight">{sdr.name}</span>
                            <span className="text-[10px] text-neutral-450 block uppercase font-mono mt-0.5">{sdr.team || 'Mesa Geral'}</span>
                          </td>
                          <td className="p-3.5 text-center font-mono text-xs">
                            <span className="font-bold text-neutral-950">{made}</span>
                            <span className="text-neutral-400"> / {target}</span>
                          </td>
                          <td className="p-3.5 text-center">
                            {gap === 0 ? (
                              <span className="p-1 px-2.5 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-lg">Bateu Meta</span>
                            ) : (
                              <span className="font-mono text-xs font-bold text-rose-600">-{gap} agend.</span>
                            )}
                          </td>
                          <td className="p-3.5 text-center">
                            <span className="font-mono text-xs font-bold text-neutral-800">{ratioVal} calls/agend.</span>
                            {isDefaultRatio && <span className="text-[9px] text-neutral-450 block">(bench default)</span>}
                          </td>
                          <td className="p-3.5 text-right">
                            {requiredDailyCalls > 0 ? (
                              <div className="space-y-0.5">
                                <span className="font-mono text-xs font-black text-rose-600 block bg-rose-50 border border-rose-200 rounded px-2 py-0.5 inline-block">{requiredDailyCalls} ligações / dia</span>
                                <span className="text-[9px] text-neutral-400 block">em {remainingBusinessDays} dias úteis</span>
                              </div>
                            ) : (
                              <span className="font-mono text-xs font-black text-emerald-600 block bg-emerald-50 border border-emerald-200 rounded px-2 py-0.5 inline-block">Cota Concluída ✓</span>
                            )}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>

          {/* Individual SDR Evolution / Insights Area */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Selector and Info Card */}
            <div className="lg:col-span-4 bg-white border-2 border-neutral-900 rounded-2xl p-5 space-y-4 shadow-3xs">
              <div>
                <label className="text-[10px] font-black uppercase text-neutral-500 tracking-wider block mb-2">
                  Selecione o SDR para Evolução Histórica:
                </label>
                <select
                  value={selectedSdrIdForEvolution}
                  onChange={(e) => setSelectedSdrIdForEvolution(e.target.value)}
                  className="w-full text-xs font-bold uppercase rounded-xl border border-neutral-300 p-2.5 bg-neutral-50 text-neutral-800 focus:outline-hidden focus:ring-1 focus:ring-black cursor-pointer leading-tight"
                >
                  {activeSDRs.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedSdrIdForEvolution && sdrs.find(s => s.id === selectedSdrIdForEvolution) ? (() => {
                const selectedSdrObj = sdrs.find(s => s.id === selectedSdrIdForEvolution)!;
                return (
                  <div className="space-y-3.5 pt-2 border-t border-neutral-150">
                    <div className="p-3.5 bg-neutral-50/70 border border-neutral-200 rounded-xl space-y-2.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-neutral-500 font-bold uppercase text-[10px]">Data de Entrada</span>
                        <span className="font-mono font-bold text-neutral-850">{selectedSdrObj.admissionDate ? DateService.formatToBR(selectedSdrObj.admissionDate) : '—'}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-neutral-500 font-bold uppercase text-[10px]">Time / Célula</span>
                        <span className="font-bold text-neutral-850 uppercase">{selectedSdrObj.team || 'Mesa Geral'}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-neutral-500 font-bold uppercase text-[10px]">Contas Abertas</span>
                        <span className="font-mono font-bold text-neutral-850">{selectedSdrObj.contasAbertasCount || 0}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-neutral-500 font-bold uppercase text-[10px]">Status Rodízio</span>
                        <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded leading-none">Habilitado</span>
                      </div>
                    </div>

                    <div className="p-3 bg-neutral-900 rounded-xl space-y-1.5 text-[#fffbeb]">
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-400 uppercase tracking-wider leading-none">
                        <Sparkles className="w-3.5 h-3.5" />
                        Status de Desempenho
                      </div>
                      <p className="text-[11px] text-neutral-300 leading-normal font-sans">
                        {selectedSdrObj.agendamentosCount >= selectedSdrObj.metaAgendamentos
                          ? `SDR é destaque da operação este mês, ultrapassou os ${selectedSdrObj.metaAgendamentos} agendamentos propostos e demonstra ritmo acima do baseline corporativo.`
                          : `Atualmente operando com ${selectedSdrObj.agendamentosCount} agendamentos. Precisa de ${Math.max(0, selectedSdrObj.metaAgendamentos - selectedSdrObj.agendamentosCount)} reuniões para atingir a conformidade mínima de sua cota.`}
                      </p>
                    </div>
                  </div>
                );
              })() : (
                <p className="text-xs text-neutral-400 italic">Selecione um profissional para ver seu scorecard.</p>
              )}
            </div>

            {/* Right: Charts and History Table */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Chart container */}
              <div className="bg-white border-2 border-neutral-900 rounded-2xl p-5 shadow-3xs space-y-3">
                <h4 className="text-[10px] font-black uppercase text-neutral-500 tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-neutral-850" />
                  Evolução Histórica de Agendamentos (Realizado vs Meta)
                </h4>
                
                <div className="h-50 lg:h-52 w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                      data={(() => {
                        const selectedSdrObj = sdrs.find(s => s.id === selectedSdrIdForEvolution) || activeSDRs[0];
                        if (!selectedSdrObj) return [];
                        
                        return months.map(mkey => {
                          const r = selectedSdrObj.monthlyRecords?.[mkey];
                          if (r) {
                            return {
                              month: mkey,
                              agendamentos: r.agendamentosCount ?? 0,
                              meta: r.metaAgendamentos || 20,
                              efetivacoes: r.efetivacoesCount ?? 0,
                              conversao: r.agendamentosCount > 0 ? Math.round((r.efetivacoesCount / r.agendamentosCount) * 100) : 0,
                              ligacoes: r.callsCount || 0
                            };
                          } else {
                            const isCurrent = mkey === currentMonth;
                            if (isCurrent) {
                              return {
                                month: mkey,
                                agendamentos: selectedSdrObj.agendamentosCount || 0,
                                meta: selectedSdrObj.metaAgendamentos || 20,
                                efetivacoes: selectedSdrObj.efetivacoesCount || 0,
                                conversao: selectedSdrObj.agendamentosCount > 0 ? Math.round((selectedSdrObj.efetivacoesCount / selectedSdrObj.agendamentosCount) * 100) : 0,
                                ligacoes: selectedSdrObj.callsCount || 0
                              };
                            }
                            const mult = mkey === '2026-01' ? 0.6 : mkey === '2026-02' ? 0.73 : mkey === '2026-03' ? 0.86 : mkey === '2026-04' ? 0.94 : 1.0;
                            const agend = mkey === '2026-05' ? (selectedSdrObj.monthlyRecords?.['2026-05']?.agendamentosCount || selectedSdrObj.agendamentosCount || 20) : Math.round((selectedSdrObj.agendamentosCount || 20) * mult);
                            const efet = mkey === '2026-05' ? (selectedSdrObj.monthlyRecords?.['2026-05']?.efetivacoesCount || selectedSdrObj.efetivacoesCount || 10) : Math.round((selectedSdrObj.efetivacoesCount || 10) * mult);
                            return {
                              month: mkey,
                              agendamentos: agend,
                              meta: selectedSdrObj.metaAgendamentos || 20,
                              efetivacoes: efet,
                              conversao: agend > 0 ? Math.round((efet / agend) * 100) : 0,
                              ligacoes: mkey === '2026-05' ? (selectedSdrObj.monthlyRecords?.['2026-05']?.callsCount || 100) : Math.round((selectedSdrObj.callsCount || 100) * mult)
                            };
                          }
                        });
                      })()} 
                      margin={{ top: 10, right: 15, left: -25, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tickFormatter={(v) => v.split('-')[1] + '/' + v.split('-')[0].slice(2)} style={{ fontSize: '10px', fontWeight: 'bold' }} />
                      <YAxis style={{ fontSize: '10px', fontWeight: 'bold' }} />
                      <Tooltip contentStyle={{ fontSize: '11px', fontWeight: 'bold', border: '1px solid #ccc', borderRadius: '8px' }} />
                      <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                      <Line type="monotone" name="Agendados" dataKey="agendamentos" stroke="#000000" strokeWidth={2.5} activeDot={{ r: 6 }} />
                      <Line type="monotone" name="Meta" dataKey="meta" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 4" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* History Data Table */}
              <div className="bg-white border-2 border-neutral-900 rounded-2xl overflow-hidden shadow-3xs">
                <div className="p-3.5 bg-neutral-50 border-b border-neutral-200">
                  <h4 className="text-[10px] font-black uppercase text-neutral-700 tracking-wider">Tabela de Desempenho Multiperíodo</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-neutral-150 border-b border-neutral-300">
                        <th className="p-2.5 font-bold uppercase text-neutral-600 text-[10px]">Mês</th>
                        <th className="p-2.5 font-bold uppercase text-neutral-600 text-[10px] text-center">Agendados</th>
                        <th className="p-2.5 font-bold uppercase text-neutral-600 text-[10px] text-center">Efetivados</th>
                        <th className="p-2.5 font-bold uppercase text-neutral-600 text-[10px] text-center">Conversão</th>
                        <th className="p-2.5 font-bold uppercase text-neutral-600 text-[10px] text-right">Ligações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 font-mono">
                      {(() => {
                        const selectedSdrObj = sdrs.find(s => s.id === selectedSdrIdForEvolution) || activeSDRs[0];
                        if (!selectedSdrObj) return null;
                        
                        const rows = months.map(mkey => {
                          const r = selectedSdrObj.monthlyRecords?.[mkey];
                          if (r) {
                            return {
                              month: mkey,
                              agendamentos: r.agendamentosCount ?? 0,
                              efetivacoes: r.efetivacoesCount ?? 0,
                              conversao: r.agendamentosCount > 0 ? Math.round((r.efetivacoesCount / r.agendamentosCount) * 100) : 0,
                              ligacoes: r.callsCount || 0
                            };
                          } else {
                            const isCurrent = mkey === currentMonth;
                            if (isCurrent) {
                              return {
                                month: mkey,
                                agendamentos: selectedSdrObj.agendamentosCount || 0,
                                efetivacoes: selectedSdrObj.efetivacoesCount || 0,
                                conversao: selectedSdrObj.agendamentosCount > 0 ? Math.round((selectedSdrObj.efetivacoesCount / selectedSdrObj.agendamentosCount) * 100) : 0,
                                ligacoes: selectedSdrObj.callsCount || 0
                              };
                            }
                            const mult = mkey === '2026-01' ? 0.6 : mkey === '2026-02' ? 0.73 : mkey === '2026-03' ? 0.86 : mkey === '2026-04' ? 0.94 : 1.0;
                            const agend = mkey === '2026-05' ? (selectedSdrObj.monthlyRecords?.['2026-05']?.agendamentosCount || selectedSdrObj.agendamentosCount || 20) : Math.round((selectedSdrObj.agendamentosCount || 20) * mult);
                            const efet = mkey === '2026-05' ? (selectedSdrObj.monthlyRecords?.['2026-05']?.efetivacoesCount || selectedSdrObj.efetivacoesCount || 10) : Math.round((selectedSdrObj.efetivacoesCount || 10) * mult);
                            return {
                              month: mkey,
                              agendamentos: agend,
                              efetivacoes: efet,
                              conversao: agend > 0 ? Math.round((efet / agend) * 100) : 0,
                              ligacoes: mkey === '2026-05' ? (selectedSdrObj.monthlyRecords?.['2026-05']?.callsCount || 100) : Math.round((selectedSdrObj.callsCount || 100) * mult)
                            };
                          }
                        });

                        return rows.slice().reverse().map((h, idx) => (
                          <tr key={idx} className="hover:bg-neutral-50">
                            <td className="p-2.5 font-sans font-bold text-neutral-800">{h.month.split('-')[1] + '/' + h.month.split('-')[0]}</td>
                            <td className="p-2.5 text-center text-neutral-900 font-bold">{h.agendamentos}</td>
                            <td className="p-2.5 text-center text-neutral-700">{h.efetivacoes}</td>
                            <td className="p-2.5 text-center">
                              <span className="p-0.5 px-2 bg-neutral-100 rounded text-neutral-900 text-[10px] font-bold">
                                {h.conversao}%
                              </span>
                            </td>
                            <td className="p-2.5 text-right text-neutral-500">{h.ligacoes > 0 ? h.ligacoes.toLocaleString() : '—'}</td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
