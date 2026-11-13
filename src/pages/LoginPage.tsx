import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, ShieldCheck, UserCheck } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { ROLES } from '@/config/roles';
import { RoleCode } from '@/types';
import { Logo } from '@/components/ui/Logo';

export const LoginPage: React.FC = () => {
  const { login, loginAsRole } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@sigdren.co.mz');
  const [password, setPassword] = useState('@Admin123@');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await login(email, password);
    if (!res.ok) {
      setError(res.error ?? 'Erro ao autenticar');
      return;
    }
    navigate('/app');
  };

  const handleQuickRole = async (role: RoleCode) => {
    await loginAsRole(role);
    navigate('/app');
  };

  return (
    <div className="min-h-screen bg-[#F4F4F4] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full mx-auto grid md:grid-cols-5 bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        {/* Left Auth Form */}
        <div className="md:col-span-3 p-8 sm:p-10">
          <div className="flex items-center justify-between mb-8">
            <Logo />
            <Link
              to="/"
              className="text-xs text-[#777777] hover:text-[#171717] flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Website
            </Link>
          </div>

          <h1 className="font-display text-2xl font-semibold text-[#171717]">
            Acesso ao Sistema de Gestão
          </h1>
          <p className="text-sm text-[#777777] mt-1 mb-6">
            Autentique-se com as suas credenciais institucionais da EMSAAM.
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-xs text-[#DC2626]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#171717] mb-1.5">
                Correio electrónico institucional
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-md border border-neutral-300 text-sm focus:outline-none focus:border-[#2563EB]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#171717] mb-1.5">
                Palavra-passe
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-md border border-neutral-300 text-sm focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-md bg-[#171717] hover:bg-[#142B4A] text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" /> Iniciar Sessão
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-neutral-100 flex items-center gap-2 text-xs text-[#777777]">
            <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
            <span>Sessão protegida com controlo de acessos RBAC e registo de auditoria.</span>
          </div>
        </div>

        {/* Right Quick Role Selector for Testing RBAC */}
        <div className="md:col-span-2 bg-[#142B4A] text-white p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-blue-200 font-semibold mb-2">
              <UserCheck className="w-4 h-4" /> Perfis de Demonstração
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed mb-5">
              Seleccione qualquer perfil abaixo para testar as permissões diferenciadas (RBAC) em todos os módulos:
            </p>

            <div className="space-y-2">
              {(Object.keys(ROLES) as RoleCode[]).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => handleQuickRole(code)}
                  className="w-full text-left px-3.5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 transition-colors"
                >
                  <div className="text-xs font-semibold text-white">{ROLES[code].name}</div>
                  <div className="text-[11px] text-blue-200/80 line-clamp-1">{ROLES[code].description}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 text-[11px] text-neutral-400">
            Dados de demonstração isolados • EMSAAM Matola
          </div>
        </div>
      </div>
    </div>
  );
};

