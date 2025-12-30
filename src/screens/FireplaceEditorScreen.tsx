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
  // MD-002: Ref to bypass usePreventRemove when explicitly discarding
  const isDiscardingRef = useRef(false);

  // Refs for form field navigation
  const nameRef = useRef<TextInput>(null);
  const widthRef = useRef<TextInput>(null);
  const heightRef = useRef<TextInput>(null);
  const depthRef = useRef<TextInput>(null);
  const trimLinearFeetRef = useRef<TextInput>(null);

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

  // Prevent navigation when there are unsaved changes (but not while saving or discarding)
  usePreventRemove(hasUnsavedChanges && !isSaving && !isDiscardingRef.current, ({ data }) => {
    if (!isSaving) {
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
    // MD-002: Set ref FIRST to bypass usePreventRemove check
    isDiscardingRef.current = true;

    // For new fireplaces, nothing to delete (never created)
    // For existing fireplaces, just go back without changes
    setHasUnsavedChanges(false);
    setShowSavePrompt(false);

    navigation.goBack();
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
          style={{ flex: 1 }}
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

          <View style={{ padding: Spacing.lg }}>
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

            <View style={{ marginBottom: Spacing.md }}>
              <FormInput
                ref={widthRef}
                label={`Width (${unitSystem === 'metric' ? 'm' : 'ft'})`}
                value={width}
                onChangeText={setWidth}
                keyboardType="numeric"
                placeholder="0"
                nextFieldRef={heightRef}
                className="mb-0"
              />
            </View>

            <View style={{ marginBottom: Spacing.md }}>
              <FormInput
                ref={heightRef}
                label={`Height (${unitSystem === 'metric' ? 'm' : 'ft'})`}
                value={height}
                onChangeText={setHeight}
                keyboardType="numeric"
                placeholder="0"
                nextFieldRef={depthRef}
                className="mb-0"
              />
            </View>

            <View style={{ marginBottom: Spacing.md }}>
              <FormInput
                ref={depthRef}
                label={`Depth (${unitSystem === 'metric' ? 'm' : 'ft'})`}
                value={depth}
                onChangeText={setDepth}
                keyboardType="numeric"
                placeholder="0"
                nextFieldRef={hasTrim ? trimLinearFeetRef : undefined}
                className="mb-0"
              />
            </View>

            {/* Has Trim Toggle */}
            <View style={{ marginBottom: Spacing.md }}>
              <Toggle
                label="Has Trim"
                value={hasTrim}
                onValueChange={setHasTrim}
              />
            </View>

            {hasTrim && (
              <View style={{ marginBottom: Spacing.md }}>
                <FormInput
                  ref={trimLinearFeetRef}
                  label={`Trim Linear (${unitSystem === 'metric' ? 'm' : 'ft'})`}
                  value={trimLinearFeet}
                  onChangeText={setTrimLinearFeet}
                  keyboardType="numeric"
                  placeholder="0"
                  className="mb-0"
                />
              </View>
            )}

            {/* Notes Section */}
            <View style={{ marginBottom: Spacing.md }}>
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500", color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                Notes
              </Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Add any notes about this fireplace..."
                placeholderTextColor={Colors.mediumGray}
                multiline
                numberOfLines={3}
                style={TextInputStyles.multiline}
              />
            </View>

            {/* Calculations Preview */}
            {calculations && (
              <Card style={{ marginBottom: Spacing.md }}>
                <Text style={{ fontSize: Typography.h3.fontSize, fontWeight: "700", color: Colors.darkCharcoal, marginBottom: Spacing.sm }}>
                  Estimate Preview
                </Text>

                {/* Paintable Area Breakdown */}
                <View style={{ backgroundColor: Colors.backgroundWarmGray, borderRadius: BorderRadius.default, padding: Spacing.sm, marginBottom: Spacing.sm }}>
                  <Text style={{ fontSize: Typography.caption.fontSize, fontWeight: "600", color: Colors.mediumGray, marginBottom: Spacing.sm }}>
                    PAINTABLE AREA CALCULATION:
                  </Text>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>Front/Back faces:</Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.darkCharcoal }}>
                      2 × ({width} {unitSystem === 'metric' ? 'm' : 'ft'} × {height} {unitSystem === 'metric' ? 'm' : 'ft'}) = {(2 * parseFloat(width || '0') * parseFloat(height || '0')).toFixed(1)} {unitSystem === 'metric' ? 'm²' : 'sq ft'}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>Top surface:</Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.darkCharcoal }}>
                      {width} {unitSystem === 'metric' ? 'm' : 'ft'} × {depth} {unitSystem === 'metric' ? 'm' : 'ft'} = {(parseFloat(width || '0') * parseFloat(depth || '0')).toFixed(1)} {unitSystem === 'metric' ? 'm²' : 'sq ft'}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>Side surface:</Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.darkCharcoal }}>
                      {height} {unitSystem === 'metric' ? 'm' : 'ft'} × {depth} {unitSystem === 'metric' ? 'm' : 'ft'} = {(parseFloat(height || '0') * parseFloat(depth || '0')).toFixed(1)} {unitSystem === 'metric' ? 'm²' : 'sq ft'}
                    </Text>
                  </View>
                  {hasTrim && parseFloat(trimLinearFeet || '0') > 0 && (
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>Trim area:</Text>
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.darkCharcoal }}>
                        {trimLinearFeet} {unitSystem === 'metric' ? 'm' : 'ft'} × 0.{unitSystem === 'metric' ? '15' : '5'} {unitSystem === 'metric' ? 'm' : 'ft'} = {(parseFloat(trimLinearFeet || '0') * (unitSystem === 'metric' ? 0.15 : 0.5)).toFixed(1)} {unitSystem === 'metric' ? 'm²' : 'sq ft'}
                      </Text>
                    </View>
                  )}
                  <View style={{ borderTopWidth: 1, borderTopColor: Colors.neutralGray, marginTop: Spacing.sm, paddingTop: Spacing.sm }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ fontSize: Typography.caption.fontSize, fontWeight: "700", color: Colors.darkCharcoal }}>Total Paintable Area:</Text>
                      <Text style={{ fontSize: Typography.caption.fontSize, fontWeight: "700", color: Colors.darkCharcoal }}>
                        {formatMeasurement(calculations.paintableArea, 'area', unitSystem)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Labor Cost */}
                <View style={{ backgroundColor: Colors.backgroundWarmGray, borderRadius: BorderRadius.default, padding: Spacing.sm, marginBottom: Spacing.sm }}>
                  <Text style={{ fontSize: Typography.caption.fontSize, fontWeight: "600", color: Colors.mediumGray, marginBottom: Spacing.sm }}>
                    LABOR COST CALCULATION:
                  </Text>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>Fireplace labor:</Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.darkCharcoal }}>
                      Fixed rate = ${pricing.fireplaceLabor.toFixed(2)}
                    </Text>
                  </View>
                </View>

                {/* Material Cost */}
                <View style={{ backgroundColor: Colors.backgroundWarmGray, borderRadius: BorderRadius.default, padding: Spacing.sm, marginBottom: Spacing.sm }}>
                  <Text style={{ fontSize: Typography.caption.fontSize, fontWeight: "600", color: Colors.mediumGray, marginBottom: Spacing.sm }}>
                    MATERIAL COST CALCULATION:
                  </Text>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>Paint needed:</Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.darkCharcoal }}>
                      {calculations.paintableArea.toFixed(1)} sq ft ÷ {pricing.wallCoverageSqFtPerGallon} × {fireplace?.coats || 2} coats = {calculations.totalGallons.toFixed(2)} gal
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>Paint cost:</Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.darkCharcoal }}>
                      {Math.ceil(calculations.totalGallons)} gal × ${pricing.wallPaintPerGallon}/gal = ${calculations.materialsDisplayed.toFixed(2)}
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
