'use client';

import { useEffect, useState } from 'react';

interface GenerateLinkModalProps {
  onClose: () => void;
}

type QuizType = 'renovacao' | 'call' | 'treinamento';
type Genero = 'Dr.' | 'Dra.';

const TABS: { id: QuizType; label: string; icon: string }[] = [
  { id: 'renovacao', label: 'Renovação', icon: '📋' },
  { id: 'call', label: 'Pós-Call', icon: '📞' },
  { id: 'treinamento', label: 'Pós-Treinamento', icon: '🎓' },
];

const TIPOS_CALL = ['Onboarding', 'Ongoing', 'Suporte', 'Análise'];

export default function GenerateLinkModal({ onClose }: GenerateLinkModalProps) {
  const [quizType, setQuizType] = useState<QuizType>('renovacao');
  const [nome, setNome] = useState('');
  const [genero, setGenero] = useState<Genero>('Dr.');
  const [clinica, setClinica] = useState('');
  const [tipoCall, setTipoCall] = useState('');
  const [ferramenta, setFerramenta] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ quizUrl: string } | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [medicosAtivos, setMedicosAtivos] = useState<string[]>([]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    fetch('/api/clientes-data')
      .then(r => r.json())
      .then(d => {
        const ativos = (d.membros ?? [])
          .filter((m: { situacao: string }) => m.situacao === 'Ativo')
          .map((m: { nome: string }) => m.nome)
          .sort((a: string, b: string) => a.localeCompare(b, 'pt-BR'));
        setMedicosAtivos(ativos);
      })
      .catch(() => {});
  }, []);

  function reset() {
    setResult(null);
    setNome('');
    setClinica('');
    setTipoCall('');
    setFerramenta('');
    setError('');
    setCopied(false);
    setCopiedMsg(false);
  }

  function handleTabChange(tab: QuizType) {
    setQuizType(tab);
    setNome('');
    setError('');
    setResult(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const meta = quizType === 'call' ? tipoCall : quizType === 'treinamento' ? ferramenta : '';
      const res = await fetch('/api/generate-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, clinica, quizType, meta, email: '', enviarEmail: false }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erro ao gerar link.');
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido.');
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!result) return;
    navigator.clipboard.writeText(result.quizUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function getPrimeiroNome(n: string): string {
    return n.trim().replace(/^Dr(?:a)?\.?\s*/i, '').split(' ')[0];
  }

  function buildWhatsAppMessage(url: string): string {
    const saudacao = `${genero} ${getPrimeiroNome(nome)}`;
    if (quizType === 'call') {
      return `Olá, ${saudacao}! 👋\n\nObrigado pela disponibilidade na nossa call! Adoraríamos saber sua opinião sobre ela.\n\nPreparamos um formulário rápido — leva menos de 2 minutinhos. Sua avaliação é essencial para melhorarmos cada vez mais! 🙏\n\n🔗 ${url}`;
    }
    if (quizType === 'treinamento') {
      const tool = ferramenta.trim() || 'a ferramenta';
      return `Olá, ${saudacao}! 👋\n\nObrigado pela disponibilidade no treinamento de ${tool}! Queremos saber como foi a sua experiência.\n\nPreparamos um formulário rápido — leva menos de 2 minutinhos. Sua avaliação nos ajuda a oferecer treinamentos cada vez melhores! 🙏\n\n🔗 ${url}`;
    }
    return `Olá, ${saudacao}! Tudo bem?\n\nPassando para avisar que a sua mentoria da MD.IA já está chegando ao fim. Preparei um formulário onde gostaríamos de ouvir a sua experiência ao longo da jornada — seus objetivos, resultados percebidos, avaliação das ferramentas e mentorias, além da intenção de renovação.\n\nSegue o link: ${url}\n\nO seu retorno é muito importante para nós e nos ajuda a evoluir cada vez mais. Qualquer dúvida, estou à disposição. Muito obrigado!`;
  }

  function handleCopyMsg() {
    if (!result) return;
    navigator.clipboard.writeText(buildWhatsAppMessage(result.quizUrl));
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2000);
  }

  const metaValid =
    quizType === 'renovacao' ||
    (quizType === 'call' && tipoCall !== '') ||
    (quizType === 'treinamento' && ferramenta.trim() !== '');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="card-gradient-border w-full max-w-md p-6 animate-fade-up">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-orbitron text-base font-bold text-white">Gerar Link do Quiz</h3>
          <button onClick={onClose} className="text-[#A0A0B0] hover:text-white text-xl transition-colors">✕</button>
        </div>

        {/* Type tabs */}
        <div className="flex gap-1 bg-[#0D0D1A] rounded-xl p-1 mb-5">
          {TABS.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-sora transition-all ${
                quizType === tab.id ? 'text-white shadow-md' : 'text-[#A0A0B0] hover:text-white'
              }`}
              style={quizType === tab.id ? { background: 'linear-gradient(135deg, #3B9EF5, #8B5CF6)' } : {}}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {!result ? (
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Dr./Dra. + Nome */}
            <div>
              <label className="text-xs text-[#A0A0B0] mb-1.5 block">Nome do médico *</label>
              <div className="flex gap-2">
                {/* Gender toggle */}
                <div className="flex rounded-xl overflow-hidden border border-[rgba(59,158,245,0.25)] shrink-0">
                  {(['Dr.', 'Dra.'] as Genero[]).map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGenero(g)}
                      className={`px-3 py-2.5 text-xs font-sora font-semibold transition-all ${
                        genero === g ? 'text-white' : 'bg-[#12122A] text-[#A0A0B0] hover:text-white'
                      }`}
                      style={genero === g ? { background: 'linear-gradient(135deg, #3B9EF5, #8B5CF6)' } : {}}
                    >
                      {g}
                    </button>
                  ))}
                </div>

                {/* Name: dropdown for renovacao, text input for others */}
                {quizType === 'renovacao' ? (
                  <select
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                    required
                    className="flex-1 bg-[#12122A] border border-[rgba(59,158,245,0.25)] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#3B9EF5] transition-all appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-[#12122A] text-[#A0A0B0]">Selecione o médico…</option>
                    {medicosAtivos.map(m => (
                      <option key={m} value={m} className="bg-[#12122A]">{m}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                    required
                    placeholder="Nome Sobrenome"
                    className="flex-1 bg-[#12122A] border border-[rgba(59,158,245,0.25)] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#3B9EF5] transition-all"
                  />
                )}
              </div>
            </div>

            <div>
              <label className="text-xs text-[#A0A0B0] mb-1.5 block">Clínica *</label>
              <input
                value={clinica} onChange={e => setClinica(e.target.value)} required
                placeholder="Nome da clínica"
                className="w-full bg-[#12122A] border border-[rgba(59,158,245,0.25)] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#3B9EF5] transition-all"
              />
            </div>

            {quizType === 'call' && (
              <div>
                <label className="text-xs text-[#A0A0B0] mb-1.5 block">Tipo de call *</label>
                <div className="flex flex-wrap gap-2">
                  {TIPOS_CALL.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTipoCall(t)}
                      className={`px-3 py-2 rounded-xl text-sm font-sora transition-all border ${
                        tipoCall === t
                          ? 'text-white border-transparent shadow-[0_0_10px_rgba(59,158,245,0.3)]'
                          : 'bg-[#12122A] text-[#A0A0B0] border-[rgba(59,158,245,0.2)] hover:border-[#3B9EF5] hover:text-white'
                      }`}
                      style={tipoCall === t ? { background: 'linear-gradient(135deg, #3B9EF5, #8B5CF6)' } : {}}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {quizType === 'treinamento' && (
              <div>
                <label className="text-xs text-[#A0A0B0] mb-1.5 block">Ferramenta treinada *</label>
                <input
                  value={ferramenta} onChange={e => setFerramenta(e.target.value)}
                  placeholder="Ex: Secretária IA, CRM InfiniteGear…"
                  className="w-full bg-[#12122A] border border-[rgba(139,92,246,0.3)] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#8B5CF6] transition-all"
                />
              </div>
            )}

            {error && <p className="text-red-400 text-xs">{error}</p>}

            <button
              type="submit"
              disabled={loading || !metaValid}
              className="w-full py-3 rounded-xl btn-glow text-white font-sora font-semibold text-sm disabled:opacity-60"
            >
              {loading ? 'Gerando…' : `Gerar Link — ${TABS.find(t => t.id === quizType)?.label}`}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[#1B4332] border border-green-700/30">
              <span className="text-2xl">✅</span>
              <div>
                <p className="text-green-400 font-medium text-sm">Link gerado!</p>
                <p className="text-green-300/70 text-xs mt-0.5">
                  {TABS.find(t => t.id === quizType)?.icon}{' '}
                  {TABS.find(t => t.id === quizType)?.label}
                  {quizType === 'call' && tipoCall ? ` · ${tipoCall}` : ''}
                  {quizType === 'treinamento' && ferramenta ? ` · ${ferramenta}` : ''}
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs text-[#A0A0B0] mb-1.5 block">Link do formulário</label>
              <div className="flex gap-2">
                <input
                  value={result.quizUrl}
                  readOnly
                  className="flex-1 bg-[#12122A] border border-[rgba(59,158,245,0.25)] rounded-xl px-3 py-2 text-[#93C5FD] text-xs font-mono focus:outline-none"
                />
                <button
                  onClick={handleCopy}
                  className="px-3 py-2 rounded-xl border border-[rgba(59,158,245,0.3)] text-[#A0A0B0] hover:text-white hover:border-[#3B9EF5] text-xs transition-all flex-shrink-0"
                >
                  {copied ? '✓' : '📋'}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-[#A0A0B0] mb-1.5 block">Mensagem para WhatsApp</label>
              <div className="relative">
                <pre className="w-full bg-[#0D0D1A] border border-[rgba(59,158,245,0.2)] rounded-xl px-3 py-3 text-[#C0C0D0] text-xs font-sans leading-relaxed whitespace-pre-wrap break-words">
                  {result && buildWhatsAppMessage(result.quizUrl)}
                </pre>
                <button
                  onClick={handleCopyMsg}
                  className="absolute top-2 right-2 px-2.5 py-1.5 rounded-lg bg-[#12122A] border border-[rgba(59,158,245,0.3)] text-[#A0A0B0] hover:text-white hover:border-[#3B9EF5] text-xs transition-all flex items-center gap-1"
                >
                  {copiedMsg ? '✓ Copiado' : '📋 Copiar'}
                </button>
              </div>
            </div>

            <button
              onClick={reset}
              className="w-full py-2 text-[#A0A0B0] hover:text-white text-xs transition-colors"
            >
              Gerar outro link
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
