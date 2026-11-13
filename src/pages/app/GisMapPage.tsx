import React, { useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, Layers, MapPin, Search, Upload, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { LeafletMap } from '@/components/LeafletMap';
import { GeoLayerKey, Infrastructure } from '@/types';
import { Badge, conservationTone, riskTone } from '@/components/ui/Badge';
import { exportToGeoJSON } from '@/lib/exportUtils';

const LAYER_LABELS: { key: GeoLayerKey; label: string; color: string }[] = [
  { key: 'valas', label: 'Valas de drenagem', color: '#2563EB' },
  { key: 'canais', label: 'Canais de drenagem', color: '#142B4A' },
  { key: 'colectores', label: 'Colectores', color: '#16A34A' },
  { key: 'bacias', label: 'Bacias de retenção', color: '#0ea5e9' },
  { key: 'passagens', label: 'Passagens hidráulicas', color: '#6366f1' },
  { key: 'inundacoes', label: 'Pontos de inundação', color: '#DC2626' },
  { key: 'zonas_risco', label: 'Zonas de risco', color: '#EAB308' },
  { key: 'intervencoes', label: 'Intervenções realizadas', color: '#16A34A' },
];

export const GisMapPage: React.FC = () => {
  const {
    can,
    neighborhoods,
    infrastructures,
    occurrences,
    riskZones,
    workOrders,
    importGeoJsonFeatures,
    recordAudit,
  } = useApp();

  const [searchParams] = useSearchParams();
  const initialLat = searchParams.get('lat');
  const initialLng = searchParams.get('lng');

  const [activeLayers, setActiveLayers] = useState<Record<GeoLayerKey, boolean>>({
    valas: true,
    canais: true,
    colectores: true,
    bacias: true,
    passagens: true,
    inundacoes: true,
    zonas_risco: true,
    intervencoes: true,
  });

  const [query, setQuery] = useState('');
  const [selectedBairro, setSelectedBairro] = useState('Todos');
  const [stateFilter, setStateFilter] = useState('Todos');
  const [riskFilter, setRiskFilter] = useState('Todos');
  const [focusCoords, setFocusCoords] = useState<[number, number] | null>(
    initialLat && initialLng ? [Number(initialLat), Number(initialLng)] : null
  );
  const [selectedInfra, setSelectedInfra] = useState<Infrastructure | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredInfrastructures = useMemo(() => {
    const q = query.trim().toLowerCase();
    return infrastructures.filter((inf) => {
      if (selectedBairro !== 'Todos' && inf.neighborhoodName !== selectedBairro) return false;
      if (stateFilter !== 'Todos' && inf.conservationState !== stateFilter) return false;
      if (riskFilter !== 'Todos' && inf.riskLevel !== riskFilter) return false;
      if (q && !inf.code.toLowerCase().includes(q) && !inf.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [infrastructures, query, selectedBairro, stateFilter, riskFilter]);

  const handleBairroChange = (name: string) => {
    setSelectedBairro(name);
    if (name !== 'Todos') {
      const nb = neighborhoods.find((n) => n.name === name);
      if (nb) setFocusCoords([nb.centerLat, nb.centerLng]);
    }
  };

  const handleExportGeoJSON = () => {
    const features: GeoJSON.Feature[] = filteredInfrastructures.map((inf) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [inf.longitude, inf.latitude] },
      properties: {
        code: inf.code,
        name: inf.name,
        type: inf.type,
        neighborhood: inf.neighborhoodName,
        conservationState: inf.conservationState,
        riskLevel: inf.riskLevel,
      },
    }));
    exportToGeoJSON('sig-dren-matola-camadas', { type: 'FeatureCollection', features });
    recordAudit('EXPORT', 'Mapa GIS', `Exportou ${features.length} elementos em GeoJSON.`);
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as GeoJSON.FeatureCollection;
      if (parsed.type !== 'FeatureCollection' || !Array.isArray(parsed.features)) {
        setImportMessage('Ficheiro inválido. Forneça um GeoJSON FeatureCollection.');
        return;
      }
      const count = importGeoJsonFeatures(parsed);
      setImportMessage(`${count} geometria(s) importada(s) com sucesso para o mapa GIS.`);
    } catch {
      setImportMessage('Erro ao ler ficheiro GeoJSON.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[#171717]">
            Sistema de Informação Geográfica (GIS)
          </h1>
          <p className="text-sm text-[#777777]">
            Mapa interactivo OpenStreetMap / PostGIS com 8 camadas geográficas do Município da Matola.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {can('import_export_gis') && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".geojson,.json"
                onChange={handleFileImport}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 rounded-md bg-white border border-neutral-200 text-xs font-medium hover:bg-[#F4F4F4] flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" /> Importar GeoJSON
              </button>
            </>
          )}
          <button
            onClick={handleExportGeoJSON}
            className="px-3 py-2 rounded-md bg-[#142B4A] text-white text-xs font-medium hover:bg-[#171717] flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Exportar GeoJSON
          </button>
        </div>
      </div>

      {importMessage && (
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-[#2563EB] flex items-center justify-between">
          <span>{importMessage}</span>
          <button onClick={() => setImportMessage(null)}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#777777] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Pesquisar infra-estrutura..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-md border border-neutral-200 text-xs focus:outline-none focus:border-[#2563EB]"
          />
        </div>

        <select
          value={selectedBairro}
          onChange={(e) => handleBairroChange(e.target.value)}
          className="px-3 py-2 rounded-md border border-neutral-200 text-xs bg-[#F4F4F4] focus:bg-white"
        >
          <option value="Todos">Todos os Bairros (Matola)</option>
          {neighborhoods.map((n) => (
            <option key={n.id} value={n.name}>
              {n.name}
            </option>
          ))}
        </select>

        <select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          className="px-3 py-2 rounded-md border border-neutral-200 text-xs bg-[#F4F4F4] focus:bg-white"
        >
          <option value="Todos">Estado de Conservação: Todos</option>
          <option value="Bom estado">Bom estado</option>
          <option value="Estado aceitável">Estado aceitável</option>
          <option value="Necessita de manutenção">Necessita de manutenção</option>
          <option value="Estado crítico">Estado crítico</option>
        </select>

        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
          className="px-3 py-2 rounded-md border border-neutral-200 text-xs bg-[#F4F4F4] focus:bg-white"
        >
          <option value="Todos">Nível de Risco: Todos</option>
          <option value="Baixo">Baixo</option>
          <option value="Moderado">Moderado</option>
          <option value="Alto">Alto</option>
          <option value="Crítico">Crítico</option>
        </select>
      </div>

      <div className="grid lg:grid-cols-4 gap-5">
        {/* Layer Control Sidebar */}
        <div className="bg-white rounded-xl border border-neutral-200 p-4 space-y-4 h-fit">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#171717]">
            <Layers className="w-4 h-4 text-[#2563EB]" /> Camadas Geográficas (8)
          </div>
          <div className="space-y-2">
            {LAYER_LABELS.map((layer) => (
              <label
                key={layer.key}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-[#F4F4F4] cursor-pointer text-xs"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: layer.color }}
                  />
                  {layer.label}
                </span>
                <input
                  type="checkbox"
                  checked={activeLayers[layer.key]}
                  onChange={() =>
                    setActiveLayers((prev) => ({ ...prev, [layer.key]: !prev[layer.key] }))
                  }
                  className="accent-[#2563EB]"
                />
              </label>
            ))}
          </div>

          {selectedInfra && (
            <div className="pt-4 border-t border-neutral-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-[#2563EB]">
                  {selectedInfra.code}
                </span>
                <button
                  onClick={() => setSelectedInfra(null)}
                  className="text-neutral-400 hover:text-[#171717]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="text-xs font-semibold text-[#171717]">{selectedInfra.name}</div>
              <div className="text-[11px] text-[#777777] flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {selectedInfra.neighborhoodName}
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Badge tone={conservationTone(selectedInfra.conservationState)}>
                  {selectedInfra.conservationState}
                </Badge>
                <Badge tone={riskTone(selectedInfra.riskLevel)}>
                  Risco: {selectedInfra.riskLevel}
                </Badge>
              </div>
              {selectedInfra.photoUrl && (
                <img
                  src={selectedInfra.photoUrl}
                  alt={selectedInfra.name}
                  className="w-full h-28 object-cover rounded-lg border border-neutral-200"
                />
              )}
              <div className="text-[11px] text-[#555555]">
                Material: {selectedInfra.material}
                {selectedInfra.lengthM ? ` • Comp: ${selectedInfra.lengthM}m` : ''}
              </div>
              {selectedInfra.notes && (
                <p className="text-[11px] text-[#777777] bg-[#F4F4F4] p-2 rounded-md">
                  {selectedInfra.notes}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Map Canvas */}
        <div className="lg:col-span-3">
          <LeafletMap
            infrastructures={filteredInfrastructures}
            occurrences={occurrences}
            riskZones={riskZones}
            workOrders={workOrders}
            activeLayers={activeLayers}
            focusCoords={focusCoords}
            heightClass="h-[600px]"
            onSelectInfrastructure={(inf) => setSelectedInfra(inf)}
          />
        </div>
      </div>
    </div>
  );
};

