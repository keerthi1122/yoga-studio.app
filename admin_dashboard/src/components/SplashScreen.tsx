import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';

export const SplashScreen: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  const [phase, setPhase] = useState<'breathing' | 'bloom' | 'fadeout'>('breathing');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('bloom'), 900);
    const t2 = setTimeout(() => setPhase('fadeout'), 2100);
    const t3 = setTimeout(() => onFinish(), 2750);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#07090E] transition-all duration-700 ${
        phase === 'fadeout' ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Expanding Prana Breathing Rings */}
      <div className="absolute w-[320px] h-[320px] sm:w-[460px] sm:h-[460px] rounded-full border border-[#D4AF37]/20 animate-[ping_2.4s_cubic-bezier(0,0,0.2,1)_infinite]" />
      <div className="absolute w-[420px] h-[420px] sm:w-[560px] sm:h-[560px] rounded-full bg-[#D4AF37]/10 blur-[130px] animate-pulse" />

      {/* Skip button for returning visitors */}
      <button
        type="button"
        onClick={onFinish}
        className="absolute top-6 right-6 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-[11px] font-semibold text-slate-300 hover:text-[#F5D77F] transition-all flex items-center gap-1 z-20"
      >
        <span>Skip Intro</span>
        <ArrowRight className="w-3 h-3" />
      </button>

      <div className="relative flex flex-col items-center gap-5 z-10 px-6">
        {/* Sacred Lotus + Meditating Yogi Startup Animation */}
        <div
          className={`transition-all duration-1000 ease-out ${
            phase === 'breathing' ? 'scale-75 opacity-60' : 'scale-100 opacity-100'
          }`}
        >
          <svg
            viewBox="0 0 220 220"
            className="w-36 h-36 sm:w-44 sm:h-44 drop-shadow-[0_0_25px_rgba(212,175,55,0.4)]"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Outer Spinning Sacred Halo */}
            <circle
              cx="110"
              cy="110"
              r="95"
              stroke="url(#goldGrad)"
              strokeWidth="1"
              strokeDasharray="6 6"
              opacity="0.45"
              className="origin-center animate-[spin_12s_linear_infinite]"
            />

            {/* Blooming Lotus Petals */}
            <ellipse
              cx="110"
              cy="92"
              rx="20"
              ry="48"
              className="splash-petal"
              style={{ animationDelay: '0ms' }}
              fill="url(#goldGrad)"
              opacity="0.85"
            />
            <ellipse
              cx="110"
              cy="92"
              rx="17"
              ry="44"
              className="splash-petal"
              style={{ animationDelay: '100ms' }}
              fill="url(#goldGrad)"
              opacity="0.6"
              transform="rotate(-32 110 138)"
            />
            <ellipse
              cx="110"
              cy="92"
              rx="14"
              ry="40"
              className="splash-petal"
              style={{ animationDelay: '200ms' }}
              fill="url(#goldGrad)"
              opacity="0.4"
              transform="rotate(-62 110 138)"
            />
            <ellipse
              cx="110"
              cy="92"
              rx="17"
              ry="44"
              className="splash-petal"
              style={{ animationDelay: '100ms' }}
              fill="url(#goldGrad)"
              opacity="0.6"
              transform="rotate(32 110 138)"
            />
            <ellipse
              cx="110"
              cy="92"
              rx="14"
              ry="40"
              className="splash-petal"
              style={{ animationDelay: '200ms' }}
              fill="url(#goldGrad)"
              opacity="0.4"
              transform="rotate(62 110 138)"
            />

            {/* Meditating Yogi Silhouette inside Lotus */}
            <circle cx="110" cy="74" r="9" fill="#07090E" stroke="#FFF6D6" strokeWidth="1.5" />
            <path
              d="M110 86 C97 86 90 98 85 110 L75 122 C83 123 93 118 98 112 L100 125 L80 136 C79 140 89 143 110 143 C131 143 141 140 140 136 L120 125 L122 112 C127 118 137 123 145 122 L135 110 C130 98 123 86 110 86 Z"
              fill="#07090E"
              stroke="#FFF6D6"
              strokeWidth="1.5"
            />
            <text
              x="110"
              y="112"
              textAnchor="middle"
              className="splash-om"
              fill="#F5D77F"
              fontSize="13"
              fontWeight="bold"
              fontFamily="serif"
            >
              ॐ
            </text>

            <defs>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFF6D6" />
                <stop offset="40%" stopColor="#F5D77F" />
                <stop offset="70%" stopColor="#D4AF37" />
                <stop offset="100%" stopColor="#AA820A" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Academy Name Reveal */}
        <div
          className={`text-center transition-all duration-700 ${
            phase === 'breathing' ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
          }`}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#D4AF37] mb-1">
            Inhale Stillness • Exhale Limits
          </p>
          <h1 className="font-serif text-3xl sm:text-5xl font-black tracking-wider text-gradient-gold">
            GVYA
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-300 uppercase tracking-[0.28em] mt-1 font-medium">
            Guinness Vijay Yoga Academy
          </p>
        </div>

        {/* Breathing Progress Bar */}
        <div className="w-44 h-1 rounded-full bg-white/10 overflow-hidden mt-2">
          <div className="h-full bg-gradient-to-r from-[#D4AF37] via-[#FFF6D6] to-[#D4AF37] animate-[splashProgress_2.2s_ease-in-out_forwards]" />
        </div>
      </div>

      <style>{`
        @keyframes petalBloom {
          0% { transform: scaleY(0.3) scaleX(0.5); opacity: 0; }
          60% { transform: scaleY(1.06) scaleX(1.06); opacity: 0.9; }
          100% { transform: scaleY(1) scaleX(1); opacity: 0.85; }
        }
        @keyframes omReveal {
          0% { opacity: 0; }
          45% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes splashProgress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        .splash-petal {
          animation: petalBloom 1.1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transform-origin: center bottom;
          opacity: 0;
        }
        .splash-om {
          animation: omReveal 1.4s ease forwards;
        }
      `}</style>
    </div>
  );
};
