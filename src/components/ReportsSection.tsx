import React, { useState, useMemo } from 'react';
import { SDR } from '../types';
import { 
  Download, Calendar, PhoneCall, Users, CheckCircle2, TrendingUp, 
  UserPlus, UserMinus, FileText, Briefcase
} from 'lucide-react';
import { DateService } from '../shared/services/date.service';
import { useAppStore } from '../store/useAppStore';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface ReportsSectionProps {
  sdrs: SDR[];
  startDate: string;
  endDate: string;
  currentMonth: string;
}

export default function ReportsSection({
  sdrs: rawSdrs,
  startDate,
  endDate,
  currentMonth,
}: ReportsSectionProps) {
  // Configuração de Filtros de Período
  const [startDateFilter, setStartDateFilter] = useState<string>(startDate || '2026-06-01');
  const [endDateFilter, setEndDateFilter] = useState<string>(endDate || '2026-06-30');
  const [isPrinting, setIsPrinting] = useState(false);

  // SDRs Ativos para as tabelas individuais
  const activeSDRs = rawSdrs.filter(s => s.active);

  // Manipulador de Atalhos de Período
  const handlePresetChange = (preset: 'este-mes' | '30-dias' | 'geral') => {
    const [yearStr, monthStr] = (currentMonth || '2026-06').split('-');
    const year = parseInt(yearStr) || 2026;
    const month = parseInt(monthStr) || 6;

    if (preset === 'este-mes') {
      const start = `${yearStr}-${monthStr}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const end = `${yearStr}-${monthStr}-${String(lastDay).padStart(2, '0')}`;
      setStartDateFilter(start);
      setEndDateFilter(end);
    } else if (preset === '30-dias') {
      const lastDay = new Date(year, month, 0).getDate();
      const end = `${yearStr}-${monthStr}-${String(lastDay).padStart(2, '0')}`;
      const prevDate = new Date(year, month - 1, lastDay - 30);
      setStartDateFilter(prevDate.toISOString().substring(0, 10));
      setEndDateFilter(end);
    } else if (preset === 'geral') {
      setStartDateFilter('2026-01-01');
      setEndDateFilter('2026-12-31');
    }
  };

  // Cálculo individual para cada SDR baseado no período selecionado
  const sdrFilteredStatsMap = useMemo(() => {
    const stats: Record<string, {
      agendamentos: number;
      efetivacoes: number;
      ligacoes: number;
      contasAbertas: number;
    }> = {};

    rawSdrs.forEach(s => {
      const startD = new Date(startDateFilter);
      const endD = new Date(endDateFilter);
      
      let totalAgendamentos = 0;
      let totalEfetivacoes = 0;
      let totalLigacoes = 0;
      let totalContasAbertas = 0;
      
      const startYear = startD.getFullYear();
      const startMonth = startD.getMonth(); 
      const endYear = endD.getFullYear();
      const endMonth = endD.getMonth();
      
      const numMonths = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
      
      for (let i = 0; i < numMonths; i++) {
        const curYear = startYear + Math.floor((startMonth + i) / 12);
        const curMonthIdx = (startMonth + i) % 12;
        const monthKey = `${curYear}-${String(curMonthIdx + 1).padStart(2, '0')}`;
        
        const firstDayOfMonth = new Date(curYear, curMonthIdx, 1);
        const lastDayOfMonth = new Date(curYear, curMonthIdx + 1, 0);
        
        const overlapStart = new Date(Math.max(startD.getTime(), firstDayOfMonth.getTime()));
        const overlapEnd = new Date(Math.min(endD.getTime(), lastDayOfMonth.getTime()));
        
        if (overlapStart <= overlapEnd) {
          const overlapDays = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          const totalMonthDays = lastDayOfMonth.getDate();
          const fraction = overlapDays / totalMonthDays;
          
          let mAgendamentos = 0;
          let mEfetivacoes = 0;
          let mLigacoes = 0;
          let mContas = 0;
          
          if (monthKey === currentMonth) {
            mAgendamentos = s.agendamentosCount || 0;
            mEfetivacoes = s.efetivacoesCount || 0;
            mLigacoes = s.callsCount || 0;
            mContas = s.contasAbertasCount || 0;
          } else {
            const record = s.monthlyRecords?.[monthKey];
            if (record) {
              mAgendamentos = record.agendamentosCount || 0;
              mEfetivacoes = record.efetivacoesCount || 0;
              mLigacoes = record.callsCount || 0;
              mContas = record.contasAbertasCount || 0;
            }
          }
          
          totalAgendamentos += mAgendamentos * fraction;
          totalEfetivacoes += mEfetivacoes * fraction;
          totalLigacoes += mLigacoes * fraction;
          totalContasAbertas += mContas * fraction;
        }
      }

      stats[s.id] = {
        agendamentos: Math.round(totalAgendamentos),
        efetivacoes: Math.round(totalEfetivacoes),
        ligacoes: Math.round(totalLigacoes),
        contasAbertas: Math.round(totalContasAbertas),
      };
    });

    return stats;
  }, [rawSdrs, startDateFilter, endDateFilter, currentMonth]);

  // Cálculos Globais (Totais)
  const totalSDRs = activeSDRs.length;
  
  const entradasSaidas = useMemo(() => {
    const admitidos = rawSdrs.filter(s => s.admissionDate && s.admissionDate >= startDateFilter && s.admissionDate <= endDateFilter).length;
    const inativos = rawSdrs.filter(s => !s.active).length; // simplificação de inativos
    return { admitidos, inativos };
  }, [rawSdrs, startDateFilter, endDateFilter]);

  const globalStats = useMemo(() => {
    return activeSDRs.reduce((acc, s) => {
      const st = sdrFilteredStatsMap[s.id];
      return {
        ligacoes: acc.ligacoes + (st?.ligacoes || 0),
        agendamentos: acc.agendamentos + (st?.agendamentos || 0),
        efetivacoes: acc.efetivacoes + (st?.efetivacoes || 0),
        contasAbertas: acc.contasAbertas + (st?.contasAbertas || 0),
      };
    }, { ligacoes: 0, agendamentos: 0, efetivacoes: 0, contasAbertas: 0 });
  }, [activeSDRs, sdrFilteredStatsMap]);

  const taxaConversaoGeral = globalStats.agendamentos > 0 
    ? Math.round((globalStats.efetivacoes / globalStats.agendamentos) * 100) 
    : 0;

  const formatDateVal = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  // Exportação para PDF
  const handlePrintPdf = async () => {
    setIsPrinting(true);
    try {
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'fixed';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '800px';
      tempContainer.style.backgroundColor = '#FFFFFF';
      tempContainer.style.color = '#000000';
      tempContainer.style.padding = '40px';
      tempContainer.style.fontFamily = "'Inter', sans-serif";

      let html = `
        <div style="font-family: inherit; width: 100%; box-sizing: border-box; color: #000;">
          
          <div style="border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 25px;">
            <h1 style="font-size: 24px; font-weight: 900; margin: 0; text-transform: uppercase;">
              Relatório de Desempenho Comercial
            </h1>
            <p style="font-size: 12px; margin: 5px 0 0 0; font-weight: bold;">
              Período: ${formatDateVal(startDateFilter)} a ${formatDateVal(endDateFilter)}
            </p>
          </div>

          <h2 style="font-size: 14px; font-weight: 800; text-transform: uppercase; margin-bottom: 15px;">Métricas Globais (Totais)</h2>
          
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px;">
            <div style="border: 1px solid #000; padding: 15px;">
              <div style="font-size: 10px; font-weight: bold; text-transform: uppercase;">Total de Ligações</div>
              <div style="font-size: 20px; font-weight: 900;">${globalStats.ligacoes}</div>
            </div>
            <div style="border: 1px solid #000; padding: 15px;">
              <div style="font-size: 10px; font-weight: bold; text-transform: uppercase;">Agendamentos</div>
              <div style="font-size: 20px; font-weight: 900;">${globalStats.agendamentos}</div>
            </div>
            <div style="border: 1px solid #000; padding: 15px;">
              <div style="font-size: 10px; font-weight: bold; text-transform: uppercase;">Efetivações</div>
              <div style="font-size: 20px; font-weight: 900;">${globalStats.efetivacoes}</div>
            </div>
            <div style="border: 1px solid #000; padding: 15px;">
              <div style="font-size: 10px; font-weight: bold; text-transform: uppercase;">Contas Abertas</div>
              <div style="font-size: 20px; font-weight: 900;">${globalStats.contasAbertas}</div>
            </div>
            <div style="border: 1px solid #000; padding: 15px;">
              <div style="font-size: 10px; font-weight: bold; text-transform: uppercase;">Conversão do Funil</div>
              <div style="font-size: 20px; font-weight: 900;">${taxaConversaoGeral}%</div>
            </div>
            <div style="border: 1px solid #000; padding: 15px;">
              <div style="font-size: 10px; font-weight: bold; text-transform: uppercase;">SDRs Ativos</div>
              <div style="font-size: 20px; font-weight: 900;">${totalSDRs}</div>
              <div style="font-size: 10px; margin-top: 5px;">+${entradasSaidas.admitidos} Entradas | -${entradasSaidas.inativos} Saídas</div>
            </div>
          </div>

          <h2 style="font-size: 14px; font-weight: 800; text-transform: uppercase; margin-bottom: 10px;">Desempenho Individual</h2>
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 11px;">
            <thead>
              <tr style="border-bottom: 2px solid #000;">
                <th style="padding: 10px 5px; font-weight: bold; text-transform: uppercase;">Nome do SDR</th>
                <th style="padding: 10px 5px; font-weight: bold; text-transform: uppercase; text-align: center;">Ligações</th>
                <th style="padding: 10px 5px; font-weight: bold; text-transform: uppercase; text-align: center;">Agendamentos</th>
                <th style="padding: 10px 5px; font-weight: bold; text-transform: uppercase; text-align: center;">Efetivações</th>
                <th style="padding: 10px 5px; font-weight: bold; text-transform: uppercase; text-align: center;">Contas</th>
                <th style="padding: 10px 5px; font-weight: bold; text-transform: uppercase; text-align: right;">Conversão</th>
              </tr>
            </thead>
            <tbody>
      `;

      activeSDRs.forEach(sdr => {
        const st = sdrFilteredStatsMap[sdr.id];
        const conversao = st.agendamentos > 0 ? Math.round((st.efetivacoes / st.agendamentos) * 100) : 0;
        html += `
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 8px 5px; font-weight: bold;">${sdr.name}</td>
            <td style="padding: 8px 5px; text-align: center;">${st.ligacoes}</td>
            <td style="padding: 8px 5px; text-align: center;">${st.agendamentos}</td>
            <td style="padding: 8px 5px; text-align: center;">${st.efetivacoes}</td>
            <td style="padding: 8px 5px; text-align: center;">${st.contasAbertas}</td>
            <td style="padding: 8px 5px; text-align: right; font-weight: bold;">${conversao}%</td>
          </tr>
        `;
      });

      html += `
            </tbody>
          </table>
          <div style="margin-top: 30px; font-size: 9px; text-transform: uppercase; text-align: center; color: #000;">
            Gerado via Hub Liderança Comercial • ${new Date().toLocaleString('pt-BR')}
          </div>
        </div>
      `;

      tempContainer.innerHTML = html;
      document.body.appendChild(tempContainer);

      await new Promise(resolve => setTimeout(resolve, 200));

      const canvas = await html2canvas(tempContainer, { scale: 2, useCORS: true, backgroundColor: '#FFFFFF' });
      document.body.removeChild(tempContainer);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Relatorio_Desempenho_${Date.now()}.pdf`);
    } catch (error) {
      console.error("Erro na exportação:", error);
      alert("Houve um erro ao gerar o PDF. Verifique o console.");
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="bg-[#FAFAFA] min-h-screen text-black font-sans p-2 space-y-6 animate-fade-in">
      
      {/* HEADER & EXPORT BUTTON */}
      <div className="bg-white border-2 border-black p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-black flex items-center gap-2">
            <FileText className="w-6 h-6" /> Relatório de Desempenho
          </h1>
          <p className="text-sm font-medium text-black mt-1">
            Métricas operacionais e funil de conversão baseadas no período selecionado.
          </p>
        </div>
        <button
          onClick={handlePrintPdf}
          disabled={isPrinting}
          className="bg-black text-white px-5 py-2.5 font-bold uppercase tracking-wider text-xs flex items-center gap-2 hover:bg-neutral-800 transition-colors cursor-pointer border-2 border-black disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {isPrinting ? 'Gerando...' : 'Baixar Relatório PDF'}
        </button>
      </div>

      {/* FILTROS DE PERÍODO */}
      <div className="bg-white border-2 border-black p-6 space-y-4">
        <h2 className="text-sm font-black uppercase tracking-wider border-b-2 border-black pb-2 flex items-center gap-2">
          <Calendar className="w-4 h-4" /> Escolha o Período
        </h2>
        
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="w-full sm:w-auto">
            <label className="block text-[10px] font-black uppercase tracking-wider mb-1">Data Inicial</label>
            <input
              type="date"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              className="w-full p-2.5 border-2 border-black bg-[#FAFAFA] font-bold focus:outline-none"
            />
          </div>
          <div className="w-full sm:w-auto">
            <label className="block text-[10px] font-black uppercase tracking-wider mb-1">Data Final</label>
            <input
              type="date"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              className="w-full p-2.5 border-2 border-black bg-[#FAFAFA] font-bold focus:outline-none"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto pb-0.5 overflow-x-auto">
            <button onClick={() => handlePresetChange('este-mes')} className="px-4 py-2.5 border-2 border-black bg-[#FAFAFA] hover:bg-black hover:text-white transition-colors text-[10px] font-black uppercase tracking-wider whitespace-nowrap cursor-pointer">
              Este Mês
            </button>
            <button onClick={() => handlePresetChange('30-dias')} className="px-4 py-2.5 border-2 border-black bg-[#FAFAFA] hover:bg-black hover:text-white transition-colors text-[10px] font-black uppercase tracking-wider whitespace-nowrap cursor-pointer">
              30 Dias
            </button>
            <button onClick={() => handlePresetChange('geral')} className="px-4 py-2.5 border-2 border-black bg-[#FAFAFA] hover:bg-black hover:text-white transition-colors text-[10px] font-black uppercase tracking-wider whitespace-nowrap cursor-pointer">
              Tudo
            </button>
          </div>
        </div>
      </div>

      {/* MÉTRICAS GLOBAIS (TOTAIS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Ligações */}
        <div className="bg-white border-2 border-black p-5 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-black text-[10px] font-black uppercase tracking-widest">
            <PhoneCall className="w-4 h-4" /> Total de Ligações
          </div>
          <div className="text-4xl font-black mt-3">{globalStats.ligacoes}</div>
        </div>

        {/* Total de Agendamentos */}
        <div className="bg-white border-2 border-black p-5 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-black text-[10px] font-black uppercase tracking-widest">
            <Calendar className="w-4 h-4" /> Total Agendamentos
          </div>
          <div className="text-4xl font-black mt-3">{globalStats.agendamentos}</div>
        </div>

        {/* Total de Efetivações */}
        <div className="bg-white border-2 border-black p-5 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-black text-[10px] font-black uppercase tracking-widest">
            <CheckCircle2 className="w-4 h-4" /> Total Efetivações
          </div>
          <div className="text-4xl font-black mt-3">{globalStats.efetivacoes}</div>
        </div>

        {/* Total de Contas Abertas */}
        <div className="bg-white border-2 border-black p-5 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-black text-[10px] font-black uppercase tracking-widest">
            <Briefcase className="w-4 h-4" /> Contas Abertas
          </div>
          <div className="text-4xl font-black mt-3">{globalStats.contasAbertas}</div>
        </div>

        {/* SDRs e Entradas/Saídas */}
        <div className="bg-white border-2 border-black p-5 flex flex-col justify-between lg:col-span-2">
          <div className="flex items-center gap-2 text-black text-[10px] font-black uppercase tracking-widest">
            <Users className="w-4 h-4" /> Quadro de SDRs Ativos
          </div>
          <div className="flex items-end justify-between mt-3">
            <div className="text-4xl font-black">{totalSDRs} <span className="text-sm font-bold uppercase">Membros</span></div>
            <div className="text-right">
              <div className="text-xs font-bold flex items-center justify-end gap-1"><UserPlus className="w-3 h-3" /> +{entradasSaidas.admitidos} Entradas</div>
              <div className="text-xs font-bold flex items-center justify-end gap-1 mt-1"><UserMinus className="w-3 h-3" /> -{entradasSaidas.inativos} Saídas</div>
            </div>
          </div>
        </div>

        {/* Taxa de Conversão */}
        <div className="bg-white border-2 border-black p-5 flex flex-col justify-between lg:col-span-2">
          <div className="flex items-center gap-2 text-black text-[10px] font-black uppercase tracking-widest">
            <TrendingUp className="w-4 h-4" /> Desempenho / Conversão do Funil
          </div>
          <div className="flex items-end justify-between mt-3">
            <div className="text-4xl font-black">{taxaConversaoGeral}%</div>
            <div className="text-xs font-bold uppercase text-right max-w-[120px]">
              (Efetivações / Agendamentos)
            </div>
          </div>
        </div>
      </div>

      {/* TABELA INDIVIDUAL DE SDRS */}
      <div className="bg-white border-2 border-black overflow-hidden">
        <div className="bg-black p-4 text-white">
          <h2 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4" /> Desempenho Individual
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#FAFAFA] border-b-2 border-black">
              <tr>
                <th className="p-4 text-xs font-black uppercase tracking-wider text-black">Nome do SDR</th>
                <th className="p-4 text-xs font-black uppercase tracking-wider text-black text-center">Ligações</th>
                <th className="p-4 text-xs font-black uppercase tracking-wider text-black text-center">Agendamentos</th>
                <th className="p-4 text-xs font-black uppercase tracking-wider text-black text-center">Efetivações</th>
                <th className="p-4 text-xs font-black uppercase tracking-wider text-black text-center">Contas</th>
                <th className="p-4 text-xs font-black uppercase tracking-wider text-black text-right">Conversão</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-[#FAFAFA]">
              {activeSDRs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center font-bold text-black uppercase text-sm">
                    Nenhum SDR ativo encontrado.
                  </td>
                </tr>
              ) : (
                activeSDRs.map((sdr) => {
                  const st = sdrFilteredStatsMap[sdr.id];
                  const conversao = st.agendamentos > 0 ? Math.round((st.efetivacoes / st.agendamentos) * 100) : 0;
                  
                  return (
                    <tr key={sdr.id} className="hover:bg-[#F0F0F0] transition-colors">
                      <td className="p-4 font-black text-black">{sdr.name}</td>
                      <td className="p-4 text-center font-bold text-black">{st.ligacoes}</td>
                      <td className="p-4 text-center font-bold text-black">{st.agendamentos}</td>
                      <td className="p-4 text-center font-bold text-black">{st.efetivacoes}</td>
                      <td className="p-4 text-center font-bold text-black">{st.contasAbertas}</td>
                      <td className="p-4 text-right font-black text-black">{conversao}%</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
