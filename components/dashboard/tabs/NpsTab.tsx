'use client';

import { useCallback, useEffect, useState } from 'react';
import KpiCard from '@/components/dashboard/KpiCard';
import BarChart from '@/components/dashboard/BarChart';
import DonutChart from '@/components/dashboard/DonutChart';
import ResponsesTable from '@/components/dashboard/ResponsesTable';

// ── Shared helpers ────────────────────────────────────────────────────────────

export function TabLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#3B9EF5] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#A0A0B0] text-sm">Carregando…</p>
      </div>
    </div>
  );
}

export function TabError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <p className="text-red-400 text-sm">{message}</p>
      <button onClick={onRetry} className="btn-glow px-4 py-2 rounded-xl text-white text-sm">
        Tentar novamente
      </button>
    </div>
  );
}

const SCALE_LABELS = ['Muito insatisfeito', 'Insatisfeito', 'Regular', 'Satisfeito', 'Muito satisfeito', 'Excelente'];

function ScoreBar({ nota, count, max }: { nota: number; count: number; max: number }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  const color = nota >= 4 ? '#3B9EF5' : nota >= 2 ? '#8B5CF6' : '#E74C3C';
  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col items-center w-8 shrink-0">
        <span className="font-orbitron font-bold text-sm" style={{ color }}>{nota}</span>
        <span className="text-[9px] text-[#555570] text-center leading-tight">{SCALE_LABELS[nota]}</span>
      </div>
      <div className="flex-1 h-4 bg-[#12122A] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs text-[#A0A0B0] font-mono w-6 text-right">{count}</span>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
      <span className="text-4xl opacity-30">📭</span>
      <p className="text-[#A0A0B0] text-sm">Nenhuma resposta de <strong>{label}</strong> ainda.</p>
      <p className="text-[#555570] text-xs">Gere um link e envie para o médico após a próxima call.</p>
    </div>
  );
}

// ── Renovação sub-tab ─────────────────────────────────────────────────────────

interface RenovacaoData {
  kpis: { totalRespostas: number; taxaObjetivoAlcancado: number; taxaRenovacao: number; npsMediaGeral: number };
  toolAverages: { id: string; label: string; emoji: string; avg: number }[];
  objetivoDistribuicao: { Sim: number; Parcialmente: number; Nao: number };
  renovacaoDistribuicao: { Sim: number; Nao: number };
  recentResponses: {
    token: string; nome: string; clinica: string; timestamp: string;
    pretendeRenovar: string; npsMedia: number; statusToken: string; _full: Record<string, unknown>;
  }[];
  lastUpdated: string;
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 5) return 'agora mesmo';
  if (diff < 60) return `há ${diff}s`;
  if (diff < 3600) return `há ${Math.floor(diff / 60)}min`;
  return `há ${Math.floor(diff / 3600)}h`;
}

function RenovacaoSubTab() {
  const [data, setData] = useState<RenovacaoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard-data');
      if (!res.ok) throw new Error('Erro ao carregar dados.');
      setData(await res.json());
      setError('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 30_000);
    return () => clearInterval(id);
  }, [fetchData]);

  if (loading && !data) return <TabLoader />;
  if (error) return <TabError message={error} onRetry={fetchData} />;
  if (!data) return null;

  const objetivoChartData = [
    { name: 'Sim', value: data.objetivoDistribuicao.Sim, color: '#3B9EF5' },
    { name: 'Parcialmente', value: data.objetivoDistribuicao.Parcialmente, color: '#8B5CF6' },
    { name: 'Não', value: data.objetivoDistribuicao.Nao, color: '#374151' },
  ];
  const renovacaoChartData = [
    { name: 'Sim', value: data.renovacaoDistribuicao.Sim, color: '#3B9EF5' },
    { name: 'Não', value: data.renovacaoDistribuicao.Nao, color: '#E74C3C' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#A0A0B0]" suppressHydrationWarning>Atualizado {timeAgo(data.lastUpdated)}</p>
        <button onClick={fetchData} className="p-1.5 rounded-lg border border-[rgba(59,158,245,0.2)] text-[#A0A0B0] hover:text-white hover:border-[#3B9EF5] transition-all text-sm" title="Atualizar">↻</button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon="📋" title="Total de Respostas" value={data.kpis.totalRespostas} accent="blue" />
        <KpiCard icon="✅" title="Objetivo Alcançado" value={`${data.kpis.taxaObjetivoAlcancado}%`} subtitle="Sim + Parcialmente" accent="green" />
        <KpiCard icon="🔄" title="Taxa de Renovação" value={`${data.kpis.taxaRenovacao}%`} subtitle="Pretendem renovar" accent="gold" />
        <KpiCard icon="⭐" title="NPS Médio Geral" value={`${data.kpis.npsMediaGeral}/5`} subtitle="Média das ferramentas" accent="purple" />
      </div>
      <BarChart data={data.toolAverages} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DonutChart title="Objetivo Alcançado" data={objetivoChartData} />
        <DonutChart title="Intenção de Renovação" data={renovacaoChartData} />
      </div>
      <ResponsesTable data={data.recentResponses} />
    </div>
  );
}

// ── Pós-Call sub-tab ──────────────────────────────────────────────────────────

interface CallData {
  kpis: { total: number; mediaCall: number; mediaCS: number; taxaResolucao: number };
  resolucaoDistribuicao: { Sim: number; Parcialmente: number; Nao: number };
  porTipo: { tipo: string; total: number; mediaCall: number; mediaCS: number }[];
  distCall: { nota: number; count: number }[];
  recent: {
    timestamp: string; nome: string; clinica: string; tipoCall: string;
    respondente: string; notaCall: number; necessidadeResolvida: string; notaCS: number; observacoes: string;
  }[];
}

function CallSubTab() {
  const [data, setData] = useState<CallData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/nps-call-data');
      if (!res.ok) throw new Error('Erro ao carregar dados de Pós-Call.');
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
  if (data.kpis.total === 0) return <EmptyState label="Pós-Call" />;

  const resolucaoChart = [
    { name: 'Resolvida', value: data.resolucaoDistribuicao.Sim, color: '#3B9EF5' },
    { name: 'Parcialmente', value: data.resolucaoDistribuicao.Parcialmente, color: '#8B5CF6' },
    { name: 'Não resolvida', value: data.resolucaoDistribuicao.Nao, color: '#E74C3C' },
  ];

  const maxDist = Math.max(...data.distCall.map(d => d.count), 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon="📞" title="Total de Respostas" value={data.kpis.total} accent="blue" />
        <KpiCard icon="⭐" title="Nota Média da Call" value={`${data.kpis.mediaCall}/5`} accent="gold" />
        <KpiCard icon="🤝" title="Nota Média do CS" value={`${data.kpis.mediaCS}/5`} accent="purple" />
        <KpiCard icon="✅" title="Taxa de Resolução" value={`${data.kpis.taxaResolucao}%`} subtitle="Sim + Parcialmente" accent="green" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Score distribution */}
        <div className="card-gradient-border p-5">
          <h3 className="font-orbitron text-xs font-bold text-white uppercase tracking-wider mb-4">Distribuição — Nota da Call</h3>
          <div className="space-y-3">
            {[...data.distCall].reverse().map(d => (
              <ScoreBar key={d.nota} nota={d.nota} count={d.count} max={maxDist} />
            ))}
          </div>
        </div>

        <DonutChart title="Necessidade Resolvida" data={resolucaoChart} />
      </div>

      {/* By call type */}
      {data.porTipo.length > 0 && (
        <div className="card-gradient-border overflow-hidden">
          <div className="px-5 pt-5 pb-3">
            <h3 className="font-orbitron text-xs font-bold text-white uppercase tracking-wider">Por tipo de call</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(59,158,245,0.1)]">
                  <th className="text-left px-5 py-2 text-[#A0A0B0] text-xs uppercase tracking-wider">Tipo</th>
                  <th className="text-center px-4 py-2 text-[#A0A0B0] text-xs uppercase tracking-wider">Respostas</th>
                  <th className="text-center px-4 py-2 text-[#A0A0B0] text-xs uppercase tracking-wider">Média Call</th>
                  <th className="text-center px-4 py-2 text-[#A0A0B0] text-xs uppercase tracking-wider">Média CS</th>
                </tr>
              </thead>
              <tbody>
                {data.porTipo.map((t, i) => (
                  <tr key={i} className="border-b border-[rgba(59,158,245,0.05)] hover:bg-[rgba(59,158,245,0.03)]">
                    <td className="px-5 py-3 text-white font-medium">{t.tipo}</td>
                    <td className="px-4 py-3 text-center text-[#A0A0B0] font-mono">{t.total}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-orbitron font-bold text-[#8B5CF6]">{t.mediaCall}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-orbitron font-bold text-[#8B5CF6]">{t.mediaCS}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent responses */}
      <div className="card-gradient-border overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <h3 className="font-orbitron text-xs font-bold text-white uppercase tracking-wider">Respostas recentes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(59,158,245,0.1)]">
                <th className="text-left px-5 py-2 text-[#A0A0B0] text-xs uppercase tracking-wider">Médico</th>
                <th className="text-left px-4 py-2 text-[#A0A0B0] text-xs uppercase tracking-wider">Tipo</th>
                <th className="text-left px-4 py-2 text-[#A0A0B0] text-xs uppercase tracking-wider">Respondente</th>
                <th className="text-center px-4 py-2 text-[#A0A0B0] text-xs uppercase tracking-wider">Call</th>
                <th className="text-center px-4 py-2 text-[#A0A0B0] text-xs uppercase tracking-wider">CS</th>
                <th className="text-left px-4 py-2 text-[#A0A0B0] text-xs uppercase tracking-wider">Resolução</th>
              </tr>
            </thead>
            <tbody>
              {data.recent.map((r, i) => (
                <tr key={i} className="border-b border-[rgba(59,158,245,0.05)] hover:bg-[rgba(59,158,245,0.03)]">
                  <td className="px-5 py-3">
                    <p className="text-white font-medium">{r.nome}</p>
                    <p className="text-[#A0A0B0] text-xs">{r.clinica}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-[rgba(59,158,245,0.1)] text-[#93C5FD] border border-[rgba(59,158,245,0.2)]">{r.tipoCall || '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-[#A0A0B0] text-xs">{r.respondente}</td>
                  <td className="px-4 py-3 text-center font-orbitron font-bold text-[#8B5CF6]">{r.notaCall}</td>
                  <td className="px-4 py-3 text-center font-orbitron font-bold text-[#8B5CF6]">{r.notaCS}</td>
                  <td className="px-4 py-3 text-xs text-[#A0A0B0]">{r.necessidadeResolvida || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Pós-Treinamento sub-tab ───────────────────────────────────────────────────

interface TreinamentoData {
  kpis: { total: number; mediaTreinamento: number; mediaClareza: number; taxaSeguranca: number };
  segurancaDistribuicao: { Sim: number; Parcialmente: number; Nao: number };
  porFerramenta: { ferramenta: string; total: number; mediaTreinamento: number; mediaClareza: number; taxaSeguranca: number }[];
  distTreinamento: { nota: number; count: number }[];
  recent: {
    timestamp: string; nome: string; clinica: string; ferramenta: string;
    respondente: string; notaTreinamento: number; notaClareza: number; segurancaUso: string; observacoes: string;
  }[];
}

function TreinamentoSubTab() {
  const [data, setData] = useState<TreinamentoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/nps-treinamento-data');
      if (!res.ok) throw new Error('Erro ao carregar dados de Pós-Treinamento.');
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
  if (data.kpis.total === 0) return <EmptyState label="Pós-Treinamento" />;

  const segurancaChart = [
    { name: 'Seguro', value: data.segurancaDistribuicao.Sim, color: '#3B9EF5' },
    { name: 'Parcialmente', value: data.segurancaDistribuicao.Parcialmente, color: '#8B5CF6' },
    { name: 'Não seguro', value: data.segurancaDistribuicao.Nao, color: '#E74C3C' },
  ];

  const maxDist = Math.max(...data.distTreinamento.map(d => d.count), 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon="🎓" title="Total de Respostas" value={data.kpis.total} accent="blue" />
        <KpiCard icon="⭐" title="Nota Média Treinamento" value={`${data.kpis.mediaTreinamento}/5`} accent="gold" />
        <KpiCard icon="💡" title="Nota Média Clareza" value={`${data.kpis.mediaClareza}/5`} accent="purple" />
        <KpiCard icon="✅" title="Seguros para Usar" value={`${data.kpis.taxaSeguranca}%`} subtitle="Sim + Parcialmente" accent="green" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card-gradient-border p-5">
          <h3 className="font-orbitron text-xs font-bold text-white uppercase tracking-wider mb-4">Distribuição — Nota do Treinamento</h3>
          <div className="space-y-3">
            {[...data.distTreinamento].reverse().map(d => (
              <ScoreBar key={d.nota} nota={d.nota} count={d.count} max={maxDist} />
            ))}
          </div>
        </div>
        <DonutChart title="Segurança para Usar a Ferramenta" data={segurancaChart} />
      </div>

      {/* By ferramenta */}
      {data.porFerramenta.length > 0 && (
        <div className="card-gradient-border overflow-hidden">
          <div className="px-5 pt-5 pb-3">
            <h3 className="font-orbitron text-xs font-bold text-white uppercase tracking-wider">Por ferramenta</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(59,158,245,0.1)]">
                  <th className="text-left px-5 py-2 text-[#A0A0B0] text-xs uppercase tracking-wider">Ferramenta</th>
                  <th className="text-center px-4 py-2 text-[#A0A0B0] text-xs uppercase tracking-wider">Respostas</th>
                  <th className="text-center px-4 py-2 text-[#A0A0B0] text-xs uppercase tracking-wider">Nota Trein.</th>
                  <th className="text-center px-4 py-2 text-[#A0A0B0] text-xs uppercase tracking-wider">Clareza</th>
                  <th className="text-center px-4 py-2 text-[#A0A0B0] text-xs uppercase tracking-wider">% Seguros</th>
                </tr>
              </thead>
              <tbody>
                {data.porFerramenta.map((f, i) => (
                  <tr key={i} className="border-b border-[rgba(59,158,245,0.05)] hover:bg-[rgba(59,158,245,0.03)]">
                    <td className="px-5 py-3 text-white font-medium">{f.ferramenta}</td>
                    <td className="px-4 py-3 text-center text-[#A0A0B0] font-mono">{f.total}</td>
                    <td className="px-4 py-3 text-center font-orbitron font-bold text-[#8B5CF6]">{f.mediaTreinamento}</td>
                    <td className="px-4 py-3 text-center font-orbitron font-bold text-[#8B5CF6]">{f.mediaClareza}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-orbitron font-bold text-sm ${f.taxaSeguranca >= 70 ? 'text-[#3B9EF5]' : f.taxaSeguranca >= 40 ? 'text-[#8B5CF6]' : 'text-[#E74C3C]'}`}>
                        {f.taxaSeguranca}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent */}
      <div className="card-gradient-border overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <h3 className="font-orbitron text-xs font-bold text-white uppercase tracking-wider">Respostas recentes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(59,158,245,0.1)]">
                <th className="text-left px-5 py-2 text-[#A0A0B0] text-xs uppercase tracking-wider">Médico</th>
                <th className="text-left px-4 py-2 text-[#A0A0B0] text-xs uppercase tracking-wider">Ferramenta</th>
                <th className="text-left px-4 py-2 text-[#A0A0B0] text-xs uppercase tracking-wider">Respondente</th>
                <th className="text-center px-4 py-2 text-[#A0A0B0] text-xs uppercase tracking-wider">Trein.</th>
                <th className="text-center px-4 py-2 text-[#A0A0B0] text-xs uppercase tracking-wider">Clareza</th>
                <th className="text-left px-4 py-2 text-[#A0A0B0] text-xs uppercase tracking-wider">Segurança</th>
              </tr>
            </thead>
            <tbody>
              {data.recent.map((r, i) => (
                <tr key={i} className="border-b border-[rgba(59,158,245,0.05)] hover:bg-[rgba(59,158,245,0.03)]">
                  <td className="px-5 py-3">
                    <p className="text-white font-medium">{r.nome}</p>
                    <p className="text-[#A0A0B0] text-xs">{r.clinica}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-[rgba(139,92,246,0.1)] text-[#A78BFA] border border-[rgba(139,92,246,0.2)]">{r.ferramenta || '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-[#A0A0B0] text-xs">{r.respondente}</td>
                  <td className="px-4 py-3 text-center font-orbitron font-bold text-[#8B5CF6]">{r.notaTreinamento}</td>
                  <td className="px-4 py-3 text-center font-orbitron font-bold text-[#8B5CF6]">{r.notaClareza}</td>
                  <td className="px-4 py-3 text-xs text-[#A0A0B0]">{r.segurancaUso || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Main NpsTab ───────────────────────────────────────────────────────────────

const SUB_TABS = [
  { id: 'renovacao', label: 'Renovação', icon: '📋' },
  { id: 'call', label: 'Pós-Call', icon: '📞' },
  { id: 'treinamento', label: 'Pós-Treinamento', icon: '🎓' },
] as const;

type SubTabId = typeof SUB_TABS[number]['id'];

export default function NpsTab() {
  const [active, setActive] = useState<SubTabId>('renovacao');

  return (
    <div className="space-y-6">
      {/* Sub-navigation */}
      <div className="flex gap-1 bg-[#06060E] rounded-xl p-1 w-fit">
        {SUB_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            style={active === t.id ? { background: 'linear-gradient(135deg, #3B9EF5, #8B5CF6)' } : {}}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-sora transition-all whitespace-nowrap ${
              active === t.id
                ? 'text-white shadow-md'
                : 'text-[#5B6778] hover:text-[#A0A0B0]'
            }`}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {active === 'renovacao' && <RenovacaoSubTab />}
      {active === 'call' && <CallSubTab />}
      {active === 'treinamento' && <TreinamentoSubTab />}
    </div>
  );
}
