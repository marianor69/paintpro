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
import { FormInput } from "../components/FormInput";
import { SavePromptModal } from "../components/SavePromptModal";
import { formatCurrency } from "../utils/calculations";
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
  const { testMode, unitSystem } = useAppSettings();

  // Convert stored imperial values (inches) to display values based on unit system
  // Built-ins store dimensions in INCHES, but unit conversion works with FEET, so convert inches->feet->display
  const [name, setName] = useState(!isNewBuiltIn && builtIn?.name ? builtIn.name : "");
  const [width, setWidth] = useState(!isNewBuiltIn && builtIn?.width && builtIn.width > 0 ? formatMeasurementValue(builtIn.width / 12, 'length', unitSystem, 2) : "");
  const [height, setHeight] = useState(!isNewBuiltIn && builtIn?.height && builtIn.height > 0 ? formatMeasurementValue(builtIn.height / 12, 'length', unitSystem, 2) : "");
  const [depth, setDepth] = useState(!isNewBuiltIn && builtIn?.depth && builtIn.depth > 0 ? formatMeasurementValue(builtIn.depth / 12, 'length', unitSystem, 2) : "");
  const [shelfCount, setShelfCount] = useState(!isNewBuiltIn && builtIn?.shelfCount && builtIn.shelfCount > 0 ? builtIn.shelfCount.toString() : "");
  const [notes, setNotes] = useState(!isNewBuiltIn && builtIn?.notes ? builtIn.notes : "");
  const [photos, setPhotos] = useState<RoomPhoto[]>(builtIn?.photos || []);
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [editingPhotoNote, setEditingPhotoNote] = useState("");
  const [photoErrorMessage, setPhotoErrorMessage] = useState("");
  const [deletePhotoId, setDeletePhotoId] = useState<string | null>(null);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // Prevent double-save and navigation modal
  const isSavingRef = useRef(false); // Ref-based guard for rapid taps (more reliable than state)
  const isKeyboardVisibleRef = useRef(false);
  const pendingSavePromptRef = useRef(false);
  // MD-002: Store the navigation action to dispatch when discarding
  const preventedNavigationActionRef = useRef<any>(null);

  // Refs for form field navigation
  const nameRef = useRef<TextInput>(null);
  const widthRef = useRef<TextInput>(null);
  const heightRef = useRef<TextInput>(null);
  const depthRef = useRef<TextInput>(null);
  const shelfCountRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const notesCardRef = useRef<View>(null);
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
        notes !== "" ||
        photos.length > 0;
      setHasUnsavedChanges(hasChanges);
    } else {
      // For existing: changes are when values differ from stored data
      if (!builtIn) return;

      const hasChanges =
        name !== (builtIn.name || "") ||
        width !== (builtIn.width && builtIn.width > 0 ? builtIn.width.toString() : "") ||
        height !== (builtIn.height && builtIn.height > 0 ? builtIn.height.toString() : "") ||
        depth !== (builtIn.depth && builtIn.depth > 0 ? builtIn.depth.toString() : "") ||
        shelfCount !== (builtIn.shelfCount && builtIn.shelfCount > 0 ? builtIn.shelfCount.toString() : "") ||
        notes !== (builtIn.notes || "") ||
        !arePhotosEqual(photos, builtIn.photos || []);

      setHasUnsavedChanges(hasChanges);
    }
  }, [isNewBuiltIn, builtIn, name, width, height, depth, shelfCount, notes, photos, arePhotosEqual]);

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
      notes !== "" ||
      photos.length > 0;

    if (!hasAnyData) {
      Alert.alert("No Data Entered", "Please enter a name and at least one measurement before saving.");
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
        coats: 1,
        notes: notes.trim() || undefined,
        photos: updatedPhotos,
      });
    } else {
      // UPDATE existing built-in
      updateBuiltIn(projectId, builtInId!, {
        name: trimmedName,
        width: widthInches,
        height: heightInches,
        depth: depthInches,
        shelfCount: parseInt(shelfCount) || 0,
        coats: builtIn?.coats || 1,
        notes: notes.trim() || undefined,
        photos: updatedPhotos,
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

  // Calculate total paintable area (all 6 faces of the box)
  const widthVal = parseFloat(width) || 0;
  const heightVal = parseFloat(height) || 0;
  const depthVal = parseFloat(depth) || 0;
  const totalPaintableArea =
    2 * (widthVal * heightVal) + // front and back
    2 * (heightVal * depthVal) + // left and right sides (height × depth)
    2 * (widthVal * depthVal) + // top and bottom (width × depth)
    (shelfCount ? parseInt(shelfCount) * widthVal : 0); // shelves

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
                PAGE: BuiltInEditorScreen
              </Text>
            </View>
          )}

          <View style={{ padding: Spacing.md }}>
            {/* Built-In Information Card */}
            <Card style={{ marginBottom: Spacing.md }}>
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
                    nextFieldRef={shelfCountRef}
                    inputContainerStyle={{ width: bubbleWidth }}
                    inputTextStyle={bubbleInputTextStyle}
                    labelStyle={bubbleLabelStyle}
                    className="mb-0"
                  />
                </View>
                <View style={bubbleLabelContainerStyle}>
                  <FormInput
                    ref={shelfCountRef}
                    previousFieldRef={depthRef}
                    label="Shelves"
                    value={shelfCount}
                    onChangeText={setShelfCount}
                    keyboardType="numeric"
                    placeholder="0"
                    inputContainerStyle={{ width: bubbleWidth }}
                    inputTextStyle={bubbleInputTextStyle}
                    labelStyle={bubbleLabelStyle}
                    className="mb-0"
                  />
                </View>
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
                  placeholder="Add any notes about this built-in..."
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

            {/* Built-In Photos */}
            <Card style={{ marginBottom: Spacing.md }}>
              <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                Built-In Photos
              </Text>
              <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.md }}>
                Capture shelves, trim details, damage, or touch-up notes
              </Text>

              <View style={{ flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.sm }}>
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

              {photos.length === 0 && (
                <View style={{ backgroundColor: Colors.backgroundWarmGray, borderRadius: BorderRadius.default, padding: Spacing.lg, alignItems: "center" }}>
                  <Ionicons name="camera-outline" size={40} color={Colors.mediumGray} />
                  <Text style={{ fontSize: Typography.body.fontSize, color: Colors.mediumGray, marginTop: Spacing.sm, textAlign: "center" }}>
                    No photos added yet
                  </Text>
                </View>
              )}
            </Card>

            {/* Built-In Summary */}
            {hasAnyDimensions && (() => {
              // Calculate per-component areas
              const frontBackArea = 2 * widthVal * heightVal;
              const leftRightArea = 2 * heightVal * depthVal;
              const topBottomArea = 2 * widthVal * depthVal;
              const shelvesArea = shelfCount && parseInt(shelfCount) > 0 ? parseInt(shelfCount) * widthVal : 0;

              return (
                <Card style={{ marginBottom: Spacing.md }}>
                  <Text style={Typography.h2}>Built-In Summary</Text>

                  <View style={{ backgroundColor: Colors.backgroundWarmGray, borderRadius: BorderRadius.default, padding: Spacing.md }}>
                    {frontBackArea > 0 && (
                      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                        <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>Front/Back</Text>
                        <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>
                          {formatMeasurement(Math.ceil(frontBackArea), 'area', unitSystem, 0)}
                        </Text>
                      </View>
                    )}

                    {leftRightArea > 0 && (
                      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                        <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>Left/Right</Text>
                        <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>
                          {formatMeasurement(Math.ceil(leftRightArea), 'area', unitSystem, 0)}
                        </Text>
                      </View>
                    )}

                    {topBottomArea > 0 && (
                      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                        <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>Top/Bottom</Text>
                        <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>
                          {formatMeasurement(Math.ceil(topBottomArea), 'area', unitSystem, 0)}
                        </Text>
                      </View>
                    )}

                    {shelvesArea > 0 && (
                      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                        <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>Shelves ({shelfCount})</Text>
                        <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>
                          {formatMeasurement(Math.ceil(shelvesArea), 'area', unitSystem, 0)}
                        </Text>
                      </View>
                    )}

                    <View style={{ height: 1, backgroundColor: Colors.neutralGray, marginVertical: Spacing.sm }} />

                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ fontSize: 13, fontWeight: "700" as any, color: Colors.darkCharcoal }}>
                        Total Area:
                      </Text>
                      <Text style={{ fontSize: 13, fontWeight: "700" as any, color: Colors.darkCharcoal }}>
                        {formatMeasurement(Math.ceil(totalPaintableArea), 'area', unitSystem, 0)}
                      </Text>
                    </View>
                  </View>
                </Card>
              );
            })()}

            {/* Test Mode: Detailed Calculation Breakdown */}
            {testMode && hasAnyDimensions && (() => {
              const frontBackArea = 2 * widthVal * heightVal;
              const leftRightArea = 2 * heightVal * depthVal;
              const topBottomArea = 2 * widthVal * depthVal;
              const shelvesArea = shelfCount && parseInt(shelfCount) > 0 ? parseInt(shelfCount) * widthVal : 0;

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
                        <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                          Formula: 2 × width × height
                        </Text>
                      </View>
                    )}

                    {/* Left/Right */}
                    {leftRightArea > 0 && (
                      <View style={{ marginBottom: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.neutralGray }}>
                        <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                          Left/Right Sides
                        </Text>
                        <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                          Area: {leftRightArea.toFixed(2)} {unitSystem === 'metric' ? 'm²' : 'sq ft'} (2 × {height} × {depth})
                        </Text>
                        <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                          Formula: 2 × height × depth
                        </Text>
                      </View>
                    )}

                    {/* Top/Bottom */}
                    {topBottomArea > 0 && (
                      <View style={{ marginBottom: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.neutralGray }}>
                        <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                          Top/Bottom
                        </Text>
                        <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                          Area: {topBottomArea.toFixed(2)} {unitSystem === 'metric' ? 'm²' : 'sq ft'} (2 × {width} × {depth})
                        </Text>
                        <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                          Formula: 2 × width × depth
                        </Text>
                      </View>
                    )}

                    {/* Shelves */}
                    {shelvesArea > 0 && (
                      <View style={{ marginBottom: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.neutralGray }}>
                        <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                          Shelves
                        </Text>
                        <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                          Count: {shelfCount} shelves
                        </Text>
                        <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                          Area: {shelvesArea.toFixed(2)} {unitSystem === 'metric' ? 'm²' : 'sq ft'} ({shelfCount} × {width})
                        </Text>
                        <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                          Formula: shelf_count × width
                        </Text>
                      </View>
                    )}

                    {/* Total */}
                    <View>
                      <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "700" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                        Total Paintable Area
                      </Text>
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                        Total: {totalPaintableArea.toFixed(2)} {unitSystem === 'metric' ? 'm²' : 'sq ft'}
                      </Text>
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                        Formula: Front/Back + Left/Right + Top/Bottom + Shelves
                      </Text>
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                        = {frontBackArea.toFixed(2)} + {leftRightArea.toFixed(2)} + {topBottomArea.toFixed(2)} + {shelvesArea.toFixed(2)}
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
                borderRadius: BorderRadius.default,
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
                borderRadius: BorderRadius.default,
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
                  onPress={confirmDeletePhoto}
                  style={{
                    flex: 1,
                    backgroundColor: Colors.error,
                    borderRadius: BorderRadius.default,
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
