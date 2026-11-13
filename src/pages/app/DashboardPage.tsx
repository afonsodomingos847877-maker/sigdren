import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Database,
  Filter,
  ShieldAlert,
  Wrench,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { LeafletMap } from '@/components/LeafletMap';
import { Badge, occurrenceStatusTone, workOrderStatusTone } from '@/components/ui/Badge';
import { ROLES } from '@/config/roles';

const CHART_COLORS = ['#142B4A', '#2563EB', '#16A34A', '#EAB308', '#DC2626', '#777777'];

export const DashboardPage: React.FC = () => {
  const {
    currentUser,
    neighborhoods,
    infrastructures,
    occurrences,
    workOrders,
    riskZones,
    notifications,
  } = useApp();

  // Dynamic filters
  const [period, setPeriod] = useState<'all' | '30d' | '90d'>('all');
  const [bairro, setBairro] = useState('Todos');
  const [infraType, setInfraType] = useState('Todos');
  const [stateFilter, setStateFilter] = useState('Todos');
  const [riskFilter, setRiskFilter] = useState('Todos');

  const filteredInfrastructures = useMemo(() => {
    return infrastructures.filter((inf) => {
      if (bairro !== 'Todos' && inf.neighborhoodName !== bairro) return false;
      if (infraType !== 'Todos' && inf.type !== infraType) return false;
      if (stateFilter !== 'Todos' && inf.conservationState !== stateFilter) return false;
      if (riskFilter !== 'Todos' && inf.riskLevel !== riskFilter) return false;
      return true;
    });
  }, [infrastructures, bairro, infraType, stateFilter, riskFilter]);

  const filteredOccurrences = useMemo(() => {
    const now = Date.now();
    return occurrences.filter((occ) => {
      if (bairro !== 'Todos' && occ.neighborhoodName !== bairro) return false;
      if (period === '30d' && now - new Date(occ.occurredAt).getTime() > 30 * 86400000) return false;
      if (period === '90d' && now - new Date(occ.occurredAt).getTime() > 90 * 86400000) return false;
      return true;
    });
  }, [occurrences, bairro, period]);

  const filteredWorkOrders = useMemo(() => {
    const infIds = new Set(filteredInfrastructures.map((i) => i.id));
    return workOrders.filter((w) => !w.infrastructureId || infIds.has(w.infrastructureId));
  }, [workOrders, filteredInfrastructures]);

  // 10 KPIs
  const kpis = useMemo(() => {
    const totalInfra = filteredInfrastructures.length;
    const canaisValas = filteredInfrastructures.filter(
      (i) => i.type === 'Canal de drenagem' || i.type === 'Vala de drenagem'
    ).length;
    const colectores = filteredInfrastructures.filter((i) => i.type === 'Colector').length;
    const bacias = filteredInfrastructures.filter((i) => i.type === 'Bacia de retenção').length;
    const pontosCriticos = filteredInfrastructures.filter(
      (i) => i.riskLevel === 'Crítico' || i.conservationState === 'Estado crítico'
    ).length;
    const totalOcc = filteredOccurrences.length;
    const bomEstado = filteredInfrastructures.filter((i) => i.conservationState === 'Bom estado').length;
    const estadoCritico = filteredInfrastructures.filter((i) => i.conservationState === 'Estado crítico').length;
    const intervPendentes = filteredWorkOrders.filter(
      (w) => w.status === 'Planeada' || w.status === 'Pendente' || w.status === 'Em execução'
    ).length;
    const intervConcluidas = filteredWorkOrders.filter((w) => w.status === 'Concluída').length;

    return [
      { label: 'Infra-estruturas Cadastradas', value: totalInfra, tone: 'text-[#171717]' },
      { label: 'Canais e Valas', value: canaisValas, tone: 'text-[#142B4A]' },
      { label: 'Colectores', value: colectores, tone: 'text-[#2563EB]' },
      { label: 'Bacias de Retenção', value: bacias, tone: 'text-[#142B4A]' },
      { label: 'Pontos Críticos', value: pontosCriticos, tone: 'text-[#DC2626]' },
      { label: 'Ocorrências Registadas', value: totalOcc, tone: 'text-[#171717]' },
      { label: 'Em Bom Estado', value: bomEstado, tone: 'text-[#16A34A]' },
      { label: 'Em Estado Crítico', value: estadoCritico, tone: 'text-[#DC2626]' },
      { label: 'Intervenções Pendentes', value: intervPendentes, tone: 'text-amber-600' },
      { label: 'Intervenções Concluídas', value: intervConcluidas, tone: 'text-[#16A34A]' },
    ];
  }, [filteredInfrastructures, filteredOccurrences, filteredWorkOrders]);

  // Chart 1: Infra-estruturas por tipo
  const byTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredInfrastructures.forEach((i) => {
      counts[i.type] = (counts[i.type] || 0) + 1;
    });
    return Object.entries(counts).map(([name, total]) => ({ name: name.replace(' de drenagem', ''), total }));
  }, [filteredInfrastructures]);

  // Chart 2: Infra-estruturas por estado de conservação
  const byStateData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredInfrastructures.forEach((i) => {
      counts[i.conservationState] = (counts[i.conservationState] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredInfrastructures]);

  // Chart 3: Ocorrências por bairro
  const occByNeighborhood = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredOccurrences.forEach((o) => {
      counts[o.neighborhoodName] = (counts[o.neighborhoodName] || 0) + 1;
    });
    return Object.entries(counts).map(([bairro, total]) => ({ bairro, total }));
  }, [filteredOccurrences]);

  // Chart 4: Evolução mensal das ocorrências
  const occMonthly = useMemo(() => {
    const months: Record<string, number> = {};
    filteredOccurrences.forEach((o) => {
      const m = o.occurredAt.slice(0, 7);
      months[m] = (months[m] || 0) + 1;
    });
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, total]) => ({ mes, total }));
  }, [filteredOccurrences]);

  // Chart 5: Intervenções realizadas vs pendentes
  const woStatusData = useMemo(() => {
    const realizados = filteredWorkOrders.filter((w) => w.status === 'Concluída').length;
    const execucao = filteredWorkOrders.filter((w) => w.status === 'Em execução').length;
    const pendentes = filteredWorkOrders.filter((w) => w.status === 'Pendente' || w.status === 'Planeada').length;
    return [
      { categoria: 'Concluídas', total: realizados },
      { categoria: 'Em execução', total: execucao },
      { categoria: 'Pendentes / Planeadas', total: pendentes },
    ];
  }, [filteredWorkOrders]);

  // Chart 6: Distribuição dos níveis de risco
  const riskDistData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredInfrastructures.forEach((i) => {
      counts[i.riskLevel] = (counts[i.riskLevel] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredInfrastructures]);

  const unreadAlerts = notifications.filter((n) => !n.read);

  return (
    <div className="space-y-6">
      {/* Greeting & Demo Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl font-semibold text-[#171717]">
              Dashboard Executivo
            </h1>
            <Badge tone="yellow">Dados de Demonstração</Badge>
          </div>
          <p className="text-sm text-[#777777] mt-0.5">
            Bem-vindo(a), <strong className="text-[#171717]">{currentUser?.fullName}</strong> (
            {currentUser ? ROLES[currentUser.role].name : ''}) - Visão consolidada do Município da Matola.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/app/gis"
            className="px-3.5 py-2 rounded-md bg-white border border-neutral-200 text-xs font-medium text-[#171717] hover:bg-[#F4F4F4] flex items-center gap-1.5"
          >
            Abrir Mapa GIS <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            to="/app/reports"
            className="px-3.5 py-2 rounded-md bg-[#142B4A] text-white text-xs font-medium hover:bg-[#171717] flex items-center gap-1.5"
          >
            Gerar Relatório
          </Link>
        </div>
      </div>

      {/* Dynamic Filters Bar */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#171717] mb-3">
          <Filter className="w-3.5 h-3.5 text-[#2563EB]" /> Filtros Dinâmicos
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as 'all' | '30d' | '90d')}
            className="px-3 py-2 rounded-md border border-neutral-200 text-xs bg-[#F4F4F4] focus:bg-white focus:outline-none"
          >
            <option value="all">Período: Todo o histórico</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
          </select>

          <select
            value={bairro}
            onChange={(e) => setBairro(e.target.value)}
            className="px-3 py-2 rounded-md border border-neutral-200 text-xs bg-[#F4F4F4] focus:bg-white focus:outline-none"
          >
            <option value="Todos">Bairro: Todos</option>
            {neighborhoods.map((n) => (
              <option key={n.id} value={n.name}>
                {n.name}
              </option>
            ))}
          </select>

          <select
            value={infraType}
            onChange={(e) => setInfraType(e.target.value)}
            className="px-3 py-2 rounded-md border border-neutral-200 text-xs bg-[#F4F4F4] focus:bg-white focus:outline-none"
          >
            <option value="Todos">Tipo: Todos</option>
            <option value="Vala de drenagem">Vala de drenagem</option>
            <option value="Canal de drenagem">Canal de drenagem</option>
            <option value="Colector">Colector</option>
            <option value="Bacia de retenção">Bacia de retenção</option>
            <option value="Passagem hidráulica">Passagem hidráulica</option>
          </select>

          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="px-3 py-2 rounded-md border border-neutral-200 text-xs bg-[#F4F4F4] focus:bg-white focus:outline-none"
          >
            <option value="Todos">Estado: Todos</option>
            <option value="Bom estado">Bom estado</option>
            <option value="Estado aceitável">Estado aceitável</option>
            <option value="Necessita de manutenção">Necessita de manutenção</option>
            <option value="Estado crítico">Estado crítico</option>
          </select>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-3 py-2 rounded-md border border-neutral-200 text-xs bg-[#F4F4F4] focus:bg-white focus:outline-none"
          >
            <option value="Todos">Risco: Todos</option>
            <option value="Baixo">Baixo</option>
            <option value="Moderado">Moderado</option>
            <option value="Alto">Alto</option>
            <option value="Crítico">Crítico</option>
          </select>
        </div>
      </div>

      {/* 10 KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white rounded-xl border border-neutral-200 p-4 flex flex-col justify-between"
          >
            <span className="text-[11px] text-[#777777] font-medium leading-tight">{kpi.label}</span>
            <span className={`font-display text-2xl font-bold mt-2 ${kpi.tone}`}>{kpi.value}</span>
          </div>
        ))}
      </div>

      {/* 6 Statistical Charts */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        {/* Chart 1 */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <h3 className="text-xs font-semibold text-[#171717] mb-4">Infra-estruturas por Tipo</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byTypeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="total" fill="#142B4A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2 */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <h3 className="text-xs font-semibold text-[#171717] mb-4">Estado de Conservação</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byStateData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={72} label={{ fontSize: 10 }}>
                  {byStateData.map((_, idx) => (
                    <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3 */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <h3 className="text-xs font-semibold text-[#171717] mb-4">Ocorrências por Bairro</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={occByNeighborhood}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="bairro" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="total" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4 */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <h3 className="text-xs font-semibold text-[#171717] mb-4">Evolução Mensal das Ocorrências</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={occMonthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="#DC2626" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 5 */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <h3 className="text-xs font-semibold text-[#171717] mb-4">Intervenções Realizadas vs Pendentes</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={woStatusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="categoria" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="total" fill="#16A34A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 6 */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <h3 className="text-xs font-semibold text-[#171717] mb-4">Distribuição dos Níveis de Risco</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={riskDistData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={38} outerRadius={72}>
                  {riskDistData.map((entry, idx) => {
                    const color =
                      entry.name === 'Crítico'
                        ? '#DC2626'
                        : entry.name === 'Alto'
                        ? '#EAB308'
                        : entry.name === 'Moderado'
                        ? '#2563EB'
                        : '#16A34A';
                    return <Cell key={idx} fill={color} />;
                  })}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Location Map + Recent Operational Feed */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-neutral-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-[#171717]">Mapa de Localização - Matola</h3>
            <Link to="/app/gis" className="text-xs text-[#2563EB] hover:underline">
              Expandir mapa completo
            </Link>
          </div>
          <LeafletMap
            infrastructures={filteredInfrastructures}
            occurrences={filteredOccurrences}
            riskZones={riskZones}
            workOrders={filteredWorkOrders}
            heightClass="h-[340px]"
            activeLayers={{
              valas: true,
              canais: true,
              colectores: true,
              bacias: true,
              passagens: true,
              inundacoes: true,
              zonas_risco: true,
              intervencoes: false,
            }}
          />
        </div>

        <div className="space-y-5">
          {/* Alertas importantes */}
          <div className="bg-white rounded-xl border border-neutral-200 p-5">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#171717] mb-3">
              <ShieldAlert className="w-4 h-4 text-[#DC2626]" /> Alertas Importantes ({unreadAlerts.length})
            </div>
            <div className="space-y-2.5">
              {unreadAlerts.slice(0, 3).map((a) => (
                <div key={a.id} className="p-2.5 rounded-lg bg-[#F4F4F4] text-xs">
                  <div className="font-semibold text-[#171717]">{a.title}</div>
                  <div className="text-[#777777] text-[11px] mt-0.5">{a.message}</div>
                </div>
              ))}
              {unreadAlerts.length === 0 && (
                <div className="text-xs text-[#777777] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A]" /> Sem alertas pendentes.
                </div>
              )}
            </div>
          </div>

          {/* Últimas ocorrências */}
          <div className="bg-white rounded-xl border border-neutral-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#171717] flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" /> Últimas Ocorrências
              </span>
              <Link to="/app/occurrences" className="text-[11px] text-[#2563EB] hover:underline">
                Ver todas
              </Link>
            </div>
            <div className="space-y-2">
              {filteredOccurrences.slice(0, 3).map((occ) => (
                <div key={occ.id} className="flex items-center justify-between text-xs py-1.5 border-b last:border-b-0 border-neutral-100">
                  <div>
                    <div className="font-medium text-[#171717]">{occ.code} - {occ.neighborhoodName}</div>
                    <div className="text-[11px] text-[#777777]">{occ.occurrenceType}</div>
                  </div>
                  <Badge tone={occurrenceStatusTone(occ.status)}>{occ.status}</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Intervenções pendentes */}
          <div className="bg-white rounded-xl border border-neutral-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#171717] flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-[#2563EB]" /> Intervenções Pendentes
              </span>
              <Link to="/app/maintenance" className="text-[11px] text-[#2563EB] hover:underline">
                Gerir
              </Link>
            </div>
            <div className="space-y-2">
              {filteredWorkOrders
                .filter((w) => w.status !== 'Concluída' && w.status !== 'Cancelada')
                .slice(0, 3)
                .map((wo) => (
                  <div key={wo.id} className="flex items-center justify-between text-xs py-1.5 border-b last:border-b-0 border-neutral-100">
                    <div className="truncate pr-2">
                      <div className="font-medium text-[#171717] truncate">{wo.code} - {wo.title}</div>
                      <div className="text-[11px] text-[#777777]">Prazo: {wo.dueDate}</div>
                    </div>
                    <Badge tone={workOrderStatusTone(wo.status)}>{wo.status}</Badge>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

