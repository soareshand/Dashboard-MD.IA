'use client';

import { useCallback, useEffect, useState } from 'react';
import { TabLoader, TabError } from './NpsTab';
import KpiCard from '@/components/dashboard/KpiCard';

interface Membro {
  id: string;
  situacao: string;
  nome: string;
  clinica: string | null;
  grupo: string | null;
  entrada: string | null;
  saida: string | null;
  cpf: string | null;
  endereco: string | null;
  cep: string | null;
  estado: string | null;
  telefone: string | null;
  email: string | null;
  data_nascimento: string | null;
  created_at: string;
}

interface ContatoRow {
  id: string;
  medico: string;
  ultimoContato: string | null;
  diasSemContato: number | null;
  status: string;
  proximoContato: string | null;
  frequenciaIdeal: string | null;
  tipoInteracao: string | null;
}

const BLANK_CONTATO = {
  medico: '',
  status: 'OK',
  ultimoContato: '',
  proximoContato: '',
  frequenciaIdeal: '',
  tipoInteracao: '',
};

type ContatoForm = typeof BLANK_CONTATO;

function calcProximoContato(ultimoContato: string, frequenciaIdeal: string): string {
  if (!ultimoContato || !frequenciaIdeal) return '';
  const d = new Date(ultimoContato + 'T00:00:00');
  if (frequenciaIdeal === 'Semanal') d.setDate(d.getDate() + 7);
  else if (frequenciaIdeal === 'Quinzenal') d.setDate(d.getDate() + 15);
  else if (frequenciaIdeal === 'Mensal') d.setMonth(d.getMonth() + 1);
  else return '';
  return d.toISOString().slice(0, 10);
}

function ContatoModal({
  initial,
  membrosAtivos,
  onSave,
  onClose,
}: {
  initial: (ContatoForm & { id?: string }) | null;
  membrosAtivos: { nome: string }[];
  onSave: () => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<ContatoForm>(initial ? {
    medico: initial.medico,
    status: initial.status,
    ultimoContato: initial.ultimoContato,
    proximoContato: initial.proximoContato,
    frequenciaIdeal: initial.frequenciaIdeal,
    tipoInteracao: initial.tipoInteracao,
  } : BLANK_CONTATO);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isEdit = !!initial?.id;

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  function set(field: keyof ContatoForm, value: string) {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'ultimoContato' || field === 'frequenciaIdeal') {
        const ultimo = field === 'ultimoContato' ? value : prev.ultimoContato;
        const freq = field === 'frequenciaIdeal' ? value : prev.frequenciaIdeal;
        const calc = calcProximoContato(ultimo, freq);
        if (calc) next.proximoContato = calc;
      }
      return next;
    });
  }

  async function handleSave() {
    if (!form.medico.trim()) { setError('Médico é obrigatório.'); return; }
    setSaving(true);
    setError('');
    try {
      const url = isEdit ? `/api/contatos/${initial!.id}` : '/api/contatos';
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
      const res = await fetch(`/api/contatos/${initial!.id}`, { method: 'DELETE' });
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
      <div className="card-gradient-border w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-orbitron text-base font-bold text-white">
            {isEdit ? 'Editar Contato' : 'Novo Contato'}
          </h3>
          <button onClick={onClose} className="text-[#A0A0B0] hover:text-white text-xl transition-colors">✕</button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={lbl}>Médico *</label>
            <select value={form.medico} onChange={e => set('medico', e.target.value)} className={inp + ' cursor-pointer'}>
              <option value="">— Selecionar médico —</option>
              {membrosAtivos.map(m => (
                <option key={m.nome} value={m.nome}>{m.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={lbl}>Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)} className={inp + ' cursor-pointer'}>
              <option value="OK">OK</option>
              <option value="Atenção">Atenção</option>
              <option value="Crítico">Crítico</option>
            </select>
          </div>
          <div>
            <label className={lbl}>Frequência Ideal</label>
            <select value={form.frequenciaIdeal} onChange={e => set('frequenciaIdeal', e.target.value)} className={inp + ' cursor-pointer'}>
              <option value="">— Selecionar —</option>
              <option value="Semanal">Semanal</option>
              <option value="Quinzenal">Quinzenal</option>
              <option value="Mensal">Mensal</option>
            </select>
          </div>
          <div>
            <label className={lbl}>Último Contato</label>
            <input type="date" value={form.ultimoContato} onChange={e => set('ultimoContato', e.target.value)} className={inp} />
          </div>
          <div>
            <label className={lbl}>Próximo Contato</label>
            <input type="date" value={form.proximoContato} onChange={e => set('proximoContato', e.target.value)} className={inp} />
          </div>
          <div className="sm:col-span-2">
            <label className={lbl}>Tipo de Interação</label>
            <select value={form.tipoInteracao} onChange={e => set('tipoInteracao', e.target.value)} className={inp + ' cursor-pointer'}>
              <option value="">— Selecionar —</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Call">Call</option>
              <option value="E-mail">E-mail</option>
              <option value="Presencial">Presencial</option>
              <option value="Outro">Outro</option>
            </select>
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
            {saving ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Cadastrar'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface ClientesData {
  kpis: {
    totalAtivos: number;
    totalInativos: number;
    aniversariantesDoMes: number;
    emAlertaContato: number;
    criticos: number;
  };
  membros: Membro[];
  contatos: ContatoRow[];
  aniversariantes: Membro[];
}

const ESTADOS_BR = [
  'Acre','Alagoas','Amapá','Amazonas','Bahia','Ceará','Distrito Federal',
  'Espírito Santo','Goiás','Maranhão','Mato Grosso','Mato Grosso do Sul',
  'Minas Gerais','Pará','Paraíba','Paraná','Pernambuco','Piauí',
  'Rio de Janeiro','Rio Grande do Norte','Rio Grande do Sul','Rondônia',
  'Roraima','Santa Catarina','São Paulo','Sergipe','Tocantins',
];

const BLANK_FORM = {
  situacao: 'Ativo' as 'Ativo' | 'Inativo',
  nome: '',
  clinica: '',
  grupo: '',
  entrada: '',
  saida: '',
  cpf: '',
  endereco: '',
  cep: '',
  estado: '',
  telefone: '',
  email: '',
  dataNascimento: '',
};

type MembroForm = typeof BLANK_FORM;

function isBirthdayToday(dataNascimento: string | null): boolean {
  if (!dataNascimento) return false;
  const today = new Date();
  const parts = dataNascimento.split('-');
  if (parts.length !== 3) return false;
  return parseInt(parts[1]) === today.getMonth() + 1 && parseInt(parts[2]) === today.getDate();
}

function toDisplay(iso: string | null | undefined): string {
  if (!iso) return '—';
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function getRenovacaoInfo(entradaISO: string | null) {
  if (!entradaISO) return { dataRenovacao: '—', diasRestantes: null as number | null, status: 'sem-data' as const };
  const entradaDate = new Date(entradaISO + 'T00:00:00');
  const renovacao = new Date(entradaDate.getFullYear() + 1, entradaDate.getMonth(), entradaDate.getDate());
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const diasRestantes = Math.ceil((renovacao.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
  const dataRenovacao = `${String(renovacao.getDate()).padStart(2, '0')}/${String(renovacao.getMonth() + 1).padStart(2, '0')}/${renovacao.getFullYear()}`;
  if (diasRestantes < 0) return { dataRenovacao, diasRestantes, status: 'vencida' as const };
  if (diasRestantes <= 30) return { dataRenovacao, diasRestantes, status: 'urgente' as const };
  if (diasRestantes <= 60) return { dataRenovacao, diasRestantes, status: 'atencao' as const };
  if (diasRestantes <= 90) return { dataRenovacao, diasRestantes, status: 'em-breve' as const };
  return { dataRenovacao, diasRestantes, status: 'ok' as const };
}

function RenovacaoBadge({ entrada }: { entrada: string | null }) {
  const { dataRenovacao, diasRestantes, status } = getRenovacaoInfo(entrada);
  if (status === 'sem-data') return <span className="text-[#A0A0B0] text-xs">—</span>;
  const styles = {
    vencida:    'bg-[rgba(245,158,11,0.15)] text-[#F59E0B] border-[rgba(245,158,11,0.4)]',
    urgente:    'bg-[rgba(245,158,11,0.1)] text-[#F59E0B] border-[rgba(245,158,11,0.3)]',
    atencao:    'bg-[rgba(139,92,246,0.1)] text-[#8B5CF6] border-[rgba(139,92,246,0.3)]',
    'em-breve': 'bg-[rgba(59,158,245,0.1)] text-[#3B9EF5] border-[rgba(59,158,245,0.2)]',
    ok:         'bg-[#1A1A2E] text-[#A0A0B0] border-[rgba(74,144,226,0.15)]',
    'sem-data': '',
  };
  const labels = {
    vencida:    `Vencida há ${Math.abs(diasRestantes!)}d`,
    urgente:    `${diasRestantes}d — URGENTE`,
    atencao:    `${diasRestantes}d — Atenção`,
    'em-breve': `${diasRestantes}d`,
    ok:         dataRenovacao,
    'sem-data': '—',
  };
  return (
    <div className="flex flex-col gap-0.5 items-start">
      <span className={`px-2 py-0.5 rounded-full text-xs border whitespace-nowrap ${styles[status]}`}>
        {labels[status]}
      </span>
      {status !== 'ok' && (
        <span className="text-[10px] text-[#555570] font-mono pl-0.5">{dataRenovacao}</span>
      )}
    </div>
  );
}

function ContatoStatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  const isOk = s.includes('ok') || s.includes('ativo') || s === '';
  const isAtencao = s.includes('aten');
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
      isOk ? 'bg-[rgba(59,158,245,0.1)] text-[#3B9EF5] border border-[rgba(59,158,245,0.2)]' :
      isAtencao ? 'bg-[rgba(139,92,246,0.1)] text-[#8B5CF6] border border-[rgba(139,92,246,0.25)]' :
      'bg-[rgba(245,158,11,0.1)] text-[#F59E0B] border border-[rgba(245,158,11,0.2)]'
    }`}>
      {status || 'OK'}
    </span>
  );
}

function DiasBar({ dias }: { dias: number }) {
  const pct = Math.min((dias / 60) * 100, 100);
  const color = dias > 30 ? '#F59E0B' : dias > 15 ? '#8B5CF6' : '#3B9EF5';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[#1A1A2E] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-mono text-[#A0A0B0] w-8 text-right">{dias}d</span>
    </div>
  );
}

function MembroModal({
  initial,
  onSave,
  onClose,
}: {
  initial: (MembroForm & { id?: string }) | null;
  onSave: () => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<MembroForm>(
    initial
      ? { situacao: initial.situacao as 'Ativo' | 'Inativo', nome: initial.nome, clinica: initial.clinica ?? '', grupo: initial.grupo, entrada: initial.entrada, saida: initial.saida, cpf: initial.cpf, endereco: initial.endereco, cep: initial.cep, estado: initial.estado, telefone: initial.telefone, email: initial.email, dataNascimento: initial.dataNascimento }
      : BLANK_FORM
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isEdit = !!initial?.id;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  function set(field: keyof MembroForm, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!form.nome.trim()) { setError('Nome é obrigatório.'); return; }
    setSaving(true);
    setError('');
    try {
      const url = isEdit ? `/api/clientes/${initial!.id}` : '/api/clientes';
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
      const res = await fetch(`/api/clientes/${initial!.id}`, { method: 'DELETE' });
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
      <div className="card-gradient-border w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-orbitron text-base font-bold text-white">
            {isEdit ? 'Editar Membro' : 'Novo Membro'}
          </h3>
          <button onClick={onClose} className="text-[#A0A0B0] hover:text-white text-xl transition-colors">✕</button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Situação</label>
            <select value={form.situacao} onChange={e => set('situacao', e.target.value)} className={inp + ' cursor-pointer'}>
              <option value="Ativo">Ativo</option>
              <option value="Inativo">Inativo</option>
            </select>
          </div>
          <div>
            <label className={lbl}>Grupo</label>
            <select value={form.grupo} onChange={e => set('grupo', e.target.value)} className={inp + ' cursor-pointer'}>
              <option value="">— Selecionar —</option>
              <option value="Mentorado">Mentorado</option>
              <option value="Infinite Gear">Infinite Gear</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={lbl}>Nome *</label>
            <input value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Nome completo" className={inp} />
          </div>
          <div className="sm:col-span-2">
            <label className={lbl}>Nome da Clínica</label>
            <input value={form.clinica} onChange={e => set('clinica', e.target.value)} placeholder="Nome da clínica" className={inp} />
          </div>
          <div>
            <label className={lbl}>Entrada</label>
            <input type="date" value={form.entrada} onChange={e => set('entrada', e.target.value)} className={inp} />
          </div>
          <div>
            <label className={lbl}>Saída</label>
            <input type="date" value={form.saida} onChange={e => set('saida', e.target.value)} className={inp} />
          </div>
          <div>
            <label className={lbl}>CPF</label>
            <input value={form.cpf} onChange={e => set('cpf', e.target.value)} placeholder="000.000.000-00" className={inp} />
          </div>
          <div>
            <label className={lbl}>Data de Nascimento</label>
            <input type="date" value={form.dataNascimento} onChange={e => set('dataNascimento', e.target.value)} className={inp} />
          </div>
          <div>
            <label className={lbl}>Telefone / WhatsApp</label>
            <input value={form.telefone} onChange={e => set('telefone', e.target.value)} placeholder="(00) 00000-0000" className={inp} />
          </div>
          <div>
            <label className={lbl}>E-mail</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@clinica.com.br" className={inp} />
          </div>
          <div>
            <label className={lbl}>Estado</label>
            <select value={form.estado} onChange={e => set('estado', e.target.value)} className={inp + ' cursor-pointer'}>
              <option value="">— Selecionar —</option>
              {ESTADOS_BR.map(uf => <option key={uf} value={uf}>{uf}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>CEP</label>
            <input value={form.cep} onChange={e => set('cep', e.target.value)} placeholder="00000-000" className={inp} />
          </div>
          <div className="sm:col-span-2">
            <label className={lbl}>Endereço</label>
            <input value={form.endereco} onChange={e => set('endereco', e.target.value)} placeholder="Rua, número, bairro, cidade" className={inp} />
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
            {saving ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Cadastrar membro'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClientesTab() {
  const [data, setData] = useState<ClientesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTable, setActiveTable] = useState<'membros' | 'contato'>('membros');
  const [modal, setModal] = useState<(MembroForm & { id?: string }) | null | false>(false);
  const [modalContato, setModalContato] = useState<(ContatoForm & { id?: string }) | null | false>(false);
  const [filtroSituacao, setFiltroSituacao] = useState<'todos' | 'Ativo' | 'Inativo'>('todos');
  const [buscaNome, setBuscaNome] = useState('');




  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/clientes-data');
      if (!res.ok) throw new Error('Erro ao carregar dados de clientes.');
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

  function openEditContato(c: ContatoRow) {
    setModalContato({
      id: c.id,
      medico: c.medico,
      status: c.status || 'OK',
      ultimoContato: c.ultimoContato ?? '',
      proximoContato: c.proximoContato ?? '',
      frequenciaIdeal: c.frequenciaIdeal ?? '',
      tipoInteracao: c.tipoInteracao ?? '',
    });
  }

  function openEdit(m: Membro) {
    setModal({
      id: m.id,
      situacao: (m.situacao as 'Ativo' | 'Inativo') || 'Ativo',
      nome: m.nome,
      clinica: m.clinica ?? '',
      grupo: m.grupo ?? '',
      entrada: m.entrada ?? '',
      saida: m.saida ?? '',
      cpf: m.cpf ?? '',
      endereco: m.endereco ?? '',
      cep: m.cep ?? '',
      estado: m.estado ?? '',
      telefone: m.telefone ?? '',
      email: m.email ?? '',
      dataNascimento: m.data_nascimento ?? '',
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon="activity" title="Ativos" value={data.kpis.totalAtivos} />
        <KpiCard icon="user-x" title="Inativos" value={data.kpis.totalInativos} />
        <KpiCard icon="alert" title="Alerta de Contato" value={data.kpis.emAlertaContato} subtitle="Requer atenção" />
        <KpiCard icon="gift" title="Aniversariantes" value={data.kpis.aniversariantesDoMes} subtitle="Este mês" />
      </div>

      {data.aniversariantes.length > 0 && (
        <div className="card-gradient-border p-4 rounded-xl">
          <h3 className="flex items-center gap-2 text-xs font-medium text-[#A78BFA] uppercase tracking-wider mb-3">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/>
              <line x1="12" y1="22" x2="12" y2="7"/>
              <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
              <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
            </svg>
            Aniversariantes do mês
          </h3>
          <div className="flex flex-wrap gap-2">
            {data.aniversariantes.map((m, i) => {
              const isToday = isBirthdayToday(m.data_nascimento);
              return (
                <span
                  key={i}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-all"
                  style={isToday ? {
                    background: 'rgba(59, 158, 245, 0.12)',
                    border: '1px solid rgba(59, 158, 245, 0.45)',
                    color: '#ffffff',
                    boxShadow: '0 0 12px rgba(59, 158, 245, 0.25)',
                  } : {
                    background: 'rgba(139, 92, 246, 0.08)',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    color: '#A78BFA',
                  }}
                >
                  {isToday && <span className="w-1.5 h-1.5 rounded-full bg-[#3B9EF5] dot-pulse shrink-0" />}
                  {m.nome}{m.data_nascimento ? ` (${toDisplay(m.data_nascimento).split('/').slice(0, 2).join('/')})` : ''}
                  {isToday && <span className="text-[10px] text-[#93C5FD] font-semibold">hoje!</span>}
                </span>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="card-gradient-border p-1 flex gap-1 rounded-xl">
          {(['membros', 'contato'] as const).map(t => (
            <button
              key={t}
              onClick={() => setActiveTable(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-sora transition-all ${
                activeTable === t ? 'bg-[#4A90E2] text-white' : 'text-[#A0A0B0] hover:text-white'
              }`}
            >
              {t === 'membros' ? 'Cadastro de Membros' : 'Monitoramento de Contato'}
            </button>
          ))}
        </div>
        {activeTable === 'membros' && (
          <button
            onClick={() => setModal(null)}
            className="btn-glow px-4 py-2 rounded-xl text-white font-sora font-semibold text-sm"
          >
            + Novo Membro
          </button>
        )}
        {activeTable === 'contato' && (
          <button
            onClick={() => setModalContato(null)}
            className="btn-glow px-4 py-2 rounded-xl text-white font-sora font-semibold text-sm"
          >
            + Novo Contato
          </button>
        )}
      </div>

      {activeTable === 'membros' && (
        <div className="flex flex-wrap gap-3 items-center">
          <div className="card-gradient-border p-1 flex gap-1 rounded-xl">
            {(['todos', 'Ativo', 'Inativo'] as const).map(s => (
              <button
                key={s}
                onClick={() => setFiltroSituacao(s)}
                className={`px-3 py-1 rounded-lg text-xs font-sora transition-all ${
                  filtroSituacao === s ? 'bg-[#4A90E2] text-white' : 'text-[#A0A0B0] hover:text-white'
                }`}
              >
                {s === 'todos' ? 'Todos' : s}
              </button>
            ))}
          </div>
          <input
            value={buscaNome}
            onChange={e => setBuscaNome(e.target.value)}
            placeholder="Buscar por nome…"
            className="bg-[#12122A] border border-[rgba(74,144,226,0.25)] rounded-xl px-3 py-1.5 text-white text-sm focus:outline-none focus:border-[#4A90E2] transition-all w-56 placeholder-[#555570]"
          />
          {buscaNome && (
            <button onClick={() => setBuscaNome('')} className="text-[#555570] hover:text-[#A0A0B0] text-xs transition-colors">
              ✕ limpar
            </button>
          )}
        </div>
      )}

      {activeTable === 'contato' && (
        <div className="card-gradient-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(74,144,226,0.1)]">
                  <th className="text-left px-4 py-3 text-[#A0A0B0] text-xs uppercase tracking-wider">Médico</th>
                  <th className="text-left px-4 py-3 text-[#A0A0B0] text-xs uppercase tracking-wider">Último Contato</th>
                  <th className="text-left px-4 py-3 text-[#A0A0B0] text-xs uppercase tracking-wider w-48">Dias sem contato</th>
                  <th className="text-left px-4 py-3 text-[#A0A0B0] text-xs uppercase tracking-wider">Próximo contato</th>
                  <th className="text-left px-4 py-3 text-[#A0A0B0] text-xs uppercase tracking-wider">Frequência</th>
                  <th className="text-center px-4 py-3 text-[#A0A0B0] text-xs uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {data.contatos.map(c => (
                  <tr key={c.id} className="border-b border-[rgba(74,144,226,0.05)] hover:bg-[rgba(74,144,226,0.03)] transition-colors">
                    <td className="px-4 py-3 text-white font-medium">{c.medico}</td>
                    <td className="px-4 py-3 text-[#A0A0B0] text-xs font-mono">{toDisplay(c.ultimoContato)}</td>
                    <td className="px-4 py-3 w-48">
                      {c.diasSemContato != null ? <DiasBar dias={c.diasSemContato} /> : <span className="text-[#A0A0B0] text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 text-[#A0A0B0] text-xs font-mono">{toDisplay(c.proximoContato)}</td>
                    <td className="px-4 py-3 text-[#A0A0B0] text-xs">{c.frequenciaIdeal || '—'}</td>
                    <td className="px-4 py-3 text-center"><ContatoStatusBadge status={c.status} /></td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openEditContato(c)}
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
                {data.contatos.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-8 text-[#A0A0B0] text-sm">Nenhum contato registrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTable === 'membros' && (
        <div>
        <div className="card-gradient-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(74,144,226,0.1)]">
                  <th className="text-left px-4 py-3 text-[#A0A0B0] text-xs uppercase tracking-wider">Situação</th>
                  <th className="text-left px-4 py-3 text-[#A0A0B0] text-xs uppercase tracking-wider">Grupo</th>
                  <th className="text-left px-4 py-3 text-[#A0A0B0] text-xs uppercase tracking-wider">Nome</th>
                  <th className="text-left px-4 py-3 text-[#A0A0B0] text-xs uppercase tracking-wider">Entrada</th>
                  <th className="text-left px-4 py-3 text-[#A0A0B0] text-xs uppercase tracking-wider">Saída</th>
                  <th className="text-left px-4 py-3 text-[#A0A0B0] text-xs uppercase tracking-wider">Renovação</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {data.membros
                  .filter(m => filtroSituacao === 'todos' || m.situacao === filtroSituacao)
                  .filter(m => !buscaNome || m.nome.toLowerCase().includes(buscaNome.toLowerCase()))
                  .map(m => {
                  const inativo = m.situacao === 'Inativo';
                  return (
                    <tr key={m.id} className="border-b border-[rgba(74,144,226,0.05)] hover:bg-[rgba(74,144,226,0.03)] transition-colors">
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs border ${
                          inativo
                            ? 'bg-[rgba(245,158,11,0.1)] text-[#F59E0B] border-[rgba(245,158,11,0.2)]'
                            : 'bg-[rgba(59,158,245,0.1)] text-[#3B9EF5] border-[rgba(59,158,245,0.2)]'
                        }`}>
                          {m.situacao || 'Ativo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#A0A0B0] text-xs whitespace-nowrap">{m.grupo || '—'}</td>
                      <td className={`px-4 py-3 font-medium whitespace-nowrap ${inativo ? 'text-[#A0A0B0]' : 'text-white'}`}>{m.nome}</td>
                      <td className="px-4 py-3 text-[#A0A0B0] text-xs font-mono whitespace-nowrap">{toDisplay(m.entrada)}</td>
                      <td className="px-4 py-3 text-[#A0A0B0] text-xs font-mono whitespace-nowrap">{toDisplay(m.saida)}</td>
                      <td className="px-4 py-3">
                        {inativo ? <span className="text-[#555570] text-xs">—</span> : <RenovacaoBadge entrada={m.entrada} />}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openEdit(m)}
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
                  );
                })}
                {data.membros.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <p className="text-[#A0A0B0] text-sm mb-3">Nenhum membro cadastrado.</p>
                      <button onClick={() => setModal(null)} className="text-[#4A90E2] text-sm hover:underline">
                        + Cadastrar primeiro membro
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      )}

      {modal !== false && (
        <MembroModal
          initial={modal}
          onSave={fetchData}
          onClose={() => setModal(false)}
        />
      )}

      {modalContato !== false && (
        <ContatoModal
          initial={modalContato}
          membrosAtivos={data.membros.filter(m => m.situacao === 'Ativo')}
          onSave={fetchData}
          onClose={() => setModalContato(false)}
        />
      )}
    </div>
  );
}
