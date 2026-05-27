import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const { error } = await supabase
      .from('presencas')
      .delete()
      .in('status', ['Presente', 'Faltou']);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[presenca-clear]', err);
    return NextResponse.json({ error: 'Erro ao limpar dados de presença.' }, { status: 500 });
  }
}
