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
import { computeFireplacePricingSummary } from "../utils/pricingSummary";
import { formatMeasurementValue, parseDisplayValue, formatMeasurement } from "../utils/unitConversion";

type Props = NativeStackScreenProps<RootStackParamList, "FireplaceEditor">;

export default function FireplaceEditorScreen({ route, navigation }: Props) {
  const { projectId, fireplaceId } = route.params;

  // Check if this is a NEW fireplace (no ID) or existing
  const isNewFireplace = !fireplaceId;

  const project = useProjectStore((s) =>
    s.projects.find((p) => p.id === projectId)
  );
  const fireplace = !isNewFireplace
    ? project?.fireplaces.find((f) => f.id === fireplaceId)
    : null; // New fireplace - no existing data

  const addFireplace = useProjectStore((s) => s.addFireplace);
  const updateFireplace = useProjectStore((s) => s.updateFireplace);
  const pricing = usePricingStore();
  const { testMode, unitSystem } = useAppSettings();

  // Fireplace name/location
  const [name, setName] = useState(!isNewFireplace && fireplace?.name ? fireplace.name : "");

  // Fireplace dimensions stored in feet, convert for display based on unit system
  const [width, setWidth] = useState(!isNewFireplace && fireplace?.width && fireplace.width > 0 ? formatMeasurementValue(fireplace.width, 'length', unitSystem, 2) : "");
  const [height, setHeight] = useState(!isNewFireplace && fireplace?.height && fireplace.height > 0 ? formatMeasurementValue(fireplace.height, 'length', unitSystem, 2) : "");
  const [depth, setDepth] = useState(!isNewFireplace && fireplace?.depth && fireplace.depth > 0 ? formatMeasurementValue(fireplace.depth, 'length', unitSystem, 2) : "");
  const [hasTrim, setHasTrim] = useState(!isNewFireplace && fireplace?.hasTrim ? true : false);
  const [trimLinearFeet, setTrimLinearFeet] = useState(
    !isNewFireplace && fireplace?.trimLinearFeet && fireplace.trimLinearFeet > 0 ? formatMeasurementValue(fireplace.trimLinearFeet, 'linearFeet', unitSystem, 2) : ""
  );
  const [notes, setNotes] = useState(!isNewFireplace && fireplace?.notes ? fireplace.notes : "");

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // Prevent double-save and navigation modal
  const isKeyboardVisibleRef = useRef(false);
  const pendingSavePromptRef = useRef(false);
  // MD-002: Store the navigation action to dispatch when discarding
  const preventedNavigationActionRef = useRef<any>(null);

  // Refs for form field navigation
  const nameRef = useRef<TextInput>(null);
  const widthRef = useRef<TextInput>(null);
  const heightRef = useRef<TextInput>(null);
  const depthRef = useRef<TextInput>(null);
  const trimLinearFeetRef = useRef<TextInput>(null);
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
    if (isNewFireplace) {
      // For new fireplace: changes are when user enters any data
      const hasChanges =
        name !== "" ||
        width !== "" ||
        height !== "" ||
        depth !== "" ||
        (hasTrim && trimLinearFeet !== "");
      setHasUnsavedChanges(hasChanges);
    } else {
      // For existing: changes are when values differ from stored data
      if (!fireplace) return;

      const hasChanges =
        name !== (fireplace.name || "") ||
        width !== (fireplace.width && fireplace.width > 0 ? fireplace.width.toString() : "") ||
        height !== (fireplace.height && fireplace.height > 0 ? fireplace.height.toString() : "") ||
        depth !== (fireplace.depth && fireplace.depth > 0 ? fireplace.depth.toString() : "") ||
        hasTrim !== (fireplace.hasTrim ?? false) ||
        trimLinearFeet !== (fireplace.trimLinearFeet && fireplace.trimLinearFeet > 0 ? fireplace.trimLinearFeet.toString() : "") ||
        notes !== (fireplace.notes || "");

      setHasUnsavedChanges(hasChanges);
    }
  }, [
    isNewFireplace,
    fireplace,
    name,
    width,
    height,
    depth,
    hasTrim,
    trimLinearFeet,
    notes,
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
      width !== "" ||
      height !== "" ||
      depth !== "" ||
      (hasTrim && trimLinearFeet !== "");

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
    const widthFeet = parseDisplayValue(width, 'length', unitSystem);
    const heightFeet = parseDisplayValue(height, 'length', unitSystem);
    const depthFeet = parseDisplayValue(depth, 'length', unitSystem);
    const trimLinearFeetValue = parseDisplayValue(trimLinearFeet, 'linearFeet', unitSystem);

    if (isNewFireplace) {
      // CREATE new fireplace with data
      const newFireplaceId = addFireplace(projectId);

      // Then immediately update it with the entered data
      updateFireplace(projectId, newFireplaceId, {
        name: name.trim(),
        width: widthFeet,
        height: heightFeet,
        depth: depthFeet,
        hasTrim,
        trimLinearFeet: trimLinearFeetValue,
        coats: 2,
        notes: notes.trim() || undefined,
      });
    } else {
      // UPDATE existing fireplace
      updateFireplace(projectId, fireplaceId!, {
        name: name.trim(),
        width: widthFeet,
        height: heightFeet,
        depth: depthFeet,
        hasTrim,
        trimLinearFeet: trimLinearFeetValue,
        coats: fireplace?.coats || 2,
        notes: notes.trim() || undefined,
      });
    }

    // Navigation happens automatically via useEffect when isSaving becomes true
  };

  const handleDiscardAndLeave = () => {
    // For new fireplaces, nothing to delete (never created)
    // For existing fireplaces, just go back without changes
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
    isNewFireplace || !fireplace
      ? computeFireplacePricingSummary(
          {
            id: "",
            width: parseFloat(width) || 0,
            height: parseFloat(height) || 0,
            depth: parseFloat(depth) || 0,
            hasTrim,
            trimLinearFeet: parseFloat(trimLinearFeet) || 0,
            coats: 2,
            notes: "",
          },
          pricing
        )
      : computeFireplacePricingSummary(
          {
            ...fireplace,
            width: parseFloat(width) || 0,
            height: parseFloat(height) || 0,
            depth: parseFloat(depth) || 0,
            hasTrim,
            trimLinearFeet: parseFloat(trimLinearFeet) || 0,
          },
          pricing
        );

  // If existing fireplace not found, show error
  if (!isNewFireplace && !fireplace) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.backgroundWarmGray }}>
        <Text style={{ fontSize: Typography.h3.fontSize, color: Colors.mediumGray }}>Fireplace not found</Text>
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
                PAGE: FireplaceEditorScreen
              </Text>
            </View>
          )}

          <View style={{ padding: Spacing.md }}>
            {/* Fireplace Information Card */}
            <Card style={{ marginBottom: Spacing.md }}>
              <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.darkCharcoal, marginBottom: Spacing.md }}>
                Fireplace Information
              </Text>

              {/* Name/Location */}
              <View style={{ marginBottom: Spacing.md }}>
                <FormInput
                  ref={nameRef}
                  label="Name/Location"
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g., Living Room Fireplace, Master Bedroom"
                  nextFieldRef={widthRef}
                  returnKeyType="next"
                  className="mb-0"
                />
              </View>

              {/* Row: Width, Height, Depth - 3 columns */}
              <View style={{ flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.md }}>
                <View style={{ flex: 1 }}>
                  <FormInput
                    ref={widthRef}
                    previousFieldRef={nameRef}
                    label={`Width (${unitSystem === 'metric' ? 'm' : 'ft'})`}
                    value={width}
                    onChangeText={setWidth}
                    keyboardType="numeric"
                    placeholder="0"
                    nextFieldRef={heightRef}
                    className="mb-0"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <FormInput
                    ref={heightRef}
                    previousFieldRef={widthRef}
                    label={`Height (${unitSystem === 'metric' ? 'm' : 'ft'})`}
                    value={height}
                    onChangeText={setHeight}
                    keyboardType="numeric"
                    placeholder="0"
                    nextFieldRef={depthRef}
                    className="mb-0"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <FormInput
                    ref={depthRef}
                    previousFieldRef={heightRef}
                    label={`Depth (${unitSystem === 'metric' ? 'm' : 'ft'})`}
                    value={depth}
                    onChangeText={setDepth}
                    keyboardType="numeric"
                    placeholder="0"
                    nextFieldRef={hasTrim ? trimLinearFeetRef : undefined}
                    className="mb-0"
                  />
                </View>
              </View>

              {/* Has Trim Toggle */}
              <View style={{ marginBottom: hasTrim ? Spacing.md : 0 }}>
                <Toggle
                  label="Has Trim"
                  value={hasTrim}
                  onValueChange={setHasTrim}
                />
              </View>

              {hasTrim && (
                <View>
                  <FormInput
                    ref={trimLinearFeetRef}
                    previousFieldRef={depthRef}
                    label={`Trim Linear (${unitSystem === 'metric' ? 'm' : 'ft'})`}
                    value={trimLinearFeet}
                    onChangeText={setTrimLinearFeet}
                    keyboardType="numeric"
                    placeholder="0"
                    className="mb-0"
                  />
                </View>
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
                  placeholder="Add any notes about this fireplace..."
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

            {/* Fireplace Summary */}
            {calculations && (() => {
              // Calculate per-component areas and costs
              const frontBackArea = 2 * parseFloat(width || '0') * parseFloat(height || '0');
              const topArea = parseFloat(width || '0') * parseFloat(depth || '0');
              const sideArea = parseFloat(height || '0') * parseFloat(depth || '0');
              const trimArea = hasTrim && parseFloat(trimLinearFeet || '0') > 0
                ? parseFloat(trimLinearFeet || '0') * (unitSystem === 'metric' ? 0.15 : 0.5)
                : 0;

              // Fireplace labor is fixed rate, materials distributed proportionally
              const fireplaceLabor = pricing.fireplaceLabor;
              const totalMaterials = calculations.materialsDisplayed;

              // Distribute materials across surfaces
              const totalComponents = (frontBackArea > 0 ? 1 : 0) +
                                     (topArea > 0 ? 1 : 0) +
                                     (sideArea > 0 ? 1 : 0) +
                                     (trimArea > 0 ? 1 : 0);
              const materialPerComponent = totalComponents > 0 ? totalMaterials / totalComponents : 0;

              const frontBackMaterials = frontBackArea > 0 ? materialPerComponent : 0;
              const topMaterials = topArea > 0 ? materialPerComponent : 0;
              const sideMaterials = sideArea > 0 ? materialPerComponent : 0;
              const trimMaterials = trimArea > 0 ? materialPerComponent : 0;

              // Labor is fixed, but we'll show it as one row
              const laborPerComponent = totalComponents > 0 ? fireplaceLabor / totalComponents : 0;
              const frontBackLabor = frontBackArea > 0 ? laborPerComponent : 0;
              const topLabor = topArea > 0 ? laborPerComponent : 0;
              const sideLabor = sideArea > 0 ? laborPerComponent : 0;
              const trimLabor = trimArea > 0 ? laborPerComponent : 0;

              return (
                <Card style={{ marginBottom: Spacing.md }}>
                  <Text style={Typography.h2}>Fireplace Summary</Text>

                  <View style={{ flexDirection: "row", gap: Spacing.sm }}>
                    {/* Gray section - flex: 3, 2-column layout */}
                    <View style={{ flex: 3, backgroundColor: Colors.backgroundWarmGray, borderRadius: BorderRadius.default, padding: Spacing.md }}>
                      {/* Empty row for alignment */}
                      <View style={{ marginBottom: Spacing.xs }}>
                        <Text style={{ fontSize: Typography.body.fontSize, color: "transparent" }}>-</Text>
                      </View>

                      {frontBackArea > 0 && (
                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                          <Text style={{ fontSize: Typography.body.fontSize, color: Colors.darkCharcoal }}>Front/Back</Text>
                          <Text style={{ fontSize: Typography.body.fontSize, color: Colors.darkCharcoal }}>
                            {formatMeasurement(Math.ceil(frontBackArea), 'area', unitSystem, 0)}
                          </Text>
                        </View>
                      )}

                      {topArea > 0 && (
                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                          <Text style={{ fontSize: Typography.body.fontSize, color: Colors.darkCharcoal }}>Top</Text>
                          <Text style={{ fontSize: Typography.body.fontSize, color: Colors.darkCharcoal }}>
                            {formatMeasurement(Math.ceil(topArea), 'area', unitSystem, 0)}
                          </Text>
                        </View>
                      )}

                      {sideArea > 0 && (
                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                          <Text style={{ fontSize: Typography.body.fontSize, color: Colors.darkCharcoal }}>Side</Text>
                          <Text style={{ fontSize: Typography.body.fontSize, color: Colors.darkCharcoal }}>
                            {formatMeasurement(Math.ceil(sideArea), 'area', unitSystem, 0)}
                          </Text>
                        </View>
                      )}

                      {trimArea > 0 && (
                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                          <Text style={{ fontSize: Typography.body.fontSize, color: Colors.darkCharcoal }}>Trim</Text>
                          <Text style={{ fontSize: Typography.body.fontSize, color: Colors.darkCharcoal }}>
                            {formatMeasurement(Math.ceil(trimArea), 'area', unitSystem, 0)}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Blue section - flex: 2, 2 columns right-aligned */}
                    <View style={{ flex: 2, backgroundColor: "#E3F2FD", borderRadius: BorderRadius.default, padding: Spacing.md }}>
                      {/* Header Row */}
                      <View style={{ flexDirection: "row", gap: Spacing.xs, marginBottom: Spacing.xs }}>
                        <Text style={{ flex: 1, fontSize: Typography.body.fontSize, color: Colors.mediumGray, textAlign: "right" }}>Labor</Text>
                        <Text style={{ flex: 1, fontSize: Typography.body.fontSize, color: Colors.mediumGray, textAlign: "right" }}>Mat</Text>
                      </View>

                      {frontBackArea > 0 && (
                        <View style={{ flexDirection: "row", gap: Spacing.xs, marginBottom: Spacing.xs }}>
                          <Text style={{ flex: 1, fontSize: Typography.body.fontSize, color: Colors.darkCharcoal, textAlign: "right" }}>
                            ${Math.round(frontBackLabor)}
                          </Text>
                          <Text style={{ flex: 1, fontSize: Typography.body.fontSize, color: Colors.darkCharcoal, textAlign: "right" }}>
                            ${Math.round(frontBackMaterials)}
                          </Text>
                        </View>
                      )}

                      {topArea > 0 && (
                        <View style={{ flexDirection: "row", gap: Spacing.xs, marginBottom: Spacing.xs }}>
                          <Text style={{ flex: 1, fontSize: Typography.body.fontSize, color: Colors.darkCharcoal, textAlign: "right" }}>
                            ${Math.round(topLabor)}
                          </Text>
                          <Text style={{ flex: 1, fontSize: Typography.body.fontSize, color: Colors.darkCharcoal, textAlign: "right" }}>
                            ${Math.round(topMaterials)}
                          </Text>
                        </View>
                      )}

                      {sideArea > 0 && (
                        <View style={{ flexDirection: "row", gap: Spacing.xs, marginBottom: Spacing.xs }}>
                          <Text style={{ flex: 1, fontSize: Typography.body.fontSize, color: Colors.darkCharcoal, textAlign: "right" }}>
                            ${Math.round(sideLabor)}
                          </Text>
                          <Text style={{ flex: 1, fontSize: Typography.body.fontSize, color: Colors.darkCharcoal, textAlign: "right" }}>
                            ${Math.round(sideMaterials)}
                          </Text>
                        </View>
                      )}

                      {trimArea > 0 && (
                        <View style={{ flexDirection: "row", gap: Spacing.xs, marginBottom: Spacing.xs }}>
                          <Text style={{ flex: 1, fontSize: Typography.body.fontSize, color: Colors.darkCharcoal, textAlign: "right" }}>
                            ${Math.round(trimLabor)}
                          </Text>
                          <Text style={{ flex: 1, fontSize: Typography.body.fontSize, color: Colors.darkCharcoal, textAlign: "right" }}>
                            ${Math.round(trimMaterials)}
                          </Text>
                        </View>
                      )}

                      <View style={{ height: 1, backgroundColor: "#90CAF9", marginVertical: Spacing.xs }} />

                      {/* Subtotals - without labels */}
                      <View style={{ flexDirection: "row", gap: Spacing.xs, marginBottom: Spacing.xs }}>
                        <Text style={{ flex: 1, fontSize: Typography.body.fontSize, color: Colors.darkCharcoal, textAlign: "right" }}>
                          ${Math.round(calculations.laborDisplayed)}
                        </Text>
                        <Text style={{ flex: 1, fontSize: Typography.body.fontSize, color: Colors.darkCharcoal, textAlign: "right" }}>
                          ${Math.round(calculations.materialsDisplayed)}
                        </Text>
                      </View>

                      <View style={{ height: 1, backgroundColor: "#90CAF9", marginVertical: Spacing.xs }} />

                      {/* Total */}
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "700" as any, color: Colors.darkCharcoal }}>Total:</Text>
                        <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: "700" as any, color: Colors.primaryBlue }}>
                          ${calculations.totalDisplayed.toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Card>
              );
            })()}

            {/* Test Mode: Detailed Calculation Breakdown */}
            {testMode && calculations && (() => {
              const frontBackArea = 2 * parseFloat(width || '0') * parseFloat(height || '0');
              const topArea = parseFloat(width || '0') * parseFloat(depth || '0');
              const sideArea = parseFloat(height || '0') * parseFloat(depth || '0');
              const trimArea = hasTrim && parseFloat(trimLinearFeet || '0') > 0
                ? parseFloat(trimLinearFeet || '0') * (unitSystem === 'metric' ? 0.15 : 0.5)
                : 0;

              return (
                <Card style={{ marginBottom: Spacing.md }}>
                  <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.error, marginBottom: Spacing.md }}>
                    TEST MODE: Calculation Details
                  </Text>

                  <View style={{ backgroundColor: Colors.backgroundWarmGray, borderRadius: BorderRadius.default, padding: Spacing.md }}>
                    {/* Front/Back */}
                    {frontBackArea > 0 && (
                      <View style={{ marginBottom: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.neutralGray }}>
                        <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                          Front/Back Faces
                        </Text>
                        <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                          Area: {frontBackArea.toFixed(2)} {unitSystem === 'metric' ? 'm²' : 'sq ft'} (2 × {width} × {height})
                        </Text>
                      </View>
                    )}

                    {/* Top */}
                    {topArea > 0 && (
                      <View style={{ marginBottom: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.neutralGray }}>
                        <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                          Top Surface
                        </Text>
                        <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                          Area: {topArea.toFixed(2)} {unitSystem === 'metric' ? 'm²' : 'sq ft'} ({width} × {depth})
                        </Text>
                      </View>
                    )}

                    {/* Side */}
                    {sideArea > 0 && (
                      <View style={{ marginBottom: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.neutralGray }}>
                        <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                          Side Surface
                        </Text>
                        <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                          Area: {sideArea.toFixed(2)} {unitSystem === 'metric' ? 'm²' : 'sq ft'} ({height} × {depth})
                        </Text>
                      </View>
                    )}

                    {/* Trim */}
                    {trimArea > 0 && (
                      <View style={{ marginBottom: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.neutralGray }}>
                        <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                          Trim
                        </Text>
                        <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                          Area: {trimArea.toFixed(2)} {unitSystem === 'metric' ? 'm²' : 'sq ft'} ({trimLinearFeet} × {unitSystem === 'metric' ? '0.15' : '0.5'})
                        </Text>
                      </View>
                    )}

                    {/* Labor */}
                    <View style={{ marginBottom: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.neutralGray }}>
                      <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                        Labor
                      </Text>
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                        Fixed rate: ${pricing.fireplaceLabor.toFixed(2)}
                      </Text>
                    </View>

                    {/* Paint */}
                    <View style={{ marginBottom: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.neutralGray }}>
                      <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                        Paint
                      </Text>
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                        Total Area: {calculations.paintableArea.toFixed(2)} {unitSystem === 'metric' ? 'm²' : 'sq ft'} | Coats: {fireplace?.coats || 2}
                      </Text>
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                        Coverage: {pricing.wallCoverageSqFtPerGallon} sqft/gal
                      </Text>
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                        Gallons: {calculations.totalGallons.toFixed(2)} gal
                      </Text>
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                        Materials: {Math.ceil(calculations.totalGallons)} gal × ${pricing.wallPaintPerGallon.toFixed(2)}/gal = ${calculations.materialsDisplayed.toFixed(2)}
                      </Text>
                    </View>

                    {/* Totals */}
                    <View>
                      <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "700" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                        Totals
                      </Text>
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                        Total Labor: ${calculations.laborDisplayed.toFixed(2)}
                      </Text>
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                        Total Materials: ${calculations.materialsDisplayed.toFixed(2)}
                      </Text>
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                        Grand Total: ${calculations.totalDisplayed.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </Card>
              );
            })()}

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
              accessibilityLabel="Save fireplace"
              accessibilityHint="Save all changes to this fireplace"
            >
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.white }}>
                Save Fireplace
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
