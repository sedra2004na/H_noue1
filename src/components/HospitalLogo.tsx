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
        className={`${sizeMap[size]} relative flex items-center justify-center rounded-xl bg-slate-900 dark:bg-slate-950 border border-slate-700/80 dark:border-slate-800 shadow-sm overflow-hidden group select-none shrink-0`}
        title="مشفى الرحمة التخصصي"
        role="img"
        aria-label="شعار مشفى الرحمة الطبي"
      >
        {/* Crisp Vector Medical Emblem (Cross + ECG Pulse Wave + Healing Sparkle) */}
        <svg 
          viewBox="0 0 100 100" 
          className="w-full h-full p-1.5 relative z-10" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          shapeRendering="geometricPrecision"
        >
          <defs>
            {/* Cross Gradient - Surgical Teal */}
            <linearGradient id="crossGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#14b8a6" />
              <stop offset="50%" stopColor="#0d9488" />
              <stop offset="100%" stopColor="#042f2c" />
            </linearGradient>

            {/* Glowing Pulse Wave Gradient - Emerald & Mint */}
            <linearGradient id="pulseWaveGrad" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#2dd4bf" />
              <stop offset="40%" stopColor="#ffffff" />
              <stop offset="70%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#2dd4bf" />
            </linearGradient>
          </defs>

          {/* Soft outer circular guide */}
          <circle cx="50" cy="50" r="44" stroke="#0d9488" strokeWidth="1.5" strokeOpacity="0.3" strokeDasharray="3 3" />

          {/* Symmetrical Medical Hospital Cross */}
          <g>
            {/* Vertical Arm */}
            <rect x="42" y="18" width="16" height="64" rx="7" fill="url(#crossGrad)" stroke="#2dd4bf" strokeWidth="1" strokeOpacity="0.5" />
            {/* Horizontal Arm */}
            <rect x="18" y="42" width="64" height="16" rx="7" fill="url(#crossGrad)" stroke="#2dd4bf" strokeWidth="1" strokeOpacity="0.5" />
            {/* Center core highlight */}
            <rect x="42" y="42" width="16" height="16" fill="#0d9488" fillOpacity="0.9" />
          </g>

          {/* Vital Cardiac ECG Rhythm Wave */}
          <path 
            d="M 12 50 L 32 50 L 39 34 L 46 68 L 53 26 L 60 62 L 67 50 L 88 50" 
            stroke="url(#pulseWaveGrad)" 
            strokeWidth="4" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />

          {/* Top-Right Healing Star Sparkle */}
          <g transform="translate(80, 20)">
            <circle cx="0" cy="0" r="2.5" fill="#ffffff" />
            <line x1="-6" y1="0" x2="6" y2="0" stroke="#a7f3d0" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="0" y1="-6" x2="0" y2="6" stroke="#a7f3d0" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        </svg>
      </div>

      {showText && (
        <div className="text-right select-none">
          <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-wide flex items-center gap-1.5" dir="rtl">
            <bdi>مشفى الرحمة</bdi>
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800" dir="ltr">
              AL-RAHMA
            </span>
          </h1>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">النظام الطبي التخصصي الموحد</p>
        </div>
      )}
    </div>
  );
};

// SVG string for PDF header and Official Stamp Seal
export const AL_NOOR_LOGO_SVG_STRING = `
<svg viewBox="0 0 100 100" style="width:100%; height:100%; display:block;" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="pGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#14b8a6" />
      <stop offset="100%" stop-color="#0d9488" />
    </linearGradient>
  </defs>
  <rect x="42" y="18" width="16" height="64" rx="7" fill="url(#pGrad)" />
  <rect x="18" y="42" width="64" height="16" rx="7" fill="url(#pGrad)" />
  <path d="M 12 50 L 32 50 L 39 34 L 46 68 L 53 26 L 60 62 L 67 50 L 88 50" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
  <circle cx="80" cy="20" r="3" fill="#14b8a6" />
</svg>
`;
