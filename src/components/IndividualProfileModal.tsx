import React, { useState, useRef } from 'react';
import { 
  X, User, Phone, Calendar, Briefcase, TrendingUp, Award, 
  Shield, CheckCircle2, Clock, FileText, Upload, Camera, 
  Trash2, Check, DollarSign, BarChart2, Star, Link, ArrowRight
} from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { SDR, Assessor, AuditLog, OneOnOneLog, NegocioFechado } from '../types';

interface IndividualProfileModalProps {
  entityType: 'sdr' | 'assessor' | 'consultor';
  entityId: string;
  onClose: () => void;
}

export function IndividualProfileModal({ entityType, entityId, onClose }: IndividualProfileModalProps) {
  const { 
    sdrs, 
    assessores, 
    matches, 
    auditLogs, 
    oneOnOneLogs, 
    negocios, 
    updateSDR, 
    updateAssessor,
    currentMonth
  } = useAppStore();

  const [activeSubTab, setActiveSubTab] = useState<'resumo' | 'historico_metas' | 'negocios' | 'auditorias'>('resumo');
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse SDR or Assessor
  const sdr = entityType === 'sdr' ? sdrs.find(s => s.id === entityId) : null;
  const assessor = (entityType === 'assessor' || entityType === 'consultor') 
    ? assessores.find(a => a.id === entityId) 
    : null;

  if (!sdr && !assessor) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center shadow-2xl border border-neutral-100">
          <p className="text-neutral-500 font-bold">Profissional não encontrado ou excluído.</p>
          <button 
            onClick={onClose} 
            className="mt-4 px-4 py-2 bg-black text-white text-xs font-bold rounded-lg cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  const name = sdr ? sdr.name : assessor!.name;
  const active = sdr ? sdr.active : assessor!.active;
  const team = sdr ? sdr.team : assessor!.team;
  const admissionDate = sdr ? sdr.admissionDate : assessor!.admissionDate;
  const professionalProfile = sdr ? sdr.professionalProfile : assessor!.professionalProfile;
  const photo = sdr ? sdr.photo : assessor!.photo;

  // Handles standard base64 image uploading
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg("A imagem deve ter no máximo 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (sdr) {
        updateSDR(sdr.id, { photo: base64String });
      } else if (assessor) {
        updateAssessor(assessor.id, { photo: base64String });
      }
      setErrorMsg('');
    };
    reader.onerror = () => {
      setErrorMsg("Ocorreu um erro ao carregar a imagem.");
    };
    reader.readAsDataURL(file);
  };

  const handleApplyPhotoUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoUrlInput.trim()) return;

    if (sdr) {
      updateSDR(sdr.id, { photo: photoUrlInput.trim() });
    } else if (assessor) {
      updateAssessor(assessor.id, { photo: photoUrlInput.trim() });
    }
    setPhotoUrlInput('');
    setErrorMsg('');
  };

  const handleRemovePhoto = () => {
    if (sdr) {
      updateSDR(sdr.id, { photo: undefined });
    } else if (assessor) {
      updateAssessor(assessor.id, { photo: undefined });
    }
    setErrorMsg('');
  };

  // Helper formatting dates safely
  const formatDateString = (dt?: string) => {
    if (!dt) return 'Não informada';
    try {
      return new Date(dt + 'T12:00:00').toLocaleDateString('pt-BR');
    } catch {
      return dt;
    }
  };

  // SDR-specific calculations and lists
  const sdrAuditLogs = sdr ? auditLogs.filter(log => log.sdrId === sdr.id) : [];
  const sdrOneOnOnes = sdr ? oneOnOneLogs.filter(log => log.sdrId === sdr.id) : [];
  const sdrNegocios = sdr ? negocios.filter(n => n.sdrId === sdr.id) : [];
  const sdrMatches = sdr ? matches.filter(m => m.sdrId === sdr.id) : [];

  // Assessor-specific calculations and lists
  const assessorNegocios = assessor ? negocios.filter(n => n.assessorId === assessor.id) : [];
  const assessorMatches = assessor ? matches.filter(m => m.assessorId === assessor.id) : [];

  // SDR active month calculations
  const sdrActiveRecord = sdr?.monthlyRecords?.[currentMonth] || {
    agendamentosCount: sdr?.agendamentosCount || 0,
    efetivacoesCount: sdr?.efetivacoesCount || 0,
    contasAbertasCount: sdr?.contasAbertasCount || 0,
    callsCount: sdr?.callsCount || 0,
    metaAgendamentos: sdr?.metaAgendamentos || 20,
    metaEfetivacaoRate: sdr?.metaEfetivacaoRate || 50,
    metaEfetivacoes: sdr?.metaEfetivacoes || 10,
    metaContasAbertas: sdr?.metaContasAbertas || 5,
  };

  const sdrAgendados = sdrActiveRecord.agendamentosCount || 0;
  const sdrEfetivados = sdrActiveRecord.efetivacoesCount || 0;
  const sdrContas = sdrActiveRecord.contasAbertasCount || 0;
  const sdrCalls = sdrActiveRecord.callsCount || 0;

  const sdrMetaAgendados = sdrActiveRecord.metaAgendamentos || 20;
  const sdrMetaEfetivados = sdrActiveRecord.metaEfetivacoes || 10;
  const sdrMetaContas = sdrActiveRecord.metaContasAbertas || 5;

  const sdrPacingAgendados = sdrMetaAgendados > 0 ? (sdrAgendados / sdrMetaAgendados) * 100 : 0;
  const sdrPacingEfetivados = sdrMetaEfetivados > 0 ? (sdrEfetivados / sdrMetaEfetivados) * 100 : 0;
  const sdrPacingContas = sdrMetaContas > 0 ? (sdrContas / sdrMetaContas) * 100 : 0;

  const sdrEfetivacaoRateReal = sdrAgendados > 0 ? (sdrEfetivados / sdrAgendados) * 100 : 0;

  // Format currencies
  const formatBRL = (val?: number) => {
    if (val === undefined || isNaN(val)) return 'R$ 0,00';
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-[4px] z-50 flex items-center justify-end p-0 sm:p-4 animate-fade-in">
      <div className="w-full sm:max-w-4xl h-full sm:h-[92vh] bg-neutral-50 rounded-none sm:rounded-2xl shadow-2xl border-none sm:border border-neutral-200 flex flex-col overflow-hidden">
        
        {/* Header Bar */}
        <div className="px-6 py-4 bg-white border-b border-neutral-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 bg-neutral-100 border border-neutral-200 rounded text-[9.5px] font-black uppercase tracking-wider text-neutral-500">
              Ficha Individual
            </span>
            <span className={`p-1 px-2 text-[9.5px] font-black uppercase tracking-wider rounded ${
              entityType === 'sdr' 
                ? 'bg-purple-50 text-purple-700 border border-purple-200' 
                : entityType === 'consultor' 
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              {entityType === 'sdr' ? 'SDR' : entityType === 'consultor' ? 'Consultor' : 'Assessor'}
            </span>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-500 hover:text-black transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body Scrollable Area */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-neutral-50">
          
          {/* Main Professional Identity Block */}
          <div className="p-6 bg-white border-b border-neutral-150 flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left">
            
            {/* Visual Avatar Container with Custom Photo & base64 Action hooks */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 rounded-2xl bg-neutral-100 border-2 border-neutral-300 overflow-hidden shadow-md flex items-center justify-center relative">
                {photo ? (
                  <img src={photo} alt={name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-neutral-400">
                    <User className="w-10 h-10 stroke-[1.5]" />
                    <span className="text-[10px] font-black uppercase tracking-wider mt-1 text-center font-mono">
                      {name.substring(0, 2)}
                    </span>
                  </div>
                )}

                {/* Overlaid upload trigger */}
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[9px] font-black uppercase tracking-wider cursor-pointer font-mono"
                >
                  <Camera className="w-5 h-5 mb-1 text-white" />
                  Mudar Foto
                </button>
              </div>

              {/* Photo Options actions bar */}
              <div className="flex justify-center mt-2.5 gap-2">
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[9.5px] font-black uppercase text-neutral-500 hover:text-black hover:underline cursor-pointer flex items-center gap-1 leading-none"
                >
                  <Upload className="w-3.5 h-3.5" /> Enviar Arquivo
                </button>
                {photo && (
                  <button 
                    type="button"
                    onClick={handleRemovePhoto}
                    className="text-[9.5px] font-black uppercase text-red-500 hover:text-red-700 hover:underline cursor-pointer flex items-center gap-1 leading-none border-l border-neutral-300 pl-2"
                  >
                    Excluir
                  </button>
                )}
              </div>

              {/* Input file handler hidden hook */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handlePhotoUpload} 
                accept="image/*" 
                className="hidden" 
              />
            </div>

            {/* General Identity Details Block */}
            <div className="flex-1 space-y-3">
              <div>
                <div className="flex items-center gap-2.5 justify-center md:justify-start">
                  <h2 className="text-xl md:text-2xl font-extrabold text-neutral-900 tracking-tight leading-none">
                    {name}
                  </h2>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                    active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-neutral-100 text-neutral-400 border border-neutral-200'
                  }`}>
                    {active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                
                <p className="text-xs text-neutral-500 font-mono tracking-wide uppercase font-black mt-1.5">
                  {team || 'Sem Equipe Atribuída'} &bull; Desde {formatDateString(admissionDate)}
                </p>
              </div>

              {/* Badges profiling tags */}
              <div className="flex flex-wrap gap-2 justify-center md:justify-start items-center">
                {professionalProfile && (
                  <span className="text-[10px] uppercase font-black px-2.5 py-1 rounded bg-neutral-100 border border-neutral-200 text-neutral-600">
                    Perfil: {professionalProfile === 'gestao' ? '🛡️ Gestão/Líder' : professionalProfile === 'analitico' ? '📊 Analítico' : professionalProfile === 'operacional' ? '⚙️ Operacional' : '⚡ Comercial'}
                  </span>
                )}
                {sdr && (
                  <span className="text-[10px] uppercase font-black px-2.5 py-1 rounded bg-purple-50 border border-purple-150 text-purple-700">
                    SDR Team Leader Align
                  </span>
                )}
                {assessor && (
                  <span className="text-[10px] uppercase font-black px-2.5 py-1 rounded bg-amber-50 border border-amber-150 text-amber-700">
                    {assessor.agendaLink ? '📅 Agenda Conectada' : '⚠️ Sem Link de Agenda'}
                  </span>
                )}
              </div>

              {/* URL photo quick form helper */}
              <form onSubmit={handleApplyPhotoUrl} className="flex gap-2 max-w-sm mt-3 pt-2 border-t border-neutral-100/80 mx-auto md:mx-0">
                <input 
                  type="url" 
                  placeholder="Ou insira um Link de foto/avatar..."
                  value={photoUrlInput}
                  onChange={e => setPhotoUrlInput(e.target.value)}
                  className="flex-1 px-2.5 py-1 text-[10.5px] border border-neutral-300 rounded bg-neutral-50 text-neutral-800 placeholder-neutral-450 focus:outline-none focus:ring-1 focus:ring-black"
                />
                <button 
                  type="submit" 
                  className="px-2.5 py-1 bg-black text-white text-[9.5px] font-black uppercase rounded hover:bg-neutral-800 shrink-0 cursor-pointer"
                >
                  Ok
                </button>
              </form>
              {errorMsg && <p className="text-[10px] text-red-500 font-semibold">{errorMsg}</p>}
            </div>

          </div>

          {/* Sub Tab Navigation bar */}
          <div className="px-6 bg-white border-b border-neutral-200 shrink-0 flex gap-4 overflow-x-auto scrollbar-none">
            <button 
              type="button"
              onClick={() => setActiveSubTab('resumo')}
              className={`py-3.5 border-b-2 font-mono text-xs uppercase font-black tracking-wide shrink-0 transition-all ${
                activeSubTab === 'resumo'
                  ? 'border-black text-black'
                  : 'border-transparent text-neutral-400 hover:text-neutral-700'
              }`}
            >
              📊 Resumo & Números Atuais
            </button>
            
            {sdr && (
              <button 
                type="button"
                onClick={() => setActiveSubTab('historico_metas')}
                className={`py-3.5 border-b-2 font-mono text-xs uppercase font-black tracking-wide shrink-0 transition-all ${
                  activeSubTab === 'historico_metas'
                    ? 'border-black text-black'
                    : 'border-transparent text-neutral-400 hover:text-neutral-700'
                }`}
              >
                📅 Metas Mensais
              </button>
            )}

            <button 
              type="button"
              onClick={() => setActiveSubTab('negocios')}
              className={`py-3.5 border-b-2 font-mono text-xs uppercase font-black tracking-wide shrink-0 transition-all ${
                activeSubTab === 'negocios'
                  ? 'border-black text-black'
                  : 'border-transparent text-neutral-400 hover:text-neutral-700'
              }`}
            >
              🏆 Clientes & Contratos ({sdr ? sdrNegocios.length : assessorNegocios.length})
            </button>

            {sdr && (
              <button 
                type="button"
                onClick={() => setActiveSubTab('auditorias')}
                className={`py-3.5 border-b-2 font-mono text-xs uppercase font-black tracking-wide shrink-0 transition-all ${
                  activeSubTab === 'auditorias'
                    ? 'border-black text-black'
                    : 'border-transparent text-neutral-400 hover:text-neutral-700'
                }`}
              >
                📋 Auditorias & 1On1s ({sdrAuditLogs.length + sdrOneOnOnes.length})
              </button>
            )}
          </div>

          {/* Details sections representation container */}
          <div className="p-6">
            
            {/* SUB TAB 1: CURRENT MONTH METRICS & VISUAL CARDS */}
            {activeSubTab === 'resumo' && (
              <div className="space-y-6">
                
                {/* SDR MONTH METRICS DETAILED CARDS */}
                {sdr && (
                  <div>
                    <h3 className="text-xs uppercase font-black text-neutral-450 tracking-wider font-mono mb-3">
                      Performance Operacional - Referência {currentMonth}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      
                      {/* Agendamentos */}
                      <div className="bg-white p-4 rounded-xl border border-neutral-200">
                        <div className="flex justify-between items-center text-neutral-400 mb-1">
                          <span className="text-[10px] font-black uppercase font-mono tracking-wider">Agendamentos</span>
                          <Calendar className="w-4 h-4 text-neutral-400" />
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-neutral-900">{sdrAgendados}</span>
                          <span className="text-xs text-neutral-450">/ {sdrMetaAgendados} meta</span>
                        </div>
                        <div className="mt-3">
                          <div className="flex justify-between text-[10px] font-bold text-neutral-500 mb-1">
                            <span>Atingimento</span>
                            <span>{sdrPacingAgendados.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-purple-600 h-full rounded-full transition-all" 
                              style={{ width: `${Math.min(sdrPacingAgendados, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Efetivações */}
                      <div className="bg-white p-4 rounded-xl border border-neutral-200">
                        <div className="flex justify-between items-center text-neutral-400 mb-1">
                          <span className="text-[10px] font-black uppercase font-mono tracking-wider">Efetivações</span>
                          <CheckCircle2 className="w-4 h-4 text-neutral-400" />
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-neutral-900">{sdrEfetivados}</span>
                          <span className="text-xs text-neutral-450">/ {sdrMetaEfetivados} meta</span>
                        </div>
                        <div className="mt-3">
                          <div className="flex justify-between text-[10px] font-bold text-neutral-500 mb-1">
                            <span>Atingimento</span>
                            <span>{sdrPacingEfetivados.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-emerald-600 h-full rounded-full transition-all" 
                              style={{ width: `${Math.min(sdrPacingEfetivados, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Contas Abertas */}
                      <div className="bg-white p-4 rounded-xl border border-neutral-200">
                        <div className="flex justify-between items-center text-neutral-400 mb-1">
                          <span className="text-[10px] font-black uppercase font-mono tracking-wider">Contas Abertas</span>
                          <Award className="w-4 h-4 text-neutral-400" />
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-neutral-900">{sdrContas}</span>
                          <span className="text-xs text-neutral-450">/ {sdrMetaContas} meta</span>
                        </div>
                        <div className="mt-3">
                          <div className="flex justify-between text-[10px] font-bold text-neutral-500 mb-1">
                            <span>Atingimento</span>
                            <span>{sdrPacingContas.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-blue-600 h-full rounded-full transition-all" 
                              style={{ width: `${Math.min(sdrPacingContas, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* SDR Additional current month info box */}
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-xl border border-neutral-200 flex justify-between items-center">
                        <div>
                          <p className="text-[10px] font-mono font-black uppercase text-neutral-450 tracking-wider">Ligações Efetuadas</p>
                          <p className="text-lg font-black text-neutral-900 mt-1">{sdrCalls} contatos</p>
                        </div>
                        <Phone className="w-5 h-5 text-neutral-300" />
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-neutral-200 flex justify-between items-center">
                        <div>
                          <p className="text-[10px] font-mono font-black uppercase text-neutral-450 tracking-wider">Conversão de Reunião</p>
                          <p className="text-lg font-black text-neutral-900 mt-1">{sdrEfetivacaoRateReal.toFixed(1)}%</p>
                        </div>
                        <TrendingUp className="w-5 h-5 text-neutral-300" />
                      </div>
                    </div>
                  </div>
                )}

                {/* ASSESSOR/CONSULTOR CURRENT MONTH TARGET METRICS */}
                {assessor && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xs uppercase font-black text-neutral-450 tracking-wider font-mono mb-3">
                        Metas Globais vs Realizado Atual (Mês Corrente)
                      </h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        
                        {/* Ligações Metas */}
                        <div className="bg-white p-4 rounded-xl border border-neutral-200">
                          <p className="text-[10.5px] font-mono font-black uppercase text-neutral-450">Ligações</p>
                          <div className="flex items-baseline gap-1.5 mt-1.5">
                            <span className="text-xl font-bold">{assessor.realizadoLigacoes || 0}</span>
                            <span className="text-xs text-neutral-400">/ {assessor.metaLigacoes || 0}</span>
                          </div>
                          <div className="w-full bg-neutral-100 h-1.5 rounded-full mt-3 overflow-hidden">
                            <div 
                              className="bg-neutral-800 h-full rounded-full"
                              style={{ width: `${Math.min(assessor.metaLigacoes && assessor.metaLigacoes > 0 ? ((assessor.realizadoLigacoes || 0) / assessor.metaLigacoes) * 100 : 0, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Reuniões Realizadas Metas */}
                        <div className="bg-white p-4 rounded-xl border border-neutral-200">
                          <p className="text-[10.5px] font-mono font-black uppercase text-neutral-450">Reuniões Realizadas</p>
                          <div className="flex items-baseline gap-1.5 mt-1.5">
                            <span className="text-xl font-bold">{assessor.realizadoReunioesRealizadas || 0}</span>
                            <span className="text-xs text-neutral-400">/ {assessor.metaReunioesRealizadas || 0}</span>
                          </div>
                          <div className="w-full bg-neutral-100 h-1.5 rounded-full mt-3 overflow-hidden">
                            <div 
                              className="bg-amber-600 h-full rounded-full"
                              style={{ width: `${Math.min(assessor.metaReunioesRealizadas && assessor.metaReunioesRealizadas > 0 ? ((assessor.realizadoReunioesRealizadas || 0) / assessor.metaReunioesRealizadas) * 100 : 0, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Captação Net */ }
                        <div className="bg-white p-4 rounded-xl border border-neutral-200">
                          <p className="text-[10.5px] font-mono font-black uppercase text-neutral-450">Captação Líquida (NET)</p>
                          <div className="flex items-baseline gap-1.5 mt-1.5">
                            <span className="text-lg font-black text-neutral-900">{formatBRL(assessor.realizadoNet || 0)}</span>
                          </div>
                          <span className="text-[10.5px] text-neutral-450">Meta: {formatBRL(assessor.metaNet || 0)}</span>
                        </div>

                      </div>

                      {/* Other supplementary metrics */}
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div className="bg-neutral-100 p-3 rounded-lg border border-neutral-200 text-center">
                          <span className="text-[9.5px] font-mono uppercase text-neutral-500 block">Reun. Agendadas</span>
                          <span className="text-md font-bold text-neutral-800">{assessor.realizadoReunioesAgendadas || 0} / {assessor.metaReunioesAgendadas || 0}</span>
                        </div>
                        <div className="bg-neutral-100 p-3 rounded-lg border border-neutral-200 text-center">
                          <span className="text-[9.5px] font-mono uppercase text-neutral-500 block">Contas Novas</span>
                          <span className="text-md font-bold text-neutral-800">{assessor.realizadoContasAbertas || 0} / {assessor.metaContasAbertas || 0}</span>
                        </div>
                        <div className="bg-neutral-100 p-3 rounded-lg border border-neutral-200 text-center">
                          <span className="text-[9.5px] font-mono uppercase text-neutral-500 block">Captação Inbound</span>
                          <span className="text-md font-bold text-neutral-800">{formatBRL(assessor.captacaoMes || 0)}</span>
                        </div>
                        <div className="bg-neutral-100 p-3 rounded-lg border border-neutral-200 text-center">
                          <span className="text-[9.5px] font-mono uppercase text-neutral-500 block">Qtd. Cross-Sell</span>
                          <span className="text-md font-bold text-neutral-800">{assessor.realizadoCrossSell || 0} / {assessor.metaCrossSell || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Detailed Product Cross-Sell Breakdown */}
                    <div>
                      <h4 className="text-xs uppercase font-black text-neutral-450 tracking-wider font-mono mb-3">
                        Breakdown de Cross-Sell por Vertical de Produto
                      </h4>
                      <div className="bg-white p-5 rounded-xl border border-neutral-200 overflow-hidden">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                          
                          {/* Segmento 1 */}
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between text-xs font-semibold text-neutral-700">
                                <span>🛡️ Seguros de Vida</span>
                                <span>{assessor.crossSellSeguroRealizado || 0} / {assessor.crossSellSeguroMeta || 0}</span>
                              </div>
                              <div className="w-full bg-neutral-100 h-1 rounded-full mt-1.5 overflow-hidden">
                                <div className="bg-blue-600 h-full" style={{ width: `${Math.min(assessor.crossSellSeguroMeta ? ((assessor.crossSellSeguroRealizado || 0) / assessor.crossSellSeguroMeta) * 100 : 0, 100)}%` }} />
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-xs font-semibold text-neutral-700">
                                <span>🏘️ Consórcios</span>
                                <span>{assessor.crossSellConsorcioRealizado || 0} / {assessor.crossSellConsorcioMeta || 0}</span>
                              </div>
                              <div className="w-full bg-neutral-100 h-1 rounded-full mt-1.5 overflow-hidden">
                                <div className="bg-amber-600 h-full" style={{ width: `${Math.min(assessor.crossSellConsorcioMeta ? ((assessor.crossSellConsorcioRealizado || 0) / assessor.crossSellConsorcioMeta) * 100 : 0, 100)}%` }} />
                              </div>
                            </div>
                          </div>

                          {/* Segmento 2 */}
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between text-xs font-semibold text-neutral-700">
                                <span>📊 Câmbio</span>
                                <span>{assessor.crossSellCambioRealizado || 0} / {assessor.crossSellCambioMeta || 0}</span>
                              </div>
                              <div className="w-full bg-neutral-100 h-1 rounded-full mt-1.5 overflow-hidden">
                                <div className="bg-emerald-600 h-full" style={{ width: `${Math.min(assessor.crossSellCambioMeta ? ((assessor.crossSellCambioRealizado || 0) / assessor.crossSellCambioMeta) * 100 : 0, 100)}%` }} />
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-xs font-semibold text-neutral-700">
                                <span>🏢 Contabilidade</span>
                                <span>{assessor.crossSellContabilidadeRealizado || 0} / {assessor.crossSellContabilidadeMeta || 0}</span>
                              </div>
                              <div className="w-full bg-neutral-100 h-1 rounded-full mt-1.5 overflow-hidden">
                                <div className="bg-indigo-600 h-full" style={{ width: `${Math.min(assessor.crossSellContabilidadeMeta ? ((assessor.crossSellContabilidadeRealizado || 0) / assessor.crossSellContabilidadeMeta) * 100 : 0, 100)}%` }} />
                              </div>
                            </div>
                          </div>

                          {/* Segmento 3 */}
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between text-xs font-semibold text-neutral-700">
                                <span>❤️ Planos de Saúde</span>
                                <span>{assessor.crossSellPlanoSaudeRealizado || 0} / {assessor.crossSellPlanoSaudeMeta || 0}</span>
                              </div>
                              <div className="w-full bg-neutral-100 h-1 rounded-full mt-1.5 overflow-hidden">
                                <div className="bg-red-500 h-full" style={{ width: `${Math.min(assessor.crossSellPlanoSaudeMeta ? ((assessor.crossSellPlanoSaudeRealizado || 0) / assessor.crossSellPlanoSaudeMeta) * 150 : 0, 100)}%` }} />
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-xs font-semibold text-neutral-700">
                                <span>📁 Outros Produtos</span>
                                <span>{assessor.crossSellOutrosRealizado || 0} / {assessor.crossSellOutrosMeta || 0}</span>
                              </div>
                              <div className="w-full bg-neutral-105 h-1 rounded-full mt-1.5 overflow-hidden">
                                <div className="bg-neutral-500 h-full" style={{ width: `${Math.min(assessor.crossSellOutrosMeta ? ((assessor.crossSellOutrosRealizado || 0) / assessor.crossSellOutrosMeta) * 100 : 0, 100)}%` }} />
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SHARED ROTATION MATCH HISTORY SUBSECTION */}
                <div>
                  <h3 className="text-xs uppercase font-black text-neutral-450 tracking-wider font-mono mb-3">
                    Relacionamentos Correntes no Rodízio / Célula
                  </h3>
                  <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden divide-y divide-neutral-100">
                    {sdr && (
                      sdrMatches.length > 0 ? (
                        sdrMatches.map((m, idx) => (
                          <div key={idx} className="p-3.5 flex items-center justify-between text-xs font-semibold text-neutral-700">
                            <span className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                              Parceiro Assessor: <strong className="text-black font-black">{m.assessorName}</strong>
                            </span>
                            <span className="text-neutral-400 text-[10px] font-mono uppercase font-bold">
                              {m.startDate && m.endDate ? `${formatDateString(m.startDate)} até ${formatDateString(m.endDate)}` : 'Vigência Mensal'}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-neutral-400 text-xs font-semibold">
                          Nenhum assessor específico mapeado ativamente neste rodízio. O SDR está em rotação livre.
                        </div>
                      )
                    )}

                    {assessor && (
                      assessorMatches.length > 0 ? (
                        assessorMatches.map((m, idx) => (
                          <div key={idx} className="p-3.5 flex items-center justify-between text-xs font-semibold text-neutral-700">
                            <span className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
                              SDR Atribuído no Turno: <strong className="text-black font-black">{m.sdrName}</strong>
                            </span>
                            <span className="text-neutral-400 text-[10px] font-mono uppercase font-bold">
                              Conversão SDR: {m.sdrConversionRate || 0}%
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-neutral-400 text-xs font-semibold">
                          Nenhum SDR exclusivo ou pareado neste mês.
                        </div>
                      )
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* SUB TAB 2: METRICS MONTH-BY-MONTH HISTORY */}
            {activeSubTab === 'historico_metas' && sdr && (
              <div className="space-y-4">
                <h3 className="text-xs uppercase font-black text-neutral-450 tracking-wider font-mono">
                  Histórico de Metas e Entregas Consolidado por Mês
                </h3>
                
                {sdr.monthlyRecords && Object.keys(sdr.monthlyRecords).length > 0 ? (
                  <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden divide-y divide-neutral-100">
                    {Object.entries(sdr.monthlyRecords).map(([month, rec]) => {
                      const bookings = rec.agendamentosCount || 0;
                      const goal = rec.metaAgendamentos || 20;
                      const conversion = goal > 0 ? (bookings / goal) * 100 : 0;
                      
                      return (
                        <div key={month} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                          <div>
                            <span className="text-xs uppercase font-black tracking-wider text-black bg-neutral-100 px-2 py-0.5 rounded font-mono">
                              {month}
                            </span>
                            <div className="flex gap-4 mt-2 text-[11px] font-semibold text-neutral-600">
                              <span>📅 Agendamentos: <strong className="text-neutral-800">{bookings} / {goal}</strong></span>
                              <span>🏆 Efetivações: <strong className="text-neutral-800">{rec.efetivacoesCount || 0}</strong></span>
                              <span>📞 Ligações: <strong className="text-neutral-800">{rec.callsCount || 0}</strong></span>
                            </div>
                          </div>
                          
                          <div className="shrink-0 text-right">
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                              conversion >= 100 
                                ? 'bg-emerald-50 text-emerald-800' 
                                : conversion >= 50 
                                ? 'bg-orange-50 text-orange-850' 
                                : 'bg-red-50 text-red-800'
                            }`}>
                              Atingimento: {conversion.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-white p-6 rounded-xl border border-neutral-200 text-center text-neutral-400 text-xs font-semibold">
                    Nenhum registro de meses passados gravado no histórico deste SDR.
                  </div>
                )}
              </div>
            )}

            {/* SUB TAB 3: CLOSED WON DEALS (NEGOCIOS) LIST */}
            {activeSubTab === 'negocios' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs uppercase font-black text-neutral-450 tracking-wider font-mono">
                    Histórico de Negócios e Contas Fechadas Ganhos
                  </h3>
                  <span className="text-[10.5px] font-mono text-neutral-500 font-semibold uppercase">
                    Volume Total: {formatBRL((sdr ? sdrNegocios : assessorNegocios).filter(n => n.status === 'GANHO').reduce((acc, curr) => acc + (curr.volumeFinanceiro || 0), 0))}
                  </span>
                </div>

                {(sdr ? sdrNegocios : assessorNegocios).length > 0 ? (
                  <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden divide-y divide-neutral-100">
                    {(sdr ? sdrNegocios : assessorNegocios).map((neg) => (
                      <div key={neg.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-xs text-neutral-900">{neg.clientName}</h4>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                              neg.status === 'GANHO' ? 'bg-emerald-100 text-emerald-800' : neg.status === 'PERDIDO' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {neg.status}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap gap-x-4 text-[10.5px] font-semibold text-neutral-500">
                            <span>Tipo: <strong className="text-neutral-700">{neg.produtoCategoria.replace(/_/g, ' ')}</strong></span>
                            {sdr && neg.assessorName && <span>Assessor: <strong className="text-neutral-700">{neg.assessorName}</strong></span>}
                            {assessor && neg.sdrName && <span>SDR: <strong className="text-neutral-700">{neg.sdrName}</strong></span>}
                            <span>Data: <strong className="text-neutral-700 font-mono">{formatDateString(neg.dataFechamento)}</strong></span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-xs font-black text-neutral-900">{formatBRL(neg.volumeFinanceiro)}</p>
                          <p className="text-[10px] font-semibold text-neutral-400">Receita: {formatBRL(neg.receitaEstimada)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white p-6 rounded-xl border border-neutral-200 text-center text-neutral-400 text-xs font-semibold">
                    Nenhum negócio comercial concluído e cadastrado para este profissional.
                  </div>
                )}
              </div>
            )}

            {/* SUB TAB 4: AUDIT EVALUATION SCORE LOGS & ONES */}
            {activeSubTab === 'auditorias' && sdr && (
              <div className="space-y-6">
                
                {/* 1On1 Session checklist and Action Plans */}
                <div>
                  <h3 className="text-xs uppercase font-black text-neutral-450 tracking-wider font-mono mb-3">
                    Histórico de Reuniões 1on1 & Planos de Ação Mapeados
                  </h3>
                  
                  {sdrOneOnOnes.length > 0 ? (
                    <div className="space-y-3.5">
                      {sdrOneOnOnes.map((o) => (
                        <div key={o.id} className="bg-white p-4 rounded-xl border border-neutral-200 space-y-3 shadow-sm">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase font-mono ${
                                  o.status === 'OUTLIER' 
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-250' 
                                    : o.status === 'EM_RISCO' 
                                    ? 'bg-red-50 text-red-700 border border-red-250' 
                                    : 'bg-yellow-50 text-yellow-750 border border-yellow-250'
                                }`}>
                                  Status: {o.status.replace(/_/g, ' ')}
                                </span>
                                <span className="text-[10.5px] font-bold text-neutral-400">
                                  Líder: {o.leader}
                                </span>
                              </div>
                              <p className="text-xs font-black text-neutral-800 mt-2">
                                Plano de Ação Mapeado:
                              </p>
                              <p className="text-[11px] font-medium text-neutral-600 mt-1 bg-neutral-50 p-2.5 rounded border border-neutral-100">
                                {o.actionPlan}
                              </p>
                            </div>
                            
                            <div className="shrink-0 text-right font-mono text-[9px] uppercase font-black text-neutral-400">
                              <span>Realizado: {formatDateString(o.timestamp.split('T')[0])}</span>
                              {o.nextMeeting && <span className="block text-neutral-700 mt-1 font-sans">Próximo: {formatDateString(o.nextMeeting)}</span>}
                            </div>
                          </div>

                          {o.notes && (
                            <div className="text-[10.5px] text-neutral-500">
                              <span className="font-bold text-neutral-700">Notas de Sessão:</span> {o.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white p-6 rounded-xl border border-neutral-200 text-center text-neutral-400 text-xs font-semibold">
                      Nenhuma reunião de desenvolvimento individual (1on1) registrada para este SDR.
                    </div>
                  )}
                </div>

                {/* Audit Performance evaluation details */}
                <div>
                  <h3 className="text-xs uppercase font-black text-neutral-450 tracking-wider font-mono mb-3">
                    Histórico de Avaliações de Ligações e Auditorias de Pitch
                  </h3>

                  {sdrAuditLogs.length > 0 ? (
                    <div className="space-y-3.5">
                      {sdrAuditLogs.map((log) => (
                        <div key={log.id} className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm space-y-3">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="p-1 px-2.5 bg-neutral-100 rounded text-xs font-mono font-black text-neutral-800">
                                Nota Média: {((log.totalScore || 0) / 6).toFixed(1)} / 10
                              </span>
                              <span className="text-[10px] text-neutral-405 font-bold">
                                Avaliado por {log.leader}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-neutral-400 font-bold">
                              {formatDateString(log.timestamp.split('T')[0])}
                            </span>
                          </div>

                          {/* Scores alignment radar grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-[10px] font-mono font-bold text-neutral-500 uppercase mt-2">
                            <div className="bg-neutral-50 p-1.5 rounded border border-neutral-150">
                              <span className="block text-[8px] text-neutral-400 font-sans">Abordagem</span>
                              <span className="text-neutral-800 font-black text-xs mt-0.5 block">{log.score.abordagem}</span>
                            </div>
                            <div className="bg-neutral-50 p-1.5 rounded border border-neutral-150">
                              <span className="block text-[8px] text-neutral-400 font-sans">Conexão</span>
                              <span className="text-neutral-800 font-black text-xs mt-0.5 block">{log.score.conexao}</span>
                            </div>
                            <div className="bg-neutral-50 p-1.5 rounded border border-neutral-150">
                              <span className="block text-[8px] text-neutral-400 font-sans">Especialid.</span>
                              <span className="text-neutral-800 font-black text-xs mt-0.5 block">{log.score.especialidade}</span>
                            </div>
                            <div className="bg-neutral-50 p-1.5 rounded border border-neutral-150">
                              <span className="block text-[8px] text-neutral-400 font-sans">Proposta</span>
                              <span className="text-neutral-800 font-black text-xs mt-0.5 block">{log.score.proposta}</span>
                            </div>
                            <div className="bg-neutral-50 p-1.5 rounded border border-neutral-150">
                              <span className="block text-[8px] text-neutral-400 font-sans">Decisão</span>
                              <span className="text-neutral-800 font-black text-xs mt-0.5 block">{log.score.tomadaDecisao}</span>
                            </div>
                            <div className="bg-neutral-50 p-1.5 rounded border border-neutral-150">
                              <span className="block text-[8px] text-neutral-400 font-sans">Objeções</span>
                              <span className="text-neutral-800 font-black text-xs mt-0.5 block">{log.score.objecoes}</span>
                            </div>
                          </div>

                          {log.notes && (
                            <div className="text-[11px] text-neutral-600 bg-neutral-50 p-2.5 rounded border border-neutral-100 mt-2.5">
                              <span className="font-extrabold text-neutral-700 block">Observações do Feedback:</span>
                              {log.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white p-6 rounded-xl border border-neutral-200 text-center text-neutral-400 text-xs font-semibold">
                      Nenhuma auditoria ou simulado de ligação registrado para este SDR.
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>

        </div>

        {/* Footer controls */}
        <div className="p-4 bg-white border-t border-neutral-200 text-right shrink-0">
          <button 
            type="button"
            onClick={onClose} 
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-850 text-white rounded-lg text-xs uppercase font-black tracking-wider cursor-pointer font-mono"
          >
            Fechar Ficha
          </button>
        </div>

      </div>
    </div>
  );
}
