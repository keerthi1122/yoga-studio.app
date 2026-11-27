import React, { useRef, useState } from 'react';

interface Tilt3DCardProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
  glowColor?: string;
}

/**
 * Interactive 3D perspective card that responds smoothly to pointer position
 * with realistic rotateX/rotateY tilt and dynamic specular gold highlight.
 */
export const Tilt3DCard: React.FC<Tilt3DCardProps> = ({
  children,
  className = '',
  intensity = 10,
  glowColor = 'rgba(212, 175, 55, 0.22)',
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)');
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;

    const rotateY = (px - 0.5) * intensity * 2;
    const rotateX = (0.5 - py) * intensity * 2;

    setTransform(`perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`);
    setGlare({ x: px * 100, y: py * 100, opacity: 1 });
  };

  const handleMouseLeave = () => {
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)');
    setGlare((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform,
        transformStyle: 'preserve-3d',
        transition: glare.opacity ? 'transform 0.08s ease-out' : 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      className={`relative ${className}`}
    >
      {/* Dynamic pointer specular highlight */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300 z-10"
        style={{
          opacity: glare.opacity,
          background: `radial-gradient(circle 220px at ${glare.x}% ${glare.y}%, ${glowColor}, transparent 75%)`,
        }}
      />
      {children}
    </div>
  );
};
