import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function DELETE(req: NextRequest) {
  const sessao = req.nextUrl.searchParams.get('sessao');
  if (!sessao) {
    return NextResponse.json({ error: 'Sessão não informada.' }, { status: 400 });
  }
  try {
    const { error } = await supabase.from('presencas').delete().eq('sessao', sessao);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[presenca-sessao DELETE]', err);
    return NextResponse.json({ error: 'Erro ao excluir sessão.' }, { status: 500 });
  }
}
