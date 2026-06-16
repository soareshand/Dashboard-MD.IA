import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

function isoToDdMmYyyy(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export async function GET() {
  try {
    const [{ data: presencaRows }, { data: clientesRows }] = await Promise.all([
      supabase.from('presencas').select('medico, sessao, status').order('sessao', { ascending: true }).order('id', { ascending: true }).limit(10000),
      supabase.from('clientes').select('nome, situacao'),
    ]);

    const medicosAtivos = (clientesRows ?? [])
      .filter(m => m.situacao === 'Ativo')
      .map(m => m.nome.trim())
      .sort((a, b) => a.localeCompare(b, 'pt-BR'));

    // Case-insensitive map: normalized name → canonical clientes name
    const normToCanonical: Record<string, string> = {};
    for (const nome of medicosAtivos) {
      normToCanonical[nome.toLowerCase()] = nome;
    }

    const grid: Record<string, Record<string, string>> = {};
    const sessoesOrdenadas: string[] = [];
    const sessoesSet = new Set<string>();

    for (const row of (presencaRows ?? [])) {
      const sessao = isoToDdMmYyyy(row.sessao);
      // Resolve presencas.medico to the canonical clientes name (case-insensitive)
      const normKey = row.medico.trim().toLowerCase();
      const canonicalKey = normToCanonical[normKey] ?? row.medico.trim();
      if (!sessoesSet.has(sessao)) {
        sessoesSet.add(sessao);
        sessoesOrdenadas.push(sessao);
      }
      if (!grid[canonicalKey]) grid[canonicalKey] = {};
      grid[canonicalKey][sessao] = row.status;
    }

    const totalSessoes = sessoesOrdenadas.length;

    const medicoStats = medicosAtivos.map(medico => {
      const presencas = sessoesOrdenadas.filter(s => grid[medico]?.[s] === 'Presente').length;
      const faltas = sessoesOrdenadas.filter(s => grid[medico]?.[s] === 'Faltou').length;
      const taxa = totalSessoes > 0 ? Math.round((presencas / totalSessoes) * 100) : 0;
      return { medico, presencas, faltas, taxa };
    });

    const taxaGeral = medicoStats.length > 0
      ? Math.round(medicoStats.reduce((s, m) => s + m.taxa, 0) / medicoStats.length)
      : 0;

    const recentSessoes = sessoesOrdenadas.slice(-6).reverse().map(sessao => {
      const presentes = medicosAtivos.filter(m => grid[m]?.[sessao] === 'Presente').length;
      const faltaram = medicosAtivos.filter(m => grid[m]?.[sessao] === 'Faltou').length;
      return { sessao, presentes, faltaram, total: presentes + faltaram };
    });

    return NextResponse.json({
      kpis: { taxaGeral, totalSessoes, totalMedicos: medicosAtivos.length },
      medicoStats: medicoStats.sort((a, b) => b.taxa - a.taxa),
      recentSessoes,
      medicos: medicosAtivos,
      sessoes: sessoesOrdenadas,
      grid,
    });
  } catch (err) {
    console.error('[presenca-data]', err);
    return NextResponse.json({ error: 'Erro ao carregar dados de presença.' }, { status: 500 });
  }
}
