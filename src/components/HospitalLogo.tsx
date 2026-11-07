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
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  return (
    <div className={`flex items-center ${showText ? 'gap-3' : ''} ${className}`}>
      <div 
        className={`${sizeMap[size]} relative flex items-center justify-center rounded-2xl bg-white dark:bg-slate-900 border border-teal-200/90 dark:border-teal-500/30 shadow-sm overflow-hidden group select-none shrink-0 transition-all duration-300`}
        title="مشفى الرحمة التخصصي"
        role="img"
        aria-label="شعار مشفى الرحمة التخصصي"
      >
        {/* Modern Medical Emblem: Health Shield + Clinical Cross + Vital Pulse */}
        <svg 
          viewBox="0 0 100 100" 
          className="w-full h-full p-2 relative z-10 transition-transform group-hover:scale-105 duration-300" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Primary Healthcare Gradient: Sky Blue -> Deep Teal -> Emerald */}
            <linearGradient id="rahmaGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="50%" stopColor="#0d9488" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>

            {/* Radiant Pulse Gradient */}
            <linearGradient id="rahmaPulseGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="45%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>

            {/* Soft Inner Medical Glow */}
            <radialGradient id="rahmaGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#0d9488" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Background Ambient Glow */}
          <circle cx="50" cy="50" r="42" fill="url(#rahmaGlow)" />

          {/* Outer Protective Care Shield with Soft Organic Arcs */}
          <path 
            d="M 50 10 C 68 10 82 17 84 35 C 86 58 50 88 50 88 C 50 88 14 58 16 35 C 18 17 32 10 50 10 Z" 
            fill="url(#rahmaGrad1)" 
            fillOpacity="0.12"
            stroke="url(#rahmaGrad1)" 
            strokeWidth="2.5" 
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Distinctive Modern Medical Cross (Rounded Pillars) */}
          <g className="filter drop-shadow-sm">
            {/* Vertical Arm */}
            <rect 
              x="43" 
              y="22" 
              width="14" 
              height="50" 
              rx="7" 
              fill="url(#rahmaGrad1)" 
            />
            {/* Horizontal Arm */}
            <rect 
              x="25" 
              y="40" 
              width="50" 
              height="14" 
              rx="7" 
              fill="url(#rahmaGrad1)" 
            />
          </g>

          {/* Central Heartbeat / ECG Vital Pulse Line */}
          <path 
            d="M 21 47 L 34 47 L 41 33 L 47 58 L 53 28 L 59 52 L 65 47 L 79 47" 
            stroke="url(#rahmaPulseGrad)" 
            strokeWidth="3.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />

          {/* Central Core Pearl */}
          <circle cx="50" cy="47" r="3.5" fill="#ffffff" />

          {/* Top-Right Star of Excellence Accent */}
          <g transform="translate(76, 20)">
            <circle cx="0" cy="0" r="2.2" fill="#38bdf8" />
            <path d="M 0 -5.5 L 0 5.5 M -5.5 0 L 5.5 0" stroke="#0ea5e9" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        </svg>
      </div>

      {showText && (
        <div className="text-right select-none">
          <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-wide flex items-center gap-1.5" dir="rtl">
            <bdi>مشفى الرحمة</bdi>
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-teal-50 dark:bg-sky-950/60 text-teal-700 dark:text-sky-300 border border-teal-200 dark:border-sky-800" dir="ltr">
              AL-RAHMA
            </span>
          </h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">النظام الطبي التخصصي الموحد</p>
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
      <stop offset="0%" stop-color="#0ea5e9" />
      <stop offset="50%" stop-color="#0d9488" />
      <stop offset="100%" stop-color="#10b981" />
    </linearGradient>
  </defs>
  <path d="M 50 10 C 68 10 82 17 84 35 C 86 58 50 88 50 88 C 50 88 14 58 16 35 C 18 17 32 10 50 10 Z" fill="#e0f2fe" stroke="url(#rahmaPdfGrad)" stroke-width="2.5" />
  <rect x="43" y="22" width="14" height="50" rx="7" fill="url(#rahmaPdfGrad)" />
  <rect x="25" y="40" width="50" height="14" rx="7" fill="url(#rahmaPdfGrad)" />
  <path d="M 21 47 L 34 47 L 41 33 L 47 58 L 53 28 L 59 52 L 65 47 L 79 47" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
  <circle cx="50" cy="47" r="3.5" fill="#ffffff" />
</svg>
`;
