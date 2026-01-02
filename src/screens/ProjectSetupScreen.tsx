import React, { useState, useMemo, useRef, useId } from "react";
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
  InputAccessoryView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { useProjectStore } from "../state/projectStore";
import { useAppSettings } from "../state/appSettings";
import { Card } from "../components/Card";
import { Toggle } from "../components/Toggle";
import { AddressAutocomplete } from "../components/AddressAutocomplete";
import StepProgressIndicator from "../components/StepProgressIndicator";
import { Colors, Typography, Spacing, BorderRadius, Shadows, TextInputStyles } from "../utils/designSystem";
// import { t } from "../i18n";
import { calculateCurrentStep, getCompletedSteps, getStepValidationErrors, isStep1Complete } from "../utils/projectStepLogic";

// Temporary hardcoded strings while debugging
const t = (key: string): string => {
  const strings: Record<string, string> = {
    "common.noData": "No data available",
    "common.error": "Error",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "screens.projectSetup.clientInfo.title": "Client Information",
    "screens.projectSetup.clientInfo.clientNamePlaceholder": "Enter client name",
    "screens.projectSetup.clientInfo.clientName": "Client Name",
    "screens.projectSetup.clientInfo.address": "Address",
    "screens.projectSetup.clientInfo.addressPlaceholder": "Enter address",
    "screens.projectSetup.clientInfo.city": "City",
    "screens.projectSetup.clientInfo.cityPlaceholder": "Enter city",
    "screens.projectSetup.clientInfo.country": "Country",
    "screens.projectSetup.clientInfo.countryPlaceholder": "Enter country",
    "screens.projectSetup.clientInfo.phone": "Phone",
    "screens.projectSetup.clientInfo.phonePlaceholder": "Enter phone",
    "screens.projectSetup.clientInfo.email": "Email",
    "screens.projectSetup.clientInfo.emailPlaceholder": "Enter email",
    "screens.projectSetup.clientInfo.photo": "Cover Photo",
    "screens.projectSetup.clientInfo.takePhoto": "Take Photo",
    "screens.projectSetup.clientInfo.uploadPhoto": "Upload",
    "screens.projectSetup.floors.title": "Project Floors",
    "screens.projectSetup.floors.numberOfFloors": "Number of Floors",
    "screens.projectSetup.floors.floorHeight": "Floor Height",
    "screens.projectSetup.floors.floorHeightHelp": "Standard ceiling height is 8ft",
    "screens.projectSetup.projectDefaults.title": "Project Defaults",
    "screens.projectSetup.projectDefaults.subtitle": "What will you be painting?",
    "screens.projectSetup.projectDefaults.paintWalls": "Paint Walls",
    "screens.projectSetup.projectDefaults.paintCeilings": "Paint Ceilings",
    "screens.projectSetup.projectDefaults.paintTrim": "Paint Trim",
    "screens.projectSetup.projectDefaults.paintBaseboards": "Paint Baseboards",
    "screens.projectSetup.projectDefaults.paintDoors": "Paint Doors",
    "screens.projectSetup.projectDefaults.paintDoorJambs": "Paint Door Jambs",
    "screens.projectSetup.projectDefaults.paintCrownMoulding": "Paint Crown Moulding",
    "screens.projectSetup.projectDefaults.paintClosetInteriors": "Paint Closet Interiors",
    "screens.projectSetup.projectDefaults.defaultCoats": "Default Number of Coats",
    "screens.projectSetup.projectDefaults.coatsForWalls": "Coats for Walls",
    "screens.projectSetup.projectDefaults.coatsForCeilings": "Coats for Ceilings",
    "screens.projectSetup.projectDefaults.coatsForTrim": "Coats for Trim",
    "screens.projectSetup.projectDefaults.coatsForDoors": "Coats for Doors",
    "screens.projectSetup.validation.clientNameRequired": "Client name is required",
    "screens.projectSetup.validation.addressRequired": "Address is required",
    "screens.projectSetup.validation.floorHeightRequired": "At least one floor is required",
    "screens.projectSetup.buttons.saveAndContinue": "Save & Continue",
  };
  return strings[key] || key;
};
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
    projectId ? s.projects.find((p) => p.id === projectId) ?? null : null
  );
  const createProject = useProjectStore((s) => s.createProject);
  const updateClientInfo = useProjectStore((s) => s.updateClientInfo);
  const updateProjectFloors = useProjectStore((s) => s.updateProjectFloors);
  const updateGlobalPaintDefaults = useProjectStore((s) => s.updateGlobalPaintDefaults);
  const updateProjectCoverPhoto = useProjectStore((s) => s.updateProjectCoverPhoto);
  const updateFurnitureMoving = useProjectStore((s) => s.updateFurnitureMoving);
  const { unitSystem } = useAppSettings();

  // Client Info State (for new projects)
  const [name, setName] = useState(project?.clientInfo?.name || "");
  const [address, setAddress] = useState(project?.clientInfo?.address || "");
  const [city, setCity] = useState(project?.clientInfo?.city || "");
  const [country, setCountry] = useState(project?.clientInfo?.country || "");
  const [phone, setPhone] = useState(project?.clientInfo?.phone || "");
  const [email, setEmail] = useState(project?.clientInfo?.email || "");
  const [coverPhotoUri, setCoverPhotoUri] = useState(project?.coverPhotoUri);

  // Refs for form field navigation
  const scrollViewRef = useRef<ScrollView>(null);
  const nameRef = useRef<TextInput>(null);
  const addressRef = useRef<TextInput>(null);
  const cityRef = useRef<TextInput>(null);
  const countryRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);

  // KB-004: Unique IDs for InputAccessoryViews
  const nameAccessoryID = useId();
  const addressAccessoryID = useId();
  const cityAccessoryID = useId();
  const countryAccessoryID = useId();
  const phoneAccessoryID = useId();
  const emailAccessoryID = useId();

  // Refs for field containers (to scroll field into view)
  const nameContainerRef = useRef<View | null>(null);
  const addressContainerRef = useRef<View | null>(null);
  const cityContainerRef = useRef<View | null>(null);
  const countryContainerRef = useRef<View | null>(null);
  const phoneContainerRef = useRef<View | null>(null);
  const emailContainerRef = useRef<View | null>(null);

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

  // Paint Defaults State (for new projects)
  const [localPaintDefaults, setLocalPaintDefaults] = useState({
    paintWalls: project?.globalPaintDefaults?.paintWalls ?? true,
    paintCeilings: project?.globalPaintDefaults?.paintCeilings ?? true,
    paintTrim: project?.globalPaintDefaults?.paintTrim ?? true,
    paintBaseboards: project?.globalPaintDefaults?.paintBaseboards ?? true,
    paintDoors: project?.globalPaintDefaults?.paintDoors ?? true,
    paintDoorJambs: project?.globalPaintDefaults?.paintDoorJambs ?? true,
    paintCrownMoulding: project?.globalPaintDefaults?.paintCrownMoulding ?? true,
    paintClosetInteriors: project?.globalPaintDefaults?.paintClosetInteriors ?? true,
    defaultWallCoats: project?.globalPaintDefaults?.defaultWallCoats ?? 2,
    defaultCeilingCoats: project?.globalPaintDefaults?.defaultCeilingCoats ?? 2,
    defaultTrimCoats: project?.globalPaintDefaults?.defaultTrimCoats ?? 2,
    defaultDoorCoats: project?.globalPaintDefaults?.defaultDoorCoats ?? 2,
  });

  // Furniture Moving State
  const [includeFurnitureMoving, setIncludeFurnitureMoving] = useState(project?.includeFurnitureMoving ?? false);

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

  // Handler to scroll field into view when focused
  const scrollFieldIntoView = (fieldContainerRef: React.RefObject<View | null>) => {
    if (!scrollViewRef.current || !fieldContainerRef.current) return;

    setTimeout(() => {
      fieldContainerRef.current?.measureLayout(
        scrollViewRef.current as any,
        (x: number, y: number) => {
          scrollViewRef.current?.scrollTo({ y: y + 100, animated: true });
        },
        () => {}
      );
    }, 100);
  };

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
      const newProjectId = createProject(
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

      // Apply paint defaults from local state
      updateGlobalPaintDefaults(newProjectId, localPaintDefaults);

      if (coverPhotoUri) {
        updateProjectCoverPhoto(newProjectId, coverPhotoUri);
      }

      // Apply furniture moving setting
      updateFurnitureMoving(newProjectId, includeFurnitureMoving);

      navigation.replace("ProjectDetail", { projectId: newProjectId });
    } else {
      // For existing projects, update info and navigate
      if (project) {
        updateClientInfo(project.id, {
          name: name.trim(),
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
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: Colors.backgroundWarmGray }}>
      {/* Step Progress Indicator */}
      <View>
        <StepProgressIndicator
          currentStep={1}
          completedSteps={completedSteps}
          disabledSteps={[2, 3]}
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{ padding: Spacing.md, paddingBottom: 200 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets={true}
        >
          {/* CLIENT INFORMATION SECTION */}
          <Card style={{ marginBottom: Spacing.md }}>
            <Pressable
              onPress={() => toggleSection("clientInfo")}
              style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
            >
              <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.darkCharcoal }}>
                {t("screens.projectSetup.clientInfo.title")}
              </Text>
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
                <View ref={nameContainerRef} style={{ marginBottom: Spacing.md }}>
                  <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                    {t("screens.projectSetup.clientInfo.clientName")} *
                  </Text>
                  <View style={TextInputStyles.container}>
                    <TextInput
                      ref={nameRef}
                      value={name}
                      onChangeText={setName}
                      placeholder={t("screens.projectSetup.clientInfo.clientNamePlaceholder")}
                      placeholderTextColor={Colors.mediumGray}
                      returnKeyType="next"
                      onSubmitEditing={() => addressRef.current?.focus()}
                      onFocus={() => scrollFieldIntoView(nameContainerRef)}
                      blurOnSubmit={false}
                      style={TextInputStyles.base}
                      inputAccessoryViewID={Platform.OS === "ios" ? `projectClientName-${nameAccessoryID}` : undefined}
                      cursorColor={Colors.primaryBlue}
                      selectionColor={Colors.primaryBlue}
                      accessibilityLabel="Client name input"
                    />
                  </View>
                </View>

                {/* Address with Autocomplete */}
                <View ref={addressContainerRef} style={{ marginBottom: Spacing.md }}>
                  <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                    {t("screens.projectSetup.clientInfo.address")} *
                  </Text>
                  <AddressAutocomplete
                    ref={addressRef}
                    value={address}
                    onChangeText={setAddress}
                    onSelectAddress={(addr, selectedCity, selectedCountry) => {
                      setAddress(addr);
                      if (selectedCity) setCity(selectedCity);
                      if (selectedCountry) setCountry(selectedCountry);
                    }}
                    placeholder={t("screens.projectSetup.clientInfo.addressPlaceholder")}
                    returnKeyType="next"
                    onSubmitEditing={() => cityRef.current?.focus()}
                    onFocus={() => scrollFieldIntoView(addressContainerRef)}
                    inputAccessoryViewID={Platform.OS === "ios" ? `projectAddress-${addressAccessoryID}` : undefined}
                  />
                </View>

                {/* City */}
                <View ref={cityContainerRef} style={{ marginBottom: Spacing.md }}>
                  <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                    {t("screens.projectSetup.clientInfo.city")}
                  </Text>
                  <View style={TextInputStyles.container}>
                    <TextInput
                      ref={cityRef}
                      value={city}
                      onChangeText={setCity}
                      placeholder={t("screens.projectSetup.clientInfo.cityPlaceholder")}
                      placeholderTextColor={Colors.mediumGray}
                      returnKeyType="next"
                      onSubmitEditing={() => countryRef.current?.focus()}
                      onFocus={() => scrollFieldIntoView(cityContainerRef)}
                      blurOnSubmit={false}
                      style={TextInputStyles.base}
                      inputAccessoryViewID={Platform.OS === "ios" ? `projectCity-${cityAccessoryID}` : undefined}
                      cursorColor={Colors.primaryBlue}
                      selectionColor={Colors.primaryBlue}
                      accessibilityLabel="City input"
                    />
                  </View>
                </View>

                {/* Country */}
                <View ref={countryContainerRef} style={{ marginBottom: Spacing.md }}>
                  <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                    {t("screens.projectSetup.clientInfo.country")}
                  </Text>
                  <View style={TextInputStyles.container}>
                    <TextInput
                      ref={countryRef}
                      value={country}
                      onChangeText={setCountry}
                      placeholder={t("screens.projectSetup.clientInfo.countryPlaceholder")}
                      placeholderTextColor={Colors.mediumGray}
                      returnKeyType="next"
                      onSubmitEditing={() => phoneRef.current?.focus()}
                      onFocus={() => scrollFieldIntoView(countryContainerRef)}
                      blurOnSubmit={false}
                      style={TextInputStyles.base}
                      inputAccessoryViewID={Platform.OS === "ios" ? `projectCountry-${countryAccessoryID}` : undefined}
                      cursorColor={Colors.primaryBlue}
                      selectionColor={Colors.primaryBlue}
                      accessibilityLabel="Country input"
                    />
                  </View>
                </View>

                {/* Phone */}
                <View ref={phoneContainerRef} style={{ marginBottom: Spacing.md }}>
                  <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                    {t("screens.projectSetup.clientInfo.phone")}
                  </Text>
                  <View style={TextInputStyles.container}>
                    <TextInput
                      ref={phoneRef}
                      value={phone}
                      onChangeText={setPhone}
                      placeholder={t("screens.projectSetup.clientInfo.phonePlaceholder")}
                      placeholderTextColor={Colors.mediumGray}
                      keyboardType="phone-pad"
                      returnKeyType="next"
                      onSubmitEditing={() => emailRef.current?.focus()}
                      onFocus={() => scrollFieldIntoView(phoneContainerRef)}
                      blurOnSubmit={false}
                      style={TextInputStyles.base}
                      inputAccessoryViewID={Platform.OS === "ios" ? `projectPhone-${phoneAccessoryID}` : undefined}
                      cursorColor={Colors.primaryBlue}
                      selectionColor={Colors.primaryBlue}
                      accessibilityLabel="Phone number input"
                    />
                  </View>
                </View>

                {/* Email */}
                <View ref={emailContainerRef} style={{ marginBottom: Spacing.md }}>
                  <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                    {t("screens.projectSetup.clientInfo.email")}
                  </Text>
                  <View style={TextInputStyles.container}>
                    <TextInput
                      ref={emailRef}
                      value={email}
                      onChangeText={setEmail}
                      placeholder={t("screens.projectSetup.clientInfo.emailPlaceholder")}
                      placeholderTextColor={Colors.mediumGray}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      returnKeyType="done"
                      onSubmitEditing={() => Keyboard.dismiss()}
                      onFocus={() => scrollFieldIntoView(emailContainerRef)}
                      style={TextInputStyles.base}
                      inputAccessoryViewID={Platform.OS === "ios" ? `projectEmail-${emailAccessoryID}` : undefined}
                      cursorColor={Colors.primaryBlue}
                      selectionColor={Colors.primaryBlue}
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
                        keyboardType="numeric"
                        placeholder="8"
                        placeholderTextColor={Colors.mediumGray}
                        returnKeyType="done"
                          style={TextInputStyles.base}
                        cursorColor={Colors.primaryBlue}
                        selectionColor={Colors.primaryBlue}
                        accessibilityLabel={`${getOrdinal(index + 1)} floor height input`}
                      />
                    </View>
                    <Text style={{ fontSize: Typography.body.fontSize, color: Colors.mediumGray }}>{unitSystem === 'metric' ? 'm' : 'ft'}</Text>
                  </View>
                ))}
              </>
            )}
          </Card>

          {/* PAINT DEFAULTS SECTION - Shows for both new and existing projects */}
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

            {expandedSections.paintDefaults && (
              <>
                <View style={{ height: 1, backgroundColor: Colors.neutralGray, marginVertical: Spacing.md }} />

                <Toggle
                  label={t("screens.projectSetup.projectDefaults.paintWalls")}
                  value={localPaintDefaults.paintWalls}
                  onValueChange={(value) => {
                    setLocalPaintDefaults(prev => ({ ...prev, paintWalls: value }));
                    if (project) updateGlobalPaintDefaults(project.id, { paintWalls: value });
                  }}
                />
                <Toggle
                  label={t("screens.projectSetup.projectDefaults.paintCeilings")}
                  value={localPaintDefaults.paintCeilings}
                  onValueChange={(value) => {
                    setLocalPaintDefaults(prev => ({ ...prev, paintCeilings: value }));
                    if (project) updateGlobalPaintDefaults(project.id, { paintCeilings: value });
                  }}
                />
                <Toggle
                  label={t("screens.projectSetup.projectDefaults.paintTrim")}
                  value={localPaintDefaults.paintTrim}
                  onValueChange={(value) => {
                    setLocalPaintDefaults(prev => ({ ...prev, paintTrim: value }));
                    if (project) updateGlobalPaintDefaults(project.id, { paintTrim: value });
                  }}
                  description="Includes door frames and window frames"
                />
                <Toggle
                  label={t("screens.projectSetup.projectDefaults.paintBaseboards")}
                  value={localPaintDefaults.paintBaseboards}
                  onValueChange={(value) => {
                    setLocalPaintDefaults(prev => ({ ...prev, paintBaseboards: value }));
                    if (project) updateGlobalPaintDefaults(project.id, { paintBaseboards: value });
                  }}
                />
                <Toggle
                  label={t("screens.projectSetup.projectDefaults.paintDoors")}
                  value={localPaintDefaults.paintDoors}
                  onValueChange={(value) => {
                    setLocalPaintDefaults(prev => ({ ...prev, paintDoors: value }));
                    if (project) updateGlobalPaintDefaults(project.id, { paintDoors: value });
                  }}
                />
                <Toggle
                  label={t("screens.projectSetup.projectDefaults.paintDoorJambs")}
                  value={localPaintDefaults.paintDoorJambs}
                  onValueChange={(value) => {
                    setLocalPaintDefaults(prev => ({ ...prev, paintDoorJambs: value }));
                    if (project) updateGlobalPaintDefaults(project.id, { paintDoorJambs: value });
                  }}
                />
                <Toggle
                  label={t("screens.projectSetup.projectDefaults.paintCrownMoulding")}
                  value={localPaintDefaults.paintCrownMoulding}
                  onValueChange={(value) => {
                    setLocalPaintDefaults(prev => ({ ...prev, paintCrownMoulding: value }));
                    if (project) updateGlobalPaintDefaults(project.id, { paintCrownMoulding: value });
                  }}
                />
                <Toggle
                  label={t("screens.projectSetup.projectDefaults.paintClosetInteriors")}
                  value={localPaintDefaults.paintClosetInteriors}
                  onValueChange={(value) => {
                    setLocalPaintDefaults(prev => ({ ...prev, paintClosetInteriors: value }));
                    if (project) updateGlobalPaintDefaults(project.id, { paintClosetInteriors: value });
                  }}
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
                  value={localPaintDefaults.defaultWallCoats === 2}
                  onValueChange={(value) => {
                    const newCoats = value ? 2 : 1;
                    setLocalPaintDefaults(prev => ({ ...prev, defaultWallCoats: newCoats }));
                    if (project) updateGlobalPaintDefaults(project.id, { defaultWallCoats: newCoats });
                  }}
                  description={`Currently: ${localPaintDefaults.defaultWallCoats} coat(s)`}
                />

                <Toggle
                  label={t("screens.projectSetup.projectDefaults.coatsForCeilings")}
                  value={localPaintDefaults.defaultCeilingCoats === 2}
                  onValueChange={(value) => {
                    const newCoats = value ? 2 : 1;
                    setLocalPaintDefaults(prev => ({ ...prev, defaultCeilingCoats: newCoats }));
                    if (project) updateGlobalPaintDefaults(project.id, { defaultCeilingCoats: newCoats });
                  }}
                  description={`Currently: ${localPaintDefaults.defaultCeilingCoats} coat(s)`}
                />

                <Toggle
                  label={t("screens.projectSetup.projectDefaults.coatsForTrim")}
                  value={localPaintDefaults.defaultTrimCoats === 2}
                  onValueChange={(value) => {
                    const newCoats = value ? 2 : 1;
                    setLocalPaintDefaults(prev => ({ ...prev, defaultTrimCoats: newCoats }));
                    if (project) updateGlobalPaintDefaults(project.id, { defaultTrimCoats: newCoats });
                  }}
                  description={`Currently: ${localPaintDefaults.defaultTrimCoats} coat(s)`}
                />

                <Toggle
                  label={t("screens.projectSetup.projectDefaults.coatsForDoors")}
                  value={localPaintDefaults.defaultDoorCoats === 2}
                  onValueChange={(value) => {
                    const newCoats = value ? 2 : 1;
                    setLocalPaintDefaults(prev => ({ ...prev, defaultDoorCoats: newCoats }));
                    if (project) updateGlobalPaintDefaults(project.id, { defaultDoorCoats: newCoats });
                  }}
                  description={`Currently: ${localPaintDefaults.defaultDoorCoats} coat(s)`}
                />
              </>
            )}
          </Card>

          {/* FURNITURE MOVING SECTION */}
          <Card style={{ marginBottom: Spacing.md }}>
            <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
              Furniture Moving
            </Text>
            <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.md }}>
              Include furniture moving service in quote
            </Text>

            <Toggle
              label="Include Furniture Moving"
              value={includeFurnitureMoving}
              onValueChange={(value) => {
                setIncludeFurnitureMoving(value);
                if (project) updateFurnitureMoving(project.id, value);
              }}
              description="Adds furniture moving fee to labor cost"
            />
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

      {/* KB-004: InputAccessoryViews for Client Info fields */}
      {Platform.OS === "ios" && (
        <>
          {/* Client Name - First field, only Next */}
          <InputAccessoryView nativeID={`projectClientName-${nameAccessoryID}`}>
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
                onPress={() => addressRef.current?.focus()}
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

          {/* Address - Previous/Next */}
          <InputAccessoryView nativeID={`projectAddress-${addressAccessoryID}`}>
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
                onPress={() => nameRef.current?.focus()}
                style={{
                  paddingHorizontal: Spacing.lg,
                  paddingVertical: Spacing.sm,
                }}
              >
                <Text
                  style={{
                    fontSize: Typography.body.fontSize,
                    color: "#007AFF",
                    fontWeight: "400",
                  }}
                >
                  Previous
                </Text>
              </Pressable>
              <Pressable
                onPress={() => cityRef.current?.focus()}
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

          {/* City - Previous/Next */}
          <InputAccessoryView nativeID={`projectCity-${cityAccessoryID}`}>
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
                onPress={() => addressRef.current?.focus()}
                style={{
                  paddingHorizontal: Spacing.lg,
                  paddingVertical: Spacing.sm,
                }}
              >
                <Text
                  style={{
                    fontSize: Typography.body.fontSize,
                    color: "#007AFF",
                    fontWeight: "400",
                  }}
                >
                  Previous
                </Text>
              </Pressable>
              <Pressable
                onPress={() => countryRef.current?.focus()}
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

          {/* Country - Previous/Next */}
          <InputAccessoryView nativeID={`projectCountry-${countryAccessoryID}`}>
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
                onPress={() => cityRef.current?.focus()}
                style={{
                  paddingHorizontal: Spacing.lg,
                  paddingVertical: Spacing.sm,
                }}
              >
                <Text
                  style={{
                    fontSize: Typography.body.fontSize,
                    color: "#007AFF",
                    fontWeight: "400",
                  }}
                >
                  Previous
                </Text>
              </Pressable>
              <Pressable
                onPress={() => phoneRef.current?.focus()}
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

          {/* Phone - Previous/Next */}
          <InputAccessoryView nativeID={`projectPhone-${phoneAccessoryID}`}>
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
                onPress={() => countryRef.current?.focus()}
                style={{
                  paddingHorizontal: Spacing.lg,
                  paddingVertical: Spacing.sm,
                }}
              >
                <Text
                  style={{
                    fontSize: Typography.body.fontSize,
                    color: "#007AFF",
                    fontWeight: "400",
                  }}
                >
                  Previous
                </Text>
              </Pressable>
              <Pressable
                onPress={() => emailRef.current?.focus()}
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

          {/* Email - Last field, Previous/Done */}
          <InputAccessoryView nativeID={`projectEmail-${emailAccessoryID}`}>
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
                onPress={() => phoneRef.current?.focus()}
                style={{
                  paddingHorizontal: Spacing.lg,
                  paddingVertical: Spacing.sm,
                }}
              >
                <Text
                  style={{
                    fontSize: Typography.body.fontSize,
                    color: "#007AFF",
                    fontWeight: "400",
                  }}
                >
                  Previous
                </Text>
              </Pressable>
              <Pressable
                onPress={() => Keyboard.dismiss()}
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
                  Done
                </Text>
              </Pressable>
            </View>
          </InputAccessoryView>
        </>
      )}
    </SafeAreaView>
  );
}
