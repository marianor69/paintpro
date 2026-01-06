import React, { useState, useEffect, useRef, useCallback, useId } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  Modal,
  Keyboard,
  InputAccessoryView,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { usePreventRemove } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/RootNavigator";
import { useProjectStore } from "../state/projectStore";
import { usePricingStore } from "../state/pricingStore";
import { useCalculationSettings } from "../state/calculationStore";
import { useAppSettings } from "../state/appSettings";
import { formatMeasurementValue, parseDisplayValue, formatMeasurement } from "../utils/unitConversion";
import * as ImagePicker from "expo-image-picker";
import { v4 as uuidv4 } from "uuid";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius, Shadows, TextInputStyles } from "../utils/designSystem";
import { Card } from "../components/Card";
import { Toggle } from "../components/Toggle";
import { NumericInput } from "../components/NumericInput";
import { FormInput } from "../components/FormInput";
import { SavePromptModal } from "../components/SavePromptModal";
import { RoomPhoto, IrregularRoomWall } from "../types/painting";
import { SafeAreaView } from "react-native-safe-area-context";
import { formatCurrency, safeNumber } from "../utils/calculations";

type Props = NativeStackScreenProps<RootStackParamList, "IrregularRoomEditor">;

interface WallState {
  id: string;
  width: string;
  height: string;
  area: string;
}

export default function IrregularRoomEditorScreen({ route, navigation }: Props) {
  const { projectId, irregularRoomId } = route.params;
  const isNew = !irregularRoomId;

  const project = useProjectStore((s) => s.projects.find((p) => p.id === projectId));
  const irregularRoom = !isNew
    ? project?.irregularRooms?.find((ir) => ir.id === irregularRoomId)
    : undefined;

  const addIrregularRoom = useProjectStore((s) => s.addIrregularRoom);
  const updateIrregularRoom = useProjectStore((s) => s.updateIrregularRoom);

  const pricing = usePricingStore((s) => s.settings);
  const unitSystem = useCalculationSettings((s) => s.unitSystem);
  const testMode = useAppSettings((s) => s.testMode);

  // Default wall height from project
  const defaultHeight = project?.floorHeights?.[0] || 8;

  // Form state
  const [name, setName] = useState(!isNew && irregularRoom?.name ? irregularRoom.name : "");

  // Walls state - array of walls with width, height, and area
  const [walls, setWalls] = useState<WallState[]>(() => {
    if (!isNew && irregularRoom?.walls && irregularRoom.walls.length > 0) {
      return irregularRoom.walls.map(w => {
        const widthVal = w.width > 0 ? formatMeasurementValue(w.width, "length", unitSystem, 2) : "";
        const heightVal = w.height > 0 ? formatMeasurementValue(w.height, "length", unitSystem, 2) : "";
        const areaVal = w.width > 0 && w.height > 0 ? (w.width * w.height).toFixed(1) : "";
        return {
          id: w.id,
          width: widthVal,
          height: heightVal,
          area: areaVal,
        };
      });
    }
    // Start with one empty wall - use raw defaultHeight value (already in imperial feet)
    return [{ id: uuidv4(), width: "", height: defaultHeight.toString(), area: "" }];
  });

  // Cathedral ceiling
  const [isCathedral, setIsCathedral] = useState(!isNew && irregularRoom?.ceilingType === "cathedral" ? true : false);
  const [cathedralPeakHeight, setCathedralPeakHeight] = useState(!isNew && irregularRoom?.cathedralPeakHeight ? formatMeasurementValue(irregularRoom.cathedralPeakHeight, "length", unitSystem, 2) : "");

  // Openings & Closets
  const [windowCount, setWindowCount] = useState(!isNew && irregularRoom?.windowCount ? irregularRoom.windowCount.toString() : "");
  const [doorCount, setDoorCount] = useState(!isNew && irregularRoom?.doorCount ? irregularRoom.doorCount.toString() : "");
  const [hasCloset, setHasCloset] = useState(!isNew && irregularRoom?.hasCloset ? irregularRoom.hasCloset : false);
  const [singleDoorClosets, setSingleDoorClosets] = useState(!isNew && irregularRoom?.singleDoorClosets ? irregularRoom.singleDoorClosets.toString() : "");
  const [doubleDoorClosets, setDoubleDoorClosets] = useState(!isNew && irregularRoom?.doubleDoorClosets ? irregularRoom.doubleDoorClosets.toString() : "");
  const [includeClosetInteriorInQuote, setIncludeClosetInteriorInQuote] = useState(!isNew && irregularRoom?.includeClosetInteriorInQuote !== undefined ? irregularRoom.includeClosetInteriorInQuote : project?.projectIncludeClosetInteriorInQuote ?? true);

  // Paint options
  const [paintWalls, setPaintWalls] = useState(!isNew ? irregularRoom?.paintWalls ?? true : project?.globalPaintDefaults?.paintWalls ?? true);
  const [paintCeilings, setPaintCeilings] = useState(!isNew ? irregularRoom?.paintCeilings ?? true : project?.globalPaintDefaults?.paintCeilings ?? true);
  const [paintWindowFrames, setPaintWindowFrames] = useState(!isNew ? irregularRoom?.paintWindowFrames ?? true : project?.globalPaintDefaults?.paintWindowFrames ?? true);
  const [paintDoorFrames, setPaintDoorFrames] = useState(!isNew ? irregularRoom?.paintDoorFrames ?? true : project?.globalPaintDefaults?.paintDoorFrames ?? true);
  const [paintWindows, setPaintWindows] = useState(!isNew ? irregularRoom?.paintWindows ?? false : project?.globalPaintDefaults?.paintWindows ?? false);
  const [paintDoors, setPaintDoors] = useState(!isNew ? irregularRoom?.paintDoors ?? true : project?.globalPaintDefaults?.paintDoors ?? true);
  const [paintJambs, setPaintJambs] = useState(!isNew ? irregularRoom?.paintJambs ?? true : project?.globalPaintDefaults?.paintDoorJambs ?? true);
  const [paintBaseboard, setPaintBaseboard] = useState(!isNew ? irregularRoom?.paintBaseboard ?? true : project?.globalPaintDefaults?.paintBaseboards ?? true);
  const [hasCrownMoulding, setHasCrownMoulding] = useState(!isNew ? irregularRoom?.hasCrownMoulding ?? true : project?.globalPaintDefaults?.paintCrownMoulding ?? true);
  const [hasAccentWall, setHasAccentWall] = useState(!isNew ? irregularRoom?.hasAccentWall ?? false : false);

  // Notes and Photos
  const [notes, setNotes] = useState(!isNew && irregularRoom?.notes ? irregularRoom.notes : "");
  const [photos, setPhotos] = useState<RoomPhoto[]>(!isNew && irregularRoom?.photos ? irregularRoom.photos : []);

  // Photo modal state
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [photoNote, setPhotoNote] = useState("");

  // Unsaved changes tracking
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isKeyboardVisibleRef = useRef(false);
  const pendingSavePromptRef = useRef(false);
  const preventedNavigationActionRef = useRef<any>(null);

  // Refs
  const nameRef = useRef<TextInput>(null);
  const cathedralPeakHeightRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Wall input refs - stored by wall id
  const wallWidthRefs = useRef<Map<string, TextInput>>(new Map());
  const wallHeightRefs = useRef<Map<string, TextInput>>(new Map());
  const wallAreaRefs = useRef<Map<string, TextInput>>(new Map());

  // Track focused wall input
  const [focusedWall, setFocusedWall] = useState<{ wallId: string; field: "width" | "height" | "area" } | null>(null);

  const nameAccessoryID = useId();
  const wallInputAccessoryID = useId();

  // Calculate total area from all walls - use area field directly (may be from width×height or manual entry)
  const totalArea = walls.reduce((sum, wall) => {
    const areaVal = parseFloat(wall.area) || 0;
    return sum + areaVal;
  }, 0);

  // Navigate from room name to first wall's width
  const handleNameNextPress = useCallback(() => {
    if (walls.length > 0) {
      const firstWallId = walls[0].id;
      wallWidthRefs.current.get(firstWallId)?.focus();
    } else {
      Keyboard.dismiss();
    }
  }, [walls]);

  // Validation: check if all walls have valid dimensions
  const hasValidDimensions = walls.every(wall => {
    const hasWidthAndHeight = parseFloat(wall.width) > 0 && parseFloat(wall.height) > 0;
    const hasArea = parseFloat(wall.area) > 0;
    return hasWidthAndHeight || hasArea;
  });

  // Blur focused input helper
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
    if (isNew) {
      // For new: changes are when user enters any data
      const hasChanges =
        name !== "" ||
        walls.some(w => w.width !== "" || w.height !== defaultHeight.toString() || w.area !== "") ||
        isCathedral ||
        cathedralPeakHeight !== "" ||
        windowCount !== "" ||
        doorCount !== "" ||
        hasCloset ||
        notes !== "" ||
        photos.length > 0;
      setHasUnsavedChanges(hasChanges);
    } else {
      // For existing: changes when values differ from stored data
      if (!irregularRoom) return;
      const hasChanges =
        name !== (irregularRoom.name || "") ||
        JSON.stringify(walls.map(w => ({ width: w.width, height: w.height, area: w.area }))) !==
        JSON.stringify(irregularRoom.walls.map(w => ({
          width: w.width > 0 ? formatMeasurementValue(w.width, "length", unitSystem, 2) : "",
          height: w.height > 0 ? formatMeasurementValue(w.height, "length", unitSystem, 2) : "",
          area: w.width > 0 && w.height > 0 ? (w.width * w.height).toFixed(1) : ""
        }))) ||
        isCathedral !== (irregularRoom.ceilingType === "cathedral") ||
        notes !== (irregularRoom.notes || "") ||
        photos.length !== (irregularRoom.photos?.length || 0);
      setHasUnsavedChanges(hasChanges);
    }
  }, [isNew, irregularRoom, name, walls, isCathedral, cathedralPeakHeight, windowCount, doorCount, hasCloset, notes, photos, unitSystem, defaultHeight]);

  // Keyboard listeners
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

  // Gesture listener - blur inputs on back swipe
  useEffect(() => {
    const unsubscribe = navigation.addListener("gestureStart", () => {
      if (isKeyboardVisibleRef.current) {
        blurFocusedInput();
        Keyboard.dismiss();
      }
    });

    return unsubscribe;
  }, [navigation, blurFocusedInput]);

  // Prevent navigation when there are unsaved changes
  usePreventRemove(hasUnsavedChanges && !isSaving, ({ data }) => {
    if (!isSaving) {
      preventedNavigationActionRef.current = data.action;

      if (isKeyboardVisibleRef.current) {
        pendingSavePromptRef.current = true;
        Keyboard.dismiss();
      } else {
        setShowSavePrompt(true);
      }
    }
  });

  // Update header title
  useEffect(() => {
    const displayName = name || "Unnamed Irregular Room";
    navigation.setOptions({
      title: displayName + "'s Details",
    });
  }, [name, navigation]);

  // Wall management functions
  const handleAddWall = () => {
    setWalls([...walls, {
      id: uuidv4(),
      width: "",
      height: defaultHeight.toString(),
      area: ""
    }]);
  };

  const handleRemoveWall = (wallId: string) => {
    if (walls.length <= 1) {
      Alert.alert("Cannot Remove", "You need at least one wall.");
      return;
    }
    setWalls(walls.filter(w => w.id !== wallId));
  };

  const handleWallWidthChange = (wallId: string, value: string) => {
    setWalls(walls.map(w => {
      if (w.id !== wallId) return w;
      // Auto-calculate area when both width and height have values
      const newWidth = value;
      const widthNum = parseFloat(newWidth);
      const heightNum = parseFloat(w.height);
      const newArea = (!isNaN(widthNum) && widthNum > 0 && !isNaN(heightNum) && heightNum > 0)
        ? (widthNum * heightNum).toFixed(1)
        : "";
      return { ...w, width: newWidth, area: newArea };
    }));
  };

  const handleWallHeightChange = (wallId: string, value: string) => {
    setWalls(walls.map(w => {
      if (w.id !== wallId) return w;
      // Auto-calculate area when both width and height have values
      const newHeight = value;
      const widthNum = parseFloat(w.width);
      const heightNum = parseFloat(newHeight);
      const newArea = (!isNaN(widthNum) && widthNum > 0 && !isNaN(heightNum) && heightNum > 0)
        ? (widthNum * heightNum).toFixed(1)
        : "";
      return { ...w, height: newHeight, area: newArea };
    }));
  };

  const handleWallAreaChange = (wallId: string, value: string) => {
    setWalls(walls.map(w => {
      if (w.id !== wallId) return w;
      // If user enters area directly, clear width and height
      if (value.trim()) {
        return { ...w, width: "", height: "", area: value };
      }
      return { ...w, area: value };
    }));
  };

  // Wall keyboard navigation helpers
  const getWallInputSequence = useCallback(() => {
    // Returns flat array of {wallId, field} in order: width0, height0, area0, width1, height1, area1, ...
    const sequence: { wallId: string; field: "width" | "height" | "area" }[] = [];
    walls.forEach(wall => {
      sequence.push({ wallId: wall.id, field: "width" });
      sequence.push({ wallId: wall.id, field: "height" });
      sequence.push({ wallId: wall.id, field: "area" });
    });
    return sequence;
  }, [walls]);

  const handleWallPrevious = useCallback(() => {
    if (!focusedWall) return;
    const sequence = getWallInputSequence();
    const currentIndex = sequence.findIndex(
      s => s.wallId === focusedWall.wallId && s.field === focusedWall.field
    );
    if (currentIndex > 0) {
      const prev = sequence[currentIndex - 1];
      const refMap = prev.field === "width" ? wallWidthRefs : prev.field === "height" ? wallHeightRefs : wallAreaRefs;
      refMap.current.get(prev.wallId)?.focus();
    }
  }, [focusedWall, getWallInputSequence]);

  const handleWallNext = useCallback(() => {
    if (!focusedWall) return;
    const sequence = getWallInputSequence();
    const currentIndex = sequence.findIndex(
      s => s.wallId === focusedWall.wallId && s.field === focusedWall.field
    );
    if (currentIndex < sequence.length - 1) {
      const next = sequence[currentIndex + 1];
      const refMap = next.field === "width" ? wallWidthRefs : next.field === "height" ? wallHeightRefs : wallAreaRefs;
      refMap.current.get(next.wallId)?.focus();
    } else {
      Keyboard.dismiss();
    }
  }, [focusedWall, getWallInputSequence]);

  const isFirstWallInput = useCallback(() => {
    if (!focusedWall) return true;
    const sequence = getWallInputSequence();
    const currentIndex = sequence.findIndex(
      s => s.wallId === focusedWall.wallId && s.field === focusedWall.field
    );
    return currentIndex === 0;
  }, [focusedWall, getWallInputSequence]);

  const isLastWallInput = useCallback(() => {
    if (!focusedWall) return false;
    const sequence = getWallInputSequence();
    const currentIndex = sequence.findIndex(
      s => s.wallId === focusedWall.wallId && s.field === focusedWall.field
    );
    return currentIndex === sequence.length - 1;
  }, [focusedWall, getWallInputSequence]);

  const handleSave = useCallback(() => {
    // Validate dimensions before saving
    if (!hasValidDimensions) {
      Alert.alert(
        "Missing Dimensions",
        "Each wall must have either Width and Height, or Area entered.",
        [{ text: "OK" }]
      );
      return;
    }

    setIsSaving(true);

    // Convert walls to the proper format
    // If only area was entered, we'll store the area value as width×1 for calculations
    const wallsData: IrregularRoomWall[] = walls.map(w => {
      const widthVal = parseDisplayValue(w.width, "length", unitSystem);
      const heightVal = parseDisplayValue(w.height, "length", unitSystem);
      const areaVal = parseFloat(w.area) || 0;

      // If width and height are both 0 but area exists, use area as width with height=1
      if (widthVal === 0 && heightVal === 0 && areaVal > 0) {
        return {
          id: w.id,
          width: areaVal,
          height: 1,
        };
      }
      return {
        id: w.id,
        width: widthVal,
        height: heightVal,
      };
    });

    const cathedralPeakValue = isCathedral ? parseDisplayValue(cathedralPeakHeight, "length", unitSystem) : undefined;

    const data = {
      name,
      walls: wallsData,
      ceilingType: isCathedral ? "cathedral" as const : "flat" as const,
      cathedralPeakHeight: cathedralPeakValue,
      windowCount: parseInt(windowCount) || 0,
      doorCount: parseInt(doorCount) || 0,
      hasCloset,
      singleDoorClosets: hasCloset ? parseInt(singleDoorClosets) || 0 : 0,
      doubleDoorClosets: hasCloset ? parseInt(doubleDoorClosets) || 0 : 0,
      includeClosetInteriorInQuote,
      paintWalls,
      paintCeilings,
      paintWindowFrames,
      paintDoorFrames,
      paintWindows,
      paintDoors,
      paintJambs,
      paintBaseboard,
      hasCrownMoulding,
      hasAccentWall,
      notes,
      photos,
    };

    if (isNew) {
      const newId = addIrregularRoom(projectId);
      updateIrregularRoom(projectId, newId, data);
    } else {
      updateIrregularRoom(projectId, irregularRoomId!, data);
    }

    setHasUnsavedChanges(false);
    navigation.goBack();
  }, [
    name, walls, isCathedral, cathedralPeakHeight,
    windowCount, doorCount, hasCloset, singleDoorClosets, doubleDoorClosets,
    includeClosetInteriorInQuote, paintWalls, paintCeilings, paintWindowFrames,
    paintDoorFrames, paintWindows, paintDoors, paintJambs, paintBaseboard,
    hasCrownMoulding, hasAccentWall, notes, photos,
    isNew, projectId, irregularRoomId, unitSystem, addIrregularRoom, updateIrregularRoom, navigation, hasValidDimensions
  ]);

  // Photo functions
  const handleAddPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const photoNumber = photos.length + 1;
      const roomName = name || "IrregularRoom";
      const newPhoto: RoomPhoto = {
        id: uuidv4(),
        uri: result.assets[0].uri,
        fileName: `${roomName.replace(/\s+/g, "_")}_${photoNumber.toString().padStart(2, "0")}.jpg`,
        createdAt: Date.now(),
      };
      setPhotos([...photos, newPhoto]);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Camera permission is required to take photos");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const photoNumber = photos.length + 1;
      const roomName = name || "IrregularRoom";
      const newPhoto: RoomPhoto = {
        id: uuidv4(),
        uri: result.assets[0].uri,
        fileName: `${roomName.replace(/\s+/g, "_")}_${photoNumber.toString().padStart(2, "0")}.jpg`,
        createdAt: Date.now(),
      };
      setPhotos([...photos, newPhoto]);
    }
  };

  const handlePhotoPress = (index: number) => {
    setSelectedPhotoIndex(index);
    setPhotoNote(photos[index].note || "");
    setPhotoModalVisible(true);
  };

  const handleSavePhotoNote = () => {
    if (selectedPhotoIndex !== null) {
      const updatedPhotos = [...photos];
      updatedPhotos[selectedPhotoIndex] = {
        ...updatedPhotos[selectedPhotoIndex],
        note: photoNote,
      };
      setPhotos(updatedPhotos);
    }
    setPhotoModalVisible(false);
    setSelectedPhotoIndex(null);
    setPhotoNote("");
  };

  const handleDeletePhoto = () => {
    if (selectedPhotoIndex !== null) {
      const updatedPhotos = photos.filter((_, idx) => idx !== selectedPhotoIndex);
      setPhotos(updatedPhotos);
    }
    setPhotoModalVisible(false);
    setSelectedPhotoIndex(null);
    setPhotoNote("");
  };

  // Save prompt handlers
  const handleSaveFromPrompt = useCallback(() => {
    // Close modal immediately to prevent double-clicks
    setShowSavePrompt(false);
    handleSave();
  }, [handleSave]);

  const handleDiscardFromPrompt = useCallback(() => {
    setShowSavePrompt(false);
    setHasUnsavedChanges(false);

    // Dispatch the prevented navigation action
    if (preventedNavigationActionRef.current) {
      navigation.dispatch(preventedNavigationActionRef.current);
      preventedNavigationActionRef.current = null;
    }
  }, [navigation]);

  if (!isNew && !irregularRoom) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.backgroundWarmGray }}>
        <Text style={{ fontSize: Typography.h3.fontSize, color: Colors.mediumGray }}>Irregular Room not found</Text>
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
                PAGE: IrregularRoomEditorScreen
              </Text>
            </View>
          )}

          <View style={{ padding: Spacing.md }}>
            {/* Main Info Card */}
            <Card style={{ marginBottom: Spacing.md }}>
              {/* Room Name */}
              <View style={{ marginBottom: Spacing.md }}>
                <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                  Room Name
                </Text>
                <View style={TextInputStyles.container}>
                  <TextInput
                    ref={nameRef}
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter room name"
                    placeholderTextColor={Colors.mediumGray}
                    returnKeyType="next"
                    blurOnSubmit={false}
                    style={TextInputStyles.base}
                    inputAccessoryViewID={Platform.OS === "ios" ? `irregularRoomName-${nameAccessoryID}` : undefined}
                    // ⛔ DO NOT REMOVE - Required for iOS cursor/selection (KB-003, ADDR-098)
                    cursorColor={Colors.primaryBlue}
                    selectionColor={Colors.primaryBlue}
                  />
                </View>
              </View>

              {/* Walls Section */}
              <View style={{ marginBottom: Spacing.md }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.sm }}>
                  <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500" as any, color: Colors.darkCharcoal }}>
                    Walls ({unitSystem === "metric" ? "m" : "ft"})
                  </Text>
                  <Pressable
                    onPress={handleAddWall}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: Colors.primaryBlueLight,
                      paddingHorizontal: Spacing.sm,
                      paddingVertical: Spacing.xs,
                      borderRadius: BorderRadius.default,
                    }}
                  >
                    <Ionicons name="add" size={16} color={Colors.primaryBlue} />
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.primaryBlue, fontWeight: "600", marginLeft: 2 }}>
                      Add Wall
                    </Text>
                  </Pressable>
                </View>

                {/* Column Headers */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.xs, marginBottom: Spacing.xs }}>
                  <View style={{ width: 30 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, textAlign: "right", paddingRight: Spacing.md }}>
                      Width
                    </Text>
                  </View>
                  <Text style={{ fontSize: 14, color: "transparent" }}>×</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, textAlign: "right", paddingRight: Spacing.md }}>
                      Height
                    </Text>
                  </View>
                  <Text style={{ fontSize: 14, color: "transparent" }}>=</Text>
                  <View style={{ width: 70 }}>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, textAlign: "right", paddingRight: Spacing.sm }}>
                      Area
                    </Text>
                  </View>
                  <View style={{ width: 36 }} />
                </View>

                {/* Wall Rows */}
                {walls.map((wall, index) => {
                  const isLastWall = index === walls.length - 1;
                  return (
                    <View key={wall.id} style={{ flexDirection: "row", alignItems: "center", gap: Spacing.xs, marginBottom: Spacing.sm }}>
                      {/* Wall number */}
                      <View style={{ width: 30 }}>
                        <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                          #{index + 1}
                        </Text>
                      </View>

                      {/* Width */}
                      <View style={{ flex: 1 }}>
                        <TextInput
                          ref={(ref) => {
                            if (ref) wallWidthRefs.current.set(wall.id, ref);
                            else wallWidthRefs.current.delete(wall.id);
                          }}
                          value={wall.width}
                          onChangeText={(val) => handleWallWidthChange(wall.id, val)}
                          keyboardType="numeric"
                          placeholder="0"
                          placeholderTextColor={Colors.mediumGray}
                          returnKeyType="next"
                          blurOnSubmit={false}
                          onSubmitEditing={handleWallNext}
                          onFocus={() => setFocusedWall({ wallId: wall.id, field: "width" })}
                          inputAccessoryViewID={Platform.OS === "ios" ? `wallInputs-${wallInputAccessoryID}` : undefined}
                          // ⛔ DO NOT REMOVE - Required for iOS cursor/selection (KB-003, ADDR-098)
                          cursorColor={Colors.primaryBlue}
                          selectionColor={Colors.primaryBlue}
                          style={{
                            backgroundColor: Colors.white,
                            borderRadius: BorderRadius.default,
                            borderWidth: 1,
                            borderColor: Colors.neutralGray,
                            paddingHorizontal: Spacing.md,
                            paddingVertical: Spacing.sm,
                            fontSize: Typography.body.fontSize,
                            color: Colors.darkCharcoal,
                            textAlign: "right",
                          }}
                        />
                      </View>

                      <Text style={{ fontSize: 14, color: Colors.mediumGray, fontWeight: "600" }}>×</Text>

                      {/* Height */}
                      <View style={{ flex: 1 }}>
                        <TextInput
                          ref={(ref) => {
                            if (ref) wallHeightRefs.current.set(wall.id, ref);
                            else wallHeightRefs.current.delete(wall.id);
                          }}
                          value={wall.height}
                          onChangeText={(val) => handleWallHeightChange(wall.id, val)}
                          keyboardType="numeric"
                          placeholder="0"
                          placeholderTextColor={Colors.mediumGray}
                          returnKeyType="next"
                          blurOnSubmit={false}
                          onSubmitEditing={handleWallNext}
                          onFocus={() => setFocusedWall({ wallId: wall.id, field: "height" })}
                          inputAccessoryViewID={Platform.OS === "ios" ? `wallInputs-${wallInputAccessoryID}` : undefined}
                          // ⛔ DO NOT REMOVE - Required for iOS cursor/selection (KB-003, ADDR-098)
                          cursorColor={Colors.primaryBlue}
                          selectionColor={Colors.primaryBlue}
                          style={{
                            backgroundColor: Colors.white,
                            borderRadius: BorderRadius.default,
                            borderWidth: 1,
                            borderColor: Colors.neutralGray,
                            paddingHorizontal: Spacing.md,
                            paddingVertical: Spacing.sm,
                            fontSize: Typography.body.fontSize,
                            color: Colors.darkCharcoal,
                            textAlign: "right",
                          }}
                        />
                      </View>

                      <Text style={{ fontSize: 14, color: Colors.mediumGray, fontWeight: "600" }}>=</Text>

                      {/* Area (editable - can be entered directly or calculated from width×height) */}
                      <View style={{ width: 70 }}>
                        <TextInput
                          ref={(ref) => {
                            if (ref) wallAreaRefs.current.set(wall.id, ref);
                            else wallAreaRefs.current.delete(wall.id);
                          }}
                          value={wall.area}
                          onChangeText={(val) => handleWallAreaChange(wall.id, val)}
                          keyboardType="numeric"
                          placeholder="0"
                          placeholderTextColor={Colors.mediumGray}
                          returnKeyType={isLastWall ? "done" : "next"}
                          blurOnSubmit={isLastWall}
                          onSubmitEditing={isLastWall ? () => Keyboard.dismiss() : handleWallNext}
                          onFocus={() => setFocusedWall({ wallId: wall.id, field: "area" })}
                          inputAccessoryViewID={Platform.OS === "ios" ? `wallInputs-${wallInputAccessoryID}` : undefined}
                          // ⛔ DO NOT REMOVE - Required for iOS cursor/selection (KB-003, ADDR-098)
                          cursorColor={Colors.primaryBlue}
                          selectionColor={Colors.primaryBlue}
                          style={{
                            backgroundColor: Colors.white,
                            borderRadius: BorderRadius.default,
                            borderWidth: 1,
                            borderColor: Colors.neutralGray,
                            paddingHorizontal: Spacing.sm,
                            paddingVertical: Spacing.sm,
                            fontSize: Typography.body.fontSize,
                            color: Colors.darkCharcoal,
                            textAlign: "right",
                          }}
                        />
                      </View>

                      {/* Delete button */}
                      {(() => {
                        const hasValues = wall.width || wall.height || wall.area;
                        const canDelete = walls.length > 1;
                        return (
                          <Pressable
                            onPress={() => handleRemoveWall(wall.id)}
                            disabled={!canDelete}
                            style={{
                              width: 36,
                              height: 36,
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: hasValues && canDelete ? Colors.error + "15" : Colors.neutralGray,
                              borderRadius: BorderRadius.default,
                              opacity: canDelete ? 1 : 0.5,
                            }}
                          >
                            <Ionicons
                              name="trash-outline"
                              size={18}
                              color={hasValues && canDelete ? Colors.error : Colors.mediumGray}
                            />
                          </Pressable>
                        );
                      })()}
                    </View>
                  );
                })}

                {/* Total Area */}
                <View style={{
                  flexDirection: "row",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  paddingTop: Spacing.sm,
                  borderTopWidth: 1,
                  borderTopColor: Colors.neutralGray,
                  marginTop: Spacing.xs,
                }}>
                  <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600", color: Colors.darkCharcoal, marginRight: Spacing.sm }}>
                    Total Area:
                  </Text>
                  <Text style={{ fontSize: Typography.h3.fontSize, fontWeight: "700", color: Colors.primaryBlue }}>
                    {totalArea.toFixed(0)} {unitSystem === "metric" ? "m²" : "sq ft"}
                  </Text>
                </View>
              </View>

              {/* Cathedral Ceiling Toggle */}
              <Toggle
                label="Cathedral Ceiling"
                value={isCathedral}
                onValueChange={setIsCathedral}
              />

              {isCathedral && (
                <View style={{ marginTop: Spacing.md }}>
                  <FormInput
                    ref={cathedralPeakHeightRef}
                    label={`Peak Height (${unitSystem === "metric" ? "m" : "ft"})`}
                    value={cathedralPeakHeight}
                    onChangeText={setCathedralPeakHeight}
                    keyboardType="numeric"
                    placeholder="0"
                    className="mb-0"
                  />
                  <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginTop: Spacing.xs }}>
                    Height at the highest point of the cathedral ceiling
                  </Text>
                </View>
              )}
            </Card>

            {/* Openings & Closets Section */}
            <Card style={{ marginBottom: Spacing.md }}>
              <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.darkCharcoal, marginBottom: Spacing.md }}>
                Openings & Closets
              </Text>

              <View style={{ flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.md, alignItems: "flex-end" }}>
                <View style={{ flex: 0.6 }}>
                  <NumericInput
                    label="Windows"
                    value={windowCount}
                    onChangeText={setWindowCount}
                    min={0}
                    max={20}
                  />
                </View>
                <View style={{ flex: 0.6 }}>
                  <NumericInput
                    label="Doors"
                    value={doorCount}
                    onChangeText={setDoorCount}
                    min={0}
                    max={10}
                  />
                </View>
                <View style={{ flex: 1, justifyContent: "flex-end" }}>
                  <Toggle
                    label="Closet"
                    value={hasCloset}
                    onValueChange={setHasCloset}
                  />
                </View>
              </View>

              {hasCloset && (
                <View style={{ marginTop: Spacing.md }}>
                  <View style={{ flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.md }}>
                    <View style={{ flex: 1 }}>
                      <NumericInput
                        label="Single Door"
                        value={singleDoorClosets}
                        onChangeText={setSingleDoorClosets}
                        min={0}
                        max={10}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <NumericInput
                        label="Double Door"
                        value={doubleDoorClosets}
                        onChangeText={setDoubleDoorClosets}
                        min={0}
                        max={10}
                      />
                    </View>
                  </View>
                  <Toggle
                    label="Include Closet Interior in Quote"
                    value={includeClosetInteriorInQuote}
                    onValueChange={setIncludeClosetInteriorInQuote}
                  />
                </View>
              )}
            </Card>

            {/* Paint Options */}
            <Card style={{ marginBottom: Spacing.md }}>
              <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.darkCharcoal, marginBottom: Spacing.md }}>
                Paint Options
              </Text>

              <Toggle label="Paint Walls" value={paintWalls} onValueChange={setPaintWalls} />
              <Toggle label="Paint Ceilings" value={paintCeilings} onValueChange={setPaintCeilings} />
              <Toggle label="Paint Window Frames" value={paintWindowFrames} onValueChange={setPaintWindowFrames} />
              <Toggle label="Paint Door Frames" value={paintDoorFrames} onValueChange={setPaintDoorFrames} />
              <Toggle label="Paint Windows" value={paintWindows} onValueChange={setPaintWindows} />
              <Toggle label="Paint Doors" value={paintDoors} onValueChange={setPaintDoors} />
              <Toggle label="Paint Jambs" value={paintJambs} onValueChange={setPaintJambs} />
              <Toggle label="Paint Baseboard" value={paintBaseboard} onValueChange={setPaintBaseboard} />
              <Toggle label="Crown Moulding" value={hasCrownMoulding} onValueChange={setHasCrownMoulding} />
              <Toggle label="Accent Wall (Multiple Colors)" value={hasAccentWall} onValueChange={setHasAccentWall} />
            </Card>

            {/* Room Summary Section */}
            {totalArea > 0 && (() => {
              // Calculate pricing summary for irregular room
              const wallsCount = walls.length;
              const windowsCount = parseInt(windowCount) || 0;
              const doorsCount = parseInt(doorCount) || 0;

              // Safety check for pricing data
              if (!pricing) {
                return (
                  <Card style={{ marginBottom: Spacing.md }}>
                    <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.darkCharcoal, marginBottom: Spacing.md }}>
                      Room Summary
                    </Text>
                    <View style={{ flexDirection: "row", gap: Spacing.sm }}>
                      <View style={{ flex: 3, backgroundColor: Colors.backgroundWarmGray, borderRadius: BorderRadius.default, padding: Spacing.md }}>
                        <View style={{ marginBottom: Spacing.xs }}>
                          <Text style={{ fontSize: 13, color: "transparent" }}>-</Text>
                        </View>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                          <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>Wall</Text>
                          <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>
                            {Math.ceil(totalArea)} {unitSystem === "metric" ? "m²" : "sq ft"}
                          </Text>
                        </View>
                        {windowsCount > 0 && (
                          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                            <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>Windows</Text>
                            <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>{windowsCount}</Text>
                          </View>
                        )}
                        {doorsCount > 0 && (
                          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                            <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>Doors</Text>
                            <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>{doorsCount}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </Card>
                );
              }

              // Calculate costs based on pricing settings
              const wallArea = totalArea;
              const wallLaborPerSqFt = safeNumber(pricing.wallLaborPerSqFt, 0);
              const wallPaintPerGallon = safeNumber(pricing.wallPaintPerGallon, 0);
              const wallPaintCoverage = 350; // standard coverage

              // Window costs
              const windowLaborEach = safeNumber(pricing.windowLaborEach, 0);
              const windowMaterialsEach = safeNumber(pricing.windowMaterialsEach, 0);

              // Door costs
              const doorLaborEach = safeNumber(pricing.doorLaborEach, 0);
              const doorMaterialsEach = safeNumber(pricing.doorMaterialsEach, 0);

              // Calculate individual component costs
              const wallLaborCost = paintWalls ? wallArea * wallLaborPerSqFt : 0;
              const wallMaterialsCost = paintWalls ? Math.ceil(wallArea / wallPaintCoverage) * wallPaintPerGallon : 0;

              const windowLaborCost = paintWindows && paintWindowFrames ? windowsCount * windowLaborEach : 0;
              const windowMaterialsCost = paintWindows && paintWindowFrames ? windowsCount * windowMaterialsEach : 0;

              const doorLaborCost = paintDoors && paintDoorFrames ? doorsCount * doorLaborEach : 0;
              const doorMaterialsCost = paintDoors && paintDoorFrames ? doorsCount * doorMaterialsEach : 0;

              // Baseboard - estimate based on room perimeter (simplified)
              const baseboardLaborPerLF = safeNumber(pricing.baseboardLaborPerLF, 0);
              const baseboardMaterialsPerLF = safeNumber(pricing.baseboardMaterialsPerLF, 0);
              // Estimate perimeter: for each wall, assume width is the dimension shown
              const estimatedPerimeter = walls.reduce((sum, wall) => {
                const w = parseFloat(wall.width) || 0;
                return sum + w;
              }, 0) * 2;

              const baseboardLaborCost = paintBaseboard ? estimatedPerimeter * baseboardLaborPerLF : 0;
              const baseboardMaterialsCost = paintBaseboard ? estimatedPerimeter * baseboardMaterialsPerLF : 0;

              // Crown moulding
              const crownLaborPerLF = safeNumber(pricing.crownMouldingLaborPerLF, 0);
              const crownMaterialsPerLF = safeNumber(pricing.crownMouldingMaterialsPerLF, 0);
              const crownLaborCost = hasCrownMoulding ? estimatedPerimeter * crownLaborPerLF : 0;
              const crownMaterialsCost = hasCrownMoulding ? estimatedPerimeter * crownMaterialsPerLF : 0;

              // Totals
              const totalLaborCost = wallLaborCost + windowLaborCost + doorLaborCost + baseboardLaborCost + crownLaborCost;
              const totalMaterialsCost = wallMaterialsCost + windowMaterialsCost + doorMaterialsCost + baseboardMaterialsCost + crownMaterialsCost;
              const grandTotal = totalLaborCost + totalMaterialsCost;

              return (
                <Card style={{ marginBottom: Spacing.md }}>
                  <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.darkCharcoal, marginBottom: Spacing.md }}>
                    Room Summary
                  </Text>

                  <View style={{ flexDirection: "row", gap: Spacing.sm }}>
                    {/* Left Column - Measurements (Gray) */}
                    <View style={{ flex: 3, backgroundColor: Colors.backgroundWarmGray, borderRadius: BorderRadius.default, padding: Spacing.md }}>
                      {/* Empty row to align with blue section headers */}
                      <View style={{ marginBottom: Spacing.xs }}>
                        <Text style={{ fontSize: 13, color: "transparent" }}>-</Text>
                      </View>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                        <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>Wall</Text>
                        <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>
                          {Math.ceil(wallArea)} {unitSystem === "metric" ? "m²" : "sq ft"}
                        </Text>
                      </View>
                      {windowsCount > 0 && (
                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                          <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>Windows</Text>
                          <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>
                            {windowsCount}
                          </Text>
                        </View>
                      )}
                      {doorsCount > 0 && (
                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                          <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>Doors</Text>
                          <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>
                            {doorsCount}
                          </Text>
                        </View>
                      )}
                      {paintBaseboard && estimatedPerimeter > 0 && (
                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                          <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>Baseboard</Text>
                          <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>
                            {Math.ceil(estimatedPerimeter)} {unitSystem === "metric" ? "m" : "ft"}
                          </Text>
                        </View>
                      )}
                      {hasCrownMoulding && estimatedPerimeter > 0 && (
                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                          <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>Crown Mld</Text>
                          <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>
                            {Math.ceil(estimatedPerimeter)} {unitSystem === "metric" ? "m" : "ft"}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Right Column - Pricing (Blue) */}
                    <View style={{ flex: 2, backgroundColor: "#E3F2FD", borderRadius: BorderRadius.default, padding: Spacing.md }}>
                      {/* Header Row */}
                      <View style={{ flexDirection: "row", gap: Spacing.xs, marginBottom: Spacing.xs }}>
                        <Text style={{ flex: 1, fontSize: 13, color: Colors.mediumGray, textAlign: "right" }}>Labor</Text>
                        <Text style={{ flex: 1, fontSize: 13, color: Colors.mediumGray, textAlign: "right" }}>Mat</Text>
                      </View>

                      {/* Walls */}
                      {paintWalls && (
                        <View style={{ flexDirection: "row", gap: Spacing.xs, marginBottom: Spacing.xs }}>
                          <Text style={{ flex: 1, fontSize: 13, color: Colors.darkCharcoal, textAlign: "right" }}>
                            ${Math.round(wallLaborCost)}
                          </Text>
                          <Text style={{ flex: 1, fontSize: 13, color: Colors.darkCharcoal, textAlign: "right" }}>
                            ${Math.round(wallMaterialsCost)}
                          </Text>
                        </View>
                      )}

                      {/* Windows */}
                      {windowsCount > 0 && paintWindows && paintWindowFrames && (
                        <View style={{ flexDirection: "row", gap: Spacing.xs, marginBottom: Spacing.xs }}>
                          <Text style={{ flex: 1, fontSize: 13, color: Colors.darkCharcoal, textAlign: "right" }}>
                            ${Math.round(windowLaborCost)}
                          </Text>
                          <Text style={{ flex: 1, fontSize: 13, color: Colors.darkCharcoal, textAlign: "right" }}>
                            ${Math.round(windowMaterialsCost)}
                          </Text>
                        </View>
                      )}

                      {/* Doors */}
                      {doorsCount > 0 && paintDoors && paintDoorFrames && (
                        <View style={{ flexDirection: "row", gap: Spacing.xs, marginBottom: Spacing.xs }}>
                          <Text style={{ flex: 1, fontSize: 13, color: Colors.darkCharcoal, textAlign: "right" }}>
                            ${Math.round(doorLaborCost)}
                          </Text>
                          <Text style={{ flex: 1, fontSize: 13, color: Colors.darkCharcoal, textAlign: "right" }}>
                            ${Math.round(doorMaterialsCost)}
                          </Text>
                        </View>
                      )}

                      {/* Baseboard */}
                      {paintBaseboard && estimatedPerimeter > 0 && (
                        <View style={{ flexDirection: "row", gap: Spacing.xs, marginBottom: Spacing.xs }}>
                          <Text style={{ flex: 1, fontSize: 13, color: Colors.darkCharcoal, textAlign: "right" }}>
                            ${Math.round(baseboardLaborCost)}
                          </Text>
                          <Text style={{ flex: 1, fontSize: 13, color: Colors.darkCharcoal, textAlign: "right" }}>
                            ${Math.round(baseboardMaterialsCost)}
                          </Text>
                        </View>
                      )}

                      {/* Crown Moulding */}
                      {hasCrownMoulding && estimatedPerimeter > 0 && (
                        <View style={{ flexDirection: "row", gap: Spacing.xs, marginBottom: Spacing.xs }}>
                          <Text style={{ flex: 1, fontSize: 13, color: Colors.darkCharcoal, textAlign: "right" }}>
                            ${Math.round(crownLaborCost)}
                          </Text>
                          <Text style={{ flex: 1, fontSize: 13, color: Colors.darkCharcoal, textAlign: "right" }}>
                            ${Math.round(crownMaterialsCost)}
                          </Text>
                        </View>
                      )}

                      <View style={{ height: 1, backgroundColor: "#90CAF9", marginVertical: Spacing.xs }} />

                      {/* Subtotals */}
                      <View style={{ flexDirection: "row", gap: Spacing.xs, marginBottom: Spacing.xs }}>
                        <Text style={{ flex: 1, fontSize: 13, color: Colors.darkCharcoal, textAlign: "right" }}>
                          ${Math.round(totalLaborCost)}
                        </Text>
                        <Text style={{ flex: 1, fontSize: 13, color: Colors.darkCharcoal, textAlign: "right" }}>
                          ${Math.round(totalMaterialsCost)}
                        </Text>
                      </View>

                      <View style={{ height: 1, backgroundColor: "#90CAF9", marginVertical: Spacing.xs }} />

                      {/* Total */}
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "700" as any, color: Colors.darkCharcoal }}>Total:</Text>
                        <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: "700" as any, color: Colors.primaryBlue }}>
                          ${grandTotal.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Card>
              );
            })()}

            {/* Notes */}
            <Card style={{ marginBottom: Spacing.md }}>
              <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.darkCharcoal, marginBottom: Spacing.md }}>
                Notes
              </Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Add notes about this room..."
                placeholderTextColor={Colors.mediumGray}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                // ⛔ DO NOT REMOVE - Required for iOS cursor/selection (KB-003, ADDR-098)
                cursorColor={Colors.primaryBlue}
                selectionColor={Colors.primaryBlue}
                style={{
                  backgroundColor: Colors.backgroundWarmGray,
                  borderRadius: BorderRadius.default,
                  padding: Spacing.md,
                  fontSize: Typography.body.fontSize,
                  color: Colors.darkCharcoal,
                  minHeight: 100,
                }}
              />
            </Card>

            {/* Photos */}
            <Card style={{ marginBottom: Spacing.md }}>
              <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.darkCharcoal, marginBottom: Spacing.md }}>
                Photos
              </Text>

              {/* Photo Grid */}
              {photos.length > 0 && (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm, marginBottom: Spacing.md }}>
                  {photos.map((photo, index) => (
                    <Pressable
                      key={photo.id}
                      onPress={() => handlePhotoPress(index)}
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: BorderRadius.default,
                        overflow: "hidden",
                      }}
                    >
                      <Image
                        source={{ uri: photo.uri }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="cover"
                      />
                      {photo.note && (
                        <View style={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          right: 0,
                          backgroundColor: "rgba(0,0,0,0.5)",
                          padding: 2,
                        }}>
                          <Ionicons name="document-text" size={12} color={Colors.white} />
                        </View>
                      )}
                    </Pressable>
                  ))}
                </View>
              )}

              {/* Add Photo Buttons */}
              <View style={{ flexDirection: "row", gap: Spacing.sm }}>
                <Pressable
                  onPress={handleTakePhoto}
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: Colors.primaryBlueLight,
                    borderRadius: BorderRadius.default,
                    paddingVertical: Spacing.sm,
                  }}
                >
                  <Ionicons name="camera-outline" size={20} color={Colors.primaryBlue} />
                  <Text style={{ ...Typography.body, color: Colors.primaryBlue, fontWeight: "600", marginLeft: Spacing.xs }}>
                    Camera
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleAddPhoto}
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: Colors.primaryBlueLight,
                    borderRadius: BorderRadius.default,
                    paddingVertical: Spacing.sm,
                  }}
                >
                  <Ionicons name="images-outline" size={20} color={Colors.primaryBlue} />
                  <Text style={{ ...Typography.body, color: Colors.primaryBlue, fontWeight: "600", marginLeft: Spacing.xs }}>
                    Library
                  </Text>
                </Pressable>
              </View>
            </Card>

            {/* Save Button */}
            <Pressable
              onPress={handleSave}
              style={{
                backgroundColor: Colors.primaryBlue,
                borderRadius: BorderRadius.default,
                paddingVertical: Spacing.md,
                alignItems: "center",
                ...Shadows.card,
              }}
            >
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.white }}>
                Save Irregular Room
              </Text>
            </Pressable>
          </View>
        </ScrollView>

        {/* Photo Modal */}
        <Modal
          visible={photoModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setPhotoModalVisible(false)}
        >
          <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: Colors.white }}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={{ flex: 1 }}
            >
              {/* Modal Header */}
              <View style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                padding: Spacing.md,
                borderBottomWidth: 1,
                borderBottomColor: Colors.neutralGray,
              }}>
                <Text style={Typography.h2}>Photo Details</Text>
                <Pressable onPress={() => setPhotoModalVisible(false)}>
                  <Ionicons name="close" size={24} color={Colors.darkCharcoal} />
                </Pressable>
              </View>

              {/* Photo Preview */}
              {selectedPhotoIndex !== null && photos[selectedPhotoIndex] && (
                <View style={{ flex: 1, padding: Spacing.md }}>
                  <Image
                    source={{ uri: photos[selectedPhotoIndex].uri }}
                    style={{
                      width: "100%",
                      height: 250,
                      borderRadius: BorderRadius.default,
                      marginBottom: Spacing.md,
                    }}
                    resizeMode="contain"
                  />

                  <Text style={{ ...Typography.body, fontWeight: "600", marginBottom: Spacing.xs }}>
                    Note
                  </Text>
                  <TextInput
                    value={photoNote}
                    onChangeText={setPhotoNote}
                    placeholder="Add a note (e.g., nail pops, holes, sheetrock patch)"
                    placeholderTextColor={Colors.mediumGray}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    // ⛔ DO NOT REMOVE - Required for iOS cursor/selection (KB-003, ADDR-098)
                    cursorColor={Colors.primaryBlue}
                    selectionColor={Colors.primaryBlue}
                    style={{
                      backgroundColor: Colors.backgroundWarmGray,
                      borderRadius: BorderRadius.default,
                      padding: Spacing.md,
                      fontSize: Typography.body.fontSize,
                      color: Colors.darkCharcoal,
                      minHeight: 80,
                    }}
                  />
                </View>
              )}

              {/* Modal Actions */}
              <View style={{ padding: Spacing.md, gap: Spacing.sm }}>
                <Pressable
                  onPress={handleSavePhotoNote}
                  style={{
                    backgroundColor: Colors.primaryBlue,
                    borderRadius: BorderRadius.default,
                    paddingVertical: Spacing.md,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ ...Typography.body, color: Colors.white, fontWeight: "600" }}>
                    Save Note
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleDeletePhoto}
                  style={{
                    backgroundColor: Colors.error + "10",
                    borderRadius: BorderRadius.default,
                    paddingVertical: Spacing.md,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ ...Typography.body, color: Colors.error, fontWeight: "600" }}>
                    Delete Photo
                  </Text>
                </Pressable>
              </View>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </Modal>

        {/* InputAccessoryView for Room Name field */}
        {Platform.OS === "ios" && (
          <InputAccessoryView nativeID={`irregularRoomName-${nameAccessoryID}`}>
            <View
              style={{
                backgroundColor: "#f1f1f1",
                paddingHorizontal: Spacing.md,
                paddingVertical: Spacing.sm,
                flexDirection: "row",
                justifyContent: "flex-end",
              }}
            >
              <Pressable
                onPress={handleNameNextPress}
                style={{
                  backgroundColor: Colors.primaryBlue,
                  paddingHorizontal: Spacing.lg,
                  paddingVertical: Spacing.sm,
                  borderRadius: BorderRadius.default,
                }}
              >
                <Text
                  style={{
                    fontSize: Typography.body.fontSize,
                    color: Colors.white,
                    fontWeight: "600",
                  }}
                >
                  Next
                </Text>
              </Pressable>
            </View>
          </InputAccessoryView>
        )}

        {/* InputAccessoryView for Wall inputs with Previous/Next/Done navigation */}
        {Platform.OS === "ios" && (
          <InputAccessoryView nativeID={`wallInputs-${wallInputAccessoryID}`}>
            <View
              style={{
                backgroundColor: "#f1f1f1",
                paddingHorizontal: Spacing.md,
                paddingVertical: Spacing.sm,
                flexDirection: "row",
                justifyContent: "flex-end",
              }}
            >
              <Pressable
                onPress={handleWallPrevious}
                disabled={isFirstWallInput()}
                style={{
                  paddingHorizontal: Spacing.lg,
                  paddingVertical: Spacing.sm,
                }}
              >
                <Text
                  style={{
                    fontSize: Typography.body.fontSize,
                    color: isFirstWallInput() ? "#c7c7c7" : "#007AFF",
                    fontWeight: "400",
                  }}
                >
                  Previous
                </Text>
              </Pressable>
              <Pressable
                onPress={isLastWallInput() ? () => Keyboard.dismiss() : handleWallNext}
                style={{
                  backgroundColor: Colors.primaryBlue,
                  paddingHorizontal: Spacing.lg,
                  paddingVertical: Spacing.sm,
                  borderRadius: BorderRadius.default,
                }}
              >
                <Text
                  style={{
                    fontSize: Typography.body.fontSize,
                    color: Colors.white,
                    fontWeight: "600",
                  }}
                >
                  {isLastWallInput() ? "Done" : "Next"}
                </Text>
              </Pressable>
            </View>
          </InputAccessoryView>
        )}
      </KeyboardAvoidingView>

      {/* Save Prompt Modal */}
      <SavePromptModal
        visible={showSavePrompt}
        onSave={handleSaveFromPrompt}
        onDiscard={handleDiscardFromPrompt}
        onCancel={() => setShowSavePrompt(false)}
        isLoading={isSaving}
      />
    </SafeAreaView>
  );
}
