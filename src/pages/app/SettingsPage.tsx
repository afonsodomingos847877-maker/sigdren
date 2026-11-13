import React, { useRef, useState } from 'react';
import { Database, Download, History, Mail, RotateCcw, Server, ShieldCheck, Upload } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Badge } from '@/components/ui/Badge';

export const SettingsPage: React.FC = () => {
  const { auditLogs, exportFullBackup, importFullBackup, resetDemoData, can, dbConnected } = useApp();
  const [emailGateway, setEmailGateway] = useState('smtp.emsaam.gov.mz');
  const [smsProvider, setSmsProvider] = useState('Gateway SMS Moçambique (Pronto para API)');
  const [savedNotice, setSavedNotice] = useState(false);
  const [restoreMsg, setRestoreMsg] = useState<string | null>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const res = await importFullBackup(parsed);
      setRestoreMsg(
        res.ok ? 'Backup restaurado com sucesso.' : res.error || 'Erro ao restaurar backup.'
      );
    } catch {
      setRestoreMsg('Ficheiro JSON inválido.');
    } finally {
      if (restoreInputRef.current) restoreInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-[#171717]">
          Configurações, Auditoria e Segurança
        </h1>
        <p className="text-sm text-[#777777]">
          Arquitectura de dados, cópias de segurança, integrações futuras e registo de auditoria.
        </p>
      </div>

      {/* System Architecture Status */}
      <div className="grid md:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm text-[#171717] flex items-center gap-2">
              <Server className="w-4 h-4 text-[#2563EB]" /> Base de Dados &amp; Geoespacial
            </span>
            <Badge tone={dbConnected ? 'green' : isSupabaseConfigured ? 'green' : 'blue'}>
              {dbConnected
                ? 'MongoDB Atlas Ligado (sigdrendb)'
                : isSupabaseConfigured
                ? 'Supabase Cloud Activo'
                : 'Modo Local Persistente (IndexedDB)'}
            </Badge>
          </div>
          <p className="text-[#555555]">
            O esquema PostgreSQL + PostGIS (15 tabelas com índices espaciais GIST e políticas RLS) encontra-se
            definido em <code className="bg-[#F4F4F4] px-1.5 py-0.5 rounded">supabase/migrations/001_initial_schema.sql</code>.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              onClick={exportFullBackup}
              className="px-3.5 py-2 rounded-md bg-[#142B4A] text-white font-medium flex items-center gap-1.5 hover:bg-[#171717]"
            >
              <Download className="w-3.5 h-3.5" /> Exportar Backup (JSON)
            </button>
            {can('manage_settings') && (
              <>
                <input
                  ref={restoreInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleRestoreFile}
                  className="hidden"
                />
                <button
                  onClick={() => restoreInputRef.current?.click()}
                  className="px-3.5 py-2 rounded-md bg-white border border-neutral-200 text-[#171717] hover:bg-[#F4F4F4] flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5 text-[#2563EB]" /> Restaurar Backup
                </button>
              </>
            )}
            {can('manage_settings') && (
              <button
                onClick={async () => {
                  if (window.confirm('Repor todos os dados para o estado inicial de demonstração?')) {
                    await resetDemoData();
                  }
                }}
                className="px-3.5 py-2 rounded-md border border-neutral-200 text-[#DC2626] hover:bg-red-50 flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Repor Dados Demo
              </button>
            )}
          </div>
          {restoreMsg && <div className="text-[11px] text-[#2563EB] pt-1">{restoreMsg}</div>}
        </div>

        {/* Email / SMS Readiness */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-3 text-xs">
          <div className="font-semibold text-sm text-[#171717] flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#2563EB]" /> Integração Futura: Correio Electrónico &amp; SMS
          </div>
          {savedNotice && (
            <div className="p-2 rounded bg-emerald-50 text-[#16A34A]">
              Parâmetros de integração guardados.
            </div>
          )}
          <div className="space-y-2">
            <div>
              <label className="block text-[#777777] mb-1">Servidor SMTP Institucional</label>
              <input
                value={emailGateway}
                onChange={(e) => setEmailGateway(e.target.value)}
                className="w-full px-3 py-1.5 rounded-md border border-neutral-200"
              />
            </div>
            <div>
              <label className="block text-[#777777] mb-1">Provedor SMS para Alertas Críticos</label>
              <input
                value={smsProvider}
                onChange={(e) => setSmsProvider(e.target.value)}
                className="w-full px-3 py-1.5 rounded-md border border-neutral-200"
              />
            </div>
            <button
              onClick={() => setSavedNotice(true)}
              className="px-4 py-1.5 rounded-md bg-[#2563EB] text-white font-medium"
            >
              Guardar Parâmetros
            </button>
          </div>
        </div>
      </div>

      {/* Institutional Data Ownership */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4 flex items-center gap-3 text-xs">
        <ShieldCheck className="w-5 h-5 text-[#16A34A] shrink-0" />
        <div>
          <strong>Soberania e Propriedade dos Dados:</strong> Todos os registos geográficos, fotografias e históricos
          operacionais pertencem exclusivamente à Empresa Municipal de Saneamento e Abastecimento de Água da Matola (EMSAAM).
        </div>
      </div>

      {/* Audit Logs */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-neutral-100 flex items-center justify-between">
          <span className="text-xs font-semibold text-[#171717] flex items-center gap-2">
            <History className="w-4 h-4 text-[#142B4A]" /> Histórico de Auditoria ({auditLogs.length})
          </span>
          <span className="text-[11px] text-[#777777] flex items-center gap-1">
            <Database className="w-3 h-3" /> Rastreabilidade completa
          </span>
        </div>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4F4F4] text-[#777777] uppercase text-[11px] sticky top-0">
              <tr>
                <th className="px-4 py-2.5">Data / Hora</th>
                <th className="px-4 py-2.5">Utilizador</th>
                <th className="px-4 py-2.5">Acção</th>
                <th className="px-4 py-2.5">Módulo</th>
                <th className="px-4 py-2.5">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-2.5 whitespace-nowrap text-[#777777]">
                    {new Date(log.createdAt).toLocaleString('pt-PT')}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <span className="font-medium text-[#171717]">{log.userName}</span>{' '}
                    <span className="text-[#777777]">({log.userRole})</span>
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <Badge
                      tone={
                        log.action === 'DELETE'
                          ? 'red'
                          : log.action === 'CREATE'
                          ? 'green'
                          : log.action === 'SYNC'
                          ? 'blue'
                          : 'neutral'
                      }
                    >
                      {log.action}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap font-medium">{log.entity}</td>
                  <td className="px-4 py-2.5 text-[#555555]">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

