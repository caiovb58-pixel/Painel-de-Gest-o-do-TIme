import React, { useState } from 'react';
import { 
  Search, Download, Calendar, TrendingUp, CheckCircle, 
  AlertCircle, Phone, Target, BarChart2, ChevronDown
} from 'lucide-react';

export default function PredictiveSDRDashboard() {
  const [activeTab, setActiveTab] = useState('historico');

  // Filtros em formato de "pill"
  const filters = [
    "Tempo de Casa", "Ranking", "Efetivação", "Agendamentos", "Ligações"
  ];

  return (
    <div className="min-h-screen bg-[#121212] text-white p-4 md:p-8 font-sans selection:bg-[#7B2CBF] selection:text-white">
      
      {/* ================= CABEÇALHO (HEADER) ================= */}
      <header className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-[#8A2BE2]" />
            Painel de Controle Preditivo dos SDRs
          </h1>
          <p className="text-sm font-semibold text-gray-400 mt-1 uppercase tracking-wider">
            Mês de Referência: <span className="text-white">Junho</span>
          </p>
        </div>

        {/* Bloco Central de Destaque */}
        <div className="bg-[#1E1E1E] border border-[#2D2D2D] rounded-xl p-4 flex flex-col md:flex-row items-center gap-4 lg:max-w-2xl w-full">
          <div className="flex-1 text-sm font-medium text-gray-300">
            A equipe precisa de <strong className="text-[#8A2BE2] text-lg">114</strong> agendamentos para chegar ao resultado esperado no período.
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-[#2D2D2D] rounded-lg p-3 text-center min-w-[90px]">
              <span className="block text-xs text-gray-400 font-semibold mb-1">AGEND.</span>
              <span className="text-lg font-black text-white">450</span>
            </div>
            <div className="bg-[#2D2D2D] rounded-lg p-3 text-center min-w-[90px]">
              <span className="block text-xs text-gray-400 font-semibold mb-1">EFETIV.</span>
              <span className="text-lg font-black text-white">210</span>
            </div>
            <div className="bg-[#2D2D2D] rounded-lg p-3 text-center min-w-[90px]">
              <span className="block text-xs text-gray-400 font-semibold mb-1">CONTAS</span>
              <span className="text-lg font-black text-white">100</span>
            </div>
          </div>
        </div>
      </header>

      {/* ================= BARRA DE FILTROS E AÇÕES ================= */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 bg-[#1E1E1E] p-4 rounded-xl border border-[#2D2D2D]">
        
        {/* Busca e Pills */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Buscar por nome..."
              className="w-full pl-9 pr-3 py-2 bg-[#121212] border border-[#2D2D2D] text-sm text-white rounded-lg focus:outline-none focus:border-[#7B2CBF] transition-colors"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            {filters.map((filter) => (
              <button 
                key={filter}
                className="whitespace-nowrap px-4 py-1.5 bg-[#2D2D2D] hover:bg-[#3D3D3D] text-xs font-semibold text-gray-300 hover:text-white rounded-full transition-all"
              >
                {filter}
              </button>
            ))}
            <button className="whitespace-nowrap px-4 py-1.5 text-xs font-semibold text-gray-400 hover:text-white underline underline-offset-2 transition-all">
              Limpar filtro
            </button>
          </div>
        </div>

        {/* Ação Primária */}
        <button className="w-full md:w-auto px-6 py-2.5 bg-[#8A2BE2] hover:bg-[#7B2CBF] text-white text-sm font-bold rounded-lg shadow-[0_0_15px_rgba(138,43,226,0.3)] transition-all flex items-center justify-center gap-2">
          BAIXAR RELATÓRIO <Download className="w-4 h-4" />
        </button>
      </div>

      {/* ================= ÁREA DE CONTEÚDO PRINCIPAL ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ------ CARTÃO ESQUERDO: DETALHAMENTO DO SDR (OCUPA 2 COLUNAS) ------ */}
        <div className="lg:col-span-2 bg-[#1E1E1E] rounded-2xl border border-[#2D2D2D] overflow-hidden flex flex-col justify-between shadow-lg">
          
          <div className="p-6 md:p-8">
            {/* Header do Card do SDR */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img 
                    src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=150&h=150" 
                    alt="SDR" 
                    className="w-16 h-16 rounded-full object-cover border-2 border-[#10B981]"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-[#10B981] w-4 h-4 rounded-full border-2 border-[#1E1E1E]"></div>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Carlos Mendes</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-[#2D2D2D] text-gray-300 text-[10px] font-bold uppercase rounded">
                      Equipe PF
                    </span>
                    <span className="text-xs text-gray-500 font-medium">Admissão: 12/01/2023</span>
                    <span className="ml-2 px-2 py-0.5 bg-[#8A2BE2]/20 text-[#8A2BE2] text-[10px] font-bold uppercase rounded border border-[#8A2BE2]/50">
                      Ranking A
                    </span>
                  </div>
                </div>
              </div>
              
              <button className="flex items-center gap-2 px-4 py-2 bg-[#121212] border border-[#2D2D2D] rounded-lg text-sm font-semibold text-gray-300 hover:bg-[#2D2D2D] transition-colors">
                <Calendar className="w-4 h-4 text-[#8A2BE2]" />
                Mês Atual
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Régua de Status / Desempenho */}
            <div className="mb-10 relative">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-[#2D2D2D] -translate-y-1/2 z-0 rounded-full"></div>
              
              {/* Linha preenchida até o status atual */}
              <div className="absolute top-1/2 left-0 w-3/4 h-1 bg-gradient-to-r from-[#10B981] to-[#8A2BE2] -translate-y-1/2 z-0 rounded-full"></div>

              <div className="relative z-10 flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                <div className="flex flex-col items-center gap-2 text-gray-500">
                  <div className="w-4 h-4 rounded-full bg-[#10B981] ring-4 ring-[#1E1E1E]"></div>
                  <span>Clientes</span>
                </div>
                <div className="flex flex-col items-center gap-2 text-gray-500">
                  <div className="w-4 h-4 rounded-full bg-[#10B981] ring-4 ring-[#1E1E1E]"></div>
                  <span>Atraso na Meta</span>
                </div>
                <div className="flex flex-col items-center gap-2 text-white">
                  <div className="w-5 h-5 rounded-full bg-[#8A2BE2] ring-4 ring-[#1E1E1E] shadow-[0_0_10px_#8A2BE2]"></div>
                  <span className="text-[#8A2BE2]">Ritmo de Sucesso</span>
                </div>
                <div className="flex flex-col items-center gap-2 text-gray-600">
                  <div className="w-4 h-4 rounded-full bg-[#2D2D2D] ring-4 ring-[#1E1E1E]"></div>
                  <span>Excelente</span>
                </div>
              </div>
            </div>

            {/* Barras de Progresso Preditivo */}
            <div className="space-y-5">
              {/* Agendamentos */}
              <div>
                <div className="flex justify-between text-sm font-bold mb-1.5">
                  <span className="text-gray-300">Agendamentos</span>
                  <span className="text-white">20 <span className="text-gray-500 font-medium">/ 63</span></span>
                </div>
                <div className="w-full bg-[#121212] h-3 rounded-full overflow-hidden border border-[#2D2D2D]">
                  <div className="bg-gradient-to-r from-[#7B2CBF] to-[#3B82F6] h-full rounded-full w-[31%]"></div>
                </div>
              </div>

              {/* Efetivação */}
              <div>
                <div className="flex justify-between text-sm font-bold mb-1.5">
                  <span className="text-gray-300">Efetivação</span>
                  <span className="text-white">5 <span className="text-gray-500 font-medium">/ 13</span></span>
                </div>
                <div className="w-full bg-[#121212] h-3 rounded-full overflow-hidden border border-[#2D2D2D]">
                  <div className="bg-gradient-to-r from-[#7B2CBF] to-[#3B82F6] h-full rounded-full w-[38%]"></div>
                </div>
              </div>

              {/* Contas Abertas */}
              <div>
                <div className="flex justify-between text-sm font-bold mb-1.5">
                  <span className="text-gray-300">Contas Abertas</span>
                  <span className="text-white">4 <span className="text-gray-500 font-medium">/ 6</span></span>
                </div>
                <div className="w-full bg-[#121212] h-3 rounded-full overflow-hidden border border-[#2D2D2D]">
                  <div className="bg-gradient-to-r from-[#7B2CBF] to-[#3B82F6] h-full rounded-full w-[66%] shadow-[0_0_10px_rgba(123,44,191,0.5)]"></div>
                </div>
              </div>
            </div>

            {/* Métricas Secundárias (Mini Cards) */}
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="bg-[#121212] border border-[#2D2D2D] rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-gray-400 uppercase">Ligações Efetuadas</span>
                  <h3 className="text-2xl font-black text-white mt-1">45 <span className="text-xs font-medium text-gray-500">/ Agendamento</span></h3>
                </div>
                <Phone className="w-8 h-8 text-[#8A2BE2] opacity-30" />
              </div>

              <div className="bg-[#121212] border border-[#2D2D2D] rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-gray-400 uppercase">Taxa de Conversão</span>
                  <h3 className="text-2xl font-black text-[#10B981] mt-1">18.5%</h3>
                </div>
                <Target className="w-8 h-8 text-[#10B981] opacity-30" />
              </div>
            </div>
          </div>

          {/* Rodapé do Card (Navegação em Abas) */}
          <div className="border-t border-[#2D2D2D] bg-[#1A1A1A] px-6">
            <div className="flex gap-6">
              {['Histórico', 'Alinhamentos', 'Relação'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab.toLowerCase())}
                  className={`py-4 text-sm font-bold uppercase tracking-wider transition-colors relative ${
                    activeTab === tab.toLowerCase() 
                      ? 'text-[#8A2BE2]' 
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {tab}
                  {activeTab === tab.toLowerCase() && (
                    <span className="absolute bottom-0 left-0 w-full h-1 bg-[#8A2BE2] rounded-t-full"></span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ------ PAINEL LATERAL DIREITO (VISUALIZAÇÃO DE DADOS) ------ */}
        <div className="space-y-6 flex flex-col">
          
          {/* Gráfico de Barras */}
          <div className="bg-[#1E1E1E] rounded-2xl border border-[#2D2D2D] p-6 shadow-lg">
            <h3 className="text-sm font-bold text-gray-300 uppercase mb-6 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-[#8A2BE2]" /> Comparativo de Produção
            </h3>
            
            <div className="relative h-48 flex items-end justify-around pb-6 border-b border-[#2D2D2D]">
              {/* Linhas de grade de fundo (Mock) */}
              <div className="absolute top-0 left-0 w-full flex flex-col justify-between h-full pb-6 z-0 pointer-events-none">
                <div className="border-b border-[#2D2D2D] w-full h-0 opacity-50 relative"><span className="absolute -top-2 -left-6 text-[9px] text-gray-600">120</span></div>
                <div className="border-b border-[#2D2D2D] w-full h-0 opacity-50 relative"><span className="absolute -top-2 -left-6 text-[9px] text-gray-600">80</span></div>
                <div className="border-b border-[#2D2D2D] w-full h-0 opacity-50 relative"><span className="absolute -top-2 -left-4 text-[9px] text-gray-600">40</span></div>
                <div className="border-b border-[#2D2D2D] w-full h-0 opacity-50 relative"><span className="absolute -top-2 -left-4 text-[9px] text-gray-600">0</span></div>
              </div>

              {/* Barras do Gráfico */}
              <div className="relative z-10 flex flex-col items-center gap-2 group">
                <div className="w-8 md:w-12 bg-gradient-to-t from-[#8A2BE2] to-[#3B82F6] rounded-t-md h-[80%] transition-all duration-300 group-hover:opacity-80"></div>
                <span className="text-[10px] font-bold text-gray-400 absolute -bottom-5">AGEND.</span>
              </div>
              
              <div className="relative z-10 flex flex-col items-center gap-2 group">
                <div className="w-8 md:w-12 bg-gradient-to-t from-[#10B981] to-[#34D399] rounded-t-md h-[40%] transition-all duration-300 group-hover:opacity-80"></div>
                <span className="text-[10px] font-bold text-gray-400 absolute -bottom-5">EFETIV.</span>
              </div>
              
              <div className="relative z-10 flex flex-col items-center gap-2 group">
                <div className="w-8 md:w-12 bg-gradient-to-t from-[#F59E0B] to-[#FBBF24] rounded-t-md h-[20%] transition-all duration-300 group-hover:opacity-80"></div>
                <span className="text-[10px] font-bold text-gray-400 absolute -bottom-5">CONTAS</span>
              </div>
            </div>
          </div>

          {/* Mini-card de Visão Rápida */}
          <div className="bg-[#1E1E1E] rounded-2xl border border-[#2D2D2D] p-6 shadow-lg flex-1 flex flex-col justify-center relative overflow-hidden">
            {/* Decoração de fundo sutil */}
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#8A2BE2] blur-[80px] opacity-20 rounded-full pointer-events-none"></div>

            <div className="flex items-center gap-3 mb-6">
              <img 
                src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=64&h=64" 
                alt="Carlos" 
                className="w-10 h-10 rounded-full object-cover border border-[#2D2D2D]"
              />
              <div>
                <h4 className="text-sm font-bold text-white">Resumo: Carlos M.</h4>
                <p className="text-xs text-gray-400">Análise Preditiva Média</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-[#121212] rounded-lg p-3 border border-[#2D2D2D] flex justify-between items-center">
                <span className="text-xs text-gray-400 font-semibold">Projeção Efetivação</span>
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#EF4444]">
                  <AlertCircle className="w-3.5 h-3.5" /> -12% vs Meta
                </div>
              </div>
              
              <div className="bg-[#121212] rounded-lg p-3 border border-[#2D2D2D] flex justify-between items-center">
                <span className="text-xs text-gray-400 font-semibold">Ritmo Agendamentos</span>
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#10B981]">
                  <CheckCircle className="w-3.5 h-3.5" /> +5% vs Meta
                </div>
              </div>
              
              <div className="bg-[#121212] rounded-lg p-3 border border-[#2D2D2D] flex justify-between items-center">
                <span className="text-xs text-gray-400 font-semibold">Custo por Aquisição (CAC)</span>
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  Excelente
                </div>
              </div>
            </div>
            
            <button className="mt-5 w-full py-2.5 bg-[#2D2D2D] hover:bg-[#3D3D3D] text-xs font-bold text-white rounded-lg transition-colors border border-[#404040]">
              VER ANÁLISE COMPLETA
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
