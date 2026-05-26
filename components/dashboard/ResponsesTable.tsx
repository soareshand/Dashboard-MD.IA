'use client';

import { useState } from 'react';
import ResponseModal from './ResponseModal';

interface ResponseRow {
  token: string;
  nome: string;
  clinica: string;
  timestamp: string;
  pretendeRenovar: string;
  npsMedia: number;
  statusToken: string;
  _full: Record<string, unknown>;
}

interface ResponsesTableProps {
  data: ResponseRow[];
}

const PAGE_SIZE = 10;

function formatDate(iso: string) {
  if (!iso) return '-';
  try {
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function RenovaBadge({ value }: { value: string }) {
  if (value === 'Sim' || value === '✅ Sim') return <span className="px-2 py-0.5 rounded-full bg-[#1B4332] text-green-400 text-xs font-medium">Sim</span>;
  if (value === 'Não' || value === '❌ Não') return <span className="px-2 py-0.5 rounded-full bg-[#4a1212] text-red-400 text-xs font-medium">Não</span>;
  return <span className="px-2 py-0.5 rounded-full bg-[#2a2a1a] text-yellow-400 text-xs font-medium">{value || '-'}</span>;
}

export default function ResponsesTable({ data }: ResponsesTableProps) {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ResponseRow | null>(null);

  const totalPages = Math.ceil(data.length / PAGE_SIZE);
  const pageData = data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <div className="card-gradient-border overflow-hidden">
        <div className="p-4 border-b border-[rgba(74,144,226,0.15)]">
          <h3 className="font-orbitron text-sm font-bold text-white uppercase tracking-wider">
            Respostas Recentes
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(74,144,226,0.1)]">
                {['Nome', 'Clínica', 'Data', 'Renova?', 'NPS Médio', 'Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs text-[#A0A0B0] font-medium uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[#A0A0B0] text-sm">
                    Nenhuma resposta registrada ainda.
                  </td>
                </tr>
              ) : pageData.map(row => (
                <tr
                  key={row.token}
                  onClick={() => setSelected(row)}
                  className="border-b border-[rgba(74,144,226,0.07)] hover:bg-[rgba(74,144,226,0.05)] cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-white font-medium whitespace-nowrap">{row.nome || '-'}</td>
                  <td className="px-4 py-3 text-[#A0A0B0] whitespace-nowrap">{row.clinica || '-'}</td>
                  <td className="px-4 py-3 text-[#A0A0B0] whitespace-nowrap font-mono text-xs">{formatDate(row.timestamp)}</td>
                  <td className="px-4 py-3"><RenovaBadge value={row.pretendeRenovar} /></td>
                  <td className="px-4 py-3 font-mono text-[#6EC6FF] font-bold">{row.npsMedia}/5</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      row.statusToken === 'respondido'
                        ? 'bg-[#1B4332] text-green-400'
                        : 'bg-[#2a2a1a] text-yellow-400'
                    }`}>
                      {row.statusToken}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[rgba(74,144,226,0.1)]">
            <span className="text-xs text-[#A0A0B0]">
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, data.length)} de {data.length}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded-lg border border-[rgba(74,144,226,0.2)] text-[#A0A0B0] text-xs hover:text-white hover:border-[#4A90E2] disabled:opacity-30 transition-all"
              >
                ← Anterior
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 rounded-lg border border-[rgba(74,144,226,0.2)] text-[#A0A0B0] text-xs hover:text-white hover:border-[#4A90E2] disabled:opacity-30 transition-all"
              >
                Próxima →
              </button>
            </div>
          </div>
        )}
      </div>

      {selected && <ResponseModal row={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
