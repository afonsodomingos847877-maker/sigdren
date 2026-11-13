import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Download,
  Edit2,
  Eye,
  FileSpreadsheet,
  MapPin,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import {
  ConservationState,
  Infrastructure,
  InfrastructureType,
  RiskLevel,
} from '@/types';
import { Badge, conservationTone, riskTone } from '@/components/ui/Badge';
import { exportToCSV, exportToExcel } from '@/lib/exportUtils';

const EMPTY_FORM = {
  code: '',
  name: '',
  type: 'Vala de drenagem' as InfrastructureType,
  province: 'Maputo',
  municipality: 'Matola',
  administrativePost: 'Matola Sede' as 'Matola Sede' | 'Infulene' | 'Machava',
  neighborhoodId: 'nb-1',
  locationDescription: '',
  latitude: -25.955,
  longitude: 32.465,
  lengthM: 100,
  widthM: 1.5,
  depthM: 1.2,
  material: 'Betão armado',
  constructionYear: 2022,
  conservationState: 'Bom estado' as ConservationState,
  riskLevel: 'Baixo' as RiskLevel,
  lastSurveyDate: new Date().toISOString().slice(0, 10),
  photoUrl: '',
  notes: '',
  responsibleTechnician: '',
};

export const InfrastructuresPage: React.FC = () => {
  const {
    currentUser,
    can,
    neighborhoods,
    infrastructures,
    addInfrastructure,
    updateInfrastructure,
    deleteInfrastructure,
    recordAudit,
  } = useApp();

  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('Todos');
  const [bairroFilter, setBairroFilter] = useState('Todos');

  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view' | null>(null);
  const [activeItem, setActiveItem] = useState<Infrastructure | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return infrastructures.filter((inf) => {
      if (typeFilter !== 'Todos' && inf.type !== typeFilter) return false;
      if (bairroFilter !== 'Todos' && inf.neighborhoodName !== bairroFilter) return false;
      if (
        q &&
        !inf.code.toLowerCase().includes(q) &&
        !inf.name.toLowerCase().includes(q) &&
        !inf.neighborhoodName.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [infrastructures, query, typeFilter, bairroFilter]);

  const openCreate = () => {
    setForm({
      ...EMPTY_FORM,
      responsibleTechnician: currentUser?.fullName ?? '',
    });
    setFormError('');
    setActiveItem(null);
    setModalMode('create');
  };

  const openEdit = (inf: Infrastructure) => {
    setForm({
      code: inf.code,
      name: inf.name,
      type: inf.type,
      province: inf.province,
      municipality: inf.municipality,
      administrativePost: inf.administrativePost,
      neighborhoodId: inf.neighborhoodId,
      locationDescription: inf.locationDescription,
      latitude: inf.latitude,
      longitude: inf.longitude,
      lengthM: inf.lengthM ?? 0,
      widthM: inf.widthM ?? 0,
      depthM: inf.depthM ?? 0,
      material: inf.material,
      constructionYear: inf.constructionYear ?? 2020,
      conservationState: inf.conservationState,
      riskLevel: inf.riskLevel,
      lastSurveyDate: inf.lastSurveyDate,
      photoUrl: inf.photoUrl ?? '',
      notes: inf.notes ?? '',
      responsibleTechnician: inf.responsibleTechnician,
    });
    setFormError('');
    setActiveItem(inf);
    setModalMode('edit');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, photoUrl: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim() || !form.name.trim()) {
      setFormError('Código único e nome são obrigatórios.');
      return;
    }
    const nb = neighborhoods.find((n) => n.id === form.neighborhoodId) ?? neighborhoods[0];

    if (modalMode === 'create') {
      const res = addInfrastructure({
        ...form,
        neighborhoodName: nb.name,
        administrativePost: nb.administrativePost,
        isDemo: false,
      });
      if (!res.ok) {
        setFormError(res.error ?? 'Erro ao registar infra-estrutura.');
        return;
      }
    } else if (modalMode === 'edit' && activeItem) {
      updateInfrastructure(activeItem.id, {
        ...form,
        neighborhoodName: nb.name,
        administrativePost: nb.administrativePost,
      });
    }
    setModalMode(null);
  };

  const handleExportExcel = () => {
    const rows = filtered.map((i) => ({
      Codigo: i.code,
      Nome: i.name,
      Tipo: i.type,
      Bairro: i.neighborhoodName,
      Posto_Administrativo: i.administrativePost,
      Latitude: i.latitude,
      Longitude: i.longitude,
      Comprimento_m: i.lengthM ?? '',
      Largura_m: i.widthM ?? '',
      Profundidade_m: i.depthM ?? '',
      Material: i.material,
      Estado_Conservacao: i.conservationState,
      Nivel_Risco: i.riskLevel,
      Ultimo_Levantamento: i.lastSurveyDate,
      Tecnico: i.responsibleTechnician,
    }));
    exportToExcel('sig-dren-infraestruturas', 'Infra-estruturas', rows);
    recordAudit('EXPORT', 'Cadastro de Infra-estruturas', `Exportou ${rows.length} registos para Excel.`);
  };

  const handleExportCSV = () => {
    const rows = filtered.map((i) => ({
      Codigo: i.code,
      Nome: i.name,
      Tipo: i.type,
      Bairro: i.neighborhoodName,
      Latitude: i.latitude,
      Longitude: i.longitude,
      Estado: i.conservationState,
      Risco: i.riskLevel,
    }));
    exportToCSV('sig-dren-infraestruturas', rows);
    recordAudit('EXPORT', 'Cadastro de Infra-estruturas', `Exportou ${rows.length} registos para CSV.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[#171717]">
            Cadastro de Infra-estruturas
          </h1>
          <p className="text-sm text-[#777777]">
            Inventário técnico georreferenciado das redes de drenagem da Matola.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="px-3 py-2 rounded-md bg-white border border-neutral-200 text-xs font-medium hover:bg-[#F4F4F4] flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#16A34A]" /> Excel
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-md bg-white border border-neutral-200 text-xs font-medium hover:bg-[#F4F4F4] flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          {can('create_infrastructure') && (
            <button
              onClick={openCreate}
              className="px-4 py-2 rounded-md bg-[#142B4A] text-white text-xs font-medium hover:bg-[#171717] flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Registar Infra-estrutura
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4 grid sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#777777] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Pesquisar por código, nome ou bairro..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-md border border-neutral-200 text-xs focus:outline-none focus:border-[#2563EB]"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 rounded-md border border-neutral-200 text-xs bg-[#F4F4F4] focus:bg-white"
        >
          <option value="Todos">Todas as Categorias</option>
          <option value="Vala de drenagem">Vala de drenagem</option>
          <option value="Canal de drenagem">Canal de drenagem</option>
          <option value="Colector">Colector</option>
          <option value="Bacia de retenção">Bacia de retenção</option>
          <option value="Passagem hidráulica">Passagem hidráulica</option>
        </select>

        <select
          value={bairroFilter}
          onChange={(e) => setBairroFilter(e.target.value)}
          className="px-3 py-2 rounded-md border border-neutral-200 text-xs bg-[#F4F4F4] focus:bg-white"
        >
          <option value="Todos">Todos os Bairros</option>
          {neighborhoods.map((n) => (
            <option key={n.id} value={n.name}>
              {n.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4F4F4] text-[#777777] uppercase text-[11px]">
              <tr>
                <th className="px-4 py-3 font-semibold">Código</th>
                <th className="px-4 py-3 font-semibold">Nome / Localização</th>
                <th className="px-4 py-3 font-semibold">Tipo</th>
                <th className="px-4 py-3 font-semibold">Bairro</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Risco</th>
                <th className="px-4 py-3 font-semibold text-right">Acções</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map((inf) => (
                <tr key={inf.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 font-mono font-semibold text-[#2563EB] whitespace-nowrap">
                    {inf.code}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-[#171717]">{inf.name}</div>
                    <div className="text-[11px] text-[#777777]">{inf.locationDescription}</div>
                  </td>
                  <td className="px-4 py-3 text-[#555555] whitespace-nowrap">{inf.type}</td>
                  <td className="px-4 py-3 text-[#555555] whitespace-nowrap">{inf.neighborhoodName}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Badge tone={conservationTone(inf.conservationState)}>{inf.conservationState}</Badge>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Badge tone={riskTone(inf.riskLevel)}>{inf.riskLevel}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => navigate(`/app/gis?lat=${inf.latitude}&lng=${inf.longitude}`)}
                        title="Visualizar no mapa"
                        className="p-1.5 rounded hover:bg-[#F4F4F4] text-[#2563EB]"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setActiveItem(inf);
                          setModalMode('view');
                        }}
                        title="Consultar ficha"
                        className="p-1.5 rounded hover:bg-[#F4F4F4] text-[#171717]"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {can('edit_infrastructure') && (
                        <button
                          onClick={() => openEdit(inf)}
                          title="Editar"
                          className="p-1.5 rounded hover:bg-[#F4F4F4] text-[#142B4A]"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {can('delete_infrastructure') && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Eliminar ${inf.code}?`)) {
                              deleteInfrastructure(inf.id);
                            }
                          }}
                          title="Eliminar"
                          className="p-1.5 rounded hover:bg-red-50 text-[#DC2626]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit / View Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-5">
              <h2 className="font-display text-lg font-semibold text-[#171717]">
                {modalMode === 'create'
                  ? 'Nova Infra-estrutura de Drenagem'
                  : modalMode === 'edit'
                  ? `Editar Ficha: ${activeItem?.code}`
                  : `Ficha Técnica: ${activeItem?.code}`}
              </h2>
              <button onClick={() => setModalMode(null)} className="p-1 rounded hover:bg-[#F4F4F4]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalMode === 'view' && activeItem ? (
              <div className="space-y-4 text-xs">
                <div className="grid sm:grid-cols-2 gap-3 bg-[#F4F4F4] p-4 rounded-xl">
                  <div><strong>Código:</strong> {activeItem.code}</div>
                  <div><strong>Nome:</strong> {activeItem.name}</div>
                  <div><strong>Tipo:</strong> {activeItem.type}</div>
                  <div><strong>Província / Município:</strong> {activeItem.province} / {activeItem.municipality}</div>
                  <div><strong>Posto Administrativo:</strong> {activeItem.administrativePost}</div>
                  <div><strong>Bairro:</strong> {activeItem.neighborhoodName}</div>
                  <div><strong>GPS:</strong> {activeItem.latitude}, {activeItem.longitude}</div>
                  <div><strong>Dimensões (C×L×P):</strong> {activeItem.lengthM ?? '-'}m × {activeItem.widthM ?? '-'}m × {activeItem.depthM ?? '-'}m</div>
                  <div><strong>Material:</strong> {activeItem.material}</div>
                  <div><strong>Ano de Construção:</strong> {activeItem.constructionYear ?? 'Não especificado'}</div>
                  <div><strong>Estado:</strong> {activeItem.conservationState}</div>
                  <div><strong>Nível de Risco:</strong> {activeItem.riskLevel}</div>
                  <div><strong>Último Levantamento:</strong> {activeItem.lastSurveyDate}</div>
                  <div><strong>Técnico Responsável:</strong> {activeItem.responsibleTechnician}</div>
                </div>
                {activeItem.photoUrl && (
                  <img src={activeItem.photoUrl} alt={activeItem.name} className="w-full max-h-56 object-cover rounded-xl border" />
                )}
                <div>
                  <strong>Observações:</strong>
                  <p className="mt-1 text-[#555555]">{activeItem.notes || 'Sem observações registadas.'}</p>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => navigate(`/app/gis?lat=${activeItem.latitude}&lng=${activeItem.longitude}`)}
                    className="px-4 py-2 rounded-md bg-[#2563EB] text-white font-medium"
                  >
                    Visualizar no Mapa GIS
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                {formError && (
                  <div className="p-3 rounded-md bg-red-50 border border-red-200 text-[#DC2626]">
                    {formError}
                  </div>
                )}

                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-medium mb-1">Código único *</label>
                    <input
                      required
                      disabled={modalMode === 'edit'}
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value })}
                      placeholder="MAT-VL-011"
                      className="w-full px-3 py-2 rounded-md border border-neutral-200 disabled:bg-[#F4F4F4]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-medium mb-1">Nome da infra-estrutura *</label>
                    <input
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-md border border-neutral-200"
                    />
                  </div>

                  <div>
                    <label className="block font-medium mb-1">Tipo *</label>
                    <select
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value as InfrastructureType })}
                      className="w-full px-3 py-2 rounded-md border border-neutral-200"
                    >
                      <option value="Vala de drenagem">Vala de drenagem</option>
                      <option value="Canal de drenagem">Canal de drenagem</option>
                      <option value="Colector">Colector</option>
                      <option value="Bacia de retenção">Bacia de retenção</option>
                      <option value="Passagem hidráulica">Passagem hidráulica</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium mb-1">Província</label>
                    <input
                      value={form.province}
                      onChange={(e) => setForm({ ...form, province: e.target.value })}
                      className="w-full px-3 py-2 rounded-md border border-neutral-200"
                    />
                  </div>

                  <div>
                    <label className="block font-medium mb-1">Município</label>
                    <input
                      value={form.municipality}
                      onChange={(e) => setForm({ ...form, municipality: e.target.value })}
                      className="w-full px-3 py-2 rounded-md border border-neutral-200"
                    />
                  </div>

                  <div>
                    <label className="block font-medium mb-1">Bairro *</label>
                    <select
                      value={form.neighborhoodId}
                      onChange={(e) => setForm({ ...form, neighborhoodId: e.target.value })}
                      className="w-full px-3 py-2 rounded-md border border-neutral-200"
                    >
                      {neighborhoods.map((n) => (
                        <option key={n.id} value={n.id}>{n.name} ({n.administrativePost})</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-medium mb-1">Localização / Referência *</label>
                    <input
                      required
                      value={form.locationDescription}
                      onChange={(e) => setForm({ ...form, locationDescription: e.target.value })}
                      className="w-full px-3 py-2 rounded-md border border-neutral-200"
                    />
                  </div>

                  <div>
                    <label className="block font-medium mb-1">Latitude *</label>
                    <input
                      type="number"
                      step="0.000001"
                      required
                      value={form.latitude}
                      onChange={(e) => setForm({ ...form, latitude: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-md border border-neutral-200"
                    />
                  </div>

                  <div>
                    <label className="block font-medium mb-1">Longitude *</label>
                    <input
                      type="number"
                      step="0.000001"
                      required
                      value={form.longitude}
                      onChange={(e) => setForm({ ...form, longitude: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-md border border-neutral-200"
                    />
                  </div>

                  <div>
                    <label className="block font-medium mb-1">Material de construção</label>
                    <input
                      value={form.material}
                      onChange={(e) => setForm({ ...form, material: e.target.value })}
                      className="w-full px-3 py-2 rounded-md border border-neutral-200"
                    />
                  </div>

                  <div>
                    <label className="block font-medium mb-1">Comprimento (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={form.lengthM}
                      onChange={(e) => setForm({ ...form, lengthM: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-md border border-neutral-200"
                    />
                  </div>

                  <div>
                    <label className="block font-medium mb-1">Largura (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={form.widthM}
                      onChange={(e) => setForm({ ...form, widthM: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-md border border-neutral-200"
                    />
                  </div>

                  <div>
                    <label className="block font-medium mb-1">Profundidade (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={form.depthM}
                      onChange={(e) => setForm({ ...form, depthM: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-md border border-neutral-200"
                    />
                  </div>

                  <div>
                    <label className="block font-medium mb-1">Ano de construção</label>
                    <input
                      type="number"
                      value={form.constructionYear}
                      onChange={(e) => setForm({ ...form, constructionYear: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-md border border-neutral-200"
                    />
                  </div>

                  <div>
                    <label className="block font-medium mb-1">Estado de conservação</label>
                    <select
                      value={form.conservationState}
                      onChange={(e) => setForm({ ...form, conservationState: e.target.value as ConservationState })}
                      className="w-full px-3 py-2 rounded-md border border-neutral-200"
                    >
                      <option value="Bom estado">Bom estado</option>
                      <option value="Estado aceitável">Estado aceitável</option>
                      <option value="Necessita de manutenção">Necessita de manutenção</option>
                      <option value="Estado crítico">Estado crítico</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium mb-1">Nível de risco</label>
                    <select
                      value={form.riskLevel}
                      onChange={(e) => setForm({ ...form, riskLevel: e.target.value as RiskLevel })}
                      className="w-full px-3 py-2 rounded-md border border-neutral-200"
                    >
                      <option value="Baixo">Baixo</option>
                      <option value="Moderado">Moderado</option>
                      <option value="Alto">Alto</option>
                      <option value="Crítico">Crítico</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium mb-1">Data do último levantamento</label>
                    <input
                      type="date"
                      value={form.lastSurveyDate}
                      onChange={(e) => setForm({ ...form, lastSurveyDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-md border border-neutral-200"
                    />
                  </div>

                  <div>
                    <label className="block font-medium mb-1">Técnico responsável</label>
                    <input
                      required
                      value={form.responsibleTechnician}
                      onChange={(e) => setForm({ ...form, responsibleTechnician: e.target.value })}
                      className="w-full px-3 py-2 rounded-md border border-neutral-200"
                    />
                  </div>

                  <div>
                    <label className="block font-medium mb-1">Fotografia</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="w-full text-[11px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium mb-1">Observações</label>
                  <textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-neutral-200"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => setModalMode(null)}
                    className="px-4 py-2 rounded-md border border-neutral-200 text-[#555555]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-md bg-[#142B4A] text-white font-medium hover:bg-[#171717]"
                  >
                    Guardar Ficha
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

