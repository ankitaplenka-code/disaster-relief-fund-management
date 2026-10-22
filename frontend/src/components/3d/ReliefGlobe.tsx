import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Campaign } from '../../types';

interface ReliefGlobeProps {
  campaigns?: Campaign[];
  onSelectCampaign?: (campaignId: number) => void;
  tier?: 'FULL' | 'REDUCED' | 'STATIC';
}

// Convert Lat/Lon to 3D Sphere Surface Coordinates
function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

export const ReliefGlobe: React.FC<ReliefGlobeProps> = ({
  campaigns: _campaigns,
  onSelectCampaign,
  tier = 'FULL',
}) => {
  const globeGroupRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);

  const [hoveredBeacon, setHoveredBeacon] = useState<number | null>(null);

  // Mapped beacon coordinates for active campaigns
  const beaconCoordinates = useMemo(() => [
    { lat: 26.2, lon: 92.9, campaignId: 0, label: 'Assam Emergency Flood Relief' },
    { lat: 11.6, lon: 76.1, campaignId: 1, label: 'Wayanad Hill Medical Mission' },
    { lat: 14.5, lon: 77.3, campaignId: 2, label: 'Southern Drought Zone Aid' },
    { lat: 34.0, lon: 74.8, campaignId: 0, label: 'Northern Winter Shelter' },
  ], []);

  // Beacon positions on the sphere surface (radius = 1.95)
  const beaconPoints = useMemo(() => {
    return beaconCoordinates.map((bc) => ({
      ...bc,
      pos: latLonToVector3(bc.lat, bc.lon, 1.95),
    }));
  }, [beaconCoordinates]);

  // Ambient particles constellation (warm amber motes)
  const particleCount = tier === 'REDUCED' ? 120 : 350;
  const particlePositions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const radius = 2.2 + Math.random() * 1.6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = radius * Math.cos(phi);
    }
    return pos;
  }, [particleCount]);

  // Smooth frame loop: auto-rotation, breathing pulse, and particle drift
  useFrame((_state, delta) => {
    if (globeGroupRef.current) {
      globeGroupRef.current.rotation.y += delta * 0.12;
    }

    if (ring1Ref.current) {
      ring1Ref.current.rotation.z += delta * 0.25;
      ring1Ref.current.rotation.x += delta * 0.15;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y += delta * -0.2;
      ring2Ref.current.rotation.z += delta * -0.15;
    }

    if (particlesRef.current) {
      particlesRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <group ref={globeGroupRef} dispose={null}>
      {/* 1. Core Solid Sphere (Deep Forest Green) */}
      <mesh>
        <sphereGeometry args={[1.88, 32, 32]} />
        <meshStandardMaterial
          color="#0c1a13"
          roughness={0.6}
          metalness={0.3}
          emissive="#162e22"
          emissiveIntensity={0.9}
        />
      </mesh>

      {/* 2. Geodesic Relief Grid (Warm Bronze Wireframe) */}
      <mesh>
        <icosahedronGeometry args={[1.93, 3]} />
        <meshStandardMaterial
          color="#8d5b2d"
          wireframe
          transparent
          opacity={0.45}
          emissive="#b45309"
          emissiveIntensity={0.7}
        />
      </mesh>

      {/* 3. Glowing Latitude & Longitude Meridian Rings (Emerald Green) */}
      <mesh>
        <sphereGeometry args={[1.94, 16, 12]} />
        <meshBasicMaterial
          color="#10b981"
          wireframe
          transparent
          opacity={0.25}
        />
      </mesh>

      {/* 4. Orthogonal Rescue Orbit Rings (Warm Amber & Warm Bronze) */}
      <mesh ref={ring1Ref} rotation={[Math.PI / 4, 0, 0]}>
        <torusGeometry args={[2.35, 0.016, 16, 80]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.75} />
      </mesh>

      <mesh ref={ring2Ref} rotation={[-Math.PI / 3, Math.PI / 6, 0]}>
        <torusGeometry args={[2.55, 0.014, 16, 80]} />
        <meshBasicMaterial color="#c27838" transparent opacity={0.7} />
      </mesh>

      {/* 5. Active Campaign Beacon Nodes (Emerald & Amber Accents) */}
      {beaconPoints.map((beacon, idx) => {
        const isHovered = hoveredBeacon === beacon.campaignId;
        const beaconColor = idx % 2 === 0 ? '#10b981' : '#fbbf24';
        const beaconEmissive = idx % 2 === 0 ? '#059669' : '#d97706';

        return (
          <group
            key={idx}
            position={beacon.pos}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHoveredBeacon(beacon.campaignId);
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              setHoveredBeacon(null);
              document.body.style.cursor = 'default';
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (onSelectCampaign) {
                onSelectCampaign(beacon.campaignId);
              }
            }}
          >
            {/* Beacon Pulsating Orb */}
            <mesh scale={isHovered ? [1.6, 1.6, 1.6] : [1, 1, 1]}>
              <sphereGeometry args={[0.08, 16, 16]} />
              <meshStandardMaterial
                color={isHovered ? '#fbbf24' : beaconColor}
                emissive={isHovered ? '#f59e0b' : beaconEmissive}
                emissiveIntensity={isHovered ? 2.8 : 1.8}
                roughness={0.2}
              />
            </mesh>

            {/* Glowing Beacon Pulse Halo Ring */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.1, 0.18, 24]} />
              <meshBasicMaterial
                color={isHovered ? '#fbbf24' : beaconColor}
                transparent
                opacity={isHovered ? 0.95 : 0.6}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        );
      })}

      {/* 6. Ambient Floating Particle Constellation (Warm Amber & Caramel) */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={tier === 'REDUCED' ? 0.045 : 0.055}
          color="#f6c492"
          transparent
          opacity={0.75}
          sizeAttenuation
        />
      </points>
    </group>
  );
};
