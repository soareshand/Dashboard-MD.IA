import { NextResponse } from 'next/server';
import { getPresencas, getMembros } from '@/lib/google-sheets';

export async function GET() {
  try {
    const [data, membros] = await Promise.all([getPresencas(), getMembros()]);

    // Build set of inactive doctor names (normalized) to filter out
    const inativos = new Set(
      membros
        .filter(m => m.situacao.toLowerCase().includes('inativo'))
        .map(m => m.nome.toLowerCase().trim())
    );

    const medicosAtivos = data.medicos.filter(
      m => !inativos.has(m.toLowerCase().trim())
    );

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
    });
  } catch (err) {
    console.error('[presenca-data]', err);
    return NextResponse.json({ error: 'Erro ao carregar dados de presença.' }, { status: 500 });
  }
}
