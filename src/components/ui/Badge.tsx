import React from 'react';
import { ConservationState, OccurrenceSeverity, OccurrenceStatus, RiskLevel, WorkOrderStatus } from '@/types';

type Tone = 'neutral' | 'blue' | 'navy' | 'green' | 'yellow' | 'red';

const TONE_CLASSES: Record<Tone, string> = {
  neutral: 'bg-[#F4F4F4] text-[#171717] border-neutral-200',
  blue: 'bg-blue-50 text-[#2563EB] border-blue-200',
  navy: 'bg-[#142B4A]/10 text-[#142B4A] border-[#142B4A]/20',
  green: 'bg-emerald-50 text-[#16A34A] border-emerald-200',
  yellow: 'bg-amber-50 text-amber-700 border-amber-200',
  red: 'bg-red-50 text-[#DC2626] border-red-200',
};

export const Badge: React.FC<{ tone?: Tone; children: React.ReactNode; className?: string }> = ({
  tone = 'neutral',
  children,
  className = '',
}) => (
  <span
    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${TONE_CLASSES[tone]} ${className}`}
  >
    {children}
  </span>
);

export function conservationTone(state: ConservationState): Tone {
  switch (state) {
    case 'Bom estado':
      return 'green';
    case 'Estado aceitável':
      return 'blue';
    case 'Necessita de manutenção':
      return 'yellow';
    case 'Estado crítico':
      return 'red';
  }
}

export function riskTone(level: RiskLevel): Tone {
  switch (level) {
    case 'Baixo':
      return 'green';
    case 'Moderado':
      return 'blue';
    case 'Alto':
      return 'yellow';
    case 'Crítico':
      return 'red';
  }
}

export function severityTone(sev: OccurrenceSeverity): Tone {
  switch (sev) {
    case 'Baixa':
      return 'green';
    case 'Média':
      return 'blue';
    case 'Alta':
      return 'yellow';
    case 'Crítica':
      return 'red';
  }
}

export function occurrenceStatusTone(st: OccurrenceStatus): Tone {
  switch (st) {
    case 'Nova ocorrência':
      return 'red';
    case 'Em avaliação':
      return 'yellow';
    case 'Em intervenção':
      return 'blue';
    case 'Resolvida':
    case 'Encerrada':
      return 'green';
  }
}

export function workOrderStatusTone(st: WorkOrderStatus): Tone {
  switch (st) {
    case 'Planeada':
      return 'neutral';
    case 'Pendente':
      return 'yellow';
    case 'Em execução':
      return 'blue';
    case 'Concluída':
      return 'green';
    case 'Cancelada':
      return 'red';
  }
}

