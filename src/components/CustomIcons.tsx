import React from "react";
import Svg, { Path, Rect, Line, G } from "react-native-svg";

interface IconProps {
  size?: number;
  color?: string;
}

export const FireplaceIcon: React.FC<IconProps> = ({ size = 20, color = "#000" }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <G fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      {/* Top mantel */}
      <Path d="M 15 20 L 85 20 L 85 28 L 15 28 Z" />

      {/* Mantel support */}
      <Path d="M 18 28 L 22 35 L 78 35 L 82 28" />

      {/* Left column */}
      <Path d="M 22 35 L 22 80 L 35 80 L 35 35" />

      {/* Right column */}
      <Path d="M 65 35 L 65 80 L 78 80 L 78 35" />

      {/* Bottom base line */}
      <Line x1="22" y1="80" x2="78" y2="80" />

      {/* Left foot */}
      <Rect x="18" y="80" width="20" height="8" rx="2" />

      {/* Right foot */}
      <Rect x="62" y="80" width="20" height="8" rx="2" />

      {/* Arched opening */}
      <Path d="M 35 80 L 35 55 A 15 15 0 0 1 65 55 L 65 80" />

      {/* Center flame */}
      <Path d="M 50 75 Q 45 65, 50 55 Q 55 65, 50 75" />

      {/* Left flame */}
      <Path d="M 43 75 Q 38 68, 43 60 Q 46 66, 45 70 Q 48 68, 43 75" />

      {/* Right flame */}
      <Path d="M 57 75 Q 62 68, 57 60 Q 54 66, 55 70 Q 52 68, 57 75" />

      {/* Log */}
      <Path d="M 42 77 Q 50 80, 58 77" />
    </G>
  </Svg>
);

export const StaircaseIcon: React.FC<IconProps> = ({ size = 20, color = "#000" }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <G fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
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
    <G fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      {/* Outer frame */}
      <Path d="M 15 15 L 15 90 L 85 90 L 85 15 Z"/>

      {/* Horizontal shelves */}
      <Path d="M 15 30 L 85 30"/>
      <Path d="M 15 45 L 85 45"/>
      <Path d="M 15 60 L 85 60"/>
      <Path d="M 15 75 L 85 75"/>

      {/* Vertical divider */}
      <Path d="M 50 15 L 50 90"/>
    </G>
  </Svg>
);

export const BrickWallIcon: React.FC<IconProps> = ({ size = 20, color = "#000" }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <G fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      {/* Row 1 - Full bricks */}
      <Rect x="15" y="15" width="30" height="12" rx="1" />
      <Rect x="48" y="15" width="30" height="12" rx="1" />

      {/* Row 2 - Offset bricks */}
      <Rect x="15" y="30" width="15" height="12" rx="1" />
      <Rect x="33" y="30" width="30" height="12" rx="1" />
      <Rect x="66" y="30" width="12" height="12" rx="1" />

      {/* Row 3 - Full bricks */}
      <Rect x="15" y="45" width="30" height="12" rx="1" />
      <Rect x="48" y="45" width="30" height="12" rx="1" />

      {/* Row 4 - Offset bricks */}
      <Rect x="15" y="60" width="15" height="12" rx="1" />
      <Rect x="33" y="60" width="30" height="12" rx="1" />
      <Rect x="66" y="60" width="12" height="12" rx="1" />

      {/* Row 5 - Full bricks */}
      <Rect x="15" y="75" width="30" height="12" rx="1" />
      <Rect x="48" y="75" width="30" height="12" rx="1" />
    </G>
  </Svg>
);
