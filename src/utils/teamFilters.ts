import { SDR, Assessor, MatchResult, AuthUser, PerformanceGoal } from '../types';

export function getTeamKey(teamName: string = ''): string {
  const normalized = teamName.toUpperCase().trim();
  if (normalized.includes('PF') || normalized.includes('CAIO') || normalized.includes('BICALHO')) return 'PF';
  if (normalized.includes('PJ') || normalized.includes('EMPRESA')) return 'PJ';
  if (normalized.includes('ADVISOR') || normalized.includes('DELTA') || normalized.includes('MESA')) return 'Advisor';
  return 'PF';
}

export function isMemberOfLeaderTeam(leaderTeam: string, memberTeam: string): boolean {
  if (!leaderTeam || !memberTeam) return false;
  const ltKey = getTeamKey(leaderTeam);
  const mtKey = getTeamKey(memberTeam);
  return ltKey === mtKey;
}

export function getFilteredMembers(
  currentUser: AuthUser | null,
  sdrs: SDR[],
  assessores: Assessor[],
  matches: MatchResult[] = []
) {
  if (!currentUser) {
    return { sdrs: [], assessores: [], matches: [] };
  }

  // Admin can see everything
  if (currentUser.role === 'admin' || currentUser.name.toLowerCase() === 'caio') {
    return { sdrs, assessores, matches };
  }

  // Current user is a leader
  const leaderTeam = currentUser.teamName || currentUser.equipe || '';
  const leaderId = currentUser.id;

  // 1. Filter SDRs
  const filteredSdrs = sdrs.filter(sdr => {
    const sdrTeam = sdr.team || sdr.equipe || '';
    
    // Check team match using our robust logic first to prevent cross-talk
    if (isMemberOfLeaderTeam(leaderTeam, sdrTeam)) {
      return true;
    }
    
    // Fallback to explicit ID link only if teams don't conflict or if member has no team
    if (!sdrTeam && leaderId && (sdr.leaderId === leaderId || sdr.liderId === leaderId)) {
      return true;
    }
    
    return false;
  });

  // 2. Filter Assessores and Consultores
  const filteredAssessores = assessores.filter(assessor => {
    const assessorTeam = assessor.team || assessor.equipe || '';
    
    // Check team match using our robust logic first to prevent cross-talk
    if (isMemberOfLeaderTeam(leaderTeam, assessorTeam)) {
      return true;
    }
    
    // Fallback to explicit ID link only if teams don't conflict or if member has no team
    if (!assessorTeam && leaderId && (assessor.leaderId === leaderId || assessor.liderId === leaderId)) {
      return true;
    }
    
    return false;
  });

  // 3. Filter Matches (only show matches where both SDR and Assessor are visible to the leader)
  const filteredMatches = matches.filter(m => {
    return filteredSdrs.some(s => s.id === m.sdrId) && filteredAssessores.some(a => a.id === m.assessorId);
  });

  return {
    sdrs: filteredSdrs,
    assessores: filteredAssessores,
    matches: filteredMatches
  };
}

export function getTeamGoalsForTeam(teamName: string | undefined, teamGoalsRaw: any): any {
  if (!teamGoalsRaw) return {};
  if (!teamName) return teamGoalsRaw;
  const specific = teamGoalsRaw.teamSpecificGoals?.[teamName];
  if (specific) {
    return {
      ...teamGoalsRaw,
      ...specific,
    };
  }
  return teamGoalsRaw;
}

export function getMemberPerformanceScore(member: any, teamGoals: any, currentMonth: string = '2026-06'): {
  score: number;
  breakdown: Record<string, { realized: number; target: number; weight: number; points: number }>;
  rank: 'A' | 'B' | 'C';
} {
  const isSdr = member.cargo === 'SDR' || member.isSdr || ['SDR PF', 'SDR PJ', 'SDR Advisor', 'SDR VMB'].includes(member.professionalProfile || member.role || '');

  const record = member.monthlyRecords?.[currentMonth];
  const configuredGoals = record?.configuredGoals;
  const hasMonthlyGoals = Array.isArray(configuredGoals) && configuredGoals.length > 0;
  
  let goalsToUse;
  if (hasMonthlyGoals) {
    goalsToUse = configuredGoals;
  } else {
    const teamName = member.team || member.equipe || 'Geral';
    goalsToUse = getPerformanceGoalsForTeamAndMonth(teamName, currentMonth, teamGoals);
  }

  // 1. DYNAMIC INDIVIDUAL GOALS EVALUATION (PREFER OVER GLOBAL METRICS)
  if (goalsToUse && Array.isArray(goalsToUse) && goalsToUse.length > 0) {
    let totalScore = 0;
    const breakdown: Record<string, { realized: number; target: number; weight: number; points: number }> = {};
    
    const totalWeights = goalsToUse.reduce((sum: number, g: any) => sum + (g.weight || 0), 0);
    const scaleFactor = totalWeights > 0 ? 100 / totalWeights : 1;

    goalsToUse.forEach((goal: any) => {
      let target = goal.target || 1;
      const weight = goal.weight || 0;
      
      // Auto-detect realized from standard attributes if specific custom realized is 0/undefined
      let realized = typeof goal.realized === 'number' ? goal.realized : 0;
      
      if (realized === 0) {
        const nameLower = goal.name.toLowerCase();
        if (nameLower.includes('ligaç') || nameLower.includes('call') || nameLower.includes('phone') || goal.id === 'ligacoes') {
          if (isSdr) {
            const recordVal = member.monthlyRecords?.[currentMonth] || {};
            realized = typeof recordVal.callsCount === 'number' ? recordVal.callsCount : (member.callsCount || 0);
          } else {
            const recordVal = member.monthlyRecords?.[currentMonth] || {};
            realized = typeof recordVal.realizadoLigacoes === 'number' ? recordVal.realizadoLigacoes : (member.realizadoLigacoes || 0);
          }
        } else if (nameLower.includes('agend') || nameLower.includes('reuni') || nameLower.includes('sched') || goal.id === 'reunioes') {
          if (isSdr) {
            const recordVal = member.monthlyRecords?.[currentMonth] || {};
            realized = typeof recordVal.agendamentosCount === 'number' ? recordVal.agendamentosCount : (member.agendamentosCount || 0);
          } else {
            const recordVal = member.monthlyRecords?.[currentMonth] || {};
            realized = typeof recordVal.realizadoReunioesAgendadas === 'number' ? recordVal.realizadoReunioesAgendadas : (member.realizadoReunioesAgendadas || 0);
          }
        } else if (nameLower.includes('efetiv') || nameLower.includes('realiz') || nameLower.includes('done') || goal.id === 'comparecimento') {
          if (isSdr) {
            const recordVal = member.monthlyRecords?.[currentMonth] || {};
            realized = typeof recordVal.efetivacoesCount === 'number' ? recordVal.efetivacoesCount : (member.efetivacoesCount || 0);
          } else {
            const recordVal = member.monthlyRecords?.[currentMonth] || {};
            realized = typeof recordVal.realizadoReunioesRealizadas === 'number' ? recordVal.realizadoReunioesRealizadas : (member.realizadoReunioesRealizadas || 0);
          }
        } else if (nameLower.includes('contas') || nameLower.includes('client') || nameLower.includes('open') || goal.id === 'indicacoes') {
          if (isSdr) {
            const recordVal = member.monthlyRecords?.[currentMonth] || {};
            realized = typeof recordVal.contasAbertasCount === 'number' ? recordVal.contasAbertasCount : (member.contasAbertasCount || 0);
          } else {
            const recordVal = member.monthlyRecords?.[currentMonth] || {};
            realized = typeof recordVal.realizadoContasAbertas === 'number' ? recordVal.realizadoContasAbertas : (member.realizadoContasAbertas || member.realizadoClientes || 0);
          }
        } else if (nameLower.includes('net') || nameLower.includes('receita') || goal.id === 'net') {
          const recordVal = member.monthlyRecords?.[currentMonth] || {};
          realized = typeof recordVal.realizadoNet === 'number' ? recordVal.realizadoNet : (member.realizadoNet || 0);
        } else if (nameLower.includes('cross') || goal.id === 'cross_sell') {
          const recordVal = member.monthlyRecords?.[currentMonth] || {};
          realized = typeof recordVal.realizadoCrossSell === 'number' ? recordVal.realizadoCrossSell : (member.realizadoCrossSell || 0);
        }
      }

      if (target <= 0) target = 1;
      const attainment = Math.min(1.0, realized / target); // Cap at 100% per metric for progress alignment
      const points = attainment * weight * scaleFactor;
      totalScore += points;

      breakdown[goal.id || goal.name] = {
        realized,
        target,
        weight,
        points: parseFloat((attainment * weight * scaleFactor).toFixed(2))
      };
    });

    const finalScore = parseFloat(Math.min(100, Math.max(0, totalScore)).toFixed(1));
    let rank: 'A' | 'B' | 'C' = 'C';
    if (finalScore >= 70) rank = 'A';
    else if (finalScore >= 40) rank = 'B';

    return {
      score: finalScore,
      breakdown,
      rank
    };
  }

  // 2. FALLBACK/LEGACY GLOBAL TEAM GOALS EVALUATION
  const performanceGoals = getPerformanceGoalsForTeamAndMonth(member.team || member.equipe, currentMonth, teamGoals);

  let totalScore = 0;
  const breakdown: Record<string, { realized: number; target: number; weight: number; points: number }> = {};

  performanceGoals.forEach((goal: any) => {
    let realized = 0;
    let target = goal.target || 1;

    // Support for individual goal weights on a per-member basis
    const weight = member.individualWeights?.[goal.id] !== undefined 
      ? Number(member.individualWeights[goal.id]) 
      : (goal.weight || 0);

    if (isSdr) {
      // Resolve record for the currentMonth if monthlyRecords exists
      const record = member.monthlyRecords?.[currentMonth] || {
        agendamentosCount: member.agendamentosCount || 0,
        efetivacoesCount: member.efetivacoesCount || 0,
        contasAbertasCount: member.contasAbertasCount || 0,
        callsCount: member.callsCount || 0,
        metaAgendamentos: member.metaAgendamentos || 20,
        metaEfetivacoes: member.metaEfetivacoes || 10,
        metaContasAbertas: member.metaContasAbertas || 5,
        metaEfetivacaoRate: member.metaEfetivacaoRate || 50
      };

      if (goal.id === 'ligacoes') {
        realized = record.callsCount || 0;
        target = goal.target || 300;
      } else if (goal.id === 'reunioes') {
        realized = record.agendamentosCount || 0;
        target = record.metaAgendamentos || goal.target || 20;
      } else if (goal.id === 'comparecimento') {
        realized = record.efetivacoesCount || 0;
        target = record.metaEfetivacoes || goal.target || 15;
      } else if (goal.id === 'indicacoes') {
        realized = record.contasAbertasCount || 0;
        target = record.metaContasAbertas || goal.target || 10;
      } else {
        const customRealized = member.customMonitorMetrics?.find((m: any) => m.key === goal.id || m.id === goal.id);
        realized = customRealized ? (customRealized.real || 0) : 0;
        target = customRealized ? (customRealized.target || goal.target || 1) : (goal.target || 1);
      }
    } else {
      if (goal.id === 'ligacoes') {
        realized = member.realizadoLigacoes || 0;
        target = member.metaLigacoes || goal.target || 300;
      } else if (goal.id === 'reunioes') {
        realized = member.realizadoReunioesAgendadas || 0;
        target = member.metaReunioesAgendadas || goal.target || 20;
      } else if (goal.id === 'comparecimento') {
        realized = member.realizadoReunioesRealizadas || 0;
        target = member.metaReunioesRealizadas || goal.target || 15;
      } else if (goal.id === 'indicacoes') {
        realized = member.realizadoIndicacoes || 0;
        target = member.metaIndicacoes || goal.target || 10;
      } else {
        const customRealized = member.customMonitorMetrics?.find((m: any) => m.key === goal.id || m.id === goal.id);
        realized = customRealized ? (customRealized.real || 0) : 0;
        target = customRealized ? (customRealized.target || goal.target || 1) : (goal.target || 1);
      }
    }

    if (target <= 0) target = 1;
    const attainment = Math.min(1, realized / target);
    const points = attainment * weight;
    totalScore += points;

    breakdown[goal.id] = {
      realized,
      target,
      weight,
      points: parseFloat(points.toFixed(2))
    };
  });

  const finalScore = parseFloat(Math.min(100, Math.max(0, totalScore)).toFixed(1));
  let rank: 'A' | 'B' | 'C' = 'C';
  if (finalScore >= 70) rank = 'A';
  else if (finalScore >= 40) rank = 'B';

  return {
    score: finalScore,
    breakdown,
    rank
  };
}

export function getAssessorPerformanceScore(assessor: any, teamGoals: any): {
  score: number;
  breakdown: Record<string, { realized: number; target: number; weight: number; points: number }>;
} {
  const { score, breakdown } = getMemberPerformanceScore(assessor, teamGoals);
  return { score, breakdown };
}

export function getPerformanceGoalsForTeamAndMonth(
  teamName: string | undefined,
  month: string,
  teamGoalsRaw: any
): PerformanceGoal[] {
  if (!teamGoalsRaw) return [];
  const team = teamName || 'Geral';
  
  // 1. Check if there's a custom monthly plan for this month and team
  if (teamGoalsRaw.monthlyPlans?.[month]?.[team]) {
    return teamGoalsRaw.monthlyPlans[month][team];
  }
  
  // 2. Fallback to specific team goals or global goals
  const specific = teamGoalsRaw.teamSpecificGoals?.[team];
  const goalsSource = specific?.performanceGoals || teamGoalsRaw.performanceGoals;
  
  if (goalsSource && Array.isArray(goalsSource)) {
    return [...goalsSource].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }
  
  return [
    { id: 'ligacoes', name: 'Ligações', target: 300, weight: 20, type: 'quantity', description: 'Ligações operacionais' },
    { id: 'reunioes', name: 'Reuniões', target: 20, weight: 35, type: 'quantity', description: 'Reuniões agendadas' },
    { id: 'comparecimento', name: 'Comparecimento', target: 15, weight: 25, type: 'quantity', description: 'Reuniões efetivas' },
    { id: 'indicacoes', name: 'Indicações', target: 10, weight: 20, type: 'quantity', description: 'Abertura de contas ou indicações' }
  ];
}

export function calculateIndividualProgress(member: any, activeGoals: PerformanceGoal[]): number {
  const goalsToUse = member.individualGoals && Array.isArray(member.individualGoals) && member.individualGoals.length > 0
    ? member.individualGoals
    : activeGoals;
    
  if (!goalsToUse || goalsToUse.length === 0) return 0;
  
  let totalPoints = 0;
  let totalWeight = 0;
  
  goalsToUse.forEach((goal: any) => {
    const target = goal.target || 1;
    const weight = goal.weight || 0;
    const realized = typeof goal.realized === 'number' ? goal.realized : 0;
    
    const attainment = target > 0 ? (realized / target) : 0;
    const points = Math.min(1, attainment) * weight;
    
    totalPoints += points;
    totalWeight += weight;
  });
  
  const scale = totalWeight > 0 ? 100 / totalWeight : 1;
  const progress = totalPoints * scale;
  
  return Math.min(100, Math.max(0, Math.round(progress)));
}

export function calculateTeamWeightedProgress(
  members: any[],
  activeGoals: PerformanceGoal[],
  currentMonth: string = '2026-06',
  teamGoalsRaw: any = null
): { totalProgress: number; goalBreakdown: { name: string; target: number; realized: number; percent: number; points: number; weight: number }[] } {
  if (!activeGoals || activeGoals.length === 0) {
    return { totalProgress: 0, goalBreakdown: [] };
  }
  
  // 1. Calculate average of individual progresses for active members
  const activeMembers = members.filter(m => m.active);
  let totalProgress = 0;
  if (activeMembers.length > 0) {
    let sumScore = 0;
    activeMembers.forEach(m => {
      const { score } = getMemberPerformanceScore(m, teamGoalsRaw, currentMonth);
      sumScore += score;
    });
    totalProgress = parseFloat((sumScore / activeMembers.length).toFixed(1));
  }

  // 2. Build goalBreakdown for detail listings
  const goalBreakdown: any[] = [];
  
  activeGoals.forEach((goal) => {
    let teamTargetSum = 0;
    let teamRealizedSum = 0;
    
    activeMembers.forEach((m) => {
      const mGoals = m.monthlyRecords?.[currentMonth]?.configuredGoals || m.individualGoals || [];
      const mGoal = mGoals.find((mg: any) => mg.id === goal.id || mg.name.toLowerCase() === goal.name.toLowerCase());
      
      if (mGoal) {
        teamTargetSum += mGoal.target || 0;
        teamRealizedSum += typeof mGoal.realized === 'number' ? mGoal.realized : 0;
      } else {
        teamTargetSum += goal.target || 0;
        
        let realized = 0;
        const nameLower = goal.name.toLowerCase();
        const isSdr = m.cargo === 'SDR' || m.isSdr || ['SDR PF', 'SDR PJ', 'SDR Advisor', 'SDR VMB'].includes(m.professionalProfile || m.role || '');
        if (nameLower.includes('ligaç') || nameLower.includes('call') || nameLower.includes('phone') || goal.id === 'ligacoes') {
          realized = isSdr ? (m.callsCount || 0) : (m.realizadoLigacoes || 0);
        } else if (nameLower.includes('agend') || nameLower.includes('reuni') || nameLower.includes('sched') || goal.id === 'reunioes') {
          realized = isSdr ? (m.agendamentosCount || 0) : (m.realizadoReunioesAgendadas || 0);
        } else if (nameLower.includes('efetiv') || nameLower.includes('realiz') || nameLower.includes('done') || goal.id === 'comparecimento') {
          realized = isSdr ? (m.efetivacoesCount || 0) : (m.realizadoReunioesRealizadas || 0);
        } else if (nameLower.includes('contas') || nameLower.includes('client') || nameLower.includes('open') || goal.id === 'indicacoes') {
          realized = isSdr ? (m.contasAbertasCount || 0) : (m.realizadoContasAbertas || m.realizadoClientes || 0);
        }
        teamRealizedSum += realized;
      }
    });
    
    const target = teamTargetSum > 0 ? teamTargetSum : (goal.target || 1);
    const realized = teamRealizedSum;
    const attainment = target > 0 ? (realized / target) : 0;
    const percent = Math.round(Math.min(1, attainment) * 100);
    const points = Math.min(1, attainment) * (goal.weight || 0);
    
    goalBreakdown.push({
      name: goal.name,
      target,
      realized,
      percent,
      points: parseFloat(points.toFixed(1)),
      weight: goal.weight
    });
  });
  
  return {
    totalProgress,
    goalBreakdown
  };
}


