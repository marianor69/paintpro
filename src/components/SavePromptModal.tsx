import React from "react";
import { View, Text, Pressable, Modal } from "react-native";
import { Colors, Typography, Spacing, BorderRadius, Shadows } from "../utils/designSystem";

interface SavePromptModalProps {
  visible: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
  title?: string;
  message?: string;
  isLoading?: boolean;
}

export function SavePromptModal({
  visible,
  onSave,
  onDiscard,
  onCancel,
  title = "Save Changes?",
  message = "You have unsaved changes. Do you want to save them before leaving?",
  isLoading = false,
}: SavePromptModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
      <View
        style={{
          backgroundColor: Colors.white,
          borderRadius: BorderRadius.default,
          marginHorizontal: Spacing.lg,
          padding: Spacing.lg,
          width: "90%",
          maxWidth: 400,
          ...Shadows.card,
        }}
      >
        <Text
          style={{
            fontSize: Typography.h2.fontSize,
            fontWeight: Typography.h2.fontWeight as any,
            color: Colors.darkCharcoal,
            marginBottom: Spacing.xs,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontSize: Typography.body.fontSize,
            color: Colors.mediumGray,
            marginBottom: Spacing.lg,
          }}
        >
          {message}
        </Text>

        <View style={{ gap: Spacing.sm }}>
          <Pressable
            onPress={onSave}
            disabled={isLoading}
            style={{
              backgroundColor: isLoading ? Colors.mediumGray : Colors.primaryBlue,
              borderRadius: BorderRadius.default,
              paddingVertical: Spacing.md,
              alignItems: "center",
              opacity: isLoading ? 0.6 : 1,
            }}
            accessibilityRole="button"
            accessibilityLabel="Save changes and leave"
          >
            <Text
              style={{
                fontSize: Typography.body.fontSize,
                fontWeight: "600" as any,
                color: Colors.white,
              }}
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Text>
          </Pressable>

          <Pressable
            onPress={onDiscard}
            style={{
              backgroundColor: Colors.error,
              borderRadius: BorderRadius.default,
              paddingVertical: Spacing.md,
              alignItems: "center",
            }}
            accessibilityRole="button"
            accessibilityLabel="Discard changes and leave"
          >
            <Text
              style={{
                fontSize: Typography.body.fontSize,
                fontWeight: "600" as any,
                color: Colors.white,
              }}
            >
              Discard Changes
            </Text>
          </Pressable>

          <Pressable
            onPress={onCancel}
            style={{
              backgroundColor: Colors.neutralGray,
              borderRadius: BorderRadius.default,
              paddingVertical: Spacing.md,
              alignItems: "center",
            }}
            accessibilityRole="button"
            accessibilityLabel="Cancel and return to editing"
          >
            <Text
              style={{
                fontSize: Typography.body.fontSize,
                fontWeight: "600" as any,
                color: Colors.darkCharcoal,
              }}
            >
              Cancel
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
    </Modal>
  );
}
