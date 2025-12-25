import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { useCalculationSettings } from "../state/calculationStore";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Typography, Spacing, BorderRadius, Shadows } from "../utils/designSystem";
import { Card } from "../components/Card";

export default function CalculationSettingsScreen() {
  const { settings, updateSettings, resetToDefaults } = useCalculationSettings();

  const [doorHeight, setDoorHeight] = useState(settings.doorHeight.toString());
  const [doorWidth, setDoorWidth] = useState(settings.doorWidth.toString());
  const [doorTrimWidth, setDoorTrimWidth] = useState(settings.doorTrimWidth.toString());
  const [doorJambWidth, setDoorJambWidth] = useState((settings.doorJambWidth || 4.5).toString());

  const [windowWidth, setWindowWidth] = useState(settings.windowWidth.toString());
  const [windowHeight, setWindowHeight] = useState(settings.windowHeight.toString());
  const [windowTrimWidth, setWindowTrimWidth] = useState(settings.windowTrimWidth.toString());

  const [singleClosetWidth, setSingleClosetWidth] = useState(settings.singleClosetWidth.toString());
  const [singleClosetHeight, setSingleClosetHeight] = useState(settings.singleClosetHeight.toString());
  const [singleClosetTrimWidth, setSingleClosetTrimWidth] = useState(settings.singleClosetTrimWidth.toString());

  const [doubleClosetWidth, setDoubleClosetWidth] = useState(settings.doubleClosetWidth.toString());
  const [doubleClosetHeight, setDoubleClosetHeight] = useState(settings.doubleClosetHeight.toString());
  const [doubleClosetTrimWidth, setDoubleClosetTrimWidth] = useState(settings.doubleClosetTrimWidth.toString());

  const [baseboardWidth, setBaseboardWidth] = useState(settings.baseboardWidth.toString());
  const [crownMouldingWidth, setCrownMouldingWidth] = useState(settings.crownMouldingWidth.toString());

  const handleSave = () => {
    const newSettings = {
      doorHeight: parseFloat(doorHeight) || settings.doorHeight,
      doorWidth: parseFloat(doorWidth) || settings.doorWidth,
      doorTrimWidth: parseFloat(doorTrimWidth) || settings.doorTrimWidth,
      doorJambWidth: parseFloat(doorJambWidth) || settings.doorJambWidth,

      windowWidth: parseFloat(windowWidth) || settings.windowWidth,
      windowHeight: parseFloat(windowHeight) || settings.windowHeight,
      windowTrimWidth: parseFloat(windowTrimWidth) || settings.windowTrimWidth,

      singleClosetWidth: parseFloat(singleClosetWidth) || settings.singleClosetWidth,
      singleClosetHeight: parseFloat(singleClosetHeight) || settings.singleClosetHeight,
      singleClosetTrimWidth: parseFloat(singleClosetTrimWidth) || settings.singleClosetTrimWidth,

      doubleClosetWidth: parseFloat(doubleClosetWidth) || settings.doubleClosetWidth,
      doubleClosetHeight: parseFloat(doubleClosetHeight) || settings.doubleClosetHeight,
      doubleClosetTrimWidth: parseFloat(doubleClosetTrimWidth) || settings.doubleClosetTrimWidth,

      baseboardWidth: parseFloat(baseboardWidth) || settings.baseboardWidth,
      crownMouldingWidth: parseFloat(crownMouldingWidth) || settings.crownMouldingWidth,
    };

    updateSettings(newSettings);
    Keyboard.dismiss();
    Alert.alert("Success", "Calculation settings updated successfully");
  };

  const handleReset = () => {
    Alert.alert(
      "Reset to Defaults",
      "Are you sure you want to reset all calculation settings to their default values?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            resetToDefaults();
            // Update local state
            const defaults = useCalculationSettings.getState().settings;
            setDoorHeight(defaults.doorHeight.toString());
            setDoorWidth(defaults.doorWidth.toString());
            setDoorTrimWidth(defaults.doorTrimWidth.toString());
            setDoorJambWidth(defaults.doorJambWidth.toString());

            setWindowWidth(defaults.windowWidth.toString());
            setWindowHeight(defaults.windowHeight.toString());
            setWindowTrimWidth(defaults.windowTrimWidth.toString());

            setSingleClosetWidth(defaults.singleClosetWidth.toString());
            setSingleClosetHeight(defaults.singleClosetHeight.toString());
            setSingleClosetTrimWidth(defaults.singleClosetTrimWidth.toString());

            setDoubleClosetWidth(defaults.doubleClosetWidth.toString());
            setDoubleClosetHeight(defaults.doubleClosetHeight.toString());
            setDoubleClosetTrimWidth(defaults.doubleClosetTrimWidth.toString());

            setBaseboardWidth(defaults.baseboardWidth.toString());
            setCrownMouldingWidth(defaults.crownMouldingWidth.toString());
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={{ flex: 1, backgroundColor: Colors.backgroundWarmGray }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          contentContainerStyle={{ padding: Spacing.md }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* Door Assumptions */}
          <Card style={{ marginBottom: Spacing.md }}>
            <Text style={{ ...Typography.h2, marginBottom: Spacing.md }}>
              Door Assumptions
            </Text>

            <View style={{ marginBottom: Spacing.md }}>
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500", color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                Door Size
              </Text>
              <View style={{ flexDirection: "row", gap: Spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.xs }}>
                    Height (ft)
                  </Text>
                  <TextInput
                    value={doorHeight}
                    onChangeText={setDoorHeight}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={Colors.mediumGray}
                    returnKeyType="done"
                    cursorColor={Colors.primaryBlue}
                    selectionColor={Colors.primaryBlue}
                    style={{
                      backgroundColor: Colors.white,
                      borderRadius: BorderRadius.default,
                      borderWidth: 1,
                      borderColor: Colors.neutralGray,
                      paddingHorizontal: Spacing.md,
                      paddingVertical: Spacing.sm,
                      fontSize: Typography.body.fontSize,
                      color: Colors.darkCharcoal,
                    }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.xs }}>
                    Width (ft)
                  </Text>
                  <TextInput
                    value={doorWidth}
                    onChangeText={setDoorWidth}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={Colors.mediumGray}
                    returnKeyType="done"
                    cursorColor={Colors.primaryBlue}
                    selectionColor={Colors.primaryBlue}
                    style={{
                      backgroundColor: Colors.white,
                      borderRadius: BorderRadius.default,
                      borderWidth: 1,
                      borderColor: Colors.neutralGray,
                      paddingHorizontal: Spacing.md,
                      paddingVertical: Spacing.sm,
                      fontSize: Typography.body.fontSize,
                      color: Colors.darkCharcoal,
                    }}
                  />
                </View>
              </View>
              <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginTop: Spacing.xs }}>
                Standard door dimensions for surface area calculation
              </Text>
            </View>

            <View style={{ marginBottom: Spacing.md }}>
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500", color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                Door Trim Width (inches)
              </Text>
              <TextInput
                value={doorTrimWidth}
                onChangeText={setDoorTrimWidth}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={Colors.mediumGray}
                returnKeyType="done"
                cursorColor={Colors.primaryBlue}
                selectionColor={Colors.primaryBlue}
                style={{
                  backgroundColor: Colors.white,
                  borderRadius: BorderRadius.default,
                  borderWidth: 1,
                  borderColor: Colors.neutralGray,
                  paddingHorizontal: Spacing.md,
                  paddingVertical: Spacing.sm,
                  fontSize: Typography.body.fontSize,
                  color: Colors.darkCharcoal,
                }}
              />
              <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginTop: Spacing.xs }}>
                Width of trim molding around doors
              </Text>
            </View>

            <View>
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500", color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                Door Jamb Width (inches)
              </Text>
              <TextInput
                value={doorJambWidth}
                onChangeText={setDoorJambWidth}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={Colors.mediumGray}
                returnKeyType="done"
                cursorColor={Colors.primaryBlue}
                selectionColor={Colors.primaryBlue}
                style={{
                  backgroundColor: Colors.white,
                  borderRadius: BorderRadius.default,
                  borderWidth: 1,
                  borderColor: Colors.neutralGray,
                  paddingHorizontal: Spacing.md,
                  paddingVertical: Spacing.sm,
                  fontSize: Typography.body.fontSize,
                  color: Colors.darkCharcoal,
                }}
              />
              <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginTop: Spacing.xs }}>
                Width of door jamb (inside frame)
              </Text>
            </View>
          </Card>

          {/* Window Assumptions */}
          <Card style={{ marginBottom: Spacing.md }}>
            <Text style={{ ...Typography.h2, marginBottom: Spacing.md }}>
              Window Assumptions
            </Text>

            <View style={{ marginBottom: Spacing.md }}>
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500", color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                Window Size
              </Text>
              <View style={{ flexDirection: "row", gap: Spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.xs }}>
                    Width (ft)
                  </Text>
                  <TextInput
                    value={windowWidth}
                    onChangeText={setWindowWidth}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={Colors.mediumGray}
                    returnKeyType="done"
                    cursorColor={Colors.primaryBlue}
                    selectionColor={Colors.primaryBlue}
                    style={{
                      backgroundColor: Colors.white,
                      borderRadius: BorderRadius.default,
                      borderWidth: 1,
                      borderColor: Colors.neutralGray,
                      paddingHorizontal: Spacing.md,
                      paddingVertical: Spacing.sm,
                      fontSize: Typography.body.fontSize,
                      color: Colors.darkCharcoal,
                    }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.xs }}>
                    Height (ft)
                  </Text>
                  <TextInput
                    value={windowHeight}
                    onChangeText={setWindowHeight}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={Colors.mediumGray}
                    returnKeyType="done"
                    cursorColor={Colors.primaryBlue}
                    selectionColor={Colors.primaryBlue}
                    style={{
                      backgroundColor: Colors.white,
                      borderRadius: BorderRadius.default,
                      borderWidth: 1,
                      borderColor: Colors.neutralGray,
                      paddingHorizontal: Spacing.md,
                      paddingVertical: Spacing.sm,
                      fontSize: Typography.body.fontSize,
                      color: Colors.darkCharcoal,
                    }}
                  />
                </View>
              </View>
              <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginTop: Spacing.xs }}>
                Standard window dimensions
              </Text>
            </View>

            <View>
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500", color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                Window Trim Width (inches)
              </Text>
              <TextInput
                value={windowTrimWidth}
                onChangeText={setWindowTrimWidth}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={Colors.mediumGray}
                returnKeyType="done"
                cursorColor={Colors.primaryBlue}
                selectionColor={Colors.primaryBlue}
                style={{
                  backgroundColor: Colors.white,
                  borderRadius: BorderRadius.default,
                  borderWidth: 1,
                  borderColor: Colors.neutralGray,
                  paddingHorizontal: Spacing.md,
                  paddingVertical: Spacing.sm,
                  fontSize: Typography.body.fontSize,
                  color: Colors.darkCharcoal,
                }}
              />
              <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginTop: Spacing.xs }}>
                Width of trim molding around windows
              </Text>
            </View>
          </Card>

          {/* Closet Assumptions */}
          <Card style={{ marginBottom: Spacing.md }}>
            <Text style={{ ...Typography.h2, marginBottom: Spacing.md }}>
              Closet Assumptions
            </Text>

            <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600", color: Colors.darkCharcoal, marginBottom: Spacing.sm }}>
              Single Door Closet
            </Text>

            <View style={{ marginBottom: Spacing.md }}>
              <View style={{ flexDirection: "row", gap: Spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.xs }}>
                    Width (inches)
                  </Text>
                  <TextInput
                    value={singleClosetWidth}
                    onChangeText={setSingleClosetWidth}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={Colors.mediumGray}
                    returnKeyType="done"
                    cursorColor={Colors.primaryBlue}
                    selectionColor={Colors.primaryBlue}
                    style={{
                      backgroundColor: Colors.white,
                      borderRadius: BorderRadius.default,
                      borderWidth: 1,
                      borderColor: Colors.neutralGray,
                      paddingHorizontal: Spacing.md,
                      paddingVertical: Spacing.sm,
                      fontSize: Typography.body.fontSize,
                      color: Colors.darkCharcoal,
                    }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.xs }}>
                    Height (inches)
                  </Text>
                  <TextInput
                    value={singleClosetHeight}
                    onChangeText={setSingleClosetHeight}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={Colors.mediumGray}
                    returnKeyType="done"
                    cursorColor={Colors.primaryBlue}
                    selectionColor={Colors.primaryBlue}
                    style={{
                      backgroundColor: Colors.white,
                      borderRadius: BorderRadius.default,
                      borderWidth: 1,
                      borderColor: Colors.neutralGray,
                      paddingHorizontal: Spacing.md,
                      paddingVertical: Spacing.sm,
                      fontSize: Typography.body.fontSize,
                      color: Colors.darkCharcoal,
                    }}
                  />
                </View>
              </View>
            </View>

            <View style={{ marginBottom: Spacing.md }}>
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500", color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                Trim Width (inches)
              </Text>
              <TextInput
                value={singleClosetTrimWidth}
                onChangeText={setSingleClosetTrimWidth}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={Colors.mediumGray}
                returnKeyType="done"
                cursorColor={Colors.primaryBlue}
                selectionColor={Colors.primaryBlue}
                style={{
                  backgroundColor: Colors.white,
                  borderRadius: BorderRadius.default,
                  borderWidth: 1,
                  borderColor: Colors.neutralGray,
                  paddingHorizontal: Spacing.md,
                  paddingVertical: Spacing.sm,
                  fontSize: Typography.body.fontSize,
                  color: Colors.darkCharcoal,
                }}
              />
            </View>

            <View style={{ height: 1, backgroundColor: Colors.neutralGray, marginVertical: Spacing.md }} />

            <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600", color: Colors.darkCharcoal, marginBottom: Spacing.sm }}>
              Double Door Closet
            </Text>

            <View style={{ marginBottom: Spacing.md }}>
              <View style={{ flexDirection: "row", gap: Spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.xs }}>
                    Width (inches)
                  </Text>
                  <TextInput
                    value={doubleClosetWidth}
                    onChangeText={setDoubleClosetWidth}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={Colors.mediumGray}
                    returnKeyType="done"
                    cursorColor={Colors.primaryBlue}
                    selectionColor={Colors.primaryBlue}
                    style={{
                      backgroundColor: Colors.white,
                      borderRadius: BorderRadius.default,
                      borderWidth: 1,
                      borderColor: Colors.neutralGray,
                      paddingHorizontal: Spacing.md,
                      paddingVertical: Spacing.sm,
                      fontSize: Typography.body.fontSize,
                      color: Colors.darkCharcoal,
                    }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.xs }}>
                    Height (inches)
                  </Text>
                  <TextInput
                    value={doubleClosetHeight}
                    onChangeText={setDoubleClosetHeight}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={Colors.mediumGray}
                    returnKeyType="done"
                    cursorColor={Colors.primaryBlue}
                    selectionColor={Colors.primaryBlue}
                    style={{
                      backgroundColor: Colors.white,
                      borderRadius: BorderRadius.default,
                      borderWidth: 1,
                      borderColor: Colors.neutralGray,
                      paddingHorizontal: Spacing.md,
                      paddingVertical: Spacing.sm,
                      fontSize: Typography.body.fontSize,
                      color: Colors.darkCharcoal,
                    }}
                  />
                </View>
              </View>
            </View>

            <View>
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500", color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                Trim Width (inches)
              </Text>
              <TextInput
                value={doubleClosetTrimWidth}
                onChangeText={setDoubleClosetTrimWidth}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={Colors.mediumGray}
                returnKeyType="done"
                cursorColor={Colors.primaryBlue}
                selectionColor={Colors.primaryBlue}
                style={{
                  backgroundColor: Colors.white,
                  borderRadius: BorderRadius.default,
                  borderWidth: 1,
                  borderColor: Colors.neutralGray,
                  paddingHorizontal: Spacing.md,
                  paddingVertical: Spacing.sm,
                  fontSize: Typography.body.fontSize,
                  color: Colors.darkCharcoal,
                }}
              />
            </View>
          </Card>

          {/* Baseboard Width */}
          <Card style={{ marginBottom: Spacing.md }}>
            <Text style={{ ...Typography.h2, marginBottom: Spacing.md }}>
              Baseboard Width
            </Text>

            <View>
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500", color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                Baseboard Width (inches)
              </Text>
              <TextInput
                value={baseboardWidth}
                onChangeText={setBaseboardWidth}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={Colors.mediumGray}
                returnKeyType="done"
                cursorColor={Colors.primaryBlue}
                selectionColor={Colors.primaryBlue}
                style={{
                  backgroundColor: Colors.white,
                  borderRadius: BorderRadius.default,
                  borderWidth: 1,
                  borderColor: Colors.neutralGray,
                  paddingHorizontal: Spacing.md,
                  paddingVertical: Spacing.sm,
                  fontSize: Typography.body.fontSize,
                  color: Colors.darkCharcoal,
                }}
              />
              <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginTop: Spacing.xs }}>
                Width of baseboard trim along walls (default: 5.5 inches)
              </Text>
            </View>
          </Card>

          {/* Crown Moulding Width */}
          <Card style={{ marginBottom: Spacing.md }}>
            <Text style={{ ...Typography.h2, marginBottom: Spacing.md }}>
              Crown Moulding Width
            </Text>

            <View>
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500", color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                Crown Moulding Width (inches)
              </Text>
              <TextInput
                value={crownMouldingWidth}
                onChangeText={setCrownMouldingWidth}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={Colors.mediumGray}
                returnKeyType="done"
                cursorColor={Colors.primaryBlue}
                selectionColor={Colors.primaryBlue}
                style={{
                  backgroundColor: Colors.white,
                  borderRadius: BorderRadius.default,
                  borderWidth: 1,
                  borderColor: Colors.neutralGray,
                  paddingHorizontal: Spacing.md,
                  paddingVertical: Spacing.sm,
                  fontSize: Typography.body.fontSize,
                  color: Colors.darkCharcoal,
                }}
              />
              <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginTop: Spacing.xs }}>
                Width of crown moulding trim along ceiling perimeter (default: 5.5 inches)
              </Text>
            </View>
          </Card>

          {/* Action Buttons */}
          <View style={{ gap: Spacing.sm, marginBottom: Spacing.xl }}>
            <Pressable
              onPress={handleSave}
              style={{
                backgroundColor: Colors.primaryBlue,
                borderRadius: BorderRadius.default,
                paddingVertical: Spacing.md,
                alignItems: "center",
                ...Shadows.card,
              }}
              accessibilityRole="button"
              accessibilityLabel="Save changes"
            >
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600", color: Colors.white }}>
                Save Changes
              </Text>
            </Pressable>

            <Pressable
              onPress={handleReset}
              style={{
                backgroundColor: Colors.neutralGray,
                borderRadius: BorderRadius.default,
                paddingVertical: Spacing.md,
                alignItems: "center",
              }}
              accessibilityRole="button"
              accessibilityLabel="Reset to defaults"
            >
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600", color: Colors.darkCharcoal }}>
                Reset to Defaults
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
