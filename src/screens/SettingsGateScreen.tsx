import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAppSettings } from "../state/appSettings";
import { Colors, Typography, Spacing, BorderRadius, Shadows } from "../utils/designSystem";
import SettingsScreen from "./SettingsScreen";

/**
 * SettingsGateScreen
 *
 * Wraps the Settings screen with protection:
 * - If a PIN is set, requires PIN entry before showing settings
 * - If requireSettingsConfirmation is true, shows a confirmation dialog
 * - Otherwise, shows settings directly
 */
export default function SettingsGateScreen() {
  const settingsPin = useAppSettings((s) => s.settingsPin);
  const requireSettingsConfirmation = useAppSettings((s) => s.requireSettingsConfirmation);

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  // Determine what type of protection is needed
  const hasPin = settingsPin !== null && settingsPin.length > 0;
  const needsProtection = hasPin || requireSettingsConfirmation;

  useEffect(() => {
    // If no protection is needed, unlock immediately
    if (!needsProtection) {
      setIsUnlocked(true);
    } else if (!isUnlocked) {
      // Show appropriate modal
      if (hasPin) {
        setShowPinModal(true);
      } else if (requireSettingsConfirmation) {
        setShowConfirmModal(true);
      }
    }
  }, [needsProtection, hasPin, isUnlocked]);

  const handlePinSubmit = () => {
    if (pinInput === settingsPin) {
      setIsUnlocked(true);
      setShowPinModal(false);
      setPinInput("");
      setPinError(false);
    } else {
      setPinError(true);
      setPinInput("");
    }
  };

  const handleConfirm = () => {
    setIsUnlocked(true);
    setShowConfirmModal(false);
  };

  const handleCancel = () => {
    // Stay on the gate screen but close modal
    setShowPinModal(false);
    setShowConfirmModal(false);
    setPinInput("");
    setPinError(false);
  };

  // If unlocked, render the actual settings screen
  if (isUnlocked) {
    return <SettingsScreen />;
  }

  // Render gate screen
  return (
    <SafeAreaView
      edges={["bottom"]}
      style={{ flex: 1, backgroundColor: Colors.backgroundWarmGray }}
    >
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing.lg }}>
        <View
          style={{
            backgroundColor: Colors.white,
            borderRadius: BorderRadius.default,
            padding: Spacing.xl,
            alignItems: "center",
            ...Shadows.card,
            width: "100%",
            maxWidth: 320,
          }}
        >
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: Colors.primaryBlueLight,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: Spacing.lg,
            }}
          >
            <Ionicons name="lock-closed" size={40} color={Colors.primaryBlue} />
          </View>

          <Text
            style={{
              fontSize: Typography.h2.fontSize,
              fontWeight: Typography.h2.fontWeight as any,
              color: Colors.darkCharcoal,
              textAlign: "center",
              marginBottom: Spacing.sm,
            }}
          >
            Settings Protected
          </Text>

          <Text
            style={{
              fontSize: Typography.body.fontSize,
              color: Colors.mediumGray,
              textAlign: "center",
              marginBottom: Spacing.lg,
            }}
          >
            {hasPin
              ? "Enter your PIN to access pricing and calculation settings."
              : "This section contains sensitive contractor pricing information."}
          </Text>

          <Pressable
            onPress={() => {
              if (hasPin) {
                setShowPinModal(true);
              } else {
                setShowConfirmModal(true);
              }
            }}
            style={{
              backgroundColor: Colors.primaryBlue,
              borderRadius: BorderRadius.default,
              paddingVertical: Spacing.md,
              paddingHorizontal: Spacing.xl,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name={hasPin ? "keypad" : "shield-checkmark"} size={20} color={Colors.white} />
            <Text
              style={{
                fontSize: Typography.body.fontSize,
                fontWeight: "600" as any,
                color: Colors.white,
                marginLeft: Spacing.sm,
              }}
            >
              {hasPin ? "Enter PIN" : "Continue to Settings"}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* PIN Entry Modal */}
      <Modal
        visible={showPinModal}
        transparent
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <Pressable
            style={{
              flex: 1,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              alignItems: "center",
              justifyContent: "center",
            }}
            onPress={handleCancel}
          >
            <Pressable
              style={{
                backgroundColor: Colors.white,
                borderRadius: BorderRadius.default,
                padding: Spacing.lg,
                width: "85%",
                maxWidth: 340,
                ...Shadows.card,
              }}
              onPress={(e) => e.stopPropagation()}
            >
              <Text
                style={{
                  fontSize: Typography.h2.fontSize,
                  fontWeight: Typography.h2.fontWeight as any,
                  color: Colors.darkCharcoal,
                  textAlign: "center",
                  marginBottom: Spacing.xs,
                }}
              >
                Enter PIN
              </Text>
              <Text
                style={{
                  fontSize: Typography.caption.fontSize,
                  color: Colors.mediumGray,
                  textAlign: "center",
                  marginBottom: Spacing.md,
                }}
              >
                Enter your 4-digit PIN to access settings
              </Text>

              <TextInput
                value={pinInput}
                onChangeText={(text) => {
                  setPinInput(text.replace(/[^0-9]/g, "").slice(0, 4));
                  setPinError(false);
                }}
                placeholder="****"
                placeholderTextColor={Colors.mediumGray}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={4}
                style={{
                  backgroundColor: pinError ? Colors.error + "10" : Colors.backgroundWarmGray,
                  borderRadius: BorderRadius.default,
                  padding: Spacing.md,
                  fontSize: 24,
                  color: Colors.darkCharcoal,
                  textAlign: "center",
                  letterSpacing: 12,
                  marginBottom: Spacing.sm,
                  borderWidth: pinError ? 1 : 0,
                  borderColor: Colors.error,
                }}
                autoFocus
              />

              {pinError && (
                <Text
                  style={{
                    fontSize: Typography.caption.fontSize,
                    color: Colors.error,
                    textAlign: "center",
                    marginBottom: Spacing.sm,
                  }}
                >
                  Incorrect PIN. Please try again.
                </Text>
              )}

              <View style={{ flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.sm }}>
                <Pressable
                  onPress={handleCancel}
                  style={{
                    flex: 1,
                    backgroundColor: Colors.neutralGray,
                    borderRadius: BorderRadius.default,
                    paddingVertical: Spacing.md,
                    alignItems: "center",
                  }}
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
                <Pressable
                  onPress={handlePinSubmit}
                  disabled={pinInput.length < 4}
                  style={{
                    flex: 1,
                    backgroundColor: pinInput.length < 4 ? Colors.neutralGray : Colors.primaryBlue,
                    borderRadius: BorderRadius.default,
                    paddingVertical: Spacing.md,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: Typography.body.fontSize,
                      fontWeight: "600" as any,
                      color: pinInput.length < 4 ? Colors.mediumGray : Colors.white,
                    }}
                  >
                    Unlock
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            alignItems: "center",
            justifyContent: "center",
          }}
          onPress={handleCancel}
        >
          <Pressable
            style={{
              backgroundColor: Colors.white,
              borderRadius: BorderRadius.default,
              padding: Spacing.lg,
              width: "85%",
              maxWidth: 340,
              ...Shadows.card,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <View
              style={{
                alignItems: "center",
                marginBottom: Spacing.md,
              }}
            >
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: Colors.warning + "20",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: Spacing.md,
                }}
              >
                <Ionicons name="warning" size={32} color={Colors.warning} />
              </View>
              <Text
                style={{
                  fontSize: Typography.h2.fontSize,
                  fontWeight: Typography.h2.fontWeight as any,
                  color: Colors.darkCharcoal,
                  textAlign: "center",
                  marginBottom: Spacing.xs,
                }}
              >
                Sensitive Configuration
              </Text>
              <Text
                style={{
                  fontSize: Typography.body.fontSize,
                  color: Colors.mediumGray,
                  textAlign: "center",
                }}
              >
                This section contains contractor pricing and calculation settings. Are you sure you want to continue?
              </Text>
            </View>

            <View style={{ flexDirection: "row", gap: Spacing.sm }}>
              <Pressable
                onPress={handleCancel}
                style={{
                  flex: 1,
                  backgroundColor: Colors.neutralGray,
                  borderRadius: BorderRadius.default,
                  paddingVertical: Spacing.md,
                  alignItems: "center",
                }}
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
              <Pressable
                onPress={handleConfirm}
                style={{
                  flex: 1,
                  backgroundColor: Colors.primaryBlue,
                  borderRadius: BorderRadius.default,
                  paddingVertical: Spacing.md,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: Typography.body.fontSize,
                    fontWeight: "600" as any,
                    color: Colors.white,
                  }}
                >
                  Continue
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
