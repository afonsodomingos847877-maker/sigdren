import React, { useMemo, useState } from 'react';
import {
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  LocateFixed,
  Plus,
  RefreshCw,
  WifiOff,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { ConservationState } from '@/types';
import { Badge, conservationTone } from '@/components/ui/Badge';

export const InspectionsPage: React.FC = () => {
  const {
    currentUser,
    can,
    isOnline,
    pendingOfflineCount,
    syncOfflineInspections,
    infrastructures,
    inspections,
    addInspection,
  } = useApp();

  const [showForm, setShowForm] = useState(false);
  const [compareInfraId, setCompareInfraId] = useState<string>(infrastructures[2]?.id ?? infrastructures[0]?.id ?? '');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const defaultInf = infrastructures[0];
  const [form, setForm] = useState({
    infrastructureId: defaultInf?.id ?? '',
    technicianName: currentUser?.fullName ?? '',
    inspectionDate: new Date().toISOString().slice(0, 16),
    latitude: defaultInf?.latitude ?? -25.955,
    longitude: defaultInf?.longitude ?? 32.465,
    structuralState: 'Bom estado' as ConservationState,
    hasObstruction: false,
    hasWasteAccumulation: false,
    hasErosion: false,
    hasStructuralDamage: false,
    severity: 'Bom estado' as ConservationState,
    photoUrl: '',
    observations: '',
  });

  const handleInfraSelect = (id: string) => {
    const inf = infrastructures.find((i) => i.id === id);
    setForm((f) => ({
      ...f,
      infrastructureId: id,
      latitude: inf?.latitude ?? f.latitude,
      longitude: inf?.longitude ?? f.longitude,
    }));
  };

  const handleGetGPS = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6)),
        }));
      },
      () => {
        setStatusMessage('Não foi possível obter GPS do dispositivo; mantidas coordenadas da infra-estrutura.');
      }
    );
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, photoUrl: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const inf = infrastructures.find((i) => i.id === form.infrastructureId);
    if (!inf) return;

    const clientSyncId = `sync-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const res = await addInspection({
      clientSyncId,
      infrastructureId: inf.id,
      infrastructureCode: inf.code,
      infrastructureName: inf.name,
      technicianName: form.technicianName || currentUser?.fullName || 'Inspector',
      inspectionDate: new Date(form.inspectionDate).toISOString(),
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      structuralState: form.structuralState,
      hasObstruction: form.hasObstruction,
      hasWasteAccumulation: form.hasWasteAccumulation,
      hasErosion: form.hasErosion,
      hasStructuralDamage: form.hasStructuralDamage,
      severity: form.severity,
      photoUrl: form.photoUrl || undefined,
      observations: form.observations,
      isDemo: false,
    });

    setStatusMessage(
      res.synced
        ? 'Inspecção registada e sincronizada na base de dados.'
        : 'Sem ligação: inspecção guardada localmente (IndexedDB) para sincronização automática.'
    );
    setShowForm(false);
    setForm((f) => ({ ...f, observations: '', photoUrl: '' }));
  };

  const comparisonHistory = useMemo(() => {
    return inspections
      .filter((i) => i.infrastructureId === compareInfraId)
      .sort((a, b) => new Date(a.inspectionDate).getTime() - new Date(b.inspectionDate).getTime());
  }, [inspections, compareInfraId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[#171717]">
            Inspecção Digital de Campo
          </h1>
          <p className="text-sm text-[#777777]">
            Vistorias técnicas com recolha offline (IndexedDB), geolocalização e histórico comparativo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {pendingOfflineCount > 0 && isOnline && (
            <button
              onClick={() => syncOfflineInspections()}
              className="px-3.5 py-2 rounded-md bg-[#2563EB] text-white text-xs font-medium flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Sincronizar Pendentes ({pendingOfflineCount})
            </button>
          )}
          {can('create_inspection') && (
            <button
              onClick={() => setShowForm((v) => !v)}
              className="px-4 py-2 rounded-md bg-[#142B4A] text-white text-xs font-medium hover:bg-[#171717] flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Nova Inspecção
            </button>
          )}
        </div>
      </div>

      {!isOnline && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>
            <strong>Modo Offline Activo:</strong> As inspecções e fotografias são armazenadas localmente no
            dispositivo e sincronizadas automaticamente quando a ligação regressar.
          </span>
        </div>
      )}

      {statusMessage && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-[#2563EB]">
          {statusMessage}
        </div>
      )}

      {/* New Inspection Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4 text-xs">
          <h2 className="font-display text-base font-semibold text-[#171717]">
            Registar Ficha de Inspecção
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block font-medium mb-1">Infra-estrutura *</label>
              <select
                value={form.infrastructureId}
                onChange={(e) => handleInfraSelect(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-neutral-200"
              >
                {infrastructures.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.code} - {i.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium mb-1">Técnico responsável *</label>
              <input
                required
                value={form.technicianName}
                onChange={(e) => setForm({ ...form, technicianName: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-neutral-200"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Data e hora da inspecção *</label>
              <input
                type="datetime-local"
                required
                value={form.inspectionDate}
                onChange={(e) => setForm({ ...form, inspectionDate: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-neutral-200"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Latitude GPS</label>
              <div className="flex gap-1.5">
                <input
                  type="number"
                  step="0.000001"
                  value={form.latitude}
                  onChange={(e) => setForm({ ...form, latitude: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-md border border-neutral-200"
                />
                <button
                  type="button"
                  onClick={handleGetGPS}
                  title="Obter GPS actual"
                  className="px-2.5 rounded-md border border-neutral-200 hover:bg-[#F4F4F4]"
                >
                  <LocateFixed className="w-4 h-4 text-[#2563EB]" />
                </button>
              </div>
            </div>

            <div>
              <label className="block font-medium mb-1">Longitude GPS</label>
              <input
                type="number"
                step="0.000001"
                value={form.longitude}
                onChange={(e) => setForm({ ...form, longitude: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-md border border-neutral-200"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Classificação da Gravidade *</label>
              <select
                value={form.severity}
                onChange={(e) =>
                  setForm({
                    ...form,
                    severity: e.target.value as ConservationState,
                    structuralState: e.target.value as ConservationState,
                  })
                }
                className="w-full px-3 py-2 rounded-md border border-neutral-200"
              >
                <option value="Bom estado">Bom estado</option>
                <option value="Estado aceitável">Estado aceitável</option>
                <option value="Necessita de manutenção">Necessita de manutenção</option>
                <option value="Estado crítico">Estado crítico</option>
              </select>
            </div>
          </div>

          {/* Condition Checkboxes */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {[
              { key: 'hasObstruction', label: 'Obstruções identificadas' },
              { key: 'hasWasteAccumulation', label: 'Resíduos acumulados' },
              { key: 'hasErosion', label: 'Erosão de taludes' },
              { key: 'hasStructuralDamage', label: 'Danos estruturais' },
            ].map((chk) => (
              <label
                key={chk.key}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-[#F4F4F4] cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={form[chk.key as keyof typeof form] as boolean}
                  onChange={(e) => setForm({ ...form, [chk.key]: e.target.checked })}
                  className="accent-[#2563EB]"
                />
                <span>{chk.label}</span>
              </label>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5" /> Fotografia da vistoria
              </label>
              <input type="file" accept="image/*" onChange={handlePhoto} className="w-full text-[11px]" />
            </div>
            <div>
              <label className="block font-medium mb-1">Observações técnicas</label>
              <textarea
                rows={2}
                required
                value={form.observations}
                onChange={(e) => setForm({ ...form, observations: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-neutral-200"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-[#777777]">
              Cancelar
            </button>
            <button type="submit" className="px-5 py-2 rounded-md bg-[#142B4A] text-white font-medium">
              {isOnline ? 'Submeter Inspecção' : 'Guardar Offline'}
            </button>
          </div>
        </form>
      )}

      {/* Temporal Comparison Panel */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-[#171717]">
              Comparação Temporal por Infra-estrutura
            </h2>
            <p className="text-xs text-[#777777]">
              Acompanhe a evolução do estado de conservação ao longo das vistorias.
            </p>
          </div>
          <select
            value={compareInfraId}
            onChange={(e) => setCompareInfraId(e.target.value)}
            className="px-3 py-2 rounded-md border border-neutral-200 text-xs bg-[#F4F4F4]"
          >
            {infrastructures.map((i) => (
              <option key={i.id} value={i.id}>
                {i.code} - {i.name}
              </option>
            ))}
          </select>
        </div>

        {comparisonHistory.length === 0 ? (
          <div className="text-xs text-[#777777] py-4">
            Ainda não existem inspecções registadas para esta infra-estrutura.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {comparisonHistory.map((item, idx) => (
              <div key={item.id} className="p-4 rounded-xl bg-[#F4F4F4] border border-neutral-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#171717]">
                    Vistoria #{idx + 1} • {new Date(item.inspectionDate).toLocaleDateString('pt-PT')}
                  </span>
                  <Badge tone={conservationTone(item.severity)}>{item.severity}</Badge>
                </div>
                <div className="text-[11px] text-[#777777]">Técnico: {item.technicianName}</div>
                <div className="flex flex-wrap gap-1.5 text-[10px]">
                  {item.hasObstruction && <Badge tone="red">Obstrução</Badge>}
                  {item.hasWasteAccumulation && <Badge tone="yellow">Resíduos</Badge>}
                  {item.hasErosion && <Badge tone="yellow">Erosão</Badge>}
                  {item.hasStructuralDamage && <Badge tone="red">Dano Estrutural</Badge>}
                </div>
                <p className="text-[#555555]">{item.observations}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inspections List */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-neutral-100 flex items-center gap-2 text-xs font-semibold text-[#171717]">
          <ClipboardCheck className="w-4 h-4 text-[#2563EB]" /> Histórico Geral de Inspecções ({inspections.length})
        </div>
        <div className="divide-y divide-neutral-100">
          {inspections.map((insp) => (
            <div key={insp.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-[#2563EB]">{insp.infrastructureCode}</span>
                  <span className="font-semibold text-[#171717]">{insp.infrastructureName}</span>
                  {insp.syncStatus === 'pending' ? (
                    <Badge tone="yellow">
                      <Clock className="w-3 h-3" /> Pendente Sync
                    </Badge>
                  ) : (
                    <Badge tone="green">
                      <CheckCircle2 className="w-3 h-3" /> Sincronizado
                    </Badge>
                  )}
                </div>
                <div className="text-[#777777]">
                  {new Date(insp.inspectionDate).toLocaleString('pt-PT')} • {insp.technicianName} • GPS:{' '}
                  {insp.latitude.toFixed(4)}, {insp.longitude.toFixed(4)}
                </div>
                <div className="text-[#555555]">{insp.observations}</div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {insp.photoUrl && (
                  <img src={insp.photoUrl} alt="Vistoria" className="w-12 h-12 rounded-md object-cover border" />
                )}
                <Badge tone={conservationTone(insp.severity)}>{insp.severity}</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

