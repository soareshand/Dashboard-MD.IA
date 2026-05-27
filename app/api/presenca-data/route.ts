import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [{ data: presencaRows }, { data: clientesRows }] = await Promise.all([
      supabase.from('presencas').select('medico, sessao, status'),
      supabase.from('clientes').select('nome, situacao'),
    ]);

    const medicosAtivos = (clientesRows ?? [])
      .filter(m => m.situacao === 'Ativo')
      .map(m => m.nome)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'));

    const grid: Record<string, Record<string, string>> = {};
    const sessoesSet = new Set<string>();

    for (const row of (presencaRows ?? [])) {
      sessoesSet.add(row.sessao);
      if (!grid[row.medico]) grid[row.medico] = {};
      grid[row.medico][row.sessao] = row.status;
    }

    const sessoes = Array.from(sessoesSet).sort((a, b) => {
      const [da, ma, ya] = a.split('/').map(Number);
      const [db, mb, yb] = b.split('/').map(Number);
      return new Date(ya, ma - 1, da).getTime() - new Date(yb, mb - 1, db).getTime();
    });

    const totalSessoes = sessoes.length;

    const medicoStats = medicosAtivos.map(medico => {
      const presencas = sessoes.filter(s => grid[medico]?.[s] === 'Presente').length;
      const faltas = sessoes.filter(s => grid[medico]?.[s] === 'Faltou').length;
      const taxa = totalSessoes > 0 ? Math.round((presencas / totalSessoes) * 100) : 0;
      return { medico, presencas, faltas, taxa };
    });

    const taxaGeral = medicoStats.length > 0
      ? Math.round(medicoStats.reduce((s, m) => s + m.taxa, 0) / medicoStats.length)
      : 0;

    const recentSessoes = sessoes.slice(-6).reverse().map(sessao => {
      const presentes = medicosAtivos.filter(m => grid[m]?.[sessao] === 'Presente').length;
      const faltaram = medicosAtivos.filter(m => grid[m]?.[sessao] === 'Faltou').length;
      return { sessao, presentes, faltaram, total: presentes + faltaram };
    });

    return NextResponse.json({
      kpis: { taxaGeral, totalSessoes, totalMedicos: medicosAtivos.length },
      medicoStats: medicoStats.sort((a, b) => b.taxa - a.taxa),
      recentSessoes,
      medicos: medicosAtivos,
      sessoes,
      grid,
    });
  } catch (err) {
    console.error('[presenca-data]', err);
    return NextResponse.json({ error: 'Erro ao carregar dados de presença.' }, { status: 500 });
  }
}
