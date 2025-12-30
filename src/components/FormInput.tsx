import React, { RefObject, forwardRef } from "react";
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  Pressable,
  InputAccessoryView,
  Keyboard,
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

  //Handle numeric input filtering for default keyboard
  const handleChangeText = (text: string) => {
    if (isNumericKeyboard && textInputProps.onChangeText) {
      // Allow numbers, decimal point, and negative sign
      const filtered = text.replace(/[^0-9.-]/g, '');
      textInputProps.onChangeText(filtered);
    } else if (textInputProps.onChangeText) {
      textInputProps.onChangeText(text);
    }
  };

  const effectiveReturnKeyType = textInputProps.returnKeyType || (isFinal ? "done" : "next");
  const effectiveBlurOnSubmit = textInputProps.blurOnSubmit ?? !nextFieldRef;
  const effectiveOnSubmitEditing = textInputProps.onSubmitEditing || handleSubmit;

  // Use default keyboard to get blue Next key, with numeric filtering
  const effectiveKeyboardType = isNumericKeyboard ? "default" : keyboardType;
  const accessoryID = inputAccessoryViewID;

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
          keyboardType={effectiveKeyboardType}
          onChangeText={handleChangeText}
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

      {/* iOS InputAccessoryView - only if explicitly provided */}
      {accessoryID && (
        <InputAccessoryView nativeID={accessoryID}>
          <View
            style={{
              backgroundColor: Colors.neutralGray,
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
