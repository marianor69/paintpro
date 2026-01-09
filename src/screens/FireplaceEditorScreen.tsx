import React, { useState, useEffect, useRef, useCallback } from "react";
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
import { computeFireplacePricingSummary } from "../utils/pricingSummary";
import { formatMeasurementValue, parseDisplayValue, formatMeasurement } from "../utils/unitConversion";
import { RoomPhoto } from "../types/painting";

type Props = NativeStackScreenProps<RootStackParamList, "FireplaceEditor">;

export default function FireplaceEditorScreen({ route, navigation }: Props) {
  const { projectId, fireplaceId } = route.params;

  // Check if this is a NEW fireplace (no ID) or existing
  const isNewFireplace = !fireplaceId;

  const project = useProjectStore((s) =>
    s.projects.find((p) => p.id === projectId)
  );
  const fireplace = !isNewFireplace
    ? project?.fireplaces.find((f) => f.id === fireplaceId)
    : null; // New fireplace - no existing data

  const addFireplace = useProjectStore((s) => s.addFireplace);
  const updateFireplace = useProjectStore((s) => s.updateFireplace);
  const pricing = usePricingStore();
  const { testMode, unitSystem } = useAppSettings();

  // Fireplace name/location
  const [name, setName] = useState(!isNewFireplace && fireplace?.name ? fireplace.name : "");

  // Legacy dimensions (backward compatibility)
  const [width, setWidth] = useState(!isNewFireplace && fireplace?.width && fireplace.width > 0 ? formatMeasurementValue(fireplace.width, 'length', unitSystem, 2) : "");
  const [height, setHeight] = useState(!isNewFireplace && fireplace?.height && fireplace.height > 0 ? formatMeasurementValue(fireplace.height, 'length', unitSystem, 2) : "");
  const [depth, setDepth] = useState(!isNewFireplace && fireplace?.depth && fireplace.depth > 0 ? formatMeasurementValue(fireplace.depth, 'length', unitSystem, 2) : "");
  const [hasTrim, setHasTrim] = useState(!isNewFireplace && fireplace?.hasTrim ? true : false);
  const [trimLinearFeet, setTrimLinearFeet] = useState(
    !isNewFireplace && fireplace?.trimLinearFeet && fireplace.trimLinearFeet > 0 ? formatMeasurementValue(fireplace.trimLinearFeet, 'linearFeet', unitSystem, 2) : ""
  );

  // New 3-part structure
  const [hasMantel, setHasMantel] = useState(!isNewFireplace && fireplace?.hasMantel ? true : false);
  const [hasLegs, setHasLegs] = useState(!isNewFireplace && fireplace?.hasLegs ? true : false);
  const [hasOverMantel, setHasOverMantel] = useState(!isNewFireplace && fireplace?.hasOverMantel ? true : false);
  const [overMantelWidth, setOverMantelWidth] = useState(!isNewFireplace && fireplace?.overMantelWidth && fireplace.overMantelWidth > 0 ? formatMeasurementValue(fireplace.overMantelWidth, 'length', unitSystem, 2) : "");
  const [overMantelHeight, setOverMantelHeight] = useState(!isNewFireplace && fireplace?.overMantelHeight && fireplace.overMantelHeight > 0 ? formatMeasurementValue(fireplace.overMantelHeight, 'length', unitSystem, 2) : "");

  const [notes, setNotes] = useState(!isNewFireplace && fireplace?.notes ? fireplace.notes : "");
  const [photos, setPhotos] = useState<RoomPhoto[]>(
    !isNewFireplace && fireplace?.photos ? fireplace.photos : []
  );
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [editingPhotoNote, setEditingPhotoNote] = useState("");

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // Prevent double-save and navigation modal
  const isKeyboardVisibleRef = useRef(false);
  const pendingSavePromptRef = useRef(false);
  // MD-002: Store the navigation action to dispatch when discarding
  const preventedNavigationActionRef = useRef<any>(null);

  // Refs for form field navigation
  const nameRef = useRef<TextInput>(null);
  const widthRef = useRef<TextInput>(null);
  const heightRef = useRef<TextInput>(null);
  const depthRef = useRef<TextInput>(null);
  const trimLinearFeetRef = useRef<TextInput>(null);
  const overMantelWidthRef = useRef<TextInput>(null);
  const overMantelHeightRef = useRef<TextInput>(null);
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

  // Track unsaved changes
  useEffect(() => {
    if (isNewFireplace) {
      // For new fireplace: changes are when user enters any data (new 3-part structure)
      const hasChanges =
        name !== "" ||
        hasMantel ||
        hasLegs ||
        hasOverMantel ||
        overMantelWidth !== "" ||
        overMantelHeight !== "" ||
        width !== "" ||
        height !== "" ||
        depth !== "" ||
        (hasTrim && trimLinearFeet !== "");
      setHasUnsavedChanges(hasChanges);
    } else {
      // For existing: changes are when values differ from stored data
      if (!fireplace) return;

      const photosChanged =
        photos.length !== (fireplace.photos?.length || 0) ||
        photos.some((photo, index) => {
          const stored = fireplace.photos?.[index];
          return !stored || photo.uri !== stored.uri || photo.note !== stored.note;
        });

      const hasChanges =
        name !== (fireplace.name || "") ||
        hasMantel !== (fireplace.hasMantel ?? false) ||
        hasLegs !== (fireplace.hasLegs ?? false) ||
        hasOverMantel !== (fireplace.hasOverMantel ?? false) ||
        overMantelWidth !== (fireplace.overMantelWidth && fireplace.overMantelWidth > 0 ? fireplace.overMantelWidth.toString() : "") ||
        overMantelHeight !== (fireplace.overMantelHeight && fireplace.overMantelHeight > 0 ? fireplace.overMantelHeight.toString() : "") ||
        width !== (fireplace.width && fireplace.width > 0 ? fireplace.width.toString() : "") ||
        height !== (fireplace.height && fireplace.height > 0 ? fireplace.height.toString() : "") ||
        depth !== (fireplace.depth && fireplace.depth > 0 ? fireplace.depth.toString() : "") ||
        hasTrim !== (fireplace.hasTrim ?? false) ||
        trimLinearFeet !== (fireplace.trimLinearFeet && fireplace.trimLinearFeet > 0 ? fireplace.trimLinearFeet.toString() : "") ||
        notes !== (fireplace.notes || "") ||
        photosChanged;

      setHasUnsavedChanges(hasChanges);
    }
  }, [
    isNewFireplace,
    fireplace,
    name,
    hasMantel,
    hasLegs,
    hasOverMantel,
    overMantelWidth,
    overMantelHeight,
    width,
    height,
    depth,
    hasTrim,
    trimLinearFeet,
    notes,
    photos,
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
  const generatePhotoFileName = (fireplaceName: string, photoIndex: number): string => {
    const safeName = (fireplaceName || "Fireplace").replace(/[^a-zA-Z0-9]/g, "_");
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
      hasMantel ||
      hasLegs ||
      hasOverMantel ||
      overMantelWidth !== "" ||
      overMantelHeight !== "" ||
      width !== "" ||
      height !== "" ||
      depth !== "" ||
      (hasTrim && trimLinearFeet !== "");

    if (!hasAnyData) {
      Alert.alert("No Data Entered", "Please select at least one fireplace part or enter measurements before saving.");
      return;
    }

    // Validate over mantel: if enabled, must have both width and height
    if (hasOverMantel && (overMantelWidth === "" || overMantelHeight === "")) {
      Alert.alert("Missing Data", "Please enter both width and height for the over mantel.");
      return;
    }

    // IMMEDIATELY set saving state to prevent modal
    setIsSaving(true);
    setHasUnsavedChanges(false);
    setShowSavePrompt(false);
    Keyboard.dismiss();

    // Convert display values back to imperial feet for storage
    const widthFeet = parseDisplayValue(width, 'length', unitSystem);
    const heightFeet = parseDisplayValue(height, 'length', unitSystem);
    const depthFeet = parseDisplayValue(depth, 'length', unitSystem);
    const trimLinearFeetValue = parseDisplayValue(trimLinearFeet, 'linearFeet', unitSystem);
    const overMantelWidthFeet = parseDisplayValue(overMantelWidth, 'length', unitSystem);
    const overMantelHeightFeet = parseDisplayValue(overMantelHeight, 'length', unitSystem);
    const normalizedPhotos = photos.map((photo, index) => ({
      ...photo,
      fileName: generatePhotoFileName(name.trim(), index + 1),
    }));

    if (isNewFireplace) {
      // CREATE new fireplace with data
      const newFireplaceId = addFireplace(projectId);

      // Then immediately update it with the entered data
      updateFireplace(projectId, newFireplaceId, {
        name: name.trim(),
        // Legacy fields (backward compatibility)
        width: widthFeet,
        height: heightFeet,
        depth: depthFeet,
        hasTrim,
        trimLinearFeet: trimLinearFeetValue,
        // New 3-part structure
        hasMantel,
        hasLegs,
        hasOverMantel,
        overMantelWidth: overMantelWidthFeet,
        overMantelHeight: overMantelHeightFeet,
        coats: 2,
        notes: notes.trim() || undefined,
        photos: normalizedPhotos,
      });
    } else {
      // UPDATE existing fireplace
      updateFireplace(projectId, fireplaceId!, {
        name: name.trim(),
        // Legacy fields (backward compatibility)
        width: widthFeet,
        height: heightFeet,
        depth: depthFeet,
        hasTrim,
        trimLinearFeet: trimLinearFeetValue,
        // New 3-part structure
        hasMantel,
        hasLegs,
        hasOverMantel,
        overMantelWidth: overMantelWidthFeet,
        overMantelHeight: overMantelHeightFeet,
        coats: fireplace?.coats || 2,
        notes: notes.trim() || undefined,
        photos: normalizedPhotos,
      });
    }

    // Navigation happens automatically via useEffect when isSaving becomes true
  };

  const handleDiscardAndLeave = () => {
    // For new fireplaces, nothing to delete (never created)
    // For existing fireplaces, just go back without changes
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
    isNewFireplace || !fireplace
      ? computeFireplacePricingSummary(
          {
            id: "",
            width: parseFloat(width) || 0,
            height: parseFloat(height) || 0,
            depth: parseFloat(depth) || 0,
            hasTrim,
            trimLinearFeet: parseFloat(trimLinearFeet) || 0,
            coats: 2,
            notes: "",
          },
          pricing
        )
      : computeFireplacePricingSummary(
          {
            ...fireplace,
            width: parseFloat(width) || 0,
            height: parseFloat(height) || 0,
            depth: parseFloat(depth) || 0,
            hasTrim,
            trimLinearFeet: parseFloat(trimLinearFeet) || 0,
          },
          pricing
        );

  // If existing fireplace not found, show error
  if (!isNewFireplace && !fireplace) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.backgroundWarmGray }}>
        <Text style={{ fontSize: Typography.h3.fontSize, color: Colors.mediumGray }}>Fireplace not found</Text>
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
                PAGE: FireplaceEditorScreen
              </Text>
            </View>
          )}

          <View style={{ padding: Spacing.md }}>
            {/* Fireplace Information Card */}
            <Card style={{ marginBottom: Spacing.md }}>
              {/* Name/Location */}
              <View style={{ marginBottom: Spacing.md }}>
                <FormInput
                  ref={nameRef}
                  label="Name/Location"
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g., Living Room Fireplace, Master Bedroom"
                  nextFieldRef={hasOverMantel ? overMantelWidthRef : undefined}
                  returnKeyType="next"
                  className="mb-0"
                />
              </View>

              {/* PART 1: Mantel */}
              <Toggle
                label="Mantel"
                value={hasMantel}
                onValueChange={setHasMantel}
              />

              {/* PART 2: Legs */}
              <Toggle
                label="Legs"
                value={hasLegs}
                onValueChange={setHasLegs}
              />

              {/* PART 3: Over Mantel */}
              <Toggle
                label="Over Mantel"
                value={hasOverMantel}
                onValueChange={setHasOverMantel}
                description="Measured area (width × height)"
                className={hasOverMantel ? "mb-4" : "mb-0"}
              />

              {hasOverMantel && (
                <View style={{ flexDirection: "row", gap: Spacing.sm }}>
                  <View style={{ flex: 1 }}>
                    <FormInput
                      ref={overMantelWidthRef}
                      previousFieldRef={nameRef}
                      label={`Width (${unitSystem === 'metric' ? 'm' : 'ft'})`}
                      value={overMantelWidth}
                      onChangeText={setOverMantelWidth}
                      keyboardType="numeric"
                      placeholder="0"
                      nextFieldRef={overMantelHeightRef}
                      inputContainerStyle={{ width: 68 }}
                      inputTextStyle={{ textAlign: "right" }}
                      className="mb-0"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <FormInput
                      ref={overMantelHeightRef}
                      previousFieldRef={overMantelWidthRef}
                      label={`Height (${unitSystem === 'metric' ? 'm' : 'ft'})`}
                      value={overMantelHeight}
                      onChangeText={setOverMantelHeight}
                      keyboardType="numeric"
                      placeholder="0"
                      inputContainerStyle={{ width: 68 }}
                      inputTextStyle={{ textAlign: "right" }}
                      className="mb-0"
                    />
                  </View>
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
                  placeholder="Add any notes about this fireplace..."
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

            {/* Fireplace Photos Section */}
            <Card style={{ marginBottom: Spacing.md }}>
              <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                Fireplace Photos
              </Text>
              <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.md }}>
                Document mantel, legs, and over-mantel conditions
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
                  {photos.map((photo) => (
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
                                  borderRadius: BorderRadius.default,
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

              {photos.length === 0 && (
                <View style={{ backgroundColor: Colors.backgroundWarmGray, borderRadius: BorderRadius.default, padding: Spacing.lg, alignItems: "center" }}>
                  <Ionicons name="camera-outline" size={40} color={Colors.mediumGray} />
                  <Text style={{ fontSize: Typography.body.fontSize, color: Colors.mediumGray, marginTop: Spacing.sm, textAlign: "center" }}>
                    No photos added yet
                  </Text>
                </View>
              )}
            </Card>

            {/* Fireplace Summary */}
            {calculations && (() => {
              // Calculate costs per part (new 3-part structure)
              const coats = fireplace?.coats || 2;

              // Mantel: 6ft x 1ft = 6 sq ft
              const mantelLabor = hasMantel ? pricing.mantelLabor : 0;
              const mantelArea = hasMantel ? 6 : 0;
              const mantelGallons = mantelArea > 0 ? (mantelArea / pricing.wallCoverageSqFtPerGallon) * coats : 0;
              const mantelMaterials = Math.ceil(mantelGallons) * pricing.wallPaintPerGallon;

              // Legs: 6ft x 8" x 2 = 8 sq ft
              const legsLabor = hasLegs ? pricing.legsLabor : 0;
              const legsArea = hasLegs ? 6 * (8 / 12) * 2 : 0;
              const legsGallons = legsArea > 0 ? (legsArea / pricing.wallCoverageSqFtPerGallon) * coats : 0;
              const legsMaterials = Math.ceil(legsGallons) * pricing.wallPaintPerGallon;

              // Over mantel: area-based
              const overMantelArea = hasOverMantel && overMantelWidth && overMantelHeight
                ? parseFloat(overMantelWidth) * parseFloat(overMantelHeight)
                : 0;
              const overMantelLabor = overMantelArea > 0 ? (overMantelArea * pricing.wallLaborPerSqFt * coats) : 0;
              const overMantelGallons = overMantelArea > 0 ? (overMantelArea / pricing.wallCoverageSqFtPerGallon) * coats : 0;
              const overMantelMaterials = Math.ceil(overMantelGallons) * pricing.wallPaintPerGallon;

              const anyPart = hasMantel || hasLegs || hasOverMantel;

              return (
                <Card style={{ marginBottom: Spacing.md }}>
                  <Text style={Typography.h2}>Fireplace Summary</Text>

                  <View style={{ flexDirection: "row", gap: Spacing.sm }}>
                    {/* Gray section - parts list */}
                    <View style={{ flex: 3, backgroundColor: Colors.backgroundWarmGray, borderRadius: BorderRadius.default, padding: Spacing.md }}>
                      {/* Empty row for alignment */}
                      <View style={{ marginBottom: Spacing.xs }}>
                        <Text style={{ fontSize: 13, color: "transparent" }}>-</Text>
                      </View>

                      {hasMantel && (
                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                          <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>Mantel</Text>
                          <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>Fixed</Text>
                        </View>
                      )}

                      {hasLegs && (
                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                          <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>Legs</Text>
                          <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>Fixed</Text>
                        </View>
                      )}

                      {hasOverMantel && overMantelArea > 0 && (
                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                          <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>Over Mantel</Text>
                          <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>
                            {formatMeasurement(Math.ceil(overMantelArea), 'area', unitSystem, 0)}
                          </Text>
                        </View>
                      )}

                      {!anyPart && (
                        <Text style={{ fontSize: 13, color: Colors.mediumGray, fontStyle: "italic" }}>
                          No parts selected
                        </Text>
                      )}
                    </View>

                    {/* Blue section - Labor and Materials */}
                    <View style={{ flex: 2, backgroundColor: "#E3F2FD", borderRadius: BorderRadius.default, padding: Spacing.md }}>
                      {/* Header Row */}
                      <View style={{ flexDirection: "row", gap: Spacing.xs, marginBottom: Spacing.xs }}>
                        <Text style={{ flex: 1, fontSize: 13, color: Colors.mediumGray, textAlign: "right" }}>Labor</Text>
                        <Text style={{ flex: 1, fontSize: 13, color: Colors.mediumGray, textAlign: "right" }}>Mat</Text>
                      </View>

                      {hasMantel && (
                        <View style={{ flexDirection: "row", gap: Spacing.xs, marginBottom: Spacing.xs }}>
                          <Text style={{ flex: 1, fontSize: 13, color: Colors.darkCharcoal, textAlign: "right" }}>
                            ${Math.round(mantelLabor)}
                          </Text>
                          <Text style={{ flex: 1, fontSize: 13, color: Colors.darkCharcoal, textAlign: "right" }}>
                            ${Math.round(mantelMaterials)}
                          </Text>
                        </View>
                      )}

                      {hasLegs && (
                        <View style={{ flexDirection: "row", gap: Spacing.xs, marginBottom: Spacing.xs }}>
                          <Text style={{ flex: 1, fontSize: 13, color: Colors.darkCharcoal, textAlign: "right" }}>
                            ${Math.round(legsLabor)}
                          </Text>
                          <Text style={{ flex: 1, fontSize: 13, color: Colors.darkCharcoal, textAlign: "right" }}>
                            ${Math.round(legsMaterials)}
                          </Text>
                        </View>
                      )}

                      {hasOverMantel && overMantelArea > 0 && (
                        <View style={{ flexDirection: "row", gap: Spacing.xs, marginBottom: Spacing.xs }}>
                          <Text style={{ flex: 1, fontSize: 13, color: Colors.darkCharcoal, textAlign: "right" }}>
                            ${Math.round(overMantelLabor)}
                          </Text>
                          <Text style={{ flex: 1, fontSize: 13, color: Colors.darkCharcoal, textAlign: "right" }}>
                            ${Math.round(overMantelMaterials)}
                          </Text>
                        </View>
                      )}

                      {!anyPart && (
                        <View style={{ flexDirection: "row", gap: Spacing.xs, marginBottom: Spacing.xs }}>
                          <Text style={{ flex: 1, fontSize: 13, color: Colors.mediumGray, textAlign: "right" }}>-</Text>
                          <Text style={{ flex: 1, fontSize: 13, color: Colors.mediumGray, textAlign: "right" }}>-</Text>
                        </View>
                      )}

                      <View style={{ height: 1, backgroundColor: "#90CAF9", marginVertical: Spacing.xs }} />

                      {/* Subtotals */}
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
            {testMode && calculations && (() => {
              const frontBackArea = 2 * parseFloat(width || '0') * parseFloat(height || '0');
              const topArea = parseFloat(width || '0') * parseFloat(depth || '0');
              const sideArea = parseFloat(height || '0') * parseFloat(depth || '0');
              const trimArea = hasTrim && parseFloat(trimLinearFeet || '0') > 0
                ? parseFloat(trimLinearFeet || '0') * (unitSystem === 'metric' ? 0.15 : 0.5)
                : 0;

              return (
                <Card style={{ marginBottom: Spacing.md }}>
                  <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.error, marginBottom: Spacing.md }}>
                    TEST MODE: Calculation Details
                  </Text>

                  <View style={{ backgroundColor: Colors.backgroundWarmGray, borderRadius: BorderRadius.default, padding: Spacing.md }}>
                    {/* Front/Back */}
                    {frontBackArea > 0 && (
                      <View style={{ marginBottom: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.neutralGray }}>
                        <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                          Front/Back Faces
                        </Text>
                        <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                          Area: {frontBackArea.toFixed(2)} {unitSystem === 'metric' ? 'm²' : 'sq ft'} (2 × {width} × {height})
                        </Text>
                      </View>
                    )}

                    {/* Top */}
                    {topArea > 0 && (
                      <View style={{ marginBottom: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.neutralGray }}>
                        <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                          Top Surface
                        </Text>
                        <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                          Area: {topArea.toFixed(2)} {unitSystem === 'metric' ? 'm²' : 'sq ft'} ({width} × {depth})
                        </Text>
                      </View>
                    )}

                    {/* Side */}
                    {sideArea > 0 && (
                      <View style={{ marginBottom: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.neutralGray }}>
                        <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                          Side Surface
                        </Text>
                        <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                          Area: {sideArea.toFixed(2)} {unitSystem === 'metric' ? 'm²' : 'sq ft'} ({height} × {depth})
                        </Text>
                      </View>
                    )}

                    {/* Trim */}
                    {trimArea > 0 && (
                      <View style={{ marginBottom: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.neutralGray }}>
                        <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                          Trim
                        </Text>
                        <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                          Area: {trimArea.toFixed(2)} {unitSystem === 'metric' ? 'm²' : 'sq ft'} ({trimLinearFeet} × {unitSystem === 'metric' ? '0.15' : '0.5'})
                        </Text>
                      </View>
                    )}

                    {/* Labor */}
                    <View style={{ marginBottom: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.neutralGray }}>
                      <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                        Labor
                      </Text>
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                        Fixed rate: ${pricing.fireplaceLabor.toFixed(2)}
                      </Text>
                    </View>

                    {/* Paint */}
                    <View style={{ marginBottom: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.neutralGray }}>
                      <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                        Paint
                      </Text>
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                        Total Area: {calculations.paintableArea.toFixed(2)} {unitSystem === 'metric' ? 'm²' : 'sq ft'} | Coats: {fireplace?.coats || 2}
                      </Text>
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                        Coverage: {pricing.wallCoverageSqFtPerGallon} sqft/gal
                      </Text>
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                        Gallons: {calculations.totalGallons.toFixed(2)} gal
                      </Text>
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                        Materials: {Math.ceil(calculations.totalGallons)} gal × ${pricing.wallPaintPerGallon.toFixed(2)}/gal = ${calculations.materialsDisplayed.toFixed(2)}
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
                borderRadius: BorderRadius.default,
                paddingVertical: Spacing.md,
                alignItems: "center",
                ...Shadows.card,
              }}
              accessibilityRole="button"
              accessibilityLabel="Save fireplace"
              accessibilityHint="Save all changes to this fireplace"
            >
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.white }}>
                Save Fireplace
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
