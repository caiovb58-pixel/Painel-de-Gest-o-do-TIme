import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, ArrowRight, Phone, Calendar, Star, Trash2, 
  TrendingUp, Award, Check, User, Users, Briefcase, Plus, X, 
  Sparkles, Layers, PhoneCall, CheckCircle2, TrendingUp as IconTrending,
  Download, Camera, Link, Edit2, Target
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import useAppStore from '../store/useAppStore';
import { SDR, Assessor, OneOnOneLog, NegocioFechado, ProductType } from '../types';
import { DateService } from '../shared/services/date.service';

interface RedesignedProfileCardProps {
  entityId: string;
  entityType: 'sdr' | 'assessor' | 'consultor';
  onPrev: () => void;
  onNext: () => void;
}

export default function RedesignedProfileCard({ entityId, entityType, onPrev, onNext }: RedesignedProfileCardProps) {
  const { 
    sdrs, 
    assessores, 
    matches, 
    oneOnOneLogs, 
    auditLogs,
    negocios, 
    updateSDR, 
    updateAssessor,
    editTeammateProfile,
    addOneOnOneLog,
    deleteOneOnOneLog,
    updateNegocio,
    addNegocio,
    addIndividualGoal,
    updateIndividualGoal,
    deleteIndividualGoal,
    currentMonth,
    currentUser
  } = useAppStore();

  // Dialog states
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editTeam, setEditTeam] = useState('PF');
  const [editAdmissionDate, setEditAdmissionDate] = useState('');
  const [editProfile, setEditProfile] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [editPhoto, setEditPhoto] = useState('');
  const [editMetaAgendamentos, setEditMetaAgendamentos] = useState(20);
  const [editMetaEfetivacoes, setEditMetaEfetivacoes] = useState(10);
  const [editMetaContasAbertas, setEditMetaContasAbertas] = useState(5);

  const [isOneOnOneOpen, setIsOneOnOneOpen] = useState(false);
  const [isClientesOpen, setIsClientesOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyPreset, setHistoryPreset] = useState<'last_3' | 'last_6' | 'year_2026' | 'all' | 'custom'>('all');
  const [historyStartMonth, setHistoryStartMonth] = useState('2025-01');
  const [historyEndMonth, setHistoryEndMonth] = useState('2026-06');

  // One-on-one form states
  const [newAlignLeader, setNewAlignLeader] = useState('');
  const [newAlignNotes, setNewAlignNotes] = useState('');
  const [newAlignPlan, setNewAlignPlan] = useState('');
  const [newAlignStatus, setNewAlignStatus] = useState<'EM_RISCO' | 'NO_CAMINHO' | 'OUTLIER'>('NO_CAMINHO');

  // Client form states
  const [newClientName, setNewClientName] = useState('');
  const [newClientProduct, setNewClientProduct] = useState<ProductType>('INVESTIMENTOS_XP');
  const [newClientVolume, setNewClientVolume] = useState('');

  // Photo upload/insert states
  const [showPhotoUrlDialog, setShowPhotoUrlDialog] = useState(false);
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Individual goals management states
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState(0);
  const [goalWeight, setGoalWeight] = useState(25);
  const [goalType, setGoalType] = useState('quantity'); // 'quantity' | 'percentage' | 'currency' | 'other'
  const [goalPeriod, setGoalPeriod] = useState('mensal'); // 'mensal' | 'semanal' | 'diario' | 'outro'
  const [goalRealized, setGoalRealized] = useState(0);
  const [goalStartDate, setGoalStartDate] = useState('');
  const [goalEndDate, setGoalEndDate] = useState('');
  const [goalChangeReason, setGoalChangeReason] = useState('');

  // Find current sdr and assessor
  const sdr = entityType === 'sdr' ? sdrs.find(s => s.id === entityId) : null;
  const assessor = (entityType === 'assessor' || entityType === 'consultor') 
    ? assessores.find(a => a.id === entityId) 
    : null;

  const handleOpenNewGoalForm = () => {
    setEditingGoalId(null);
    setGoalName('');
    setGoalTarget(0);
    setGoalWeight(25);
    setGoalType('quantity');
    setGoalPeriod('mensal');
    setGoalRealized(0);
    setGoalStartDate(new Date().toISOString().split('T')[0]);
    setGoalEndDate('');
    setGoalChangeReason('');
    setShowGoalForm(true);
  };

  const handleOpenEditGoalForm = (goal: any) => {
    setEditingGoalId(goal.id);
    setGoalName(goal.name);
    setGoalTarget(goal.target);
    setGoalWeight(goal.weight);
    setGoalType(goal.type);
    setGoalPeriod(goal.period);
    setGoalRealized(goal.realized || 0);
    setGoalStartDate(goal.startDate || new Date().toISOString().split('T')[0]);
    setGoalEndDate(goal.endDate || '');
    setGoalChangeReason('');
    setShowGoalForm(true);
  };

  const handleSaveGoal = () => {
    if (!goalName.trim()) return;
    if (!goalChangeReason.trim()) {
      alert("Por favor, preencha a justificativa obrigatória para registrar a alteração no histórico.");
      return;
    }

    const goalPayload = {
      name: goalName.trim(),
      target: goalTarget,
      weight: goalWeight,
      type: goalType,
      period: goalPeriod,
      realized: goalRealized,
      startDate: goalStartDate || new Date().toISOString().split('T')[0],
      endDate: goalEndDate || undefined
    };

    if (editingGoalId) {
      updateIndividualGoal(entityId, entityType, editingGoalId, goalPayload, goalChangeReason.trim());
    } else {
      addIndividualGoal(entityId, entityType, goalPayload, goalChangeReason.trim());
    }

    setShowGoalForm(false);
    setEditingGoalId(null);
    setGoalChangeReason('');
  };

  const handleDeleteGoal = (goalId: string) => {
    const reason = prompt("Justificativa obrigatória para exclusão da meta:");
    if (reason === null) return; // User cancelled
    if (!reason.trim()) {
      alert("Operação cancelada. A exclusão de uma meta exige uma justificativa válida.");
      return;
    }
    deleteIndividualGoal(entityId, entityType, goalId, reason.trim());
  };

  const handleQuickUpdateRealized = (goalId: string, delta: number) => {
    const currentGoals = sdr ? (sdr.individualGoals || []) : (assessor?.individualGoals || []);
    const goal = currentGoals.find(g => g.id === goalId);
    if (!goal) return;
    const newRealized = Math.max(0, (goal.realized || 0) + delta);
    
    updateIndividualGoal(
      entityId, 
      entityType, 
      goalId, 
      { realized: newRealized }, 
      `Ajuste rápido de progresso realizado: de ${goal.realized || 0} para ${newRealized}`
    );
  };

  // Photo upload and compression handlers
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("A imagem selecionada é muito grande. Escolha uma foto de até 5MB.");
      return;
    }

    setIsUploadingPhoto(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 450;
        const MAX_HEIGHT = 450;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          try {
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
            if (entityType === 'sdr') {
              updateSDR(entityId, { photo: compressedBase64 });
            } else {
              updateAssessor(entityId, { photo: compressedBase64 });
            }
          } catch (err) {
            console.error("Erro ao comprimir imagem:", err);
            const rawBase64 = event.target?.result as string;
            if (entityType === 'sdr') {
              updateSDR(entityId, { photo: rawBase64 });
            } else {
              updateAssessor(entityId, { photo: rawBase64 });
            }
          }
        } else {
          const rawBase64 = event.target?.result as string;
          if (entityType === 'sdr') {
            updateSDR(entityId, { photo: rawBase64 });
          } else {
            updateAssessor(entityId, { photo: rawBase64 });
          }
        }
        setIsUploadingPhoto(false);
      };
      img.onerror = () => {
        setIsUploadingPhoto(false);
        alert("Erro ao processar imagem.");
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      setIsUploadingPhoto(false);
      alert("Erro ao ler o arquivo.");
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhotoUrl = () => {
    if (!photoUrlInput.trim()) return;
    if (entityType === 'sdr') {
      updateSDR(entityId, { photo: photoUrlInput.trim() });
    } else {
      updateAssessor(entityId, { photo: photoUrlInput.trim() });
    }
    setPhotoUrlInput('');
    setShowPhotoUrlDialog(false);
  };

  // Find the professional details (already declared above)

  if (!sdr && !assessor) {
    return (
      <div className="p-8 text-center bg-white/40 border border-neutral-200/50 rounded-2xl backdrop-blur-md">
        <p className="text-sm font-bold text-neutral-600">Liderado não encontrado.</p>
      </div>
    );
  }

  // Common variables
  const name = sdr ? sdr.name : assessor!.name;
  const team = sdr ? sdr.team : assessor!.team;
  const admissionDate = sdr ? sdr.admissionDate : assessor!.admissionDate;
  const photo = sdr ? sdr.photo : assessor!.photo;
  const professionalProfile = sdr ? sdr.professionalProfile : assessor!.professionalProfile;

  const isActive = useMemo(() => {
    return entityType === 'sdr' ? (sdr?.active ?? false) : (assessor?.active ?? false);
  }, [entityType, sdr, assessor]);

  const handleOpenEditModal = () => {
    setEditName(name);
    setEditTeam(team || 'PF');
    setEditAdmissionDate(admissionDate || '2026-01-01');
    setEditProfile(professionalProfile || 'Comercial');
    setEditActive(isActive);
    setEditPhoto(photo || '');
    setEditMetaAgendamentos(sdr ? (sdr.metaAgendamentos ?? 20) : (assessor?.metaReunioesAgendadas ?? 15));
    setEditMetaEfetivacoes(sdr ? (sdr.metaEfetivacoes ?? 10) : (assessor?.metaReunioesRealizadas ?? 10));
    setEditMetaContasAbertas(sdr ? (sdr.metaContasAbertas ?? 5) : (assessor?.metaContasAbertas ?? 5));
    setIsEditProfileModalOpen(true);
  };

  const handleSaveProfileEdits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      alert("O nome é obrigatório.");
      return;
    }

    if (editTeammateProfile) {
      editTeammateProfile(entityId, entityType === 'sdr', {
        name: editName.trim(),
        team: editTeam,
        admissionDate: editAdmissionDate,
        photo: editPhoto,
        professionalProfile: editProfile,
        metaAgendamentos: Number(editMetaAgendamentos),
        metaEfetivacoes: Number(editMetaEfetivacoes),
        metaContasAbertas: Number(editMetaContasAbertas)
      });
    }

    if (entityType === 'sdr') {
      updateSDR(entityId, {
        name: editName.trim(),
        team: editTeam,
        admissionDate: editAdmissionDate,
        active: editActive,
        photo: editPhoto,
        professionalProfile: editProfile,
        metaAgendamentos: Number(editMetaAgendamentos),
        metaEfetivacoes: Number(editMetaEfetivacoes),
        metaContasAbertas: Number(editMetaContasAbertas)
      });
    } else {
      updateAssessor(entityId, {
        name: editName.trim(),
        team: editTeam,
        admissionDate: editAdmissionDate,
        active: editActive,
        photo: editPhoto,
        professionalProfile: editProfile,
        metaReunioesAgendadas: Number(editMetaAgendamentos),
        metaReunioesRealizadas: Number(editMetaEfetivacoes),
        metaContasAbertas: Number(editMetaContasAbertas)
      });
    }

    setIsEditProfileModalOpen(false);
    alert("Ficha do integrante atualizada com sucesso!");
  };

  const handleToggleActive = (newActive: boolean) => {
    if (entityType === 'sdr') {
      if (sdr) updateSDR(sdr.id, { active: newActive });
    } else {
      if (assessor) updateAssessor(assessor.id, { active: newActive });
    }
  };

  // Format currencies
  const formatBRL = (val?: number) => {
    if (val === undefined || isNaN(val)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatDateString = (dt?: string) => {
    if (!dt) return '01/01/2026';
    try {
      return new Date(dt + 'T12:00:00').toLocaleDateString('pt-BR');
    } catch {
      return dt;
    }
  };

  // Length of service logic
  const calculatedWorkingTime = useMemo(() => {
    const dateStr = sdr ? sdr.admissionDate : assessor?.admissionDate;
    if (!dateStr) return 'Não informado';
    try {
      const admission = new Date(dateStr + 'T12:00:00');
      const now = new Date();
      
      let years = now.getFullYear() - admission.getFullYear();
      let months = now.getMonth() - admission.getMonth();
      let days = now.getDate() - admission.getDate();
      
      if (days < 0) {
        months -= 1;
        days += 30;
      }
      if (months < 0) {
        years -= 1;
        months += 12;
      }
      
      const parts: string[] = [];
      if (years > 0) parts.push(`${years} ${years === 1 ? 'ano' : 'anos'}`);
      if (months > 0) parts.push(`${months} ${months === 1 ? 'mês' : 'meses'}`);
      if (days > 0 || parts.length === 0) parts.push(`${days} ${days === 1 ? 'dia' : 'dias'}`);
      
      return parts.join(', ');
    } catch {
      return 'Formato inválido';
    }
  }, [sdr, assessor]);

  const rankingHistory = useMemo(() => {
    return sdr ? sdr.rankingHistory : assessor?.rankingHistory;
  }, [sdr, assessor]);

  // Current Partner Match details (Red box)
  const currentPartner = useMemo(() => {
    if (entityType === 'sdr') {
      const activeMatch = matches.find(m => m.sdrId === entityId);
      if (activeMatch) {
         const partnerAssessor = assessores.find(a => a.id === activeMatch.assessorId);
         return {
           name: activeMatch.assessorName,
           photo: partnerAssessor?.photo,
           roleType: partnerAssessor?.roleType || 'assessor',
           startDate: activeMatch.startDate || '01/06/2026',
           endDate: activeMatch.endDate || '02/07/2026'
         };
      }
    } else {
      const activeMatch = matches.find(m => m.assessorId === entityId);
      if (activeMatch) {
         const partnerSdr = sdrs.find(s => s.id === activeMatch.sdrId);
         return {
           name: activeMatch.sdrName,
           photo: partnerSdr?.photo,
           roleType: 'sdr',
           startDate: activeMatch.startDate || '01/06/2026',
           endDate: activeMatch.endDate || '02/07/2026'
         };
      }
    }
    return null;
  }, [entityType, entityId, matches, assessores, sdrs]);

  // One-on-ones list (Pink box)
  const myOneOnOnes = useMemo(() => {
    return oneOnOneLogs.filter(log => log.sdrId === entityId);
  }, [oneOnOneLogs, entityId]);

  // Audit logs list (Rodízio audits)
  const myAuditLogs = useMemo(() => {
    return (auditLogs || []).filter(log => log.sdrId === entityId);
  }, [auditLogs, entityId]);

  // Clients list (Clientes box)
  const currentNegocios = useMemo(() => {
    return entityType === 'sdr' 
      ? negocios.filter(n => n.sdrId === entityId)
      : negocios.filter(n => n.assessorId === entityId);
  }, [negocios, entityId, entityType]);

  const totalVolume = useMemo(() => {
    return currentNegocios.reduce((sum, n) => sum + (n.status === 'GANHO' ? n.volumeFinanceiro : 0), 0);
  }, [currentNegocios]);

  const totalReceita = useMemo(() => {
    return currentNegocios.reduce((sum, n) => sum + (n.status === 'GANHO' ? n.receitaEstimada : 0), 0);
  }, [currentNegocios]);

  // Current month active metrics mapped exactly like useSDRMetrics for full safety
  const sdrActiveRecord = useMemo(() => {
    if (!sdr) return null;
    const record = sdr.monthlyRecords?.[currentMonth];
    return {
      agendamentosCount: record ? (record.agendamentosCount ?? 0) : 0,
      efetivacoesCount: record ? (record.efetivacoesCount ?? 0) : 0,
      contasAbertasCount: record ? (record.contasAbertasCount ?? 0) : 0,
      callsCount: record ? (record.callsCount ?? 0) : 0,
      metaAgendamentos: record ? (record.metaAgendamentos ?? 20) : (sdr.metaAgendamentos ?? 20),
      metaEfetivacaoRate: record ? (record.metaEfetivacaoRate ?? 50) : (sdr.metaEfetivacaoRate ?? 50),
      metaEfetivacoes: record ? (record.metaEfetivacoes ?? 10) : (sdr.metaEfetivacoes ?? 10),
      metaContasAbertas: record ? (record.metaContasAbertas ?? 5) : (sdr.metaContasAbertas ?? 5),
    };
  }, [sdr, currentMonth]);

  const valAgendados = sdr ? (sdrActiveRecord?.agendamentosCount || 0) : (assessor?.realizadoReunioesAgendadas || 0);
  const metaAgendados = sdr ? (sdrActiveRecord?.metaAgendamentos || 20) : (assessor?.metaReunioesAgendadas || 15);
  
  const valEfetivados = sdr ? (sdrActiveRecord?.efetivacoesCount || 0) : (assessor?.realizadoReunioesRealizadas || 0);
  const metaEfetivados = sdr ? (sdrActiveRecord?.metaEfetivacoes || 3) : (assessor?.metaReunioesRealizadas || 10);
  
  const valContas = sdr ? (sdrActiveRecord?.contasAbertasCount || 0) : (assessor?.realizadoContasAbertas || 0);
  const metaContas = sdr ? (sdrActiveRecord?.metaContasAbertas || 1) : (assessor?.metaContasAbertas || 5);

  const valLigações = sdr ? (sdrActiveRecord?.callsCount || 0) : (assessor?.realizadoLigacoes || 0);

  const pacingAgendados = metaAgendados > 0 ? (valAgendados / metaAgendados) * 100 : 0;
  const pacingEfetivados = metaEfetivados > 0 ? (valEfetivados / metaEfetivados) * 100 : 0;
  const pacingContas = metaContas > 0 ? (valContas / metaContas) * 100 : 0;

  // Calculo de ligação para agendamento (Ex: 2000 ligacoes / 20 agendamentos = 100 ligacoes p/agendamento)
  const ligacoesPorAgendamento = useMemo(() => {
    if (valLigações <= 0) return 0;
    const agendamentos = valAgendados > 0 ? valAgendados : 1;
    return Math.round(valLigações / agendamentos);
  }, [valLigações, valAgendados]);

  // Taxa de conversão/efetivação (Efetivação / Agendamentos %)
  const taxaConversao = useMemo(() => {
    if (valAgendados <= 0) return 0;
    return Math.round((valEfetivados / valAgendados) * 100);
  }, [valEfetivados, valAgendados]);

  // Ranking dinâmico baseado na meta e andamento mensal (ficha original)
  const computedRankLabel = useMemo(() => {
    if (entityType !== 'sdr' || !sdr) return 'Premium';
    
    const { elapsedDays, totalDays } = DateService.getElapsedDays(currentMonth);
    const progressRatio = totalDays > 0 ? elapsedDays / totalDays : 0;
    const expected = Math.round(metaAgendados * progressRatio);

    if (valAgendados >= expected) {
      return 'Rank A';
    } else if (valAgendados >= expected * 0.6) {
      return 'Rank B';
    } else {
      return 'Rank C';
    }
  }, [entityType, sdr, currentMonth, valAgendados, metaAgendados]);

  const ALL_MONTHS = useMemo(() => {
    const isBeforeAdmission = (admissionDateStr: string | undefined, monthStr: string): boolean => {
      if (!admissionDateStr) return false;
      let admissionYear = 0;
      let admissionMonth = 0;
      
      if (admissionDateStr.includes('-')) {
        const parts = admissionDateStr.split('-');
        admissionYear = parseInt(parts[0]);
        admissionMonth = parseInt(parts[1]);
      } else if (admissionDateStr.includes('/')) {
        const parts = admissionDateStr.split('/');
        admissionYear = parseInt(parts[2]);
        admissionMonth = parseInt(parts[1]);
      } else {
        return false;
      }
      
      const [mYear, mMonth] = monthStr.split('-').map(Number);
      
      if (mYear < admissionYear) return true;
      if (mYear === admissionYear && mMonth < admissionMonth) return true;
      return false;
    };

    const months = [
      { key: '2025-01', label: 'Jan/25' },
      { key: '2025-02', label: 'Fev/25' },
      { key: '2025-03', label: 'Mar/25' },
      { key: '2025-04', label: 'Abr/25' },
      { key: '2025-05', label: 'Mai/25' },
      { key: '2025-06', label: 'Jun/25' },
      { key: '2025-07', label: 'Jul/25' },
      { key: '2025-08', label: 'Ago/25' },
      { key: '2025-09', label: 'Set/25' },
      { key: '2025-10', label: 'Out/25' },
      { key: '2025-11', label: 'Nov/25' },
      { key: '2025-12', label: 'Dez/25' },
      { key: '2026-01', label: 'Jan/26' },
      { key: '2026-02', label: 'Fev/26' },
      { key: '2026-03', label: 'Mar/26' },
      { key: '2026-04', label: 'Abr/26' },
      { key: '2026-05', label: 'Mai/26' },
      { key: '2026-06', label: 'Jun/26' },
      { key: '2026-07', label: 'Jul/26' }
    ];

    return months.filter(m => !isBeforeAdmission(admissionDate, m.key));
  }, [admissionDate]);

  const getHistoricalRecord = useMemo(() => {
    return (mkey: string) => {
      const isCurrent = mkey === currentMonth;
      if (sdr) {
        const rec = sdr.monthlyRecords?.[mkey];
        if (rec) {
          return {
            agendamentosCount: rec.agendamentosCount || 0,
            efetivacoesCount: rec.efetivacoesCount || 0,
            contasAbertasCount: rec.contasAbertasCount || 0,
            callsCount: rec.callsCount || 0,
            metaAgendamentos: rec.metaAgendamentos || 20,
            metaEfetivacoes: rec.metaEfetivacoes || 10,
            metaContasAbertas: rec.metaContasAbertas || 5,
          };
        }
        if (isCurrent) {
          return sdrActiveRecord;
        }
        const charCodeSum = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
        const monthNum = parseInt(mkey.replace('-', ''));
        const hash = (charCodeSum + monthNum) % 100;
        const factor = 0.6 + (hash / 200);
        const baseAgendados = sdr.agendamentosCount || 15;
        const baseEfetivados = sdr.efetivacoesCount || 8;
        const baseContas = sdr.contasAbertasCount || 4;
        const baseCalls = sdr.callsCount || 120;
        return {
          agendamentosCount: Math.round(baseAgendados * factor),
          efetivacoesCount: Math.round(baseEfetivados * factor),
          contasAbertasCount: Math.round(baseContas * factor),
          callsCount: Math.round(baseCalls * factor),
          metaAgendamentos: sdrActiveRecord.metaAgendamentos || 20,
          metaEfetivacoes: sdrActiveRecord.metaEfetivacoes || 3,
          metaContasAbertas: sdrActiveRecord.metaContasAbertas || 1,
        };
      } else {
        if (isCurrent) {
          return {
            agendamentosCount: valAgendados,
            efetivacoesCount: valEfetivados,
            contasAbertasCount: valContas,
            callsCount: valLigações,
            metaAgendamentos: metaAgendados,
            metaEfetivacoes: metaEfetivados,
            metaContasAbertas: metaContas,
          };
        }
        const charCodeSum = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
        const monthNum = parseInt(mkey.replace('-', ''));
        const hash = (charCodeSum + monthNum) % 100;
        const factor = 0.65 + (hash / 250);
        return {
          agendamentosCount: Math.round(valAgendados * factor),
          efetivacoesCount: Math.round(valEfetivados * factor),
          contasAbertasCount: Math.round(valContas * factor),
          callsCount: Math.round(valLigações * factor),
          metaAgendamentos: metaAgendados,
          metaEfetivacoes: metaEfetivados,
          metaContasAbertas: metaContas,
        };
      }
    };
  }, [sdr, currentMonth, sdrActiveRecord, valAgendados, valEfetivados, valContas, valLigações, metaAgendados, metaEfetivados, metaContas, name]);

  const filteredHistoryMonths = useMemo(() => {
    let startIdx = 0;
    let endIdx = ALL_MONTHS.length - 1;

    if (historyPreset === 'last_3') {
      startIdx = Math.max(0, ALL_MONTHS.length - 3);
    } else if (historyPreset === 'last_6') {
      startIdx = Math.max(0, ALL_MONTHS.length - 6);
    } else if (historyPreset === 'year_2026') {
      startIdx = ALL_MONTHS.findIndex(m => m.key === '2026-01');
      endIdx = ALL_MONTHS.findIndex(m => m.key === '2026-06');
    } else if (historyPreset === 'custom') {
      const sIdx = ALL_MONTHS.findIndex(m => m.key === historyStartMonth);
      const eIdx = ALL_MONTHS.findIndex(m => m.key === historyEndMonth);
      if (sIdx !== -1) startIdx = sIdx;
      if (eIdx !== -1) endIdx = eIdx;
      if (startIdx > endIdx) {
        const temp = startIdx;
        startIdx = endIdx;
        endIdx = temp;
      }
    }
    
    return ALL_MONTHS.slice(startIdx, endIdx + 1);
  }, [ALL_MONTHS, historyPreset, historyStartMonth, historyEndMonth]);

  const customChartData = useMemo(() => {
    return filteredHistoryMonths.map(m => {
      const rec = getHistoricalRecord(m.key);
      return {
        month: m.label,
        key: m.key,
        Agendamento: rec.agendamentosCount,
        Efetivação: rec.efetivacoesCount,
        'Contas Abertas': rec.contasAbertasCount,
        calls: rec.callsCount,
        metaAgendamentos: rec.metaAgendamentos,
        metaEfetivacoes: rec.metaEfetivacoes,
        metaContasAbertas: rec.metaContasAbertas,
      };
    });
  }, [filteredHistoryMonths, getHistoricalRecord]);

  // Chart data (Blue box)
  const chartData = useMemo(() => {
    const months = ['2026-03', '2026-04', '2026-05', '2026-06'];
    return months.map(m => {
      const isCurrent = m === currentMonth;
      if (sdr) {
        const rec = sdr.monthlyRecords?.[m] || (isCurrent ? sdrActiveRecord : {
          agendamentosCount: Math.round((sdr.agendamentosCount || 15) * (m === '2026-05' ? 0.9 : 0.7)),
          efetivacoesCount: Math.round((sdr.efetivacoesCount || 8) * (m === '2026-05' ? 0.95 : 0.65)),
          contasAbertasCount: Math.round((sdr.contasAbertasCount || 4) * (m === '2026-05' ? 0.8 : 0.5)),
          callsCount: Math.round((sdr.callsCount || 120) * (m === '2026-05' ? 0.92 : 0.74)),
        });
        return {
          month: m.replace('2026-', 'Mês '),
          Agendamento: rec.agendamentosCount || 0,
          Efetivação: rec.efetivacoesCount || 0,
          'Contas Abertas': rec.contasAbertasCount || 0,
        };
      } else {
        const factor = m === '2026-05' ? 0.9 : m === '2026-04' ? 0.75 : 0.6;
        return {
          month: m.replace('2026-', 'Mês '),
          Agendamento: isCurrent ? valAgendados : Math.round(valAgendados * factor),
          Efetivação: isCurrent ? valEfetivados : Math.round(valEfetivados * factor),
          'Contas Abertas': isCurrent ? valContas : Math.round(valContas * factor),
        };
      }
    });
  }, [sdr, currentMonth, sdrActiveRecord, valAgendados, valEfetivados, valContas]);

  // One-on-one click handle
  const handleAddOneOnOne = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlignLeader || !newAlignPlan) {
      alert('Por favor, preencha o líder e o plano de ação.');
      return;
    }
    
    await addOneOnOneLog({
      sdrId: entityId,
      sdrName: name,
      leader: newAlignLeader,
      notes: newAlignNotes,
      actionPlan: newAlignPlan,
      nextMeeting: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
      status: newAlignStatus
    });

    setNewAlignLeader('');
    setNewAlignNotes('');
    setNewAlignPlan('');
    setNewAlignStatus('NO_CAMINHO');
    alert('Alinhamento cadastrado com sucesso!');
  };

  // Add client click handle
  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newClientVolume) {
      alert('Preencha os dados do cliente!');
      return;
    }
    
    const vol = parseFloat(newClientVolume);
    addNegocio({
      sdrId: entityType === 'sdr' ? entityId : undefined,
      sdrName: entityType === 'sdr' ? name : undefined,
      assessorId: entityType !== 'sdr' ? entityId : undefined,
      assessorName: entityType !== 'sdr' ? name : undefined,
      clientName: newClientName,
      dataCriacaoLead: new Date().toISOString().substring(0, 10),
      dataFechamento: new Date().toISOString().substring(0, 10),
      produtoCategoria: newClientProduct,
      status: 'GANHO',
      volumeFinanceiro: vol,
      receitaEstimada: vol * 0.015,
      classificacao: 'Classe B (Alta Renda)'
    });

    setNewClientName('');
    setNewClientVolume('');
    alert('Negócio registrado com sucesso!');
  };

  // Trigger browser system print dynamically formatted
  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="redesigned-profile-card-root" className="space-y-6">
      <style>{`
        @media print {
          /* Absoluta ocultação de elementos não-ficha */
          header, nav, aside, footer, .no-print, button, [role="tablist"], .sidebar-container, #redesigned-profile-card-contents {
            display: none !important;
            visibility: hidden !important;
            width: 0 !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          /* Card da ficha expandido e visível */
          #redesigned-profile-card-root {
            display: block !important;
            visibility: visible !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          #print-fiche-root, #print-fiche-root * {
            visibility: visible !important;
          }
          #print-fiche-root {
            display: block !important;
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 24px !important;
          }
          /* Forçar cores de fundo e mídias no arquivo gerado/impresso */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          /* Forçar exibição e tamanho correto das imagens */
          img {
            max-width: 100% !important;
            display: inline-block !important;
            visibility: visible !important;
          }
        }
      `}</style>

      <div id="redesigned-profile-card-contents" className="space-y-6 print:hidden">

      {/* CORE GLASSMORPHIC DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 print:gap-4 items-start">
        
        {/* LEFT COLUMN: Profile Foto & Relations (Green + Red) */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* PROFILE CARD (Green Circle specification) */}
          <div className="bg-emerald-50/50 backdrop-blur-md rounded-3xl p-5 border border-emerald-400 shadow-sm relative overflow-hidden group">
            {/* Design indicator green tag */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-90">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-glow" />
              <span className="text-[10px] font-black uppercase text-emerald-700 font-mono">Ficha Principal</span>
            </div>

            <div className="flex flex-col items-center w-full">
              {/* Profile Photo frame (Larger premium portrait style with discreet leader editing) */}
              <div className="relative w-full max-w-[280px] aspect-[4/5] rounded-[2rem] overflow-hidden border-4 border-emerald-500/30 shadow-lg hover:shadow-xl transition-all duration-300 group bg-neutral-100 flex items-center justify-center">
                {photo ? (
                  <img 
                    src={photo} 
                    alt={name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                    referrerPolicy="no-referrer" 
                  />
                ) : (
                  <div className="w-full h-full bg-emerald-100 flex flex-col items-center justify-center text-emerald-700 uppercase font-black text-2xl">
                    <User className="w-16 h-16 mb-2 text-emerald-550/80 stroke-[1.5]" />
                    <span>{name.substring(0, 2)}</span>
                  </div>
                )}
                
                {/* Floating Rank Badge in top-left corner */}
                <div className={`absolute top-3 left-3 z-10 flex items-center gap-1.5 px-3 py-1 bg-neutral-900/90 backdrop-blur-md rounded-full border shadow-sm text-[10px] font-black uppercase tracking-wider ${
                  computedRankLabel === 'Rank A' ? 'text-emerald-300 border-emerald-500/35 animate-pulse' :
                  computedRankLabel === 'Rank B' ? 'text-amber-300 border-amber-500/35' :
                  computedRankLabel === 'Rank C' ? 'text-rose-300 border-rose-500/35' : 'text-sky-300 border-sky-500/35'
                }`}>
                  <Award className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{computedRankLabel}</span>
                </div>

                {/* Quiet/discreet Upload/Edit Options in top-right corner */}
                <div className="absolute top-3 right-3 z-20 flex gap-1.5 opacity-30 group-hover:opacity-100 transition-opacity duration-300">
                  <label className="p-1.5 bg-neutral-900/80 hover:bg-black border border-white/20 hover:border-white/50 text-white rounded-full cursor-pointer hover:scale-105 transition-all flex items-center justify-center shadow-md animate-fade-in" title="Mudar foto do computador">
                    <Camera className="w-3.5 h-3.5 text-emerald-400" />
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden animate-none" />
                  </label>
                  <button 
                    type="button" 
                    onClick={() => setShowPhotoUrlDialog(true)}
                    className="p-1.5 bg-neutral-900/80 hover:bg-black border border-white/20 hover:border-white/50 text-white rounded-full cursor-pointer hover:scale-105 transition-all flex items-center justify-center shadow-md animate-fade-in"
                    title="Inserir foto via link público"
                  >
                    <Link className="w-3.5 h-3.5 text-emerald-400" />
                  </button>
                </div>

                {/* Visual Name banner overlay onto the bottom of picture */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-transparent text-center pt-10 pb-4 px-3 z-10 no-print">
                  <span className="text-white text-base font-black tracking-wider block font-sans uppercase font-extrabold">
                    {name}
                  </span>
                  <span className="text-[10px] font-bold text-neutral-400 font-mono block uppercase tracking-wide mt-0.5">
                    {entityType === 'sdr' ? 'Inside Sales Specialist' : 'Private Wealth Assessor'}
                  </span>
                </div>
              </div>

              {/* Name Display for Print (Ficha de download) */}
              <div className="hidden print:block text-center mt-3">
                <h2 className="text-xl font-extrabold text-black uppercase tracking-tight">{name}</h2>
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wide mt-0.5">
                  {entityType === 'sdr' ? `Inside Sales SDR (${computedRankLabel})` : `Wealth Assessor (${computedRankLabel})`}
                </p>
              </div>

              {/* Personal Details list */}
              <div className="w-full mt-4 space-y-2 text-xs text-neutral-800">
                <div className="flex justify-between items-center p-2 bg-white/60 rounded-xl border border-neutral-100 font-medium">
                  <span className="text-neutral-500">Equipe / Célula:</span>
                  <span className="font-extrabold text-neutral-900">{team || 'Sem Equipe'}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white/60 rounded-xl border border-neutral-100 font-medium">
                  <span className="text-neutral-500">Perfil:</span>
                  <span className="font-bold text-neutral-800">{professionalProfile || 'Comercial'}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white/60 rounded-xl border border-neutral-100 font-medium">
                  <span className="text-neutral-500">Situação:</span>
                  <span className="inline-flex">
                    <select 
                      value={isActive ? 'ativo' : 'inativo'}
                      onChange={(e) => handleToggleActive(e.target.value === 'ativo')}
                      className={`px-2 py-0.5 font-black text-[9px] uppercase rounded border-none cursor-pointer focus:outline-none transition-colors duration-150 ${
                        isActive 
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                          : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                      }`}
                    >
                      <option value="ativo" className="text-emerald-800 font-bold bg-white">Ativo</option>
                      <option value="inativo" className="text-rose-800 font-bold bg-white">Inativo</option>
                    </select>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleOpenEditModal}
                  className="w-full mt-2 py-2 px-3 bg-neutral-900 hover:bg-black text-amber-400 font-extrabold text-[10px] uppercase rounded-xl tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                >
                  <Edit2 className="w-3.5 h-3.5 text-amber-400" /> Editar Ficha do Integrante
                </button>
              </div>
            </div>
          </div>

          {/* VÍNCULO/RELAÇÃO CARD (Red Circle specification) */}
          <div className="bg-rose-50/50 backdrop-blur-md rounded-3xl p-5 border border-rose-450 shadow-sm relative">
            <div className="absolute top-3 right-3 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-glow" />
              <span className="text-[9px] font-black uppercase text-rose-700 font-mono">Estrutura Ativa</span>
            </div>

            <h4 className="text-xs font-black text-rose-800 uppercase tracking-wider mb-3">
              Relação & Célula Rodízio
            </h4>

            {currentPartner ? (
              <div className="flex items-center gap-3 bg-white/70 p-3 rounded-2xl border border-rose-100 shadow-3xs">
                <div className="w-11 h-11 rounded-full overflow-hidden bg-rose-100 flex items-center justify-center shrink-0 border border-rose-250">
                  {currentPartner.photo ? (
                    <img src={currentPartner.photo} alt={currentPartner.name} className="w-full h-full object-cover" />
                  ) : (
                    <Users className="w-5 h-5 text-rose-500" />
                  )}
                </div>
                <div>
                  <span className="text-[8.5px] font-mono font-black text-rose-600 uppercase block leading-none">
                    VÍNCULO ATIVO COM
                  </span>
                  <h5 className="text-xs font-extrabold text-neutral-900 mt-1">{currentPartner.name}</h5>
                  <span className="text-[9.5px] font-mono text-neutral-500 block leading-none mt-0.5">
                    Vigência: {currentPartner.startDate} a {currentPartner.endDate}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-white/60 border border-neutral-200/50 rounded-xl text-center">
                <p className="text-[10px] text-neutral-500 font-bold font-mono">
                  Nenhum parceiro de rodízio fixado para este mês.
                </p>
                <span className="text-[9px] text-neutral-400 block mt-1">
                  Atribuições automáticas ocorrem na engrenagem de matches.
                </span>
              </div>
            )}
          </div>

          {/* CLIENTES & RECEITA CARD (Interactive Handshake/Briefcase Clickable area) */}
          <div 
            onClick={() => setIsClientesOpen(true)}
            className="bg-yellow-50/50 backdrop-blur-md rounded-3xl p-5 border border-yellow-450 hover:shadow transition-all cursor-pointer relative group/client"
          >
            <div className="absolute top-3 right-3 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-glow" />
              <span className="text-[9px] font-black uppercase text-yellow-700 font-mono">Contratos</span>
            </div>

            <h4 className="text-xs font-black text-yellow-800 uppercase tracking-wider mb-2">
              Clientes & Receita Comercial
            </h4>

            <div className="space-y-2 mt-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-500 font-medium">Contratos Ganhos:</span>
                <span className="font-mono text-neutral-900 font-black">
                  {currentNegocios.length} Clientes
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-500 font-medium">Volume das Contas:</span>
                <span className="font-mono text-neutral-900 font-extrabold">
                  {formatBRL(totalVolume)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-500 font-medium">Receita Estimada:</span>
                <span className="font-mono text-amber-700 font-black bg-amber-100/50 px-2 rounded">
                  {formatBRL(totalReceita)}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-yellow-250/30 flex items-center justify-between text-[11px] font-extrabold text-amber-700 font-sans group-hover/client:translate-x-1 transition-transform">
              <span>Classificar e Visualizar Clientes Ativos</span>
              <span>→</span>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Metrics current (Orange), Historical line chart (Blue), One-On-Ones (Pink) */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* ORANGE AREA: Current Monthly Performance Indicator */}
          <div className="bg-amber-50/40 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-amber-400 shadow-sm relative">
            <div className="absolute top-3 right-3 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shadow-glow" />
              <span className="text-[9.5px] font-black uppercase text-amber-700 font-mono">Evolução de Junho</span>
            </div>

            <h4 className="text-xs font-black text-amber-800 uppercase tracking-wider mb-4">
              Progresso e Resultados do Mês Atual
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              
              {/* Left Subsection: Progresso atual standard bar or custom individual goals list */}
              <div className="md:col-span-7 space-y-4 pr-0 md:pr-4 border-r-0 md:border-r border-neutral-200/50">
                <div className="flex items-center justify-between border-b border-neutral-200/50 pb-2">
                  <span className="text-[9px] font-mono font-black uppercase text-neutral-450 tracking-widest block leading-none">
                    METAS ESTIPULADAS X REALIZADO
                  </span>
                  {(currentUser?.role === 'admin' || currentUser?.role === 'leader') && (
                    <button
                      onClick={handleOpenNewGoalForm}
                      className="px-2.5 py-1 bg-neutral-900 border border-neutral-900 text-white rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-neutral-800 transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-2.5 h-2.5 text-[#f59e0b]" /> Criar Meta
                    </button>
                  )}
                </div>

                {/* Inline Goal management Form */}
                {showGoalForm && (currentUser?.role === 'admin' || currentUser?.role === 'leader') && (
                  <div className="bg-white border-2 border-neutral-900 p-4 rounded-xl space-y-3.5 shadow-sm text-xs">
                    <div className="flex justify-between items-center border-b pb-1.5">
                      <span className="font-black text-[10px] text-neutral-800 uppercase tracking-wider">
                        {editingGoalId ? '📝 Editar Meta Individual' : '🎯 Nova Meta Individual'}
                      </span>
                      <button 
                        onClick={() => setShowGoalForm(false)} 
                        className="text-neutral-400 hover:text-black cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold uppercase text-neutral-500">Nome da Meta</label>
                        <input 
                          type="text" 
                          value={goalName} 
                          onChange={e => setGoalName(e.target.value)} 
                          placeholder="Ex: Ligações, Reuniões..."
                          className="border rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-neutral-900 bg-white text-neutral-900"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold uppercase text-neutral-500">Tipo de Meta</label>
                        <select 
                          value={goalType} 
                          onChange={e => setGoalType(e.target.value)}
                          className="border rounded px-2 py-1 bg-white text-neutral-900"
                        >
                          <option value="quantity">Quantidade (Número)</option>
                          <option value="percentage">Porcentagem (%)</option>
                          <option value="currency">Financeiro (R$)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold uppercase text-neutral-500">Meta Desejada</label>
                        <input 
                          type="number" 
                          value={goalTarget} 
                          onChange={e => setGoalTarget(Number(e.target.value))} 
                          className="border rounded px-2.5 py-1 focus:outline-none bg-white text-neutral-900"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold uppercase text-neutral-500">Realizado</label>
                        <input 
                          type="number" 
                          value={goalRealized} 
                          onChange={e => setGoalRealized(Number(e.target.value))} 
                          className="border rounded px-2.5 py-1 focus:outline-none bg-white text-neutral-900"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold uppercase text-neutral-500">Peso % na Nota</label>
                        <input 
                          type="number" 
                          value={goalWeight} 
                          onChange={e => setGoalWeight(Number(e.target.value))} 
                          className="border rounded px-2.5 py-1 focus:outline-none bg-white text-neutral-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex flex-col gap-1 col-span-1">
                        <label className="text-[9px] font-bold uppercase text-neutral-500">Periodicidade</label>
                        <select 
                          value={goalPeriod} 
                          onChange={e => setGoalPeriod(e.target.value)}
                          className="border rounded px-2 py-1 bg-white text-neutral-900"
                        >
                          <option value="mensal">Mensal</option>
                          <option value="semanal">Semanal</option>
                          <option value="diario">Diário</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1 col-span-1">
                        <label className="text-[9px] font-bold uppercase text-neutral-500">Início Vigência</label>
                        <input 
                          type="date" 
                          value={goalStartDate} 
                          onChange={e => setGoalStartDate(e.target.value)} 
                          className="border rounded px-2 py-1 focus:outline-none bg-white text-neutral-900"
                        />
                      </div>
                      <div className="flex flex-col gap-1 col-span-1">
                        <label className="text-[9px] font-bold uppercase text-neutral-500">Fim Vigência</label>
                        <input 
                          type="date" 
                          value={goalEndDate} 
                          onChange={e => setGoalEndDate(e.target.value)} 
                          className="border rounded px-2 py-1 focus:outline-none bg-white text-neutral-900"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold uppercase text-red-600 flex items-center gap-1">
                        ⚠️ JUSTIFICATIVA OBRIGATÓRIA (HISTÓRICO PERMANENTE)
                      </label>
                      <input 
                        type="text" 
                        value={goalChangeReason} 
                        onChange={e => setGoalChangeReason(e.target.value)} 
                        placeholder="Ex: Alinhamento de safra / rampa de contratação / ajuste trimestral..."
                        className="border border-red-300 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-red-500 bg-white text-neutral-900"
                      />
                    </div>

                    <div className="flex justify-end gap-1.5 pt-1">
                      <button 
                        onClick={() => setShowGoalForm(false)} 
                        className="px-3 py-1.5 border border-neutral-300 hover:bg-neutral-100 rounded text-xs font-bold transition-all cursor-pointer text-neutral-700"
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={handleSaveGoal} 
                        className="px-4 py-1.5 bg-neutral-950 text-white rounded text-xs font-bold hover:bg-neutral-800 transition-all cursor-pointer"
                      >
                        Salvar Meta 🎯
                      </button>
                    </div>
                  </div>
                )}

                {sdr?.individualGoals && sdr.individualGoals.length > 0 ? (
                  sdr.individualGoals.map((g: any) => {
                    const realizedVal = g.realized || 0;
                    const targetVal = g.target || 1;
                    const completionPct = Math.round((realizedVal / targetVal) * 100);
                    
                    let colorClass = 'bg-blue-600';
                    let textClass = 'text-blue-600';
                    if (completionPct >= 100) {
                      colorClass = 'bg-[#10B981]';
                      textClass = 'text-emerald-600';
                    } else if (completionPct >= 70) {
                      colorClass = 'bg-[#F59E0B]';
                      textClass = 'text-amber-600';
                    } else if (completionPct < 40) {
                      colorClass = 'bg-red-500';
                      textClass = 'text-red-600';
                    }

                    return (
                      <div key={g.id} className="space-y-1.5 bg-white/50 border border-neutral-250/30 p-3 rounded-xl hover:border-neutral-350 transition-all">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-neutral-800">{g.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-extrabold text-neutral-950">
                              {g.type === 'currency' ? formatBRL(realizedVal) : g.type === 'percentage' ? `${realizedVal}%` : realizedVal} / {g.type === 'currency' ? formatBRL(g.target) : g.type === 'percentage' ? `${g.target}%` : g.target}
                            </span>
                            
                            {(currentUser?.role === 'admin' || currentUser?.role === 'leader') && (
                              <div className="flex items-center gap-1 border-l pl-2 border-neutral-300 ml-1">
                                <button 
                                  onClick={() => handleQuickUpdateRealized(g.id, -1)}
                                  className="w-5 h-5 flex items-center justify-center bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-700 rounded font-bold font-mono text-[10px] cursor-pointer"
                                  title="Decrementar realizado"
                                >
                                  -
                                </button>
                                <button 
                                  onClick={() => handleQuickUpdateRealized(g.id, 1)}
                                  className="w-5 h-5 flex items-center justify-center bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-700 rounded font-bold font-mono text-[10px] cursor-pointer"
                                  title="Incrementar realizado"
                                >
                                  +
                                </button>
                                <button 
                                  onClick={() => handleOpenEditGoalForm(g)}
                                  className="p-1 text-neutral-500 hover:text-black cursor-pointer"
                                  title="Editar Meta"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteGoal(g.id)}
                                  className="p-1 text-red-500 hover:text-red-700 cursor-pointer"
                                  title="Excluir Meta"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`${colorClass} h-full rounded-full transition-all duration-1000`} 
                            style={{ width: `${Math.min(completionPct, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-[9px] font-mono leading-none">
                          <span className={`${textClass} font-bold`}>
                            Atingimento: {completionPct}% da meta
                          </span>
                          <span className="text-neutral-400 font-bold">
                            Vigência: {g.startDate ? new Date(g.startDate).toLocaleDateString('pt-BR') : 'Sem Início'} {g.endDate ? `até ${new Date(g.endDate).toLocaleDateString('pt-BR')}` : 'Permanente'} | Peso: {g.weight}%
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : assessor?.individualGoals && assessor.individualGoals.length > 0 ? (
                  assessor.individualGoals.map((g: any) => {
                    const realizedVal = g.realized || 0;
                    const targetVal = g.target || 1;
                    const completionPct = Math.round((realizedVal / targetVal) * 100);
                    
                    let colorClass = 'bg-blue-600';
                    let textClass = 'text-blue-600';
                    if (completionPct >= 100) {
                      colorClass = 'bg-[#10B981]';
                      textClass = 'text-emerald-600';
                    } else if (completionPct >= 70) {
                      colorClass = 'bg-[#F59E0B]';
                      textClass = 'text-amber-600';
                    } else if (completionPct < 40) {
                      colorClass = 'bg-red-500';
                      textClass = 'text-red-600';
                    }

                    return (
                      <div key={g.id} className="space-y-1.5 bg-white/50 border border-neutral-250/30 p-3 rounded-xl hover:border-neutral-350 transition-all">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-neutral-800">{g.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-extrabold text-neutral-950">
                              {g.type === 'currency' ? formatBRL(realizedVal) : g.type === 'percentage' ? `${realizedVal}%` : realizedVal} / {g.type === 'currency' ? formatBRL(g.target) : g.type === 'percentage' ? `${g.target}%` : g.target}
                            </span>
                            
                            {(currentUser?.role === 'admin' || currentUser?.role === 'leader') && (
                              <div className="flex items-center gap-1 border-l pl-2 border-neutral-300 ml-1">
                                <button 
                                  onClick={() => handleQuickUpdateRealized(g.id, -1)}
                                  className="w-5 h-5 flex items-center justify-center bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-700 rounded font-bold font-mono text-[10px] cursor-pointer"
                                  title="Decrementar realizado"
                                >
                                  -
                                </button>
                                <button 
                                  onClick={() => handleQuickUpdateRealized(g.id, 1)}
                                  className="w-5 h-5 flex items-center justify-center bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-700 rounded font-bold font-mono text-[10px] cursor-pointer"
                                  title="Incrementar realizado"
                                >
                                  +
                                </button>
                                <button 
                                  onClick={() => handleOpenEditGoalForm(g)}
                                  className="p-1 text-neutral-500 hover:text-black cursor-pointer"
                                  title="Editar Meta"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteGoal(g.id)}
                                  className="p-1 text-red-500 hover:text-red-700 cursor-pointer"
                                  title="Excluir Meta"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`${colorClass} h-full rounded-full transition-all duration-1000`} 
                            style={{ width: `${Math.min(completionPct, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-[9px] font-mono leading-none">
                          <span className={`${textClass} font-bold`}>
                            Atingimento: {completionPct}% da meta
                          </span>
                          <span className="text-neutral-400 font-bold">
                            Vigência: {g.startDate ? new Date(g.startDate).toLocaleDateString('pt-BR') : 'Sem Início'} {g.endDate ? `até ${new Date(g.endDate).toLocaleDateString('pt-BR')}` : 'Permanente'} | Peso: {g.weight}%
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <>
                    {/* Booking Progress bar (Agendamentos) - Blue */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-neutral-700">Agendamentos</span>
                        <span className="font-mono font-extrabold text-[#2563EB]">{valAgendados} / {metaAgendados}</span>
                      </div>
                      <div className="w-full bg-neutral-100 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="bg-[#2563EB] h-full rounded-full transition-all duration-1000" 
                          style={{ width: `${Math.min(pacingAgendados, 100)}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-[#2563EB] font-bold font-mono">
                        Atingimento: {pacingAgendados.toFixed(0)}% da meta
                      </span>
                    </div>

                    {/* Efetivation bar (Efetivações) - Green */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-neutral-700">Efetivação</span>
                        <span className="font-mono font-extrabold text-[#10B981]">{valEfetivados} / {metaEfetivados}</span>
                      </div>
                      <div className="w-full bg-neutral-100 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="bg-[#10B981] h-full rounded-full transition-all duration-1000" 
                          style={{ width: `${Math.min(pacingEfetivados, 100)}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-[#10B981] font-bold font-mono">
                        Atingimento: {pacingEfetivados.toFixed(0)}% da meta
                      </span>
                    </div>

                    {/* Accounts Opened Progress bar (Contas Abertas) - Orange */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-neutral-700">Contas Abertas</span>
                        <span className="font-mono font-extrabold text-[#F59E0B]">{valContas} / {metaContas}</span>
                      </div>
                      <div className="w-full bg-neutral-100 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="bg-[#F59E0B] h-full rounded-full transition-all duration-1000" 
                          style={{ width: `${Math.min(pacingContas, 100)}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-[#F59E0B] font-bold font-mono">
                        Atingimento: {pacingContas.toFixed(0)}% da meta
                      </span>
                    </div>
                  </>
                )}

              </div>

              {/* Right Subsection: Connection rates / conversions */}
              <div className="md:col-span-5 flex flex-col justify-between h-full gap-5">
                
                {/* Connection Box indicator */}
                <div className="bg-white/70 p-3.5 rounded-2xl border border-amber-200/50 shadow-3xs">
                  <span className="text-[8.5px] font-mono font-black text-amber-600 block uppercase tracking-wider">
                    LIGAÇÕES EFETUADAS
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-2xl font-black text-neutral-900 font-mono tracking-tight">
                      {valLigações}
                    </span>
                    <span className="text-[10px] text-neutral-500 font-bold font-sans">
                      Tentativas
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-500 block border-t border-amber-100/50 pt-1.5 mt-1.5">
                    ⚡ {ligacoesPorAgendamento} ligações p/ 1 agendamento
                  </span>
                </div>

                {/* Conversion Box indicator */}
                <div className="bg-white/70 p-3.5 rounded-2xl border border-amber-200/50 shadow-3xs flex items-center justify-between">
                  <div>
                    <span className="text-[8.5px] font-mono font-black text-amber-600 block uppercase tracking-wider">
                      CONVERSÃO TOTAL
                    </span>
                    <span className="text-2xl font-black text-neutral-900 font-mono tracking-tight block mt-0.5">
                      {taxaConversao}%
                    </span>
                  </div>
                  <div className="p-2.5 bg-emerald-100 rounded-full text-emerald-600">
                    <TrendingUp className="w-4.5 h-4.5" />
                  </div>
                </div>

              </div>

            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* BLUE AREA: Historical Line Chart of main metas */}
            <div className="bg-sky-50/40 backdrop-blur-md rounded-3xl p-5 border border-sky-400 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-black text-sky-800 uppercase tracking-wider">
                    Histórico Geral de Performance
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsHistoryModalOpen(true)}
                    className="px-2.5 py-1 bg-sky-200 hover:bg-sky-300 text-sky-800 border border-sky-300/40 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer hover:shadow-xs flex items-center gap-1"
                  >
                    <TrendingUp className="w-3 h-3" />
                    Gerenciar Intervalos
                  </button>
                </div>
                
                <span className="text-[9px] text-[#475569] font-mono font-semibold uppercase tracking-wider block mb-2 leading-none">
                  EVOLUÇÃO DOS TRÊS PRINCIPAIS PILARES
                </span>
              </div>

              {/* Responsive chart frame */}
              <div className="h-44 w-full pr-1.5 bg-white/40 rounded-2xl border border-sky-100/30 p-1">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1/40" />
                    <XAxis dataKey="month" tick={{ fontSize: 9, fontWeight: 'bold' }} stroke="#475569" />
                    <YAxis tick={{ fontSize: 9, fontWeight: 'bold' }} stroke="#475569" />
                    <Tooltip contentStyle={{ fontSize: 10, borderRadius: '12px' }} />
                    <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 9, paddingTop: 5 }} />
                    <Line type="monotone" dataKey="Agendamento" stroke="#2563EB" strokeWidth={2.5} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="Efetivação" stroke="#10B981" strokeWidth={2.5} />
                    <Line type="monotone" dataKey="Contas Abertas" stroke="#F59E0B" strokeWidth={2.5} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* PURPLE AREA: Ranking Evolution History */}
            <div className="bg-purple-50/40 backdrop-blur-md rounded-3xl p-5 border border-purple-400 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-black text-purple-800 uppercase tracking-wider">
                    Evolução de Rankings
                  </h4>
                  <Award className="w-4.5 h-4.5 text-purple-600 animate-pulse" />
                </div>
                <p className="text-[11px] text-neutral-600 font-medium mb-3">
                  Histórico de pontuações obtidas e evolução do ranking de performance do colaborador.
                </p>
              </div>

              <div className="bg-white/75 rounded-2xl border border-purple-100/50 p-3 shadow-3xs flex-1 flex flex-col justify-between min-h-[140px] max-h-[180px] overflow-y-auto">
                {!rankingHistory || rankingHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center h-full text-neutral-400 py-4">
                    <Award className="w-7 h-7 text-neutral-300 stroke-[1.5]" />
                    <p className="text-[10px] uppercase font-black tracking-wider mt-1.5 font-mono">Sem Histórico de Ranking</p>
                    <p className="text-[9.5px] text-neutral-400 mt-0.5 max-w-[150px]">Lançamentos de resultados registrarão novos pontos no histórico.</p>
                  </div>
                ) : (
                  <table className="w-full text-left font-sans text-[10.5px]">
                    <thead>
                      <tr className="border-b border-purple-100 text-[8.5px] font-black uppercase text-purple-800/60 font-mono">
                        <th className="pb-1">Data</th>
                        <th className="pb-1 text-center">Score</th>
                        <th className="pb-1 text-right">Rank</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-100/40 font-mono font-bold text-neutral-700">
                      {rankingHistory.slice().reverse().map((item, idx) => (
                        <tr key={idx} className="hover:bg-purple-50/30">
                          <td className="py-1.5 text-neutral-500 font-sans">{item.date}</td>
                          <td className="py-1.5 text-center text-neutral-900">{item.score} pts</td>
                          <td className="py-1.5 text-right">
                            <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase font-sans ${
                              item.rank === 'A' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                              item.rank === 'B' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                              'bg-red-50 text-red-600 border border-red-100'
                            }`}>
                              Rank {item.rank}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* PINK AREA: One-on-Ones History widget (Clickable) */}
            <div 
              onClick={() => setIsOneOnOneOpen(true)}
              className="bg-pink-50/40 backdrop-blur-md rounded-3xl p-5 border border-pink-400 shadow-sm hover:shadow transition-all cursor-pointer flex flex-col justify-between group/align"
            >
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-black text-pink-800 uppercase tracking-wider">
                    Alinhamentos & One-on-One
                  </h4>
                  <span className="w-2.5 h-2.5 rounded-full bg-pink-400" />
                </div>

                <p className="text-[11px] text-neutral-600 font-medium">
                  Acompanhe e registre feedbacks bilaterais, metas comportamentais, planos de desenvolvimento e direcionamentos estratégicos.
                </p>
              </div>

              {/* Graphic Meeting representation card */}
              <div className="my-3.5 bg-white/75 p-3 rounded-2xl border border-pink-100/50 shadow-3xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-pink-100 text-pink-600 rounded-full">
                    <Users className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-500 font-bold block">Histórico de Alinhamentos</span>
                    <span className="text-xs font-mono font-black text-pink-700">
                      {myOneOnOnes.length} Encontros Gravados
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-black bg-pink-100/60 text-pink-700 px-2 py-0.5 rounded uppercase">
                  Log Ativo
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] font-extrabold text-pink-700 group-hover/align:translate-x-1 transition-transform">
                <span>Visualizar Histórico 1:1 Completo</span>
                <span>→</span>
              </div>
            </div>

          </div>

        </div>

      </div>
      </div> {/* Closes redesigned-profile-card-contents */}

      {/* DEDICATED PRINT SHEET VIEW */}
      <div id="print-fiche-root" className="hidden print:block text-black bg-white space-y-6 font-sans">
        
        {/* UPPER BANNER / BANNER DO RELATÓRIO CHIQUE */}
        <div className="border-b-2 border-neutral-900 pb-4">
          <div className="flex justify-between items-end">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-neutral-500 block leading-none font-mono">
                SISTEMA INTEGRADO DE PRODUTIVIDADE PF
              </span>
              <h1 className="text-2xl font-black uppercase tracking-tight text-neutral-900 mt-1">
                Relatório Individual de Performance e Vínculos
              </h1>
            </div>
            <div className="text-right font-mono text-[9px] text-neutral-500 leading-tight">
              <span>Gerado em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</span>
            </div>
          </div>
        </div>

        {/* PRIMARY BIOGRAPHY BLOCK: MEMBER INFO & PHOTOS & VÍNCULO */}
        <div className="flex flex-row gap-6">
          
          {/* MEMBER BIO & PHOTO CARD */}
          <div className="w-1/2 border border-neutral-200 p-4 rounded-xl flex gap-4">
            <div className="w-28 h-28 rounded-xl overflow-hidden border border-neutral-300 bg-neutral-100 shrink-0 flex items-center justify-center">
              {photo ? (
                <img src={photo} alt={name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="text-neutral-400 font-extrabold text-2xl uppercase tracking-wider">
                  {name.substring(0, 2)}
                </div>
              )}
            </div>
            <div className="flex-1 space-y-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 block font-mono">
                {entityType === 'sdr' ? 'Inside Sales Specialist (SDR)' : 'Private Wealth Assessor'}
              </span>
              <h2 className="text-base font-black uppercase tracking-tight text-neutral-950">{name}</h2>
              <div className="text-[10.5px] space-y-1 text-neutral-700">
                <p><strong>Célula / Equipe:</strong> {team || 'Sem Equipe'}</p>
                <p><strong>Perfil de Atuação:</strong> {professionalProfile || 'Comercial'}</p>
                <p><strong>Período de Admissão:</strong> {formatDateString(admissionDate)}</p>
                <p><strong>Tempo de Casa:</strong> {calculatedWorkingTime}</p>
                <p className="flex items-center gap-1">
                  <strong>Situação Cadastral:</strong> 
                  <span className={`px-1.5 py-0.5 font-bold uppercase text-[9px] rounded-sm ${isActive ? 'bg-emerald-100 text-emerald-850' : 'bg-rose-100 text-rose-850'}`}>
                    {isActive ? 'Ativo' : 'Não Ativo'}
                  </span>
                </p>
                {entityType === 'sdr' && (
                  <p><strong>Classificação Média:</strong> <span className="font-extrabold underline">{computedRankLabel}</span></p>
                )}
              </div>
            </div>
          </div>

          {/* VÍNCULO PARCEIRO CARD */}
          <div className="w-1/2 border border-neutral-200 p-4 rounded-xl">
            <span className="text-[9px] font-bold uppercase tracking-wider text-rose-600 block font-mono mb-2">
              RELAÇÃO DE PARCERIA & RODÍZIO ATIVO
            </span>
            {currentPartner ? (
              <div className="flex gap-4">
                <div className="w-24 h-24 rounded-lg overflow-hidden border border-neutral-300 bg-neutral-100 shrink-0 flex items-center justify-center">
                  {currentPartner.photo ? (
                    <img src={currentPartner.photo} alt={currentPartner.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-neutral-400 font-extrabold text-xl uppercase tracking-wider">
                      {currentPartner.name.substring(0, 2)}
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <span className="text-[8px] font-black text-rose-700 uppercase block font-mono">
                    PARCEIRO CO-VINCULADO
                  </span>
                  <h3 className="text-sm font-extrabold text-neutral-900 uppercase">{currentPartner.name}</h3>
                  <p className="text-[10.5px] text-neutral-700">
                    <strong>Atribuição:</strong> {currentPartner.roleType === 'sdr' ? 'Inside Sales SDR' : 'Wealth Private Assessor'}
                  </p>
                  <p className="text-[10.5px] text-neutral-600 mt-1">
                    <strong>Período de Vigência:</strong> {currentPartner.startDate} a {currentPartner.endDate}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 bg-neutral-50 rounded-lg border border-neutral-200 h-full flex flex-col justify-center">
                <p className="text-neutral-500 text-xs font-bold font-mono">Estágio de Distribuição Livre</p>
                <span className="text-[9.5px] text-neutral-400 mt-1 block">Não há vínculo de rodízio ativo cadastrado no corrente mês.</span>
              </div>
            )}
          </div>
        </div>

        {/* PERFORMANCE HISTORY SECTION */}
        <div className="space-y-2">
          <div className="border-b border-neutral-300 pb-1">
            <h3 className="text-xs font-black uppercase text-neutral-900 tracking-wider">
              Histórico de Produtividade & Metas de Venda
            </h3>
          </div>
          <table className="min-w-full border border-neutral-250 divide-y divide-neutral-300">
            <thead className="bg-neutral-50">
              <tr>
                <th colSpan={1} className="p-2 text-left text-[9px] font-black uppercase text-neutral-800 border-r border-neutral-200">Mês / Ano</th>
                <th className="p-2 text-center text-[9px] font-black uppercase text-neutral-800 border-r border-neutral-200">Ligações</th>
                <th className="p-2 text-center text-[9px] font-black uppercase text-neutral-800 border-r border-neutral-200">Reuniões Agendadas</th>
                <th className="p-2 text-center text-[9px] font-black uppercase text-neutral-800 border-r border-neutral-200">Reuniões Efetivadas</th>
                <th className="p-2 text-center text-[9px] font-black uppercase text-neutral-800 border-r border-neutral-200">Contas Abertas</th>
                <th className="p-2 text-center text-[9px] font-black uppercase text-neutral-800">Efetividade %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white text-[10px] font-medium text-neutral-800">
              {customChartData.map((row) => {
                const isCurrent = row.key === currentMonth;
                const rate = row.Agendamento > 0 ? Math.round((row.Efetivação / row.Agendamento) * 100) : 0;
                return (
                  <tr key={row.key} className={isCurrent ? 'bg-indigo-50/20 font-bold' : ''}>
                    <td className="p-2 font-black border-r border-neutral-200">{row.month} {isCurrent && '(Atual)'}</td>
                    <td className="p-2 text-center font-mono border-r border-neutral-200">{row.calls ?? '-'}</td>
                    <td className="p-2 text-center font-mono border-r border-neutral-200 text-neutral-800">
                      {row.Agendamento} <span className="text-neutral-400 font-sans font-normal text-[8px]">/ Meta: {row.metaAgendamentos}</span>
                    </td>
                    <td className="p-2 text-center font-mono border-r border-neutral-200 text-neutral-800">
                      {row.Efetivação} <span className="text-neutral-400 font-sans font-normal text-[8px]">/ Meta: {row.metaEfetivacoes}</span>
                    </td>
                    <td className="p-2 text-center font-mono border-r border-neutral-200 text-neutral-800">
                      {row['Contas Abertas']} <span className="text-neutral-400 font-sans font-normal text-[8px]">/ Meta: {row.metaContasAbertas}</span>
                    </td>
                    <td className="p-2 text-center font-mono font-bold text-neutral-900">{rate}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ONE-ON-ONE STRATEGIC DIRECTION LOGS */}
        <div className="space-y-2">
          <div className="border-b border-neutral-300 pb-1">
            <h3 className="text-xs font-black uppercase text-neutral-900 tracking-wider">
              Histórico de Feedbacks, Alinhamentos e Reuniões Extra-Pauta (1-on-1)
            </h3>
          </div>
          {myOneOnOnes.length > 0 ? (
            <table className="min-w-full border border-neutral-250 divide-y divide-neutral-300 text-left">
              <thead className="bg-neutral-50 text-[9px] font-black uppercase text-neutral-800">
                <tr>
                  <th className="p-2 border-r border-neutral-200">Data</th>
                  <th className="p-2 border-r border-neutral-200">Líder Responsável</th>
                  <th className="p-2 border-r border-neutral-200">Notas de Feedback & Ajustes</th>
                  <th className="p-2 border-r border-neutral-200">Plano de Ação Estratégico</th>
                  <th className="p-2 text-center">Desempenho</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-[10px] text-neutral-800">
                {myOneOnOnes.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50">
                    <td className="p-2 font-mono border-r border-neutral-200 font-bold">
                      {formatDateString(log.timestamp?.substring(0, 10))}
                    </td>
                    <td className="p-2 font-semibold border-r border-neutral-200 text-neutral-950">
                      {log.leader}
                    </td>
                    <td className="p-2 border-r border-neutral-200 text-neutral-700 italic">
                      "{log.notes || 'Sem observações'}"
                    </td>
                    <td className="p-2 border-r border-neutral-200 text-neutral-900 font-semibold">
                      "{log.actionPlan || 'Sem plano estratégico registrado'}"
                    </td>
                    <td className="p-2 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-black ${
                        log.status === 'OUTLIER' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        log.status === 'EM_RISCO' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                        'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-3 text-center text-neutral-500 bg-neutral-50 rounded-lg border border-neutral-200 font-mono text-xs">
              Nenhum registro de alinhamento ou One-on-One registrado neste período.
            </div>
          )}
        </div>

        {/* AUDIT LOGS FOR SDRs */}
        {entityType === 'sdr' && (
          <div className="space-y-2">
            <div className="border-b border-neutral-300 pb-1">
              <h3 className="text-xs font-black uppercase text-neutral-900 tracking-wider">
                Histórico de Auditoria Operacional de Ligações e Atendimento
              </h3>
            </div>
            {myAuditLogs.length > 0 ? (
              <table className="min-w-full border border-neutral-250 divide-y divide-neutral-300 text-left">
                <thead className="bg-neutral-50 text-[9px] font-black uppercase text-neutral-800">
                  <tr>
                    <th className="p-2 border-r border-neutral-200">Data</th>
                    <th className="p-2 border-r border-neutral-200">Auditor Responsável</th>
                    <th className="p-2 border-r border-neutral-200 text-center">Score Geral</th>
                    <th className="p-2 border-r border-neutral-200">Critérios Operacionais</th>
                    <th className="p-2">Notas do Auditor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 text-[10px] text-neutral-800">
                  {myAuditLogs.map((aud) => (
                    <tr key={aud.id} className="hover:bg-neutral-50">
                      <td className="p-2 font-mono border-r border-neutral-200 font-bold">
                        {formatDateString(aud.timestamp?.substring(0, 10))}
                      </td>
                      <td className="p-2 font-semibold border-r border-neutral-200 text-neutral-950">
                        {aud.leader}
                      </td>
                      <td className="p-2 text-center border-r border-neutral-200 text-indigo-700 font-mono font-black text-xs">
                        {aud.totalScore || 0} Ptos
                      </td>
                      <td className="p-2 border-r border-neutral-200 text-[8.5px] font-mono leading-tight whitespace-nowrap">
                        <div>Abordagem: {aud.score?.abordagem}/10 | Conexão: {aud.score?.conexao}/10</div>
                        <div>Especialidade: {aud.score?.especialidade}/10 | Proposta: {aud.score?.proposta}/10</div>
                        <div>Decisão: {aud.score?.tomadaDecisao}/10 | Objeções: {aud.score?.objecoes}/10</div>
                      </td>
                      <td className="p-2 text-neutral-700 italic">
                        "{aud.notes}"
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-3 text-center text-neutral-500 bg-neutral-50 rounded-lg border border-neutral-200 font-mono text-xs">
                Nenhuma auditoria operacional registrada neste mês.
              </div>
            )}
          </div>
        )}

        {/* CLIENTS DIRECT ASSIGNED LISTING */}
        <div className="space-y-2">
          <div className="border-b border-neutral-300 pb-1">
            <h3 className="text-xs font-black uppercase text-neutral-900 tracking-wider">
              Histórico de Clientes Conectados & Carteira Financeira
            </h3>
          </div>
          {currentNegocios.length > 0 ? (
            <div>
              <table className="min-w-full border border-neutral-250 divide-y divide-neutral-300 text-left">
                <thead className="bg-neutral-50 text-[9px] font-black uppercase text-neutral-800">
                  <tr>
                    <th className="p-2 border-r border-neutral-200">Cliente / Investidor</th>
                    <th className="p-2 border-r border-neutral-200 text-center">Produto de Entrada</th>
                    <th className="p-2 border-r border-neutral-200 text-center">Status</th>
                    <th className="p-2 border-r border-neutral-200 text-right">Volume Alocado</th>
                    <th className="p-2 border-r border-neutral-200 text-right">Receita Estimada (Anual)</th>
                    <th className="p-2 text-center">Segmentação / Classificação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 text-[10px] text-neutral-800">
                  {currentNegocios.map((neg) => {
                    return (
                      <tr key={neg.id} className="hover:bg-neutral-50">
                        <td className="p-2 font-bold text-neutral-950 border-r border-neutral-200">{neg.clientName}</td>
                        <td className="p-2 text-center border-r border-neutral-200">
                          <span className="font-mono text-[8.5px] border border-neutral-300 px-1 py-0.5 rounded bg-neutral-100">
                            {neg.produtoCategoria.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-2 text-center border-r border-neutral-200">
                          <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold ${
                            neg.status === 'GANHO' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                            neg.status === 'PERDIDO' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                            'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}>
                            {neg.status}
                          </span>
                        </td>
                        <td className="p-2 text-right border-r border-neutral-200 font-mono font-semibold">
                          {formatBRL(neg.volumeFinanceiro)}
                        </td>
                        <td className="p-2 text-right border-r border-neutral-200 font-mono text-neutral-600">
                          {formatBRL(neg.receitaEstimada || neg.volumeFinanceiro * 0.015)}
                        </td>
                        <td className="p-2 text-center font-bold text-neutral-800">
                          {neg.classificacao || 'Classe B (Alta Renda)'}
                        </td>
                      </tr>
                    );
                  })}
                  {/* SUMMARY TOTALS ROW FOR PRINT */}
                  <tr className="bg-neutral-100 text-neutral-900 font-black">
                    <td colSpan={3} className="p-2 font-black uppercase text-[9.5px]">Totais de Receita Comercial e Portfólio (Fechados)</td>
                    <td className="p-2 text-right font-mono text-[10.5px] text-neutral-950 border-r border-neutral-250">
                      {formatBRL(totalVolume)}
                    </td>
                    <td className="p-2 text-right font-mono text-[10.5px] text-neutral-950 border-r border-neutral-255">
                      {formatBRL(totalReceita)}
                    </td>
                    <td className="p-2 text-center font-mono font-extrabold text-[8.5px]">
                      {currentNegocios.filter(n => n.status === 'GANHO').length} Ganhos de {currentNegocios.length} Totais
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="p-2.5 bg-neutral-50 border border-neutral-250 rounded-lg text-[9.5px] text-neutral-600 mt-2 font-medium">
                <strong>Critério de Receita Estimada Comercial:</strong> O volume fechado (GANHO) acumulado sob custódia é de <strong>{formatBRL(totalVolume)}</strong>, gerando receita comercial anualizada estimada de <strong>{formatBRL(totalReceita)}</strong> sobre os produtos de entrada.
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-neutral-500 bg-neutral-50 rounded-lg border border-neutral-200 font-mono text-xs">
              Nenhum cliente ativo ou negócio ganho associado a este colaborador no mês corrente.
            </div>
          )}
        </div>

      </div>

      {/* DIALOG 1: ONE-ON-ONES LIST & REGISTER (Pink section) */}
      {isOneOnOneOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-neutral-100 flex flex-col max-h-[85vh] overflow-hidden">
            
            {/* Header popup */}
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3 shrink-0">
              <div>
                <span className="text-[9px] font-black uppercase text-pink-600 font-mono">Feedback & Evolução</span>
                <h4 className="text-base font-extrabold text-neutral-900 mt-0.5">Histórico 1-on-1: {name}</h4>
              </div>
              <button 
                onClick={() => setIsOneOnOneOpen(false)}
                className="p-1.5 hover:bg-neutral-100 text-neutral-400 hover:text-black rounded-lg cursor-pointer transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable list & form split */}
            <div className="flex-1 overflow-y-auto p-1.5 my-3 space-y-5">
              
              {/* Form to log first */}
              <form onSubmit={handleAddOneOnOne} className="bg-pink-50/40 p-4 rounded-2xl border border-pink-150 space-y-3.5">
                <h5 className="text-[11.5px] font-black text-pink-800 uppercase tracking-wider">
                  📝 Registrar Novo Alinhamento de Feedback
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Líder Condutor</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Nome do líder (ex: Victor)" 
                      value={newAlignLeader} 
                      onChange={e => setNewAlignLeader(e.target.value)}
                      className="w-full text-xs font-bold border border-neutral-250 rounded-xl px-3 py-2 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Status de Risco Geral</label>
                    <select 
                      value={newAlignStatus} 
                      onChange={e => setNewAlignStatus(e.target.value as any)}
                      className="w-full text-xs font-bold border border-neutral-250 rounded-xl px-3 py-2 bg-white"
                    >
                      <option value="NO_CAMINHO">🟢 No Caminho (Meta Batendo)</option>
                      <option value="EM_RISCO">🔴 Em Risco (Atenção/Suporte)</option>
                      <option value="OUTLIER">🌟 Outlier (Destaque Excepcional)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Anotações do One-a-One</label>
                  <textarea 
                    rows={2}
                    placeholder="Pontos abordados, gargalos descritos, etc." 
                    value={newAlignNotes} 
                    onChange={e => setNewAlignNotes(e.target.value)}
                    className="w-full text-xs border border-neutral-250 rounded-xl px-3 py-2"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Plano de Ação Traçado</label>
                  <textarea 
                    rows={2}
                    required
                    placeholder="O que o liderado se comprometeu a fazer para o próximo ciclo?" 
                    value={newAlignPlan} 
                    onChange={e => setNewAlignPlan(e.target.value)}
                    className="w-full text-xs border border-neutral-250 rounded-xl px-3 py-2"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-pink-700 hover:bg-pink-800 text-white text-xs font-black uppercase rounded-xl tracking-wider transition-all cursor-pointer"
                  >
                    Gravar Alinhamento Síncrono
                  </button>
                </div>
              </form>

              {/* Sessions list */}
              <div className="space-y-3.5">
                <span className="text-[10px] font-mono font-black uppercase text-neutral-450 block leading-none">
                  HISTÓRICO SESSÕES ANTERIORES
                </span>

                {myOneOnOnes.length > 0 ? (
                  myOneOnOnes.map((log) => (
                    <div key={log.id} className="p-4 bg-neutral-50 rounded-2xl border border-neutral-150 relative">
                      <button 
                        type="button"
                        onClick={() => {
                          if (confirm('Deletar alinhamento?')) {
                            deleteOneOnOneLog(log.id!);
                          }
                        }}
                        className="absolute top-4 right-4 p-1 hover:bg-red-50 text-neutral-400 hover:text-red-500 rounded transition-all cursor-pointer"
                        title="Deletar este feedback"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold font-mono text-neutral-500">
                          {formatDateString(log.timestamp || log.nextMeeting)}
                        </span>
                        <span className="text-[9.5px] font-mono leading-none bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded-full font-bold">
                          Por {log.leader}
                        </span>
                        <span className={`text-[8px] font-mono px-2 py-0.5 rounded leading-none font-bold uppercase ${
                          log.status === 'EM_RISCO' 
                            ? 'bg-rose-100 text-rose-700' 
                            : log.status === 'OUTLIER' 
                            ? 'bg-amber-100 text-amber-700' 
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {log.status === 'EM_RISCO' ? '🔴 Em Risco' : log.status === 'OUTLIER' ? '🌟 Outlier' : '🟢 No Caminho'}
                        </span>
                      </div>

                      <div className="space-y-2 mt-2">
                        {log.notes && (
                          <p className="text-xs text-neutral-700">
                            <strong>Anotações:</strong> {log.notes}
                          </p>
                        )}
                        <p className="text-xs text-neutral-800 bg-white/70 p-2 rounded-xl border border-neutral-100">
                          <strong>Plano de Ação:</strong> {log.actionPlan}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-neutral-400 text-xs font-bold font-mono">
                    Nenhum alinhamento ou 1:1 lançado anteriormente para esta ficha.
                  </div>
                )}
              </div>

            </div>

            <div className="shrink-0 pt-3 border-t border-neutral-100 flex justify-end">
              <button 
                onClick={() => setIsOneOnOneOpen(false)}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-black uppercase rounded-xl cursor-pointer"
              >
                Voltar ao Cockpit
              </button>
            </div>

          </div>
        </div>
      )}

      {/* DIALOG 2: CLIENTES & CLASSIFICAÇÃO (As described in area do cliente) */}
      {isClientesOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-neutral-100 flex flex-col max-h-[85vh] overflow-hidden">
            
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3 shrink-0">
              <div>
                <span className="text-[9px] font-black uppercase text-yellow-600 font-mono">Ficha do Cliente & Receita</span>
                <h4 className="text-base font-extrabold text-neutral-900 mt-0.5">Gestão de Clientes e Serviços</h4>
              </div>
              <button 
                onClick={() => setIsClientesOpen(false)}
                className="p-1.5 hover:bg-neutral-100 text-neutral-400 hover:text-black rounded-lg cursor-pointer transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-1.5 my-3 space-y-4">
              
              {/* Form to bind a new client */}
              <form onSubmit={handleAddClient} className="bg-yellow-50/40 p-4 rounded-2xl border border-yellow-200 space-y-3">
                <h5 className="text-[11px] font-black text-yellow-800 uppercase tracking-wider">
                  🤝 Associar Novo Cliente / Negócio Comercial
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[9.5px] font-bold text-neutral-500 uppercase block mb-1">Nome do Cliente</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: Cláudio Silveira" 
                      value={newClientName} 
                      onChange={e => setNewClientName(e.target.value)}
                      className="w-full text-xs font-bold border border-neutral-250 rounded-xl px-3 py-2 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[9.5px] font-bold text-neutral-500 uppercase block mb-1">Categoria de Serviço</label>
                    <select 
                      value={newClientProduct} 
                      onChange={e => setNewClientProduct(e.target.value as ProductType)}
                      className="w-full text-xs font-bold border border-neutral-250 rounded-xl px-3 py-2 bg-white"
                    >
                      <option value="INVESTIMENTOS_XP">📈 Investimentos XP</option>
                      <option value="SEGURO_VIDA">🛡️ Seguro de Vida</option>
                      <option value="CONSORCIO_IMOBILIARIO">🏠 Consórcio Prime</option>
                      <option value="CONTABILIDADE">📁 Contabilidade Corporativa</option>
                      <option value="PREVIDENCIA">🏥 Previdência Privada</option>
                      <option value="CAMBIO">💵 Câmbio e Remessas</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9.5px] font-bold text-neutral-500 uppercase block mb-1">Volume Alocado (R$)</label>
                    <input 
                      type="number" 
                      required
                      placeholder="Ex: 500000" 
                      value={newClientVolume} 
                      onChange={e => setNewClientVolume(e.target.value)}
                      className="w-full text-xs font-bold border border-neutral-250 rounded-xl px-3 py-2 bg-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black uppercase rounded-xl tracking-wider transition-all cursor-pointer"
                  >
                    Vincular Cliente Ganho
                  </button>
                </div>
              </form>

              {/* Interactive clients classification table */}
              <div className="space-y-3">
                <span className="text-[10px] font-mono font-black uppercase text-neutral-450 block leading-none">
                  CLASSIFICAR CLIENTES ATIVOS
                </span>

                {currentNegocios.length > 0 ? (
                  <div className="border border-neutral-200 rounded-3xl overflow-hidden bg-neutral-50/50">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-neutral-100 text-[10px] font-bold text-neutral-500 uppercase">
                        <tr>
                          <th className="p-3">Cliente</th>
                          <th className="p-3">Serviço/Produto</th>
                          <th className="p-3">Volume</th>
                          <th className="p-3">Classificação (A/B/C/D)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200">
                        {currentNegocios.map((neg) => (
                          <tr key={neg.id} className="hover:bg-white transition-colors">
                            <td className="p-3 font-bold text-neutral-900">{neg.clientName}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 bg-neutral-200/80 rounded-full font-mono text-[9px] font-bold uppercase">
                                {neg.produtoCategoria.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="p-3 font-mono font-bold text-neutral-700">
                              {formatBRL(neg.volumeFinanceiro)}
                            </td>
                            <td className="p-3">
                              <select
                                value={neg.classificacao || 'Classe B (Alta Renda)'}
                                onChange={(e) => updateNegocio(neg.id, { classificacao: e.target.value })}
                                className="text-[11px] font-bold bg-white border border-neutral-250 rounded-xl px-2.5 py-1 focus:ring-1 focus:ring-black cursor-pointer shadow-3xs"
                              >
                                <option value="Classe A (VIP)">★ Classe A (VIP)</option>
                                <option value="Classe B (Alta Renda)">★ Classe B (Alta Renda)</option>
                                <option value="Classe C (Varejo Ativo)">★ Classe C (Varejo Ativo)</option>
                                <option value="Classe D (Inativo)">★ Classe D (Inativo)</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 text-center text-neutral-400 text-xs font-bold font-mono">
                    Nenhum cliente ganho associado diretamente para classificar neste mês. Use o painel acima para vincular o primeiro!
                  </div>
                )}
              </div>

            </div>

            <div className="shrink-0 pt-3 border-t border-neutral-100 flex justify-end">
              <button 
                onClick={() => setIsClientesOpen(false)}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-black uppercase rounded-xl cursor-pointer"
              >
                Voltar ao Cockpit
              </button>
            </div>

          </div>
        </div>
      )}

      {/* DIALOG 3: HISTÓRICO COMPLETO COM ESCOLHA DE INTERVALOS */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-5xl w-full p-6 shadow-2xl border border-neutral-200 flex flex-col max-h-[92vh] overflow-hidden text-neutral-800">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="p-1 px-2.5 bg-sky-100 text-sky-800 border border-sky-200 rounded-lg text-[9px] font-black uppercase tracking-wider font-mono">
                  Série Histórica
                </span>
                <h4 className="text-base font-extrabold text-neutral-900 animate-pulse">
                  Painel de Performance Geral &bull; <span className="text-sky-700 font-extrabold">{name}</span>
                </h4>
              </div>
              <button 
                onClick={() => setIsHistoryModalOpen(false)}
                className="p-1.5 hover:bg-neutral-100 text-neutral-500 hover:text-black rounded-lg cursor-pointer transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto my-4 space-y-5 pr-1">
              
              {/* Interval selector card */}
              <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200/60 shadow-3xs grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-7">
                  <label className="text-[10px] font-mono font-black uppercase text-neutral-500 block mb-2">
                    Filtro de Intervalo de Tempo
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { key: 'all', label: 'Todo o Histórico' },
                      { key: 'year_2026', label: 'Ano de 2026' },
                      { key: 'last_6', label: 'Últimos 6 Meses' },
                      { key: 'last_3', label: 'Últimos 3 Meses' },
                      { key: 'custom', label: 'Personalizado 📅' },
                    ].map((idx) => (
                      <button
                        key={idx.key}
                        type="button"
                        onClick={() => {
                          setHistoryPreset(idx.key as any);
                          if (idx.key === 'year_2026') {
                            setHistoryStartMonth('2026-01');
                            setHistoryEndMonth('2026-06');
                          } else if (idx.key === 'last_6') {
                            setHistoryStartMonth('2026-01');
                            setHistoryEndMonth('2026-06');
                          } else if (idx.key === 'last_3') {
                            setHistoryStartMonth('2026-04');
                            setHistoryEndMonth('2026-06');
                          } else if (idx.key === 'all') {
                            setHistoryStartMonth('2025-01');
                            setHistoryEndMonth('2026-06');
                          }
                        }}
                        className={`px-3 py-1.5 text-[11px] font-bold rounded-lg cursor-pointer transition-all border ${
                          historyPreset === idx.key
                            ? 'bg-neutral-900 border-neutral-950 text-white shadow-3xs'
                            : 'bg-white hover:bg-neutral-100 text-neutral-600 border-neutral-300/60'
                        }`}
                      >
                        {idx.label}
                      </button>
                    ))}
                  </div>
                </div>

                {historyPreset === 'custom' && (
                  <div className="md:col-span-5 grid grid-cols-2 gap-2 animate-fade-in">
                    <div>
                      <label className="text-[9px] font-bold uppercase text-neutral-450 block mb-1">Mês Inicial</label>
                      <select
                        value={historyStartMonth}
                        onChange={(e) => setHistoryStartMonth(e.target.value)}
                        className="w-full text-xs font-bold bg-white border border-neutral-300 rounded-lg px-2 py-1.5 cursor-pointer focus:ring-1 focus:ring-black"
                      >
                        {ALL_MONTHS.map((m) => (
                          <option key={m.key} value={m.key}>{m.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] font-bold uppercase text-neutral-450 block mb-1">Mês Final</label>
                      <select
                        value={historyEndMonth}
                        onChange={(e) => setHistoryEndMonth(e.target.value)}
                        className="w-full text-xs font-bold bg-white border border-neutral-300 rounded-lg px-2 py-1.5 cursor-pointer focus:ring-1 focus:ring-black"
                      >
                        {ALL_MONTHS.map((m) => (
                          <option key={m.key} value={m.key}>{m.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Graphical representation */}
              <div className="bg-sky-50/10 p-5 rounded-3xl border border-sky-400/40">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-mono font-black uppercase text-sky-800 tracking-wider">
                    Evolução Histórica no Intervalo Selecionado
                  </span>
                  <span className="text-[9.5px] font-mono text-neutral-500 font-bold">
                    Contém {filteredHistoryMonths.length} meses plotados
                  </span>
                </div>

                <div className="h-60 w-full pr-1 px-1 bg-white rounded-2xl border border-neutral-200/50 p-2 shadow-inner col-span-12">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={customChartData} margin={{ top: 20, right: 15, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 9, fontWeight: 'bold' }} stroke="#4b5563" />
                      <YAxis tick={{ fontSize: 9, fontWeight: 'bold' }} stroke="#4b5563" />
                      <Tooltip contentStyle={{ fontSize: 11, borderRadius: '12px' }} />
                      <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                      <Line type="monotone" name="Agendamentos" dataKey="Agendamento" stroke="#2563EB" strokeWidth={3} activeDot={{ r: 6 }} />
                      <Line type="monotone" name="Efetivações" dataKey="Efetivação" stroke="#10B981" strokeWidth={3} />
                      <Line type="monotone" name="Contas Abertas" dataKey="Contas Abertas" stroke="#F59E0B" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Data table representation */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono font-black uppercase text-neutral-450 block leading-none">
                  Ficha Detalhada por Período
                </span>

                <div className="border border-neutral-200 rounded-2xl overflow-hidden bg-white shadow-3xs overflow-x-auto">
                  <table className="w-full text-xs text-left min-w-[700px]">
                    <thead className="bg-[#f8fafc] text-[10px] font-black text-neutral-500 uppercase tracking-wider border-b border-neutral-200">
                      <tr>
                        <th className="p-3">Referência</th>
                        <th className="p-3 text-center">Agendamentos</th>
                        <th className="p-3 text-center">Efetivações</th>
                        <th className="p-3 text-center">Contas Abertas</th>
                        <th className="p-3 text-center">Taxa de Conversão</th>
                        <th className="p-3 text-center">Ligações (Calls)</th>
                        <th className="p-3 text-center">Ligações p/ Agend.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 font-medium">
                      {customChartData.map((row) => {
                        const rate = row.Agendamento > 0 ? Math.round((row.Efetivação / row.Agendamento) * 100) : 0;
                        const callsPerSchedules = row.Agendamento > 0 ? Math.round(row.calls / row.Agendamento) : 0;
                        return (
                          <tr key={row.key} className="hover:bg-neutral-50 transition-colors">
                            <td className="p-3 font-bold text-neutral-900 border-r border-neutral-100">{row.month}</td>
                            <td className="p-3 text-center border-r border-neutral-100">
                              <span className="font-bold text-blue-600 font-mono text-xs">{row.Agendamento}</span>
                              <span className="text-neutral-400 text-[10px] font-bold"> / {row.metaAgendamentos}</span>
                            </td>
                            <td className="p-3 text-center border-r border-neutral-100">
                              <span className="font-bold text-emerald-600 font-mono text-xs">{row.Efetivação}</span>
                              <span className="text-neutral-400 text-[10px] font-bold"> / {row.metaEfetivacoes}</span>
                            </td>
                            <td className="p-3 text-center border-r border-neutral-100">
                              <span className="font-bold text-amber-600 font-mono text-xs">{row['Contas Abertas']}</span>
                              <span className="text-neutral-400 text-[10px] font-bold"> / {row.metaContasAbertas}</span>
                            </td>
                            <td className="p-3 text-center border-r border-neutral-100">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
                                rate >= 50 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}>
                                {rate}%
                              </span>
                            </td>
                            <td className="p-3 text-center font-mono text-xs text-neutral-600 border-r border-neutral-100">{row.calls || 0}</td>
                            <td className="p-3 text-center font-mono text-xs text-neutral-600">{callsPerSchedules || 0} lig.</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="shrink-0 pt-3 border-t border-neutral-100 flex justify-end">
              <button 
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-850 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer shadow-3xs"
              >
                Fechar Ficha Temporal
              </button>
            </div>

          </div>
        </div>
      )}

      {/* DIALOG 4: INSERÇÃO DE LINK DE FOTO */}
      {showPhotoUrlDialog && (
        <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in text-neutral-800">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-150">
              <span className="p-1 px-2.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[9px] font-black uppercase tracking-wider font-mono">
                Área do Líder
              </span>
              <button 
                onClick={() => {
                  setPhotoUrlInput('');
                  setShowPhotoUrlDialog(false);
                }} 
                className="text-neutral-500 hover:text-black cursor-pointer p-1 rounded-lg hover:bg-neutral-100 transition-colors"
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="py-4 space-y-4">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-neutral-900 text-sm uppercase tracking-wide">
                  Inserir Foto via Link
                </h3>
              </div>
              
              <p className="text-xs text-neutral-500 leading-relaxed font-semibold">
                Insira uma URL direta de imagem da internet para definir como foto de perfil de <span className="font-extrabold text-neutral-800">{name}</span>.
              </p>
              
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-neutral-500 block">URL da Foto</label>
                <input
                  type="url"
                  placeholder="https://exemplo.com/foto_perfil.jpg"
                  value={photoUrlInput}
                  onChange={(e) => setPhotoUrlInput(e.target.value)}
                  className="w-full text-xs font-bold bg-neutral-50 hover:bg-neutral-105 border border-neutral-300 rounded-xl px-3 py-2.5 outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => {
                  setPhotoUrlInput('');
                  setShowPhotoUrlDialog(false);
                }}
                className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSavePhotoUrl}
                disabled={!photoUrlInput.trim()}
                className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-850 text-white text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Aplicar Foto Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MEMBER PROFILE MODAL */}
      {isEditProfileModalOpen && (
        <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border-2 border-neutral-900 dark:border-neutral-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1 px-2.5 bg-amber-500 text-black text-[9px] font-black uppercase tracking-widest rounded leading-none">
                  Edição Total de Ficha
                </span>
                <h3 className="text-sm font-black uppercase text-neutral-900 dark:text-white font-display">
                  Editar {name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditProfileModalOpen(false)}
                className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfileEdits} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Nome */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-black uppercase text-neutral-600 dark:text-neutral-400">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border-2 border-neutral-900 dark:border-neutral-700 p-2 rounded-xl text-xs font-bold text-neutral-900 dark:text-white"
                  />
                </div>

                {/* Equipe / Time */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-black uppercase text-neutral-600 dark:text-neutral-400">
                    Equipe (PF, PJ, Advisor)
                  </label>
                  <select
                    value={editTeam}
                    onChange={(e) => setEditTeam(e.target.value)}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border-2 border-neutral-900 dark:border-neutral-700 p-2 rounded-xl text-xs font-bold text-neutral-900 dark:text-white cursor-pointer"
                  >
                    <option value="PF">PF</option>
                    <option value="PJ">PJ</option>
                    <option value="Advisor">Advisor</option>
                  </select>
                </div>

                {/* Data de Admissão */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-black uppercase text-neutral-600 dark:text-neutral-400">
                    Data de Admissão
                  </label>
                  <input
                    type="date"
                    value={editAdmissionDate}
                    onChange={(e) => setEditAdmissionDate(e.target.value)}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border-2 border-neutral-900 dark:border-neutral-700 p-2 rounded-xl text-xs font-bold text-neutral-900 dark:text-white"
                  />
                </div>

                {/* Cargo / Perfil */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-black uppercase text-neutral-600 dark:text-neutral-400">
                    Cargo / Perfil
                  </label>
                  <input
                    type="text"
                    value={editProfile}
                    onChange={(e) => setEditProfile(e.target.value)}
                    placeholder="Ex: SDR Senior, Consultor High Net..."
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border-2 border-neutral-900 dark:border-neutral-700 p-2 rounded-xl text-xs font-bold text-neutral-900 dark:text-white"
                  />
                </div>

                {/* Situação / Status */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-black uppercase text-neutral-600 dark:text-neutral-400">
                    Status na Operação
                  </label>
                  <select
                    value={editActive ? 'ativo' : 'inativo'}
                    onChange={(e) => setEditActive(e.target.value === 'ativo')}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border-2 border-neutral-900 dark:border-neutral-700 p-2 rounded-xl text-xs font-bold text-neutral-900 dark:text-white cursor-pointer"
                  >
                    <option value="ativo">✅ Ativo na Operação</option>
                    <option value="inativo">❌ Inativo / Desligado</option>
                  </select>
                </div>

                {/* Foto URL */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-black uppercase text-neutral-600 dark:text-neutral-400">
                    URL da Foto (Opcional)
                  </label>
                  <input
                    type="text"
                    value={editPhoto}
                    onChange={(e) => setEditPhoto(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border-2 border-neutral-900 dark:border-neutral-700 p-2 rounded-xl text-xs font-bold text-neutral-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Seção de Metas Individuais do Mês */}
              <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
                <span className="text-[10px] font-mono font-black uppercase text-amber-600 dark:text-amber-400 block tracking-wider">
                  🎯 Configurar Metas do Mês
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-black uppercase text-neutral-500">Agendamentos</label>
                    <input
                      type="number"
                      value={editMetaAgendamentos}
                      onChange={(e) => setEditMetaAgendamentos(Number(e.target.value))}
                      className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 p-2 rounded-lg text-xs font-bold text-neutral-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-black uppercase text-neutral-500">Efetivações</label>
                    <input
                      type="number"
                      value={editMetaEfetivacoes}
                      onChange={(e) => setEditMetaEfetivacoes(Number(e.target.value))}
                      className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 p-2 rounded-lg text-xs font-bold text-neutral-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-black uppercase text-neutral-500">Contas Abertas</label>
                    <input
                      type="number"
                      value={editMetaContasAbertas}
                      onChange={(e) => setEditMetaContasAbertas(Number(e.target.value))}
                      className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 p-2 rounded-lg text-xs font-bold text-neutral-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsEditProfileModalOpen(false)}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-black uppercase rounded-xl cursor-pointer transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-neutral-900 hover:bg-black text-amber-400 text-xs font-black uppercase rounded-xl cursor-pointer transition shadow-md"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
