import React from "react";
import { View, Text, Pressable, ScrollView, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { useProjectStore } from "../state/projectStore";
import { usePricingStore } from "../state/pricingStore";
import { useAppSettings } from "../state/appSettings";
import { useCalculationSettings } from "../state/calculationStore";
import { calculateFilteredProjectSummary, formatCurrency, safeNumber, getDefaultQuoteBuilder } from "../utils/calculations";
import { computeRoomPricingSummary, computeStaircasePricingSummary, computeFireplacePricingSummary } from "../utils/pricingSummary";
import { formatMeasurement } from "../utils/unitConversion";
import { Staircase, Fireplace } from "../types/painting";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius, Shadows } from "../utils/designSystem";
import { Card } from "../components/Card";
import StepProgressIndicator from "../components/StepProgressIndicator";
import { calculateCurrentStep, getCompletedSteps, canCompleteStep2 } from "../utils/projectStepLogic";

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
  const setEstimateBuildComplete = useProjectStore((s) => s.setEstimateBuildComplete);
  const pricing = usePricingStore();
  const appSettings = useAppSettings();
  const calculationSettings = useCalculationSettings((s) => s.settings);


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
  const canMarkStep2Complete = canCompleteStep2(project);

  const handleStepPress = (step: 1 | 2 | 3) => {
    if (step === 1) {
      navigation.navigate("ProjectSetup", { projectId: project.id });
    } else if (step === 3 && completedSteps.includes(2)) {
      navigation.navigate("ClientProposal", { projectId: project.id });
    }
  };

  // Mark estimate as complete (stays on this screen to review)
  const handleDoneBuilding = () => {
    setEstimateBuildComplete(project.id, true);
    // Don't navigate - let user review on this screen first
  };

  // Reopen estimate for editing (if user wants to add more items)
  const handleReopenEstimate = () => {
    setEstimateBuildComplete(project.id, false);
  };

  // Calculate running stats for display
  const roomCount = project.rooms?.length || 0;
  const staircaseCount = project.staircases?.length || 0;
  const fireplaceCount = project.fireplaces?.length || 0;
  const builtInCount = project.builtIns?.length || 0;
  const totalItems = roomCount + staircaseCount + fireplaceCount + builtInCount;

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
          {/* Running Estimate Summary */}
          <Card style={{ marginBottom: Spacing.md }}>
            {/* Total Estimate - Large and Prominent */}
            <View style={{ alignItems: "center", marginBottom: Spacing.md }}>
              <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.xs }}>
                Running Estimate
              </Text>
              <Text style={{ fontSize: 36, fontWeight: "700" as any, color: Colors.primaryBlue }}>
                {formatCurrency(displaySummary.grandTotal)}
              </Text>

              {/* DEBUG INFO - ST-001 & FP-002 */}
              {appSettings.testMode && (() => {
                const activeQuote = project.quotes?.find(q => q.id === project.activeQuoteId);
                const qb = activeQuote?.quoteBuilder || project.quoteBuilder || getDefaultQuoteBuilder();
                return (
                  <View style={{ marginTop: Spacing.md, padding: Spacing.md, backgroundColor: Colors.backgroundWarmGray, borderRadius: BorderRadius.default }}>
                    <Text style={{ fontSize: 16, fontWeight: "700", color: Colors.error, marginBottom: Spacing.sm }}>
                      DEBUG: Aggregation
                    </Text>
                    <Text style={{ fontSize: 14, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                      Staircases: {(project.staircases || []).length}
                    </Text>
                    <Text style={{ fontSize: 14, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                      Fireplaces: {(project.fireplaces || []).length}
                    </Text>
                    <Text style={{ fontSize: 14, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                      Items in total: {(displaySummary.itemizedPrices || []).length}
                    </Text>
                    <Text style={{ fontSize: 14, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                      Items: {(displaySummary.itemizedPrices || []).map(p => `${p.name}=$${p.price}`).join(", ") || "none"}
                    </Text>
                    <Text style={{ fontSize: 14, color: Colors.primaryBlue, marginTop: Spacing.xs, fontWeight: "700" }}>
                      QB Flags:
                    </Text>
                    <Text style={{ fontSize: 14, color: Colors.darkCharcoal }}>
                      includeStaircases: {String(qb.includeStaircases)}
                    </Text>
                    <Text style={{ fontSize: 14, color: Colors.darkCharcoal }}>
                      includeFireplaces: {String(qb.includeFireplaces)}
                    </Text>
                    <Text style={{ fontSize: 14, color: Colors.darkCharcoal }}>
                      Test: !== false = {String(qb.includeStaircases !== false)}
                    </Text>
                  </View>
                );
              })()}
            </View>

            {/* Running Stats Grid */}
            <View style={{
              flexDirection: "row",
              flexWrap: "wrap",
              borderTopWidth: 1,
              borderTopColor: Colors.neutralGray,
              paddingTop: Spacing.md,
            }}>
              {/* Rooms */}
              <View style={{ width: "50%", marginBottom: Spacing.sm }}>
                <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>Rooms</Text>
                <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal }}>
                  {roomCount}
                </Text>
              </View>

              {/* Wall Area */}
              <View style={{ width: "50%", marginBottom: Spacing.sm }}>
                <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>Wall Area</Text>
                <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal }}>
                  {formatMeasurement(displaySummary.totalWallSqFt || 0, 'area', appSettings.unitSystem)}
                </Text>
              </View>

              {/* Doors */}
              <View style={{ width: "50%", marginBottom: Spacing.sm }}>
                <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>Doors</Text>
                <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal }}>
                  {displaySummary.totalDoors || 0}
                </Text>
              </View>

              {/* Windows */}
              <View style={{ width: "50%" }}>
                <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>Windows</Text>
                <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal }}>
                  {displaySummary.totalWindows || 0}
                </Text>
              </View>
            </View>

            {/* Labor & Materials breakdown */}
            <View style={{
              flexDirection: "row",
              borderTopWidth: 1,
              borderTopColor: Colors.neutralGray,
              paddingTop: Spacing.md,
              marginTop: Spacing.sm,
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>Labor</Text>
                <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal }}>
                  {formatCurrency(displaySummary.totalLaborCost || 0)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>Materials</Text>
                <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal }}>
                  {formatCurrency(displaySummary.totalMaterialCost || 0)}
                </Text>
              </View>
            </View>
          </Card>

          {/* Rooms and Structures - Combined */}
          <Card style={{ marginBottom: Spacing.md }}>
            <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.darkCharcoal, marginBottom: Spacing.md }}>
              Rooms and Structures
            </Text>

            <View style={{ gap: Spacing.md }}>
              {/* ROOMS SECTION */}
              <View>
                {project.rooms && project.rooms.length > 0 ? (
                  <>
                    {/* Header with count and Add button */}
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

                    {/* Rooms list */}
                    {project.rooms.map((room, idx) => (
                      <View
                        key={room.id}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: Spacing.sm,
                          marginBottom: idx < project.rooms.length - 1 ? Spacing.xs : 0,
                        }}
                      >
                        <Pressable
                          onPress={() =>
                            navigation.navigate("RoomEditor", {
                              projectId,
                              roomId: room.id,
                              roomName: room.name || "Unnamed Room",
                            })
                          }
                          style={{
                            flex: 1,
                            backgroundColor: Colors.white,
                            borderRadius: BorderRadius.default,
                            padding: Spacing.sm,
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
                        <Pressable
                          onPress={() => {
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
                            padding: Spacing.sm,
                            backgroundColor: Colors.backgroundWarmGray,
                            borderRadius: BorderRadius.default,
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={`Delete room ${room.name || "Unnamed Room"}`}
                        >
                          <Ionicons name="trash-outline" size={20} color={Colors.error} />
                        </Pressable>
                      </View>
                    ))}
                  </>
                ) : (
                  /* Empty state: Show Add Room button */
                  <>
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
                  </>
                )}
              </View>

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
                      <View
                        key={staircase.id}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: Spacing.sm,
                          marginBottom: idx < project.staircases.length - 1 ? Spacing.xs : 0,
                        }}
                      >
                        <Pressable
                          onPress={() =>
                            navigation.navigate("StaircaseEditor", {
                              projectId,
                              staircaseId: staircase.id,
                            })
                          }
                          style={{
                            flex: 1,
                            backgroundColor: Colors.white,
                            borderRadius: BorderRadius.default,
                            padding: Spacing.sm,
                            borderWidth: 1,
                            borderColor: Colors.neutralGray,
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={`Edit staircase ${staircase.name || `Staircase ${idx + 1}`}`}
                        >
                          <Text style={{ fontSize: Typography.body.fontSize, color: Colors.darkCharcoal }}>
                            {staircase.name || `Staircase ${idx + 1}`}
                          </Text>
                          <Ionicons name="chevron-forward" size={16} color={Colors.mediumGray} />
                        </Pressable>
                        <Pressable
                          onPress={() => {
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
                            padding: Spacing.sm,
                            backgroundColor: Colors.backgroundWarmGray,
                            borderRadius: BorderRadius.default,
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={`Delete staircase ${staircase.name || `Staircase ${idx + 1}`}`}
                        >
                          <Ionicons name="trash-outline" size={20} color={Colors.error} />
                        </Pressable>
                      </View>
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
                      <View
                        key={fireplace.id}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: Spacing.sm,
                          marginBottom: idx < project.fireplaces.length - 1 ? Spacing.xs : 0,
                        }}
                      >
                        <Pressable
                          onPress={() =>
                            navigation.navigate("FireplaceEditor", {
                              projectId,
                              fireplaceId: fireplace.id,
                            })
                          }
                          style={{
                            flex: 1,
                            backgroundColor: Colors.white,
                            borderRadius: BorderRadius.default,
                            padding: Spacing.sm,
                            borderWidth: 1,
                            borderColor: Colors.neutralGray,
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={`Edit fireplace ${fireplace.name || `Fireplace ${idx + 1}`}`}
                        >
                          <Text style={{ fontSize: Typography.body.fontSize, color: Colors.darkCharcoal }}>
                            {fireplace.name || `Fireplace ${idx + 1}`}
                          </Text>
                          <Ionicons name="chevron-forward" size={16} color={Colors.mediumGray} />
                        </Pressable>
                        <Pressable
                          onPress={() => {
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
                            padding: Spacing.sm,
                            backgroundColor: Colors.backgroundWarmGray,
                            borderRadius: BorderRadius.default,
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={`Delete fireplace ${fireplace.name || `Fireplace ${idx + 1}`}`}
                        >
                          <Ionicons name="trash-outline" size={20} color={Colors.error} />
                        </Pressable>
                      </View>
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

              {/* BUILT-INS SECTION */}
              <View>
                {project.builtIns && project.builtIns.length > 0 ? (
                  <>
                    {/* Header with count and Add button */}
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

                    {/* Built-Ins list */}
                    {project.builtIns.map((builtIn, idx) => (
                      <View
                        key={builtIn.id}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: Spacing.sm,
                          marginBottom: idx < project.builtIns.length - 1 ? Spacing.xs : 0,
                        }}
                      >
                        <Pressable
                          onPress={() =>
                            navigation.navigate("BuiltInEditor", {
                              projectId,
                              builtInId: builtIn.id,
                            })
                          }
                          style={{
                            flex: 1,
                            backgroundColor: Colors.white,
                            borderRadius: BorderRadius.default,
                            padding: Spacing.sm,
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
                        <Pressable
                          onPress={() => {
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
                            padding: Spacing.sm,
                            backgroundColor: Colors.backgroundWarmGray,
                            borderRadius: BorderRadius.default,
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={`Delete built-in ${builtIn.name || "Unnamed Built-In"}`}
                        >
                          <Ionicons name="trash-outline" size={20} color={Colors.error} />
                        </Pressable>
                      </View>
                    ))}
                  </>
                ) : (
                  /* Empty state: Show Add Built-In button */
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
                )}
              </View>
            </View>
          </Card>
          {/* Show hint if no items yet */}
          {!canMarkStep2Complete && (
            <Card style={{ marginBottom: Spacing.md, backgroundColor: Colors.neutralGray + "40" }}>
              <View style={{ alignItems: "center", padding: Spacing.md }}>
                <Ionicons name="information-circle-outline" size={32} color={Colors.mediumGray} />
                <Text style={{ fontSize: Typography.body.fontSize, color: Colors.mediumGray, textAlign: "center", marginTop: Spacing.sm }}>
                  Add at least one room, staircase, fireplace, or built-in to complete your estimate
                </Text>
              </View>
            </Card>
          )}

          {/* Done Building Estimate Button - Only show when items exist and not already complete */}
          {canMarkStep2Complete && !project.estimateBuildComplete && (
            <Card style={{ marginBottom: Spacing.md }}>
              <Pressable
                onPress={handleDoneBuilding}
                style={{
                  backgroundColor: Colors.success,
                  borderRadius: BorderRadius.default,
                  padding: Spacing.lg,
                  alignItems: "center",
                  ...Shadows.card,
                }}
                accessibilityRole="button"
                accessibilityLabel="Done building estimate"
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="checkmark-circle" size={24} color={Colors.white} style={{ marginRight: Spacing.sm }} />
                  <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: "700" as any, color: Colors.white }}>
                    Done Building Estimate
                  </Text>
                </View>
                <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.white, marginTop: Spacing.xs, opacity: 0.9 }}>
                  Review your estimate before sending
                </Text>
              </Pressable>
            </Card>
          )}

          {/* ESTIMATE COMPLETE - Show Review Section */}
          {project.estimateBuildComplete && (
            <>
              {/* Review Summary Card */}
              <Card style={{ marginBottom: Spacing.md, borderWidth: 2, borderColor: Colors.success }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: Spacing.md }}>
                  <Ionicons name="checkmark-circle" size={24} color={Colors.success} style={{ marginRight: Spacing.sm }} />
                  <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: "700" as any, color: Colors.success }}>
                    Estimate Complete
                  </Text>
                </View>

                {/* Items Summary */}
                <View style={{ marginBottom: Spacing.md }}>
                  <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal, marginBottom: Spacing.sm }}>
                    Items Included:
                  </Text>

                  {roomCount > 0 && (
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: Spacing.xs }}>
                      <Ionicons name="bed-outline" size={16} color={Colors.mediumGray} style={{ marginRight: Spacing.xs }} />
                      <Text style={{ fontSize: Typography.body.fontSize, color: Colors.darkCharcoal }}>
                        {roomCount} {roomCount === 1 ? "Room" : "Rooms"}
                      </Text>
                    </View>
                  )}

                  {staircaseCount > 0 && (
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: Spacing.xs }}>
                      <Ionicons name="arrow-up-outline" size={16} color={Colors.mediumGray} style={{ marginRight: Spacing.xs }} />
                      <Text style={{ fontSize: Typography.body.fontSize, color: Colors.darkCharcoal }}>
                        {staircaseCount} {staircaseCount === 1 ? "Staircase" : "Staircases"}
                      </Text>
                    </View>
                  )}

                  {fireplaceCount > 0 && (
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: Spacing.xs }}>
                      <Ionicons name="flame-outline" size={16} color={Colors.mediumGray} style={{ marginRight: Spacing.xs }} />
                      <Text style={{ fontSize: Typography.body.fontSize, color: Colors.darkCharcoal }}>
                        {fireplaceCount} {fireplaceCount === 1 ? "Fireplace" : "Fireplaces"}
                      </Text>
                    </View>
                  )}

                  {builtInCount > 0 && (
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: Spacing.xs }}>
                      <Ionicons name="cube-outline" size={16} color={Colors.mediumGray} style={{ marginRight: Spacing.xs }} />
                      <Text style={{ fontSize: Typography.body.fontSize, color: Colors.darkCharcoal }}>
                        {builtInCount} {builtInCount === 1 ? "Built-In" : "Built-Ins"}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Price Summary */}
                <View style={{ backgroundColor: Colors.backgroundWarmGray, borderRadius: BorderRadius.default, padding: Spacing.md, marginBottom: Spacing.md }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xs }}>
                    <Text style={{ fontSize: Typography.body.fontSize, color: Colors.mediumGray }}>Labor</Text>
                    <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal }}>
                      {formatCurrency(displaySummary.totalLaborCost || 0)}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.sm }}>
                    <Text style={{ fontSize: Typography.body.fontSize, color: Colors.mediumGray }}>Materials</Text>
                    <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal }}>
                      {formatCurrency(displaySummary.totalMaterialCost || 0)}
                    </Text>
                  </View>
                  <View style={{ borderTopWidth: 1, borderTopColor: Colors.neutralGray, paddingTop: Spacing.sm, flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: "700" as any, color: Colors.darkCharcoal }}>Total</Text>
                    <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: "700" as any, color: Colors.primaryBlue }}>
                      {formatCurrency(displaySummary.grandTotal)}
                    </Text>
                  </View>
                </View>

                {/* Edit Estimate Button */}
                <Pressable
                  onPress={handleReopenEstimate}
                  style={{
                    backgroundColor: Colors.white,
                    borderWidth: 1,
                    borderColor: Colors.neutralGray,
                    borderRadius: BorderRadius.default,
                    paddingVertical: Spacing.sm,
                    alignItems: "center",
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Edit estimate"
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons name="pencil-outline" size={18} color={Colors.darkCharcoal} style={{ marginRight: Spacing.xs }} />
                    <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal }}>
                      Edit Estimate
                    </Text>
                  </View>
                </Pressable>
              </Card>

              {/* Send to Client Button */}
              <Card style={{ marginBottom: Spacing.md }}>
                <Pressable
                  onPress={() => navigation.navigate("ClientProposal", { projectId: project.id })}
                  style={{
                    backgroundColor: Colors.primaryBlue,
                    borderRadius: BorderRadius.default,
                    padding: Spacing.lg,
                    alignItems: "center",
                    ...Shadows.card,
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Send to client"
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons name="send" size={24} color={Colors.white} style={{ marginRight: Spacing.sm }} />
                    <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: "700" as any, color: Colors.white }}>
                      Send to Client
                    </Text>
                  </View>
                  <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.white, marginTop: Spacing.xs, opacity: 0.9 }}>
                    Generate and share proposal
                  </Text>
                </Pressable>
              </Card>
            </>
          )}

          {/* Project Actions - Only show when NOT in complete state (avoid redundancy) */}
          {!project.estimateBuildComplete && (
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
                  Customize quote, view materials
                </Text>
              </Pressable>
            </Card>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
