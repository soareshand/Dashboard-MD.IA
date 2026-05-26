'use client';

import { useCallback, useEffect, useState } from 'react';
import { TabLoader, TabError } from './NpsTab';

interface ServicoRow {
  grupo: string;
  nome: string;
  infiniteCRM: string;
  secretariaLeads: string;
  secretariaPacientes: string;
  gerenteEtiquetas: string;
  funil: string;
  experiencia: string;
  confirmAgendamento: string;
  avisoTarefas: string;
  infiniteForms: string;
  infinitePrompts: string;
  motivos: string;
}

interface ToolRate {
  key: string;
  label: string;
  ativos: number;
  total: number;
  rate: number;
}

interface ServicosData {
  servicos: ServicoRow[];
  toolRates: ToolRate[];
}

const TOOL_COLS: { key: keyof ServicoRow; short: string }[] = [
  { key: 'infiniteCRM', short: 'CRM' },
  { key: 'secretariaLeads', short: 'Sec. Leads' },
  { key: 'secretariaPacientes', short: 'Sec. Pac.' },
  { key: 'gerenteEtiquetas', short: 'Gerente' },
  { key: 'funil', short: 'Funil' },
  { key: 'experiencia', short: 'Experiência' },
  { key: 'confirmAgendamento', short: 'Confirm.' },
  { key: 'avisoTarefas', short: 'Avisos' },
  { key: 'infiniteForms', short: 'Forms' },
  { key: 'infinitePrompts', short: 'Prompts' },
];

function isAtivo(val: string) {
  const v = val.toLowerCase();
  return v.includes('ativo') || v.includes('ligad') || v.includes('treinad') || v.includes('criada');
}

function ServiceCell({ value }: { value: string }) {
  if (!value) return <span className="text-[#3A3A5A] text-sm">—</span>;
  const active = isAtivo(value);
  return (
    <span
      title={value}
      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
        active
          ? 'bg-green-900/40 text-green-400 border border-green-700/30'
          : 'bg-red-900/30 text-red-400 border border-red-700/20'
      }`}
    >
      {active ? '✓' : '✕'}
    </span>
  );
}

export default function ServicosTab() {
  const [data, setData] = useState<ServicosData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/servicos-data');
      if (!res.ok) throw new Error('Erro ao carregar dados de serviços.');
      setData(await res.json());
      setError('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <TabLoader />;
  if (error) return <TabError message={error} onRetry={fetchData} />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Adoption rates */}
      <div className="card-gradient-border p-6 rounded-xl">
        <h3 className="text-sm font-semibold text-white mb-4">Taxa de adoção por ferramenta</h3>
        <div className="space-y-3">
          {data.toolRates.map(t => (
            <div key={t.key} className="flex items-center gap-3">
              <span className="text-xs text-[#A0A0B0] w-44 shrink-0">{t.label}</span>
              <div className="flex-1 h-2 bg-[#1A1A2E] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${t.rate}%`,
                    background: t.rate >= 70 ? '#4A90E2' : t.rate >= 40 ? '#C9A84C' : '#E74C3C',
                  }}
                />
              </div>
              <span className="text-xs font-mono text-white w-12 text-right">{t.ativos}/{t.total}</span>
              <span className="text-xs font-mono text-[#A0A0B0] w-10 text-right">{t.rate}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Per-doctor grid */}
      <div className="card-gradient-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="text-sm">
            <thead>
              <tr className="border-b border-[rgba(74,144,226,0.1)]">
                <th className="text-left px-4 py-3 text-[#A0A0B0] text-xs uppercase tracking-wider sticky left-0 bg-[#0D0D1A] z-10 min-w-44">Médico</th>
                {TOOL_COLS.map(c => (
                  <th key={c.key} className="px-3 py-3 text-[#A0A0B0] text-xs uppercase tracking-wider text-center whitespace-nowrap">{c.short}</th>
                ))}
                <th className="text-left px-4 py-3 text-[#A0A0B0] text-xs uppercase tracking-wider">Motivos / Obs</th>
              </tr>
            </thead>
            <tbody>
              {data.servicos.map((s, i) => (
                <tr key={i} className="border-b border-[rgba(74,144,226,0.05)] hover:bg-[rgba(74,144,226,0.03)] transition-colors">
                  <td className="px-4 py-3 text-white font-medium sticky left-0 bg-[#0D0D1A]">{s.nome}</td>
                  {TOOL_COLS.map(c => (
                    <td key={c.key} className="px-3 py-3 text-center">
                      <ServiceCell value={s[c.key]} />
                    </td>
                  ))}
                  <td className="px-4 py-3 text-[#A0A0B0] text-xs max-w-xs truncate" title={s.motivos}>{s.motivos || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
