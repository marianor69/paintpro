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
  ActivityIndicator,
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
import { formatCurrency, getDefaultQuoteBuilder, safeNumber } from "../utils/calculations";
import { computeRoomPricingSummary } from "../utils/pricingSummary";
import { formatMeasurementValue, parseDisplayValue, formatMeasurement } from "../utils/unitConversion";
import * as ImagePicker from "expo-image-picker";
import { v4 as uuidv4 } from "uuid";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius, Shadows, TextInputStyles } from "../utils/designSystem";
import { Card } from "../components/Card";
import { Toggle } from "../components/Toggle";
import { NumericInput } from "../components/NumericInput";
import { DimensionInput } from "../components/DimensionInput";
import { FormInput } from "../components/FormInput";
import { SavePromptModal } from "../components/SavePromptModal";
import { RoomPhoto, Bathroom } from "../types/painting";

type Props = NativeStackScreenProps<RootStackParamList, "BathroomEditor">;

/**
 * Helper to serialize bathroom state for dirty checking
 * Creates a consistent snapshot of all editable fields
 */
function serializeBathroomState(
  name: string,
  length: string,
  width: string,
  manualArea: string,
  isCathedral: boolean,
  cathedralPeakHeight: string,
  windowCount: string,
  doorCount: string,
  hasCloset: boolean,
  singleDoorClosets: string,
  doubleDoorClosets: string,
  paintWalls: boolean,
  paintCeilings: boolean,
  paintTrim: boolean,
  paintWindowFrames: boolean,
  paintDoorFrames: boolean,
  paintWindows: boolean,
  paintDoors: boolean,
  paintJambs: boolean,
  paintBaseboard: boolean,
  hasCrownMoulding: boolean,
  hasAccentWall: boolean,
  includeClosetInteriorInQuote: boolean
): string {
  return JSON.stringify({
    name,
    length,
    width,
    manualArea,
    isCathedral,
    cathedralPeakHeight,
    windowCount,
    doorCount,
    hasCloset,
    singleDoorClosets,
    doubleDoorClosets,
    paintWalls,
    paintCeilings,
    paintTrim,
    paintWindowFrames,
    paintDoorFrames,
    paintWindows,
    paintDoors,
    paintJambs,
    paintBaseboard,
    hasCrownMoulding,
    hasAccentWall,
    includeClosetInteriorInQuote,
  });
}

export default function BathroomEditorScreen({ route, navigation }: Props) {
  const { projectId, bathroomId, floor: initialFloor } = route.params;
  const isNewBathroom = !bathroomId;

  const project = useProjectStore((s) =>
    s.projects.find((p) => p.id === projectId)
  );
  const bathroom = isNewBathroom ? null : project?.bathrooms.find((b) => b.id === bathroomId);
  const addBathroom = useProjectStore((s) => s.addBathroom);
  const updateBathroom = useProjectStore((s) => s.updateBathroom);
  const deleteBathroom = useProjectStore((s) => s.deleteBathroom);
  const pricing = usePricingStore();
  const calcSettings = useCalculationSettings((s) => s.settings);
  const unitSystem = useAppSettings((s) => s.unitSystem);
  const testMode = useAppSettings((s) => s.testMode);

  // Store initial state snapshot for dirty checking
  const initialStateRef = useRef<string | null>(null);

  const [name, setName] = useState(bathroom?.name || "");
  // Room dimensions stored in feet, convert for display based on unit system
  const [length, setLength] = useState(bathroom?.length && bathroom.length > 0 ? formatMeasurementValue(bathroom.length, 'length', unitSystem, 2) : "");
  const [width, setWidth] = useState(bathroom?.width && bathroom.width > 0 ? formatMeasurementValue(bathroom.width, 'length', unitSystem, 2) : "");
  const floor = bathroom?.floor || initialFloor || 1;
  const [manualArea, setManualArea] = useState(
    bathroom?.manualArea && bathroom.manualArea > 0 ? formatMeasurementValue(bathroom.manualArea, 'area', unitSystem, 2) : ""
  );
  const [isCathedral, setIsCathedral] = useState(bathroom?.ceilingType === "cathedral");
  const [windowCount, setWindowCount] = useState(
    bathroom?.windowCount && bathroom.windowCount > 0 ? bathroom.windowCount.toString() : ""
  );
  const [doorCount, setDoorCount] = useState(
    bathroom?.doorCount && bathroom.doorCount > 0 ? bathroom.doorCount.toString() : ""
  );
  const [hasCloset, setHasCloset] = useState(bathroom?.hasCloset || false);
  const [singleDoorClosets, setSingleDoorClosets] = useState(
    bathroom?.singleDoorClosets && bathroom.singleDoorClosets > 0 ? bathroom.singleDoorClosets.toString() : ""
  );
  const [doubleDoorClosets, setDoubleDoorClosets] = useState(
    bathroom?.doubleDoorClosets && bathroom.doubleDoorClosets > 0 ? bathroom.doubleDoorClosets.toString() : ""
  );
  const [includeClosetInteriorInQuote, setIncludeClosetInteriorInQuote] = useState(
    bathroom?.includeClosetInteriorInQuote ?? project?.projectIncludeClosetInteriorInQuote ?? true
  );

  // Paint options - bathroom-level overrides
  const [paintWalls, setPaintWalls] = useState(bathroom?.paintWalls ?? project?.globalPaintDefaults?.paintWalls ?? true);
  const [paintCeilings, setPaintCeilings] = useState(bathroom?.paintCeilings ?? project?.globalPaintDefaults?.paintCeilings ?? true);
  const [paintTrim, setPaintTrim] = useState(bathroom?.paintTrim ?? project?.globalPaintDefaults?.paintTrim ?? true);
  const [paintWindowFrames, setPaintWindowFrames] = useState(bathroom?.paintWindowFrames ?? project?.globalPaintDefaults?.paintWindowFrames ?? true);
  const [paintDoorFrames, setPaintDoorFrames] = useState(bathroom?.paintDoorFrames ?? project?.globalPaintDefaults?.paintDoorFrames ?? true);
  const [paintWindows, setPaintWindows] = useState(bathroom?.paintWindows ?? project?.globalPaintDefaults?.paintWindows ?? true);
  const [paintDoors, setPaintDoors] = useState(bathroom?.paintDoors ?? project?.globalPaintDefaults?.paintDoors ?? true);
  const [paintJambs, setPaintJambs] = useState(bathroom?.paintJambs ?? project?.globalPaintDefaults?.paintDoorJambs ?? true);
  const [paintBaseboard, setPaintBaseboard] = useState(
    bathroom?.paintBaseboard ?? project?.globalPaintDefaults?.paintBaseboards ?? project?.paintBaseboard ?? true
  );
  const [hasCrownMoulding, setHasCrownMoulding] = useState(bathroom?.hasCrownMoulding ?? project?.globalPaintDefaults?.paintCrownMoulding ?? true);
  const [hasAccentWall, setHasAccentWall] = useState(bathroom?.hasAccentWall ?? false);
  const [cathedralPeakHeight, setCathedralPeakHeight] = useState(
    bathroom?.cathedralPeakHeight && bathroom.cathedralPeakHeight > 0 ? formatMeasurementValue(bathroom.cathedralPeakHeight, 'length', unitSystem, 2) : ""
  );

  // Room photos state
  const [photos, setPhotos] = useState<RoomPhoto[]>(bathroom?.photos || []);
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [editingPhotoNote, setEditingPhotoNote] = useState("");

  // Openings state
  const [openings, setOpenings] = useState<Array<{id: string; width: string; height: string; hasInteriorTrim: boolean; hasExteriorTrim: boolean}>>(
    bathroom?.openings?.map(o => ({
      id: o.id,
      width: o.width.toString(),
      height: o.height.toString(),
      hasInteriorTrim: o.hasInteriorTrim,
      hasExteriorTrim: o.hasExteriorTrim,
    })) || []
  );

  // Standalone notes field (available without photos)
  const [notes, setNotes] = useState(bathroom?.notes || "");

  // Collapsible sections
  const [paintOptionsExpanded, setPaintOptionsExpanded] = useState(false);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  // Use ref to track saved state for cleanup - avoids stale closure issues
  const isSavedRef = useRef(false);
  const isKeyboardVisibleRef = useRef(false);
  const pendingSavePromptRef = useRef(false);
  // MD-002: Store the navigation action to dispatch when discarding
  const preventedNavigationActionRef = useRef<any>(null);

  // KB-004: Unique ID for Bathroom Name InputAccessoryView
  const nameAccessoryID = useId();

  // W-005, W-006: TextInput refs for focus navigation
  const nameRef = useRef<TextInput>(null);
  const lengthRef = useRef<TextInput>(null);
  const widthRef = useRef<TextInput>(null);
  const manualAreaRef = useRef<TextInput>(null);
  const openingRefs = useRef<Array<{ width: React.RefObject<TextInput>; height: React.RefObject<TextInput> }>>([]);
  const cathedralPeakHeightRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const notesCardRef = useRef<View>(null);

  const getOpeningRefs = (index: number) => {
    if (!openingRefs.current[index]) {
      openingRefs.current[index] = {
        width: React.createRef<TextInput>(),
        height: React.createRef<TextInput>(),
      };
    }
    return openingRefs.current[index];
  };

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

  // Update header title dynamically when room name changes
  useEffect(() => {
    const displayName = name || "Unnamed Bathroom";
    navigation.setOptions({
      title: displayName + "'s Details",
    });
  }, [name, navigation]);

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

  // Cleanup on unmount - delete if never saved and name is empty
  useEffect(() => {
    return () => {
      if (!isSavedRef.current && bathroomId) {
        // Check if bathroom was never named
        if (!name || name.trim() === "") {
          const deleteBathroomFn = useProjectStore.getState().deleteBathroom;
          deleteBathroomFn(projectId, bathroomId);
        }
      }
    };
  }, []);

  // Capture initial state snapshot when bathroom data is first available
  useEffect(() => {
    if (bathroom && initialStateRef.current !== null) return;

    // For new bathrooms, create initial snapshot immediately with empty state
    // For existing bathrooms, wait until bathroom data is available
    if (isNewBathroom) {
      initialStateRef.current = serializeBathroomState(
        "",
        "",
        "",
        "",
        false,
        "",
        "",
        "",
        false,
        "",
        "",
        project?.globalPaintDefaults?.paintWalls ?? true,
        project?.globalPaintDefaults?.paintCeilings ?? true,
        project?.globalPaintDefaults?.paintTrim ?? true,
        project?.globalPaintDefaults?.paintWindowFrames ?? true,
        project?.globalPaintDefaults?.paintDoorFrames ?? true,
        project?.globalPaintDefaults?.paintWindows ?? true,
        project?.globalPaintDefaults?.paintDoors ?? true,
        project?.globalPaintDefaults?.paintDoorJambs ?? true,
        project?.globalPaintDefaults?.paintBaseboards ?? project?.paintBaseboard ?? true,
        project?.globalPaintDefaults?.paintCrownMoulding ?? true,
        false,
        project?.projectIncludeClosetInteriorInQuote ?? true
      );
      return;
    }

    if (!bathroom || initialStateRef.current !== null) return;

    // Create initial snapshot of all editable fields
    initialStateRef.current = serializeBathroomState(
      bathroom.name || "",
      bathroom.length && bathroom.length > 0 ? bathroom.length.toString() : "",
      bathroom.width && bathroom.width > 0 ? bathroom.width.toString() : "",
      bathroom.manualArea && bathroom.manualArea > 0 ? bathroom.manualArea.toString() : "",
      bathroom.ceilingType === "cathedral",
      bathroom.cathedralPeakHeight && bathroom.cathedralPeakHeight > 0 ? bathroom.cathedralPeakHeight.toString() : "",
      bathroom.windowCount && bathroom.windowCount > 0 ? bathroom.windowCount.toString() : "",
      bathroom.doorCount && bathroom.doorCount > 0 ? bathroom.doorCount.toString() : "",
      bathroom.hasCloset || false,
      bathroom.singleDoorClosets && bathroom.singleDoorClosets > 0 ? bathroom.singleDoorClosets.toString() : "",
      bathroom.doubleDoorClosets && bathroom.doubleDoorClosets > 0 ? bathroom.doubleDoorClosets.toString() : "",
      bathroom.paintWalls ?? project?.globalPaintDefaults?.paintWalls ?? true,
      bathroom.paintCeilings ?? project?.globalPaintDefaults?.paintCeilings ?? true,
      bathroom.paintTrim ?? project?.globalPaintDefaults?.paintTrim ?? true,
      bathroom.paintWindowFrames ?? project?.globalPaintDefaults?.paintWindowFrames ?? true,
      bathroom.paintDoorFrames ?? project?.globalPaintDefaults?.paintDoorFrames ?? true,
      bathroom.paintWindows ?? project?.globalPaintDefaults?.paintWindows ?? true,
      bathroom.paintDoors ?? project?.globalPaintDefaults?.paintDoors ?? true,
      bathroom.paintJambs ?? project?.globalPaintDefaults?.paintDoorJambs ?? true,
      bathroom.paintBaseboard ?? project?.globalPaintDefaults?.paintBaseboards ?? project?.paintBaseboard ?? true,
      bathroom.hasCrownMoulding ?? project?.globalPaintDefaults?.paintCrownMoulding ?? true,
      bathroom.hasAccentWall ?? false,
      bathroom.includeClosetInteriorInQuote ?? project?.projectIncludeClosetInteriorInQuote ?? true
    );
  }, [bathroom, project]);

  // Check for changes by comparing current state to initial snapshot
  useEffect(() => {
    if (initialStateRef.current === null) return;

    const currentState = serializeBathroomState(
      name,
      length,
      width,
      manualArea,
      isCathedral,
      cathedralPeakHeight,
      windowCount,
      doorCount,
      hasCloset,
      singleDoorClosets,
      doubleDoorClosets,
      paintWalls,
      paintCeilings,
      paintTrim,
      paintWindowFrames,
      paintDoorFrames,
      paintWindows,
      paintDoors,
      paintJambs,
      paintBaseboard,
      hasCrownMoulding,
      hasAccentWall,
      includeClosetInteriorInQuote
    );

    const hasChanges = currentState !== initialStateRef.current;
    setHasUnsavedChanges(hasChanges);
  }, [
    name,
    length,
    width,
    manualArea,
    isCathedral,
    cathedralPeakHeight,
    windowCount,
    doorCount,
    hasCloset,
    singleDoorClosets,
    doubleDoorClosets,
    paintWalls,
    paintCeilings,
    paintTrim,
    paintWindowFrames,
    paintDoorFrames,
    paintWindows,
    paintDoors,
    paintJambs,
    paintBaseboard,
    hasCrownMoulding,
    hasAccentWall,
    includeClosetInteriorInQuote,
  ]);

  usePreventRemove(hasUnsavedChanges, ({ data }) => {
    // MD-002: Store the navigation action so we can dispatch it when discarding
    preventedNavigationActionRef.current = data.action;

    if (isKeyboardVisibleRef.current) {
      pendingSavePromptRef.current = true;
      Keyboard.dismiss();
    } else {
      setShowSavePrompt(true);
    }
  });

  // Photo handling functions
  const generatePhotoFileName = (bathroomName: string, photoIndex: number): string => {
    const safeName = (bathroomName || "Bathroom").replace(/[^a-zA-Z0-9]/g, "_");
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

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert("Bathroom Name Required", "Please enter a name for this bathroom before saving.");
      return;
    }

    // If this is a new room, create it first
    let currentBathroomId = bathroomId;
    if (isNewBathroom) {
      currentBathroomId = addBathroom(projectId, floor);
    }

    if (!currentBathroomId) return;

    setHasUnsavedChanges(false);
    setIsSaved(true);
    isSavedRef.current = true;

    let height = 8;
    if (project?.floorHeights && project.floorHeights[floor - 1]) {
      height = project.floorHeights[floor - 1];
    } else if (floor === 2 && project?.secondFloorHeight) {
      height = project.secondFloorHeight;
    } else if (project?.firstFloorHeight) {
      height = project.firstFloorHeight;
    }

    // Convert display values back to imperial feet/sq ft for storage
    const lengthFeet = parseDisplayValue(length, 'length', unitSystem);
    const widthFeet = parseDisplayValue(width, 'length', unitSystem);
    const manualAreaSqFt = manualArea ? parseDisplayValue(manualArea, 'area', unitSystem) : undefined;
    const cathedralPeakHeightFeet = cathedralPeakHeight ? parseDisplayValue(cathedralPeakHeight, 'length', unitSystem) : undefined;

    const updatedBathroom = {
      id: currentBathroomId,
      name: trimmedName,
      length: lengthFeet,
      width: widthFeet,
      height,
      floor,
      manualArea: manualAreaSqFt,
      ceilingType: isCathedral ? "cathedral" : "flat",
      cathedralPeakHeight: cathedralPeakHeightFeet,
      windowCount: parseInt(windowCount) || 0,
      doorCount: parseInt(doorCount) || 0,
      hasCloset,
      singleDoorClosets: parseInt(singleDoorClosets) || 0,
      doubleDoorClosets: parseInt(doubleDoorClosets) || 0,
      paintWalls,
      paintCeilings,
      paintTrim,
      paintWindowFrames,
      paintDoorFrames,
      paintWindows,
      paintDoors,
      paintJambs,
      paintBaseboard,
      hasCrownMoulding,
      hasAccentWall,
      includeWindows: true,
      includeDoors: true,
      includeTrim: true,
      includeClosetInteriorInQuote,
      // Openings
      openings: openings.map(o => ({
        id: o.id,
        width: parseInt(o.width) || 0,
        height: parseInt(o.height) || 0,
        hasInteriorTrim: o.hasInteriorTrim,
        hasExteriorTrim: o.hasExteriorTrim,
      })),
      // Update photos with current file names based on final room name
      photos: photos.map((p, idx) => ({
        ...p,
        fileName: generatePhotoFileName(trimmedName, idx + 1),
      })),
      // Standalone notes field
      notes: notes.trim() || undefined,
    };

    // Use the SAME calculation engine that the UI preview uses
    // This ensures saved totals match displayed totals
    const pricingSummaryForSave = computeRoomPricingSummary(
      updatedBathroom as any,
      quoteBuilder,
      pricing,
      project?.projectCoats,
      project?.projectIncludeClosetInteriorInQuote
    );

    console.log("[BathroomEditor] Saving room with gallon usage:", {
      wall: pricingSummaryForSave.wallPaintGallons,
      ceiling: pricingSummaryForSave.ceilingPaintGallons,
      trim: pricingSummaryForSave.trimPaintGallons,
      door: pricingSummaryForSave.doorPaintGallons,
    });

    // Compute and persist room totals (single source of truth)
    const finalBathroom = {
      ...updatedBathroom,
      gallonUsage: {
        wall: pricingSummaryForSave.wallPaintGallons,
        ceiling: pricingSummaryForSave.ceilingPaintGallons,
        trim: pricingSummaryForSave.trimPaintGallons,
        door: pricingSummaryForSave.doorPaintGallons,
      },
      laborTotal: pricingSummaryForSave.laborDisplayed,
      materialsTotal: pricingSummaryForSave.materialsDisplayed,
      grandTotal: pricingSummaryForSave.totalDisplayed,
    };

    console.log("[BathroomEditor] Saving room totals (using computeRoomPricingSummary):", {
      laborTotal: finalRoom.laborTotal,
      materialsTotal: finalRoom.materialsTotal,
      grandTotal: finalRoom.grandTotal,
    });

    updateBathroom(projectId, currentBathroomId, finalRoom as any);

    // Update initial snapshot to the newly saved state
    initialStateRef.current = serializeBathroomState(
      trimmedName,
      length,
      width,
      manualArea,
      isCathedral,
      cathedralPeakHeight,
      windowCount,
      doorCount,
      hasCloset,
      singleDoorClosets,
      doubleDoorClosets,
      paintWalls,
      paintCeilings,
      paintTrim,
      paintWindowFrames,
      paintDoorFrames,
      paintWindows,
      paintDoors,
      paintJambs,
      paintBaseboard,
      hasCrownMoulding,
      hasAccentWall,
      includeClosetInteriorInQuote
    );

    setTimeout(() => {
      navigation.goBack();
    }, 10);
  };

  const handleDiscardAndLeave = () => {
    // For new bathrooms with no name, nothing was created so just navigate back
    // For existing bathrooms with no name, delete them
    const trimmedName = name.trim();
    if (!trimmedName && !isNewBathroom && bathroomId) {
      deleteBathroom(projectId, bathroomId);
    }

    setIsSaved(true);
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

  // Get height from project
  let currentHeight = 8;
  if (project?.floorHeights && project.floorHeights[floor - 1]) {
    currentHeight = project.floorHeights[floor - 1];
  } else if (floor === 2 && project?.secondFloorHeight) {
    currentHeight = project.secondFloorHeight;
  } else if (project?.firstFloorHeight) {
    currentHeight = project.firstFloorHeight;
  }

  // Get active quote's QuoteBuilder for combined rule calculation
  const getActiveQuote = useProjectStore((s) => s.getActiveQuote);
  const activeQuote = project ? getActiveQuote(project.id) : null;
  const quoteBuilder = activeQuote?.quoteBuilder || project?.quoteBuilder || getDefaultQuoteBuilder();

  // Calculate room pricing using CENTRALIZED PRICING SUMMARY (SINGLE SOURCE OF TRUTH)
  // This ensures preview totals match what will be shown in all other views
  // For new bathrooms, calculate with temp data; for existing rooms, use the saved bathroom data
  // IMPORTANT: Convert display values to imperial before passing to calculation
  const previewLengthFeet = parseDisplayValue(length || "0", 'length', unitSystem);
  const previewWidthFeet = parseDisplayValue(width || "0", 'length', unitSystem);
  const previewManualAreaSqFt = manualArea ? parseDisplayValue(manualArea, 'area', unitSystem) : undefined;
  const previewCathedralPeakHeightFeet = cathedralPeakHeight ? parseDisplayValue(cathedralPeakHeight, 'length', unitSystem) : undefined;

  const pricingSummary = computeRoomPricingSummary(
    {
      id: bathroomId || "temp-new-bathroom",
      name: name.trim() || "Unnamed Bathroom",
      length: previewLengthFeet,
      width: previewWidthFeet,
      height: currentHeight,
      floor,
      manualArea: previewManualAreaSqFt,
      ceilingType: isCathedral ? "cathedral" : "flat",
      cathedralPeakHeight: previewCathedralPeakHeightFeet,
      windowCount: parseInt(windowCount) || 0,
      doorCount: parseInt(doorCount) || 0,
      hasCloset,
      singleDoorClosets: parseInt(singleDoorClosets) || 0,
      doubleDoorClosets: parseInt(doubleDoorClosets) || 0,
      paintWalls,
      paintCeilings,
      paintTrim,
      paintWindowFrames,
      paintDoorFrames,
      paintWindows,
      paintDoors,
      paintJambs,
      paintBaseboard,
      hasCrownMoulding,
      hasAccentWall,
      includeWindows: true,
      includeDoors: true,
      includeTrim: true,
      includeClosetInteriorInQuote,
      openings: openings.map(o => ({
        id: o.id,
        width: parseInt(o.width) || 0,
        height: parseInt(o.height) || 0,
        hasInteriorTrim: o.hasInteriorTrim,
        hasExteriorTrim: o.hasExteriorTrim,
      })),
      photos: photos.map((p, idx) => ({
        ...p,
        fileName: generatePhotoFileName(name || "bathroom", idx + 1),
      })),
      notes: notes.trim() || undefined,
    } as any,
    quoteBuilder,
    pricing,
    project?.projectCoats,
    project?.projectIncludeClosetInteriorInQuote
  );

  if (!project) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.backgroundWarmGray }}>
        <Text style={{ fontSize: Typography.h2.fontSize, color: Colors.mediumGray }}>Project not found</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      style={{ flex: 1, backgroundColor: Colors.backgroundWarmGray }}
    >
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: Spacing.md }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* Bathroom Information Section */}
        <Card style={{ marginBottom: Spacing.md }}>
          {/* Bathroom Name */}
          <View style={{ marginBottom: Spacing.md }}>
            <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
              Bathroom Name
            </Text>
            <View style={TextInputStyles.container}>
              <TextInput
                ref={nameRef}
                value={name}
                onChangeText={setName}
                placeholder="Enter bathroom name"
                placeholderTextColor={Colors.mediumGray}
                returnKeyType="next"
                onSubmitEditing={() => lengthRef.current?.focus()}
                blurOnSubmit={false}
                style={TextInputStyles.base}
                inputAccessoryViewID={Platform.OS === "ios" ? `roomName-${nameAccessoryID}` : undefined}
                accessibilityLabel="Room name input"
                accessibilityHint="Enter a name for this room"
              />
            </View>
          </View>

          {/* Room Dimensions: Length × Width = Area */}
          <View style={{ marginBottom: Spacing.md }}>
            <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
              Bathroom Size
            </Text>
            {/* Labels row */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.xs, marginBottom: 2 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, textAlign: "right", paddingRight: Spacing.md }}>
                  Length ({unitSystem === "metric" ? "m" : "ft"})
                </Text>
              </View>
              <Text style={{ fontSize: 18, color: "transparent" }}>×</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, textAlign: "right", paddingRight: Spacing.md }}>
                  Width ({unitSystem === "metric" ? "m" : "ft"})
                </Text>
              </View>
              <Text style={{ fontSize: 18, color: "transparent" }}>=</Text>
              <View style={{ flex: 1.2 }}>
                <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, textAlign: "right", paddingRight: Spacing.md }}>
                  Area ({unitSystem === "metric" ? "m²" : "sqft"})
                </Text>
              </View>
            </View>
            {/* Input fields row */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.xs }}>
              {/* Length */}
              <View style={{ flex: 1 }}>
                <FormInput
                  ref={lengthRef}
                  previousFieldRef={nameRef}
                  label=""
                  value={length}
                  onChangeText={(val) => {
                    setLength(val);
                    // Auto-calculate area when both L and W have values
                    const l = parseFloat(val);
                    const w = parseFloat(width);
                    if (!isNaN(l) && l > 0 && !isNaN(w) && w > 0) {
                      setManualArea((l * w).toFixed(1));
                    }
                  }}
                  keyboardType="numeric"
                  placeholder="0"
                  nextFieldRef={widthRef}
                  accessibilityLabel="Room length"
                  textAlign="right"
                  className="mb-0"
                />
              </View>

              {/* × symbol */}
              <Text style={{ fontSize: 18, color: Colors.mediumGray, fontWeight: "600" }}>×</Text>

              {/* Width */}
              <View style={{ flex: 1 }}>
                <FormInput
                  ref={widthRef}
                  previousFieldRef={lengthRef}
                  label=""
                  value={width}
                  onChangeText={(val) => {
                    setWidth(val);
                    // Auto-calculate area when both L and W have values
                    const l = parseFloat(length);
                    const w = parseFloat(val);
                    if (!isNaN(l) && l > 0 && !isNaN(w) && w > 0) {
                      setManualArea((l * w).toFixed(1));
                    }
                  }}
                  keyboardType="numeric"
                  placeholder="0"
                  nextFieldRef={manualAreaRef}
                  accessibilityLabel="Room width"
                  textAlign="right"
                  className="mb-0"
                />
              </View>

              {/* = symbol */}
              <Text style={{ fontSize: 18, color: Colors.mediumGray, fontWeight: "600" }}>=</Text>

              {/* Area */}
              <View style={{ flex: 1.2 }}>
                <FormInput
                  ref={manualAreaRef}
                  previousFieldRef={widthRef}
                  label=""
                  value={manualArea}
                  onChangeText={(val) => {
                    setManualArea(val);
                    // If user enters area directly, clear L and W
                    if (val.trim() && (!length.trim() || !width.trim())) {
                      setLength("");
                      setWidth("");
                    }
                  }}
                  keyboardType="numeric"
                  placeholder="0"
                  nextFieldRef={isCathedral ? cathedralPeakHeightRef : undefined}
                  accessibilityLabel="Room area"
                  textAlign="right"
                  className="mb-0"
                />
              </View>
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
                previousFieldRef={manualAreaRef}
                label={`Peak Height (${unitSystem === 'metric' ? 'm' : 'ft'})`}
                value={cathedralPeakHeight}
                onChangeText={setCathedralPeakHeight}
                keyboardType="numeric"
                placeholder="0"
                accessibilityLabel="Cathedral peak height input"
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

          {/* Pass-Through Openings */}
          <View style={{ marginBottom: Spacing.sm }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.sm }}>
              <View>
                <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500" as any, color: Colors.darkCharcoal }}>
                  Pass-Through Openings
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: Colors.primaryBlueLight,
                  borderRadius: BorderRadius.default,
                  paddingHorizontal: 4,
                  paddingVertical: 2,
                  borderWidth: 1,
                  borderColor: Colors.neutralGray,
                  gap: 4,
                }}
              >
                <Pressable
                  onPress={() => {
                    const current = openings.length;
                    if (current > 0) {
                      setOpenings(openings.slice(0, -1));
                    }
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Decrease openings count"
                  style={{
                    width: 28,
                    height: 28,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 12,
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
                    {openings.length}
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    const newOpening = {
                      id: `opening-${Date.now()}`,
                      width: "36",
                      height: "80",
                      hasInteriorTrim: true,
                      hasExteriorTrim: true,
                    };
                    setOpenings([...openings, newOpening]);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Increase openings count"
                  style={{
                    width: 28,
                    height: 28,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 12,
                  }}
                >
                  <Text style={{ fontSize: 22, color: Colors.primaryBlue, fontWeight: "600" as any }}>+</Text>
                </Pressable>
              </View>
            </View>

            {openings.length > 0 && (
              <View style={{ backgroundColor: Colors.backgroundWarmGray, borderRadius: BorderRadius.default, padding: Spacing.md, marginBottom: Spacing.sm }}>
                {openings.map((opening, index) => (
                  <View key={opening.id} style={{ marginBottom: index < openings.length - 1 ? Spacing.md : 0, paddingBottom: index < openings.length - 1 ? Spacing.md : 0, borderBottomWidth: index < openings.length - 1 ? 1 : 0, borderBottomColor: Colors.neutralGray }}>
                    {/** Keyboard Navigation Toolbar (standard) for opening fields */}
                    {(() => {
                      const openingFieldRefs = getOpeningRefs(index);
                      const previousOpeningRefs = index > 0 ? getOpeningRefs(index - 1) : null;
                      const nextOpeningRefs = index < openings.length - 1 ? getOpeningRefs(index + 1) : null;

                      return (
                        <>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.sm }}>
                      <Text style={{ fontSize: Typography.caption.fontSize, fontWeight: "500" as any, color: Colors.mediumGray }}>
                        Opening {index + 1}
                      </Text>
                      <Pressable
                        onPress={() => setOpenings(openings.filter((_, i) => i !== index))}
                        style={{ padding: Spacing.xs }}
                      >
                        <Ionicons name="close-circle-outline" size={18} color={Colors.error} />
                      </Pressable>
                    </View>

                    <View style={{ flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.sm }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: Typography.caption.fontSize, fontWeight: "500" as any, color: Colors.mediumGray, marginBottom: Spacing.xs }}>
                          Width (in)
                        </Text>
                        <FormInput
                          ref={openingFieldRefs.width}
                          previousFieldRef={previousOpeningRefs?.height}
                          nextFieldRef={openingFieldRefs.height}
                          label=""
                          value={opening.width}
                          onChangeText={(text) => {
                            const updated = [...openings];
                            updated[index].width = text;
                            setOpenings(updated);
                          }}
                          placeholder="36"
                          placeholderTextColor={Colors.mediumGray}
                          keyboardType="numeric"
                          textAlign="left"
                          className="mb-0"
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: Typography.caption.fontSize, fontWeight: "500" as any, color: Colors.mediumGray, marginBottom: Spacing.xs }}>
                          Height (in)
                        </Text>
                        <FormInput
                          ref={openingFieldRefs.height}
                          previousFieldRef={openingFieldRefs.width}
                          nextFieldRef={nextOpeningRefs?.width}
                          label=""
                          value={opening.height}
                          onChangeText={(text) => {
                            const updated = [...openings];
                            updated[index].height = text;
                            setOpenings(updated);
                          }}
                          placeholder="80"
                          placeholderTextColor={Colors.mediumGray}
                          keyboardType="numeric"
                          textAlign="left"
                          className="mb-0"
                        />
                      </View>
                    </View>

                    <View style={{ flexDirection: "row", gap: Spacing.sm }}>
                      <Pressable
                        onPress={() => {
                          const updated = [...openings];
                          updated[index].hasInteriorTrim = !updated[index].hasInteriorTrim;
                          setOpenings(updated);
                        }}
                        style={{
                          flex: 1,
                          flexDirection: "row",
                          alignItems: "center",
                          paddingVertical: Spacing.xs,
                          paddingHorizontal: Spacing.sm,
                          backgroundColor: opening.hasInteriorTrim ? Colors.primaryBlueLight : Colors.white,
                          borderWidth: 1,
                          borderColor: Colors.neutralGray,
                          borderRadius: BorderRadius.default,
                        }}
                      >
                        <Ionicons
                          name={opening.hasInteriorTrim ? "checkbox" : "checkbox-outline"}
                          size={16}
                          color={opening.hasInteriorTrim ? Colors.primaryBlue : Colors.mediumGray}
                          style={{ marginRight: Spacing.xs }}
                        />
                        <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.darkCharcoal }}>
                          Interior Trim
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() => {
                          const updated = [...openings];
                          updated[index].hasExteriorTrim = !updated[index].hasExteriorTrim;
                          setOpenings(updated);
                        }}
                        style={{
                          flex: 1,
                          flexDirection: "row",
                          alignItems: "center",
                          paddingVertical: Spacing.xs,
                          paddingHorizontal: Spacing.sm,
                          backgroundColor: opening.hasExteriorTrim ? Colors.primaryBlueLight : Colors.white,
                          borderWidth: 1,
                          borderColor: Colors.neutralGray,
                          borderRadius: BorderRadius.default,
                        }}
                      >
                        <Ionicons
                          name={opening.hasExteriorTrim ? "checkbox" : "checkbox-outline"}
                          size={16}
                          color={opening.hasExteriorTrim ? Colors.primaryBlue : Colors.mediumGray}
                          style={{ marginRight: Spacing.xs }}
                        />
                        <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.darkCharcoal }}>
                          Exterior Trim
                        </Text>
                      </Pressable>
                    </View>
                        </>
                      );
                    })()}
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Windows Counter */}
          <View style={{ marginBottom: Spacing.sm }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.sm }}>
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500" as any, color: Colors.darkCharcoal }}>
                Windows
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: Colors.primaryBlueLight,
                  borderRadius: BorderRadius.default,
                  paddingHorizontal: 4,
                  paddingVertical: 2,
                  borderWidth: 1,
                  borderColor: Colors.neutralGray,
                  gap: 4,
                }}
              >
                <Pressable
                  onPress={() => {
                    const current = parseInt(windowCount) || 0;
                    if (current > 0) {
                      setWindowCount((current - 1).toString());
                    }
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Decrease window count"
                  style={{
                    width: 28,
                    height: 28,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 12,
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
                    {windowCount || "0"}
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    const current = parseInt(windowCount) || 0;
                    setWindowCount((current + 1).toString());
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Increase window count"
                  style={{
                    width: 28,
                    height: 28,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 12,
                  }}
                >
                  <Text style={{ fontSize: 22, color: Colors.primaryBlue, fontWeight: "600" as any }}>+</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Doors Counter */}
          <View style={{ marginBottom: Spacing.sm }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.sm }}>
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500" as any, color: Colors.darkCharcoal }}>
                Doors
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: Colors.primaryBlueLight,
                  borderRadius: BorderRadius.default,
                  paddingHorizontal: 4,
                  paddingVertical: 2,
                  borderWidth: 1,
                  borderColor: Colors.neutralGray,
                  gap: 4,
                }}
              >
                <Pressable
                  onPress={() => {
                    const current = parseInt(doorCount) || 0;
                    if (current > 0) {
                      setDoorCount((current - 1).toString());
                    }
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Decrease door count"
                  style={{
                    width: 28,
                    height: 28,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 12,
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
                    {doorCount || "0"}
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    const current = parseInt(doorCount) || 0;
                    setDoorCount((current + 1).toString());
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Increase door count"
                  style={{
                    width: 28,
                    height: 28,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 12,
                  }}
                >
                  <Text style={{ fontSize: 22, color: Colors.primaryBlue, fontWeight: "600" as any }}>+</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Closets Counters */}
          <View style={{ marginBottom: Spacing.sm }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.sm }}>
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500" as any, color: Colors.darkCharcoal }}>
                Single Door Closet
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: Colors.primaryBlueLight,
                  borderRadius: BorderRadius.default,
                  paddingHorizontal: 4,
                  paddingVertical: 2,
                  borderWidth: 1,
                  borderColor: Colors.neutralGray,
                  gap: 4,
                }}
              >
                <Pressable
                  onPress={() => {
                    const current = parseInt(singleDoorClosets) || 0;
                    if (current > 0) {
                      setSingleDoorClosets((current - 1).toString());
                      if (current === 1 && (parseInt(doubleDoorClosets) || 0) === 0) {
                        setHasCloset(false);
                      }
                    }
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Decrease single door closet count"
                  style={{
                    width: 28,
                    height: 28,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 12,
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
                    {singleDoorClosets || "0"}
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    const current = parseInt(singleDoorClosets) || 0;
                    setSingleDoorClosets((current + 1).toString());
                    setHasCloset(true);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Increase single door closet count"
                  style={{
                    width: 28,
                    height: 28,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 12,
                  }}
                >
                  <Text style={{ fontSize: 22, color: Colors.primaryBlue, fontWeight: "600" as any }}>+</Text>
                </Pressable>
              </View>
            </View>
          </View>

          <View style={{ marginBottom: Spacing.sm }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.sm }}>
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500" as any, color: Colors.darkCharcoal }}>
                Double Doors Closet
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: Colors.primaryBlueLight,
                  borderRadius: BorderRadius.default,
                  paddingHorizontal: 4,
                  paddingVertical: 2,
                  borderWidth: 1,
                  borderColor: Colors.neutralGray,
                  gap: 4,
                }}
              >
                <Pressable
                  onPress={() => {
                    const current = parseInt(doubleDoorClosets) || 0;
                    if (current > 0) {
                      setDoubleDoorClosets((current - 1).toString());
                      if (current === 1 && (parseInt(singleDoorClosets) || 0) === 0) {
                        setHasCloset(false);
                      }
                    }
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Decrease double door closet count"
                  style={{
                    width: 28,
                    height: 28,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 12,
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
                    {doubleDoorClosets || "0"}
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    const current = parseInt(doubleDoorClosets) || 0;
                    setDoubleDoorClosets((current + 1).toString());
                    setHasCloset(true);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Increase double door closet count"
                  style={{
                    width: 28,
                    height: 28,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 12,
                  }}
                >
                  <Text style={{ fontSize: 22, color: Colors.primaryBlue, fontWeight: "600" as any }}>+</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {((parseInt(singleDoorClosets) || 0) > 0 || (parseInt(doubleDoorClosets) || 0) > 0) && (
            <View style={{ backgroundColor: "#E3F2FD", borderRadius: BorderRadius.default, padding: Spacing.md, marginTop: Spacing.sm }}>
              <Text style={{ fontSize: Typography.caption.fontSize, fontWeight: "600" as any, color: "#1565C0", marginBottom: Spacing.xs }}>
                Closet Interior Calculation
              </Text>
              <Text style={{ fontSize: Typography.caption.fontSize, color: "#1565C0", marginBottom: Spacing.sm }}>
                Closets are treated as 2 ft deep cavities with interior walls, ceiling, and baseboard.
              </Text>
              <Toggle
                label="Include Closet Interiors"
                value={includeClosetInteriorInQuote}
                onValueChange={setIncludeClosetInteriorInQuote}
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
              placeholder="Add notes about this bathroom..."
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
                  borderRadius: BorderRadius.default,
                  padding: Spacing.md,
                  minHeight: 100,
                }
              ]}
            />
          </Card>
        </View>

        {/* Room Photos Section */}
        <Card style={{ marginBottom: Spacing.md }}>
          <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
            Room Photos
          </Text>
          <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.md }}>
            Document nail pops, holes, sheetrock patches, or other observations
          </Text>

          {/* Add Photo Buttons */}
          <View style={{ flexDirection: "row", gap: Spacing.sm, marginBottom: photos.length > 0 ? Spacing.md : 0 }}>
            <Pressable
              onPress={() => handleAddPhoto(true)}
              style={{
                flex: 1,
                backgroundColor: Colors.primaryBlue,
                borderRadius: BorderRadius.default,
                paddingVertical: Spacing.md,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="camera-outline" size={20} color={Colors.white} />
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.white, marginLeft: Spacing.sm }}>
                Take Photo
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleAddPhoto(false)}
              style={{
                flex: 1,
                backgroundColor: Colors.white,
                borderRadius: BorderRadius.default,
                paddingVertical: Spacing.md,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: Colors.neutralGray,
              }}
            >
              <Ionicons name="images-outline" size={20} color={Colors.darkCharcoal} />
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal, marginLeft: Spacing.sm }}>
                Choose
              </Text>
            </Pressable>
          </View>

          {/* Photo Grid */}
          {photos.length > 0 && (
            <View style={{ gap: Spacing.md }}>
              {photos.map((photo, index) => (
                <View
                  key={photo.id}
                  style={{
                    backgroundColor: Colors.backgroundWarmGray,
                    borderRadius: BorderRadius.default,
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
                  </View>
                </View>
              ))}
            </View>
          )}

          {photos.length === 0 && (
            <View style={{ backgroundColor: Colors.backgroundWarmGray, borderRadius: BorderRadius.default, padding: Spacing.lg, alignItems: "center" }}>
              <Ionicons name="camera-outline" size={40} color={Colors.mediumGray} />
              <Text style={{ fontSize: Typography.body.fontSize, color: Colors.mediumGray, marginTop: Spacing.sm, textAlign: "center" }}>
                No photos added yet
              </Text>
            </View>
          )}
        </Card>

        {/* Paint Options Section - Collapsable */}
        <Card style={{ marginBottom: Spacing.md }}>
          <Pressable
            onPress={() => setPaintOptionsExpanded(!paintOptionsExpanded)}
            style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.darkCharcoal }}>
                Paint Options
              </Text>
              <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginTop: Spacing.xs }}>
                Customize what to paint in this room
              </Text>
            </View>
            <Ionicons
              name={paintOptionsExpanded ? "chevron-up" : "chevron-down"}
              size={24}
              color={Colors.mediumGray}
            />
          </Pressable>

          {paintOptionsExpanded && (
            <View style={{ marginTop: Spacing.md }}>
              <Toggle
                label="Paint Walls"
                value={paintWalls}
                onValueChange={setPaintWalls}
              />
              <Toggle
                label="Paint Ceilings"
                value={paintCeilings}
                onValueChange={setPaintCeilings}
              />
              <Toggle
                label="Paint Window Frames"
                value={paintWindowFrames}
                onValueChange={setPaintWindowFrames}
                description="Paint window trim and frames"
              />
              <Toggle
                label="Paint Door Frames"
                value={paintDoorFrames}
                onValueChange={setPaintDoorFrames}
                description="Paint door frames and closet door frames"
              />
              <Toggle
                label="Paint Baseboard"
                value={paintBaseboard}
                onValueChange={setPaintBaseboard}
              />
              <Toggle
                label="Paint Doors"
                value={paintDoors}
                onValueChange={setPaintDoors}
                description="Paint the door faces (both sides)"
              />
              {paintDoors && (
                <Toggle
                  label="Paint Door Jambs"
                  value={paintJambs}
                  onValueChange={setPaintJambs}
                  description="Paint the inside of door frames"
                />
              )}
              <Toggle
                label="Crown Moulding"
                value={hasCrownMoulding}
                onValueChange={setHasCrownMoulding}
              />
              <Toggle
                label="Multiple Colors / Accent Wall"
                value={hasAccentWall}
                onValueChange={setHasAccentWall}
                description="Adds extra labor for cutting in different colors"
                className="mb-0"
              />
            </View>
          )}
        </Card>

        {/* Room Summary Section */}
        {pricingSummary && (parseFloat(length) > 0 || parseFloat(width) > 0 || parseFloat(manualArea) > 0) && (() => {
          // Calculate per-category costs
          const calcSettings = useCalculationSettings.getState().settings;
          const secondCoatMultiplier = safeNumber(pricing.secondCoatLaborMultiplier, 2.0);
          const getCoatLaborMultiplier = (coats: number): number => coats <= 1 ? 1.0 : secondCoatMultiplier;

          // Walls
          const wallLaborCost = pricingSummary.wallArea * safeNumber(pricing.wallLaborPerSqFt, 0) * getCoatLaborMultiplier(pricingSummary.coatsWalls);
          const wallMaterialsCost = Math.ceil(pricingSummary.wallPaintGallons) * safeNumber(pricing.wallPaintPerGallon, 0);
          const wallTotal = wallLaborCost + wallMaterialsCost;

          // Ceilings
          const ceilingLaborCost = pricingSummary.ceilingArea * safeNumber(pricing.ceilingLaborPerSqFt, 0) * getCoatLaborMultiplier(pricingSummary.coatsCeiling);
          const ceilingMaterialsCost = Math.ceil(pricingSummary.ceilingPaintGallons) * safeNumber(pricing.ceilingPaintPerGallon, 0);
          const ceilingTotal = ceilingLaborCost + ceilingMaterialsCost;

          // Baseboard
          const baseboardLaborCost = pricingSummary.baseboardLF * safeNumber(pricing.baseboardLaborPerLF, 0) * getCoatLaborMultiplier(pricingSummary.coatsTrim);
          const baseboardTrimWidthFt = calcSettings.baseboardWidth / 12;
          const baseboardTrimSqFt = pricingSummary.baseboardLF * baseboardTrimWidthFt;
          const trimCoverage = Math.max(1, safeNumber(pricing.trimCoverageSqFtPerGallon, 400));
          const baseboardTrimGallons = (baseboardTrimSqFt / trimCoverage) * pricingSummary.coatsTrim;
          const baseboardMaterialsCost = Math.ceil(baseboardTrimGallons) * safeNumber(pricing.trimPaintPerGallon, 0);
          const baseboardTotal = baseboardLaborCost + baseboardMaterialsCost;

          // Crown Moulding
          const crownLaborCost = pricingSummary.crownMouldingLF * safeNumber(pricing.crownMouldingLaborPerLF, 0) * getCoatLaborMultiplier(pricingSummary.coatsTrim);
          const crownTrimWidthFt = calcSettings.crownMouldingWidth / 12;
          const crownTrimSqFt = pricingSummary.crownMouldingLF * crownTrimWidthFt;
          const crownTrimGallons = (crownTrimSqFt / trimCoverage) * pricingSummary.coatsTrim;
          const crownMaterialsCost = Math.ceil(crownTrimGallons) * safeNumber(pricing.trimPaintPerGallon, 0);
          const crownTotal = crownLaborCost + crownMaterialsCost;

          // Windows
          const windowLaborCost = pricingSummary.windowsCount * safeNumber(pricing.windowLabor, 0) * getCoatLaborMultiplier(pricingSummary.coatsTrim);
          const windowTrimPerimeter = 2 * (calcSettings.windowWidth + calcSettings.windowHeight);
          const windowTrimWidthFt = calcSettings.windowTrimWidth / 12;
          const windowTrimSqFt = pricingSummary.windowsCount * windowTrimPerimeter * windowTrimWidthFt;
          const windowTrimGallons = (windowTrimSqFt / trimCoverage) * pricingSummary.coatsTrim;
          const windowMaterialsCost = Math.ceil(windowTrimGallons) * safeNumber(pricing.trimPaintPerGallon, 0);
          const windowTotal = windowLaborCost + windowMaterialsCost;

          // Doors
          const doorLaborCost = pricingSummary.doorsCount * safeNumber(pricing.doorLabor, 0) * getCoatLaborMultiplier(pricingSummary.coatsDoors);
          const doorMaterialsCost = Math.ceil(pricingSummary.doorPaintGallons) * safeNumber(pricing.trimPaintPerGallon, 0);
          const doorTotal = doorLaborCost + doorMaterialsCost;

          return (
            <Card style={{ marginBottom: Spacing.md }}>
              <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.darkCharcoal, marginBottom: Spacing.md }}>
                Room Summary
              </Text>

              <View style={{ flexDirection: "row", gap: Spacing.sm }}>
                {/* Left Column - Measurements (Gray) - Wider with 2 columns: structures (left) and measures (right) */}
                <View style={{ flex: 3, backgroundColor: Colors.backgroundWarmGray, borderRadius: BorderRadius.default, padding: Spacing.md }}>
                  {/* Empty row to align with blue section headers */}
                  <View style={{ marginBottom: Spacing.xs }}>
                    <Text style={{ fontSize: 13, color: "transparent" }}>-</Text>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                    <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>Wall</Text>
                    <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>
                      {formatMeasurement(Math.ceil(pricingSummary.wallArea), 'area', unitSystem, 0)}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                    <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>Ceiling</Text>
                    <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>
                      {formatMeasurement(Math.ceil(pricingSummary.ceilingArea), 'area', unitSystem, 0)}
                    </Text>
                  </View>
                  {paintBaseboard && pricingSummary.baseboardLF > 0 && (
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                      <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>Baseboard</Text>
                      <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>
                        {formatMeasurement(Math.ceil(pricingSummary.baseboardLF), 'linearFeet', unitSystem, 0)}
                      </Text>
                    </View>
                  )}
                  {hasCrownMoulding && pricingSummary.crownMouldingLF > 0 && (
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                      <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>Crown Mld</Text>
                      <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>
                        {formatMeasurement(Math.ceil(pricingSummary.crownMouldingLF), 'linearFeet', unitSystem, 0)}
                      </Text>
                    </View>
                  )}
                  {pricingSummary.windowsCount > 0 && (
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                      <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>Windows</Text>
                      <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>
                        {pricingSummary.windowsCount}
                      </Text>
                    </View>
                  )}
                  {pricingSummary.doorsCount > 0 && (
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                      <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>Doors</Text>
                      <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>
                        {pricingSummary.doorsCount}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Right Section - Pricing (Blue) with Labor and Mat columns - Both columns right-aligned */}
                <View style={{ flex: 2, backgroundColor: "#E3F2FD", borderRadius: BorderRadius.default, padding: Spacing.md }}>
                  {/* Header Row */}
                  <View style={{ flexDirection: "row", gap: Spacing.xs, marginBottom: Spacing.xs }}>
                    <Text style={{ flex: 1, fontSize: 13, color: Colors.mediumGray, textAlign: "right" }}>Labor</Text>
                    <Text style={{ flex: 1, fontSize: 13, color: Colors.mediumGray, textAlign: "right" }}>Mat</Text>
                  </View>

                  {/* Walls */}
                  <View style={{ flexDirection: "row", gap: Spacing.xs, marginBottom: Spacing.xs }}>
                    <Text style={{ flex: 1, fontSize: 13, color: Colors.darkCharcoal, textAlign: "right" }}>
                      ${Math.round(wallLaborCost)}
                    </Text>
                    <Text style={{ flex: 1, fontSize: 13, color: Colors.darkCharcoal, textAlign: "right" }}>
                      ${Math.round(wallMaterialsCost)}
                    </Text>
                  </View>

                  {/* Ceiling */}
                  <View style={{ flexDirection: "row", gap: Spacing.xs, marginBottom: Spacing.xs }}>
                    <Text style={{ flex: 1, fontSize: 13, color: Colors.darkCharcoal, textAlign: "right" }}>
                      ${Math.round(ceilingLaborCost)}
                    </Text>
                    <Text style={{ flex: 1, fontSize: 13, color: Colors.darkCharcoal, textAlign: "right" }}>
                      ${Math.round(ceilingMaterialsCost)}
                    </Text>
                  </View>

                  {/* Baseboard */}
                  {paintBaseboard && pricingSummary.baseboardLF > 0 && (
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
                  {hasCrownMoulding && pricingSummary.crownMouldingLF > 0 && (
                    <View style={{ flexDirection: "row", gap: Spacing.xs, marginBottom: Spacing.xs }}>
                      <Text style={{ flex: 1, fontSize: 13, color: Colors.darkCharcoal, textAlign: "right" }}>
                        ${Math.round(crownLaborCost)}
                      </Text>
                      <Text style={{ flex: 1, fontSize: 13, color: Colors.darkCharcoal, textAlign: "right" }}>
                        ${Math.round(crownMaterialsCost)}
                      </Text>
                    </View>
                  )}

                  {/* Windows */}
                  {pricingSummary.windowsCount > 0 && (
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
                  {pricingSummary.doorsCount > 0 && (
                    <View style={{ flexDirection: "row", gap: Spacing.xs, marginBottom: Spacing.xs }}>
                      <Text style={{ flex: 1, fontSize: 13, color: Colors.darkCharcoal, textAlign: "right" }}>
                        ${Math.round(doorLaborCost)}
                      </Text>
                      <Text style={{ flex: 1, fontSize: 13, color: Colors.darkCharcoal, textAlign: "right" }}>
                        ${Math.round(doorMaterialsCost)}
                      </Text>
                    </View>
                  )}

                  <View style={{ height: 1, backgroundColor: "#90CAF9", marginVertical: Spacing.xs }} />

                  {/* Subtotals - without labels */}
                  <View style={{ flexDirection: "row", gap: Spacing.xs, marginBottom: Spacing.xs }}>
                    <Text style={{ flex: 1, fontSize: 13, color: Colors.darkCharcoal, textAlign: "right" }}>
                      ${Math.round(pricingSummary.laborDisplayed)}
                    </Text>
                    <Text style={{ flex: 1, fontSize: 13, color: Colors.darkCharcoal, textAlign: "right" }}>
                      ${Math.round(pricingSummary.materialsDisplayed)}
                    </Text>
                  </View>

                  <View style={{ height: 1, backgroundColor: "#90CAF9", marginVertical: Spacing.xs }} />

                  {/* Total */}
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "700" as any, color: Colors.darkCharcoal }}>Total:</Text>
                    <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: "700" as any, color: Colors.primaryBlue }}>
                      ${pricingSummary.totalDisplayed.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>
            </Card>
          );
        })()}

        {/* Test Mode: Detailed Calculation Breakdown */}
        {testMode && pricingSummary && (parseFloat(length) > 0 || parseFloat(width) > 0 || parseFloat(manualArea) > 0) && (() => {
          const secondCoatMultiplier = safeNumber(pricing.secondCoatLaborMultiplier, 2.0);
          const getCoatLaborMultiplier = (coats: number): number => coats <= 1 ? 1.0 : secondCoatMultiplier;

          return (
            <Card style={{ marginBottom: Spacing.md }}>
              <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.error, marginBottom: Spacing.md }}>
                TEST MODE: Calculation Details
              </Text>

              <View style={{ backgroundColor: Colors.backgroundWarmGray, borderRadius: BorderRadius.default, padding: Spacing.md }}>
                {/* Walls */}
                {pricingSummary.wallArea > 0 && (
                  <View style={{ marginBottom: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.neutralGray }}>
                    <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                      Walls
                    </Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                      Area: {pricingSummary.wallArea.toFixed(2)} sqft | Coats: {pricingSummary.coatsWalls}
                    </Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                      Labor: {pricingSummary.wallArea.toFixed(2)} × ${safeNumber(pricing.wallLaborPerSqFt, 0).toFixed(2)}/sqft × {getCoatLaborMultiplier(pricingSummary.coatsWalls).toFixed(2)} = ${(pricingSummary.wallArea * safeNumber(pricing.wallLaborPerSqFt, 0) * getCoatLaborMultiplier(pricingSummary.coatsWalls)).toFixed(2)}
                    </Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                      Materials: {Math.ceil(pricingSummary.wallPaintGallons).toFixed(0)} gal × ${safeNumber(pricing.wallPaintPerGallon, 0).toFixed(2)}/gal = ${(Math.ceil(pricingSummary.wallPaintGallons) * safeNumber(pricing.wallPaintPerGallon, 0)).toFixed(2)}
                    </Text>
                  </View>
                )}

                {/* Ceiling */}
                {pricingSummary.ceilingArea > 0 && (
                  <View style={{ marginBottom: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.neutralGray }}>
                    <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                      Ceiling
                    </Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                      Area: {pricingSummary.ceilingArea.toFixed(2)} sqft | Coats: {pricingSummary.coatsCeiling}
                    </Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                      Labor: {pricingSummary.ceilingArea.toFixed(2)} × ${safeNumber(pricing.ceilingLaborPerSqFt, 0).toFixed(2)}/sqft × {getCoatLaborMultiplier(pricingSummary.coatsCeiling).toFixed(2)} = ${(pricingSummary.ceilingArea * safeNumber(pricing.ceilingLaborPerSqFt, 0) * getCoatLaborMultiplier(pricingSummary.coatsCeiling)).toFixed(2)}
                    </Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                      Materials: {Math.ceil(pricingSummary.ceilingPaintGallons).toFixed(0)} gal × ${safeNumber(pricing.ceilingPaintPerGallon, 0).toFixed(2)}/gal = ${(Math.ceil(pricingSummary.ceilingPaintGallons) * safeNumber(pricing.ceilingPaintPerGallon, 0)).toFixed(2)}
                    </Text>
                  </View>
                )}

                {/* Baseboard */}
                {paintBaseboard && pricingSummary.baseboardLF > 0 && (
                  <View style={{ marginBottom: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.neutralGray }}>
                    <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                      Baseboard
                    </Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                      Length: {pricingSummary.baseboardLF.toFixed(2)} ft | Coats: {pricingSummary.coatsTrim}
                    </Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                      Labor: {pricingSummary.baseboardLF.toFixed(2)} × ${safeNumber(pricing.baseboardLaborPerLF, 0).toFixed(2)}/ft × {getCoatLaborMultiplier(pricingSummary.coatsTrim).toFixed(2)} = ${(pricingSummary.baseboardLF * safeNumber(pricing.baseboardLaborPerLF, 0) * getCoatLaborMultiplier(pricingSummary.coatsTrim)).toFixed(2)}
                    </Text>
                  </View>
                )}

                {/* Crown Moulding */}
                {hasCrownMoulding && pricingSummary.crownMouldingLF > 0 && (
                  <View style={{ marginBottom: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.neutralGray }}>
                    <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                      Crown Moulding
                    </Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                      Length: {pricingSummary.crownMouldingLF.toFixed(2)} ft | Coats: {pricingSummary.coatsTrim}
                    </Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                      Labor: {pricingSummary.crownMouldingLF.toFixed(2)} × ${safeNumber(pricing.trimLaborPerLF, 0).toFixed(2)}/ft × {getCoatLaborMultiplier(pricingSummary.coatsTrim).toFixed(2)} = ${(pricingSummary.crownMouldingLF * safeNumber(pricing.trimLaborPerLF, 0) * getCoatLaborMultiplier(pricingSummary.coatsTrim)).toFixed(2)}
                    </Text>
                  </View>
                )}

                {/* Windows */}
                {pricingSummary.windowsCount > 0 && (
                  <View style={{ marginBottom: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.neutralGray }}>
                    <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                      Windows
                    </Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                      Count: {pricingSummary.windowsCount} | Coats: {pricingSummary.coatsTrim}
                    </Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                      Labor: {pricingSummary.windowsCount} × ${safeNumber(pricing.windowLabor, 0).toFixed(2)}/window × {getCoatLaborMultiplier(pricingSummary.coatsTrim).toFixed(2)} = ${(pricingSummary.windowsCount * safeNumber(pricing.windowLabor, 0) * getCoatLaborMultiplier(pricingSummary.coatsTrim)).toFixed(2)}
                    </Text>
                  </View>
                )}

                {/* Doors */}
                {pricingSummary.doorsCount > 0 && (
                  <View style={{ marginBottom: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.neutralGray }}>
                    <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                      Doors
                    </Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                      Count: {pricingSummary.doorsCount} | Coats: {pricingSummary.coatsDoors}
                    </Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                      Labor: {pricingSummary.doorsCount} × ${safeNumber(pricing.doorLabor, 0).toFixed(2)}/door × {getCoatLaborMultiplier(pricingSummary.coatsDoors).toFixed(2)} = ${(pricingSummary.doorsCount * safeNumber(pricing.doorLabor, 0) * getCoatLaborMultiplier(pricingSummary.coatsDoors)).toFixed(2)}
                    </Text>
                  </View>
                )}

                {/* Trim Paint (Baseboard, Crown, Windows) */}
                {pricingSummary.trimPaintGallons > 0 && (
                  <View style={{ marginBottom: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.neutralGray }}>
                    <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                      Trim Paint (Baseboard + Crown + Windows)
                    </Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                      Materials: {Math.ceil(pricingSummary.trimPaintGallons).toFixed(0)} gal × ${safeNumber(pricing.trimPaintPerGallon, 0).toFixed(2)}/gal = ${(Math.ceil(pricingSummary.trimPaintGallons) * safeNumber(pricing.trimPaintPerGallon, 0)).toFixed(2)}
                    </Text>
                  </View>
                )}

                {/* Door Paint */}
                {pricingSummary.doorPaintGallons > 0 && (
                  <View style={{ marginBottom: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.neutralGray }}>
                    <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                      Door Paint
                    </Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                      Materials: {Math.ceil(pricingSummary.doorPaintGallons).toFixed(0)} gal × ${safeNumber(pricing.trimPaintPerGallon, 0).toFixed(2)}/gal = ${(Math.ceil(pricingSummary.doorPaintGallons) * safeNumber(pricing.trimPaintPerGallon, 0)).toFixed(2)}
                    </Text>
                  </View>
                )}

                {/* Totals */}
                <View>
                  <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "700" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                    Totals
                  </Text>
                  <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                    Total Labor: ${pricingSummary.laborDisplayed.toFixed(2)}
                  </Text>
                  <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                    Total Materials: ${pricingSummary.materialsDisplayed.toFixed(2)}
                  </Text>
                  <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                    Grand Total: ${pricingSummary.totalDisplayed.toFixed(2)}
                  </Text>
                </View>
              </View>
            </Card>
          );
        })()}

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
          accessibilityRole="button"
          accessibilityLabel="Save room"
          accessibilityHint="Save all changes to this room"
        >
          <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.white }}>
            Save Room
          </Text>
        </Pressable>
      </ScrollView>

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
              borderRadius: BorderRadius.default,
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
              Add notes about nail pops, holes, sheetrock patches, etc.
            </Text>

            <TextInput
              value={editingPhotoNote}
              onChangeText={setEditingPhotoNote}
              placeholder="e.g., Nail pops on east wall, needs patching"
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
                  borderRadius: BorderRadius.default,
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
                  borderRadius: BorderRadius.default,
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

      {/* KB-004: InputAccessoryView for Bathroom Name field */}
      {Platform.OS === "ios" && (
        <InputAccessoryView nativeID={`roomName-${nameAccessoryID}`}>
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
              onPress={() => lengthRef.current?.focus()}
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
    </KeyboardAvoidingView>
  );
}
