import React from 'react';
import { Award } from 'lucide-react';
import { Assessor } from '../types';

interface PerformanceRankingProps {
  rankingList: (Assessor & { score?: number })[];
  rankingIndicator: 'score' | 'net' | 'receita' | 'contas' | 'indicacoes';
  setRankingIndicator: (indicator: 'score' | 'net' | 'receita' | 'contas' | 'indicacoes') => void;
  selectedAssessorId: string;
  setSelectedAssessorId: (id: string) => void;
}

export const PerformanceRanking: React.FC<PerformanceRankingProps> = ({
  rankingList,
  rankingIndicator,
  setRankingIndicator,
  selectedAssessorId,
  setSelectedAssessorId,
}) => {
  const placementMedals = ['🥇', '🥈', '🥉'];

  return (
    <div id="performance-ranking" className="bg-white rounded-2xl border-2 border-neutral-900 p-6 shadow-3xs space-y-4 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-150 pb-3">
        <div>
          <h4 className="text-xs font-black uppercase text-neutral-900 tracking-wider flex items-center gap-1.5 font-display">
            <Award className="w-4.5 h-4.5 text-indigo-600" />
            🏆 Ranking Geral de Desempenho (Performance)
          </h4>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            Classificação ordenada dos assessores e consultores comerciais baseada em métricas ativas e no atingimento de metas ponderadas.
          </p>
        </div>
        
        {/* Interactive sorting indicators */}
        <div className="flex bg-neutral-100 p-1 rounded-xl border border-neutral-250 gap-1 self-start md:self-auto shrink-0 font-mono text-[9px] font-black">
          {[
            { key: 'score', label: 'Pontuação (Metas)' },
            { key: 'net', label: 'NET Captação' },
            { key: 'receita', label: 'Comissão' },
            { key: 'contas', label: 'Contas Abertas' },
            { key: 'indicacoes', label: 'Indicações' }
          ].map((btn) => (
            <button
              key={btn.key}
              onClick={() => setRankingIndicator(btn.key as any)}
              className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all ${
                rankingIndicator === btn.key
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-neutral-100 border-b border-neutral-300 text-neutral-600 font-mono text-[9px] font-black uppercase">
              <th className="p-2.5 text-center w-14">Posição</th>
              <th className="p-2.5">Nome do Profissional</th>
              <th className="p-2.5">Equipe</th>
              <th className="p-2.5 text-center font-bold">Pontuação</th>
              <th className="p-2.5 text-right">NET Captação</th>
              <th className="p-2.5 text-right">Comissões (Receita)</th>
              <th className="p-2.5 text-center">Contas Abertas</th>
              <th className="p-2.5 text-center">Indicações</th>
              <th className="p-2.5 text-center">Vigência</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-150 font-mono">
            {rankingList.map((assessorItem, index) => {
              const isSelected = assessorItem.id === selectedAssessorId;
              return (
                <tr 
                  key={assessorItem.id} 
                  onClick={() => setSelectedAssessorId(assessorItem.id)}
                  className={`hover:bg-neutral-50 cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50/50 hover:bg-indigo-50' : ''}`}
                >
                  <td className="p-2.5 text-center text-xs font-black text-neutral-900">
                    {placementMedals[index] || `${index + 1}º`}
                  </td>
                  <td className="p-2.5">
                    <div className="flex items-center gap-2">
                      <img
                        src={assessorItem.photo || `https://api.dicebear.com/7.x/adventurer/svg?seed=${assessorItem.name}`}
                        alt={assessorItem.name}
                        className="w-6 h-6 rounded-full border border-neutral-300 bg-white"
                        referrerPolicy="no-referrer"
                      />
                      <span className="font-sans font-bold text-neutral-900">{assessorItem.name}</span>
                    </div>
                  </td>
                  <td className="p-2.5 text-neutral-600 font-semibold font-sans">{assessorItem.team || 'Sem Equipe'}</td>
                  <td className="p-2.5 text-center font-black text-indigo-700 bg-indigo-50/20">
                    {assessorItem.score !== undefined ? `${assessorItem.score.toFixed(1)} pts` : '-'}
                  </td>
                  <td className="p-2.5 text-right font-bold text-neutral-700">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(assessorItem.realizadoNet || 0)}
                  </td>
                  <td className="p-2.5 text-right text-xs font-black text-indigo-750">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(assessorItem.captacaoMes || 0)}
                  </td>
                  <td className="p-2.5 text-center font-bold">{assessorItem.realizadoContasAbertas || 0}</td>
                  <td className="p-2.5 text-center font-bold">{assessorItem.realizadoIndicacoes || 0}</td>
                  <td className="p-2.5 text-center text-[10px] font-sans text-neutral-500">Junho/2026</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
