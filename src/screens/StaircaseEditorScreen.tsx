import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { usePreventRemove } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/RootNavigator";
import { useProjectStore } from "../state/projectStore";
import { usePricingStore } from "../state/pricingStore";
import { useAppSettings } from "../state/appSettings";
import { Colors, Typography, Spacing, BorderRadius, Shadows, TextInputStyles } from "../utils/designSystem";
import { Card } from "../components/Card";
import { Toggle } from "../components/Toggle";
import { FormInput } from "../components/FormInput";
import { SavePromptModal } from "../components/SavePromptModal";
import {
  formatCurrency,
} from "../utils/calculations";
import { computeStaircasePricingSummary } from "../utils/pricingSummary";
import { formatMeasurementValue, parseDisplayValue, formatMeasurement } from "../utils/unitConversion";

type Props = NativeStackScreenProps<RootStackParamList, "StaircaseEditor">;

export default function StaircaseEditorScreen({ route, navigation }: Props) {
  const { projectId, staircaseId } = route.params;

  // Check if this is a NEW staircase (no ID) or existing
  const isNewStaircase = !staircaseId;

  const project = useProjectStore((s) =>
    s.projects.find((p) => p.id === projectId)
  );
  const staircase = !isNewStaircase
    ? project?.staircases.find((s) => s.id === staircaseId)
    : null; // New staircase - no existing data

  const addStaircase = useProjectStore((s) => s.addStaircase);
  const updateStaircase = useProjectStore((s) => s.updateStaircase);
  const pricing = usePricingStore();
  const { testMode, unitSystem } = useAppSettings();

  // Staircase name/location
  const [name, setName] = useState(!isNewStaircase && staircase?.name ? staircase.name : "");

  // Staircase dimensions stored in feet, convert for display based on unit system
  const [riserCount, setRiserCount] = useState(
    !isNewStaircase && staircase?.riserCount && staircase.riserCount > 0 ? staircase.riserCount.toString() : ""
  );
  const [handrailLength, setHandrailLength] = useState(
    !isNewStaircase && staircase?.handrailLength && staircase.handrailLength > 0 ? formatMeasurementValue(staircase.handrailLength, 'length', unitSystem, 2) : ""
  );
  const [spindleCount, setSpindleCount] = useState(
    !isNewStaircase && staircase?.spindleCount && staircase.spindleCount > 0 ? staircase.spindleCount.toString() : ""
  );
  const [hasSecondaryStairwell, setHasSecondaryStairwell] = useState(
    !isNewStaircase && staircase?.hasSecondaryStairwell ? true : false
  );
  const [tallWallHeight, setTallWallHeight] = useState(
    !isNewStaircase && staircase?.tallWallHeight && staircase.tallWallHeight > 0 ? formatMeasurementValue(staircase.tallWallHeight, 'length', unitSystem, 2) : ""
  );
  const [shortWallHeight, setShortWallHeight] = useState(
    !isNewStaircase && staircase?.shortWallHeight && staircase.shortWallHeight > 0 ? formatMeasurementValue(staircase.shortWallHeight, 'length', unitSystem, 2) : ""
  );
  const [doubleSidedWalls, setDoubleSidedWalls] = useState(
    !isNewStaircase && staircase?.doubleSidedWalls ? true : false
  );
  const [notes, setNotes] = useState(!isNewStaircase && staircase?.notes ? staircase.notes : "");

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // Prevent double-save and navigation modal
  const isKeyboardVisibleRef = useRef(false);
  const pendingSavePromptRef = useRef(false);
  // MD-002: Store the navigation action to dispatch when discarding
  const preventedNavigationActionRef = useRef<any>(null);

  // Refs for form field navigation
  const nameRef = useRef<TextInput>(null);
  const riserCountRef = useRef<TextInput>(null);
  const handrailLengthRef = useRef<TextInput>(null);
  const spindleCountRef = useRef<TextInput>(null);
  const tallWallHeightRef = useRef<TextInput>(null);
  const shortWallHeightRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const notesCardRef = useRef<View>(null);

  const blurFocusedInput = useCallback(() => {
    const focusedInput = TextInput.State?.currentlyFocusedInput?.();
    if (focusedInput && "blur" in focusedInput) {
      (focusedInput as { blur?: () => void }).blur?.();
      return;
    }

    const focusedField = TextInput.State?.currentlyFocusedField?.();
    if (focusedField != null && TextInput.State?.blurTextInput) {
      TextInput.State.blurTextInput(focusedField);
    }
  }, []);

  // Track unsaved changes
  useEffect(() => {
    if (isNewStaircase) {
      // For new staircase: changes are when user enters any data
      const hasChanges =
        name !== "" ||
        riserCount !== "" ||
        handrailLength !== "" ||
        spindleCount !== "" ||
        (hasSecondaryStairwell && (tallWallHeight !== "" || shortWallHeight !== ""));
      setHasUnsavedChanges(hasChanges);
    } else {
      // For existing: changes are when values differ from stored data
      if (!staircase) return;

      const hasChanges =
        name !== (staircase.name || "") ||
        riserCount !== (staircase.riserCount && staircase.riserCount > 0 ? staircase.riserCount.toString() : "") ||
        handrailLength !== (staircase.handrailLength && staircase.handrailLength > 0 ? staircase.handrailLength.toString() : "") ||
        spindleCount !== (staircase.spindleCount && staircase.spindleCount > 0 ? staircase.spindleCount.toString() : "") ||
        hasSecondaryStairwell !== (staircase.hasSecondaryStairwell ?? false) ||
        tallWallHeight !== (staircase.tallWallHeight && staircase.tallWallHeight > 0 ? staircase.tallWallHeight.toString() : "") ||
        shortWallHeight !== (staircase.shortWallHeight && staircase.shortWallHeight > 0 ? staircase.shortWallHeight.toString() : "") ||
        doubleSidedWalls !== (staircase.doubleSidedWalls ?? false);

      setHasUnsavedChanges(hasChanges);
    }
  }, [
    isNewStaircase,
    staircase,
    name,
    riserCount,
    handrailLength,
    spindleCount,
    hasSecondaryStairwell,
    tallWallHeight,
    shortWallHeight,
    doubleSidedWalls,
  ]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () => {
      isKeyboardVisibleRef.current = true;
    });
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => {
      isKeyboardVisibleRef.current = false;
      if (pendingSavePromptRef.current) {
        pendingSavePromptRef.current = false;
        setShowSavePrompt(true);
      }
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("gestureStart", () => {
      if (isKeyboardVisibleRef.current) {
        blurFocusedInput();
        Keyboard.dismiss();
      }
    });

    return unsubscribe;
  }, [navigation, blurFocusedInput]);

  // Prevent navigation when there are unsaved changes (but not while saving)
  usePreventRemove(hasUnsavedChanges && !isSaving, ({ data }) => {
    if (!isSaving) {
      // MD-002: Store the navigation action so we can dispatch it when discarding
      preventedNavigationActionRef.current = data.action;

      if (isKeyboardVisibleRef.current) {
        pendingSavePromptRef.current = true;
        Keyboard.dismiss();
      } else {
        setShowSavePrompt(true);
      }
    }
  });

  // Navigate back after save completes
  useEffect(() => {
    if (isSaving) {
      navigation.goBack();
    }
  }, [isSaving, navigation]);

  const handleSave = () => {
    // Prevent double-save
    if (isSaving) return;

    const hasAnyData =
      riserCount !== "" ||
      handrailLength !== "" ||
      spindleCount !== "" ||
      (hasSecondaryStairwell && (tallWallHeight !== "" || shortWallHeight !== ""));

    if (!hasAnyData) {
      Alert.alert("No Data Entered", "Please enter at least one measurement before saving.");
      return;
    }

    // IMMEDIATELY set saving state to prevent modal
    setIsSaving(true);
    setHasUnsavedChanges(false);
    setShowSavePrompt(false);
    Keyboard.dismiss();

    // Convert display values back to imperial feet for storage
    const handrailLengthFeet = parseDisplayValue(handrailLength, 'length', unitSystem);
    const tallWallHeightFeet = parseDisplayValue(tallWallHeight, 'length', unitSystem);
    const shortWallHeightFeet = parseDisplayValue(shortWallHeight, 'length', unitSystem);

    if (isNewStaircase) {
      // CREATE new staircase with data
      const newStaircaseId = addStaircase(projectId);

      // Then immediately update it with the entered data
      updateStaircase(projectId, newStaircaseId, {
        name: name.trim(),
        riserCount: parseInt(riserCount) || 0,
        riserHeight: 7.5,
        treadDepth: 0,
        handrailLength: handrailLengthFeet,
        spindleCount: parseInt(spindleCount) || 0,
        coats: 2,
        hasSecondaryStairwell,
        tallWallHeight: tallWallHeightFeet,
        shortWallHeight: shortWallHeightFeet,
        doubleSidedWalls,
        notes: notes.trim() || undefined,
      });
    } else {
      // UPDATE existing staircase
      updateStaircase(projectId, staircaseId!, {
        name: name.trim(),
        riserCount: parseInt(riserCount) || 0,
        riserHeight: 7.5,
        treadDepth: 0,
        handrailLength: handrailLengthFeet,
        spindleCount: parseInt(spindleCount) || 0,
        coats: staircase?.coats || 2,
        hasSecondaryStairwell,
        tallWallHeight: tallWallHeightFeet,
        shortWallHeight: shortWallHeightFeet,
        doubleSidedWalls,
        notes: notes.trim() || undefined,
      });
    }

    // Navigation happens automatically via useEffect when isSaving becomes true
  };

  const handleDiscardAndLeave = () => {
    // For new staircases, nothing to delete (never created)
    // For existing staircases, just go back without changes
    setHasUnsavedChanges(false);
    setShowSavePrompt(false);

    // MD-002: Dispatch the stored navigation action to complete the original navigation
    if (preventedNavigationActionRef.current) {
      navigation.dispatch(preventedNavigationActionRef.current);
    } else {
      navigation.goBack();
    }
  };

  const handleSaveAndLeave = () => {
    setShowSavePrompt(false);
    handleSave();
  };

  const handleCancelExit = () => {
    setShowSavePrompt(false);
  };

  const calculations =
    isNewStaircase || !staircase
      ? computeStaircasePricingSummary(
          {
            id: "",
            riserCount: parseInt(riserCount) || 14,
            riserHeight: 7.5,
            treadDepth: 0,
            handrailLength: parseFloat(handrailLength) || 0,
            spindleCount: parseInt(spindleCount) || 0,
            coats: 2,
            hasSecondaryStairwell,
            tallWallHeight: parseFloat(tallWallHeight) || 0,
            shortWallHeight: parseFloat(shortWallHeight) || 0,
            doubleSidedWalls,
            notes: "",
          },
          pricing,
          project?.projectCoats
        )
      : computeStaircasePricingSummary(
          {
            ...staircase,
            riserCount: parseInt(riserCount) || 14,
            riserHeight: 7.5,
            treadDepth: 0,
            handrailLength: parseFloat(handrailLength) || 0,
            spindleCount: parseInt(spindleCount) || 0,
            hasSecondaryStairwell,
            tallWallHeight: parseFloat(tallWallHeight) || 0,
            shortWallHeight: parseFloat(shortWallHeight) || 0,
            doubleSidedWalls,
          },
          pricing,
          project?.projectCoats
        );

  // Only show preview if at least riser count is entered
  const hasDataEntered = riserCount !== "" || handrailLength !== "" || spindleCount !== "" ||
    (hasSecondaryStairwell && (tallWallHeight !== "" || shortWallHeight !== ""));

  // If existing staircase not found, show error
  if (!isNewStaircase && !staircase) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.backgroundWarmGray }}>
        <Text style={{ fontSize: Typography.h3.fontSize, color: Colors.mediumGray }}>Staircase not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: Colors.backgroundWarmGray }}>
      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 400 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* Page Name Indicator - only in test mode */}
          {testMode && (
            <View style={{ backgroundColor: Colors.neutralGray, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}>
              <Text style={{ fontSize: Typography.caption.fontSize, fontWeight: "700", color: Colors.error }}>
                PAGE: StaircaseEditorScreen
              </Text>
            </View>
          )}

          <View style={{ padding: Spacing.lg }}>
            {/* Staircase Information Card */}
            <Card style={{ marginBottom: Spacing.md }}>
              <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.darkCharcoal, marginBottom: Spacing.md }}>
                Staircase Information
              </Text>

              {/* Name/Location */}
              <View style={{ marginBottom: Spacing.md }}>
                <FormInput
                  ref={nameRef}
                  label="Name/Location"
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g., Main Staircase, Second Floor"
                  nextFieldRef={riserCountRef}
                  returnKeyType="next"
                  className="mb-0"
                />
              </View>

              {/* Row 1: Risers & Spindles - 2 columns */}
              <View style={{ flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.md }}>
                <View style={{ flex: 1 }}>
                  <FormInput
                    ref={riserCountRef}
                    previousFieldRef={nameRef}
                    label="Risers"
                    value={riserCount}
                    onChangeText={setRiserCount}
                    keyboardType="numeric"
                    placeholder="0"
                    nextFieldRef={spindleCountRef}
                    className="mb-0"
                  />
                  <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginTop: Spacing.xs }}>
                    Standard riser height of 7.5 inches assumed
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <FormInput
                    ref={spindleCountRef}
                    previousFieldRef={riserCountRef}
                    label="Spindles"
                    value={spindleCount}
                    onChangeText={setSpindleCount}
                    keyboardType="numeric"
                    placeholder="0"
                    nextFieldRef={handrailLengthRef}
                    className="mb-0"
                  />
                </View>
              </View>

              {/* Handrail Length - full width */}
              <View>
                <FormInput
                  ref={handrailLengthRef}
                  previousFieldRef={spindleCountRef}
                  label={`Handrail Length (${unitSystem === 'metric' ? 'm' : 'ft'})`}
                  value={handrailLength}
                  onChangeText={setHandrailLength}
                  keyboardType="numeric"
                  placeholder="0"
                  className="mb-0"
                />
              </View>
            </Card>

            {/* Secondary Stairwell Section */}
            <Card style={{ marginBottom: Spacing.md }}>
              <Toggle
                label="Has Secondary Stairwell"
                value={hasSecondaryStairwell}
                onValueChange={setHasSecondaryStairwell}
              />

              {hasSecondaryStairwell && (
                <>
                  <View style={{ marginBottom: Spacing.md, marginTop: Spacing.md }}>
                    <FormInput
                      ref={tallWallHeightRef}
                      previousFieldRef={spindleCountRef}
                      label={`Tall Wall Height (${unitSystem === 'metric' ? 'm' : 'ft'})`}
                      value={tallWallHeight}
                      onChangeText={setTallWallHeight}
                      keyboardType="numeric"
                      placeholder="0"
                      nextFieldRef={shortWallHeightRef}
                      className="mb-0"
                    />
                  </View>

                  <View style={{ marginBottom: Spacing.md }}>
                    <FormInput
                      ref={shortWallHeightRef}
                      previousFieldRef={tallWallHeightRef}
                      label={`Short Wall Height (${unitSystem === 'metric' ? 'm' : 'ft'})`}
                      value={shortWallHeight}
                      onChangeText={setShortWallHeight}
                      keyboardType="numeric"
                      placeholder="0"
                      className="mb-0"
                    />
                  </View>

                  <Toggle
                    label="Double-Sided Stair Walls?"
                    value={doubleSidedWalls}
                    onValueChange={setDoubleSidedWalls}
                  />
                </>
              )}
            </Card>

            {/* Notes Section */}
            <View ref={notesCardRef}>
              <Card style={{ marginBottom: Spacing.md }}>
                <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.darkCharcoal, marginBottom: Spacing.md }}>
                  Notes
                </Text>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Add any notes about this staircase..."
                  placeholderTextColor={Colors.mediumGray}
                  multiline
                  numberOfLines={3}
                  onFocus={() => {
                    setTimeout(() => {
                      notesCardRef.current?.measureLayout(
                        scrollViewRef.current as any,
                        (x, y) => {
                          scrollViewRef.current?.scrollTo({ y: y - 100, animated: true });
                        },
                        () => {}
                      );
                    }, 100);
                  }}
                  style={[
                    TextInputStyles.multiline,
                    {
                      backgroundColor: Colors.backgroundWarmGray,
                    }
                  ]}
                />
              </Card>
            </View>

            {/* Calculations Preview */}
            {calculations && hasDataEntered && (
              <Card style={{ marginBottom: Spacing.md }}>
                <Text style={{ fontSize: Typography.h3.fontSize, fontWeight: "700", color: Colors.darkCharcoal, marginBottom: Spacing.sm }}>
                  Estimate Preview
                </Text>

                {/* Paintable Area Breakdown */}
                <View style={{ backgroundColor: Colors.backgroundWarmGray, borderRadius: BorderRadius.default, padding: Spacing.sm, marginBottom: Spacing.sm }}>
                  <Text style={{ fontSize: Typography.caption.fontSize, fontWeight: "600", color: Colors.mediumGray, marginBottom: Spacing.sm }}>
                    PAINTABLE AREA CALCULATION:
                  </Text>

                  {/* Original staircase area */}
                  {parseFloat(riserCount) > 0 && (
                    <>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                        <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>Riser Area:</Text>
                        <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.darkCharcoal }}>
                          {parseFloat(riserCount)} risers × 7.5&quot; height × 3 ft width = {(parseFloat(riserCount) * (7.5/12) * 3).toFixed(0)} sq ft
                        </Text>
                      </View>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                        <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>Tread Area:</Text>
                        <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.darkCharcoal }}>0 sq ft (not used)</Text>
                      </View>
                    </>
                  )}

                  {/* Secondary stairwell area */}
                  {hasSecondaryStairwell && parseFloat(tallWallHeight) > 0 && parseFloat(shortWallHeight) > 0 && (
                    <>
                      <View style={{ borderTopWidth: 1, borderTopColor: Colors.neutralGray, marginTop: Spacing.sm, paddingTop: Spacing.sm }}>
                        <Text style={{ fontSize: Typography.caption.fontSize, fontWeight: "600", color: Colors.mediumGray, marginBottom: Spacing.xs }}>Secondary Stairwell:</Text>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                          <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>Wall Area:</Text>
                          <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.darkCharcoal }}>
                            ({tallWallHeight} + {shortWallHeight}) ÷ 2 × 12 ft{doubleSidedWalls ? " × 2" : ""} = {(((parseFloat(tallWallHeight) + parseFloat(shortWallHeight)) / 2) * 12 * (doubleSidedWalls ? 2 : 1)).toFixed(0)} sq ft
                          </Text>
                        </View>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                          <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>Ceiling Area:</Text>
                          <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.darkCharcoal }}>15 ft × 3.5 ft = {(15 * 3.5).toFixed(0)} sq ft</Text>
                        </View>
                      </View>
                    </>
                  )}

                  <View style={{ borderTopWidth: 1, borderTopColor: Colors.neutralGray, marginTop: Spacing.sm, paddingTop: Spacing.sm }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ fontSize: Typography.caption.fontSize, fontWeight: "700", color: Colors.darkCharcoal }}>Total Paintable Area:</Text>
                      <Text style={{ fontSize: Typography.caption.fontSize, fontWeight: "700", color: Colors.darkCharcoal }}>
                        {calculations.paintableArea.toFixed(0)} sq ft
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Labor Cost Breakdown */}
                <View style={{ backgroundColor: Colors.backgroundWarmGray, borderRadius: BorderRadius.default, padding: Spacing.sm, marginBottom: Spacing.sm }}>
                  <Text style={{ fontSize: Typography.caption.fontSize, fontWeight: "600", color: Colors.mediumGray, marginBottom: Spacing.sm }}>
                    LABOR COST CALCULATION:
                  </Text>
                  {parseFloat(riserCount) > 0 && (
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>Risers:</Text>
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.darkCharcoal }}>
                        {parseFloat(riserCount)} × ${pricing.riserLabor} = ${(parseFloat(riserCount) * pricing.riserLabor).toFixed(2)}
                      </Text>
                    </View>
                  )}
                  {parseFloat(spindleCount) > 0 && (
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>Spindles:</Text>
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.darkCharcoal }}>
                        {parseFloat(spindleCount)} × ${pricing.spindleLabor} = ${(parseFloat(spindleCount) * pricing.spindleLabor).toFixed(2)}
                      </Text>
                    </View>
                  )}
                  {parseFloat(handrailLength) > 0 && (
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>Handrail:</Text>
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.darkCharcoal }}>
                        {parseFloat(handrailLength)} ft × ${pricing.handrailLaborPerLF}/ft = ${(parseFloat(handrailLength) * pricing.handrailLaborPerLF).toFixed(2)}
                      </Text>
                    </View>
                  )}
                  {/* Secondary stairwell labor */}
                  {hasSecondaryStairwell && parseFloat(tallWallHeight) > 0 && parseFloat(shortWallHeight) > 0 && (
                    <>
                      <View style={{ borderTopWidth: 1, borderTopColor: Colors.neutralGray, marginTop: Spacing.sm, paddingTop: Spacing.sm, marginBottom: Spacing.xs }}>
                        <Text style={{ fontSize: Typography.caption.fontSize, fontWeight: "600", color: Colors.mediumGray, marginBottom: Spacing.xs }}>Secondary Stairwell:</Text>
                      </View>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                        <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>Wall Labor:</Text>
                        <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.darkCharcoal }}>
                          {(((parseFloat(tallWallHeight) + parseFloat(shortWallHeight)) / 2) * 12 * (doubleSidedWalls ? 2 : 1)).toFixed(0)} sq ft × ${pricing.wallLaborPerSqFt}/sqft = ${((((parseFloat(tallWallHeight) + parseFloat(shortWallHeight)) / 2) * 12 * (doubleSidedWalls ? 2 : 1)) * pricing.wallLaborPerSqFt).toFixed(2)}
                        </Text>
                      </View>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                        <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>Ceiling Labor:</Text>
                        <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.darkCharcoal }}>
                          {(15 * 3.5).toFixed(0)} sq ft × ${pricing.ceilingLaborPerSqFt}/sqft = ${((15 * 3.5) * pricing.ceilingLaborPerSqFt).toFixed(2)}
                        </Text>
                      </View>
                    </>
                  )}
                  <View style={{ borderTopWidth: 1, borderTopColor: Colors.neutralGray, marginTop: Spacing.sm, paddingTop: Spacing.sm }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ fontSize: Typography.caption.fontSize, fontWeight: "700", color: Colors.darkCharcoal }}>Total Labor:</Text>
                      <Text style={{ fontSize: Typography.caption.fontSize, fontWeight: "700", color: Colors.darkCharcoal }}>
                        ${calculations.laborDisplayed.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Material Cost Breakdown */}
                <View style={{ backgroundColor: Colors.backgroundWarmGray, borderRadius: BorderRadius.default, padding: Spacing.sm, marginBottom: Spacing.sm }}>
                  <Text style={{ fontSize: Typography.caption.fontSize, fontWeight: "600", color: Colors.mediumGray, marginBottom: Spacing.sm }}>
                    MATERIAL COST CALCULATION:
                  </Text>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>Paint needed:</Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.darkCharcoal }}>
                      {calculations.paintableArea.toFixed(0)} sq ft ÷ {pricing.wallCoverageSqFtPerGallon} × {staircase?.coats || 2} coats = {calculations.totalGallons.toFixed(2)} gal
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>Paint cost:</Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.darkCharcoal }}>
                      {Math.ceil(calculations.totalGallons)} gal × ${pricing.trimPaintPerGallon}/gal = ${calculations.materialsDisplayed.toFixed(2)}
                    </Text>
                  </View>
                </View>

                {/* Total Price */}
                <View style={{ backgroundColor: Colors.primaryBlueLight, borderWidth: 1, borderColor: Colors.primaryBlue, borderRadius: BorderRadius.default, padding: Spacing.sm }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>Labor Cost:</Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.darkCharcoal }}>${calculations.laborDisplayed.toFixed(2)}</Text>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.sm }}>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>Material Cost:</Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.darkCharcoal }}>${calculations.materialsDisplayed.toFixed(2)}</Text>
                  </View>
                  <View style={{ borderTopWidth: 1, borderTopColor: Colors.primaryBlue, paddingTop: Spacing.sm }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "700", color: Colors.darkCharcoal }}>Total Price:</Text>
                      <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "700", color: Colors.primaryBlue }}>
                        {formatCurrency(calculations.totalDisplayed)}
                      </Text>
                    </View>
                  </View>
                </View>
              </Card>
            )}

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
              accessibilityLabel="Save staircase"
              accessibilityHint="Save all changes to this staircase"
            >
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.white }}>
                Save Staircase
              </Text>
            </Pressable>
          </View>
        </ScrollView>

        {/* Save Confirmation Modal */}
        <SavePromptModal
          visible={showSavePrompt}
          onSave={handleSaveAndLeave}
          onDiscard={handleDiscardAndLeave}
          onCancel={handleCancelExit}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
