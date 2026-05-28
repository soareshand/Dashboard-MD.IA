import { supabase } from '@/lib/supabase';
import QuizHeader from '@/components/quiz/QuizHeader';
import QuizClient from './QuizClient';
import QuizCallClient from './QuizCallClient';
import QuizTreinamentoClient from './QuizTreinamentoClient';
import QuizMensalMedicoClient from './QuizMensalMedicoClient';
import QuizMensalEquipeClient from './QuizMensalEquipeClient';

interface Props {
  params: { token: string };
}

export default async function QuizPage({ params }: Props) {
  const { token } = params;

  const { data: tokenData, error } = await supabase
    .from('tokens')
    .select('*')
    .eq('token', token)
    .single();

  if (error || !tokenData) return <ErrorPage message="Link inválido ou expirado." />;
  if (tokenData.status === 'respondido') {
    return <ErrorPage message="Este link já foi utilizado. Cada link pode ser respondido apenas uma vez." />;
  }

  const quizType = tokenData.quiz_type ?? 'renovacao';

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex flex-col items-center">
      <div className="w-full max-w-2xl px-4 pb-16">
        <QuizHeader />
        <main className="mt-6 card-gradient-border p-6 sm:p-8">
          {quizType === 'call' && (
            <QuizCallClient
              token={token}
              nome={tokenData.cliente_nome}
              clinica={tokenData.clinica}
              tipoCall={tokenData.extra_info}
            />
          )}
          {quizType === 'treinamento' && (
            <QuizTreinamentoClient
              token={token}
              nome={tokenData.cliente_nome}
              clinica={tokenData.clinica}
              ferramenta={tokenData.extra_info}
            />
          )}
          {(quizType === 'renovacao' || !quizType) && (
            <QuizClient
              token={token}
              initial={{ nome: tokenData.cliente_nome, clinica: tokenData.clinica, email: tokenData.email }}
            />
          )}
          {quizType === 'mensal_medico' && (
            <QuizMensalMedicoClient
              token={token}
              nome={tokenData.cliente_nome}
              clinica={tokenData.clinica}
            />
          )}
          {quizType === 'mensal_equipe' && (
            <QuizMensalEquipeClient
              token={token}
              nome={tokenData.cliente_nome}
              clinica={tokenData.clinica}
            />
          )}
        </main>
      </div>
    </div>
  );
}

function ErrorPage({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-[#0D0D0D] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md card-gradient-border p-8 text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="font-orbitron text-xl font-bold text-white mb-3">Link Indisponível</h1>
        <p className="text-[#A0A0B0] text-sm leading-relaxed">{message}</p>
        <div className="ecg-line mt-6 ecg-pulse" />
      </div>
    </div>
  );
}
