import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MD.IA HUB',
    short_name: 'MD.IA',
    description: 'Sistema de avaliação e NPS da MD.IA',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#0D0D0D',
    theme_color: '#0D0D0D',
    icons: [
      {
        src: '/MD.IA Logotipo.png',
        sizes: 'any',
        type: 'image/png',
      },
    ],
  };
}
