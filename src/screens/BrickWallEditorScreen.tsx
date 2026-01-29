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
  Switch,
  Modal,
  InputAccessoryView,
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
  const defaultWallCoats = project?.globalPaintDefaults?.defaultWallCoats ?? 2;

  // Brick wall name/location
  const [name, setName] = useState(!isNewBrickWall && brickWall?.name ? brickWall.name : "");

  // Dimensions (stored in feet)
  const [width, setWidth] = useState(!isNewBrickWall && brickWall?.width && brickWall.width > 0 ? formatMeasurementValue(brickWall.width, 'length', unitSystem, 2) : "");
  const [height, setHeight] = useState(!isNewBrickWall && brickWall?.height && brickWall.height > 0 ? formatMeasurementValue(brickWall.height, 'length', unitSystem, 2) : "");

  // Primer toggle
  const [includePrimer, setIncludePrimer] = useState(!isNewBrickWall && brickWall?.includePrimer !== undefined ? brickWall.includePrimer : true);

  // Coats (1 or 2, default 2)
  const [coats, setCoats] = useState(!isNewBrickWall && brickWall?.coats ? brickWall.coats : defaultWallCoats);

  const [notes, setNotes] = useState(!isNewBrickWall && brickWall?.notes ? brickWall.notes : "");
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [infoModalTitle, setInfoModalTitle] = useState("");
  const [infoModalBody, setInfoModalBody] = useState("");
  const [photos, setPhotos] = useState<RoomPhoto[]>(
    !isNewBrickWall && brickWall?.photos ? brickWall.photos : []
  );
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [editingPhotoNote, setEditingPhotoNote] = useState("");
  const [detailsExpanded, setDetailsExpanded] = useState(true);
  const [detailsConfirmed, setDetailsConfirmed] = useState(brickWall?.detailsConfirmed ?? false);
  const confirmedCardColor = Colors.success + "50";
  const detailsSnapshotRef = useRef<string>("");

  const detailsSnapshot = useMemo(
    () =>
      JSON.stringify({
        name,
        width,
        height,
        includePrimer,
        coats,
      }),
    [name, width, height, includePrimer, coats]
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
  const notesAccessoryID = useRef(`notes-${Math.random().toString(36).slice(2)}`).current;

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

    if (!detailsConfirmed) {
      openInfoModal("Confirm Required", "Please confirm: Brick/Panel Details");
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
        detailsConfirmed,
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
        detailsConfirmed,
      });
    }

    // Navigation happens automatically via useEffect when isSaving becomes true
  };

  const openInfoModal = (title: string, body: string) => {
    setInfoModalTitle(title);
    setInfoModalBody(body);
    setInfoModalVisible(true);
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
                Cancel
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
              {(name || "Unnamed Brick/Panel") + "'s Details"}
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
                PAGE: BrickWallEditorScreen
              </Text>
            </View>
          )}

          <View style={{ padding: 0 }}>
            {/* Brick Wall Information Card */}
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
                      Brick/Panel Details
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
                  placeholder="e.g., Front Yard Brick, Garden Panel"
                  nextFieldRef={widthRef}
                  returnKeyType="next"
                  className="mb-0"
                />
              </View>

              {/* Dimensions */}
              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: Spacing.sm, marginBottom: Spacing.md }}>
                <View style={{ flex: 1, marginTop: Typography.caption.fontSize + Spacing.xs }}>
                  <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500" as any, color: Colors.darkCharcoal, marginTop: Spacing.sm }}>
                    Wall
                  </Text>
                </View>
                <View style={{ alignItems: "center", width: 68 }}>
                  <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.xs }}>
                    Width ({unitSystem === "metric" ? "m" : "ft"})
                  </Text>
                  <FormInput
                    ref={widthRef}
                    previousFieldRef={nameRef}
                    label=""
                    value={width}
                    onChangeText={setWidth}
                    keyboardType="numeric"
                    placeholder="0"
                    nextFieldRef={heightRef}
                    inputContainerStyle={{ width: 68 }}
                    className="mb-0"
                  />
                </View>
                <View style={{ alignItems: "center", width: 68 }}>
                  <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.xs }}>
                    Height ({unitSystem === "metric" ? "m" : "ft"})
                  </Text>
                  <FormInput
                    ref={heightRef}
                    previousFieldRef={widthRef}
                    label=""
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
              <View style={{ marginBottom: Spacing.md }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ flex: 1, marginRight: Spacing.md }}>
                    <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                      <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500" as any, color: Colors.darkCharcoal }}>
                        Include Primer
                      </Text>
                      <Pressable
                        onPress={() => openInfoModal("Include Primer", "Add 1 coat of primer before paint")}
                        hitSlop={8}
                        style={{ marginLeft: Spacing.xs, marginTop: -2 }}
                      >
                        <Ionicons name="help-circle-outline" size={14} color={Colors.mediumGray} accessibilityLabel="Include primer help" />
                      </Pressable>
                    </View>
                    
                  </View>
                  <Switch
                    value={includePrimer}
                    onValueChange={setIncludePrimer}
                    trackColor={{
                      false: Colors.neutralGray,
                      true: Colors.primaryBlue,
                    }}
                    thumbColor={Colors.white}
                    ios_backgroundColor={Colors.neutralGray}
                  />
                </View>
              </View>

              {/* Coats Toggle */}
              <View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ flex: 1, marginRight: Spacing.md }}>
                    <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                      <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500" as any, color: Colors.darkCharcoal }}>
                        2 Coats of Paint
                      </Text>
                      <Pressable
                        onPress={() => openInfoModal("2 Coats of Paint", "Toggle ON for 2 coats, OFF for 1 coat")}
                        hitSlop={8}
                        style={{ marginLeft: Spacing.xs, marginTop: -2 }}
                      >
                        <Ionicons name="help-circle-outline" size={14} color={Colors.mediumGray} accessibilityLabel="Two coats help" />
                      </Pressable>
                    </View>
                    
                  </View>
                  <Switch
                    value={coats === 2}
                    onValueChange={(value) => setCoats(value ? 2 : 1)}
                    trackColor={{
                      false: Colors.neutralGray,
                      true: Colors.primaryBlue,
                    }}
                    thumbColor={Colors.white}
                    ios_backgroundColor={Colors.neutralGray}
                  />
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
                      Brick/Panel notes and reminders
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
                    placeholder="Add any notes about this brick wall..."
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

            {/* Brick/Panel Photos Section */}
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
                  {(name ? name : "Brick Wall") + "'s Photos"}
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

            {/* Brick Wall Summary */}
            {calculations && (
              <Card style={{ marginBottom: Spacing.md }}>
                <Text style={Typography.h2}>Brick/Panel Summary</Text>

                <View style={{ flexDirection: "row", gap: Spacing.sm }}>
                  {/* Gray section - breakdown list */}
                  <View style={{ flex: 3, backgroundColor: Colors.backgroundWarmGray, borderRadius: 8, padding: Spacing.md }}>
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

                  {/* Blue section - Labor + Materials (Gallons) */}
                  <View style={{ flex: 2, backgroundColor: "#E3F2FD", borderRadius: 8, padding: Spacing.md }}>
                    <Text style={{ fontSize: 13, color: Colors.mediumGray, textAlign: "right", marginBottom: Spacing.xs }}>
                      Labor
                    </Text>

                    <Text style={{ fontSize: 13, color: Colors.darkCharcoal, textAlign: "right", marginBottom: Spacing.xs }}>
                      ${Math.round(calculations.laborDisplayed)}
                    </Text>

                    <View style={{ height: 1, backgroundColor: "#90CAF9", marginVertical: Spacing.xs }} />

                    <View style={{ alignItems: "flex-end", marginBottom: Spacing.sm }}>
                      <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "700" as any, color: Colors.darkCharcoal }}>
                        Labor Total:
                      </Text>
                      <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: "700" as any, color: Colors.primaryBlue }}>
                        ${Math.round(calculations.laborDisplayed).toLocaleString()}
                      </Text>
                    </View>

                    <Text style={{ fontSize: 13, color: Colors.mediumGray, textAlign: "right", marginBottom: Spacing.xs }}>
                      Materials (Gallons)
                    </Text>
                    {includePrimer && calculations.primerGallons > 0 && (
                      <Text style={{ fontSize: 13, color: Colors.darkCharcoal, textAlign: "right", marginBottom: Spacing.xs }}>
                        Primer: {calculations.primerGallons.toFixed(2)} gal
                      </Text>
                    )}
                    {calculations.paintGallons > 0 && (
                      <Text style={{ fontSize: 13, color: Colors.darkCharcoal, textAlign: "right" }}>
                        Paint: {calculations.paintGallons.toFixed(2)} gal
                      </Text>
                    )}
                  </View>
                </View>
              </Card>
            )}

            {testMode && calculations && (() => {
              const wallArea = calculations.paintableArea;
              const wallCoverage = Math.max(1, pricing.wallCoverageSqFtPerGallon);
              const laborMultiplier = coats === 2 ? pricing.secondCoatLaborMultiplier : 1.0;
              const paintGallons = (wallArea / wallCoverage) * coats;
              const paintLaborCost = wallArea * pricing.wallLaborPerSqFt * laborMultiplier;
              const paintMaterialsCost = Math.ceil(paintGallons) * pricing.wallPaintPerGallon;

              const primerGallons = includePrimer ? wallArea / wallCoverage : 0;
              const primerLaborCost = includePrimer ? wallArea * pricing.wallLaborPerSqFt : 0;
              const primerMaterialsCost = includePrimer ? Math.ceil(primerGallons) * pricing.primerPerGallon : 0;

              return (
                <Card style={{ marginBottom: Spacing.md }}>
                  <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.error, marginBottom: Spacing.md }}>
                    TEST MODE: Calculation Settings
                  </Text>

                  <View style={{ backgroundColor: Colors.backgroundWarmGray, borderRadius: BorderRadius.default, padding: Spacing.md }}>
                    <View style={{ marginBottom: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.neutralGray }}>
                      <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                        Wall Area
                      </Text>
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                        Area: {formatMeasurement(wallArea, "area", unitSystem, 2)} | Coats: {coats}
                      </Text>
                    </View>

                    {includePrimer && (
                      <View style={{ marginBottom: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.neutralGray }}>
                        <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                          Primer
                        </Text>
                        <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                          Coverage: {pricing.wallCoverageSqFtPerGallon} sqft/gal | Gallons: {primerGallons.toFixed(2)}
                        </Text>
                        <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                          Labor: {wallArea.toFixed(2)} × ${pricing.wallLaborPerSqFt.toFixed(2)}/sqft = ${primerLaborCost.toFixed(2)}
                        </Text>
                        <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                          Materials: {Math.ceil(primerGallons)} gal × ${pricing.primerPerGallon.toFixed(2)}/gal = ${primerMaterialsCost.toFixed(2)}
                        </Text>
                      </View>
                    )}

                    <View style={{ marginBottom: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.neutralGray }}>
                      <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                        Paint
                      </Text>
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                        Coverage: {pricing.wallCoverageSqFtPerGallon} sqft/gal | Gallons: {paintGallons.toFixed(2)}
                      </Text>
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                        Labor: {wallArea.toFixed(2)} × ${pricing.wallLaborPerSqFt.toFixed(2)}/sqft × {laborMultiplier.toFixed(2)} = ${paintLaborCost.toFixed(2)}
                      </Text>
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                        Materials: {Math.ceil(paintGallons)} gal × ${pricing.wallPaintPerGallon.toFixed(2)}/gal = ${paintMaterialsCost.toFixed(2)}
                      </Text>
                    </View>

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

        {/* Save Confirmation Modal */}
        <SavePromptModal
          visible={showSavePrompt}
          onSave={handleSaveAndLeave}
          onDiscard={handleDiscardAndLeave}
          onCancel={handleCancelExit}
        />
      </KeyboardAvoidingView>

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
          <View style={{ backgroundColor: Colors.white, borderRadius: 8, padding: Spacing.lg, ...Shadows.card }}>
            <Text style={{ fontSize: Typography.h3.fontSize, fontWeight: Typography.h3.fontWeight as any, color: Colors.darkCharcoal, marginBottom: Spacing.sm }}>
              {infoModalTitle}
            </Text>
            <Text style={{ fontSize: Typography.body.fontSize, color: Colors.mediumGray, marginBottom: Spacing.lg }}>
              {infoModalBody}
            </Text>
            <Pressable
              onPress={() => setInfoModalVisible(false)}
              style={{ backgroundColor: Colors.primaryBlue, borderRadius: 8, paddingVertical: Spacing.sm, alignItems: "center" }}
            >
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.white }}>
                Close
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
