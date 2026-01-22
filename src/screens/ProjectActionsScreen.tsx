import React from "react";
import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { useProjectStore } from "../state/projectStore";
import { usePricingStore } from "../state/pricingStore";
import { useAppSettings } from "../state/appSettings";
import { useCalculationSettings } from "../state/calculationStore";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius, Shadows } from "../utils/designSystem";
import { Card } from "../components/Card";
import { computeRoomPricingSummary, computeStaircasePricingSummary, computeFireplacePricingSummary } from "../utils/pricingSummary";
import { getDefaultQuoteBuilder, safeNumber } from "../utils/calculations";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

type Props = NativeStackScreenProps<RootStackParamList, "ProjectActions">;

export default function ProjectActionsScreen({ route, navigation }: Props) {
  const { projectId } = route.params;

  const project = useProjectStore((s) =>
    s.projects.find((p) => p.id === projectId)
  );
  const appSettings = useAppSettings();
  const pricing = usePricingStore();
  const calculationSettings = useCalculationSettings((s) => s.settings);
  const [infoModalVisible, setInfoModalVisible] = React.useState(false);
  const [infoModalTitle, setInfoModalTitle] = React.useState("");
  const [infoModalBody, setInfoModalBody] = React.useState("");

  const openInfoModal = (title: string, body: string) => {
    setInfoModalTitle(title);
    setInfoModalBody(body);
    setInfoModalVisible(true);
  };

  const handleExportRoomDetails = async () => {
    try {
      const quoteBuilder = project.quoteBuilder || getDefaultQuoteBuilder();

      const roomSummaries = project.rooms.map((room) =>
        computeRoomPricingSummary(
          room,
          quoteBuilder,
          pricing,
          undefined,
          project.projectIncludeClosetInteriorInQuote
        )
      );

      const bathroomSummaries = (project.bathrooms || []).map((bathroom) =>
        computeRoomPricingSummary(
          { ...bathroom, isBathroom: true } as any,
          quoteBuilder,
          pricing,
          undefined,
          project.projectIncludeClosetInteriorInQuote
        )
      );

      const staircaseSummaries = (project.staircases || []).map((stair) =>
        computeStaircasePricingSummary(stair, pricing, undefined)
      );

      const fireplaceSummaries = (project.fireplaces || []).map((fp) =>
        computeFireplacePricingSummary(fp, pricing)
      );

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
          bathrooms: bathroomSummaries,
          staircases: staircaseSummaries,
          fireplaces: fireplaceSummaries,
        },
        totals: {
          roomsTotal: roomSummaries.reduce((sum, r) => sum + r.totalDisplayed, 0),
          bathroomsTotal: bathroomSummaries.reduce((sum, b) => sum + b.totalDisplayed, 0),
          staircasesTotal: staircaseSummaries.reduce((sum, s) => sum + s.totalDisplayed, 0),
          fireplacesTotal: fireplaceSummaries.reduce((sum, f) => sum + f.totalDisplayed, 0),
          grandTotal:
            roomSummaries.reduce((sum, r) => sum + r.totalDisplayed, 0) +
            bathroomSummaries.reduce((sum, b) => sum + b.totalDisplayed, 0) +
            staircaseSummaries.reduce((sum, s) => sum + s.totalDisplayed, 0) +
            fireplaceSummaries.reduce((sum, f) => sum + f.totalDisplayed, 0),
        },
      };

      const json = JSON.stringify(payload, null, 2);
      const fileName = `room-details-${project.id || "project"}.json`;
      const fileUri = FileSystem.cacheDirectory + fileName;
      await FileSystem.writeAsStringAsync(fileUri, json, { encoding: FileSystem.EncodingType.UTF8 });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "application/json",
          dialogTitle: "Share Room Details JSON",
        });
      } else {
        openInfoModal("Export Ready", `File saved to: ${fileUri}`);
      }
    } catch (error) {
      console.error("Export error:", error);
      openInfoModal("Export Failed", error instanceof Error ? error.message : "Unknown error");
    }
  };

  const handleExportSettings = async () => {
    try {
      const payload = {
        pricingSettings: {
          wallLaborPerSqFt: pricing.wallLaborPerSqFt,
          ceilingLaborPerSqFt: pricing.ceilingLaborPerSqFt,
          baseboardLaborPerLF: pricing.baseboardLaborPerLF,
          doorLabor: pricing.doorLabor,
          windowLabor: pricing.windowLabor,
          closetLabor: pricing.closetLabor,
          cabinetDoorLabor: pricing.cabinetDoorLabor,
          cabinetDrawerLabor: pricing.cabinetDrawerLabor,
          wallCabinetLabor: pricing.wallCabinetLabor,
          builtInShelfLabor: pricing.builtInShelfLabor,
          vanityDoorLabor: pricing.vanityDoorLabor,
          riserLabor: pricing.riserLabor,
          spindleLabor: pricing.spindleLabor,
          handrailLaborPerLF: pricing.handrailLaborPerLF,
          fireplaceLabor: pricing.fireplaceLabor,
          mantelLabor: pricing.mantelLabor,
          legsLabor: pricing.legsLabor,
          crownMouldingLaborPerLF: pricing.crownMouldingLaborPerLF,
          secondCoatLaborMultiplier: pricing.secondCoatLaborMultiplier,
          accentWallLaborMultiplier: pricing.accentWallLaborMultiplier,
          bathroomLaborMultiplier: pricing.bathroomLaborMultiplier,
          bathroomLaborMode: pricing.bathroomLaborMode,
          bathroomTierSmallLabor: pricing.bathroomTierSmallLabor,
          bathroomTierMediumLabor: pricing.bathroomTierMediumLabor,
          bathroomTierLargeBaseLabor: pricing.bathroomTierLargeBaseLabor,
          bathroomTierLargeExtraPerSqFt: pricing.bathroomTierLargeExtraPerSqFt,
          bathroomEnclosedToiletAddOn: pricing.bathroomEnclosedToiletAddOn,
          closetLaborMultiplier: pricing.closetLaborMultiplier,
          furnitureMovingFee: pricing.furnitureMovingFee,
          nailsRemovalFee: pricing.nailsRemovalFee,
          wallPaintPerGallon: pricing.wallPaintPerGallon,
          ceilingPaintPerGallon: pricing.ceilingPaintPerGallon,
          trimPaintPerGallon: pricing.trimPaintPerGallon,
          cabinetPaintPerGallon: pricing.cabinetPaintPerGallon,
          primerPerGallon: pricing.primerPerGallon,
          wallPaintPer5Gallon: pricing.wallPaintPer5Gallon,
          ceilingPaintPer5Gallon: pricing.ceilingPaintPer5Gallon,
          trimPaintPer5Gallon: pricing.trimPaintPer5Gallon,
          cabinetPaintPer5Gallon: pricing.cabinetPaintPer5Gallon,
          primerPer5Gallon: pricing.primerPer5Gallon,
        },
        calculationSettings: {
          doorHeight: calculationSettings.doorHeight,
          doorWidth: calculationSettings.doorWidth,
          doorTrimWidth: calculationSettings.doorTrimWidth,
          doorJambWidth: calculationSettings.doorJambWidth,
          windowWidth: calculationSettings.windowWidth,
          windowHeight: calculationSettings.windowHeight,
          windowTrimWidth: calculationSettings.windowTrimWidth,
          singleClosetWidth: calculationSettings.singleClosetWidth,
          singleClosetTrimWidth: calculationSettings.singleClosetTrimWidth,
          singleClosetBaseboardPerimeter: calculationSettings.singleClosetBaseboardPerimeter || 88,
          doubleClosetWidth: calculationSettings.doubleClosetWidth,
          doubleClosetTrimWidth: calculationSettings.doubleClosetTrimWidth,
          doubleClosetBaseboardPerimeter: calculationSettings.doubleClosetBaseboardPerimeter || 112,
          closetCavityDepth: calculationSettings.closetCavityDepth || 2,
          baseboardWidth: calculationSettings.baseboardWidth,
          crownMouldingWidth: calculationSettings.crownMouldingWidth,
          bathroomFixtureDeductionPercent: calculationSettings.bathroomFixtureDeductionPercent,
          wallCoverageSqFtPerGallon: appSettings.wallCoverageSqFtPerGallon,
          ceilingCoverageSqFtPerGallon: appSettings.ceilingCoverageSqFtPerGallon,
          trimCoverageSqFtPerGallon: appSettings.trimCoverageSqFtPerGallon,
          primerCoverageSqFtPerGallon: appSettings.primerCoverageSqFtPerGallon,
          cabinetPaintCoverageSqFtPerGallon: appSettings.cabinetPaintCoverageSqFtPerGallon,
          cabinetDoorWidthIn: appSettings.cabinetDoorWidthIn,
          cabinetDoorHeightIn: appSettings.cabinetDoorHeightIn,
          cabinetDoorSides: appSettings.cabinetDoorSides,
          cabinetWallDoor42WidthIn: appSettings.cabinetWallDoor42WidthIn,
          cabinetWallDoor42HeightIn: appSettings.cabinetWallDoor42HeightIn,
          cabinetWallDoor42Sides: appSettings.cabinetWallDoor42Sides,
          cabinetDrawerWidthIn: appSettings.cabinetDrawerWidthIn,
          cabinetDrawerHeightIn: appSettings.cabinetDrawerHeightIn,
          cabinetDrawerSides: appSettings.cabinetDrawerSides,
          cabinetFrontAreaSqIn: appSettings.cabinetFrontAreaSqIn,
        },
      };

      const json = JSON.stringify(payload, null, 2);
      const fileName = `estimator-settings-${project.id || "export"}.json`;
      const fileUri = FileSystem.cacheDirectory + fileName;
      await FileSystem.writeAsStringAsync(fileUri, json, { encoding: FileSystem.EncodingType.UTF8 });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "application/json",
          dialogTitle: "Share Estimator Settings",
        });
      } else {
        openInfoModal("Export Ready", `Settings saved to: ${fileUri}`);
      }
    } catch (error) {
      console.error("Settings export error:", error);
      openInfoModal("Export Failed", error instanceof Error ? error.message : "Unknown error");
    }
  };

  const handleExportCalculationTrace = async () => {
    try {
      const quoteBuilder = project.quoteBuilder || getDefaultQuoteBuilder();

      const roomTraces = project.rooms.map((room) => {
        const pricingSummary = computeRoomPricingSummary(
          room,
          quoteBuilder,
          pricing,
          undefined,
          project.projectIncludeClosetInteriorInQuote
        );

        return {
          roomId: room.id,
          name: room.name || "Unnamed Room",
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
            includeSingleClosetInteriorInQuote: room.includeSingleClosetInteriorInQuote,
            includeDoubleClosetInteriorInQuote: room.includeDoubleClosetInteriorInQuote,
          },
          coverageRules: {
            wallCoverageSqFtPerGallon: appSettings.wallCoverageSqFtPerGallon,
            ceilingCoverageSqFtPerGallon: appSettings.ceilingCoverageSqFtPerGallon,
            trimCoverageSqFtPerGallon: appSettings.trimCoverageSqFtPerGallon,
            doorCoverageSqFtPerGallon: appSettings.doorCoverageSqFtPerGallon,
            primerCoverageSqFtPerGallon: appSettings.primerCoverageSqFtPerGallon,
          },
          laborRates: {
            wallLaborPerSqFt: pricing.wallLaborPerSqFt,
            ceilingLaborPerSqFt: pricing.ceilingLaborPerSqFt,
            baseboardLaborPerLF: pricing.baseboardLaborPerLF,
            doorLabor: pricing.doorLabor,
            windowLabor: pricing.windowLabor,
            closetLabor: pricing.closetLabor,
            crownMouldingLaborPerLF: pricing.crownMouldingLaborPerLF,
          },
          paintPrices: {
            wallPaintPerGallon: pricing.wallPaintPerGallon,
            ceilingPaintPerGallon: pricing.ceilingPaintPerGallon,
            trimPaintPerGallon: pricing.trimPaintPerGallon,
            doorPaintPerGallon: pricing.doorPaintPerGallon,
            primerPerGallon: pricing.primerPerGallon,
          },
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
          combinedRuleFlags: {
            includedWalls: pricingSummary.includedWalls,
            includedCeilings: pricingSummary.includedCeilings,
            includedTrim: pricingSummary.includedTrim,
            includedDoors: pricingSummary.includedDoors,
            includedWindows: pricingSummary.includedWindows,
            includedBaseboards: pricingSummary.includedBaseboards,
            includedClosets: pricingSummary.includedClosets,
          },
          stepByStep: {
            wallArea: pricingSummary.wallArea,
            ceilingArea: pricingSummary.ceilingArea,
            baseboardLF: pricingSummary.baseboardLF,
            crownMouldingLF: pricingSummary.crownMouldingLF,
            closetWallArea: pricingSummary.closetWallArea,
            closetCeilingArea: pricingSummary.closetCeilingArea,
            closetBaseboardLF: pricingSummary.closetBaseboardLF,
            doorUnits: pricingSummary.doorsCount,
            windowUnits: pricingSummary.windowsCount,
            paintGallonsWalls: pricingSummary.wallPaintGallons,
            paintGallonsCeiling: pricingSummary.ceilingPaintGallons,
            paintGallonsTrim: pricingSummary.trimPaintGallons,
            paintGallonsDoors: pricingSummary.doorPaintGallons,
            paintGallonsPrimer: pricingSummary.primerGallons,
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
              ? (pricingSummary.singleDoorClosets + pricingSummary.doubleDoorClosets)
                * pricing.closetLabor
                * safeNumber(pricing.closetLaborMultiplier, 1.0)
                * (pricingSummary.coatsWalls > 1 ? safeNumber(pricing.secondCoatLaborMultiplier, 2.0) : 1.0)
              : 0,
            laborCrownMouldingRaw: pricingSummary.includedTrim && room.hasCrownMoulding
              ? pricingSummary.crownMouldingLF * pricing.crownMouldingLaborPerLF
              : 0,
            laborSubtotalBeforeRounding: pricingSummary.laborCost,
            laborSubtotalAfterRounding: pricingSummary.laborDisplayed,
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
            materialsSubtotalBeforeRounding: pricingSummary.materialsCost,
            materialsSubtotalAfterRounding: pricingSummary.materialsDisplayed,
            finalTotalBeforeRounding: pricingSummary.totalCost,
            finalTotalDisplayed: pricingSummary.totalDisplayed,
          },
        };
      });

      const staircaseTraces = (project.staircases || []).map((staircase) => {
        const pricingSummary = computeStaircasePricingSummary(staircase, pricing, undefined);

        return {
          staircaseId: staircase.id,
          name: "Staircase",
          inputs: {
            riserCount: staircase.riserCount,
            spindleCount: staircase.spindleCount,
            handrailLength: staircase.handrailLength,
            hasSecondaryStairwell: staircase.hasSecondaryStairwell,
            doubleSidedWalls: staircase.doubleSidedWalls,
            coats: staircase.coats,
            projectCoats: undefined,
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

      const fireplaceTraces = (project.fireplaces || []).map((fireplace) => {
        const pricingSummary = computeFireplacePricingSummary(fireplace, pricing);

        return {
          fireplaceId: fireplace.id,
          name: "Fireplace",
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
      const fileName = `calculation-trace-${project.id || "export"}.json`;
      const fileUri = FileSystem.cacheDirectory + fileName;
      await FileSystem.writeAsStringAsync(fileUri, json, { encoding: FileSystem.EncodingType.UTF8 });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "application/json",
          dialogTitle: "Share Calculation Trace",
        });
      } else {
        openInfoModal("Export Ready", `Calculation trace saved to: ${fileUri}`);
      }
    } catch (error) {
      console.error("Calculation trace export error:", error);
      openInfoModal("Export Failed", error instanceof Error ? error.message : "Unknown error");
    }
  };

  if (!project) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.backgroundWarmGray }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: Typography.h2.fontSize, color: Colors.mediumGray }}>Project not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.backgroundWarmGray }} edges={["bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: Spacing.md, paddingBottom: Spacing.xl }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
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

      <Modal
        visible={infoModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setInfoModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: Spacing.lg }}>
          <View style={{ backgroundColor: Colors.white, borderRadius: BorderRadius.default, padding: Spacing.lg }}>
            <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.darkCharcoal, marginBottom: Spacing.sm }}>
              {infoModalTitle}
            </Text>
            <Text style={{ fontSize: Typography.body.fontSize, color: Colors.mediumGray, marginBottom: Spacing.md }}>
              {infoModalBody}
            </Text>
            <Pressable
              onPress={() => setInfoModalVisible(false)}
              style={{
                backgroundColor: Colors.primaryBlue,
                borderRadius: BorderRadius.default,
                paddingVertical: Spacing.sm,
                alignItems: "center",
              }}
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
