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

    // Direct deliveries calculation
    const totalRealized = activeSdrsList.reduce((sum, s) => sum + (s.agendamentosCount || 0), 0);
    const totalTarget = activeSdrsList.reduce((sum, s) => sum + (s.metaAgendamentos || 20), 0);

    const realizedPercent = totalTarget > 0 ? Math.round((totalRealized / totalTarget) * 100) : 0;
    const progressGap = realizedPercent - expectedPercent;

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
      totalTarget
    };
  }, [derivedSdrsForActiveMonth, currentMonth]);

  // Predictive Run-Rate / Forecasting logic
  const sdrPredictions = useMemo(() => {
    return derivedSdrsForActiveMonth.map(sdr => {
      // Calcular dias úteis decorridos e totais de forma proporcional para este SDR específico,
      // baseando-se em sua data de admissão e no mês que está sendo avaliado.
      const { elapsedBusinessDays: sdrElapsedDays, totalBusinessDays: sdrTotalDays } = 
        DateService.getSdrBusinessDays(sdr.admissionDate, currentMonth);

      const realizado = sdr.agendamentosCount || 0;
      const meta = sdr.metaAgendamentos || 20;

      // Média de agendamento por dia útil considerando apenas o período em que este SDR esteve ativo no mês
      const dailyAvg = sdrElapsedDays > 0 ? (realizado / sdrElapsedDays) : 0;

      // Projeção de Fechamento (Run Rate): média diária anterior multiplicada pelo total de dias de atividade do SDR neste mês
      const forecastValue = sdrElapsedDays > 0 ? (dailyAvg * sdrTotalDays) : 0;
      const forecastPercent = meta > 0 ? (forecastValue / meta) * 100 : 0;

      // Tag de Status do Fechamento
      let statusPreditivo: 'OUTLIER' | 'NO_CAMINHO' | 'EM_RISCO' = 'EM_RISCO';
      
      if (sdrElapsedDays === 0) {
        // Se ainda não iniciou ou não teve dias úteis decorridos de atividade neste mês, assume "NO_CAMINHO" por segurança
        statusPreditivo = 'NO_CAMINHO';
      } else if (forecastValue > meta * 1.25 && realizado > meta * 1.25) {
        statusPreditivo = 'OUTLIER';
      } else if (forecastValue >= meta) {
        statusPreditivo = 'NO_CAMINHO';
      } else {
        statusPreditivo = 'EM_RISCO';
      }

      return {
        ...sdr,
        dailyAvg,
        forecastValue,
        forecastPercent,
        statusPreditivo
      };
    });
  }, [derivedSdrsForActiveMonth, currentMonth]);

  return {
    thermStats,
    sdrPredictions,
  };
}
