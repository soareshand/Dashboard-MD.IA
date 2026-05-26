import { NextRequest, NextResponse } from 'next/server';
import { registrarPresenca } from '@/lib/google-sheets';

export async function POST(req: NextRequest) {
  try {
    const { data, presencas } = await req.json();
    if (!data || !presencas) {
      return NextResponse.json({ error: 'data e presencas são obrigatórios.' }, { status: 400 });
    }
    await registrarPresenca(data, presencas);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[registrar-presenca]', err);
    return NextResponse.json({ error: 'Erro ao registrar presença.' }, { status: 500 });
  }
}
