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
import { RoomPhoto } from "../types/painting";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = NativeStackScreenProps<RootStackParamList, "IrregularRoomEditor">;

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

  // Form state
  const [name, setName] = useState(!isNew && irregularRoom?.name ? irregularRoom.name : "");
  const [width, setWidth] = useState(!isNew && irregularRoom?.width && irregularRoom.width > 0 ? formatMeasurementValue(irregularRoom.width, "length", unitSystem, 2) : "");
  const [height, setHeight] = useState(!isNew && irregularRoom?.height && irregularRoom.height > 0 ? formatMeasurementValue(irregularRoom.height, "length", unitSystem, 2) : "");
  const [area, setArea] = useState("");

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

  // Refs
  const nameRef = useRef<TextInput>(null);
  const widthRef = useRef<TextInput>(null);
  const heightRef = useRef<TextInput>(null);
  const areaRef = useRef<TextInput>(null);
  const cathedralPeakHeightRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const nameAccessoryID = useId();

  // Calculate area when width/height change
  useEffect(() => {
    const w = parseFloat(width);
    const h = parseFloat(height);
    if (!isNaN(w) && w > 0 && !isNaN(h) && h > 0) {
      setArea((w * h).toFixed(1));
    }
  }, [width, height]);

  // Update header title
  useEffect(() => {
    const displayName = name || "Unnamed Irregular Room";
    navigation.setOptions({
      title: displayName + "'s Details",
    });
  }, [name, navigation]);

  const handleSave = useCallback(() => {
    const widthValue = parseDisplayValue(width, "length", unitSystem);
    const heightValue = parseDisplayValue(height, "length", unitSystem);
    const cathedralPeakValue = isCathedral ? parseDisplayValue(cathedralPeakHeight, "length", unitSystem) : undefined;

    const data = {
      name,
      width: widthValue,
      height: heightValue,
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

    navigation.goBack();
  }, [
    name, width, height, isCathedral, cathedralPeakHeight,
    windowCount, doorCount, hasCloset, singleDoorClosets, doubleDoorClosets,
    includeClosetInteriorInQuote, paintWalls, paintCeilings, paintWindowFrames,
    paintDoorFrames, paintWindows, paintDoors, paintJambs, paintBaseboard,
    hasCrownMoulding, hasAccentWall, notes, photos,
    isNew, projectId, irregularRoomId, unitSystem, addIrregularRoom, updateIrregularRoom, navigation
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
                    onSubmitEditing={() => widthRef.current?.focus()}
                    blurOnSubmit={false}
                    style={TextInputStyles.base}
                    inputAccessoryViewID={Platform.OS === "ios" ? `irregularRoomName-${nameAccessoryID}` : undefined}
                  />
                </View>
              </View>

              {/* Room Dimensions: Width × Height = Area */}
              <View style={{ marginBottom: Spacing.md }}>
                <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                  Wall Area ({unitSystem === "metric" ? "m / m²" : "ft / sq ft"})
                </Text>
                {/* Labels row */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.xs, marginBottom: 2 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, textAlign: "right", paddingRight: Spacing.md }}>Width</Text>
                  </View>
                  <Text style={{ fontSize: 18, color: "transparent" }}>×</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, textAlign: "right", paddingRight: Spacing.md }}>Height</Text>
                  </View>
                  <Text style={{ fontSize: 18, color: "transparent" }}>=</Text>
                  <View style={{ flex: 1.2 }}>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, textAlign: "right", paddingRight: Spacing.md }}>Area</Text>
                  </View>
                </View>
                {/* Input fields row */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.xs }}>
                  {/* Width */}
                  <View style={{ flex: 1 }}>
                    <FormInput
                      ref={widthRef}
                      previousFieldRef={nameRef}
                      label=""
                      value={width}
                      onChangeText={setWidth}
                      keyboardType="numeric"
                      placeholder="0"
                      nextFieldRef={heightRef}
                      textAlign="right"
                      className="mb-0"
                    />
                  </View>
                  <Text style={{ fontSize: 18, color: Colors.mediumGray, fontWeight: "600" }}>×</Text>
                  {/* Height */}
                  <View style={{ flex: 1 }}>
                    <FormInput
                      ref={heightRef}
                      previousFieldRef={widthRef}
                      label=""
                      value={height}
                      onChangeText={setHeight}
                      keyboardType="numeric"
                      placeholder="0"
                      nextFieldRef={isCathedral ? cathedralPeakHeightRef : undefined}
                      textAlign="right"
                      className="mb-0"
                    />
                  </View>
                  <Text style={{ fontSize: 18, color: Colors.mediumGray, fontWeight: "600" }}>=</Text>
                  {/* Area (read-only) */}
                  <View style={{ flex: 1.2 }}>
                    <View style={{
                      backgroundColor: Colors.neutralGray,
                      borderRadius: BorderRadius.default,
                      borderWidth: 1,
                      borderColor: Colors.neutralGray,
                      paddingHorizontal: Spacing.md,
                      paddingVertical: Spacing.sm + 4,
                    }}>
                      <Text style={{ fontSize: Typography.body.fontSize, color: Colors.darkCharcoal, textAlign: "right" }}>
                        {area || "0"}
                      </Text>
                    </View>
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
                    previousFieldRef={heightRef}
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

              <View style={{ flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.md }}>
                <View style={{ flex: 1 }}>
                  <NumericInput
                    label="Windows"
                    value={windowCount}
                    onChangeText={setWindowCount}
                    min={0}
                    max={20}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <NumericInput
                    label="Doors"
                    value={doorCount}
                    onChangeText={setDoorCount}
                    min={0}
                    max={10}
                  />
                </View>
              </View>

              <Toggle
                label="Has Closet"
                value={hasCloset}
                onValueChange={setHasCloset}
              />

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
                onPress={() => widthRef.current?.focus()}
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
    </SafeAreaView>
  );
}
