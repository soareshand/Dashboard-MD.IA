'use client';

import { useState, useEffect, useCallback } from 'react';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, addWeeks, subWeeks, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const SUBCATEGORIAS: Record<string, string[]> = {
  'Follow-up': [
    'WhatsApp enviado',
    'Check-in pós-treinamento',
    'Acompanhamento do teste com IA',
    'Acompanhamento da automação de experiência',
  ],
  'Call': [
    'Call de onboarding',
    'Call de renovação',
    'Call de acompanhamento',
    'Call interno',
  ],
  'Onboarding': [
    'Apresentação da plataforma',
    'Treinamento CRM',
    'Configuração do CRM',
    'Follow-up de onboarding',
  ],
  'Suporte': [
    'Suporte CRM via Call',
    'Suporte CRM via WhatsApp',
    'Ajuste de IA via Call',
    'Ajuste de IA via WhatsApp',
  ],
  'Outro': [],
};

const CATEGORIAS = Object.keys(SUBCATEGORIAS);

const CAT_STYLE: Record<string, string> = {
  'Call':        'bg-[rgba(59,158,245,0.12)] text-[#6EC6FF] border-[rgba(59,158,245,0.3)]',
  'Onboarding':  'bg-[rgba(16,185,129,0.12)] text-[#34D399] border-[rgba(16,185,129,0.3)]',
  'Suporte':     'bg-[rgba(245,158,11,0.12)] text-[#FCD34D] border-[rgba(245,158,11,0.3)]',
  'Follow-up':   'bg-[rgba(139,92,246,0.12)] text-[#A78BFA] border-[rgba(139,92,246,0.3)]',
  'Call enviado':'bg-[rgba(99,102,241,0.12)] text-[#818CF8] border-[rgba(99,102,241,0.3)]',
  'Outro':       'bg-[rgba(162,162,178,0.12)] text-[#a2a2b2] border-[rgba(162,162,178,0.3)]',
};

interface Atividade {
  id: string;
  data: string;
  categoria: string;
  descricao: string;
  origem: string;
  timestamp: string;
  meta?: { clinica?: string; [key: string]: unknown } | null;
}

function weekRange(ref: Date) {
  const start = startOfWeek(ref, { weekStartsOn: 1 });
  const end = endOfWeek(ref, { weekStartsOn: 1 });
  return { start, end };
}

function toYMD(d: Date) {
  return format(d, 'yyyy-MM-dd');
}

export default function AtividadesTab() {
  const [weekRef, setWeekRef] = useState(new Date());
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [resumo, setResumo] = useState('');
  const [showResumo, setShowResumo] = useState(false);
  const [generatingResumo, setGeneratingResumo] = useState(false);
  const [copied, setCopied] = useState(false);

  // Add form state
  const [addData, setAddData] = useState(toYMD(new Date()));
  const [addCat, setAddCat] = useState('Follow-up');
  const [addSub, setAddSub] = useState(SUBCATEGORIAS['Follow-up'][0]);
  const [addNota, setAddNota] = useState('');
  const [addClinica, setAddClinica] = useState('');
  const [clinicas, setClinicas] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  function handleCatChange(cat: string) {
    setAddCat(cat);
    setAddSub(SUBCATEGORIAS[cat][0] ?? '');
    setAddNota('');
  }

  const { start, end } = weekRange(weekRef);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/atividades?from=${toYMD(start)}&to=${toYMD(end)}`);
      const json = await res.json();
      setAtividades(json.atividades ?? []);
    } finally {
      setLoading(false);
    }
  }, [start.toISOString(), end.toISOString()]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    fetch('/api/clientes-data')
      .then(r => r.json())
      .then(json => {
        const nomes = Array.from(new Set<string>(
          (json.membros ?? [])
            .map((m: { clinica: string | null }) => m.clinica)
            .filter(Boolean) as string[]
        )).sort((a, b) => a.localeCompare(b, 'pt-BR'));
        setClinicas(nomes);
      })
      .catch(() => {});
  }, []);

  const days = eachDayOfInterval({ start, end });

  function atividadesDoDia(day: Date) {
    const ymd = toYMD(day);
    return atividades.filter(a => a.data === ymd);
  }

  async function handleAdd() {
    const isOutro = addCat === 'Outro';
    if (isOutro && !addNota.trim()) return;
    const descricao = isOutro
      ? addNota.trim()
      : addNota.trim() ? `${addSub} — ${addNota.trim()}` : addSub;
    setSaving(true);
    try {
      const body: Record<string, string> = { categoria: addCat, descricao, data: addData };
      if (addClinica.trim()) body.clinica = addClinica.trim();
      const res = await fetch('/api/atividades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setAddNota('');
        setAddClinica('');
        setShowAdd(false);
        load();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/atividades/${id}`, { method: 'DELETE' });
    setAtividades(prev => prev.filter(a => a.id !== id));
  }

  async function handleGerarResumo() {
    if (atividades.length === 0) return;
    setGeneratingResumo(true);
    try {
      const semana = `${format(start, "dd/MM", { locale: ptBR })} a ${format(end, "dd/MM/yyyy", { locale: ptBR })}`;
      const res = await fetch('/api/atividades/resumo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ atividades, semana }),
      });
      const json = await res.json();
      if (json.resumo) {
        setResumo(json.resumo);
        setShowResumo(true);
      }
    } finally {
      setGeneratingResumo(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(resumo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const isCurrentWeek = toYMD(start) === toYMD(startOfWeek(new Date(), { weekStartsOn: 1 }));

  return (
    <div className="space-y-5 pb-10">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-orbitron text-lg font-bold text-white">Atividades</h2>
          <p className="text-[#a2a2b2] text-xs mt-0.5">Registro diário de atividades do CS</p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setAddData(toYMD(new Date())); setAddCat('Follow-up'); setAddSub(SUBCATEGORIAS['Follow-up'][0]); setAddNota(''); setAddClinica(''); }}
          className="px-4 py-2 rounded-xl text-sm font-sora font-semibold text-white transition-all"
          style={{ background: 'linear-gradient(135deg, #4A90E2, #6EC6FF)' }}
        >
          + Adicionar atividade
        </button>
      </div>

      {/* Week navigation */}
      <div className="flex items-center gap-3 bg-[#12122A] rounded-xl px-4 py-3 border border-[rgba(74,144,226,0.1)]">
        <button
          onClick={() => setWeekRef(w => subWeeks(w, 1))}
          className="text-[#a2a2b2] hover:text-white transition-colors text-sm px-2"
        >
          ←
        </button>
        <div className="flex-1 text-center">
          <span className="text-white font-sora text-sm">
            {format(start, "dd/MM", { locale: ptBR })} — {format(end, "dd/MM/yyyy", { locale: ptBR })}
          </span>
          {isCurrentWeek && (
            <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-[rgba(59,158,245,0.15)] text-[#6EC6FF] border border-[rgba(59,158,245,0.2)]">
              semana atual
            </span>
          )}
        </div>
        <button
          onClick={() => setWeekRef(w => addWeeks(w, 1))}
          className="text-[#a2a2b2] hover:text-white transition-colors text-sm px-2"
        >
          →
        </button>
      </div>

      {/* Days */}
      {loading ? (
        <div className="text-center py-10 text-[#a2a2b2] text-sm">Carregando…</div>
      ) : (
        <div className="space-y-4">
          {days.map(day => {
            const items = atividadesDoDia(day);
            const dayName = format(day, "EEEE", { locale: ptBR });
            const dayFormatted = dayName.charAt(0).toUpperCase() + dayName.slice(1);
            const dateStr = format(day, "dd/MM", { locale: ptBR });
            const today = isToday(day);

            // Oculta fim de semana se não tiver atividades
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
            if (isWeekend && items.length === 0) return null;

            return (
              <div key={toYMD(day)} className={`rounded-2xl border transition-all ${today ? 'border-[rgba(59,158,245,0.3)] bg-[rgba(59,158,245,0.04)]' : 'border-[rgba(255,255,255,0.05)] bg-[#12122A]'}`}>
                <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(255,255,255,0.05)]">
                  <div className="flex items-center gap-2">
                    <span className={`font-sora text-sm font-semibold ${today ? 'text-[#6EC6FF]' : 'text-white'}`}>
                      {dayFormatted}
                    </span>
                    <span className="text-[#a2a2b2] text-xs">{dateStr}</span>
                    {today && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[rgba(59,158,245,0.15)] text-[#6EC6FF] border border-[rgba(59,158,245,0.2)]">
                        hoje
                      </span>
                    )}
                  </div>
                  {items.length > 0 && (
                    <span className="text-[#a2a2b2] text-xs">{items.length} {items.length === 1 ? 'atividade' : 'atividades'}</span>
                  )}
                </div>

                <div className="px-4 py-3 space-y-2">
                  {items.length === 0 ? (
                    <p className="text-[#a2a2b2] text-xs py-1">Nenhuma atividade registrada</p>
                  ) : (
                    items.map(a => (
                      <div key={a.id} className="flex items-start gap-3 group">
                        <span className={`shrink-0 mt-0.5 text-[10px] px-2 py-0.5 rounded-full border font-sora ${CAT_STYLE[a.categoria] ?? CAT_STYLE['Outro']}`}>
                          {a.categoria}
                        </span>
                        <div className="flex-1 min-w-0">
                          <span className="text-white text-sm font-sora leading-relaxed">{a.descricao}</span>
                          {a.meta?.clinica && (
                            <span className="ml-2 text-[10px] text-[#a2a2b2] font-sora">· {a.meta.clinica}</span>
                          )}
                        </div>
                        {a.origem === 'auto' && (
                          <span className="shrink-0 text-[9px] text-[#a2a2b2] mt-1">auto</span>
                        )}
                        <button
                          onClick={() => handleDelete(a.id)}
                          className="shrink-0 text-[#a2a2b2] hover:text-[#EF4444] opacity-0 group-hover:opacity-100 transition-all text-xs mt-0.5"
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Gerar resumo */}
      {atividades.length > 0 && (
        <button
          onClick={handleGerarResumo}
          disabled={generatingResumo}
          className="w-full py-3 rounded-xl font-sora font-semibold text-sm text-white transition-all disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #6D28D9, #8B5CF6)' }}
        >
          {generatingResumo ? 'Gerando resumo…' : '✦ Gerar Resumo da Semana para o CEO'}
        </button>
      )}

      {/* Modal: Adicionar atividade */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-md bg-[#12122A] rounded-2xl border border-[rgba(74,144,226,0.2)] p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-orbitron text-base font-bold text-white">Nova Atividade</h3>
              <button onClick={() => setShowAdd(false)} className="text-[#a2a2b2] hover:text-white">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[#a2a2b2] text-xs font-sora block mb-1">Data</label>
                <input
                  type="date"
                  value={addData}
                  onChange={e => setAddData(e.target.value)}
                  className="w-full bg-[#0D0D1A] border border-[rgba(74,144,226,0.25)] rounded-xl px-4 py-2.5 text-white font-sora text-sm focus:outline-none focus:border-[#4A90E2]"
                />
              </div>

              <div>
                <label className="text-[#a2a2b2] text-xs font-sora block mb-1">Categoria</label>
                <select
                  value={addCat}
                  onChange={e => handleCatChange(e.target.value)}
                  className="w-full bg-[#0D0D1A] border border-[rgba(74,144,226,0.25)] rounded-xl px-4 py-2.5 text-white font-sora text-sm focus:outline-none focus:border-[#4A90E2]"
                >
                  {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {addCat !== 'Outro' && (
                <div>
                  <label className="text-[#a2a2b2] text-xs font-sora block mb-1">Subcategoria</label>
                  <select
                    value={addSub}
                    onChange={e => setAddSub(e.target.value)}
                    className="w-full bg-[#0D0D1A] border border-[rgba(74,144,226,0.25)] rounded-xl px-4 py-2.5 text-white font-sora text-sm focus:outline-none focus:border-[#4A90E2]"
                  >
                    {SUBCATEGORIAS[addCat].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="text-[#a2a2b2] text-xs font-sora block mb-1">
                  {addCat === 'Outro' ? 'Descrição' : <>Nota <span className="text-[#555570]">(opcional)</span></>}
                </label>
                <input
                  type="text"
                  value={addNota}
                  onChange={e => setAddNota(e.target.value)}
                  placeholder={addCat === 'Outro' ? 'Descreva a atividade…' : 'Ex: com Dr. João, aguardando retorno…'}
                  className="w-full bg-[#0D0D1A] border border-[rgba(74,144,226,0.25)] rounded-xl px-4 py-2.5 text-white placeholder-[#555570] font-sora text-sm focus:outline-none focus:border-[#4A90E2]"
                />
              </div>

              <div>
                <label className="text-[#a2a2b2] text-xs font-sora block mb-1">
                  Clínica <span className="text-[#555570]">(opcional)</span>
                </label>
                <select
                  value={addClinica}
                  onChange={e => setAddClinica(e.target.value)}
                  className="w-full bg-[#0D0D1A] border border-[rgba(74,144,226,0.25)] rounded-xl px-4 py-2.5 font-sora text-sm focus:outline-none focus:border-[#4A90E2]"
                  style={{ color: addClinica ? '#ffffff' : '#555570' }}
                >
                  <option value="">— Nenhuma —</option>
                  {clinicas.map(c => <option key={c} value={c} style={{ color: '#ffffff' }}>{c}</option>)}
                </select>
              </div>

              {addCat !== 'Outro' && (addSub || addNota) && (
                <div className="rounded-xl bg-[#0D0D1A] border border-[rgba(74,144,226,0.15)] px-4 py-2.5">
                  <p className="text-[10px] text-[#a2a2b2] font-sora mb-1">Prévia</p>
                  <p className="text-white text-sm font-sora">
                    {addNota.trim() ? `${addSub} — ${addNota.trim()}` : addSub}
                    {addClinica && <span className="text-[#a2a2b2]"> · {addClinica}</span>}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2.5 rounded-xl border border-[rgba(74,144,226,0.2)] text-[#a2a2b2] hover:text-white text-sm font-sora transition-all">
                Cancelar
              </button>
              <button
                onClick={handleAdd}
                disabled={(addCat === 'Outro' && !addNota.trim()) || saving}
                className="flex-1 py-2.5 rounded-xl text-white font-sora font-semibold text-sm transition-all disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #4A90E2, #6EC6FF)' }}
              >
                {saving ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Resumo */}
      {showResumo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-lg bg-[#12122A] rounded-2xl border border-[rgba(139,92,246,0.25)] p-6 space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between shrink-0">
              <h3 className="font-orbitron text-base font-bold text-white">Resumo da Semana</h3>
              <button onClick={() => setShowResumo(false)} className="text-[#a2a2b2] hover:text-white">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <pre className="text-white font-sora text-sm whitespace-pre-wrap leading-relaxed bg-[#0D0D1A] rounded-xl p-4 border border-[rgba(139,92,246,0.15)]">
                {resumo}
              </pre>
            </div>

            <div className="flex gap-3 shrink-0 pt-1">
              <button onClick={() => setShowResumo(false)} className="px-4 py-2.5 rounded-xl border border-[rgba(74,144,226,0.2)] text-[#a2a2b2] hover:text-white text-sm font-sora transition-all">
                Fechar
              </button>
              <button
                onClick={handleCopy}
                className="flex-1 py-2.5 rounded-xl text-white font-sora font-semibold text-sm transition-all"
                style={{ background: copied ? 'linear-gradient(135deg, #10B981, #34D399)' : 'linear-gradient(135deg, #6D28D9, #8B5CF6)' }}
              >
                {copied ? '✓ Copiado!' : 'Copiar para WhatsApp'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
