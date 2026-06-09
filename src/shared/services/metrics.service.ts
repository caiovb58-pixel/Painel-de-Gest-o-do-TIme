import { SDR, TeamGoals } from '../types';

export interface SDRPerformanceMetrics {
  clonedSdr: SDR;
  conversionRate: number; // % of appointments turned into sales
  weeklyPace: number; // weekly average appointments
  pacingTrend: 'EXCELENTE RITMO' | 'A CAMINHO' | 'ABAIXO DO ESPERADO' | 'ALERTA CRÍTICO' | 'META BATIDA';
  trendIndicatorColor: string;
  pacingTrendColor: string;
  monthlyProjection: number; // projected appointments at month's end
  expectedPaceToday: number; // linear targeted appointments as of today
  gapToMeta: number; // absolute appointments left
  callsPerScheduled: number; // dynamic phone calls per scheduled meeting ratio
  actualEfficiency: number; // scheduled conversion / calls rating
  dailyAverage: number;
}

export interface TeamPerformanceSummary {
  teamName: string;
  sdrsCount: number;
  totalAgendamentos: number;
  totalEfetivacoes: number;
  totalContasAbertas: number;
  totalCalls: number;
  averageConversionRate: number;
  averageEfficiency: number;
  achievementPercentage: number;
}

export const MetricsService = {
  /**
   * Calculate conversion rate securely
   */
  getConversionRate(efetivacoes: number, agendamentos: number): number {
    if (agendamentos <= 0) return 0;
    return Math.round((efetivacoes / agendamentos) * 100);
  },

  /**
   * Calculate dynamic calls per ticket/appointment
   */
  getCallsPerAppointment(calls: number, agendamentos: number): number {
    if (agendamentos <= 0) return 0;
    return parseFloat((calls / agendamentos).toFixed(1));
  },

  /**
   * Calculate full list of performance metrics for an SDR
   */
  calculateSDRPerformance(
    sdr: SDR, 
    elapsedDays: number, 
    totalDays: number
  ): SDRPerformanceMetrics {
    const agendamentos = sdr.agendamentosCount || 0;
    const efetivacoes = sdr.efetivacoesCount || 0;
    const calls = sdr.callsCount || 0;
    const metaSales = sdr.metaAgendamentos || 20;

    // Standard conversion
    const conversionRate = this.getConversionRate(efetivacoes, agendamentos);
    const callsPerScheduled = this.getCallsPerAppointment(calls, agendamentos);
    
    // Daily velocity
    const dailyAverage = elapsedDays > 0 ? parseFloat((agendamentos / elapsedDays).toFixed(2)) : 0;
    const weeklyPace = parseFloat((dailyAverage * 7).toFixed(1));
    
    // Monthly Projection based on daily velocity
    const monthlyProjection = Math.round(dailyAverage * totalDays);
    
    // Core Linear Goal Gap
    const pctElapsed = totalDays > 0 ? (elapsedDays / totalDays) : 0;
    const expectedPaceToday = Math.round(metaSales * pctElapsed);
    const gapToMeta = Math.max(0, metaSales - agendamentos);

    // Dynamic rating evaluation
    let pacingTrend: SDRPerformanceMetrics['pacingTrend'] = 'A CAMINHO';
    let trendIndicatorColor = 'bg-yellow-500';
    let pacingTrendColor = 'text-yellow-600';

    if (agendamentos >= metaSales) {
      pacingTrend = 'META BATIDA';
      trendIndicatorColor = 'bg-emerald-500';
      pacingTrendColor = 'text-emerald-600 bg-emerald-50 border-emerald-200';
    } else if (agendamentos >= expectedPaceToday + 2) {
      pacingTrend = 'EXCELENTE RITMO';
      trendIndicatorColor = 'bg-green-600';
      pacingTrendColor = 'text-green-800 bg-green-50 border-green-200';
    } else if (monthlyProjection >= metaSales) {
      pacingTrend = 'A CAMINHO';
      trendIndicatorColor = 'bg-blue-500';
      pacingTrendColor = 'text-blue-700 bg-blue-50 border-blue-200';
    } else if (agendamentos < expectedPaceToday - 5) {
      pacingTrend = 'ALERTA CRÍTICO';
      trendIndicatorColor = 'bg-red-600';
      pacingTrendColor = 'text-red-700 bg-red-50 border-red-200';
    } else {
      pacingTrend = 'ABAIXO DO ESPERADO';
      trendIndicatorColor = 'bg-amber-500';
      pacingTrendColor = 'text-amber-800 bg-amber-50 border-amber-200';
    }

    const actualEfficiency = calls > 0 ? Math.round((agendamentos / calls) * 1000) / 10 : 0;

    return {
      clonedSdr: sdr,
      conversionRate,
      weeklyPace,
      pacingTrend,
      trendIndicatorColor,
      pacingTrendColor,
      monthlyProjection,
      expectedPaceToday,
      gapToMeta,
      callsPerScheduled,
      actualEfficiency,
      dailyAverage
    };
  },

  /**
   * Performance aggregate by team (Alpha, Beta, Delta...)
   */
  calculateTeamSummary(
    teamName: string, 
    teamSdrs: SDR[],
    elapsedDays: number,
    totalDays: number
  ): TeamPerformanceSummary {
    const sdrsCount = teamSdrs.length;
    let totalAgendamentos = 0;
    let totalEfetivacoes = 0;
    let totalContasAbertas = 0;
    let totalCalls = 0;
    let sumConversion = 0;
    let sumEfficiency = 0;
    let totalGoal = 0;

    teamSdrs.forEach(sdr => {
      totalAgendamentos += sdr.agendamentosCount || 0;
      totalEfetivacoes += sdr.efetivacoesCount || 0;
      totalContasAbertas += sdr.contasAbertasCount || 0;
      totalCalls += sdr.callsCount || 0;
      totalGoal += sdr.metaAgendamentos || 20;

      const conv = this.getConversionRate(sdr.efetivacoesCount || 0, sdr.agendamentosCount || 0);
      sumConversion += conv;

      const eff = (sdr.callsCount || 0) > 0 ? ((sdr.agendamentosCount || 0) / (sdr.callsCount || 1)) * 100 : 0;
      sumEfficiency += eff;
    });

    const averageConversionRate = sdrsCount > 0 ? Math.round(sumConversion / sdrsCount) : 0;
    const averageEfficiency = sdrsCount > 0 ? parseFloat((sumEfficiency / sdrsCount).toFixed(1)) : 0;
    const achievementPercentage = totalGoal > 0 ? Math.round((totalAgendamentos / totalGoal) * 100) : 0;

    return {
      teamName,
      sdrsCount,
      totalAgendamentos,
      totalEfetivacoes,
      totalContasAbertas,
      totalCalls,
      averageConversionRate,
      averageEfficiency,
      achievementPercentage
    };
  }
};
