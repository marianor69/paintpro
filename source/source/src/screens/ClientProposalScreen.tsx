import React from "react";
import { View, Text, ScrollView, Pressable, Alert, Share } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { useProjectStore } from "../state/projectStore";
import { usePricingStore } from "../state/pricingStore";
import {
  calculateFilteredProjectSummary,
  formatCurrency,
  getDefaultQuoteBuilder,
} from "../utils/calculations";
import { format } from "date-fns";
import Clipboard from "@react-native-clipboard/clipboard";
import * as SMS from "expo-sms";
import { Ionicons } from "@expo/vector-icons";

type Props = NativeStackScreenProps<RootStackParamList, "ClientProposal">;

export default function ClientProposalScreen({ route, navigation }: Props) {
  const { projectId } = route.params;

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

  // Use ACTIVE QUOTE's QuoteBuilder (single source of truth)
  // This ensures consistency with RoomEditorScreen which also uses activeQuote
  const activeQuote = project.quotes?.find(q => q.id === project.activeQuoteId);
  const quoteBuilder = activeQuote?.quoteBuilder || project.quoteBuilder || getDefaultQuoteBuilder();
  const summary = calculateFilteredProjectSummary(project, pricing, quoteBuilder);

  const generateProposalText = () => {
    let text = `Painting Estimate — ${project.clientInfo.address}\n`;
    text += `Client: ${project.clientInfo.name}\n`;
    text += `Date: ${format(new Date(), "MMM d, yyyy")}\n\n`;

    summary.itemizedPrices.forEach((item) => {
      text += `${item.name} — ${formatCurrency(item.price)}\n`;
    });

    text += `\nTOTAL: ${formatCurrency(summary.grandTotal)}\n\n`;

    // Paint Options Section (if enabled and available)
    if (quoteBuilder.showPaintOptionsInProposal && summary.paintOptionResults && summary.paintOptionResults.length > 0) {
      text += `PAINT QUALITY OPTIONS:\n`;
      text += `Choose from different paint quality levels\n\n`;

      summary.paintOptionResults.forEach((result, index) => {
        const optionLetter = String.fromCharCode(65 + index); // A, B, C
        text += `OPTION ${optionLetter} — ${result.optionName} — ${formatCurrency(result.total)}\n`;
        text += `  ${result.notes}\n`;
        text += `  Includes ${result.wallGallons.toFixed(1)} gallons of wall paint\n\n`;
      });
    }

    // Add project details
    text += `PROJECT DETAILS:\n`;

    // Coats information
    const coats = project.projectCoats || 2;
    text += `• ${coats} coat${coats > 1 ? "s" : ""} (walls and ceilings)\n`;

    // What's included - based on actual calculated values
    text += `\nINCLUDED:\n`;
    if (summary.totalWallGallons > 0) {
      text += `• Walls\n`;
    }
    if (summary.totalCeilingGallons > 0) {
      text += `• Ceilings\n`;
    }

    // Check if any room includes doors
    const includesDoors = project.rooms.some(
      (r) => r.included !== false && r.includeDoors !== false && r.doorCount > 0
    );
    if (includesDoors) {
      const paintDoors = project.rooms.some(
        (r) => r.included !== false && r.paintDoors === true
      );
      if (paintDoors && summary.totalDoors > 0) {
        text += `• Door surfaces (${summary.totalDoors} door${summary.totalDoors > 1 ? "s" : ""})\n`;
      }
    }

    const paintJambs = project.rooms.some(
      (r) => r.included !== false && r.paintJambs === true
    );
    if (paintJambs) {
      text += `• Door jambs\n`;
    }

    // Check if any room includes windows
    const includesWindows = project.rooms.some(
      (r) => r.included !== false && r.includeWindows !== false && r.windowCount > 0
    );
    if (includesWindows) {
      const paintWindows = project.rooms.some(
        (r) => r.included !== false && r.paintWindows === true
      );
      if (paintWindows && summary.totalWindows > 0) {
        text += `• Window trim (${summary.totalWindows} window${summary.totalWindows > 1 ? "s" : ""})\n`;
      }
    }

    // Check if any room includes trim
    const paintBaseboard = project.rooms.some(
      (r) => r.included !== false && (r.paintBaseboard === true || project.paintBaseboard === true)
    );
    if (paintBaseboard) {
      text += `• Baseboards\n`;
    }

    const hasCrownMoulding = project.rooms.some(
      (r) => r.included !== false && r.hasCrownMoulding === true
    );
    if (hasCrownMoulding) {
      text += `• Crown moulding\n`;
    }

    // Staircases
    if (quoteBuilder.includeStaircases && project.staircases && project.staircases.length > 0) {
      text += `• Staircase components:\n`;
      const hasRisers = project.staircases.some((s) => s.riserCount > 0);
      const hasHandrails = project.staircases.some((s) => s.handrailLength > 0);
      const hasSpindles = project.staircases.some((s) => s.spindleCount > 0);

      if (hasRisers) {
        text += `  - Risers\n`;
      }
      if (hasHandrails) {
        text += `  - Handrails\n`;
      }
      if (hasSpindles) {
        text += `  - Spindles\n`;
      }
    }

    // Fireplaces
    if (quoteBuilder.includeFireplaces && project.fireplaces && project.fireplaces.length > 0) {
      text += `• Fireplace${project.fireplaces.length > 1 ? "s" : ""} (${project.fireplaces.length})\n`;
    }

    text += `\nIncludes all labor, paint, and materials.\n`;
    text += `Prepared on-site.`;

    return text;
  };

  const handleCopyToClipboard = () => {
    const text = generateProposalText();
    Clipboard.setString(text);
    Alert.alert("Copied", "Proposal copied to clipboard");
  };

  const handleShare = async () => {
    try {
      const text = generateProposalText();
      await Share.share({
        message: text,
      });
    } catch (error: any) {
      Alert.alert("Error", "Could not share proposal");
    }
  };

  const handleSendSMS = async () => {
    try {
      const isAvailable = await SMS.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert("SMS Not Available", "SMS is not available on this device");
        return;
      }

      const text = generateProposalText();
      const phoneNumber = project.clientInfo.phone;

      if (!phoneNumber) {
        Alert.alert(
          "No Phone Number",
          "Please add a phone number to the client info"
        );
        return;
      }

      await SMS.sendSMSAsync([phoneNumber], text);
    } catch (error: any) {
      Alert.alert("Error", "Could not send SMS");
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        <View className="p-6">
          {/* Custom Quote Notice */}
          {project.quoteBuilder && (
            <View className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4">
              <View className="flex-row items-center">
                <Ionicons name="filter" size={20} color="#9333EA" />
                <Text className="text-sm font-semibold text-purple-900 ml-2">
                  Custom Quote
                </Text>
              </View>
              <Text className="text-xs text-purple-700 mt-1">
                This proposal uses custom filters from Quote Builder. Edit filters to change what&apos;s included.
              </Text>
              <Pressable
                onPress={() => navigation.navigate("QuoteBuilder", { projectId })}
                className="mt-2 bg-purple-600 rounded-lg py-2 px-3 self-start active:bg-purple-700"
              >
                <Text className="text-white text-xs font-semibold">Edit Filters</Text>
              </Pressable>
            </View>
          )}

          {/* Header */}
          <View className="bg-white rounded-xl p-6 border border-gray-200 mb-4">
            <Text className="text-2xl font-bold text-gray-900 mb-2">
              Painting Estimate
            </Text>
            <Text className="text-base text-gray-600 mb-1">
              {project.clientInfo.address}
            </Text>
            <Text className="text-sm text-gray-500">
              Client: {project.clientInfo.name}
            </Text>
            <Text className="text-sm text-gray-500">
              Date: {format(new Date(), "MMM d, yyyy")}
            </Text>
          </View>

          {/* Line Items */}
          <View className="bg-white rounded-xl p-6 border border-gray-200 mb-4">
            {summary.itemizedPrices.map((item, index) => (
              <View
                key={index}
                className="flex-row justify-between mb-4 pb-4 border-b border-gray-100"
              >
                <Text className="text-base text-gray-900 flex-1 mr-4">
                  {item.name}
                </Text>
                <Text className="text-base font-semibold text-gray-900">
                  {formatCurrency(item.price)}
                </Text>
              </View>
            ))}

            {/* Total */}
            <View className="flex-row justify-between pt-4 border-t-2 border-gray-300">
              <Text className="text-xl font-bold text-gray-900">TOTAL</Text>
              <Text className="text-xl font-bold text-blue-600">
                {formatCurrency(summary.grandTotal)}
              </Text>
            </View>
          </View>

          {/* Paint Options (Good/Better/Best) - only show when there's wall area to paint */}
          {quoteBuilder.showPaintOptionsInProposal &&
           summary.paintOptionResults &&
           summary.paintOptionResults.length > 0 &&
           summary.totalWallSqFt > 0 && (
            <View className="bg-white rounded-xl p-6 border border-gray-200 mb-4">
              <Text className="text-lg font-bold text-gray-900 mb-2">
                Paint Quality Options
              </Text>
              <Text className="text-sm text-gray-600 mb-4">
                Choose from different paint quality levels for your walls
              </Text>

              {summary.paintOptionResults.map((result, index) => {
                const optionLetter = String.fromCharCode(65 + index); // A, B, C
                return (
                  <View
                    key={result.optionId}
                    className="mb-3 p-4 bg-gray-50 rounded-lg border-2 border-gray-200"
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-lg font-bold text-gray-900">
                        OPTION {optionLetter}
                      </Text>
                      <Text className="text-2xl font-bold text-blue-600">
                        {formatCurrency(result.total)}
                      </Text>
                    </View>

                    <Text className="text-base font-semibold text-gray-800 mb-1">
                      {result.optionName}
                    </Text>

                    <Text className="text-sm text-gray-600 mb-2">
                      {result.notes}
                    </Text>

                    <View className="flex-row items-center mt-1">
                      <Text className="text-xs text-gray-500">
                        Includes {result.wallGallons.toFixed(1)} gallons of wall paint, all labor, and materials
                      </Text>
                    </View>
                  </View>
                );
              })}

              <Text className="text-xs text-gray-500 mt-2 text-center italic">
                All options include the same labor and non-wall materials
              </Text>
            </View>
          )}

          {/* Footer */}
          <View className="bg-white rounded-xl p-6 border border-gray-200 mb-4">
            <Text className="text-sm text-gray-600 text-center">
              Includes all labor, paint, and materials.
            </Text>
            <Text className="text-sm text-gray-600 text-center mt-1">
              Prepared on-site.
            </Text>
          </View>

          {/* Preview Text */}
          <View className="bg-gray-100 rounded-xl p-4 mb-4">
            <Text className="text-xs font-medium text-gray-700 mb-2">
              TEXT MESSAGE PREVIEW
            </Text>
            <Text className="text-xs text-gray-600 font-mono">
              {generateProposalText()}
            </Text>
          </View>

          {/* Action Buttons */}
          <View className="gap-3">
            <Pressable
              onPress={handleCopyToClipboard}
              className="bg-white border border-gray-300 rounded-xl py-4 flex-row items-center justify-center active:bg-gray-50"
            >
              <Ionicons
                name="copy-outline"
                size={20}
                color="#374151"
                style={{ marginRight: 8 }}
              />
              <Text className="text-gray-900 text-base font-semibold">
                Copy to Clipboard
              </Text>
            </Pressable>

            <Pressable
              onPress={handleShare}
              className="bg-blue-600 rounded-xl py-4 flex-row items-center justify-center active:bg-blue-700"
            >
              <Ionicons
                name="share-outline"
                size={20}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text className="text-white text-base font-semibold">
                Share Proposal
              </Text>
            </Pressable>

            {project.clientInfo.phone && (
              <Pressable
                onPress={handleSendSMS}
                className="bg-green-600 rounded-xl py-4 flex-row items-center justify-center active:bg-green-700"
              >
                <Ionicons
                  name="chatbox-outline"
                  size={20}
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
                <Text className="text-white text-base font-semibold">
                  Send via Text
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
