import React, { useState } from 'react';

/**
 * Interactive 3D Sacred Geometry Yoga Mandala & Meditating Yogi Sculpture.
 * Responds to pointer movement with layered CSS 3D depth parallax.
 */
export const HeroMandala3D: React.FC = () => {
  const [tilt, setTilt] = useState({ rx: 8, ry: -12 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ rx: -y * 28, ry: x * 28 });
  };

  const handleMouseLeave = () => {
    setTilt({ rx: 8, ry: -12 });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-64 h-64 sm:w-80 sm:h-80 mx-auto cursor-grab active:cursor-grabbing select-none"
      style={{ perspective: '1200px' }}
    >
      {/* Ambient Aura Glow */}
      <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-[#D4AF37]/25 via-[#F5D77F]/15 to-[#8F2F1B]/25 blur-2xl animate-pulse" />

      {/* 3D Scene Pivot */}
      <div
        className="w-full h-full relative transition-transform duration-200 ease-out"
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
        }}
      >
        {/* Outer Orbit Ring 1 (Z: -30px) */}
        <div
          className="absolute inset-0 rounded-full border border-[#D4AF37]/30 animate-[spin_24s_linear_infinite]"
          style={{ transform: 'translateZ(-25px)' }}
        >
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#F5D77F] shadow-[0_0_12px_#F5D77F]" />
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#D4AF37]" />
        </div>

        {/* Diagonal Gyro Ring 2 (Z: 15px) */}
        <div
          className="absolute inset-5 rounded-full border border-dashed border-[#F5D77F]/40 animate-[spin_18s_linear_infinite_reverse]"
          style={{ transform: 'translateZ(18px) rotateX(60deg)' }}
        />

        {/* Diagonal Gyro Ring 3 (Z: 28px) */}
        <div
          className="absolute inset-8 rounded-full border border-[#D4AF37]/45 animate-[spin_14s_linear_infinite]"
          style={{ transform: 'translateZ(30px) rotateY(55deg)' }}
        />

        {/* Center Lotus & Meditating Yogi Hologram (Z: 55px) */}
        <div
          className="absolute inset-12 rounded-full glass-gold flex items-center justify-center shadow-[0_0_50px_rgba(212,175,55,0.25)] animate-float-slow"
          style={{ transform: 'translateZ(52px)' }}
        >
          <svg viewBox="0 0 160 160" className="w-40 h-40 drop-shadow-[0_0_12px_rgba(245,215,127,0.45)]" fill="none">
            {/* Sacred Geometry Hexagon */}
            <polygon
              points="80,18 134,49 134,111 80,142 26,111 26,49"
              stroke="url(#mandalaGold)"
              strokeWidth="1.2"
              strokeDasharray="4 3"
              opacity="0.7"
            />
            {/* Lotus Base */}
            <path
              d="M80 128 C58 128 42 114 38 98 C52 104 66 112 80 120 C94 112 108 104 122 98 C118 114 102 128 80 128 Z"
              fill="url(#mandalaGold)"
              opacity="0.35"
            />
            {/* Meditating Yogi Silhouette */}
            <circle cx="80" cy="48" r="10" fill="url(#mandalaGold)" />
            {/* Crown Halo Chakra */}
            <circle cx="80" cy="48" r="16" stroke="#F5D77F" strokeWidth="1" strokeDasharray="2 3" opacity="0.8" />
            {/* Arms in Mudra & Lotus Pose */}
            <path
              d="M80 62 C67 62 58 73 53 86 L42 98 C50 100 62 95 68 89 L70 102 L48 114 C46 119 56 122 80 122 C104 122 114 119 112 114 L90 102 L92 89 C98 95 110 100 118 98 L107 86 C102 73 93 62 80 62 Z"
              fill="url(#mandalaGold)"
            />
            {/* Vertical 7 Chakra Energy Dots */}
            {[56, 68, 79, 90, 102, 113].map((cy, idx) => (
              <circle
                key={idx}
                cx="80"
                cy={cy}
                r="2"
                fill="#07090E"
                stroke="#FFF6D6"
                strokeWidth="0.9"
              />
            ))}
            <defs>
              <linearGradient id="mandalaGold" x1="20" y1="20" x2="140" y2="140" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FFF6D6" />
                <stop offset="50%" stopColor="#F5D77F" />
                <stop offset="100%" stopColor="#D4AF37" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Floating Satellite Chips (Z: 72px) */}
        <div
          className="absolute -top-2 right-2 px-3 py-1 rounded-full bg-[#0D1322]/90 border border-[#D4AF37]/50 text-[10px] font-bold text-[#F5D77F] shadow-lg"
          style={{ transform: 'translateZ(72px)' }}
        >
          Guinness Certified
        </div>
        <div
          className="absolute bottom-2 -left-4 px-3 py-1 rounded-full bg-[#0D1322]/90 border border-emerald-400/40 text-[10px] font-bold text-emerald-300 shadow-lg"
          style={{ transform: 'translateZ(68px)' }}
        >
          Aerial • Wheel • Wall
        </div>
      </div>
    </div>
  );
};
