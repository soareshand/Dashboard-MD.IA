'use client';

import Image from 'next/image';
import { ToolItem } from '@/lib/quiz-config';

interface ScaleInputProps {
  item: ToolItem;
  value: number | null;
  onChange: (val: number) => void;
}

const SCALE = [0, 1, 2, 3, 4, 5];

export default function ScaleInput({ item, value, onChange }: ScaleInputProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 py-4 border-b border-[rgba(74,144,226,0.12)] last:border-0">
      <div className="flex items-center gap-2 sm:w-72 flex-shrink-0">
        {item.useLogo === 'infinitegear' ? (
          <Image src="/logo-infinitegear.png" alt="InfiniteGear" width={20} height={20} className="object-contain" />
        ) : (
          <span className="text-lg w-6 text-center">{item.emoji}</span>
        )}
        <span className="text-sm text-white/90 leading-snug">{item.label}</span>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {SCALE.map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`
              w-9 h-9 rounded-full font-mono text-sm font-bold transition-all duration-200 flex items-center justify-center
              ${value === n
                ? 'bg-gradient-to-br from-[#4A90E2] to-[#6EC6FF] text-white shadow-[0_0_12px_rgba(74,144,226,0.5)] scale-110'
                : 'bg-[#1A1A2E] text-[#A0A0B0] border border-[rgba(74,144,226,0.2)] hover:border-[#4A90E2] hover:text-white hover:scale-105'
              }
            `}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
