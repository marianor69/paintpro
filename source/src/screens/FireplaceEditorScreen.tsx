import React, { useState, useEffect, useRef } from "react";
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
import { SavePromptModal } from "../components/SavePromptModal";
import {
  calculateFireplaceMetrics,
  formatCurrency,
} from "../utils/calculations";

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
  const testMode = useAppSettings((s) => s.testMode);

  const [width, setWidth] = useState(!isNewFireplace && fireplace?.width && fireplace.width > 0 ? fireplace.width.toString() : "");
  const [height, setHeight] = useState(!isNewFireplace && fireplace?.height && fireplace.height > 0 ? fireplace.height.toString() : "");
  const [depth, setDepth] = useState(!isNewFireplace && fireplace?.depth && fireplace.depth > 0 ? fireplace.depth.toString() : "");
  const [hasTrim, setHasTrim] = useState(!isNewFireplace && fireplace?.hasTrim ? true : false);
  const [trimLinearFeet, setTrimLinearFeet] = useState(
    !isNewFireplace && fireplace?.trimLinearFeet && fireplace.trimLinearFeet > 0 ? fireplace.trimLinearFeet.toString() : ""
  );
  const [notes, setNotes] = useState(!isNewFireplace && fireplace?.notes ? fireplace.notes : "");

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // Prevent double-save and navigation modal

  // Track unsaved changes
  useEffect(() => {
    if (isNewFireplace) {
      // For new fireplace: changes are when user enters any data
      const hasChanges =
        width !== "" ||
        height !== "" ||
        depth !== "" ||
        (hasTrim && trimLinearFeet !== "");
      setHasUnsavedChanges(hasChanges);
    } else {
      // For existing: changes are when values differ from stored data
      if (!fireplace) return;

      const hasChanges =
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
    width,
    height,
    depth,
    hasTrim,
    trimLinearFeet,
    notes,
  ]);

  // Prevent navigation when there are unsaved changes (but not while saving)
  usePreventRemove(hasUnsavedChanges && !isSaving, ({ data }) => {
    if (!isSaving) {
      setShowSavePrompt(true);
      Keyboard.dismiss(); // Hide keyboard when modal appears
    }
  });

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

    // IMMEDIATELY disable unsaved changes to prevent modal
    setHasUnsavedChanges(false);
    setShowSavePrompt(false);
    setIsSaving(true);
    Keyboard.dismiss();

    if (isNewFireplace) {
      // CREATE new fireplace with data
      const newFireplaceId = addFireplace(projectId);

      // Then immediately update it with the entered data
      updateFireplace(projectId, newFireplaceId, {
        width: parseFloat(width) || 0,
        height: parseFloat(height) || 0,
        depth: parseFloat(depth) || 0,
        hasTrim,
        trimLinearFeet: parseFloat(trimLinearFeet) || 0,
        coats: 2,
        notes: notes.trim() || undefined,
      });
    } else {
      // UPDATE existing fireplace
      updateFireplace(projectId, fireplaceId!, {
        width: parseFloat(width) || 0,
        height: parseFloat(height) || 0,
        depth: parseFloat(depth) || 0,
        hasTrim,
        trimLinearFeet: parseFloat(trimLinearFeet) || 0,
        coats: fireplace?.coats || 2,
        notes: notes.trim() || undefined,
      });
    }

    navigation.goBack();
  };

  const handleDiscardAndLeave = () => {
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
      ? calculateFireplaceMetrics(
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
      : calculateFireplaceMetrics(
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
              <Text style={{ fontSize: Typography.caption.fontSize, fontWeight: "500", color: Colors.mediumGray, marginBottom: Spacing.sm }}>
                Width (ft)
              </Text>
              <View style={TextInputStyles.container}>
                <TextInput
                  value={width}
                  onChangeText={setWidth}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={Colors.mediumGray}
                  returnKeyType="done"
                  style={TextInputStyles.base}
                />
              </View>
            </View>

            <View style={{ marginBottom: Spacing.md }}>
              <Text style={{ fontSize: Typography.caption.fontSize, fontWeight: "500", color: Colors.mediumGray, marginBottom: Spacing.sm }}>
                Height (ft)
              </Text>
              <View style={TextInputStyles.container}>
                <TextInput
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={Colors.mediumGray}
                  returnKeyType="done"
                  style={TextInputStyles.base}
                />
              </View>
            </View>

            <View style={{ marginBottom: Spacing.md }}>
              <Text style={{ fontSize: Typography.caption.fontSize, fontWeight: "500", color: Colors.mediumGray, marginBottom: Spacing.sm }}>
                Depth (ft)
              </Text>
              <View style={TextInputStyles.container}>
                <TextInput
                  value={depth}
                  onChangeText={setDepth}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={Colors.mediumGray}
                  returnKeyType="done"
                  style={TextInputStyles.base}
                />
              </View>
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
                <Text style={{ fontSize: Typography.caption.fontSize, fontWeight: "500", color: Colors.mediumGray, marginBottom: Spacing.sm }}>
                  Trim Linear Feet
                </Text>
                <View style={TextInputStyles.container}>
                  <TextInput
                    value={trimLinearFeet}
                    onChangeText={setTrimLinearFeet}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={Colors.mediumGray}
                    returnKeyType="done"
                    style={TextInputStyles.base}
                  />
                </View>
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
                      2 × ({width} ft × {height} ft) = {(2 * parseFloat(width) * parseFloat(height)).toFixed(1)} sq ft
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>Top surface:</Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.darkCharcoal }}>
                      {width} ft × {depth} ft = {(parseFloat(width) * parseFloat(depth)).toFixed(1)} sq ft
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>Side surface:</Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.darkCharcoal }}>
                      {height} ft × {depth} ft = {(parseFloat(height) * parseFloat(depth)).toFixed(1)} sq ft
                    </Text>
                  </View>
                  {hasTrim && parseFloat(trimLinearFeet) > 0 && (
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>Trim area:</Text>
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.darkCharcoal }}>
                        {trimLinearFeet} ft × 0.5 ft = {(parseFloat(trimLinearFeet) * 0.5).toFixed(1)} sq ft
                      </Text>
                    </View>
                  )}
                  <View style={{ borderTopWidth: 1, borderTopColor: Colors.neutralGray, marginTop: Spacing.sm, paddingTop: Spacing.sm }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ fontSize: Typography.caption.fontSize, fontWeight: "700", color: Colors.darkCharcoal }}>Total Paintable Area:</Text>
                      <Text style={{ fontSize: Typography.caption.fontSize, fontWeight: "700", color: Colors.darkCharcoal }}>
                        {calculations.paintableArea.toFixed(1)} sq ft
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
                      {Math.ceil(calculations.totalGallons)} gal × ${pricing.wallPaintPerGallon}/gal = ${calculations.materialCost.toFixed(2)}
                    </Text>
                  </View>
                </View>

                {/* Total Price */}
                <View style={{ backgroundColor: Colors.primaryBlueLight, borderWidth: 1, borderColor: Colors.primaryBlue, borderRadius: BorderRadius.default, padding: Spacing.sm }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>Labor Cost:</Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.darkCharcoal }}>${calculations.laborCost.toFixed(2)}</Text>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.sm }}>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>Material Cost:</Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.darkCharcoal }}>${calculations.materialCost.toFixed(2)}</Text>
                  </View>
                  <View style={{ borderTopWidth: 1, borderTopColor: Colors.primaryBlue, paddingTop: Spacing.sm }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "700", color: Colors.darkCharcoal }}>Total Price:</Text>
                      <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "700", color: Colors.primaryBlue }}>
                        {formatCurrency(calculations.totalPrice)}
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
