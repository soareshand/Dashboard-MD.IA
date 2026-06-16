import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

function ddmmyyyyToISO(ddmmyyyy: string): string {
  const [d, m, y] = ddmmyyyy.split('/');
  return `${y}-${m}-${d}`;
}

export async function POST(req: NextRequest) {
  try {
    const { data, presencas } = await req.json();
    if (!data || !presencas) {
      return NextResponse.json({ error: 'data e presencas são obrigatórios.' }, { status: 400 });
    }

    const isoDate = ddmmyyyyToISO(data);

    // Delete all existing rows for this session before inserting to avoid duplicates
    const { error: delError } = await supabase
      .from('presencas')
      .delete()
      .eq('sessao', isoDate);
    if (delError) throw delError;

    const rows = Object.entries(presencas as Record<string, 'Presente' | 'Faltou'>).map(
      ([medico, status]) => ({ medico, sessao: isoDate, status })
    );

    const { error } = await supabase.from('presencas').insert(rows);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[registrar-presenca]', err);
    return NextResponse.json({ error: 'Erro ao registrar presença.' }, { status: 500 });
  }
}
