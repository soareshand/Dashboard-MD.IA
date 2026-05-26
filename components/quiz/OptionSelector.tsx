'use client';

import { useState } from 'react';

interface OptionSelectorProps {
  options: string[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export default function OptionSelector({ options, value, onChange, placeholder }: OptionSelectorProps) {
  const isOutro = value !== '' && !options.includes(value);
  const [showOutro, setShowOutro] = useState(isOutro);

  function handleSelect(opt: string) {
    setShowOutro(false);
    onChange(opt);
  }

  function handleOutro() {
    setShowOutro(true);
    onChange('');
  }

  return (
    <div className="mt-2 space-y-3">
      <div className="flex flex-wrap gap-2">
        {options.map(opt => {
          const active = value === opt && !showOutro;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => handleSelect(opt)}
              className={`
                px-3 py-2 rounded-xl text-sm font-sora transition-all duration-200 text-left
                ${active
                  ? 'bg-gradient-to-r from-[#4A90E2] to-[#6EC6FF] text-white shadow-[0_0_12px_rgba(74,144,226,0.35)]'
                  : 'bg-[#12122A] text-[#A0A0B0] border border-[rgba(74,144,226,0.2)] hover:border-[#4A90E2] hover:text-white'
                }
              `}
            >
              {opt}
            </button>
          );
        })}

        {/* Botão Outro */}
        <button
          type="button"
          onClick={handleOutro}
          className={`
            px-3 py-2 rounded-xl text-sm font-sora transition-all duration-200
            ${showOutro
              ? 'bg-gradient-to-r from-[#9B59B6] to-[#C39BD3] text-white shadow-[0_0_12px_rgba(155,89,182,0.35)]'
              : 'bg-[#12122A] text-[#A0A0B0] border border-[rgba(155,89,182,0.25)] hover:border-[#9B59B6] hover:text-white'
            }
          `}
        >
          ✏️ Outro
        </button>
      </div>

      {showOutro && (
        <textarea
          autoFocus
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder ?? 'Descreva com suas palavras…'}
          rows={3}
          className="w-full bg-[#12122A] border border-[rgba(155,89,182,0.4)] rounded-xl px-4 py-3 text-white placeholder-[#555570] focus:outline-none focus:border-[#9B59B6] focus:shadow-[0_0_8px_rgba(155,89,182,0.2)] transition-all font-sora text-sm resize-none animate-fade-in"
        />
      )}
    </div>
  );
}
