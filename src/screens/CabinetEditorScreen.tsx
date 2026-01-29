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
import { useAppSettings } from "../state/appSettings";
import { useCalculationSettings } from "../state/calculationStore";
import { Colors, Typography, Spacing, BorderRadius, Shadows, TextInputStyles } from "../utils/designSystem";
import { Card } from "../components/Card";
import { FormInput } from "../components/FormInput";
import { SavePromptModal } from "../components/SavePromptModal";
import { Toggle } from "../components/Toggle";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { v4 as uuidv4 } from "uuid";
import { computeCabinetPricingSummary } from "../utils/pricingSummary";
import { calculatePaintCost, safeNumber } from "../utils/calculations";
import { RoomPhoto } from "../types/painting";

type Props = NativeStackScreenProps<RootStackParamList, "CabinetEditor">;

export default function CabinetEditorScreen({ route, navigation }: Props) {
  const { projectId, cabinetId } = route.params;

  const isNewCabinet = !cabinetId;

  const project = useProjectStore((s) => s.projects.find((p) => p.id === projectId));
  const cabinet = !isNewCabinet
    ? project?.cabinets?.find((c) => c.id === cabinetId)
    : null;

  const addCabinet = useProjectStore((s) => s.addCabinet);
  const updateCabinet = useProjectStore((s) => s.updateCabinet);
  const pricing = usePricingStore();
  const { testMode } = useAppSettings();
  const cabinetPaintCoverageSqFtPerGallon = useAppSettings((s) => s.cabinetPaintCoverageSqFtPerGallon);
  const cabinetDoorWidthIn = useAppSettings((s) => s.cabinetDoorWidthIn);
  const cabinetDoorHeightIn = useAppSettings((s) => s.cabinetDoorHeightIn);
  const cabinetDoorSides = useAppSettings((s) => s.cabinetDoorSides);
  const cabinetWallDoor42WidthIn = useAppSettings((s) => s.cabinetWallDoor42WidthIn);
  const cabinetWallDoor42HeightIn = useAppSettings((s) => s.cabinetWallDoor42HeightIn);
  const cabinetWallDoor42Sides = useAppSettings((s) => s.cabinetWallDoor42Sides);
  const cabinetDrawerWidthIn = useAppSettings((s) => s.cabinetDrawerWidthIn);
  const cabinetDrawerHeightIn = useAppSettings((s) => s.cabinetDrawerHeightIn);
  const cabinetDrawerSides = useAppSettings((s) => s.cabinetDrawerSides);
  const cabinetFrontAreaSqIn = useAppSettings((s) => s.cabinetFrontAreaSqIn);
  const calcSettings = useCalculationSettings((s) => s.settings);

  const [name, setName] = useState(!isNewCabinet && cabinet?.name ? cabinet.name : "");
  const [baseDoorCount, setBaseDoorCount] = useState(!isNewCabinet && cabinet ? cabinet.baseDoorCount : 0);
  const [drawerCount, setDrawerCount] = useState(!isNewCabinet && cabinet ? cabinet.drawerCount : 0);
  const [wallDoorCount, setWallDoorCount] = useState(!isNewCabinet && cabinet ? cabinet.wallDoorCount : 0);
  const [includeWallCabinet42, setIncludeWallCabinet42] = useState(
    !isNewCabinet && cabinet?.includeWallCabinet42 !== undefined ? cabinet.includeWallCabinet42 : true
  );

  const [notes, setNotes] = useState(!isNewCabinet && cabinet?.notes ? cabinet.notes : "");
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [photos, setPhotos] = useState<RoomPhoto[]>(!isNewCabinet && cabinet?.photos ? cabinet.photos : []);
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [editingPhotoNote, setEditingPhotoNote] = useState("");
  const [detailsExpanded, setDetailsExpanded] = useState(true);
  const [detailsConfirmed, setDetailsConfirmed] = useState(cabinet?.detailsConfirmed ?? false);
  const confirmedCardColor = Colors.success + "50";
  const detailsSnapshotRef = useRef<string>("");

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [discardWidth, setDiscardWidth] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const isKeyboardVisibleRef = useRef(false);
  const pendingSavePromptRef = useRef(false);
  const preventedNavigationActionRef = useRef<any>(null);

  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [infoModalTitle, setInfoModalTitle] = useState("");
  const [infoModalBody, setInfoModalBody] = useState("");

  const nameRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const notesCardRef = useRef<View>(null);
  const notesAccessoryID = useRef(`notes-${Math.random().toString(36).slice(2)}`).current;

  const detailsSnapshot = useMemo(
    () =>
      JSON.stringify({
        name,
        baseDoorCount,
        drawerCount,
        wallDoorCount,
        includeWallCabinet42,
      }),
    [name, baseDoorCount, drawerCount, wallDoorCount, includeWallCabinet42]
  );

  useEffect(() => {
    if (detailsConfirmed && !detailsSnapshotRef.current) {
      detailsSnapshotRef.current = detailsSnapshot;
    }
    if (detailsConfirmed && detailsSnapshotRef.current && detailsSnapshotRef.current !== detailsSnapshot) {
      setDetailsConfirmed(false);
    }
  }, [detailsConfirmed, detailsSnapshot]);

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
    if (isNewCabinet) {
      const hasChanges =
        name !== "" ||
        baseDoorCount > 0 ||
        drawerCount > 0 ||
        wallDoorCount > 0 ||
        includeWallCabinet42 !== true ||
        notes !== "" ||
        photos.length > 0;
      setHasUnsavedChanges(hasChanges);
      return;
    }

    if (!cabinet) return;

    const photosChanged =
      photos.length !== (cabinet.photos?.length || 0) ||
      photos.some((photo, index) => {
        const stored = cabinet.photos?.[index];
        return !stored || photo.uri !== stored.uri || photo.note !== stored.note;
      });

    const hasChanges =
      name !== (cabinet.name || "") ||
      baseDoorCount !== (cabinet.baseDoorCount || 0) ||
      drawerCount !== (cabinet.drawerCount || 0) ||
      wallDoorCount !== (cabinet.wallDoorCount || 0) ||
      includeWallCabinet42 !== (cabinet.includeWallCabinet42 ?? true) ||
      notes !== (cabinet.notes || "") ||
      photosChanged;

    setHasUnsavedChanges(hasChanges);
  }, [
    isNewCabinet,
    cabinet,
    name,
    baseDoorCount,
    drawerCount,
    wallDoorCount,
    includeWallCabinet42,
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

  useEffect(() => {
    if (isSaving) {
      navigation.goBack();
    }
  }, [isSaving, navigation]);

  useEffect(() => {
    if (!showSavePrompt) {
      setDiscardWidth(null);
    }
  }, [showSavePrompt]);

  const generatePhotoFileName = useCallback((cabinetName: string, photoIndex: number): string => {
    const safeName = (cabinetName || "Cabinet").replace(/[^a-zA-Z0-9]/g, "_");
    return `${safeName}_Photo_${photoIndex}`;
  }, []);

  const handleAddPhoto = async (useCamera: boolean) => {
    const permission = await (useCamera
      ? ImagePicker.requestCameraPermissionsAsync()
      : ImagePicker.requestMediaLibraryPermissionsAsync());

    if (!permission.granted) {
      openInfoModal("Permission Required", "Please grant photo access to add cabinet photos.");
      return;
    }

    const result = await (useCamera
      ? ImagePicker.launchCameraAsync({ quality: 0.7 })
      : ImagePicker.launchImageLibraryAsync({ quality: 0.7 }));

    if (!result.canceled) {
      const newPhotos = result.assets.map((asset) => ({
        id: uuidv4(),
        uri: asset.uri,
        note: "",
        fileName: generatePhotoFileName(name.trim(), photos.length + 1),
      }));
      setPhotos((prev) => [...prev, ...newPhotos]);
    }
  };

  const handleEditPhotoNote = (photo: RoomPhoto) => {
    setEditingPhotoId(photo.id);
    setEditingPhotoNote(photo.note || "");
  };

  const handleSavePhotoNote = () => {
    if (editingPhotoId) {
      setPhotos((prev) =>
        prev.map((p) =>
          p.id === editingPhotoId ? { ...p, note: editingPhotoNote.trim() || undefined } : p
        )
      );
    }
    setEditingPhotoId(null);
    setEditingPhotoNote("");
  };

  const handleDeletePhoto = (photoId: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  const openInfoModal = (title: string, body: string) => {
    setInfoModalTitle(title);
    setInfoModalBody(body);
    setInfoModalVisible(true);
  };

  const handleDiscardAndLeave = () => {
    setHasUnsavedChanges(false);
    setShowSavePrompt(false);

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

  const handleSave = () => {
    if (isSaving) return;

    if (!name.trim()) {
      openInfoModal("Missing Data", "Please enter a name/location for this cabinet.");
      return;
    }

    if (!detailsConfirmed) {
      openInfoModal("Confirm Required", "Please confirm: Cabinet Details");
      return;
    }

    setIsSaving(true);
    setHasUnsavedChanges(false);
    setShowSavePrompt(false);
    Keyboard.dismiss();

    const normalizedPhotos = photos.map((photo, index) => ({
      ...photo,
      fileName: generatePhotoFileName(name.trim(), index + 1),
    }));

    if (isNewCabinet) {
      const newCabinetId = addCabinet(projectId);
      updateCabinet(projectId, newCabinetId, {
        name: name.trim(),
        baseDoorCount,
        drawerCount,
        wallDoorCount,
        includeWallCabinet42,
        notes: notes.trim() || undefined,
        photos: normalizedPhotos,
        detailsConfirmed,
      });
    } else {
      updateCabinet(projectId, cabinetId!, {
        name: name.trim(),
        baseDoorCount,
        drawerCount,
        wallDoorCount,
        includeWallCabinet42,
        notes: notes.trim() || undefined,
        photos: normalizedPhotos,
        detailsConfirmed,
      });
    }
  };

  const calculations = computeCabinetPricingSummary(
    {
      id: cabinet?.id || "",
      name,
      baseDoorCount,
      drawerCount,
      wallDoorCount,
      includeWallCabinet42,
    },
    pricing
  );

  if (!isNewCabinet && !cabinet) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.backgroundWarmGray }}>
        <Text style={{ fontSize: Typography.h3.fontSize, color: Colors.mediumGray }}>Cabinet not found</Text>
      </View>
    );
  }

  const renderStepper = (
    label: string,
    value: number,
    setValue: React.Dispatch<React.SetStateAction<number>>
  ) => (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: Spacing.md }}>
      <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500" as any, color: Colors.darkCharcoal }}>
        {label}
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
          onPress={() => setValue(Math.max(0, value - 1))}
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${label.toLowerCase()}`}
          style={{
            width: 28,
            height: 28,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 8,
          }}
        >
          <Text style={{ fontSize: 22, color: value === 0 ? Colors.mediumGray : Colors.primaryBlue, fontWeight: "600" as any }}>-</Text>
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
            {value}
          </Text>
        </View>
        <Pressable
          onPress={() => setValue(value + 1)}
          accessibilityRole="button"
          accessibilityLabel={`Increase ${label.toLowerCase()}`}
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
  );

  return (
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: Colors.backgroundWarmGray }}>
      <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0} style={{ flex: 1 }}>
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

            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: "700" as any, color: Colors.darkCharcoal }}>
                {name ? `${name}` : "Cabinet"}
              </Text>
            </View>

            <View style={{ flexDirection: "row" }}>
              <Pressable
                onPress={handleSave}
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
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: Spacing.md }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {testMode && (
            <View style={{ backgroundColor: Colors.neutralGray, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}>
              <Text style={{ fontSize: Typography.caption.fontSize, fontWeight: "700", color: Colors.error }}>
                PAGE: CabinetEditorScreen
              </Text>
            </View>
          )}

          <View style={{ padding: 0 }}>
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
                      Cabinet Details
                    </Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginTop: Spacing.xs }}>
                      Name and counts
                    </Text>
                  </View>
                  <Ionicons name="chevron-down" size={24} color={Colors.mediumGray} />
                </Pressable>
              )}

              {detailsExpanded && (
                <>
                  <View style={{ marginBottom: Spacing.md }}>
                    <FormInput
                      ref={nameRef}
                      label="Name/Location"
                      value={name}
                      onChangeText={setName}
                      placeholder="e.g., Kitchen Cabinets"
                      returnKeyType="done"
                      className="mb-0"
                    />
                  </View>

                  {renderStepper("Base Door Count", baseDoorCount, setBaseDoorCount)}
                  {renderStepper("Drawer Count", drawerCount, setDrawerCount)}
                  {renderStepper("Wall Door Count", wallDoorCount, setWallDoorCount)}

                  <View style={{ marginTop: Spacing.md }}>
                    <Toggle
                      label={`42" Wall Cabinet`}
                      value={includeWallCabinet42}
                      onValueChange={setIncludeWallCabinet42}
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
                      Cabinet notes and reminders
                    </Text>
                  </View>
                  <Ionicons name={notesExpanded ? "chevron-up" : "chevron-down"} size={24} color={Colors.mediumGray} />
                </Pressable>

                {notesExpanded && (
                  <TextInput
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Add any notes about these cabinets..."
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
                      },
                    ]}
                  />
                )}
              </Card>
            </View>

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
                  {(name ? name : "Cabinet") + "'s Photos"}
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
                                },
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

            <Card style={{ marginBottom: Spacing.md }}>
              <Text style={Typography.h2}>Cabinet Summary</Text>

              <View style={{ flexDirection: "row", gap: Spacing.sm }}>
                <View style={{ flex: 2.8, backgroundColor: Colors.backgroundWarmGray, borderRadius: 8, padding: Spacing.md }}>
                  <View style={{ marginBottom: Spacing.xs }}>
                    <Text style={{ fontSize: 13, color: "transparent" }}>-</Text>
                  </View>

                  {baseDoorCount > 0 && (
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                      <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>Base Doors</Text>
                      <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>{baseDoorCount}</Text>
                    </View>
                  )}

                  {drawerCount > 0 && (
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                      <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>Drawers</Text>
                      <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>{drawerCount}</Text>
                    </View>
                  )}

                  {wallDoorCount > 0 && (
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                      <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>Wall Doors</Text>
                      <Text style={{ fontSize: 13, color: Colors.darkCharcoal }}>{wallDoorCount}</Text>
                    </View>
                  )}

                  {baseDoorCount + drawerCount + wallDoorCount > 0 && (
                    <>
                      <View style={{ height: 1, backgroundColor: Colors.neutralGray, marginVertical: Spacing.xs }} />
                      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <Text style={{ fontSize: 13, fontWeight: "700" as any, color: Colors.darkCharcoal }}>Total Items:</Text>
                        <Text style={{ fontSize: 13, fontWeight: "700" as any, color: Colors.darkCharcoal }}>
                          {baseDoorCount + drawerCount + wallDoorCount}
                        </Text>
                      </View>
                    </>
                  )}
                </View>

                {(() => {
                  const cabinetCoverage = Math.max(1, safeNumber(cabinetPaintCoverageSqFtPerGallon, 350));
                  const baseDoorAreaSqFt =
                    ((cabinetDoorWidthIn * cabinetDoorHeightIn * Math.max(1, cabinetDoorSides)) + cabinetFrontAreaSqIn) / 144;
                  const wallDoorWidthIn = includeWallCabinet42 ? cabinetWallDoor42WidthIn : cabinetDoorWidthIn;
                  const wallDoorHeightIn = includeWallCabinet42 ? cabinetWallDoor42HeightIn : cabinetDoorHeightIn;
                  const wallDoorSides = includeWallCabinet42 ? cabinetWallDoor42Sides : cabinetDoorSides;
                  const wallDoorAreaSqFt =
                    ((wallDoorWidthIn * wallDoorHeightIn * Math.max(1, wallDoorSides)) + cabinetFrontAreaSqIn) / 144;
                  const drawerAreaSqFt =
                    (cabinetDrawerWidthIn * cabinetDrawerHeightIn * Math.max(1, cabinetDrawerSides)) / 144;
                  const baseDoorGallons = (baseDoorCount * baseDoorAreaSqFt) / cabinetCoverage;
                  const drawerGallons = (drawerCount * drawerAreaSqFt) / cabinetCoverage;
                  const wallDoorGallons = (wallDoorCount * wallDoorAreaSqFt) / cabinetCoverage;
                  const totalGallons = baseDoorGallons + drawerGallons + wallDoorGallons;
                  const totalMaterialsCost = calculatePaintCost(
                    totalGallons,
                    safeNumber(pricing.cabinetPaintPerGallon, 0),
                    pricing.cabinetPaintPer5Gallon
                  );
                  const firstLine = baseDoorCount > 0 ? "base" : drawerCount > 0 ? "drawer" : wallDoorCount > 0 ? "wall" : "none";
                  const baseDoorMat = firstLine === "base" ? totalMaterialsCost : 0;
                  const drawerMat = firstLine === "drawer" ? totalMaterialsCost : 0;
                  const wallDoorMat = firstLine === "wall" ? totalMaterialsCost : 0;

                  return (
                <View style={{ flex: 2.2, backgroundColor: "#E3F2FD", borderRadius: 8, padding: Spacing.md }}>
                  <Text style={{ fontSize: 13, color: Colors.mediumGray, textAlign: "right", marginBottom: Spacing.xs }}>
                    Labor
                  </Text>

                  {baseDoorCount > 0 && (
                    <Text style={{ fontSize: 13, color: Colors.darkCharcoal, textAlign: "right", marginBottom: Spacing.xs }}>
                      ${Math.round(baseDoorCount * pricing.cabinetDoorLabor)}
                    </Text>
                  )}

                  {drawerCount > 0 && (
                    <Text style={{ fontSize: 13, color: Colors.darkCharcoal, textAlign: "right", marginBottom: Spacing.xs }}>
                      ${Math.round(drawerCount * pricing.cabinetDrawerLabor)}
                    </Text>
                  )}

                  {wallDoorCount > 0 && (
                    <Text style={{ fontSize: 13, color: Colors.darkCharcoal, textAlign: "right", marginBottom: Spacing.xs }}>
                      ${Math.round(wallDoorCount * (includeWallCabinet42 ? pricing.wallCabinetLabor : pricing.cabinetDoorLabor))}
                    </Text>
                  )}

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
                  {baseDoorCount > 0 && baseDoorGallons > 0 && (
                    <Text style={{ fontSize: 13, color: Colors.darkCharcoal, textAlign: "right", marginBottom: Spacing.xs }}>
                      Base Doors: {baseDoorGallons.toFixed(2)} gal
                    </Text>
                  )}
                  {drawerCount > 0 && drawerGallons > 0 && (
                    <Text style={{ fontSize: 13, color: Colors.darkCharcoal, textAlign: "right", marginBottom: Spacing.xs }}>
                      Drawers: {drawerGallons.toFixed(2)} gal
                    </Text>
                  )}
                  {wallDoorCount > 0 && wallDoorGallons > 0 && (
                    <Text style={{ fontSize: 13, color: Colors.darkCharcoal, textAlign: "right" }}>
                      Wall Doors: {wallDoorGallons.toFixed(2)} gal
                    </Text>
                  )}
                </View>
                  );
                })()}
              </View>
            </Card>

            {testMode && (() => {
              const wallDoorRate = includeWallCabinet42
                ? pricing.wallCabinetLabor
                : pricing.cabinetDoorLabor;
              const baseDoorsLabor = baseDoorCount * pricing.cabinetDoorLabor;
              const drawersLabor = drawerCount * pricing.cabinetDrawerLabor;
              const wallDoorsLabor = wallDoorCount * wallDoorRate;
              const cabinetCoverage = Math.max(1, safeNumber(cabinetPaintCoverageSqFtPerGallon, 350));
              const baseDoorAreaSqFt =
                ((cabinetDoorWidthIn * cabinetDoorHeightIn * Math.max(1, cabinetDoorSides)) + cabinetFrontAreaSqIn) / 144;
              const wallDoorWidthIn = includeWallCabinet42 ? cabinetWallDoor42WidthIn : cabinetDoorWidthIn;
              const wallDoorHeightIn = includeWallCabinet42 ? cabinetWallDoor42HeightIn : cabinetDoorHeightIn;
              const wallDoorSides = includeWallCabinet42 ? cabinetWallDoor42Sides : cabinetDoorSides;
              const wallDoorAreaSqFt =
                ((wallDoorWidthIn * wallDoorHeightIn * Math.max(1, wallDoorSides)) + cabinetFrontAreaSqIn) / 144;
              const drawerAreaSqFt =
                (cabinetDrawerWidthIn * cabinetDrawerHeightIn * Math.max(1, cabinetDrawerSides)) / 144;
              const baseDoorGallons = (baseDoorCount * baseDoorAreaSqFt) / cabinetCoverage;
              const drawerGallons = (drawerCount * drawerAreaSqFt) / cabinetCoverage;
              const wallDoorGallons = (wallDoorCount * wallDoorAreaSqFt) / cabinetCoverage;
              const totalGallons = baseDoorGallons + drawerGallons + wallDoorGallons;
              const totalMaterialsCost = calculatePaintCost(
                totalGallons,
                safeNumber(pricing.cabinetPaintPerGallon, 0),
                pricing.cabinetPaintPer5Gallon
              );
              const firstLine = baseDoorCount > 0 ? "base" : drawerCount > 0 ? "drawer" : wallDoorCount > 0 ? "wall" : "none";
              const baseDoorMat = firstLine === "base" ? totalMaterialsCost : 0;
              const drawerMat = firstLine === "drawer" ? totalMaterialsCost : 0;
              const wallDoorMat = firstLine === "wall" ? totalMaterialsCost : 0;

              return (
                <Card style={{ marginBottom: Spacing.md }}>
                  <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.error, marginBottom: Spacing.md }}>
                    TEST MODE: Calculation Details
                  </Text>

                  <View style={{ backgroundColor: Colors.backgroundWarmGray, borderRadius: BorderRadius.default, padding: Spacing.md }}>
                    <View style={{ marginBottom: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.neutralGray }}>
                      <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                        Base Doors
                      </Text>
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                        Count: {baseDoorCount} | Rate: ${pricing.cabinetDoorLabor.toFixed(2)} each
                      </Text>
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                        Labor: {baseDoorCount} x ${pricing.cabinetDoorLabor.toFixed(2)} = ${baseDoorsLabor.toFixed(2)}
                      </Text>
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                        Area: {(baseDoorCount * baseDoorAreaSqFt).toFixed(2)} sq ft
                      </Text>
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                        Materials: {baseDoorGallons.toFixed(2)} gal → ${baseDoorMat.toFixed(2)}
                      </Text>
                    </View>

                    <View style={{ marginBottom: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.neutralGray }}>
                      <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                        Drawers
                      </Text>
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                        Count: {drawerCount} | Rate: ${pricing.cabinetDrawerLabor.toFixed(2)} each
                      </Text>
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                        Labor: {drawerCount} x ${pricing.cabinetDrawerLabor.toFixed(2)} = ${drawersLabor.toFixed(2)}
                      </Text>
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                        Area: {(drawerCount * drawerAreaSqFt).toFixed(2)} sq ft
                      </Text>
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                        Materials: {drawerGallons.toFixed(2)} gal → ${drawerMat.toFixed(2)}
                      </Text>
                    </View>

                    <View style={{ marginBottom: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.neutralGray }}>
                      <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                        Wall Doors
                      </Text>
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                        Count: {wallDoorCount} | 42" Wall Cabinet: {includeWallCabinet42 ? "On" : "Off"}
                      </Text>
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                        Rate: ${wallDoorRate.toFixed(2)} each
                      </Text>
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                        Labor: {wallDoorCount} x ${wallDoorRate.toFixed(2)} = ${wallDoorsLabor.toFixed(2)}
                      </Text>
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                        Area: {(wallDoorCount * wallDoorAreaSqFt).toFixed(2)} sq ft
                      </Text>
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                        Materials: {wallDoorGallons.toFixed(2)} gal → ${wallDoorMat.toFixed(2)}
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
                        Total Area: {(totalGallons * cabinetCoverage).toFixed(2)} sq ft
                      </Text>
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                        Gallons: {totalGallons.toFixed(2)} | Material Cost: ${totalMaterialsCost.toFixed(2)}
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

        <SavePromptModal
          visible={showSavePrompt}
          onSave={handleSaveAndLeave}
          onDiscard={handleDiscardAndLeave}
          onCancel={handleCancelExit}
          setDiscardButtonWidth={setDiscardWidth}
        />
      </KeyboardAvoidingView>

      <Modal
        visible={infoModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setInfoModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: Spacing.lg }}>
          <Pressable onPress={() => setInfoModalVisible(false)} style={{ flex: 1 }} />
          <View style={{ backgroundColor: Colors.white, borderRadius: 12, padding: Spacing.lg }}>
            <Text style={{ fontSize: Typography.h3.fontSize, fontWeight: "700" as any, color: Colors.darkCharcoal, marginBottom: Spacing.sm }}>
              {infoModalTitle}
            </Text>
            <Text style={{ fontSize: Typography.body.fontSize, color: Colors.mediumGray, marginBottom: Spacing.md }}>
              {infoModalBody}
            </Text>
            <Pressable
              onPress={() => setInfoModalVisible(false)}
              style={{ alignSelf: "flex-end", backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: 8 }}
            >
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.white }}>OK</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
