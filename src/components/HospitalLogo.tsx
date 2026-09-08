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
      <div className={`${sizeMap[size]} relative flex items-center justify-center ${size === 'sm' ? 'rounded-xl p-1' : 'rounded-2xl p-1.5'} bg-slate-950 border border-sky-500/40 shadow-md shadow-sky-500/20 overflow-hidden group`}>
        {/* Glow backdrop */}
        <div className="absolute inset-0 bg-gradient-to-tr from-sky-600/40 via-blue-600/30 to-cyan-400/40 blur-md group-hover:opacity-100 transition-opacity" />
        
        {/* SVG Pulse & SGhL Logo */}
        <svg viewBox="0 0 240 100" className="w-full h-full relative z-10 drop-shadow-md" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="logoPulseGrad" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="35%" stopColor="#0284c7" />
              <stop offset="70%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
            <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Letter S */}
          <path d="M 38 40 C 26 34 26 22 40 22 C 54 22 54 34 40 46 C 26 58 26 70 40 70 C 54 70 54 58 54 58" 
                stroke="#0284c7" strokeWidth="8" strokeLinecap="round" fill="none" />

          {/* Letter Gh */}
          <path d="M 104 46 C 104 32 120 32 120 46 C 120 60 104 60 104 46 Z M 120 36 L 120 64 C 120 74 104 74 98 68" 
                stroke="#0284c7" strokeWidth="8" strokeLinecap="round" fill="none" />

          {/* Letter h */}
          <path d="M 136 22 L 136 70 M 136 46 C 136 34 156 34 156 46 L 156 70" 
                stroke="#0284c7" strokeWidth="8" strokeLinecap="round" fill="none" />

          {/* Letter L */}
          <path d="M 176 22 L 176 70 L 198 70" 
                stroke="#0284c7" strokeWidth="8" strokeLinecap="round" fill="none" />

          {/* ECG Pulse Wave Line */}
          <path d="M 5 50 L 48 50 L 60 10 L 76 90 L 90 35 L 100 55 L 165 55 L 175 25 L 185 82 L 195 50 L 222 50" 
                stroke="url(#logoPulseGrad)" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#logoGlow)" />

          {/* Glowing Spark / Star at the right end of the pulse (Al-Noor / Light Spark) */}
          <g transform="translate(222, 50)">
            <line x1="-14" y1="0" x2="14" y2="0" stroke="#bae6fd" strokeWidth="4" strokeLinecap="round" />
            <line x1="0" y1="-14" x2="0" y2="14" stroke="#bae6fd" strokeWidth="4" strokeLinecap="round" />
            <line x1="-8" y1="-8" x2="8" y2="8" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="-8" y1="8" x2="8" y2="-8" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="0" cy="0" r="3.5" fill="#ffffff" filter="url(#logoGlow)" />
          </g>
        </svg>
      </div>

      {showText && (
        <div>
          <h1 className="text-lg font-black text-white tracking-wide flex items-center gap-1.5">
            <span>مشفى الرحمة</span>
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30">AL-RAHMA</span>
          </h1>
          <p className="text-[11px] text-slate-400">نظام الإدارة الطبي التخصصي الموحد</p>
        </div>
      )}
    </div>
  );
};

// SVG string for PDF header and Official Stamp Seal
export const AL_NOOR_LOGO_SVG_STRING = `
<svg viewBox="0 0 240 100" style="width:100%; height:100%; display:block;" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="pGrad" x1="0%" y1="50%" x2="100%" y2="50%">
      <stop offset="0%" stop-color="#0284c7" />
      <stop offset="50%" stop-color="#2563eb" />
      <stop offset="100%" stop-color="#0284c7" />
    </linearGradient>
  </defs>
  <path d="M 38 40 C 26 34 26 22 40 22 C 54 22 54 34 40 46 C 26 58 26 70 40 70 C 54 70 54 58 54 58" stroke="#0284c7" stroke-width="8" stroke-linecap="round" fill="none" />
  <path d="M 104 46 C 104 32 120 32 120 46 C 120 60 104 60 104 46 Z M 120 36 L 120 64 C 120 74 104 74 98 68" stroke="#0284c7" stroke-width="8" stroke-linecap="round" fill="none" />
  <path d="M 136 22 L 136 70 M 136 46 C 136 34 156 34 156 46 L 156 70" stroke="#0284c7" stroke-width="8" stroke-linecap="round" fill="none" />
  <path d="M 176 22 L 176 70 L 198 70" stroke="#0284c7" stroke-width="8" stroke-linecap="round" fill="none" />
  <path d="M 5 50 L 48 50 L 60 10 L 76 90 L 90 35 L 100 55 L 165 55 L 175 25 L 185 82 L 195 50 L 222 50" stroke="url(#pGrad)" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round" />
  <g transform="translate(222, 50)">
    <line x1="-12" y1="0" x2="12" y2="0" stroke="#0284c7" stroke-width="4" stroke-linecap="round" />
    <line x1="0" y1="-12" x2="0" y2="12" stroke="#0284c7" stroke-width="4" stroke-linecap="round" />
    <line x1="-7" y1="-7" x2="7" y2="7" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" />
    <line x1="-7" y1="7" x2="7" y2="-7" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" />
    <circle cx="0" cy="0" r="3" fill="#0284c7" />
  </g>
</svg>
`;
