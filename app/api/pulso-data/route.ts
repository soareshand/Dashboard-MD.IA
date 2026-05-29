import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const MEDICO_INTERVAL_DAYS = 85;
const EQUIPE_INTERVAL_DAYS = 25;

function diasDesde(hoje: Date, d: Date): number {
  return Math.max(0, Math.floor((hoje.getTime() - d.getTime()) / 86400000));
}

export async function GET() {
  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const cutoffMedico = new Date(hoje);
    cutoffMedico.setDate(cutoffMedico.getDate() - MEDICO_INTERVAL_DAYS);
    const cutoffEquipe = new Date(hoje);
    cutoffEquipe.setDate(cutoffEquipe.getDate() - EQUIPE_INTERVAL_DAYS);

    const [
      { data: clientes },
      { data: tokensMedico },
      { data: tokensEquipe },
      { data: recentMedico },
      { data: recentEquipe },
      { data: respondedMedico },
      { data: respondedEquipe },
    ] = await Promise.all([
      supabase.from('clientes').select('nome, clinica').eq('situacao', 'Ativo'),
      supabase.from('tokens').select('cliente_nome, clinica, created_at').eq('quiz_type', 'mensal_medico').order('created_at', { ascending: false }),
      supabase.from('tokens').select('clinica, created_at').eq('quiz_type', 'mensal_equipe').order('created_at', { ascending: false }),
      supabase.from('quiz_mensal_medico_responses').select('*').order('timestamp', { ascending: false }).limit(10),
      supabase.from('quiz_mensal_equipe_responses').select('*').order('timestamp', { ascending: false }).limit(10),
      supabase.from('quiz_mensal_medico_responses').select('nome, timestamp').gte('timestamp', cutoffMedico.toISOString()),
      supabase.from('quiz_mensal_equipe_responses').select('clinica, timestamp').gte('timestamp', cutoffEquipe.toISOString()),
    ]);

    const activeClientes = clientes ?? [];

    // Doctors/clinics who already responded within the interval
    const respondedMedicoSet = new Set(
      (respondedMedico ?? []).map(r => String(r.nome ?? '').trim())
    );
    const respondedEquipeSet = new Set(
      (respondedEquipe ?? []).map(r => String(r.clinica ?? '').trim().toLowerCase())
    );

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

    // Médico due list — due = no response received within interval
    const dueMedico = activeClientes
      .map(m => {
        const last = latestMedico.get(m.nome);
        const diasSemEnvio = last ? diasDesde(hoje, last) : null;
        const due = !respondedMedicoSet.has(m.nome.trim());
        return { nome: m.nome, clinica: m.clinica ?? '', diasSemEnvio, ultimoEnvio: last ? last.toISOString().split('T')[0] : null, due };
      })
      .filter(d => d.due)
      .sort((a, b) => (b.diasSemEnvio ?? 9999) - (a.diasSemEnvio ?? 9999));

    // Equipe due list — one entry per unique clinic, due = no response received within interval
    const clinicasUnicas = Array.from(new Set(
      activeClientes.map(m => m.clinica).filter((c): c is string => Boolean(c))
    ));

    const dueEquipe = clinicasUnicas
      .map(clinica => {
        const last = latestEquipe.get(clinica);
        const diasSemEnvio = last ? diasDesde(hoje, last) : null;
        const due = !respondedEquipeSet.has(clinica.trim().toLowerCase());
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
