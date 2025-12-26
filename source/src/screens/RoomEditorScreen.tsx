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
  ActivityIndicator,
  Image,
  Modal,
  Keyboard,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { usePreventRemove } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/RootNavigator";
import { useProjectStore } from "../state/projectStore";
import { usePricingStore } from "../state/pricingStore";
import { useCalculationSettings } from "../state/calculationStore";
import { formatCurrency, getDefaultQuoteBuilder } from "../utils/calculations";
import { computeRoomPricingSummary } from "../utils/pricingSummary";
import * as ImagePicker from "expo-image-picker";
import { v4 as uuidv4 } from "uuid";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius, Shadows, TextInputStyles } from "../utils/designSystem";
import { Card } from "../components/Card";
import { Toggle } from "../components/Toggle";
import { NumericInput } from "../components/NumericInput";
import { DimensionInput } from "../components/DimensionInput";
import { SavePromptModal } from "../components/SavePromptModal";
import { RoomPhoto } from "../types/painting";

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
  ceilingType: string,
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
    ceilingType,
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

export default function RoomEditorScreen({ route, navigation }: Props) {
  const { projectId, roomId, floor: initialFloor } = route.params;
  const isNewRoom = !roomId;

  const project = useProjectStore((s) =>
    s.projects.find((p) => p.id === projectId)
  );
  const room = isNewRoom ? null : project?.rooms.find((r) => r.id === roomId);
  const addRoom = useProjectStore((s) => s.addRoom);
  const updateRoom = useProjectStore((s) => s.updateRoom);
  const deleteRoom = useProjectStore((s) => s.deleteRoom);
  const pricing = usePricingStore();
  const calcSettings = useCalculationSettings((s) => s.settings);

  // Store initial state snapshot for dirty checking
  const initialStateRef = useRef<string | null>(null);

  const [name, setName] = useState(room?.name || "");
  const [length, setLength] = useState(room?.length && room.length > 0 ? room.length.toString() : "");
  const [width, setWidth] = useState(room?.width && room.width > 0 ? room.width.toString() : "");
  const floor = room?.floor || initialFloor || 1;
  const [manualArea, setManualArea] = useState(
    room?.manualArea && room.manualArea > 0 ? room.manualArea.toString() : ""
  );
  const [ceilingType, setCeilingType] = useState(room?.ceilingType || "flat");
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
  const [includeClosetInteriorInQuote, setIncludeClosetInteriorInQuote] = useState(
    room?.includeClosetInteriorInQuote ?? project?.projectIncludeClosetInteriorInQuote ?? true
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
    room?.cathedralPeakHeight && room.cathedralPeakHeight > 0 ? room.cathedralPeakHeight.toString() : ""
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

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  // Use ref to track saved state for cleanup - avoids stale closure issues
  const isSavedRef = useRef(false);

  // Update header title dynamically when room name changes
  useEffect(() => {
    const displayName = name || "Unnamed Room";
    navigation.setOptions({
      title: `Edit Room: ${displayName}`,
    });
  }, [name, navigation]);

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
        "flat",
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

    if (!room || initialStateRef.current !== null) return;

    // Create initial snapshot of all editable fields
    initialStateRef.current = serializeRoomState(
      room.name || "",
      room.length && room.length > 0 ? room.length.toString() : "",
      room.width && room.width > 0 ? room.width.toString() : "",
      room.manualArea && room.manualArea > 0 ? room.manualArea.toString() : "",
      room.ceilingType || "flat",
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
      room.includeClosetInteriorInQuote ?? project?.projectIncludeClosetInteriorInQuote ?? true
    );
  }, [room, project]);

  // Check for changes by comparing current state to initial snapshot
  useEffect(() => {
    if (initialStateRef.current === null) return;

    const currentState = serializeRoomState(
      name,
      length,
      width,
      manualArea,
      ceilingType,
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
    ceilingType,
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
    Keyboard.dismiss(); // Dismiss keyboard immediately
    setTimeout(() => setShowSavePrompt(true), 100); // Delay modal slightly to ensure keyboard dismisses
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

    const updatedRoom = {
      id: currentRoomId,
      name: trimmedName,
      length: parseFloat(length) || 0,
      width: parseFloat(width) || 0,
      height,
      floor,
      manualArea: parseFloat(manualArea) || undefined,
      ceilingType,
      cathedralPeakHeight: parseFloat(cathedralPeakHeight) || undefined,
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
      updatedRoom as any,
      quoteBuilder,
      pricing,
      project?.projectCoats,
      project?.projectIncludeClosetInteriorInQuote
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
      ceilingType,
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
    // For new rooms with no name, nothing was created so just navigate back
    // For existing rooms with no name, delete them
    const trimmedName = name.trim();
    if (!trimmedName && !isNewRoom && roomId) {
      deleteRoom(projectId, roomId);
    }

    setIsSaved(true);
    setHasUnsavedChanges(false);
    setShowSavePrompt(false);
    setTimeout(() => {
      navigation.goBack();
    }, 50);
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
  // For new rooms, calculate with temp data; for existing rooms, use the saved room data
  const pricingSummary = computeRoomPricingSummary(
    {
      id: roomId || "temp-new-room",
      name: name.trim() || "Unnamed Room",
      length: parseFloat(length) || 0,
      width: parseFloat(width) || 0,
      height: currentHeight,
      floor,
      manualArea: parseFloat(manualArea) || undefined,
      ceilingType,
      cathedralPeakHeight: parseFloat(cathedralPeakHeight) || undefined,
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
        fileName: generatePhotoFileName(name || "room", idx + 1),
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
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: Spacing.md }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* Room Info Section */}
        <Card style={{ marginBottom: Spacing.md }}>
          <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.darkCharcoal, marginBottom: Spacing.md }}>
            Room Information
          </Text>
          <View style={{ marginBottom: Spacing.md }}>
            <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
              Room Name
            </Text>
            <View style={TextInputStyles.container}>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Enter room name"
                placeholderTextColor={Colors.mediumGray}
                returnKeyType="done"
                selectTextOnFocus={false}
                style={TextInputStyles.base}
                accessibilityLabel="Room name input"
                accessibilityHint="Enter a name for this room"
              />
            </View>
          </View>
        </Card>

        {/* Dimensions Section */}
        <Card style={{ marginBottom: Spacing.md }}>
          <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.darkCharcoal, marginBottom: Spacing.md }}>
            Dimensions
          </Text>

          {/* Row: Length & Width */}
          <View style={{ flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.md }}>
            {/* Length */}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                Length (ft)
              </Text>
              <View style={TextInputStyles.container}>
                <TextInput
                  value={length}
                  onChangeText={setLength}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={Colors.mediumGray}
                  returnKeyType="done"
                  style={TextInputStyles.base}
                  accessibilityLabel="Room length input"
                />
              </View>
            </View>

            {/* Width */}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
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
                  accessibilityLabel="Room width input"
                />
              </View>
            </View>
          </View>

          {/* Manual Area */}
          <View>
            <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
              Manual Area (sq ft) - Optional
            </Text>
            <View style={TextInputStyles.container}>
              <TextInput
                value={manualArea}
                onChangeText={setManualArea}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={Colors.mediumGray}
                returnKeyType="done"
                style={TextInputStyles.base}
                accessibilityLabel="Manual area input"
              />
            </View>
            <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginTop: Spacing.xs }}>
              If entered, this will override Length × Width for ceiling area
            </Text>
          </View>
        </Card>

        {/* Ceiling Type Section */}
        <Card style={{ marginBottom: Spacing.md }}>
          <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.darkCharcoal, marginBottom: Spacing.md }}>
            Ceiling Type
          </Text>

          {/* Compact Segmented Toggle */}
          <View
            style={{
              flexDirection: "row",
              padding: 4,
              borderRadius: BorderRadius.default,
              backgroundColor: Colors.backgroundWarmGray,
              marginBottom: ceilingType === "cathedral" ? Spacing.md : 0,
            }}
          >
            {/* Flat */}
            <Pressable
              onPress={() => setCeilingType("flat")}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: BorderRadius.default,
                backgroundColor: ceilingType === "flat" ? Colors.white : "transparent",
                alignItems: "center",
                justifyContent: "center",
              }}
              accessibilityRole="button"
              accessibilityLabel="Flat ceiling"
              accessibilityState={{ selected: ceilingType === "flat" }}
            >
              <Text
                style={{
                  fontSize: Typography.body.fontSize,
                  fontWeight: ceilingType === "flat" ? "600" as any : "400" as any,
                  color: ceilingType === "flat" ? Colors.darkCharcoal : Colors.mediumGray,
                }}
              >
                Flat
              </Text>
            </Pressable>

            {/* Cathedral */}
            <Pressable
              onPress={() => setCeilingType("cathedral")}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: BorderRadius.default,
                backgroundColor: ceilingType === "cathedral" ? Colors.white : "transparent",
                alignItems: "center",
                justifyContent: "center",
              }}
              accessibilityRole="button"
              accessibilityLabel="Cathedral ceiling"
              accessibilityState={{ selected: ceilingType === "cathedral" }}
            >
              <Text
                style={{
                  fontSize: Typography.body.fontSize,
                  fontWeight: ceilingType === "cathedral" ? "600" as any : "400" as any,
                  color: ceilingType === "cathedral" ? Colors.darkCharcoal : Colors.mediumGray,
                }}
              >
                Cathedral
              </Text>
            </Pressable>
          </View>

          {ceilingType === "cathedral" && (
            <View>
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                Peak Height (ft)
              </Text>
              <View style={TextInputStyles.container}>
                <TextInput
                  value={cathedralPeakHeight}
                  onChangeText={setCathedralPeakHeight}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={Colors.mediumGray}
                  returnKeyType="done"
                  style={TextInputStyles.base}
                  accessibilityLabel="Cathedral peak height input"
                />
              </View>
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
          <View style={{ marginBottom: Spacing.md }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.md }}>
              <View>
                <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500" as any, color: Colors.darkCharcoal }}>
                  Pass-Through Openings
                </Text>
                <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                  Without doors (subtracts wall area)
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.sm }}>
                <Pressable
                  onPress={() => {
                    const current = openings.length;
                    if (current > 0) {
                      setOpenings(openings.slice(0, -1));
                    }
                  }}
                  style={{
                    backgroundColor: Colors.neutralGray,
                    borderRadius: 8,
                    width: 32,
                    height: 32,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 20, color: Colors.darkCharcoal }}>−</Text>
                </Pressable>
                <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal, width: 30, textAlign: "center" }}>
                  {openings.length}
                </Text>
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
                  style={{
                    backgroundColor: Colors.primaryBlue,
                    borderRadius: 8,
                    width: 32,
                    height: 32,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 20, color: Colors.white, fontWeight: "bold" }}>+</Text>
                </Pressable>
              </View>
            </View>

            {openings.length > 0 && (
              <View style={{ backgroundColor: Colors.backgroundWarmGray, borderRadius: BorderRadius.default, padding: Spacing.md, marginBottom: Spacing.md }}>
                {openings.map((opening, index) => (
                  <View key={opening.id} style={{ marginBottom: index < openings.length - 1 ? Spacing.md : 0, paddingBottom: index < openings.length - 1 ? Spacing.md : 0, borderBottomWidth: index < openings.length - 1 ? 1 : 0, borderBottomColor: Colors.neutralGray }}>
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
                        <View style={TextInputStyles.container}>
                          <TextInput
                            value={opening.width}
                            onChangeText={(text) => {
                              const updated = [...openings];
                              updated[index].width = text;
                              setOpenings(updated);
                            }}
                            placeholder="36"
                            placeholderTextColor={Colors.mediumGray}
                            keyboardType="decimal-pad"
                            style={TextInputStyles.base}
                          />
                        </View>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: Typography.caption.fontSize, fontWeight: "500" as any, color: Colors.mediumGray, marginBottom: Spacing.xs }}>
                          Height (in)
                        </Text>
                        <View style={TextInputStyles.container}>
                          <TextInput
                            value={opening.height}
                            onChangeText={(text) => {
                              const updated = [...openings];
                              updated[index].height = text;
                              setOpenings(updated);
                            }}
                            placeholder="80"
                            placeholderTextColor={Colors.mediumGray}
                            keyboardType="decimal-pad"
                            style={TextInputStyles.base}
                          />
                        </View>
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
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: Colors.neutralGray, marginVertical: Spacing.md }} />

          {/* Windows Counter */}
          <View style={{ marginBottom: Spacing.md }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500" as any, color: Colors.darkCharcoal }}>
                Windows
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.sm }}>
                <Pressable
                  onPress={() => {
                    const current = parseInt(windowCount) || 0;
                    if (current > 0) {
                      setWindowCount((current - 1).toString());
                    }
                  }}
                  style={{
                    backgroundColor: Colors.neutralGray,
                    borderRadius: 8,
                    padding: Spacing.xs,
                    width: 32,
                    height: 32,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Decrease window count"
                >
                  <Ionicons name="remove" size={20} color={Colors.darkCharcoal} />
                </Pressable>
                <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal, minWidth: 30, textAlign: "center" }}>
                  {windowCount || "0"}
                </Text>
                <Pressable
                  onPress={() => {
                    const current = parseInt(windowCount) || 0;
                    setWindowCount((current + 1).toString());
                  }}
                  style={{
                    backgroundColor: Colors.primaryBlue,
                    borderRadius: 8,
                    padding: Spacing.xs,
                    width: 32,
                    height: 32,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Increase window count"
                >
                  <Ionicons name="add" size={20} color={Colors.white} />
                </Pressable>
              </View>
            </View>
          </View>

          {/* Doors Counter */}
          <View style={{ marginBottom: Spacing.md }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500" as any, color: Colors.darkCharcoal }}>
                Doors
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.sm }}>
                <Pressable
                  onPress={() => {
                    const current = parseInt(doorCount) || 0;
                    if (current > 0) {
                      setDoorCount((current - 1).toString());
                    }
                  }}
                  style={{
                    backgroundColor: Colors.neutralGray,
                    borderRadius: 8,
                    padding: Spacing.xs,
                    width: 32,
                    height: 32,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Decrease door count"
                >
                  <Ionicons name="remove" size={20} color={Colors.darkCharcoal} />
                </Pressable>
                <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal, minWidth: 30, textAlign: "center" }}>
                  {doorCount || "0"}
                </Text>
                <Pressable
                  onPress={() => {
                    const current = parseInt(doorCount) || 0;
                    setDoorCount((current + 1).toString());
                  }}
                  style={{
                    backgroundColor: Colors.primaryBlue,
                    borderRadius: 8,
                    padding: Spacing.xs,
                    width: 32,
                    height: 32,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Increase door count"
                >
                  <Ionicons name="add" size={20} color={Colors.white} />
                </Pressable>
              </View>
            </View>
          </View>

          {/* Closets Counters */}
          <View style={{ marginBottom: Spacing.md }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.sm }}>
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500" as any, color: Colors.darkCharcoal }}>
                Single Door Closet
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.sm }}>
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
                  style={{
                    backgroundColor: Colors.neutralGray,
                    borderRadius: 8,
                    padding: Spacing.xs,
                    width: 32,
                    height: 32,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Decrease single door closet count"
                >
                  <Ionicons name="remove" size={20} color={Colors.darkCharcoal} />
                </Pressable>
                <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal, minWidth: 30, textAlign: "center" }}>
                  {singleDoorClosets || "0"}
                </Text>
                <Pressable
                  onPress={() => {
                    const current = parseInt(singleDoorClosets) || 0;
                    setSingleDoorClosets((current + 1).toString());
                    setHasCloset(true);
                  }}
                  style={{
                    backgroundColor: Colors.primaryBlue,
                    borderRadius: 8,
                    padding: Spacing.xs,
                    width: 32,
                    height: 32,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Increase single door closet count"
                >
                  <Ionicons name="add" size={20} color={Colors.white} />
                </Pressable>
              </View>
            </View>
          </View>

          <View style={{ marginBottom: Spacing.md }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500" as any, color: Colors.darkCharcoal }}>
                Double Doors Closet
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.sm }}>
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
                  style={{
                    backgroundColor: Colors.neutralGray,
                    borderRadius: 8,
                    padding: Spacing.xs,
                    width: 32,
                    height: 32,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Decrease double door closet count"
                >
                  <Ionicons name="remove" size={20} color={Colors.darkCharcoal} />
                </Pressable>
                <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal, minWidth: 30, textAlign: "center" }}>
                  {doubleDoorClosets || "0"}
                </Text>
                <Pressable
                  onPress={() => {
                    const current = parseInt(doubleDoorClosets) || 0;
                    setDoubleDoorClosets((current + 1).toString());
                    setHasCloset(true);
                  }}
                  style={{
                    backgroundColor: Colors.primaryBlue,
                    borderRadius: 8,
                    padding: Spacing.xs,
                    width: 32,
                    height: 32,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Increase double door closet count"
                >
                  <Ionicons name="add" size={20} color={Colors.white} />
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

        {/* Paint Options Section */}
        <Card style={{ marginBottom: Spacing.md }}>
          <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
            Paint Options
          </Text>
          <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.md, lineHeight: 18 }}>
            Customize what to paint in this room. These override the project defaults.
          </Text>

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
        </Card>

        {/* Notes Section */}
        <Card style={{ marginBottom: Spacing.md }}>
          <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
            Notes
          </Text>
          <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.md }}>
            Add any observations about this room
          </Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Add notes about this room..."
            placeholderTextColor={Colors.mediumGray}
            multiline
            numberOfLines={3}
            style={TextInputStyles.multiline}
          />
        </Card>

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

        {/* Room Summary Section */}
        {pricingSummary && (parseFloat(length) > 0 || parseFloat(width) > 0 || parseFloat(manualArea) > 0) && (
          <Card style={{ marginBottom: Spacing.md }}>
            <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.darkCharcoal, marginBottom: Spacing.md }}>
              Room Summary
            </Text>

            <View style={{ backgroundColor: Colors.backgroundWarmGray, borderRadius: BorderRadius.default, padding: Spacing.md, marginBottom: Spacing.md }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                <Text style={{ fontSize: Typography.body.fontSize, color: Colors.mediumGray }}>Wall Area:</Text>
                <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal }}>
                  {pricingSummary.wallArea.toFixed(1)} sq ft
                </Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                <Text style={{ fontSize: Typography.body.fontSize, color: Colors.mediumGray }}>Ceiling Area:</Text>
                <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal }}>
                  {pricingSummary.ceilingArea.toFixed(0)} sq ft
                </Text>
              </View>
              {paintBaseboard && pricingSummary.baseboardLF > 0 && (
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                  <Text style={{ fontSize: Typography.body.fontSize, color: Colors.mediumGray }}>Baseboard:</Text>
                  <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal }}>
                    {pricingSummary.baseboardLF.toFixed(0)} linear ft
                  </Text>
                </View>
              )}
              {hasCrownMoulding && pricingSummary.crownMouldingLF > 0 && (
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                  <Text style={{ fontSize: Typography.body.fontSize, color: Colors.mediumGray }}>Crown Moulding:</Text>
                  <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal }}>
                    {pricingSummary.crownMouldingLF.toFixed(0)} linear ft
                  </Text>
                </View>
              )}
            </View>

            <View style={{ backgroundColor: "#E3F2FD", borderRadius: BorderRadius.default, padding: Spacing.md }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                <Text style={{ fontSize: Typography.body.fontSize, color: Colors.mediumGray }}>Labor:</Text>
                <Text style={{ fontSize: Typography.body.fontSize, color: Colors.darkCharcoal }}>
                  ${pricingSummary.laborDisplayed.toFixed(2)}
                </Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.sm }}>
                <Text style={{ fontSize: Typography.body.fontSize, color: Colors.mediumGray }}>Materials:</Text>
                <Text style={{ fontSize: Typography.body.fontSize, color: Colors.darkCharcoal }}>
                  ${pricingSummary.materialsDisplayed.toFixed(2)}
                </Text>
              </View>
              <View style={{ height: 1, backgroundColor: "#90CAF9", marginVertical: Spacing.xs }} />
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "700" as any, color: Colors.darkCharcoal }}>Total:</Text>
                <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: "700" as any, color: Colors.primaryBlue }}>
                  ${pricingSummary.totalDisplayed.toLocaleString()}
                </Text>
              </View>
            </View>
          </Card>
        )}

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
      </Modal>
    </KeyboardAvoidingView>
  );
}
