import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('tarefas')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error('[tarefas GET]', err);
    return NextResponse.json({ error: 'Erro ao carregar tarefas.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { texto, prioridade } = await req.json();
    if (!texto?.trim() || !prioridade) {
      return NextResponse.json({ error: 'texto e prioridade são obrigatórios.' }, { status: 400 });
    }
    const { data, error } = await supabase
      .from('tarefas')
      .insert({ texto: texto.trim(), prioridade, fase: 'nao_iniciado' })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    console.error('[tarefas POST]', err);
    return NextResponse.json({ error: 'Erro ao criar tarefa.' }, { status: 500 });
  }
}
