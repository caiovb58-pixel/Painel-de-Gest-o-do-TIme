import React from 'react';
import { Users, Layers } from 'lucide-react';
import { Assessor } from '../types';

interface AssessorBentoProps {
  activeAssessores: Assessor[];
  selectedAssessorId: string;
  setSelectedAssessorId: (id: string) => void;
}

const getGoalData = (real: number | undefined, target: number | undefined, defTarget: number) => {
  const r = real ?? 0;
  const t = (target && target > 0) ? target : defTarget;
  const p = Math.round((r / t) * 100);
  return { result: r, target: t, percent: p };
};

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

export const AssessorBento: React.FC<AssessorBentoProps> = ({
  activeAssessores,
  selectedAssessorId,
  setSelectedAssessorId,
}) => {
  const currentAssessor = activeAssessores.find(a => a.id === selectedAssessorId) || activeAssessores[0];

  // Assessor ranking
  const sortedAssessoresList = [...activeAssessores].sort((a, b) => {
    const capA = a.realizadoNet || 0;
    const capB = b.realizadoNet || 0;
    return capB - capA;
  });
  const assessorRankIndex = sortedAssessoresList.findIndex(a => a.id === (currentAssessor?.id || ''));
  const assessorRanking = assessorRankIndex !== -1 ? assessorRankIndex + 1 : 1;

  const assessorMetaPercent = currentAssessor?.metaNet && currentAssessor.metaNet > 0
    ? Math.round(((currentAssessor.realizadoNet || 0) / currentAssessor.metaNet) * 100)
    : 37;

  // Detailed Products for selected assessor
  const seguroData = getGoalData(currentAssessor?.crossSellSeguroRealizado, currentAssessor?.crossSellSeguroMeta, 10);
  const consorcioData = getGoalData(currentAssessor?.crossSellConsorcioRealizado, currentAssessor?.crossSellConsorcioMeta, 8);
  const contabilidadeData = getGoalData(currentAssessor?.crossSellContabilidadeRealizado, currentAssessor?.crossSellContabilidadeMeta, 6);
  const saudeData = getGoalData(currentAssessor?.crossSellPlanoSaudeRealizado, currentAssessor?.crossSellPlanoSaudeMeta, 5);

  return (
    <div id="assessor-bento" className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
      
      {/* BLOCO 4 - PERFIL DO ASSESSOR */}
      <div className="lg:col-span-4 bg-white rounded-2xl border-2 border-neutral-900 p-6 shadow-3xs flex flex-col justify-between space-y-5">
        <div className="space-y-4">
          <div className="border-b border-neutral-150 pb-3 flex justify-between items-center">
            <h4 className="text-xs font-black uppercase text-neutral-900 tracking-wider flex items-center gap-1.5 font-display">
              <Users className="w-4.5 h-4.5 text-neutral-900" />
              Perfil do Assessor
            </h4>
            
            {/* Assessor selector */}
            <select
              value={selectedAssessorId}
              onChange={(e) => setSelectedAssessorId(e.target.value)}
              className="bg-neutral-50 p-1.5 px-2.5 border-2 border-neutral-900 rounded-xl font-bold text-[11px] text-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-900 cursor-pointer"
            >
              {activeAssessores.map(a => (
                <option key={a.id} value={a.id}>{a.name.split(' ')[0]}</option>
              ))}
            </select>
          </div>

          {currentAssessor ? (
            <div className="space-y-4 animate-fade-in text-center lg:text-left">
              <div className="flex flex-col lg:flex-row items-center gap-4 bg-neutral-50 border border-neutral-150 p-4 rounded-2xl">
                <img
                  src={currentAssessor.photo || `https://api.dicebear.com/7.x/adventurer/svg?seed=${currentAssessor.name}`}
                  alt={currentAssessor.name}
                  className="w-16 h-16 rounded-full border-2 border-neutral-900 bg-white shadow-sm object-cover shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="space-y-0.5 text-center lg:text-left">
                  <h3 className="text-sm font-black text-neutral-900 font-display truncate max-w-[180px]">
                    {currentAssessor.name}
                  </h3>
                  <span className="text-[9px] font-black uppercase tracking-wider text-indigo-750 font-mono block">
                    {currentAssessor.roleType === 'consultor' ? 'Consultor de Investimentos' : 'Assessor PF/Wealth'}
                  </span>
                  <span className="text-[10px] text-neutral-500 block">
                    Equipe: <strong className="text-neutral-800 font-bold">{currentAssessor.team || 'Sem Equipe'}</strong>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5 pt-1">
                <div className="bg-neutral-50 border border-neutral-150 rounded-xl p-3 text-center">
                  <span className="text-[8.5px] font-black uppercase text-neutral-500 block font-mono">Ranking da Equipe</span>
                  <div className="text-lg font-black text-neutral-955 font-mono mt-1 flex items-center justify-center gap-1">
                    <span>#{assessorRanking}</span>
                    <span className="text-[10px] text-neutral-400 font-normal">de {activeAssessores.length}</span>
                  </div>
                </div>

                <div className="bg-neutral-50 border border-neutral-150 rounded-xl p-3 text-center">
                  <span className="text-[8.5px] font-black uppercase text-neutral-500 block font-mono">Meta Captação</span>
                  <div className="text-xs font-black text-emerald-600 font-mono mt-1 leading-none">
                    {assessorMetaPercent}%
                    <span className="text-[8px] text-neutral-400 block font-normal mt-1 leading-none">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(currentAssessor.realizadoNet || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-neutral-50 border border-dashed border-neutral-200 rounded-xl">
              <p className="text-xs text-neutral-400">Nenhum assessor ativo encontrado para exibir perfil.</p>
            </div>
          )}
        </div>

        <p className="text-[10px] text-neutral-500 bg-neutral-50 p-3 rounded-xl border border-neutral-150 leading-relaxed font-sans mt-auto">
          💡 Selecione o assessor no menu suspenso para visualizar os dados de performance individualizados e as metas de cross-sell de seguros, consórcios, contabilidade e planos de saúde.
        </p>
      </div>

      {/* BLOCO 5 - METAS DETALHADAS */}
      <div className="lg:col-span-8 bg-white rounded-2xl border-2 border-neutral-900 p-6 shadow-3xs space-y-4">
        <div>
          <h4 className="text-xs font-black uppercase text-neutral-900 tracking-wider flex items-center gap-1.5 font-display">
            <Layers className="w-4.5 h-4.5 text-indigo-600" />
            Metas Detalhadas e Distribuição de Produtos (Cross Sell)
          </h4>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            Acompanhamento específico dos quatro pilares estratégicos faturados para o profissional selecionado.
          </p>
        </div>

        {currentAssessor ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                label: 'Seguro de Vida & Previdência',
                result: seguroData.result,
                target: seguroData.target,
                percent: seguroData.percent,
                icon: '🛡️',
                desc: 'Apólices e proteção faturada'
              },
              {
                label: 'Consórcio de Imóveis & Auto',
                result: consorcioData.result,
                target: consorcioData.target,
                percent: consorcioData.percent,
                icon: '🏠',
                desc: 'Cartas de crédito contempladas'
              },
              {
                label: 'Contabilidade B2B',
                result: contabilidadeData.result,
                target: contabilidadeData.target,
                percent: contabilidadeData.percent,
                icon: '📊',
                desc: 'Assinaturas contábeis fiscais'
              },
              {
                label: 'Plano de Saúde & Benefícios',
                result: saudeData.result,
                target: saudeData.target,
                percent: saudeData.percent,
                icon: '🩺',
                desc: 'Contratos médicos empresariais'
              }
            ].map((prod, pIdx) => {
              const stat = getStatusClasses(prod.percent);
              return (
                <div key={pIdx} className={`rounded-2xl border-2 p-4.5 space-y-3 shadow-3xs transition ${stat.bg} ${stat.border}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-2.5">
                      <span className="text-lg">{prod.icon}</span>
                      <div>
                        <span className="text-[11px] font-black text-neutral-800 uppercase block leading-tight">{prod.label}</span>
                        <span className="text-[9px] text-neutral-500 font-sans block mt-0.5">{prod.desc}</span>
                      </div>
                    </div>
                    <span className={`p-1 px-1.5 text-[8.5px] font-mono font-black uppercase tracking-wider rounded border ${stat.badge}`}>
                      {prod.percent}%
                    </span>
                  </div>
                  
                  <div className="pt-2 border-t border-neutral-200 flex justify-between items-baseline font-mono">
                    <div>
                      <span className="text-lg font-black text-neutral-900">{prod.result}</span>
                      <span className="text-[10px] text-neutral-500 font-bold ml-1">realizado</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 text-[10px]">meta: </span>
                      <span className="text-xs font-bold text-neutral-800">{prod.target}</span>
                    </div>
                  </div>
                  
                  <div className="w-full bg-neutral-200/60 h-2 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${stat.bar}`} style={{ width: `${Math.min(100, prod.percent)}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center bg-neutral-50 border border-dashed border-neutral-250 rounded-xl">
            <p className="text-xs text-neutral-400">Carregando dados de metas de produtos...</p>
          </div>
        )}
      </div>
    </div>
  );
};
