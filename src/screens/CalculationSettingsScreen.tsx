import React, { useState, useRef, useId } from "react";
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
  InputAccessoryView,
} from "react-native";
import { useCalculationSettings } from "../state/calculationStore";
import { useAppSettings } from "../state/appSettings";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Typography, Spacing, BorderRadius, Shadows, TextInputStyles } from "../utils/designSystem";
import { Card } from "../components/Card";

export default function CalculationSettingsScreen() {
  const { settings, updateSettings, resetToDefaults } = useCalculationSettings();
  const wallCoverageSqFtPerGallon = useAppSettings((s) => s.wallCoverageSqFtPerGallon);
  const ceilingCoverageSqFtPerGallon = useAppSettings((s) => s.ceilingCoverageSqFtPerGallon);
  const trimCoverageSqFtPerGallon = useAppSettings((s) => s.trimCoverageSqFtPerGallon);
  const primerCoverageSqFtPerGallon = useAppSettings((s) => s.primerCoverageSqFtPerGallon);
  const updateAppSettings = useAppSettings((s) => s.updateSettings);

  const [doorHeight, setDoorHeight] = useState(settings.doorHeight.toString());
  const [doorWidth, setDoorWidth] = useState(settings.doorWidth.toString());
  const [doorTrimWidth, setDoorTrimWidth] = useState(settings.doorTrimWidth.toString());
  const [doorJambWidth, setDoorJambWidth] = useState((settings.doorJambWidth || 4.5).toString());

  const [windowWidth, setWindowWidth] = useState(settings.windowWidth.toString());
  const [windowHeight, setWindowHeight] = useState(settings.windowHeight.toString());
  const [windowTrimWidth, setWindowTrimWidth] = useState(settings.windowTrimWidth.toString());

  const [singleClosetWidth, setSingleClosetWidth] = useState(settings.singleClosetWidth.toString());
  const [singleClosetTrimWidth, setSingleClosetTrimWidth] = useState(settings.singleClosetTrimWidth.toString());
  const [singleClosetBaseboardPerimeter, setSingleClosetBaseboardPerimeter] = useState((settings.singleClosetBaseboardPerimeter || 88).toString());

  const [doubleClosetWidth, setDoubleClosetWidth] = useState(settings.doubleClosetWidth.toString());
  const [doubleClosetTrimWidth, setDoubleClosetTrimWidth] = useState(settings.doubleClosetTrimWidth.toString());
  const [doubleClosetBaseboardPerimeter, setDoubleClosetBaseboardPerimeter] = useState((settings.doubleClosetBaseboardPerimeter || 112).toString());

  const [closetCavityDepth, setClosetCavityDepth] = useState((settings.closetCavityDepth || 2).toString());

  const [baseboardWidth, setBaseboardWidth] = useState(settings.baseboardWidth.toString());
  const [crownMouldingWidth, setCrownMouldingWidth] = useState(settings.crownMouldingWidth.toString());

  // KB-004: Refs for keyboard navigation
  const doorHeightRef = useRef<TextInput>(null);
  const doorWidthRef = useRef<TextInput>(null);
  const doorTrimWidthRef = useRef<TextInput>(null);
  const doorJambWidthRef = useRef<TextInput>(null);
  const windowWidthRef = useRef<TextInput>(null);
  const windowHeightRef = useRef<TextInput>(null);
  const windowTrimWidthRef = useRef<TextInput>(null);
  const wallCoverageRef = useRef<TextInput>(null);
  const ceilingCoverageRef = useRef<TextInput>(null);
  const trimCoverageRef = useRef<TextInput>(null);
  const primerCoverageRef = useRef<TextInput>(null);
  const singleClosetWidthRef = useRef<TextInput>(null);
  const singleClosetTrimWidthRef = useRef<TextInput>(null);
  const singleClosetBaseboardRef = useRef<TextInput>(null);
  const doubleClosetWidthRef = useRef<TextInput>(null);
  const doubleClosetTrimWidthRef = useRef<TextInput>(null);
  const doubleClosetBaseboardRef = useRef<TextInput>(null);
  const closetCavityDepthRef = useRef<TextInput>(null);
  const baseboardWidthRef = useRef<TextInput>(null);
  const crownMouldingWidthRef = useRef<TextInput>(null);

  // KB-004: Unique IDs for InputAccessoryViews
  const doorHeightID = useId();
  const doorWidthID = useId();
  const doorTrimWidthID = useId();
  const doorJambWidthID = useId();
  const windowWidthID = useId();
  const windowHeightID = useId();
  const windowTrimWidthID = useId();
  const wallCoverageID = useId();
  const ceilingCoverageID = useId();
  const trimCoverageID = useId();
  const primerCoverageID = useId();
  const singleClosetWidthID = useId();
  const singleClosetTrimWidthID = useId();
  const singleClosetBaseboardID = useId();
  const doubleClosetWidthID = useId();
  const doubleClosetTrimWidthID = useId();
  const doubleClosetBaseboardID = useId();
  const closetCavityDepthID = useId();
  const baseboardWidthID = useId();
  const crownMouldingWidthID = useId();

  const inputContainerStyle = [TextInputStyles.container, { width: 68, alignSelf: "flex-start" }];
  const bubbleInputStyle = [TextInputStyles.base, { textAlign: "right" as const }];
  const helperTextStyle = { fontSize: Typography.caption.fontSize, fontWeight: "400", color: Colors.mediumGray };
  const unitHeaderStyle = {
    fontSize: Typography.caption.fontSize,
    color: Colors.mediumGray,
    marginBottom: Spacing.xs,
    textAlign: "right" as const,
    width: 68,
    paddingRight: Spacing.md,
  };
  const centerAlignOffset = Typography.caption.fontSize + Spacing.xs;

  const handleSave = () => {
    const parsedCasingWidth = parseFloat(singleClosetTrimWidth) || settings.singleClosetTrimWidth;
    const newSettings = {
      doorHeight: parseFloat(doorHeight) || settings.doorHeight,
      doorWidth: parseFloat(doorWidth) || settings.doorWidth,
      doorTrimWidth: parseFloat(doorTrimWidth) || settings.doorTrimWidth,
      doorJambWidth: parseFloat(doorJambWidth) || settings.doorJambWidth,

      windowWidth: parseFloat(windowWidth) || settings.windowWidth,
      windowHeight: parseFloat(windowHeight) || settings.windowHeight,
      windowTrimWidth: parseFloat(windowTrimWidth) || settings.windowTrimWidth,

      singleClosetWidth: parseFloat(singleClosetWidth) || settings.singleClosetWidth,
      singleClosetTrimWidth: parsedCasingWidth,
      singleClosetBaseboardPerimeter: parseFloat(singleClosetBaseboardPerimeter) || settings.singleClosetBaseboardPerimeter || 88,

      doubleClosetWidth: parseFloat(doubleClosetWidth) || settings.doubleClosetWidth,
      doubleClosetTrimWidth: parsedCasingWidth,
      doubleClosetBaseboardPerimeter: parseFloat(doubleClosetBaseboardPerimeter) || settings.doubleClosetBaseboardPerimeter || 112,

      closetCavityDepth: parseFloat(closetCavityDepth) || settings.closetCavityDepth || 2,

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
            setSingleClosetTrimWidth(defaults.singleClosetTrimWidth.toString());
            setSingleClosetBaseboardPerimeter((defaults.singleClosetBaseboardPerimeter || 88).toString());

            setDoubleClosetWidth(defaults.doubleClosetWidth.toString());
            setDoubleClosetTrimWidth(defaults.singleClosetTrimWidth.toString());
            setDoubleClosetBaseboardPerimeter((defaults.doubleClosetBaseboardPerimeter || 112).toString());

            setClosetCavityDepth((defaults.closetCavityDepth || 2).toString());

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
              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: Spacing.sm }}>
                <View style={{ flex: 1, marginTop: Typography.caption.fontSize + Spacing.xs }}>
                  <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500", color: Colors.darkCharcoal }}>
                    Door
                  </Text>
                  <Text style={helperTextStyle}>
                    Standard door dimensions for surface area calculation
                  </Text>
                </View>
                <View>
                  <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.xs, textAlign: "center" }}>
                    Height (ft)
                  </Text>
                  <View style={inputContainerStyle}>
                    <TextInput
                      ref={doorHeightRef}
                      value={doorHeight}
                      onChangeText={setDoorHeight}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={Colors.mediumGray}
                      returnKeyType="next"
                      onSubmitEditing={() => doorWidthRef.current?.focus()}
                      blurOnSubmit={false}
                      inputAccessoryViewID={Platform.OS === "ios" ? `calcDoorHeight-${doorHeightID}` : undefined}
                      style={bubbleInputStyle}
                    />
                  </View>
                </View>
                <View>
                  <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.xs, textAlign: "center" }}>
                    Width (ft)
                  </Text>
                  <View style={inputContainerStyle}>
                    <TextInput
                      ref={doorWidthRef}
                      value={doorWidth}
                      onChangeText={setDoorWidth}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={Colors.mediumGray}
                      returnKeyType="next"
                      onSubmitEditing={() => doorTrimWidthRef.current?.focus()}
                      blurOnSubmit={false}
                      inputAccessoryViewID={Platform.OS === "ios" ? `calcDoorWidth-${doorWidthID}` : undefined}
                      style={bubbleInputStyle}
                    />
                  </View>
                </View>
              </View>
            </View>

            <View style={{ marginBottom: Spacing.md }}>
              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: Spacing.md }}>
                <View style={{ flex: 1, marginTop: Typography.caption.fontSize + Spacing.xs }}>
                  <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500", color: Colors.darkCharcoal }}>
                    Door Trim Width
                  </Text>
                  <Text style={helperTextStyle}>
                    Width of trim molding around doors
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end", width: 68 }}>
                  <Text style={unitHeaderStyle}>Inches</Text>
                  <View style={inputContainerStyle}>
                    <TextInput
                      ref={doorTrimWidthRef}
                      value={doorTrimWidth}
                      onChangeText={setDoorTrimWidth}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={Colors.mediumGray}
                      returnKeyType="next"
                      onSubmitEditing={() => doorJambWidthRef.current?.focus()}
                      blurOnSubmit={false}
                      inputAccessoryViewID={Platform.OS === "ios" ? `calcDoorTrimWidth-${doorTrimWidthID}` : undefined}
                      style={bubbleInputStyle}
                    />
                  </View>
                </View>
              </View>
            </View>

            <View>
              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: Spacing.md }}>
                <View style={{ flex: 1, marginTop: Typography.caption.fontSize + Spacing.xs }}>
                  <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500", color: Colors.darkCharcoal }}>
                    Door Jamb Width
                  </Text>
                  <Text style={helperTextStyle}>
                    Width of door jamb (inside frame)
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end", width: 68 }}>
                  <Text style={unitHeaderStyle}>Inches</Text>
                  <View style={inputContainerStyle}>
                    <TextInput
                      ref={doorJambWidthRef}
                      value={doorJambWidth}
                      onChangeText={setDoorJambWidth}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={Colors.mediumGray}
                      returnKeyType="next"
                      onSubmitEditing={() => windowWidthRef.current?.focus()}
                      blurOnSubmit={false}
                      inputAccessoryViewID={Platform.OS === "ios" ? `calcDoorJambWidth-${doorJambWidthID}` : undefined}
                      style={bubbleInputStyle}
                    />
                  </View>
                </View>
              </View>
            </View>
          </Card>

          {/* Window Assumptions */}
          <Card style={{ marginBottom: Spacing.md }}>
            <Text style={{ ...Typography.h2, marginBottom: Spacing.md }}>
              Window Assumptions
            </Text>

            <View style={{ marginBottom: Spacing.md }}>
              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: Spacing.md }}>
                <View style={{ flex: 1, marginTop: Typography.caption.fontSize + Spacing.xs }}>
                  <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500", color: Colors.darkCharcoal }}>
                    Window Size (ft)
                  </Text>
                  <Text style={helperTextStyle}>
                    Standard window dimensions
                  </Text>
                </View>
                <View style={{ alignItems: "center", width: 68 }}>
                  <Text style={unitHeaderStyle}>
                    Width
                  </Text>
                  <View style={inputContainerStyle}>
                    <TextInput
                      ref={windowWidthRef}
                      value={windowWidth}
                      onChangeText={setWindowWidth}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={Colors.mediumGray}
                      returnKeyType="next"
                      onSubmitEditing={() => windowHeightRef.current?.focus()}
                      blurOnSubmit={false}
                      inputAccessoryViewID={Platform.OS === "ios" ? `calcWindowWidth-${windowWidthID}` : undefined}
                      style={bubbleInputStyle}
                    />
                  </View>
                </View>
                <View style={{ alignItems: "center", width: 68 }}>
                  <Text style={unitHeaderStyle}>
                    Height
                  </Text>
                  <View style={inputContainerStyle}>
                    <TextInput
                      ref={windowHeightRef}
                      value={windowHeight}
                      onChangeText={setWindowHeight}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={Colors.mediumGray}
                    returnKeyType="next"
                    onSubmitEditing={() => wallCoverageRef.current?.focus()}
                      blurOnSubmit={false}
                      inputAccessoryViewID={Platform.OS === "ios" ? `calcWindowHeight-${windowHeightID}` : undefined}
                      style={bubbleInputStyle}
                    />
                  </View>
                </View>
              </View>
            </View>

          </Card>

          {/* Paint Coverage Rules */}
          <Card style={{ marginBottom: Spacing.md }}>
            <Text style={{ ...Typography.h2, marginBottom: Spacing.md }}>
              Paint Coverage Rules
            </Text>

            <View style={{ flexDirection: "row", gap: Spacing.md, marginBottom: Spacing.md }}>
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: Spacing.sm }}>
                <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500", color: Colors.darkCharcoal, alignSelf: "center", marginTop: centerAlignOffset }}>
                  Wall Paint
                </Text>
                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.xs }}>
                    sqft/gal
                  </Text>
                  <View style={inputContainerStyle}>
                    <TextInput
                      ref={wallCoverageRef}
                      value={String(wallCoverageSqFtPerGallon)}
                      onChangeText={(text) => updateAppSettings({ wallCoverageSqFtPerGallon: parseFloat(text) || 0 })}
                      keyboardType="numeric"
                      placeholder="350"
                      placeholderTextColor={Colors.mediumGray}
                      returnKeyType="next"
                      blurOnSubmit={false}
                      onSubmitEditing={() => ceilingCoverageRef.current?.focus()}
                      inputAccessoryViewID={Platform.OS === "ios" ? `wallCoverage-${wallCoverageID}` : undefined}
                      style={bubbleInputStyle}
                    />
                  </View>
                </View>
              </View>
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: Spacing.sm }}>
                <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500", color: Colors.darkCharcoal, alignSelf: "center", marginTop: centerAlignOffset }}>
                  Ceiling Paint
                </Text>
                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.xs }}>
                    sqft/gal
                  </Text>
                  <View style={inputContainerStyle}>
                    <TextInput
                      ref={ceilingCoverageRef}
                      value={String(ceilingCoverageSqFtPerGallon)}
                      onChangeText={(text) => updateAppSettings({ ceilingCoverageSqFtPerGallon: parseFloat(text) || 0 })}
                      keyboardType="numeric"
                      placeholder="350"
                      placeholderTextColor={Colors.mediumGray}
                      returnKeyType="next"
                      blurOnSubmit={false}
                      onSubmitEditing={() => trimCoverageRef.current?.focus()}
                      inputAccessoryViewID={Platform.OS === "ios" ? `ceilingCoverage-${ceilingCoverageID}` : undefined}
                      style={bubbleInputStyle}
                    />
                  </View>
                </View>
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: Spacing.md }}>
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: Spacing.sm }}>
                <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500", color: Colors.darkCharcoal }}>
                  Trim Paint
                </Text>
                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.xs }}>
                    sqft/gal
                  </Text>
                  <View style={inputContainerStyle}>
                    <TextInput
                      ref={trimCoverageRef}
                      value={String(trimCoverageSqFtPerGallon)}
                      onChangeText={(text) => updateAppSettings({ trimCoverageSqFtPerGallon: parseFloat(text) || 0 })}
                      keyboardType="numeric"
                      placeholder="350"
                      placeholderTextColor={Colors.mediumGray}
                      returnKeyType="next"
                      blurOnSubmit={false}
                      onSubmitEditing={() => primerCoverageRef.current?.focus()}
                      inputAccessoryViewID={Platform.OS === "ios" ? `trimCoverage-${trimCoverageID}` : undefined}
                      style={bubbleInputStyle}
                    />
                  </View>
                </View>
              </View>
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: Spacing.sm }}>
                <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500", color: Colors.darkCharcoal }}>
                  Primer
                </Text>
                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.xs }}>
                    sqft/gal
                  </Text>
                  <View style={inputContainerStyle}>
                    <TextInput
                      ref={primerCoverageRef}
                      value={String(primerCoverageSqFtPerGallon)}
                      onChangeText={(text) => updateAppSettings({ primerCoverageSqFtPerGallon: parseFloat(text) || 0 })}
                      keyboardType="numeric"
                      placeholder="350"
                      placeholderTextColor={Colors.mediumGray}
                      returnKeyType="next"
                      blurOnSubmit={false}
                      onSubmitEditing={() => closetCavityDepthRef.current?.focus()}
                      inputAccessoryViewID={Platform.OS === "ios" ? `primerCoverage-${primerCoverageID}` : undefined}
                      style={bubbleInputStyle}
                    />
                  </View>
                </View>
              </View>
            </View>
          </Card>

          {/* Closet Assumptions */}
          <Card style={{ marginBottom: Spacing.md }}>
            <Text style={{ ...Typography.h2, marginBottom: Spacing.md }}>
              Closet Assumptions
            </Text>

            <View style={{ marginBottom: Spacing.md }}>
              <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: Spacing.md }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500", color: Colors.darkCharcoal }}>
                    Closet Cavity Depth
                  </Text>
                  <Text style={helperTextStyle}>
                    Depth of closet interior for wall area calculation
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end", width: 68 }}>
                  <Text style={unitHeaderStyle}>
                    Feet
                  </Text>
                  <View style={inputContainerStyle}>
                    <TextInput
                      ref={closetCavityDepthRef}
                      value={closetCavityDepth}
                      onChangeText={setClosetCavityDepth}
                      keyboardType="numeric"
                      placeholder="2"
                      placeholderTextColor={Colors.mediumGray}
                      returnKeyType="next"
                      onSubmitEditing={() => singleClosetWidthRef.current?.focus()}
                      blurOnSubmit={false}
                      inputAccessoryViewID={Platform.OS === "ios" ? `calcClosetCavityDepth-${closetCavityDepthID}` : undefined}
                      style={bubbleInputStyle}
                    />
                  </View>
                </View>
              </View>
            </View>

            <View style={{ marginBottom: Spacing.sm }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.md }}>
                <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500", color: Colors.darkCharcoal, flex: 1 }}>
                  Door Width
                </Text>
                <View>
                  <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.xs, textAlign: "center" }}>
                    Single (in)
                  </Text>
                  <View style={inputContainerStyle}>
                    <TextInput
                      ref={singleClosetWidthRef}
                      value={singleClosetWidth}
                      onChangeText={setSingleClosetWidth}
                      keyboardType="numeric"
                      placeholder="24"
                      placeholderTextColor={Colors.mediumGray}
                      returnKeyType="next"
                      onSubmitEditing={() => doubleClosetWidthRef.current?.focus()}
                      blurOnSubmit={false}
                      inputAccessoryViewID={Platform.OS === "ios" ? `calcSingleClosetWidth-${singleClosetWidthID}` : undefined}
                      style={bubbleInputStyle}
                    />
                  </View>
                </View>
                <View>
                  <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.xs, textAlign: "center" }}>
                    Double (in)
                  </Text>
                  <View style={inputContainerStyle}>
                    <TextInput
                      ref={doubleClosetWidthRef}
                      value={doubleClosetWidth}
                      onChangeText={setDoubleClosetWidth}
                      keyboardType="numeric"
                      placeholder="48"
                      placeholderTextColor={Colors.mediumGray}
                      returnKeyType="next"
                      onSubmitEditing={() => singleClosetBaseboardRef.current?.focus()}
                      blurOnSubmit={false}
                      inputAccessoryViewID={Platform.OS === "ios" ? `calcDoubleClosetWidth-${doubleClosetWidthID}` : undefined}
                      style={bubbleInputStyle}
                    />
                  </View>
                </View>
              </View>
            </View>

            <View>
              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: Spacing.md }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500", color: Colors.darkCharcoal }}>
                    Baseboard Perimeter
                  </Text>
                  <Text style={helperTextStyle}>
                    Total baseboard length inside closet (back + 2 sides)
                  </Text>
                </View>
                <View>
                  <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.xs, textAlign: "center" }}>
                    Single (in)
                  </Text>
                  <View style={inputContainerStyle}>
                    <TextInput
                      ref={singleClosetBaseboardRef}
                      value={singleClosetBaseboardPerimeter}
                      onChangeText={setSingleClosetBaseboardPerimeter}
                      keyboardType="numeric"
                      placeholder="88"
                      placeholderTextColor={Colors.mediumGray}
                      returnKeyType="next"
                      onSubmitEditing={() => doubleClosetBaseboardRef.current?.focus()}
                      blurOnSubmit={false}
                      inputAccessoryViewID={Platform.OS === "ios" ? `calcSingleClosetBaseboard-${singleClosetBaseboardID}` : undefined}
                      style={bubbleInputStyle}
                    />
                  </View>
                </View>
                <View>
                  <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.xs, textAlign: "center" }}>
                    Double (in)
                  </Text>
                  <View style={inputContainerStyle}>
                    <TextInput
                      ref={doubleClosetBaseboardRef}
                      value={doubleClosetBaseboardPerimeter}
                      onChangeText={setDoubleClosetBaseboardPerimeter}
                      keyboardType="numeric"
                      placeholder="112"
                      placeholderTextColor={Colors.mediumGray}
                      returnKeyType="next"
                      onSubmitEditing={() => singleClosetTrimWidthRef.current?.focus()}
                      blurOnSubmit={false}
                      inputAccessoryViewID={Platform.OS === "ios" ? `calcDoubleClosetBaseboard-${doubleClosetBaseboardID}` : undefined}
                      style={bubbleInputStyle}
                    />
                  </View>
                </View>
              </View>
            </View>
          </Card>

          {/* Casings, Baseboards and Crowns */}
          <Card style={{ marginBottom: Spacing.md }}>
            <Text style={{ ...Typography.h2, marginBottom: Spacing.md }}>
              Casings, Baseboards and Crowns
            </Text>

            <View style={{ marginBottom: Spacing.md }}>
              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: Spacing.md }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500", color: Colors.darkCharcoal }}>
                    Casing Width
                  </Text>
                  <Text style={helperTextStyle}>
                    Casing width used for closet openings
                  </Text>
                </View>
                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.xs }}>Inches</Text>
                  <View style={inputContainerStyle}>
                    <TextInput
                      ref={singleClosetTrimWidthRef}
                      value={singleClosetTrimWidth}
                      onChangeText={(value) => {
                        setSingleClosetTrimWidth(value);
                        setDoubleClosetTrimWidth(value);
                      }}
                      keyboardType="numeric"
                      placeholder="3.5"
                      placeholderTextColor={Colors.mediumGray}
                      returnKeyType="next"
                      onSubmitEditing={() => baseboardWidthRef.current?.focus()}
                      blurOnSubmit={false}
                      inputAccessoryViewID={Platform.OS === "ios" ? `calcSingleClosetTrimWidth-${singleClosetTrimWidthID}` : undefined}
                      style={bubbleInputStyle}
                    />
                  </View>
                </View>
              </View>
            </View>

            <View style={{ marginBottom: Spacing.md }}>
              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: Spacing.md }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500", color: Colors.darkCharcoal }}>
                    Baseboard Width
                  </Text>
                  <Text style={helperTextStyle}>
                    Width of baseboard trim along walls
                  </Text>
                </View>
                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.xs }}>Inches</Text>
                  <View style={inputContainerStyle}>
                    <TextInput
                      ref={baseboardWidthRef}
                      value={baseboardWidth}
                      onChangeText={setBaseboardWidth}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={Colors.mediumGray}
                      returnKeyType="next"
                      onSubmitEditing={() => crownMouldingWidthRef.current?.focus()}
                      blurOnSubmit={false}
                      inputAccessoryViewID={Platform.OS === "ios" ? `calcBaseboardWidth-${baseboardWidthID}` : undefined}
                      style={bubbleInputStyle}
                    />
                  </View>
                </View>
              </View>
            </View>

            <View style={{ marginBottom: Spacing.md }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.md }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500", color: Colors.darkCharcoal }}>
                    Crown Moulding Width
                  </Text>
                  <Text style={helperTextStyle}>
                    Width of crown moulding trim along ceiling perimeter
                  </Text>
                </View>
                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.xs }}>Inches</Text>
                  <View style={inputContainerStyle}>
                    <TextInput
                      ref={crownMouldingWidthRef}
                      value={crownMouldingWidth}
                      onChangeText={setCrownMouldingWidth}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={Colors.mediumGray}
                      returnKeyType="next"
                      onSubmitEditing={() => windowTrimWidthRef.current?.focus()}
                      inputAccessoryViewID={Platform.OS === "ios" ? `calcCrownMouldingWidth-${crownMouldingWidthID}` : undefined}
                      style={bubbleInputStyle}
                    />
                  </View>
                </View>
              </View>
            </View>

            <View>
              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: Spacing.md }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500", color: Colors.darkCharcoal }}>
                    Window Trim Width
                  </Text>
                  <Text style={helperTextStyle}>
                    Width of trim molding around windows
                  </Text>
                </View>
                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.xs }}>Inches</Text>
                  <View style={inputContainerStyle}>
                    <TextInput
                      ref={windowTrimWidthRef}
                      value={windowTrimWidth}
                      onChangeText={setWindowTrimWidth}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={Colors.mediumGray}
                      returnKeyType="done"
                      onSubmitEditing={() => Keyboard.dismiss()}
                      inputAccessoryViewID={Platform.OS === "ios" ? `calcWindowTrimWidth-${windowTrimWidthID}` : undefined}
                      style={bubbleInputStyle}
                    />
                  </View>
                </View>
              </View>
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

      {/* KB-004: InputAccessoryViews for all calculation fields */}
      {Platform.OS === "ios" && (<>
        <InputAccessoryView nativeID={`calcDoorHeight-${doorHeightID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => doorWidthRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`calcDoorWidth-${doorWidthID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => doorHeightRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => doorTrimWidthRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`calcDoorTrimWidth-${doorTrimWidthID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => doorWidthRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => doorJambWidthRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`calcDoorJambWidth-${doorJambWidthID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => doorTrimWidthRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => windowWidthRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`calcWindowWidth-${windowWidthID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => doorJambWidthRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => windowHeightRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`calcWindowHeight-${windowHeightID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => windowWidthRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => wallCoverageRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`calcWindowTrimWidth-${windowTrimWidthID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => crownMouldingWidthRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => Keyboard.dismiss()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Done</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`wallCoverage-${wallCoverageID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => windowHeightRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => ceilingCoverageRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`ceilingCoverage-${ceilingCoverageID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => wallCoverageRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => trimCoverageRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`trimCoverage-${trimCoverageID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => ceilingCoverageRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => primerCoverageRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`primerCoverage-${primerCoverageID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => trimCoverageRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => closetCavityDepthRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`calcClosetCavityDepth-${closetCavityDepthID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => primerCoverageRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => singleClosetWidthRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`calcSingleClosetWidth-${singleClosetWidthID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => closetCavityDepthRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => doubleClosetWidthRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`calcSingleClosetTrimWidth-${singleClosetTrimWidthID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => doubleClosetBaseboardRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => baseboardWidthRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`calcSingleClosetBaseboard-${singleClosetBaseboardID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => doubleClosetWidthRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => doubleClosetBaseboardRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`calcDoubleClosetWidth-${doubleClosetWidthID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => singleClosetWidthRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => singleClosetBaseboardRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`calcDoubleClosetBaseboard-${doubleClosetBaseboardID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => singleClosetBaseboardRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => singleClosetTrimWidthRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`calcBaseboardWidth-${baseboardWidthID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => singleClosetTrimWidthRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => crownMouldingWidthRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`calcCrownMouldingWidth-${crownMouldingWidthID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => baseboardWidthRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => Keyboard.dismiss()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Done</Text></Pressable>
          </View>
        </InputAccessoryView>
      </>)}
    </SafeAreaView>
  );
}
