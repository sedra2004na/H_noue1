import React from 'react';

interface HospitalLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export const HospitalLogo: React.FC<HospitalLogoProps> = ({ 
  className = '', 
  size = 'md',
  showText = false
}) => {
  const sizeMap = {
    sm: 'w-9 h-9',
    md: 'w-11 h-11 sm:w-12 sm:h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  return (
    <div className={`flex items-center ${showText ? 'gap-3' : ''} ${className}`}>
      <div 
        className={`${sizeMap[size]} relative flex items-center justify-center rounded-2xl bg-white dark:bg-slate-900 border-2 border-teal-300/80 dark:border-teal-500/50 shadow-sm overflow-hidden group select-none shrink-0 transition-transform hover:scale-105 duration-200`}
        title="مشفى الرحمة التخصصي"
        role="img"
        aria-label="شعار مشفى الرحمة التخصصي"
      >
        {/* Luminous, High-Contrast Hospital Cross Emblem */}
        <svg 
          viewBox="0 0 100 100" 
          className="w-full h-full p-1.5 relative z-10" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Luminous Gradient: Vibrant Cyan-Blue to Brilliant Emerald */}
            <linearGradient id="rahmaCrossGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="45%" stopColor="#0d9488" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>

            {/* Radiant Accent Ring */}
            <linearGradient id="rahmaRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>

            {/* Depth Shadow */}
            <filter id="rahmaShadow" x="-10%" y="-10%" width="130%" height="130%">
              <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#0f766e" floodOpacity="0.28" />
            </filter>
          </defs>

          {/* Clean Light Circular Aura */}
          <circle cx="50" cy="50" r="44" fill="#0d9488" fillOpacity="0.06" stroke="url(#rahmaRingGrad)" strokeWidth="2.5" />

          {/* 3D Bold Medical Cross Arms with Rounded Contours */}
          <g filter="url(#rahmaShadow)">
            {/* Vertical Arm */}
            <rect 
              x="37" 
              y="14" 
              width="26" 
              height="72" 
              rx="12" 
              fill="url(#rahmaCrossGrad)" 
            />
            {/* Horizontal Arm */}
            <rect 
              x="14" 
              y="37" 
              width="72" 
              height="26" 
              rx="12" 
              fill="url(#rahmaCrossGrad)" 
            />
          </g>

          {/* Core White Circular Hub for Maximum Visual Contrast */}
          <circle cx="50" cy="50" r="16" fill="#ffffff" stroke="#99f6e4" strokeWidth="1.5" />

          {/* Vital Signs Heartbeat Pulse (ECG) - Bold Clinical Teal */}
          <path 
            d="M 28 50 L 39 50 L 45 35 L 51 65 L 57 41 L 62 50 L 72 50" 
            stroke="#0f766e" 
            strokeWidth="4" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />

          {/* Central Vital Beacon Dot */}
          <circle cx="50" cy="50" r="3.5" fill="#0284c7" />
        </svg>
      </div>

      {showText && (
        <div className="text-right select-none">
          <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-wide flex items-center gap-1.5" dir="rtl">
            <bdi>مشفى الرحمة</bdi>
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-teal-50 dark:bg-sky-950/60 text-teal-800 dark:text-sky-300 border border-teal-200 dark:border-sky-800" dir="ltr">
              AL-RAHMA
            </span>
          </h1>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold">النظام الطبي التخصصي الموحد</p>
        </div>
      )}
    </div>
  );
};

// SVG string for PDF header and Official Stamp Seal
export const AL_NOOR_LOGO_SVG_STRING = `
<svg viewBox="0 0 100 100" style="width:100%; height:100%; display:block;" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="rahmaPdfGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0284c7" />
      <stop offset="50%" stop-color="#0d9488" />
      <stop offset="100%" stop-color="#10b981" />
    </linearGradient>
  </defs>
  <rect x="37" y="14" width="26" height="72" rx="12" fill="url(#rahmaPdfGrad)" />
  <rect x="14" y="37" width="72" height="26" rx="12" fill="url(#rahmaPdfGrad)" />
  <circle cx="50" cy="50" r="16" fill="#ffffff" />
  <path d="M 28 50 L 39 50 L 45 35 L 51 65 L 57 41 L 62 50 L 72 50" stroke="#0f766e" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
</svg>
`;
