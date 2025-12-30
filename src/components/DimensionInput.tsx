import React, { useRef, RefObject } from "react";
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
  nextFieldRef?: RefObject<TextInput>;
}

export function DimensionInput({
  label,
  feetValue,
  inchesValue,
  onFeetChange,
  onInchesChange,
  error,
  className,
  nextFieldRef,
}: DimensionInputProps) {
  const feetRef = useRef<TextInput>(null);
  const inchesRef = useRef<TextInput>(null);

  const isFinal = !nextFieldRef;

  const handleInchesSubmit = () => {
    if (nextFieldRef?.current) {
      nextFieldRef.current.focus();
    } else {
      Keyboard.dismiss();
    }
  };

  // Filter numeric input for default keyboard
  const handleFeetChange = (text: string) => {
    const filtered = text.replace(/[^0-9.-]/g, '');
    onFeetChange(filtered);
  };

  const handleInchesChange = (text: string) => {
    const filtered = text.replace(/[^0-9.-]/g, '');
    onInchesChange(filtered);
  };

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
              onChangeText={handleFeetChange}
              placeholder="0"
              placeholderTextColor={Colors.mediumGray}
              keyboardType="default"
              returnKeyType="next"
              enablesReturnKeyAutomatically={false}
              blurOnSubmit={false}
              onSubmitEditing={() => inchesRef.current?.focus()}
              cursorColor={Colors.primaryBlue}
              selectionColor={Colors.primaryBlue}
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
              onChangeText={handleInchesChange}
              placeholder="0"
              placeholderTextColor={Colors.mediumGray}
              keyboardType="default"
              returnKeyType={isFinal ? "done" : "next"}
              enablesReturnKeyAutomatically={false}
              blurOnSubmit={isFinal}
              onSubmitEditing={handleInchesSubmit}
              cursorColor={Colors.primaryBlue}
              selectionColor={Colors.primaryBlue}
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
