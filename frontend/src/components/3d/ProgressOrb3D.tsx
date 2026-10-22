import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGraphicsTier } from '../../utils/webglDetect';

interface ProgressOrb3DProps {
  progressPercent: number; // 0 to 100
  amountRaised: string;
  target: string;
  size?: number;
}

const InnerFluidSphere: React.FC<{ progressPercent: number }> = ({ progressPercent }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Radius scales from 0.25 up to 1.15 based on progress
  const targetScale = Math.max(0.25, Math.min(1.15, 0.25 + (progressPercent / 100) * 0.9));

  // Dynamic luminescence based on funding stage (Warm amber to radiant emerald)
  const coreColor =
    progressPercent >= 80 ? '#10b981' : progressPercent >= 40 ? '#fbbf24' : '#c27838';
  const emissiveColor =
    progressPercent >= 80 ? '#059669' : progressPercent >= 40 ? '#d97706' : '#8d5b2d';

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();

    // Gentle wave undulation
    const scaleOsc = targetScale + Math.sin(time * 2.5) * 0.03;
    meshRef.current.scale.set(scaleOsc, scaleOsc, scaleOsc);
    meshRef.current.rotation.y = time * 0.4;
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 24, 24]} />
      <meshStandardMaterial
        color={coreColor}
        emissive={emissiveColor}
        emissiveIntensity={1.4}
        roughness={0.2}
        metalness={0.4}
        transparent
        opacity={0.88}
      />
    </mesh>
  );
};

export const ProgressOrb3D: React.FC<ProgressOrb3DProps> = ({
  progressPercent,
  amountRaised,
  target,
  size = 180,
}) => {
  const caps = useGraphicsTier();

  // If Static tier, return clean 2D circular progress gauge
  if (caps.tier === 'STATIC') {
    return (
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          border: '4px solid #8d5b2d',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#162e22',
        }}
      >
        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f6c492' }}>
          {progressPercent}%
        </div>
        <div style={{ fontSize: '0.75rem', color: '#d4ded6' }}>Funded</div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        position: 'relative',
        borderRadius: '50%',
        overflow: 'hidden',
        background: 'radial-gradient(circle at 50% 50%, #26150b 0%, #162e22 70%, #0c1a13 100%)',
        boxShadow: '0 0 25px rgba(180, 83, 9, 0.35)',
        border: '1px solid #784524',
      }}
      title={`${progressPercent}% Funded (${amountRaised} / ${target} ETH)`}
    >
      <Canvas
        camera={{ position: [0, 0, 3], fov: 45 }}
        dpr={[1, caps.maxDpr]}
        gl={{ alpha: true, antialias: false }}
        aria-hidden="true"
      >
        <ambientLight intensity={1.1} color="#fbbf24" />
        <pointLight position={[3, 3, 3]} intensity={1.5} color="#fdfbf7" />
        <pointLight position={[-2, -2, -2]} intensity={1} color="#10b981" />

        {/* Outer Warm Bronze Quantum Shield */}
        <mesh>
          <sphereGeometry args={[1.25, 20, 16]} />
          <meshBasicMaterial
            color="#8d5b2d"
            wireframe
            transparent
            opacity={0.35}
          />
        </mesh>

        {/* Internal Dynamic Fluid Core */}
        <InnerFluidSphere progressPercent={progressPercent} />
      </Canvas>

      {/* Center Percentage Overlay */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          textAlign: 'center',
          zIndex: 2,
        }}
      >
        <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fdfbf7', textShadow: '0 2px 10px rgba(0,0,0,0.85)' }}>
          {progressPercent}%
        </div>
        <div style={{ fontSize: '0.7rem', color: '#f6c492', fontWeight: 600 }}>
          {amountRaised} ETH
        </div>
      </div>
    </div>
  );
};
