import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  let query = supabase.from('atividades').select('*').order('timestamp', { ascending: true });
  if (from) query = query.gte('data', from);
  if (to) query = query.lte('data', to);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ atividades: data ?? [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { categoria, descricao, data, origem, meta, clinica } = body;

  if (!categoria || !descricao) {
    return NextResponse.json({ error: 'Categoria e descrição são obrigatórias.' }, { status: 400 });
  }

  const metaFinal = clinica ? { ...(meta ?? {}), clinica } : (meta ?? null);

  const { data: row, error } = await supabase
    .from('atividades')
    .insert({
      categoria,
      descricao,
      data: data ?? new Date().toISOString().split('T')[0],
      origem: origem ?? 'manual',
      meta: metaFinal,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, atividade: row });
}
