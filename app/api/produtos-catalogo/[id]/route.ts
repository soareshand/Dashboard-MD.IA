import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  if (!body.nome?.trim()) return NextResponse.json({ error: 'Nome é obrigatório.' }, { status: 400 });

  const update: Record<string, unknown> = { nome: body.nome.trim() };
  if (body.ordem != null) update.ordem = body.ordem;

  const { data, error } = await supabase
    .from('produtos_catalogo')
    .update(update)
    .eq('id', params.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await supabase
    .from('produtos_catalogo')
    .delete()
    .eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
