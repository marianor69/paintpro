import React from "react";
import { View, Text, ScrollView, Pressable, Alert, Share } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { useProjectStore } from "../state/projectStore";
import { usePricingStore } from "../state/pricingStore";
import { useAppSettings } from "../state/appSettings";
import {
  calculateFilteredProjectSummary,
  formatCurrency,
  getDefaultQuoteBuilder,
} from "../utils/calculations";
import { format } from "date-fns";
import Clipboard from "@react-native-clipboard/clipboard";
import * as SMS from "expo-sms";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius, Shadows } from "../utils/designSystem";
import { Card } from "../components/Card";

type Props = NativeStackScreenProps<RootStackParamList, "ClientProposal">;

export default function ClientProposalScreen({ route, navigation }: Props) {
  const { projectId } = route.params;

  const project = useProjectStore((s) =>
    s.projects.find((p) => p.id === projectId)
  );
  const pricing = usePricingStore();
  const testMode = useAppSettings((s) => s.testMode);

  if (!project) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.backgroundWarmGray }}>
        <Text style={{ fontSize: Typography.h3.fontSize, color: Colors.mediumGray }}>Project not found</Text>
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
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: Colors.backgroundWarmGray }}>
      <ScrollView style={{ flex: 1 }}>
        <View style={{ padding: Spacing.lg }}>
          {/* Page Name Indicator - only in test mode */}
          {testMode && (
            <View style={{ backgroundColor: Colors.neutralGray, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, marginBottom: Spacing.md }}>
              <Text style={{ fontSize: Typography.caption.fontSize, fontWeight: "700", color: Colors.error }}>
                PAGE: ClientProposalScreen
              </Text>
            </View>
          )}
          {/* Custom Quote Notice */}
          {project.quoteBuilder && (
            <View style={{ backgroundColor: "#F3E8FF", borderWidth: 1, borderColor: "#C084FC", borderRadius: BorderRadius.default, padding: Spacing.md, marginBottom: Spacing.md }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="filter" size={20} color="#9333EA" />
                <Text style={{ fontSize: Typography.caption.fontSize, fontWeight: "600", color: "#581C87", marginLeft: Spacing.sm }}>
                  Custom Quote
                </Text>
              </View>
              <Text style={{ fontSize: Typography.caption.fontSize, color: "#7E22CE", marginTop: Spacing.xs }}>
                This proposal uses custom filters from Quote Builder. Edit filters to change what&apos;s included.
              </Text>
              <Pressable
                onPress={() => navigation.navigate("QuoteBuilder", { projectId })}
                style={({ pressed }) => ({
                  marginTop: Spacing.sm,
                  backgroundColor: pressed ? "#7E22CE" : "#9333EA",
                  borderRadius: BorderRadius.default,
                  paddingVertical: Spacing.sm,
                  paddingHorizontal: Spacing.sm,
                  alignSelf: "flex-start",
                })}
              >
                <Text style={{ color: Colors.white, fontSize: Typography.caption.fontSize, fontWeight: "600" }}>Edit Filters</Text>
              </Pressable>
            </View>
          )}

          {/* Header */}
          <Card style={{ marginBottom: Spacing.md }}>
            <Text style={{ fontSize: Typography.h1.fontSize, fontWeight: "700", color: Colors.darkCharcoal, marginBottom: Spacing.sm }}>
              Painting Estimate
            </Text>
            <Text style={{ fontSize: Typography.body.fontSize, color: Colors.mediumGray, marginBottom: Spacing.xs }}>
              {project.clientInfo.address}
            </Text>
            <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
              Client: {project.clientInfo.name}
            </Text>
            <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
              Date: {format(new Date(), "MMM d, yyyy")}
            </Text>
          </Card>

          {/* Line Items */}
          <Card style={{ marginBottom: Spacing.md }}>
            {summary.itemizedPrices.map((item, index) => (
              <View
                key={index}
                style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.backgroundWarmGray }}
              >
                <Text style={{ fontSize: Typography.body.fontSize, color: Colors.darkCharcoal, flex: 1, marginRight: Spacing.md }}>
                  {item.name}
                </Text>
                <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600", color: Colors.darkCharcoal }}>
                  {formatCurrency(item.price)}
                </Text>
              </View>
            ))}

            {/* Total */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: Spacing.md, borderTopWidth: 2, borderTopColor: Colors.neutralGray }}>
              <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: "700", color: Colors.darkCharcoal }}>TOTAL</Text>
              <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: "700", color: Colors.primaryBlue }}>
                {formatCurrency(summary.grandTotal)}
              </Text>
            </View>
          </Card>

          {/* Paint Options (Good/Better/Best) - only show when there's wall area to paint */}
          {quoteBuilder.showPaintOptionsInProposal &&
           summary.paintOptionResults &&
           summary.paintOptionResults.length > 0 &&
           summary.totalWallSqFt > 0 && (
            <Card style={{ marginBottom: Spacing.md }}>
              <Text style={{ fontSize: Typography.h3.fontSize, fontWeight: "700", color: Colors.darkCharcoal, marginBottom: Spacing.sm }}>
                Paint Quality Options
              </Text>
              <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.md }}>
                Choose from different paint quality levels for your walls
              </Text>

              {summary.paintOptionResults.map((result, index) => {
                const optionLetter = String.fromCharCode(65 + index); // A, B, C
                return (
                  <View
                    key={result.optionId}
                    style={{ marginBottom: Spacing.sm, padding: Spacing.md, backgroundColor: Colors.backgroundWarmGray, borderRadius: BorderRadius.default, borderWidth: 2, borderColor: Colors.neutralGray }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: Spacing.sm }}>
                      <Text style={{ fontSize: Typography.h3.fontSize, fontWeight: "700", color: Colors.darkCharcoal }}>
                        OPTION {optionLetter}
                      </Text>
                      <Text style={{ fontSize: Typography.h1.fontSize, fontWeight: "700", color: Colors.primaryBlue }}>
                        {formatCurrency(result.total)}
                      </Text>
                    </View>

                    <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600", color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                      {result.optionName}
                    </Text>

                    <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.sm }}>
                      {result.notes}
                    </Text>

                    <View style={{ flexDirection: "row", alignItems: "center", marginTop: Spacing.xs }}>
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray }}>
                        Includes {result.wallGallons.toFixed(1)} gallons of wall paint, all labor, and materials
                      </Text>
                    </View>
                  </View>
                );
              })}

              <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginTop: Spacing.sm, textAlign: "center", fontStyle: "italic" }}>
                All options include the same labor and non-wall materials
              </Text>
            </Card>
          )}

          {/* Footer */}
          <Card style={{ marginBottom: Spacing.md }}>
            <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, textAlign: "center" }}>
              Includes all labor, paint, and materials.
            </Text>
            <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, textAlign: "center", marginTop: Spacing.xs }}>
              Prepared on-site.
            </Text>
          </Card>

          {/* Preview Text */}
          <View style={{ backgroundColor: Colors.neutralGray, borderRadius: BorderRadius.default, padding: Spacing.md, marginBottom: Spacing.md }}>
            <Text style={{ fontSize: Typography.caption.fontSize, fontWeight: "500", color: Colors.mediumGray, marginBottom: Spacing.sm }}>
              TEXT MESSAGE PREVIEW
            </Text>
            <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, fontFamily: "monospace" }}>
              {generateProposalText()}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={{ gap: Spacing.sm }}>
            <Pressable
              onPress={handleCopyToClipboard}
              style={({ pressed }) => ({
                backgroundColor: pressed ? Colors.neutralGray : Colors.white,
                borderRadius: BorderRadius.default,
                borderWidth: 1,
                borderColor: Colors.neutralGray,
                paddingVertical: Spacing.md,
                paddingHorizontal: Spacing.md,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              })}
            >
              <Ionicons
                name="copy-outline"
                size={18}
                color={Colors.darkCharcoal}
                style={{ marginRight: Spacing.sm }}
              />
              <Text style={{ color: Colors.darkCharcoal, fontSize: 15, fontWeight: "600" }}>
                Copy to Clipboard
              </Text>
            </Pressable>

            <Pressable
              onPress={handleShare}
              style={({ pressed }) => ({
                backgroundColor: pressed ? Colors.neutralGray : Colors.white,
                borderRadius: BorderRadius.default,
                borderWidth: 1,
                borderColor: Colors.neutralGray,
                paddingVertical: Spacing.md,
                paddingHorizontal: Spacing.md,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              })}
            >
              <Ionicons
                name="share-outline"
                size={18}
                color={Colors.darkCharcoal}
                style={{ marginRight: Spacing.sm }}
              />
              <Text style={{ color: Colors.darkCharcoal, fontSize: 15, fontWeight: "600" }}>
                Share Proposal
              </Text>
            </Pressable>

            {project.clientInfo.phone && (
              <Pressable
                onPress={handleSendSMS}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? Colors.neutralGray : Colors.white,
                  borderRadius: BorderRadius.default,
                  borderWidth: 1,
                  borderColor: Colors.neutralGray,
                  paddingVertical: Spacing.md,
                  paddingHorizontal: Spacing.md,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                })}
              >
                <Ionicons
                  name="chatbox-outline"
                  size={18}
                  color={Colors.darkCharcoal}
                  style={{ marginRight: Spacing.sm }}
                />
                <Text style={{ color: Colors.darkCharcoal, fontSize: 15, fontWeight: "600" }}>
                  Send via Text
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
