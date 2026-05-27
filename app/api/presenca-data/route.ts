import { NextResponse } from 'next/server';
import { getPresencas } from '@/lib/google-sheets';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [data, { data: clientesRows }] = await Promise.all([
      getPresencas(),
      supabase.from('clientes').select('nome, situacao'),
    ]);

    // Use ALL active Supabase members as the base list (source of truth)
    const medicosAtivos = (clientesRows ?? [])
      .filter(m => m.situacao === 'Ativo')
      .map(m => m.nome)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'));

    const totalSessoes = data.sessoes.length;

    const medicoStats = medicosAtivos.map(medico => {
      const presencas = data.sessoes.filter(s => data.grid[medico]?.[s] === 'Presente').length;
      const faltas = data.sessoes.filter(s => data.grid[medico]?.[s] === 'Faltou').length;
      const taxa = totalSessoes > 0 ? Math.round((presencas / totalSessoes) * 100) : 0;
      return { medico, presencas, faltas, taxa };
    });

    const taxaGeral = medicoStats.length > 0
      ? Math.round(medicoStats.reduce((s, m) => s + m.taxa, 0) / medicoStats.length)
      : 0;

    const recentSessoes = data.sessoes.slice(-6).reverse().map(sessao => {
      const presentes = medicosAtivos.filter(m => data.grid[m]?.[sessao] === 'Presente').length;
      const faltaram = medicosAtivos.filter(m => data.grid[m]?.[sessao] === 'Faltou').length;
      return { sessao, presentes, faltaram, total: presentes + faltaram };
    });

    return NextResponse.json({
      kpis: { taxaGeral, totalSessoes, totalMedicos: medicosAtivos.length },
      medicoStats: medicoStats.sort((a, b) => b.taxa - a.taxa),
      recentSessoes,
      medicos: medicosAtivos,
      sessoes: data.sessoes,
      grid: data.grid,
    });
  } catch (err) {
    console.error('[presenca-data]', err);
    return NextResponse.json({ error: 'Erro ao carregar dados de presença.' }, { status: 500 });
  }
}
