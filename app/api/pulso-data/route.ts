import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const MEDICO_INTERVAL_DAYS = 85;
const EQUIPE_INTERVAL_DAYS = 25;

function diasDesde(hoje: Date, d: Date): number {
  return Math.floor((hoje.getTime() - d.getTime()) / 86400000);
}

export async function GET() {
  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const [
      { data: clientes },
      { data: tokensMedico },
      { data: tokensEquipe },
      { data: recentMedico },
      { data: recentEquipe },
    ] = await Promise.all([
      supabase.from('clientes').select('nome, clinica').eq('situacao', 'Ativo'),
      supabase.from('tokens').select('cliente_nome, clinica, created_at').eq('quiz_type', 'mensal_medico').order('created_at', { ascending: false }),
      supabase.from('tokens').select('clinica, created_at').eq('quiz_type', 'mensal_equipe').order('created_at', { ascending: false }),
      supabase.from('quiz_mensal_medico_responses').select('*').order('timestamp', { ascending: false }).limit(10),
      supabase.from('quiz_mensal_equipe_responses').select('*').order('timestamp', { ascending: false }).limit(10),
    ]);

    const activeClientes = clientes ?? [];

    // Latest medico token per doctor (by nome)
    const latestMedico = new Map<string, Date>();
    for (const t of (tokensMedico ?? [])) {
      if (!latestMedico.has(t.cliente_nome)) {
        latestMedico.set(t.cliente_nome, new Date(t.created_at));
      }
    }

    // Latest equipe token per clinic
    const latestEquipe = new Map<string, Date>();
    for (const t of (tokensEquipe ?? [])) {
      const key = t.clinica ?? '';
      if (key && !latestEquipe.has(key)) {
        latestEquipe.set(key, new Date(t.created_at));
      }
    }

    // Médico due list — one entry per active doctor
    const dueMedico = activeClientes
      .map(m => {
        const last = latestMedico.get(m.nome);
        const diasSemEnvio = last ? diasDesde(hoje, last) : null;
        const due = !last || diasSemEnvio! >= MEDICO_INTERVAL_DAYS;
        return { nome: m.nome, clinica: m.clinica ?? '', diasSemEnvio, ultimoEnvio: last ? last.toISOString().split('T')[0] : null, due };
      })
      .filter(d => d.due)
      .sort((a, b) => (b.diasSemEnvio ?? 9999) - (a.diasSemEnvio ?? 9999));

    // Equipe due list — one entry per unique clinic
    const clinicasUnicas = Array.from(new Set(
      activeClientes.map(m => m.clinica).filter((c): c is string => Boolean(c))
    ));

    const dueEquipe = clinicasUnicas
      .map(clinica => {
        const last = latestEquipe.get(clinica);
        const diasSemEnvio = last ? diasDesde(hoje, last) : null;
        const due = !last || diasSemEnvio! >= EQUIPE_INTERVAL_DAYS;
        return { clinica, diasSemEnvio, ultimoEnvio: last ? last.toISOString().split('T')[0] : null, due };
      })
      .filter(d => d.due)
      .sort((a, b) => (b.diasSemEnvio ?? 9999) - (a.diasSemEnvio ?? 9999));

    return NextResponse.json({
      dueMedico,
      dueEquipe,
      recentMedico: recentMedico ?? [],
      recentEquipe: recentEquipe ?? [],
    });
  } catch (err) {
    console.error('[pulso-data]', err);
    return NextResponse.json({ error: 'Erro ao carregar dados do pulso.' }, { status: 500 });
  }
}
