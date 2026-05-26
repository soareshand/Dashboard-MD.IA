import Image from 'next/image';

export default function QuizHeader() {
  return (
    <header className="w-full flex flex-col items-center pt-8 pb-4 px-4">
      <div className="flex items-center gap-3 mb-4">
        <Image src="/MD.IA_Logotipo-removebg-preview.png" alt="MD.IA" width={56} height={56} className="rounded-xl object-contain" />
        <div>
          <h1 className="font-orbitron text-xl font-bold text-white leading-none tracking-wide">MD.IA</h1>
          <p className="text-xs text-[#A0A0B0] mt-0.5">Avaliação de Mentoria</p>
        </div>
      </div>
      <div className="ecg-line w-full max-w-lg ecg-pulse" />
    </header>
  );
}
