import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { ReliefGlobe } from './ReliefGlobe';
import { StaticGlobeFallback } from './StaticGlobeFallback';
import { useGraphicsTier } from '../../utils/webglDetect';
import type { Campaign } from '../../types';
import { Move3d } from 'lucide-react';

interface HeroSceneProps {
  campaigns: Campaign[];
  onSelectCampaign?: (campaignId: number) => void;
}

export const HeroScene: React.FC<HeroSceneProps> = ({ campaigns, onSelectCampaign }) => {
  const caps = useGraphicsTier();

  // If Static Tier or prefers-reduced-motion, render elegant 2D fallback directly
  if (caps.tier === 'STATIC') {
    return <StaticGlobeFallback onExploreClick={() => onSelectCampaign && onSelectCampaign(0)} />;
  }

  return (
    <div
      style={{
        width: '100%',
        height: '420px',
        position: 'relative',
        borderRadius: '24px',
        overflow: 'hidden',
        background: 'radial-gradient(circle at 50% 50%, #1c382a 0%, #162e22 55%, #0c1a13 100%)',
        border: '1px solid #784524',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 30px rgba(180, 83, 9, 0.2)',
      }}
    >
      {/* Interactive Controls Overlay Badge */}
      <div
        style={{
          position: 'absolute',
          top: '1rem',
          left: '1.25rem',
          zIndex: 10,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.35rem 0.75rem',
          borderRadius: '9999px',
          backgroundColor: '#0c1a13',
          border: '1px solid #784524',
          color: '#f6c492',
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: '0.04em',
        }}
      >
        <Move3d size={14} color="#f59e0b" />
        Interactive 3D Relief Grid (Drag to Rotate)
      </div>

      {/* Floating Active Beacons Indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: '1rem',
          right: '1.25rem',
          zIndex: 10,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.35rem 0.75rem',
          borderRadius: '9999px',
          backgroundColor: '#0c1a13',
          border: '1px solid #236943',
          color: '#34d399',
          fontSize: '0.75rem',
          fontWeight: 600,
        }}
      >
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            boxShadow: '0 0 8px #10b981',
          }}
        />
        Click Beacon Nodes to Inspect Crisis
      </div>

      {/* R3F 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 45 }}
        dpr={[1, caps.maxDpr]}
        gl={{
          antialias: caps.tier === 'FULL',
          powerPreference: 'high-performance',
          alpha: true,
        }}
        aria-hidden="true"
        style={{ width: '100%', height: '100%' }}
      >
        {/* Atmospheric Depth Fog */}
        <fog attach="fog" args={['#0c1a13', 4.2, 9.5]} />

        {/* Harmonized Forest & Warm Lighting */}
        <ambientLight intensity={1.1} color="#2d5a3f" />
        <directionalLight position={[5, 8, 5]} intensity={1.5} color="#fbbf24" />
        <directionalLight position={[-5, -4, -3]} intensity={1.0} color="#34d399" />
        <pointLight position={[0, 0, 4]} intensity={0.9} color="#c27838" />

        <Suspense fallback={null}>
          <ReliefGlobe
            campaigns={campaigns}
            onSelectCampaign={onSelectCampaign}
            tier={caps.tier}
          />
          {/* Constrained Orbit Controls so user never gets disoriented or lost */}
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            rotateSpeed={0.6}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={(Math.PI * 2) / 3}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};
