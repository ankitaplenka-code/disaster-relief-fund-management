// WebGL Device Capability & Reduced-Motion Detection Utility
import { useState, useEffect } from 'react';

export type GraphicsTier = 'FULL' | 'REDUCED' | 'STATIC';

export interface DeviceCapabilities {
  tier: GraphicsTier;
  webgl2: boolean;
  hasWebGL: boolean;
  prefersReducedMotion: boolean;
  isMobile: boolean;
  maxDpr: number;
}

/**
 * Perform synchronous check of device graphics capabilities
 */
export function detectGraphicsTier(): DeviceCapabilities {
  if (typeof window === 'undefined') {
    return {
      tier: 'STATIC',
      webgl2: false,
      hasWebGL: false,
      prefersReducedMotion: false,
      isMobile: false,
      maxDpr: 1,
    };
  }

  // 1. Accessibility: Check prefers-reduced-motion
  const prefersReducedMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    return {
      tier: 'STATIC',
      webgl2: false,
      hasWebGL: false,
      prefersReducedMotion: true,
      isMobile: false,
      maxDpr: 1,
    };
  }

  // 2. WebGL Support
  let hasWebGL = false;
  let webgl2 = false;

  try {
    const canvas = document.createElement('canvas');
    const gl2 = canvas.getContext('webgl2');
    if (gl2) {
      webgl2 = true;
      hasWebGL = true;
    } else {
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        hasWebGL = true;
      }
    }
  } catch {
    hasWebGL = false;
  }

  if (!hasWebGL) {
    return {
      tier: 'STATIC',
      webgl2: false,
      hasWebGL: false,
      prefersReducedMotion: false,
      isMobile: false,
      maxDpr: 1,
    };
  }

  // 3. Hardware & Mobile Detection
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (window.innerWidth <= 768 && 'ontouchstart' in window);

  const concurrency = navigator.hardwareConcurrency || 4;
  const isLowMemory = (navigator as any).deviceMemory ? (navigator as any).deviceMemory <= 4 : false;

  // Reduced 3D tier for mobile or low-power hardware
  if (isMobile || concurrency < 4 || isLowMemory || !webgl2) {
    return {
      tier: 'REDUCED',
      webgl2,
      hasWebGL: true,
      prefersReducedMotion: false,
      isMobile,
      maxDpr: 1,
    };
  }

  // Full 3D tier for capable desktop environments
  return {
    tier: 'FULL',
    webgl2: true,
    hasWebGL: true,
    prefersReducedMotion: false,
    isMobile: false,
    maxDpr: Math.min(window.devicePixelRatio || 1, 2),
  };
}

/**
 * React hook to listen for capability changes (e.g. reduced-motion toggled live)
 */
export function useGraphicsTier(): DeviceCapabilities {
  const [caps, setCaps] = useState<DeviceCapabilities>(() => detectGraphicsTier());

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => {
      setCaps(detectGraphicsTier());
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else if ((mediaQuery as any).addListener) {
      (mediaQuery as any).addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else if ((mediaQuery as any).removeListener) {
        (mediaQuery as any).removeListener(handleChange);
      }
    };
  }, []);

  return caps;
}
