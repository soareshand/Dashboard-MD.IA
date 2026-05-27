import { NextResponse } from 'next/server';
import { clearPresencas } from '@/lib/google-sheets';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    await clearPresencas();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[presenca-clear]', err);
    return NextResponse.json({ error: 'Erro ao limpar dados de presença.' }, { status: 500 });
  }
}
