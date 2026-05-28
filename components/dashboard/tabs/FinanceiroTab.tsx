'use client';

import { useCallback, useEffect, useState } from 'react';
import { TabLoader, TabError } from './NpsTab';
import KpiCard from '@/components/dashboard/KpiCard';

interface Contrato {
  id: string;
  medico: string;
  status_contrato: string;
  valor: number;
  status_financeiro: string;
  nota_fiscal: string | null;
  observacoes: string | null;
  created_at: string;
}

interface Renovacao {
  id: string;
  data: string | null;
  medico: string;
  status_contrato: string;
  valor: number;
  status_financeiro: string;
}

interface FinanceiroData {
  kpis: {
    totalContratos: number;
    contratosPagos: number;
    contratosEmAberto: number;
    mrr: number;
    renovacoesDoMes: number;
  };
  contratos: Contrato[];
  renovacoes: Renovacao[];
}

const BLANK_CONTRATO = {
  medico: '',
  statusContrato: 'Enviado',
  valor: '',
  statusFinanceiro: 'Em Aberto',
  notaFiscal: '',
  observacoes: '',
};

const BLANK_RENOVACAO = {
  data: '',
  medico: '',
  statusContrato: 'Enviado',
  valor: '',
  statusFinanceiro: 'Em Aberto',
};

type ContratoForm = typeof BLANK_CONTRATO;
type RenovacaoForm = typeof BLANK_RENOVACAO;

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function toDisplay(iso: string | null | undefined): string {
  if (!iso) return '—';
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function FinStatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase() ?? '';
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
      s === 'pago'
        ? 'bg-[rgba(59,158,245,0.1)] text-[#3B9EF5] border border-[rgba(59,158,245,0.2)]'
        : s === 'pago parcial'
        ? 'bg-[rgba(139,92,246,0.1)] text-[#8B5CF6] border border-[rgba(139,92,246,0.25)]'
        : s === 'permuta'
        ? 'bg-[rgba(139,92,246,0.1)] text-[#8B5CF6] border border-[rgba(139,92,246,0.25)]'
        : s === 'em aberto'
        ? 'bg-[rgba(245,158,11,0.1)] text-[#F59E0B] border border-[rgba(245,158,11,0.2)]'
        : 'bg-[#1A1A2E] text-[#A0A0B0] border border-[rgba(74,144,226,0.15)]'
    }`}>
      {status || '—'}
    </span>
  );
}

function ContratoBadge({ status }: { status: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs ${
      status?.toLowerCase() === 'assinado'
        ? 'bg-blue-900/40 text-blue-300 border border-blue-700/30'
        : 'bg-[#1A1A2E] text-[#A0A0B0] border border-[rgba(74,144,226,0.15)]'
    }`}>
      {status || '—'}
    </span>
  );
}

function ContratoModal({
  initial,
  membrosAtivos,
  onSave,
  onClose,
}: {
  initial: (ContratoForm & { id?: string }) | null;
  membrosAtivos: { nome: string; clinica: string | null }[];
  onSave: () => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<ContratoForm>(initial ?? BLANK_CONTRATO);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isEdit = !!initial?.id;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  function set(field: keyof ContratoForm, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!form.medico.trim()) { setError('Médico é obrigatório.'); return; }
    setSaving(true);
    setError('');
    try {
      const url = isEdit ? `/api/contratos/${initial!.id}` : '/api/contratos';
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erro ao salvar.');
      onSave();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/contratos/${initial!.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erro ao excluir.');
      onSave();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido.');
      setConfirmDelete(false);
    } finally {
      setSaving(false);
    }
  }

  const inp = 'w-full bg-[#12122A] border border-[rgba(74,144,226,0.25)] rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#4A90E2] transition-all';
  const lbl = 'text-xs text-[#A0A0B0] mb-1 block';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="card-gradient-border w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-orbitron text-base font-bold text-white">
            {isEdit ? 'Editar Contrato' : 'Novo Contrato'}
          </h3>
          <button onClick={onClose} className="text-[#A0A0B0] hover:text-white text-xl transition-colors">✕</button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={lbl}>Médico *</label>
            <select value={form.medico} onChange={e => set('medico', e.target.value)} className={inp + ' cursor-pointer'}>
              <option value="">Selecione o médico…</option>
              {membrosAtivos.map(m => (
                <option key={m.nome} value={m.nome}>
                  {m.clinica ? `${m.clinica} — ${m.nome}` : m.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={lbl}>Status do Contrato</label>
            <select value={form.statusContrato} onChange={e => set('statusContrato', e.target.value)} className={inp + ' cursor-pointer'}>
              <option value="Enviado">Enviado</option>
              <option value="Assinado">Assinado</option>
              <option value="Não precisa">Não precisa</option>
            </select>
          </div>
          <div>
            <label className={lbl}>Status Financeiro</label>
            <select value={form.statusFinanceiro} onChange={e => set('statusFinanceiro', e.target.value)} className={inp + ' cursor-pointer'}>
              <option value="Em Aberto">Em Aberto</option>
              <option value="Pago Parcial">Pago Parcial</option>
              <option value="Pago">Pago</option>
              <option value="Permuta">Permuta</option>
            </select>
          </div>
          <div>
            <label className={lbl}>Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.valor}
              onChange={e => set('valor', e.target.value)}
              placeholder="0,00"
              className={inp}
            />
          </div>
          <div>
            <label className={lbl}>Nota Fiscal</label>
            <input value={form.notaFiscal} onChange={e => set('notaFiscal', e.target.value)} placeholder="Nº da NF" className={inp} />
          </div>
          <div className="sm:col-span-2">
            <label className={lbl}>Observações</label>
            <textarea
              value={form.observacoes}
              onChange={e => set('observacoes', e.target.value)}
              placeholder="..."
              rows={2}
              className={inp + ' resize-none'}
            />
          </div>
        </div>

        {error && <p className="text-[#F59E0B] text-xs mt-4">{error}</p>}

        <div className="flex gap-3 mt-6">
          {isEdit && (
            <button
              onClick={confirmDelete ? handleDelete : () => setConfirmDelete(true)}
              disabled={saving}
              className={`py-2.5 px-4 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 ${
                confirmDelete
                  ? 'bg-[#F59E0B] text-[#08080F]'
                  : 'border border-[rgba(245,158,11,0.4)] text-[#F59E0B] hover:bg-[rgba(245,158,11,0.1)]'
              }`}
            >
              {confirmDelete ? 'Confirmar exclusão' : 'Excluir'}
            </button>
          )}
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[rgba(74,144,226,0.3)] text-[#A0A0B0] hover:text-white transition-all text-sm">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl btn-glow text-white font-semibold text-sm disabled:opacity-60">
            {saving ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Cadastrar contrato'}
          </button>
        </div>
      </div>
    </div>
  );
}

function RenovacaoModal({
  initial,
  membrosAtivos,
  onSave,
  onClose,
}: {
  initial: (RenovacaoForm & { id?: string }) | null;
  membrosAtivos: { nome: string; clinica: string | null }[];
  onSave: () => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<RenovacaoForm>(initial ?? BLANK_RENOVACAO);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isEdit = !!initial?.id;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  function set(field: keyof RenovacaoForm, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!form.medico.trim()) { setError('Médico é obrigatório.'); return; }
    setSaving(true);
    setError('');
    try {
      const url = isEdit ? `/api/renovacoes/${initial!.id}` : '/api/renovacoes';
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erro ao salvar.');
      onSave();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/renovacoes/${initial!.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erro ao excluir.');
      onSave();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido.');
      setConfirmDelete(false);
    } finally {
      setSaving(false);
    }
  }

  const inp = 'w-full bg-[#12122A] border border-[rgba(74,144,226,0.25)] rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#4A90E2] transition-all';
  const lbl = 'text-xs text-[#A0A0B0] mb-1 block';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="card-gradient-border w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-orbitron text-base font-bold text-white">
            {isEdit ? 'Editar Renovação' : 'Nova Renovação'}
          </h3>
          <button onClick={onClose} className="text-[#A0A0B0] hover:text-white text-xl transition-colors">✕</button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Data</label>
            <input type="date" value={form.data} onChange={e => set('data', e.target.value)} className={inp} />
          </div>
          <div className="sm:col-span-2">
            <label className={lbl}>Médico *</label>
            <select value={form.medico} onChange={e => set('medico', e.target.value)} className={inp + ' cursor-pointer'}>
              <option value="">Selecione o médico…</option>
              {membrosAtivos.map(m => (
                <option key={m.nome} value={m.nome}>
                  {m.clinica ? `${m.clinica} — ${m.nome}` : m.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={lbl}>Status do Contrato</label>
            <select value={form.statusContrato} onChange={e => set('statusContrato', e.target.value)} className={inp + ' cursor-pointer'}>
              <option value="Enviado">Enviado</option>
              <option value="Assinado">Assinado</option>
              <option value="Não precisa">Não precisa</option>
            </select>
          </div>
          <div>
            <label className={lbl}>Status Financeiro</label>
            <select value={form.statusFinanceiro} onChange={e => set('statusFinanceiro', e.target.value)} className={inp + ' cursor-pointer'}>
              <option value="Em Aberto">Em Aberto</option>
              <option value="Pago Parcial">Pago Parcial</option>
              <option value="Pago">Pago</option>
              <option value="Permuta">Permuta</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={lbl}>Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.valor}
              onChange={e => set('valor', e.target.value)}
              placeholder="0,00"
              className={inp}
            />
          </div>
        </div>

        {error && <p className="text-[#F59E0B] text-xs mt-4">{error}</p>}

        <div className="flex gap-3 mt-6">
          {isEdit && (
            <button
              onClick={confirmDelete ? handleDelete : () => setConfirmDelete(true)}
              disabled={saving}
              className={`py-2.5 px-4 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 ${
                confirmDelete
                  ? 'bg-[#F59E0B] text-[#08080F]'
                  : 'border border-[rgba(245,158,11,0.4)] text-[#F59E0B] hover:bg-[rgba(245,158,11,0.1)]'
              }`}
            >
              {confirmDelete ? 'Confirmar exclusão' : 'Excluir'}
            </button>
          )}
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[rgba(74,144,226,0.3)] text-[#A0A0B0] hover:text-white transition-all text-sm">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl btn-glow text-white font-semibold text-sm disabled:opacity-60">
            {saving ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Cadastrar renovação'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FinanceiroTab() {
  const [data, setData] = useState<FinanceiroData | null>(null);
  const [membrosAtivos, setMembrosAtivos] = useState<{ nome: string; clinica: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTable, setActiveTable] = useState<'contratos' | 'renovacoes'>('contratos');
  const [contratoModal, setContratoModal] = useState<(ContratoForm & { id?: string }) | null | false>(false);
  const [renovacaoModal, setRenovacaoModal] = useState<(RenovacaoForm & { id?: string }) | null | false>(false);

  const fetchData = useCallback(async () => {
    try {
      const [finRes, clientesRes] = await Promise.all([
        fetch('/api/financeiro-data'),
        fetch('/api/clientes-data'),
      ]);
      if (!finRes.ok) throw new Error('Erro ao carregar dados financeiros.');
      setData(await finRes.json());
      if (clientesRes.ok) {
        const cd = await clientesRes.json();
        const ativos = (cd.membros ?? [])
          .filter((m: { situacao: string }) => m.situacao === 'Ativo')
          .map((m: { nome: string; clinica: string | null }) => ({ nome: m.nome, clinica: m.clinica }))
          .sort((a: { nome: string }, b: { nome: string }) => a.nome.localeCompare(b.nome, 'pt-BR'));
        setMembrosAtivos(ativos);
      }
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

  function openEditContrato(c: Contrato) {
    setContratoModal({
      id: c.id,
      medico: c.medico,
      statusContrato: c.status_contrato,
      valor: String(c.valor ?? 0),
      statusFinanceiro: c.status_financeiro,
      notaFiscal: c.nota_fiscal ?? '',
      observacoes: c.observacoes ?? '',
    });
  }

  function openEditRenovacao(r: Renovacao) {
    setRenovacaoModal({
      id: r.id,
      data: r.data ?? '',
      medico: r.medico,
      statusContrato: r.status_contrato,
      valor: String(r.valor ?? 0),
      statusFinanceiro: r.status_financeiro,
    });
  }

  const total = data.kpis.totalContratos || 1;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon="file" title="Total de Contratos" value={data.kpis.totalContratos} />
        <KpiCard icon="check" title="Pagos" value={data.kpis.contratosPagos} subtitle={`${Math.round(data.kpis.contratosPagos / total * 100)}% do total`} />
        <KpiCard icon="alert" title="Em Aberto" value={data.kpis.contratosEmAberto} />
        <KpiCard icon="refresh" title="Renovações do Mês" value={data.kpis.renovacoesDoMes} />
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="card-gradient-border p-1 flex gap-1 rounded-xl">
          {(['contratos', 'renovacoes'] as const).map(t => (
            <button
              key={t}
              onClick={() => setActiveTable(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-sora transition-all ${
                activeTable === t ? 'bg-[#4A90E2] text-white' : 'text-[#A0A0B0] hover:text-white'
              }`}
            >
              {t === 'contratos' ? 'Contratos' : 'Renovações'}
            </button>
          ))}
        </div>
        <button
          onClick={() => activeTable === 'contratos' ? setContratoModal(null) : setRenovacaoModal(null)}
          className="btn-glow px-4 py-2 rounded-xl text-white font-sora font-semibold text-sm"
        >
          {activeTable === 'contratos' ? '+ Novo Contrato' : '+ Nova Renovação'}
        </button>
      </div>

      {activeTable === 'contratos' && (
        <div className="card-gradient-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(74,144,226,0.1)]">
                  <th className="text-left px-4 py-3 text-[#A0A0B0] font-medium text-xs uppercase tracking-wider">Médico</th>
                  <th className="text-left px-4 py-3 text-[#A0A0B0] font-medium text-xs uppercase tracking-wider">Contrato</th>
                  <th className="text-right px-4 py-3 text-[#A0A0B0] font-medium text-xs uppercase tracking-wider">Valor</th>
                  <th className="text-center px-4 py-3 text-[#A0A0B0] font-medium text-xs uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-[#A0A0B0] font-medium text-xs uppercase tracking-wider">NF</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {[...data.contratos].sort((a, b) => a.medico.localeCompare(b.medico, 'pt-BR')).map(c => (
                  <tr key={c.id} className="border-b border-[rgba(74,144,226,0.05)] hover:bg-[rgba(74,144,226,0.03)] transition-colors">
                    <td className="px-4 py-3 text-white font-medium">{c.medico}</td>
                    <td className="px-4 py-3"><ContratoBadge status={c.status_contrato} /></td>
                    <td className="px-4 py-3 text-right text-[#C9A84C] font-mono text-xs">
                      {c.valor ? formatBRL(Number(c.valor)) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center"><FinStatusBadge status={c.status_financeiro} /></td>
                    <td className="px-4 py-3 text-[#A0A0B0] text-xs">{c.nota_fiscal || '—'}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openEditContrato(c)}
                        className="text-[#555570] hover:text-[#3B9EF5] transition-colors p-1.5 rounded-lg hover:bg-[rgba(59,158,245,0.08)]"
                        title="Editar"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
                {data.contratos.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <p className="text-[#A0A0B0] text-sm mb-3">Nenhum contrato cadastrado.</p>
                      <button onClick={() => setContratoModal(null)} className="text-[#4A90E2] text-sm hover:underline">
                        + Cadastrar primeiro contrato
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTable === 'renovacoes' && (
        <div className="card-gradient-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(74,144,226,0.1)]">
                  <th className="text-left px-4 py-3 text-[#A0A0B0] font-medium text-xs uppercase tracking-wider">Data</th>
                  <th className="text-left px-4 py-3 text-[#A0A0B0] font-medium text-xs uppercase tracking-wider">Médico</th>
                  <th className="text-left px-4 py-3 text-[#A0A0B0] font-medium text-xs uppercase tracking-wider">Contrato</th>
                  <th className="text-right px-4 py-3 text-[#A0A0B0] font-medium text-xs uppercase tracking-wider">Valor</th>
                  <th className="text-center px-4 py-3 text-[#A0A0B0] font-medium text-xs uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {[...data.renovacoes].sort((a, b) => a.medico.localeCompare(b.medico, 'pt-BR')).map(r => (
                  <tr key={r.id} className="border-b border-[rgba(74,144,226,0.05)] hover:bg-[rgba(74,144,226,0.03)] transition-colors">
                    <td className="px-4 py-3 text-[#A0A0B0] font-mono text-xs">{toDisplay(r.data)}</td>
                    <td className="px-4 py-3 text-white font-medium">{r.medico}</td>
                    <td className="px-4 py-3"><ContratoBadge status={r.status_contrato} /></td>
                    <td className="px-4 py-3 text-right text-[#C9A84C] font-mono text-xs">
                      {r.valor ? formatBRL(Number(r.valor)) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center"><FinStatusBadge status={r.status_financeiro} /></td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openEditRenovacao(r)}
                        className="text-[#555570] hover:text-[#3B9EF5] transition-colors p-1.5 rounded-lg hover:bg-[rgba(59,158,245,0.08)]"
                        title="Editar"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
                {data.renovacoes.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <p className="text-[#A0A0B0] text-sm mb-3">Nenhuma renovação cadastrada.</p>
                      <button onClick={() => setRenovacaoModal(null)} className="text-[#4A90E2] text-sm hover:underline">
                        + Cadastrar primeira renovação
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {contratoModal !== false && (
        <ContratoModal
          initial={contratoModal}
          membrosAtivos={membrosAtivos}
          onSave={fetchData}
          onClose={() => setContratoModal(false)}
        />
      )}
      {renovacaoModal !== false && (
        <RenovacaoModal
          initial={renovacaoModal}
          membrosAtivos={membrosAtivos}
          onSave={fetchData}
          onClose={() => setRenovacaoModal(false)}
        />
      )}
    </div>
  );
}
