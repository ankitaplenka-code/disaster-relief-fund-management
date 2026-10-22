import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  radius: number;
  baseAlpha: number;
  alpha: number;
  vx: number;
  vy: number;
  color: string;
  twinkleSpeed: number;
  twinkleOffset: number;
}

export const AmbientBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imageLayerRef = useRef<HTMLDivElement | null>(null);
  const animFrameId = useRef<number | null>(null);

  // Parallax tracking refs (avoids re-renders during 60fps animations)
  const mousePos = useRef({ currentX: 0, currentY: 0, targetX: 0, targetY: 0 });
  const scrollY = useRef(0);
  const isReducedMotion = useRef(false);

  useEffect(() => {
    // 1. Check prefers-reduced-motion
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    isReducedMotion.current = motionQuery.matches;

    const handleMotionChange = (e: MediaQueryListEvent) => {
      isReducedMotion.current = e.matches;
    };
    motionQuery.addEventListener('change', handleMotionChange);

    // 2. Mouse tracking for subtle desktop parallax
    const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
    const handleMouseMove = (e: MouseEvent) => {
      if (!hasFinePointer || isReducedMotion.current) return;
      // Normalize to -1 ... 1 from window center
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = (e.clientY / window.innerHeight) * 2 - 1;
      mousePos.current.targetX = normX * 18; // Max 18px drift
      mousePos.current.targetY = normY * 18;
    };

    const handleScroll = () => {
      scrollY.current = window.scrollY || document.documentElement.scrollTop;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    // 3. Setup canvas particle system
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Warm amber, bronze, caramel, and warm ivory embers
    const colors = [
      'rgba(251, 191, 36, ', // warm amber
      'rgba(217, 119, 6, ',  // warm bronze amber
      'rgba(246, 196, 146, ', // warm caramel
      'rgba(253, 251, 247, ', // warm ivory light
    ];

    // Cap particle density based on screen resolution
    const particleCount = Math.min(
      Math.max(Math.floor((width * height) / 28000), 16),
      width < 768 ? 20 : 45
    );

    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2 + 0.8, // 0.8px to 2.8px
        baseAlpha: Math.random() * 0.45 + 0.15,
        alpha: 0.3,
        vx: (Math.random() - 0.5) * 0.22,
        vy: -(Math.random() * 0.35 + 0.12),
        color: colors[Math.floor(Math.random() * colors.length)],
        twinkleSpeed: Math.random() * 0.02 + 0.008,
        twinkleOffset: Math.random() * Math.PI * 2,
      });
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // 4. Animation loop with visibility pausing
    let lastTime = performance.now();
    let isTabVisible = document.visibilityState === 'visible';

    const handleVisibilityChange = () => {
      isTabVisible = document.visibilityState === 'visible';
      if (isTabVisible && !animFrameId.current && !isReducedMotion.current) {
        lastTime = performance.now();
        animFrameId.current = requestAnimationFrame(render);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const render = (time: number) => {
      if (!isTabVisible) {
        animFrameId.current = null;
        return;
      }

      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // Smooth mouse lerp damping
      mousePos.current.currentX += (mousePos.current.targetX - mousePos.current.currentX) * 0.06;
      mousePos.current.currentY += (mousePos.current.targetY - mousePos.current.currentY) * 0.06;

      ctx.clearRect(0, 0, width, height);

      // If reduced motion is requested, render static calm particles once and pause
      if (isReducedMotion.current) {
        particles.forEach((p) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = `${p.color}0.25)`;
          ctx.fill();
        });
        animFrameId.current = null;
        return;
      }

      const scrollOffset = (scrollY.current * 0.04) % height;

      // Draw and update each particle
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Organic twinkling
        const twinkle = Math.sin(time * p.twinkleSpeed + p.twinkleOffset);
        p.alpha = Math.max(0.08, Math.min(0.7, p.baseAlpha + twinkle * 0.25));

        // Update position
        p.x += p.vx * dt * 60;
        p.y += p.vy * dt * 60;

        // Wrap around boundaries
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        // Apply slight parallax offset
        const drawX = p.x + mousePos.current.currentX * (p.radius * 0.35);
        const drawY = ((p.y - scrollOffset + height) % height) + mousePos.current.currentY * (p.radius * 0.35);

        // Render soft glow motes
        ctx.beginPath();
        ctx.arc(drawX, drawY, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${p.alpha})`;
        ctx.fill();

        // Outer halo for larger particles
        if (p.radius > 2.0) {
          ctx.beginPath();
          ctx.arc(drawX, drawY, p.radius * 2.2, 0, Math.PI * 2);
          ctx.fillStyle = `${p.color}${p.alpha * 0.25})`;
          ctx.fill();
        }
      }

      // Parallax update on background blobs container
      if (containerRef.current) {
        const blobDriftX = mousePos.current.currentX * 0.6;
        const blobDriftY = mousePos.current.currentY * 0.6 - (scrollY.current * 0.02);
        containerRef.current.style.transform = `translate3d(${blobDriftX.toFixed(2)}px, ${blobDriftY.toFixed(2)}px, 0)`;
      }

      // Parallax update on photographic background image
      if (imageLayerRef.current && !isReducedMotion.current) {
        const imgDriftX = -mousePos.current.currentX * 0.35;
        const imgDriftY = -mousePos.current.currentY * 0.35 - (scrollY.current * 0.035);
        imageLayerRef.current.style.transform = `translate3d(${imgDriftX.toFixed(2)}px, ${imgDriftY.toFixed(2)}px, 0) scale(1.04)`;
      }

      animFrameId.current = requestAnimationFrame(render);
    };

    // Lazy init rendering on idle
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        animFrameId.current = requestAnimationFrame(render);
      });
    } else {
      setTimeout(() => {
        animFrameId.current = requestAnimationFrame(render);
      }, 50);
    }

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      motionQuery.removeEventListener('change', handleMotionChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
        backgroundColor: '#0c1a13',
      }}
    >
      {/* 0. LAYER 0: Attached Disaster Recovery Photo Backdrop */}
      <div
        ref={imageLayerRef}
        style={{
          position: 'absolute',
          inset: '-4%',
          width: '108%',
          height: '108%',
          backgroundImage: "url('/background.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.9,
          filter: 'contrast(1.05) brightness(0.82) saturate(1.05)',
          willChange: 'transform',
          transform: 'scale(1.01)',
          transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />

      {/* Atmospheric solid forest scrim overlay: guarantees text legibility while preserving imagery */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to bottom, rgba(12, 26, 19, 0.78) 0%, rgba(12, 26, 19, 0.62) 35%, rgba(12, 26, 19, 0.86) 75%, rgba(12, 26, 19, 0.98) 100%)',
        }}
      />

      {/* 3. LAYER 3: Ambient Light Particle Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
        }}
      />

      {/* 4. LAYER 4: Micro Film Grain Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.035,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />

      {/* Top subtle vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 50%, transparent 40%, rgba(8, 18, 13, 0.65) 100%)',
        }}
      />
    </div>
  );
};
