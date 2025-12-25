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
import { SavePromptModal } from "../components/SavePromptModal";
import { formatCurrency } from "../utils/calculations";

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
  const testMode = useAppSettings((s) => s.testMode);

  const [name, setName] = useState(!isNewBuiltIn && builtIn?.name ? builtIn.name : "");
  const [width, setWidth] = useState(!isNewBuiltIn && builtIn?.width && builtIn.width > 0 ? builtIn.width.toString() : "");
  const [height, setHeight] = useState(!isNewBuiltIn && builtIn?.height && builtIn.height > 0 ? builtIn.height.toString() : "");
  const [depth, setDepth] = useState(!isNewBuiltIn && builtIn?.depth && builtIn.depth > 0 ? builtIn.depth.toString() : "");
  const [shelfCount, setShelfCount] = useState(!isNewBuiltIn && builtIn?.shelfCount && builtIn.shelfCount > 0 ? builtIn.shelfCount.toString() : "");
  const [notes, setNotes] = useState(!isNewBuiltIn && builtIn?.notes ? builtIn.notes : "");

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);

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

  // Prevent navigation when there are unsaved changes
  usePreventRemove(hasUnsavedChanges, ({ data }) => {
    setShowSavePrompt(true);
  });

  const handleSave = () => {
    const hasAnyData = name !== "" || width !== "" || height !== "" || depth !== "" || shelfCount !== "";

    if (!hasAnyData) {
      Alert.alert("No Data Entered", "Please enter a name and at least one measurement before saving.");
      return;
    }

    setHasUnsavedChanges(false);

    if (isNewBuiltIn) {
      // CREATE new built-in with data
      const newBuiltInId = addBuiltIn(projectId);

      // Then immediately update it with the entered data
      updateBuiltIn(projectId, newBuiltInId, {
        name: name.trim(),
        width: parseFloat(width) || 0,
        height: parseFloat(height) || 0,
        depth: parseFloat(depth) || 0,
        shelfCount: parseInt(shelfCount) || 0,
        coats: 1,
        notes: notes.trim() || undefined,
      });
    } else {
      // UPDATE existing built-in
      updateBuiltIn(projectId, builtInId!, {
        name: name.trim(),
        width: parseFloat(width) || 0,
        height: parseFloat(height) || 0,
        depth: parseFloat(depth) || 0,
        shelfCount: parseInt(shelfCount) || 0,
        coats: builtIn?.coats || 1,
        notes: notes.trim() || undefined,
      });
    }

    navigation.goBack();
  };

  const handleDiscardAndLeave = () => {
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
              <Text style={{ fontSize: Typography.caption.fontSize, fontWeight: "500", color: Colors.mediumGray, marginBottom: Spacing.sm }}>
                Built-In Name
              </Text>
              <View style={TextInputStyles.container}>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g., Library Bookshelf"
                  placeholderTextColor={Colors.mediumGray}
                  returnKeyType="done"
                  selectTextOnFocus={false}
                  style={TextInputStyles.base}
                />
              </View>
            </View>

            <View style={{ marginBottom: Spacing.md }}>
              <Text style={{ fontSize: Typography.caption.fontSize, fontWeight: "500", color: Colors.mediumGray, marginBottom: Spacing.sm }}>
                Width (inches)
              </Text>
              <View style={TextInputStyles.container}>
                <TextInput
                  value={width}
                  onChangeText={setWidth}
                  keyboardType="decimal-pad"
                  placeholder="36"
                  placeholderTextColor={Colors.mediumGray}
                  returnKeyType="done"
                  style={TextInputStyles.base}
                />
              </View>
            </View>

            <View style={{ marginBottom: Spacing.md }}>
              <Text style={{ fontSize: Typography.caption.fontSize, fontWeight: "500", color: Colors.mediumGray, marginBottom: Spacing.sm }}>
                Height (inches)
              </Text>
              <View style={TextInputStyles.container}>
                <TextInput
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="decimal-pad"
                  placeholder="80"
                  placeholderTextColor={Colors.mediumGray}
                  returnKeyType="done"
                  style={TextInputStyles.base}
                />
              </View>
            </View>

            <View style={{ marginBottom: Spacing.md }}>
              <Text style={{ fontSize: Typography.caption.fontSize, fontWeight: "500", color: Colors.mediumGray, marginBottom: Spacing.sm }}>
                Depth (inches)
              </Text>
              <View style={TextInputStyles.container}>
                <TextInput
                  value={depth}
                  onChangeText={setDepth}
                  keyboardType="decimal-pad"
                  placeholder="12"
                  placeholderTextColor={Colors.mediumGray}
                  returnKeyType="done"
                  style={TextInputStyles.base}
                />
              </View>
            </View>

            <View style={{ marginBottom: Spacing.md }}>
              <Text style={{ fontSize: Typography.caption.fontSize, fontWeight: "500", color: Colors.mediumGray, marginBottom: Spacing.sm }}>
                Number of Shelves
              </Text>
              <View style={TextInputStyles.container}>
                <TextInput
                  value={shelfCount}
                  onChangeText={setShelfCount}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={Colors.mediumGray}
                  returnKeyType="done"
                  style={TextInputStyles.base}
                />
              </View>
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
                      {(2 * widthVal * heightVal).toFixed(1)} sq ft
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>Left/Right sides:</Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.darkCharcoal }}>
                      {(2 * heightVal * depthVal).toFixed(1)} sq ft
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>Top/Bottom:</Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.darkCharcoal }}>
                      {(2 * widthVal * depthVal).toFixed(1)} sq ft
                    </Text>
                  </View>
                  {shelfCount && parseInt(shelfCount) > 0 && (
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                        {shelfCount} shelves:
                      </Text>
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.darkCharcoal }}>
                        {(parseInt(shelfCount) * widthVal).toFixed(1)} sq ft
                      </Text>
                    </View>
                  )}
                  <View style={{ borderTopWidth: 1, borderTopColor: Colors.neutralGray, marginTop: Spacing.sm, paddingTop: Spacing.sm }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ fontSize: Typography.caption.fontSize, fontWeight: "700", color: Colors.darkCharcoal }}>
                        Total Paintable Area:
                      </Text>
                      <Text style={{ fontSize: Typography.caption.fontSize, fontWeight: "700", color: Colors.darkCharcoal }}>
                        {totalPaintableArea.toFixed(1)} sq ft
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
