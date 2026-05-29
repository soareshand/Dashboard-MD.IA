'use client';

import { useCallback, useEffect, useState } from 'react';
import { TabLoader, TabError } from './NpsTab';

interface Tarefa {
  id: string;
  texto: string;
  prioridade: 'Alta' | 'Média' | 'Baixa';
  fase: 'nao_iniciado' | 'iniciado' | 'concluido';
  created_at: string;
}

type Fase = Tarefa['fase'];
type Prioridade = Tarefa['prioridade'];

const COLUNAS: { id: Fase; label: string; color: string; bg: string; border: string }[] = [
  { id: 'nao_iniciado', label: 'Não Iniciado', color: '#A0A0B0', bg: 'rgba(160,160,176,0.04)', border: 'rgba(160,160,176,0.12)' },
  { id: 'iniciado',     label: 'Iniciado',     color: '#3B9EF5', bg: 'rgba(59,158,245,0.04)',  border: 'rgba(59,158,245,0.15)'  },
  { id: 'concluido',    label: 'Concluído',    color: '#22C55E', bg: 'rgba(34,197,94,0.04)',   border: 'rgba(34,197,94,0.15)'   },
];

const PRIORIDADE: Record<Prioridade, { color: string; bg: string }> = {
  Alta:  { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)'  },
  Média: { color: '#3B9EF5', bg: 'rgba(59,158,245,0.12)'  },
  Baixa: { color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)'  },
};

export default function TarefasTab() {
  const [tarefas, setTarefas]           = useState<Tarefa[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [showForm, setShowForm]         = useState(false);
  const [texto, setTexto]               = useState('');
  const [prioridade, setPrioridade]     = useState<Prioridade>('Média');
  const [saving, setSaving]             = useState(false);
  const [draggedId, setDraggedId]       = useState<string | null>(null);
  const [dragOverCol, setDragOverCol]   = useState<Fase | null>(null);
  const [deletingId, setDeletingId]     = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/tarefas');
      if (!res.ok) throw new Error('Erro ao carregar tarefas.');
      setTarefas(await res.json());
      setError('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleCreate() {
    if (!texto.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/tarefas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto, prioridade }),
      });
      if (!res.ok) throw new Error();
      const nova: Tarefa = await res.json();
      setTarefas(prev => [...prev, nova]);
      setTexto('');
      setPrioridade('Média');
      setShowForm(false);
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }

  async function moveTarefa(id: string, novaFase: Fase) {
    setTarefas(prev => prev.map(t => t.id === id ? { ...t, fase: novaFase } : t));
    try {
      await fetch(`/api/tarefas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fase: novaFase }),
      });
    } catch {
      fetchData();
    }
  }

  async function deleteTarefa(id: string) {
    setTarefas(prev => prev.filter(t => t.id !== id));
    setDeletingId(null);
    try {
      await fetch(`/api/tarefas/${id}`, { method: 'DELETE' });
    } catch {
      fetchData();
    }
  }

  function onDragStart(e: React.DragEvent, id: string) {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  }

  function onDragOver(e: React.DragEvent, fase: Fase) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(fase);
  }

  function onDrop(e: React.DragEvent, fase: Fase) {
    e.preventDefault();
    setDragOverCol(null);
    if (draggedId) {
      const t = tarefas.find(x => x.id === draggedId);
      if (t && t.fase !== fase) moveTarefa(draggedId, fase);
      setDraggedId(null);
    }
  }

  if (loading) return <TabLoader />;
  if (error)   return <TabError message={error} onRetry={fetchData} />;

  const total = tarefas.length;

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-orbitron text-base font-bold text-white">Tarefas</h2>
          <p className="text-xs text-[#A0A0B0] mt-0.5">{total} tarefa{total !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-glow px-4 py-2 rounded-xl text-white font-sora font-semibold text-sm"
        >
          + Nova Tarefa
        </button>
      </div>

      {/* Kanban board */}
      <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 pb-1">
      <div className="grid grid-cols-3 gap-4 min-w-[540px] sm:min-w-0">
        {COLUNAS.map(col => {
          const cards = tarefas.filter(t => t.fase === col.id);
          const isTarget = dragOverCol === col.id && draggedId !== null;
          return (
            <div
              key={col.id}
              onDragOver={e => onDragOver(e, col.id)}
              onDrop={e => onDrop(e, col.id)}
              onDragLeave={e => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverCol(null);
              }}
              className="rounded-xl border flex flex-col transition-all duration-150"
              style={{
                minHeight: 420,
                background: isTarget ? 'rgba(59,158,245,0.06)' : col.bg,
                borderColor: isTarget ? 'rgba(59,158,245,0.45)' : col.border,
                boxShadow: isTarget ? '0 0 0 1px rgba(59,158,245,0.2)' : 'none',
              }}
            >
              {/* Column header */}
              <div className="px-4 pt-4 pb-3 border-b border-[rgba(255,255,255,0.05)] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: col.color, boxShadow: `0 0 6px ${col.color}` }}
                  />
                  <span className="text-xs font-semibold font-sora" style={{ color: col.color }}>
                    {col.label}
                  </span>
                </div>
                <span className="text-xs font-mono text-[#555570] bg-[rgba(255,255,255,0.04)] px-2 py-0.5 rounded-full">
                  {cards.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 p-3 space-y-2.5">
                {cards.map(tarefa => {
                  const p = PRIORIDADE[tarefa.prioridade];
                  const isDragging  = draggedId   === tarefa.id;
                  const isConfirm   = deletingId  === tarefa.id;
                  return (
                    <div
                      key={tarefa.id}
                      draggable
                      onDragStart={e => onDragStart(e, tarefa.id)}
                      onDragEnd={() => { setDraggedId(null); setDragOverCol(null); }}
                      className={`group bg-[#0D0D20] border rounded-xl p-3.5 cursor-grab active:cursor-grabbing select-none transition-all ${
                        isDragging
                          ? 'opacity-35 border-[rgba(59,158,245,0.2)]'
                          : 'border-[rgba(59,158,245,0.1)] hover:border-[rgba(59,158,245,0.28)] hover:shadow-[0_0_18px_rgba(59,158,245,0.07)]'
                      }`}
                    >
                      <p className="text-sm text-white font-sora leading-relaxed mb-3">{tarefa.texto}</p>
                      <div className="flex items-center justify-between">
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full font-sora"
                          style={{ color: p.color, background: p.bg }}
                        >
                          {tarefa.prioridade}
                        </span>
                        <div className={`flex items-center gap-1 transition-opacity ${isConfirm ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                          {isConfirm ? (
                            <>
                              <button
                                onClick={() => deleteTarefa(tarefa.id)}
                                className="text-[10px] px-2 py-0.5 rounded-lg bg-[#F59E0B] text-[#08080F] font-semibold font-sora"
                              >
                                Confirmar
                              </button>
                              <button
                                onClick={() => setDeletingId(null)}
                                className="text-[10px] px-1.5 py-0.5 rounded text-[#A0A0B0] hover:text-white transition-colors"
                              >
                                ✕
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setDeletingId(tarefa.id)}
                              className="text-[#555570] hover:text-[#F59E0B] text-sm leading-none transition-colors w-5 h-5 flex items-center justify-center rounded hover:bg-[rgba(245,158,11,0.1)]"
                              title="Excluir tarefa"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {cards.length === 0 && (
                  <div
                    className="flex items-center justify-center rounded-xl border border-dashed transition-all"
                    style={{
                      height: 80,
                      borderColor: isTarget ? col.color : 'rgba(255,255,255,0.06)',
                      color: isTarget ? col.color : '#333355',
                      fontSize: 11,
                    }}
                  >
                    {isTarget ? 'Soltar aqui' : 'Sem tarefas'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      </div>

      {/* New task modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}
        >
          <div className="card-gradient-border w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-orbitron text-sm font-bold text-white">Nova Tarefa</h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-[#A0A0B0] hover:text-white text-xl transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#A0A0B0] mb-1.5 block">Descrição</label>
                <textarea
                  value={texto}
                  onChange={e => setTexto(e.target.value)}
                  placeholder="Descreva a tarefa…"
                  rows={3}
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleCreate(); }}
                  className="w-full bg-[#12122A] border border-[rgba(74,144,226,0.25)] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#4A90E2] transition-all resize-none"
                />
              </div>

              <div>
                <label className="text-xs text-[#A0A0B0] mb-2 block">Prioridade</label>
                <div className="flex gap-2">
                  {(['Alta', 'Média', 'Baixa'] as Prioridade[]).map(p => {
                    const conf = PRIORIDADE[p];
                    const active = prioridade === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPrioridade(p)}
                        className="flex-1 py-2 rounded-xl text-xs font-semibold font-sora transition-all border"
                        style={{
                          color: conf.color,
                          background: active ? conf.bg : 'transparent',
                          borderColor: active ? conf.color : 'rgba(74,144,226,0.15)',
                          boxShadow: active ? `0 0 12px ${conf.color}30` : 'none',
                        }}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              onClick={handleCreate}
              disabled={saving || !texto.trim()}
              className="w-full mt-5 py-3 rounded-xl btn-glow text-white font-sora font-semibold text-sm disabled:opacity-60"
            >
              {saving ? 'Salvando…' : 'Criar Tarefa'}
            </button>
            <p className="text-center text-[10px] text-[#555570] mt-2">Ctrl+Enter para salvar</p>
          </div>
        </div>
      )}
    </div>
  );
}
