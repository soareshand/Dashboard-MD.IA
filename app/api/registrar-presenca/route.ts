import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { data, presencas } = await req.json();
    if (!data || !presencas) {
      return NextResponse.json({ error: 'data e presencas são obrigatórios.' }, { status: 400 });
    }

    const rows = Object.entries(presencas as Record<string, 'Presente' | 'Faltou'>).map(
      ([medico, status]) => ({ medico, sessao: data, status })
    );

    const { error } = await supabase
      .from('presencas')
      .upsert(rows, { onConflict: 'medico,sessao' });

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[registrar-presenca]', err);
    return NextResponse.json({ error: 'Erro ao registrar presença.' }, { status: 500 });
  }
}
