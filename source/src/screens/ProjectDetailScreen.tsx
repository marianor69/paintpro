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
import { formatPhoneNumber } from "../utils/phoneFormatter";
import { Staircase, Fireplace } from "../types/painting";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius, Shadows, TextInputStyles } from "../utils/designSystem";
import { Card } from "../components/Card";
import { Toggle } from "../components/Toggle";
import StepProgressIndicator from "../components/StepProgressIndicator";
import { calculateCurrentStep, getCompletedSteps } from "../utils/projectStepLogic";

type Props = NativeStackScreenProps<RootStackParamList, "ProjectDetail">;

export default function ProjectDetailScreen({ route, navigation }: Props) {
  const { projectId } = route.params;

  const project = useProjectStore((s) =>
    s.projects.find((p) => p.id === projectId)
  );
  const addRoom = useProjectStore((s) => s.addRoom);
  const addStaircase = useProjectStore((s) => s.addStaircase);
  const addFireplace = useProjectStore((s) => s.addFireplace);
  const addBuiltIn = useProjectStore((s) => s.addBuiltIn);
  const deleteRoom = useProjectStore((s) => s.deleteRoom);
  const deleteStaircase = useProjectStore((s) => s.deleteStaircase);
  const deleteFireplace = useProjectStore((s) => s.deleteFireplace);
  const deleteBuiltIn = useProjectStore((s) => s.deleteBuiltIn);
  const updateClientInfo = useProjectStore((s) => s.updateClientInfo);
  const pricing = usePricingStore();
  const appSettings = useAppSettings();
  const calculationSettings = useCalculationSettings((s) => s.settings);

  // State for editing client info
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editCountry, setEditCountry] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");

  // Wrap project loading and preprocessing
  let summary: ReturnType<typeof calculateFilteredProjectSummary> | null = null;
  let loadError: string | null = null;

  try {
    if (project) {
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

  const handleAddRoom = (floorNumber?: number) => {
    // Don't create room here - let RoomEditor create it on Save
    navigation.navigate("RoomEditor", { projectId, floor: floorNumber });
  };

  // Helper functions to check if items have actual data
  const hasStaircaseData = (staircase: Staircase): boolean => {
    return !!(
      staircase.riserCount > 0 ||
      staircase.handrailLength > 0 ||
      staircase.spindleCount > 0 ||
      (staircase.hasSecondaryStairwell && (staircase.tallWallHeight || staircase.shortWallHeight))
    );
  };

  const hasFireplaceData = (fireplace: Fireplace): boolean => {
    return !!(fireplace.width > 0 || fireplace.height > 0 || fireplace.depth > 0 || fireplace.trimLinearFeet);
  };

  const handleAddStaircase = () => {
    // Don't create staircase here - let StaircaseEditor create it on Save
    navigation.navigate("StaircaseEditor", { projectId });
  };

  const handleAddFireplace = () => {
    // Don't create fireplace here - let FireplaceEditor create it on Save
    navigation.navigate("FireplaceEditor", { projectId });
  };

  const handleAddBuiltIn = () => {
    // Don't create built-in here - let BuiltInEditor create it on Save
    navigation.navigate("BuiltInEditor", { projectId });
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
          singleClosetTrimWidth: calculationSettings.singleClosetTrimWidth,
          singleClosetBaseboardPerimeter: calculationSettings.singleClosetBaseboardPerimeter || 88,
          doubleClosetWidth: calculationSettings.doubleClosetWidth,
          doubleClosetTrimWidth: calculationSettings.doubleClosetTrimWidth,
          doubleClosetBaseboardPerimeter: calculationSettings.doubleClosetBaseboardPerimeter || 112,
          closetCavityDepth: calculationSettings.closetCavityDepth || 2,

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
            singleClosetTrimWidth: calculationSettings.singleClosetTrimWidth,
            singleClosetBaseboardPerimeter: calculationSettings.singleClosetBaseboardPerimeter || 88,
            doubleClosetWidth: calculationSettings.doubleClosetWidth,
            doubleClosetTrimWidth: calculationSettings.doubleClosetTrimWidth,
            doubleClosetBaseboardPerimeter: calculationSettings.doubleClosetBaseboardPerimeter || 112,
            baseboardWidth: calculationSettings.baseboardWidth,
            crownMouldingWidth: calculationSettings.crownMouldingWidth,
            closetCavityDepth: calculationSettings.closetCavityDepth || 2,
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

  // Step progress tracking
  const currentStep = calculateCurrentStep(project);
  const completedSteps = getCompletedSteps(project);

  const handleStepPress = (step: 1 | 2 | 3) => {
    if (step === 1) {
      navigation.navigate("ProjectSetup", { projectId: project.id });
    } else if (step === 3 && completedSteps.includes(2)) {
      navigation.navigate("ClientProposal", { projectId: project.id });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.backgroundWarmGray }} edges={["bottom"]}>
      {/* Step Progress Indicator */}
      <StepProgressIndicator
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepPress={handleStepPress}
        disabledSteps={completedSteps.includes(2) ? [] : [3]}
      />
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
            {isEditingClient ? (
              <>
                {/* Edit Mode */}
                <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.darkCharcoal, marginBottom: Spacing.md }}>
                  Edit Client Details
                </Text>

                <View style={{ marginBottom: Spacing.md }}>
                  <Text style={{ fontSize: Typography.caption.fontSize, fontWeight: "500" as any, color: Colors.mediumGray, marginBottom: Spacing.xs }}>
                    Client Name
                  </Text>
                  <View style={TextInputStyles.container}>
                    <TextInput
                      value={editName}
                      onChangeText={setEditName}
                      placeholder="Client name"
                      placeholderTextColor={Colors.mediumGray}
                      style={TextInputStyles.base}
                    />
                  </View>
                </View>

                <View style={{ marginBottom: Spacing.md }}>
                  <Text style={{ fontSize: Typography.caption.fontSize, fontWeight: "500" as any, color: Colors.mediumGray, marginBottom: Spacing.xs }}>
                    Address
                  </Text>
                  <View style={TextInputStyles.container}>
                    <TextInput
                      value={editAddress}
                      onChangeText={setEditAddress}
                      placeholder="Address"
                      placeholderTextColor={Colors.mediumGray}
                      style={TextInputStyles.base}
                    />
                  </View>
                </View>

                <View style={{ marginBottom: Spacing.md }}>
                  <Text style={{ fontSize: Typography.caption.fontSize, fontWeight: "500" as any, color: Colors.mediumGray, marginBottom: Spacing.xs }}>
                    City
                  </Text>
                  <View style={TextInputStyles.container}>
                    <TextInput
                      value={editCity}
                      onChangeText={setEditCity}
                      placeholder="City"
                      placeholderTextColor={Colors.mediumGray}
                      style={TextInputStyles.base}
                    />
                  </View>
                </View>

                <View style={{ marginBottom: Spacing.md }}>
                  <Text style={{ fontSize: Typography.caption.fontSize, fontWeight: "500" as any, color: Colors.mediumGray, marginBottom: Spacing.xs }}>
                    Country
                  </Text>
                  <View style={TextInputStyles.container}>
                    <TextInput
                      value={editCountry}
                      onChangeText={setEditCountry}
                      placeholder="Country"
                      placeholderTextColor={Colors.mediumGray}
                      style={TextInputStyles.base}
                    />
                  </View>
                </View>

                <View style={{ marginBottom: Spacing.md }}>
                  <Text style={{ fontSize: Typography.caption.fontSize, fontWeight: "500" as any, color: Colors.mediumGray, marginBottom: Spacing.xs }}>
                    Phone
                  </Text>
                  <View style={TextInputStyles.container}>
                    <TextInput
                      value={editPhone}
                      onChangeText={setEditPhone}
                      placeholder="Phone number"
                      placeholderTextColor={Colors.mediumGray}
                      keyboardType="phone-pad"
                      style={TextInputStyles.base}
                    />
                  </View>
                </View>

                <View style={{ marginBottom: Spacing.md }}>
                  <Text style={{ fontSize: Typography.caption.fontSize, fontWeight: "500" as any, color: Colors.mediumGray, marginBottom: Spacing.xs }}>
                    Email
                  </Text>
                  <View style={TextInputStyles.container}>
                    <TextInput
                      value={editEmail}
                      onChangeText={setEditEmail}
                      placeholder="Email address"
                      placeholderTextColor={Colors.mediumGray}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      style={TextInputStyles.base}
                    />
                  </View>
                </View>

                <View style={{ flexDirection: "row", gap: Spacing.sm }}>
                  <Pressable
                    onPress={() => setIsEditingClient(false)}
                    style={{
                      flex: 1,
                      backgroundColor: Colors.white,
                      borderWidth: 1,
                      borderColor: Colors.neutralGray,
                      borderRadius: BorderRadius.default,
                      paddingVertical: Spacing.sm,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal }}>
                      Cancel
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      updateClientInfo(projectId, {
                        name: editName.trim() || "Unnamed Client",
                        address: editAddress.trim(),
                        city: editCity.trim(),
                        country: editCountry.trim(),
                        phone: editPhone.trim(),
                        email: editEmail.trim(),
                      });
                      setIsEditingClient(false);
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: Colors.primaryBlue,
                      borderRadius: BorderRadius.default,
                      paddingVertical: Spacing.sm,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.white }}>
                      Save
                    </Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                {/* View Mode */}
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: Typography.h1.fontSize, fontWeight: Typography.h1.fontWeight as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                      {project.clientInfo.name}
                    </Text>
                    <Text style={{ fontSize: Typography.body.fontSize, color: Colors.mediumGray, marginBottom: Spacing.xs }}>
                      {project.clientInfo.address}
                    </Text>
                    {project.clientInfo.phone && (
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                        {formatPhoneNumber(project.clientInfo.phone, project.clientInfo.country)}
                      </Text>
                    )}
                    {project.clientInfo.email && (
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                        {project.clientInfo.email}
                      </Text>
                    )}
                  </View>
                  <Pressable
                    onPress={() => {
                      setEditName(project.clientInfo.name);
                      setEditAddress(project.clientInfo.address);
                      setEditCity(project.clientInfo.city || "");
                      setEditCountry(project.clientInfo.country || "");
                      setEditPhone(project.clientInfo.phone || "");
                      setEditEmail(project.clientInfo.email || "");
                      setIsEditingClient(true);
                    }}
                    style={{
                      padding: Spacing.sm,
                    }}
                  >
                    <Ionicons name="pencil" size={20} color={Colors.primaryBlue} />
                  </Pressable>
                </View>

                {/* Total Estimate */}
                <View style={{ marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.neutralGray }}>
                  <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.xs }}>
                    Total Estimate
                  </Text>
                  <Text style={{ fontSize: 32, fontWeight: "700" as any, color: Colors.primaryBlue }}>
                    {formatCurrency(displaySummary.grandTotal)}
                  </Text>
                </View>
              </>
            )}
          </Card>

          {/* Floors & Heights - Navigate to ProjectSetup */}
          <Card style={{ marginBottom: Spacing.md }}>
            <Pressable
              onPress={() => navigation.navigate("ProjectSetup", { projectId })}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: Spacing.sm,
              }}
              accessibilityRole="button"
              accessibilityLabel="Configure project setup"
              accessibilityHint="Opens floor heights and paint defaults configuration"
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                  Project Setup
                </Text>
                <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                  Configure floors, heights & paint defaults
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={Colors.primaryBlue} />
            </Pressable>
          </Card>

          {/* Rooms & Structural Elements Section */}
          {project.rooms.length > 0 && (
            <Card style={{ marginBottom: Spacing.md }}>
              <View style={{ marginBottom: Spacing.md }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.sm }}>
                  <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500" as any, color: Colors.darkCharcoal }}>
                    Rooms: {project.rooms.length}
                  </Text>
                  {(safeNumber(project.floorCount, project.hasTwoFloors ? 2 : 1) === 1) ? (
                    <Pressable
                      onPress={() => handleAddRoom(1)}
                      style={{
                        backgroundColor: Colors.primaryBlue,
                        borderRadius: 8,
                        paddingHorizontal: Spacing.md,
                        paddingVertical: 6,
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Add room"
                    >
                      <Text style={{ fontSize: Typography.caption.fontSize, fontWeight: "600" as any, color: Colors.white }}>
                        Add
                      </Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      onPress={() => {
                        // Show floor selection modal or dropdown
                        const floorCount = safeNumber(project.floorCount, project.hasTwoFloors ? 2 : 1);
                        Alert.alert("Select Floor", "Choose which floor to add the room to:", [
                          ...Array.from({ length: floorCount }, (_, i) => ({
                            text: `${getOrdinal(i + 1)} Floor`,
                            onPress: () => handleAddRoom(i + 1),
                          })),
                          { text: "Cancel", style: "cancel" },
                        ]);
                      }}
                      style={{
                        backgroundColor: Colors.primaryBlue,
                        borderRadius: 8,
                        paddingHorizontal: Spacing.md,
                        paddingVertical: 6,
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Add room"
                    >
                      <Text style={{ fontSize: Typography.caption.fontSize, fontWeight: "600" as any, color: Colors.white }}>
                        Add
                      </Text>
                    </Pressable>
                  )}
                </View>
                {project.rooms.map((room, idx) => (
                  <Pressable
                    key={room.id}
                    onPress={() =>
                      navigation.navigate("RoomEditor", {
                        projectId,
                        roomId: room.id,
                        roomName: room.name || "Unnamed Room",
                      })
                    }
                    onLongPress={() => {
                      Alert.alert("Delete Room", `Are you sure you want to delete "${room.name || "Unnamed Room"}"?`, [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Delete",
                          style: "destructive",
                          onPress: () => deleteRoom(projectId, room.id),
                        },
                      ]);
                    }}
                    style={{
                      backgroundColor: Colors.white,
                      borderRadius: BorderRadius.default,
                      padding: Spacing.sm,
                      marginBottom: idx < project.rooms.length - 1 ? Spacing.xs : 0,
                      borderWidth: 1,
                      borderColor: Colors.neutralGray,
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Edit room ${room.name || "Unnamed Room"}`}
                  >
                    <View>
                      <Text style={{ fontSize: Typography.body.fontSize, color: Colors.darkCharcoal, fontWeight: "600" as any }}>
                        {room.name || "Unnamed Room"}
                      </Text>
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginTop: 2 }}>
                        {getOrdinal(room.floor || 1)} floor
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={Colors.mediumGray} />
                  </Pressable>
                ))}
              </View>
            </Card>
          )}

          {/* Add Room button if none exist */}
          {project.rooms.length === 0 && (
            <Card style={{ marginBottom: Spacing.md }}>
              <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.darkCharcoal, marginBottom: Spacing.md }}>
                Rooms
              </Text>
              <View style={{ gap: Spacing.sm }}>
                {(safeNumber(project.floorCount, project.hasTwoFloors ? 2 : 1) === 1) ? (
                  <Pressable
                    onPress={() => handleAddRoom(1)}
                    style={{
                      backgroundColor: Colors.white,
                      borderRadius: BorderRadius.default,
                      borderWidth: 1,
                      borderColor: Colors.neutralGray,
                      paddingVertical: Spacing.md,
                      alignItems: "center",
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Add room"
                  >
                    <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.primaryBlue }}>
                      Add Room
                    </Text>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={() => {
                      const floorCount = safeNumber(project.floorCount, project.hasTwoFloors ? 2 : 1);
                      Alert.alert("Select Floor", "Choose which floor to add the room to:", [
                        ...Array.from({ length: floorCount }, (_, i) => ({
                          text: `${getOrdinal(i + 1)} Floor`,
                          onPress: () => handleAddRoom(i + 1),
                        })),
                        { text: "Cancel", style: "cancel" },
                      ]);
                    }}
                    style={{
                      backgroundColor: Colors.white,
                      borderRadius: BorderRadius.default,
                      borderWidth: 1,
                      borderColor: Colors.neutralGray,
                      paddingVertical: Spacing.md,
                      alignItems: "center",
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Add room"
                  >
                    <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.primaryBlue }}>
                      Add Room
                    </Text>
                  </Pressable>
                )}
              </View>
            </Card>
          )}

          {/* Staircases & Fireplaces - CONSOLIDATED (no flicker) */}
          <Card style={{ marginBottom: Spacing.md }}>
            <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.darkCharcoal, marginBottom: Spacing.md }}>
              Staircases & Fireplaces
            </Text>

            <View style={{ gap: Spacing.md }}>
              {/* STAIRCASES SECTION */}
              <View>
                {project.staircases && project.staircases.length > 0 ? (
                  <>
                    {/* Header with count and Add button */}
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

                    {/* Staircases list */}
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
                  </>
                ) : (
                  /* Empty state: Show Add Staircase button */
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
              </View>

              {/* FIREPLACES SECTION */}
              <View>
                {project.fireplaces && project.fireplaces.length > 0 ? (
                  <>
                    {/* Header with count and Add button */}
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

                    {/* Fireplaces list */}
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
                  </>
                ) : (
                  /* Empty state: Show Add Fireplace button */
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
            </View>
          </Card>

          {/* Built-Ins Section */}
          {(project.builtIns && project.builtIns.length > 0) && (
            <Card style={{ marginBottom: Spacing.md }}>
              <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.darkCharcoal, marginBottom: Spacing.md }}>
                Built-Ins
              </Text>

              <View style={{ marginBottom: 0 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.sm }}>
                  <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500" as any, color: Colors.darkCharcoal }}>
                    Built-Ins: {project.builtIns.length}
                  </Text>
                  <Pressable
                    onPress={handleAddBuiltIn}
                    style={{
                      backgroundColor: Colors.primaryBlue,
                      borderRadius: 8,
                      paddingHorizontal: Spacing.md,
                      paddingVertical: 6,
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Add built-in"
                  >
                    <Text style={{ fontSize: Typography.caption.fontSize, fontWeight: "600" as any, color: Colors.white }}>
                      Add
                    </Text>
                  </Pressable>
                </View>
                {project.builtIns.map((builtIn, idx) => (
                  <Pressable
                    key={builtIn.id}
                    onPress={handleAddBuiltIn}
                    onLongPress={() => {
                      Alert.alert("Delete Built-In", `Are you sure you want to delete "${builtIn.name || "Unnamed Built-In"}"?`, [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Delete",
                          style: "destructive",
                          onPress: () => deleteBuiltIn(projectId, builtIn.id),
                        },
                      ]);
                    }}
                    style={{
                      backgroundColor: Colors.white,
                      borderRadius: BorderRadius.default,
                      padding: Spacing.sm,
                      marginBottom: idx < (project.builtIns?.length || 0) - 1 ? Spacing.xs : 0,
                      borderWidth: 1,
                      borderColor: Colors.neutralGray,
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Edit built-in ${builtIn.name || "Unnamed Built-In"}`}
                  >
                    <Text style={{ fontSize: Typography.body.fontSize, color: Colors.darkCharcoal }}>
                      {builtIn.name || "Unnamed Built-In"}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={Colors.mediumGray} />
                  </Pressable>
                ))}
              </View>
            </Card>
          )}

          {/* Add Built-In button if none exist */}
          {(!project.builtIns || project.builtIns.length === 0) && (
            <Card style={{ marginBottom: Spacing.md }}>
              <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.darkCharcoal, marginBottom: Spacing.md }}>
                Built-Ins
              </Text>
              <Pressable
                onPress={handleAddBuiltIn}
                style={{
                  backgroundColor: Colors.white,
                  borderRadius: BorderRadius.default,
                  borderWidth: 1,
                  borderColor: Colors.neutralGray,
                  paddingVertical: Spacing.md,
                  alignItems: "center",
                }}
                accessibilityRole="button"
                accessibilityLabel="Add built-in"
              >
                <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.primaryBlue }}>
                  Add Built-In
                </Text>
              </Pressable>
            </Card>
          )}
          <Card>
            <Pressable
              onPress={() => navigation.navigate("ProjectActions", { projectId })}
              style={{
                backgroundColor: Colors.primaryBlue,
                borderRadius: BorderRadius.default,
                padding: Spacing.md,
                ...Shadows.card,
              }}
              accessibilityRole="button"
              accessibilityLabel="Open project actions"
            >
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: Spacing.xs }}>
                <Ionicons name="settings-outline" size={20} color={Colors.white} style={{ marginRight: Spacing.xs }} />
                <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.white }}>
                  Project Actions
                </Text>
              </View>
              <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.white, lineHeight: 18, opacity: 0.9 }}>
                Tools for quoting, materials, and client proposals
              </Text>
            </Pressable>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
