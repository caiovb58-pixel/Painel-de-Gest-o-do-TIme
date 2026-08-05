import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface ExecutiveSummaryProps {
  totalRevenue: number;
  wonCount: number;
  actualContas: number;
  percentCrossSell: number;
  percentIndicacoes: number;
}

export const ExecutiveSummaryCard: React.FC<ExecutiveSummaryProps> = ({
  totalRevenue,
  wonCount,
  actualContas,
  percentCrossSell,
  percentIndicacoes,
}) => {
  const revenueGoal = 1600000;
  const revenuePercent = Math.round((totalRevenue / revenueGoal) * 100);

  return (
    <div id="executive-summary-card" className="bg-neutral-900 text-white rounded-3xl border border-neutral-800 p-6 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-650 opacity-10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500 opacity-5 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-neutral-800 pb-5 mb-5 relative z-10">
        <div>
          <span className="text-[10px] font-black font-mono tracking-widest text-amber-400 bg-neutral-800 border border-neutral-750 px-2.5 py-1 rounded-md uppercase">
            ⚡ Resumo Executivo Operacional
          </span>
          <h1 className="text-2xl font-black mt-2 tracking-tight font-display text-white">
            {revenuePercent >= 80 ? '🏆 Alta Performance Comercial' : revenuePercent >= 50 ? '📈 Ritmo Comercial Estável' : '⚠️ Atenção: Ritmo Comercial Crítico'}
          </h1>
          <p className="text-xs text-neutral-400 mt-1 max-w-xl">
            Análise geralizada de metas econômicas do time de wealth management, identificando gargalos e desvios de produtividade de forma preventiva.
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-neutral-800/80 border border-neutral-750 p-4 rounded-2xl">
          <div className="text-right">
            <span className="text-[9px] font-black uppercase text-neutral-400 block tracking-wider font-mono">Meta Financeira Atingida</span>
            <div className="text-2xl font-black tracking-tight text-white font-mono mt-0.5">
              {revenuePercent}%
            </div>
          </div>
          <div className="h-10 w-0.5 bg-neutral-700"></div>
          <div className="text-left">
            <span className="text-[9px] font-black uppercase text-neutral-400 block tracking-wider font-mono">Status do Mês</span>
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 mt-1 rounded text-[9px] font-black font-mono tracking-wide uppercase ${
              revenuePercent >= 80 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
              revenuePercent >= 50 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
              'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${revenuePercent >= 80 ? 'bg-emerald-400' : revenuePercent >= 50 ? 'bg-amber-400' : 'bg-red-400'} animate-pulse`}></span>
              {revenuePercent >= 80 ? 'Excelente' : revenuePercent >= 50 ? 'Estável' : 'Atenção'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10 text-left">
        <div className="bg-neutral-850 p-4.5 rounded-2xl border border-neutral-800 space-y-3">
          <span className="text-[9px] font-black uppercase text-emerald-400 tracking-wider font-mono flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Principais Conquistas Comerciais
          </span>
          <div className="space-y-2 text-xs text-neutral-350">
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-bold">✓</span>
              <span><strong>{wonCount} ativações realizadas</strong> faturadas em contratos com status ganho.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-bold">✓</span>
              <span><strong>{actualContas} novas contas abertas</strong> com captação ativa confirmada.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-bold">✓</span>
              <span><strong>{revenuePercent}% da meta de receita comercial</strong> atingida de forma consolidada.</span>
            </div>
          </div>
        </div>

        <div className="bg-neutral-850 p-4.5 rounded-2xl border border-neutral-800 space-y-3">
          <span className="text-[9px] font-black uppercase text-amber-400 tracking-wider font-mono flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" /> Alertas &amp; Desvios de Performance
          </span>
          <div className="space-y-2 text-xs text-neutral-350">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold">⚠</span>
              <span>{percentCrossSell < 80 ? 'Cross Sell abaixo da meta' : 'Cross Sell estável'} ({percentCrossSell}% de atingimento global).</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold">⚠</span>
              <span>{percentIndicacoes < 80 ? 'Indicações de clientes abaixo da meta' : 'Indicações de clientes estáveis'} ({percentIndicacoes}% de atingimento).</span>
            </div>
            {revenuePercent < 50 && (
              <div className="flex items-center gap-2">
                <span className="text-red-400 font-bold">⚠</span>
                <span className="text-red-300 font-semibold">Volume bruto de receita acumulada requer tração imediata.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
