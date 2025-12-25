import React from "react";
import { View, Text, ScrollView, Pressable, Share, Alert } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { useProjectStore } from "../state/projectStore";
import { usePricingStore } from "../state/pricingStore";
import {
  calculateFilteredProjectSummary,
  calculateFilteredRoomMetrics,
  formatCurrency,
  calculatePaintPurchase,
  calculatePaintCost,
  safeNumber,
  calculateProjectClosetStats,
  getDefaultQuoteBuilder,
  isRoomIncludedInQuote,
} from "../utils/calculations";
import Clipboard from "@react-native-clipboard/clipboard";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = NativeStackScreenProps<RootStackParamList, "MaterialsSummary">;

export default function MaterialsSummaryScreen({ route }: Props) {
  const { projectId } = route.params;
  const insets = useSafeAreaInsets();

  const project = useProjectStore((s) =>
    s.projects.find((p) => p.id === projectId)
  );
  const pricing = usePricingStore();

  if (!project) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-lg text-gray-600">Project not found</Text>
      </View>
    );
  }

  // Use Quote Builder settings if available, otherwise use default (all included)
  const quoteBuilder = project.quoteBuilder || getDefaultQuoteBuilder();
  const summary = calculateFilteredProjectSummary(project, pricing, quoteBuilder);
  const closetStats = calculateProjectClosetStats(project, quoteBuilder);

  console.log("[MaterialsSummary] Project summary gallons:", {
    wall: summary.totalWallGallons,
    ceiling: summary.totalCeilingGallons,
    trim: summary.totalTrimGallons,
    door: summary.totalDoorGallons,
  });

  console.log("[MaterialsSummary] Room gallon data:", project.rooms.map(r => ({
    name: r.name,
    storedGallonUsage: r.gallonUsage,
  })));

  // Generate admin summary text
  const generateAdminSummary = () => {
    let text = `ADMIN MATERIALS SUMMARY — ${project.clientInfo?.address || "Project"}\n`;
    text += `Client: ${project.clientInfo?.name || "Unknown"}\n`;
    text += `Date: ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}\n\n`;

    text += `═══════════════════════════════════════\n`;
    text += `PAINT MATERIALS\n`;
    text += `═══════════════════════════════════════\n\n`;

    // Wall Paint
    if (safeNumber(summary.totalWallGallons, 0) > 0) {
      const purchase = calculatePaintPurchase(summary.totalWallGallons);
      const cost = calculatePaintCost(summary.totalWallGallons, pricing.wallPaintPerGallon, pricing.wallPaintPer5Gallon);
      text += `Wall Paint: ${safeNumber(summary.totalWallGallons, 0).toFixed(1)} gal\n`;
      text += `  Purchase: ${purchase.fiveGallonBuckets > 0 ? `${purchase.fiveGallonBuckets}×5gal` : ""}${purchase.fiveGallonBuckets > 0 && purchase.singleGallons > 0 ? " + " : ""}${purchase.singleGallons > 0 ? `${purchase.singleGallons}×1gal` : ""}\n`;
      text += `  Cost: ${formatCurrency(cost)}\n\n`;
    }

    // Ceiling Paint
    if (safeNumber(summary.totalCeilingGallons, 0) > 0) {
      const purchase = calculatePaintPurchase(summary.totalCeilingGallons);
      const cost = calculatePaintCost(summary.totalCeilingGallons, pricing.ceilingPaintPerGallon, pricing.ceilingPaintPer5Gallon);
      text += `Ceiling Paint: ${safeNumber(summary.totalCeilingGallons, 0).toFixed(1)} gal\n`;
      text += `  Purchase: ${purchase.fiveGallonBuckets > 0 ? `${purchase.fiveGallonBuckets}×5gal` : ""}${purchase.fiveGallonBuckets > 0 && purchase.singleGallons > 0 ? " + " : ""}${purchase.singleGallons > 0 ? `${purchase.singleGallons}×1gal` : ""}\n`;
      text += `  Cost: ${formatCurrency(cost)}\n\n`;
    }

    // Trim Paint
    if (safeNumber(summary.totalTrimGallons, 0) > 0) {
      const purchase = calculatePaintPurchase(summary.totalTrimGallons);
      const cost = calculatePaintCost(summary.totalTrimGallons, pricing.trimPaintPerGallon, pricing.trimPaintPer5Gallon);
      text += `Trim Paint: ${safeNumber(summary.totalTrimGallons, 0).toFixed(1)} gal\n`;
      text += `  Purchase: ${purchase.fiveGallonBuckets > 0 ? `${purchase.fiveGallonBuckets}×5gal` : ""}${purchase.fiveGallonBuckets > 0 && purchase.singleGallons > 0 ? " + " : ""}${purchase.singleGallons > 0 ? `${purchase.singleGallons}×1gal` : ""}\n`;
      text += `  Cost: ${formatCurrency(cost)}\n\n`;
    }

    // Door Paint
    if (safeNumber(summary.totalDoorGallons, 0) > 0) {
      const purchase = calculatePaintPurchase(summary.totalDoorGallons);
      const cost = calculatePaintCost(summary.totalDoorGallons, pricing.doorPaintPerGallon, pricing.doorPaintPer5Gallon);
      text += `Door Paint: ${safeNumber(summary.totalDoorGallons, 0).toFixed(1)} gal\n`;
      text += `  Purchase: ${purchase.fiveGallonBuckets > 0 ? `${purchase.fiveGallonBuckets}×5gal` : ""}${purchase.fiveGallonBuckets > 0 && purchase.singleGallons > 0 ? " + " : ""}${purchase.singleGallons > 0 ? `${purchase.singleGallons}×1gal` : ""}\n`;
      text += `  Cost: ${formatCurrency(cost)}\n\n`;
    }

    // Primer
    if (safeNumber(summary.totalPrimerGallons, 0) > 0) {
      const purchase = calculatePaintPurchase(summary.totalPrimerGallons);
      const cost = calculatePaintCost(summary.totalPrimerGallons, pricing.primerPerGallon, pricing.primerPer5Gallon);
      text += `Primer: ${safeNumber(summary.totalPrimerGallons, 0).toFixed(1)} gal\n`;
      text += `  Purchase: ${purchase.fiveGallonBuckets > 0 ? `${purchase.fiveGallonBuckets}×5gal` : ""}${purchase.fiveGallonBuckets > 0 && purchase.singleGallons > 0 ? " + " : ""}${purchase.singleGallons > 0 ? `${purchase.singleGallons}×1gal` : ""}\n`;
      text += `  Cost: ${formatCurrency(cost)}\n\n`;
    }

    text += `═══════════════════════════════════════\n`;
    text += `PROJECT SUMMARY\n`;
    text += `═══════════════════════════════════════\n\n`;
    text += `Total Doors: ${safeNumber(summary.totalDoors, 0)}\n`;
    text += `Total Windows: ${safeNumber(summary.totalWindows, 0)}\n\n`;

    // Closet Interior Cavities Section
    // Note: Closets are now included/excluded per-room via includeClosetInteriorInQuote
    const totalIncludedClosets = closetStats.includedSingleClosets + closetStats.includedDoubleClosets;
    const totalExcludedClosets = closetStats.excludedSingleClosets + closetStats.excludedDoubleClosets;

    if (totalIncludedClosets > 0 || totalExcludedClosets > 0) {
        text += `─────────────────────────────────────\n`;
        text += `CLOSET INTERIORS (2' deep cavities)\n`;
        text += `─────────────────────────────────────\n\n`;

        if (totalIncludedClosets > 0) {
          text += `Included in quote:\n`;
          if (closetStats.includedSingleClosets > 0) {
            text += `  ${closetStats.includedSingleClosets} single-door closet${closetStats.includedSingleClosets > 1 ? "s" : ""}\n`;
          }
          if (closetStats.includedDoubleClosets > 0) {
            text += `  ${closetStats.includedDoubleClosets} double-door closet${closetStats.includedDoubleClosets > 1 ? "s" : ""}\n`;
          }
          text += `  Wall area: ${closetStats.includedClosetWallArea.toFixed(1)} sqft\n`;
          text += `  Ceiling area: ${closetStats.includedClosetCeilingArea.toFixed(1)} sqft\n`;
          text += `  Baseboard: ${closetStats.includedClosetBaseboardLF.toFixed(1)} LF\n\n`;
        }

        if (totalExcludedClosets > 0) {
          text += `Excluded from quote:\n`;
          if (closetStats.excludedSingleClosets > 0) {
            text += `  ${closetStats.excludedSingleClosets} single-door closet${closetStats.excludedSingleClosets > 1 ? "s" : ""}\n`;
          }
          if (closetStats.excludedDoubleClosets > 0) {
            text += `  ${closetStats.excludedDoubleClosets} double-door closet${closetStats.excludedDoubleClosets > 1 ? "s" : ""}\n`;
          }
          text += `  Wall area: ${closetStats.excludedClosetWallArea.toFixed(1)} sqft\n`;
          text += `  Ceiling area: ${closetStats.excludedClosetCeilingArea.toFixed(1)} sqft\n`;
          text += `  Baseboard: ${closetStats.excludedClosetBaseboardLF.toFixed(1)} LF\n\n`;
        }
      }

    text += `═══════════════════════════════════════\n`;
    text += `COST BREAKDOWN\n`;
    text += `═══════════════════════════════════════\n\n`;
    text += `Total Labor — ${formatCurrency(summary.totalLaborCost)}\n`;
    text += `Total Materials — ${formatCurrency(summary.totalMaterialCost)}\n\n`;
    text += `GRAND TOTAL — ${formatCurrency(summary.grandTotal)}\n\n`;

    // Paint Options Section (Good/Better/Best)
    if (summary.paintOptionResults && summary.paintOptionResults.length > 0) {
      text += `═══════════════════════════════════════\n`;
      text += `PAINT SYSTEM OPTIONS\n`;
      text += `═══════════════════════════════════════\n\n`;

      summary.paintOptionResults.forEach((result, index) => {
        const optionLetter = String.fromCharCode(65 + index); // A, B, C, etc.
        text += `OPTION ${optionLetter} — ${result.optionName}\n`;
        text += `  ${result.notes}\n`;
        text += `  Wall Paint: ${result.wallGallons.toFixed(1)} gal\n`;
        text += `  Paint Cost: ${formatCurrency(result.wallPaintCost)}\n`;
        text += `  Labor: ${formatCurrency(result.laborCost)}\n`;
        text += `  Other Materials: ${formatCurrency(result.nonWallMaterialsCost)}\n`;
        text += `  TOTAL: ${formatCurrency(result.total)}\n\n`;
      });
    }

    text += `═══════════════════════════════════════\n`;
    text += `ROOM BREAKDOWN\n`;
    text += `═══════════════════════════════════════\n\n`;

    summary.itemizedPrices.forEach((item: { name: string; price: number }) => {
      text += `${item.name} — ${formatCurrency(item.price)}\n`;
    });

    text += `\n───────────────────────────────────────\n`;
    text += `Internal use only. Do not share with clients.\n`;

    return text;
  };

  const handleCopyToClipboard = () => {
    const text = generateAdminSummary();
    Clipboard.setString(text);
    Alert.alert("Copied!", "Admin summary copied to clipboard");
  };

  const handleShare = async () => {
    try {
      const text = generateAdminSummary();
      await Share.share({
        message: text,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="p-6">
        {/* Warning Banner */}
        <View className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <Text className="text-sm font-semibold text-yellow-900 mb-1">
            Admin View Only
          </Text>
          <Text className="text-sm text-yellow-700">
            This detailed breakdown is for internal use only. Do not share with
            clients.
          </Text>
        </View>

        {/* Paint Materials */}
        <View className="bg-white rounded-xl p-4 border border-gray-200 mb-4">
          <Text className="text-lg font-bold text-gray-900 mb-4">
            Paint Materials
          </Text>

          <View className="flex-row justify-between mb-3">
            <Text className="text-sm text-gray-600">Wall Paint</Text>
            <View className="items-end">
              <Text className="text-sm font-medium text-gray-900">
                {safeNumber(summary.totalWallGallons, 0).toFixed(1)} gal
              </Text>
              {(() => {
                const purchase = calculatePaintPurchase(summary.totalWallGallons);
                const cost = calculatePaintCost(
                  summary.totalWallGallons,
                  pricing.wallPaintPerGallon,
                  pricing.wallPaintPer5Gallon
                );
                return (
                  <>
                    <Text className="text-xs text-gray-500">
                      {purchase.fiveGallonBuckets > 0 && `${purchase.fiveGallonBuckets}×5gal`}
                      {purchase.fiveGallonBuckets > 0 && purchase.singleGallons > 0 && " + "}
                      {purchase.singleGallons > 0 && `${purchase.singleGallons}×1gal`}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {formatCurrency(cost)}
                    </Text>
                  </>
                );
              })()}
            </View>
          </View>

          <View className="flex-row justify-between mb-3">
            <Text className="text-sm text-gray-600">Ceiling Paint</Text>
            <View className="items-end">
              <Text className="text-sm font-medium text-gray-900">
                {safeNumber(summary.totalCeilingGallons, 0).toFixed(1)} gal
              </Text>
              {(() => {
                const purchase = calculatePaintPurchase(summary.totalCeilingGallons);
                const cost = calculatePaintCost(
                  summary.totalCeilingGallons,
                  pricing.ceilingPaintPerGallon,
                  pricing.ceilingPaintPer5Gallon
                );
                return (
                  <>
                    <Text className="text-xs text-gray-500">
                      {purchase.fiveGallonBuckets > 0 && `${purchase.fiveGallonBuckets}×5gal`}
                      {purchase.fiveGallonBuckets > 0 && purchase.singleGallons > 0 && " + "}
                      {purchase.singleGallons > 0 && `${purchase.singleGallons}×1gal`}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {formatCurrency(cost)}
                    </Text>
                  </>
                );
              })()}
            </View>
          </View>

          <View className="flex-row justify-between mb-3">
            <Text className="text-sm text-gray-600">Trim Paint</Text>
            <View className="items-end">
              <Text className="text-sm font-medium text-gray-900">
                {safeNumber(summary.totalTrimGallons, 0).toFixed(1)} gal
              </Text>
              {(() => {
                const purchase = calculatePaintPurchase(summary.totalTrimGallons);
                const cost = calculatePaintCost(
                  summary.totalTrimGallons,
                  pricing.trimPaintPerGallon,
                  pricing.trimPaintPer5Gallon
                );
                return (
                  <>
                    <Text className="text-xs text-gray-500">
                      {purchase.fiveGallonBuckets > 0 && `${purchase.fiveGallonBuckets}×5gal`}
                      {purchase.fiveGallonBuckets > 0 && purchase.singleGallons > 0 && " + "}
                      {purchase.singleGallons > 0 && `${purchase.singleGallons}×1gal`}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {formatCurrency(cost)}
                    </Text>
                  </>
                );
              })()}
            </View>
          </View>

          <View className="flex-row justify-between mb-3">
            <Text className="text-sm text-gray-600">Door Paint</Text>
            <View className="items-end">
              <Text className="text-sm font-medium text-gray-900">
                {safeNumber(summary.totalDoorGallons, 0).toFixed(1)} gal
              </Text>
              {(() => {
                const purchase = calculatePaintPurchase(summary.totalDoorGallons);
                const cost = calculatePaintCost(
                  summary.totalDoorGallons,
                  pricing.doorPaintPerGallon,
                  pricing.doorPaintPer5Gallon
                );
                return (
                  <>
                    <Text className="text-xs text-gray-500">
                      {purchase.fiveGallonBuckets > 0 && `${purchase.fiveGallonBuckets}×5gal`}
                      {purchase.fiveGallonBuckets > 0 && purchase.singleGallons > 0 && " + "}
                      {purchase.singleGallons > 0 && `${purchase.singleGallons}×1gal`}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {formatCurrency(cost)}
                    </Text>
                  </>
                );
              })()}
            </View>
          </View>

          {/* Primer - only show if > 0 */}
          {safeNumber(summary.totalPrimerGallons, 0) > 0 && (
            <View className="flex-row justify-between">
              <Text className="text-sm text-gray-600">Primer</Text>
              <View className="items-end">
                <Text className="text-sm font-medium text-gray-900">
                  {safeNumber(summary.totalPrimerGallons, 0).toFixed(1)} gal
                </Text>
                {(() => {
                  const purchase = calculatePaintPurchase(summary.totalPrimerGallons);
                  const cost = calculatePaintCost(
                    summary.totalPrimerGallons,
                    pricing.primerPerGallon,
                    pricing.primerPer5Gallon
                  );
                  return (
                    <>
                      <Text className="text-xs text-gray-500">
                        {purchase.fiveGallonBuckets > 0 && `${purchase.fiveGallonBuckets}×5gal`}
                        {purchase.fiveGallonBuckets > 0 && purchase.singleGallons > 0 && " + "}
                        {purchase.singleGallons > 0 && `${purchase.singleGallons}×1gal`}
                      </Text>
                      <Text className="text-xs text-gray-500">
                        {formatCurrency(cost)}
                      </Text>
                    </>
                  );
                })()}
              </View>
            </View>
          )}
        </View>

        {/* Per-Room Gallon Breakdown */}
        <View className="bg-white rounded-xl p-4 border border-gray-200 mb-4">
          <Text className="text-lg font-bold text-gray-900 mb-4">
            Per-Room Paint Usage (Decimal Gallons)
          </Text>

          {(project.rooms || []).map((room, index) => {
            // Skip excluded rooms
            if (room.included === false) return null;

            // Skip rooms filtered out by Quote Builder
            if (!isRoomIncludedInQuote(room, quoteBuilder)) return null;

            // Use stored gallon usage if available, otherwise calculate
            let gallonUsage: { wall: number; ceiling: number; trim: number; door: number };

            if (room.gallonUsage) {
              // Use stored gallon usage (preferred - single source of truth)
              gallonUsage = {
                wall: safeNumber(room.gallonUsage.wall, 0),
                ceiling: safeNumber(room.gallonUsage.ceiling, 0),
                trim: safeNumber(room.gallonUsage.trim, 0),
                door: safeNumber(room.gallonUsage.door, 0),
              };
            } else {
              // Fallback: calculate on the fly (for rooms not yet saved)
              const roomCalc = calculateFilteredRoomMetrics(room, pricing, project.projectCoats, project.projectIncludeClosetInteriorInQuote, quoteBuilder);
              gallonUsage = {
                wall: roomCalc.totalWallGallons,
                ceiling: roomCalc.totalCeilingGallons,
                trim: roomCalc.totalTrimGallons,
                door: roomCalc.totalDoorGallons,
              };
            }

            // Safe values for display
            const safeWall = safeNumber(gallonUsage.wall, 0);
            const safeCeiling = safeNumber(gallonUsage.ceiling, 0);
            const safeTrim = safeNumber(gallonUsage.trim, 0);
            const safeDoor = safeNumber(gallonUsage.door, 0);

            // Skip rooms with no paint usage after filtering
            if (safeWall === 0 && safeCeiling === 0 && safeTrim === 0 && safeDoor === 0) return null;

            return (
              <View
                key={room.id}
                className="mb-4 pb-4 border-b border-gray-100"
              >
                <Text className="text-sm font-semibold text-gray-800 mb-2">
                  {room.name || `Room ${index + 1}`}
                </Text>

                {safeWall > 0 && (
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-xs text-gray-600 ml-2">Wall:</Text>
                    <Text className="text-xs text-gray-900">
                      {safeWall.toFixed(1)} gal
                    </Text>
                  </View>
                )}

                {safeCeiling > 0 && (
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-xs text-gray-600 ml-2">Ceiling:</Text>
                    <Text className="text-xs text-gray-900">
                      {safeCeiling.toFixed(1)} gal
                    </Text>
                  </View>
                )}

                {safeTrim > 0 && (
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-xs text-gray-600 ml-2">Trim:</Text>
                    <Text className="text-xs text-gray-900">
                      {safeTrim.toFixed(1)} gal
                    </Text>
                  </View>
                )}

                {safeDoor > 0 && (
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-gray-600 ml-2">Door:</Text>
                    <Text className="text-xs text-gray-900">
                      {safeDoor.toFixed(1)} gal
                    </Text>
                  </View>
                )}
              </View>
            );
          })}

          {/* Project Totals */}
          <View className="mt-2 pt-3 border-t-2 border-gray-300">
            <Text className="text-sm font-bold text-gray-800 mb-2">
              Project Totals (Sum of all rooms)
            </Text>

            <View className="flex-row justify-between mb-1">
              <Text className="text-xs text-gray-700">Total Wall:</Text>
              <Text className="text-xs font-semibold text-gray-900">
                {safeNumber(summary.totalWallGallons, 0).toFixed(1)} gal
              </Text>
            </View>

            <View className="flex-row justify-between mb-1">
              <Text className="text-xs text-gray-700">Total Ceiling:</Text>
              <Text className="text-xs font-semibold text-gray-900">
                {safeNumber(summary.totalCeilingGallons, 0).toFixed(1)} gal
              </Text>
            </View>

            <View className="flex-row justify-between mb-1">
              <Text className="text-xs text-gray-700">Total Trim:</Text>
              <Text className="text-xs font-semibold text-gray-900">
                {safeNumber(summary.totalTrimGallons, 0).toFixed(1)} gal
              </Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-xs text-gray-700">Total Door:</Text>
              <Text className="text-xs font-semibold text-gray-900">
                {safeNumber(summary.totalDoorGallons, 0).toFixed(1)} gal
              </Text>
            </View>
          </View>

          {/* Optimized Bucket Breakdown */}
          <View className="mt-4 pt-3 border-t-2 border-blue-200 bg-blue-50 -mx-4 -mb-4 px-4 py-3 rounded-b-xl">
            <Text className="text-sm font-bold text-blue-900 mb-3">
              Optimized Paint Purchase (5-gal buckets prioritized)
            </Text>

            {summary.totalWallGallons > 0 && (
              <View className="flex-row justify-between mb-2">
                <Text className="text-xs text-blue-800">Wall Paint:</Text>
                <Text className="text-xs font-semibold text-blue-900">
                  {(() => {
                    const purchase = calculatePaintPurchase(summary.totalWallGallons);
                    return `${purchase.fiveGallonBuckets > 0 ? `${purchase.fiveGallonBuckets}×5gal` : ""}${purchase.fiveGallonBuckets > 0 && purchase.singleGallons > 0 ? " + " : ""}${purchase.singleGallons > 0 ? `${purchase.singleGallons}×1gal` : ""}`;
                  })()}
                </Text>
              </View>
            )}

            {summary.totalCeilingGallons > 0 && (
              <View className="flex-row justify-between mb-2">
                <Text className="text-xs text-blue-800">Ceiling Paint:</Text>
                <Text className="text-xs font-semibold text-blue-900">
                  {(() => {
                    const purchase = calculatePaintPurchase(summary.totalCeilingGallons);
                    return `${purchase.fiveGallonBuckets > 0 ? `${purchase.fiveGallonBuckets}×5gal` : ""}${purchase.fiveGallonBuckets > 0 && purchase.singleGallons > 0 ? " + " : ""}${purchase.singleGallons > 0 ? `${purchase.singleGallons}×1gal` : ""}`;
                  })()}
                </Text>
              </View>
            )}

            {summary.totalTrimGallons > 0 && (
              <View className="flex-row justify-between mb-2">
                <Text className="text-xs text-blue-800">Trim Paint:</Text>
                <Text className="text-xs font-semibold text-blue-900">
                  {(() => {
                    const purchase = calculatePaintPurchase(summary.totalTrimGallons);
                    return `${purchase.fiveGallonBuckets > 0 ? `${purchase.fiveGallonBuckets}×5gal` : ""}${purchase.fiveGallonBuckets > 0 && purchase.singleGallons > 0 ? " + " : ""}${purchase.singleGallons > 0 ? `${purchase.singleGallons}×1gal` : ""}`;
                  })()}
                </Text>
              </View>
            )}

            {summary.totalDoorGallons > 0 && (
              <View className="flex-row justify-between">
                <Text className="text-xs text-blue-800">Door Paint:</Text>
                <Text className="text-xs font-semibold text-blue-900">
                  {(() => {
                    const purchase = calculatePaintPurchase(summary.totalDoorGallons);
                    return `${purchase.fiveGallonBuckets > 0 ? `${purchase.fiveGallonBuckets}×5gal` : ""}${purchase.fiveGallonBuckets > 0 && purchase.singleGallons > 0 ? " + " : ""}${purchase.singleGallons > 0 ? `${purchase.singleGallons}×1gal` : ""}`;
                  })()}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Project Summary Counts */}
        <View className="bg-white rounded-xl p-4 border border-gray-200 mb-4">
          <Text className="text-lg font-bold text-gray-900 mb-4">
            Project Summary
          </Text>

          <View className="flex-row justify-between mb-3">
            <Text className="text-sm text-gray-600">Total Doors</Text>
            <Text className="text-sm font-medium text-gray-900">
              {summary.totalDoors}
            </Text>
          </View>

          <View className="flex-row justify-between">
            <Text className="text-sm text-gray-600">Total Windows</Text>
            <Text className="text-sm font-medium text-gray-900">
              {summary.totalWindows}
            </Text>
          </View>
        </View>

        {/* Closet Interiors Section */}
        {/* Note: Closets are now included/excluded per-room via includeClosetInteriorInQuote */}
        {(closetStats.includedSingleClosets + closetStats.includedDoubleClosets +
          closetStats.excludedSingleClosets + closetStats.excludedDoubleClosets) > 0 && (
          <View className="bg-white rounded-xl p-4 border border-gray-200 mb-4">
            <Text className="text-lg font-bold text-gray-900 mb-2">
              Closet Interiors (2&apos; deep cavities)
            </Text>
            <Text className="text-xs text-gray-500 mb-4">
              Each closet is treated as a real cavity with interior walls, ceiling, and baseboard
            </Text>

            {(closetStats.includedSingleClosets + closetStats.includedDoubleClosets) > 0 && (
              <View className="mb-3">
                <Text className="text-sm font-semibold text-green-700 mb-2">
                  ✓ Included in Quote
                </Text>
                {closetStats.includedSingleClosets > 0 && (
                  <View className="flex-row justify-between mb-1 ml-4">
                    <Text className="text-xs text-gray-600">Single-door closets:</Text>
                    <Text className="text-xs text-gray-900">{closetStats.includedSingleClosets}</Text>
                  </View>
                )}
                {closetStats.includedDoubleClosets > 0 && (
                  <View className="flex-row justify-between mb-1 ml-4">
                    <Text className="text-xs text-gray-600">Double-door closets:</Text>
                    <Text className="text-xs text-gray-900">{closetStats.includedDoubleClosets}</Text>
                  </View>
                )}
                <View className="flex-row justify-between mb-1 ml-4">
                  <Text className="text-xs text-gray-600">Wall area:</Text>
                  <Text className="text-xs text-gray-900">{closetStats.includedClosetWallArea.toFixed(1)} sqft</Text>
                </View>
                <View className="flex-row justify-between mb-1 ml-4">
                  <Text className="text-xs text-gray-600">Ceiling area:</Text>
                  <Text className="text-xs text-gray-900">{closetStats.includedClosetCeilingArea.toFixed(1)} sqft</Text>
                </View>
                <View className="flex-row justify-between ml-4">
                  <Text className="text-xs text-gray-600">Baseboard:</Text>
                  <Text className="text-xs text-gray-900">{closetStats.includedClosetBaseboardLF.toFixed(1)} LF</Text>
                </View>
              </View>
            )}

            {(closetStats.excludedSingleClosets + closetStats.excludedDoubleClosets) > 0 && (
              <View className="mt-2 pt-2 border-t border-gray-200">
                <Text className="text-sm font-semibold text-red-700 mb-2">
                  ✗ Excluded from Quote
                </Text>
                {closetStats.excludedSingleClosets > 0 && (
                  <View className="flex-row justify-between mb-1 ml-4">
                    <Text className="text-xs text-gray-600">Single-door closets:</Text>
                    <Text className="text-xs text-gray-900">{closetStats.excludedSingleClosets}</Text>
                  </View>
                )}
                {closetStats.excludedDoubleClosets > 0 && (
                  <View className="flex-row justify-between mb-1 ml-4">
                    <Text className="text-xs text-gray-600">Double-door closets:</Text>
                    <Text className="text-xs text-gray-900">{closetStats.excludedDoubleClosets}</Text>
                  </View>
                )}
                <View className="flex-row justify-between mb-1 ml-4">
                  <Text className="text-xs text-gray-600">Wall area:</Text>
                  <Text className="text-xs text-gray-900">{closetStats.excludedClosetWallArea.toFixed(1)} sqft</Text>
                </View>
                <View className="flex-row justify-between mb-1 ml-4">
                  <Text className="text-xs text-gray-600">Ceiling area:</Text>
                  <Text className="text-xs text-gray-900">{closetStats.excludedClosetCeilingArea.toFixed(1)} sqft</Text>
                </View>
                <View className="flex-row justify-between ml-4">
                  <Text className="text-xs text-gray-600">Baseboard:</Text>
                  <Text className="text-xs text-gray-900">{closetStats.excludedClosetBaseboardLF.toFixed(1)} LF</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Cost Breakdown */}
        <View className="bg-white rounded-xl p-4 border border-gray-200 mb-4">
          <Text className="text-lg font-bold text-gray-900 mb-4">
            Cost Breakdown
          </Text>

          <View className="flex-row justify-between mb-3">
            <Text className="text-sm text-gray-600">Total Labor</Text>
            <Text className="text-sm font-medium text-gray-900">
              {formatCurrency(summary.totalLaborCost)}
            </Text>
          </View>

          <View className="flex-row justify-between mb-3">
            <Text className="text-sm text-gray-600">Total Materials</Text>
            <Text className="text-sm font-medium text-gray-900">
              {formatCurrency(summary.totalMaterialCost)}
            </Text>
          </View>

          <View className="border-t border-gray-200 mt-3 pt-3">
            <View className="flex-row justify-between">
              <Text className="text-base font-bold text-gray-900">
                Grand Total
              </Text>
              <Text className="text-base font-bold text-blue-600">
                {formatCurrency(summary.grandTotal)}
              </Text>
            </View>
          </View>
        </View>

        {/* Paint System Options (Good/Better/Best) */}
        {summary.paintOptionResults && summary.paintOptionResults.length > 0 && (
          <View className="bg-white rounded-xl p-4 border border-gray-200 mb-4">
            <Text className="text-lg font-bold text-gray-900 mb-2">
              Paint System Options
            </Text>
            <Text className="text-xs text-gray-500 mb-4">
              Different paint quality levels with adjusted pricing
            </Text>

            {summary.paintOptionResults.map((result, index) => {
              const optionLetter = String.fromCharCode(65 + index); // A, B, C
              return (
                <View
                  key={result.optionId}
                  className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-base font-bold text-gray-900">
                      OPTION {optionLetter} — {result.optionName}
                    </Text>
                    <Text className="text-lg font-bold text-blue-600">
                      {formatCurrency(result.total)}
                    </Text>
                  </View>

                  <Text className="text-xs text-gray-600 mb-3 italic">
                    {result.notes}
                  </Text>

                  <View className="flex-row justify-between mb-1">
                    <Text className="text-xs text-gray-600">Wall Paint:</Text>
                    <Text className="text-xs text-gray-900">
                      {result.wallGallons.toFixed(1)} gal — {formatCurrency(result.wallPaintCost)}
                    </Text>
                  </View>

                  <View className="flex-row justify-between mb-1">
                    <Text className="text-xs text-gray-600">Labor:</Text>
                    <Text className="text-xs text-gray-900">
                      {formatCurrency(result.laborCost)}
                    </Text>
                  </View>

                  <View className="flex-row justify-between">
                    <Text className="text-xs text-gray-600">Other Materials:</Text>
                    <Text className="text-xs text-gray-900">
                      {formatCurrency(result.nonWallMaterialsCost)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Room Breakdown */}
        <View className="bg-white rounded-xl p-4 border border-gray-200">
          <Text className="text-lg font-bold text-gray-900 mb-4">
            Room Breakdown
          </Text>

          {summary.itemizedPrices.map((item: { name: string; price: number }, index: number) => (
            <View
              key={index}
              className="flex-row justify-between mb-3 pb-3 border-b border-gray-100"
            >
              <Text className="text-sm text-gray-600">{item.name}</Text>
              <Text className="text-sm font-medium text-gray-900">
                {formatCurrency(item.price)}
              </Text>
            </View>
          ))}
        </View>
      </View>
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <View className="flex-row gap-3">
          <Pressable
            onPress={handleCopyToClipboard}
            className="flex-1 bg-gray-100 rounded-xl py-3 items-center active:bg-gray-200"
          >
            <View className="flex-row items-center gap-2">
              <Ionicons name="copy-outline" size={20} color="#374151" />
              <Text className="text-gray-900 font-semibold">Copy</Text>
            </View>
          </Pressable>
          <Pressable
            onPress={handleShare}
            className="flex-1 bg-blue-600 rounded-xl py-3 items-center active:bg-blue-700"
          >
            <View className="flex-row items-center gap-2">
              <Ionicons name="share-outline" size={20} color="#FFFFFF" />
              <Text className="text-white font-semibold">Share</Text>
            </View>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
