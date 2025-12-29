import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { useProjectStore } from "../state/projectStore";
import { QuoteBuilder } from "../types/painting";
import { getDefaultQuoteBuilder } from "../utils/calculations";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, Typography, Spacing, BorderRadius, Shadows, TextInputStyles } from "../utils/designSystem";
import { Card } from "../components/Card";
import { Toggle } from "../components/Toggle";

type Props = NativeStackScreenProps<RootStackParamList, "QuoteBuilder">;

export default function QuoteBuilderScreen({ route, navigation }: Props) {
  const { projectId } = route.params;
  const insets = useSafeAreaInsets();

  const project = useProjectStore((s) =>
    s.projects.find((p) => p.id === projectId)
  );
  const getActiveQuote = useProjectStore((s) => s.getActiveQuote);
  const updateQuote = useProjectStore((s) => s.updateQuote);
  const updateQuoteBuilder = useProjectStore((s) => s.updateQuoteBuilder); // Legacy support

  // Get the active quote
  const activeQuote = getActiveQuote(projectId);

  // Initialize Quote Builder state from active quote or default
  const [qb, setQb] = useState<QuoteBuilder>(
    activeQuote?.quoteBuilder || getDefaultQuoteBuilder()
  );

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Sync with active quote's quoteBuilder when it changes
  useEffect(() => {
    const currentActiveQuote = getActiveQuote(projectId);
    if (currentActiveQuote?.quoteBuilder) {
      const mergedQB = {
        ...getDefaultQuoteBuilder(), // ensures new fields get default values
        ...currentActiveQuote.quoteBuilder, // ensures active quote overrides defaults
      };

      console.log("[QuoteBuilder] Initializing from active quote:", {
        quoteId: currentActiveQuote.id,
        quoteTitle: currentActiveQuote.title,
        includeAllRooms: mergedQB.includeAllRooms,
        includedRoomIds: mergedQB.includedRoomIds,
        roomCount: mergedQB.includedRoomIds?.length || 0,
      });

      setQb(mergedQB);
    }
  }, [activeQuote?.id, activeQuote?.quoteBuilder]);

  // Track unsaved changes
  useEffect(() => {
    const originalQb = activeQuote?.quoteBuilder || getDefaultQuoteBuilder();
    const hasChanges = JSON.stringify(qb) !== JSON.stringify(originalQb);
    setHasUnsavedChanges(hasChanges);
  }, [qb, activeQuote]);

  if (!project || !activeQuote) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.backgroundWarmGray }}>
        <Text style={{ fontSize: Typography.h3.fontSize, color: Colors.mediumGray }}>
          {!project ? "Project not found" : "No active quote"}
        </Text>
      </View>
    );
  }

  const handleSave = () => {
    if (!activeQuote) return;

    // Ensure includedRoomIds is properly set based on includeAllRooms mode
    const updatedQB = {
      ...qb,
      includedRoomIds: qb.includeAllRooms
        ? [] // Safe: engine ignores includedRoomIds when includeAllRooms = true
        : qb.includedRoomIds, // Preserve selected rooms
    };

    console.log("[QuoteBuilder] Saving to active quote:", {
      quoteId: activeQuote.id,
      quoteTitle: activeQuote.title,
      includeAllRooms: updatedQB.includeAllRooms,
      includedRoomIds: updatedQB.includedRoomIds,
      roomCount: updatedQB.includedRoomIds.length,
    });

    // Update the active quote's quoteBuilder
    updateQuote(projectId, activeQuote.id, { quoteBuilder: updatedQB });

    // Also update legacy project.quoteBuilder for backward compatibility
    updateQuoteBuilder(projectId, updatedQB);

    Alert.alert("Saved", `Quote "${activeQuote.title}" settings saved successfully`);
    setHasUnsavedChanges(false);
  };

  const handleReset = () => {
    Alert.alert(
      "Reset to Default",
      "This will reset all Quote Builder settings to include everything. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            if (!activeQuote) return;
            const defaultQb = getDefaultQuoteBuilder();
            setQb(defaultQb);
            updateQuote(projectId, activeQuote.id, { quoteBuilder: defaultQb });
            updateQuoteBuilder(projectId, defaultQb); // Legacy support
          },
        },
      ]
    );
  };

  // Preset configurations
  const applyPreset = (presetName: string) => {
    let newQb: QuoteBuilder;
    switch (presetName) {
      case "full":
        newQb = getDefaultQuoteBuilder();
        break;
      case "wallsCeilingsOnly":
        newQb = {
          ...getDefaultQuoteBuilder(),
          includeWalls: true,
          includeCeilings: true,
          includeTrim: false,
          includeDoors: false,
          includeWindows: false,
          includeBaseboards: false,
          includeClosets: true,
        };
        break;
      case "wallsOnly":
        newQb = {
          ...getDefaultQuoteBuilder(),
          includeWalls: true,
          includeCeilings: false,
          includeTrim: false,
          includeDoors: false,
          includeWindows: false,
          includeBaseboards: false,
          includeClosets: true,
        };
        break;
      case "ceilingsOnly":
        newQb = {
          ...getDefaultQuoteBuilder(),
          includeWalls: false,
          includeCeilings: true,
          includeTrim: false,
          includeDoors: false,
          includeWindows: false,
          includeBaseboards: false,
          includeClosets: false,
        };
        break;
      case "trimOnly":
        newQb = {
          ...getDefaultQuoteBuilder(),
          includeWalls: false,
          includeCeilings: false,
          includeTrim: true,
          includeDoors: true,
          includeWindows: true,
          includeBaseboards: true,
          includeClosets: false,
        };
        break;
      case "floor1Only":
        newQb = {
          ...getDefaultQuoteBuilder(),
          includeFloor2: false,
          includeFloor3: false,
          includeFloor4: false,
          includeFloor5: false,
        };
        break;
      case "floor2Only":
        newQb = {
          ...getDefaultQuoteBuilder(),
          includeFloor1: false,
          includeFloor3: false,
          includeFloor4: false,
          includeFloor5: false,
        };
        break;
      case "rentalRefresh":
        newQb = {
          ...getDefaultQuoteBuilder(),
          includeWalls: true,
          includeCeilings: false,
          includeTrim: false,
          includeDoors: false,
          includeWindows: false,
          includeBaseboards: false,
          includeClosets: false,
          includeStaircases: false,
          includeFireplaces: false,
        };
        break;
      case "resetAllOff":
        newQb = {
          ...getDefaultQuoteBuilder(),
          includeWalls: false,
          includeCeilings: false,
          includeTrim: false,
          includeDoors: false,
          includeWindows: false,
          includeBaseboards: false,
          includeClosets: false,
          includeStaircases: false,
          includeFireplaces: false,
        };
        break;
      default:
        newQb = getDefaultQuoteBuilder();
    }
    setQb(newQb);
  };

  // Helper functions to check if current state matches a preset
  const isFullInterior = (q: QuoteBuilder) => {
    return q.includeWalls && q.includeCeilings && q.includeTrim &&
           q.includeDoors && q.includeWindows && q.includeBaseboards &&
           q.includeClosets && q.includeStaircases && q.includeFireplaces;
  };

  const isWallsCeilingsOnly = (q: QuoteBuilder) => {
    return q.includeWalls && q.includeCeilings && !q.includeTrim &&
           !q.includeDoors && !q.includeWindows && !q.includeBaseboards;
  };

  const isWallsOnly = (q: QuoteBuilder) => {
    return q.includeWalls && !q.includeCeilings && !q.includeTrim &&
           !q.includeDoors && !q.includeWindows && !q.includeBaseboards;
  };

  const isCeilingsOnly = (q: QuoteBuilder) => {
    return !q.includeWalls && q.includeCeilings && !q.includeTrim &&
           !q.includeDoors && !q.includeWindows && !q.includeBaseboards && !q.includeClosets;
  };

  const isTrimOnly = (q: QuoteBuilder) => {
    return !q.includeWalls && !q.includeCeilings && q.includeTrim &&
           q.includeDoors && q.includeWindows && q.includeBaseboards && !q.includeClosets;
  };

  const isRentalRefresh = (q: QuoteBuilder) => {
    return q.includeWalls && !q.includeCeilings && !q.includeTrim &&
           !q.includeDoors && !q.includeWindows && !q.includeBaseboards &&
           !q.includeClosets && !q.includeStaircases && !q.includeFireplaces;
  };

  const isResetAllOff = (q: QuoteBuilder) => {
    return !q.includeWalls && !q.includeCeilings && !q.includeTrim &&
           !q.includeDoors && !q.includeWindows && !q.includeBaseboards &&
           !q.includeClosets && !q.includeStaircases && !q.includeFireplaces;
  };

  const toggleField = (field: keyof QuoteBuilder) => {
    setQb((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const toggleRoom = (roomId: string) => {
    setQb((prev) => {
      const newIncludedRoomIds = prev.includedRoomIds.includes(roomId)
        ? prev.includedRoomIds.filter((id) => id !== roomId)
        : [...prev.includedRoomIds, roomId];
      return {
        ...prev,
        includedRoomIds: newIncludedRoomIds,
      };
    });
  };

  // Get max floor count
  const maxFloor = Math.max(1, ...(project.rooms.map((r) => r.floor || 1)));

  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: Colors.backgroundWarmGray }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        <View style={{ padding: Spacing.lg }}>
          {/* Header */}
          <View style={{ marginBottom: Spacing.lg }}>
            <Text style={{ fontSize: Typography.h1.fontSize, fontWeight: "700", color: Colors.darkCharcoal, marginBottom: Spacing.sm }}>
              Quote Builder
            </Text>
            <Text style={{ fontSize: Typography.body.fontSize, color: Colors.mediumGray }}>
              Customize what appears in customer proposals without changing the project
            </Text>
          </View>

          {/* Active Quote Banner */}
          <View style={{ backgroundColor: Colors.primaryBlueLight, borderRadius: BorderRadius.default, padding: Spacing.md, borderWidth: 1, borderColor: Colors.primaryBlue, marginBottom: Spacing.md }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.primaryBlue, fontWeight: "600", marginBottom: Spacing.xs }}>
                  Editing Quote:
                </Text>
                <Text style={{ fontSize: Typography.h3.fontSize, fontWeight: "700", color: Colors.primaryBlueDark }}>
                  {activeQuote.title}
                </Text>
              </View>
              <Pressable
                onPress={() => navigation.navigate("QuoteManager", { projectId })}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? Colors.primaryBlueDark : Colors.primaryBlue,
                  borderRadius: BorderRadius.default,
                  paddingHorizontal: Spacing.md,
                  paddingVertical: Spacing.sm,
                })}
              >
                <Text style={{ color: Colors.white, fontWeight: "600", fontSize: Typography.caption.fontSize }}>
                  Manage Quotes
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Presets */}
          <Card style={{ marginBottom: Spacing.md }}>
            <Text style={{ fontSize: Typography.h3.fontSize, fontWeight: "700", color: Colors.darkCharcoal, marginBottom: Spacing.md }}>
              Quick Presets
            </Text>
            <Toggle
              label="Full Interior"
              description="Include all paint categories and structural elements"
              value={isFullInterior(qb)}
              onValueChange={() => applyPreset("full")}
            />
            <Toggle
              label="Walls + Ceilings"
              description="Walls and ceilings only, no trim"
              value={isWallsCeilingsOnly(qb)}
              onValueChange={() => applyPreset("wallsCeilingsOnly")}
            />
            <Toggle
              label="Walls Only"
              description="Just walls, nothing else"
              value={isWallsOnly(qb)}
              onValueChange={() => applyPreset("wallsOnly")}
            />
            <Toggle
              label="Ceilings Only"
              description="Just ceilings, nothing else"
              value={isCeilingsOnly(qb)}
              onValueChange={() => applyPreset("ceilingsOnly")}
            />
            <Toggle
              label="Trim Package"
              description="Trim, doors, windows, baseboards only"
              value={isTrimOnly(qb)}
              onValueChange={() => applyPreset("trimOnly")}
            />
            <Toggle
              label="Rental Refresh"
              description="Walls only, quick turnover"
              value={isRentalRefresh(qb)}
              onValueChange={() => applyPreset("rentalRefresh")}
            />
            <Toggle
              label="Reset All Off"
              description="Turn off all categories"
              value={isResetAllOff(qb)}
              onValueChange={() => applyPreset("resetAllOff")}
            />
          </Card>

          {/* Scope by Floor */}
          {maxFloor > 1 && (
            <Card style={{ marginBottom: Spacing.md }}>
              <Text style={{ fontSize: Typography.h3.fontSize, fontWeight: "700", color: Colors.darkCharcoal, marginBottom: Spacing.sm }}>
                Scope by Floor
              </Text>
              {[1, 2, 3, 4, 5].slice(0, maxFloor).map((floor) => (
                <Toggle
                  key={floor}
                  label={`Floor ${floor}`}
                  value={qb[`includeFloor${floor}` as keyof QuoteBuilder] as boolean}
                  onValueChange={() => toggleField(`includeFloor${floor}` as keyof QuoteBuilder)}
                />
              ))}
            </Card>
          )}

          {/* Scope by Room */}
          <Card style={{ marginBottom: Spacing.md }}>
            <Text style={{ fontSize: Typography.h3.fontSize, fontWeight: "700", color: Colors.darkCharcoal, marginBottom: Spacing.sm }}>
              Scope by Room
            </Text>
            <Toggle
              label="Include All Rooms"
              value={qb.includeAllRooms}
              onValueChange={() => toggleField("includeAllRooms")}
            />
            {!qb.includeAllRooms && (
              <View style={{ marginTop: Spacing.sm, paddingLeft: Spacing.md, borderLeftWidth: 2, borderLeftColor: Colors.primaryBlueLight }}>
                <Text style={{ fontSize: Typography.caption.fontSize, fontWeight: "600", color: Colors.mediumGray, marginBottom: Spacing.sm }}>
                  Select Rooms:
                </Text>
                {project.rooms.map((room) => (
                  <Pressable
                    key={room.id}
                    onPress={() => toggleRoom(room.id)}
                    style={{ flexDirection: "row", alignItems: "center", paddingVertical: Spacing.sm }}
                  >
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 4,
                        borderWidth: 2,
                        borderColor: qb.includedRoomIds.includes(room.id) ? Colors.primaryBlue : Colors.neutralGray,
                        backgroundColor: qb.includedRoomIds.includes(room.id) ? Colors.primaryBlue : Colors.white,
                        marginRight: Spacing.sm,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {qb.includedRoomIds.includes(room.id) && (
                        <Ionicons name="checkmark" size={14} color={Colors.white} />
                      )}
                    </View>
                    <Text style={{ fontSize: Typography.body.fontSize, color: Colors.darkCharcoal }}>
                      {room.name || "Unnamed Room"} {room.floor && `(Floor ${room.floor})`}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Structural Elements - nested under Scope by Room */}
            <View style={{ marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.neutralGray }}>
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600", color: Colors.darkCharcoal, marginBottom: Spacing.sm }}>
                Structural Elements
              </Text>
              <Toggle label="Staircases" value={qb.includeStaircases} onValueChange={() => toggleField("includeStaircases")} />
              <Toggle label="Fireplaces" value={qb.includeFireplaces} onValueChange={() => toggleField("includeFireplaces")} />
            </View>
          </Card>

          {/* Paint Category Filters (Combined AND Rule) */}
          <Card style={{ marginBottom: Spacing.md }}>
            <Text style={{ fontSize: Typography.h3.fontSize, fontWeight: "700", color: Colors.darkCharcoal, marginBottom: Spacing.sm }}>
              Paint Category Filters
            </Text>
            <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.sm }}>
              COMBINED AND RULE: A category is included ONLY if BOTH the room toggle AND this Quote Builder toggle are ON. If a room has paintWalls=false, walls will be excluded even if &quot;Include Walls&quot; is ON here.
            </Text>

            <Toggle label="Include Walls" value={qb.includeWalls} onValueChange={() => toggleField("includeWalls")} />
            <Toggle label="Include Ceilings" value={qb.includeCeilings} onValueChange={() => toggleField("includeCeilings")} />
            <Toggle label="Include Trim" value={qb.includeTrim} onValueChange={() => toggleField("includeTrim")} />
            <Toggle label="Include Doors" value={qb.includeDoors} onValueChange={() => toggleField("includeDoors")} />
            <Toggle label="Include Windows" value={qb.includeWindows} onValueChange={() => toggleField("includeWindows")} />
            <Toggle label="Include Baseboards" value={qb.includeBaseboards} onValueChange={() => toggleField("includeBaseboards")} />
            <Toggle label="Include Closets" value={qb.includeClosets} onValueChange={() => toggleField("includeClosets")} />
            <Toggle label="Include Primer" value={qb.includePrimer} onValueChange={() => toggleField("includePrimer")} />
          </Card>

          {/* Paint Options (Good/Better/Best) */}
          <Card style={{ marginBottom: Spacing.md }}>
            <Text style={{ fontSize: Typography.h3.fontSize, fontWeight: "700", color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
              Wall Paint Systems (Good / Better / Best)
            </Text>
            <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.md }}>
              Configure paint options for different quality levels and pricing
            </Text>

            {(qb.paintOptions || []).map((option, index) => (
              <View key={option.id} style={{ marginBottom: Spacing.md, padding: Spacing.sm, backgroundColor: Colors.backgroundWarmGray, borderRadius: BorderRadius.default, borderWidth: 1, borderColor: Colors.neutralGray }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: Spacing.sm }}>
                  <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600", color: Colors.darkCharcoal }}>
                    Option {String.fromCharCode(65 + index)}
                  </Text>
                  <Pressable
                    onPress={() => {
                      const newOptions = [...(qb.paintOptions || [])];
                      newOptions[index] = { ...newOptions[index], enabled: !newOptions[index].enabled };
                      setQb({ ...qb, paintOptions: newOptions });
                    }}
                    style={{
                      paddingHorizontal: Spacing.sm,
                      paddingVertical: Spacing.xs,
                      borderRadius: 20,
                      backgroundColor: option.enabled ? Colors.success : Colors.mediumGray,
                    }}
                  >
                    <Text style={{ color: Colors.white, fontSize: Typography.caption.fontSize, fontWeight: "700" }}>
                      {option.enabled ? "ENABLED" : "DISABLED"}
                    </Text>
                  </Pressable>
                </View>

                {option.enabled && (
                  <>
                    <View style={{ marginBottom: Spacing.sm }}>
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.xs }}>Name</Text>
                      <View style={TextInputStyles.container}>
                        <TextInput
                          value={option.name}
                          onChangeText={(text) => {
                            const newOptions = [...(qb.paintOptions || [])];
                            newOptions[index] = { ...newOptions[index], name: text };
                            setQb({ ...qb, paintOptions: newOptions });
                          }}
                          style={TextInputStyles.base}
                          placeholder="Paint name"
                          placeholderTextColor={Colors.mediumGray}
                        />
                      </View>
                    </View>

                    <View style={{ flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.sm }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.xs }}>Price/Gal</Text>
                        <View style={TextInputStyles.container}>
                          <TextInput
                            value={option.pricePerGallon.toString()}
                            onChangeText={(text) => {
                              const newOptions = [...(qb.paintOptions || [])];
                              newOptions[index] = { ...newOptions[index], pricePerGallon: parseFloat(text) || 0 };
                              setQb({ ...qb, paintOptions: newOptions });
                            }}
                            keyboardType="numeric"
                            style={TextInputStyles.base}
                            placeholder="40"
                            placeholderTextColor={Colors.mediumGray}
                          />
                        </View>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.xs }}>Coverage (sq ft)</Text>
                        <View style={TextInputStyles.container}>
                          <TextInput
                            value={option.coverageSqFt.toString()}
                            onChangeText={(text) => {
                              const newOptions = [...(qb.paintOptions || [])];
                              newOptions[index] = { ...newOptions[index], coverageSqFt: parseFloat(text) || 350 };
                              setQb({ ...qb, paintOptions: newOptions });
                            }}
                            keyboardType="numeric"
                            style={TextInputStyles.base}
                            placeholder="350"
                            placeholderTextColor={Colors.mediumGray}
                          />
                        </View>
                      </View>
                    </View>

                    <View style={{ flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.sm }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.xs }}>Material Markup</Text>
                        <View style={TextInputStyles.container}>
                          <TextInput
                            value={option.materialMarkup.toString()}
                            onChangeText={(text) => {
                              const newOptions = [...(qb.paintOptions || [])];
                              newOptions[index] = { ...newOptions[index], materialMarkup: parseFloat(text) || 1.0 };
                              setQb({ ...qb, paintOptions: newOptions });
                            }}
                            keyboardType="numeric"
                            style={TextInputStyles.base}
                            placeholder="1.10"
                            placeholderTextColor={Colors.mediumGray}
                          />
                        </View>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.xs }}>Labor Multiplier</Text>
                        <View style={TextInputStyles.container}>
                          <TextInput
                            value={option.laborMultiplier.toString()}
                            onChangeText={(text) => {
                              const newOptions = [...(qb.paintOptions || [])];
                              newOptions[index] = { ...newOptions[index], laborMultiplier: parseFloat(text) || 1.0 };
                              setQb({ ...qb, paintOptions: newOptions });
                            }}
                            keyboardType="numeric"
                            style={TextInputStyles.base}
                            placeholder="1.00"
                            placeholderTextColor={Colors.mediumGray}
                          />
                        </View>
                      </View>
                    </View>

                    <View>
                      <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.xs }}>Notes</Text>
                      <View style={{ ...TextInputStyles.container, minHeight: 60 }}>
                        <TextInput
                          value={option.notes}
                          onChangeText={(text) => {
                            const newOptions = [...(qb.paintOptions || [])];
                            newOptions[index] = { ...newOptions[index], notes: text };
                            setQb({ ...qb, paintOptions: newOptions });
                          }}
                          style={{ ...TextInputStyles.base, minHeight: 60, textAlignVertical: "top" }}
                          placeholder="Description of paint option"
                          placeholderTextColor={Colors.mediumGray}
                          multiline
                          numberOfLines={2}
                        />
                      </View>
                    </View>
                  </>
                )}
              </View>
            ))}

            <Toggle
              label="Show Paint Options in Proposal"
              value={qb.showPaintOptionsInProposal ?? true}
              onValueChange={() => {
                setQb({ ...qb, showPaintOptionsInProposal: !(qb.showPaintOptionsInProposal ?? true) });
              }}
            />
          </Card>
        </View>
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: Colors.white,
          borderTopWidth: 1,
          borderTopColor: Colors.neutralGray,
          padding: Spacing.md,
          paddingBottom: insets.bottom + Spacing.md,
        }}
      >
        <View style={{ flexDirection: "row", gap: Spacing.sm }}>
          <Pressable
            onPress={handleReset}
            style={({ pressed }) => ({
              flex: 1,
              backgroundColor: pressed ? Colors.neutralGray : Colors.backgroundWarmGray,
              borderRadius: BorderRadius.default,
              paddingVertical: Spacing.sm,
              alignItems: "center",
            })}
          >
            <Text style={{ color: Colors.darkCharcoal, fontWeight: "600" }}>Reset to Full</Text>
          </Pressable>
          <Pressable
            onPress={handleSave}
            disabled={!hasUnsavedChanges}
            style={({ pressed }) => ({
              flex: 1,
              borderRadius: BorderRadius.default,
              paddingVertical: Spacing.sm,
              alignItems: "center",
              backgroundColor: hasUnsavedChanges
                ? (pressed ? Colors.primaryBlueDark : Colors.primaryBlue)
                : Colors.neutralGray,
            })}
          >
            <Text style={{ color: Colors.white, fontWeight: "600" }}>
              {hasUnsavedChanges ? "Save Changes" : "No Changes"}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
