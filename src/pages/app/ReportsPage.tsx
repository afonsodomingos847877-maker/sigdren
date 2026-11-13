import React, { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { FileDown, FileSpreadsheet, FileText } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { exportReportToPDF, exportToExcel } from '@/lib/exportUtils';

type ReportType =
  | 'infraestruturas'
  | 'inspeccoes'
  | 'ocorrencias'
  | 'manutencao'
  | 'zonas_criticas'
  | 'meal'
  | 'institucional';

const REPORT_OPTIONS: { key: ReportType; label: string }[] = [
  { key: 'infraestruturas', label: '1. Relatório de Infra-estruturas Cadastradas' },
  { key: 'inspeccoes', label: '2. Relatório de Inspecções Digitais' },
  { key: 'ocorrencias', label: '3. Relatório de Ocorrências e Inundações' },
  { key: 'manutencao', label: '4. Relatório de Manutenção e Intervenções' },
  { key: 'zonas_criticas', label: '5. Relatório de Zonas Críticas' },
  { key: 'meal', label: '6. Relatório de Indicadores MEAL' },
  { key: 'institucional', label: '7. Relatório de Desempenho Institucional' },
];

export const ReportsPage: React.FC = () => {
  const {
    can,
    infrastructures,
    inspections,
    occurrences,
    workOrders,
    riskZones,
    indicators,
    recordAudit,
  } = useApp();

  const [reportType, setReportType] = useState<ReportType>('infraestruturas');
  const [period, setPeriod] = useState('Novembro 2026');
  const [observations, setObservations] = useState(
    'Relatório gerado automaticamente a partir dos registos validados no SIG-DREN Matola (EMSAAM).'
  );

  const reportData = useMemo(() => {
    switch (reportType) {
      case 'infraestruturas':
        return {
          title: 'Relatório de Infra-estruturas Cadastradas',
          subtitle: 'Inventário técnico de drenagem pluvial - Município da Matola',
          kpis: [
            { label: 'Total Cadastrado', value: String(infrastructures.length) },
            {
              label: 'Bom Estado',
              value: String(infrastructures.filter((i) => i.conservationState === 'Bom estado').length),
            },
            {
              label: 'Estado Crítico',
              value: String(infrastructures.filter((i) => i.conservationState === 'Estado crítico').length),
            },
            { label: 'Com GPS Válido', value: '100%' },
          ],
          analysis: `O cadastro actual contabiliza ${infrastructures.length} infra-estruturas distribuídas pelos bairros da Matola, permitindo monitorar o estado estrutural e priorizar intervenções preventivas.`,
          headers: ['Código', 'Nome', 'Tipo', 'Bairro', 'Estado', 'Risco'],
          rows: infrastructures.map((i) => [
            i.code,
            i.name,
            i.type,
            i.neighborhoodName,
            i.conservationState,
            i.riskLevel,
          ]),
          chart: ['Bom estado', 'Estado aceitável', 'Necessita de manutenção', 'Estado crítico'].map((st) => ({
            label: st,
            total: infrastructures.filter((i) => i.conservationState === st).length,
          })),
        };

      case 'inspeccoes':
        return {
          title: 'Relatório de Inspecções Digitais',
          subtitle: 'Resumo de vistorias de campo e anomalias identificadas',
          kpis: [
            { label: 'Total Inspecções', value: String(inspections.length) },
            { label: 'Com Obstrução', value: String(inspections.filter((i) => i.hasObstruction).length) },
            { label: 'Com Erosão', value: String(inspections.filter((i) => i.hasErosion).length) },
            {
              label: 'Sincronizadas',
              value: String(inspections.filter((i) => i.syncStatus === 'synced').length),
            },
          ],
          analysis: `Foram realizadas ${inspections.length} inspecções digitais com georreferenciação, identificando situações de obstrução e erosão para encaminhamento à equipa de manutenção.`,
          headers: ['Infra-estrutura', 'Data', 'Técnico', 'Gravidade', 'Sync'],
          rows: inspections.map((i) => [
            i.infrastructureCode,
            i.inspectionDate.slice(0, 10),
            i.technicianName,
            i.severity,
            i.syncStatus,
          ]),
          chart: ['Bom estado', 'Estado aceitável', 'Necessita de manutenção', 'Estado crítico'].map((st) => ({
            label: st,
            total: inspections.filter((i) => i.severity === st).length,
          })),
        };

      case 'ocorrencias':
        return {
          title: 'Relatório de Ocorrências e Inundações',
          subtitle: 'Análise de incidentes por bairro e gravidade',
          kpis: [
            { label: 'Total Ocorrências', value: String(occurrences.length) },
            {
              label: 'Resolvidas/Encerradas',
              value: String(occurrences.filter((o) => o.status === 'Resolvida' || o.status === 'Encerrada').length),
            },
            {
              label: 'Críticas / Altas',
              value: String(occurrences.filter((o) => o.severity === 'Crítica' || o.severity === 'Alta').length),
            },
            {
              label: 'Pessoas Afectadas',
              value: String(occurrences.reduce((a, o) => a + (o.affectedPeople ?? 0), 0)),
            },
          ],
          analysis: `Registaram-se ${occurrences.length} ocorrências no período analisado. As zonas baixas da Liberdade e Patrice Lumumba concentram os eventos de maior severidade.`,
          headers: ['Código', 'Tipo', 'Bairro', 'Gravidade', 'Estado'],
          rows: occurrences.map((o) => [o.code, o.occurrenceType, o.neighborhoodName, o.severity, o.status]),
          chart: ['Baixa', 'Média', 'Alta', 'Crítica'].map((sev) => ({
            label: sev,
            total: occurrences.filter((o) => o.severity === sev).length,
          })),
        };

      case 'manutencao':
        return {
          title: 'Relatório de Manutenção e Intervenções',
          subtitle: 'Execução de ordens de trabalho e custos operacionais',
          kpis: [
            { label: 'Total Ordens', value: String(workOrders.length) },
            { label: 'Concluídas', value: String(workOrders.filter((w) => w.status === 'Concluída').length) },
            { label: 'Em Execução', value: String(workOrders.filter((w) => w.status === 'Em execução').length) },
            {
              label: 'Custo Total (MZN)',
              value: workOrders.reduce((a, w) => a + w.costMzn, 0).toLocaleString('pt-PT'),
            },
          ],
          analysis: `O plano operacional contempla ${workOrders.length} ordens de trabalho, com foco na desobstrução de colectores e estabilização de taludes antes do pico chuvoso.`,
          headers: ['Código', 'Intervenção', 'Equipa', 'Prazo', 'Custo (MZN)', 'Estado'],
          rows: workOrders.map((w) => [
            w.code,
            w.title,
            w.assignedTeam,
            w.dueDate,
            w.costMzn.toLocaleString('pt-PT'),
            w.status,
          ]),
          chart: ['Planeada', 'Pendente', 'Em execução', 'Concluída'].map((st) => ({
            label: st,
            total: workOrders.filter((w) => w.status === st).length,
          })),
        };

      case 'zonas_criticas':
        return {
          title: 'Relatório de Zonas Críticas',
          subtitle: 'Mapeamento de áreas de elevada vulnerabilidade hidrológica',
          kpis: [
            { label: 'Zonas Mapeadas', value: String(riskZones.length) },
            { label: 'Risco Crítico', value: String(riskZones.filter((z) => z.riskLevel === 'Crítico').length) },
            {
              label: 'Pop. Estimada',
              value: riskZones.reduce((a, z) => a + z.estimatedAffectedPopulation, 0).toLocaleString('pt-PT'),
            },
            { label: 'Activos Críticos', value: String(infrastructures.filter((i) => i.riskLevel === 'Crítico').length) },
          ],
          analysis: `Foram delimitadas ${riskZones.length} zonas de risco prioritárias no Município da Matola, requerendo monitoria contínua e limpeza preventiva.`,
          headers: ['Código', 'Zona', 'Bairro', 'Risco', 'População Estimada'],
          rows: riskZones.map((z) => [
            z.code,
            z.name,
            z.neighborhoodName,
            z.riskLevel,
            z.estimatedAffectedPopulation.toLocaleString('pt-PT'),
          ]),
          chart: riskZones.map((z) => ({ label: z.neighborhoodName, total: z.estimatedAffectedPopulation })),
        };

      case 'meal':
        return {
          title: 'Relatório de Indicadores MEAL',
          subtitle: 'Monitoria e Avaliação do desempenho da rede e equipa',
          kpis: [
            { label: 'Indicadores', value: String(indicators.length) },
            { label: 'Auto-calculados', value: String(indicators.filter((i) => i.autoComputed).length) },
            { label: 'Cobertura GPS', value: `${indicators.find((i) => i.code === 'MEAL-02')?.currentValue ?? 100}%` },
            { label: 'Capacitação', value: `${indicators.find((i) => i.code === 'MEAL-10')?.currentValue ?? 83}%` },
          ],
          analysis: `Os 10 indicadores institucionais demonstram evolução positiva face à linha de base, com destaque para a validação geoespacial e cumprimento de prazos de manutenção.`,
          headers: ['Código', 'Indicador', 'Base', 'Actual', 'Meta', 'Unidade'],
          rows: indicators.map((i) => [
            i.code,
            i.name,
            i.baselineValue,
            i.currentValue,
            i.targetValue,
            i.unit,
          ]),
          chart: indicators.slice(0, 6).map((i) => ({ label: i.code, total: i.currentValue })),
        };

      case 'institucional':
        return {
          title: 'Relatório de Desempenho Institucional',
          subtitle: 'Síntese executiva para o Conselho de Administração da EMSAAM',
          kpis: [
            { label: 'Infra-estruturas', value: String(infrastructures.length) },
            { label: 'Inspecções', value: String(inspections.length) },
            { label: 'Ocorrências', value: String(occurrences.length) },
            { label: 'Ordens Trabalho', value: String(workOrders.length) },
          ],
          analysis: `A adopção do SIG-DREN Matola consolidou o inventário geográfico, reduziu o tempo de triagem de ocorrências e estabeleceu rastreabilidade integral das intervenções.`,
          headers: ['Módulo', 'Registos Activos', 'Indicador Chave'],
          rows: [
            ['Cadastro GIS', infrastructures.length, '100% georreferenciado'],
            ['Inspecções Digitais', inspections.length, 'Suporte offline operacional'],
            ['Ocorrências', occurrences.length, 'Monitoria por bairro'],
            ['Manutenção', workOrders.length, 'Controlo de custos e prazos'],
            ['MEAL', indicators.length, '10 indicadores acompanhados'],
          ],
          chart: [
            { label: 'Infra-estruturas', total: infrastructures.length },
            { label: 'Inspecções', total: inspections.length },
            { label: 'Ocorrências', total: occurrences.length },
            { label: 'Manutenção', total: workOrders.length },
          ],
        };
    }
  }, [reportType, infrastructures, inspections, occurrences, workOrders, riskZones, indicators]);

  const handleExportPDF = () => {
    exportReportToPDF({
      title: reportData.title,
      subtitle: reportData.subtitle,
      referencePeriod: period,
      kpis: reportData.kpis,
      analysis: reportData.analysis,
      observations,
      tableHeaders: reportData.headers,
      tableRows: reportData.rows,
      filename: `sig-dren-relatorio-${reportType}`,
    });
    recordAudit('EXPORT', 'Relatórios BI', `Exportou PDF: ${reportData.title}`);
  };

  const handleExportExcel = () => {
    const objects = reportData.rows.map((row) => {
      const obj: Record<string, unknown> = {};
      reportData.headers.forEach((h, idx) => {
        obj[h] = row[idx];
      });
      return obj;
    });
    exportToExcel(`sig-dren-relatorio-${reportType}`, 'Relatorio', objects);
    recordAudit('EXPORT', 'Relatórios BI', `Exportou Excel: ${reportData.title}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[#171717]">
            Relatórios e Business Intelligence
          </h1>
          <p className="text-sm text-[#777777]">
            Geração dinâmica de relatórios institucionais com exportação em PDF e Excel.
          </p>
        </div>

        {can('export_reports') && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2 rounded-md bg-white border border-neutral-200 text-xs font-medium hover:bg-[#F4F4F4] flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#16A34A]" /> Exportar Excel
            </button>
            <button
              onClick={handleExportPDF}
              className="px-4 py-2 rounded-md bg-[#142B4A] text-white text-xs font-medium hover:bg-[#171717] flex items-center gap-1.5"
            >
              <FileDown className="w-4 h-4" /> Exportar PDF
            </button>
          </div>
        )}
      </div>

      {/* Report Selector */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4 grid sm:grid-cols-2 gap-4 text-xs">
        <div>
          <label className="block font-medium text-[#777777] mb-1">Tipo de Relatório</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as ReportType)}
            className="w-full px-3 py-2 rounded-md border border-neutral-200 bg-[#F4F4F4] font-medium"
          >
            {REPORT_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-medium text-[#777777] mb-1">Período de Referência</label>
          <input
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-neutral-200"
          />
        </div>
      </div>

      {/* Preview Sheet */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-neutral-200">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#2563EB] font-semibold uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5" /> Pré-visualização Oficial
            </div>
            <h2 className="font-display text-xl font-semibold text-[#171717] mt-1">{reportData.title}</h2>
            <p className="text-xs text-[#777777]">{reportData.subtitle}</p>
          </div>
          <div className="text-xs text-[#777777] sm:text-right">
            <div>Período: <strong>{period}</strong></div>
            <div>Data de geração: {new Date().toLocaleDateString('pt-PT')}</div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {reportData.kpis.map((k) => (
            <div key={k.label} className="bg-[#F4F4F4] rounded-lg p-3.5">
              <div className="text-[11px] text-[#777777]">{k.label}</div>
              <div className="font-display text-xl font-bold text-[#171717] mt-1">{k.value}</div>
            </div>
          ))}
        </div>

        {/* Analysis & Chart */}
        <div className="grid lg:grid-cols-2 gap-6 items-center">
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-[#171717] uppercase tracking-wider">
              Análise dos Resultados
            </h3>
            <p className="text-xs text-[#555555] leading-relaxed">{reportData.analysis}</p>
            <div className="pt-2">
              <label className="block text-[11px] font-medium text-[#777777] mb-1">
                Observações adicionais para o relatório:
              </label>
              <textarea
                rows={2}
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-neutral-200 text-xs"
              />
            </div>
          </div>

          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="total" fill="#142B4A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-neutral-200 rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#142B4A] text-white">
              <tr>
                {reportData.headers.map((h) => (
                  <th key={h} className="px-3.5 py-2.5 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {reportData.rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-neutral-50">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3.5 py-2.5 text-[#171717]">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

