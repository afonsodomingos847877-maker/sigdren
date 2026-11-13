import React, { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { FileSpreadsheet, Plus, TrendingUp } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Badge } from '@/components/ui/Badge';
import { exportToExcel } from '@/lib/exportUtils';
import { MealIndicator } from '@/types';

function getTrafficLight(ind: MealIndicator): { label: string; tone: 'green' | 'yellow' | 'red' } {
  const ratio = ind.higherIsBetter
    ? ind.currentValue / (ind.targetValue || 1)
    : (ind.targetValue || 1) / (ind.currentValue || 1);

  if (ratio >= 0.85) return { label: 'Meta Atingida / No Alvo', tone: 'green' };
  if (ratio >= 0.55) return { label: 'Em Progresso', tone: 'yellow' };
  return { label: 'Atenção / Abaixo da Meta', tone: 'red' };
}

export const MealPage: React.FC = () => {
  const { can, indicators, recordIndicatorResult, recordAudit } = useApp();
  const [selectedIndId, setSelectedIndId] = useState<string | null>(null);
  const [period, setPeriod] = useState('2026-11');
  const [value, setValue] = useState<number>(0);
  const [notes, setNotes] = useState('');

  const chartData = indicators.map((ind) => ({
    code: ind.code,
    LinhaBase: ind.baselineValue,
    Actual: ind.currentValue,
    Meta: ind.targetValue,
  }));

  const handleRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIndId) return;
    recordIndicatorResult(selectedIndId, period, Number(value), notes);
    setSelectedIndId(null);
    setNotes('');
  };

  const handleExport = () => {
    const rows = indicators.map((i) => ({
      Codigo: i.code,
      Indicador: i.name,
      Unidade: i.unit,
      Linha_Base: i.baselineValue,
      Meta: i.targetValue,
      Resultado_Actual: i.currentValue,
      Frequencia: i.measurementFrequency,
      Fonte_Verificacao: i.verificationSource,
      Responsavel: i.responsible,
    }));
    exportToExcel('sig-dren-indicadores-meal', 'Indicadores MEAL', rows);
    recordAudit('EXPORT', 'Monitoria MEAL', 'Exportou matriz de indicadores MEAL para Excel.');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[#171717]">
            Monitoria e Avaliação (MEAL)
          </h1>
          <p className="text-sm text-[#777777]">
            Indicadores de desempenho operacional e institucional com cálculo automático e semáforos.
          </p>
        </div>
        <button
          onClick={handleExport}
          className="px-4 py-2 rounded-md bg-[#142B4A] text-white text-xs font-medium hover:bg-[#171717] flex items-center gap-1.5"
        >
          <FileSpreadsheet className="w-4 h-4" /> Exportar Matriz MEAL
        </button>
      </div>

      {/* Comparison Chart */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5">
        <h3 className="text-xs font-semibold text-[#171717] mb-4 flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-[#2563EB]" /> Comparação: Linha de Base vs Resultado Actual vs Meta
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="code" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="LinhaBase" name="Linha de Base" fill="#a1a1aa" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Actual" name="Resultado Actual" fill="#2563EB" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Meta" name="Meta" fill="#16A34A" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Modal for Recording Periodic Result */}
      {selectedIndId && (
        <form onSubmit={handleRecord} className="bg-white rounded-xl border-2 border-[#2563EB] p-5 space-y-3 text-xs">
          <div className="font-semibold text-[#171717]">
            Registar Nova Medição - {indicators.find((i) => i.id === selectedIndId)?.name}
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <input
              required
              placeholder="Período (ex: 2026-11)"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-2 rounded-md border border-neutral-200"
            />
            <input
              type="number"
              step="0.1"
              required
              placeholder="Valor medido"
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              className="px-3 py-2 rounded-md border border-neutral-200"
            />
            <input
              placeholder="Observações / fonte"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="px-3 py-2 rounded-md border border-neutral-200"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setSelectedIndId(null)} className="px-3 py-1.5 text-[#777777]">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-1.5 rounded-md bg-[#2563EB] text-white font-medium">
              Guardar Medição
            </button>
          </div>
        </form>
      )}

      {/* 10 Indicators Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {indicators.map((ind) => {
          const light = getTrafficLight(ind);
          return (
            <div key={ind.id} className="bg-white rounded-xl border border-neutral-200 p-5 space-y-3 text-xs">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono font-semibold text-[#2563EB]">{ind.code}</span>
                  {ind.autoComputed && (
                    <span className="ml-2 text-[10px] px-2 py-0.5 rounded bg-[#F4F4F4] text-[#777777]">
                      Cálculo Automático
                    </span>
                  )}
                  <h3 className="text-sm font-semibold text-[#171717] mt-1">{ind.name}</h3>
                </div>
                <Badge tone={light.tone}>{light.label}</Badge>
              </div>

              <p className="text-[#555555]">{ind.definition}</p>

              <div className="grid grid-cols-3 gap-2 bg-[#F4F4F4] p-3 rounded-lg text-center">
                <div>
                  <div className="text-[10px] text-[#777777]">Linha de Base</div>
                  <div className="font-semibold text-[#171717]">{ind.baselineValue} {ind.unit}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#777777]">Resultado Actual</div>
                  <div className="font-bold text-sm text-[#2563EB]">{ind.currentValue} {ind.unit}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#777777]">Meta</div>
                  <div className="font-semibold text-[#16A34A]">{ind.targetValue} {ind.unit}</div>
                </div>
              </div>

              <div className="text-[11px] text-[#777777] space-y-0.5">
                <div><strong>Fórmula:</strong> {ind.formula}</div>
                <div><strong>Frequência:</strong> {ind.measurementFrequency} • <strong>Fonte:</strong> {ind.verificationSource}</div>
                <div><strong>Responsável:</strong> {ind.responsible}</div>
              </div>

              {can('manage_meal') && !ind.autoComputed && (
                <div className="pt-2 border-t border-neutral-100 flex justify-end">
                  <button
                    onClick={() => {
                      setSelectedIndId(ind.id);
                      setValue(ind.currentValue);
                    }}
                    className="text-xs font-medium text-[#2563EB] hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Registar Resultado
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

