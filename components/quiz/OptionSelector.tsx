'use client';

import { useState } from 'react';

interface OptionSelectorProps {
  options: string[];
  value: string; // single: selected option or free text; multi: comma-separated selections
  onChange: (val: string) => void;
  placeholder?: string;
  multi?: boolean;
}

export default function OptionSelector({ options, value, onChange, placeholder, multi = false }: OptionSelectorProps) {
  const getParts = () => (value ? value.split(', ').filter(Boolean) : []);
  const selected = multi ? getParts().filter(p => options.includes(p)) : [];
  const outroText = multi
    ? getParts().filter(p => !options.includes(p)).join(', ')
    : (!options.includes(value) ? value : '');

  const [showOutro, setShowOutro] = useState(
    multi ? outroText !== '' : (value !== '' && !options.includes(value))
  );

  function isActive(opt: string) {
    return multi ? selected.includes(opt) : (value === opt && !showOutro);
  }

  function handleOptionClick(opt: string) {
    if (multi) {
      const newSelected = selected.includes(opt)
        ? selected.filter(s => s !== opt)
        : [...selected, opt];
      const all = outroText ? [...newSelected, outroText] : newSelected;
      onChange(all.join(', '));
    } else {
      setShowOutro(false);
      onChange(opt);
    }
  }

  function handleOutroClick() {
    if (multi) {
      if (showOutro) {
        setShowOutro(false);
        onChange(selected.join(', '));
      } else {
        setShowOutro(true);
      }
    } else {
      setShowOutro(true);
      onChange('');
    }
  }

  function handleOutroChange(text: string) {
    if (multi) {
      const all = text ? [...selected, text] : selected;
      onChange(all.join(', '));
    } else {
      onChange(text);
    }
  }

  return (
    <div className="mt-2 space-y-3">
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => handleOptionClick(opt)}
            className={`
              px-3 py-2 rounded-xl text-sm font-sora transition-all duration-200 text-left
              ${isActive(opt)
                ? 'bg-gradient-to-r from-[#4A90E2] to-[#6EC6FF] text-white shadow-[0_0_12px_rgba(74,144,226,0.35)]'
                : 'bg-[#12122A] text-[#A0A0B0] border border-[rgba(74,144,226,0.2)] hover:border-[#4A90E2] hover:text-white'
              }
            `}
          >
            {opt}
          </button>
        ))}

        <button
          type="button"
          onClick={handleOutroClick}
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
          value={multi ? outroText : value}
          onChange={e => handleOutroChange(e.target.value)}
          placeholder={placeholder ?? 'Descreva com suas palavras…'}
          rows={3}
          className="w-full bg-[#12122A] border border-[rgba(155,89,182,0.4)] rounded-xl px-4 py-3 text-white placeholder-[#555570] focus:outline-none focus:border-[#9B59B6] focus:shadow-[0_0_8px_rgba(155,89,182,0.2)] transition-all font-sora text-sm resize-none animate-fade-in"
        />
      )}
    </div>
  );
}
