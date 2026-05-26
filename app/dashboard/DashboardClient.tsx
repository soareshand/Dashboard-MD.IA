'use client';

import { useState } from 'react';
import Image from 'next/image';
import GenerateLinkModal from '@/components/dashboard/GenerateLinkModal';
import NpsTab from '@/components/dashboard/tabs/NpsTab';
import FinanceiroTab from '@/components/dashboard/tabs/FinanceiroTab';
import ClientesTab from '@/components/dashboard/tabs/ClientesTab';
import PresencaTab from '@/components/dashboard/tabs/PresencaTab';

const TABS = [
  { id: 'nps',        label: 'NPS / Quiz',  icon: '📊' },
  { id: 'financeiro', label: 'Financeiro',   icon: '💰' },
  { id: 'clientes',   label: 'Clientes',     icon: '👥' },
  { id: 'presenca',   label: 'Presenças',    icon: '📅' },
] as const;

type TabId = typeof TABS[number]['id'];

function TabContent({ activeTab }: { activeTab: TabId }) {
  return (
    <>
      {activeTab === 'nps'        && <NpsTab />}
      {activeTab === 'financeiro' && <FinanceiroTab />}
      {activeTab === 'clientes'   && <ClientesTab />}
      {activeTab === 'presenca'   && <PresencaTab />}
    </>
  );
}

export default function DashboardClient({ isEmbed }: { isEmbed: boolean }) {
  const [activeTab, setActiveTab] = useState<TabId>('nps');
  const [showModal, setShowModal] = useState(false);

  /* ── Embed mode: compact top-bar + horizontal tabs ── */
  if (isEmbed) {
    return (
      <div className="min-h-screen bg-[#080812]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/MD.IA_Logotipo-removebg-preview.png" alt="MD.IA" width={36} height={36} className="rounded-xl object-contain" />
            <h1 className="font-orbitron text-sm font-bold text-white">Painel CS — MD.IA</h1>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-glow px-3 py-1.5 rounded-xl text-white font-sora font-semibold text-xs">
            + Gerar Link
          </button>
        </div>
        <div className="border-b border-[rgba(123,92,227,0.15)] px-4 bg-[#0A0A1A] mt-4">
          <div className="max-w-7xl mx-auto overflow-x-auto">
            <div className="flex gap-0.5 min-w-max">
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-sora border-b-2 transition-all whitespace-nowrap rounded-t-lg ${
                    activeTab === tab.id
                      ? 'border-[#7B5CE3] text-white bg-[rgba(123,92,227,0.1)]'
                      : 'border-transparent text-[#7070A0] hover:text-[#C0C0D8]'
                  }`}>
                  <span>{tab.icon}</span><span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <TabContent activeTab={activeTab} />
        </main>
        {showModal && <GenerateLinkModal onClose={() => setShowModal(false)} />}
      </div>
    );
  }

  /* ── Full mode: sidebar layout ── */
  return (
    <div className="flex min-h-screen bg-[#080812]">

      {/* ── Sidebar ── */}
      <aside className="w-[220px] flex-shrink-0 flex flex-col min-h-screen bg-[#06061A] border-r border-[rgba(123,92,227,0.18)] sticky top-0 h-screen">

        {/* Logo */}
        <div className="px-5 py-7 border-b border-[rgba(123,92,227,0.12)]">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl blur-lg bg-[rgba(107,76,230,0.4)]" />
              <Image
                src="/MD.IA_Logotipo-removebg-preview.png"
                alt="MD.IA"
                width={68}
                height={68}
                className="relative rounded-2xl object-contain drop-shadow-lg"
              />
            </div>
            <div>
              <h1 className="font-orbitron text-sm font-bold text-white leading-none tracking-wide">Painel CS</h1>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-5 flex flex-col gap-1.5">
          {TABS.map((tab, i) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative w-full flex flex-col items-center gap-2 py-4 px-2 rounded-xl transition-all duration-200 group ${
                  active
                    ? 'bg-[rgba(123,92,227,0.13)] text-white shadow-[0_0_20px_rgba(123,92,227,0.12)]'
                    : 'text-[#5858A0] hover:text-[#B0B0D0] hover:bg-[rgba(255,255,255,0.04)]'
                }`}
              >
                {/* active left border */}
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-9 bg-gradient-to-b from-[#7B5CE3] to-[#4A90E2] rounded-r-full" />
                )}

                <span className={`text-[28px] leading-none transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-105'}`}>
                  {tab.icon}
                </span>
                <span className={`text-[11px] font-sora font-semibold leading-none tracking-wide ${active ? 'text-white' : ''}`}>
                  {tab.label}
                </span>

                {/* separator (except last) */}
                {i < TABS.length - 1 && !active && (
                  <span className="absolute bottom-0 left-4 right-4 h-px bg-[rgba(123,92,227,0.08)]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Gerar Link button */}
        <div className="px-4 pb-6 pt-3 border-t border-[rgba(123,92,227,0.12)]">
          <button
            onClick={() => setShowModal(true)}
            className="btn-glow w-full py-3 rounded-xl text-white font-sora font-semibold text-[13px]"
          >
            + Gerar Novo Link
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-auto min-h-screen">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <TabContent activeTab={activeTab} />
        </div>
      </main>

      {showModal && <GenerateLinkModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
