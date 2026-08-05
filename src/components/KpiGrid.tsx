import React from 'react';
import { Target } from 'lucide-react';

interface KpiGridProps {
  totalVolume: number;
  actualContasAbertas: number;
  targetContasAbertas: number;
  percentContasAbertas: number;
  actualAtivacoes: number;
  targetAtivacoes: number;
  percentAtivacoes: number;
  actualCrossSell: number;
  targetCrossSell: number;
  percentCrossSell: number;
  actualIndicacoes: number;
  targetIndicacoes: number;
  percentIndicacoes: number;
}

const getStatusClasses = (percent: number) => {
  if (percent >= 80) {
    return {
      bg: 'bg-emerald-50/70 border-emerald-200 hover:bg-emerald-100/40',
      text: 'text-emerald-700',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      bar: 'bg-emerald-500',
      border: 'border-emerald-500',
    };
  } else if (percent >= 50) {
    return {
      bg: 'bg-amber-50/70 border-amber-200 hover:bg-amber-100/40',
      text: 'text-amber-700',
      badge: 'bg-amber-100 text-amber-800 border-amber-200',
      bar: 'bg-amber-500',
      border: 'border-amber-500',
    };
  } else {
    return {
      bg: 'bg-red-50/70 border-red-200 hover:bg-red-100/40',
      text: 'text-red-700',
      badge: 'bg-red-100 text-red-800 border-red-200',
      bar: 'bg-red-500',
      border: 'border-red-500',
    };
  }
};

export const KpiGrid: React.FC<KpiGridProps> = ({
  totalVolume,
  actualContasAbertas,
  targetContasAbertas,
  percentContasAbertas,
  actualAtivacoes,
  targetAtivacoes,
  percentAtivacoes,
  actualCrossSell,
  targetCrossSell,
  percentCrossSell,
  actualIndicacoes,
  targetIndicacoes,
  percentIndicacoes,
}) => {
  const kpis = [
    {
      title: 'NET Captação',
      value: totalVolume,
      target: 1600000,
      percent: Math.round((totalVolume / 1600000) * 100),
      isCurrency: true,
    },
    {
      title: 'Contas Abertas',
      value: actualContasAbertas,
      target: targetContasAbertas,
      percent: percentContasAbertas,
      isCurrency: false,
    },
    {
      title: 'Ativação',
      value: actualAtivacoes,
      target: targetAtivacoes,
      percent: percentAtivacoes,
      isCurrency: false,
    },
    {
      title: 'Cross Sell',
      value: actualCrossSell,
      target: targetCrossSell,
      percent: percentCrossSell,
      isCurrency: false,
    },
    {
      title: 'Indicação',
      value: actualIndicacoes,
      target: targetIndicacoes,
      percent: percentIndicacoes,
      isCurrency: false,
    },
  ];

  return (
    <div id="kpi-grid" className="space-y-4 text-left">
      <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
        <h3 className="text-sm font-black uppercase tracking-wider text-neutral-900 flex items-center gap-2 font-display">
          <Target className="w-4.5 h-4.5 text-indigo-600" />
          Indicadores Chave de Performance (KPIs)
        </h3>
        <span className="text-[9px] font-black font-mono bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded border border-neutral-250 uppercase">Consolidado Geral</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {kpis.map((kpi, idx) => {
          const stat = getStatusClasses(kpi.percent);
          return (
            <div key={idx} className={`bg-white rounded-2xl border-2 p-4.5 space-y-3 shadow-3xs transition-all ${stat.bg} ${stat.border}`}>
              <div>
                <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest block font-mono">{kpi.title}</span>
                <div className="text-lg font-black text-neutral-900 tracking-tight font-display mt-1">
                  {kpi.isCurrency 
                    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(kpi.value)
                    : kpi.value
                  }
                </div>
                <span className="text-[10px] text-neutral-500 block font-sans font-medium mt-0.5">
                  Meta: {kpi.isCurrency ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(kpi.target) : kpi.target}
                </span>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className={`${stat.text} font-mono`}>{kpi.percent}%</span>
                  <span className="text-neutral-400 font-normal">atingido</span>
                </div>
                <div className="w-full bg-neutral-200/70 h-2 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${stat.bar}`} style={{ width: `${Math.min(100, kpi.percent)}%` }}></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
