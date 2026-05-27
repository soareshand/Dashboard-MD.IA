'use client';

import { useCallback, useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
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
      <p className="text-[#F59E0B] text-sm">{message}</p>
      <button onClick={onRetry} className="btn-glow px-4 py-2 rounded-xl text-white text-sm">
        Tentar novamente
      </button>
    </div>
  );
}

const SCALE_LABELS = ['Muito insatisfeito', 'Insatisfeito', 'Regular', 'Satisfeito', 'Muito satisfeito', 'Excelente'];
const NAO_COLOR = '#F59E0B';

function ScoreBar({ nota, count, max }: { nota: number; count: number; max: number }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  const color = nota >= 4 ? '#3B9EF5' : nota >= 2 ? '#8B5CF6' : NAO_COLOR;
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
    <div className="flex flex-col items-center justify-center h-48 gap-2 text-center">
      <p className="text-[#A0A0B0] text-sm">Nenhuma resposta de <strong>{label}</strong> ainda.</p>
      <p className="text-[#555570] text-xs">Gere um link e envie para o médico após a próxima call.</p>
    </div>
  );
}

function stripEmoji(s: string) {
  return s.replace(/^(?:✅|❌|⚠️|🔴|🟡|🟢)\s*/, '').trim();
}

// ── Renovação sub-tab ─────────────────────────────────────────────────────────

interface ResultadosPercebidos {
  crescimentoPacientes: { Sim: number; AindaNao: number; Nao: number };
  reducaoTempo: { Sim: number; AindaNao: number; Nao: number };
  investimentoRetorno: { Positivo: number; Neutro: number; Negativo: number };
}

interface RenovacaoData {
  kpis: { totalRespostas: number; taxaObjetivoAlcancado: number; taxaRenovacao: number; npsMediaGeral: number };
  toolAverages: { id: string; label: string; emoji: string; avg: number }[];
  objetivoDistribuicao: { Sim: number; Parcialmente: number; Nao: number };
  resultadosPercebidos: ResultadosPercebidos;
  recentResponses: {
    token: string; nome: string; clinica: string; timestamp: string;
    pretendeRenovar: string; npsMedia: number; statusToken: string; _full: Record<string, unknown>;
  }[];
  lastUpdated: string;
}

function NeonDonut({ dist }: { dist: RenovacaoData['objetivoDistribuicao'] }) {
  const segs = [
    { name: 'Sim', value: dist.Sim, color: '#3B9EF5' },
    { name: 'Parcialmente', value: dist.Parcialmente, color: '#8B5CF6' },
    { name: 'Não', value: dist.Nao, color: NAO_COLOR },
  ];
  const total = segs.reduce((s, d) => s + d.value, 0);
  return (
    <div className="card-gradient-border p-6">
      <h3 className="font-orbitron text-xs font-bold text-white mb-6 uppercase tracking-[0.15em]">Objetivo Alcançado</h3>
      {total === 0 ? (
        <div className="flex items-center justify-center h-40 text-[#A0A0B0] text-sm">Sem dados</div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={segs} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                {segs.map((entry, i) => <Cell key={i} fill={entry.color} stroke="none" />)}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 8, color: '#111827', fontSize: 12 }}
                formatter={(value: number, name: string) => [`${value} (${total > 0 ? Math.round((value as number) / total * 100) : 0}%)`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center mt-2">
            {segs.map(seg => (
              <div key={seg.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: seg.color, boxShadow: `0 0 8px ${seg.color}` }}/>
                <span className="text-[11px] text-[#555570] font-sora whitespace-nowrap">{seg.name}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ColumnChart({ data }: { data: ResultadosPercebidos }) {
  const rows = [
    {
      label: 'Crescimento de Pacientes',
      total: data.crescimentoPacientes.Sim + data.crescimentoPacientes.AindaNao + data.crescimentoPacientes.Nao,
      segments: [
        { label: 'Sim', value: data.crescimentoPacientes.Sim, color: '#3B9EF5' },
        { label: 'Ainda não percebi', value: data.crescimentoPacientes.AindaNao, color: '#8B5CF6' },
        { label: 'Não', value: data.crescimentoPacientes.Nao, color: NAO_COLOR },
      ],
    },
    {
      label: 'Redução de Tempo',
      total: data.reducaoTempo.Sim + data.reducaoTempo.AindaNao + data.reducaoTempo.Nao,
      segments: [
        { label: 'Sim', value: data.reducaoTempo.Sim, color: '#3B9EF5' },
        { label: 'Ainda não percebi', value: data.reducaoTempo.AindaNao, color: '#8B5CF6' },
        { label: 'Não', value: data.reducaoTempo.Nao, color: NAO_COLOR },
      ],
    },
    {
      label: 'Invest. × Retorno',
      total: data.investimentoRetorno.Positivo + data.investimentoRetorno.Neutro + data.investimentoRetorno.Negativo,
      segments: [
        { label: 'Positivo', value: data.investimentoRetorno.Positivo, color: '#3B9EF5' },
        { label: 'Neutro', value: data.investimentoRetorno.Neutro, color: '#8B5CF6' },
        { label: 'Negativo', value: data.investimentoRetorno.Negativo, color: NAO_COLOR },
      ],
    },
  ];

  return (
    <div className="card-gradient-border p-6">
      <h3 className="font-orbitron text-xs font-bold text-white mb-7 uppercase tracking-[0.15em]">Resultados Percebidos</h3>
      <div className="space-y-6">
        {rows.map(row => (
          <div key={row.label}>
            <p className="text-xs text-[#6B7A8D] font-sora mb-2">{row.label}</p>
            <div className="flex rounded-full overflow-hidden w-full" style={{ height: '22px', background: 'rgba(8,8,20,0.9)', border: '1px solid rgba(255,255,255,0.05)' }}>
              {row.total === 0
                ? <div className="flex-1" style={{ background: 'rgba(255,255,255,0.03)' }} />
                : row.segments.map(seg => {
                    const pct = (seg.value / row.total) * 100;
                    if (pct === 0) return null;
                    return (
                      <div
                        key={seg.label}
                        style={{ width: `${pct}%`, background: seg.color, boxShadow: `inset 0 0 12px ${seg.color}40, 0 0 8px ${seg.color}60`, transition: 'width 0.7s ease-out' }}
                        title={`${seg.label}: ${seg.value} (${pct.toFixed(0)}%)`}
                      />
                    );
                  })
              }
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
              {row.segments.map(seg => (
                <div key={seg.label} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: seg.color, boxShadow: `0 0 6px ${seg.color}` }} />
                  <span className="text-[11px] text-[#555570] font-sora whitespace-nowrap">{seg.label}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#A0A0B0]" suppressHydrationWarning>Atualizado {timeAgo(data.lastUpdated)}</p>
        <button onClick={fetchData} className="p-1.5 rounded-lg border border-[rgba(59,158,245,0.2)] text-[#A0A0B0] hover:text-white hover:border-[#3B9EF5] transition-all text-sm" title="Atualizar">↻</button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon="clipboard" title="Total de Respostas" value={data.kpis.totalRespostas} />
        <KpiCard icon="check" title="Objetivo Alcançado" value={`${data.kpis.taxaObjetivoAlcancado}%`} subtitle="Sim + Parcialmente" />
        <KpiCard icon="refresh" title="Taxa de Renovação" value={`${data.kpis.taxaRenovacao}%`} subtitle="Pretendem renovar" />
        <KpiCard icon="star" title="NPS Médio Geral" value={`${data.kpis.npsMediaGeral}/5`} subtitle="Média das ferramentas" />
      </div>
      <BarChart data={data.toolAverages} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NeonDonut dist={data.objetivoDistribuicao} />
        <ColumnChart data={data.resultadosPercebidos} />
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
    { name: 'Não resolvida', value: data.resolucaoDistribuicao.Nao, color: NAO_COLOR },
  ];

  const maxDist = Math.max(...data.distCall.map(d => d.count), 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon="phone" title="Total de Respostas" value={data.kpis.total} />
        <KpiCard icon="star" title="Nota Média da Call" value={`${data.kpis.mediaCall}/5`} />
        <KpiCard icon="users" title="Nota Média do CS" value={`${data.kpis.mediaCS}/5`} />
        <KpiCard icon="check" title="Taxa de Resolução" value={`${data.kpis.taxaResolucao}%`} subtitle="Sim + Parcialmente" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Score distribution */}
        <div className="card-gradient-border p-5">
          <h3 className="font-orbitron text-xs font-bold text-white uppercase tracking-[0.15em] mb-4">Distribuição — Nota da Call</h3>
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
                  <td className="px-4 py-3 text-xs text-[#A0A0B0]">{r.necessidadeResolvida ? stripEmoji(r.necessidadeResolvida) : '—'}</td>
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
    { name: 'Não seguro', value: data.segurancaDistribuicao.Nao, color: NAO_COLOR },
  ];

  const maxDist = Math.max(...data.distTreinamento.map(d => d.count), 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon="book" title="Total de Respostas" value={data.kpis.total} />
        <KpiCard icon="star" title="Nota Média Treinamento" value={`${data.kpis.mediaTreinamento}/5`} />
        <KpiCard icon="lightbulb" title="Nota Média Clareza" value={`${data.kpis.mediaClareza}/5`} />
        <KpiCard icon="check" title="Seguros para Usar" value={`${data.kpis.taxaSeguranca}%`} subtitle="Sim + Parcialmente" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card-gradient-border p-5">
          <h3 className="font-orbitron text-xs font-bold text-white uppercase tracking-[0.15em] mb-4">Distribuição — Nota do Treinamento</h3>
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
                      <span className={`font-orbitron font-bold text-sm ${f.taxaSeguranca >= 70 ? 'text-[#3B9EF5]' : f.taxaSeguranca >= 40 ? 'text-[#8B5CF6]' : 'text-[#F59E0B]'}`}>
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
                  <td className="px-4 py-3 text-xs text-[#A0A0B0]">{r.segurancaUso ? stripEmoji(r.segurancaUso) : '—'}</td>
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
  { id: 'renovacao', label: 'Renovação' },
  { id: 'call', label: 'Pós-Call' },
  { id: 'treinamento', label: 'Pós-Treinamento' },
] as const;

type SubTabId = typeof SUB_TABS[number]['id'];

function SubTabIcon({ id, active }: { id: SubTabId; active: boolean }) {
  const c = active ? '#ffffff' : '#5B6778';
  const s = { width: 17, height: 17, viewBox: '0 0 24 24' as const, fill: 'none' as const, stroke: c, strokeWidth: '1.8' as const, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (id === 'renovacao') return <svg {...s}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>;
  if (id === 'call') return <svg {...s}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.1 6.1l1-1a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7a2 2 0 0 1 1.72 2.02z"/></svg>;
  return <svg {...s}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
}

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
            style={active === t.id ? { background: '#3B9EF5' } : {}}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-sora transition-all whitespace-nowrap ${
              active === t.id
                ? 'text-white shadow-md'
                : 'text-[#5B6778] hover:text-[#A0A0B0]'
            }`}
          >
            <SubTabIcon id={t.id} active={active === t.id} />
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
