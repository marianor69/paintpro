import React from "react";
import Svg, { Path, Rect, Line, G } from "react-native-svg";

interface IconProps {
  size?: number;
  color?: string;
}

export const FireplaceIcon: React.FC<IconProps> = ({ size = 20, color = "#000" }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <G fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
      {/* Top mantel */}
      <Path d="M 10 10 L 90 10 L 90 20 L 10 20 Z" />

      {/* Mantel support */}
      <Path d="M 12 20 L 18 28 L 82 28 L 88 20" />

      {/* Left column */}
      <Path d="M 18 28 L 18 85 L 32 85 L 32 28" />

      {/* Right column */}
      <Path d="M 68 28 L 68 85 L 82 85 L 82 28" />

      {/* Bottom base line */}
      <Line x1="18" y1="85" x2="82" y2="85" />

      {/* Left foot */}
      <Rect x="12" y="85" width="22" height="8" rx="2" />

      {/* Right foot */}
      <Rect x="66" y="85" width="22" height="8" rx="2" />

      {/* Arched opening */}
      <Path d="M 32 85 L 32 58 A 18 18 0 0 1 68 58 L 68 85" />

      {/* Center flame */}
      <Path d="M 50 80 Q 44 68, 50 55 Q 56 68, 50 80" />

      {/* Left flame */}
      <Path d="M 40 80 Q 34 70, 40 58 Q 44 66, 46 72 Q 48 70, 40 80" />

      {/* Right flame */}
      <Path d="M 60 80 Q 66 70, 60 58 Q 56 66, 54 72 Q 52 70, 60 80" />

      {/* Log */}
      <Path d="M 40 82 Q 50 86, 60 82" />
    </G>
  </Svg>
);

export const StaircaseIcon: React.FC<IconProps> = ({ size = 20, color = "#000" }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <G fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
      {/* Diagonal handrail */}
      <Path d="M 10 70 L 90 10" />

      {/* Base line */}
      <Path d="M 10 90 L 90 90" />

      {/* Step risers (vertical lines) */}
      <Path d="M 30 90 L 30 55" />
      <Path d="M 50 75 L 50 40" />
      <Path d="M 70 60 L 70 25" />
      <Path d="M 90 90 L 90 10" />

      {/* Step treads (horizontal lines) */}
      <Path d="M 30 75 L 50 75" />
      <Path d="M 50 60 L 70 60" />
      <Path d="M 70 45 L 90 45" />
    </G>
  </Svg>
);

export const BuiltInIcon: React.FC<IconProps> = ({ size = 20, color = "#000" }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <G fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
      {/* Outer frame */}
      <Path d="M 10 10 L 10 90 L 90 90 L 90 10 Z"/>

      {/* Horizontal shelves */}
      <Path d="M 10 28 L 90 28"/>
      <Path d="M 10 46 L 90 46"/>
      <Path d="M 10 64 L 90 64"/>
      <Path d="M 10 82 L 90 82"/>

      {/* Vertical divider */}
      <Path d="M 50 10 L 50 90"/>
    </G>
  </Svg>
);

export const BrickWallIcon: React.FC<IconProps> = ({ size = 20, color = "#000" }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <G fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
      {/* Row 1 - Full bricks */}
      <Rect x="10" y="10" width="38" height="14" rx="1" />
      <Rect x="52" y="10" width="38" height="14" rx="1" />

      {/* Row 2 - Offset bricks */}
      <Rect x="10" y="28" width="18" height="14" rx="1" />
      <Rect x="32" y="28" width="38" height="14" rx="1" />
      <Rect x="74" y="28" width="16" height="14" rx="1" />

      {/* Row 3 - Full bricks */}
      <Rect x="10" y="46" width="38" height="14" rx="1" />
      <Rect x="52" y="46" width="38" height="14" rx="1" />

      {/* Row 4 - Offset bricks */}
      <Rect x="10" y="64" width="18" height="14" rx="1" />
      <Rect x="32" y="64" width="38" height="14" rx="1" />
      <Rect x="74" y="64" width="16" height="14" rx="1" />

      {/* Row 5 - Full bricks */}
      <Rect x="10" y="82" width="38" height="14" rx="1" />
      <Rect x="52" y="82" width="38" height="14" rx="1" />
    </G>
  </Svg>
);

export const NonFourWallRoomIcon: React.FC<IconProps> = ({ size = 20, color = "#0066CC" }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <G fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
      {/* Irregular hexagon with right side removed for testing */}
      <Path d="M 72 15 L 28 15 L 10 50 L 28 85 L 72 85" />
    </G>
  </Svg>
);
