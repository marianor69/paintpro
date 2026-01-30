import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  Share,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "../navigation/RootNavigator";
import { useProjectStore } from "../state/projectStore";
import { usePricingStore } from "../state/pricingStore";
import { useAppSettings } from "../state/appSettings";
import { useCalculationSettings } from "../state/calculationStore";
import {
  calculateFilteredProjectSummary,
  calculateProjectClosetStats,
  calculateOptimizedBuckets,
  formatCurrency,
  getDefaultQuoteBuilder,
  getClosetInteriorMetrics,
  isRoomIncludedInQuote,
  safeNumber,
} from "../utils/calculations";
import { Colors, Typography, Spacing, BorderRadius, Shadows } from "../utils/designSystem";
import { Card } from "../components/Card";
import { RoomPhoto } from "../types/painting";
import { computeBrickWallPricingSummary, computeFireplacePricingSummary, computeRoomPricingSummary, computeStaircasePricingSummary } from "../utils/pricingSummary";

type Props = NativeStackScreenProps<RootStackParamList, "MaterialsSummary">;

/**
 * ContractorViewScreen
 *
 * Provides a comprehensive contractor-focused view with:
 * - Paint materials breakdown (gallons, buckets)
 * - Per-room paint usage
 * - Project totals consistent with RoomEditor
 * - Cost breakdown (labor + materials)
 * - Paint system options (if enabled)
 * - Room breakdown matching individual room totals
 *
 * CRITICAL: All numbers use the same calculation source as RoomEditor
 * to ensure consistency.
 */
export default function ContractorViewScreen({ route, navigation }: Props) {
  const { projectId } = route.params;
  const project = useProjectStore((s) =>
    s.projects.find((p) => p.id === projectId)
  );
  const pricing = usePricingStore();
  const testMode = useAppSettings((s) => s.testMode);
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
  const calculationSettings = useCalculationSettings((s) => s.settings);

  // Collect all project photos from all rooms
  const allProjectPhotos: (RoomPhoto & { roomName: string })[] = [];
  if (project) {
    (project.rooms || []).forEach((room) => {
      (room.photos || []).forEach((photo) => {
        allProjectPhotos.push({ ...photo, roomName: room.name });
      });
    });
  }

  if (!project) {
    return (
      <SafeAreaView
        edges={["bottom"]}
        style={{ flex: 1, backgroundColor: Colors.backgroundWarmGray }}
      >
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ ...Typography.h2, color: Colors.mediumGray }}>
            Project not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Calculate project summary using ACTIVE QUOTE's QuoteBuilder (single source of truth)
  // This ensures consistency with RoomEditorScreen which also uses activeQuote
  const activeQuote = project.quotes?.find(q => q.id === project.activeQuoteId);
  const quoteBuilder = activeQuote?.quoteBuilder || project.quoteBuilder || getDefaultQuoteBuilder();
  const summary = calculateFilteredProjectSummary(
    project,
    pricing,
    quoteBuilder
  );

  // Calculate closet statistics
  const closetStats = calculateProjectClosetStats(project, quoteBuilder);

  // Calculate optimized bucket breakdown
  const buckets = calculateOptimizedBuckets(
    summary.totalWallGallons,
    summary.totalCeilingGallons,
    summary.totalTrimGallons,
    summary.totalDoorGallons
  );

  // Get paint system options (if enabled)
  const paintOptions = summary.paintOptionResults || [];
  const showPaintOptions = project.quoteBuilder?.showPaintOptionsInProposal && paintOptions.length > 0;
  const defaultTrimCoats = project.globalPaintDefaults?.defaultTrimCoats ?? 2;

  const getRoomUsageRows = (summaryData: {
    wallPaintGallons: number;
    ceilingPaintGallons: number;
    trimPaintGallons: number;
    doorPaintGallons: number;
  }) => {
    const rows = [
      { label: "Wall", gallons: safeNumber(summaryData.wallPaintGallons) },
      { label: "Ceiling", gallons: safeNumber(summaryData.ceilingPaintGallons) },
      { label: "Trim", gallons: safeNumber(summaryData.trimPaintGallons) },
      { label: "Door", gallons: safeNumber(summaryData.doorPaintGallons) },
    ].filter((row) => row.gallons > 0);

    return rows.length > 0 ? rows : [{ label: "Paint", gallons: 0 }];
  };

  const getIrregularRoomGallons = (irregularRoom: any) => {
    const wallAreas = (irregularRoom.walls || []).map((wall: any) => safeNumber(wall.width) * safeNumber(wall.height));
    const totalArea = wallAreas.reduce((sum: number, area: number) => sum + area, 0);
    const windowCount = safeNumber(irregularRoom.windowCount, 0);
    const doorCount = safeNumber(irregularRoom.doorCount, 0);
    const singleClosets = safeNumber(irregularRoom.singleDoorClosets, 0);
    const doubleClosets = safeNumber(irregularRoom.doubleDoorClosets, 0);
    const closetDoorCount = singleClosets + (doubleClosets * 2);
    const doorCountForSummary = doorCount + closetDoorCount;

    const coatsWalls = safeNumber(irregularRoom.coatsWalls, 2);
    const coatsCeiling = safeNumber(irregularRoom.coatsCeiling, 2);
    const coatsTrim = safeNumber(irregularRoom.coatsTrim, 2);
    const coatsDoors = safeNumber(irregularRoom.coatsDoors, 2);

    const wallCoverage = Math.max(1, safeNumber(pricing.wallCoverageSqFtPerGallon, 350));
    const ceilingCoverage = Math.max(1, safeNumber(pricing.ceilingCoverageSqFtPerGallon, 350));
    const trimCoverage = Math.max(1, safeNumber(pricing.trimCoverageSqFtPerGallon, 400));

    const paintWalls = irregularRoom.paintWalls !== false;
    const paintWindowFrames = irregularRoom.paintWindowFrames !== false;
    const paintDoorFrames = irregularRoom.paintDoorFrames !== false;
    const paintDoors = irregularRoom.paintDoors !== false;

    const wallGallons = paintWalls ? (totalArea / wallCoverage) * coatsWalls : 0;

    const windowTrimWidthFt = safeNumber(calculationSettings.windowTrimWidth, 3.5) / 12;
    const windowPerimeter = 2 * (safeNumber(calculationSettings.windowWidth, 3) + safeNumber(calculationSettings.windowHeight, 5));
    const windowTrimSqFt = windowCount * windowPerimeter * windowTrimWidthFt;
    const windowGallons = (windowTrimSqFt / trimCoverage) * coatsTrim;

    const doorTrimWidthFt = safeNumber(calculationSettings.doorTrimWidth, 2.5) / 12;
    const doorTrimPerimeter = (2 * safeNumber(calculationSettings.doorHeight, 7)) + safeNumber(calculationSettings.doorWidth, 3);
    const doorTrimSqFt = doorCount * doorTrimPerimeter * doorTrimWidthFt;
    const singleClosetTrimWidthFt = safeNumber(calculationSettings.singleClosetTrimWidth, 2.5) / 12;
    const singleClosetPerimeter = (2 * safeNumber(calculationSettings.doorHeight, 7)) + (safeNumber(calculationSettings.singleClosetWidth, 30) / 12);
    const singleClosetTrimSqFt = singleClosets * singleClosetPerimeter * singleClosetTrimWidthFt;
    const doubleClosetTrimWidthFt = safeNumber(calculationSettings.doubleClosetTrimWidth, 2.5) / 12;
    const doubleClosetPerimeter = (2 * safeNumber(calculationSettings.doorHeight, 7)) + (safeNumber(calculationSettings.doubleClosetWidth, 60) / 12);
    const doubleClosetTrimSqFt = doubleClosets * doubleClosetPerimeter * doubleClosetTrimWidthFt;
    const doorFrameTrimSqFt = doorTrimSqFt + singleClosetTrimSqFt + doubleClosetTrimSqFt;
    const doorFrameGallons = (doorFrameTrimSqFt / trimCoverage) * coatsTrim;

    const doorFacesSqFt = doorCountForSummary * (safeNumber(calculationSettings.doorWidth, 3) * safeNumber(calculationSettings.doorHeight, 7)) * 2;
    const doorGallons = (doorFacesSqFt / trimCoverage) * coatsDoors;

    const closetInteriorEnabled =
      irregularRoom.includeSingleClosetInteriorInQuote || irregularRoom.includeDoubleClosetInteriorInQuote;
    const closetGallonsEnabled = closetInteriorEnabled && (singleClosets > 0 || doubleClosets > 0);
    const defaultHeight = safeNumber(project.floorHeights?.[0], 8);
    const closetMetrics = getClosetInteriorMetrics(
      {
        height: defaultHeight,
        singleDoorClosets: singleClosets,
        doubleDoorClosets: doubleClosets,
      } as any,
      defaultHeight
    );
    const closetBaseboardWidthFt = safeNumber(calculationSettings.baseboardWidth, 3.5) / 12;
    const closetBaseboardTrimSqFt = closetMetrics.totalClosetBaseboardLF * closetBaseboardWidthFt;
    const closetWallGallons = closetGallonsEnabled
      ? (closetMetrics.totalClosetWallArea / wallCoverage) * coatsWalls
      : 0;
    const closetCeilingGallons = closetGallonsEnabled
      ? (closetMetrics.totalClosetCeilingArea / ceilingCoverage) * coatsCeiling
      : 0;
    const closetBaseboardGallons = closetGallonsEnabled
      ? (closetBaseboardTrimSqFt / trimCoverage) * coatsTrim
      : 0;

    return {
      wall: safeNumber(wallGallons + (closetGallonsEnabled ? closetWallGallons : 0)),
      ceiling: safeNumber(closetGallonsEnabled ? closetCeilingGallons : 0),
      trim: safeNumber(
        (paintWindowFrames ? windowGallons : 0) +
          (paintDoorFrames ? doorFrameGallons : 0) +
          (closetGallonsEnabled ? closetBaseboardGallons : 0)
      ),
      door: safeNumber(paintDoors ? doorGallons : 0),
    };
  };

  const perItemUsage = () => {
    const usageItems: {
      id: string;
      title: string;
      rows: { label: string; gallons: number }[];
    }[] = [];

    (project.rooms || [])
      .filter((room) => room.included !== false && isRoomIncludedInQuote(room, quoteBuilder))
      .forEach((room) => {
        const pricingSummary = computeRoomPricingSummary(
          room,
          quoteBuilder,
          pricing,
          undefined,
          project.projectIncludeClosetInteriorInQuote
        );
        usageItems.push({
          id: `room-${room.id}`,
          title: `Room: ${room.name}`,
          rows: getRoomUsageRows(pricingSummary),
        });
      });

    (project.bathrooms || [])
      .filter((bathroom) => bathroom.included !== false && isRoomIncludedInQuote(bathroom as any, quoteBuilder))
      .forEach((bathroom) => {
        const pricingSummary = computeRoomPricingSummary(
          { ...bathroom, isBathroom: true } as any,
          quoteBuilder,
          pricing,
          undefined,
          project.projectIncludeClosetInteriorInQuote
        );
        usageItems.push({
          id: `bathroom-${bathroom.id}`,
          title: `Bathroom: ${bathroom.name || "Bathroom"}`,
          rows: getRoomUsageRows(pricingSummary),
        });
      });

    (project.irregularRooms || []).forEach((irregularRoom, index) => {
      const gallons = getIrregularRoomGallons(irregularRoom);
      const rows = [
        { label: "Wall", gallons: gallons.wall },
        { label: "Ceiling", gallons: gallons.ceiling },
        { label: "Trim", gallons: gallons.trim },
        { label: "Door", gallons: gallons.door },
      ].filter((row) => row.gallons > 0);

      usageItems.push({
        id: `irregular-${irregularRoom.id}`,
        title: `Irregular Room: ${irregularRoom.name || `Irregular Room ${index + 1}`}`,
        rows: rows.length > 0 ? rows : [{ label: "Paint", gallons: 0 }],
      });
    });

    if (quoteBuilder.includeStaircases !== false) {
      (project.staircases || []).forEach((staircase, index) => {
        const summaryData = computeStaircasePricingSummary(staircase, pricing, undefined);
        const rows = [
          { label: "Trim", gallons: safeNumber(summaryData.trimGallons) },
          { label: "Wall", gallons: safeNumber(summaryData.wallGallons) },
          { label: "Ceiling", gallons: safeNumber(summaryData.ceilingGallons) },
        ].filter((row) => row.gallons > 0);
        usageItems.push({
          id: `staircase-${staircase.id}`,
          title: `Staircase: ${staircase.name || `Staircase ${index + 1}`}`,
          rows: rows.length > 0 ? rows : [{ label: "Paint", gallons: 0 }],
        });
      });
    }

    if (quoteBuilder.includeFireplaces !== false) {
      (project.fireplaces || []).forEach((fireplace, index) => {
        const summaryData = computeFireplacePricingSummary(fireplace, pricing);
        usageItems.push({
          id: `fireplace-${fireplace.id}`,
          title: `Fireplace: ${fireplace.name || `Fireplace ${index + 1}`}`,
          rows: [{ label: "Wall", gallons: safeNumber(summaryData.totalGallons) }],
        });
      });
    }

    if (quoteBuilder.includeBuiltIns !== false) {
      (project.builtIns || []).forEach((builtIn, index) => {
        const widthFt = safeNumber(builtIn.width) / 12;
        const heightFt = safeNumber(builtIn.height) / 12;
        const depthFt = safeNumber(builtIn.depth) / 12;
        const shelfCountValue = safeNumber(builtIn.shelfCount, 0);
        const shelfAreaSqFt = shelfCountValue > 0 ? shelfCountValue * widthFt * depthFt * 2 : 0;
        const sideAreaSqFt = 2 * (heightFt * depthFt);
        const cabinetCoats = safeNumber(builtIn.coats, defaultTrimCoats);
        const cabinetCoverage = Math.max(1, safeNumber(cabinetPaintCoverageSqFtPerGallon, 350));
        const shelfSurfaceGallons = (shelfAreaSqFt / cabinetCoverage) * cabinetCoats;
        const sideSurfaceGallons = (sideAreaSqFt / cabinetCoverage) * cabinetCoats;
        const cabinetDoorCountValue = safeNumber(builtIn.cabinetDoorCount, 0);
        const cabinetDrawerCountValue = safeNumber(builtIn.cabinetDrawerCount, 0);
        const paintCabinetDoors = builtIn.paintCabinetDoors !== false;
        const cabinetDoorAreaSqFt = cabinetDoorCountValue * (safeNumber(calculationSettings.doorHeight, 7) * safeNumber(calculationSettings.doorWidth, 3));
        const cabinetDrawerAreaSqFt = cabinetDrawerCountValue * (safeNumber(calculationSettings.doorHeight, 7) * safeNumber(calculationSettings.doorWidth, 3));
        const cabinetDoorGallons = paintCabinetDoors ? (cabinetDoorAreaSqFt / cabinetCoverage) * cabinetCoats : 0;
        const cabinetDrawerGallons = paintCabinetDoors ? (cabinetDrawerAreaSqFt / cabinetCoverage) * cabinetCoats : 0;

        const rows = [
          { label: "Shelves", gallons: safeNumber(shelfSurfaceGallons) },
          { label: "Sides", gallons: safeNumber(sideSurfaceGallons) },
          { label: "Doors", gallons: safeNumber(cabinetDoorGallons) },
          { label: "Drawers", gallons: safeNumber(cabinetDrawerGallons) },
        ].filter((row) => row.gallons > 0);

        usageItems.push({
          id: `builtin-${builtIn.id}`,
          title: `Built-In: ${builtIn.name || `Built-In ${index + 1}`}`,
          rows: rows.length > 0 ? rows : [{ label: "Paint", gallons: 0 }],
        });
      });
    }

    (project.cabinets || []).forEach((cabinet, index) => {
      const cabinetCoverage = Math.max(1, safeNumber(cabinetPaintCoverageSqFtPerGallon, 350));
      const baseDoorAreaSqFt =
        ((safeNumber(cabinetDoorWidthIn, 30) * safeNumber(cabinetDoorHeightIn, 25) * Math.max(1, safeNumber(cabinetDoorSides, 2))) +
          safeNumber(cabinetFrontAreaSqIn, 450)) / 144;
      const wallDoorWidthIn = cabinet.includeWallCabinet42 ? cabinetWallDoor42WidthIn : cabinetDoorWidthIn;
      const wallDoorHeightIn = cabinet.includeWallCabinet42 ? cabinetWallDoor42HeightIn : cabinetDoorHeightIn;
      const wallDoorSides = cabinet.includeWallCabinet42 ? cabinetWallDoor42Sides : cabinetDoorSides;
      const wallDoorAreaSqFt =
        ((safeNumber(wallDoorWidthIn, 30) * safeNumber(wallDoorHeightIn, 42) * Math.max(1, safeNumber(wallDoorSides, 2))) +
          safeNumber(cabinetFrontAreaSqIn, 450)) / 144;
      const drawerAreaSqFt =
        (safeNumber(cabinetDrawerWidthIn, 30) * safeNumber(cabinetDrawerHeightIn, 10) * Math.max(1, safeNumber(cabinetDrawerSides, 1))) / 144;
      const baseDoorGallons = (safeNumber(cabinet.baseDoorCount, 0) * baseDoorAreaSqFt) / cabinetCoverage;
      const drawerGallons = (safeNumber(cabinet.drawerCount, 0) * drawerAreaSqFt) / cabinetCoverage;
      const wallDoorGallons = (safeNumber(cabinet.wallDoorCount, 0) * wallDoorAreaSqFt) / cabinetCoverage;

      const rows = [
        { label: "Base Doors", gallons: safeNumber(baseDoorGallons) },
        { label: "Drawers", gallons: safeNumber(drawerGallons) },
        { label: "Wall Doors", gallons: safeNumber(wallDoorGallons) },
      ].filter((row) => row.gallons > 0);

      usageItems.push({
        id: `cabinet-${cabinet.id}`,
        title: `Cabinet: ${cabinet.name || `Cabinet ${index + 1}`}`,
        rows: rows.length > 0 ? rows : [{ label: "Paint", gallons: 0 }],
      });
    });

    (project.brickWalls || []).forEach((brickWall, index) => {
      const summaryData = computeBrickWallPricingSummary(brickWall, pricing);
      const rows = [
        { label: "Primer", gallons: safeNumber(summaryData.primerGallons) },
        { label: "Paint", gallons: safeNumber(summaryData.paintGallons) },
      ].filter((row) => row.gallons > 0);

      usageItems.push({
        id: `brickwall-${brickWall.id}`,
        title: `Brick/Panel: ${brickWall.name || `Brick/Panel ${index + 1}`}`,
        rows: rows.length > 0 ? rows : [{ label: "Paint", gallons: 0 }],
      });
    });

    return usageItems;
  };

  const usageItems = perItemUsage();

  // Generate contractor text for sharing/copying
  const generateContractorText = (): string => {
    let text = `PAINT ESTIMATE PRO - CONTRACTOR SUMMARY\n`;
    text += `Client: ${project.clientInfo?.name || "Unnamed Project"}\n`;
    text += `Date: ${new Date().toLocaleDateString()}\n`;
    text += `\n`;
    text += `========================================\n`;
    text += `PAINT MATERIALS\n`;
    text += `========================================\n`;
    text += `\n`;
    text += `Wall Paint:\n`;
    text += `  ${summary.totalWallGallons.toFixed(1)} gallons\n`;
    text += `  ${buckets.wall.fiveGal} × 5-gallon buckets + ${buckets.wall.singleGal} × 1-gallon\n`;
    text += `\n`;
    text += `Ceiling Paint:\n`;
    text += `  ${summary.totalCeilingGallons.toFixed(1)} gallons\n`;
    text += `  ${buckets.ceiling.fiveGal} × 5-gallon buckets + ${buckets.ceiling.singleGal} × 1-gallon\n`;
    text += `\n`;
    text += `Trim Paint:\n`;
    text += `  ${summary.totalTrimGallons.toFixed(1)} gallons\n`;
    text += `  ${buckets.trim.fiveGal} × 5-gallon buckets + ${buckets.trim.singleGal} × 1-gallon\n`;
    text += `\n`;
    if (summary.totalDoorGallons > 0) {
      text += `Door Paint:\n`;
      text += `  ${summary.totalDoorGallons.toFixed(1)} gallons\n`;
      text += `  ${buckets.door.fiveGal} × 5-gallon buckets + ${buckets.door.singleGal} × 1-gallon\n`;
      text += `\n`;
    }
    text += `========================================\n`;
    text += `PER-ITEM PAINT USAGE (Decimal Gallons)\n`;
    text += `========================================\n`;
    text += `\n`;
    usageItems.forEach((item) => {
      text += `${item.title}:\n`;
      item.rows.forEach((row) => {
        text += `  ${row.label}: ${row.gallons.toFixed(2)} gal\n`;
      });
      text += `\n`;
    });
    text += `========================================\n`;
    text += `PROJECT SUMMARY\n`;
    text += `========================================\n`;
    text += `\n`;
    text += `Total Doors: ${summary.totalDoors}\n`;
    text += `Total Windows: ${summary.totalWindows}\n`;
    if (closetStats.includedSingleClosets > 0 || closetStats.includedDoubleClosets > 0 || closetStats.includedDoorlessClosets > 0) {
      text += `\n`;
      text += `Closet Interiors (2' deep cavities):\n`;
      text += `  Single-door closets: ${closetStats.includedSingleClosets}\n`;
      text += `  Double-door closets: ${closetStats.includedDoubleClosets}\n`;
      text += `  Doorless closets: ${closetStats.includedDoorlessClosets}\n`;
      text += `  Wall area: ${closetStats.includedClosetWallArea.toFixed(0)} sq ft\n`;
      text += `  Ceiling area: ${closetStats.includedClosetCeilingArea.toFixed(0)} sq ft\n`;
    }
    text += `\n`;
    text += `========================================\n`;
    text += `COST BREAKDOWN\n`;
    text += `========================================\n`;
    text += `\n`;
    text += `Total Labor: ${formatCurrency(Math.round(summary.totalLaborCost))}\n`;
    text += `Total Materials: ${formatCurrency(Math.round(summary.totalMaterialCost))}\n`;
    text += `GRAND TOTAL: ${formatCurrency(summary.grandTotal)}\n`;
    text += `\n`;

    if (showPaintOptions) {
      text += `========================================\n`;
      text += `PAINT SYSTEM OPTIONS\n`;
      text += `========================================\n`;
      text += `\n`;
      paintOptions.forEach((opt, index) => {
        text += `Option ${String.fromCharCode(65 + index)} — ${opt.optionName}\n`;
        text += `  Labor: ${formatCurrency(opt.laborCost)}\n`;
        text += `  Wall paint (${opt.wallGallons.toFixed(1)} gal): ${formatCurrency(opt.wallPaintCost)}\n`;
        text += `  Other materials: ${formatCurrency(opt.nonWallMaterialsCost)}\n`;
        text += `  Total: ${formatCurrency(opt.total)}\n`;
        if (opt.notes) {
          text += `  Notes: ${opt.notes}\n`;
        }
        text += `\n`;
      });
    }

    text += `========================================\n`;
    text += `ROOM BREAKDOWN\n`;
    text += `========================================\n`;
    text += `\n`;
    summary.itemizedPrices.forEach((item) => {
      text += `${item.name}: ${formatCurrency(item.price)}\n`;
    });
    text += `\n`;
    text += `Generated by Paint Pro\n`;
    return text;
  };

  const handleCopy = async () => {
    try {
      const text = generateContractorText();
      await Clipboard.setStringAsync(text);
      Alert.alert("Copied", "Contractor summary copied to clipboard");
    } catch (error) {
      Alert.alert("Error", "Failed to copy to clipboard");
    }
  };

  const handleShare = async () => {
    try {
      const text = generateContractorText();
      await Share.share({
        message: text,
        title: `Paint Estimate - ${project.clientInfo?.name || "Project"}`,
      });
    } catch (error) {
      Alert.alert("Error", "Failed to share summary");
    }
  };

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={{ flex: 1, backgroundColor: Colors.backgroundWarmGray }}
    >
      <ScrollView
        contentContainerStyle={{ padding: Spacing.md }}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Project Header Section */}
        <Card style={{ marginBottom: Spacing.md }}>
          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
            {/* Project Cover Photo */}
            {project.coverPhotoUri ? (
              <Image
                source={{ uri: project.coverPhotoUri }}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: BorderRadius.default,
                  marginRight: Spacing.md,
                  backgroundColor: Colors.neutralGray,
                }}
                resizeMode="cover"
              />
            ) : (
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: BorderRadius.default,
                  marginRight: Spacing.md,
                  backgroundColor: Colors.neutralGray,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="business-outline" size={32} color={Colors.mediumGray} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={{ ...Typography.h2, marginBottom: Spacing.xs }}>
                {project.clientInfo?.name || "Unnamed Project"}
              </Text>
              {project.clientInfo?.address && (
                <Text style={{ fontSize: Typography.body.fontSize, color: Colors.mediumGray, marginBottom: Spacing.xs }}>
                  {project.clientInfo.address}
                </Text>
              )}
              {project.clientInfo?.phone && (
                <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                  {project.clientInfo.phone}
                </Text>
              )}
            </View>
          </View>
        </Card>

        {/* 2. Summary Totals Section */}
        <Card style={{ marginBottom: Spacing.md }}>
          <Text style={{ ...Typography.h2, marginBottom: Spacing.md }}>
            Summary Totals
          </Text>

          <View
            style={{
              backgroundColor: "#E3F2FD",
              borderRadius: BorderRadius.default,
              padding: Spacing.md,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: Spacing.xs,
              }}
            >
              <Text style={{ fontSize: Typography.body.fontSize, color: Colors.mediumGray }}>
                Total Labor:
              </Text>
              <Text style={{ fontSize: Typography.body.fontSize, color: Colors.darkCharcoal }}>
                {formatCurrency(Math.round(summary.totalLaborCost))}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: Spacing.sm,
              }}
            >
              <Text style={{ fontSize: Typography.body.fontSize, color: Colors.mediumGray }}>
                Total Materials:
              </Text>
              <Text style={{ fontSize: Typography.body.fontSize, color: Colors.darkCharcoal }}>
                {formatCurrency(Math.round(summary.totalMaterialCost))}
              </Text>
            </View>
            <View
              style={{
                height: 1,
                backgroundColor: "#90CAF9",
                marginVertical: Spacing.xs,
              }}
            />
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Text
                style={{
                  fontSize: Typography.body.fontSize,
                  fontWeight: "700",
                  color: Colors.darkCharcoal,
                }}
              >
                GRAND TOTAL:
              </Text>
              <Text
                style={{
                  fontSize: Typography.h2.fontSize,
                  fontWeight: "700",
                  color: Colors.primaryBlue,
                }}
              >
                {formatCurrency(summary.grandTotal)}
              </Text>
            </View>
          </View>
        </Card>

        {/* 3. Materials Breakdown Section */}
        <Card style={{ marginBottom: Spacing.md }}>
          <Text style={{ ...Typography.h2, marginBottom: Spacing.md }}>
            Paint Materials
          </Text>

          <Text
            style={{
              fontSize: Typography.caption.fontSize,
              color: Colors.mediumGray,
              marginBottom: Spacing.md,
            }}
          >
            Recommended paint quantities and bucket purchases
          </Text>

          {/* Wall Paint */}
          <View
            style={{
              backgroundColor: Colors.backgroundWarmGray,
              borderRadius: BorderRadius.default,
              padding: Spacing.md,
              marginBottom: Spacing.sm,
            }}
          >
            <Text
              style={{
                fontSize: Typography.body.fontSize,
                fontWeight: "600",
                color: Colors.darkCharcoal,
                marginBottom: Spacing.xs,
              }}
            >
              Wall Paint
            </Text>
            <Text style={{ fontSize: Typography.body.fontSize, color: Colors.mediumGray }}>
              {summary.totalWallGallons.toFixed(1)} gallons
            </Text>
            <Text style={{ fontSize: Typography.body.fontSize, color: Colors.darkCharcoal }}>
              {buckets.wall.fiveGal} X 5-gal
            </Text>
            <Text style={{ fontSize: Typography.body.fontSize, color: Colors.darkCharcoal }}>
              {buckets.wall.singleGal} X 1-gal
            </Text>
          </View>

          {/* Ceiling Paint */}
          <View
            style={{
              backgroundColor: Colors.backgroundWarmGray,
              borderRadius: BorderRadius.default,
              padding: Spacing.md,
              marginBottom: Spacing.sm,
            }}
          >
            <Text
              style={{
                fontSize: Typography.body.fontSize,
                fontWeight: "600",
                color: Colors.darkCharcoal,
                marginBottom: Spacing.xs,
              }}
            >
              Ceiling Paint
            </Text>
            <Text style={{ fontSize: Typography.body.fontSize, color: Colors.mediumGray }}>
              {summary.totalCeilingGallons.toFixed(1)} gallons
            </Text>
            <Text style={{ fontSize: Typography.body.fontSize, color: Colors.darkCharcoal }}>
              {buckets.ceiling.fiveGal} X 5-gal
            </Text>
            <Text style={{ fontSize: Typography.body.fontSize, color: Colors.darkCharcoal }}>
              {buckets.ceiling.singleGal} X 1-gal
            </Text>
          </View>

          {/* Trim Paint */}
          <View
            style={{
              backgroundColor: Colors.backgroundWarmGray,
              borderRadius: BorderRadius.default,
              padding: Spacing.md,
              marginBottom: summary.totalDoorGallons > 0 ? Spacing.sm : 0,
            }}
          >
            <Text
              style={{
                fontSize: Typography.body.fontSize,
                fontWeight: "600",
                color: Colors.darkCharcoal,
                marginBottom: Spacing.xs,
              }}
            >
              Trim Paint
            </Text>
            <Text style={{ fontSize: Typography.body.fontSize, color: Colors.mediumGray }}>
              {summary.totalTrimGallons.toFixed(1)} gallons
            </Text>
            <Text style={{ fontSize: Typography.body.fontSize, color: Colors.darkCharcoal }}>
              {buckets.trim.fiveGal} X 5-gal
            </Text>
            <Text style={{ fontSize: Typography.body.fontSize, color: Colors.darkCharcoal }}>
              {buckets.trim.singleGal} X 1-gal
            </Text>
          </View>

          {/* Door Paint (if applicable) */}
          {summary.totalDoorGallons > 0 && (
            <View
              style={{
                backgroundColor: Colors.backgroundWarmGray,
                borderRadius: BorderRadius.default,
                padding: Spacing.md,
              }}
            >
              <Text
                style={{
                  fontSize: Typography.body.fontSize,
                  fontWeight: "600",
                  color: Colors.darkCharcoal,
                  marginBottom: Spacing.xs,
                }}
              >
                Door Paint
              </Text>
              <Text style={{ fontSize: Typography.body.fontSize, color: Colors.mediumGray }}>
                {summary.totalDoorGallons.toFixed(1)} gallons
              </Text>
              <Text style={{ fontSize: Typography.body.fontSize, color: Colors.darkCharcoal }}>
                {buckets.door.fiveGal} X 5-gal
              </Text>
              <Text style={{ fontSize: Typography.body.fontSize, color: Colors.darkCharcoal }}>
                {buckets.door.singleGal} X 1-gal
              </Text>
            </View>
          )}
        </Card>

        {/* 4. Per-Room Cost Breakdown Section */}
        <Card style={{ marginBottom: Spacing.md }}>
          <Text style={{ ...Typography.h2, marginBottom: Spacing.md }}>
            Room Breakdown
          </Text>

          <Text
            style={{
              fontSize: Typography.caption.fontSize,
              color: Colors.mediumGray,
              marginBottom: Spacing.md,
            }}
          >
            Individual room totals (matching Room Editor calculations)
          </Text>

          {summary.itemizedPrices.map((item, index) => (
            <View
              key={index}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                paddingVertical: Spacing.sm,
                borderBottomWidth: index < summary.itemizedPrices.length - 1 ? 1 : 0,
                borderBottomColor: Colors.neutralGray,
              }}
            >
              <Text
                style={{
                  fontSize: Typography.body.fontSize,
                  color: Colors.darkCharcoal,
                  flex: 1,
                }}
              >
                {item.name}
              </Text>
              <Text
                style={{
                  fontSize: Typography.body.fontSize,
                  fontWeight: "600",
                  color: Colors.darkCharcoal,
                }}
              >
                {formatCurrency(item.price)}
              </Text>
            </View>
          ))}

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingTop: Spacing.md,
              marginTop: Spacing.sm,
              borderTopWidth: 2,
              borderTopColor: Colors.primaryBlue,
            }}
          >
            <Text
              style={{
                fontSize: Typography.body.fontSize,
                fontWeight: "700",
                color: Colors.darkCharcoal,
              }}
            >
              Total:
            </Text>
            <Text
              style={{
                fontSize: Typography.h2.fontSize,
                fontWeight: "700",
                color: Colors.primaryBlue,
              }}
            >
              {formatCurrency(summary.grandTotal)}
            </Text>
          </View>
        </Card>

        {/* 5. Doors / Windows / Closets Summary Section */}
        <Card style={{ marginBottom: Spacing.md }}>
          <Text style={{ ...Typography.h2, marginBottom: Spacing.md }}>
            Doors, Windows & Closets
          </Text>

          <View
            style={{
              backgroundColor: Colors.backgroundWarmGray,
              borderRadius: BorderRadius.default,
              padding: Spacing.md,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: Spacing.xs,
              }}
            >
              <Text style={{ fontSize: Typography.body.fontSize, color: Colors.mediumGray }}>
                Total Doors:
              </Text>
              <Text
                style={{
                  fontSize: Typography.body.fontSize,
                  fontWeight: "600",
                  color: Colors.darkCharcoal,
                }}
              >
                {summary.totalDoors}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: (closetStats.includedSingleClosets > 0 || closetStats.includedDoubleClosets > 0 || closetStats.includedDoorlessClosets > 0) ? Spacing.sm : 0,
              }}
            >
              <Text style={{ fontSize: Typography.body.fontSize, color: Colors.mediumGray }}>
                Total Windows:
              </Text>
              <Text
                style={{
                  fontSize: Typography.body.fontSize,
                  fontWeight: "600",
                  color: Colors.darkCharcoal,
                }}
              >
                {summary.totalWindows}
              </Text>
            </View>

            {/* Closet Stats if applicable */}
            {(closetStats.includedSingleClosets > 0 || closetStats.includedDoubleClosets > 0 || closetStats.includedDoorlessClosets > 0) && (
              <>
                <View style={{ height: 1, backgroundColor: Colors.neutralGray, marginVertical: Spacing.sm }} />
                <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.xs }}>
                  Closet Interiors (2&apos; deep cavities)
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: Spacing.xs,
                  }}
                >
                  <Text style={{ fontSize: Typography.body.fontSize, color: Colors.mediumGray }}>
                    Single-door closets:
                  </Text>
                  <Text
                    style={{
                      fontSize: Typography.body.fontSize,
                      fontWeight: "600",
                      color: Colors.darkCharcoal,
                    }}
                  >
                    {closetStats.includedSingleClosets}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: Spacing.xs,
                  }}
                >
                  <Text style={{ fontSize: Typography.body.fontSize, color: Colors.mediumGray }}>
                    Double-door closets:
                  </Text>
                  <Text
                    style={{
                      fontSize: Typography.body.fontSize,
                      fontWeight: "600",
                      color: Colors.darkCharcoal,
                    }}
                  >
                    {closetStats.includedDoubleClosets}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: Spacing.xs,
                  }}
                >
                  <Text style={{ fontSize: Typography.body.fontSize, color: Colors.mediumGray }}>
                    Doorless closets:
                  </Text>
                  <Text
                    style={{
                      fontSize: Typography.body.fontSize,
                      fontWeight: "600",
                      color: Colors.darkCharcoal,
                    }}
                  >
                    {closetStats.includedDoorlessClosets}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: Spacing.xs,
                  }}
                >
                  <Text style={{ fontSize: Typography.body.fontSize, color: Colors.mediumGray }}>
                    Wall area:
                  </Text>
                  <Text
                    style={{
                      fontSize: Typography.body.fontSize,
                      fontWeight: "600",
                      color: Colors.darkCharcoal,
                    }}
                  >
                    {closetStats.includedClosetWallArea.toFixed(0)} sq ft
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={{ fontSize: Typography.body.fontSize, color: Colors.mediumGray }}>
                    Ceiling area:
                  </Text>
                  <Text
                    style={{
                      fontSize: Typography.body.fontSize,
                      fontWeight: "600",
                      color: Colors.darkCharcoal,
                    }}
                  >
                    {closetStats.includedClosetCeilingArea.toFixed(0)} sq ft
                  </Text>
                </View>
              </>
            )}
          </View>
        </Card>

        {/* 6. Per-Item Gallons Summary Section */}
        <Card style={{ marginBottom: Spacing.md }}>
          <Text style={{ ...Typography.h2, marginBottom: Spacing.md }}>
            Per-Item Paint Usage (Decimal Gallons)
          </Text>

          <Text
            style={{
              fontSize: Typography.caption.fontSize,
              color: Colors.mediumGray,
              marginBottom: Spacing.md,
            }}
          >
            Precise gallon usage for each item (before rounding to buckets)
          </Text>

          {usageItems.map((item, index) => (
            <View
              key={item.id}
              style={{
                backgroundColor: Colors.backgroundWarmGray,
                borderRadius: BorderRadius.default,
                padding: Spacing.md,
                marginBottom: index < usageItems.length - 1 ? Spacing.sm : 0,
              }}
            >
              <Text
                style={{
                  fontSize: Typography.body.fontSize,
                  fontWeight: "600",
                  color: Colors.darkCharcoal,
                  marginBottom: Spacing.xs,
                }}
              >
                {item.title}
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: Spacing.md }}>
                {item.rows.map((row) => (
                  <View key={`${item.id}-${row.label}`} style={{ minWidth: 110 }}>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                      {row.label}
                    </Text>
                    <Text style={{ fontSize: Typography.body.fontSize, color: Colors.darkCharcoal }}>
                      {row.gallons.toFixed(2)} gal
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </Card>

        {/* Paint System Options Section (if enabled) */}
        {showPaintOptions && (
          <Card style={{ marginBottom: Spacing.md }}>
            <Text style={{ ...Typography.h2, marginBottom: Spacing.md }}>
              Paint System Options
            </Text>

            <Text
              style={{
                fontSize: Typography.caption.fontSize,
                color: Colors.mediumGray,
                marginBottom: Spacing.md,
              }}
            >
              Different paint grades with adjusted pricing and coverage
            </Text>

            {paintOptions.map((opt, index) => (
              <View
                key={opt.optionId}
                style={{
                  backgroundColor: Colors.backgroundWarmGray,
                  borderRadius: BorderRadius.default,
                  padding: Spacing.md,
                  marginBottom: index < paintOptions.length - 1 ? Spacing.sm : 0,
                }}
              >
                <Text
                  style={{
                    fontSize: Typography.body.fontSize,
                    fontWeight: "600",
                    color: Colors.darkCharcoal,
                    marginBottom: Spacing.xs,
                  }}
                >
                  Option {String.fromCharCode(65 + index)} — {opt.optionName}
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: Spacing.xs,
                  }}
                >
                  <Text style={{ fontSize: Typography.body.fontSize, color: Colors.mediumGray }}>
                    Labor:
                  </Text>
                  <Text style={{ fontSize: Typography.body.fontSize, color: Colors.darkCharcoal }}>
                    {formatCurrency(opt.laborCost)}
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: Spacing.xs,
                  }}
                >
                  <Text style={{ fontSize: Typography.body.fontSize, color: Colors.mediumGray }}>
                    Wall paint ({opt.wallGallons.toFixed(1)} gal):
                  </Text>
                  <Text style={{ fontSize: Typography.body.fontSize, color: Colors.darkCharcoal }}>
                    {formatCurrency(opt.wallPaintCost)}
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: Spacing.xs,
                  }}
                >
                  <Text style={{ fontSize: Typography.body.fontSize, color: Colors.mediumGray }}>
                    Other materials:
                  </Text>
                  <Text style={{ fontSize: Typography.body.fontSize, color: Colors.darkCharcoal }}>
                    {formatCurrency(opt.nonWallMaterialsCost)}
                  </Text>
                </View>

                <View
                  style={{
                    height: 1,
                    backgroundColor: Colors.neutralGray,
                    marginVertical: Spacing.xs,
                  }}
                />

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: opt.notes ? Spacing.xs : 0,
                  }}
                >
                  <Text
                    style={{
                      fontSize: Typography.body.fontSize,
                      fontWeight: "600",
                      color: Colors.darkCharcoal,
                    }}
                  >
                    Total:
                  </Text>
                  <Text
                    style={{
                      fontSize: Typography.body.fontSize,
                      fontWeight: "600",
                      color: Colors.primaryBlue,
                    }}
                  >
                    {formatCurrency(opt.total)}
                  </Text>
                </View>

                {opt.notes && (
                  <Text
                    style={{
                      fontSize: Typography.caption.fontSize,
                      color: Colors.mediumGray,
                      fontStyle: "italic",
                    }}
                  >
                    {opt.notes}
                  </Text>
                )}
              </View>
            ))}
          </Card>
        )}

        {/* 7. Project Photos Gallery Section */}
        {allProjectPhotos.length > 0 && (
          <Card style={{ marginBottom: Spacing.md }}>
            <Text style={{ ...Typography.h2, marginBottom: Spacing.md }}>
              Project Photos
            </Text>

            <Text
              style={{
                fontSize: Typography.caption.fontSize,
                color: Colors.mediumGray,
                marginBottom: Spacing.md,
              }}
            >
              Documentation photos from all rooms
            </Text>

            <View style={{ gap: Spacing.md }}>
              {allProjectPhotos.map((photo) => (
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
                      height: 200,
                      backgroundColor: Colors.neutralGray,
                    }}
                    resizeMode="cover"
                  />
                  <View style={{ padding: Spacing.sm }}>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.primaryBlue, fontWeight: "600", marginBottom: Spacing.xs }}>
                      {photo.roomName}
                    </Text>
                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: photo.note ? Spacing.xs : 0 }}>
                      {photo.fileName}
                    </Text>
                    {photo.note && (
                      <Text style={{ fontSize: Typography.body.fontSize, color: Colors.darkCharcoal }}>
                        {photo.note}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* 8. Debug/Test Mode Tools (only when Test Mode ON) */}
        {testMode && (
          <Card style={{ marginBottom: Spacing.md, borderWidth: 2, borderColor: Colors.warning }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: Spacing.md }}>
              <Ionicons name="bug-outline" size={20} color={Colors.warning} />
              <Text style={{ ...Typography.h2, marginLeft: Spacing.sm, color: Colors.warning }}>
                Test Mode Tools
              </Text>
            </View>

            <Text
              style={{
                fontSize: Typography.caption.fontSize,
                color: Colors.mediumGray,
                marginBottom: Spacing.md,
              }}
            >
              These tools are only visible when Test Mode is enabled in Settings
            </Text>

            <View style={{ gap: Spacing.sm }}>
              <Pressable
                onPress={handleCopy}
                style={{
                  backgroundColor: Colors.primaryBlue,
                  borderRadius: BorderRadius.default,
                  paddingVertical: Spacing.md,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="copy-outline" size={20} color={Colors.white} />
                <Text
                  style={{
                    fontSize: Typography.body.fontSize,
                    fontWeight: "600",
                    color: Colors.white,
                    marginLeft: Spacing.sm,
                  }}
                >
                  Copy Summary to Clipboard
                </Text>
              </Pressable>

              <Pressable
                onPress={handleShare}
                style={{
                  backgroundColor: Colors.primaryBlue,
                  borderRadius: BorderRadius.default,
                  paddingVertical: Spacing.md,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="share-outline" size={20} color={Colors.white} />
                <Text
                  style={{
                    fontSize: Typography.body.fontSize,
                    fontWeight: "600",
                    color: Colors.white,
                    marginLeft: Spacing.sm,
                  }}
                >
                  Share Summary
                </Text>
              </Pressable>
            </View>
          </Card>
        )}

        {/* Standard Action Buttons (only visible when NOT in test mode) */}
        {!testMode && (
          <View style={{ gap: Spacing.sm, marginBottom: Spacing.xl }}>
            <Pressable
              onPress={handleShare}
              style={{
                backgroundColor: Colors.primaryBlue,
                borderRadius: BorderRadius.default,
                paddingVertical: Spacing.md,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                ...Shadows.card,
              }}
              accessibilityRole="button"
              accessibilityLabel="Share contractor summary"
            >
              <Ionicons name="share-outline" size={20} color={Colors.white} />
              <Text
                style={{
                  fontSize: Typography.body.fontSize,
                  fontWeight: "600",
                  color: Colors.white,
                  marginLeft: Spacing.sm,
                }}
              >
                Share Summary
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
