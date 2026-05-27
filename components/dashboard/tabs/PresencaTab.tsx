'use client';

import { useCallback, useEffect, useState } from 'react';
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
}

function TaxaBar({ taxa }: { taxa: number }) {
  const color = taxa >= 70 ? '#3B9EF5' : taxa >= 40 ? '#8B5CF6' : '#E74C3C';
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

  if (loading) return <TabLoader />;
  if (error) return <TabError message={error} onRetry={fetchData} />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="grid grid-cols-3 gap-4 flex-1">
          <KpiCard icon="chart" title="Taxa Geral de Presença" value={`${data.kpis.taxaGeral}%`} />
          <KpiCard icon="calendar" title="Total de Sessões" value={data.kpis.totalSessoes} />
          <KpiCard icon="users" title="Médicos Monitorados" value={data.kpis.totalMedicos} />
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="ml-4 btn-glow px-4 py-2 rounded-xl text-white font-sora font-semibold text-sm shrink-0"
        >
          + Registrar Presença
        </button>
      </div>

      {/* Sessões recentes */}
      <div className="card-gradient-border p-5 rounded-xl">
        <h3 className="text-sm font-semibold text-white mb-4">Últimas sessões</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {data.recentSessoes.map((s, i) => {
            const taxa = s.total > 0 ? Math.round((s.presentes / s.total) * 100) : 0;
            const color = taxa >= 70 ? '#3B9EF5' : taxa >= 40 ? '#8B5CF6' : '#F59E0B';
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
              {data.medicoStats.map((m, i) => (
                <tr key={i} className="border-b border-[rgba(59,158,245,0.05)] hover:bg-[rgba(59,158,245,0.03)] transition-colors">
                  <td className="px-4 py-3 text-[#A0A0B0] text-xs">{i + 1}</td>
                  <td className="px-4 py-3 text-white font-medium">{m.medico}</td>
                  <td className="px-4 py-3 text-center text-[#3B9EF5] font-mono">{m.presencas}</td>
                  <td className="px-4 py-3 text-center text-[#F59E0B] font-mono">{m.faltas}</td>
                  <td className="px-4 py-3 w-48"><TaxaBar taxa={m.taxa} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <RegistrarPresencaModal
          medicos={data.medicos}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); fetchData(); }}
        />
      )}
    </div>
  );
}
