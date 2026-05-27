'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { TabLoader, TabError } from './NpsTab';
import KpiCard from '@/components/dashboard/KpiCard';
import RegistrarPresencaModal from '@/components/dashboard/RegistrarPresencaModal';

interface MedicoStat {
  medico: string;
  presencas: number;
  faltas: number;
  taxa: number;
}

interface SessaoStat {
  sessao: string;
  presentes: number;
  faltaram: number;
  total: number;
}

interface PresencaData {
  kpis: { taxaGeral: number; totalSessoes: number; totalMedicos: number };
  medicoStats: MedicoStat[];
  recentSessoes: SessaoStat[];
  medicos: string[];
  sessoes: string[];
  grid: Record<string, Record<string, string>>;
}

const MESES_PT = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function formatMesAno(mmyyyy: string): string {
  const [mm, yyyy] = mmyyyy.split('/');
  const idx = parseInt(mm, 10) - 1;
  return `${MESES_PT[idx] ?? mm} ${yyyy}`;
}

function TaxaBar({ taxa }: { taxa: number }) {
  const color = taxa >= 50 ? '#3B9EF5' : '#F59E0B';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[#1A1A2E] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${taxa}%`, background: color }} />
      </div>
      <span className="text-xs font-mono w-9 text-right" style={{ color }}>{taxa}%</span>
    </div>
  );
}

export default function PresencaTab() {
  const [data, setData] = useState<PresencaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deletingSessao, setDeletingSessao] = useState<string | null>(null);
  const [deletingInProgress, setDeletingInProgress] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [filtroMes, setFiltroMes] = useState<string>('');

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/presenca-data');
      if (!res.ok) throw new Error('Erro ao carregar dados de presença.');
      setData(await res.json());
      setError('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleClearAll() {
    setClearing(true);
    try {
      const res = await fetch('/api/presenca-clear', { method: 'POST' });
      if (!res.ok) throw new Error('Erro ao limpar dados.');
      setConfirmClear(false);
      fetchData();
    } catch {
      setConfirmClear(false);
    } finally {
      setClearing(false);
    }
  }

  async function handleDeleteSessao(sessao: string) {
    setDeletingInProgress(true);
    try {
      const res = await fetch(`/api/presenca-sessao?sessao=${encodeURIComponent(sessao)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao excluir sessão.');
      setDeletingSessao(null);
      fetchData();
    } catch {
      setDeletingSessao(null);
    } finally {
      setDeletingInProgress(false);
    }
  }

  // Derive available months from session dates (dd/mm/yyyy → mm/yyyy)
  const mesesDisponiveis = useMemo(() => {
    if (!data) return [];
    const seen = new Set<string>();
    for (const s of data.sessoes) {
      const parts = s.split('/');
      if (parts.length === 3) seen.add(`${parts[1]}/${parts[2]}`);
    }
    return Array.from(seen).sort((a, b) => {
      const [ma, ya] = a.split('/');
      const [mb, yb] = b.split('/');
      return Number(yb) * 12 + Number(mb) - (Number(ya) * 12 + Number(ma));
    });
  }, [data]);

  // Sessions filtered by selected month
  const sessoesFiltradas = useMemo(() => {
    if (!data) return [];
    if (!filtroMes) return data.sessoes;
    return data.sessoes.filter(s => {
      const parts = s.split('/');
      return parts.length === 3 && `${parts[1]}/${parts[2]}` === filtroMes;
    });
  }, [data, filtroMes]);

  // Filtered doctor stats computed client-side
  const medicoStatsFiltrados = useMemo((): MedicoStat[] => {
    if (!data) return [];
    const total = sessoesFiltradas.length;
    return data.medicos.map(medico => {
      const presencas = sessoesFiltradas.filter(s => data.grid[medico]?.[s] === 'Presente').length;
      const faltas = sessoesFiltradas.filter(s => data.grid[medico]?.[s] === 'Faltou').length;
      const taxa = total > 0 ? Math.round((presencas / total) * 100) : 0;
      return { medico, presencas, faltas, taxa };
    }).sort((a, b) => b.taxa - a.taxa);
  }, [data, sessoesFiltradas]);

  // Default presencas for new registration: last session's attendance
  const lastSessaoPresencas = useMemo((): Record<string, 'Presente' | 'Faltou'> => {
    if (!data || data.sessoes.length === 0) return {};
    const lastSessao = data.sessoes[data.sessoes.length - 1];
    const result: Record<string, 'Presente' | 'Faltou'> = {};
    for (const medico of data.medicos) {
      const status = data.grid[medico]?.[lastSessao];
      result[medico] = status === 'Presente' ? 'Presente' : 'Faltou';
    }
    return result;
  }, [data]);

  // Filtered recent sessions (up to 6)
  const recentSessoesFiltradas = useMemo((): SessaoStat[] => {
    if (!data) return [];
    return sessoesFiltradas.slice(-6).reverse().map(sessao => {
      const presentes = data.medicos.filter(m => data.grid[m]?.[sessao] === 'Presente').length;
      const faltaram = data.medicos.filter(m => data.grid[m]?.[sessao] === 'Faltou').length;
      return { sessao, presentes, faltaram, total: presentes + faltaram };
    });
  }, [data, sessoesFiltradas]);

  // Filtered KPIs
  const kpisFiltrados = useMemo(() => {
    if (!data) return { taxaGeral: 0, totalSessoes: 0, totalMedicos: 0 };
    const taxaGeral = medicoStatsFiltrados.length > 0
      ? Math.round(medicoStatsFiltrados.reduce((s, m) => s + m.taxa, 0) / medicoStatsFiltrados.length)
      : 0;
    return { taxaGeral, totalSessoes: sessoesFiltradas.length, totalMedicos: data.kpis.totalMedicos };
  }, [medicoStatsFiltrados, sessoesFiltradas, data]);

  if (loading) return <TabLoader />;
  if (error) return <TabError message={error} onRetry={fetchData} />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="grid grid-cols-3 gap-4 flex-1">
          <KpiCard icon="chart" title="Taxa Geral de Presença" value={`${kpisFiltrados.taxaGeral}%`} />
          <KpiCard icon="calendar" title="Total de Sessões" value={kpisFiltrados.totalSessoes} />
          <KpiCard icon="users" title="Médicos Monitorados" value={kpisFiltrados.totalMedicos} />
        </div>
        <div className="ml-4 flex items-center gap-2 shrink-0">
          {confirmClear && (
            <button onClick={() => setConfirmClear(false)} className="text-[#555570] hover:text-[#A0A0B0] text-xs transition-colors px-2">
              Cancelar
            </button>
          )}
          <button
            onClick={confirmClear ? handleClearAll : () => setConfirmClear(true)}
            disabled={clearing}
            className={`px-4 py-2 rounded-xl text-sm font-sora font-semibold transition-all disabled:opacity-60 ${
              confirmClear
                ? 'bg-[#F59E0B] text-[#08080F]'
                : 'border border-[rgba(245,158,11,0.4)] text-[#F59E0B] hover:bg-[rgba(245,158,11,0.1)]'
            }`}
          >
            {clearing ? 'Limpando…' : confirmClear ? 'Confirmar limpeza' : 'Limpar dados'}
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="btn-glow px-4 py-2 rounded-xl text-white font-sora font-semibold text-sm"
          >
            + Registrar Presença
          </button>
        </div>
      </div>

      {/* Month/year filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-[#A0A0B0] uppercase tracking-wider">Filtrar por mês:</span>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFiltroMes('')}
            className={`px-3 py-1 rounded-lg text-xs font-sora transition-all ${
              filtroMes === '' ? 'bg-[#4A90E2] text-white' : 'text-[#A0A0B0] hover:text-white border border-[rgba(74,144,226,0.2)] hover:border-[rgba(74,144,226,0.5)]'
            }`}
          >
            Todos
          </button>
          {mesesDisponiveis.map(mes => (
            <button
              key={mes}
              onClick={() => setFiltroMes(mes)}
              className={`px-3 py-1 rounded-lg text-xs font-sora transition-all ${
                filtroMes === mes ? 'bg-[#4A90E2] text-white' : 'text-[#A0A0B0] hover:text-white border border-[rgba(74,144,226,0.2)] hover:border-[rgba(74,144,226,0.5)]'
              }`}
            >
              {formatMesAno(mes)}
            </button>
          ))}
          {mesesDisponiveis.length === 0 && (
            <span className="text-xs text-[#555570] italic">nenhuma sessão registrada ainda</span>
          )}
        </div>
      </div>

      {/* Sessões */}
      {recentSessoesFiltradas.length > 0 && (
        <div className="card-gradient-border p-5 rounded-xl">
          <h3 className="text-sm font-semibold text-white mb-4">
            {filtroMes ? `Sessões — ${formatMesAno(filtroMes)}` : 'Últimas sessões'}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {recentSessoesFiltradas.map((s, i) => {
              const taxa = s.total > 0 ? Math.round((s.presentes / s.total) * 100) : 0;
              const color = taxa >= 50 ? '#3B9EF5' : '#F59E0B';
              const isConfirming = deletingSessao === s.sessao;
              return (
                <div key={i} className="relative bg-[#12122A] rounded-xl p-3 text-center border border-[rgba(59,158,245,0.1)] group">
                  <button
                    onClick={() => isConfirming ? handleDeleteSessao(s.sessao) : setDeletingSessao(s.sessao)}
                    disabled={deletingInProgress}
                    title={isConfirming ? 'Confirmar exclusão' : 'Excluir sessão'}
                    className={`absolute top-1.5 right-1.5 text-xs leading-none w-5 h-5 rounded flex items-center justify-center transition-all ${
                      isConfirming
                        ? 'bg-[#F59E0B] text-[#08080F]'
                        : 'opacity-0 group-hover:opacity-100 text-[#555570] hover:text-[#F59E0B] hover:bg-[rgba(245,158,11,0.1)]'
                    }`}
                  >
                    {isConfirming ? '✓' : '×'}
                  </button>
                  {isConfirming && (
                    <button
                      onClick={() => setDeletingSessao(null)}
                      className="absolute top-1.5 left-1.5 text-xs leading-none w-5 h-5 rounded flex items-center justify-center text-[#555570] hover:text-[#A0A0B0] transition-all"
                    >
                      ✕
                    </button>
                  )}
                  <p className={`text-xs font-mono mb-1 ${isConfirming ? 'text-[#F59E0B]' : 'text-[#A0A0B0]'}`}>{s.sessao}</p>
                  <p className="text-xl font-bold font-orbitron" style={{ color }}>{taxa}%</p>
                  <p className="text-[#A0A0B0] text-xs mt-1">{s.presentes}/{s.total}</p>
                  {isConfirming && <p className="text-[#F59E0B] text-[10px] mt-1">Excluir?</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Doctor stats table */}
      <div className="card-gradient-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(59,158,245,0.1)]">
                <th className="text-left px-4 py-3 text-[#A0A0B0] text-xs uppercase tracking-wider">#</th>
                <th className="text-left px-4 py-3 text-[#A0A0B0] text-xs uppercase tracking-wider">Médico</th>
                <th className="text-center px-4 py-3 text-[#A0A0B0] text-xs uppercase tracking-wider">Presenças</th>
                <th className="text-center px-4 py-3 text-[#A0A0B0] text-xs uppercase tracking-wider">Faltas</th>
                <th className="text-left px-4 py-3 text-[#A0A0B0] text-xs uppercase tracking-wider w-48">Taxa de Presença</th>
              </tr>
            </thead>
            <tbody>
              {medicoStatsFiltrados.map((m, i) => (
                <tr key={m.medico} className="border-b border-[rgba(59,158,245,0.05)] hover:bg-[rgba(59,158,245,0.03)] transition-colors">
                  <td className="px-4 py-3 text-[#A0A0B0] text-xs">{i + 1}</td>
                  <td className="px-4 py-3 text-white font-medium">{m.medico}</td>
                  <td className="px-4 py-3 text-center text-[#3B9EF5] font-mono">{m.presencas}</td>
                  <td className="px-4 py-3 text-center text-[#F59E0B] font-mono">{m.faltas}</td>
                  <td className="px-4 py-3 w-48"><TaxaBar taxa={m.taxa} /></td>
                </tr>
              ))}
              {medicoStatsFiltrados.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-[#A0A0B0] text-sm">Nenhuma sessão registrada{filtroMes ? ` em ${formatMesAno(filtroMes)}` : ''}.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <RegistrarPresencaModal
          medicos={data.medicos}
          initialPresencas={lastSessaoPresencas}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); fetchData(); }}
        />
      )}
    </div>
  );
}
