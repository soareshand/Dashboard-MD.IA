import { NextRequest, NextResponse } from 'next/server';
import { deletePresencaSessao } from '@/lib/google-sheets';

export async function DELETE(req: NextRequest) {
  const sessao = req.nextUrl.searchParams.get('sessao');
  if (!sessao) {
    return NextResponse.json({ error: 'Sessão não informada.' }, { status: 400 });
  }
  try {
    await deletePresencaSessao(sessao);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[presenca-sessao DELETE]', err);
    return NextResponse.json({ error: 'Erro ao excluir sessão.' }, { status: 500 });
  }
}
