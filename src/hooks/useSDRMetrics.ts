import { useMemo } from 'react';
import useAppStore from '../store/useAppStore';
import { SDR, Assessor, MatchResult } from '../types';
import { useShallow } from 'zustand/react/shallow';
import { getFilteredMembers } from '../utils/teamFilters';

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

  const { sdrs: filteredSdrs, assessores: filteredAssessores, matches: filteredMatches } = useMemo(() => {
    return getFilteredMembers(currentUser, sdrs, assessores, matches);
  }, [currentUser, sdrs, assessores, matches]);

  const derivedSdrsForActiveMonth = useMemo<SDR[]>(() => {
    return filteredSdrs.filter(s => {
      if (s.promotedToAssessor) return false;
      // Exclude if admission month is after the current active month
      if (s.admissionDate && currentMonth < s.admissionDate.substring(0, 7)) {
        return false;
      }
      return true;
    }).map((sdr: SDR): SDR => {
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
  }, [filteredSdrs, currentMonth]);

  const derivedAssessoresForActiveMonth = useMemo<Assessor[]>(() => {
    return filteredAssessores.filter(a => {
      // Exclude if admission month is after the current active month
      if (a.admissionDate && currentMonth < a.admissionDate.substring(0, 7)) {
        return false;
      }
      return true;
    });
  }, [filteredAssessores, currentMonth]);

  const activeSDRsCount = useMemo(() => {
    return derivedSdrsForActiveMonth.filter(s => s.active).length;
  }, [derivedSdrsForActiveMonth]);

  const activeAssessoresCount = useMemo(() => {
    return derivedAssessoresForActiveMonth.filter(a => a.active).length;
  }, [derivedAssessoresForActiveMonth]);

  return {
    derivedSdrsForActiveMonth,
    activeSDRsCount,
    filteredAssessores: derivedAssessoresForActiveMonth,
    activeAssessoresCount,
    filteredMatches,
    currentMonth,
    currentUser,
  };
}
