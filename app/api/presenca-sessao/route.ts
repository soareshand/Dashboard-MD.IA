import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

function ddmmyyyyToISO(ddmmyyyy: string): string {
  const [d, m, y] = ddmmyyyy.split('/');
  return `${y}-${m}-${d}`;
}

export async function DELETE(req: NextRequest) {
  const sessao = req.nextUrl.searchParams.get('sessao');
  if (!sessao) {
    return NextResponse.json({ error: 'Sessão não informada.' }, { status: 400 });
  }
  try {
    const { error } = await supabase.from('presencas').delete().eq('sessao', ddmmyyyyToISO(sessao));
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[presenca-sessao DELETE]', err);
    return NextResponse.json({ error: 'Erro ao excluir sessão.' }, { status: 500 });
  }
}
