import { useMemo } from 'react';
import useAppStore from '../store/useAppStore';
import { SDR, Assessor, MatchResult } from '../types';
import { useShallow } from 'zustand/react/shallow';

export function useSDRMetrics() {
  const { sdrs, assessores, matches, currentMonth, currentUser } = useAppStore(
    useShallow((state) => ({
      sdrs: state.sdrs,
      assessores: state.assessores,
      matches: state.matches,
      currentMonth: state.currentMonth,
      currentUser: state.currentUser,
    }))
  );

  const derivedSdrsForActiveMonth = useMemo<SDR[]>(() => {
    let source = sdrs;
    if (currentUser && currentUser.role !== 'admin' && currentUser.teamName) {
      source = sdrs.filter(s => s.team === currentUser.teamName);
    }
    return source.map((sdr: SDR): SDR => {
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
  }, [sdrs, currentMonth, currentUser]);

  const activeSDRsCount = useMemo(() => {
    return derivedSdrsForActiveMonth.filter(s => s.active).length;
  }, [derivedSdrsForActiveMonth]);

  const filteredAssessores = useMemo<Assessor[]>(() => {
    if (currentUser && currentUser.role !== 'admin' && currentUser.teamName) {
      return assessores.filter(a => a.team === currentUser.teamName);
    }
    return assessores;
  }, [assessores, currentUser]);

  const activeAssessoresCount = useMemo(() => {
    return filteredAssessores.filter(a => a.active).length;
  }, [filteredAssessores]);

  const filteredMatches = useMemo<MatchResult[]>(() => {
    if (currentUser && currentUser.role !== 'admin' && currentUser.teamName) {
      const teamSdrIds = new Set(derivedSdrsForActiveMonth.map(s => s.id));
      return matches.filter(m => teamSdrIds.has(m.sdrId));
    }
    return matches;
  }, [matches, derivedSdrsForActiveMonth, currentUser]);

  return {
    derivedSdrsForActiveMonth,
    activeSDRsCount,
    filteredAssessores,
    activeAssessoresCount,
    filteredMatches,
    currentMonth,
    currentUser,
  };
}
