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
        className={`${sizeMap[size]} relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 border border-sky-400/40 shadow-lg shadow-sky-500/20 overflow-hidden group select-none shrink-0`}
        title="مشفى الرحمة التخصصي"
        role="img"
        aria-label="شعار مشفى الرحمة الطبي"
      >
        {/* Subtle Ambient Backlight Glow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-sky-500/20 via-cyan-400/10 to-teal-400/20 blur-sm group-hover:opacity-100 transition-opacity" />

        {/* Crisp Vector Medical Emblem (Cross + ECG Pulse Wave + Healing Sparkle) */}
        <svg 
          viewBox="0 0 100 100" 
          className="w-full h-full p-1.5 relative z-10 drop-shadow-md" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          shapeRendering="geometricPrecision"
        >
          <defs>
            {/* Cross Gradient */}
            <linearGradient id="crossGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="50%" stopColor="#0369a1" />
              <stop offset="100%" stopColor="#075985" />
            </linearGradient>

            {/* Glowing Pulse Wave Gradient */}
            <linearGradient id="pulseWaveGrad" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="40%" stopColor="#ffffff" />
              <stop offset="70%" stopColor="#67e8f9" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>

            {/* Soft Glow Filter */}
            <filter id="medGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Soft outer circular guide */}
          <circle cx="50" cy="50" r="44" stroke="#0284c7" strokeWidth="1.5" strokeOpacity="0.3" strokeDasharray="3 3" />

          {/* Symmetrical Medical Hospital Cross */}
          <g filter="url(#medGlow)">
            {/* Vertical Arm */}
            <rect x="42" y="18" width="16" height="64" rx="7" fill="url(#crossGrad)" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.5" />
            {/* Horizontal Arm */}
            <rect x="18" y="42" width="64" height="16" rx="7" fill="url(#crossGrad)" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.5" />
            {/* Center core highlight */}
            <rect x="42" y="42" width="16" height="16" fill="#0284c7" fillOpacity="0.9" />
          </g>

          {/* Vital Cardiac ECG Rhythm Wave */}
          <path 
            d="M 12 50 L 32 50 L 39 34 L 46 68 L 53 26 L 60 62 L 67 50 L 88 50" 
            stroke="url(#pulseWaveGrad)" 
            strokeWidth="4.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            filter="url(#medGlow)"
          />

          {/* Top-Right Healing Star Sparkle */}
          <g transform="translate(80, 20)">
            <circle cx="0" cy="0" r="2.5" fill="#ffffff" filter="url(#medGlow)" />
            <line x1="-7" y1="0" x2="7" y2="0" stroke="#bae6fd" strokeWidth="1.75" strokeLinecap="round" />
            <line x1="0" y1="-7" x2="0" y2="7" stroke="#bae6fd" strokeWidth="1.75" strokeLinecap="round" />
          </g>
        </svg>
      </div>

      {showText && (
        <div className="text-right select-none">
          <h1 className="text-base sm:text-lg font-black text-white tracking-wide flex items-center gap-1.5" dir="rtl">
            <bdi>مشفى الرحمة</bdi>
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30" dir="ltr">
              AL-RAHMA
            </span>
          </h1>
          <p className="text-[11px] text-slate-400">النظام الطبي التخصصي الموحد</p>
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
      <stop offset="0%" stop-color="#0284c7" />
      <stop offset="100%" stop-color="#0369a1" />
    </linearGradient>
  </defs>
  <rect x="42" y="18" width="16" height="64" rx="7" fill="url(#pGrad)" />
  <rect x="18" y="42" width="64" height="16" rx="7" fill="url(#pGrad)" />
  <path d="M 12 50 L 32 50 L 39 34 L 46 68 L 53 26 L 60 62 L 67 50 L 88 50" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
  <circle cx="80" cy="20" r="3" fill="#0284c7" />
</svg>
`;
