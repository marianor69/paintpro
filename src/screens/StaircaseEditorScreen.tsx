import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
  Modal,
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
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { v4 as uuidv4 } from "uuid";
import {
  formatCurrency,
} from "../utils/calculations";
import { computeStaircasePricingSummary } from "../utils/pricingSummary";
import { formatMeasurementValue, parseDisplayValue, formatMeasurement } from "../utils/unitConversion";
import { RoomPhoto } from "../types/painting";

type Props = NativeStackScreenProps<RootStackParamList, "StaircaseEditor">;

const LABEL_TO_VALUE_OFFSET =
  Typography.caption.fontSize + Spacing.xs + Spacing.sm;

function BubbleStack({
  header,
  width = 68,
  children,
}: {
  header: string;
  width?: number;
  children: React.ReactNode;
}) {
  return (
    <View style={{ alignItems: "center" }}>
      <Text
        numberOfLines={1}
        ellipsizeMode="clip"
        style={{
          fontSize: Typography.caption.fontSize,
          color: Colors.mediumGray,
          marginBottom: Spacing.xs,
          textAlign: "center",
        }}
      >
        {header}
      </Text>
      <View style={{ width, alignItems: "center" }}>
        {children}
      </View>
    </View>
  );
}

function LabelWithHelp({
  text,
  onPress,
}: {
  text: string;
  onPress: () => void;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
      <Text
        style={{
          fontSize: Typography.body.fontSize,
          fontWeight: "500" as any,
          color: Colors.darkCharcoal,
          flex: 0,
          width: "auto",
        }}
      >
        {text}
      </Text>
      <Pressable
        onPress={onPress}
        hitSlop={8}
        style={{ marginLeft: Spacing.xs, transform: [{ translateY: -2 }] }}
        accessibilityRole="button"
        accessibilityLabel={`${text} help`}
      >
        <Ionicons
          name="help-circle-outline"
          size={13}
          color={Colors.mediumGray}
        />
      </Pressable>
    </View>
  );
}

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
  const [walls, setWalls] = useState<Array<{ id: string; tallHeight: string; shortHeight: string }>>(
    !isNewStaircase && staircase?.walls && staircase.walls.length > 0
      ? staircase.walls.map(w => ({
          id: w.id,
          tallHeight: formatMeasurementValue(w.tallHeight, 'length', unitSystem, 2),
          shortHeight: formatMeasurementValue(w.shortHeight, 'length', unitSystem, 2),
        }))
      : []
  );
  const [notes, setNotes] = useState(!isNewStaircase && staircase?.notes ? staircase.notes : "");
  const [photos, setPhotos] = useState<RoomPhoto[]>(
    !isNewStaircase && staircase?.photos ? staircase.photos : []
  );
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [editingPhotoNote, setEditingPhotoNote] = useState("");
  const [detailsConfirmed, setDetailsConfirmed] = useState(false);
  const [wallsConfirmed, setWallsConfirmed] = useState(false);
  const confirmedCardColor = Colors.success + "50";
  const detailsSnapshotRef = useRef<string>("");
  const wallsSnapshotRef = useRef<string>("");

  const detailsSnapshot = useMemo(
    () =>
      JSON.stringify({
        name,
        riserCount,
        spindleCount,
        handrailLength,
      }),
    [name, riserCount, spindleCount, handrailLength]
  );
  const wallsSnapshot = useMemo(
    () => JSON.stringify({ walls }),
    [walls]
  );

  useEffect(() => {
    if (detailsConfirmed && !detailsSnapshotRef.current) {
      detailsSnapshotRef.current = detailsSnapshot;
    }
    if (detailsConfirmed && detailsSnapshotRef.current && detailsSnapshotRef.current !== detailsSnapshot) {
      setDetailsConfirmed(false);
    }
  }, [detailsConfirmed, detailsSnapshot]);

  useEffect(() => {
    if (wallsConfirmed && !wallsSnapshotRef.current) {
      wallsSnapshotRef.current = wallsSnapshot;
    }
    if (wallsConfirmed && wallsSnapshotRef.current && wallsSnapshotRef.current !== wallsSnapshot) {
      setWallsConfirmed(false);
    }
  }, [wallsConfirmed, wallsSnapshot]);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [discardWidth, setDiscardWidth] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false); // Prevent double-save and navigation modal
  const [riserHelpVisible, setRiserHelpVisible] = useState(false);
  const isKeyboardVisibleRef = useRef(false);
  const pendingSavePromptRef = useRef(false);
  // MD-002: Store the navigation action to dispatch when discarding
  const preventedNavigationActionRef = useRef<any>(null);

  // Refs for form field navigation
  const nameRef = useRef<TextInput>(null);
  const handrailLengthRef = useRef<TextInput>(null);
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

  const showRiserHelp = () => {
    setRiserHelpVisible(true);
  };

  const addWall = () => {
    if (walls.length >= 4) return;

    const firstFloor = project?.firstFloorHeight || project?.floorHeights?.[0] || 8;
    const secondFloor = project?.secondFloorHeight || project?.floorHeights?.[1] || 8;
    const defaultTallHeight = firstFloor + secondFloor + 1;
    const defaultShortHeight = secondFloor;

    setWalls([
      ...walls,
      {
        id: `wall-${Date.now()}`,
        tallHeight: formatMeasurementValue(defaultTallHeight, 'length', unitSystem, 2),
        shortHeight: formatMeasurementValue(defaultShortHeight, 'length', unitSystem, 2),
      },
    ]);
  };

  const removeWall = () => {
    if (walls.length === 0) return;
    setWalls(walls.slice(0, -1));
  };

  const updateWallHeight = (index: number, field: 'tallHeight' | 'shortHeight', value: string) => {
    const newWalls = [...walls];
    newWalls[index] = { ...newWalls[index], [field]: value };
    setWalls(newWalls);
  };

  // Track unsaved changes
  useEffect(() => {
    if (isNewStaircase) {
      // For new staircase: changes are when user enters any data
      const hasChanges =
        name !== "" ||
        riserCount !== "" ||
        handrailLength !== "" ||
        spindleCount !== "" ||
        walls.length > 0 ||
        notes.trim() !== "" ||
        photos.length > 0;
      setHasUnsavedChanges(hasChanges);
    } else {
      // For existing: changes are when values differ from stored data
      if (!staircase) return;

      const wallsChanged =
        walls.length !== (staircase.walls?.length || 0) ||
        walls.some((w, i) => {
          const storedWall = staircase.walls?.[i];
          if (!storedWall) return true;
          return (
            w.tallHeight !== formatMeasurementValue(storedWall.tallHeight, 'length', unitSystem, 2) ||
            w.shortHeight !== formatMeasurementValue(storedWall.shortHeight, 'length', unitSystem, 2)
          );
        });

      const photosChanged =
        photos.length !== (staircase.photos?.length || 0) ||
        photos.some((photo, index) => {
          const stored = staircase.photos?.[index];
          return !stored || photo.uri !== stored.uri || photo.note !== stored.note;
        });

      const hasChanges =
        name !== (staircase.name || "") ||
        riserCount !== (staircase.riserCount && staircase.riserCount > 0 ? staircase.riserCount.toString() : "") ||
        handrailLength !== (staircase.handrailLength && staircase.handrailLength > 0 ? staircase.handrailLength.toString() : "") ||
        spindleCount !== (staircase.spindleCount && staircase.spindleCount > 0 ? staircase.spindleCount.toString() : "") ||
        wallsChanged ||
        notes !== (staircase.notes || "") ||
        photosChanged;

      setHasUnsavedChanges(hasChanges);
    }
  }, [
    isNewStaircase,
    staircase,
    name,
    riserCount,
    handrailLength,
    spindleCount,
    walls,
    notes,
    photos,
    unitSystem,
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

  // Photo handling functions
  const generatePhotoFileName = (staircaseName: string, photoIndex: number): string => {
    const safeName = (staircaseName || "Staircase").replace(/[^a-zA-Z0-9]/g, "_");
    const paddedIndex = String(photoIndex).padStart(2, "0");
    return `${safeName}_${paddedIndex}.jpg`;
  };

  const handleAddPhoto = async (useCamera: boolean) => {
    try {
      if (useCamera) {
        const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
        if (!cameraPermission.granted) {
          Alert.alert("Permission Required", "Camera permission is needed to take photos.");
          return;
        }
      } else {
        const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!mediaPermission.granted) {
          Alert.alert("Permission Required", "Photo library permission is needed to select photos.");
          return;
        }
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            allowsEditing: false,
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: false,
            quality: 0.8,
          });

      if (!result.canceled && result.assets[0]) {
        const newPhotoIndex = photos.length + 1;
        const newPhoto: RoomPhoto = {
          id: uuidv4(),
          uri: result.assets[0].uri,
          fileName: generatePhotoFileName(name, newPhotoIndex),
          createdAt: Date.now(),
        };
        setPhotos([...photos, newPhoto]);
        setHasUnsavedChanges(true);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to add photo.");
    }
  };

  const handleDeletePhoto = (photoId: string) => {
    Alert.alert(
      "Delete Photo",
      "Are you sure you want to delete this photo?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setPhotos(photos.filter((p) => p.id !== photoId));
            setHasUnsavedChanges(true);
          },
        },
      ]
    );
  };

  const handleEditPhotoNote = (photo: RoomPhoto) => {
    setEditingPhotoId(photo.id);
    setEditingPhotoNote(photo.note || "");
  };

  const handleSavePhotoNote = () => {
    if (editingPhotoId) {
      setPhotos(
        photos.map((p) =>
          p.id === editingPhotoId ? { ...p, note: editingPhotoNote.trim() || undefined } : p
        )
      );
      setHasUnsavedChanges(true);
      setEditingPhotoId(null);
      setEditingPhotoNote("");
    }
  };

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
      walls.length > 0;

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

    // Convert walls to storage format
    const wallsData = walls.map(w => ({
      id: w.id,
      tallHeight: parseDisplayValue(w.tallHeight, 'length', unitSystem),
      shortHeight: parseDisplayValue(w.shortHeight, 'length', unitSystem),
    }));
    const normalizedPhotos = photos.map((photo, index) => ({
      ...photo,
      fileName: generatePhotoFileName(name.trim(), index + 1),
    }));

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
        walls: wallsData.length > 0 ? wallsData : undefined,
        notes: notes.trim() || undefined,
        photos: normalizedPhotos,
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
        walls: wallsData.length > 0 ? wallsData : undefined,
        notes: notes.trim() || undefined,
        photos: normalizedPhotos,
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
            name: "",
            riserCount: parseInt(riserCount) || 14,
            riserHeight: 7.5,
            treadDepth: 0,
            handrailLength: parseFloat(handrailLength) || 0,
            spindleCount: parseInt(spindleCount) || 0,
            coats: 2,
            walls: walls.map(w => ({
              id: w.id,
              tallHeight: parseFloat(w.tallHeight) || 0,
              shortHeight: parseFloat(w.shortHeight) || 0,
            })),
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
            walls: walls.map(w => ({
              id: w.id,
              tallHeight: parseFloat(w.tallHeight) || 0,
              shortHeight: parseFloat(w.shortHeight) || 0,
            })),
          },
          pricing,
          project?.projectCoats
        );

  // Only show preview if at least riser count is entered
  const hasDataEntered = riserCount !== "" || handrailLength !== "" || spindleCount !== "" || walls.length > 0;

  // If existing staircase not found, show error
  if (!isNewStaircase && !staircase) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.backgroundWarmGray }}>
        <Text style={{ fontSize: Typography.h3.fontSize, color: Colors.mediumGray }}>Staircase not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: Colors.backgroundWarmGray }}>
      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        style={{ flex: 1 }}
      >
        <View
          style={{
            paddingTop: Spacing.sm,
            paddingHorizontal: Spacing.md,
            paddingBottom: Spacing.sm,
            backgroundColor: Colors.white,
            borderBottomWidth: 1,
            borderBottomColor: Colors.neutralGray,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Pressable
              onPress={handleDiscardAndLeave}
              onLayout={(event) => {
                if (!discardWidth) {
                  setDiscardWidth(event.nativeEvent.layout.width);
                }
              }}
              style={{
                minWidth: 60,
                height: 36,
                paddingHorizontal: Spacing.sm,
                borderRadius: 8,
                backgroundColor: Colors.primaryBlueLight,
                borderWidth: 1,
                borderColor: Colors.neutralGray,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: Typography.body.fontSize, color: Colors.error, fontWeight: "600" as any }}>
                Discard
              </Text>
            </Pressable>
            <Text
              style={{
                flex: 1,
                textAlign: "center",
                fontSize: Typography.h2.fontSize,
                fontWeight: Typography.h2.fontWeight as any,
                color: Colors.darkCharcoal,
              }}
              numberOfLines={1}
            >
              {(name || "Unnamed Staircase") + "'s Details"}
            </Text>
            <Pressable
              onPress={handleSave}
              android_ripple={{ color: "transparent" }}
              style={{
                minWidth: 60,
                height: 36,
                width: discardWidth || undefined,
                backgroundColor: Colors.primaryBlue,
                borderRadius: 8,
                paddingHorizontal: Spacing.sm,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" as any }}>
                Save
              </Text>
            </Pressable>
          </View>
        </View>
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

          <View style={{ padding: Spacing.md }}>
            {/* Staircase Information Card */}
            <Card style={{ marginBottom: Spacing.md, paddingBottom: Spacing.sm, backgroundColor: detailsConfirmed ? confirmedCardColor : Colors.white }}>
              {/* Name/Location */}
              <View style={{ marginBottom: Spacing.md }}>
                <FormInput
                  ref={nameRef}
                  label="Name/Location"
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g., Main Staircase, Second Floor"
                  nextFieldRef={handrailLengthRef}
                  returnKeyType="next"
                  className="mb-0"
                />
              </View>

              {/* Row 1: Risers */}
              <View style={{ marginBottom: Spacing.md }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <LabelWithHelp text="Risers" onPress={showRiserHelp} />
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: Colors.primaryBlueLight,
                      borderRadius: 8,
                      paddingHorizontal: 4,
                      paddingVertical: 2,
                      borderWidth: 1,
                      borderColor: Colors.neutralGray,
                      gap: 4,
                    }}
                  >
                    <Pressable
                      onPress={() => {
                        const current = parseInt(riserCount) || 0;
                        setRiserCount(Math.max(0, current - 1).toString());
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Decrease riser count"
                      style={{
                        width: 28,
                        height: 28,
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ fontSize: 22, color: Colors.primaryBlue, fontWeight: "600" as any }}>−</Text>
                    </Pressable>
                    <View
                      style={{
                        minWidth: 32,
                        paddingHorizontal: 8,
                        paddingVertical: 6,
                        backgroundColor: Colors.white,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: Colors.neutralGray,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.primaryBlue }}>
                        {riserCount || "0"}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => {
                        const current = parseInt(riserCount) || 0;
                        setRiserCount((current + 1).toString());
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Increase riser count"
                      style={{
                        width: 28,
                        height: 28,
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ fontSize: 22, color: Colors.primaryBlue, fontWeight: "600" as any }}>+</Text>
                    </Pressable>
                  </View>
                </View>
              </View>

              {/* Row 2: Spindles */}
              <View style={{ marginBottom: Spacing.md }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500" as any, color: Colors.darkCharcoal }}>
                    Spindles
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: Colors.primaryBlueLight,
                      borderRadius: 8,
                      paddingHorizontal: 4,
                      paddingVertical: 2,
                      borderWidth: 1,
                      borderColor: Colors.neutralGray,
                      gap: 4,
                    }}
                  >
                    <Pressable
                      onPress={() => {
                        const current = parseInt(spindleCount) || 0;
                        setSpindleCount(Math.max(0, current - 1).toString());
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Decrease spindle count"
                      style={{
                        width: 28,
                        height: 28,
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ fontSize: 22, color: Colors.primaryBlue, fontWeight: "600" as any }}>−</Text>
                    </Pressable>
                    <View
                      style={{
                        minWidth: 32,
                        paddingHorizontal: 8,
                        paddingVertical: 6,
                        backgroundColor: Colors.white,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: Colors.neutralGray,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.primaryBlue }}>
                        {spindleCount || "0"}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => {
                        const current = parseInt(spindleCount) || 0;
                        setSpindleCount((current + 1).toString());
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Increase spindle count"
                      style={{
                        width: 28,
                        height: 28,
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ fontSize: 22, color: Colors.primaryBlue, fontWeight: "600" as any }}>+</Text>
                    </Pressable>
                  </View>
                </View>
              </View>

              {/* Handrail Length - full width */}
              <View style={{ marginBottom: Spacing.md }}>
                <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <Text
                    style={{
                      fontSize: Typography.body.fontSize,
                      fontWeight: "500" as any,
                      color: Colors.darkCharcoal,
                      marginTop: LABEL_TO_VALUE_OFFSET,
                    }}
                  >
                    Handrail Length
                  </Text>
                  <BubbleStack header="Feet" width={68}>
                    <FormInput
                      ref={handrailLengthRef}
                      previousFieldRef={nameRef}
                      label=""
                      value={handrailLength}
                      onChangeText={setHandrailLength}
                      keyboardType="numeric"
                      placeholder="0"
                      inputContainerStyle={{ width: 68 }}
                      inputTextStyle={{ textAlign: "right" }}
                      className="mb-0"
                    />
                  </BubbleStack>
                </View>
              </View>
              <View style={{ alignItems: "flex-end", marginTop: Spacing.sm, marginBottom: Spacing.sm }}>
                <Pressable
                  onPress={() => {
                    Keyboard.dismiss();
                    detailsSnapshotRef.current = detailsSnapshot;
                    setDetailsConfirmed(true);
                  }}
                  style={{
                    backgroundColor: Colors.primaryBlue,
                    borderRadius: 8,
                    paddingHorizontal: Spacing.sm,
                    paddingVertical: 10,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.white }}>
                    Confirm
                  </Text>
                </Pressable>
              </View>
            </Card>

            {/* Walls Section */}
            <Card style={{ marginBottom: Spacing.md, paddingBottom: Spacing.sm, backgroundColor: wallsConfirmed ? confirmedCardColor : Colors.white }}>
              <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                Walls in Stairwell
              </Text>

              {/* Wall Counter */}
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: Spacing.md, marginBottom: Spacing.md }}>
                <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500" as any, color: Colors.darkCharcoal }}>
                  Wall Count:
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: Colors.primaryBlueLight,
                    borderRadius: 8,
                    paddingHorizontal: 4,
                    paddingVertical: 2,
                    borderWidth: 1,
                    borderColor: Colors.neutralGray,
                    gap: 4,
                  }}
                >
                  <Pressable
                    onPress={() => {
                      if (walls.length > 0) {
                        removeWall();
                      }
                    }}
                    disabled={walls.length === 0}
                    accessibilityRole="button"
                    accessibilityLabel="Decrease wall count"
                    style={{
                      width: 28,
                      height: 28,
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ fontSize: 22, color: walls.length === 0 ? Colors.mediumGray : Colors.primaryBlue, fontWeight: "600" as any }}>−</Text>
                  </Pressable>
                  <View
                    style={{
                      minWidth: 32,
                      paddingHorizontal: 8,
                      paddingVertical: 6,
                      backgroundColor: Colors.white,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: Colors.neutralGray,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.primaryBlue }}>
                      {walls.length}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      if (walls.length < 4) {
                        addWall();
                      }
                    }}
                    disabled={walls.length >= 4}
                    accessibilityRole="button"
                    accessibilityLabel="Increase wall count"
                    style={{
                      width: 28,
                      height: 28,
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ fontSize: 22, color: walls.length >= 4 ? Colors.mediumGray : Colors.primaryBlue, fontWeight: "600" as any }}>+</Text>
                  </Pressable>
                </View>
              </View>

              {/* Wall Inputs (one row per wall; no divider lines) */}
              {walls.map((wall, index) => (
                <View
                  key={wall.id}
                  style={{
                    marginBottom: Spacing.md,
                    paddingTop: index === 0 ? 0 : Spacing.sm,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: Spacing.md,
                    }}
                  >
                    <Text
                      style={{
                        flex: 1,
                        fontSize: Typography.body.fontSize,
                        fontWeight: "500" as any,
                        color: Colors.darkCharcoal,
                        marginTop: LABEL_TO_VALUE_OFFSET,
                      }}
                    >
                      Wall {index + 1}
                    </Text>
                    <BubbleStack
                      header={`Tall Side (${unitSystem === "metric" ? "m" : "ft"})`}
                      width={68}
                    >
                      <FormInput
                        label=""
                        value={wall.tallHeight}
                        onChangeText={(value) => updateWallHeight(index, "tallHeight", value)}
                        keyboardType="numeric"
                        placeholder="0"
                        inputContainerStyle={{ width: 68 }}
                        inputTextStyle={{ textAlign: "right" }}
                        className="mb-0"
                      />
                    </BubbleStack>
                    <BubbleStack
                      header={`Short Side (${unitSystem === "metric" ? "m" : "ft"})`}
                      width={68}
                    >
                      <FormInput
                        label=""
                        value={wall.shortHeight}
                        onChangeText={(value) => updateWallHeight(index, "shortHeight", value)}
                        keyboardType="numeric"
                        placeholder="0"
                        inputContainerStyle={{ width: 68 }}
                        inputTextStyle={{ textAlign: "right" }}
                        className="mb-0"
                      />
                    </BubbleStack>
                  </View>
                </View>
              ))}
              <View style={{ alignItems: "flex-end", marginTop: Spacing.sm, marginBottom: Spacing.sm }}>
                <Pressable
                  onPress={() => {
                    Keyboard.dismiss();
                    wallsSnapshotRef.current = wallsSnapshot;
                    setWallsConfirmed(true);
                  }}
                  style={{
                    backgroundColor: Colors.primaryBlue,
                    borderRadius: 8,
                    paddingHorizontal: Spacing.sm,
                    paddingVertical: 10,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.white }}>
                    Confirm
                  </Text>
                </Pressable>
              </View>
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
                      borderRadius: 8,
                      padding: Spacing.md,
                      minHeight: 100,
                    }
                  ]}
                />
              </Card>
            </View>

            {/* Staircase Photos Section */}
            <Card style={{ marginBottom: Spacing.md }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: photos.length > 0 ? Spacing.md : 0,
                }}
              >
                <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.darkCharcoal }}>
                  {(name ? name : "Staircase") + "'s Photos"}
                </Text>
                <View style={{ flexDirection: "row", gap: Spacing.sm }}>
                  <Pressable
                    onPress={() => handleAddPhoto(true)}
                    style={{
                      width: 52,
                      height: 40,
                      borderRadius: 8,
                      backgroundColor: Colors.primaryBlue,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    accessibilityLabel="Take photo"
                  >
                    <Ionicons name="camera-outline" size={20} color={Colors.white} />
                  </Pressable>
                  <Pressable
                    onPress={() => handleAddPhoto(false)}
                    style={{
                      width: 52,
                      height: 40,
                      borderRadius: 8,
                      backgroundColor: Colors.backgroundWarmGray,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    accessibilityLabel="Choose photo"
                  >
                    <Ionicons name="images-outline" size={20} color={Colors.darkCharcoal} />
                  </Pressable>
                </View>
              </View>

              {/* Photo Grid */}
              {photos.length > 0 && (
                <View style={{ gap: Spacing.md }}>
                  {photos.map((photo) => (
                    <View
                      key={photo.id}
                      style={{
                        backgroundColor: Colors.backgroundWarmGray,
                        borderRadius: 8,
                        overflow: "hidden",
                      }}
                    >
                      <Image
                        source={{ uri: photo.uri }}
                        style={{
                          width: "100%",
                          height: 180,
                          backgroundColor: Colors.neutralGray,
                        }}
                        resizeMode="cover"
                      />
                      <View style={{ padding: Spacing.sm }}>
                        {/* File Name */}
                        <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.xs }}>
                          {photo.fileName}
                        </Text>

                        {/* Note Display */}
                        {editingPhotoId === photo.id ? (
                          <>
                            <TextInput
                              value={editingPhotoNote}
                              onChangeText={setEditingPhotoNote}
                              placeholder="Add a note about this photo..."
                              placeholderTextColor={Colors.mediumGray}
                              multiline
                              style={[
                                TextInputStyles.multiline,
                                {
                                  backgroundColor: Colors.white,
                                  borderRadius: 8,
                                  padding: Spacing.sm,
                                  minHeight: 60,
                                  marginBottom: Spacing.sm,
                                }
                              ]}
                            />
                            <View style={{ flexDirection: "row", gap: Spacing.sm }}>
                              <Pressable
                                onPress={handleSavePhotoNote}
                                style={{
                                  flex: 1,
                                  backgroundColor: Colors.primaryBlue,
                                  borderRadius: 8,
                                  paddingVertical: Spacing.xs,
                                  alignItems: "center",
                                }}
                              >
                                <Text style={{ fontSize: Typography.caption.fontSize, fontWeight: "600" as any, color: Colors.white }}>
                                  Save Note
                                </Text>
                              </Pressable>
                              <Pressable
                                onPress={() => {
                                  setEditingPhotoId(null);
                                  setEditingPhotoNote("");
                                }}
                                style={{
                                  flex: 1,
                                  backgroundColor: Colors.neutralGray,
                                  borderRadius: 8,
                                  paddingVertical: Spacing.xs,
                                  alignItems: "center",
                                }}
                              >
                                <Text style={{ fontSize: Typography.caption.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal }}>
                                  Cancel
                                </Text>
                              </Pressable>
                            </View>
                          </>
                        ) : (
                          <>
                            {photo.note ? (
                              <Text style={{ fontSize: Typography.body.fontSize, color: Colors.darkCharcoal, marginBottom: Spacing.sm }}>
                                {photo.note}
                              </Text>
                            ) : (
                              <Text style={{ fontSize: Typography.body.fontSize, color: Colors.mediumGray, fontStyle: "italic", marginBottom: Spacing.sm }}>
                                No note added
                              </Text>
                            )}

                            {/* Action Buttons */}
                            <View style={{ flexDirection: "row", gap: Spacing.sm }}>
                              <Pressable
                                onPress={() => handleEditPhotoNote(photo)}
                                style={{
                                  flex: 1,
                                  backgroundColor: Colors.primaryBlue,
                                  borderRadius: 8,
                                  paddingVertical: Spacing.xs,
                                  flexDirection: "row",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <Ionicons name="create-outline" size={16} color={Colors.white} />
                                <Text style={{ fontSize: Typography.caption.fontSize, fontWeight: "600" as any, color: Colors.white, marginLeft: Spacing.xs }}>
                                  {photo.note ? "Edit Note" : "Add Note"}
                                </Text>
                              </Pressable>
                              <Pressable
                                onPress={() => handleDeletePhoto(photo.id)}
                                style={{
                                  backgroundColor: Colors.error + "10",
                                  borderRadius: 8,
                                  paddingVertical: Spacing.xs,
                                  paddingHorizontal: Spacing.md,
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <Ionicons name="trash-outline" size={16} color={Colors.error} />
                              </Pressable>
                            </View>
                          </>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}

            </Card>

            {/* Staircase Summary */}
            {calculations && hasDataEntered && (() => {
              // Calculate per-component costs
              const riserLaborCost = parseFloat(riserCount) > 0 ? parseFloat(riserCount) * pricing.riserLabor : 0;
              const spindleLaborCost = parseFloat(spindleCount) > 0 ? parseFloat(spindleCount) * pricing.spindleLabor : 0;
              const handrailLaborCost = parseFloat(handrailLength) > 0 ? parseFloat(handrailLength) * pricing.handrailLaborPerLF : 0;

              // Wall labor - calculate for each wall
              const wallsData = walls.map(w => {
                const tallHeight = parseFloat(w.tallHeight) || 0;
                const shortHeight = parseFloat(w.shortHeight) || 0;
                const wallArea = tallHeight > 0 && shortHeight > 0 ? ((tallHeight + shortHeight) / 2) * 12 : 0;
                const ceilingArea = tallHeight > 0 && shortHeight > 0 ? 15 * 3.5 : 0;
                return {
                  wallArea,
                  ceilingArea,
                  wallLaborCost: wallArea * pricing.wallLaborPerSqFt,
                  ceilingLaborCost: ceilingArea * pricing.ceilingLaborPerSqFt,
                };
              });

              const totalWallArea = wallsData.reduce((sum, w) => sum + w.wallArea, 0);
              const totalCeilingArea = wallsData.reduce((sum, w) => sum + w.ceilingArea, 0);
              const totalWallLaborCost = wallsData.reduce((sum, w) => sum + w.wallLaborCost, 0);
              const totalCeilingLaborCost = wallsData.reduce((sum, w) => sum + w.ceilingLaborCost, 0);

              // Materials: paint is distributed proportionally (simplified: equal split for now)
              const wallComponents = wallsData.reduce((count, w) => {
                return count + (w.wallArea > 0 ? 1 : 0) + (w.ceilingArea > 0 ? 1 : 0);
              }, 0);

              const totalComponents = (parseFloat(riserCount) > 0 ? 1 : 0) +
                                     (parseFloat(spindleCount) > 0 ? 1 : 0) +
                                     (parseFloat(handrailLength) > 0 ? 1 : 0) +
                                     wallComponents;

              const materialPerComponent = totalComponents > 0 ? calculations.materialsDisplayed / totalComponents : 0;

              const riserMaterialsCost = parseFloat(riserCount) > 0 ? materialPerComponent : 0;
              const spindleMaterialsCost = parseFloat(spindleCount) > 0 ? materialPerComponent : 0;
              const handrailMaterialsCost = parseFloat(handrailLength) > 0 ? materialPerComponent : 0;

              const wallsMaterialsCost = wallsData.map(w => ({
                wallMaterialsCost: w.wallArea > 0 ? materialPerComponent : 0,
                ceilingMaterialsCost: w.ceilingArea > 0 ? materialPerComponent : 0,
              }));

              return (
                <Card style={{ marginBottom: Spacing.md }}>
                  <Text style={Typography.h2}>Staircase Summary</Text>

                  <View style={{ flexDirection: "row", gap: Spacing.sm }}>
                    {/* Gray section - flex: 3, 2-column layout */}
                    <View style={{ flex: 3, backgroundColor: Colors.backgroundWarmGray, borderRadius: 8, padding: Spacing.md }}>
                      {/* Empty row for alignment */}
                      <View style={{ marginBottom: Spacing.xs }}>
                        <Text style={{ fontSize: 13, color: "transparent" }}>-</Text>
                      </View>

                      {parseFloat(riserCount) > 0 && (
                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                          <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>Risers</Text>
                          <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>
                            {Math.ceil(parseFloat(riserCount))}
                          </Text>
                        </View>
                      )}

                      {parseFloat(spindleCount) > 0 && (
                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                          <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>Spindles</Text>
                          <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>
                            {Math.ceil(parseFloat(spindleCount))}
                          </Text>
                        </View>
                      )}

                      {parseFloat(handrailLength) > 0 && (
                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                          <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>Handrail</Text>
                          <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>
                            {formatMeasurement(Math.ceil(parseFloat(handrailLength)), 'length', unitSystem, 0)}
                          </Text>
                        </View>
                      )}

                      {wallsData.map((wallData, idx) => (
                        <React.Fragment key={idx}>
                          {wallData.wallArea > 0 && (
                            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                              <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>Wall {idx + 1}</Text>
                              <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>
                                {formatMeasurement(Math.ceil(wallData.wallArea), 'area', unitSystem, 0)}
                              </Text>
                            </View>
                          )}
                          {wallData.ceilingArea > 0 && (
                            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                              <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>W{idx + 1} Ceiling</Text>
                              <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>
                                {formatMeasurement(Math.ceil(wallData.ceilingArea), 'area', unitSystem, 0)}
                              </Text>
                            </View>
                          )}
                        </React.Fragment>
                      ))}
                    </View>

                    {/* Blue section - flex: 2, 2 columns right-aligned */}
                    <View style={{ flex: 2, backgroundColor: "#E3F2FD", borderRadius: 8, padding: Spacing.md }}>
                      {/* Header Row */}
                      <View style={{ flexDirection: "row", gap: Spacing.xs, marginBottom: Spacing.xs }}>
                        <Text style={{ flex: 1, fontSize: 13, color: Colors.mediumGray, textAlign: "right" }}>Labor</Text>
                        <Text style={{ flex: 1, fontSize: 13, color: Colors.mediumGray, textAlign: "right" }}>Mat</Text>
                      </View>

                      {parseFloat(riserCount) > 0 && (
                        <View style={{ flexDirection: "row", gap: Spacing.xs, marginBottom: Spacing.xs }}>
                          <Text style={{ flex: 1, fontSize: 13, color: Colors.darkCharcoal, textAlign: "right" }}>
                            ${Math.round(riserLaborCost)}
                          </Text>
                          <Text style={{ flex: 1, fontSize: 13, color: Colors.darkCharcoal, textAlign: "right" }}>
                            ${Math.round(riserMaterialsCost)}
                          </Text>
                        </View>
                      )}

                      {parseFloat(spindleCount) > 0 && (
                        <View style={{ flexDirection: "row", gap: Spacing.xs, marginBottom: Spacing.xs }}>
                          <Text style={{ flex: 1, fontSize: 13, color: Colors.darkCharcoal, textAlign: "right" }}>
                            ${Math.round(spindleLaborCost)}
                          </Text>
                          <Text style={{ flex: 1, fontSize: 13, color: Colors.darkCharcoal, textAlign: "right" }}>
                            ${Math.round(spindleMaterialsCost)}
                          </Text>
                        </View>
                      )}

                      {parseFloat(handrailLength) > 0 && (
                        <View style={{ flexDirection: "row", gap: Spacing.xs, marginBottom: Spacing.xs }}>
                          <Text style={{ flex: 1, fontSize: 13, color: Colors.darkCharcoal, textAlign: "right" }}>
                            ${Math.round(handrailLaborCost)}
                          </Text>
                          <Text style={{ flex: 1, fontSize: 13, color: Colors.darkCharcoal, textAlign: "right" }}>
                            ${Math.round(handrailMaterialsCost)}
                          </Text>
                        </View>
                      )}

                      {wallsData.map((wallData, idx) => (
                        <React.Fragment key={idx}>
                          {wallData.wallArea > 0 && (
                            <View style={{ flexDirection: "row", gap: Spacing.xs, marginBottom: Spacing.xs }}>
                              <Text style={{ flex: 1, fontSize: 13, color: Colors.darkCharcoal, textAlign: "right" }}>
                                ${Math.round(wallData.wallLaborCost)}
                              </Text>
                              <Text style={{ flex: 1, fontSize: 13, color: Colors.darkCharcoal, textAlign: "right" }}>
                                ${Math.round(wallsMaterialsCost[idx].wallMaterialsCost)}
                              </Text>
                            </View>
                          )}
                          {wallData.ceilingArea > 0 && (
                            <View style={{ flexDirection: "row", gap: Spacing.xs, marginBottom: Spacing.xs }}>
                              <Text style={{ flex: 1, fontSize: 13, color: Colors.darkCharcoal, textAlign: "right" }}>
                                ${Math.round(wallData.ceilingLaborCost)}
                              </Text>
                              <Text style={{ flex: 1, fontSize: 13, color: Colors.darkCharcoal, textAlign: "right" }}>
                                ${Math.round(wallsMaterialsCost[idx].ceilingMaterialsCost)}
                              </Text>
                            </View>
                          )}
                        </React.Fragment>
                      ))}

                      <View style={{ height: 1, backgroundColor: "#90CAF9", marginVertical: Spacing.xs }} />

                      {/* Subtotals - without labels */}
                      <View style={{ flexDirection: "row", gap: Spacing.xs, marginBottom: Spacing.xs }}>
                        <Text style={{ flex: 1, fontSize: 13, color: Colors.darkCharcoal, textAlign: "right" }}>
                          ${Math.round(calculations.laborDisplayed)}
                        </Text>
                        <Text style={{ flex: 1, fontSize: 13, color: Colors.darkCharcoal, textAlign: "right" }}>
                          ${Math.round(calculations.materialsDisplayed)}
                        </Text>
                      </View>

                      <View style={{ height: 1, backgroundColor: "#90CAF9", marginVertical: Spacing.xs }} />

                      {/* Total */}
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={{ fontSize: 13, fontWeight: "700" as any, color: Colors.darkCharcoal }}>Total:</Text>
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
            {testMode && calculations && hasDataEntered && (() => {
              const riserHeightFt = 7.5 / 12;
              const stairWidthFt = 3;
              const riserArea = parseInt(riserCount) * riserHeightFt * stairWidthFt;
              const spindleArea = parseInt(spindleCount) * 0.5;
              const handrailArea = parseFloat(handrailLength) * 0.5;

              const testWallsData = walls.map((w, idx) => {
                const tallHeight = parseFloat(w.tallHeight) || 0;
                const shortHeight = parseFloat(w.shortHeight) || 0;
                const wallArea = tallHeight > 0 && shortHeight > 0 ? ((tallHeight + shortHeight) / 2) * 12 : 0;
                const ceilingArea = tallHeight > 0 && shortHeight > 0 ? 15 * 3.5 : 0;
                return {
                  wallIndex: idx + 1,
                  tallHeight,
                  shortHeight,
                  wallArea,
                  ceilingArea,
                };
              });

              return (
                <Card style={{ marginBottom: Spacing.md }}>
                  <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.error, marginBottom: Spacing.md }}>
                    TEST MODE: Calculation Details
                  </Text>

                  <View style={{ backgroundColor: Colors.backgroundWarmGray, borderRadius: 8, padding: Spacing.md }}>
                    {/* Risers */}
                    {parseInt(riserCount) > 0 && (
                      <View style={{ marginBottom: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.neutralGray }}>
                        <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                          Risers
                        </Text>
                        <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                          Count: {riserCount} | Area: {riserArea.toFixed(2)} sqft ({riserCount} × 7.5" × 36")
                        </Text>
                        <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                          Labor: {riserCount} × ${pricing.riserLabor.toFixed(2)}/riser = ${(parseInt(riserCount) * pricing.riserLabor).toFixed(2)}
                        </Text>
                      </View>
                    )}

                    {/* Spindles */}
                    {parseInt(spindleCount) > 0 && (
                      <View style={{ marginBottom: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.neutralGray }}>
                        <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                          Spindles
                        </Text>
                        <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                          Count: {spindleCount} | Area: {spindleArea.toFixed(2)} sqft ({spindleCount} × 0.5 sqft)
                        </Text>
                        <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                          Labor: {spindleCount} × ${pricing.spindleLabor.toFixed(2)}/spindle = ${(parseInt(spindleCount) * pricing.spindleLabor).toFixed(2)}
                        </Text>
                      </View>
                    )}

                    {/* Handrail */}
                    {parseFloat(handrailLength) > 0 && (
                      <View style={{ marginBottom: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.neutralGray }}>
                        <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                          Handrail
                        </Text>
                        <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                          Length: {handrailLength} ft | Area: {handrailArea.toFixed(2)} sqft ({handrailLength} × 0.5 ft)
                        </Text>
                        <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                          Labor: {handrailLength} ft × ${pricing.handrailLaborPerLF.toFixed(2)}/ft = ${(parseFloat(handrailLength) * pricing.handrailLaborPerLF).toFixed(2)}
                        </Text>
                      </View>
                    )}

                    {/* Walls */}
                    {testWallsData.map((wallData) => (
                      <React.Fragment key={wallData.wallIndex}>
                        {wallData.wallArea > 0 && (
                          <View style={{ marginBottom: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.neutralGray }}>
                            <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                              Wall {wallData.wallIndex} - Wall Surface
                            </Text>
                            <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                              Area: {wallData.wallArea.toFixed(2)} sqft (({wallData.tallHeight} + {wallData.shortHeight}) / 2 × 12 ft)
                            </Text>
                            <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                              Labor: {wallData.wallArea.toFixed(2)} × ${pricing.wallLaborPerSqFt.toFixed(2)}/sqft = ${(wallData.wallArea * pricing.wallLaborPerSqFt).toFixed(2)}
                            </Text>
                          </View>
                        )}

                        {wallData.ceilingArea > 0 && (
                          <View style={{ marginBottom: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.neutralGray }}>
                            <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                              Wall {wallData.wallIndex} - Ceiling
                            </Text>
                            <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                              Area: {wallData.ceilingArea.toFixed(2)} sqft (15 ft × 3.5 ft)
                            </Text>
                            <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                              Labor: {wallData.ceilingArea.toFixed(2)} × ${pricing.ceilingLaborPerSqFt.toFixed(2)}/sqft = ${(wallData.ceilingArea * pricing.ceilingLaborPerSqFt).toFixed(2)}
                            </Text>
                          </View>
                        )}
                      </React.Fragment>
                    ))}

                    {/* Paint */}
                    <View style={{ marginBottom: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.neutralGray }}>
                      <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                        Paint
                      </Text>
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                        Total Area: {calculations.paintableArea.toFixed(2)} sqft | Coats: {staircase?.coats || 2}
                      </Text>
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                        Gallons: {calculations.totalGallons.toFixed(2)} gal
                      </Text>
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                        Materials: {Math.ceil(calculations.totalGallons)} gal × ${pricing.trimPaintPerGallon.toFixed(2)}/gal = ${calculations.materialsDisplayed.toFixed(2)}
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
                borderRadius: 8,
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

        <Modal
          visible={riserHelpVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setRiserHelpVisible(false)}
        >
          <View style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.4)", justifyContent: "center", padding: Spacing.lg }}>
            <Pressable
              onPress={() => setRiserHelpVisible(false)}
              style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
            />
            <View style={{ backgroundColor: Colors.white, borderRadius: 8, padding: Spacing.lg, ...Shadows.card }}>
              <Text style={{ fontSize: Typography.h3.fontSize, fontWeight: Typography.h3.fontWeight as any, color: Colors.darkCharcoal, marginBottom: Spacing.sm }}>
                Risers
              </Text>
              <Text style={{ fontSize: Typography.body.fontSize, color: Colors.mediumGray, marginBottom: Spacing.lg }}>
                Count the vertical faces between treads. This screen assumes a standard riser height of 7.5 inches.
              </Text>
              <Pressable
                onPress={() => setRiserHelpVisible(false)}
                style={{ backgroundColor: Colors.primaryBlue, borderRadius: 8, paddingVertical: Spacing.sm, alignItems: "center" }}
                accessibilityRole="button"
                accessibilityLabel="Close riser help"
              >
                <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.white }}>
                  Close
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>

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
