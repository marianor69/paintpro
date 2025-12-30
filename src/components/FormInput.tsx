import React, { RefObject, forwardRef, useId } from "react";
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  Pressable,
  InputAccessoryView,
  Keyboard,
  Platform,
} from "react-native";
import { Colors, Typography, Spacing, BorderRadius } from "../utils/designSystem";
import { cn } from "../utils/cn";

interface FormInputProps extends Omit<TextInputProps, "style"> {
  label?: string;
  error?: string;
  className?: string;
  unit?: string;
  nextFieldRef?: RefObject<TextInput>;
  inputAccessoryViewID?: string;
}

export const FormInput = forwardRef<TextInput, FormInputProps>(({
  label,
  error,
  className,
  unit,
  nextFieldRef,
  inputAccessoryViewID,
  keyboardType,
  ...textInputProps
}, ref) => {
  // Generate unique ID for this component instance
  const uniqueId = useId();
  const isFinal = !nextFieldRef;
  const isNumericKeyboard =
    keyboardType === "numeric" ||
    keyboardType === "decimal-pad" ||
    keyboardType === "number-pad";

  const handleSubmit = () => {
    if (nextFieldRef?.current) {
      nextFieldRef.current.focus();
    } else {
      Keyboard.dismiss();
    }
  };

  const effectiveReturnKeyType = textInputProps.returnKeyType || (isFinal ? "done" : "next");
  const effectiveBlurOnSubmit = textInputProps.blurOnSubmit ?? !nextFieldRef;
  const effectiveOnSubmitEditing = textInputProps.onSubmitEditing || handleSubmit;

  // For ALL keyboards on iOS with navigation, use InputAccessoryView with unique ID
  const shouldShowAccessory = Platform.OS === "ios" && (nextFieldRef || isFinal);
  const accessoryID = inputAccessoryViewID || (shouldShowAccessory ? `formInput-${uniqueId}` : undefined);

  return (
    <View className={cn("mb-4", className)}>
      {label && (
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
      )}
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
          ref={ref}
          {...textInputProps}
          keyboardType={keyboardType}
          returnKeyType={effectiveReturnKeyType}
          enablesReturnKeyAutomatically={false}
          blurOnSubmit={effectiveBlurOnSubmit}
          onSubmitEditing={effectiveOnSubmitEditing}
          inputAccessoryViewID={accessoryID}
          placeholderTextColor={textInputProps.placeholderTextColor || Colors.mediumGray}
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

      {/* iOS InputAccessoryView for all keyboards with navigation */}
      {Platform.OS === "ios" && accessoryID && (
        <InputAccessoryView nativeID={accessoryID}>
          <View
            style={{
              backgroundColor: Colors.lightGray,
              paddingHorizontal: Spacing.md,
              paddingVertical: Spacing.sm,
              flexDirection: "row",
              justifyContent: "flex-end",
              borderTopWidth: 1,
              borderTopColor: Colors.mediumGray,
            }}
          >
            <Pressable
              onPress={handleSubmit}
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
                {isFinal ? "Done" : "Next"}
              </Text>
            </Pressable>
          </View>
        </InputAccessoryView>
      )}
    </View>
  );
});

FormInput.displayName = "FormInput";
