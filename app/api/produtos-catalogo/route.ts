import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { data, error } = await supabase
    .from('produtos_catalogo')
    .select('*')
    .order('ordem', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.nome?.trim()) return NextResponse.json({ error: 'Nome é obrigatório.' }, { status: 400 });

  const { data: last } = await supabase
    .from('produtos_catalogo')
    .select('ordem')
    .order('ordem', { ascending: false })
    .limit(1)
    .single();

  const ordem = (last?.ordem ?? 0) + 1;

  const { data, error } = await supabase
    .from('produtos_catalogo')
    .insert({ nome: body.nome.trim(), ordem })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}
