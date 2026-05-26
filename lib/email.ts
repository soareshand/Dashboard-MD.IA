import { Resend } from 'resend';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

interface SendQuizEmailParams {
  to: string;
  nomeMedico: string;
  quizUrl: string;
  mensagemPersonalizada?: string;
}

export async function sendQuizEmail({ to, nomeMedico, quizUrl, mensagemPersonalizada }: SendQuizEmailParams) {
  const defaultMessage = `Olá, Dr(a). ${nomeMedico}!

Gostaríamos de entender melhor sua experiência com a MD.IA.
Por favor, reserve alguns minutos para responder nosso formulário de avaliação:

${quizUrl}

Sua opinião é fundamental para continuarmos evoluindo juntos!

Equipe MD.IA`;

  const body = mensagemPersonalizada
    ? mensagemPersonalizada.replace('[LINK]', quizUrl).replace('[Nome]', nomeMedico)
    : defaultMessage;

  const htmlBody = body
    .split('\n')
    .map(line => line.trim() === '' ? '<br/>' : `<p style="margin:0 0 8px 0;">${line}</p>`)
    .join('');

  const resend = getResend();
  const { error } = await resend.emails.send({
    from: 'MD.IA <noreply@mdia.com.br>',
    to,
    subject: 'MD.IA — Sua avaliação é importante para nós!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8"/>
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        </head>
        <body style="background:#0D0D0D;color:#fff;font-family:Arial,sans-serif;padding:40px 20px;">
          <div style="max-width:600px;margin:0 auto;background:#1A1A2E;border-radius:12px;border:1px solid rgba(74,144,226,0.3);overflow:hidden;">
            <div style="background:linear-gradient(135deg,#4A90E2,#6EC6FF);padding:4px;"></div>
            <div style="padding:40px;">
              <h1 style="font-size:22px;margin-bottom:24px;color:#6EC6FF;">MD.IA — Avaliação de Mentoria</h1>
              <div style="font-size:15px;line-height:1.7;color:#e0e0e0;">${htmlBody}</div>
              <div style="margin-top:32px;text-align:center;">
                <a href="${quizUrl}"
                   style="display:inline-block;background:linear-gradient(135deg,#4A90E2,#6EC6FF);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;font-size:15px;">
                  Responder Avaliação
                </a>
              </div>
            </div>
            <div style="background:linear-gradient(135deg,#4A90E2,#C9A84C);padding:2px;"></div>
          </div>
        </body>
      </html>
    `,
  });

  if (error) throw new Error(`Erro ao enviar email: ${error.message}`);
}
