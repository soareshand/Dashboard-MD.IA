import { NextResponse } from 'next/server';
import { getResgate } from '@/lib/google-sheets';

export async function GET() {
  try {
    const resgate = await getResgate();

    const total = resgate.length;
    const responderam = resgate.filter(r => r.respondeu.toUpperCase().startsWith('S')).length;
    const marcouCall = resgate.filter(r => r.marcouCall.toUpperCase().startsWith('S')).length;

    return NextResponse.json({
      kpis: { total, responderam, marcouCall, naoResponderam: total - responderam },
      resgate,
    });
  } catch (err) {
    console.error('[resgate-data]', err);
    return NextResponse.json({ error: 'Erro ao carregar dados de resgate.' }, { status: 500 });
  }
}
