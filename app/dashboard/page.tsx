import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Painel CS — MD.IA',
};

export default function DashboardPage({
  searchParams,
}: {
  searchParams: { embed?: string };
}) {
  const isEmbed = searchParams.embed === 'true';
  return <DashboardClient isEmbed={isEmbed} />;
}
