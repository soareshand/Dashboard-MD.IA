'use client';

import { useCallback, useEffect, useState } from 'react';
import { TabLoader, TabError } from './NpsTab';
import KpiCard from '@/components/dashboard/KpiCard';

interface ResgateRow {
  situacao: string;
  dataEntrada: string;
  grupo: string;
  nome: string;
  sequencia: string;
  respondeu: string;
  marcouCall: string;
  obs: string;
}

interface ResgateData {
  kpis: { total: number; responderam: number; marcouCall: number; naoResponderam: number };
  resgate: ResgateRow[];
}

function SimNaoBadge({ value, simColor = 'green' }: { value: string; simColor?: 'green' | 'blue' }) {
  const isSim = value.toUpperCase().startsWith('S');
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
      isSim
        ? simColor === 'green'
          ? 'bg-green-900/40 text-green-400 border border-green-700/30'
          : 'bg-blue-900/40 text-blue-400 border border-blue-700/30'
        : value
          ? 'bg-red-900/30 text-red-400 border border-red-700/20'
          : 'bg-[#1A1A2E] text-[#A0A0B0] border border-[rgba(74,144,226,0.15)]'
    }`}>
      {value || '—'}
    </span>
  );
}

export default function ResgateTab() {
  const [data, setData] = useState<ResgateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/resgate-data');
      if (!res.ok) throw new Error('Erro ao carregar dados de resgate.');
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon="🚨" title="Em Resgate" value={data.kpis.total} accent="purple" />
        <KpiCard icon="💬" title="Responderam" value={data.kpis.responderam} subtitle={`${data.kpis.naoResponderam} não responderam`} accent="blue" />
        <KpiCard icon="📞" title="Call Marcada" value={data.kpis.marcouCall} accent="green" />
        <KpiCard
          icon="📊"
          title="Taxa de Resposta"
          value={`${data.kpis.total > 0 ? Math.round(data.kpis.responderam / data.kpis.total * 100) : 0}%`}
          accent="gold"
        />
      </div>

      <div className="card-gradient-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(74,144,226,0.1)]">
                <th className="text-left px-4 py-3 text-[#A0A0B0] text-xs uppercase tracking-wider">Médico</th>
                <th className="text-left px-4 py-3 text-[#A0A0B0] text-xs uppercase tracking-wider">Grupo</th>
                <th className="text-left px-4 py-3 text-[#A0A0B0] text-xs uppercase tracking-wider">Entrada</th>
                <th className="text-left px-4 py-3 text-[#A0A0B0] text-xs uppercase tracking-wider">Sequência</th>
                <th className="text-center px-4 py-3 text-[#A0A0B0] text-xs uppercase tracking-wider">Respondeu?</th>
                <th className="text-center px-4 py-3 text-[#A0A0B0] text-xs uppercase tracking-wider">Call?</th>
                <th className="text-left px-4 py-3 text-[#A0A0B0] text-xs uppercase tracking-wider">Obs</th>
              </tr>
            </thead>
            <tbody>
              {data.resgate.map((r, i) => (
                <tr key={i} className="border-b border-[rgba(74,144,226,0.05)] hover:bg-[rgba(74,144,226,0.03)] transition-colors">
                  <td className="px-4 py-3 text-white font-medium">{r.nome}</td>
                  <td className="px-4 py-3 text-[#A0A0B0] text-xs">{r.grupo || '—'}</td>
                  <td className="px-4 py-3 text-[#A0A0B0] text-xs font-mono">{r.dataEntrada || '—'}</td>
                  <td className="px-4 py-3 text-[#A0A0B0] text-xs">{r.sequencia || '—'}</td>
                  <td className="px-4 py-3 text-center"><SimNaoBadge value={r.respondeu} simColor="green" /></td>
                  <td className="px-4 py-3 text-center"><SimNaoBadge value={r.marcouCall} simColor="blue" /></td>
                  <td className="px-4 py-3 text-[#A0A0B0] text-xs max-w-xs truncate" title={r.obs}>{r.obs || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
