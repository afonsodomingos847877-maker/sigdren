import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  GeoLayerKey,
  Infrastructure,
  Occurrence,
  RiskZone,
  WorkOrder,
} from '@/types';
import { MATOLA_CENTER } from '@/data/demoData';

interface LeafletMapProps {
  infrastructures: Infrastructure[];
  occurrences?: Occurrence[];
  riskZones?: RiskZone[];
  workOrders?: WorkOrder[];
  activeLayers: Record<GeoLayerKey, boolean>;
  focusCoords?: [number, number] | null;
  heightClass?: string;
  onSelectInfrastructure?: (inf: Infrastructure) => void;
  onSelectOccurrence?: (occ: Occurrence) => void;
  onMapClickCoords?: (lat: number, lng: number) => void;
}

function getMarkerColor(inf: Infrastructure): string {
  if (inf.conservationState === 'Estado crítico' || inf.riskLevel === 'Crítico') return '#DC2626';
  if (inf.conservationState === 'Necessita de manutenção' || inf.riskLevel === 'Alto') return '#EAB308';
  if (inf.conservationState === 'Estado aceitável') return '#2563EB';
  return '#16A34A';
}

function mapTypeToLayer(type: Infrastructure['type']): GeoLayerKey {
  switch (type) {
    case 'Vala de drenagem':
      return 'valas';
    case 'Canal de drenagem':
      return 'canais';
    case 'Colector':
      return 'colectores';
    case 'Bacia de retenção':
      return 'bacias';
    case 'Passagem hidráulica':
      return 'passagens';
  }
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  infrastructures,
  occurrences = [],
  riskZones = [],
  workOrders = [],
  activeLayers,
  focusCoords,
  heightClass = 'h-[560px]',
  onSelectInfrastructure,
  onSelectOccurrence,
  onMapClickCoords,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const [cursorCoords, setCursorCoords] = useState<[number, number]>(MATOLA_CENTER);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: MATOLA_CENTER,
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors | SIG-DREN Matola',
      maxZoom: 19,
    }).addTo(map);

    const group = L.layerGroup().addTo(map);
    mapRef.current = map;
    layerGroupRef.current = group;

    map.on('mousemove', (e) => {
      setCursorCoords([e.latlng.lat, e.latlng.lng]);
    });

    map.on('click', (e) => {
      onMapClickCoords?.(
        Number(e.latlng.lat.toFixed(6)),
        Number(e.latlng.lng.toFixed(6))
      );
    });

    return () => {
      map.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (focusCoords && mapRef.current) {
      mapRef.current.setView(focusCoords, 16, { animate: true });
    }
  }, [focusCoords]);

  useEffect(() => {
    const group = layerGroupRef.current;
    if (!group) return;
    group.clearLayers();

    // 1. Zonas de risco (polygons)
    if (activeLayers.zonas_risco) {
      riskZones.forEach((rz) => {
        const color = rz.riskLevel === 'Crítico' ? '#DC2626' : rz.riskLevel === 'Alto' ? '#EAB308' : '#2563EB';
        const poly = L.polygon(rz.coordinates, {
          color,
          fillColor: color,
          fillOpacity: 0.18,
          weight: 2,
          dashArray: '4 4',
        });
        poly.bindPopup(
          `<div class="text-xs space-y-1 min-w-[180px]">
            <div class="font-semibold text-[#171717]">${rz.name}</div>
            <div class="text-[#777777]">Bairro: ${rz.neighborhoodName}</div>
            <div>Nível de Risco: <strong>${rz.riskLevel}</strong></div>
            <div>Pop. estimada afectada: <strong>${rz.estimatedAffectedPopulation.toLocaleString('pt-PT')}</strong></div>
            ${rz.isDemo ? '<div class="text-[10px] text-amber-700 font-medium pt-1">Dados de demonstração</div>' : ''}
          </div>`
        );
        poly.addTo(group);
      });
    }

    // 2. Infra-estruturas (5 layers)
    infrastructures.forEach((inf) => {
      const layerKey = mapTypeToLayer(inf.type);
      if (!activeLayers[layerKey]) return;

      const color = getMarkerColor(inf);
      const marker = L.circleMarker([inf.latitude, inf.longitude], {
        radius: inf.type === 'Bacia de retenção' ? 11 : 8,
        fillColor: color,
        color: '#FFFFFF',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.92,
      });

      marker.bindPopup(
        `<div class="text-xs space-y-1 min-w-[200px]">
          <div class="font-mono text-[11px] text-[#2563EB] font-semibold">${inf.code}</div>
          <div class="font-semibold text-[#171717]">${inf.name}</div>
          <div class="text-[#777777]">${inf.type} • ${inf.neighborhoodName}</div>
          <div>Estado: <strong>${inf.conservationState}</strong></div>
          <div>Risco: <strong>${inf.riskLevel}</strong></div>
          <div class="text-[11px] text-[#777777]">GPS: ${inf.latitude.toFixed(5)}, ${inf.longitude.toFixed(5)}</div>
        </div>`
      );
      marker.on('click', () => onSelectInfrastructure?.(inf));
      marker.addTo(group);
    });

    // 3. Pontos de inundação / ocorrências
    if (activeLayers.inundacoes) {
      occurrences.forEach((occ) => {
        const marker = L.circleMarker([occ.latitude, occ.longitude], {
          radius: 9,
          fillColor: '#DC2626',
          color: '#171717',
          weight: 2,
          fillOpacity: 0.85,
        });
        marker.bindPopup(
          `<div class="text-xs space-y-1 min-w-[200px]">
            <div class="font-mono text-[11px] text-[#DC2626] font-semibold">${occ.code}</div>
            <div class="font-semibold text-[#171717]">${occ.occurrenceType}</div>
            <div class="text-[#777777]">Bairro: ${occ.neighborhoodName}</div>
            <div>Gravidade: <strong>${occ.severity}</strong> • Estado: <strong>${occ.status}</strong></div>
            <div class="text-[#555]">${occ.description}</div>
          </div>`
        );
        marker.on('click', () => onSelectOccurrence?.(occ));
        marker.addTo(group);
      });
    }

    // 4. Intervenções realizadas / em curso
    if (activeLayers.intervencoes) {
      workOrders
        .filter((w) => w.infrastructureId)
        .forEach((wo) => {
          const inf = infrastructures.find((i) => i.id === wo.infrastructureId);
          if (!inf) return;
          const marker = L.circleMarker([inf.latitude + 0.0004, inf.longitude + 0.0004], {
            radius: 6,
            fillColor: wo.status === 'Concluída' ? '#16A34A' : '#2563EB',
            color: '#142B4A',
            weight: 2,
            fillOpacity: 0.95,
          });
          marker.bindPopup(
            `<div class="text-xs space-y-1 min-w-[190px]">
              <div class="font-mono text-[11px] text-[#142B4A] font-semibold">${wo.code}</div>
              <div class="font-semibold text-[#171717]">${wo.title}</div>
              <div>Equipa: ${wo.assignedTeam}</div>
              <div>Estado: <strong>${wo.status}</strong> (${wo.progressPct}%)</div>
            </div>`
          );
          marker.addTo(group);
        });
    }
  }, [infrastructures, occurrences, riskZones, workOrders, activeLayers, onSelectInfrastructure, onSelectOccurrence]);

  return (
    <div className={`relative w-full ${heightClass} rounded-xl overflow-hidden border border-neutral-200 bg-[#F4F4F4]`}>
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur-sm border border-neutral-200 rounded-md px-3 py-1.5 text-[11px] font-mono text-[#171717] shadow-sm">
        GPS: {cursorCoords[0].toFixed(5)}, {cursorCoords[1].toFixed(5)}
      </div>
    </div>
  );
};

