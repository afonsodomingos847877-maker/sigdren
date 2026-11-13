import React, { useState } from 'react';
import { Plus, Shield, UserCheck, UserX } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { ROLES } from '@/config/roles';
import { RoleCode } from '@/types';
import { Badge } from '@/components/ui/Badge';

export const UsersPage: React.FC = () => {
  const { users, addUser, updateUser } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '+258 84 ',
    role: 'inspector_campo' as RoleCode,
    department: 'Fiscalização e Inspecção de Campo',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = addUser({
      ...form,
      active: true,
    });
    if (!res.ok) {
      setError(res.error ?? 'Erro ao criar utilizador.');
      return;
    }
    setShowForm(false);
    setError('');
    setForm({
      fullName: '',
      email: '',
      phone: '+258 84 ',
      role: 'inspector_campo',
      department: '',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[#171717]">
            Gestão de Utilizadores e Permissões (RBAC)
          </h1>
          <p className="text-sm text-[#777777]">
            Controlo de acessos baseado em 6 perfis institucionais da EMSAAM.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 rounded-md bg-[#142B4A] text-white text-xs font-medium hover:bg-[#171717] flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Novo Utilizador
        </button>
      </div>

      {/* Roles Reference */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {(Object.keys(ROLES) as RoleCode[]).map((code) => (
          <div key={code} className="bg-white rounded-xl border border-neutral-200 p-4 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-[#142B4A]">
              <Shield className="w-3.5 h-3.5 text-[#2563EB]" /> {ROLES[code].name}
            </div>
            <p className="text-[#777777] mt-1">{ROLES[code].description}</p>
          </div>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4 text-xs">
          <h2 className="font-display text-base font-semibold text-[#171717]">Adicionar Utilizador</h2>
          {error && <div className="p-2.5 rounded bg-red-50 text-[#DC2626]">{error}</div>}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <input
              required
              placeholder="Nome completo"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="px-3 py-2 rounded-md border border-neutral-200"
            />
            <input
              type="email"
              required
              placeholder="Correio electrónico"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="px-3 py-2 rounded-md border border-neutral-200"
            />
            <input
              placeholder="Telefone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="px-3 py-2 rounded-md border border-neutral-200"
            />
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as RoleCode })}
              className="px-3 py-2 rounded-md border border-neutral-200"
            >
              {(Object.keys(ROLES) as RoleCode[]).map((code) => (
                <option key={code} value={code}>{ROLES[code].name}</option>
              ))}
            </select>
            <input
              required
              placeholder="Departamento / Unidade"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="px-3 py-2 rounded-md border border-neutral-200 sm:col-span-2"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-[#777777]">Cancelar</button>
            <button type="submit" className="px-4 py-2 rounded-md bg-[#2563EB] text-white font-medium">Criar Conta</button>
          </div>
        </form>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4F4F4] text-[#777777] uppercase text-[11px]">
              <tr>
                <th className="px-4 py-3 font-semibold">Utilizador</th>
                <th className="px-4 py-3 font-semibold">Departamento</th>
                <th className="px-4 py-3 font-semibold">Perfil RBAC</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold text-right">Acções</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-[#171717]">{u.fullName}</div>
                    <div className="text-[11px] text-[#777777]">{u.email} • {u.phone}</div>
                  </td>
                  <td className="px-4 py-3 text-[#555555]">{u.department}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => updateUser(u.id, { role: e.target.value as RoleCode })}
                      className="px-2 py-1 rounded border border-neutral-200 bg-white text-xs"
                    >
                      {(Object.keys(ROLES) as RoleCode[]).map((code) => (
                        <option key={code} value={code}>{ROLES[code].name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={u.active ? 'green' : 'red'}>
                      {u.active ? 'Activo' : 'Desactivado'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => updateUser(u.id, { active: !u.active })}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium ${
                        u.active ? 'text-[#DC2626] hover:bg-red-50' : 'text-[#16A34A] hover:bg-emerald-50'
                      }`}
                    >
                      {u.active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                      {u.active ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

