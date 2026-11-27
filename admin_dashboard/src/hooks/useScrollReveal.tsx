import React, { useEffect, useRef, useState } from 'react';

type RevealDirection = 'up' | 'down' | 'left' | 'right' | 'scale' | 'fade';

interface UseScrollRevealOptions {
  threshold?: number;
  rootMargin?: string;
  delay?: number;
  direction?: RevealDirection;
  once?: boolean;
}

export const useScrollReveal = ({
  threshold = 0.08,
  rootMargin = '0px 0px -20px 0px',
  delay = 0,
  direction = 'up',
  once = true,
}: UseScrollRevealOptions = {}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect reduced motion preference
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setIsVisible(true);
      return;
    }

    // Immediate reveal if already in initial viewport
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.98) {
      const timer = delay > 0 ? setTimeout(() => setIsVisible(true), delay) : null;
      if (!timer) setIsVisible(true);
      return () => {
        if (timer) clearTimeout(timer);
      };
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (delay > 0) {
            timeoutId = setTimeout(() => setIsVisible(true), delay);
          } else {
            setIsVisible(true);
          }
          if (once) observer.unobserve(el);
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      observer.unobserve(el);
    };
  }, [threshold, rootMargin, delay, once]);

  const getTransform = (): string => {
    if (isVisible) return 'translate3d(0,0,0) scale(1)';
    switch (direction) {
      case 'up':
        return 'translate3d(0, 32px, 0)';
      case 'down':
        return 'translate3d(0, -32px, 0)';
      case 'left':
        return 'translate3d(36px, 0, 0)';
      case 'right':
        return 'translate3d(-36px, 0, 0)';
      case 'scale':
        return 'scale(0.92)';
      case 'fade':
      default:
        return 'translate3d(0, 0, 0)';
    }
  };

  const style: React.CSSProperties = {
    opacity: isVisible ? 1 : 0,
    transform: getTransform(),
    transition: `opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1), transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)`,
    willChange: 'opacity, transform',
  };

  return { ref, style, isVisible };
};

export const ScrollReveal: React.FC<{
  children: React.ReactNode;
  direction?: RevealDirection;
  delay?: number;
  className?: string;
}> = ({ children, direction = 'up', delay = 0, className = '' }) => {
  const { ref, style } = useScrollReveal({ direction, delay });
  return (
    <div ref={ref} style={style} className={className}>
      {children}
    </div>
  );
};

/**
 * Tracks normalized scroll progress [0..1] and raw scrollY for smooth parallax backgrounds.
 */
export const useScrollProgress = () => {
  const [scrollState, setScrollState] = useState({ progress: 0, scrollY: 0 });

  useEffect(() => {
    let rafId = 0;
    const update = () => {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const docHeight = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      setScrollState({
        scrollY,
        progress: Math.min(1, Math.max(0, scrollY / docHeight)),
      });
    };

    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return scrollState;
};
