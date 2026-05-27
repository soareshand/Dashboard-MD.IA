// Configuração das ferramentas avaliadas no Step 4
// Para adicionar novos itens, basta adicionar um objeto neste array.
export interface ToolItem {
  id: string;
  label: string;
  emoji: string;
  useLogo?: 'infinitegear';
}

export const TOOL_ITEMS: ToolItem[] = [
  { id: 'notaMentoriasGrupo', label: 'Assuntos das Mentorias em Grupo', emoji: '🎓' },
  { id: 'notaAcademy', label: 'Conteúdos da Plataforma Academy', emoji: '📚' },
  { id: 'notaAgenteIA', label: 'Agente de IA (Secretária)', emoji: '🤖' },
  { id: 'notaGerenteIA', label: 'Gerente de IA (Etiquetas)', emoji: '🏷️' },
  { id: 'notaAutomacoes', label: 'Automações de Experiência', emoji: '⚡' },
  { id: 'notaDashboard', label: 'Dashboard CRM', emoji: '📊' },
  { id: 'notaCRM', label: 'Ferramenta CRM', emoji: '📇' },
  { id: 'notaTreinamentosCRM', label: 'Treinamentos do CRM', emoji: '🎯' },
  { id: 'notaSuporteEquipe', label: 'Suporte da equipe', emoji: '🤝' },
  { id: 'notaMentoriaGestao', label: 'Mentoria na gestão da clínica', emoji: '💼' },
];
