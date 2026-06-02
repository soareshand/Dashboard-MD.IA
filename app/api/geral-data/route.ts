import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const NOTA_KEYS = [
  'nota_mentorias_grupo', 'nota_academy', 'nota_agente_ia', 'nota_gerente_ia',
  'nota_automacoes', 'nota_dashboard', 'nota_crm', 'nota_treinamentos_crm',
  'nota_suporte_equipe', 'nota_mentoria_gestao',
] as const;

function buildLatestAvgMap(
  rows: Array<Record<string, unknown>>,
  keys: string[],
  keyField = 'nome'
): Map<string, number> {
  const latest = new Map<string, { ts: Date; avg: number }>();
  for (const r of rows) {
    const key = String(r[keyField] ?? '').trim();
    if (!key) continue;
    const ts = new Date(String(r.timestamp ?? 0));
    const existing = latest.get(key);
    if (!existing || ts > existing.ts) {
      const avg = keys.reduce((s, k) => s + (Number(r[k]) || 0), 0) / keys.length;
      latest.set(key, { ts, avg: Math.round(avg * 10) / 10 });
    }
  }
  const result = new Map<string, number>();
  latest.forEach((v, k) => result.set(k, v.avg));
  return result;
}

function calcScore(opts: {
  produtosAtivos: number; totalProdutos: number;
  npsMedia: number | null; taxaPresenca: number | null;
  contatoStatus: string | null; diasRenovacao: number | null;
  statusContrato: string | null;
}): number {
  let s = 0;
  // Produtos ativos: max 3 pts
  if (opts.totalProdutos > 0) s += (opts.produtosAtivos / opts.totalProdutos) * 3;
  // NPS: max 3 pts
  if (opts.npsMedia !== null) s += (opts.npsMedia / 5) * 3;
  // Presença: max 1 pt
  if (opts.taxaPresenca !== null) s += (opts.taxaPresenca / 100) * 1;
  // Contato: max 1 pt
  if (opts.contatoStatus === 'Em dia' || opts.contatoStatus === 'OK' || opts.contatoStatus === 'Atenção') s += 1;
  // Renovação: max 1 pt
  if (opts.diasRenovacao !== null) {
    if (opts.diasRenovacao > 90) s += 1;
    else if (opts.diasRenovacao > 60) s += 0.75;
    else if (opts.diasRenovacao > 30) s += 0.5;
    else if (opts.diasRenovacao > 0) s += 0.25;
  }
  // Contrato: max 1 pt — apenas Assinado ou Não precisa
  const sc = (opts.statusContrato ?? '').toLowerCase();
  if (sc === 'assinado' || sc === 'não precisa') s += 1;
  return Math.round(s * 10) / 10;
}

export async function GET() {
  try {
    const [
      { data: clientesRows },
      { data: presencaRows },
      { data: quizRows },
      { data: mensalMedicoRows },
      { data: mensalEquipeRows, error: equipeErr },
      { data: callRows, error: callErr },
      { data: treinaRows, error: treinaErr },
      { data: contatoRows },
      { data: catalogRows },
      { data: contratoRows },
      { data: renovacoesRows },
    ] = await Promise.all([
      supabase.from('clientes').select('id, nome, clinica, grupo, entrada, data_nascimento, produtos').eq('situacao', 'Ativo'),
      supabase.from('presencas').select('medico, sessao, status'),
      supabase.from('quiz_renovacao_responses').select('nome, timestamp, nota_mentorias_grupo, nota_academy, nota_agente_ia, nota_gerente_ia, nota_automacoes, nota_dashboard, nota_crm, nota_treinamentos_crm, nota_suporte_equipe, nota_mentoria_gestao'),
      supabase.from('quiz_mensal_medico_responses').select('nome, timestamp, nps'),
      supabase.from('quiz_mensal_equipe_responses').select('clinica, timestamp, nps'),
      supabase.from('quiz_call_responses').select('*'),
      supabase.from('quiz_treinamento_responses').select('*'),
      supabase.from('contatos').select('medico, proximo_contato'),
      supabase.from('produtos_catalogo').select('id, nome, ordem').order('ordem'),
      supabase.from('contratos').select('medico, status_contrato, created_at').order('created_at', { ascending: false }),
      supabase.from('renovacoes').select('medico, data, status_contrato').order('data', { ascending: false }),
    ]);

    // Most recent renewal date and status per medico (case-insensitive key)
    const latestRenovacaoMap = new Map<string, string>();
    const renovacaoStatusMap = new Map<string, string>();
    for (const r of (renovacoesRows ?? [])) {
      if (!r.data || !r.medico) continue;
      const key = r.medico.trim().toLowerCase();
      if (!latestRenovacaoMap.has(key)) {
        latestRenovacaoMap.set(key, r.data);
        if (r.status_contrato) renovacaoStatusMap.set(key, r.status_contrato);
      }
    }

    if (callErr) console.error('[geral-data] quiz_call_responses error:', callErr);
    if (treinaErr) console.error('[geral-data] quiz_treinamento_responses error:', treinaErr);
    if (equipeErr) console.error('[geral-data] quiz_mensal_equipe_responses error:', equipeErr);

    const clientes = clientesRows ?? [];
    const totalProdutos = (catalogRows ?? []).length;

    // Presença: count unique sessions and presences per medico
    const allSessoes = new Set((presencaRows ?? []).map(p => p.sessao as string));
    const totalSessoes = allSessoes.size;
    const presCount = new Map<string, number>();
    const medicosInPresenca = new Set<string>();
    for (const p of (presencaRows ?? [])) {
      medicosInPresenca.add(p.medico);
      if (p.status === 'Presente') {
        presCount.set(p.medico, (presCount.get(p.medico) ?? 0) + 1);
      }
    }
    const presencaByMedico = new Map<string, { presencas: number; taxa: number }>();
    medicosInPresenca.forEach(medico => {
      const count = presCount.get(medico) ?? 0;
      presencaByMedico.set(medico, {
        presencas: count,
        taxa: totalSessoes > 0 ? Math.round((count / totalSessoes) * 100) : 0,
      });
    });

    // Quiz: most recent average per medico, per quiz type
    const renovByMedico = buildLatestAvgMap(
      (quizRows ?? []) as Array<Record<string, unknown>>,
      [...NOTA_KEYS]
    );
    // Médico quiz uses nps (0-10) — scale to 0-5 for consistency
    const medicoByMedico = new Map<string, number>();
    {
      const latest = new Map<string, { ts: Date; nps: number }>();
      for (const r of (mensalMedicoRows ?? []) as Array<Record<string, unknown>>) {
        const nome = String(r.nome ?? '').trim();
        if (!nome) continue;
        const ts = new Date(String(r.timestamp ?? 0));
        const existing = latest.get(nome);
        if (!existing || ts > existing.ts) latest.set(nome, { ts, nps: Number(r.nps) || 0 });
      }
      latest.forEach((v, k) => medicoByMedico.set(k, Math.round(v.nps / 2 * 10) / 10));
    }
    const equipeByClinica = new Map<string, number>();
    {
      const latest = new Map<string, { ts: Date; nps: number }>();
      for (const r of (mensalEquipeRows ?? []) as Array<Record<string, unknown>>) {
        const clinicaKey = String(r.clinica ?? '').trim().toLowerCase();
        if (!clinicaKey) continue;
        const ts = new Date(String(r.timestamp ?? 0));
        const existing = latest.get(clinicaKey);
        if (!existing || ts > existing.ts) latest.set(clinicaKey, { ts, nps: Number(r.nps) || 0 });
      }
      latest.forEach((v, k) => equipeByClinica.set(k, Math.round(v.nps / 2 * 10) / 10));
    }
    const callAll = (callRows ?? []) as Array<Record<string, unknown>>;
    const callByMedico = buildLatestAvgMap(callAll, ['nota_call', 'nota_cs']);
    const callByClinica = buildLatestAvgMap(
      callAll.filter(r => String(r.respondente ?? '') === 'Equipe da clínica'),
      ['nota_call', 'nota_cs'],
      'clinica'
    );

    const treinaAll = (treinaRows ?? []) as Array<Record<string, unknown>>;
    const treinaByMedico = buildLatestAvgMap(treinaAll, ['nota_treinamento', 'nota_clareza']);
    const treinaByClinica = buildLatestAvgMap(
      treinaAll.filter(r => String(r.respondente ?? '') === 'Equipe da clínica'),
      ['nota_treinamento', 'nota_clareza'],
      'clinica'
    );

    // Contrato: most recent status per medico (already ordered by created_at desc)
    // Keys are lowercased to allow case-insensitive matching with clientes.nome
    const contratoByMedico = new Map<string, string>();
    for (const c of (contratoRows ?? []) as Array<Record<string, unknown>>) {
      const nome = String(c.medico ?? '').trim().toLowerCase();
      if (nome && !contratoByMedico.has(nome)) {
        contratoByMedico.set(nome, String(c.status_contrato ?? ''));
      }
    }

    // Contato status per medico (computed from proximo_contato)
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const contatoByMedico = new Map<string, string>();
    for (const c of (contatoRows ?? [])) {
      if (!c.proximo_contato) continue;
      const proximo = new Date(c.proximo_contato + 'T00:00:00');
      const diff = Math.ceil((proximo.getTime() - hoje.getTime()) / 86400000);
      const status = diff < 0 ? 'Crítico' : diff <= 3 ? 'Atenção' : 'Em dia';
      contatoByMedico.set(c.medico, status);
    }

    const mesAtual = hoje.getMonth() + 1;
    const diaAtual = hoje.getDate();

    const cards = clientes.map(m => {
      const produtosMap = (m.produtos ?? {}) as Record<string, boolean>;
      const produtosAtivos = Object.values(produtosMap).filter(Boolean).length;

      let diasRenovacao: number | null = null;
      if (m.entrada) {
        const renovStr = latestRenovacaoMap.get(m.nome.trim().toLowerCase());
        const baseStr = renovStr && renovStr > m.entrada ? renovStr : m.entrada;
        const base = new Date(baseStr + 'T00:00:00');
        const renov = new Date(base.getFullYear() + 1, base.getMonth(), base.getDate());
        diasRenovacao = Math.ceil((renov.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      }

      const partsNasc = (m.data_nascimento ?? '').split('-');
      const isAniversariante = partsNasc.length === 3 && parseInt(partsNasc[1]) === mesAtual;
      const isAniversarioHoje = isAniversariante && parseInt(partsNasc[2]) === diaAtual;

      const presenca = presencaByMedico.get(m.nome);
      const contatoStatus = contatoByMedico.get(m.nome) ?? null;
      const key = m.nome.trim().toLowerCase();
      const statusContrato = renovacaoStatusMap.get(key) ?? contratoByMedico.get(key) ?? null;

      const npsRenovacao = renovByMedico.get(m.nome) ?? null;
      const npsMedico = medicoByMedico.get(m.nome) ?? null;
      const clinicaNorm = m.clinica?.trim().toLowerCase() ?? '';
      const npsEquipe = clinicaNorm ? (equipeByClinica.get(clinicaNorm) ?? null) : null;
      const npsCall = callByMedico.get(m.nome) ?? (clinicaNorm ? callByClinica.get(m.clinica!) : null) ?? null;
      const npsTreinamento = treinaByMedico.get(m.nome) ?? (clinicaNorm ? treinaByClinica.get(m.clinica!) : null) ?? null;

      const availableNps = [npsRenovacao, npsMedico, npsEquipe, npsCall, npsTreinamento].filter((v): v is number => v !== null);
      const npsMedia = availableNps.length > 0
        ? Math.round((availableNps.reduce((s, v) => s + v, 0) / availableNps.length) * 10) / 10
        : null;

      const score = calcScore({
        produtosAtivos, totalProdutos,
        npsMedia, taxaPresenca: presenca?.taxa ?? null,
        contatoStatus, diasRenovacao, statusContrato,
      });

      return {
        id: m.id,
        nome: m.nome,
        clinica: m.clinica,
        grupo: m.grupo,
        entrada: m.entrada,
        produtosAtivos,
        produtos: produtosMap,
        npsMedia,
        npsRenovacao,
        npsMedico,
        npsEquipe,
        npsCall,
        npsTreinamento,
        presencas: presenca?.presencas ?? null,
        taxaPresenca: presenca?.taxa ?? null,
        contatoStatus,
        statusContrato,
        diasRenovacao,
        score,
        isAniversariante,
        isAniversarioHoje,
      };
    }).sort((a, b) => b.score - a.score);

    return NextResponse.json({ cards, totalProdutos, catalog: catalogRows ?? [] });
  } catch (err) {
    console.error('[geral-data]', err);
    return NextResponse.json({ error: 'Erro ao carregar dados gerais.' }, { status: 500 });
  }
}
