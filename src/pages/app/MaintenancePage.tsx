import React, { useState } from 'react';
import { Calendar, Clock, Plus, Wrench } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Badge, workOrderStatusTone } from '@/components/ui/Badge';
import { WorkOrderPriority, WorkOrderStatus } from '@/types';

export const MaintenancePage: React.FC = () => {
  const {
    currentUser,
    can,
    infrastructures,
    maintenancePlans,
    workOrders,
    addWorkOrder,
    updateWorkOrder,
  } = useApp();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: `OT-2026-0${workOrders.length + 17}`,
    infrastructureId: infrastructures[0]?.id ?? '',
    title: '',
    description: '',
    assignedTeam: 'Equipa Operacional Alfa',
    priority: 'Normal' as WorkOrderPriority,
    startDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    costMzn: 50000,
    materialsUsed: '',
  });

  const today = new Date().toISOString().slice(0, 10);
  const overdueOrSoon = workOrders.filter(
    (w) => w.status !== 'Concluída' && w.status !== 'Cancelada' && w.dueDate <= '2026-11-20'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const inf = infrastructures.find((i) => i.id === form.infrastructureId);
    addWorkOrder({
      code: form.code,
      planId: maintenancePlans[0]?.id,
      infrastructureId: inf?.id,
      infrastructureCode: inf?.code,
      infrastructureName: inf?.name,
      title: form.title,
      description: form.description,
      assignedTeam: form.assignedTeam,
      priority: form.priority,
      startDate: form.startDate,
      dueDate: form.dueDate,
      costMzn: Number(form.costMzn),
      materialsUsed: form.materialsUsed,
      progressPct: 0,
      status: 'Planeada',
      responsibleName: currentUser?.fullName ?? 'Eng. Paulo Mabjaia',
      isDemo: false,
    });
    setShowForm(false);
    setForm((f) => ({
      ...f,
      code: `OT-2026-0${workOrders.length + 18}`,
      title: '',
      description: '',
      materialsUsed: '',
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[#171717]">
            Gestão de Manutenção e Intervenções
          </h1>
          <p className="text-sm text-[#777777]">
            Planos preventivos, ordens de trabalho, equipas, custos em MZN e calendário de prazos.
          </p>
        </div>
        {can('manage_maintenance') && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="px-4 py-2 rounded-md bg-[#142B4A] text-white text-xs font-medium hover:bg-[#171717] flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Nova Ordem de Trabalho
          </button>
        )}
      </div>

      {/* Deadline Alerts */}
      {overdueOrSoon.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5">
          <Clock className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <strong>Alertas de Prazo:</strong> {overdueOrSoon.length} ordem(ns) de trabalho com prazo próximo ou vencido (
            {overdueOrSoon.map((w) => w.code).join(', ')}).
          </div>
        </div>
      )}

      {/* Plans Strip */}
      <div className="grid md:grid-cols-2 gap-4">
        {maintenancePlans.map((plan) => (
          <div key={plan.id} className="bg-white rounded-xl border border-neutral-200 p-4 flex items-center justify-between text-xs">
            <div>
              <div className="font-mono font-semibold text-[#2563EB]">{plan.code}</div>
              <div className="font-semibold text-[#171717] mt-0.5">{plan.title}</div>
              <div className="text-[#777777] mt-0.5">
                {plan.periodStart} a {plan.periodEnd} • Orçamento: {plan.budgetMzn.toLocaleString('pt-PT')} MZN
              </div>
            </div>
            <Badge tone={plan.status === 'Activo' ? 'blue' : 'green'}>{plan.status}</Badge>
          </div>
        ))}
      </div>

      {/* Create Work Order Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4 text-xs">
          <h2 className="font-display text-base font-semibold text-[#171717]">Criar Ordem de Trabalho</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <input
              required
              placeholder="Código (ex: OT-2026-018)"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className="px-3 py-2 rounded-md border border-neutral-200"
            />
            <input
              required
              placeholder="Título da intervenção"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="px-3 py-2 rounded-md border border-neutral-200 lg:col-span-2"
            />
            <select
              value={form.infrastructureId}
              onChange={(e) => setForm({ ...form, infrastructureId: e.target.value })}
              className="px-3 py-2 rounded-md border border-neutral-200"
            >
              {infrastructures.map((i) => (
                <option key={i.id} value={i.id}>{i.code} - {i.name}</option>
              ))}
            </select>
            <input
              required
              placeholder="Equipa atribuída"
              value={form.assignedTeam}
              onChange={(e) => setForm({ ...form, assignedTeam: e.target.value })}
              className="px-3 py-2 rounded-md border border-neutral-200"
            />
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value as WorkOrderPriority })}
              className="px-3 py-2 rounded-md border border-neutral-200"
            >
              <option value="Baixa">Baixa</option>
              <option value="Normal">Normal</option>
              <option value="Alta">Alta</option>
              <option value="Urgente">Urgente</option>
            </select>
            <div>
              <label className="block text-[11px] text-[#777777] mb-1">Data de início</label>
              <input
                type="date"
                required
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-neutral-200"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#777777] mb-1">Data prevista de conclusão</label>
              <input
                type="date"
                required
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-neutral-200"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#777777] mb-1">Custo estimado (MZN)</label>
              <input
                type="number"
                value={form.costMzn}
                onChange={(e) => setForm({ ...form, costMzn: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-md border border-neutral-200"
              />
            </div>
          </div>
          <input
            placeholder="Materiais necessários / utilizados"
            value={form.materialsUsed}
            onChange={(e) => setForm({ ...form, materialsUsed: e.target.value })}
            className="w-full px-3 py-2 rounded-md border border-neutral-200"
          />
          <textarea
            required
            rows={2}
            placeholder="Descrição dos trabalhos a executar..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-3 py-2 rounded-md border border-neutral-200"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-[#777777]">Cancelar</button>
            <button type="submit" className="px-5 py-2 rounded-md bg-[#142B4A] text-white font-medium">Criar Ordem</button>
          </div>
        </form>
      )}

      {/* Work Orders List */}
      <div className="space-y-4">
        {workOrders.map((wo) => {
          const isLate = wo.status !== 'Concluída' && wo.status !== 'Cancelada' && wo.dueDate < today;
          return (
            <div key={wo.id} className="bg-white rounded-xl border border-neutral-200 p-5 text-xs space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-semibold text-[#2563EB]">{wo.code}</span>
                    <span className="font-semibold text-sm text-[#171717]">{wo.title}</span>
                    <Badge tone={workOrderStatusTone(wo.status)}>{wo.status}</Badge>
                    <Badge tone={wo.priority === 'Urgente' ? 'red' : wo.priority === 'Alta' ? 'yellow' : 'neutral'}>
                      {wo.priority}
                    </Badge>
                    {isLate && <Badge tone="red">Atrasada</Badge>}
                  </div>
                  <div className="text-[#777777] mt-1">
                    {wo.infrastructureCode ? `${wo.infrastructureCode} • ` : ''}
                    Equipa: <strong>{wo.assignedTeam}</strong> • Custo: <strong>{wo.costMzn.toLocaleString('pt-PT')} MZN</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-[#777777]" />
                  <span>{wo.startDate} → {wo.dueDate}</span>
                </div>
              </div>

              <p className="text-[#555555]">{wo.description}</p>

              {/* Progress bar & Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-neutral-100">
                <div className="flex items-center gap-3 flex-1">
                  <Wrench className="w-3.5 h-3.5 text-[#777777]" />
                  <div className="flex-1 max-w-xs bg-[#F4F4F4] h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#2563EB] transition-all"
                      style={{ width: `${wo.progressPct}%` }}
                    />
                  </div>
                  <span className="font-semibold">{wo.progressPct}%</span>
                </div>

                {can('manage_maintenance') && (
                  <div className="flex items-center gap-2">
                    <select
                      value={wo.status}
                      onChange={(e) => updateWorkOrder(wo.id, { status: e.target.value as WorkOrderStatus })}
                      className="px-2.5 py-1.5 rounded border border-neutral-200 bg-[#F4F4F4]"
                    >
                      <option value="Planeada">Planeada</option>
                      <option value="Pendente">Pendente</option>
                      <option value="Em execução">Em execução</option>
                      <option value="Concluída">Concluída</option>
                      <option value="Cancelada">Cancelada</option>
                    </select>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={wo.progressPct}
                      onChange={(e) => updateWorkOrder(wo.id, { progressPct: Number(e.target.value) })}
                      className="w-24 accent-[#2563EB]"
                      title="Actualizar progresso (%)"
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

