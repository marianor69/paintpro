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
import { FormInput } from "../components/FormInput";
import { SavePromptModal } from "../components/SavePromptModal";
import { formatCurrency } from "../utils/calculations";
import { formatMeasurementValue, parseDisplayValue, formatMeasurement } from "../utils/unitConversion";

type Props = NativeStackScreenProps<RootStackParamList, "BuiltInEditor">;

export default function BuiltInEditorScreen({ route, navigation }: Props) {
  const { projectId, builtInId } = route.params;

  // Check if this is a NEW built-in (no ID) or existing
  const isNewBuiltIn = !builtInId;

  const project = useProjectStore((s) =>
    s.projects.find((p) => p.id === projectId)
  );
  const builtIn = !isNewBuiltIn
    ? project?.builtIns?.find((b) => b.id === builtInId)
    : null; // New built-in - no existing data

  const addBuiltIn = useProjectStore((s) => s.addBuiltIn);
  const updateBuiltIn = useProjectStore((s) => s.updateBuiltIn);
  const pricing = usePricingStore();
  const { testMode, unitSystem } = useAppSettings();

  // Convert stored imperial values (inches) to display values based on unit system
  // Built-ins store dimensions in INCHES, but unit conversion works with FEET, so convert inches->feet->display
  const [name, setName] = useState(!isNewBuiltIn && builtIn?.name ? builtIn.name : "");
  const [width, setWidth] = useState(!isNewBuiltIn && builtIn?.width && builtIn.width > 0 ? formatMeasurementValue(builtIn.width / 12, 'length', unitSystem, 2) : "");
  const [height, setHeight] = useState(!isNewBuiltIn && builtIn?.height && builtIn.height > 0 ? formatMeasurementValue(builtIn.height / 12, 'length', unitSystem, 2) : "");
  const [depth, setDepth] = useState(!isNewBuiltIn && builtIn?.depth && builtIn.depth > 0 ? formatMeasurementValue(builtIn.depth / 12, 'length', unitSystem, 2) : "");
  const [shelfCount, setShelfCount] = useState(!isNewBuiltIn && builtIn?.shelfCount && builtIn.shelfCount > 0 ? builtIn.shelfCount.toString() : "");
  const [notes, setNotes] = useState(!isNewBuiltIn && builtIn?.notes ? builtIn.notes : "");

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // Prevent double-save and navigation modal
  const isSavingRef = useRef(false); // Ref-based guard for rapid taps (more reliable than state)
  const isKeyboardVisibleRef = useRef(false);
  const pendingSavePromptRef = useRef(false);
  // MD-002: Ref to bypass usePreventRemove when explicitly discarding
  const isDiscardingRef = useRef(false);

  // Refs for form field navigation
  const nameRef = useRef<TextInput>(null);
  const widthRef = useRef<TextInput>(null);
  const heightRef = useRef<TextInput>(null);
  const depthRef = useRef<TextInput>(null);
  const shelfCountRef = useRef<TextInput>(null);

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
    if (isNewBuiltIn) {
      // For new built-in: changes are when user enters any data
      const hasChanges = name !== "" || width !== "" || height !== "" || depth !== "" || shelfCount !== "";
      setHasUnsavedChanges(hasChanges);
    } else {
      // For existing: changes are when values differ from stored data
      if (!builtIn) return;

      const hasChanges =
        name !== (builtIn.name || "") ||
        width !== (builtIn.width && builtIn.width > 0 ? builtIn.width.toString() : "") ||
        height !== (builtIn.height && builtIn.height > 0 ? builtIn.height.toString() : "") ||
        depth !== (builtIn.depth && builtIn.depth > 0 ? builtIn.depth.toString() : "") ||
        shelfCount !== (builtIn.shelfCount && builtIn.shelfCount > 0 ? builtIn.shelfCount.toString() : "") ||
        notes !== (builtIn.notes || "");

      setHasUnsavedChanges(hasChanges);
    }
  }, [isNewBuiltIn, builtIn, name, width, height, depth, shelfCount, notes]);

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
    // Prevent double-save using ref (checked first, before any state reads)
    if (isSavingRef.current) return;

    // For existing built-ins, prevent saving when no changes exist
    if (!isNewBuiltIn && !hasUnsavedChanges) return;

    const hasAnyData = name !== "" || width !== "" || height !== "" || depth !== "" || shelfCount !== "";

    if (!hasAnyData) {
      Alert.alert("No Data Entered", "Please enter a name and at least one measurement before saving.");
      return;
    }

    // IMMEDIATELY set saving state to prevent modal and double-save
    isSavingRef.current = true;
    setIsSaving(true);
    setHasUnsavedChanges(false);
    setShowSavePrompt(false);
    Keyboard.dismiss();

    // Convert display values back to imperial inches for storage
    // parseDisplayValue returns feet, so multiply by 12 to get inches
    const widthInches = parseDisplayValue(width, 'length', unitSystem) * 12;
    const heightInches = parseDisplayValue(height, 'length', unitSystem) * 12;
    const depthInches = parseDisplayValue(depth, 'length', unitSystem) * 12;

    if (isNewBuiltIn) {
      // CREATE new built-in with data
      const newBuiltInId = addBuiltIn(projectId);

      // Then immediately update it with the entered data
      updateBuiltIn(projectId, newBuiltInId, {
        name: name.trim(),
        width: widthInches,
        height: heightInches,
        depth: depthInches,
        shelfCount: parseInt(shelfCount) || 0,
        coats: 1,
        notes: notes.trim() || undefined,
      });
    } else {
      // UPDATE existing built-in
      updateBuiltIn(projectId, builtInId!, {
        name: name.trim(),
        width: widthInches,
        height: heightInches,
        depth: depthInches,
        shelfCount: parseInt(shelfCount) || 0,
        coats: builtIn?.coats || 1,
        notes: notes.trim() || undefined,
      });
    }

    // Navigation happens automatically via useEffect when isSaving becomes true
  };

  const handleDiscardAndLeave = () => {
    // MD-002: Set ref FIRST to bypass usePreventRemove check
    isDiscardingRef.current = true;

    // For new built-ins, nothing to delete (never created)
    // For existing built-ins, just go back without changes
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

  // Calculate total paintable area (all 6 faces of the box)
  const widthVal = parseFloat(width) || 0;
  const heightVal = parseFloat(height) || 0;
  const depthVal = parseFloat(depth) || 0;
  const totalPaintableArea =
    2 * (widthVal * heightVal) + // front and back
    2 * (widthVal * depthVal) + // left and right sides
    2 * (heightVal * depthVal) + // top and bottom
    (shelfCount ? parseInt(shelfCount) * widthVal : 0); // shelves

  // If existing built-in not found, show error
  if (!isNewBuiltIn && !builtIn) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.backgroundWarmGray }}>
        <Text style={{ fontSize: Typography.h3.fontSize, color: Colors.mediumGray }}>Built-In not found</Text>
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
                PAGE: BuiltInEditorScreen
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
                placeholder="e.g., Library Bookshelf, Living Room Built-In"
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
                placeholder={unitSystem === 'metric' ? '0.91' : '3'}
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
                placeholder={unitSystem === 'metric' ? '2.03' : '6.67'}
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
                placeholder={unitSystem === 'metric' ? '0.30' : '1'}
                nextFieldRef={shelfCountRef}
                className="mb-0"
              />
            </View>

            <View style={{ marginBottom: Spacing.md }}>
              <FormInput
                ref={shelfCountRef}
                label="Number of Shelves"
                value={shelfCount}
                onChangeText={setShelfCount}
                keyboardType="numeric"
                placeholder="0"
                className="mb-0"
              />
            </View>

            {/* Notes Section */}
            <View style={{ marginBottom: Spacing.md }}>
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500", color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                Notes
              </Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Add any notes about this built-in..."
                placeholderTextColor={Colors.mediumGray}
                multiline
                numberOfLines={3}
                style={TextInputStyles.multiline}
              />
            </View>

            {/* Paintable Area Preview */}
            {totalPaintableArea > 0 && (
              <Card style={{ marginBottom: Spacing.md }}>
                <Text style={{ fontSize: Typography.h3.fontSize, fontWeight: "700", color: Colors.darkCharcoal, marginBottom: Spacing.sm }}>
                  Paintable Area
                </Text>

                <View style={{ backgroundColor: Colors.backgroundWarmGray, borderRadius: BorderRadius.default, padding: Spacing.sm, marginBottom: Spacing.sm }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>Front/Back:</Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.darkCharcoal }}>
                      {(2 * widthVal * heightVal).toFixed(1)} {unitSystem === 'metric' ? 'm²' : 'sq ft'}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>Left/Right sides:</Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.darkCharcoal }}>
                      {(2 * heightVal * depthVal).toFixed(1)} {unitSystem === 'metric' ? 'm²' : 'sq ft'}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>Top/Bottom:</Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.darkCharcoal }}>
                      {(2 * widthVal * depthVal).toFixed(1)} {unitSystem === 'metric' ? 'm²' : 'sq ft'}
                    </Text>
                  </View>
                  {shelfCount && parseInt(shelfCount) > 0 && (
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                        {shelfCount} shelves:
                      </Text>
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.darkCharcoal }}>
                        {(parseInt(shelfCount) * widthVal).toFixed(1)} {unitSystem === 'metric' ? 'm²' : 'sq ft'}
                      </Text>
                    </View>
                  )}
                  <View style={{ borderTopWidth: 1, borderTopColor: Colors.neutralGray, marginTop: Spacing.sm, paddingTop: Spacing.sm }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ fontSize: Typography.caption.fontSize, fontWeight: "700", color: Colors.darkCharcoal }}>
                        Total Paintable Area:
                      </Text>
                      <Text style={{ fontSize: Typography.caption.fontSize, fontWeight: "700", color: Colors.darkCharcoal }}>
                        {totalPaintableArea.toFixed(1)} {unitSystem === 'metric' ? 'm²' : 'sq ft'}
                      </Text>
                    </View>
                  </View>
                </View>
              </Card>
            )}

            <Pressable
              onPress={handleSave}
              disabled={isSaving}
              style={{
                backgroundColor: isSaving ? Colors.mediumGray : Colors.primaryBlue,
                borderRadius: BorderRadius.default,
                paddingVertical: Spacing.md,
                alignItems: "center",
                ...Shadows.card,
              }}
              accessibilityRole="button"
              accessibilityLabel="Save built-in"
              accessibilityHint="Save all changes to this built-in"
            >
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.white }}>
                Save Built-In
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
