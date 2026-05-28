import type { Metadata } from 'next';
import { Orbitron, Sora, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
  display: 'swap',
});

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MD.IA — Avaliação de Mentoria',
  description: 'Sistema de avaliação e NPS da MD.IA',
  icons: {
    icon: '/MD.IA_Logotipo-removebg-preview.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${orbitron.variable} ${sora.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-[#0D0D0D] text-white font-sora min-h-screen">
        {children}
      </body>
    </html>
  );
}
