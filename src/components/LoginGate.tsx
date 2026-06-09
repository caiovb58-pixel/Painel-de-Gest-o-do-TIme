import React, { useState } from 'react';
import { Shield } from 'lucide-react';
import { AuthUser, TeamLeader } from '../types';

interface LoginGateProps {
  onLogin: (user: AuthUser) => Promise<void> | void;
  leaders: TeamLeader[];
}

export function LoginGate({ onLogin, leaders }: LoginGateProps) {
  const [username, setUsername] = useState<string>('');
  const [passcode, setPasscode] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    const trimmedUser = username.trim();
    if (!trimmedUser || !passcode) {
      setErrorMsg('Por favor, preencha todos os campos!');
      setIsLoading(false);
      return;
    }

    try {
      // Admin Connection Override: Log 'Caio', Password 'VMB' (case insensitive username)
      if (trimmedUser.toLowerCase() === 'caio' && passcode === 'VMB') {
        await onLogin({
          role: 'admin',
          name: 'Caio',
          teamName: 'Equipe do Caio',
          leaderTitle: 'Líder de Estratégia Caio'
        });
        setIsLoading(false);
        return;
      }

      // Leader lookup matching by user's typed name or team name (case insensitive)
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
    <form onSubmit={handleSubmit} className="space-y-4 font-sans text-left">
      {errorMsg && (
        <div className="text-xs font-bold text-red-700 bg-red-50 border border-red-300 p-3 rounded-lg text-center animate-shake leading-normal">
          {errorMsg}
        </div>
      )}

      {/* Login input */}
      <div className="space-y-1">
        <label className="block text-[10px] font-bold text-neutral-700 uppercase tracking-wider">
          Usuário (Login)
        </label>
        <input
          type="text"
          placeholder="Digite seu usuário..."
          value={username}
          onChange={e => setUsername(e.target.value)}
          disabled={isLoading}
          className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-xs leading-normal font-medium focus:bg-white focus:ring-1 focus:ring-black focus:outline-none transition-all disabled:opacity-50"
          required
        />
      </div>

      {/* Password input */}
      <div className="space-y-1">
        <label className="block text-[10px] font-bold text-neutral-700 uppercase tracking-wider">
          Senha de Segurança
        </label>
        <input
          type="password"
          placeholder="Digite sua senha..."
          value={passcode}
          onChange={e => setPasscode(e.target.value)}
          disabled={isLoading}
          className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-xs leading-normal focus:bg-white focus:ring-1 focus:ring-black focus:outline-none transition-all disabled:opacity-50"
          required
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2.5 bg-neutral-950 hover:bg-neutral-900 border border-neutral-950 text-white font-black text-xs rounded-xl uppercase tracking-wider hover:opacity-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
      >
        <Shield className="w-3.5 h-3.5 text-[#fff]" />
        {isLoading ? 'Autenticando...' : 'Autenticar e Entrar'}
      </button>

      <div className="text-center pt-2">
        <span className="text-[10px] text-neutral-400 italic font-medium">
          🔒 Conexão SSL Segura e Criptografia Ponta-a-Ponta
        </span>
      </div>
    </form>
  );
}
