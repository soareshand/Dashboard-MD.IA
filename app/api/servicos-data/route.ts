import { NextResponse } from 'next/server';
import { getServicos } from '@/lib/google-sheets';

function isAtivo(val: string): boolean {
  const v = val.toLowerCase();
  return v.includes('ativo') || v.includes('ligad') || v.includes('treinad') || v.includes('criada') || v.includes('assinad');
}

const TOOLS = [
  { key: 'infiniteCRM', label: 'InfiniteCRM' },
  { key: 'secretariaLeads', label: 'Secretária IA (Leads)' },
  { key: 'secretariaPacientes', label: 'Secretária IA (Pacientes)' },
  { key: 'gerenteEtiquetas', label: 'Gerente de Etiquetas' },
  { key: 'funil', label: 'Funil de Vendas' },
  { key: 'experiencia', label: 'Experiência do Paciente' },
  { key: 'confirmAgendamento', label: 'Confirmação de Agendamento' },
  { key: 'avisoTarefas', label: 'Aviso de Tarefas' },
  { key: 'infiniteForms', label: 'InfiniteForms' },
  { key: 'infinitePrompts', label: 'InfinitePrompts' },
] as const;

export async function GET() {
  try {
    const servicos = await getServicos();

    const toolRates = TOOLS.map(t => {
      const ativos = servicos.filter(s => isAtivo(s[t.key])).length;
      return {
        key: t.key,
        label: t.label,
        ativos,
        total: servicos.length,
        rate: servicos.length > 0 ? Math.round((ativos / servicos.length) * 100) : 0,
      };
    });

    return NextResponse.json({ servicos, toolRates });
  } catch (err) {
    console.error('[servicos-data]', err);
    return NextResponse.json({ error: 'Erro ao carregar dados de serviços.' }, { status: 500 });
  }
}
