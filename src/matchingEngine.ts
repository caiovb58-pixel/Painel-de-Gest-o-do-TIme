import { SDR, Assessor, MatchResult } from './types';

/**
 * Calculates a weighted performance score for SDRs where:
 * - Conversion Rate of Scheduled to Executed (Agendado para Efetivado) is highest (60% weight)
 * - Scheduled Volume is medium (25% weight)
 * - Opened Accounts is low (10% weight)
 * - Total Calls/Ligações is the lowest relevance (5% weight)
 */
export function calculateSDRPerformanceScore(sdr: SDR): number {
  const conversionRate = sdr.agendamentosCount > 0 ? (sdr.efetivacoesCount / sdr.agendamentosCount) : 0;
  const conversionScore = Math.min(1.0, conversionRate) * 100; // 0 to 100

  const metaAgend = sdr.metaAgendamentos || 20;
  const agendScore = Math.min(1.5, sdr.agendamentosCount / metaAgend) * 100; // 0 to 150

  const metaContas = sdr.metaContasAbertas || 5;
  const contasScore = Math.min(1.5, (sdr.contasAbertasCount || 0) / metaContas) * 100; // 0 to 150

  const calls = sdr.callsCount || 0;
  const callsScore = Math.min(1.5, calls / 200) * 100; // 0 to 150

  // 60% Conversion Rate, 25% Booked Volume, 10% Opened Accounts, 5% Calls
  return (conversionScore * 0.60) + (agendScore * 0.25) + (contasScore * 0.10) + (callsScore * 0.05);
}

/**
 * Distribui os assessores ativos de forma equilibrada (round-robin)
 * entre os SDRs ativos, ordenando os SDRs pela pontuação de performance ponderada.
 */
export function generateMatches(
  sdrs: SDR[],
  assessores: Assessor[],
  shuffle: boolean = false
): MatchResult[] {
  const activeSDRs = sdrs.filter(s => s.active);
  
  // Helper to extract exclusive SDR IDs for an assessor safely
  const getExclusiveSdrIds = (a: Assessor): string[] => {
    const ids: string[] = [];
    if (a.exclusiveSdrId) ids.push(a.exclusiveSdrId);
    if (a.exclusiveSdrIds && Array.isArray(a.exclusiveSdrIds)) {
      a.exclusiveSdrIds.forEach(id => {
        if (id && !ids.includes(id)) {
          ids.push(id);
        }
      });
    }
    return ids;
  };

  // Determine active exclusive assessores
  const activeExclusiveAssessores = assessores.filter(a => {
    if (!a.active) return false;
    return getExclusiveSdrIds(a).length > 0;
  });

  // Assessores ativos que participam do rodízio do mês atual (conforme nova regra de negócio)
  let activeRotationAssessores = assessores.filter(
    a => a.active && (a.participatesInRotation !== false)
  );

  if (shuffle) {
    activeRotationAssessores = [...activeRotationAssessores].sort(() => Math.random() - 0.5);
  }

  // Todos os SDRs ativos participam do rodízio
  const activeRotationSDRs = activeSDRs;

  const results: MatchResult[] = [];

  // 1. Distribuição Round-Robin baseada em Pontuação Ponderada
  if (activeRotationSDRs.length > 0 && activeRotationAssessores.length > 0) {
    // Ordena os SDRs da rotação por Weighted Performance Score (descendente)
    const sortedSDRs = [...activeRotationSDRs].sort((a, b) => {
      return calculateSDRPerformanceScore(b) - calculateSDRPerformanceScore(a);
    });

    if (activeRotationAssessores.length >= sortedSDRs.length) {
      activeRotationAssessores.forEach((assessor, index) => {
        const sdr = sortedSDRs[index % sortedSDRs.length];
        const rate = sdr.agendamentosCount > 0 
          ? Math.round((sdr.efetivacoesCount / sdr.agendamentosCount) * 100) 
          : 0;

        results.push({
          sdrId: sdr.id,
          sdrName: sdr.name,
          sdrConversionRate: rate,
          assessorId: assessor.id,
          assessorName: assessor.name,
          isExclusive: false
        });
      });
    } else {
      // Se há mais SDRs do que assessores livres, distribuímos os assessores para garantir que cada SDR tenha pelo menos um parceiro
      sortedSDRs.forEach((sdr, index) => {
        const assessor = activeRotationAssessores[index % activeRotationAssessores.length];
        const rate = sdr.agendamentosCount > 0 
          ? Math.round((sdr.efetivacoesCount / sdr.agendamentosCount) * 100) 
          : 0;

        results.push({
          sdrId: sdr.id,
          sdrName: sdr.name,
          sdrConversionRate: rate,
          assessorId: assessor.id,
          assessorName: assessor.name,
          isExclusive: false
        });
      });
    }
  }

  // 2. Anexa assessores exclusivos de SDRs ativos de forma estática
  // Garante que não duplique se já tiver um par idêntico gerado (marcando isExclusive = true)
  activeExclusiveAssessores.forEach(assessor => {
    const sdrIds = getExclusiveSdrIds(assessor);
    sdrIds.forEach(sdrId => {
      const sdr = sdrs.find(s => s.id === sdrId);
      if (sdr && sdr.active) {
        const rate = sdr.agendamentosCount > 0
          ? Math.round((sdr.efetivacoesCount / sdr.agendamentosCount) * 100)
          : 0;
        
        const existsId = results.findIndex(r => r.sdrId === sdr.id && r.assessorId === assessor.id);
        if (existsId === -1) {
          results.push({
            sdrId: sdr.id,
            sdrName: sdr.name,
            sdrConversionRate: rate,
            assessorId: assessor.id,
            assessorName: assessor.name,
            isExclusive: true
          });
        } else {
          results[existsId].isExclusive = true;
        }
      }
    });
  });

  return results;
}
