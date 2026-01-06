import React, { useRef, RefObject, useId, useState } from "react";
import { View, Text, TextInput, Keyboard, Platform, InputAccessoryView, Pressable } from "react-native";
import { Colors, Typography, Spacing, BorderRadius } from "../utils/designSystem";
import { cn } from "../utils/cn";

interface DimensionInputProps {
  label: string;
  feetValue: string;
  inchesValue: string;
  onFeetChange: (text: string) => void;
  onInchesChange: (text: string) => void;
  previousFieldRef?: RefObject<TextInput>;
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
  previousFieldRef,
  error,
  className,
  nextFieldRef,
}: DimensionInputProps) {
  const uniqueId = useId();
  const feetRef = useRef<TextInput>(null);
  const inchesRef = useRef<TextInput>(null);
  const [focusedField, setFocusedField] = useState<"feet" | "inches" | null>(null);

  const isFinal = !nextFieldRef;
  const shouldShowAccessory = Platform.OS === "ios" && (nextFieldRef || isFinal);
  const accessoryID = shouldShowAccessory ? `dimensionInput-${uniqueId}` : undefined;

  const handlePrevious = () => {
    if (focusedField === "inches") {
      feetRef.current?.focus();
    } else {
      previousFieldRef?.current?.focus();
    }
  };

  const handleNext = () => {
    if (focusedField === "feet") {
      inchesRef.current?.focus();
      return;
    }
    if (nextFieldRef?.current) {
      nextFieldRef.current.focus();
    } else {
      Keyboard.dismiss();
    }
  };

  const handleDone = () => {
    Keyboard.dismiss();
  };

  const handleInchesSubmit = () => {
    if (nextFieldRef?.current) {
      nextFieldRef.current.focus();
    } else {
      Keyboard.dismiss();
    }
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
              onChangeText={onFeetChange}
              placeholder="0"
              placeholderTextColor={Colors.mediumGray}
              keyboardType="numeric"
              returnKeyType="next"
              enablesReturnKeyAutomatically={false}
              blurOnSubmit={false}
              onSubmitEditing={() => inchesRef.current?.focus()}
              inputAccessoryViewID={accessoryID}
              onFocus={() => setFocusedField("feet")}
              // ⛔ DO NOT REMOVE - Required for iOS cursor/selection (KB-003, ADDR-098)
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
              onChangeText={onInchesChange}
              placeholder="0"
              placeholderTextColor={Colors.mediumGray}
              keyboardType="numeric"
              returnKeyType={isFinal ? "done" : "next"}
              enablesReturnKeyAutomatically={false}
              blurOnSubmit={isFinal}
              onSubmitEditing={handleInchesSubmit}
              inputAccessoryViewID={accessoryID}
              onFocus={() => setFocusedField("inches")}
              // ⛔ DO NOT REMOVE - Required for iOS cursor/selection (KB-003, ADDR-098)
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

      {/* iOS InputAccessoryView for numeric keyboard */}
      {Platform.OS === "ios" && accessoryID && (
        <InputAccessoryView nativeID={accessoryID}>
          <View
            style={{
              backgroundColor: "#f1f1f1",
              paddingHorizontal: Spacing.md,
              paddingVertical: Spacing.sm,
              flexDirection: "row",
              justifyContent: "flex-end",
            }}
          >
            <Pressable
              onPress={handlePrevious}
              disabled={!previousFieldRef && focusedField !== "inches"}
              style={{
                paddingHorizontal: Spacing.lg,
                paddingVertical: Spacing.sm,
              }}
            >
              <Text
                style={{
                  fontSize: Typography.body.fontSize,
                  color: (!previousFieldRef && focusedField !== "inches") ? "#c7c7c7" : "#007AFF",
                  fontWeight: "400",
                }}
              >
                Previous
              </Text>
            </Pressable>
            <Pressable
              onPress={isFinal && focusedField === "inches" ? handleDone : handleNext}
              style={{
                backgroundColor: Colors.primaryBlue,
                paddingHorizontal: Spacing.lg,
                paddingVertical: Spacing.sm,
                borderRadius: BorderRadius.default,
              }}
            >
              <Text
                style={{
                  fontSize: Typography.body.fontSize,
                  color: Colors.white,
                  fontWeight: "600",
                }}
              >
                {isFinal && focusedField === "inches" ? "Done" : "Next"}
              </Text>
            </Pressable>
          </View>
        </InputAccessoryView>
      )}
    </View>
  );
}
