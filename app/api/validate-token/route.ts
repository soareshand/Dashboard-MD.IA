import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/google-sheets';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) return NextResponse.json({ valid: false, error: 'Token não fornecido.' });

  try {
    const row = await getToken(token);
    if (!row) return NextResponse.json({ valid: false, error: 'Token não encontrado.' });
    if (row.status === 'respondido') return NextResponse.json({ valid: false, error: 'Este link já foi utilizado.' });
    return NextResponse.json({ valid: true, nome: row.nome, clinica: row.clinica, email: row.email });
  } catch (err) {
    console.error('[validate-token]', err);
    return NextResponse.json({ valid: false, error: 'Erro ao validar token.' }, { status: 500 });
  }
}
