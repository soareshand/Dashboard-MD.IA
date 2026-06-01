'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  cnpj: string | null;
  endereco: string | null;
  cep: string | null;
  estado: string | null;
  telefone: string | null;
  email: string | null;
  data_nascimento: string | null;
  created_at: string;
  produtos: Record<string, boolean> | null;
}

interface ProdutoItem {
  id: string;
  nome: string;
  ordem: number;
}

interface ContatoRow {
  id: string | null;
  medico: string;
  clinica: string | null;
  ultimoContato: string | null;
  diasSemContato: number | null;
  status: string;
  proximoContato: string | null;
  frequenciaIdeal: string | null;
  tipoInteracao: string | null;
}

const BLANK_CONTATO = {
  medico: '',
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

function ContatoSelect({
  value,
  onChange,
  membrosAtivos,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  membrosAtivos: { nome: string; clinica: string | null }[];
  className: string;
}) {
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const btnRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const selected = membrosAtivos.find(m => m.nome === value);

  function handleToggle() {
    if (!open) {
      const rect = btnRef.current?.getBoundingClientRect();
      if (rect) {
        setDropdownStyle({ position: 'fixed', top: rect.bottom + 4, left: rect.left, width: rect.width, zIndex: 9999 });
      }
    }
    setOpen(o => !o);
  }

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (btnRef.current?.contains(e.target as Node)) return;
      if (listRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative">
      <button ref={btnRef} type="button" onClick={handleToggle}
        className={`${className} flex items-center justify-between cursor-pointer text-left min-h-[42px]`}>
        {selected ? (
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white text-sm truncate">{selected.clinica || selected.nome}</p>
            {selected.clinica && <p className="text-[#A0A0B0] text-xs truncate">{selected.nome}</p>}
          </div>
        ) : (
          <span className="text-[#555570]">— Selecionar contato —</span>
        )}
        <svg className="ml-2 shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && typeof window !== 'undefined' && createPortal(
        <div ref={listRef} style={dropdownStyle}
          className="bg-[#12122A] border border-[rgba(74,144,226,0.35)] rounded-xl overflow-hidden shadow-2xl max-h-52 overflow-y-auto">
          {membrosAtivos.map(m => (
            <button key={m.nome} type="button" onClick={() => { onChange(m.nome); setOpen(false); }}
              className={`w-full text-left px-3 py-2.5 hover:bg-[rgba(74,144,226,0.1)] transition-colors border-b border-[rgba(74,144,226,0.05)] last:border-0 ${value === m.nome ? 'bg-[rgba(74,144,226,0.08)]' : ''}`}>
              <p className="font-semibold text-white text-sm">{m.clinica || m.nome}</p>
              {m.clinica && <p className="text-[#A0A0B0] text-xs">{m.nome}</p>}
            </button>
          ))}
          {membrosAtivos.length === 0 && (
            <p className="text-[#A0A0B0] text-sm px-3 py-2">Nenhum membro ativo.</p>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}

// ── ProdutoModal ─────────────────────────────────────────────────────────────

function ProdutoModal({
  initial,
  onSave,
  onClose,
}: {
  initial: ProdutoItem | null;
  onSave: () => void;
  onClose: () => void;
}) {
  const [nome, setNome] = useState(initial?.nome ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isEdit = !!initial;

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  async function handleSave() {
    if (!nome.trim()) { setError('Nome é obrigatório.'); return; }
    setSaving(true);
    setError('');
    try {
      const url = isEdit ? `/api/produtos-catalogo/${initial!.id}` : '/api/produtos-catalogo';
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nome.trim() }),
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
      const res = await fetch(`/api/produtos-catalogo/${initial!.id}`, { method: 'DELETE' });
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="card-gradient-border w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-orbitron text-base font-bold text-white">
            {isEdit ? 'Editar Produto' : 'Novo Produto'}
          </h3>
          <button onClick={onClose} className="text-[#A0A0B0] hover:text-white text-xl transition-colors">✕</button>
        </div>

        <div>
          <label className="text-xs text-[#A0A0B0] mb-1 block">Nome do Produto *</label>
          <input
            value={nome}
            onChange={e => setNome(e.target.value)}
            placeholder="Ex: AGENTE LEAD"
            className={inp}
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
          />
        </div>

        {error && <p className="text-[#F59E0B] text-xs mt-3">{error}</p>}

        <div className="flex gap-3 mt-5">
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
              {confirmDelete ? 'Confirmar' : 'Excluir'}
            </button>
          )}
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[rgba(74,144,226,0.3)] text-[#A0A0B0] hover:text-white transition-all text-sm">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl btn-glow text-white font-semibold text-sm disabled:opacity-60">
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ContatoModal ─────────────────────────────────────────────────────────────

function ContatoModal({
  initial,
  membrosAtivos,
  existingContatos,
  onSave,
  onClose,
}: {
  initial: (ContatoForm & { id?: string }) | null;
  membrosAtivos: { nome: string; clinica: string | null }[];
  existingContatos: ContatoRow[];
  onSave: () => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<ContatoForm>(initial ? {
    medico: initial.medico,
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
      let next = { ...prev, [field]: value };

      if (field === 'medico' && !isEdit) {
        const existing = existingContatos.find(c => c.medico === value);
        if (existing) {
          next = {
            ...next,
            ultimoContato: existing.ultimoContato ?? '',
            proximoContato: existing.proximoContato ?? '',
            frequenciaIdeal: existing.frequenciaIdeal ?? '',
            tipoInteracao: existing.tipoInteracao ?? '',
          };
        }
      }

      if (field === 'ultimoContato' || field === 'frequenciaIdeal') {
        const ultimo = field === 'ultimoContato' ? value : next.ultimoContato;
        const freq = field === 'frequenciaIdeal' ? value : next.frequenciaIdeal;
        const calc = calcProximoContato(ultimo, freq);
        if (calc) next.proximoContato = calc;
      }
      return next;
    });
  }

  async function handleSave() {
    if (!form.medico.trim()) { setError('Contato é obrigatório.'); return; }
    setSaving(true);
    setError('');
    try {
      const url = isEdit ? `/api/contatos/${initial!.id}` : '/api/contatos';
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medico: form.medico,
          ultimoContato: form.ultimoContato,
          proximoContato: form.proximoContato,
          frequenciaIdeal: form.frequenciaIdeal,
          tipoInteracao: form.tipoInteracao,
        }),
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
            <label className={lbl}>Contato *</label>
            <ContatoSelect
              value={form.medico}
              onChange={v => set('medico', v)}
              membrosAtivos={membrosAtivos}
              className={inp}
            />
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
            <label className={lbl}>Tipo de Interação</label>
            <select value={form.tipoInteracao} onChange={e => set('tipoInteracao', e.target.value)} className={inp + ' cursor-pointer'}>
              <option value="">— Selecionar —</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Call">Call</option>
              <option value="E-mail">E-mail</option>
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
  cnpj: '',
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
  if (!status) return <span className="text-[#A0A0B0] text-xs">—</span>;
  const isCritico = status === 'Crítico';
  const isAtencao = status === 'Atenção';
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
      isCritico ? 'bg-[rgba(245,158,11,0.1)] text-[#F59E0B] border border-[rgba(245,158,11,0.2)]' :
      isAtencao ? 'bg-[rgba(139,92,246,0.1)] text-[#8B5CF6] border border-[rgba(139,92,246,0.25)]' :
      'bg-[rgba(59,158,245,0.1)] text-[#3B9EF5] border border-[rgba(59,158,245,0.2)]'
    }`}>
      {status}
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

// ── MembroModal ───────────────────────────────────────────────────────────────

function MembroModal({
  initial,
  onSave,
  onClose,
}: {
  initial: (MembroForm & { id?: string; produtos?: Record<string, boolean> }) | null;
  onSave: () => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<MembroForm>(
    initial
      ? { situacao: initial.situacao as 'Ativo' | 'Inativo', nome: initial.nome, clinica: initial.clinica ?? '', grupo: initial.grupo, entrada: initial.entrada, saida: initial.saida, cpf: initial.cpf, cnpj: initial.cnpj, endereco: initial.endereco, cep: initial.cep, estado: initial.estado, telefone: initial.telefone, email: initial.email, dataNascimento: initial.dataNascimento }
      : BLANK_FORM
  );
  const [modalTab, setModalTab] = useState<'dados' | 'produtos'>('dados');
  const [catalog, setCatalog] = useState<ProdutoItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [produtosAtivos, setProdutosAtivos] = useState<Record<string, boolean>>(initial?.produtos ?? {});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isEdit = !!initial?.id;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    if (modalTab === 'produtos' && catalog.length === 0 && !catalogLoading) {
      setCatalogLoading(true);
      fetch('/api/produtos-catalogo')
        .then(r => r.json())
        .then(data => { setCatalog(data); setCatalogLoading(false); })
        .catch(() => setCatalogLoading(false));
    }
  }, [modalTab, catalog.length, catalogLoading]);

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
        body: JSON.stringify({ ...form, produtos: produtosAtivos }),
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

  const produtosAtivosCount = catalog.filter(p => produtosAtivos[p.id]).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="card-gradient-border w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-orbitron text-base font-bold text-white">
            {isEdit ? 'Editar Membro' : 'Novo Membro'}
          </h3>
          <button onClick={onClose} className="text-[#A0A0B0] hover:text-white text-xl transition-colors">✕</button>
        </div>

        {/* Tab nav */}
        <div className="card-gradient-border p-1 flex gap-1 rounded-xl mb-5">
          <button
            onClick={() => setModalTab('dados')}
            className={`flex-1 py-1.5 rounded-lg text-sm font-sora transition-all ${modalTab === 'dados' ? 'bg-[#4A90E2] text-white' : 'text-[#A0A0B0] hover:text-white'}`}
          >
            📋 Dados
          </button>
          <button
            onClick={() => setModalTab('produtos')}
            className={`flex-1 py-1.5 rounded-lg text-sm font-sora transition-all flex items-center justify-center gap-1.5 ${modalTab === 'produtos' ? 'bg-[#4A90E2] text-white' : 'text-[#A0A0B0] hover:text-white'}`}
          >
            📦 Produtos
            {catalog.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${modalTab === 'produtos' ? 'bg-white/20' : 'bg-[rgba(74,144,226,0.2)]'}`}>
                {produtosAtivosCount}/{catalog.length}
              </span>
            )}
          </button>
        </div>

        {/* ── Dados tab ── */}
        {modalTab === 'dados' && (
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
              <label className={lbl}>CNPJ</label>
              <input value={form.cnpj} onChange={e => set('cnpj', e.target.value)} placeholder="00.000.000/0001-00" className={inp} />
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
        )}

        {/* ── Produtos tab ── */}
        {modalTab === 'produtos' && (
          <div>
            {catalogLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-6 h-6 border-2 border-[#3B9EF5] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : catalog.length === 0 ? (
              <div className="text-center py-10 text-[#555570] text-sm">
                <p>Nenhum produto cadastrado no catálogo.</p>
                <p className="text-xs mt-1">Adicione produtos em Clientes → Catálogo de Produtos.</p>
              </div>
            ) : (
              <>
                <p className="text-[#555570] text-xs mb-4">Ative os produtos que estão disponíveis para este membro.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {catalog.map(p => {
                    const active = !!produtosAtivos[p.id];
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setProdutosAtivos(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                          active
                            ? 'border-[#3B9EF5] bg-[rgba(59,158,245,0.08)] text-white'
                            : 'border-[rgba(74,144,226,0.12)] bg-[#080818] text-[#555580] hover:border-[rgba(74,144,226,0.25)] hover:text-[#A0A0B0]'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full flex-shrink-0 border-2 flex items-center justify-center transition-all ${
                          active ? 'border-[#3B9EF5] bg-[#3B9EF5]' : 'border-[#252545]'
                        }`}>
                          {active && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span className="text-sm font-semibold tracking-wide">{p.nome}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[#404060] text-xs mt-4 text-right">
                  {produtosAtivosCount} de {catalog.length} produto{catalog.length !== 1 ? 's' : ''} ativo{produtosAtivosCount !== 1 ? 's' : ''}
                </p>
              </>
            )}
          </div>
        )}

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

// ── ClientesTab ───────────────────────────────────────────────────────────────

export default function ClientesTab() {
  const [data, setData] = useState<ClientesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTable, setActiveTable] = useState<'membros' | 'contato' | 'catalogo'>('membros');
  const [modal, setModal] = useState<(MembroForm & { id?: string; produtos?: Record<string, boolean> }) | null | false>(false);
  const [modalContato, setModalContato] = useState<(ContatoForm & { id?: string }) | null | false>(false);
  const [modalProduto, setModalProduto] = useState<ProdutoItem | null | false>(false);
  const [catalog, setCatalog] = useState<ProdutoItem[]>([]);
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

  const fetchCatalog = useCallback(async () => {
    try {
      const res = await fetch('/api/produtos-catalogo');
      if (!res.ok) return;
      setCatalog(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    fetchData();
    fetchCatalog();
  }, [fetchData, fetchCatalog]);

  if (loading) return <TabLoader />;
  if (error) return <TabError message={error} onRetry={fetchData} />;
  if (!data) return null;

  function openEditContato(c: ContatoRow) {
    setModalContato({
      id: c.id ?? undefined,
      medico: c.medico,
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
      cnpj: m.cnpj ?? '',
      endereco: m.endereco ?? '',
      cep: m.cep ?? '',
      estado: m.estado ?? '',
      telefone: m.telefone ?? '',
      email: m.email ?? '',
      dataNascimento: m.data_nascimento ?? '',
      produtos: m.produtos ?? {},
    });
  }

  const NAV_TABS = [
    { id: 'membros', label: 'Cadastro de Membros' },
    { id: 'contato', label: 'Monitoramento de Contato' },
    { id: 'catalogo', label: 'Catálogo de Produtos' },
  ] as const;

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
          <h3 className="flex items-center gap-2 text-xs font-medium text-white uppercase tracking-wider mb-3">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
          {NAV_TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTable(t.id)}
              className={`px-4 py-1.5 rounded-lg text-sm font-sora transition-all ${
                activeTable === t.id ? 'bg-[#4A90E2] text-white' : 'text-[#A0A0B0] hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {activeTable === 'membros' && (
          <button onClick={() => setModal(null)} className="btn-glow px-4 py-2 rounded-xl text-white font-sora font-semibold text-sm">
            + Novo Membro
          </button>
        )}
        {activeTable === 'contato' && (
          <button onClick={() => setModalContato(null)} className="btn-glow px-4 py-2 rounded-xl text-white font-sora font-semibold text-sm">
            + Novo Contato
          </button>
        )}
        {activeTable === 'catalogo' && (
          <button onClick={() => setModalProduto(null)} className="btn-glow px-4 py-2 rounded-xl text-white font-sora font-semibold text-sm">
            + Novo Produto
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

      {/* ── Monitoramento de Contato ── */}
      {activeTable === 'contato' && (
        <div className="card-gradient-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(74,144,226,0.1)]">
                  <th className="text-left px-4 py-3 text-[#A0A0B0] text-xs uppercase tracking-wider">Contato</th>
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
                  <tr key={c.medico} className="border-b border-[rgba(74,144,226,0.05)] hover:bg-[rgba(74,144,226,0.03)] transition-colors">
                    <td className="px-4 py-3">
                      {c.clinica && <p className="font-semibold text-white text-sm leading-snug">{c.clinica}</p>}
                      <p className={`leading-snug ${c.clinica ? 'text-[#A0A0B0] text-xs' : 'text-white font-medium text-sm'}`}>{c.medico}</p>
                    </td>
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

      {/* ── Cadastro de Membros ── */}
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

      {/* ── Catálogo de Produtos ── */}
      {activeTable === 'catalogo' && (
        <div className="card-gradient-border overflow-hidden">
          <div className="p-4 border-b border-[rgba(74,144,226,0.12)]">
            <p className="text-[#555570] text-xs">
              Estes produtos são usados para marcar quais recursos cada membro tem disponível e calculam o Health Score na aba Geral.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(74,144,226,0.1)]">
                  <th className="text-left px-4 py-3 text-[#A0A0B0] text-xs uppercase tracking-wider w-12">#</th>
                  <th className="text-left px-4 py-3 text-[#A0A0B0] text-xs uppercase tracking-wider">Produto</th>
                  <th className="px-4 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {catalog.map((p, i) => (
                  <tr key={p.id} className="border-b border-[rgba(74,144,226,0.05)] hover:bg-[rgba(74,144,226,0.03)] transition-colors">
                    <td className="px-4 py-3 text-[#404060] text-xs font-mono">{i + 1}</td>
                    <td className="px-4 py-3 text-white font-semibold tracking-wide">{p.nome}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setModalProduto(p)}
                        className="text-[#555570] hover:text-[#3B9EF5] transition-colors p-1.5 rounded-lg hover:bg-[rgba(59,158,245,0.08)]"
                        title="Editar produto"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
                {catalog.length === 0 && (
                  <tr>
                    <td colSpan={3} className="text-center py-10">
                      <p className="text-[#A0A0B0] text-sm mb-2">Nenhum produto cadastrado.</p>
                      <button onClick={() => setModalProduto(null)} className="text-[#4A90E2] text-sm hover:underline">
                        + Adicionar primeiro produto
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
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
          membrosAtivos={data.membros.filter(m => m.situacao === 'Ativo').map(m => ({ nome: m.nome, clinica: m.clinica }))}
          existingContatos={data.contatos}
          onSave={fetchData}
          onClose={() => setModalContato(false)}
        />
      )}

      {modalProduto !== false && (
        <ProdutoModal
          initial={modalProduto}
          onSave={() => { fetchCatalog(); fetchData(); }}
          onClose={() => setModalProduto(false)}
        />
      )}
    </div>
  );
}
