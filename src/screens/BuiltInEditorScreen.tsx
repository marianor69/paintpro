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
  InputAccessoryView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { usePreventRemove } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/RootNavigator";
import { useProjectStore } from "../state/projectStore";
import { usePricingStore } from "../state/pricingStore";
import { useCalculationSettings } from "../state/calculationStore";
import { useAppSettings } from "../state/appSettings";
import { Colors, Typography, Spacing, BorderRadius, Shadows, TextInputStyles } from "../utils/designSystem";
import { Card } from "../components/Card";
import { FormInput } from "../components/FormInput";
import { Toggle } from "../components/Toggle";
import { SavePromptModal } from "../components/SavePromptModal";
import { safeNumber } from "../utils/calculations";
import { formatMeasurementValue, parseDisplayValue, formatMeasurement } from "../utils/unitConversion";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { v4 as uuidv4 } from "uuid";
import { RoomPhoto } from "../types/painting";

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
  const calcSettings = useCalculationSettings((s) => s.settings);
  const { testMode, unitSystem, cabinetPaintCoverageSqFtPerGallon } = useAppSettings();

  // Convert stored imperial values (inches) to display values based on unit system
  // Built-ins store dimensions in INCHES, but unit conversion works with FEET, so convert inches->feet->display
  const [name, setName] = useState(!isNewBuiltIn && builtIn?.name ? builtIn.name : "");
  const [width, setWidth] = useState(!isNewBuiltIn && builtIn?.width && builtIn.width > 0 ? formatMeasurementValue(builtIn.width / 12, 'length', unitSystem, 2) : "");
  const [height, setHeight] = useState(!isNewBuiltIn && builtIn?.height && builtIn.height > 0 ? formatMeasurementValue(builtIn.height / 12, 'length', unitSystem, 2) : "");
  const [depth, setDepth] = useState(!isNewBuiltIn && builtIn?.depth && builtIn.depth > 0 ? formatMeasurementValue(builtIn.depth / 12, 'length', unitSystem, 2) : "");
  const [shelfCount, setShelfCount] = useState(!isNewBuiltIn && builtIn?.shelfCount && builtIn.shelfCount > 0 ? builtIn.shelfCount.toString() : "");
  const [cabinetDoorCount, setCabinetDoorCount] = useState(!isNewBuiltIn && builtIn?.cabinetDoorCount && builtIn.cabinetDoorCount > 0 ? builtIn.cabinetDoorCount.toString() : "");
  const [paintCabinetDoors, setPaintCabinetDoors] = useState(builtIn?.paintCabinetDoors ?? false);
  const [notes, setNotes] = useState(!isNewBuiltIn && builtIn?.notes ? builtIn.notes : "");
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [photos, setPhotos] = useState<RoomPhoto[]>(builtIn?.photos || []);
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [editingPhotoNote, setEditingPhotoNote] = useState("");
  const [photoErrorMessage, setPhotoErrorMessage] = useState("");
  const [deletePhotoId, setDeletePhotoId] = useState<string | null>(null);
  const [detailsExpanded, setDetailsExpanded] = useState(true);
  const [detailsConfirmed, setDetailsConfirmed] = useState(builtIn?.detailsConfirmed ?? false);
  const confirmedCardColor = Colors.success + "50";
  const detailsSnapshotRef = useRef<string>("");

  const detailsSnapshot = useMemo(
    () =>
      JSON.stringify({
        name,
        width,
        height,
        depth,
        shelfCount,
        cabinetDoorCount,
        paintCabinetDoors,
      }),
    [name, width, height, depth, shelfCount, cabinetDoorCount, paintCabinetDoors]
  );

  useEffect(() => {
    if (detailsConfirmed && !detailsSnapshotRef.current) {
      detailsSnapshotRef.current = detailsSnapshot;
    }
    if (detailsConfirmed && detailsSnapshotRef.current && detailsSnapshotRef.current !== detailsSnapshot) {
      setDetailsConfirmed(false);
    }
  }, [detailsConfirmed, detailsSnapshot]);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [discardWidth, setDiscardWidth] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false); // Prevent double-save and navigation modal
  const isSavingRef = useRef(false); // Ref-based guard for rapid taps (more reliable than state)
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmModalBody, setConfirmModalBody] = useState("");
  const isKeyboardVisibleRef = useRef(false);
  const pendingSavePromptRef = useRef(false);
  // MD-002: Store the navigation action to dispatch when discarding
  const preventedNavigationActionRef = useRef<any>(null);

  // Refs for form field navigation
  const nameRef = useRef<TextInput>(null);
  const widthRef = useRef<TextInput>(null);
  const heightRef = useRef<TextInput>(null);
  const depthRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const notesCardRef = useRef<View>(null);
  const notesAccessoryID = useRef(`notes-${Math.random().toString(36).slice(2)}`).current;
  const bubbleWidth = 64;
  const bubbleLabelStyle = { textAlign: "center" as const, width: bubbleWidth, alignSelf: "center" as const, fontSize: 13, lineHeight: 15 };
  const bubbleLabelContainerStyle = { alignItems: "center" as const };
  const bubbleInputTextStyle = { textAlign: "right" as const };

  const arePhotosEqual = useCallback((current: RoomPhoto[] = [], stored: RoomPhoto[] = []) => {
    if (current.length !== stored.length) return false;
    return current.every((photo, index) => {
      const compare = stored[index];
      if (!compare) return false;
      return (
        photo.id === compare.id &&
        photo.uri === compare.uri &&
        photo.fileName === compare.fileName &&
        (photo.note || "") === (compare.note || "")
      );
    });
  }, []);

  const generatePhotoFileName = useCallback((builtInName: string, photoIndex: number): string => {
    const safeName = (builtInName || "BuiltIn").replace(/[^a-zA-Z0-9]/g, "_");
    const paddedIndex = String(photoIndex).padStart(2, "0");
    return `${safeName}_${paddedIndex}.jpg`;
  }, []);

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
      const hasChanges =
        name !== "" ||
        width !== "" ||
        height !== "" ||
        depth !== "" ||
        shelfCount !== "" ||
        cabinetDoorCount !== "" ||
        paintCabinetDoors ||
        notes !== "" ||
        photos.length > 0;
      setHasUnsavedChanges(hasChanges);
    } else {
      // For existing: changes are when values differ from stored data
      if (!builtIn) return;

      const storedWidth = builtIn.width && builtIn.width > 0
        ? formatMeasurementValue(builtIn.width / 12, "length", unitSystem, 2)
        : "";
      const storedHeight = builtIn.height && builtIn.height > 0
        ? formatMeasurementValue(builtIn.height / 12, "length", unitSystem, 2)
        : "";
      const storedDepth = builtIn.depth && builtIn.depth > 0
        ? formatMeasurementValue(builtIn.depth / 12, "length", unitSystem, 2)
        : "";
      const storedShelfCount = builtIn.shelfCount && builtIn.shelfCount > 0
        ? builtIn.shelfCount.toString()
        : "";
      const storedCabinetDoorCount = builtIn.cabinetDoorCount && builtIn.cabinetDoorCount > 0
        ? builtIn.cabinetDoorCount.toString()
        : "";
      const storedPaintCabinetDoors = builtIn.paintCabinetDoors ?? false;

      const hasChanges =
        name !== (builtIn.name || "") ||
        width !== storedWidth ||
        height !== storedHeight ||
        depth !== storedDepth ||
        shelfCount !== storedShelfCount ||
        cabinetDoorCount !== storedCabinetDoorCount ||
        paintCabinetDoors !== storedPaintCabinetDoors ||
        notes !== (builtIn.notes || "") ||
        !arePhotosEqual(photos, builtIn.photos || []);

      setHasUnsavedChanges(hasChanges);
    }
  }, [
    isNewBuiltIn,
    builtIn,
    name,
    width,
    height,
    depth,
    shelfCount,
    cabinetDoorCount,
    paintCabinetDoors,
    notes,
    photos,
    arePhotosEqual,
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

  const handleAddPhoto = useCallback(async (useCamera: boolean) => {
    try {
      setPhotoErrorMessage("");
      if (useCamera) {
        const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
        if (!cameraPermission.granted) {
          setPhotoErrorMessage("Camera permission is required to take photos.");
          return;
        }
      } else {
        const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!mediaPermission.granted) {
          setPhotoErrorMessage("Photo library permission is required to choose photos.");
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
      setPhotoErrorMessage("Unable to add photo. Please try again.");
    }
  }, [generatePhotoFileName, name, photos]);

  const handleDeletePhoto = useCallback((photoId: string) => {
    setDeletePhotoId(photoId);
  }, []);

  const confirmDeletePhoto = useCallback(() => {
    if (!deletePhotoId) return;
    setPhotos(photos.filter((p) => p.id !== deletePhotoId));
    setHasUnsavedChanges(true);
    setDeletePhotoId(null);
  }, [deletePhotoId, photos]);

  const handleEditPhotoNote = useCallback((photo: RoomPhoto) => {
    setEditingPhotoId(photo.id);
    setEditingPhotoNote(photo.note || "");
  }, []);

  const handleSavePhotoNote = useCallback(() => {
    if (!editingPhotoId) return;
    setPhotos(
      photos.map((p) =>
        p.id === editingPhotoId ? { ...p, note: editingPhotoNote.trim() || undefined } : p
      )
    );
    setHasUnsavedChanges(true);
    setEditingPhotoId(null);
    setEditingPhotoNote("");
  }, [editingPhotoId, editingPhotoNote, photos]);

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

    const hasAnyData =
      name !== "" ||
      width !== "" ||
      height !== "" ||
      depth !== "" ||
      shelfCount !== "" ||
      cabinetDoorCount !== "" ||
      paintCabinetDoors ||
      notes !== "" ||
      photos.length > 0;

    if (!hasAnyData) {
      Alert.alert("No Data Entered", "Please enter a name and at least one measurement before saving.");
      return;
    }

    const missingConfirmations = [];
    if (!detailsConfirmed) missingConfirmations.push("Built-In Details");

    if (missingConfirmations.length > 0) {
      setConfirmModalBody(`Please confirm: ${missingConfirmations.join(", ")}`);
      setConfirmModalVisible(true);
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
    const trimmedName = name.trim() || "BuiltIn";
    const updatedPhotos = photos.map((photo, index) => ({
      ...photo,
      fileName: generatePhotoFileName(trimmedName, index + 1),
    }));

    if (isNewBuiltIn) {
      // CREATE new built-in with data
      const newBuiltInId = addBuiltIn(projectId);

      // Then immediately update it with the entered data
      updateBuiltIn(projectId, newBuiltInId, {
        name: trimmedName,
        width: widthInches,
        height: heightInches,
        depth: depthInches,
        shelfCount: parseInt(shelfCount) || 0,
        cabinetDoorCount: parseInt(cabinetDoorCount) || 0,
        paintCabinetDoors,
        coats: 1,
        notes: notes.trim() || undefined,
        photos: updatedPhotos,
        detailsConfirmed,
      });
    } else {
      // UPDATE existing built-in
      updateBuiltIn(projectId, builtInId!, {
        name: trimmedName,
        width: widthInches,
        height: heightInches,
        depth: depthInches,
        shelfCount: parseInt(shelfCount) || 0,
        cabinetDoorCount: parseInt(cabinetDoorCount) || 0,
        paintCabinetDoors,
        coats: builtIn?.coats || 1,
        notes: notes.trim() || undefined,
        photos: updatedPhotos,
        detailsConfirmed,
      });
    }

    // Navigation happens automatically via useEffect when isSaving becomes true
  };

  const handleDiscardAndLeave = () => {
    // For new built-ins, nothing to delete (never created)
    // For existing built-ins, just go back without changes
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

  // Calculate total paintable area for shelves and sides (in sqft).
  const widthVal = parseDisplayValue(width, "length", unitSystem) || 0;
  const heightVal = parseDisplayValue(height, "length", unitSystem) || 0;
  const depthVal = parseDisplayValue(depth, "length", unitSystem) || 0;
  const shelfCountValue = parseInt(shelfCount) || 0;
  const shelfAreaSqFt = shelfCountValue > 0 ? shelfCountValue * widthVal * depthVal * 2 : 0;
  const sideAreaSqFt = 2 * (heightVal * depthVal);
  const totalPaintableArea = shelfAreaSqFt + sideAreaSqFt;

  const hasAnyDimensions = widthVal > 0 || heightVal > 0 || depthVal > 0;

  // If existing built-in not found, show error
  if (!isNewBuiltIn && !builtIn) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.backgroundWarmGray }}>
        <Text style={{ fontSize: Typography.h3.fontSize, color: Colors.mediumGray }}>Built-In not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: Colors.backgroundWarmGray }}>
      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
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
              {(name || "Unnamed Built-In") + "'s Details"}
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
          contentContainerStyle={{ padding: Spacing.md }}
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

          <View style={{ padding: 0 }}>
            {/* Built-In Information Card */}
            <Card style={{ marginBottom: Spacing.md, paddingBottom: Spacing.sm, backgroundColor: detailsConfirmed ? confirmedCardColor : Colors.white }}>
              {detailsExpanded ? (
                <Pressable
                  onPress={() => setDetailsExpanded(false)}
                  style={{
                    position: "absolute",
                    right: Spacing.md,
                    top: Spacing.sm,
                    width: 32,
                    height: 32,
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1,
                  }}
                >
                  <Ionicons name="chevron-up" size={24} color={Colors.mediumGray} />
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => setDetailsExpanded(true)}
                  style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 0 }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.darkCharcoal }}>
                      Built-In Details
                    </Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginTop: Spacing.xs }}>
                      Name and dimensions
                    </Text>
                  </View>
                  <Ionicons name="chevron-down" size={24} color={Colors.mediumGray} />
                </Pressable>
              )}

              {detailsExpanded && (
                <>
              {/* Name/Location */}
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

              {/* Row 1: Width, Height, Depth, Shelves */}
              <View style={{ flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.md }}>
                <View style={bubbleLabelContainerStyle}>
                  <FormInput
                    ref={widthRef}
                    previousFieldRef={nameRef}
                    label={`Width (${unitSystem === "metric" ? "m" : "ft"})`}
                    value={width}
                    onChangeText={setWidth}
                    keyboardType="numeric"
                    placeholder={unitSystem === "metric" ? "0.91" : "3"}
                    nextFieldRef={heightRef}
                    inputContainerStyle={{ width: bubbleWidth }}
                    inputTextStyle={bubbleInputTextStyle}
                    labelStyle={bubbleLabelStyle}
                    className="mb-0"
                  />
                </View>

                <View style={bubbleLabelContainerStyle}>
                  <FormInput
                    ref={heightRef}
                    previousFieldRef={widthRef}
                    label={`Height (${unitSystem === "metric" ? "m" : "ft"})`}
                    value={height}
                    onChangeText={setHeight}
                    keyboardType="numeric"
                    placeholder={unitSystem === "metric" ? "2.03" : "6.67"}
                    nextFieldRef={depthRef}
                    inputContainerStyle={{ width: bubbleWidth }}
                    inputTextStyle={bubbleInputTextStyle}
                    labelStyle={bubbleLabelStyle}
                    className="mb-0"
                  />
                </View>

                <View style={bubbleLabelContainerStyle}>
                  <FormInput
                    ref={depthRef}
                    previousFieldRef={heightRef}
                    label={`Depth (${unitSystem === "metric" ? "m" : "ft"})`}
                    value={depth}
                    onChangeText={setDepth}
                    keyboardType="numeric"
                    placeholder={unitSystem === "metric" ? "0.30" : "1"}
                    inputContainerStyle={{ width: bubbleWidth }}
                    inputTextStyle={bubbleInputTextStyle}
                    labelStyle={bubbleLabelStyle}
                    className="mb-0"
                  />
                </View>
                <View style={[bubbleLabelContainerStyle, { alignItems: "flex-end", marginLeft: "auto" }]}>
                  <Text style={[bubbleLabelStyle, { color: Colors.darkCharcoal, fontWeight: "500" as any }]}>
                    Shelves
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
                      marginTop: Spacing.xs,
                    }}
                  >
                    <Pressable
                      onPress={() => {
                        const current = parseInt(shelfCount) || 0;
                        setShelfCount(Math.max(0, current - 1).toString());
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Decrease shelf count"
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
                        {shelfCount || "0"}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => {
                        const current = parseInt(shelfCount) || 0;
                        setShelfCount((current + 1).toString());
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Increase shelf count"
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
              <View style={{ marginBottom: Spacing.sm }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500" as any, color: Colors.darkCharcoal }}>
                    Cabinet Door Count
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
                        const current = parseInt(cabinetDoorCount) || 0;
                        if (current > 0) {
                          setCabinetDoorCount((current - 1).toString());
                        }
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Decrease cabinet door count"
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
                        {cabinetDoorCount || "0"}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => {
                        const current = parseInt(cabinetDoorCount) || 0;
                        setCabinetDoorCount((current + 1).toString());
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Increase cabinet door count"
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
              <View style={{ marginBottom: Spacing.sm }}>
                <Toggle
                  label="Paint Cabinet Door"
                  value={paintCabinetDoors}
                  onValueChange={setPaintCabinetDoors}
                  className="mb-0"
                />
              </View>
              <View style={{ alignItems: "flex-end", marginTop: Spacing.sm, marginBottom: Spacing.sm }}>
                <Pressable
                  onPress={() => {
                    Keyboard.dismiss();
                    detailsSnapshotRef.current = detailsSnapshot;
                    setDetailsConfirmed(true);
                  }}
                  style={{
                    backgroundColor: detailsConfirmed ? Colors.success : Colors.primaryBlue,
                    borderRadius: 8,
                    paddingHorizontal: Spacing.sm,
                    paddingVertical: 10,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.white }}>
                    {detailsConfirmed ? "Confirmed" : "Confirm"}
                  </Text>
                </Pressable>
              </View>
              </>
              )}
            </Card>

            {/* Notes Section - Collapsable */}
            <View ref={notesCardRef}>
              <Card style={{ marginBottom: Spacing.md }}>
                <Pressable
                  onPress={() => setNotesExpanded(!notesExpanded)}
                  style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.darkCharcoal }}>
                      Notes
                    </Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginTop: Spacing.xs }}>
                      Built-in notes and reminders
                    </Text>
                  </View>
                  <Ionicons
                    name={notesExpanded ? "chevron-up" : "chevron-down"}
                    size={24}
                    color={Colors.mediumGray}
                  />
                </Pressable>

                {notesExpanded && (
                  <TextInput
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Add any notes about this built-in..."
                    placeholderTextColor={Colors.mediumGray}
                    multiline
                    numberOfLines={3}
                    blurOnSubmit
                    returnKeyType="done"
                    inputAccessoryViewID={Platform.OS === "ios" ? notesAccessoryID : undefined}
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
                        marginTop: Spacing.md,
                      }
                    ]}
                  />
                )}
              </Card>
            </View>

            {/* Built-In Photos */}
            <Card style={{ marginBottom: Spacing.md }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: photoErrorMessage !== "" || photos.length > 0 ? Spacing.md : 0,
                }}
              >
                <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.darkCharcoal }}>
                  {(name ? name : "Built-In") + "'s Photos"}
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

              {photoErrorMessage !== "" && (
                <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.error, marginBottom: Spacing.sm }}>
                  {photoErrorMessage}
                </Text>
              )}

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
                        <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.xs }}>
                          {photo.fileName}
                        </Text>

                        {photo.note ? (
                          <Text style={{ fontSize: Typography.body.fontSize, color: Colors.darkCharcoal, marginBottom: Spacing.sm }}>
                            {photo.note}
                          </Text>
                        ) : (
                          <Text style={{ fontSize: Typography.body.fontSize, color: Colors.mediumGray, fontStyle: "italic", marginBottom: Spacing.sm }}>
                            No note added
                          </Text>
                        )}

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
                      </View>
                    </View>
                  ))}
                </View>
              )}

            </Card>

            {/* Built-In Summary */}
            {(() => {
              const cabinetDoorCountValue = parseInt(cabinetDoorCount) || 0;
              const hasPricingInputs = cabinetDoorCountValue > 0 || shelfCountValue > 0 || totalPaintableArea > 0;
              if (!hasPricingInputs) return null;

              const cabinetCoats = builtIn?.coats || 1;
              const cabinetLaborMultiplier = cabinetCoats <= 1 ? 1 : safeNumber(pricing.secondCoatLaborMultiplier, 2.0);
              const cabinetDoorLaborCost = cabinetDoorCountValue * safeNumber(pricing.cabinetDoorLabor, 0) * cabinetLaborMultiplier;
              const shelfLaborCost = shelfCountValue * safeNumber(pricing.builtInShelfLabor, 0) * cabinetLaborMultiplier;
              const cabinetCoverage = Math.max(1, safeNumber(cabinetPaintCoverageSqFtPerGallon, 350));
              const cabinetDoorAreaSqFt = cabinetDoorCountValue * (calcSettings.doorHeight * calcSettings.doorWidth);
              const cabinetDoorGallons = (cabinetDoorAreaSqFt / cabinetCoverage) * cabinetCoats;
              const cabinetDoorMaterialsCost = Math.ceil(cabinetDoorGallons) * safeNumber(pricing.cabinetPaintPerGallon, 0);
              const shelfSurfaceGallons = (totalPaintableArea / cabinetCoverage) * cabinetCoats;
              const shelfSurfaceMaterialsCost = Math.ceil(shelfSurfaceGallons) * safeNumber(pricing.cabinetPaintPerGallon, 0);

              const laborTotal = (paintCabinetDoors ? cabinetDoorLaborCost : 0) + shelfLaborCost;
              const materialsTotal = (paintCabinetDoors ? cabinetDoorMaterialsCost : 0) + shelfSurfaceMaterialsCost;
              const totalCost = Math.round(laborTotal + materialsTotal);

              return (
                <Card style={{ marginBottom: Spacing.md }}>
                  <Text style={Typography.h2}>Built-In Summary</Text>

                  <View style={{ flexDirection: "row", gap: Spacing.sm }}>
                    <View style={{ flex: 3, backgroundColor: Colors.backgroundWarmGray, borderRadius: 8, padding: Spacing.md }}>
                      <View style={{ marginBottom: Spacing.xs }}>
                        <Text style={{ fontSize: 13, color: "transparent" }}>-</Text>
                      </View>

                      {cabinetDoorCountValue > 0 && (
                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                          <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>Cabinet Doors</Text>
                          <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>{cabinetDoorCountValue}</Text>
                        </View>
                      )}

                      {shelfCountValue > 0 && (
                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                          <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>Shelves</Text>
                          <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>{shelfCountValue}</Text>
                        </View>
                      )}

                      {shelfAreaSqFt > 0 && (
                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                          <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>Shelf Area</Text>
                          <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>
                            {formatMeasurement(Math.ceil(shelfAreaSqFt), "area", unitSystem, 0)}
                          </Text>
                        </View>
                      )}

                      {sideAreaSqFt > 0 && (
                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                          <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>Side Area</Text>
                          <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>
                            {formatMeasurement(Math.ceil(sideAreaSqFt), "area", unitSystem, 0)}
                          </Text>
                        </View>
                      )}

                      {totalPaintableArea > 0 && (
                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                          <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>Paint Area</Text>
                          <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>
                            {formatMeasurement(Math.ceil(totalPaintableArea), "area", unitSystem, 0)}
                          </Text>
                        </View>
                      )}

                      {totalPaintableArea > 0 && (
                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                          <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>Paint Gallons</Text>
                          <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>
                            {shelfSurfaceGallons.toFixed(2)}
                          </Text>
                        </View>
                      )}

                      <View style={{ height: 1, backgroundColor: Colors.neutralGray, marginVertical: Spacing.xs }} />

                      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <Text style={{ fontSize: 13, fontWeight: "700" as any, color: Colors.darkCharcoal }}>Total Items:</Text>
                        <Text style={{ fontSize: 13, fontWeight: "700" as any, color: Colors.darkCharcoal }}>
                          {cabinetDoorCountValue + shelfCountValue}
                        </Text>
                      </View>
                    </View>

                    <View style={{ flex: 2, backgroundColor: "#E3F2FD", borderRadius: 8, padding: Spacing.md }}>
                      <View style={{ flexDirection: "row", gap: Spacing.xs, marginBottom: Spacing.xs }}>
                        <Text style={{ flex: 1, fontSize: 13, color: Colors.mediumGray, textAlign: "right" }}>Labor</Text>
                        <Text style={{ flex: 1, fontSize: 13, color: Colors.mediumGray, textAlign: "right" }}>Mat</Text>
                      </View>

                      <View style={{ flexDirection: "row", gap: Spacing.xs, marginBottom: Spacing.xs }}>
                        <Text style={{ flex: 1, fontSize: 13, color: Colors.darkCharcoal, textAlign: "right" }}>
                          ${Math.round(laborTotal)}
                        </Text>
                        <Text style={{ flex: 1, fontSize: 13, color: Colors.darkCharcoal, textAlign: "right" }}>
                          ${Math.round(materialsTotal)}
                        </Text>
                      </View>

                      <View style={{ height: 1, backgroundColor: "#90CAF9", marginVertical: Spacing.xs }} />

                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={{ fontSize: 13, fontWeight: "700" as any, color: Colors.darkCharcoal }}>Total:</Text>
                        <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: "700" as any, color: Colors.primaryBlue }}>
                          ${totalCost.toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Card>
              );
            })()}

            {/* Test Mode: Detailed Calculation Breakdown */}
            {testMode && (() => {
              const cabinetDoorCountValue = parseInt(cabinetDoorCount) || 0;
              const hasPricingInputs = cabinetDoorCountValue > 0 || shelfCountValue > 0 || totalPaintableArea > 0;
              if (!hasPricingInputs) return null;

              const cabinetCoats = builtIn?.coats || 1;
              const cabinetLaborMultiplier = cabinetCoats <= 1 ? 1 : safeNumber(pricing.secondCoatLaborMultiplier, 2.0);
              const cabinetCoverage = Math.max(1, safeNumber(cabinetPaintCoverageSqFtPerGallon, 350));
              const cabinetDoorAreaSqFt = cabinetDoorCountValue * (calcSettings.doorHeight * calcSettings.doorWidth);
              const cabinetDoorGallons = (cabinetDoorAreaSqFt / cabinetCoverage) * cabinetCoats;
              const cabinetDoorLaborTotal = paintCabinetDoors
                ? cabinetDoorCountValue * safeNumber(pricing.cabinetDoorLabor, 0) * cabinetLaborMultiplier
                : 0;
              const shelfLaborTotal = shelfCountValue * safeNumber(pricing.builtInShelfLabor, 0) * cabinetLaborMultiplier;
              const cabinetDoorMaterialsTotal = paintCabinetDoors
                ? Math.ceil(cabinetDoorGallons) * safeNumber(pricing.cabinetPaintPerGallon, 0)
                : 0;
              const shelfSurfaceGallons = (totalPaintableArea / cabinetCoverage) * cabinetCoats;
              const shelfSurfaceMaterialsTotal = Math.ceil(shelfSurfaceGallons) * safeNumber(pricing.cabinetPaintPerGallon, 0);
              const laborTotal = cabinetDoorLaborTotal + shelfLaborTotal;
              const materialsTotal = cabinetDoorMaterialsTotal + shelfSurfaceMaterialsTotal;

              return (
                <Card style={{ marginBottom: Spacing.md }}>
                  <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.error, marginBottom: Spacing.md }}>
                    TEST MODE: Calculation Details
                  </Text>

                  <View style={{ backgroundColor: Colors.backgroundWarmGray, borderRadius: 8, padding: Spacing.md }}>
                    {cabinetDoorCountValue > 0 && (
                      <View style={{ marginBottom: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.neutralGray }}>
                        <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                          Cabinet Doors
                        </Text>
                        <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                          Count: {cabinetDoorCountValue} | Coats: {cabinetCoats}
                        </Text>
                        <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                          Area: {cabinetDoorCountValue} x {calcSettings.doorHeight.toFixed(2)} x {calcSettings.doorWidth.toFixed(2)} = {cabinetDoorAreaSqFt.toFixed(2)} sqft
                        </Text>
                        <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                          Labor: {cabinetDoorCountValue} x ${safeNumber(pricing.cabinetDoorLabor, 0).toFixed(2)}/door x {cabinetLaborMultiplier.toFixed(2)} = {cabinetDoorLaborTotal.toFixed(2)}
                        </Text>
                        <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                          Materials: {Math.ceil(cabinetDoorGallons).toFixed(0)} gal x ${safeNumber(pricing.cabinetPaintPerGallon, 0).toFixed(2)}/gal = {cabinetDoorMaterialsTotal.toFixed(2)}
                        </Text>
                      </View>
                    )}

                    {shelfCountValue > 0 && (
                      <View style={{ marginBottom: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.neutralGray }}>
                        <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                          Shelves
                        </Text>
                        <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                          Count: {shelfCountValue} | Coats: {cabinetCoats}
                        </Text>
                        <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                          Area: {shelfCountValue} x {widthVal.toFixed(2)} x {depthVal.toFixed(2)} x 2 = {shelfAreaSqFt.toFixed(2)} sqft
                        </Text>
                        <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                          Labor: {shelfCountValue} x ${safeNumber(pricing.builtInShelfLabor, 0).toFixed(2)} x {cabinetLaborMultiplier.toFixed(2)} = {shelfLaborTotal.toFixed(2)}
                        </Text>
                      </View>
                    )}

                    {totalPaintableArea > 0 && (
                      <View style={{ marginBottom: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.neutralGray }}>
                        <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                          Built-In Surfaces
                        </Text>
                        <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                          Side Area: 2 x {heightVal.toFixed(2)} x {depthVal.toFixed(2)} = {sideAreaSqFt.toFixed(2)} sqft
                        </Text>
                        <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                          Total Area: {shelfAreaSqFt.toFixed(2)} + {sideAreaSqFt.toFixed(2)} = {totalPaintableArea.toFixed(2)} sqft
                        </Text>
                        <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                          Gallons: {totalPaintableArea.toFixed(2)} / {cabinetCoverage.toFixed(2)} x {cabinetCoats} = {shelfSurfaceGallons.toFixed(2)}
                        </Text>
                        <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                          Materials: {Math.ceil(shelfSurfaceGallons).toFixed(0)} gal x ${safeNumber(pricing.cabinetPaintPerGallon, 0).toFixed(2)}/gal = {shelfSurfaceMaterialsTotal.toFixed(2)}
                        </Text>
                      </View>
                    )}

                    <View>
                      <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "700" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                        Totals
                      </Text>
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                        Total Labor: ${laborTotal.toFixed(2)}
                      </Text>
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                        Total Materials: ${materialsTotal.toFixed(2)}
                      </Text>
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                        Grand Total: ${(laborTotal + materialsTotal).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </Card>
              );
            })()}

            <Pressable
              onPress={handleSave}
              disabled={isSaving}
              style={{
                backgroundColor: isSaving ? Colors.mediumGray : Colors.primaryBlue,
                borderRadius: 8,
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

        {Platform.OS === "ios" && (
          <InputAccessoryView nativeID={notesAccessoryID}>
            <View style={{ backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.neutralGray, padding: Spacing.sm, alignItems: "flex-end" }}>
              <Pressable
                onPress={() => Keyboard.dismiss()}
                style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}
                accessibilityRole="button"
                accessibilityLabel="Done editing notes"
              >
                <Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" as any }}>
                  Done
                </Text>
              </Pressable>
            </View>
          </InputAccessoryView>
        )}

        <Modal
          visible={confirmModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setConfirmModalVisible(false)}
        >
          <View style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.4)", justifyContent: "center", padding: Spacing.lg }}>
            <Pressable
              onPress={() => setConfirmModalVisible(false)}
              style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
            />
            <View style={{ backgroundColor: Colors.white, borderRadius: BorderRadius.default, padding: Spacing.lg, ...Shadows.card }}>
              <Text style={{ fontSize: Typography.h3.fontSize, fontWeight: Typography.h3.fontWeight as any, color: Colors.darkCharcoal, marginBottom: Spacing.sm }}>
                Confirm Required
              </Text>
              <Text style={{ fontSize: Typography.body.fontSize, color: Colors.mediumGray, marginBottom: Spacing.lg }}>
                {confirmModalBody}
              </Text>
              <Pressable
                onPress={() => setConfirmModalVisible(false)}
                style={{ backgroundColor: Colors.primaryBlue, borderRadius: BorderRadius.default, paddingVertical: Spacing.sm, alignItems: "center" }}
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

        {/* Edit Photo Note Modal */}
        <Modal
          visible={editingPhotoId !== null}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setEditingPhotoId(null);
            setEditingPhotoNote("");
          }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
          >
            <Pressable
              style={{
                flex: 1,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                alignItems: "center",
                justifyContent: "center",
              }}
              onPress={() => {
                setEditingPhotoId(null);
                setEditingPhotoNote("");
              }}
            >
              <Pressable
                style={{
                  backgroundColor: Colors.white,
                  borderRadius: 8,
                  marginHorizontal: Spacing.lg,
                  padding: Spacing.lg,
                  width: "90%",
                  maxWidth: 400,
                  ...Shadows.card,
                }}
                onPress={(e) => e.stopPropagation()}
              >
                <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                  Photo Note
                </Text>
                <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.md }}>
                  Add notes about finish details or repairs.
                </Text>

                <TextInput
                  value={editingPhotoNote}
                  onChangeText={setEditingPhotoNote}
                  placeholder="e.g., Touch-up needed on lower shelf"
                  placeholderTextColor={Colors.mediumGray}
                  multiline
                  numberOfLines={4}
                  style={[
                    TextInputStyles.multiline,
                    {
                      backgroundColor: Colors.backgroundWarmGray,
                      marginBottom: Spacing.md,
                      minHeight: 100,
                    }
                  ]}
                  autoFocus
                />

                <View style={{ flexDirection: "row", gap: Spacing.sm }}>
                  <Pressable
                    onPress={() => {
                      setEditingPhotoId(null);
                      setEditingPhotoNote("");
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: Colors.neutralGray,
                      borderRadius: 8,
                      paddingVertical: Spacing.md,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal }}>
                      Cancel
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleSavePhotoNote}
                    style={{
                      flex: 1,
                      backgroundColor: Colors.primaryBlue,
                      borderRadius: 8,
                      paddingVertical: Spacing.md,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.white }}>
                      Save Note
                    </Text>
                  </Pressable>
                </View>
              </Pressable>
            </Pressable>
          </KeyboardAvoidingView>
        </Modal>

        {/* Delete Photo Confirmation */}
        <Modal
          visible={deletePhotoId !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setDeletePhotoId(null)}
        >
          <Pressable
            style={{
              flex: 1,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              alignItems: "center",
              justifyContent: "center",
            }}
            onPress={() => setDeletePhotoId(null)}
          >
            <Pressable
              style={{
                backgroundColor: Colors.white,
                borderRadius: 8,
                marginHorizontal: Spacing.lg,
                padding: Spacing.lg,
                width: "90%",
                maxWidth: 360,
                ...Shadows.card,
              }}
              onPress={(e) => e.stopPropagation()}
            >
              <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                Delete Photo
              </Text>
              <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.md }}>
                This photo and its note will be removed.
              </Text>

              <View style={{ flexDirection: "row", gap: Spacing.sm }}>
                <Pressable
                  onPress={() => setDeletePhotoId(null)}
                  style={{
                    flex: 1,
                    backgroundColor: Colors.neutralGray,
                    borderRadius: 8,
                    paddingVertical: Spacing.md,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal }}>
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  onPress={confirmDeletePhoto}
                  style={{
                    flex: 1,
                    backgroundColor: Colors.error,
                    borderRadius: 8,
                    paddingVertical: Spacing.md,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.white }}>
                    Delete
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
