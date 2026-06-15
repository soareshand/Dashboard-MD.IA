import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const DIAS_ORDEM = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
const DIA_INDEX: Record<number, string> = { 1: 'Segunda-feira', 2: 'Terça-feira', 3: 'Quarta-feira', 4: 'Quinta-feira', 5: 'Sexta-feira', 6: 'Sábado', 0: 'Domingo' };

interface Atividade {
  data: string;
  categoria: string;
  descricao: string;
}

export async function POST(req: NextRequest) {
  const { atividades, semana } = await req.json() as { atividades: Atividade[]; semana: string };

  if (!atividades || atividades.length === 0) {
    return NextResponse.json({ error: 'Nenhuma atividade para gerar resumo.' }, { status: 400 });
  }

  // Agrupa por dia da semana
  const byDay: Record<string, Atividade[]> = {};
  for (const a of atividades) {
    const d = new Date(a.data + 'T12:00:00');
    const dayName = DIA_INDEX[d.getDay()];
    if (!byDay[dayName]) byDay[dayName] = [];
    byDay[dayName].push(a);
  }

  // Contagem por categoria
  const catCount: Record<string, number> = {};
  for (const a of atividades) {
    catCount[a.categoria] = (catCount[a.categoria] ?? 0) + 1;
  }
  const catResumo = Object.entries(catCount)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, n]) => `${cat}: ${n}`)
    .join(' | ');

  // Monta o texto
  const linhas: string[] = [];
  linhas.push(`📊 *Relatório CS — Semana ${semana}*`);
  linhas.push('');

  for (const dia of DIAS_ORDEM) {
    const items = byDay[dia];
    if (!items || items.length === 0) continue;
    linhas.push(`*${dia}*`);
    for (const a of items) {
      linhas.push(`• ${a.descricao}`);
    }
    linhas.push('');
  }

  linhas.push(`📌 *Resumo*`);
  linhas.push(`• ${catResumo}`);
  linhas.push(`• Total: ${atividades.length} ${atividades.length === 1 ? 'atividade' : 'atividades'} na semana`);

  return NextResponse.json({ resumo: linhas.join('\n') });
}
