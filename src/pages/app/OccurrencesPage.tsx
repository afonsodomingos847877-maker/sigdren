import React, { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, Plus } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { LeafletMap } from '@/components/LeafletMap';
import { Badge, occurrenceStatusTone, severityTone } from '@/components/ui/Badge';
import { Occurrence, OccurrenceSeverity, OccurrenceStatus } from '@/types';

const STATUS_FLOW: OccurrenceStatus[] = [
  'Nova ocorrência',
  'Em avaliação',
  'Em intervenção',
  'Resolvida',
  'Encerrada',
];

export const OccurrencesPage: React.FC = () => {
  const {
    currentUser,
    can,
    neighborhoods,
    infrastructures,
    occurrences,
    addOccurrence,
    updateOccurrenceStatus,
  } = useApp();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: `OC-2026-00${occurrences.length + 1}`,
    occurrenceType: 'Inundação urbana' as Occurrence['occurrenceType'],
    occurredAt: new Date().toISOString().slice(0, 16),
    neighborhoodId: neighborhoods[0]?.id ?? 'nb-1',
    latitude: neighborhoods[0]?.centerLat ?? -25.9622,
    longitude: neighborhoods[0]?.centerLng ?? 32.4589,
    description: '',
    communicationSource: 'Equipa de campo' as Occurrence['communicationSource'],
    severity: 'Alta' as OccurrenceSeverity,
    affectedPeople: 0,
    affectedHouseholds: 0,
    infrastructureId: '',
    responsibleName: currentUser?.fullName ?? 'Eng. Paulo Mabjaia',
  });

  const unresolvedCount = occurrences.filter(
    (o) => o.status !== 'Resolvida' && o.status !== 'Encerrada'
  ).length;

  const avgResponseHours = useMemo(() => {
    const resolved = occurrences.filter((o) => o.resolvedAt);
    if (!resolved.length) return 36;
    const totalHrs = resolved.reduce(
      (acc, o) =>
        acc + (new Date(o.resolvedAt!).getTime() - new Date(o.occurredAt).getTime()) / 3600000,
      0
    );
    return Math.round(totalHrs / resolved.length);
  }, [occurrences]);

  const byNeighborhood = useMemo(() => {
    const map: Record<string, number> = {};
    occurrences.forEach((o) => {
      map[o.neighborhoodName] = (map[o.neighborhoodName] || 0) + 1;
    });
    return Object.entries(map).map(([bairro, total]) => ({ bairro, total }));
  }, [occurrences]);

  const bySeverity = useMemo(() => {
    const map: Record<string, number> = {};
    occurrences.forEach((o) => {
      map[o.severity] = (map[o.severity] || 0) + 1;
    });
    return Object.entries(map).map(([gravidade, total]) => ({ gravidade, total }));
  }, [occurrences]);

  const handleNeighborhoodChange = (id: string) => {
    const nb = neighborhoods.find((n) => n.id === id);
    setForm((f) => ({
      ...f,
      neighborhoodId: id,
      latitude: nb?.centerLat ?? f.latitude,
      longitude: nb?.centerLng ?? f.longitude,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nb = neighborhoods.find((n) => n.id === form.neighborhoodId) ?? neighborhoods[0];
    const inf = infrastructures.find((i) => i.id === form.infrastructureId);

    addOccurrence({
      code: form.code,
      occurrenceType: form.occurrenceType,
      occurredAt: new Date(form.occurredAt).toISOString(),
      neighborhoodId: nb.id,
      neighborhoodName: nb.name,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      description: form.description,
      communicationSource: form.communicationSource,
      severity: form.severity,
      affectedPeople: Number(form.affectedPeople) || undefined,
      affectedHouseholds: Number(form.affectedHouseholds) || undefined,
      infrastructureId: inf?.id,
      infrastructureCode: inf?.code,
      responsibleName: form.responsibleName,
      status: 'Nova ocorrência',
      isDemo: false,
    });
    setShowForm(false);
    setForm((f) => ({
      ...f,
      code: `OC-2026-00${occurrences.length + 2}`,
      description: '',
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[#171717]">
            Gestão de Ocorrências e Inundações
          </h1>
          <p className="text-sm text-[#777777]">
            Registo, triagem, acompanhamento no mapa e monitoria de resposta a inundações.
          </p>
        </div>
        {can('create_occurrence') && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="px-4 py-2 rounded-md bg-[#DC2626] text-white text-xs font-medium hover:bg-red-700 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Registar Ocorrência
          </button>
        )}
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="text-xs text-[#777777]">Total de Ocorrências</div>
          <div className="font-display text-2xl font-bold mt-1">{occurrences.length}</div>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="text-xs text-[#777777]">Ainda Não Resolvidas</div>
          <div className="font-display text-2xl font-bold text-[#DC2626] mt-1">{unresolvedCount}</div>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="text-xs text-[#777777]">Tempo Médio de Resposta</div>
          <div className="font-display text-2xl font-bold text-[#2563EB] mt-1">{avgResponseHours}h</div>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="text-xs text-[#777777]">Pessoas Afectadas (Est.)</div>
          <div className="font-display text-2xl font-bold mt-1">
            {occurrences.reduce((acc, o) => acc + (o.affectedPeople ?? 0), 0)}
          </div>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4 text-xs">
          <h2 className="font-display text-base font-semibold text-[#171717]">Nova Ocorrência</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <input
              required
              placeholder="Código"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className="px-3 py-2 rounded-md border border-neutral-200"
            />
            <select
              value={form.occurrenceType}
              onChange={(e) => setForm({ ...form, occurrenceType: e.target.value as Occurrence['occurrenceType'] })}
              className="px-3 py-2 rounded-md border border-neutral-200"
            >
              <option value="Inundação urbana">Inundação urbana</option>
              <option value="Obstrução de colector">Obstrução de colector</option>
              <option value="Transbordo de vala">Transbordo de vala</option>
              <option value="Erosão de talude">Erosão de talude</option>
              <option value="Dano estrutural">Dano estrutural</option>
            </select>
            <input
              type="datetime-local"
              value={form.occurredAt}
              onChange={(e) => setForm({ ...form, occurredAt: e.target.value })}
              className="px-3 py-2 rounded-md border border-neutral-200"
            />
            <select
              value={form.neighborhoodId}
              onChange={(e) => handleNeighborhoodChange(e.target.value)}
              className="px-3 py-2 rounded-md border border-neutral-200"
            >
              {neighborhoods.map((n) => (
                <option key={n.id} value={n.id}>{n.name}</option>
              ))}
            </select>
            <select
              value={form.communicationSource}
              onChange={(e) => setForm({ ...form, communicationSource: e.target.value as Occurrence['communicationSource'] })}
              className="px-3 py-2 rounded-md border border-neutral-200"
            >
              <option value="Equipa de campo">Equipa de campo</option>
              <option value="Munícipe / Linha Verde">Munícipe / Linha Verde</option>
              <option value="Protecção Civil">Protecção Civil</option>
              <option value="Vereação">Vereação</option>
            </select>
            <select
              value={form.severity}
              onChange={(e) => setForm({ ...form, severity: e.target.value as OccurrenceSeverity })}
              className="px-3 py-2 rounded-md border border-neutral-200"
            >
              <option value="Baixa">Baixa</option>
              <option value="Média">Média</option>
              <option value="Alta">Alta</option>
              <option value="Crítica">Crítica</option>
            </select>
            <input
              type="number"
              placeholder="Pessoas afectadas"
              value={form.affectedPeople}
              onChange={(e) => setForm({ ...form, affectedPeople: Number(e.target.value) })}
              className="px-3 py-2 rounded-md border border-neutral-200"
            />
            <input
              type="number"
              placeholder="Agregados afectados"
              value={form.affectedHouseholds}
              onChange={(e) => setForm({ ...form, affectedHouseholds: Number(e.target.value) })}
              className="px-3 py-2 rounded-md border border-neutral-200"
            />
            <select
              value={form.infrastructureId}
              onChange={(e) => setForm({ ...form, infrastructureId: e.target.value })}
              className="px-3 py-2 rounded-md border border-neutral-200"
            >
              <option value="">Infra-estrutura relacionada (opcional)</option>
              {infrastructures.map((i) => (
                <option key={i.id} value={i.id}>{i.code} - {i.name}</option>
              ))}
            </select>
          </div>
          <textarea
            required
            rows={2}
            placeholder="Descrição detalhada da ocorrência..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-3 py-2 rounded-md border border-neutral-200"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-[#777777]">Cancelar</button>
            <button type="submit" className="px-5 py-2 rounded-md bg-[#142B4A] text-white font-medium">Registar</button>
          </div>
        </form>
      )}

      {/* Specific Occurrences Map + Charts */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-xl border border-neutral-200 p-4">
          <h3 className="text-xs font-semibold text-[#171717] mb-3">Mapa Específico de Ocorrências</h3>
          <LeafletMap
            infrastructures={infrastructures}
            occurrences={occurrences}
            heightClass="h-[320px]"
            activeLayers={{
              valas: false,
              canais: false,
              colectores: false,
              bacias: false,
              passagens: false,
              inundacoes: true,
              zonas_risco: true,
              intervencoes: false,
            }}
          />
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <h3 className="text-xs font-semibold text-[#171717] mb-2">Por Bairro</h3>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byNeighborhood}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="bairro" tick={{ fontSize: 9 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 9 }} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#DC2626" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <h3 className="text-xs font-semibold text-[#171717] mb-2">Por Gravidade</h3>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bySeverity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="gravidade" tick={{ fontSize: 9 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 9 }} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#142B4A" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Occurrences Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4F4F4] text-[#777777] uppercase text-[11px]">
              <tr>
                <th className="px-4 py-3 font-semibold">Código</th>
                <th className="px-4 py-3 font-semibold">Tipo / Descrição</th>
                <th className="px-4 py-3 font-semibold">Bairro</th>
                <th className="px-4 py-3 font-semibold">Gravidade</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Actualizar Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {occurrences.map((occ) => (
                <tr key={occ.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 font-mono font-semibold text-[#DC2626] whitespace-nowrap">
                    {occ.code}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-[#171717] flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      {occ.occurrenceType}
                    </div>
                    <div className="text-[11px] text-[#777777] mt-0.5">{occ.description}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{occ.neighborhoodName}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Badge tone={severityTone(occ.severity)}>{occ.severity}</Badge>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Badge tone={occurrenceStatusTone(occ.status)}>{occ.status}</Badge>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {can('edit_occurrence') ? (
                      <select
                        value={occ.status}
                        onChange={(e) => updateOccurrenceStatus(occ.id, e.target.value as OccurrenceStatus)}
                        className="px-2 py-1 rounded border border-neutral-200 text-xs bg-white"
                      >
                        {STATUS_FLOW.map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-[#777777]">-</span>
                    )}
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

