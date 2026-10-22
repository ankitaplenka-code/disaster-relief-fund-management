import React, { useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGraphicsTier } from '../../utils/webglDetect';
import { CheckCircle2, Sparkles, X } from 'lucide-react';

interface DonationCelebration3DProps {
  isOpen: boolean;
  onClose: () => void;
  campaignName: string;
  amountEth: string;
}

// 3D Bursting Particles Mesh
const CelebrationParticles: React.FC<{ tier: 'FULL' | 'REDUCED' | 'STATIC' }> = ({ tier }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = tier === 'REDUCED' ? 120 : 350;

  const [positions, colors, velocities] = React.useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);

    const amberColor = new THREE.Color('#fbbf24');
    const bronzeColor = new THREE.Color('#c27838');
    const emeraldColor = new THREE.Color('#10b981');
    const ivoryColor = new THREE.Color('#fdfbf7');

    for (let i = 0; i < count; i++) {
      // Start near center
      pos[i * 3] = (Math.random() - 0.5) * 0.2;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.2;

      // Radial velocities bursting outwards
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const speed = 1.8 + Math.random() * 3.2;

      vel[i * 3] = speed * Math.sin(phi) * Math.cos(theta);
      vel[i * 3 + 1] = speed * Math.sin(phi) * Math.sin(theta) + 1.2; // Upward buoyant bias
      vel[i * 3 + 2] = speed * Math.cos(phi);

      // Color selection (Amber, Bronze, Emerald, Ivory)
      const randColor = Math.random();
      const chosenColor =
        randColor > 0.75
          ? amberColor
          : randColor > 0.5
          ? bronzeColor
          : randColor > 0.25
          ? emeraldColor
          : ivoryColor;
      col[i * 3] = chosenColor.r;
      col[i * 3 + 1] = chosenColor.g;
      col[i * 3 + 2] = chosenColor.b;
    }

    return [pos, col, vel];
  }, [count]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const geo = pointsRef.current.geometry;
    const posAttr = geo.attributes.position as THREE.BufferAttribute;
    const array = posAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      array[i * 3] += velocities[i * 3] * delta;
      array[i * 3 + 1] += velocities[i * 3 + 1] * delta;
      array[i * 3 + 2] += velocities[i * 3 + 2] * delta;

      // Gentle gravity deceleration
      velocities[i * 3 + 1] -= 1.5 * delta;
    }

    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={tier === 'REDUCED' ? 0.08 : 0.12}
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation
      />
    </points>
  );
};

export const DonationCelebration3D: React.FC<DonationCelebration3DProps> = ({
  isOpen,
  onClose,
  campaignName,
  amountEth,
}) => {
  const caps = useGraphicsTier();

  // Auto-close after 2.4 seconds if not dismissed sooner
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      onClose();
    }, 2400);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 2000,
        backgroundColor: 'rgba(5, 12, 8, 0.82)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
      onClick={onClose}
      aria-label="Celebration overlay - click anywhere or press Escape to skip"
    >
      {/* 3D Particle Canvas Overlay (Rendered unless Reduced Motion is set) */}
      {caps.tier !== 'STATIC' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          <Canvas
            camera={{ position: [0, 0, 4.5], fov: 50 }}
            dpr={[1, caps.maxDpr]}
            gl={{ alpha: true, antialias: false }}
            aria-hidden="true"
          >
            <ambientLight intensity={1.5} />
            <CelebrationParticles tier={caps.tier} />
          </Canvas>
        </div>
      )}

      {/* Central Notification Modal Card */}
      <div
        className="glass-card modal-fade-in"
        style={{
          position: 'relative',
          zIndex: 10,
          maxWidth: '460px',
          width: '90%',
          backgroundColor: '#13261c',
          border: '1px solid #784524',
          borderRadius: '24px',
          padding: '2rem',
          textAlign: 'center',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95), 0 0 40px rgba(180, 83, 9, 0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            color: '#d4ded6',
            cursor: 'pointer',
            padding: '0.4rem',
            borderRadius: '8px',
          }}
          title="Dismiss"
        >
          <X size={18} />
        </button>

        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #78350f 0%, #b45309 50%, #c27838 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem auto',
            boxShadow: '0 0 25px rgba(180, 83, 9, 0.45)',
          }}
        >
          <Sparkles size={32} color="#fdfbf7" />
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.2rem 0.6rem',
            borderRadius: '9999px',
            backgroundColor: '#0c2417',
            border: '1px solid #10b981',
            color: '#34d399',
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            marginBottom: '0.75rem',
          }}
        >
          <CheckCircle2 size={13} />
          Donation Confirmed on Chain
        </div>

        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fdfbf7', margin: 0 }}>
          +{amountEth} ETH Contributed!
        </h3>

        <p style={{ fontSize: '0.9rem', color: '#d4ded6', margin: '0.6rem 0 1.25rem 0' }}>
          Thank you! Your emergency relief aid has been dispatched to{' '}
          <strong style={{ color: '#f6c492' }}>{campaignName}</strong>.
        </p>

        <div style={{ fontSize: '0.75rem', color: '#9cb0a1' }}>
          Click anywhere or press Esc to view receipt
        </div>
      </div>
    </div>
  );
};
