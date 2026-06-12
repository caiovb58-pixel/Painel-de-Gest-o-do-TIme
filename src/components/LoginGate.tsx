import React, { useState } from 'react';
import { Shield, Lock, Eye, EyeOff, ChevronDown, Check, HelpCircle } from 'lucide-react';
import { AuthUser, TeamLeader } from '../types';

interface LoginGateProps {
  onLogin: (user: AuthUser) => Promise<void> | void;
  leaders: TeamLeader[];
}

export function LoginGate({ onLogin, leaders }: LoginGateProps) {
  const [username, setUsername] = useState<string>('');
  const [passcode, setPasscode] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [infoMsg, setInfoMsg] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [currentImgIndex, setCurrentImgIndex] = useState<number>(0);

  const bannerImages = [
    "https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    "https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    "https://images.pexels.com/photos/3182811/pexels-photo-3182811.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    "https://images.pexels.com/photos/7014337/pexels-photo-7014337.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    "https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
  ];

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImgIndex(prev => (prev + 1) % bannerImages.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [bannerImages.length]);

  const handleSelectQuickUser = (userLogin: string, code: string) => {
    setUsername(userLogin);
    setPasscode(code);
    setShowDropdown(false);
    setErrorMsg('');
    setInfoMsg(`Credenciais de "${userLogin}" prontas para login!`);
    setTimeout(() => setInfoMsg(''), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    const trimmedUser = username.trim();
    if (!trimmedUser || !passcode) {
      setErrorMsg('Por favor, digite ou selecione um usuário e insira sua senha!');
      setIsLoading(false);
      return;
    }

    try {
      // Admin Override
      const caioLeader = leaders.find(l => l.name.toLowerCase() === 'caio' || l.id === 'leader-caio');
      const caioPasscode = caioLeader ? caioLeader.passcode : 'VMB';

      if (trimmedUser.toLowerCase() === 'caio' && passcode === caioPasscode) {
        await onLogin({
          role: 'admin',
          name: 'Caio',
          teamName: caioLeader?.teamName || 'Equipe do Caio',
          leaderTitle: caioLeader?.leaderTitle || 'Líder de Estratégia Caio'
        });
        setIsLoading(false);
        return;
      }

      // Leader lookup matching
      const matchedLeader = leaders.find(l => 
        (l.name.toLowerCase() === trimmedUser.toLowerCase() || 
         l.teamName.toLowerCase() === trimmedUser.toLowerCase()) && 
        l.passcode === passcode
      );

      if (matchedLeader) {
        await onLogin({
          role: 'leader',
          teamName: matchedLeader.teamName,
          leaderTitle: matchedLeader.leaderTitle,
          name: matchedLeader.name
        });
        setIsLoading(false);
        return;
      }

      setErrorMsg('Acesso negado. Por favor, verifique usuário e senha.');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro durante a autenticação.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex bg-neutral-50 text-neutral-900 font-sans selection:bg-neutral-900 selection:text-white transition-all">
      
      {/* LEFT COLUMN: HERO BANNER (CLEAN, ELEGANT & STATIC STYLE) */}
      <div className="hidden lg:flex w-[48%] xl:w-[50%] min-h-screen relative overflow-hidden bg-neutral-950">
        
        {/* Sliding Premium Team Images with clean crossfade */}
        {bannerImages.map((imgSrc, idx) => (
          <div
            key={imgSrc}
            className={`absolute inset-0 transition-opacity duration-[1500ms] ease-in-out ${
              idx === currentImgIndex ? 'opacity-60' : 'opacity-0 pointer-events-none'
            }`}
          >
            <img
              src={imgSrc}
              alt={`Business Team Leadership Representation ${idx + 1}`}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
        ))}

        {/* Dark Elegant Gradient Overlap */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-neutral-850/20" />

        {/* Minimal Header on Left Corner */}
        <div className="absolute top-8 left-8 z-25 flex items-center gap-2">
          <div className="w-6 h-6 bg-white text-black p-1 rounded-md flex items-center justify-center font-black text-xs">
            H
          </div>
          <span className="text-[10px] uppercase font-black tracking-widest text-white leading-none">
            Hub de Liderança comercial
          </span>
        </div>

        {/* Banner Content */}
        <div className="absolute bottom-16 left-12 right-12 z-20 space-y-4 text-left">
          
          <h2 className="text-2xl xl:text-3xl font-black text-white leading-snug tracking-tight max-w-xl font-display">
            Crie um plano estratégico para os objetivos de venda da sua corretora.
          </h2>

          <p className="text-xs text-white leading-relaxed max-w-lg opacity-90">
            Painel Centralizado de SDRs, Alocações Eficientes, Metas de Agendamentos e Relatórios de Conversão.
          </p>

          <div className="pt-4 border-t border-white/10 max-w-md">
            {/* Access Path Info */}
            <div className="text-[10px] text-neutral-300 font-medium tracking-wide">
              Acesse: HUB → Menu → Ferramentas → Planejamento Financeiro
            </div>
          </div>

        </div>
      </div>

      {/* RIGHT COLUMN: LOGIN FORM SECTION */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 lg:px-16 xl:px-24 bg-[#FAF9F6]">
        
        {/* Crisp Card Layout */}
        <div className="w-full max-w-[430px] bg-white border border-neutral-200/80 p-8 xl:p-10 rounded-[2.25rem] shadow-sm space-y-6">
          
          {/* Form Header with Logo */}
          <div className="space-y-4">
            
            {/* stylized H logo */}
            <div className="w-11 h-11 bg-neutral-950 text-white rounded-[14px] flex items-center justify-center font-display font-black text-2xl tracking-tighter hover:scale-105 transition shadow-xs">
              H
            </div>

            <div className="space-y-1 text-left">
              <p className="text-[11.5px] font-bold text-neutral-400 leading-none tracking-wider">
                Bom ter você aqui novamente!
              </p>
              <h1 className="text-xl xl:text-2xl font-black text-neutral-900 tracking-tight">
                Informe sua senha para acessar
              </h1>
            </div>

          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            
            {errorMsg && (
              <div className="text-xs font-bold text-red-800 bg-red-50/80 border border-red-200 p-3 rounded-xl text-center leading-normal animate-pulse">
                ⚠️ {errorMsg}
              </div>
            )}

            {infoMsg && (
              <div className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-center leading-normal">
                ✓ {infoMsg}
              </div>
            )}

            {/* Custom User input */}
            <div className="relative space-y-1">
              <label className="block text-[10px] font-extrabold text-neutral-500 uppercase tracking-wider">
                Código de Usuário / Login
              </label>
              
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Digite seu login operacional..."
                  value={username}
                  onChange={e => {
                    setUsername(e.target.value);
                    setErrorMsg('');
                  }}
                  disabled={isLoading}
                  className="w-full px-3.5 py-3 bg-neutral-50 hover:bg-neutral-100/50 focus:bg-white border border-neutral-300 text-neutral-900 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 focus:outline-none transition-all disabled:opacity-50"
                  required
                />
              </div>
            </div>

            {/* Password input */}
            <div className="space-y-1">
              <label className="block text-[10px] font-extrabold text-neutral-500 uppercase tracking-wider">
                Senha de Segurança
              </label>
              
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Digite sua senha..."
                  value={passcode}
                  onChange={e => {
                    setPasscode(e.target.value);
                    setErrorMsg('');
                  }}
                  disabled={isLoading}
                  className="w-full pl-3.5 pr-10 py-3 bg-neutral-50 hover:bg-neutral-100/50 focus:bg-white border border-neutral-300 text-neutral-900 rounded-xl text-xs font-mono focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 focus:outline-none transition-all disabled:opacity-50"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-neutral-450 hover:text-neutral-950 p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Helper password box */}
            <div className="flex items-center justify-between pt-1">
              <div className="text-[10px] text-neutral-400 font-medium inline-flex items-center gap-1">
                <Shield className="w-3 h-3 text-neutral-400" />
                Acesso Restrito
              </div>
              
              <button
                type="button"
                onClick={() => {
                  alert('🔒 Chave de Segurança:\nEntre em contato com Caio ou redefina as credenciais diretamente no painel Administrativo.');
                }}
                className="text-[10.5px] font-extrabold text-neutral-600 hover:text-neutral-900 transition underline cursor-pointer"
              >
                Esqueci minha senha
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 mt-2 bg-neutral-900 hover:bg-neutral-800 text-white font-black text-[11px] rounded-xl uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 hover:translate-y-[-1px] active:translate-y-0"
            >
              <Shield className="w-3.5 h-3.5 text-white" />
              {isLoading ? 'Confirmando Acesso...' : 'Acessar e Entrar'}
            </button>

          </form>

          {/* Symmetrical system badge footer */}
          <div className="text-center pt-2 space-y-1">
            <span className="text-[9.5px] text-neutral-400 font-mono font-medium block">
              🔒 Conexão SSL Dedicada &bull; Criptografia Ativa
            </span>
            <span className="text-[8px] text-neutral-400 font-bold uppercase tracking-wider block">
              Conselho Operacional de Investimentos
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}
