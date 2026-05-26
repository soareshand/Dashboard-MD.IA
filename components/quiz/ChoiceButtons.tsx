'use client';

interface ChoiceButtonsProps {
  options: string[];
  value: string | null;
  onChange: (val: string) => void;
  size?: 'sm' | 'lg';
}

export default function ChoiceButtons({ options, value, onChange, size = 'sm' }: ChoiceButtonsProps) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {options.map(opt => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`
              rounded-lg font-sora font-medium transition-all duration-200
              ${size === 'lg' ? 'px-6 py-3 text-base' : 'px-4 py-2 text-sm'}
              ${active
                ? 'bg-gradient-to-r from-[#4A90E2] to-[#6EC6FF] text-white shadow-[0_0_16px_rgba(74,144,226,0.4)]'
                : 'bg-[#1A1A2E] text-[#A0A0B0] border border-[rgba(74,144,226,0.2)] hover:border-[#4A90E2] hover:text-white'
              }
            `}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
