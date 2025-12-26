import React, { useRef } from "react";
import { View, Text, TextInput, Pressable, Keyboard } from "react-native";
import { Colors, Typography, Spacing, BorderRadius } from "../utils/designSystem";
import { cn } from "../utils/cn";

interface NumericInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  unit?: string;
  error?: string;
  className?: string;
  returnKeyType?: "done" | "next";
  onSubmitEditing?: () => void;
  blurOnSubmit?: boolean;
}

export function NumericInput({
  label,
  value,
  onChangeText,
  placeholder = "0",
  unit,
  error,
  className,
  returnKeyType = "done",
  onSubmitEditing,
  blurOnSubmit = true,
}: NumericInputProps) {
  const inputRef = useRef<TextInput>(null);

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
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.mediumGray}
          keyboardType="numeric"
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing || (() => Keyboard.dismiss())}
          blurOnSubmit={blurOnSubmit}
          cursorColor={Colors.primaryBlue}
          selectionColor={Colors.primaryBlue}
          style={{
            flex: 1,
            fontSize: Typography.body.fontSize,
            color: Colors.darkCharcoal,
            padding: 0,
          }}
        />
        {unit && (
          <Text
            style={{
              fontSize: Typography.body.fontSize,
              color: Colors.mediumGray,
              marginLeft: Spacing.xs,
            }}
          >
            {unit}
          </Text>
        )}
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

      {/* Done Button Overlay */}
      <Pressable
        onPress={() => {
          Keyboard.dismiss();
        }}
        style={{
          position: "absolute",
          right: Spacing.sm,
          bottom: error ? Spacing.lg + Spacing.sm : Spacing.sm,
          backgroundColor: Colors.primaryBlue,
          paddingHorizontal: Spacing.md,
          paddingVertical: Spacing.xs,
          borderRadius: 6,
        }}
      >
        <Text
          style={{
            fontSize: Typography.caption.fontSize,
            color: Colors.white,
            fontWeight: "600",
          }}
        >
          Done
        </Text>
      </Pressable>
    </View>
  );
}
