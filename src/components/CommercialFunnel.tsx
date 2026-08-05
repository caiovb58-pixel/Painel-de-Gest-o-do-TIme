import React from 'react';
import { TrendingUp } from 'lucide-react';

interface CommercialFunnelProps {
  totalLeads: number;
  totalContatos: number;
  totalReunioes: number;
  totalPropostas: number;
  totalFechamentos: number;
}

export const CommercialFunnel: React.FC<CommercialFunnelProps> = ({
  totalLeads,
  totalContatos,
  totalReunioes,
  totalPropostas,
  totalFechamentos,
}) => {
  const stages = [
    { label: 'Leads Gerados', count: totalLeads, percent: 100, color: 'bg-indigo-900' },
    { label: 'Contatos Conectados', count: totalContatos, percent: totalLeads > 0 ? Math.round((totalContatos / totalLeads) * 100) : 0, color: 'bg-indigo-750' },
    { label: 'Reuniões Agendadas', count: totalReunioes, percent: totalContatos > 0 ? Math.round((totalReunioes / totalContatos) * 100) : 0, color: 'bg-indigo-600' },
    { label: 'Propostas Enviadas', count: totalPropostas, percent: totalReunioes > 0 ? Math.round((totalPropostas / totalReunioes) * 100) : 0, color: 'bg-indigo-450' },
    { label: 'Fechamentos Ganhos', count: totalFechamentos, percent: totalPropostas > 0 ? Math.round((totalFechamentos / totalPropostas) * 100) : 0, color: 'bg-emerald-500' }
  ];

  return (
    <div id="commercial-funnel" className="bg-white rounded-2xl border-2 border-neutral-900 p-6 shadow-3xs space-y-4 text-left">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black uppercase text-neutral-900 tracking-wider flex items-center gap-1.5 font-display">
          <TrendingUp className="w-4.5 h-4.5 text-indigo-600" />
          Funil Comercial Conversão Corporativa
        </h4>
        <span className="text-[8px] font-black text-neutral-500 font-mono bg-neutral-100 p-1 px-2 rounded border border-neutral-250 uppercase">Métrico: Conversão Comercial</span>
      </div>
      
      <div className="space-y-2.5">
        {stages.map((stage, sIdx) => (
          <div key={sIdx} className="relative">
            <div className="flex justify-between items-center text-xs font-mono font-bold text-neutral-800 relative z-10 p-2 pl-3">
              <span className="flex items-center gap-2 font-sans font-extrabold">
                <span className="w-2.5 h-2.5 rounded-full bg-neutral-900/10 flex items-center justify-center text-[8px] font-mono font-black">{sIdx + 1}</span>
                {stage.label}
              </span>
              <div className="flex items-center gap-3">
                <span className="font-black text-neutral-950">{stage.count} cases</span>
                <span className="text-[10px] bg-neutral-100 border border-neutral-300 rounded p-0.5 px-1.5 font-black text-indigo-750 font-mono">{stage.percent}%</span>
              </div>
            </div>
            
            <div className="absolute top-0 left-0 h-full rounded-lg bg-neutral-100 border border-neutral-200/80 -z-10" style={{ width: '100%' }}></div>
            <div className={`absolute top-0 left-0 h-full rounded-lg ${stage.color} opacity-15 -z-10`} style={{ width: `${stage.percent}%` }}></div>
          </div>
        ))}
      </div>
    </div>
  );
};
