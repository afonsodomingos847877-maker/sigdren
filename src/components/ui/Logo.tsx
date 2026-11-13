import React from 'react';

export const Logo: React.FC<{ dark?: boolean; compact?: boolean }> = ({
  dark = false,
  compact = false,
}) => {
  return (
    <div className="inline-flex items-center select-none">
      <span
        style={{ fontFamily: "'Orbitron', sans-serif" }}
        className={`font-semibold uppercase tracking-[0.32em] ${
          compact ? 'text-xs' : 'text-sm sm:text-[15px]'
        } ${dark ? 'text-white' : 'text-[#171717]'}`}
      >
        SIG DREN
      </span>
    </div>
  );
};
