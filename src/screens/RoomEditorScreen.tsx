import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  Switch,
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
import { RoomPhoto } from "../types/painting";
import { useSafeAreaInsets, SafeAreaView } from "react-native-safe-area-context";

type Props = NativeStackScreenProps<RootStackParamList, "RoomEditor">;

/**
 * Helper to serialize room state for dirty checking
 * Creates a consistent snapshot of all editable fields
 */
function serializeRoomState(
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
  includeSingleClosetInteriorInQuote: boolean,
  includeDoubleClosetInteriorInQuote: boolean,
  roomInfoConfirmed: boolean,
  openingsClosetsConfirmed: boolean,
  paintOptionsConfirmed: boolean
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
    includeSingleClosetInteriorInQuote,
    includeDoubleClosetInteriorInQuote,
    roomInfoConfirmed,
    openingsClosetsConfirmed,
    paintOptionsConfirmed,
  });
}

export default function RoomEditorScreen({ route, navigation }: Props) {
  const { projectId, roomId, floor: initialFloor } = route.params;
  const isNewRoom = !roomId;

  const project = useProjectStore((s) =>
    s.projects.find((p) => p.id === projectId)
  );
  const room = isNewRoom ? null : project?.rooms.find((r) => r.id === roomId);
  const projectPaintTrimDefault = project?.globalPaintDefaults?.paintTrim ?? true;
  const projectClosetInteriorDefault = project?.globalPaintDefaults?.paintClosetInteriors ?? true;
  const addRoom = useProjectStore((s) => s.addRoom);
  const updateRoom = useProjectStore((s) => s.updateRoom);
  const deleteRoom = useProjectStore((s) => s.deleteRoom);
  const pricing = usePricingStore();
  const calcSettings = useCalculationSettings((s) => s.settings);
  const unitSystem = useAppSettings((s) => s.unitSystem);
  const testMode = useAppSettings((s) => s.testMode);
  const insets = useSafeAreaInsets();

  // Store initial state snapshot for dirty checking
  const initialStateRef = useRef<string | null>(null);

  const [name, setName] = useState(room?.name || "");
  // Room dimensions stored in feet, convert for display based on unit system
  const [length, setLength] = useState(room?.length && room.length > 0 ? formatMeasurementValue(room.length, 'length', unitSystem, 2) : "");
  const [width, setWidth] = useState(room?.width && room.width > 0 ? formatMeasurementValue(room.width, 'length', unitSystem, 2) : "");
  const floor = room?.floor || initialFloor || 1;
  const [manualArea, setManualArea] = useState(
    room?.manualArea && room.manualArea > 0 ? formatMeasurementValue(room.manualArea, 'area', unitSystem, 2) : ""
  );
  const [isCathedral, setIsCathedral] = useState(room?.ceilingType === "cathedral");
  const [windowCount, setWindowCount] = useState(
    room?.windowCount && room.windowCount > 0 ? room.windowCount.toString() : ""
  );
  const [doorCount, setDoorCount] = useState(
    room?.doorCount && room.doorCount > 0 ? room.doorCount.toString() : ""
  );
  const [hasCloset, setHasCloset] = useState(room?.hasCloset || false);
  const [singleDoorClosets, setSingleDoorClosets] = useState(
    room?.singleDoorClosets && room.singleDoorClosets > 0 ? room.singleDoorClosets.toString() : ""
  );
  const [doubleDoorClosets, setDoubleDoorClosets] = useState(
    room?.doubleDoorClosets && room.doubleDoorClosets > 0 ? room.doubleDoorClosets.toString() : ""
  );
  const [includeSingleClosetInteriorInQuote, setIncludeSingleClosetInteriorInQuote] = useState(
    room?.includeSingleClosetInteriorInQuote ??
    room?.includeClosetInteriorInQuote ??
    projectClosetInteriorDefault
  );
  const [includeDoubleClosetInteriorInQuote, setIncludeDoubleClosetInteriorInQuote] = useState(
    room?.includeDoubleClosetInteriorInQuote ??
    room?.includeClosetInteriorInQuote ??
    projectClosetInteriorDefault
  );

  // Paint options - room-level overrides
  const [paintWalls, setPaintWalls] = useState(room?.paintWalls ?? project?.globalPaintDefaults?.paintWalls ?? true);
  const [paintCeilings, setPaintCeilings] = useState(room?.paintCeilings ?? project?.globalPaintDefaults?.paintCeilings ?? true);
  const [paintTrim, setPaintTrim] = useState(room?.paintTrim ?? project?.globalPaintDefaults?.paintTrim ?? true);
  const [paintWindowFrames, setPaintWindowFrames] = useState(room?.paintWindowFrames ?? project?.globalPaintDefaults?.paintWindowFrames ?? true);
  const [paintDoorFrames, setPaintDoorFrames] = useState(room?.paintDoorFrames ?? project?.globalPaintDefaults?.paintDoorFrames ?? true);
  const [paintWindows, setPaintWindows] = useState(room?.paintWindows ?? project?.globalPaintDefaults?.paintWindows ?? true);
  const [paintDoors, setPaintDoors] = useState(room?.paintDoors ?? project?.globalPaintDefaults?.paintDoors ?? true);
  const [paintJambs, setPaintJambs] = useState(room?.paintJambs ?? project?.globalPaintDefaults?.paintDoorJambs ?? true);
  const [paintBaseboard, setPaintBaseboard] = useState(
    room?.paintBaseboard ?? project?.globalPaintDefaults?.paintBaseboards ?? project?.paintBaseboard ?? true
  );
  const [hasCrownMoulding, setHasCrownMoulding] = useState(room?.hasCrownMoulding ?? project?.globalPaintDefaults?.paintCrownMoulding ?? true);
  const [hasAccentWall, setHasAccentWall] = useState(room?.hasAccentWall ?? false);
  const [cathedralPeakHeight, setCathedralPeakHeight] = useState(
    room?.cathedralPeakHeight && room.cathedralPeakHeight > 0 ? formatMeasurementValue(room.cathedralPeakHeight, 'length', unitSystem, 2) : ""
  );

  // Room photos state
  const [photos, setPhotos] = useState<RoomPhoto[]>(room?.photos || []);
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [editingPhotoNote, setEditingPhotoNote] = useState("");

  // Openings state
  const [openings, setOpenings] = useState<Array<{id: string; width: string; height: string; hasInteriorTrim: boolean; hasExteriorTrim: boolean}>>(
    room?.openings?.map(o => ({
      id: o.id,
      width: o.width.toString(),
      height: o.height.toString(),
      hasInteriorTrim: o.hasInteriorTrim,
      hasExteriorTrim: o.hasExteriorTrim,
    })) || []
  );

  // Standalone notes field (available without photos)
  const [notes, setNotes] = useState(room?.notes || "");
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [infoModalTitle, setInfoModalTitle] = useState("");
  const [infoModalBody, setInfoModalBody] = useState("");
  const includeSingleClosetInteriorTouchedRef = useRef(false);
  const includeDoubleClosetInteriorTouchedRef = useRef(false);
  const prevSingleClosetCountRef = useRef<number>(parseInt(singleDoorClosets) || 0);
  const prevDoubleClosetCountRef = useRef<number>(parseInt(doubleDoorClosets) || 0);

  // Collapsible sections
  const [roomInfoExpanded, setRoomInfoExpanded] = useState(true);
  const [openingsClosetsExpanded, setOpeningsClosetsExpanded] = useState(false);
  const [paintOptionsExpanded, setPaintOptionsExpanded] = useState(false);
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [roomInfoConfirmed, setRoomInfoConfirmed] = useState(room?.roomInfoConfirmed ?? false);
  const [openingsClosetsConfirmed, setOpeningsClosetsConfirmed] = useState(room?.openingsClosetsConfirmed ?? false);
  const [paintOptionsConfirmed, setPaintOptionsConfirmed] = useState(room?.paintOptionsConfirmed ?? false);
  const confirmedCardColor = Colors.success + "50";
  const roomInfoSnapshotRef = useRef<string>("");
  const openingsClosetsSnapshotRef = useRef<string>("");
  const paintOptionsSnapshotRef = useRef<string>("");

  const roomInfoSnapshot = useMemo(
    () =>
      JSON.stringify({
        name,
        length,
        width,
        manualArea,
        isCathedral,
        cathedralPeakHeight,
      }),
    [name, length, width, manualArea, isCathedral, cathedralPeakHeight]
  );
  const openingsClosetsSnapshot = useMemo(
    () =>
      JSON.stringify({
        openings,
        windowCount,
        doorCount,
        hasCloset,
        singleDoorClosets,
        doubleDoorClosets,
        includeSingleClosetInteriorInQuote,
        includeDoubleClosetInteriorInQuote,
      }),
    [
      openings,
      windowCount,
      doorCount,
      hasCloset,
      singleDoorClosets,
      doubleDoorClosets,
      includeSingleClosetInteriorInQuote,
      includeDoubleClosetInteriorInQuote,
    ]
  );
  const paintOptionsSnapshot = useMemo(
    () =>
      JSON.stringify({
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
      }),
    [
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
    ]
  );

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [discardWidth, setDiscardWidth] = useState<number | null>(null);
  // Use ref to track saved state for cleanup - avoids stale closure issues
  const isSavedRef = useRef(false);
  const isKeyboardVisibleRef = useRef(false);
  const pendingSavePromptRef = useRef(false);
  // MD-002: Store the navigation action to dispatch when discarding
  const preventedNavigationActionRef = useRef<any>(null);

  // W-005, W-006: TextInput refs for focus navigation
  const nameRef = useRef<TextInput>(null);
  const lengthRef = useRef<TextInput>(null);
  const widthRef = useRef<TextInput>(null);
  const manualAreaRef = useRef<TextInput>(null);
  const openingRefs = useRef<Array<{ width: React.RefObject<TextInput>; height: React.RefObject<TextInput> }>>([]);
  const cathedralPeakHeightRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const notesCardRef = useRef<View>(null);
  const notesAccessoryID = useRef(`notes-${Math.random().toString(36).slice(2)}`).current;
  const singleClosetCount = parseInt(singleDoorClosets) || 0;
  const doubleClosetCount = parseInt(doubleDoorClosets) || 0;

  useEffect(() => {
    if (roomInfoConfirmed && !roomInfoSnapshotRef.current) {
      roomInfoSnapshotRef.current = roomInfoSnapshot;
    }
    if (roomInfoConfirmed && roomInfoSnapshotRef.current && roomInfoSnapshotRef.current !== roomInfoSnapshot) {
      setRoomInfoConfirmed(false);
    }
  }, [roomInfoConfirmed, roomInfoSnapshot]);

  useEffect(() => {
    if (openingsClosetsConfirmed && !openingsClosetsSnapshotRef.current) {
      openingsClosetsSnapshotRef.current = openingsClosetsSnapshot;
    }
    if (
      openingsClosetsConfirmed &&
      openingsClosetsSnapshotRef.current &&
      openingsClosetsSnapshotRef.current !== openingsClosetsSnapshot
    ) {
      setOpeningsClosetsConfirmed(false);
    }
  }, [openingsClosetsConfirmed, openingsClosetsSnapshot]);

  useEffect(() => {
    if (paintOptionsConfirmed && !paintOptionsSnapshotRef.current) {
      paintOptionsSnapshotRef.current = paintOptionsSnapshot;
    }
    if (paintOptionsConfirmed && paintOptionsSnapshotRef.current && paintOptionsSnapshotRef.current !== paintOptionsSnapshot) {
      setPaintOptionsConfirmed(false);
    }
  }, [paintOptionsConfirmed, paintOptionsSnapshot]);

  useEffect(() => {
    setPaintJambs(paintDoorFrames);
  }, [paintDoorFrames]);

  const getOpeningRefs = (index: number) => {
    if (!openingRefs.current[index]) {
      openingRefs.current[index] = {
        width: React.createRef<TextInput>(),
        height: React.createRef<TextInput>(),
      };
    }
    return openingRefs.current[index];
  };

  const openInfoModal = (title: string, body: string) => {
    setInfoModalTitle(title);
    setInfoModalBody(body);
    setInfoModalVisible(true);
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
      if (!isSavedRef.current && roomId) {
        // Check if room was never named
        if (!name || name.trim() === "") {
          const deleteRoomFn = useProjectStore.getState().deleteRoom;
          deleteRoomFn(projectId, roomId);
        }
      }
    };
  }, []);

  // Capture initial state snapshot when room data is first available
  useEffect(() => {
    if (room && initialStateRef.current !== null) return;

    // For new rooms, create initial snapshot immediately with empty state
    // For existing rooms, wait until room data is available
    if (isNewRoom) {
      initialStateRef.current = serializeRoomState(
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
        projectClosetInteriorDefault,
        projectClosetInteriorDefault,
        false,
        false,
        false
      );
      return;
    }

    if (!room || initialStateRef.current !== null) return;

    // Create initial snapshot of all editable fields
    initialStateRef.current = serializeRoomState(
      room.name || "",
      room.length && room.length > 0 ? room.length.toString() : "",
      room.width && room.width > 0 ? room.width.toString() : "",
      room.manualArea && room.manualArea > 0 ? room.manualArea.toString() : "",
      room.ceilingType === "cathedral",
      room.cathedralPeakHeight && room.cathedralPeakHeight > 0 ? room.cathedralPeakHeight.toString() : "",
      room.windowCount && room.windowCount > 0 ? room.windowCount.toString() : "",
      room.doorCount && room.doorCount > 0 ? room.doorCount.toString() : "",
      room.hasCloset || false,
      room.singleDoorClosets && room.singleDoorClosets > 0 ? room.singleDoorClosets.toString() : "",
      room.doubleDoorClosets && room.doubleDoorClosets > 0 ? room.doubleDoorClosets.toString() : "",
      room.paintWalls ?? project?.globalPaintDefaults?.paintWalls ?? true,
      room.paintCeilings ?? project?.globalPaintDefaults?.paintCeilings ?? true,
      room.paintTrim ?? project?.globalPaintDefaults?.paintTrim ?? true,
      room.paintWindowFrames ?? project?.globalPaintDefaults?.paintWindowFrames ?? true,
      room.paintDoorFrames ?? project?.globalPaintDefaults?.paintDoorFrames ?? true,
      room.paintWindows ?? project?.globalPaintDefaults?.paintWindows ?? true,
      room.paintDoors ?? project?.globalPaintDefaults?.paintDoors ?? true,
      room.paintJambs ?? project?.globalPaintDefaults?.paintDoorJambs ?? true,
      room.paintBaseboard ?? project?.globalPaintDefaults?.paintBaseboards ?? project?.paintBaseboard ?? true,
      room.hasCrownMoulding ?? project?.globalPaintDefaults?.paintCrownMoulding ?? true,
      room.hasAccentWall ?? false,
      room.includeSingleClosetInteriorInQuote ??
        room.includeClosetInteriorInQuote ??
        projectClosetInteriorDefault,
      room.includeDoubleClosetInteriorInQuote ??
        room.includeClosetInteriorInQuote ??
        projectClosetInteriorDefault,
      room.roomInfoConfirmed ?? false,
      room.openingsClosetsConfirmed ?? false,
      room.paintOptionsConfirmed ?? false
    );
  }, [room, project]);

  useEffect(() => {
    const currentSingleCount = parseInt(singleDoorClosets) || 0;
    const currentDoubleCount = parseInt(doubleDoorClosets) || 0;

    if (
      currentSingleCount > 0 &&
      prevSingleClosetCountRef.current === 0 &&
      !includeSingleClosetInteriorTouchedRef.current
    ) {
      setIncludeSingleClosetInteriorInQuote(projectClosetInteriorDefault);
    }

    if (
      currentDoubleCount > 0 &&
      prevDoubleClosetCountRef.current === 0 &&
      !includeDoubleClosetInteriorTouchedRef.current
    ) {
      setIncludeDoubleClosetInteriorInQuote(projectClosetInteriorDefault);
    }

    prevSingleClosetCountRef.current = currentSingleCount;
    prevDoubleClosetCountRef.current = currentDoubleCount;
  }, [singleDoorClosets, doubleDoorClosets, projectClosetInteriorDefault]);

  // Check for changes by comparing current state to initial snapshot
  useEffect(() => {
    if (initialStateRef.current === null) return;

    const currentState = serializeRoomState(
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
      includeSingleClosetInteriorInQuote,
      includeDoubleClosetInteriorInQuote,
      roomInfoConfirmed,
      openingsClosetsConfirmed,
      paintOptionsConfirmed
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
    includeSingleClosetInteriorInQuote,
    includeDoubleClosetInteriorInQuote,
    roomInfoConfirmed,
    openingsClosetsConfirmed,
    paintOptionsConfirmed,
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
  const generatePhotoFileName = (roomName: string, photoIndex: number): string => {
    const safeName = (roomName || "Room").replace(/[^a-zA-Z0-9]/g, "_");
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
    const missingConfirmations = [];
    if (!roomInfoConfirmed) missingConfirmations.push("Room Info");
    if (!openingsClosetsConfirmed) missingConfirmations.push("Openings & Closets");
    if (!paintOptionsConfirmed) missingConfirmations.push("Paint Options");

    if (missingConfirmations.length > 0) {
      openInfoModal(
        "Confirm Required",
        `Please confirm: ${missingConfirmations.join(", ")}`
      );
      return;
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert("Room Name Required", "Please enter a name for this room before saving.");
      return;
    }

    // If this is a new room, create it first
    let currentRoomId = roomId;
    if (isNewRoom) {
      currentRoomId = addRoom(projectId, floor);
    }

    if (!currentRoomId) return;

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

    const updatedRoom = {
      id: currentRoomId,
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
      paintJambs: paintDoorFrames,
      paintBaseboard,
      hasCrownMoulding,
      hasAccentWall,
      coatsWalls: coatsWallsForRoom,
      coatsCeiling: coatsCeilingForRoom,
      coatsTrim: coatsTrimForRoom,
      coatsDoors: coatsDoorsForRoom,
      includeWindows: true,
      includeDoors: true,
      includeTrim: true,
      includeClosetInteriorInQuote:
        includeSingleClosetInteriorInQuote || includeDoubleClosetInteriorInQuote,
      includeSingleClosetInteriorInQuote,
      includeDoubleClosetInteriorInQuote,
      roomInfoConfirmed,
      openingsClosetsConfirmed,
      paintOptionsConfirmed,
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
      updatedRoom as any,
      quoteBuilder,
      pricing,
      undefined,
      projectClosetInteriorDefault
    );

    console.log("[RoomEditor] Saving room with gallon usage:", {
      wall: pricingSummaryForSave.wallPaintGallons,
      ceiling: pricingSummaryForSave.ceilingPaintGallons,
      trim: pricingSummaryForSave.trimPaintGallons,
      door: pricingSummaryForSave.doorPaintGallons,
    });

    // Compute and persist room totals (single source of truth)
    const finalRoom = {
      ...updatedRoom,
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

    console.log("[RoomEditor] Saving room totals (using computeRoomPricingSummary):", {
      laborTotal: finalRoom.laborTotal,
      materialsTotal: finalRoom.materialsTotal,
      grandTotal: finalRoom.grandTotal,
    });

    updateRoom(projectId, currentRoomId, finalRoom as any);

    // Update initial snapshot to the newly saved state
    initialStateRef.current = serializeRoomState(
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
      includeSingleClosetInteriorInQuote,
      includeDoubleClosetInteriorInQuote,
      roomInfoConfirmed,
      openingsClosetsConfirmed,
      paintOptionsConfirmed
    );

    setTimeout(() => {
      navigation.goBack();
    }, 10);
  };

  const handleDiscardAndLeave = () => {
    // For new rooms with no name, nothing was created so just navigate back
    // For existing rooms with no name, delete them
    const trimmedName = name.trim();
    if (!trimmedName && !isNewRoom && roomId) {
      deleteRoom(projectId, roomId);
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

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

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
  // For new rooms, calculate with temp data; for existing rooms, use the saved room data
  // IMPORTANT: Convert display values to imperial before passing to calculation
  const previewLengthFeet = parseDisplayValue(length || "0", 'length', unitSystem);
  const previewWidthFeet = parseDisplayValue(width || "0", 'length', unitSystem);
  const previewManualAreaSqFt = manualArea ? parseDisplayValue(manualArea, 'area', unitSystem) : undefined;
  const previewCathedralPeakHeightFeet = cathedralPeakHeight ? parseDisplayValue(cathedralPeakHeight, 'length', unitSystem) : undefined;

  const coatsWallsForRoom = room?.coatsWalls ?? project?.globalPaintDefaults?.defaultWallCoats ?? 2;
  const coatsCeilingForRoom = room?.coatsCeiling ?? project?.globalPaintDefaults?.defaultCeilingCoats ?? 2;
  const coatsTrimForRoom = room?.coatsTrim ?? project?.globalPaintDefaults?.defaultTrimCoats ?? 2;
  const coatsDoorsForRoom = room?.coatsDoors ?? project?.globalPaintDefaults?.defaultDoorCoats ?? 2;

  const pricingSummary = computeRoomPricingSummary(
    {
      id: roomId || "temp-new-room",
      name: name.trim() || "Unnamed Room",
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
      coatsWalls: coatsWallsForRoom,
      coatsCeiling: coatsCeilingForRoom,
      coatsTrim: coatsTrimForRoom,
      coatsDoors: coatsDoorsForRoom,
      includeWindows: true,
      includeDoors: true,
      includeTrim: true,
      includeClosetInteriorInQuote:
        includeSingleClosetInteriorInQuote || includeDoubleClosetInteriorInQuote,
      includeSingleClosetInteriorInQuote,
      includeDoubleClosetInteriorInQuote,
      openings: openings.map(o => ({
        id: o.id,
        width: parseInt(o.width) || 0,
        height: parseInt(o.height) || 0,
        hasInteriorTrim: o.hasInteriorTrim,
        hasExteriorTrim: o.hasExteriorTrim,
      })),
      photos: photos.map((p, idx) => ({
        ...p,
        fileName: generatePhotoFileName(name || "room", idx + 1),
      })),
      notes: notes.trim() || undefined,
    } as any,
    quoteBuilder,
    pricing,
    undefined,
    projectClosetInteriorDefault
  );

  if (!project) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.backgroundWarmGray }}>
        <Text style={{ fontSize: Typography.h2.fontSize, color: Colors.mediumGray }}>Project not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: Colors.white }}>
    <KeyboardAvoidingView
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      style={{ flex: 1, backgroundColor: Colors.backgroundWarmGray }}
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
            {(name || "Unnamed Room") + "'s Details"}
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
        {/* Room Information Section */}
        <Card
          style={{
            marginBottom: Spacing.md,
            paddingTop: roomInfoExpanded ? Spacing.md : Spacing.md,
            paddingBottom: Spacing.sm,
            backgroundColor: roomInfoConfirmed ? confirmedCardColor : Colors.white,
          }}
        >
          {roomInfoExpanded ? (
            <Pressable
              onPress={() => setRoomInfoExpanded(false)}
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
              onPress={() => setRoomInfoExpanded(true)}
              style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 0 }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.darkCharcoal }}>
                  Room Name
                </Text>
                <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginTop: Spacing.xs }}>
                  Room name and dimensions
                </Text>
              </View>
              <Ionicons name="chevron-down" size={24} color={Colors.mediumGray} />
            </Pressable>
          )}

          {roomInfoExpanded && (
            <>
              {/* Room Name */}
              <View style={{ marginBottom: Spacing.md }}>
                <FormInput
                  ref={nameRef}
                  label="Room Name"
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter room name"
                  nextFieldRef={lengthRef}
                  returnKeyType="next"
                  className="mb-0"
                  accessibilityLabel="Room name input"
                  accessibilityHint="Enter a name for this room"
                />
              </View>

              {/* Room Dimensions: Length × Width = Area */}
              <View style={{ marginBottom: Spacing.md }}>
                <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                  Room Size
                </Text>
                {/* Labels row */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.xs, marginBottom: 2 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, textAlign: "center" }}>
                      Length ({unitSystem === "metric" ? "m" : "ft"})
                    </Text>
                  </View>
                  <Text style={{ fontSize: 18, color: "transparent" }}>×</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, textAlign: "center" }}>
                      Width ({unitSystem === "metric" ? "m" : "ft"})
                    </Text>
                  </View>
                  <Text style={{ fontSize: 18, color: "transparent" }}>=</Text>
                  <View style={{ flex: 1.2 }}>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, textAlign: "center" }}>
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
            <View>
              <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: Spacing.md }}>
                <View style={{ flex: 1, marginTop: Typography.caption.fontSize + Spacing.xs + Spacing.sm }}>
                  <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                    <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500", color: Colors.darkCharcoal }}>
                      Peak Height
                    </Text>
                    <Pressable
                      onPress={() => openInfoModal("Peak Height", "Height at the highest point of the cathedral ceiling")}
                      hitSlop={8}
                      style={{ marginLeft: Spacing.xs, transform: [{ translateY: -2 }] }}
                    >
                      <Ionicons name="help-circle-outline" size={13} color={Colors.mediumGray} accessibilityLabel="Peak height help" />
                    </Pressable>
                  </View>
                </View>
                <View style={{ alignItems: "center" }}>
                  <Text
                    style={{
                      width: 68,
                      fontSize: Typography.caption.fontSize,
                      color: Colors.mediumGray,
                      marginBottom: Spacing.xs,
                      textAlign: "center",
                    }}
                  >
                    Feet
                  </Text>
                  <FormInput
                    ref={cathedralPeakHeightRef}
                    previousFieldRef={manualAreaRef}
                    label=""
                    value={cathedralPeakHeight}
                    onChangeText={setCathedralPeakHeight}
                    keyboardType="numeric"
                    placeholder="0"
                    accessibilityLabel="Cathedral peak height input"
                    inputContainerStyle={{ width: 68 }}
                    inputTextStyle={{ textAlign: "center" }}
                    className="mb-0"
                  />
                </View>
              </View>
            </View>
          )}
              <View style={{ alignItems: "flex-end", marginTop: isCathedral ? Spacing.md : Spacing.sm, marginBottom: Spacing.sm }}>
                <Pressable
                  onPress={() => {
                    roomInfoSnapshotRef.current = roomInfoSnapshot;
                    setRoomInfoConfirmed(true);
                    setOpeningsClosetsExpanded(true);
                  }}
                  style={{
                    backgroundColor: roomInfoConfirmed ? Colors.success : Colors.primaryBlue,
                    borderRadius: 8,
                    paddingHorizontal: Spacing.sm,
                    paddingVertical: 10,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.white }}>
                    {roomInfoConfirmed ? "Confirmed" : "Confirm"}
                  </Text>
                </Pressable>
              </View>
            </>
          )}
        </Card>

        {/* Openings & Closets Section - Collapsable */}
        <Card
          style={{
            marginBottom: Spacing.md,
            backgroundColor: openingsClosetsConfirmed ? confirmedCardColor : Colors.white,
            paddingBottom: Spacing.sm,
          }}
        >
          <Pressable
            onPress={() => setOpeningsClosetsExpanded(!openingsClosetsExpanded)}
            style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.darkCharcoal }}>
                Openings & Closets
              </Text>
              <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginTop: Spacing.xs }}>
                Windows, doors, openings, and closets
              </Text>
            </View>
            <Ionicons
              name={openingsClosetsExpanded ? "chevron-up" : "chevron-down"}
              size={24}
              color={Colors.mediumGray}
            />
          </Pressable>

          {openingsClosetsExpanded && (
            <View style={{ marginTop: Spacing.md }}>
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
                  borderRadius: 8,
                  paddingHorizontal: 4,
                  paddingVertical: 2,
                  borderWidth: 1,
                  borderColor: Colors.neutralGray,
                  gap: Spacing.xs,
                }}
              >
                <Pressable
                  onPress={() => {
                    const current = openings.length;
                    if (current > 0) {
                      setOpenings(openings.slice(0, -1));
                    }
                  }}
                  style={{
                    width: 28,
                    height: 32,
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
                    {openings.length}
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    const newOpening = {
                      id: `opening-${Date.now()}`,
                      width: "36",
                      height: "80",
                      hasInteriorTrim: projectPaintTrimDefault,
                      hasExteriorTrim: projectPaintTrimDefault,
                    };
                    setOpenings([...openings, newOpening]);
                  }}
                  style={{
                    width: 28,
                    height: 32,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ fontSize: 22, color: Colors.primaryBlue, fontWeight: "600" as any }}>+</Text>
                </Pressable>
              </View>
            </View>

            {openings.length > 0 && (
              <View style={{ gap: Spacing.md, marginBottom: Spacing.md }}>
                {openings.map((opening, index) => (
                  <View key={opening.id}>
                    {(() => {
                      const openingFieldRefs = getOpeningRefs(index);
                      const previousOpeningRefs = index > 0 ? getOpeningRefs(index - 1) : null;
                      const nextOpeningRefs = index < openings.length - 1 ? getOpeningRefs(index + 1) : null;
                      const labelOffset = Typography.caption.fontSize + Spacing.xs + Spacing.sm;

                      return (
                        <>
                          <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: Spacing.md, marginBottom: Spacing.sm }}>
                            <View style={{ flex: 1, marginTop: labelOffset }}>
                              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500" as any, color: Colors.darkCharcoal }}>
                                Opening {index + 1}
                              </Text>
                            </View>
                            <View style={{ alignItems: "center" }}>
                              <Text style={{ width: 68, fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.xs, textAlign: "center" }}>
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
                                inputContainerStyle={{ width: 68 }}
                                inputTextStyle={{ textAlign: "center" }}
                                className="mb-0"
                              />
                            </View>
                            <View style={{ alignItems: "center" }}>
                              <Text style={{ width: 68, fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.xs, textAlign: "center" }}>
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
                                inputContainerStyle={{ width: 68 }}
                                inputTextStyle={{ textAlign: "center" }}
                                className="mb-0"
                              />
                            </View>
                          </View>

                          <View style={{ gap: Spacing.sm }}>
                            <Toggle
                              label="Interior Trim"
                              value={opening.hasInteriorTrim}
                              onValueChange={() => {
                                const updated = [...openings];
                                updated[index].hasInteriorTrim = !updated[index].hasInteriorTrim;
                                setOpenings(updated);
                              }}
                              className="mb-0"
                            />
                            <Toggle
                              label="Exterior Trim"
                              value={opening.hasExteriorTrim}
                              onValueChange={() => {
                                const updated = [...openings];
                                updated[index].hasExteriorTrim = !updated[index].hasExteriorTrim;
                                setOpenings(updated);
                              }}
                              className="mb-0"
                            />
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
                Window Count
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
                  gap: Spacing.xs,
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
                    borderRadius: 8,
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
                Door Count
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
                  gap: Spacing.xs,
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
                    borderRadius: 8,
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
                  borderRadius: 8,
                  paddingHorizontal: 4,
                  paddingVertical: 2,
                  borderWidth: 1,
                  borderColor: Colors.neutralGray,
                  gap: Spacing.xs,
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
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ fontSize: 22, color: Colors.primaryBlue, fontWeight: "600" as any }}>+</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {singleClosetCount > 0 && (
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: Spacing.xs, marginBottom: Spacing.sm }}>
              <View style={{ flex: 1, marginRight: Spacing.md }}>
                <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                  <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500" as any, color: Colors.darkCharcoal }}>
                    Include Closet Interior
                  </Text>
                  <Pressable
                    onPress={() => openInfoModal("Closet Interior Calculation", "Closets are treated as 2 ft deep cavities with interior walls, ceiling, and baseboard.")}
                    hitSlop={8}
                    style={{ marginLeft: Spacing.xs, transform: [{ translateY: -2 }] }}
                  >
                    <Ionicons name="help-circle-outline" size={13} color={Colors.mediumGray} accessibilityLabel="Closet interior help" />
                  </Pressable>
                </View>
              </View>
              <Switch
                value={includeSingleClosetInteriorInQuote}
                onValueChange={(value) => {
                  includeSingleClosetInteriorTouchedRef.current = true;
                  setIncludeSingleClosetInteriorInQuote(value);
                }}
                trackColor={{
                  false: Colors.neutralGray,
                  true: Colors.primaryBlue,
                }}
                thumbColor={Colors.white}
                ios_backgroundColor={Colors.neutralGray}
              />
            </View>
          )}

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
                  borderRadius: 8,
                  paddingHorizontal: 4,
                  paddingVertical: 2,
                  borderWidth: 1,
                  borderColor: Colors.neutralGray,
                  gap: Spacing.xs,
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
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ fontSize: 22, color: Colors.primaryBlue, fontWeight: "600" as any }}>+</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {doubleClosetCount > 0 && (
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: Spacing.xs }}>
              <View style={{ flex: 1, marginRight: Spacing.md }}>
                <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                  <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500" as any, color: Colors.darkCharcoal }}>
                    Include Closet Interior
                  </Text>
                  <Pressable
                    onPress={() => openInfoModal("Closet Interior Calculation", "Closets are treated as 2 ft deep cavities with interior walls, ceiling, and baseboard.")}
                    hitSlop={8}
                    style={{ marginLeft: Spacing.xs, transform: [{ translateY: -2 }] }}
                  >
                    <Ionicons name="help-circle-outline" size={13} color={Colors.mediumGray} accessibilityLabel="Closet interior help" />
                  </Pressable>
                </View>
              </View>
              <Switch
                value={includeDoubleClosetInteriorInQuote}
                onValueChange={(value) => {
                  includeDoubleClosetInteriorTouchedRef.current = true;
                  setIncludeDoubleClosetInteriorInQuote(value);
                }}
                trackColor={{
                  false: Colors.neutralGray,
                  true: Colors.primaryBlue,
                }}
                thumbColor={Colors.white}
                ios_backgroundColor={Colors.neutralGray}
              />
            </View>
          )}
              <View style={{ alignItems: "flex-end", marginTop: Spacing.sm, marginBottom: Spacing.sm }}>
                <Pressable
                  onPress={() => {
                    openingsClosetsSnapshotRef.current = openingsClosetsSnapshot;
                    setOpeningsClosetsConfirmed(true);
                    setPaintOptionsExpanded(true);
                  }}
                  style={{
                    backgroundColor: openingsClosetsConfirmed ? Colors.success : Colors.primaryBlue,
                    borderRadius: 8,
                    paddingHorizontal: Spacing.sm,
                    paddingVertical: 10,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.white }}>
                    {openingsClosetsConfirmed ? "Confirmed" : "Confirm"}
                  </Text>
                </Pressable>
              </View>
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
          const wallCoverage = Math.max(1, safeNumber(pricing.wallCoverageSqFtPerGallon, 350));
          const ceilingCoverage = Math.max(1, safeNumber(pricing.ceilingCoverageSqFtPerGallon, 350));
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

          const windowCountValue = parseInt(windowCount) || 0;
          const doorCountValue = parseInt(doorCount) || 0;
          const openingsCount = openings.length;
          const closetCount = singleClosetCount + doubleClosetCount;
          const closetDoorCount = singleClosetCount + (doubleClosetCount * 2);
          const doorCountForSummary = doorCountValue + closetDoorCount;
          const doorFrameCount = doorCountValue + singleClosetCount + doubleClosetCount;
          const closetInteriorEnabled =
            includeSingleClosetInteriorInQuote || includeDoubleClosetInteriorInQuote;

          const openingTrimWidthFt = calcSettings.openingTrimWidth / 12;
          const openingTrimLF = openings.reduce((total, opening) => {
            const openingWidthFt = (parseFloat(opening.width) || 0) / 12;
            const openingHeightFt = (parseFloat(opening.height) || 0) / 12;
            const interiorTrimPerimeter = opening.hasInteriorTrim
              ? (2 * openingHeightFt) + openingWidthFt
              : 0;
            const exteriorTrimPerimeter = opening.hasExteriorTrim
              ? (2 * openingHeightFt) + openingWidthFt
              : 0;
            return total + interiorTrimPerimeter + exteriorTrimPerimeter;
          }, 0);
          const openingTrimSqFt = openingTrimLF * openingTrimWidthFt;
          const openingTrimGallons = (openingTrimSqFt / trimCoverage) * pricingSummary.coatsTrim;
          const openingTrimMaterialsCost = Math.ceil(openingTrimGallons) * safeNumber(pricing.trimPaintPerGallon, 0);
          const openingTrimLaborCost =
            openingTrimLF * safeNumber(pricing.baseboardLaborPerLF, 0) * getCoatLaborMultiplier(pricingSummary.coatsTrim);

          // Window Frames
          const windowLaborCost = windowCountValue * safeNumber(pricing.windowLabor, 0) * getCoatLaborMultiplier(pricingSummary.coatsTrim);
          const windowTrimPerimeter = 2 * (calcSettings.windowWidth + calcSettings.windowHeight);
          const windowTrimLF = windowCountValue * windowTrimPerimeter;
          const windowTrimWidthFt = calcSettings.windowTrimWidth / 12;
          const windowTrimSqFt = windowCountValue * windowTrimPerimeter * windowTrimWidthFt;
          const windowTrimGallons = (windowTrimSqFt / trimCoverage) * pricingSummary.coatsTrim;
          const windowMaterialsCost = Math.ceil(windowTrimGallons) * safeNumber(pricing.trimPaintPerGallon, 0);

          // Door Frames
          const doorFrameLaborCost = doorFrameCount * safeNumber(pricing.doorLabor, 0) * getCoatLaborMultiplier(pricingSummary.coatsTrim);
          const doorTrimWidthFt = calcSettings.doorTrimWidth / 12;
          const doorTrimPerimeter = (2 * calcSettings.doorHeight) + calcSettings.doorWidth;
          const doorTrimLF = doorCountValue * doorTrimPerimeter;
          const doorTrimSqFt = doorCountValue * doorTrimPerimeter * doorTrimWidthFt;
          const singleClosetTrimWidthFt = calcSettings.singleClosetTrimWidth / 12;
          const singleClosetPerimeter = (2 * calcSettings.doorHeight) + (calcSettings.singleClosetWidth / 12);
          const singleClosetTrimLF = singleClosetCount * singleClosetPerimeter;
          const singleClosetTrimSqFt = singleClosetCount * singleClosetPerimeter * singleClosetTrimWidthFt;
          const doubleClosetTrimWidthFt = calcSettings.doubleClosetTrimWidth / 12;
          const doubleClosetPerimeter = (2 * calcSettings.doorHeight) + (calcSettings.doubleClosetWidth / 12);
          const doubleClosetTrimLF = doubleClosetCount * doubleClosetPerimeter;
          const doubleClosetTrimSqFt = doubleClosetCount * doubleClosetPerimeter * doubleClosetTrimWidthFt;
          const doorFrameTrimLF = doorTrimLF + singleClosetTrimLF + doubleClosetTrimLF;
          const doorFrameTrimSqFt = doorTrimSqFt + singleClosetTrimSqFt + doubleClosetTrimSqFt;
          const doorFrameGallons = (doorFrameTrimSqFt / trimCoverage) * pricingSummary.coatsTrim;
          const doorFrameMaterialsCost = Math.ceil(doorFrameGallons) * safeNumber(pricing.trimPaintPerGallon, 0);

          // Doors (faces)
          const doorLaborCost = doorCountForSummary * safeNumber(pricing.doorLabor, 0) * getCoatLaborMultiplier(pricingSummary.coatsDoors);
          const doorFaceSqFt = doorCountForSummary * (calcSettings.doorHeight * calcSettings.doorWidth) * 2;
          const doorFaceGallons = (doorFaceSqFt * pricingSummary.coatsDoors) / trimCoverage;
          const doorMaterialsCost = Math.ceil(doorFaceGallons) * safeNumber(pricing.trimPaintPerGallon, 0);

          const closetWallLaborCost = pricingSummary.closetWallArea * safeNumber(pricing.wallLaborPerSqFt, 0) * getCoatLaborMultiplier(pricingSummary.coatsWalls);
          const closetWallMaterialsCost = Math.ceil((pricingSummary.closetWallArea / wallCoverage) * pricingSummary.coatsWalls) * safeNumber(pricing.wallPaintPerGallon, 0);
          const closetCeilingLaborCost = pricingSummary.closetCeilingArea * safeNumber(pricing.ceilingLaborPerSqFt, 0) * getCoatLaborMultiplier(pricingSummary.coatsCeiling);
          const closetCeilingMaterialsCost = Math.ceil((pricingSummary.closetCeilingArea / ceilingCoverage) * pricingSummary.coatsCeiling) * safeNumber(pricing.ceilingPaintPerGallon, 0);
          const closetBaseboardLaborCost = pricingSummary.closetBaseboardLF * safeNumber(pricing.baseboardLaborPerLF, 0) * getCoatLaborMultiplier(pricingSummary.coatsTrim);
          const closetBaseboardWidthFt = calcSettings.baseboardWidth / 12;
          const closetBaseboardTrimSqFt = pricingSummary.closetBaseboardLF * closetBaseboardWidthFt;
          const closetBaseboardGallons = (closetBaseboardTrimSqFt / trimCoverage) * pricingSummary.coatsTrim;
          const closetBaseboardMaterialsCost = Math.ceil(closetBaseboardGallons) * safeNumber(pricing.trimPaintPerGallon, 0);
          const closetInteriorLaborCost = closetWallLaborCost + closetCeilingLaborCost + closetBaseboardLaborCost;
          const closetInteriorMaterialsCost = closetWallMaterialsCost + closetCeilingMaterialsCost + closetBaseboardMaterialsCost;
          const summaryLaborTotal =
            (paintWalls ? wallLaborCost : 0) +
            (paintCeilings ? ceilingLaborCost : 0) +
            (paintBaseboard ? baseboardLaborCost : 0) +
            (hasCrownMoulding ? crownLaborCost : 0) +
            (windowCountValue > 0 ? (paintWindowFrames ? windowLaborCost : 0) : 0) +
            (doorFrameCount > 0 ? (paintDoorFrames ? doorFrameLaborCost : 0) : 0) +
            (doorCountForSummary > 0 ? (paintDoors ? doorLaborCost : 0) : 0) +
            (openingsCount > 0 ? (paintDoorFrames ? openingTrimLaborCost : 0) : 0) +
            (closetCount > 0 ? (closetInteriorEnabled ? closetInteriorLaborCost : 0) : 0);
          const summaryMaterialsTotal =
            (paintWalls ? wallMaterialsCost : 0) +
            (paintCeilings ? ceilingMaterialsCost : 0) +
            (paintBaseboard ? baseboardMaterialsCost : 0) +
            (hasCrownMoulding ? crownMaterialsCost : 0) +
            (windowCountValue > 0 ? (paintWindowFrames ? windowMaterialsCost : 0) : 0) +
            (doorFrameCount > 0 ? (paintDoorFrames ? doorFrameMaterialsCost : 0) : 0) +
            (doorCountForSummary > 0 ? (paintDoors ? doorMaterialsCost : 0) : 0) +
            (openingsCount > 0 ? (paintDoorFrames ? openingTrimMaterialsCost : 0) : 0) +
            (closetCount > 0 ? (closetInteriorEnabled ? closetInteriorMaterialsCost : 0) : 0);

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
                  {paintWalls && (
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                      <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>Wall</Text>
                      <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>
                        {formatMeasurement(Math.ceil(pricingSummary.wallArea), "area", unitSystem, 0)}
                      </Text>
                    </View>
                  )}
                  {paintCeilings && (
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                      <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>Ceiling</Text>
                      <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>
                        {formatMeasurement(Math.ceil(pricingSummary.ceilingArea), "area", unitSystem, 0)}
                      </Text>
                    </View>
                  )}
                  {paintBaseboard && pricingSummary.baseboardLF > 0 && (
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                      <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>Baseboard</Text>
                      <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>
                        {formatMeasurement(Math.ceil(pricingSummary.baseboardLF), "linearFeet", unitSystem, 0)}
                      </Text>
                    </View>
                  )}
                  {hasCrownMoulding && pricingSummary.crownMouldingLF > 0 && (
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                      <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>Crown Mld</Text>
                      <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>
                        {formatMeasurement(Math.ceil(pricingSummary.crownMouldingLF), "linearFeet", unitSystem, 0)}
                      </Text>
                    </View>
                  )}
                  {windowCountValue > 0 && (
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                      <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>Windows</Text>
                      <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>
                        {windowCountValue}
                      </Text>
                    </View>
                  )}
                  {doorFrameCount > 0 && (
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                      <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>Door Frames</Text>
                      <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>
                        {doorFrameCount}
                      </Text>
                    </View>
                  )}
                  {doorCountForSummary > 0 && (
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                      <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>Doors</Text>
                      <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>
                        {doorCountForSummary}
                      </Text>
                    </View>
                  )}
                  {openingsCount > 0 && (
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                      <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>Openings</Text>
                      <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>
                        {openingsCount}
                      </Text>
                    </View>
                  )}
                  {closetCount > 0 && (
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                      <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>Closets</Text>
                      <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>
                        {closetCount}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Right Section - Labor + Materials (Gallons) */}
                <View style={{ flex: 2, backgroundColor: "#E3F2FD", borderRadius: BorderRadius.default, padding: Spacing.md }}>
                  <Text style={{ fontSize: 13, color: Colors.mediumGray, textAlign: "right", marginBottom: Spacing.xs }}>
                    Labor
                  </Text>

                  {paintWalls && (
                    <Text style={{ fontSize: 13, color: Colors.darkCharcoal, textAlign: "right", marginBottom: Spacing.xs }}>
                      ${Math.round(wallLaborCost)}
                    </Text>
                  )}
                  {paintCeilings && (
                    <Text style={{ fontSize: 13, color: Colors.darkCharcoal, textAlign: "right", marginBottom: Spacing.xs }}>
                      ${Math.round(ceilingLaborCost)}
                    </Text>
                  )}
                  {paintBaseboard && pricingSummary.baseboardLF > 0 && (
                    <Text style={{ fontSize: 13, color: Colors.darkCharcoal, textAlign: "right", marginBottom: Spacing.xs }}>
                      ${Math.round(baseboardLaborCost)}
                    </Text>
                  )}
                  {hasCrownMoulding && pricingSummary.crownMouldingLF > 0 && (
                    <Text style={{ fontSize: 13, color: Colors.darkCharcoal, textAlign: "right", marginBottom: Spacing.xs }}>
                      ${Math.round(crownLaborCost)}
                    </Text>
                  )}
                  {windowCountValue > 0 && (
                    <Text style={{ fontSize: 13, color: Colors.darkCharcoal, textAlign: "right", marginBottom: Spacing.xs }}>
                      ${Math.round(paintWindowFrames ? windowLaborCost : 0)}
                    </Text>
                  )}
                  {doorFrameCount > 0 && (
                    <Text style={{ fontSize: 13, color: Colors.darkCharcoal, textAlign: "right", marginBottom: Spacing.xs }}>
                      ${Math.round(paintDoorFrames ? doorFrameLaborCost : 0)}
                    </Text>
                  )}
                  {doorCountForSummary > 0 && (
                    <Text style={{ fontSize: 13, color: Colors.darkCharcoal, textAlign: "right", marginBottom: Spacing.xs }}>
                      ${Math.round(paintDoors ? doorLaborCost : 0)}
                    </Text>
                  )}
                  {openingsCount > 0 && (
                    <Text style={{ fontSize: 13, color: Colors.darkCharcoal, textAlign: "right", marginBottom: Spacing.xs }}>
                      ${Math.round(paintDoorFrames ? openingTrimLaborCost : 0)}
                    </Text>
                  )}
                  {closetCount > 0 && (
                    <Text style={{ fontSize: 13, color: Colors.darkCharcoal, textAlign: "right", marginBottom: Spacing.xs }}>
                      ${Math.round(closetInteriorEnabled ? closetInteriorLaborCost : 0)}
                    </Text>
                  )}

                  <View style={{ height: 1, backgroundColor: "#90CAF9", marginVertical: Spacing.xs }} />

                  <View style={{ alignItems: "flex-end", marginBottom: Spacing.sm }}>
                    <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "700" as any, color: Colors.darkCharcoal }}>
                      Labor Total:
                    </Text>
                    <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: "700" as any, color: Colors.primaryBlue }}>
                      ${Math.round(summaryLaborTotal).toLocaleString()}
                    </Text>
                  </View>

                  <Text style={{ fontSize: 13, color: Colors.mediumGray, textAlign: "right", marginBottom: Spacing.xs }}>
                    Materials (Gallons)
                  </Text>
                  {paintWalls && pricingSummary.wallPaintGallons > 0 && (
                    <Text style={{ fontSize: 13, color: Colors.darkCharcoal, textAlign: "right", marginBottom: Spacing.xs }}>
                      Wall: {pricingSummary.wallPaintGallons.toFixed(2)} gal
                    </Text>
                  )}
                  {paintCeilings && pricingSummary.ceilingPaintGallons > 0 && (
                    <Text style={{ fontSize: 13, color: Colors.darkCharcoal, textAlign: "right", marginBottom: Spacing.xs }}>
                      Ceiling: {pricingSummary.ceilingPaintGallons.toFixed(2)} gal
                    </Text>
                  )}
                  {pricingSummary.trimPaintGallons > 0 && (
                    <Text style={{ fontSize: 13, color: Colors.darkCharcoal, textAlign: "right", marginBottom: Spacing.xs }}>
                      Trim: {pricingSummary.trimPaintGallons.toFixed(2)} gal
                    </Text>
                  )}
                  {paintDoors && pricingSummary.doorPaintGallons > 0 && (
                    <Text style={{ fontSize: 13, color: Colors.darkCharcoal, textAlign: "right" }}>
                      Doors: {pricingSummary.doorPaintGallons.toFixed(2)} gal
                    </Text>
                  )}
                </View>
              </View>
            </Card>
          );
        })()}

        {/* Paint Options Section - Collapsable */}
        <Card
          style={{
            marginBottom: Spacing.md,
            backgroundColor: paintOptionsConfirmed ? confirmedCardColor : Colors.white,
            paddingBottom: Spacing.sm,
          }}
        >
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
              <View style={{ alignItems: "flex-end", marginTop: Spacing.sm, marginBottom: Spacing.sm }}>
                <Pressable
                  onPress={() => {
                    paintOptionsSnapshotRef.current = paintOptionsSnapshot;
                    setPaintOptionsConfirmed(true);
                  }}
                  style={{
                    backgroundColor: paintOptionsConfirmed ? Colors.success : Colors.primaryBlue,
                    borderRadius: 8,
                    paddingHorizontal: Spacing.sm,
                    paddingVertical: 10,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.white }}>
                    {paintOptionsConfirmed ? "Confirmed" : "Confirm"}
                  </Text>
                </Pressable>
              </View>
            </View>
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
                  Room notes and reminders
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
                placeholder="Add notes about this room..."
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
                    borderRadius: BorderRadius.default,
                    padding: Spacing.md,
                    minHeight: 100,
                    marginTop: Spacing.md,
                  }
                ]}
              />
            )}
          </Card>
        </View>

        {/* Room Photos Section */}
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
              {(name ? name : "Room") + "'s Photos"}
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

        </Card>

        {/* Test Mode: Detailed Calculation Breakdown */}
        {testMode && pricingSummary && (parseFloat(length) > 0 || parseFloat(width) > 0 || parseFloat(manualArea) > 0) && (() => {
          const secondCoatMultiplier = safeNumber(pricing.secondCoatLaborMultiplier, 2.0);
          const getCoatLaborMultiplier = (coats: number): number => coats <= 1 ? 1.0 : secondCoatMultiplier;
          const calcSettings = useCalculationSettings.getState().settings;
          const wallCoverage = Math.max(1, safeNumber(pricing.wallCoverageSqFtPerGallon, 350));
          const ceilingCoverage = Math.max(1, safeNumber(pricing.ceilingCoverageSqFtPerGallon, 350));
          const trimCoverage = Math.max(1, safeNumber(pricing.trimCoverageSqFtPerGallon, 400));
          const windowCountValue = parseInt(windowCount) || 0;
          const doorCountValue = parseInt(doorCount) || 0;
          const openingsCount = openings.length;
          const closetCount = singleClosetCount + doubleClosetCount;
          const closetDoorCount = singleClosetCount + (doubleClosetCount * 2);
          const doorCountForSummary = doorCountValue + closetDoorCount;
          const doorFrameCount = doorCountValue + singleClosetCount + doubleClosetCount;
          const closetInteriorEnabled =
            includeSingleClosetInteriorInQuote || includeDoubleClosetInteriorInQuote;

          const openingTrimWidthFt = calcSettings.openingTrimWidth / 12;
          const openingTrimLF = openings.reduce((total, opening) => {
            const openingWidthFt = (parseFloat(opening.width) || 0) / 12;
            const openingHeightFt = (parseFloat(opening.height) || 0) / 12;
            const interiorTrimPerimeter = opening.hasInteriorTrim
              ? (2 * openingHeightFt) + openingWidthFt
              : 0;
            const exteriorTrimPerimeter = opening.hasExteriorTrim
              ? (2 * openingHeightFt) + openingWidthFt
              : 0;
            return total + interiorTrimPerimeter + exteriorTrimPerimeter;
          }, 0);
          const openingTrimSqFt = openingTrimLF * openingTrimWidthFt;
          const openingTrimGallons = (openingTrimSqFt / trimCoverage) * pricingSummary.coatsTrim;
          const openingTrimMaterialsCost = Math.ceil(openingTrimGallons) * safeNumber(pricing.trimPaintPerGallon, 0);
          const openingTrimLaborCost =
            openingTrimLF * safeNumber(pricing.baseboardLaborPerLF, 0) * getCoatLaborMultiplier(pricingSummary.coatsTrim);

          const wallLaborCost = pricingSummary.wallArea * safeNumber(pricing.wallLaborPerSqFt, 0) * getCoatLaborMultiplier(pricingSummary.coatsWalls);
          const wallMaterialsCost = Math.ceil(pricingSummary.wallPaintGallons) * safeNumber(pricing.wallPaintPerGallon, 0);
          const ceilingLaborCost = pricingSummary.ceilingArea * safeNumber(pricing.ceilingLaborPerSqFt, 0) * getCoatLaborMultiplier(pricingSummary.coatsCeiling);
          const ceilingMaterialsCost = Math.ceil(pricingSummary.ceilingPaintGallons) * safeNumber(pricing.ceilingPaintPerGallon, 0);
          const baseboardLaborCost = pricingSummary.baseboardLF * safeNumber(pricing.baseboardLaborPerLF, 0) * getCoatLaborMultiplier(pricingSummary.coatsTrim);
          const baseboardTrimWidthFt = calcSettings.baseboardWidth / 12;
          const baseboardTrimSqFt = pricingSummary.baseboardLF * baseboardTrimWidthFt;
          const baseboardTrimGallons = (baseboardTrimSqFt / trimCoverage) * pricingSummary.coatsTrim;
          const baseboardMaterialsCost = Math.ceil(baseboardTrimGallons) * safeNumber(pricing.trimPaintPerGallon, 0);
          const crownLaborCost = pricingSummary.crownMouldingLF * safeNumber(pricing.crownMouldingLaborPerLF, 0) * getCoatLaborMultiplier(pricingSummary.coatsTrim);
          const crownTrimWidthFt = calcSettings.crownMouldingWidth / 12;
          const crownTrimSqFt = pricingSummary.crownMouldingLF * crownTrimWidthFt;
          const crownTrimGallons = (crownTrimSqFt / trimCoverage) * pricingSummary.coatsTrim;
          const crownMaterialsCost = Math.ceil(crownTrimGallons) * safeNumber(pricing.trimPaintPerGallon, 0);

          const windowTrimPerimeter = 2 * (calcSettings.windowWidth + calcSettings.windowHeight);
          const windowTrimLF = windowCountValue * windowTrimPerimeter;
          const windowTrimWidthFt = calcSettings.windowTrimWidth / 12;
          const windowTrimSqFt = windowCountValue * windowTrimPerimeter * windowTrimWidthFt;
          const windowTrimGallons = (windowTrimSqFt / trimCoverage) * pricingSummary.coatsTrim;
          const windowLaborCost = windowCountValue * safeNumber(pricing.windowLabor, 0) * getCoatLaborMultiplier(pricingSummary.coatsTrim);
          const windowMaterialsCost = Math.ceil(windowTrimGallons) * safeNumber(pricing.trimPaintPerGallon, 0);

          const doorFrameLaborCost = doorFrameCount * safeNumber(pricing.doorLabor, 0) * getCoatLaborMultiplier(pricingSummary.coatsTrim);
          const doorTrimWidthFt = calcSettings.doorTrimWidth / 12;
          const doorTrimPerimeter = (2 * calcSettings.doorHeight) + calcSettings.doorWidth;
          const doorTrimLF = doorCountValue * doorTrimPerimeter;
          const doorTrimSqFt = doorCountValue * doorTrimPerimeter * doorTrimWidthFt;
          const singleClosetTrimWidthFt = calcSettings.singleClosetTrimWidth / 12;
          const singleClosetPerimeter = (2 * calcSettings.doorHeight) + (calcSettings.singleClosetWidth / 12);
          const singleClosetTrimLF = singleClosetCount * singleClosetPerimeter;
          const singleClosetTrimSqFt = singleClosetCount * singleClosetPerimeter * singleClosetTrimWidthFt;
          const doubleClosetTrimWidthFt = calcSettings.doubleClosetTrimWidth / 12;
          const doubleClosetPerimeter = (2 * calcSettings.doorHeight) + (calcSettings.doubleClosetWidth / 12);
          const doubleClosetTrimLF = doubleClosetCount * doubleClosetPerimeter;
          const doubleClosetTrimSqFt = doubleClosetCount * doubleClosetPerimeter * doubleClosetTrimWidthFt;
          const doorFrameTrimLF = doorTrimLF + singleClosetTrimLF + doubleClosetTrimLF;
          const doorFrameTrimSqFt = doorTrimSqFt + singleClosetTrimSqFt + doubleClosetTrimSqFt;
          const doorFrameGallons = (doorFrameTrimSqFt / trimCoverage) * pricingSummary.coatsTrim;
          const doorFrameMaterialsCost = Math.ceil(doorFrameGallons) * safeNumber(pricing.trimPaintPerGallon, 0);

          const doorFaceSqFt = doorCountForSummary * (calcSettings.doorHeight * calcSettings.doorWidth) * 2;
          const doorFaceGallons = (doorFaceSqFt * pricingSummary.coatsDoors) / trimCoverage;
          const doorLaborCost = doorCountForSummary * safeNumber(pricing.doorLabor, 0) * getCoatLaborMultiplier(pricingSummary.coatsDoors);
          const doorMaterialsCost = Math.ceil(doorFaceGallons) * safeNumber(pricing.trimPaintPerGallon, 0);

          const closetWallLaborCost = pricingSummary.closetWallArea * safeNumber(pricing.wallLaborPerSqFt, 0) * getCoatLaborMultiplier(pricingSummary.coatsWalls);
          const closetWallMaterialsCost = Math.ceil((pricingSummary.closetWallArea / wallCoverage) * pricingSummary.coatsWalls) * safeNumber(pricing.wallPaintPerGallon, 0);
          const closetCeilingLaborCost = pricingSummary.closetCeilingArea * safeNumber(pricing.ceilingLaborPerSqFt, 0) * getCoatLaborMultiplier(pricingSummary.coatsCeiling);
          const closetCeilingMaterialsCost = Math.ceil((pricingSummary.closetCeilingArea / ceilingCoverage) * pricingSummary.coatsCeiling) * safeNumber(pricing.ceilingPaintPerGallon, 0);
          const closetBaseboardLaborCost = pricingSummary.closetBaseboardLF * safeNumber(pricing.baseboardLaborPerLF, 0) * getCoatLaborMultiplier(pricingSummary.coatsTrim);
          const closetBaseboardWidthFt = calcSettings.baseboardWidth / 12;
          const closetBaseboardTrimSqFt = pricingSummary.closetBaseboardLF * closetBaseboardWidthFt;
          const closetBaseboardGallons = (closetBaseboardTrimSqFt / trimCoverage) * pricingSummary.coatsTrim;
          const closetBaseboardMaterialsCost = Math.ceil(closetBaseboardGallons) * safeNumber(pricing.trimPaintPerGallon, 0);
          const closetInteriorLaborCost = closetWallLaborCost + closetCeilingLaborCost + closetBaseboardLaborCost;
          const closetInteriorMaterialsCost = closetWallMaterialsCost + closetCeilingMaterialsCost + closetBaseboardMaterialsCost;

          const testSummaryLaborTotal =
            (paintWalls ? wallLaborCost : 0) +
            (paintCeilings ? ceilingLaborCost : 0) +
            (paintBaseboard ? baseboardLaborCost : 0) +
            (hasCrownMoulding ? crownLaborCost : 0) +
            (windowCountValue > 0 ? (paintWindowFrames ? windowLaborCost : 0) : 0) +
            (doorFrameCount > 0 ? (paintDoorFrames ? doorFrameLaborCost : 0) : 0) +
            (doorCountForSummary > 0 ? (paintDoors ? doorLaborCost : 0) : 0) +
            (openingsCount > 0 ? (paintDoorFrames ? openingTrimLaborCost : 0) : 0) +
            (closetCount > 0 ? (closetInteriorEnabled ? closetInteriorLaborCost : 0) : 0);
          const testSummaryMaterialsTotal =
            (paintWalls ? wallMaterialsCost : 0) +
            (paintCeilings ? ceilingMaterialsCost : 0) +
            (paintBaseboard ? baseboardMaterialsCost : 0) +
            (hasCrownMoulding ? crownMaterialsCost : 0) +
            (windowCountValue > 0 ? (paintWindowFrames ? windowMaterialsCost : 0) : 0) +
            (doorFrameCount > 0 ? (paintDoorFrames ? doorFrameMaterialsCost : 0) : 0) +
            (doorCountForSummary > 0 ? (paintDoors ? doorMaterialsCost : 0) : 0) +
            (openingsCount > 0 ? (paintDoorFrames ? openingTrimMaterialsCost : 0) : 0) +
            (closetCount > 0 ? (closetInteriorEnabled ? closetInteriorMaterialsCost : 0) : 0);

          return (
            <Card style={{ marginBottom: Spacing.md }}>
              <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.error, marginBottom: Spacing.md }}>
                TEST MODE: Calculation Details
              </Text>

              <View style={{ backgroundColor: Colors.backgroundWarmGray, borderRadius: BorderRadius.default, padding: Spacing.md }}>
                {/* Walls */}
                {paintWalls && pricingSummary.wallArea > 0 && (
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
                {paintCeilings && pricingSummary.ceilingArea > 0 && (
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
                      Lineal feet: {pricingSummary.baseboardLF.toFixed(2)} ft | Coats: {pricingSummary.coatsTrim}
                    </Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                      Area: {baseboardTrimSqFt.toFixed(2)} sqft
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
                      Lineal feet: {pricingSummary.crownMouldingLF.toFixed(2)} ft | Coats: {pricingSummary.coatsTrim}
                    </Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                      Area: {crownTrimSqFt.toFixed(2)} sqft
                    </Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                      Labor: {pricingSummary.crownMouldingLF.toFixed(2)} × ${safeNumber(pricing.trimLaborPerLF, 0).toFixed(2)}/ft × {getCoatLaborMultiplier(pricingSummary.coatsTrim).toFixed(2)} = ${(pricingSummary.crownMouldingLF * safeNumber(pricing.trimLaborPerLF, 0) * getCoatLaborMultiplier(pricingSummary.coatsTrim)).toFixed(2)}
                    </Text>
                  </View>
                )}

                {/* Window Frames */}
                {paintWindowFrames && windowCountValue > 0 && (
                  <View style={{ marginBottom: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.neutralGray }}>
                    <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                      Window Frames
                    </Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                      Count: {windowCountValue} | Coats: {pricingSummary.coatsTrim}
                    </Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                      Lineal feet: {windowTrimLF.toFixed(2)} ft
                    </Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                      Area: {windowTrimSqFt.toFixed(2)} sqft
                    </Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                      Labor: {windowCountValue} × ${safeNumber(pricing.windowLabor, 0).toFixed(2)}/window × {getCoatLaborMultiplier(pricingSummary.coatsTrim).toFixed(2)} = ${(windowCountValue * safeNumber(pricing.windowLabor, 0) * getCoatLaborMultiplier(pricingSummary.coatsTrim)).toFixed(2)}
                    </Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                      Materials: {Math.ceil(windowTrimGallons).toFixed(0)} gal × ${safeNumber(pricing.trimPaintPerGallon, 0).toFixed(2)}/gal = ${(Math.ceil(windowTrimGallons) * safeNumber(pricing.trimPaintPerGallon, 0)).toFixed(2)}
                    </Text>
                  </View>
                )}

                {/* Door Frames */}
                {paintDoorFrames && doorFrameCount > 0 && (
                  <View style={{ marginBottom: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.neutralGray }}>
                    <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                      Door Frames
                    </Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                      Count: {doorFrameCount} | Coats: {pricingSummary.coatsTrim}
                    </Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                      Lineal feet: {doorFrameTrimLF.toFixed(2)} ft
                    </Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                      Area: {doorFrameTrimSqFt.toFixed(2)} sqft
                    </Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                      Labor: {doorFrameCount} × ${safeNumber(pricing.doorLabor, 0).toFixed(2)}/door × {getCoatLaborMultiplier(pricingSummary.coatsTrim).toFixed(2)} = ${(doorFrameCount * safeNumber(pricing.doorLabor, 0) * getCoatLaborMultiplier(pricingSummary.coatsTrim)).toFixed(2)}
                    </Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                      Materials: {Math.ceil(doorFrameGallons).toFixed(0)} gal × ${safeNumber(pricing.trimPaintPerGallon, 0).toFixed(2)}/gal = ${(Math.ceil(doorFrameGallons) * safeNumber(pricing.trimPaintPerGallon, 0)).toFixed(2)}
                    </Text>
                  </View>
                )}

                {/* Doors */}
                {paintDoors && doorCountForSummary > 0 && (
                  <View style={{ marginBottom: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.neutralGray }}>
                    <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                      Doors
                    </Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                      Count: {doorCountForSummary} | Coats: {pricingSummary.coatsDoors}
                    </Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                      Area: {doorFaceSqFt.toFixed(2)} sqft
                    </Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                      Labor: {doorCountForSummary} × ${safeNumber(pricing.doorLabor, 0).toFixed(2)}/door × {getCoatLaborMultiplier(pricingSummary.coatsDoors).toFixed(2)} = ${(doorCountForSummary * safeNumber(pricing.doorLabor, 0) * getCoatLaborMultiplier(pricingSummary.coatsDoors)).toFixed(2)}
                    </Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                      Materials: {Math.ceil(doorFaceGallons).toFixed(0)} gal × ${safeNumber(pricing.trimPaintPerGallon, 0).toFixed(2)}/gal = ${(Math.ceil(doorFaceGallons) * safeNumber(pricing.trimPaintPerGallon, 0)).toFixed(2)}
                    </Text>
                  </View>
                )}

                {/* Trim Paint (Baseboard, Crown, Frames) */}
                {(paintBaseboard || hasCrownMoulding || paintWindowFrames || paintDoorFrames) && pricingSummary.trimPaintGallons > 0 && (
                  <View style={{ marginBottom: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.neutralGray }}>
                    <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                      Trim Paint (Baseboard + Crown + Frames)
                    </Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                      Materials: {Math.ceil(pricingSummary.trimPaintGallons).toFixed(0)} gal × ${safeNumber(pricing.trimPaintPerGallon, 0).toFixed(2)}/gal = ${(Math.ceil(pricingSummary.trimPaintGallons) * safeNumber(pricing.trimPaintPerGallon, 0)).toFixed(2)}
                    </Text>
                  </View>
                )}

                {/* Door Paint */}
                {paintDoors && doorCountForSummary > 0 && (
                  <View style={{ marginBottom: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.neutralGray }}>
                    <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                      Door Paint
                    </Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                      Materials: {Math.ceil(doorFaceGallons).toFixed(0)} gal × ${safeNumber(pricing.trimPaintPerGallon, 0).toFixed(2)}/gal = ${(Math.ceil(doorFaceGallons) * safeNumber(pricing.trimPaintPerGallon, 0)).toFixed(2)}
                    </Text>
                  </View>
                )}

                {/* Opening Trim */}
                {paintDoorFrames && openingsCount > 0 && (
                  <View style={{ marginBottom: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.neutralGray }}>
                    <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                      Opening Trim
                    </Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                      Trim LF: {openingTrimLF.toFixed(2)} | Coats: {pricingSummary.coatsTrim}
                    </Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                      Area: {openingTrimSqFt.toFixed(2)} sqft
                    </Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                      Labor: {openingTrimLF.toFixed(2)} × ${safeNumber(pricing.baseboardLaborPerLF, 0).toFixed(2)}/ft × {getCoatLaborMultiplier(pricingSummary.coatsTrim).toFixed(2)} = ${(openingTrimLF * safeNumber(pricing.baseboardLaborPerLF, 0) * getCoatLaborMultiplier(pricingSummary.coatsTrim)).toFixed(2)}
                    </Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                      Materials: {Math.ceil(openingTrimGallons).toFixed(0)} gal × ${safeNumber(pricing.trimPaintPerGallon, 0).toFixed(2)}/gal = ${(Math.ceil(openingTrimGallons) * safeNumber(pricing.trimPaintPerGallon, 0)).toFixed(2)}
                    </Text>
                  </View>
                )}

                {/* Totals */}
                <View>
                  <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "700" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                    Totals
                  </Text>
                  <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                    Total Labor: ${testSummaryLaborTotal.toFixed(2)}
                  </Text>
                  <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                    Total Materials: ${testSummaryMaterialsTotal.toFixed(2)}
                  </Text>
                  <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                    Grand Total: ${(testSummaryLaborTotal + testSummaryMaterialsTotal).toFixed(2)}
                  </Text>
                </View>
              </View>
            </Card>
          );
        })()}

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
        visible={infoModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setInfoModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.4)", justifyContent: "center", padding: Spacing.lg }}>
          <Pressable
            onPress={() => setInfoModalVisible(false)}
            style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
          />
          <View style={{ backgroundColor: Colors.white, borderRadius: BorderRadius.default, padding: Spacing.lg, ...Shadows.card }}>
            <Text style={{ fontSize: Typography.h3.fontSize, fontWeight: Typography.h3.fontWeight as any, color: Colors.darkCharcoal, marginBottom: Spacing.sm }}>
              {infoModalTitle}
            </Text>
            <Text style={{ fontSize: Typography.body.fontSize, color: Colors.mediumGray, marginBottom: Spacing.lg }}>
              {infoModalBody}
            </Text>
            <Pressable
              onPress={() => setInfoModalVisible(false)}
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

    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
