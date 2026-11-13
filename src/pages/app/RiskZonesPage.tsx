import React, { useState } from 'react';
import { Plus, ShieldAlert } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { LeafletMap } from '@/components/LeafletMap';
import { Badge, riskTone } from '@/components/ui/Badge';
import { RiskLevel } from '@/types';

export const RiskZonesPage: React.FC = () => {
  const { riskZones, neighborhoods, infrastructures, addRiskZone, can } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: '',
    name: '',
    neighborhoodId: neighborhoods[0]?.id ?? 'nb-1',
    riskLevel: 'Alto' as RiskLevel,
    estimatedAffectedPopulation: 1500,
    description: '',
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const nb = neighborhoods.find((n) => n.id === form.neighborhoodId) ?? neighborhoods[0];
    const d = 0.003;
    addRiskZone({
      code: form.code,
      name: form.name,
      neighborhoodId: nb.id,
      neighborhoodName: nb.name,
      riskLevel: form.riskLevel,
      coordinates: [
        [nb.centerLat - d, nb.centerLng - d],
        [nb.centerLat - d, nb.centerLng + d],
        [nb.centerLat + d, nb.centerLng + d],
        [nb.centerLat + d, nb.centerLng - d],
      ],
      estimatedAffectedPopulation: Number(form.estimatedAffectedPopulation),
      description: form.description,
      isDemo: false,
    });
    setShowForm(false);
    setForm({ ...form, code: '', name: '', description: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[#171717]">
            Zonas de Risco de Inundação
          </h1>
          <p className="text-sm text-[#777777]">
            Polígonos de susceptibilidade a cheias e população estimada em risco na Matola.
          </p>
        </div>
        {can('edit_gis') && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="px-4 py-2 rounded-md bg-[#142B4A] text-white text-xs font-medium hover:bg-[#171717] flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Nova Zona de Risco
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-neutral-200 p-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <input
            required
            placeholder="Código (ex: ZR-MAT-04)"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            className="px-3 py-2 rounded-md border border-neutral-200 text-xs"
          />
          <input
            required
            placeholder="Designação da zona"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="px-3 py-2 rounded-md border border-neutral-200 text-xs"
          />
          <select
            value={form.neighborhoodId}
            onChange={(e) => setForm({ ...form, neighborhoodId: e.target.value })}
            className="px-3 py-2 rounded-md border border-neutral-200 text-xs"
          >
            {neighborhoods.map((n) => (
              <option key={n.id} value={n.id}>{n.name}</option>
            ))}
          </select>
          <select
            value={form.riskLevel}
            onChange={(e) => setForm({ ...form, riskLevel: e.target.value as RiskLevel })}
            className="px-3 py-2 rounded-md border border-neutral-200 text-xs"
          >
            <option value="Baixo">Baixo</option>
            <option value="Moderado">Moderado</option>
            <option value="Alto">Alto</option>
            <option value="Crítico">Crítico</option>
          </select>
          <input
            type="number"
            required
            placeholder="População estimada"
            value={form.estimatedAffectedPopulation}
            onChange={(e) => setForm({ ...form, estimatedAffectedPopulation: Number(e.target.value) })}
            className="px-3 py-2 rounded-md border border-neutral-200 text-xs"
          />
          <input
            required
            placeholder="Descrição técnica"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="px-3 py-2 rounded-md border border-neutral-200 text-xs"
          />
          <div className="sm:col-span-2 lg:col-span-3 flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-xs text-[#777777]">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 rounded-md bg-[#2563EB] text-white text-xs font-medium">
              Guardar Zona
            </button>
          </div>
        </form>
      )}

      <LeafletMap
        infrastructures={infrastructures}
        riskZones={riskZones}
        heightClass="h-[380px]"
        activeLayers={{
          valas: true,
          canais: true,
          colectores: true,
          bacias: true,
          passagens: true,
          inundacoes: false,
          zonas_risco: true,
          intervencoes: false,
        }}
      />

      <div className="grid md:grid-cols-3 gap-4">
        {riskZones.map((rz) => (
          <div key={rz.id} className="bg-white rounded-xl border border-neutral-200 p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold text-[#2563EB]">{rz.code}</span>
              <Badge tone={riskTone(rz.riskLevel)}>{rz.riskLevel}</Badge>
            </div>
            <h3 className="text-sm font-semibold text-[#171717] flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-[#DC2626]" /> {rz.name}
            </h3>
            <div className="text-xs text-[#777777]">Bairro: {rz.neighborhoodName}</div>
            <div className="text-xs text-[#171717]">
              População estimada afectada: <strong>{rz.estimatedAffectedPopulation.toLocaleString('pt-PT')}</strong>
            </div>
            <p className="text-xs text-[#777777]">{rz.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

