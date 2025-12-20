import React from "react";
import { View, ViewStyle } from "react-native";
import { Colors, BorderRadius, Spacing, Shadows } from "../utils/designSystem";
import { cn } from "../utils/cn";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
}

export function Card({ children, className, style }: CardProps) {
  return (
    <View
      className={cn("", className)}
      style={{
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.default,
        padding: Spacing.md,
        ...Shadows.card,
        ...style,
      }}
    >
      {children}
    </View>
  );
}
