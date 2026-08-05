import { useMemo } from 'react';
import { DateService } from '../shared/services/date.service';
import { SDR } from '../types';

export function usePredictiveRunRate(derivedSdrsForActiveMonth: SDR[], currentMonth: string) {
  // Robust, smart thermometer calculations based on Business Days
  const thermStats = useMemo(() => {
    const activeSdrsList = derivedSdrsForActiveMonth.filter(s => s.active);
    const { elapsedBusinessDays, totalBusinessDays } = DateService.getElapsedBusinessDays(currentMonth);

    // Expected monthly target percentage linear extrapolation based on workdays passed
    const expectedPercent = totalBusinessDays > 0 ? Math.round((elapsedBusinessDays / totalBusinessDays) * 100) : 0;

    // Direct deliveries calculation: AGENDAMENTOS
    const totalRealized = activeSdrsList.reduce((sum, s) => sum + (s.agendamentosCount || 0), 0);
    const totalTarget = activeSdrsList.reduce((sum, s) => sum + (s.metaAgendamentos || 20), 0);
    const realizedPercent = totalTarget > 0 ? Math.round((totalRealized / totalTarget) * 100) : 0;
    const progressGap = realizedPercent - expectedPercent;

    // Direct deliveries calculation: CONTAS ABERTAS
    const totalContasRealized = activeSdrsList.reduce((sum, s) => sum + (s.contasAbertasCount || 0), 0);
    const totalContasTarget = activeSdrsList.reduce((sum, s) => sum + (s.metaContasAbertas || 10), 0);
    const realizedContasPercent = totalContasTarget > 0 ? Math.round((totalContasRealized / totalContasTarget) * 100) : 0;

    // Direct deliveries calculation: EFETIVAÇÕES
    const totalEfetivacoesRealized = activeSdrsList.reduce((sum, s) => sum + (s.efetivacoesCount || 0), 0);
    const totalEfetivacoesTarget = activeSdrsList.reduce((sum, s) => sum + (s.metaEfetivacoes || 10), 0);
    const realizedEfetivacoesPercent = totalEfetivacoesTarget > 0 ? Math.round((totalEfetivacoesRealized / totalEfetivacoesTarget) * 100) : 0;

    // Evaluate trends automatically
    let temperature = '⚖️ EM EQUILÍBRIO';
    let labelColor = 'text-blue-700 bg-blue-50 border-blue-200';
    let barColor = 'bg-[#111]'; // Sober pitch-black active color
    
    if (realizedPercent >= 100) {
      temperature = '⚡ EXCELÊNCIA / META BATIDA';
      labelColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
      barColor = 'bg-emerald-600';
    } else if (progressGap >= 10) {
      temperature = '🔥 HIGH PERFORMANCE';
      labelColor = 'text-green-800 bg-green-50 border-green-200';
      barColor = 'bg-green-600';
    } else if (progressGap < -20) {
      temperature = '❄️ ALERTA OPERACIONAL CRÍTICO';
      labelColor = 'text-red-700 bg-red-50 border-red-200';
      barColor = 'bg-red-650';
    } else if (progressGap < 0) {
      temperature = '⚠️ ABAIXO DO RITMO ESPERADO';
      labelColor = 'text-amber-805 bg-amber-50 border-amber-204';
      barColor = 'bg-amber-600';
    } else {
      temperature = '📈 EM RITMO ADEQUADO';
      labelColor = 'text-green-700 bg-green-50 border-green-200';
      barColor = 'bg-green-600';
    }

    return {
      realizedProgress: realizedPercent,
      expectedProgress: expectedPercent,
      progressGap,
      temperature,
      labelColor,
      barColor,
      currentDaysElapsed: elapsedBusinessDays,
      totalDaysInMonth: totalBusinessDays,
      totalRealized,
      totalTarget,

      // Additional metas for Referência
      totalContasRealized,
      totalContasTarget,
      realizedContasPercent,
      totalEfetivacoesRealized,
      totalEfetivacoesTarget,
      realizedEfetivacoesPercent
    };
  }, [derivedSdrsForActiveMonth, currentMonth]);

  // Predictive Run-Rate / Forecasting logic
  const sdrPredictions = useMemo(() => {
    return derivedSdrsForActiveMonth.map(sdr => {
      // Calcular dias úteis decorridos e totais de forma proporcional para este SDR específico,
      // baseando-se em sua data de admissão e no mês que está sendo avaliado.
      const { elapsedBusinessDays: sdrElapsedDays, totalBusinessDays: sdrTotalDays } = 
        DateService.getSdrBusinessDays(sdr.admissionDate, currentMonth);

      const daysElapsed = sdrElapsedDays || 1;
      const daysTotal = sdrTotalDays || 22;

      // Metas e Realizados
      const RealAgend = sdr.agendamentosCount || 0;
      const MetaAgend = sdr.metaAgendamentos || 20;

      const RealContas = sdr.contasAbertasCount || 0;
      const MetaContas = sdr.metaContasAbertas || 10;

      const RealEfetiv = sdr.efetivacoesCount || 0;
      const MetaEfetiv = sdr.metaEfetivacoes || 10;

      // Média diária por dia útil ativo no mês
      const dailyAvg = RealAgend / daysElapsed;
      const dailyAvgContas = RealContas / daysElapsed;
      const dailyAvgEfetiv = RealEfetiv / daysElapsed;

      // Projeção de Fechamento (Run Rate)
      const forecastValue = dailyAvg * daysTotal;
      const forecastContas = dailyAvgContas * daysTotal;
      const forecastEfetiv = dailyAvgEfetiv * daysTotal;

      const forecastPercent = MetaAgend > 0 ? (forecastValue / MetaAgend) * 100 : 0;
      const forecastContasPercent = MetaContas > 0 ? (forecastContas / MetaContas) * 100 : 0;
      const forecastEfetivPercent = MetaEfetiv > 0 ? (forecastEfetiv / MetaEfetiv) * 100 : 0;

      // Tag de Status Preditivo baseado principalmente no indicador mestre (agendamento)
      let statusPreditivo: 'OUTLIER' | 'NO_CAMINHO' | 'EM_RISCO' = 'EM_RISCO';
      
      if (sdrElapsedDays === 0) {
        statusPreditivo = 'NO_CAMINHO';
      } else if (forecastValue > MetaAgend * 1.25 && RealAgend > MetaAgend * 1.25) {
        statusPreditivo = 'OUTLIER';
      } else if (forecastValue >= MetaAgend) {
        statusPreditivo = 'NO_CAMINHO';
      } else {
        statusPreditivo = 'EM_RISCO';
      }

      // Dynamic AI Action Plan based on results
      let aiActionPlan = '';
      const gapAgend = MetaAgend - forecastValue;
      const gapContas = MetaContas - forecastContas;
      const gapEfetiv = MetaEfetiv - forecastEfetiv;

      if (gapAgend <= 0 && gapContas <= 0 && gapEfetiv <= 0) {
        aiActionPlan = '🏆 PERFEITO ACORDO TÁTICO: Projeção de run-rate aponta superação global em todas as três métricas! Plano sugerido: Compartilhar pitch vencedor em reunião geral com o time, colaborar com treinamentos práticos de objeção tributária e testar nova lista segmentada de Wealth Management para aceleração adicional.';
      } else {
        const plans: string[] = [];
        if (gapAgend > 0) {
          const neededConns = Math.ceil(gapAgend * 12);
          plans.push(`Elevar taxa de agendamento: Projeção com gap de ${gapAgend.toFixed(1)} uni. Necessita de conexões extras para cobrir o desvio. Sugere-se realizar +${neededConns} novas ligações ativas nesta quinzena e focar no gancho tático de 5 segundos iniciais.`);
        }
        if (gapContas > 0) {
          plans.push(`Estabilizar Aberturas: Projeção em desalinhamento de ${gapContas.toFixed(1)} contas de investimento. Plano: Criar régua rápida de follow-up via WhatsApp em 25 minutos pós-reunião com o assessor, garantindo envio do link e suporte síncrono para saneamento de dúvidas cadastrais.`);
        }
        if (gapEfetiv > 0) {
          plans.push(`Garantir Efetivação: Gap preditivo de ${gapEfetiv.toFixed(1)} contas ativadas. Plano: Focar intensamente na qualificação prévia (leads com aporte imediato > R$ 50k) e agendar um alinhamento bilateral tático de 10 min com o assessor para preparar o foco comercial da reunião.`);
        }

        const profileText = sdr.professionalProfile === 'analitico'
          ? '📊 DIAGNÓSTICO IA (Perfil Analítico): Profissional focado em dados. Aproveite relatórios detalhados para sanear os leads frios que travam no limbo tático do funil. '
          : sdr.professionalProfile === 'operacional'
          ? '⚙️ DIAGNÓSTICO IA (Perfil Operacional): Executa o play com rigor. Forneça playbooks de conversão agressivos com ganchos de persuasão comercial rápida. '
          : sdr.professionalProfile === 'gestao'
          ? '🛡️ DIAGNÓSTICO IA (Perfil Gestão): Potencial mentor. Ideal para organizar dinâmicas bilaterais de roleplaying de objeções com os pares. '
          : '⚡ DIAGNÓSTICO IA (Perfil Comercial): Ativo e focado em chamadas. Forçar refinamento preventivo de CRM para não perder follow-ups essenciais. ';

        aiActionPlan = `${profileText}\n\nAções Corretivas Mandatórias:\n${plans.map((p, idx) => `${idx + 1}. ${p}`).join('\n')}`;
      }

      return {
        ...sdr,
        dailyAvg,
        dailyAvgContas,
        dailyAvgEfetiv,
        forecastValue,
        forecastContas,
        forecastEfetiv,
        forecastPercent,
        forecastContasPercent,
        forecastEfetivPercent,
        statusPreditivo,
        aiActionPlan
      };
    });
  }, [derivedSdrsForActiveMonth, currentMonth]);

  return {
    thermStats,
    sdrPredictions,
  };
}
