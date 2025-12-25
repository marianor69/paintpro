import React from "react";
import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { useProjectStore } from "../state/projectStore";
import { useAppSettings } from "../state/appSettings";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius, Shadows } from "../utils/designSystem";
import { Card } from "../components/Card";

type Props = NativeStackScreenProps<RootStackParamList, "ProjectActions">;

export default function ProjectActionsScreen({ route, navigation }: Props) {
  const { projectId } = route.params;

  const project = useProjectStore((s) =>
    s.projects.find((p) => p.id === projectId)
  );
  const appSettings = useAppSettings();

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
                  onPress={() => {
                    // Export handled in ProjectDetailScreen for now
                    // This is just a placeholder
                  }}
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
                  onPress={() => {
                    // Export handled in ProjectDetailScreen for now
                  }}
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
                  onPress={() => {
                    // Export handled in ProjectDetailScreen for now
                  }}
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
