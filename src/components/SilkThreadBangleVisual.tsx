import React from 'react';

export interface BangleDesignConfig {
  primaryColor: string;
  secondaryColor?: string;
  embellishment?: 'kundan' | 'zardozi' | 'latkan' | 'mirror' | 'minimal-zari' | 'plain';
  stackCount?: number;
  hasLatkan?: boolean;
}

interface SilkThreadBangleVisualProps {
  config: BangleDesignConfig;
  className?: string;
  sizeLabel?: string;
}

export const SilkThreadBangleVisual: React.FC<SilkThreadBangleVisualProps> = ({
  config,
  className = "w-full h-full",
  sizeLabel
}) => {
  const { primaryColor, embellishment = 'kundan', hasLatkan = false } = config;
  const safeId = primaryColor.replace(/[^a-zA-Z0-9]/g, '');

  return (
    <div className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#FAF7F2] to-[#F3ECE2] ${className}`}>
      {/* Dynamic SVG Visual of Handcrafted Silk Thread Bangles */}
      <svg
        viewBox="0 0 600 600"
        className="w-full h-full object-contain p-4 drop-shadow-xl"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Dynamic Silk Thread Gradient */}
          <linearGradient id={`silkGrad-${safeId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={primaryColor} stopOpacity="0.85"/>
            <stop offset="45%" stopColor={primaryColor}/>
            <stop offset="55%" stopColor="#FFFFFF" stopOpacity="0.45"/>
            <stop offset="70%" stopColor={primaryColor}/>
            <stop offset="100%" stopColor="#000000" stopOpacity="0.4"/>
          </linearGradient>

          {/* Gold Zari Gradient */}
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9C7A28"/>
            <stop offset="30%" stopColor="#E4C158"/>
            <stop offset="50%" stopColor="#FFF3A8"/>
            <stop offset="70%" stopColor="#D4A017"/>
            <stop offset="100%" stopColor="#6E4D0C"/>
          </linearGradient>

          {/* Pearl Gradient */}
          <radialGradient id="pearlRad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#FFFFFF"/>
            <stop offset="60%" stopColor="#FFFDF5"/>
            <stop offset="100%" stopColor="#C9C2B3"/>
          </radialGradient>

          {/* Thread Wrap Texture */}
          <pattern id="threadPattern" width="4" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="16" stroke="#FFFFFF" strokeWidth="0.6" strokeOpacity="0.35"/>
            <line x1="2" y1="0" x2="2" y2="16" stroke="#000000" strokeWidth="0.6" strokeOpacity="0.25"/>
          </pattern>
        </defs>

        {/* Shadow on Velvet Base */}
        <ellipse cx="300" cy="450" rx="200" ry="60" fill="#2E1C14" opacity="0.22"/>

        {/* Bangle Stack Group */}
        <g transform="translate(0, -10)">
          {/* Hollow Interior */}
          <ellipse cx="300" cy="275" rx="160" ry="50" fill="#1A1816" opacity="0.85"/>
          
          {/* Cylindrical Silk Thread Bangle Body */}
          <path
            d="M 140,275 C 140,360 460,360 460,275 L 460,360 C 460,445 140,445 140,360 Z"
            fill={`url(#silkGrad-${safeId})`}
          />
          <path
            d="M 140,275 C 140,360 460,360 460,275 L 460,360 C 460,445 140,445 140,360 Z"
            fill="url(#threadPattern)"
          />

          {/* Silk Sheen Highlights */}
          <path
            d="M 180,335 C 230,395 360,410 420,355"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="10"
            strokeLinecap="round"
            opacity="0.35"
          />

          {/* Metallic Gold Borders */}
          <path d="M 140,275 C 140,360 460,360 460,275" fill="none" stroke="url(#goldGradient)" strokeWidth="5"/>
          <path d="M 140,360 C 140,445 460,445 460,360" fill="none" stroke="url(#goldGradient)" strokeWidth="5"/>

          {/* Kundan Stones Embellishment */}
          {embellishment === 'kundan' && (
            <g transform="translate(300, 365)">
              <circle cx="0" cy="0" r="18" fill="url(#goldGradient)"/>
              <circle cx="0" cy="0" r="14" fill="#FFFFFF" fillOpacity="0.85" stroke="url(#goldGradient)" strokeWidth="2"/>
              <circle cx="0" cy="-15" r="5" fill="#FFFFFF" fillOpacity="0.85" stroke="url(#goldGradient)" strokeWidth="1.5"/>
              <circle cx="15" cy="0" r="5" fill="#FFFFFF" fillOpacity="0.85" stroke="url(#goldGradient)" strokeWidth="1.5"/>
              <circle cx="0" cy="15" r="5" fill="#FFFFFF" fillOpacity="0.85" stroke="url(#goldGradient)" strokeWidth="1.5"/>
              <circle cx="-15" cy="0" r="5" fill="#FFFFFF" fillOpacity="0.85" stroke="url(#goldGradient)" strokeWidth="1.5"/>
              <circle cx="-60" cy="-8" r="8" fill="url(#pearlRad)"/>
              <circle cx="60" cy="-8" r="8" fill="url(#pearlRad)"/>
            </g>
          )}

          {/* Zardozi Gold Wire Work */}
          {embellishment === 'zardozi' && (
            <g>
              <path d="M 170,330 Q 230,380 300,350 T 430,350" fill="none" stroke="url(#goldGradient)" strokeWidth="4" strokeDasharray="5,4"/>
              <circle cx="300" cy="360" r="14" fill="url(#goldGradient)"/>
              <circle cx="300" cy="360" r="9" fill={primaryColor}/>
            </g>
          )}

          {/* Mirrorwork */}
          {embellishment === 'mirror' && (
            <g transform="translate(300, 365)">
              <circle cx="0" cy="0" r="14" fill="url(#goldGradient)"/>
              <circle cx="0" cy="0" r="10" fill="#E8F4F0" stroke="#FFFFFF" strokeWidth="1.5"/>
              <circle cx="-55" cy="-8" r="10" fill="url(#goldGradient)"/>
              <circle cx="-55" cy="-8" r="7.5" fill="#E8F4F0"/>
              <circle cx="55" cy="-8" r="10" fill="url(#goldGradient)"/>
              <circle cx="55" cy="-8" r="7.5" fill="#E8F4F0"/>
            </g>
          )}

          {/* Hanging Latkan Tassels */}
          {(hasLatkan || embellishment === 'latkan') && (
            <g transform="translate(300, 395)">
              <line x1="0" y1="0" x2="0" y2="40" stroke="url(#goldGradient)" strokeWidth="3"/>
              <circle cx="0" cy="20" r="4.5" fill="url(#goldGradient)"/>
              <circle cx="-10" cy="45" r="7" fill="url(#pearlRad)"/>
              <circle cx="10" cy="45" r="7" fill="url(#pearlRad)"/>
              <circle cx="0" cy="52" r="8" fill="url(#pearlRad)"/>
              <circle cx="0" cy="68" r="4" fill="url(#goldGradient)"/>
            </g>
          )}
        </g>

        {sizeLabel && (
          <text x="300" y="530" textAnchor="middle" fontSize="13" fontFamily="'Cormorant Garamond', Georgia, serif" fontWeight="700" fill="#1A1816" letterSpacing="2">
            SIZE {sizeLabel}
          </text>
        )}
      </svg>
    </div>
  );
};
