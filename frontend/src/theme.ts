// ReliefChain Shared Design Tokens
// Opaque Forest Green & Warm Brown Palette with High-Contrast Typography

export const THEME = {
  colors: {
    // Base solid forest green spectrum (opaque, no washed out cards)
    base: {
      deep: '#08120d',            // Deepest abyss
      dark: '#0c1a13',            // Core app background
      surface: '#112319',         // Surface backdrop
      surfaceElevated: '#162e22', // Elevated panels / cards
      card: '#162e22',            // Solid opaque forest green card fill
      cardHover: '#1c382a',       // Hover solid card fill
    },

    // Signature warm brown gradient (headings, primary buttons, hero highlights)
    signature: {
      from: '#78350f', // Rich Warm Brown
      via: '#92400e',  // Deep Amber Brown
      to: '#b45309',   // Warm Bronze
      css: 'linear-gradient(135deg, #78350f 0%, #92400e 45%, #b45309 100%)',
      glow: '0 0 25px rgba(180, 83, 9, 0.4)',
    },

    // Warm accents & lighting
    warm: {
      amber: '#d97706',
      amberBright: '#fbbf24',
      caramel: '#c27838',
      bronze: '#8d5b2d',
      gold: '#f59e0b',
    },

    // Accent lights & 3D rim lighting (warm bronze & emerald green)
    neon: {
      cyan: '#14b8a6',          // Teal Sage
      cyanBright: '#2dd4bf',
      magenta: '#c27838',       // Warm Caramel Bronze
      magentaBright: '#f6c492',
      amber: '#f59e0b',         // Warm Amber
      amberBright: '#fbbf24',
      blue: '#0d9488',          // Deep Teal
      blueBright: '#2dd4bf',
    },

    // Semantic colors (high-contrast against forest green)
    semantic: {
      // Donations / Credits (Luminous Emerald)
      donation: '#10b981',
      donationBright: '#34d399',
      donationBg: '#133523',
      donationBorder: '#236943',
      donationGlow: '0 0 20px rgba(16, 185, 129, 0.35)',

      // Withdrawals / Debits (Glowing Coral Red)
      withdrawal: '#e11d48',
      withdrawalBright: '#fb7185',
      withdrawalBg: '#391419',
      withdrawalBorder: '#78232c',
      withdrawalGlow: '0 0 20px rgba(225, 29, 72, 0.35)',

      // Warnings / Pending (Warm Amber)
      warning: '#f59e0b',
      warningBg: '#34220b',
      warningBorder: '#784d14',
    },

    // Distinct contrasting borders
    border: {
      subtle: '#264232',
      medium: '#5c3a21',
      active: '#8d5b2d',
      warmGlow: 'rgba(180, 115, 60, 0.35)',
      cyanGlow: 'rgba(20, 184, 166, 0.35)',
    },

    // High-contrast typography
    text: {
      primary: '#fdfbf7',       // Crisp Warm Ivory (11:1+ contrast on #0c1a13 and #162e22)
      secondary: '#d4ded6',     // Readable Soft Sage (7:1+ contrast)
      muted: '#9cb0a1',         // Muted Sage Gray (4.8:1+ contrast)
      accent: '#f6c492',        // Warm Caramel highlight
    },
  },

  // 3D Scene Material & Light Settings (Harmonized Forest & Warm Amber)
  three: {
    fogColor: '#0c1a13',
    fogNear: 5,
    fogFar: 25,
    ambientLightColor: '#2d5a3f',
    ambientIntensity: 1.1,
    directionalLightColor: '#fbbf24',
    directionalIntensity: 1.5,
    rimLightColor: '#c27838',
    rimLightIntensity: 1.6,
  },
} as const;
