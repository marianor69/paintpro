import React, { useState, useEffect } from "react";
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
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { usePreventRemove } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/RootNavigator";
import { useProjectStore } from "../state/projectStore";
import { usePricingStore } from "../state/pricingStore";
import { useAppSettings } from "../state/appSettings";
import {
  calculateFireplaceMetrics,
  formatCurrency,
} from "../utils/calculations";

type Props = NativeStackScreenProps<RootStackParamList, "FireplaceEditor">;

export default function FireplaceEditorScreen({ route, navigation }: Props) {
  const { projectId, fireplaceId } = route.params;

  const project = useProjectStore((s) =>
    s.projects.find((p) => p.id === projectId)
  );
  const fireplace = project?.fireplaces.find((f) => f.id === fireplaceId);
  const updateFireplace = useProjectStore((s) => s.updateFireplace);
  const pricing = usePricingStore();
  const testMode = useAppSettings((s) => s.testMode);

  const [width, setWidth] = useState(fireplace?.width && fireplace.width > 0 ? fireplace.width.toString() : "");
  const [height, setHeight] = useState(fireplace?.height && fireplace.height > 0 ? fireplace.height.toString() : "");
  const [depth, setDepth] = useState(fireplace?.depth && fireplace.depth > 0 ? fireplace.depth.toString() : "");
  const [hasTrim, setHasTrim] = useState(fireplace?.hasTrim || false);
  const [trimLinearFeet, setTrimLinearFeet] = useState(
    fireplace?.trimLinearFeet && fireplace.trimLinearFeet > 0 ? fireplace.trimLinearFeet.toString() : ""
  );

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [isSaved, setIsSaved] = useState(false); // Track if item was explicitly saved

  // Cleanup on unmount - delete if never saved and no data entered
  useEffect(() => {
    return () => {
      if (!isSaved && fireplace) {
        const hasAnyData =
          (fireplace.width && fireplace.width > 0) ||
          (fireplace.height && fireplace.height > 0) ||
          (fireplace.depth && fireplace.depth > 0) ||
          (fireplace.hasTrim && fireplace.trimLinearFeet && fireplace.trimLinearFeet > 0);

        if (!hasAnyData) {
          const deleteFireplaceFn = useProjectStore.getState().deleteFireplace;
          deleteFireplaceFn(projectId, fireplaceId!);
        }
      }
    };
  }, [isSaved, projectId, fireplaceId, fireplace]);

  // Track unsaved changes
  useEffect(() => {
    if (!fireplace) return;

    const hasChanges =
      width !== (fireplace.width && fireplace.width > 0 ? fireplace.width.toString() : "") ||
      height !== (fireplace.height && fireplace.height > 0 ? fireplace.height.toString() : "") ||
      depth !== (fireplace.depth && fireplace.depth > 0 ? fireplace.depth.toString() : "") ||
      hasTrim !== (fireplace.hasTrim ?? false) ||
      trimLinearFeet !== (fireplace.trimLinearFeet && fireplace.trimLinearFeet > 0 ? fireplace.trimLinearFeet.toString() : "");

    setHasUnsavedChanges(hasChanges);
  }, [
    fireplace,
    width,
    height,
    depth,
    hasTrim,
    trimLinearFeet,
  ]);

  // Prevent navigation when there are unsaved changes
  usePreventRemove(hasUnsavedChanges, ({ data }) => {
    setShowSavePrompt(true);
  });

  const handleSave = () => {
    // Validate that at least some data has been entered
    const hasAnyData =
      width !== "" ||
      height !== "" ||
      depth !== "" ||
      (hasTrim && trimLinearFeet !== "");

    if (!hasAnyData) {
      Alert.alert("No Data Entered", "Please enter at least one measurement before saving.");
      return;
    }

    // Save to store FIRST before any state changes
    updateFireplace(projectId, fireplaceId!, {
      width: parseFloat(width) || 0,
      height: parseFloat(height) || 0,
      depth: parseFloat(depth) || 0,
      hasTrim,
      trimLinearFeet: parseFloat(trimLinearFeet) || 0,
      coats: fireplace?.coats || 2, // Preserve existing coats setting
    });

    // Mark as saved AFTER the store update to prevent cleanup effect from deleting
    setIsSaved(true);
    // Disable unsaved changes tracking to prevent modal from showing
    setHasUnsavedChanges(false);

    // Navigate back immediately - state is already marked as saved
    navigation.goBack();
  };

  const handleDiscardAndLeave = () => {
    // If no data was ever entered, delete the fireplace
    const hasAnyData =
      width !== "" ||
      height !== "" ||
      depth !== "" ||
      (hasTrim && trimLinearFeet !== "");

    // Mark as saved FIRST to prevent cleanup from running
    setIsSaved(true);
    setHasUnsavedChanges(false);
    setShowSavePrompt(false);

    if (!hasAnyData && fireplace) {
      const deleteFireplaceFn = useProjectStore.getState().deleteFireplace;
      deleteFireplaceFn(projectId, fireplaceId!);
    }

    navigation.goBack();
  };

  const handleSaveAndLeave = () => {
    setShowSavePrompt(false);
    handleSave();
  };

  const handleCancelExit = () => {
    setShowSavePrompt(false);
  };

  const calculations = fireplace
    ? calculateFireplaceMetrics(
        {
          ...fireplace,
          width: parseFloat(width) || 0,
          height: parseFloat(height) || 0,
          depth: parseFloat(depth) || 0,
          hasTrim,
          trimLinearFeet: parseFloat(trimLinearFeet) || 0,
        },
        pricing
      )
    : null;

  // If fireplace not found BUT we just saved, don't show error (we're navigating away)
  if (!fireplace && !isSaved) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-lg text-gray-600">Fireplace not found</Text>
      </View>
    );
  }

  // If we saved and fireplace is gone, just return null while navigating
  if (!fireplace) {
    return null;
  }

  return (
    <KeyboardAvoidingView
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      className="flex-1 bg-gray-50"
    >
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* Page Name Indicator - only in test mode */}
        {testMode && (
          <View className="bg-gray-100 px-6 py-2">
            <Text className="text-xs font-bold" style={{ color: '#DC2626' }}>
              PAGE: FireplaceEditorScreen
            </Text>
          </View>
        )}

        <View className="p-6">
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Width (ft)
            </Text>
            <TextInput
              value={width}
              onChangeText={setWidth}
              keyboardType="decimal-pad"
              returnKeyType="done"
              onSubmitEditing={() => {}}
              className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Height (ft)
            </Text>
            <TextInput
              value={height}
              onChangeText={setHeight}
              keyboardType="decimal-pad"
              returnKeyType="done"
              onSubmitEditing={() => {}}
              className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Depth (ft)
            </Text>
            <TextInput
              value={depth}
              onChangeText={setDepth}
              keyboardType="decimal-pad"
              returnKeyType="done"
              onSubmitEditing={() => {}}
              className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base"
            />
          </View>

          <Pressable
            onPress={() => setHasTrim(!hasTrim)}
            className="flex-row items-center justify-between bg-white border border-gray-300 rounded-xl px-4 py-3 mb-4"
          >
            <Text className="text-base text-gray-700">Has Trim</Text>
            <View
              className={`w-12 h-7 rounded-full ${
                hasTrim ? "bg-blue-600" : "bg-gray-300"
              }`}
            >
              <View
                className={`w-5 h-5 rounded-full bg-white mt-1 ${
                  hasTrim ? "ml-6" : "ml-1"
                }`}
              />
            </View>
          </Pressable>

          {hasTrim && (
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Trim Linear Feet
              </Text>
              <TextInput
                value={trimLinearFeet}
                onChangeText={setTrimLinearFeet}
                keyboardType="decimal-pad"
                returnKeyType="done"
                onSubmitEditing={() => {}}
                className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base"
              />
            </View>
          )}

          {/* Calculations Preview */}
          {calculations && (
            <View className="bg-white rounded-xl p-4 border border-gray-200 mb-4">
              <Text className="text-lg font-bold text-gray-900 mb-3">
                Estimate Preview
              </Text>

              {/* Paintable Area Breakdown */}
              <View className="bg-gray-50 rounded-lg p-3 mb-3">
                <Text className="text-xs font-semibold text-gray-700 mb-2">
                  PAINTABLE AREA CALCULATION:
                </Text>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-xs text-gray-600">Front/Back faces:</Text>
                  <Text className="text-xs text-gray-900">
                    2 × ({width} ft × {height} ft) = {(2 * parseFloat(width) * parseFloat(height)).toFixed(1)} sq ft
                  </Text>
                </View>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-xs text-gray-600">Top surface:</Text>
                  <Text className="text-xs text-gray-900">
                    {width} ft × {depth} ft = {(parseFloat(width) * parseFloat(depth)).toFixed(1)} sq ft
                  </Text>
                </View>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-xs text-gray-600">Side surface:</Text>
                  <Text className="text-xs text-gray-900">
                    {height} ft × {depth} ft = {(parseFloat(height) * parseFloat(depth)).toFixed(1)} sq ft
                  </Text>
                </View>
                {hasTrim && parseFloat(trimLinearFeet) > 0 && (
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-xs text-gray-600">Trim area:</Text>
                    <Text className="text-xs text-gray-900">
                      {trimLinearFeet} ft × 0.5 ft = {(parseFloat(trimLinearFeet) * 0.5).toFixed(1)} sq ft
                    </Text>
                  </View>
                )}
                <View className="border-t border-gray-300 mt-2 pt-2">
                  <View className="flex-row justify-between">
                    <Text className="text-xs font-bold text-gray-800">Total Paintable Area:</Text>
                    <Text className="text-xs font-bold text-gray-900">
                      {calculations.paintableArea.toFixed(1)} sq ft
                    </Text>
                  </View>
                </View>
              </View>

              {/* Labor Cost */}
              <View className="bg-gray-50 rounded-lg p-3 mb-3">
                <Text className="text-xs font-semibold text-gray-700 mb-2">
                  LABOR COST CALCULATION:
                </Text>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-xs text-gray-600">Fireplace labor:</Text>
                  <Text className="text-xs text-gray-900">
                    Fixed rate = ${pricing.fireplaceLabor.toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* Material Cost */}
              <View className="bg-gray-50 rounded-lg p-3 mb-3">
                <Text className="text-xs font-semibold text-gray-700 mb-2">
                  MATERIAL COST CALCULATION:
                </Text>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-xs text-gray-600">Paint needed:</Text>
                  <Text className="text-xs text-gray-900">
                    {calculations.paintableArea.toFixed(1)} sq ft ÷ {pricing.wallCoverageSqFtPerGallon} × {fireplace.coats} coats = {calculations.totalGallons.toFixed(2)} gal
                  </Text>
                </View>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-xs text-gray-600">Paint cost:</Text>
                  <Text className="text-xs text-gray-900">
                    {Math.ceil(calculations.totalGallons)} gal × ${pricing.wallPaintPerGallon}/gal = ${calculations.materialCost.toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* Total Price */}
              <View className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <View className="flex-row justify-between mb-1">
                  <Text className="text-sm text-gray-600">Labor Cost:</Text>
                  <Text className="text-sm text-gray-900">${calculations.laborCost.toFixed(2)}</Text>
                </View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-sm text-gray-600">Material Cost:</Text>
                  <Text className="text-sm text-gray-900">${calculations.materialCost.toFixed(2)}</Text>
                </View>
                <View className="border-t border-blue-300 pt-2">
                  <View className="flex-row justify-between">
                    <Text className="text-base font-bold text-gray-900">Total Price:</Text>
                    <Text className="text-base font-bold text-blue-600">
                      {formatCurrency(calculations.totalPrice)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          <Pressable
            onPress={handleSave}
            className="bg-blue-600 rounded-xl py-4 items-center active:bg-blue-700"
          >
            <Text className="text-white text-lg font-semibold">
              Save Fireplace
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Save Confirmation Modal */}
      {showSavePrompt && (
        <View className="absolute top-0 left-0 right-0 bottom-0 bg-black/50 items-center justify-center">
          <View className="bg-white rounded-2xl mx-6 p-6 w-full max-w-sm">
            <Text className="text-2xl font-bold text-gray-900 mb-2">
              Save Changes?
            </Text>
            <Text className="text-xl text-gray-600 mb-6">
              You have unsaved changes. Do you want to save them before leaving?
            </Text>

            <View className="gap-3">
              <Pressable
                onPress={handleSaveAndLeave}
                className="bg-blue-600 rounded-xl py-4 items-center active:bg-blue-700"
              >
                <Text className="text-white text-xl font-semibold">
                  Save Changes
                </Text>
              </Pressable>

              <Pressable
                onPress={handleDiscardAndLeave}
                className="bg-red-600 rounded-xl py-4 items-center active:bg-red-700"
              >
                <Text className="text-white text-xl font-semibold">
                  Discard Changes
                </Text>
              </Pressable>

              <Pressable
                onPress={handleCancelExit}
                className="bg-gray-200 rounded-xl py-4 items-center active:bg-gray-300"
              >
                <Text className="text-gray-900 text-xl font-semibold">
                  Cancel
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
