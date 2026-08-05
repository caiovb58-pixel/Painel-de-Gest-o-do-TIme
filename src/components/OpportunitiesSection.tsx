import React from 'react';
import { Briefcase, AlertCircle, Plus } from 'lucide-react';
import { NegocioFechado } from '../types';

interface OpportunitiesSectionProps {
  opportunitiesList: NegocioFechado[];
  updateNegocio: (id: string, updates: Partial<NegocioFechado>) => void;
  handleStartEditNegocio: (deal: NegocioFechado) => void;
  setShowLaunchForm: (show: boolean) => void;
  setNewStatus: (status: 'GANHO' | 'PERDIDO' | 'EM_NEGOCIACAO') => void;
}

export const OpportunitiesSection: React.FC<OpportunitiesSectionProps> = ({
  opportunitiesList,
  updateNegocio,
  handleStartEditNegocio,
  setShowLaunchForm,
  setNewStatus,
}) => {
  return (
    <div id="opportunities-section" className="bg-white rounded-2xl border-2 border-neutral-900 p-6 shadow-3xs space-y-4 text-left">
      <div>
        <h4 className="text-xs font-black uppercase text-neutral-900 tracking-wider flex items-center gap-1.5 font-display">
          <Briefcase className="w-4.5 h-4.5 text-indigo-600" />
          Esteira de Oportunidades Ativas (Em Negociação)
        </h4>
        <p className="text-[11px] text-neutral-500 mt-0.5">
          Acompanhamento de transações comerciais em andamento, antes do fechamento ganho ou perdido definitivo.
        </p>
      </div>

      {opportunitiesList.length === 0 ? (
        <div className="p-10 text-center bg-neutral-50 border border-dashed border-neutral-250 rounded-xl space-y-4 flex flex-col items-center justify-center">
          <div className="p-3 bg-neutral-100 rounded-full border border-neutral-200">
            <AlertCircle className="w-6 h-6 text-neutral-400" />
          </div>
          <div>
            <h5 className="text-xs font-black uppercase text-neutral-800">Nenhuma oportunidade encontrada.</h5>
            <p className="text-[11.5px] text-neutral-500 mt-1 max-w-sm mx-auto leading-relaxed">
              Não existem transações em andamento registradas no momento com o status "Em Negociação".
            </p>
          </div>
          <button
            onClick={() => {
              setNewStatus('EM_NEGOCIACAO');
              setShowLaunchForm(true);
              const targetEl = document.getElementById('contrato-form-container');
              if (targetEl) {
                targetEl.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="px-4 py-2 bg-neutral-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-3xs cursor-pointer flex items-center gap-1.5 animate-pulse"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            Registrar Oportunidade
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5">
          {opportunitiesList.map((opp) => {
            const createFormatted = opp.dataCriacaoLead ? opp.dataCriacaoLead.substring(0, 10).split('-').reverse().join('/') : '—';
            return (
              <div key={opp.id} className="p-4 bg-neutral-50 border border-neutral-200 hover:border-neutral-300 rounded-2xl transition space-y-3 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[9px] font-mono font-black text-neutral-400">
                    <span>DATA GEN: {createFormatted}</span>
                    <span className="p-0.5 px-1.5 bg-amber-100 text-amber-800 border border-amber-200 rounded">EM NEGOCIAÇÃO</span>
                  </div>
                  
                  <h4 className="text-xs font-extrabold text-neutral-950 truncate max-w-xs uppercase leading-tight">
                    {opp.clientName}
                  </h4>
                  
                  <div className="space-y-1 text-[11px] font-sans">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Volume Comercial:</span>
                      <strong className="text-neutral-900 font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(opp.volumeFinanceiro)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Comissão Estimada:</span>
                      <strong className="text-indigo-650 font-black">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(opp.receitaEstimada)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">SDR Origem:</span>
                      <span className="text-neutral-800 font-semibold">{opp.sdrName || 'Direto'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Assessor Alocado:</span>
                      <span className="text-neutral-800 font-semibold">{opp.assessorName || 'Sem assessor'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-dashed border-neutral-200 flex justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      updateNegocio(opp.id, { status: 'GANHO' });
                    }}
                    className="p-1 px-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[9px] font-black uppercase rounded-lg transition-colors cursor-pointer"
                    title="Mover para GANHO"
                  >
                    ✓ GANHO
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      updateNegocio(opp.id, { status: 'PERDIDO' });
                    }}
                    className="p-1 px-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-800 text-[9px] font-black uppercase rounded-lg transition-colors cursor-pointer"
                    title="Mover para PERDIDO"
                  >
                    ✕ PERDIDO
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStartEditNegocio(opp)}
                    className="p-1 px-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 text-[9px] font-black uppercase rounded-lg transition-colors cursor-pointer"
                    title="Editar Dados"
                  >
                    Editar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
