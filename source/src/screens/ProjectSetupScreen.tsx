import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { useProjectStore } from "../state/projectStore";
import { useAppSettings } from "../state/appSettings";
import { Card } from "../components/Card";
import { Toggle } from "../components/Toggle";
import StepProgressIndicator from "../components/StepProgressIndicator";
import { Colors, Typography, Spacing, BorderRadius, Shadows, TextInputStyles } from "../utils/designSystem";
import { t } from "../i18n";
import { calculateCurrentStep, getCompletedSteps, getStepValidationErrors, isStep1Complete } from "../utils/projectStepLogic";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";

type Props = NativeStackScreenProps<RootStackParamList, "ProjectSetup">;

function getOrdinal(num: number): string {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return num + "st";
  if (j === 2 && k !== 12) return num + "nd";
  if (j === 3 && k !== 13) return num + "rd";
  return num + "th";
}

export default function ProjectSetupScreen({ route, navigation }: Props) {
  const { projectId: paramProjectId, isNew } = route.params || {};
  const projectId = paramProjectId || "";

  const project = useProjectStore((s) =>
    projectId ? s.projects.find((p) => p.id === projectId) : null
  );
  const createProject = useProjectStore((s) => s.createProject);
  const updateProjectInfo = useProjectStore((s) => s.updateProjectInfo);
  const updateProjectFloors = useProjectStore((s) => s.updateProjectFloors);
  const updateGlobalPaintDefaults = useProjectStore((s) => s.updateGlobalPaintDefaults);
  const updateProjectCoverPhoto = useProjectStore((s) => s.updateProjectCoverPhoto);

  // Client Info State (for new projects)
  const [name, setName] = useState(project?.clientName || "");
  const [address, setAddress] = useState(project?.address || "");
  const [city, setCity] = useState(project?.city || "");
  const [country, setCountry] = useState(project?.country || "");
  const [phone, setPhone] = useState(project?.phone || "");
  const [email, setEmail] = useState(project?.email || "");
  const [coverPhotoUri, setCoverPhotoUri] = useState(project?.coverPhotoUri);

  // Floor Config State
  let effectiveFloorCount = 1;
  let effectiveFloorHeights: number[] = [8];

  if (project) {
    effectiveFloorCount = project.floorCount || 1;
    if (project.floorHeights && Array.isArray(project.floorHeights)) {
      effectiveFloorHeights = project.floorHeights;
    }
  }

  const [localFloorCount, setLocalFloorCount] = useState(effectiveFloorCount);
  const [localFloorHeights, setLocalFloorHeights] = useState<string[]>(
    effectiveFloorHeights.map((h) => h.toString())
  );

  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState({
    clientInfo: isNew ?? true,
    floors: true,
    paintDefaults: true,
  });

  // Step tracking
  const currentStep = useMemo(() => calculateCurrentStep(project), [project]);
  const completedSteps = useMemo(() => getCompletedSteps(project), [project]);
  const step1Errors = useMemo(() => getStepValidationErrors(project, 1), [project]);

  if (!project && !isNew) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.backgroundWarmGray }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: Typography.h2.fontSize, color: Colors.mediumGray }}>
            {t("common.noData")}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleCoverPhoto = async (useCamera: boolean) => {
    try {
      if (useCamera) {
        const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
        if (!cameraPermission.granted) {
          Alert.alert(
            t("common.error"),
            "Camera permission is needed to take photos."
          );
          return;
        }
      } else {
        const mediaPermission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!mediaPermission.granted) {
          Alert.alert(
            t("common.error"),
            "Photo library permission is needed to select photos."
          );
          return;
        }
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });

      if (!result.canceled && result.assets[0]) {
        setCoverPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert(t("common.error"), "Failed to select cover photo.");
    }
  };

  const handleRemoveCoverPhoto = () => {
    Alert.alert(
      "Remove Cover Photo",
      "Are you sure you want to remove the cover photo?",
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: () => setCoverPhotoUri(undefined),
        },
      ]
    );
  };

  const handleFloorCountChange = (newCount: number) => {
    if (newCount < 1 || newCount > 5) return;

    setLocalFloorCount(newCount);

    let newHeights = [...localFloorHeights];
    if (newCount > newHeights.length) {
      for (let i = newHeights.length; i < newCount; i++) {
        newHeights.push("8");
      }
    } else {
      newHeights = newHeights.slice(0, newCount);
    }
    setLocalFloorHeights(newHeights);

    const heightsAsNumbers = newHeights.map((h) => parseFloat(h) || 8);
    if (project) {
      updateProjectFloors(project.id, newCount, heightsAsNumbers);
    }
  };

  const handleFloorHeightChange = (index: number, value: string) => {
    const newHeights = [...localFloorHeights];
    newHeights[index] = value;
    setLocalFloorHeights(newHeights);

    if (project) {
      const heightsAsNumbers = newHeights.map((h) => parseFloat(h) || 8);
      updateProjectFloors(project.id, localFloorCount, heightsAsNumbers);
    }
  };

  const handleSaveAndContinue = () => {
    // Validation
    if (!name.trim()) {
      Alert.alert(t("common.error"), t("screens.projectSetup.validation.clientNameRequired"));
      return;
    }

    if (!address.trim()) {
      Alert.alert(t("common.error"), t("screens.projectSetup.validation.addressRequired"));
      return;
    }

    if (localFloorCount === 0) {
      Alert.alert(t("common.error"), t("screens.projectSetup.validation.floorHeightRequired"));
      return;
    }

    // For new projects, create the project
    if (isNew) {
      const projectId = createProject(
        {
          name: name.trim(),
          address: address.trim(),
          city: city.trim(),
          country: country.trim(),
          phone: phone.trim(),
          email: email.trim(),
        },
        {
          floorCount: localFloorCount,
          floorHeights: localFloorHeights.map((h) => parseFloat(h) || 8),
        }
      );

      if (coverPhotoUri) {
        updateProjectCoverPhoto(projectId, coverPhotoUri);
      }

      navigation.replace("ProjectDetail", { projectId });
    } else {
      // For existing projects, update info and navigate
      if (project) {
        updateProjectInfo(project.id, {
          clientName: name.trim(),
          address: address.trim(),
          city: city.trim(),
          country: country.trim(),
          phone: phone.trim(),
          email: email.trim(),
        });

        if (coverPhotoUri && coverPhotoUri !== project.coverPhotoUri) {
          updateProjectCoverPhoto(project.id, coverPhotoUri);
        }

        navigation.replace("ProjectDetail", { projectId: project.id });
      }
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.backgroundWarmGray }}>
      {/* Step Progress Indicator */}
      <StepProgressIndicator
        currentStep={1}
        completedSteps={completedSteps}
        disabledSteps={[2, 3]}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ padding: Spacing.md, paddingBottom: Spacing.xl }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* CLIENT INFORMATION SECTION */}
          <Card style={{ marginBottom: Spacing.md }}>
            <Pressable
              onPress={() => toggleSection("clientInfo")}
              style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
            >
              <View>
                <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.darkCharcoal }}>
                  {t("screens.projectSetup.clientInfo.title")}
                </Text>
                <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginTop: Spacing.xs }}>
                  {t("screens.projectSetup.clientInfo.clientNamePlaceholder")}
                </Text>
              </View>
              <Ionicons
                name={expandedSections.clientInfo ? "chevron-up" : "chevron-down"}
                size={24}
                color={Colors.primaryBlue}
              />
            </Pressable>

            {expandedSections.clientInfo && (
              <>
                <View style={{ height: 1, backgroundColor: Colors.neutralGray, marginVertical: Spacing.md }} />

                {/* Client Name */}
                <View style={{ marginBottom: Spacing.md }}>
                  <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                    {t("screens.projectSetup.clientInfo.clientName")} *
                  </Text>
                  <View style={TextInputStyles.container}>
                    <TextInput
                      value={name}
                      onChangeText={setName}
                      placeholder={t("screens.projectSetup.clientInfo.clientNamePlaceholder")}
                      placeholderTextColor={Colors.mediumGray}
                      returnKeyType="next"
                      style={TextInputStyles.base}
                      accessibilityLabel="Client name input"
                    />
                  </View>
                </View>

                {/* Address */}
                <View style={{ marginBottom: Spacing.md }}>
                  <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                    {t("screens.projectSetup.clientInfo.address")} *
                  </Text>
                  <View style={TextInputStyles.container}>
                    <TextInput
                      value={address}
                      onChangeText={setAddress}
                      placeholder={t("screens.projectSetup.clientInfo.addressPlaceholder")}
                      placeholderTextColor={Colors.mediumGray}
                      returnKeyType="next"
                      style={TextInputStyles.base}
                      accessibilityLabel="Address input"
                    />
                  </View>
                </View>

                {/* City */}
                <View style={{ marginBottom: Spacing.md }}>
                  <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                    {t("screens.projectSetup.clientInfo.city")}
                  </Text>
                  <View style={TextInputStyles.container}>
                    <TextInput
                      value={city}
                      onChangeText={setCity}
                      placeholder={t("screens.projectSetup.clientInfo.cityPlaceholder")}
                      placeholderTextColor={Colors.mediumGray}
                      returnKeyType="next"
                      style={TextInputStyles.base}
                      accessibilityLabel="City input"
                    />
                  </View>
                </View>

                {/* Country */}
                <View style={{ marginBottom: Spacing.md }}>
                  <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                    {t("screens.projectSetup.clientInfo.country")}
                  </Text>
                  <View style={TextInputStyles.container}>
                    <TextInput
                      value={country}
                      onChangeText={setCountry}
                      placeholder={t("screens.projectSetup.clientInfo.countryPlaceholder")}
                      placeholderTextColor={Colors.mediumGray}
                      returnKeyType="next"
                      style={TextInputStyles.base}
                      accessibilityLabel="Country input"
                    />
                  </View>
                </View>

                {/* Phone */}
                <View style={{ marginBottom: Spacing.md }}>
                  <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                    {t("screens.projectSetup.clientInfo.phone")}
                  </Text>
                  <View style={TextInputStyles.container}>
                    <TextInput
                      value={phone}
                      onChangeText={setPhone}
                      placeholder={t("screens.projectSetup.clientInfo.phonePlaceholder")}
                      placeholderTextColor={Colors.mediumGray}
                      keyboardType="phone-pad"
                      returnKeyType="next"
                      style={TextInputStyles.base}
                      accessibilityLabel="Phone number input"
                    />
                  </View>
                </View>

                {/* Email */}
                <View style={{ marginBottom: Spacing.md }}>
                  <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                    {t("screens.projectSetup.clientInfo.email")}
                  </Text>
                  <View style={TextInputStyles.container}>
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder={t("screens.projectSetup.clientInfo.emailPlaceholder")}
                      placeholderTextColor={Colors.mediumGray}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      returnKeyType="done"
                      onSubmitEditing={() => Keyboard.dismiss()}
                      style={TextInputStyles.base}
                      accessibilityLabel="Email input"
                    />
                  </View>
                </View>

                {/* Project Cover Photo */}
                <View style={{ marginBottom: 0 }}>
                  <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                    {t("screens.projectSetup.clientInfo.photo")}
                  </Text>
                  <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.md }}>
                    This photo appears as the project thumbnail
                  </Text>

                  {coverPhotoUri ? (
                    <View>
                      <Image
                        source={{ uri: coverPhotoUri }}
                        style={{
                          width: "100%",
                          height: 200,
                          borderRadius: BorderRadius.default,
                          backgroundColor: Colors.neutralGray,
                          marginBottom: Spacing.md,
                        }}
                        resizeMode="cover"
                      />
                      <View style={{ flexDirection: "row", gap: Spacing.sm }}>
                        <Pressable
                          onPress={() => handleCoverPhoto(true)}
                          style={{
                            flex: 1,
                            backgroundColor: Colors.primaryBlue,
                            borderRadius: BorderRadius.default,
                            paddingVertical: Spacing.sm,
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Ionicons name="camera-outline" size={18} color={Colors.white} />
                          <Text style={{ fontSize: Typography.caption.fontSize, fontWeight: "600" as any, color: Colors.white, marginLeft: Spacing.xs }}>
                            {t("common.edit")}
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={handleRemoveCoverPhoto}
                          style={{
                            backgroundColor: Colors.error + "10",
                            borderRadius: BorderRadius.default,
                            paddingVertical: Spacing.sm,
                            paddingHorizontal: Spacing.md,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Ionicons name="trash-outline" size={18} color={Colors.error} />
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <View style={{ flexDirection: "row", gap: Spacing.sm }}>
                      <Pressable
                        onPress={() => handleCoverPhoto(true)}
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
                          {t("screens.projectSetup.clientInfo.takePhoto")}
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleCoverPhoto(false)}
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
                          {t("screens.projectSetup.clientInfo.uploadPhoto")}
                        </Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              </>
            )}
          </Card>

          {/* FLOORS & HEIGHTS SECTION */}
          <Card style={{ marginBottom: Spacing.md }}>
            <Pressable
              onPress={() => toggleSection("floors")}
              style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
            >
              <View>
                <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.darkCharcoal }}>
                  {t("screens.projectSetup.floors.title")}
                </Text>
                <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginTop: Spacing.xs }}>
                  {localFloorCount} {localFloorCount === 1 ? "floor" : "floors"}
                </Text>
              </View>
              <Ionicons
                name={expandedSections.floors ? "chevron-up" : "chevron-down"}
                size={24}
                color={Colors.primaryBlue}
              />
            </Pressable>

            {expandedSections.floors && (
              <>
                <View style={{ height: 1, backgroundColor: Colors.neutralGray, marginVertical: Spacing.md }} />

                {/* Number of Floors */}
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: Spacing.md }}>
                  <Text style={{ fontSize: Typography.body.fontSize, color: Colors.darkCharcoal, marginRight: Spacing.sm }}>
                    {t("screens.projectSetup.floors.numberOfFloors")}:
                  </Text>
                  <Pressable
                    onPress={() => handleFloorCountChange(localFloorCount - 1)}
                    disabled={localFloorCount <= 1}
                    style={{
                      backgroundColor: localFloorCount <= 1 ? Colors.neutralGray : Colors.white,
                      borderRadius: 8,
                      padding: Spacing.xs,
                      width: 32,
                      height: 32,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1,
                      borderColor: Colors.neutralGray,
                      marginRight: Spacing.xs,
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Decrease floor count"
                  >
                    <Ionicons
                      name="remove"
                      size={18}
                      color={localFloorCount <= 1 ? Colors.mediumGray : Colors.darkCharcoal}
                    />
                  </Pressable>
                  <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "700" as any, color: Colors.darkCharcoal, minWidth: 24, textAlign: "center" }}>
                    {localFloorCount}
                  </Text>
                  <Pressable
                    onPress={() => handleFloorCountChange(localFloorCount + 1)}
                    disabled={localFloorCount >= 5}
                    style={{
                      backgroundColor: localFloorCount >= 5 ? Colors.neutralGray : Colors.white,
                      borderRadius: 8,
                      padding: Spacing.xs,
                      width: 32,
                      height: 32,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1,
                      borderColor: Colors.neutralGray,
                      marginLeft: Spacing.xs,
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Increase floor count"
                  >
                    <Ionicons
                      name="add"
                      size={18}
                      color={localFloorCount >= 5 ? Colors.mediumGray : Colors.darkCharcoal}
                    />
                  </Pressable>
                </View>

                {/* Floor Heights */}
                {localFloorHeights.map((height, index) => (
                  <View
                    key={index}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: index < localFloorHeights.length - 1 ? Spacing.sm : 0,
                    }}
                  >
                    <Text style={{ fontSize: Typography.body.fontSize, color: Colors.darkCharcoal, width: 120 }}>
                      {getOrdinal(index + 1)} {t("screens.projectSetup.floors.floorHeight")}:
                    </Text>
                    <View style={{ ...TextInputStyles.container, flex: 1, width: 60, marginRight: Spacing.xs, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs }}>
                      <TextInput
                        value={height}
                        onChangeText={(value) => handleFloorHeightChange(index, value)}
                        keyboardType="decimal-pad"
                        placeholder="8"
                        placeholderTextColor={Colors.mediumGray}
                        returnKeyType="done"
                        style={TextInputStyles.base}
                        accessibilityLabel={`${getOrdinal(index + 1)} floor height input`}
                      />
                    </View>
                    <Text style={{ fontSize: Typography.body.fontSize, color: Colors.mediumGray }}>ft</Text>
                  </View>
                ))}

                <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginTop: Spacing.sm }}>
                  {t("screens.projectSetup.floors.floorHeightHelp")}
                </Text>
              </>
            )}
          </Card>

          {/* PAINT DEFAULTS SECTION */}
          <Card style={{ marginBottom: Spacing.md }}>
            <Pressable
              onPress={() => toggleSection("paintDefaults")}
              style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
            >
              <View>
                <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.darkCharcoal }}>
                  {t("screens.projectSetup.projectDefaults.title")}
                </Text>
                <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginTop: Spacing.xs }}>
                  {t("screens.projectSetup.projectDefaults.subtitle")}
                </Text>
              </View>
              <Ionicons
                name={expandedSections.paintDefaults ? "chevron-up" : "chevron-down"}
                size={24}
                color={Colors.primaryBlue}
              />
            </Pressable>

            {expandedSections.paintDefaults && project && (
              <>
                <View style={{ height: 1, backgroundColor: Colors.neutralGray, marginVertical: Spacing.md }} />

                <Toggle
                  label={t("screens.projectSetup.projectDefaults.paintWalls")}
                  value={project.globalPaintDefaults?.paintWalls ?? true}
                  onValueChange={(value) =>
                    updateGlobalPaintDefaults(project.id, { paintWalls: value })
                  }
                />
                <Toggle
                  label={t("screens.projectSetup.projectDefaults.paintCeilings")}
                  value={project.globalPaintDefaults?.paintCeilings ?? true}
                  onValueChange={(value) =>
                    updateGlobalPaintDefaults(project.id, { paintCeilings: value })
                  }
                />
                <Toggle
                  label={t("screens.projectSetup.projectDefaults.paintTrim")}
                  value={project.globalPaintDefaults?.paintTrim ?? true}
                  onValueChange={(value) =>
                    updateGlobalPaintDefaults(project.id, { paintTrim: value })
                  }
                  description="Includes door frames and window frames"
                />
                <Toggle
                  label={t("screens.projectSetup.projectDefaults.paintBaseboards")}
                  value={project.globalPaintDefaults?.paintBaseboards ?? true}
                  onValueChange={(value) =>
                    updateGlobalPaintDefaults(project.id, { paintBaseboards: value })
                  }
                />
                <Toggle
                  label={t("screens.projectSetup.projectDefaults.paintDoors")}
                  value={project.globalPaintDefaults?.paintDoors ?? true}
                  onValueChange={(value) =>
                    updateGlobalPaintDefaults(project.id, { paintDoors: value })
                  }
                />
                <Toggle
                  label={t("screens.projectSetup.projectDefaults.paintDoorJambs")}
                  value={project.globalPaintDefaults?.paintDoorJambs ?? true}
                  onValueChange={(value) =>
                    updateGlobalPaintDefaults(project.id, { paintDoorJambs: value })
                  }
                />
                <Toggle
                  label={t("screens.projectSetup.projectDefaults.paintCrownMoulding")}
                  value={project.globalPaintDefaults?.paintCrownMoulding ?? true}
                  onValueChange={(value) =>
                    updateGlobalPaintDefaults(project.id, { paintCrownMoulding: value })
                  }
                />
                <Toggle
                  label={t("screens.projectSetup.projectDefaults.paintClosetInteriors")}
                  value={project.globalPaintDefaults?.paintClosetInteriors ?? true}
                  onValueChange={(value) =>
                    updateGlobalPaintDefaults(project.id, { paintClosetInteriors: value })
                  }
                />

                {/* Default Coats Section */}
                <View style={{ height: 1, backgroundColor: Colors.neutralGray, marginVertical: Spacing.md }} />

                <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                  {t("screens.projectSetup.projectDefaults.defaultCoats")}
                </Text>
                <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.sm }}>
                  Toggle ON for 2 coats, OFF for 1 coat
                </Text>

                <Toggle
                  label={t("screens.projectSetup.projectDefaults.coatsForWalls")}
                  value={(project.globalPaintDefaults?.defaultWallCoats ?? 2) === 2}
                  onValueChange={(value) =>
                    updateGlobalPaintDefaults(project.id, {
                      defaultWallCoats: value ? 2 : 1,
                    })
                  }
                  description={`Currently: ${project.globalPaintDefaults?.defaultWallCoats ?? 2} coat(s)`}
                />

                <Toggle
                  label={t("screens.projectSetup.projectDefaults.coatsForCeilings")}
                  value={(project.globalPaintDefaults?.defaultCeilingCoats ?? 2) === 2}
                  onValueChange={(value) =>
                    updateGlobalPaintDefaults(project.id, {
                      defaultCeilingCoats: value ? 2 : 1,
                    })
                  }
                  description={`Currently: ${project.globalPaintDefaults?.defaultCeilingCoats ?? 2} coat(s)`}
                />

                <Toggle
                  label={t("screens.projectSetup.projectDefaults.coatsForTrim")}
                  value={(project.globalPaintDefaults?.defaultTrimCoats ?? 2) === 2}
                  onValueChange={(value) =>
                    updateGlobalPaintDefaults(project.id, {
                      defaultTrimCoats: value ? 2 : 1,
                    })
                  }
                  description={`Currently: ${project.globalPaintDefaults?.defaultTrimCoats ?? 2} coat(s)`}
                />

                <Toggle
                  label={t("screens.projectSetup.projectDefaults.coatsForDoors")}
                  value={(project.globalPaintDefaults?.defaultDoorCoats ?? 2) === 2}
                  onValueChange={(value) =>
                    updateGlobalPaintDefaults(project.id, {
                      defaultDoorCoats: value ? 2 : 1,
                    })
                  }
                  description={`Currently: ${project.globalPaintDefaults?.defaultDoorCoats ?? 2} coat(s)`}
                />
              </>
            )}
          </Card>

          {/* Save & Continue Button */}
          <Pressable
            onPress={handleSaveAndContinue}
            style={{
              backgroundColor: Colors.primaryBlue,
              borderRadius: BorderRadius.default,
              paddingVertical: Spacing.md,
              paddingHorizontal: Spacing.lg,
              marginBottom: Spacing.lg,
              alignItems: "center",
              ...Shadows.card,
            }}
            accessibilityRole="button"
            accessibilityLabel={t("screens.projectSetup.buttons.saveAndContinue")}
          >
            <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.white }}>
              {t("screens.projectSetup.buttons.saveAndContinue")}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
