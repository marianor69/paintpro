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
import { formatCurrency } from "../utils/calculations";
import { computeBrickWallPricingSummary } from "../utils/pricingSummary";
import { formatMeasurementValue, parseDisplayValue, formatMeasurement } from "../utils/unitConversion";
import { RoomPhoto } from "../types/painting";

type Props = NativeStackScreenProps<RootStackParamList, "BrickWallEditor">;

export default function BrickWallEditorScreen({ route, navigation }: Props) {
  const { projectId, brickWallId } = route.params;

  // Check if this is a NEW brick wall (no ID) or existing
  const isNewBrickWall = !brickWallId;

  const project = useProjectStore((s) =>
    s.projects.find((p) => p.id === projectId)
  );
  const brickWall = !isNewBrickWall
    ? project?.brickWalls.find((bw) => bw.id === brickWallId)
    : null; // New brick wall - no existing data

  const addBrickWall = useProjectStore((s) => s.addBrickWall);
  const updateBrickWall = useProjectStore((s) => s.updateBrickWall);
  const pricing = usePricingStore();
  const { testMode, unitSystem } = useAppSettings();

  // Brick wall name/location
  const [name, setName] = useState(!isNewBrickWall && brickWall?.name ? brickWall.name : "");

  // Dimensions (stored in feet)
  const [width, setWidth] = useState(!isNewBrickWall && brickWall?.width && brickWall.width > 0 ? formatMeasurementValue(brickWall.width, 'length', unitSystem, 2) : "");
  const [height, setHeight] = useState(!isNewBrickWall && brickWall?.height && brickWall.height > 0 ? formatMeasurementValue(brickWall.height, 'length', unitSystem, 2) : "");

  // Primer toggle
  const [includePrimer, setIncludePrimer] = useState(!isNewBrickWall && brickWall?.includePrimer !== undefined ? brickWall.includePrimer : true);

  // Coats (1 or 2, default 2)
  const [coats, setCoats] = useState(!isNewBrickWall && brickWall?.coats ? brickWall.coats : 2);

  const [notes, setNotes] = useState(!isNewBrickWall && brickWall?.notes ? brickWall.notes : "");
  const [photos, setPhotos] = useState<RoomPhoto[]>(
    !isNewBrickWall && brickWall?.photos ? brickWall.photos : []
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
    if (isNewBrickWall) {
      // For new brick wall: changes are when user enters any data
      const hasChanges =
        name !== "" ||
        width !== "" ||
        height !== "";
      setHasUnsavedChanges(hasChanges);
    } else {
      // For existing: changes are when values differ from stored data
      if (!brickWall) return;

      const photosChanged =
        photos.length !== (brickWall.photos?.length || 0) ||
        photos.some((photo, index) => {
          const stored = brickWall.photos?.[index];
          return !stored || photo.uri !== stored.uri || photo.note !== stored.note;
        });

      const hasChanges =
        name !== (brickWall.name || "") ||
        width !== (brickWall.width && brickWall.width > 0 ? brickWall.width.toString() : "") ||
        height !== (brickWall.height && brickWall.height > 0 ? brickWall.height.toString() : "") ||
        includePrimer !== (brickWall.includePrimer ?? true) ||
        coats !== (brickWall.coats ?? 2) ||
        notes !== (brickWall.notes || "") ||
        photosChanged;

      setHasUnsavedChanges(hasChanges);
    }
  }, [
    isNewBrickWall,
    brickWall,
    name,
    width,
    height,
    includePrimer,
    coats,
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
  const generatePhotoFileName = (brickWallName: string, photoIndex: number): string => {
    const safeName = (brickWallName || "Brick_Panel").replace(/[^a-zA-Z0-9]/g, "_");
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

    // Validate required fields
    if (!name.trim()) {
      Alert.alert("Missing Data", "Please enter a name/location for this brick wall.");
      return;
    }

    if (width === "" || height === "") {
      Alert.alert("Missing Data", "Please enter both width and height.");
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
    const normalizedPhotos = photos.map((photo, index) => ({
      ...photo,
      fileName: generatePhotoFileName(name.trim(), index + 1),
    }));

    if (isNewBrickWall) {
      // CREATE new brick wall with data
      const newBrickWallId = addBrickWall(projectId);

      // Then immediately update it with the entered data
      updateBrickWall(projectId, newBrickWallId, {
        name: name.trim(),
        width: widthFeet,
        height: heightFeet,
        includePrimer,
        coats,
        notes: notes.trim() || undefined,
        photos: normalizedPhotos,
      });
    } else {
      // UPDATE existing brick wall
      updateBrickWall(projectId, brickWallId!, {
        name: name.trim(),
        width: widthFeet,
        height: heightFeet,
        includePrimer,
        coats,
        notes: notes.trim() || undefined,
        photos: normalizedPhotos,
      });
    }

    // Navigation happens automatically via useEffect when isSaving becomes true
  };

  const handleDiscardAndLeave = () => {
    // For new brick walls, nothing to delete (never created)
    // For existing brick walls, just go back without changes
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
    isNewBrickWall || !brickWall
      ? computeBrickWallPricingSummary(
          {
            id: "",
            name: "",
            width: parseFloat(width) || 0,
            height: parseFloat(height) || 0,
            includePrimer,
            coats,
          },
          pricing
        )
      : computeBrickWallPricingSummary(
          {
            ...brickWall,
            width: parseFloat(width) || 0,
            height: parseFloat(height) || 0,
            includePrimer,
            coats,
          },
          pricing
        );

  // If existing brick wall not found, show error
  if (!isNewBrickWall && !brickWall) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.backgroundWarmGray }}>
        <Text style={{ fontSize: Typography.h3.fontSize, color: Colors.mediumGray }}>Brick/Panel not found</Text>
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
                PAGE: BrickWallEditorScreen
              </Text>
            </View>
          )}

          <View style={{ padding: Spacing.md }}>
            {/* Brick Wall Information Card */}
            <Card style={{ marginBottom: Spacing.md }}>
              {/* Name/Location */}
              <View style={{ marginBottom: Spacing.md }}>
                <FormInput
                  ref={nameRef}
                  label="Name/Location"
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g., Front Yard Brick, Garden Panel"
                  nextFieldRef={widthRef}
                  returnKeyType="next"
                  className="mb-0"
                />
              </View>

              {/* Dimensions */}
              <View style={{ flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.md }}>
                <View style={{ flex: 1 }}>
                  <FormInput
                    ref={widthRef}
                    previousFieldRef={nameRef}
                    label={`Width (${unitSystem === 'metric' ? 'm' : 'ft'})`}
                    value={width}
                    onChangeText={setWidth}
                    keyboardType="numeric"
                    placeholder="0"
                    nextFieldRef={heightRef}
                    inputContainerStyle={{ width: 68 }}
                    className="mb-0"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <FormInput
                    ref={heightRef}
                    previousFieldRef={widthRef}
                    label={`Height (${unitSystem === 'metric' ? 'm' : 'ft'})`}
                    value={height}
                    onChangeText={setHeight}
                    keyboardType="numeric"
                    placeholder="0"
                    inputContainerStyle={{ width: 68 }}
                    className="mb-0"
                  />
                </View>
              </View>

              {/* Primer Toggle */}
              <Toggle
                label="Include Primer"
                value={includePrimer}
                onValueChange={setIncludePrimer}
                description="Add 1 coat of primer before paint"
              />

              {/* Coats Toggle */}
              <Toggle
                label="2 Coats of Paint"
                value={coats === 2}
                onValueChange={(value) => setCoats(value ? 2 : 1)}
                description="Toggle ON for 2 coats, OFF for 1 coat"
                className="mb-0"
              />
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
                  placeholder="Add any notes about this brick wall..."
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

            {/* Brick/Panel Photos Section */}
            <Card style={{ marginBottom: Spacing.md }}>
              <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                Brick/Panel Photos
              </Text>
              <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.md }}>
                Document cracks, staining, and surface conditions
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

            {/* Brick Wall Summary */}
            {calculations && (
              <Card style={{ marginBottom: Spacing.md }}>
                <Text style={Typography.h2}>Brick/Panel Summary</Text>

                <View style={{ flexDirection: "row", gap: Spacing.sm }}>
                  {/* Gray section - breakdown list */}
                  <View style={{ flex: 3, backgroundColor: Colors.backgroundWarmGray, borderRadius: BorderRadius.default, padding: Spacing.md }}>
                    {/* Header */}
                    <View style={{ marginBottom: Spacing.xs }}>
                      <Text style={{ fontSize: 13, color: "transparent" }}>-</Text>
                    </View>

                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                      <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>Wall</Text>
                      <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>
                        {formatMeasurement(Math.ceil(calculations.paintableArea), 'area', unitSystem, 0)}
                      </Text>
                    </View>
                  </View>

                  {/* Blue section - Labor and Materials */}
                  <View style={{ flex: 2, backgroundColor: "#E3F2FD", borderRadius: BorderRadius.default, padding: Spacing.md }}>
                    {/* Header Row */}
                    <View style={{ flexDirection: "row", gap: Spacing.xs, marginBottom: Spacing.xs }}>
                      <Text style={{ flex: 1, fontSize: 13, color: Colors.mediumGray, textAlign: "right" }}>Labor</Text>
                      <Text style={{ flex: 1, fontSize: 13, color: Colors.mediumGray, textAlign: "right" }}>Mat</Text>
                    </View>

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
            )}

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
              accessibilityLabel="Save brick wall"
              accessibilityHint="Save all changes to this brick wall"
            >
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.white }}>
                Save Brick/Panel
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
