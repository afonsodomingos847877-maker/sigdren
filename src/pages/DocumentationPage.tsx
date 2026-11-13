import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  ClipboardCheck,
  Database,
  FileSpreadsheet,
  Globe2,
  ShieldCheck,
  WifiOff,
  Wrench,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { ROLES } from '@/config/roles';
import { RoleCode } from '@/types';
import { useApp } from '@/context/AppContext';

const MODULES_GUIDE = [
  {
    title: '1. Dashboard Executivo',
    icon: FileSpreadsheet,
    howItWorks:
      'Consolida 10 indicadores KPI e 6 gráficos estatísticos em tempo real. Os filtros dinâmicos (período, bairro, tipo, estado e risco) recalculam automaticamente todos os cartões, gráficos e o mapa.',
  },
  {
    title: '2. Mapa GIS (Leaflet + OpenStreetMap)',
    icon: Globe2,
    howItWorks:
      'Apresenta 8 camadas geográficas activáveis (valas, canais, colectores, bacias, passagens hidráulicas, pontos de inundação, zonas de risco e intervenções). Permite pesquisar por bairro, ler GPS ao passar o cursor, importar e exportar GeoJSON.',
  },
  {
    title: '3. Cadastro de Infra-estruturas',
    icon: Database,
    howItWorks:
      'Gere a ficha técnica completa (21 campos) com validação de códigos duplicados, upload de fotografia, exportação em Excel/CSV e ligação directa para visualizar o activo no mapa GIS.',
  },
  {
    title: '4. Inspecção Digital & Modo Offline',
    icon: ClipboardCheck,
    howItWorks:
      'Regista vistorias no terreno (obstruções, resíduos, erosão, danos estruturais, GPS e foto). Quando não há internet, guarda localmente no IndexedDB e sincroniza automaticamente ao voltar online sem duplicar registos.',
  },
  {
    title: '5. Ocorrências, Zonas de Risco e Manutenção',
    icon: Wrench,
    howItWorks:
      'Acompanha ocorrências desde a comunicação até ao encerramento, delimita polígonos de risco e gere ordens de trabalho com equipas, prazos, custos em MZN, progresso (%) e alertas de atraso.',
  },
  {
    title: '6. Monitoria MEAL e Relatórios BI',
    icon: BookOpen,
    howItWorks:
      'Calcula automaticamente indicadores operacionais a partir da base de dados, compara linha de base vs meta com semáforos e gera 7 tipos de relatórios exportáveis em PDF e Excel.',
  },
];

export const DocumentationPage: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  const { currentUser } = useApp();

  return (
    <div className={embedded ? 'space-y-8' : 'min-h-screen bg-[#F4F4F4] text-[#171717]'}>
      {!embedded && (
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200">
          <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
            <Link to="/">
              <Logo />
            </Link>
            <div className="flex items-center gap-4 text-xs font-medium">
              <Link to="/" className="text-[#777777] hover:text-[#171717] flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Website
              </Link>
              <Link
                to={currentUser ? '/app' : '/login'}
                className="px-4 py-1.5 rounded-sm bg-[#142B4A] text-white hover:bg-[#171717]"
              >
                {currentUser ? 'Voltar ao Painel' : 'Aceder ao sistema'}
              </Link>
            </div>
          </div>
        </header>
      )}

      <div className={embedded ? 'space-y-8' : 'max-w-6xl mx-auto px-6 py-10 space-y-8'}>
        {/* Header */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-7">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#2563EB] mb-2">
            Manual Técnico e Operacional
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#171717]">
            Documentação do Sistema SIG-DREN Matola
          </h1>
          <p className="text-sm text-[#777777] mt-2 max-w-3xl">
            Guia prático de funcionamento da plataforma integrada de mapeamento, cadastro, inspecção,
            manutenção e monitoria de infra-estruturas de drenagem da EMSAAM.
          </p>
        </div>

        {/* Operational Flow */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-7">
          <h2 className="font-display text-lg font-semibold text-[#171717] mb-5">
            Fluxo Operacional Integrado
          </h2>
          <div className="grid md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-[#F4F4F4] space-y-1.5">
              <div className="font-semibold text-[#142B4A]">1. Recolha no Terreno</div>
              <p className="text-[#555555]">
                Inspectores registam vistorias, fotos, coordenadas GPS e ocorrências no telemóvel ou computador,
                mesmo sem ligação à internet.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#F4F4F4] space-y-1.5">
              <div className="font-semibold text-[#2563EB]">2. Base Geoespacial Central</div>
              <p className="text-[#555555]">
                Os dados sincronizam automaticamente para o MongoDB Atlas (índices 2dsphere) e actualizam o mapa
                GIS e os estados de conservação.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#F4F4F4] space-y-1.5">
              <div className="font-semibold text-[#16A34A]">3. Decisão, Manutenção e MEAL</div>
              <p className="text-[#555555]">
                Gestores acompanham alertas críticos, emitem ordens de trabalho, monitoram metas MEAL e exportam
                relatórios oficiais em PDF e Excel.
              </p>
            </div>
          </div>
        </div>

        {/* Modules Guide */}
        <div className="grid md:grid-cols-2 gap-5">
          {MODULES_GUIDE.map((mod) => {
            const Icon = mod.icon;
            return (
              <div key={mod.title} className="bg-white rounded-xl border border-neutral-200 p-6 space-y-2">
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 text-[#2563EB]" />
                  <h3 className="font-display text-sm font-semibold text-[#171717]">{mod.title}</h3>
                </div>
                <p className="text-xs text-[#555555] leading-relaxed">{mod.howItWorks}</p>
              </div>
            );
          })}
        </div>

        {/* Offline Sync Guide */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-7 space-y-3">
          <div className="flex items-center gap-2 font-display text-base font-semibold text-[#171717]">
            <WifiOff className="w-4 h-4 text-amber-600" /> Como Funciona o Modo Offline (Campo)
          </div>
          <ol className="list-decimal list-inside space-y-1.5 text-xs text-[#555555]">
            <li>
              Se perder a ligação à internet (ou activar o botão <strong>Offline</strong> na barra superior para
              testes), pode continuar a preencher fichas de Inspecção Digital normalmente, incluindo fotografias.
            </li>
            <li>
              Cada registo recebe um identificador único (<code className="bg-[#F4F4F4] px-1 rounded">clientSyncId</code>)
              e é guardado na fila local segura do navegador (<strong>IndexedDB</strong>) com o estado{' '}
              <em>Pendente Sync</em>.
            </li>
            <li>
              Assim que a ligação regressar, o sistema sincroniza automaticamente para o servidor MongoDB sem criar
              registos duplicados.
            </li>
          </ol>
        </div>

        {/* RBAC Roles Table */}
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-100 flex items-center gap-2 font-display text-base font-semibold text-[#171717]">
            <ShieldCheck className="w-4 h-4 text-[#16A34A]" /> Perfis de Acesso e Permissões (RBAC)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4F4F4] text-[#777777] uppercase text-[11px]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Perfil</th>
                  <th className="px-5 py-3 font-semibold">Responsabilidades Autorizadas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {(Object.keys(ROLES) as RoleCode[]).map((code) => (
                  <tr key={code}>
                    <td className="px-5 py-3 font-semibold text-[#142B4A] whitespace-nowrap">
                      {ROLES[code].name}
                    </td>
                    <td className="px-5 py-3 text-[#555555]">{ROLES[code].description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

