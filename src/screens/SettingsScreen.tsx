import React, { useState, useRef, useId } from "react";
import { View, Text, ScrollView, Pressable, Alert, TextInput, Modal, InputAccessoryView, Keyboard, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import { Ionicons } from "@expo/vector-icons";
import { useAppSettings } from "../state/appSettings";
import { Card } from "../components/Card";
import { Toggle } from "../components/Toggle";
import { FormInput } from "../components/FormInput";
import { Colors, Typography, Spacing, BorderRadius, Shadows, TextInputStyles } from "../utils/designSystem";
import { AUDIT_FILES } from "../utils/auditData";
import { RootStackParamList } from "../navigation/RootNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SettingsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const appSettings = useAppSettings();

  // Refs for keyboard navigation
  const wallCoverageRef = useRef<TextInput>(null);
  const ceilingCoverageRef = useRef<TextInput>(null);
  const trimCoverageRef = useRef<TextInput>(null);
  const primerCoverageRef = useRef<TextInput>(null);

  // Unique IDs for InputAccessoryViews
  const wallCoverageID = useId();
  const ceilingCoverageID = useId();
  const trimCoverageID = useId();
  const primerCoverageID = useId();

  // PIN management state
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [confirmPinInput, setConfirmPinInput] = useState("");
  const [pinStep, setPinStep] = useState<"enter" | "confirm">("enter");
  const [pinError, setPinError] = useState("");

  const hasPin = appSettings.settingsPin !== null && appSettings.settingsPin.length > 0;

  const handleSetPin = () => {
    setPinInput("");
    setConfirmPinInput("");
    setPinStep("enter");
    setPinError("");
    setShowPinModal(true);
  };

  const handleRemovePin = () => {
    Alert.alert(
      "Remove PIN",
      "Are you sure you want to remove the settings PIN? Anyone will be able to access settings.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => appSettings.updateSettings({ settingsPin: null }),
        },
      ]
    );
  };

  const handlePinSubmit = () => {
    if (pinStep === "enter") {
      if (pinInput.length !== 4) {
        setPinError("PIN must be 4 digits");
        return;
      }
      setPinStep("confirm");
      setPinError("");
    } else {
      if (confirmPinInput !== pinInput) {
        setPinError("PINs do not match");
        setConfirmPinInput("");
        return;
      }
      appSettings.updateSettings({ settingsPin: pinInput });
      setShowPinModal(false);
      setPinInput("");
      setConfirmPinInput("");
      Alert.alert("Success", "Settings PIN has been set.");
    }
  };

  const downloadAuditFile = async (fileName: keyof typeof AUDIT_FILES) => {
    try {
      // Get the file content from embedded data
      const fileContent = AUDIT_FILES[fileName];

      if (!fileContent) {
        Alert.alert("Error", `File ${fileName} not found in audit data.`);
        return;
      }

      // Create the file in the document directory
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, fileContent);

      // Share the file
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: fileName.endsWith(".json") ? "application/json" : "text/markdown",
          dialogTitle: `Share ${fileName}`,
          UTI: fileName.endsWith(".json") ? "public.json" : "public.markdown",
        });
      } else {
        Alert.alert("Success", `File saved to: ${fileUri}`);
      }
    } catch (error) {
      Alert.alert("Download Error", `Failed to download ${fileName}: ${String(error)}`);
      console.error("Download error:", error);
    }
  };

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={{ flex: 1, backgroundColor: Colors.backgroundWarmGray }}
    >
      <ScrollView
        contentContainerStyle={{ padding: Spacing.md }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text
          style={{
            fontSize: Typography.h1.fontSize,
            fontWeight: Typography.h1.fontWeight,
            color: Colors.darkCharcoal,
            marginBottom: Spacing.lg,
          }}
        >
          Settings
        </Text>

        {/* Pricing & Labor Settings */}
        <Card style={{ marginBottom: Spacing.md }}>
          <Text
            style={{
              fontSize: Typography.h2.fontSize,
              fontWeight: Typography.h2.fontWeight,
              color: Colors.darkCharcoal,
              marginBottom: Spacing.xs,
            }}
          >
            Pricing & Labor Settings
          </Text>

          <Text
            style={{
              fontSize: Typography.body.fontSize,
              color: Colors.mediumGray,
              marginBottom: Spacing.md,
            }}
          >
            Set hourly rates, paint prices, and other global pricing rules.
          </Text>

          <Pressable
            onPress={() => navigation.navigate("PricingSettings")}
            style={{
              backgroundColor: Colors.primaryBlue,
              borderRadius: 12,
              padding: Spacing.md,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: Spacing.sm,
            }}
          >
            <Ionicons name="cash-outline" size={20} color={Colors.white} />
            <Text
              style={{
                fontSize: Typography.body.fontSize,
                fontWeight: "600",
                color: Colors.white,
                marginLeft: Spacing.sm,
              }}
            >
              Pricing Settings
            </Text>
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate("CalculationSettings")}
            style={{
              backgroundColor: Colors.primaryBlue,
              borderRadius: 12,
              padding: Spacing.md,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="calculator-outline" size={20} color={Colors.white} />
            <Text
              style={{
                fontSize: Typography.body.fontSize,
                fontWeight: "600",
                color: Colors.white,
                marginLeft: Spacing.sm,
              }}
            >
              Calculation Settings
            </Text>
          </Pressable>
        </Card>

        {/* Paint Coverage Rules */}
        <Card style={{ marginBottom: Spacing.md }}>
          <Text
            style={{
              fontSize: Typography.h2.fontSize,
              fontWeight: Typography.h2.fontWeight,
              color: Colors.darkCharcoal,
              marginBottom: Spacing.md,
            }}
          >
            Paint Coverage Rules
          </Text>

          <FormInput
            ref={wallCoverageRef}
            label="Wall Paint Coverage (sqft/gal)"
            value={String(appSettings.wallCoverageSqFtPerGallon)}
            onChangeText={(text) =>
              appSettings.updateSettings({
                wallCoverageSqFtPerGallon: parseFloat(text) || 0,
              })
            }
            unit="sqft/gal"
            placeholder="350"
            keyboardType="numeric"
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => ceilingCoverageRef.current?.focus()}
            inputAccessoryViewID={`wallCoverage-${wallCoverageID}`}
          />

          <FormInput
            ref={ceilingCoverageRef}
            label="Ceiling Paint Coverage (sqft/gal)"
            value={String(appSettings.ceilingCoverageSqFtPerGallon)}
            onChangeText={(text) =>
              appSettings.updateSettings({
                ceilingCoverageSqFtPerGallon: parseFloat(text) || 0,
              })
            }
            unit="sqft/gal"
            placeholder="350"
            keyboardType="numeric"
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => trimCoverageRef.current?.focus()}
            inputAccessoryViewID={`ceilingCoverage-${ceilingCoverageID}`}
          />

          <FormInput
            ref={trimCoverageRef}
            label="Trim Paint Coverage (sqft/gal)"
            value={String(appSettings.trimCoverageSqFtPerGallon)}
            onChangeText={(text) =>
              appSettings.updateSettings({
                trimCoverageSqFtPerGallon: parseFloat(text) || 0,
              })
            }
            unit="sqft/gal"
            placeholder="350"
            keyboardType="numeric"
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => primerCoverageRef.current?.focus()}
            inputAccessoryViewID={`trimCoverage-${trimCoverageID}`}
          />

          <FormInput
            ref={primerCoverageRef}
            label="Primer Coverage (sqft/gal)"
            value={String(appSettings.primerCoverageSqFtPerGallon)}
            onChangeText={(text) =>
              appSettings.updateSettings({
                primerCoverageSqFtPerGallon: parseFloat(text) || 0,
              })
            }
            unit="sqft/gal"
            placeholder="350"
            keyboardType="numeric"
            returnKeyType="done"
            onSubmitEditing={() => Keyboard.dismiss()}
            inputAccessoryViewID={`primerCoverage-${primerCoverageID}`}
          />
        </Card>

        {/* Settings Protection */}
        <Card style={{ marginBottom: Spacing.md }}>
          <Text
            style={{
              fontSize: Typography.h2.fontSize,
              fontWeight: Typography.h2.fontWeight,
              color: Colors.darkCharcoal,
              marginBottom: Spacing.xs,
            }}
          >
            Settings Protection
          </Text>

          <Text
            style={{
              fontSize: Typography.body.fontSize,
              color: Colors.mediumGray,
              marginBottom: Spacing.md,
            }}
          >
            Protect pricing settings from client viewing.
          </Text>

          <Toggle
            label="Require Confirmation"
            value={appSettings.requireSettingsConfirmation}
            onValueChange={(value) =>
              appSettings.updateSettings({ requireSettingsConfirmation: value })
            }
            description="Show warning dialog before entering settings"
          />

          <View style={{ marginTop: Spacing.md }}>
            <Text
              style={{
                fontSize: Typography.body.fontSize,
                color: Colors.darkCharcoal,
                marginBottom: Spacing.sm,
              }}
            >
              PIN Protection: {hasPin ? "Enabled" : "Disabled"}
            </Text>

            {hasPin ? (
              <View style={{ flexDirection: "row", gap: Spacing.sm }}>
                <Pressable
                  onPress={handleSetPin}
                  style={{
                    flex: 1,
                    backgroundColor: Colors.primaryBlue,
                    borderRadius: 12,
                    padding: Spacing.md,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="key-outline" size={20} color={Colors.white} />
                  <Text
                    style={{
                      fontSize: Typography.body.fontSize,
                      fontWeight: "600",
                      color: Colors.white,
                      marginLeft: Spacing.sm,
                    }}
                  >
                    Change PIN
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleRemovePin}
                  style={{
                    backgroundColor: Colors.error + "10",
                    borderRadius: 12,
                    padding: Spacing.md,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="trash-outline" size={20} color={Colors.error} />
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={handleSetPin}
                style={{
                  backgroundColor: Colors.primaryBlue,
                  borderRadius: 12,
                  padding: Spacing.md,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="lock-closed-outline" size={20} color={Colors.white} />
                <Text
                  style={{
                    fontSize: Typography.body.fontSize,
                    fontWeight: "600",
                    color: Colors.white,
                    marginLeft: Spacing.sm,
                  }}
                >
                  Set PIN
                </Text>
              </Pressable>
            )}
          </View>
        </Card>

        {/* Measurement System */}
        <Card style={{ marginBottom: Spacing.md }}>
          <Text
            style={{
              fontSize: Typography.h2.fontSize,
              fontWeight: Typography.h2.fontWeight,
              color: Colors.darkCharcoal,
              marginBottom: Spacing.xs,
            }}
          >
            Measurement System
          </Text>

          <Text
            style={{
              fontSize: Typography.body.fontSize,
              color: Colors.mediumGray,
              marginBottom: Spacing.md,
            }}
          >
            Choose between Imperial (ft, in) or Metric (m, cm) units for all measurements.
          </Text>

          <Toggle
            label="Use Metric System"
            value={appSettings.unitSystem === 'metric'}
            onValueChange={(value) =>
              appSettings.updateSettings({ unitSystem: value ? 'metric' : 'imperial' })
            }
            description={
              appSettings.unitSystem === 'metric'
                ? 'Currently using meters (m) and centimeters (cm)'
                : 'Currently using feet (ft) and inches (in)'
            }
          />

          {/* Info Box */}
          <View
            style={{
              marginTop: Spacing.md,
              padding: Spacing.sm,
              backgroundColor: Colors.primaryBlueLight,
              borderRadius: BorderRadius.default,
              borderLeftWidth: 3,
              borderLeftColor: appSettings.unitSystem === 'metric' ? Colors.success : Colors.primaryBlue,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
              <Ionicons
                name="information-circle"
                size={16}
                color={Colors.primaryBlue}
                style={{ marginRight: Spacing.xs, marginTop: 2 }}
              />
              <Text style={{ flex: 1, fontSize: Typography.caption.fontSize, color: Colors.darkCharcoal }}>
                All measurements will be automatically converted. Existing projects will display in the selected unit system.
              </Text>
            </View>
          </View>
        </Card>

        {/* App Behavior */}
        <Card style={{ marginBottom: Spacing.md }}>
          <Text
            style={{
              fontSize: Typography.h2.fontSize,
              fontWeight: Typography.h2.fontWeight,
              color: Colors.darkCharcoal,
              marginBottom: Spacing.md,
            }}
          >
            App Behavior
          </Text>

          <Toggle
            label="Test Mode"
            value={appSettings.testMode}
            onValueChange={(value) =>
              appSettings.updateSettings({ testMode: value })
            }
            description="Show debugging utilities and JSON import/export buttons"
          />
        </Card>

        {/* UI Audit Files */}
        <Card style={{ marginBottom: Spacing.md }}>
          <Text
            style={{
              fontSize: Typography.h2.fontSize,
              fontWeight: Typography.h2.fontWeight,
              color: Colors.darkCharcoal,
              marginBottom: Spacing.md,
            }}
          >
            UI Audit Files
          </Text>

          <Text
            style={{
              fontSize: Typography.body.fontSize,
              color: Colors.mediumGray,
              marginBottom: Spacing.md,
            }}
          >
            Download comprehensive UI structural audit files that document all screens, components, styling, and inconsistencies.
          </Text>

          <Pressable
            onPress={() => downloadAuditFile("UI_AUDIT_SUMMARY.md")}
            style={{
              backgroundColor: Colors.primaryBlue,
              borderRadius: 12,
              padding: Spacing.md,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: Spacing.sm,
            }}
          >
            <Ionicons name="download-outline" size={20} color={Colors.white} />
            <Text
              style={{
                fontSize: Typography.body.fontSize,
                fontWeight: "600",
                color: Colors.white,
                marginLeft: Spacing.sm,
              }}
            >
              Download Quick Summary (MD)
            </Text>
          </Pressable>

          <Pressable
            onPress={() => downloadAuditFile("COMPLETE_UI_STRUCTURAL_AUDIT.md")}
            style={{
              backgroundColor: Colors.primaryBlue,
              borderRadius: 12,
              padding: Spacing.md,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: Spacing.sm,
            }}
          >
            <Ionicons name="download-outline" size={20} color={Colors.white} />
            <Text
              style={{
                fontSize: Typography.body.fontSize,
                fontWeight: "600",
                color: Colors.white,
                marginLeft: Spacing.sm,
              }}
            >
              Download Full Audit (MD)
            </Text>
          </Pressable>

          <Pressable
            onPress={() => downloadAuditFile("UI_STRUCTURAL_DUMP.json")}
            style={{
              backgroundColor: Colors.primaryBlue,
              borderRadius: 12,
              padding: Spacing.md,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="download-outline" size={20} color={Colors.white} />
            <Text
              style={{
                fontSize: Typography.body.fontSize,
                fontWeight: "600",
                color: Colors.white,
                marginLeft: Spacing.sm,
              }}
            >
              Download Structured Data (JSON)
            </Text>
          </Pressable>
        </Card>

        {/* Reset Button */}
        <Pressable
          onPress={() => {
            appSettings.resetToDefaults();
          }}
          style={{
            backgroundColor: Colors.error,
            borderRadius: 12,
            padding: Spacing.md,
            alignItems: "center",
            marginBottom: Spacing.xl,
          }}
        >
          <Text
            style={{
              fontSize: Typography.body.fontSize,
              fontWeight: "600",
              color: Colors.white,
            }}
          >
            Reset to Defaults
          </Text>
        </Pressable>
      </ScrollView>

      {/* PIN Setup Modal */}
      <Modal
        visible={showPinModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPinModal(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            alignItems: "center",
            justifyContent: "center",
          }}
          onPress={() => setShowPinModal(false)}
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
                fontWeight: Typography.h2.fontWeight,
                color: Colors.darkCharcoal,
                textAlign: "center",
                marginBottom: Spacing.xs,
              }}
            >
              {pinStep === "enter" ? "Set PIN" : "Confirm PIN"}
            </Text>
            <Text
              style={{
                fontSize: Typography.caption.fontSize,
                color: Colors.mediumGray,
                textAlign: "center",
                marginBottom: Spacing.md,
              }}
            >
              {pinStep === "enter"
                ? "Enter a 4-digit PIN to protect settings"
                : "Re-enter the PIN to confirm"}
            </Text>

            <TextInput
              value={pinStep === "enter" ? pinInput : confirmPinInput}
              onChangeText={(text) => {
                const cleaned = text.replace(/[^0-9]/g, "").slice(0, 4);
                if (pinStep === "enter") {
                  setPinInput(cleaned);
                } else {
                  setConfirmPinInput(cleaned);
                }
                setPinError("");
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

            {pinError !== "" && (
              <Text
                style={{
                  fontSize: Typography.caption.fontSize,
                  color: Colors.error,
                  textAlign: "center",
                  marginBottom: Spacing.sm,
                }}
              >
                {pinError}
              </Text>
            )}

            <View style={{ flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.sm }}>
              <Pressable
                onPress={() => {
                  setShowPinModal(false);
                  setPinInput("");
                  setConfirmPinInput("");
                  setPinError("");
                }}
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
                    fontWeight: "600",
                    color: Colors.darkCharcoal,
                  }}
                >
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handlePinSubmit}
                disabled={(pinStep === "enter" ? pinInput : confirmPinInput).length < 4}
                style={{
                  flex: 1,
                  backgroundColor:
                    (pinStep === "enter" ? pinInput : confirmPinInput).length < 4
                      ? Colors.neutralGray
                      : Colors.primaryBlue,
                  borderRadius: BorderRadius.default,
                  paddingVertical: Spacing.md,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: Typography.body.fontSize,
                    fontWeight: "600",
                    color:
                      (pinStep === "enter" ? pinInput : confirmPinInput).length < 4
                        ? Colors.mediumGray
                        : Colors.white,
                  }}
                >
                  {pinStep === "enter" ? "Next" : "Set PIN"}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Custom InputAccessoryViews for Paint Coverage fields */}
      {Platform.OS === "ios" && (
        <>
          <InputAccessoryView nativeID={`wallCoverage-${wallCoverageID}`}>
            <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
              <Pressable onPress={() => ceilingCoverageRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}>
                <Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text>
              </Pressable>
            </View>
          </InputAccessoryView>

          <InputAccessoryView nativeID={`ceilingCoverage-${ceilingCoverageID}`}>
            <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "space-between" }}>
              <Pressable onPress={() => wallCoverageRef.current?.focus()}>
                <Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400", paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}>Previous</Text>
              </Pressable>
              <Pressable onPress={() => trimCoverageRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}>
                <Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text>
              </Pressable>
            </View>
          </InputAccessoryView>

          <InputAccessoryView nativeID={`trimCoverage-${trimCoverageID}`}>
            <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "space-between" }}>
              <Pressable onPress={() => ceilingCoverageRef.current?.focus()}>
                <Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400", paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}>Previous</Text>
              </Pressable>
              <Pressable onPress={() => primerCoverageRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}>
                <Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text>
              </Pressable>
            </View>
          </InputAccessoryView>

          <InputAccessoryView nativeID={`primerCoverage-${primerCoverageID}`}>
            <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "space-between" }}>
              <Pressable onPress={() => trimCoverageRef.current?.focus()}>
                <Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400", paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}>Previous</Text>
              </Pressable>
              <Pressable onPress={() => Keyboard.dismiss()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}>
                <Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Done</Text>
              </Pressable>
            </View>
          </InputAccessoryView>
        </>
      )}
    </SafeAreaView>
  );
}
