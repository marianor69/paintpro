import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, Alert, TextInput, KeyboardAvoidingView, Platform, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { useProjectStore } from "../state/projectStore";
import { usePricingStore } from "../state/pricingStore";
import { useAppSettings } from "../state/appSettings";
import { useCalculationSettings } from "../state/calculationStore";
import { calculateFilteredProjectSummary, formatCurrency, safeNumber, getDefaultQuoteBuilder } from "../utils/calculations";
import { computeRoomPricingSummary, computeStaircasePricingSummary, computeFireplacePricingSummary } from "../utils/pricingSummary";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius, Shadows } from "../utils/designSystem";
import { Card } from "../components/Card";
import { Toggle } from "../components/Toggle";

type Props = NativeStackScreenProps<RootStackParamList, "ProjectDetail">;

export default function ProjectDetailScreen({ route, navigation }: Props) {
  const { projectId } = route.params;

  const project = useProjectStore((s) =>
    s.projects.find((p) => p.id === projectId)
  );
  const addRoom = useProjectStore((s) => s.addRoom);
  const addStaircase = useProjectStore((s) => s.addStaircase);
  const addFireplace = useProjectStore((s) => s.addFireplace);
  const deleteRoom = useProjectStore((s) => s.deleteRoom);
  const deleteStaircase = useProjectStore((s) => s.deleteStaircase);
  const deleteFireplace = useProjectStore((s) => s.deleteFireplace);
  const updateProjectFloors = useProjectStore((s) => s.updateProjectFloors);
  const updateProjectBaseboard = useProjectStore((s) => s.updateProjectBaseboard);
  const updateProjectCoats = useProjectStore((s) => s.updateProjectCoats);
  const updateRoom = useProjectStore((s) => s.updateRoom);
  const updateGlobalPaintDefaults = useProjectStore((s) => s.updateGlobalPaintDefaults);
  const updateProjectCoverPhoto = useProjectStore((s) => s.updateProjectCoverPhoto);
  const pricing = usePricingStore();
  const appSettings = useAppSettings();
  const calculationSettings = useCalculationSettings((s) => s.settings);

  // Wrap project loading and preprocessing
  let effectiveFloorCount = 1;
  let effectiveFloorHeights: number[] = [8];
  let summary: ReturnType<typeof calculateFilteredProjectSummary> | null = null;
  let loadError: string | null = null;

  try {
    if (project) {
      // Normalize floor count
      effectiveFloorCount = safeNumber(project.floorCount, project.hasTwoFloors ? 2 : 1);

      // Normalize floor heights
      if (project.floorHeights && Array.isArray(project.floorHeights)) {
        effectiveFloorHeights = project.floorHeights.map((h) => safeNumber(h, 8));
      } else {
        effectiveFloorHeights = [
          safeNumber(project.firstFloorHeight, 8),
          ...(project.secondFloorHeight != null ? [safeNumber(project.secondFloorHeight, 8)] : [])
        ];
      }

      // Calculate summary using ACTIVE QUOTE's QuoteBuilder (single source of truth)
      // This ensures consistency with RoomEditorScreen which also uses activeQuote
      const activeQuote = project.quotes?.find(q => q.id === project.activeQuoteId);
      const quoteBuilder = activeQuote?.quoteBuilder || project.quoteBuilder || getDefaultQuoteBuilder();
      summary = calculateFilteredProjectSummary(project, pricing, quoteBuilder);
    }
  } catch (err: unknown) {
    const error = err as Error;
    loadError = `PROJECT LOAD ERROR: ${error.message}`;
    console.log("PROJECT LOAD ERROR:", error.message);
  }

  // Local state for floor configuration - MUST be before any early returns
  const [localFloorCount, setLocalFloorCount] = useState(effectiveFloorCount);
  const [localFloorHeights, setLocalFloorHeights] = useState<string[]>(
    effectiveFloorHeights.map(h => safeNumber(h, 8).toString())
  );

  if (!project) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.backgroundWarmGray }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: Typography.h2.fontSize, color: Colors.mediumGray }}>Project not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error if loading failed
  if (loadError) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.backgroundWarmGray }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing.lg }}>
          <Text style={{ fontSize: Typography.h2.fontSize, color: Colors.error, marginBottom: Spacing.md, textAlign: "center" }}>
            Error Loading Project
          </Text>
          <Text style={{ fontSize: Typography.body.fontSize, color: Colors.mediumGray, textAlign: "center" }}>
            {loadError}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Use calculated summary or fallback
  const displaySummary = summary || {
    grandTotal: 0,
    totalWallGallons: 0,
    totalCeilingGallons: 0,
    totalTrimGallons: 0,
    totalDoorGallons: 0,
    totalPrimerGallons: 0,
    totalLaborCost: 0,
    totalMaterialCost: 0,
    itemizedPrices: [],
    totalDoors: 0,
    totalWindows: 0,
    totalWallSqFt: 0,
    totalCeilingSqFt: 0,
    totalTrimSqFt: 0,
    totalDoorSqFt: 0,
  };

  const handleFloorCountChange = (newCount: number) => {
    if (newCount < 1 || newCount > 5) return;

    setLocalFloorCount(newCount);

    const newHeights = [...localFloorHeights];
    if (newCount > localFloorHeights.length) {
      while (newHeights.length < newCount) {
        newHeights.push("8");
      }
    } else {
      newHeights.length = newCount;
    }
    setLocalFloorHeights(newHeights);

    // Update the project immediately
    updateProjectFloors(projectId, newCount, newHeights.map(h => parseFloat(h) || 8));
  };

  const handleFloorHeightChange = (index: number, value: string) => {
    const newHeights = [...localFloorHeights];
    newHeights[index] = value;
    setLocalFloorHeights(newHeights);

    // Update the project immediately
    updateProjectFloors(projectId, localFloorCount, newHeights.map(h => parseFloat(h) || 8));
  };

  const handleAddRoom = (floorNumber?: number) => {
    const roomId = addRoom(projectId, floorNumber);
    navigation.navigate("RoomEditor", { projectId, roomId });
  };

  const handleAddStaircase = () => {
    const staircaseId = addStaircase(projectId);
    navigation.navigate("StaircaseEditor", { projectId, staircaseId });
  };

  const handleAddFireplace = () => {
    const fireplaceId = addFireplace(projectId);
    navigation.navigate("FireplaceEditor", { projectId, fireplaceId });
  };

  const handleCoverPhoto = async (useCamera: boolean) => {
    try {
      // Request appropriate permission
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
        updateProjectCoverPhoto(projectId, result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to select cover photo.");
    }
  };

  const handleRemoveCoverPhoto = () => {
    Alert.alert(
      "Remove Cover Photo",
      "Are you sure you want to remove the project cover photo?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => updateProjectCoverPhoto(projectId, undefined),
        },
      ]
    );
  };

  // Room Details (Test Export) handler
  const handleExportRoomDetails = async () => {
    try {
      // 1) Gather project & settings
      const quoteBuilder = project.quoteBuilder || getDefaultQuoteBuilder();

      // 2) Build summaries using CENTRALIZED PRICING
      const roomSummaries = project.rooms.map(room =>
        computeRoomPricingSummary(
          room,
          quoteBuilder,
          pricing,
          project.projectCoats,
          project.projectIncludeClosetInteriorInQuote
        )
      );

      const staircaseSummaries = (project.staircases || []).map(stair =>
        computeStaircasePricingSummary(stair, pricing, project.projectCoats)
      );

      const fireplaceSummaries = (project.fireplaces || []).map(fp =>
        computeFireplacePricingSummary(fp, pricing)
      );

      // 3) Build JSON payload
      // CRITICAL: Export uses UI-DISPLAYED values (laborDisplayed, materialsDisplayed, totalDisplayed)
      // NOT raw calculation values (laborCost, materialsCost, totalCost)
      // If discrepancy exists between UI and internal calculations, UI values ALWAYS take precedence
      const payload = {
        _exportMetadata: {
          version: "2.0",
          exportDate: new Date().toISOString(),
          note: "All pricing values (labor, materials, totals) reflect exactly what the user sees in the UI after rounding and filtering. UI-displayed values take precedence over raw calculation values.",
        },
        projectId: project.id,
        client: project.clientInfo,
        quoteBuilder,
        summaries: {
          rooms: roomSummaries,
          staircases: staircaseSummaries,
          fireplaces: fireplaceSummaries,
        },
        totals: {
          roomsTotal: roomSummaries.reduce((sum, r) => sum + r.totalDisplayed, 0),
          staircasesTotal: staircaseSummaries.reduce((sum, s) => sum + s.totalDisplayed, 0),
          fireplacesTotal: fireplaceSummaries.reduce((sum, f) => sum + f.totalDisplayed, 0),
          grandTotal:
            roomSummaries.reduce((sum, r) => sum + r.totalDisplayed, 0) +
            staircaseSummaries.reduce((sum, s) => sum + s.totalDisplayed, 0) +
            fireplaceSummaries.reduce((sum, f) => sum + f.totalDisplayed, 0),
        },
      };

      const json = JSON.stringify(payload, null, 2);

      // 4) Save to temp file
      const fileName = `room-details-${project.id || "project"}.json`;
      const fileUri = FileSystem.cacheDirectory + fileName;
      await FileSystem.writeAsStringAsync(fileUri, json, { encoding: FileSystem.EncodingType.UTF8 });

      // 5) Share
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "application/json",
          dialogTitle: "Share Room Details JSON",
        });
      } else {
        Alert.alert("Success", `File saved to: ${fileUri}`);
      }
    } catch (error) {
      console.error("Export error:", error);
      Alert.alert("Export Failed", error instanceof Error ? error.message : "Unknown error");
    }
  };

  // Export Pricing & Calculation Settings (Test Mode Only)
  const handleExportSettings = async () => {
    try {
      // Build comprehensive settings export matching EXACTLY what the estimator uses
      const payload = {
        projectId: project.id,
        timestamp: new Date().toISOString(),

        // PRICING SETTINGS - All labor rates and material prices
        pricingSettings: {
          // Labor rates (per unit)
          wallLaborPerSqFt: pricing.wallLaborPerSqFt,
          ceilingLaborPerSqFt: pricing.ceilingLaborPerSqFt,
          baseboardLaborPerLF: pricing.baseboardLaborPerLF,
          doorLabor: pricing.doorLabor,
          windowLabor: pricing.windowLabor,
          closetLabor: pricing.closetLabor,
          riserLabor: pricing.riserLabor,
          spindleLabor: pricing.spindleLabor,
          handrailLaborPerLF: pricing.handrailLaborPerLF,
          fireplaceLabor: pricing.fireplaceLabor,
          crownMouldingLaborPerLF: pricing.crownMouldingLaborPerLF,

          // Material prices - Single gallons
          wallPaintPerGallon: pricing.wallPaintPerGallon,
          ceilingPaintPerGallon: pricing.ceilingPaintPerGallon,
          trimPaintPerGallon: pricing.trimPaintPerGallon,
          doorPaintPerGallon: pricing.doorPaintPerGallon,
          primerPerGallon: pricing.primerPerGallon,

          // Material prices - 5-gallon buckets
          wallPaintPer5Gallon: pricing.wallPaintPer5Gallon,
          ceilingPaintPer5Gallon: pricing.ceilingPaintPer5Gallon,
          trimPaintPer5Gallon: pricing.trimPaintPer5Gallon,
          doorPaintPer5Gallon: pricing.doorPaintPer5Gallon,
          primerPer5Gallon: pricing.primerPer5Gallon,
        },

        // CALCULATION SETTINGS - Physical dimensions and trim sizes
        calculationSettings: {
          // Door settings
          doorHeight: calculationSettings.doorHeight,
          doorWidth: calculationSettings.doorWidth,
          doorTrimWidth: calculationSettings.doorTrimWidth,
          doorJambWidth: calculationSettings.doorJambWidth,

          // Window settings
          windowWidth: calculationSettings.windowWidth,
          windowHeight: calculationSettings.windowHeight,
          windowTrimWidth: calculationSettings.windowTrimWidth,

          // Closet settings
          singleClosetWidth: calculationSettings.singleClosetWidth,
          singleClosetHeight: calculationSettings.singleClosetHeight,
          singleClosetTrimWidth: calculationSettings.singleClosetTrimWidth,
          doubleClosetWidth: calculationSettings.doubleClosetWidth,
          doubleClosetHeight: calculationSettings.doubleClosetHeight,
          doubleClosetTrimWidth: calculationSettings.doubleClosetTrimWidth,

          // Other trim settings
          baseboardWidth: calculationSettings.baseboardWidth,
          crownMouldingWidth: calculationSettings.crownMouldingWidth,
        },

        // COVERAGE RULES - Paint consumption rates
        coverageRules: {
          wallCoverageSqFtPerGallon: appSettings.wallCoverageSqFtPerGallon,
          ceilingCoverageSqFtPerGallon: appSettings.ceilingCoverageSqFtPerGallon,
          trimCoverageSqFtPerGallon: appSettings.trimCoverageSqFtPerGallon,
          doorCoverageSqFtPerGallon: appSettings.doorCoverageSqFtPerGallon,
          primerCoverageSqFtPerGallon: appSettings.primerCoverageSqFtPerGallon,

          // Note: Also available in pricing store for backward compatibility
          wallCoverageSqFtPerGallon_legacy: pricing.wallCoverageSqFtPerGallon,
          ceilingCoverageSqFtPerGallon_legacy: pricing.ceilingCoverageSqFtPerGallon,
          trimCoverageSqFtPerGallon_legacy: pricing.trimCoverageSqFtPerGallon,
        },

        // DEFAULT COATS - Project-level defaults
        defaultCoats: {
          defaultWallCoats: project.globalPaintDefaults?.defaultWallCoats ?? 2,
          defaultCeilingCoats: project.globalPaintDefaults?.defaultCeilingCoats ?? 2,
          defaultTrimCoats: project.globalPaintDefaults?.defaultTrimCoats ?? 2,
          defaultDoorCoats: project.globalPaintDefaults?.defaultDoorCoats ?? 2,
        },

        // CLOSET SETTINGS
        closetSettings: {
          closetCavityDepth: appSettings.closetCavityDepth,
        },
      };

      const json = JSON.stringify(payload, null, 2);

      // Save to temp file
      const fileName = `estimator-settings-${project.id || "export"}.json`;
      const fileUri = FileSystem.cacheDirectory + fileName;
      await FileSystem.writeAsStringAsync(fileUri, json, { encoding: FileSystem.EncodingType.UTF8 });

      // Share
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "application/json",
          dialogTitle: "Share Estimator Settings",
        });
      } else {
        Alert.alert("Success", `Settings saved to: ${fileUri}`);
      }
    } catch (error) {
      console.error("Settings export error:", error);
      Alert.alert("Export Failed", error instanceof Error ? error.message : "Unknown error");
    }
  };

  // Export Calculation Trace (Test Mode Only) - Full step-by-step math
  const handleExportCalculationTrace = async () => {
    try {
      const quoteBuilder = project.quoteBuilder || getDefaultQuoteBuilder();

      // Build calculation traces for all rooms
      const roomTraces = project.rooms.map((room) => {
        const pricingSummary = computeRoomPricingSummary(
          room,
          quoteBuilder,
          pricing,
          project.projectCoats,
          project.projectIncludeClosetInteriorInQuote
        );

        return {
          roomId: room.id,
          name: room.name || "Unnamed Room",

          // INPUTS - Raw room data
          inputs: {
            length: room.length,
            width: room.width,
            height: room.height,
            manualArea: room.manualArea,
            ceilingType: room.ceilingType,
            cathedralPeakHeight: room.cathedralPeakHeight,
            floor: room.floor,
            coatsWalls: pricingSummary.coatsWalls,
            coatsCeiling: pricingSummary.coatsCeiling,
            coatsTrim: pricingSummary.coatsTrim,
            coatsDoors: pricingSummary.coatsDoors,
            doors: room.doorCount,
            windows: room.windowCount,
            singleDoorClosets: room.singleDoorClosets,
            doubleDoorClosets: room.doubleDoorClosets,
            paintWalls: room.paintWalls,
            paintCeilings: room.paintCeilings,
            paintTrim: room.paintTrim,
            paintDoors: room.paintDoors,
            paintWindows: room.paintWindows,
            paintBaseboard: room.paintBaseboard,
            hasCrownMoulding: room.hasCrownMoulding,
            includeClosetInteriorInQuote: room.includeClosetInteriorInQuote,
          },

          // COVERAGE RULES - Paint consumption rates
          coverageRules: {
            wallCoverageSqFtPerGallon: appSettings.wallCoverageSqFtPerGallon,
            ceilingCoverageSqFtPerGallon: appSettings.ceilingCoverageSqFtPerGallon,
            trimCoverageSqFtPerGallon: appSettings.trimCoverageSqFtPerGallon,
            doorCoverageSqFtPerGallon: appSettings.doorCoverageSqFtPerGallon,
            primerCoverageSqFtPerGallon: appSettings.primerCoverageSqFtPerGallon,
          },

          // LABOR RATES - Per unit pricing
          laborRates: {
            wallLaborPerSqFt: pricing.wallLaborPerSqFt,
            ceilingLaborPerSqFt: pricing.ceilingLaborPerSqFt,
            baseboardLaborPerLF: pricing.baseboardLaborPerLF,
            doorLabor: pricing.doorLabor,
            windowLabor: pricing.windowLabor,
            closetLabor: pricing.closetLabor,
            crownMouldingLaborPerLF: pricing.crownMouldingLaborPerLF,
          },

          // PAINT PRICES - Material costs
          paintPrices: {
            wallPaintPerGallon: pricing.wallPaintPerGallon,
            ceilingPaintPerGallon: pricing.ceilingPaintPerGallon,
            trimPaintPerGallon: pricing.trimPaintPerGallon,
            doorPaintPerGallon: pricing.doorPaintPerGallon,
            primerPerGallon: pricing.primerPerGallon,
          },

          // CALCULATION DIMENSIONS
          calculationDimensions: {
            doorHeight: calculationSettings.doorHeight,
            doorWidth: calculationSettings.doorWidth,
            windowWidth: calculationSettings.windowWidth,
            windowHeight: calculationSettings.windowHeight,
            singleClosetWidth: calculationSettings.singleClosetWidth,
            singleClosetHeight: calculationSettings.singleClosetHeight,
            doubleClosetWidth: calculationSettings.doubleClosetWidth,
            doubleClosetHeight: calculationSettings.doubleClosetHeight,
            baseboardWidth: calculationSettings.baseboardWidth,
            crownMouldingWidth: calculationSettings.crownMouldingWidth,
            closetCavityDepth: appSettings.closetCavityDepth,
          },

          // COMBINED RULE FLAGS - What's actually included
          combinedRuleFlags: {
            includedWalls: pricingSummary.includedWalls,
            includedCeilings: pricingSummary.includedCeilings,
            includedTrim: pricingSummary.includedTrim,
            includedDoors: pricingSummary.includedDoors,
            includedWindows: pricingSummary.includedWindows,
            includedBaseboards: pricingSummary.includedBaseboards,
            includedClosets: pricingSummary.includedClosets,
          },

          // STEP-BY-STEP CALCULATION RESULTS
          stepByStep: {
            // Areas calculated
            wallArea: pricingSummary.wallArea,
            ceilingArea: pricingSummary.ceilingArea,
            baseboardLF: pricingSummary.baseboardLF,
            crownMouldingLF: pricingSummary.crownMouldingLF,
            closetWallArea: pricingSummary.closetWallArea,
            closetCeilingArea: pricingSummary.closetCeilingArea,
            closetBaseboardLF: pricingSummary.closetBaseboardLF,

            // Counts
            doorUnits: pricingSummary.doorsCount,
            windowUnits: pricingSummary.windowsCount,

            // Paint gallons calculated
            paintGallonsWalls: pricingSummary.wallPaintGallons,
            paintGallonsCeiling: pricingSummary.ceilingPaintGallons,
            paintGallonsTrim: pricingSummary.trimPaintGallons,
            paintGallonsDoors: pricingSummary.doorPaintGallons,
            paintGallonsPrimer: pricingSummary.primerGallons,

            // Labor costs (raw values before rounding)
            laborWallsRaw: pricingSummary.includedWalls
              ? pricingSummary.wallArea * pricing.wallLaborPerSqFt
              : 0,
            laborCeilingRaw: pricingSummary.includedCeilings
              ? pricingSummary.ceilingArea * pricing.ceilingLaborPerSqFt
              : 0,
            laborBaseboardRaw: pricingSummary.includedBaseboards
              ? pricingSummary.baseboardLF * pricing.baseboardLaborPerLF
              : 0,
            laborDoorsRaw: pricingSummary.includedDoors
              ? pricingSummary.doorsCount * pricing.doorLabor
              : 0,
            laborWindowsRaw: pricingSummary.includedWindows
              ? pricingSummary.windowsCount * pricing.windowLabor * pricingSummary.coatsTrim
              : 0,
            laborClosetsRaw: pricingSummary.includedClosets
              ? (pricingSummary.singleDoorClosets + pricingSummary.doubleDoorClosets) * pricing.closetLabor
              : 0,
            laborCrownMouldingRaw: pricingSummary.includedTrim && room.hasCrownMoulding
              ? pricingSummary.crownMouldingLF * pricing.crownMouldingLaborPerLF
              : 0,

            // Labor subtotals
            laborSubtotalBeforeRounding: pricingSummary.laborCost,
            laborSubtotalAfterRounding: pricingSummary.laborDisplayed,

            // Material costs (raw values before rounding)
            materialsWallsRaw: pricingSummary.includedWalls
              ? Math.ceil(pricingSummary.wallPaintGallons) * pricing.wallPaintPerGallon
              : 0,
            materialsCeilingRaw: pricingSummary.includedCeilings
              ? Math.ceil(pricingSummary.ceilingPaintGallons) * pricing.ceilingPaintPerGallon
              : 0,
            materialsTrimRaw: (pricingSummary.includedTrim || pricingSummary.includedWindows)
              ? Math.ceil(pricingSummary.trimPaintGallons) * pricing.trimPaintPerGallon
              : 0,
            materialsDoorsRaw: pricingSummary.includedDoors
              ? Math.ceil(pricingSummary.doorPaintGallons) * pricing.doorPaintPerGallon
              : 0,

            // Materials subtotals
            materialsSubtotalBeforeRounding: pricingSummary.materialsCost,
            materialsSubtotalAfterRounding: pricingSummary.materialsDisplayed,

            // Final totals
            finalTotalBeforeRounding: pricingSummary.totalCost,
            finalTotalDisplayed: pricingSummary.totalDisplayed,
          },
        };
      });

      // Build calculation traces for staircases
      const staircaseTraces = (project.staircases || []).map((staircase) => {
        const pricingSummary = computeStaircasePricingSummary(staircase, pricing, project.projectCoats);

        return {
          staircaseId: staircase.id,
          name: `Staircase`,

          inputs: {
            riserCount: staircase.riserCount,
            spindleCount: staircase.spindleCount,
            handrailLength: staircase.handrailLength,
            hasSecondaryStairwell: staircase.hasSecondaryStairwell,
            doubleSidedWalls: staircase.doubleSidedWalls,
            coats: staircase.coats,
            projectCoats: project.projectCoats,
          },

          laborRates: {
            riserLabor: pricing.riserLabor,
            spindleLabor: pricing.spindleLabor,
            handrailLaborPerLF: pricing.handrailLaborPerLF,
            wallLaborPerSqFt: pricing.wallLaborPerSqFt,
            ceilingLaborPerSqFt: pricing.ceilingLaborPerSqFt,
            secondCoatLaborMultiplier: pricing.secondCoatLaborMultiplier,
          },

          paintPrices: {
            trimPaintPerGallon: pricing.trimPaintPerGallon,
            wallPaintPerGallon: pricing.wallPaintPerGallon,
            ceilingPaintPerGallon: pricing.ceilingPaintPerGallon,
          },

          coverageRules: {
            trimCoverageSqFtPerGallon: appSettings.trimCoverageSqFtPerGallon,
          },

          stepByStep: {
            paintableArea: pricingSummary.paintableArea,
            totalGallons: pricingSummary.totalGallons,

            laborRisersRaw: staircase.riserCount * pricing.riserLabor,
            laborSpindlesRaw: staircase.spindleCount * pricing.spindleLabor,
            laborHandrailRaw: staircase.handrailLength * pricing.handrailLaborPerLF,

            laborSubtotalBeforeRounding: pricingSummary.laborCost,
            laborSubtotalAfterRounding: pricingSummary.laborDisplayed,

            materialsSubtotalBeforeRounding: pricingSummary.materialsCost,
            materialsSubtotalAfterRounding: pricingSummary.materialsDisplayed,

            finalTotalBeforeRounding: pricingSummary.totalCost,
            finalTotalDisplayed: pricingSummary.totalDisplayed,
          },
        };
      });

      // Build calculation traces for fireplaces
      const fireplaceTraces = (project.fireplaces || []).map((fireplace) => {
        const pricingSummary = computeFireplacePricingSummary(fireplace, pricing);

        return {
          fireplaceId: fireplace.id,
          name: `Fireplace`,

          inputs: {
            width: fireplace.width,
            height: fireplace.height,
            depth: fireplace.depth,
            hasTrim: fireplace.hasTrim,
            trimLinearFeet: fireplace.trimLinearFeet,
            coats: fireplace.coats,
          },

          laborRates: {
            fireplaceLabor: pricing.fireplaceLabor,
            baseboardLaborPerLF: pricing.baseboardLaborPerLF,
          },

          paintPrices: {
            wallPaintPerGallon: pricing.wallPaintPerGallon,
          },

          coverageRules: {
            wallCoverageSqFtPerGallon: appSettings.wallCoverageSqFtPerGallon,
          },

          stepByStep: {
            paintableArea: pricingSummary.paintableArea,
            totalGallons: pricingSummary.totalGallons,

            laborFireplaceRaw: pricing.fireplaceLabor,
            laborTrimRaw: fireplace.hasTrim
              ? fireplace.trimLinearFeet * pricing.baseboardLaborPerLF
              : 0,

            laborSubtotalBeforeRounding: pricingSummary.laborCost,
            laborSubtotalAfterRounding: pricingSummary.laborDisplayed,

            materialsSubtotalBeforeRounding: pricingSummary.materialsCost,
            materialsSubtotalAfterRounding: pricingSummary.materialsDisplayed,

            finalTotalBeforeRounding: pricingSummary.totalCost,
            finalTotalDisplayed: pricingSummary.totalDisplayed,
          },
        };
      });

      const payload = {
        _traceMetadata: {
          exportType: "calculation-trace",
          version: "1.0",
          timestamp: new Date().toISOString(),
          projectId: project.id,
          note: "Complete step-by-step calculation trace showing all inputs, rates, and intermediate values used by the estimator.",
        },
        rooms: roomTraces,
        staircases: staircaseTraces,
        fireplaces: fireplaceTraces,
      };

      const json = JSON.stringify(payload, null, 2);

      // Save to temp file
      const fileName = `calculation-trace-${project.id || "export"}.json`;
      const fileUri = FileSystem.cacheDirectory + fileName;
      await FileSystem.writeAsStringAsync(fileUri, json, { encoding: FileSystem.EncodingType.UTF8 });

      // Share
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "application/json",
          dialogTitle: "Share Calculation Trace",
        });
      } else {
        Alert.alert("Success", `Calculation trace saved to: ${fileUri}`);
      }
    } catch (error) {
      console.error("Calculation trace export error:", error);
      Alert.alert("Export Failed", error instanceof Error ? error.message : "Unknown error");
    }
  };

  const getOrdinal = (n: number) => {
    if (n === 1) return "1st";
    if (n === 2) return "2nd";
    if (n === 3) return "3rd";
    return `${n}th`;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.backgroundWarmGray }} edges={["bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: Spacing.md, paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* Project Info */}
          <Card style={{ marginBottom: Spacing.md }}>
            <Text style={{ fontSize: Typography.h1.fontSize, fontWeight: Typography.h1.fontWeight as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
              {project.clientInfo.name}
            </Text>
            <Text style={{ fontSize: Typography.body.fontSize, color: Colors.mediumGray, marginBottom: Spacing.xs }}>
              {project.clientInfo.address}
            </Text>
            {project.clientInfo.phone && (
              <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                {project.clientInfo.phone}
              </Text>
            )}

            {/* Total Estimate */}
            <View style={{ marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.neutralGray }}>
              <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.xs }}>
                Total Estimate
              </Text>
              <Text style={{ fontSize: 32, fontWeight: "700" as any, color: Colors.primaryBlue }}>
                {formatCurrency(displaySummary.grandTotal)}
              </Text>
            </View>
          </Card>

          {/* Project Cover Photo */}
          <Card style={{ marginBottom: Spacing.md }}>
            <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
              Project Cover Photo
            </Text>
            <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.md }}>
              This photo appears as the project thumbnail on the home screen
            </Text>

            {project.coverPhotoUri ? (
              <View>
                <Image
                  source={{ uri: project.coverPhotoUri }}
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
                      Retake
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleCoverPhoto(false)}
                    style={{
                      flex: 1,
                      backgroundColor: Colors.white,
                      borderRadius: BorderRadius.default,
                      paddingVertical: Spacing.sm,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1,
                      borderColor: Colors.neutralGray,
                    }}
                  >
                    <Ionicons name="images-outline" size={18} color={Colors.darkCharcoal} />
                    <Text style={{ fontSize: Typography.caption.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal, marginLeft: Spacing.xs }}>
                      Choose
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
                    Take Photo
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
                    Choose
                  </Text>
                </Pressable>
              </View>
            )}
          </Card>

          {/* Floors & Heights - Ultra Compact */}
          <Card style={{ marginBottom: Spacing.md }}>
            <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.darkCharcoal, marginBottom: Spacing.md }}>
              Floors & Heights
            </Text>

            {/* Number of Floors - Inline */}
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: Spacing.md }}>
              <Text style={{ fontSize: Typography.body.fontSize, color: Colors.darkCharcoal, marginRight: Spacing.sm }}>
                Floors:
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
                <Ionicons name="remove" size={18} color={localFloorCount <= 1 ? Colors.mediumGray : Colors.darkCharcoal} />
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
                <Ionicons name="add" size={18} color={localFloorCount >= 5 ? Colors.mediumGray : Colors.darkCharcoal} />
              </Pressable>
            </View>

            {/* Floor Heights - Compact Inline */}
            {localFloorHeights.map((height, index) => (
              <View key={index} style={{ flexDirection: "row", alignItems: "center", marginBottom: index < localFloorHeights.length - 1 ? Spacing.sm : 0 }}>
                <Text style={{ fontSize: Typography.body.fontSize, color: Colors.darkCharcoal, width: 120 }}>
                  {getOrdinal(index + 1)} floor height:
                </Text>
                <TextInput
                  value={height}
                  onChangeText={(value) => handleFloorHeightChange(index, value)}
                  keyboardType="decimal-pad"
                  placeholder="8"
                  placeholderTextColor={Colors.mediumGray}
                  cursorColor={Colors.primaryBlue}
                  selectionColor={Colors.primaryBlue}
                  returnKeyType="done"
                  style={{
                    backgroundColor: Colors.white,
                    borderRadius: BorderRadius.default,
                    borderWidth: 1,
                    borderColor: Colors.neutralGray,
                    paddingHorizontal: Spacing.sm,
                    paddingVertical: Spacing.xs,
                    fontSize: Typography.body.fontSize,
                    color: Colors.darkCharcoal,
                    width: 60,
                    marginRight: Spacing.xs,
                  }}
                  accessibilityLabel={`${getOrdinal(index + 1)} floor height input`}
                />
                <Text style={{ fontSize: Typography.body.fontSize, color: Colors.mediumGray }}>ft</Text>
              </View>
            ))}

            <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginTop: Spacing.sm }}>
              Used as default ceiling height when adding rooms
            </Text>
          </Card>

          {/* Global Paint Defaults */}
          <Card style={{ marginBottom: Spacing.md }}>
            <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
              Global Paint Defaults
            </Text>
            <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.md, lineHeight: 18 }}>
              Define which elements to paint by default when creating new rooms. These can be overridden per room.
            </Text>

            <View>
              <Toggle
                label="Paint Walls"
                value={project.globalPaintDefaults?.paintWalls ?? true}
                onValueChange={(value) => updateGlobalPaintDefaults(projectId, { paintWalls: value })}
              />
              <Toggle
                label="Paint Ceilings"
                value={project.globalPaintDefaults?.paintCeilings ?? true}
                onValueChange={(value) => updateGlobalPaintDefaults(projectId, { paintCeilings: value })}
              />
              <Toggle
                label="Paint Trim (Door/Window Frames)"
                value={project.globalPaintDefaults?.paintTrim ?? true}
                onValueChange={(value) => updateGlobalPaintDefaults(projectId, { paintTrim: value })}
                description="Includes door frames and window frames"
              />
              <Toggle
                label="Paint Baseboards"
                value={project.globalPaintDefaults?.paintBaseboards ?? true}
                onValueChange={(value) => updateGlobalPaintDefaults(projectId, { paintBaseboards: value })}
              />
              <Toggle
                label="Paint Doors"
                value={project.globalPaintDefaults?.paintDoors ?? false}
                onValueChange={(value) => updateGlobalPaintDefaults(projectId, { paintDoors: value })}
              />
              <Toggle
                label="Paint Door Jambs"
                value={project.globalPaintDefaults?.paintDoorJambs ?? false}
                onValueChange={(value) => updateGlobalPaintDefaults(projectId, { paintDoorJambs: value })}
              />
              <Toggle
                label="Paint Crown Moulding"
                value={project.globalPaintDefaults?.paintCrownMoulding ?? false}
                onValueChange={(value) => updateGlobalPaintDefaults(projectId, { paintCrownMoulding: value })}
              />
              <Toggle
                label="Paint Closet Interiors"
                value={project.globalPaintDefaults?.paintClosetInteriors ?? true}
                onValueChange={(value) => updateGlobalPaintDefaults(projectId, { paintClosetInteriors: value })}
              />
            </View>

            {/* Default Coats Section */}
            <View style={{ height: 1, backgroundColor: Colors.neutralGray, marginVertical: Spacing.md }} />

            <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
              Default Coats for New Rooms
            </Text>
            <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.sm }}>
              Toggle ON for 2 coats, OFF for 1 coat. Affects paint material calculations.
            </Text>

            <Toggle
              label="Wall Coats"
              value={(project.globalPaintDefaults?.defaultWallCoats ?? 2) === 2}
              onValueChange={(value) =>
                updateGlobalPaintDefaults(projectId, {
                  defaultWallCoats: value ? 2 : 1,
                })
              }
              description={`Currently: ${project.globalPaintDefaults?.defaultWallCoats ?? 2} coat(s)`}
            />

            <Toggle
              label="Ceiling Coats"
              value={(project.globalPaintDefaults?.defaultCeilingCoats ?? 2) === 2}
              onValueChange={(value) =>
                updateGlobalPaintDefaults(projectId, {
                  defaultCeilingCoats: value ? 2 : 1,
                })
              }
              description={`Currently: ${project.globalPaintDefaults?.defaultCeilingCoats ?? 2} coat(s)`}
            />

            <Toggle
              label="Trim Coats"
              value={(project.globalPaintDefaults?.defaultTrimCoats ?? 2) === 2}
              onValueChange={(value) =>
                updateGlobalPaintDefaults(projectId, {
                  defaultTrimCoats: value ? 2 : 1,
                })
              }
              description={`Currently: ${project.globalPaintDefaults?.defaultTrimCoats ?? 2} coat(s)`}
            />

            <Toggle
              label="Door Coats"
              value={(project.globalPaintDefaults?.defaultDoorCoats ?? 2) === 2}
              onValueChange={(value) =>
                updateGlobalPaintDefaults(projectId, {
                  defaultDoorCoats: value ? 2 : 1,
                })
              }
              description={`Currently: ${project.globalPaintDefaults?.defaultDoorCoats ?? 2} coat(s)`}
            />

            <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginTop: Spacing.sm, fontStyle: "italic" }}>
              Note: These defaults set initial coat values for new rooms. Paint material costs scale with coats. Labor costs are not affected by coats.
            </Text>
          </Card>

          {/* Rooms Overview */}
          <Card style={{ marginBottom: Spacing.md }}>
            <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
              Rooms Overview
            </Text>
            <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.sm, lineHeight: 18 }}>
              Tap a room to edit dimensions and paint options
            </Text>
            <View style={{ backgroundColor: "#FFF9E6", borderRadius: BorderRadius.default, padding: Spacing.sm, marginBottom: Spacing.md, borderLeftWidth: 4, borderLeftColor: "#F59E0B" }}>
              <Text style={{ fontSize: Typography.caption.fontSize, color: "#92400E", lineHeight: 18 }}>
                Important: Rooms marked as Excluded are never included in any quote, regardless of quote filters.
              </Text>
            </View>

            {/* Add Room Buttons */}
            <View style={{ marginBottom: project.rooms.length > 0 ? Spacing.md : 0 }}>
              {localFloorCount === 1 ? (
                <Pressable
                  onPress={() => handleAddRoom(1)}
                  style={{
                    backgroundColor: Colors.primaryBlue,
                    borderRadius: BorderRadius.default,
                    paddingVertical: Spacing.md,
                    alignItems: "center",
                    ...Shadows.card,
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Add room"
                >
                  <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.white }}>
                    Add Room
                  </Text>
                </Pressable>
              ) : (
                <View style={{ gap: Spacing.sm }}>
                  {Array.from({ length: localFloorCount }, (_, i) => i + 1).map((floorNum) => (
                    <Pressable
                      key={floorNum}
                      onPress={() => handleAddRoom(floorNum)}
                      style={{
                        backgroundColor: Colors.primaryBlue,
                        borderRadius: BorderRadius.default,
                        paddingVertical: Spacing.sm,
                        paddingHorizontal: Spacing.md,
                        alignItems: "center",
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Add room for ${getOrdinal(floorNum)} floor`}
                    >
                      <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.white }}>
                        Add Room for {getOrdinal(floorNum)} Floor
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Room List */}
            {project.rooms.length === 0 ? (
              <View style={{ backgroundColor: Colors.backgroundWarmGray, borderRadius: BorderRadius.default, padding: Spacing.lg, alignItems: "center" }}>
                <Text style={{ fontSize: Typography.body.fontSize, color: Colors.mediumGray }}>
                  No rooms added yet
                </Text>
              </View>
            ) : (
              project.rooms.map((room, index) => (
                <Pressable
                  key={room.id}
                  onPress={() =>
                    navigation.navigate("RoomEditor", {
                      projectId,
                      roomId: room.id,
                    })
                  }
                  onLongPress={() => {
                    Alert.alert(
                      "Delete Room",
                      `Are you sure you want to delete "${room.name || "Unnamed Room"}"?`,
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Delete",
                          style: "destructive",
                          onPress: () => deleteRoom(projectId, room.id),
                        },
                      ]
                    );
                  }}
                  style={{
                    backgroundColor: Colors.white,
                    borderRadius: BorderRadius.default,
                    padding: Spacing.md,
                    marginBottom: index < project.rooms.length - 1 ? Spacing.sm : 0,
                    borderWidth: 1,
                    borderColor: Colors.neutralGray,
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Edit room ${room.name || "Unnamed Room"}`}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.xs }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal }}>
                        {room.name || "Unnamed Room"} — {getOrdinal(room.floor || 1)} floor
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4, flexWrap: "wrap", gap: 8 }}>
                        <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                          {room.length} × {room.width} × {room.height} ft
                        </Text>
                        {room.included === false && (
                          <View style={{ backgroundColor: Colors.neutralGray, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 }}>
                            <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.darkCharcoal, fontWeight: "600" as any }}>
                              Excluded
                            </Text>
                          </View>
                        )}
                        {room.hasCloset && (
                          <View style={{ backgroundColor: "#E3F2FD", borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 }}>
                            <Text style={{ fontSize: Typography.caption.fontSize, color: "#1565C0", fontWeight: "600" as any }}>
                              Closet
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Colors.mediumGray} />
                  </View>

                  {/* Include/Exclude Toggle */}
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.neutralGray }}>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                      {room.included === false ? "Excluded from calculations" : "Included in calculations"}
                    </Text>
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        updateRoom(projectId, room.id, {
                          included: room.included === false ? true : false,
                        });
                      }}
                      style={{
                        backgroundColor: room.included === false ? Colors.neutralGray : Colors.primaryBlue,
                        borderRadius: 8,
                        paddingHorizontal: Spacing.sm,
                        paddingVertical: 6,
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={room.included === false ? "Include room in calculations" : "Exclude room from calculations"}
                    >
                      <Text
                        style={{
                          fontSize: Typography.caption.fontSize,
                          fontWeight: "600" as any,
                          color: room.included === false ? Colors.darkCharcoal : Colors.white,
                        }}
                      >
                        {room.included === false ? "Include" : "Exclude"}
                      </Text>
                    </Pressable>
                  </View>
                </Pressable>
              ))
            )}
          </Card>

          {/* Staircases & Fireplaces */}
          {(project.staircases.length > 0 || project.fireplaces.length > 0) && (
            <Card style={{ marginBottom: Spacing.md }}>
              <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.darkCharcoal, marginBottom: Spacing.md }}>
                Staircases & Fireplaces
              </Text>

              {/* Staircases */}
              {project.staircases.length > 0 && (
                <View style={{ marginBottom: project.fireplaces.length > 0 ? Spacing.md : 0 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.sm }}>
                    <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500" as any, color: Colors.darkCharcoal }}>
                      Staircases: {project.staircases.length}
                    </Text>
                    <Pressable
                      onPress={handleAddStaircase}
                      style={{
                        backgroundColor: Colors.primaryBlue,
                        borderRadius: 8,
                        paddingHorizontal: Spacing.md,
                        paddingVertical: 6,
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Add staircase"
                    >
                      <Text style={{ fontSize: Typography.caption.fontSize, fontWeight: "600" as any, color: Colors.white }}>
                        Add
                      </Text>
                    </Pressable>
                  </View>
                  {project.staircases.map((staircase, idx) => (
                    <Pressable
                      key={staircase.id}
                      onPress={() =>
                        navigation.navigate("StaircaseEditor", {
                          projectId,
                          staircaseId: staircase.id,
                        })
                      }
                      onLongPress={() => {
                        Alert.alert("Delete Staircase", "Are you sure you want to delete this staircase?", [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Delete",
                            style: "destructive",
                            onPress: () => deleteStaircase(projectId, staircase.id),
                          },
                        ]);
                      }}
                      style={{
                        backgroundColor: Colors.white,
                        borderRadius: BorderRadius.default,
                        padding: Spacing.sm,
                        marginBottom: idx < project.staircases.length - 1 ? Spacing.xs : 0,
                        borderWidth: 1,
                        borderColor: Colors.neutralGray,
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Edit staircase ${idx + 1}`}
                    >
                      <Text style={{ fontSize: Typography.body.fontSize, color: Colors.darkCharcoal }}>
                        Staircase {idx + 1}
                      </Text>
                      <Ionicons name="chevron-forward" size={16} color={Colors.mediumGray} />
                    </Pressable>
                  ))}
                </View>
              )}

              {/* Fireplaces */}
              {project.fireplaces.length > 0 && (
                <View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.sm }}>
                    <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500" as any, color: Colors.darkCharcoal }}>
                      Fireplaces: {project.fireplaces.length}
                    </Text>
                    <Pressable
                      onPress={handleAddFireplace}
                      style={{
                        backgroundColor: Colors.primaryBlue,
                        borderRadius: 8,
                        paddingHorizontal: Spacing.md,
                        paddingVertical: 6,
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Add fireplace"
                    >
                      <Text style={{ fontSize: Typography.caption.fontSize, fontWeight: "600" as any, color: Colors.white }}>
                        Add
                      </Text>
                    </Pressable>
                  </View>
                  {project.fireplaces.map((fireplace, idx) => (
                    <Pressable
                      key={fireplace.id}
                      onPress={() =>
                        navigation.navigate("FireplaceEditor", {
                          projectId,
                          fireplaceId: fireplace.id,
                        })
                      }
                      onLongPress={() => {
                        Alert.alert("Delete Fireplace", "Are you sure you want to delete this fireplace?", [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Delete",
                            style: "destructive",
                            onPress: () => deleteFireplace(projectId, fireplace.id),
                          },
                        ]);
                      }}
                      style={{
                        backgroundColor: Colors.white,
                        borderRadius: BorderRadius.default,
                        padding: Spacing.sm,
                        marginBottom: idx < project.fireplaces.length - 1 ? Spacing.xs : 0,
                        borderWidth: 1,
                        borderColor: Colors.neutralGray,
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Edit fireplace ${idx + 1}`}
                    >
                      <Text style={{ fontSize: Typography.body.fontSize, color: Colors.darkCharcoal }}>
                        Fireplace {idx + 1}
                      </Text>
                      <Ionicons name="chevron-forward" size={16} color={Colors.mediumGray} />
                    </Pressable>
                  ))}
                </View>
              )}
            </Card>
          )}

          {/* Add Staircase/Fireplace buttons if none exist */}
          {(project.staircases.length === 0 || project.fireplaces.length === 0) && (
            <Card style={{ marginBottom: Spacing.md }}>
              <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.darkCharcoal, marginBottom: Spacing.md }}>
                Staircases & Fireplaces
              </Text>
              <View style={{ gap: Spacing.sm }}>
                {project.staircases.length === 0 && (
                  <Pressable
                    onPress={handleAddStaircase}
                    style={{
                      backgroundColor: Colors.white,
                      borderRadius: BorderRadius.default,
                      borderWidth: 1,
                      borderColor: Colors.neutralGray,
                      paddingVertical: Spacing.md,
                      alignItems: "center",
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Add staircase"
                  >
                    <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.primaryBlue }}>
                      Add Staircase
                    </Text>
                  </Pressable>
                )}
                {project.fireplaces.length === 0 && (
                  <Pressable
                    onPress={handleAddFireplace}
                    style={{
                      backgroundColor: Colors.white,
                      borderRadius: BorderRadius.default,
                      borderWidth: 1,
                      borderColor: Colors.neutralGray,
                      paddingVertical: Spacing.md,
                      alignItems: "center",
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Add fireplace"
                  >
                    <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.primaryBlue }}>
                      Add Fireplace
                    </Text>
                  </Pressable>
                )}
              </View>
            </Card>
          )}

          {/* Project Actions - Consolidated Tools */}
          <Card>
            <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
              Project Actions
            </Text>
            <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.md, lineHeight: 18 }}>
              Tools for quoting, materials, and client proposals
            </Text>

            <View style={{ gap: Spacing.md }}>
              {/* Contractor View */}
              <Pressable
                onPress={() => navigation.navigate("MaterialsSummary", { projectId })}
                style={{
                  backgroundColor: Colors.white,
                  borderRadius: BorderRadius.default,
                  borderWidth: 1,
                  borderColor: Colors.neutralGray,
                  padding: Spacing.md,
                }}
                accessibilityRole="button"
                accessibilityLabel="Open contractor view"
              >
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: Spacing.xs }}>
                  <Ionicons name="hammer-outline" size={20} color={Colors.primaryBlue} style={{ marginRight: Spacing.xs }} />
                  <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal }}>
                    Contractor View (Materials & Totals)
                  </Text>
                </View>
                <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, lineHeight: 18 }}>
                  Use this to see total gallons, 5-gallon vs single gallons, linear feet, and materials list.
                </Text>
              </Pressable>

              {/* Quote Builder */}
              <Pressable
                onPress={() => navigation.navigate("QuoteBuilder", { projectId })}
                style={{
                  backgroundColor: Colors.primaryBlue,
                  borderRadius: BorderRadius.default,
                  padding: Spacing.md,
                  ...Shadows.card,
                }}
                accessibilityRole="button"
                accessibilityLabel="Open Quote Builder"
              >
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: Spacing.xs }}>
                  <Ionicons name="options-outline" size={20} color={Colors.white} style={{ marginRight: Spacing.xs }} />
                  <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.white }}>
                    Quote Builder
                  </Text>
                </View>
                <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.white, lineHeight: 18, opacity: 0.9 }}>
                  Control what is included in the quote (walls, ceilings, trim, floors, closets).
                </Text>
              </Pressable>

              {/* Client Proposal */}
              <Pressable
                onPress={() => navigation.navigate("ClientProposal", { projectId })}
                style={{
                  backgroundColor: "#10B981",
                  borderRadius: BorderRadius.default,
                  padding: Spacing.md,
                  ...Shadows.card,
                }}
                accessibilityRole="button"
                accessibilityLabel="Generate client proposal"
              >
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: Spacing.xs }}>
                  <Ionicons name="document-text-outline" size={20} color={Colors.white} style={{ marginRight: Spacing.xs }} />
                  <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.white }}>
                    Client Proposal
                  </Text>
                </View>
                <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.white, lineHeight: 18, opacity: 0.9 }}>
                  Create a client-facing proposal PDF or summary with selected items only.
                </Text>
              </Pressable>

              {/* Room Details (Test Export) - Only visible in Test Mode */}
              {appSettings.testMode && (
                <Pressable
                  onPress={handleExportRoomDetails}
                  style={{
                    backgroundColor: "#8B5CF6",
                    borderRadius: BorderRadius.default,
                    padding: Spacing.md,
                    ...Shadows.card,
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Export room details JSON"
                >
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: Spacing.xs }}>
                    <Ionicons name="code-download-outline" size={20} color={Colors.white} style={{ marginRight: Spacing.xs }} />
                    <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.white }}>
                      Room Details (Test Export)
                    </Text>
                  </View>
                  <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.white, lineHeight: 18, opacity: 0.9 }}>
                    Export detailed pricing breakdown as JSON for debugging (Test Mode only).
                  </Text>
                </Pressable>
              )}

              {/* Export Pricing & Calculation Settings (Test Mode Only) */}
              {appSettings.testMode && (
                <Pressable
                  onPress={handleExportSettings}
                  style={{
                    backgroundColor: "#10B981",
                    borderRadius: BorderRadius.default,
                    padding: Spacing.md,
                    ...Shadows.card,
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Export pricing and calculation settings"
                >
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: Spacing.xs }}>
                    <Ionicons name="settings-outline" size={20} color={Colors.white} style={{ marginRight: Spacing.xs }} />
                    <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.white }}>
                      Export Pricing & Calculation Settings
                    </Text>
                  </View>
                  <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.white, lineHeight: 18, opacity: 0.9 }}>
                    Export all pricing rates, labor costs, coverage rules, and calculation settings used by the estimator (Test Mode only).
                  </Text>
                </Pressable>
              )}

              {/* Export Calculation Trace (Test Mode Only) */}
              {appSettings.testMode && (
                <Pressable
                  onPress={handleExportCalculationTrace}
                  style={{
                    backgroundColor: "#F59E0B",
                    borderRadius: BorderRadius.default,
                    padding: Spacing.md,
                    ...Shadows.card,
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Export calculation trace"
                >
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: Spacing.xs }}>
                    <Ionicons name="calculator-outline" size={20} color={Colors.white} style={{ marginRight: Spacing.xs }} />
                    <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.white }}>
                      Export Calculation Trace
                    </Text>
                  </View>
                  <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.white, lineHeight: 18, opacity: 0.9 }}>
                    Export complete step-by-step math for each room, staircase, and fireplace showing all inputs, rates, and intermediate calculations (Test Mode only).
                  </Text>
                </Pressable>
              )}
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
