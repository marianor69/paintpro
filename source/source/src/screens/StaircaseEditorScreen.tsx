import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Alert,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { usePreventRemove } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/RootNavigator";
import { useProjectStore } from "../state/projectStore";
import { usePricingStore } from "../state/pricingStore";
import { useAppSettings } from "../state/appSettings";
import {
  calculateStaircaseMetrics,
  formatCurrency,
} from "../utils/calculations";

type Props = NativeStackScreenProps<RootStackParamList, "StaircaseEditor">;

export default function StaircaseEditorScreen({ route, navigation }: Props) {
  const { projectId, staircaseId } = route.params;

  const project = useProjectStore((s) =>
    s.projects.find((p) => p.id === projectId)
  );
  const staircase = project?.staircases.find((s) => s.id === staircaseId);
  const updateStaircase = useProjectStore((s) => s.updateStaircase);
  const pricing = usePricingStore();
  const testMode = useAppSettings((s) => s.testMode);

  const [riserCount, setRiserCount] = useState(
    staircase?.riserCount && staircase.riserCount > 0 ? staircase.riserCount.toString() : ""
  );
  const [handrailLength, setHandrailLength] = useState(
    staircase?.handrailLength && staircase.handrailLength > 0 ? staircase.handrailLength.toString() : ""
  );
  const [spindleCount, setSpindleCount] = useState(
    staircase?.spindleCount && staircase.spindleCount > 0 ? staircase.spindleCount.toString() : ""
  );
  const [hasSecondaryStairwell, setHasSecondaryStairwell] = useState(
    staircase?.hasSecondaryStairwell || false
  );
  const [tallWallHeight, setTallWallHeight] = useState(
    staircase?.tallWallHeight && staircase.tallWallHeight > 0 ? staircase.tallWallHeight.toString() : ""
  );
  const [shortWallHeight, setShortWallHeight] = useState(
    staircase?.shortWallHeight && staircase.shortWallHeight > 0 ? staircase.shortWallHeight.toString() : ""
  );
  const [doubleSidedWalls, setDoubleSidedWalls] = useState(
    staircase?.doubleSidedWalls || false
  );

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [isSaved, setIsSaved] = useState(false); // Track if item was explicitly saved

  // Cleanup on unmount - delete if never saved and no data entered
  useEffect(() => {
    return () => {
      if (!isSaved && staircase) {
        const hasAnyData =
          (staircase.riserCount && staircase.riserCount > 0) ||
          (staircase.handrailLength && staircase.handrailLength > 0) ||
          (staircase.spindleCount && staircase.spindleCount > 0) ||
          (staircase.hasSecondaryStairwell &&
            ((staircase.tallWallHeight && staircase.tallWallHeight > 0) ||
             (staircase.shortWallHeight && staircase.shortWallHeight > 0)));

        if (!hasAnyData) {
          const deleteStaircaseFn = useProjectStore.getState().deleteStaircase;
          deleteStaircaseFn(projectId, staircaseId!);
        }
      }
    };
  }, [isSaved, projectId, staircaseId, staircase]);

  // Track unsaved changes
  useEffect(() => {
    if (!staircase) return;

    const hasChanges =
      riserCount !== (staircase.riserCount && staircase.riserCount > 0 ? staircase.riserCount.toString() : "") ||
      handrailLength !== (staircase.handrailLength && staircase.handrailLength > 0 ? staircase.handrailLength.toString() : "") ||
      spindleCount !== (staircase.spindleCount && staircase.spindleCount > 0 ? staircase.spindleCount.toString() : "") ||
      hasSecondaryStairwell !== (staircase.hasSecondaryStairwell ?? false) ||
      tallWallHeight !== (staircase.tallWallHeight && staircase.tallWallHeight > 0 ? staircase.tallWallHeight.toString() : "") ||
      shortWallHeight !== (staircase.shortWallHeight && staircase.shortWallHeight > 0 ? staircase.shortWallHeight.toString() : "") ||
      doubleSidedWalls !== (staircase.doubleSidedWalls ?? false);

    setHasUnsavedChanges(hasChanges);
  }, [
    staircase,
    riserCount,
    handrailLength,
    spindleCount,
    hasSecondaryStairwell,
    tallWallHeight,
    shortWallHeight,
    doubleSidedWalls,
  ]);

  // Prevent navigation when there are unsaved changes
  usePreventRemove(hasUnsavedChanges, ({ data }) => {
    setShowSavePrompt(true);
  });

  const handleSave = () => {
    // Validate that at least some data has been entered
    const hasAnyData =
      riserCount !== "" ||
      handrailLength !== "" ||
      spindleCount !== "" ||
      (hasSecondaryStairwell && (tallWallHeight !== "" || shortWallHeight !== ""));

    if (!hasAnyData) {
      Alert.alert("No Data Entered", "Please enter at least one measurement before saving.");
      return;
    }

    // Mark as saved FIRST to prevent cleanup effect from running
    setIsSaved(true);
    setHasUnsavedChanges(false);

    // Save to store
    updateStaircase(projectId, staircaseId!, {
      riserCount: parseInt(riserCount) || 0,
      riserHeight: 7.5, // Standard riser height
      treadDepth: 0, // Not used
      handrailLength: parseFloat(handrailLength) || 0,
      spindleCount: parseInt(spindleCount) || 0,
      coats: staircase?.coats || 2, // Preserve existing coats setting
      hasSecondaryStairwell,
      tallWallHeight: parseFloat(tallWallHeight) || 0,
      shortWallHeight: parseFloat(shortWallHeight) || 0,
      doubleSidedWalls,
    });

    // Add small delay to ensure state has propagated before navigation
    setTimeout(() => {
      navigation.goBack();
    }, 100);
  };

  const handleDiscardAndLeave = () => {
    // If no data was ever entered, delete the staircase
    const hasAnyData =
      riserCount !== "" ||
      handrailLength !== "" ||
      spindleCount !== "" ||
      (hasSecondaryStairwell && (tallWallHeight !== "" || shortWallHeight !== ""));

    // Mark as saved FIRST to prevent cleanup from running
    setIsSaved(true);
    setHasUnsavedChanges(false);
    setShowSavePrompt(false);

    if (!hasAnyData && staircase) {
      const deleteStaircaseFn = useProjectStore.getState().deleteStaircase;
      deleteStaircaseFn(projectId, staircaseId!);
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

  const calculations = staircase
    ? calculateStaircaseMetrics(
        {
          ...staircase,
          riserCount: parseInt(riserCount) || 14,
          riserHeight: 7.5, // Standard riser height
          treadDepth: 0, // Not used
          handrailLength: parseFloat(handrailLength) || 0,
          spindleCount: parseInt(spindleCount) || 0,
          hasSecondaryStairwell,
          tallWallHeight: parseFloat(tallWallHeight) || 0,
          shortWallHeight: parseFloat(shortWallHeight) || 0,
          doubleSidedWalls,
        },
        pricing
      )
    : null;

  // Only show preview if at least riser count is entered
  const hasDataEntered = riserCount !== "" || handrailLength !== "" || spindleCount !== "" ||
    (hasSecondaryStairwell && (tallWallHeight !== "" || shortWallHeight !== ""));

  // If staircase not found BUT we just saved, don't show error (we're navigating away)
  if (!staircase && !isSaved) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-lg text-gray-600">Staircase not found</Text>
      </View>
    );
  }

  // If we saved and staircase is gone, just return null while navigating
  if (!staircase) {
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
              PAGE: StaircaseEditorScreen
            </Text>
          </View>
        )}

        <View className="p-6">
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Number of Risers
            </Text>
            <TextInput
              value={riserCount}
              onChangeText={setRiserCount}
              keyboardType="number-pad"
              returnKeyType="done"
              onSubmitEditing={() => {}}
              className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base"
            />
            <Text className="text-xs text-gray-500 mt-1">
              Standard riser height of 7.5 inches assumed
            </Text>
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Handrail Length (ft)
            </Text>
            <TextInput
              value={handrailLength}
              onChangeText={setHandrailLength}
              keyboardType="decimal-pad"
              returnKeyType="done"
              onSubmitEditing={() => {}}
              className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Number of Spindles
            </Text>
            <TextInput
              value={spindleCount}
              onChangeText={setSpindleCount}
              keyboardType="number-pad"
              returnKeyType="done"
              onSubmitEditing={() => {}}
              className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base"
            />
          </View>

          {/* Secondary Stairwell Section */}
          <View className="mb-4 bg-white rounded-xl p-4 border border-gray-300">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-base font-semibold text-gray-900">
                Has Secondary Stairwell
              </Text>
              <Switch
                value={hasSecondaryStairwell}
                onValueChange={setHasSecondaryStairwell}
                trackColor={{ false: "#D1D5DB", true: "#3B82F6" }}
                thumbColor="#FFFFFF"
              />
            </View>

            {hasSecondaryStairwell && (
              <>
                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Tall Wall Height (ft)
                  </Text>
                  <TextInput
                    value={tallWallHeight}
                    onChangeText={setTallWallHeight}
                    keyboardType="decimal-pad"
                    returnKeyType="done"
                    onSubmitEditing={() => {}}
                    className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-base"
                  />
                </View>

                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Short Wall Height (ft)
                  </Text>
                  <TextInput
                    value={shortWallHeight}
                    onChangeText={setShortWallHeight}
                    keyboardType="decimal-pad"
                    returnKeyType="done"
                    onSubmitEditing={() => {}}
                    className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-base"
                  />
                </View>

                <View className="flex-row justify-between items-center">
                  <Text className="text-sm font-medium text-gray-700">
                    Double-Sided Stair Walls?
                  </Text>
                  <Switch
                    value={doubleSidedWalls}
                    onValueChange={setDoubleSidedWalls}
                    trackColor={{ false: "#D1D5DB", true: "#3B82F6" }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </>
            )}
          </View>

          {/* Calculations Preview */}
          {calculations && hasDataEntered && (
            <View className="bg-white rounded-xl p-4 border border-gray-200 mb-4">
              <Text className="text-lg font-bold text-gray-900 mb-3">
                Estimate Preview
              </Text>

              {/* Paintable Area Breakdown */}
              <View className="bg-gray-50 rounded-lg p-3 mb-3">
                <Text className="text-xs font-semibold text-gray-700 mb-2">
                  PAINTABLE AREA CALCULATION:
                </Text>

                {/* Original staircase area */}
                {parseFloat(riserCount) > 0 && (
                  <>
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-xs text-gray-600">Riser Area:</Text>
                      <Text className="text-xs text-gray-900">
                        {parseFloat(riserCount)} risers × 7.5&quot; height × 3 ft width = {(parseFloat(riserCount) * (7.5/12) * 3).toFixed(0)} sq ft
                      </Text>
                    </View>
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-xs text-gray-600">Tread Area:</Text>
                      <Text className="text-xs text-gray-900">0 sq ft (not used)</Text>
                    </View>
                  </>
                )}

                {/* Secondary stairwell area */}
                {hasSecondaryStairwell && parseFloat(tallWallHeight) > 0 && parseFloat(shortWallHeight) > 0 && (
                  <>
                    <View className="border-t border-gray-300 mt-2 pt-2">
                      <Text className="text-xs font-semibold text-gray-700 mb-1">Secondary Stairwell:</Text>
                      <View className="flex-row justify-between mb-1">
                        <Text className="text-xs text-gray-600">Wall Area:</Text>
                        <Text className="text-xs text-gray-900">
                          ({tallWallHeight} + {shortWallHeight}) ÷ 2 × 12 ft{doubleSidedWalls ? " × 2" : ""} = {(((parseFloat(tallWallHeight) + parseFloat(shortWallHeight)) / 2) * 12 * (doubleSidedWalls ? 2 : 1)).toFixed(0)} sq ft
                        </Text>
                      </View>
                      <View className="flex-row justify-between mb-1">
                        <Text className="text-xs text-gray-600">Ceiling Area:</Text>
                        <Text className="text-xs text-gray-900">15 ft × 3.5 ft = {(15 * 3.5).toFixed(0)} sq ft</Text>
                      </View>
                    </View>
                  </>
                )}

                <View className="border-t border-gray-300 mt-2 pt-2">
                  <View className="flex-row justify-between">
                    <Text className="text-xs font-bold text-gray-800">Total Paintable Area:</Text>
                    <Text className="text-xs font-bold text-gray-900">
                      {calculations.paintableArea.toFixed(0)} sq ft
                    </Text>
                  </View>
                </View>
              </View>

              {/* Labor Cost Breakdown */}
              <View className="bg-gray-50 rounded-lg p-3 mb-3">
                <Text className="text-xs font-semibold text-gray-700 mb-2">
                  LABOR COST CALCULATION:
                </Text>
                {parseFloat(riserCount) > 0 && (
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-xs text-gray-600">Risers:</Text>
                    <Text className="text-xs text-gray-900">
                      {parseFloat(riserCount)} × ${pricing.riserLabor} = ${(parseFloat(riserCount) * pricing.riserLabor).toFixed(2)}
                    </Text>
                  </View>
                )}
                {parseFloat(spindleCount) > 0 && (
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-xs text-gray-600">Spindles:</Text>
                    <Text className="text-xs text-gray-900">
                      {parseFloat(spindleCount)} × ${pricing.spindleLabor} = ${(parseFloat(spindleCount) * pricing.spindleLabor).toFixed(2)}
                    </Text>
                  </View>
                )}
                {parseFloat(handrailLength) > 0 && (
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-xs text-gray-600">Handrail:</Text>
                    <Text className="text-xs text-gray-900">
                      {parseFloat(handrailLength)} ft × ${pricing.handrailLaborPerLF}/ft = ${(parseFloat(handrailLength) * pricing.handrailLaborPerLF).toFixed(2)}
                    </Text>
                  </View>
                )}
                {/* Secondary stairwell labor */}
                {hasSecondaryStairwell && parseFloat(tallWallHeight) > 0 && parseFloat(shortWallHeight) > 0 && (
                  <>
                    <View className="border-t border-gray-300 mt-2 pt-2 mb-1">
                      <Text className="text-xs font-semibold text-gray-700 mb-1">Secondary Stairwell:</Text>
                    </View>
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-xs text-gray-600">Wall Labor:</Text>
                      <Text className="text-xs text-gray-900">
                        {(((parseFloat(tallWallHeight) + parseFloat(shortWallHeight)) / 2) * 12 * (doubleSidedWalls ? 2 : 1)).toFixed(0)} sq ft × ${pricing.wallLaborPerSqFt}/sqft = ${((((parseFloat(tallWallHeight) + parseFloat(shortWallHeight)) / 2) * 12 * (doubleSidedWalls ? 2 : 1)) * pricing.wallLaborPerSqFt).toFixed(2)}
                      </Text>
                    </View>
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-xs text-gray-600">Ceiling Labor:</Text>
                      <Text className="text-xs text-gray-900">
                        {(15 * 3.5).toFixed(0)} sq ft × ${pricing.ceilingLaborPerSqFt}/sqft = ${((15 * 3.5) * pricing.ceilingLaborPerSqFt).toFixed(2)}
                      </Text>
                    </View>
                  </>
                )}
                <View className="border-t border-gray-300 mt-2 pt-2">
                  <View className="flex-row justify-between">
                    <Text className="text-xs font-bold text-gray-800">Total Labor:</Text>
                    <Text className="text-xs font-bold text-gray-900">
                      ${calculations.laborCost.toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Material Cost Breakdown */}
              <View className="bg-gray-50 rounded-lg p-3 mb-3">
                <Text className="text-xs font-semibold text-gray-700 mb-2">
                  MATERIAL COST CALCULATION:
                </Text>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-xs text-gray-600">Paint needed:</Text>
                  <Text className="text-xs text-gray-900">
                    {calculations.paintableArea.toFixed(0)} sq ft ÷ {pricing.wallCoverageSqFtPerGallon} × {staircase.coats} coats = {calculations.totalGallons.toFixed(2)} gal
                  </Text>
                </View>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-xs text-gray-600">Paint cost:</Text>
                  <Text className="text-xs text-gray-900">
                    {Math.ceil(calculations.totalGallons)} gal × ${pricing.trimPaintPerGallon}/gal = ${calculations.materialCost.toFixed(2)}
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
              Save Staircase
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
