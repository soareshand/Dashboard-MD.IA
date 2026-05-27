'use client';

import { useState } from 'react';
import Image from 'next/image';
import GenerateLinkModal from '@/components/dashboard/GenerateLinkModal';
import NpsTab from '@/components/dashboard/tabs/NpsTab';
import FinanceiroTab from '@/components/dashboard/tabs/FinanceiroTab';
import ClientesTab from '@/components/dashboard/tabs/ClientesTab';
import PresencaTab from '@/components/dashboard/tabs/PresencaTab';

const TABS = [
  { id: 'nps',        label: 'Avaliações',   icon: '📊' },
  { id: 'financeiro', label: 'Financeiro',   icon: '💰' },
  { id: 'clientes',   label: 'Clientes',     icon: '👥' },
  { id: 'presenca',   label: 'Presenças',    icon: '📅' },
] as const;

function SidebarIcon({ id, active }: { id: string; active: boolean }) {
  const color = active ? '#3B9EF5' : '#4B5E72';
  const s = { stroke: color, strokeWidth: '1.8', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  if (id === 'nps') return (
    <svg width="26" height="26" viewBox="0 0 24 24" {...s}>
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
  if (id === 'financeiro') return (
    <svg width="26" height="26" viewBox="0 0 24 24" {...s}>
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
  if (id === 'clientes') return (
    <svg width="26" height="26" viewBox="0 0 24 24" {...s}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" {...s}>
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

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
        <div className="border-b border-[rgba(139,92,246,0.15)] px-4 bg-[#0A0A1A] mt-4">
          <div className="max-w-7xl mx-auto overflow-x-auto">
            <div className="flex gap-0.5 min-w-max">
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-sora border-b-2 transition-all whitespace-nowrap rounded-t-lg ${
                    activeTab === tab.id
                      ? 'border-[#8B5CF6] text-white bg-[rgba(139,92,246,0.1)]'
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
      <aside className="w-[220px] flex-shrink-0 flex flex-col min-h-screen bg-[#06061A] border-r border-[rgba(139,92,246,0.18)] sticky top-0 h-screen">

        {/* Logo */}
        <div className="px-5 py-5 border-b border-[rgba(139,92,246,0.12)]">
          <div className="flex items-center gap-3">
            <Image
              src="/MD.IA_Logotipo-removebg-preview.png"
              alt="MD.IA"
              width={52}
              height={52}
              className="rounded-xl object-contain flex-shrink-0"
            />
            <div className="flex flex-col">
              <span className="font-orbitron text-[11px] font-bold text-[#8B5CF6] tracking-widest uppercase leading-none">MD.IA</span>
              <span className="font-orbitron text-sm font-bold text-white tracking-wide leading-snug mt-0.5">Painel CS</span>
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
                    ? 'bg-[rgba(245,158,11,0.08)] text-white shadow-[0_0_20px_rgba(245,158,11,0.1)]'
                    : 'text-[#5858A0] hover:text-[#B0B0D0] hover:bg-[rgba(255,255,255,0.04)]'
                }`}
              >
                {/* active left border */}
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-9 bg-gradient-to-b from-[#F59E0B] to-[#3B9EF5] rounded-r-full" />
                )}

                <span className={`transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-105'}`}>
                  <SidebarIcon id={tab.id} active={active} />
                </span>
                <span className={`text-[11px] font-sora font-semibold leading-none tracking-wide ${active ? 'text-white' : ''}`}>
                  {tab.label}
                </span>

                {/* separator (except last) */}
                {i < TABS.length - 1 && !active && (
                  <span className="absolute bottom-0 left-4 right-4 h-px bg-[rgba(139,92,246,0.08)]" />
                )}
              </button>
            );
          })}
        </nav>

      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-auto min-h-screen">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {activeTab === 'nps' && (
            <div className="flex justify-end mb-5">
              <button onClick={() => setShowModal(true)} className="btn-glow px-4 py-2.5 rounded-xl text-white font-sora font-semibold text-sm">
                + Gerar Novo Link
              </button>
            </div>
          )}
          <TabContent activeTab={activeTab} />
        </div>
      </main>

      {showModal && <GenerateLinkModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
