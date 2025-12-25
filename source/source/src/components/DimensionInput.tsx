import React, { useRef } from "react";
import { View, Text, TextInput, Keyboard } from "react-native";
import { Colors, Typography, Spacing, BorderRadius } from "../utils/designSystem";
import { cn } from "../utils/cn";

interface DimensionInputProps {
  label: string;
  feetValue: string;
  inchesValue: string;
  onFeetChange: (text: string) => void;
  onInchesChange: (text: string) => void;
  error?: string;
  className?: string;
}

export function DimensionInput({
  label,
  feetValue,
  inchesValue,
  onFeetChange,
  onInchesChange,
  error,
  className,
}: DimensionInputProps) {
  const feetRef = useRef<TextInput>(null);
  const inchesRef = useRef<TextInput>(null);

  return (
    <View className={cn("mb-4", className)}>
      <Text
        style={{
          fontSize: Typography.body.fontSize,
          fontWeight: Typography.body.fontWeight,
          color: Colors.darkCharcoal,
          marginBottom: Spacing.xs,
        }}
      >
        {label}
      </Text>
      <View style={{ flexDirection: "row", gap: Spacing.sm }}>
        {/* Feet Input */}
        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: Colors.white,
              borderRadius: BorderRadius.default,
              borderWidth: 1,
              borderColor: error ? Colors.error : Colors.neutralGray,
              paddingHorizontal: Spacing.md,
              paddingVertical: Spacing.sm,
            }}
          >
            <TextInput
              ref={feetRef}
              value={feetValue}
              onChangeText={onFeetChange}
              placeholder="0"
              placeholderTextColor={Colors.mediumGray}
              keyboardType="numeric"
              returnKeyType="next"
              onSubmitEditing={() => inchesRef.current?.focus()}
              style={{
                flex: 1,
                fontSize: Typography.body.fontSize,
                color: Colors.darkCharcoal,
                padding: 0,
              }}
            />
            <Text
              style={{
                fontSize: Typography.body.fontSize,
                color: Colors.mediumGray,
                marginLeft: Spacing.xs,
              }}
            >
              ft
            </Text>
          </View>
        </View>

        {/* Inches Input */}
        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: Colors.white,
              borderRadius: BorderRadius.default,
              borderWidth: 1,
              borderColor: error ? Colors.error : Colors.neutralGray,
              paddingHorizontal: Spacing.md,
              paddingVertical: Spacing.sm,
            }}
          >
            <TextInput
              ref={inchesRef}
              value={inchesValue}
              onChangeText={onInchesChange}
              placeholder="0"
              placeholderTextColor={Colors.mediumGray}
              keyboardType="numeric"
              returnKeyType="done"
              onSubmitEditing={() => Keyboard.dismiss()}
              style={{
                flex: 1,
                fontSize: Typography.body.fontSize,
                color: Colors.darkCharcoal,
                padding: 0,
              }}
            />
            <Text
              style={{
                fontSize: Typography.body.fontSize,
                color: Colors.mediumGray,
                marginLeft: Spacing.xs,
              }}
            >
              in
            </Text>
          </View>
        </View>
      </View>
      {error && (
        <Text
          style={{
            fontSize: Typography.caption.fontSize,
            color: Colors.error,
            marginTop: Spacing.xs,
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}
