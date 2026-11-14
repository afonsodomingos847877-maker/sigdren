import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export const ScrollPill: React.FC = () => {
  const [percent, setPercent] = useState(0);
  const [scrollable, setScrollable] = useState(false);

  useEffect(() => {
    const updateScroll = () => {
      const doc = document.documentElement;
      const scrollTop = window.scrollY || doc.scrollTop;
      const maxScroll = doc.scrollHeight - window.innerHeight;
      setScrollable(maxScroll > 80);
      if (maxScroll <= 0) {
        setPercent(0);
      } else {
        setPercent(Math.min(100, Math.max(0, Math.round((scrollTop / maxScroll) * 100))));
      }
    };

    updateScroll();
    window.addEventListener('scroll', updateScroll, { passive: true });
    window.addEventListener('resize', updateScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', updateScroll);
      window.removeEventListener('resize', updateScroll);
    };
  }, []);

  if (!scrollable) return null;

  const radius = 15;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  };

  return (
    <div className="fixed bottom-6 right-5 z-[450] flex flex-col items-center gap-2 bg-white/95 backdrop-blur-md border border-neutral-200/80 rounded-full py-2 px-1.5 shadow-lg">
      <button
        type="button"
        onClick={scrollToTop}
        title="Voltar ao topo"
        aria-label="Voltar ao topo"
        className="w-9 h-9 rounded-full bg-blue-50 hover:bg-blue-100 text-[#2563EB] flex items-center justify-center transition-colors"
      >
        <ChevronUp className="w-4 h-4 stroke-[2.5]" />
      </button>

      <span className="text-[11px] font-semibold text-[#171717] tabular-nums select-none">
        {percent}%
      </span>

      <button
        type="button"
        onClick={scrollToBottom}
        title="Ir para o fim"
        aria-label="Ir para o fim"
        className="relative w-9 h-9 rounded-full hover:bg-blue-50/60 flex items-center justify-center transition-colors"
      >
        <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
          <circle
            cx="18"
            cy="18"
            r={radius}
            fill="none"
            stroke="#e0f2fe"
            strokeWidth="2.5"
          />
          <circle
            cx="18"
            cy="18"
            r={radius}
            fill="none"
            stroke="#0284c7"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-[stroke-dashoffset] duration-150"
          />
        </svg>
        <ChevronDown className="w-4 h-4 text-[#0284c7] stroke-[2.5] absolute" />
      </button>
    </div>
  );
};

