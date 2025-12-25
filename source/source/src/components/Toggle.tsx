import React from "react";
import { View, Text, Switch } from "react-native";
import { Colors, Typography, Spacing } from "../utils/designSystem";
import { cn } from "../utils/cn";

interface ToggleProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  description?: string;
  className?: string;
}

export function Toggle({
  label,
  value,
  onValueChange,
  description,
  className,
}: ToggleProps) {
  return (
    <View className={cn("mb-4", className)}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View style={{ flex: 1, marginRight: Spacing.md }}>
          <Text
            style={{
              fontSize: Typography.body.fontSize,
              fontWeight: Typography.body.fontWeight,
              color: Colors.darkCharcoal,
            }}
          >
            {label}
          </Text>
          {description && (
            <Text
              style={{
                fontSize: Typography.caption.fontSize,
                color: Colors.mediumGray,
                marginTop: Spacing.xs,
              }}
            >
              {description}
            </Text>
          )}
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{
            false: Colors.neutralGray,
            true: Colors.primaryBlue,
          }}
          thumbColor={Colors.white}
          ios_backgroundColor={Colors.neutralGray}
        />
      </View>
    </View>
  );
}
