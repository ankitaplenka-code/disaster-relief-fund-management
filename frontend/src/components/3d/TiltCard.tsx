import React, { useRef, useState, useCallback } from 'react';
import { useGraphicsTier } from '../../utils/webglDetect';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  maxTilt?: number; // degrees
  scale?: number;
}

export const TiltCard: React.FC<TiltCardProps> = ({
  children,
  className = '',
  style = {},
  maxTilt = 8,
  scale = 1.02,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const caps = useGraphicsTier();

  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // If Static tier or mobile, return plain container with standard hover
  const shouldDisable3D = caps.tier === 'STATIC' || caps.isMobile || caps.prefersReducedMotion;

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (shouldDisable3D || !cardRef.current) return;

      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Calculate tilt angles (-maxTilt to +maxTilt)
      const rotateX = ((y - centerY) / centerY) * -maxTilt;
      const rotateY = ((x - centerX) / centerX) * maxTilt;

      // Calculate glare position
      const glareX = (x / rect.width) * 100;
      const glareY = (y / rect.height) * 100;

      setTilt({ x: rotateX, y: rotateY });
      setGlare({ x: glareX, y: glareY, opacity: 0.15 });
    },
    [maxTilt, shouldDisable3D]
  );

  const handleMouseEnter = () => {
    if (!shouldDisable3D) setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
    setGlare((prev) => ({ ...prev, opacity: 0 }));
  };

  if (shouldDisable3D) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={className}
      style={{
        ...style,
        transformStyle: 'preserve-3d',
        transform: isHovered
          ? `perspective(1000px) rotateX(${tilt.x.toFixed(2)}deg) rotateY(${tilt.y.toFixed(2)}deg) scale3d(${scale}, ${scale}, ${scale})`
          : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
        boxShadow: isHovered
          ? '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px -5px rgba(168, 85, 247, 0.35)'
          : style.boxShadow || undefined,
        transition: isHovered
          ? 'transform 0.08s ease-out, box-shadow 0.2s ease'
          : 'transform 0.45s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.3s ease',
        position: 'relative',
        willChange: 'transform',
      }}
    >
      {/* Dynamic Sheen / Specular Light Reflection (Violet-Cyan Sheen) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 'inherit',
          pointerEvents: 'none',
          zIndex: 5,
          background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255, 255, 255, ${glare.opacity * 0.9}) 0%, rgba(168, 85, 247, ${glare.opacity * 1.4}) 30%, rgba(34, 211, 238, ${glare.opacity * 0.6}) 55%, transparent 70%)`,
          transition: 'opacity 0.25s ease',
        }}
      />
      {children}
    </div>
  );
};
