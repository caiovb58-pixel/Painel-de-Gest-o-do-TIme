import React from 'react';
import { Target } from 'lucide-react';

interface GoalStatusGridProps {
  totalAgendamentos: number;
  totalMetaAgendamentos: number;
  targetAgendamentosProgress: number;
  totalEfetivacoes: number;
  totalMetaEfetivacoes: number;
  targetEfetivacoesProgress: number;
}

const getStatusClasses = (percent: number) => {
  if (percent >= 80) {
    return {
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      bar: 'bg-emerald-500',
      text: 'text-emerald-700',
    };
  } else if (percent >= 50) {
    return {
      badge: 'bg-amber-100 text-amber-800 border-amber-200',
      bar: 'bg-amber-500',
      text: 'text-amber-700',
    };
  } else {
    return {
      badge: 'bg-red-100 text-red-800 border-red-200',
      bar: 'bg-red-500',
      text: 'text-red-700',
    };
  }
};

export const GoalStatusGrid: React.FC<GoalStatusGridProps> = ({
  totalAgendamentos,
  totalMetaAgendamentos,
  targetAgendamentosProgress,
  totalEfetivacoes,
  totalMetaEfetivacoes,
  targetEfetivacoesProgress,
}) => {
  const items = [
    {
      label: 'Reuniões Agendadas',
      actual: totalAgendamentos,
      target: totalMetaAgendamentos,
      percent: targetAgendamentosProgress,
      desc: 'Agendamentos validados de SDRs',
    },
    {
      label: 'Efetivações Pagas',
      actual: totalEfetivacoes,
      target: totalMetaEfetivacoes,
      percent: targetEfetivacoesProgress,
      desc: 'Contratos faturados do mês',
    },
  ];

  return (
    <div id="goal-status-grid" className="bg-white rounded-2xl border-2 border-neutral-900 p-6 shadow-3xs space-y-4 text-left">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black uppercase text-neutral-900 tracking-wider flex items-center gap-1.5 font-display">
          <Target className="w-4.5 h-4.5 text-[#f59e0b]" />
          Performance e Metas Operacionais do Time
        </h4>
        <span className="text-[8px] font-black text-neutral-500 font-mono bg-neutral-100 p-1 px-2 rounded border border-neutral-250 uppercase">Vigência Corrente</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((meta, index) => {
          const stat = getStatusClasses(meta.percent);
          return (
            <div key={index} className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 hover:border-neutral-300 transition space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold text-neutral-800 uppercase tracking-tight block">{meta.label}</span>
                  <span className="text-[9px] text-neutral-500 block font-medium mt-0.5">{meta.desc}</span>
                </div>
                <span className={`p-1 px-2 text-[9px] font-black uppercase tracking-wider rounded font-mono border ${stat.badge}`}>
                  {meta.percent >= 80 ? 'Excelente' : meta.percent >= 50 ? 'Atenção' : 'Abaixo'}
                </span>
              </div>
              
              <div>
                <div className="flex justify-between items-baseline font-mono">
                  <span className="text-xl font-black text-neutral-900">{meta.actual}</span>
                  <span className="text-xs text-neutral-500 font-bold">/ meta: {meta.target}</span>
                </div>
                
                <div className="mt-2 space-y-1">
                  <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${stat.bar}`} style={{ width: `${meta.percent}%` }}></div>
                  </div>
                  <span className={`text-[9px] font-black font-mono block ${stat.text}`}>{meta.percent}% atingido</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
