import React from 'react';
import { 
  Coins, Plus, Check, Briefcase, Trash2, BarChart3, 
  Table, Award, Layers, Edit2 
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar 
} from 'recharts';

import { ExecutiveSummaryCard } from './ExecutiveSummaryCard';
import { KpiGrid } from './KpiGrid';
import { GoalStatusGrid } from './GoalStatusGrid';
import { CommercialFunnel } from './CommercialFunnel';
import { AssessorBento } from './AssessorBento';
import { OpportunitiesSection } from './OpportunitiesSection';
import { PerformanceRanking } from './PerformanceRanking';
import { getAssessorPerformanceScore } from '../utils/teamFilters';

import { ProductType } from '../types';

interface WealthExecutiveDashboardProps {
  pacing: any;
  activeSDRs: any[];
  activeAssessores: any[];
  teamGoals: any;
  currentUser: any;
  currentMonth: string;
  selectedAssessorId: string;
  setSelectedAssessorId: (id: string) => void;
  rankingIndicator: 'score' | 'net' | 'receita' | 'contas' | 'indicacoes';
  setRankingIndicator: (indicator: 'score' | 'net' | 'receita' | 'contas' | 'indicacoes') => void;
  showLaunchForm: boolean;
  setShowLaunchForm: (show: boolean) => void;
  editingNegocioId: string | null;
  setEditingNegocioId: (id: string | null) => void;
  newClient: string;
  setNewClient: (client: string) => void;
  newVolume: string;
  setNewVolume: (volume: string) => void;
  selectedProducts: any[];
  setSelectedProducts: React.Dispatch<React.SetStateAction<any[]>>;
  newSdrId: string;
  setNewSdrId: (id: string) => void;
  newAssessorId: string;
  setNewAssessorId: (id: string) => void;
  newStatus: 'GANHO' | 'EM_NEGOCIACAO' | 'PERDIDO';
  setNewStatus: (status: 'GANHO' | 'EM_NEGOCIACAO' | 'PERDIDO') => void;
  newOrigemCliente: 'ABERTURA_CONTA' | 'TROCA_ASSESSORIA';
  setNewOrigemCliente: (origem: 'ABERTURA_CONTA' | 'TROCA_ASSESSORIA') => void;
  newSituacaoCliente: 'ATIVO_APORTANDO' | 'INATIVO_SEM_APORTES';
  setNewSituacaoCliente: (situacao: 'ATIVO_APORTANDO' | 'INATIVO_SEM_APORTES') => void;
  newCreateDate: string;
  setNewCreateDate: (date: string) => void;
  newCloseDate: string;
  setNewCloseDate: (date: string) => void;
  deletingNegocioId: string | null;
  setDeletingNegocioId: (id: string | null) => void;
  filterOrigem: string;
  setFilterOrigem: (origem: string) => void;
  filterSituacao: string;
  setFilterSituacao: (situacao: string) => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  addProductRow: () => void;
  updateProductRow: (index: number, key: string, value: any) => void;
  removeProductRow: (index: number) => void;
  handleLaunchSubmit: (e: React.FormEvent) => void;
  handleStartEditNegocio: (deal: any) => void;
  updateNegocio: (id: string, updates: any) => void;
  deleteNegocio: (id: string) => void;
  totalAgendamentos: number;
  totalMetaAgendamentos: number;
  targetAgendamentosProgress: number;
  totalEfetivacoes: number;
  totalMetaEfetivacoes: number;
  targetEfetivacoesProgress: number;
}

export const WealthExecutiveDashboard: React.FC<WealthExecutiveDashboardProps> = ({
  pacing,
  activeSDRs,
  activeAssessores,
  teamGoals,
  currentUser,
  currentMonth,
  selectedAssessorId,
  setSelectedAssessorId,
  rankingIndicator,
  setRankingIndicator,
  showLaunchForm,
  setShowLaunchForm,
  editingNegocioId,
  setEditingNegocioId,
  newClient,
  setNewClient,
  newVolume,
  setNewVolume,
  selectedProducts,
  setSelectedProducts,
  newSdrId,
  setNewSdrId,
  newAssessorId,
  setNewAssessorId,
  newStatus,
  setNewStatus,
  newOrigemCliente,
  setNewOrigemCliente,
  newSituacaoCliente,
  setNewSituacaoCliente,
  newCreateDate,
  setNewCreateDate,
  newCloseDate,
  setNewCloseDate,
  deletingNegocioId,
  setDeletingNegocioId,
  filterOrigem,
  setFilterOrigem,
  filterSituacao,
  setFilterSituacao,
  filterStatus,
  setFilterStatus,
  addProductRow,
  updateProductRow,
  removeProductRow,
  handleLaunchSubmit,
  handleStartEditNegocio,
  updateNegocio,
  deleteNegocio,
  totalAgendamentos,
  totalMetaAgendamentos,
  targetAgendamentosProgress,
  totalEfetivacoes,
  totalMetaEfetivacoes,
  targetEfetivacoesProgress
}) => {
  // Extração e processamento de KPIs para os sub-cards
  const goalTotalRevenue = teamGoals?.wealthRevenueGoal || 1600000;
  const totalRevenue = pacing?.summary?.totalRevenue || 0;
  const totalVolume = pacing?.summary?.totalVolume || 0;

  const actualContas = activeAssessores.reduce((sum, a) => sum + (a.realizadoContasAbertas || 0), 0);
  const targetContasAbertas = activeAssessores.reduce((sum, a) => sum + (a.metaContasAbertas || 10), 0);
  const percentContasAbertas = targetContasAbertas > 0 ? Math.round((actualContas / targetContasAbertas) * 100) : 0;

  // Cross sell global percentage
  const crossSellItems = [
    { real: 'crossSellSeguroRealizado', meta: 'crossSellSeguroMeta', defMeta: 10 },
    { real: 'crossSellConsorcioRealizado', meta: 'crossSellConsorcioMeta', defMeta: 8 },
    { real: 'crossSellContabilidadeRealizado', meta: 'crossSellContabilidadeMeta', defMeta: 6 },
    { real: 'crossSellPlanoSaudeRealizado', meta: 'crossSellPlanoSaudeMeta', defMeta: 5 }
  ];
  let totalCrossReal = 0;
  let totalCrossMeta = 0;
  activeAssessores.forEach(a => {
    crossSellItems.forEach(item => {
      totalCrossReal += (a[item.real as keyof typeof a] as number) || 0;
      totalCrossMeta += (a[item.meta as keyof typeof a] as number) || item.defMeta;
    });
  });
  const percentCrossSell = totalCrossMeta > 0 ? Math.round((totalCrossReal / totalCrossMeta) * 100) : 0;

  const totalIndicacoesReal = activeAssessores.reduce((sum, a) => sum + (a.realizadoIndicacoes || 0), 0);
  const totalIndicacoesMeta = activeAssessores.reduce((sum, a) => sum + (a.metaIndicacoes || 10), 0);
  const percentIndicacoes = totalIndicacoesMeta > 0 ? Math.round((totalIndicacoesReal / totalIndicacoesMeta) * 100) : 0;

  const actualAtivacoes = pacing?.summary?.wonCount || 0;
  const targetAtivacoes = teamGoals?.wealthDealsGoal || 12;
  const percentAtivacoes = targetAtivacoes > 0 ? Math.round((actualAtivacoes / targetAtivacoes) * 100) : 0;

  // Commercial funnel conversion stages (using actual SDR agendamentos and actual won deals)
  const totalLeads = pacing?.negocios?.length || 0;
  const totalContatos = Math.round(totalLeads * 0.85);
  const totalReunioes = totalAgendamentos;
  const totalPropostas = Math.round(totalReunioes * 0.7);
  const totalFechamentos = pacing?.summary?.wonCount || 0;

  // Pre-calculate score for all active assessores and sort
  const activeAssessoresWithScores = React.useMemo(() => {
    return activeAssessores.map(assessor => {
      const { score } = getAssessorPerformanceScore(assessor, teamGoals);
      return {
        ...assessor,
        score
      };
    });
  }, [activeAssessores, teamGoals]);

  // Sorting rankingList of assessores based on selected indicator
  const sortedRankingList = [...activeAssessoresWithScores].sort((a, b) => {
    if (rankingIndicator === 'score') {
      return (b.score || 0) - (a.score || 0);
    } else if (rankingIndicator === 'net') {
      return (b.realizadoNet || 0) - (a.realizadoNet || 0);
    } else if (rankingIndicator === 'receita') {
      return (b.captacaoMes || 0) - (a.captacaoMes || 0);
    } else if (rankingIndicator === 'contas') {
      return (b.realizadoContasAbertas || 0) - (a.realizadoContasAbertas || 0);
    } else {
      return (b.realizadoIndicacoes || 0) - (a.realizadoIndicacoes || 0);
    }
  });

  // Filtrar oportunidades ativas
  const opportunities = pacing?.negocios?.filter((n: any) => n.status === 'EM_NEGOCIACAO') || [];

  return (
    <div className="space-y-6">
      {/* BLOCO 1 - RESUMO EXECUTIVO */}
      <ExecutiveSummaryCard 
        totalRevenue={totalRevenue}
        wonCount={pacing?.summary?.wonCount || 0}
        actualContas={actualContas}
        percentCrossSell={percentCrossSell}
        percentIndicacoes={percentIndicacoes}
      />

      {/* BLOCO 2 & 3 - KPIs CHAVE E METAS DO TIME */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <KpiGrid 
            totalVolume={totalVolume}
            actualContasAbertas={actualContas}
            targetContasAbertas={targetContasAbertas}
            percentContasAbertas={percentContasAbertas}
            actualAtivacoes={actualAtivacoes}
            targetAtivacoes={targetAtivacoes}
            percentAtivacoes={percentAtivacoes}
            actualCrossSell={totalCrossReal}
            targetCrossSell={totalCrossMeta}
            percentCrossSell={percentCrossSell}
            actualIndicacoes={totalIndicacoesReal}
            targetIndicacoes={totalIndicacoesMeta}
            percentIndicacoes={percentIndicacoes}
          />
        </div>
        <div className="space-y-4">
          <GoalStatusGrid 
            totalAgendamentos={totalAgendamentos}
            totalMetaAgendamentos={totalMetaAgendamentos}
            targetAgendamentosProgress={targetAgendamentosProgress}
            totalEfetivacoes={totalEfetivacoes}
            totalMetaEfetivacoes={totalMetaEfetivacoes}
            targetEfetivacoesProgress={targetEfetivacoesProgress}
          />
        </div>
      </div>

      {/* BLOCO 4 & 5 - PERFIL DO ASSESSOR / DETALHE DE METAS */}
      <div className="space-y-4">
        <AssessorBento 
          activeAssessores={activeAssessores}
          selectedAssessorId={selectedAssessorId}
          setSelectedAssessorId={setSelectedAssessorId}
        />
      </div>

      {/* BLOCO 6 - FUNIL DE VENDAS */}
      <div className="space-y-4">
        <CommercialFunnel 
          totalLeads={totalLeads}
          totalContatos={totalContatos}
          totalReunioes={totalReunioes}
          totalPropostas={totalPropostas}
          totalFechamentos={totalFechamentos}
        />
      </div>

      {/* BLOCO 7 - OPORTUNIDADES ATIVAS */}
      <div className="space-y-4">
        <OpportunitiesSection 
          opportunitiesList={opportunities} 
          updateNegocio={updateNegocio}
          handleStartEditNegocio={handleStartEditNegocio}
          setShowLaunchForm={setShowLaunchForm}
          setNewStatus={setNewStatus}
        />
      </div>

      {/* BLOCO 8 - RANKING DE PERFORMANCE */}
      <div className="space-y-4">
        <PerformanceRanking 
          rankingList={sortedRankingList}
          rankingIndicator={rankingIndicator}
          setRankingIndicator={setRankingIndicator}
          selectedAssessorId={selectedAssessorId}
          setSelectedAssessorId={setSelectedAssessorId}
        />
      </div>

      {/* FORMULÁRIO DE REGISTRO (Lançador de Negócios) */}
      <div className="bg-white rounded-2xl border-2 border-neutral-900 p-6 shadow-3xs" id="contrato-form-container">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-xs font-black uppercase text-neutral-900 tracking-wider flex items-center gap-2 font-display">
              <Coins className="w-4.5 h-4.5 text-indigo-600" />
              {editingNegocioId ? "Edição de Contrato Registrado" : "Registro e Lançamento de Negócios Fechados"}
            </h3>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              {editingNegocioId ? "Altere os dados do contrato selecionado e salve as atualizações para recalcular os dados em tempo real." : "Insira novos contratos concluídos para recalcular em tempo real o Roi dos SDRs, o Funil Wave e a Coorte de Conversão."}
            </p>
          </div>
          <button
            onClick={() => {
              if (editingNegocioId) {
                setEditingNegocioId(null);
                setNewClient('');
                setNewVolume('5000000');
                setSelectedProducts([
                  { produtoCategoria: 'INVESTIMENTOS_XP', receitaEstimada: '50000' }
                ]);
                setNewSdrId('');
                setNewAssessorId('');
                setNewStatus('GANHO');
                setNewOrigemCliente('ABERTURA_CONTA');
                setNewSituacaoCliente('ATIVO_APORTANDO');
                setShowLaunchForm(false);
              } else {
                setShowLaunchForm(!showLaunchForm);
              }
            }}
            className={`px-4 py-2 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 shadow-3xs cursor-pointer ${editingNegocioId ? 'bg-indigo-650 hover:bg-indigo-700' : 'bg-neutral-900 hover:bg-black'}`}
          >
            {editingNegocioId ? (
              <>Cancelar Edição</>
            ) : showLaunchForm ? (
              <>Ocultar Painel</>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Registrar Novo Contrato
              </>
            )}
          </button>
        </div>

        {showLaunchForm && (
          <form onSubmit={handleLaunchSubmit} className="mt-5 pt-5 border-t border-dashed border-neutral-200 grid grid-cols-1 md:grid-cols-3 gap-4.5 animate-fade-in">
            <div>
              <label className="block text-[10px] font-mono font-black text-neutral-500 uppercase mb-1">Nome do Cliente / Operação</label>
              <input
                type="text"
                required
                placeholder="Ex: Grupo JBS, Dr. Rodrigo Barros"
                value={newClient}
                onChange={(e) => setNewClient(e.target.value)}
                className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:border-neutral-900 font-medium"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-black text-neutral-500 uppercase mb-1">Volume Financeiro (R$ Captação)</label>
              <input
                type="number"
                required
                value={newVolume}
                onChange={(e) => {
                  const v = e.target.value;
                  setNewVolume(v);
                  const parsed = parseFloat(v);
                  if (!isNaN(parsed)) {
                    const estimated = String(Math.round(parsed * 0.01));
                    setSelectedProducts(prev => {
                      if (prev.length > 0) {
                        return prev.map((item, idx) => idx === 0 ? { ...item, receitaEstimada: estimated } : item);
                      } else {
                        return [{ produtoCategoria: 'INVESTIMENTOS_XP', receitaEstimada: estimated }];
                      }
                    });
                  }
                }}
                className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:border-neutral-900 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-black text-neutral-500 uppercase mb-1">Status do Negócio</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as any)}
                className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:border-neutral-900 font-bold"
              >
                <option value="GANHO">🟩 GANHO (Concluído)</option>
                <option value="EM_NEGOCIACAO">🟨 EM NEGOCIAÇÃO</option>
                <option value="PERDIDO">🟥 PERDIDO</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-black text-neutral-500 uppercase mb-1">Origem do Cliente</label>
              <select
                value={newOrigemCliente}
                onChange={(e) => setNewOrigemCliente(e.target.value as any)}
                className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:border-neutral-900 font-bold"
              >
                <option value="ABERTURA_CONTA">🆕 Abertura de Conta</option>
                <option value="TROCA_ASSESSORIA">🔄 Troca de Assessoria</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-black text-neutral-500 uppercase mb-1">Situação do Cliente</label>
              <select
                value={newSituacaoCliente}
                onChange={(e) => setNewSituacaoCliente(e.target.value as any)}
                className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:border-neutral-900 font-bold"
              >
                <option value="ATIVO_APORTANDO">📈 ATIVO (Fazendo Aportes)</option>
                <option value="INATIVO_SEM_APORTES">📉 INATIVO (Sem Aportes)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-black text-neutral-500 uppercase mb-1">SDR Responsável (Origem)</label>
              <select
                value={newSdrId}
                onChange={(e) => setNewSdrId(e.target.value)}
                className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:border-neutral-900 font-bold"
              >
                <option value="">-- Sem SDR / Direto ao Assessor --</option>
                {activeSDRs.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.team || 'Mesa Geral'})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-black text-neutral-500 uppercase mb-1">Assessor Vinculado (Fechamento)</label>
              <select
                value={newAssessorId}
                onChange={(e) => setNewAssessorId(e.target.value)}
                className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:border-neutral-900 font-bold"
              >
                <option value="">-- Selecione o Assessor --</option>
                {activeAssessores.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-black text-neutral-500 uppercase mb-1">Data Criação do Lead</label>
              <input
                type="text"
                required
                placeholder="DD-MM-YYYY"
                value={newCreateDate}
                onChange={(e) => setNewCreateDate(e.target.value)}
                className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:border-neutral-900"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-black text-neutral-500 uppercase mb-1">Data de Fechamento</label>
              <input
                type="text"
                required
                placeholder="DD-MM-YYYY"
                value={newCloseDate}
                onChange={(e) => setNewCloseDate(e.target.value)}
                className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:border-neutral-900"
              />
            </div>

            {/* Sub-Card: Composition of Products and specific revenues */}
            <div className="md:col-span-3 bg-neutral-50 p-4.5 rounded-xl border border-neutral-250 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase text-neutral-900 tracking-wider flex items-center gap-1.5 font-display">
                    <Briefcase className="w-4 h-4 text-indigo-600" />
                    Composição de Produtos &amp; Receitas Individuais
                  </h4>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Adicione todos os produtos contratados por este cliente. Cada um com sua receita independente.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addProductRow}
                  className="px-3.5 py-1.5 bg-neutral-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  Adicionar Produto
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {selectedProducts.map((p, index) => (
                  <div key={index} className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-lg border border-neutral-200 animate-fade-in">
                    <div className="flex-1 w-full">
                      <label className="block text-[9px] font-mono font-black text-neutral-400 uppercase mb-0.5">Produto #{index + 1}</label>
                      <select
                        value={p.produtoCategoria}
                        onChange={(e) => updateProductRow(index, 'produtoCategoria', e.target.value as ProductType)}
                        className="w-full text-xs p-2 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none font-bold"
                      >
                        <option value="INVESTIMENTOS_XP">Investimentos XP</option>
                        <option value="OPERACAO_COMPROMISSADA">Operação Compromissada</option>
                        <option value="CAMBIO">Câmbio</option>
                        <option value="PREVIDENCIA">Previdência</option>
                        <option value="SEGURO_VIDA">Seguro de Vida</option>
                        <option value="SEGURO_EM_VIDA">Seguro em Vida</option>
                        <option value="RESPONSABILIDADE_CIVIL">Responsabilidade Civil</option>
                        <option value="CONSORCIO_IMOBILIARIO">Consórcio Imobiliário</option>
                        <option value="CONSORCIO_AUTOMOTIVO">Consórcio Automotivo</option>
                        <option value="SUCESSAO_PATRIMONIAL">Sucessão Patrimonial</option>
                        <option value="CONTABILIDADE">Contabilidade</option>
                      </select>
                    </div>

                    <div className="w-full sm:w-64">
                      <label className="block text-[9px] font-mono font-black text-neutral-400 uppercase mb-0.5">Receita Estimada (Comissão R$)</label>
                      <input
                        type="number"
                        required
                        value={p.receitaEstimada}
                        onChange={(e) => updateProductRow(index, 'receitaEstimada', e.target.value)}
                        placeholder="Ex/ 15000"
                        className="w-full text-xs p-2 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none font-mono font-black"
                      />
                    </div>

                    {selectedProducts.length > 1 && (
                      <div className="self-end pb-0.5">
                        <button
                          type="button"
                          onClick={() => removeProductRow(index)}
                          className="p-1.5 text-neutral-400 hover:text-red-650 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Remover este produto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-dashed border-neutral-200 flex justify-between items-center text-xs font-mono font-black text-neutral-800">
                <span>Total de Produtos: {selectedProducts.length}</span>
                <span className="text-indigo-600">
                  Receita Total Somada: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(
                    selectedProducts.reduce((sum, p) => sum + (parseFloat(p.receitaEstimada) || 0), 0)
                  )}
                </span>
              </div>
            </div>

            <div className="md:col-span-3 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowLaunchForm(false);
                  setEditingNegocioId(null);
                  setNewClient('');
                  setNewVolume('5000000');
                  setSelectedProducts([
                    { produtoCategoria: 'INVESTIMENTOS_XP', receitaEstimada: '50000' }
                  ]);
                  setNewSdrId('');
                  setNewAssessorId('');
                  setNewStatus('GANHO');
                  setNewOrigemCliente('ABERTURA_CONTA');
                  setNewSituacaoCliente('ATIVO_APORTANDO');
                }}
                className="px-4 py-2 border border-neutral-300 rounded-xl text-xs font-bold uppercase text-neutral-700 hover:bg-neutral-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-black hover:bg-neutral-900 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer shadow-3xs flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                {editingNegocioId ? "Salvar Alterações do Contrato" : "Gravar Negócio no Banco"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* BLOCO 9 - HISTÓRICO / HISTÓRICO DE FECHAMENTO */}
      <div className="bg-white rounded-2xl border-2 border-neutral-900 p-6 shadow-3xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h4 className="text-xs font-black uppercase text-neutral-900 tracking-wider flex items-center gap-1.5 font-display">
              <Layers className="w-4.5 h-4.5 text-black" />
              Fila Geral de Oportunidades &amp; Histórico de Fechamento
            </h4>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              Tabela geral de auditoria e exclusão direta de qualquer contrato para manter a higienização da integridade do banco.
            </p>
          </div>
        </div>

        {pacing?.negocios?.length === 0 ? (
          <div className="p-8 text-center bg-neutral-50 border border-dashed border-neutral-250 rounded-xl">
            <p className="text-xs text-neutral-400 font-medium">Nenhum contrato cadastrado na mesa. Use o botão "Registrar Novo Contrato" para iniciar.</p>
          </div>
        ) : (() => {
          const filteredNegocios = [...(pacing?.negocios || [])].filter((deal) => {
            const dealOrigem = deal.origemCliente || 'ABERTURA_CONTA';
            const dealSituacao = deal.situacaoCliente || 'ATIVO_APORTANDO';
            
            const matchOrigem = filterOrigem === 'todos' || dealOrigem === filterOrigem;
            const matchSituacao = filterSituacao === 'todos' || dealSituacao === filterSituacao;
            const matchStatus = filterStatus === 'todos' || deal.status === filterStatus;
            
            return matchOrigem && matchSituacao && matchStatus;
          });

          return (
            <div className="space-y-4">
              {/* Interactive Filters Bar */}
              <div className="bg-neutral-50 p-3.5 border border-neutral-200 rounded-xl flex flex-wrap items-center gap-4 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-neutral-500 font-black uppercase text-[9px] tracking-wider">Origem:</span>
                  <select
                    value={filterOrigem}
                    onChange={(e) => setFilterOrigem(e.target.value)}
                    className="bg-white p-1.5 px-2 border border-neutral-350 rounded-lg font-bold text-neutral-955 focus:outline-none focus:border-neutral-900"
                  >
                    <option value="todos">⭐ Todos</option>
                    <option value="ABERTURA_CONTA">🆕 Abertura de Conta</option>
                    <option value="TROCA_ASSESSORIA">🔄 Troca de Assessoria</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-neutral-500 font-black uppercase text-[9px] tracking-wider">Atividade:</span>
                  <select
                    value={filterSituacao}
                    onChange={(e) => setFilterSituacao(e.target.value)}
                    className="bg-white p-1.5 px-2 border border-neutral-350 rounded-lg font-bold text-neutral-955 focus:outline-none focus:border-neutral-900"
                  >
                    <option value="todos">⭐ Todos</option>
                    <option value="ATIVO_APORTANDO">📈 Ativo (Aportamentos)</option>
                    <option value="INATIVO_SEM_APORTES">📉 Inativo (Sem Aportes)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-neutral-500 font-black uppercase text-[9px] tracking-wider">Status:</span>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-white p-1.5 px-2 border border-neutral-350 rounded-lg font-bold text-neutral-955 focus:outline-none focus:border-neutral-900"
                  >
                    <option value="todos">⭐ Todos</option>
                    <option value="GANHO">🟩 GANHO</option>
                    <option value="EM_NEGOCIACAO">🟨 EM NEGOCIAÇÃO</option>
                    <option value="PERDIDO">🟥 PERDIDO</option>
                  </select>
                </div>

                {(filterOrigem !== 'todos' || filterSituacao !== 'todos' || filterStatus !== 'todos') && (
                  <button
                    onClick={() => {
                      setFilterOrigem('todos');
                      setFilterSituacao('todos');
                      setFilterStatus('todos');
                    }}
                    className="px-2.5 py-1 text-[10px] bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-bold uppercase transition-all cursor-pointer"
                  >
                    Limpar Filtros
                  </button>
                )}

                <div className="ml-auto text-[10.5px] font-black text-neutral-600 bg-neutral-200 px-2 py-0.5 rounded-md leading-none uppercase">
                  Total: {filteredNegocios.length} / {pacing?.negocios?.length || 0}
                </div>
              </div>

              {filteredNegocios.length === 0 ? (
                <div className="p-8 text-center bg-neutral-50 border border-dashed border-neutral-250 rounded-xl">
                  <p className="text-xs text-neutral-500 font-bold">Nenhum contrato corresponde aos filtros selecionados.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-neutral-100 border-b border-neutral-300 text-neutral-650 font-mono text-[9px] font-black uppercase">
                        <th className="p-2.5">Data Gen</th>
                        <th className="p-2.5">Cliente</th>
                        <th className="p-2.5">Origem</th>
                        <th className="p-2.5">Atividade</th>
                        <th className="p-2.5">Linha / Canal</th>
                        <th className="p-2.5 text-right">Volume</th>
                        <th className="p-2.5 text-right">Receita Est.</th>
                        <th className="p-2.5">SDR / Assessor</th>
                        <th className="p-2.5 text-center">Status</th>
                        <th className="p-2.5 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 font-mono">
                      {[...filteredNegocios].reverse().map((deal) => {
                        const createFormatted = deal.dataCriacaoLead ? deal.dataCriacaoLead.substring(0, 10).split('-').reverse().join('/') : '—';
                        const dealOrigem = deal.origemCliente || 'ABERTURA_CONTA';
                        const dealSituacao = deal.situacaoCliente || 'ATIVO_APORTANDO';
                        
                        const badgeStatus: Record<string, string> = {
                          'GANHO': 'bg-emerald-50 text-emerald-800 border-emerald-200',
                          'EM_NEGOCIACAO': 'bg-amber-50 text-amber-800 border-amber-200',
                          'PERDIDO': 'bg-red-50 text-red-800 border-red-200'
                        };

                        return (
                          <tr key={deal.id} className="hover:bg-neutral-50">
                            <td className="p-2.5 text-neutral-500 text-[10px] whitespace-nowrap">
                              {createFormatted}
                            </td>
                            <td className="p-2.5 font-sans font-bold text-neutral-900 truncate max-w-40">
                              {deal.clientName}
                            </td>
                            <td className="p-2.5">
                              <button
                                type="button"
                                onClick={() => {
                                  const nextOrigem = dealOrigem === 'TROCA_ASSESSORIA' ? 'ABERTURA_CONTA' : 'TROCA_ASSESSORIA';
                                  updateNegocio(deal.id, { origemCliente: nextOrigem });
                                }}
                                className="p-1 px-1.5 rounded text-[8px] font-black tracking-wide uppercase whitespace-nowrap select-none hover:opacity-80 active:scale-95 transition-all text-left bg-neutral-100 border border-neutral-300 text-neutral-800 cursor-pointer"
                                title="Clique para alternar a Origem do Cliente"
                              >
                                {dealOrigem === 'TROCA_ASSESSORIA' ? '🔄 Troca' : '🆕 Abertura'}
                              </button>
                            </td>
                            <td className="p-2.5">
                              <button
                                type="button"
                                onClick={() => {
                                  const nextSituacao = dealSituacao === 'INATIVO_SEM_APORTES' ? 'ATIVO_APORTANDO' : 'INATIVO_SEM_APORTES';
                                  updateNegocio(deal.id, { situacaoCliente: nextSituacao });
                                }}
                                className={`p-1 px-1.5 rounded text-[8px] font-black tracking-wide uppercase whitespace-nowrap select-none hover:opacity-80 active:scale-95 transition-all text-left cursor-pointer ${
                                  dealSituacao === 'ATIVO_APORTANDO'
                                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                                    : 'bg-red-50 border border-red-250 text-red-700'
                                }`}
                                title="Clique para alternar a Atividade do Cliente"
                              >
                                {dealSituacao === 'ATIVO_APORTANDO' ? '📈 Ativo' : '📉 Inativo'}
                              </button>
                            </td>
                            <td className="p-2.5 font-sans font-medium text-neutral-600">
                              <div className="flex flex-wrap gap-1.5 max-w-xs">
                                {deal.produtos && deal.produtos.length > 0 ? (
                                  deal.produtos.map((p: any, idx: number) => (
                                    <span key={idx} className="p-1 px-1.5 bg-neutral-100 border border-neutral-200 rounded text-neutral-800 text-[9px] uppercase font-mono tracking-tight font-extrabold leading-none" title={`Receita: R$ ${p.receitaEstimada}`}>
                                      {p.produtoCategoria}: R$ {new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(p.receitaEstimada)}
                                    </span>
                                  ))
                                ) : (
                                  <span className="p-1 px-1.5 bg-neutral-100 border border-neutral-200 rounded text-neutral-800 text-[9px] uppercase font-mono tracking-tight font-extrabold leading-none">
                                    {deal.produtoCategoria}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-2.5 text-right text-neutral-900 font-bold">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(deal.volumeFinanceiro)}
                            </td>
                            <td className="p-2.5 text-right text-indigo-750 font-black">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(deal.receitaEstimada)}
                            </td>
                            <td className="p-2.5 font-sans">
                              <div className="leading-tight">
                                <span className="text-neutral-900 font-semibold text-[10.5px] block">{deal.sdrName || 'Direto'}</span>
                                <span className="text-[9px] text-neutral-450 block font-mono">Assr: {deal.assessorName || 'Sem assessor'}</span>
                              </div>
                            </td>
                            <td className="p-2.5 text-center">
                              <span className={`inline-block p-1 px-2.5 rounded border text-[9px] font-semibold leading-none ${badgeStatus[deal.status] || 'bg-neutral-100'}`}>
                                {deal.status === 'GANHO' ? 'GANHO' : deal.status === 'PERDIDO' ? 'PERDIDO' : 'EM NEGOCIAÇÃO'}
                              </span>
                            </td>
                            <td className="p-2.5 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleStartEditNegocio(deal)}
                                  className="p-1.5 text-neutral-400 hover:text-indigo-650 hover:bg-indigo-50 rounded-lg cursor-pointer transition-all"
                                  title="Editar Contrato"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                {deletingNegocioId === deal.id ? (
                                  <div className="flex items-center gap-1 animate-fade-in pl-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        deleteNegocio(deal.id);
                                        setDeletingNegocioId(null);
                                      }}
                                      className="px-1.5 py-0.5 bg-red-600 hover:bg-red-700 text-white text-[9px] font-black uppercase rounded transition-all cursor-pointer"
                                      title="Confirmar exclusão"
                                    >
                                      Sim
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeletingNegocioId(null)}
                                      className="px-1.5 py-0.5 bg-neutral-250 hover:bg-neutral-300 text-neutral-700 text-[9px] font-black uppercase rounded transition-all cursor-pointer"
                                    >
                                      Não
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setDeletingNegocioId(deal.id)}
                                    className="p-1.5 text-neutral-400 hover:text-red-650 hover:bg-red-50 rounded-lg cursor-pointer transition-all"
                                    title="Deletar Contrato"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
};
