import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { useProjectStore } from "../state/projectStore";
import { QuoteBuilder } from "../types/painting";
import { getDefaultQuoteBuilder } from "../utils/calculations";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
      <View className="flex-1 items-center justify-center">
        <Text className="text-lg text-gray-600">
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
    <View className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        <View className="p-6">
          {/* Header */}
          <View className="mb-6">
            <Text className="text-3xl font-bold text-gray-900 mb-2">
              Quote Builder
            </Text>
            <Text className="text-base text-gray-600">
              Customize what appears in customer proposals without changing the project
            </Text>
          </View>

          {/* Active Quote Banner */}
          <View className="bg-blue-100 rounded-xl p-4 border border-blue-300 mb-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-sm text-blue-700 font-semibold mb-1">
                  Editing Quote:
                </Text>
                <Text className="text-lg font-bold text-blue-900">
                  {activeQuote.title}
                </Text>
              </View>
              <Pressable
                onPress={() => navigation.navigate("QuoteManager", { projectId })}
                className="bg-blue-600 rounded-lg px-4 py-2 active:bg-blue-700"
              >
                <Text className="text-white font-semibold text-sm">
                  Manage Quotes
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Presets */}
          <View className="bg-white rounded-xl p-4 border border-gray-200 mb-4">
            <Text className="text-lg font-bold text-gray-900 mb-3">
              Quick Presets
            </Text>
            <View className="flex-row flex-wrap gap-2">
              <Pressable
                onPress={() => applyPreset("full")}
                className="bg-blue-600 rounded-lg px-4 py-2 active:bg-blue-700"
              >
                <Text className="text-white font-semibold">Full Interior</Text>
              </Pressable>
              <Pressable
                onPress={() => applyPreset("wallsCeilingsOnly")}
                className="bg-blue-600 rounded-lg px-4 py-2 active:bg-blue-700"
              >
                <Text className="text-white font-semibold">Walls + Ceilings</Text>
              </Pressable>
              <Pressable
                onPress={() => applyPreset("wallsOnly")}
                className="bg-blue-600 rounded-lg px-4 py-2 active:bg-blue-700"
              >
                <Text className="text-white font-semibold">Walls Only</Text>
              </Pressable>
              <Pressable
                onPress={() => applyPreset("ceilingsOnly")}
                className="bg-blue-600 rounded-lg px-4 py-2 active:bg-blue-700"
              >
                <Text className="text-white font-semibold">Ceilings Only</Text>
              </Pressable>
              <Pressable
                onPress={() => applyPreset("trimOnly")}
                className="bg-blue-600 rounded-lg px-4 py-2 active:bg-blue-700"
              >
                <Text className="text-white font-semibold">Trim Package</Text>
              </Pressable>
              <Pressable
                onPress={() => applyPreset("rentalRefresh")}
                className="bg-blue-600 rounded-lg px-4 py-2 active:bg-blue-700"
              >
                <Text className="text-white font-semibold">Rental Refresh</Text>
              </Pressable>
              <Pressable
                onPress={() => applyPreset("resetAllOff")}
                className="bg-gray-600 rounded-lg px-4 py-2 active:bg-gray-700"
              >
                <Text className="text-white font-semibold">Reset All Off</Text>
              </Pressable>
              {maxFloor >= 2 && (
                <>
                  <Pressable
                    onPress={() => applyPreset("floor1Only")}
                    className="bg-blue-600 rounded-lg px-4 py-2 active:bg-blue-700"
                  >
                    <Text className="text-white font-semibold">Floor 1 Only</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => applyPreset("floor2Only")}
                    className="bg-blue-600 rounded-lg px-4 py-2 active:bg-blue-700"
                  >
                    <Text className="text-white font-semibold">Floor 2 Only</Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>

          {/* Scope by Floor */}
          {maxFloor > 1 && (
            <View className="bg-white rounded-xl p-4 border border-gray-200 mb-4">
              <Text className="text-lg font-bold text-gray-900 mb-3">
                Scope by Floor
              </Text>
              {[1, 2, 3, 4, 5].slice(0, maxFloor).map((floor) => (
                <ToggleRow
                  key={floor}
                  label={`Floor ${floor}`}
                  value={qb[`includeFloor${floor}` as keyof QuoteBuilder] as boolean}
                  onToggle={() => toggleField(`includeFloor${floor}` as keyof QuoteBuilder)}
                />
              ))}
            </View>
          )}

          {/* Scope by Room */}
          <View className="bg-white rounded-xl p-4 border border-gray-200 mb-4">
            <Text className="text-lg font-bold text-gray-900 mb-3">
              Scope by Room
            </Text>
            <ToggleRow
              label="Include All Rooms"
              value={qb.includeAllRooms}
              onToggle={() => toggleField("includeAllRooms")}
            />
            {!qb.includeAllRooms && (
              <View className="mt-3 pl-4 border-l-2 border-blue-200">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Select Rooms:
                </Text>
                {project.rooms.map((room) => (
                  <Pressable
                    key={room.id}
                    onPress={() => toggleRoom(room.id)}
                    className="flex-row items-center py-2"
                  >
                    <View
                      className={`w-5 h-5 rounded border-2 mr-3 items-center justify-center ${
                        qb.includedRoomIds.includes(room.id)
                          ? "bg-blue-600 border-blue-600"
                          : "border-gray-300"
                      }`}
                    >
                      {qb.includedRoomIds.includes(room.id) && (
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      )}
                    </View>
                    <Text className="text-base text-gray-900">
                      {room.name || "Unnamed Room"} {room.floor && `(Floor ${room.floor})`}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Paint Category Filters (Combined AND Rule) */}
          <View className="bg-white rounded-xl p-4 border border-gray-200 mb-4">
            <Text className="text-lg font-bold text-gray-900 mb-3">
              Paint Category Filters
            </Text>
            <Text className="text-sm text-gray-600 mb-3">
              COMBINED AND RULE: A category is included ONLY if BOTH the room toggle AND this Quote Builder toggle are ON. If a room has paintWalls=false, walls will be excluded even if &quot;Include Walls&quot; is ON here.
            </Text>

            <ToggleRow label="Include Walls" value={qb.includeWalls} onToggle={() => toggleField("includeWalls")} />
            <ToggleRow label="Include Ceilings" value={qb.includeCeilings} onToggle={() => toggleField("includeCeilings")} />
            <ToggleRow label="Include Trim" value={qb.includeTrim} onToggle={() => toggleField("includeTrim")} />
            <ToggleRow label="Include Doors" value={qb.includeDoors} onToggle={() => toggleField("includeDoors")} />
            <ToggleRow label="Include Windows" value={qb.includeWindows} onToggle={() => toggleField("includeWindows")} />
            <ToggleRow label="Include Baseboards" value={qb.includeBaseboards} onToggle={() => toggleField("includeBaseboards")} />
            <ToggleRow label="Include Closets" value={qb.includeClosets} onToggle={() => toggleField("includeClosets")} />
          </View>

          {/* Structural Elements */}
          <View className="bg-white rounded-xl p-4 border border-gray-200 mb-4">
            <Text className="text-lg font-bold text-gray-900 mb-3">
              Structural Elements
            </Text>

            <ToggleRow label="Staircases" value={qb.includeStaircases} onToggle={() => toggleField("includeStaircases")} />
            <ToggleRow label="Fireplaces" value={qb.includeFireplaces} onToggle={() => toggleField("includeFireplaces")} />
            <ToggleRow label="Primer" value={qb.includePrimer} onToggle={() => toggleField("includePrimer")} />
          </View>

          {/* Paint Options (Good/Better/Best) */}
          <View className="bg-white rounded-xl p-4 border border-gray-200 mb-4">
            <Text className="text-lg font-bold text-gray-900 mb-1">
              Wall Paint Systems (Good / Better / Best)
            </Text>
            <Text className="text-sm text-gray-600 mb-4">
              Configure paint options for different quality levels and pricing
            </Text>

            {(qb.paintOptions || []).map((option, index) => (
              <View key={option.id} className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-base font-semibold text-gray-900">
                    Option {String.fromCharCode(65 + index)}
                  </Text>
                  <Pressable
                    onPress={() => {
                      const newOptions = [...(qb.paintOptions || [])];
                      newOptions[index] = { ...newOptions[index], enabled: !newOptions[index].enabled };
                      setQb({ ...qb, paintOptions: newOptions });
                    }}
                    className={`px-3 py-1 rounded-full ${
                      option.enabled ? "bg-green-600" : "bg-gray-400"
                    }`}
                  >
                    <Text className="text-white text-xs font-bold">
                      {option.enabled ? "ENABLED" : "DISABLED"}
                    </Text>
                  </Pressable>
                </View>

                {option.enabled && (
                  <>
                    <View className="mb-2">
                      <Text className="text-sm text-gray-600 mb-1">Name</Text>
                      <TextInput
                        value={option.name}
                        onChangeText={(text) => {
                          const newOptions = [...(qb.paintOptions || [])];
                          newOptions[index] = { ...newOptions[index], name: text };
                          setQb({ ...qb, paintOptions: newOptions });
                        }}
                        className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-base"
                        placeholder="Paint name"
                      />
                    </View>

                    <View className="flex-row gap-2 mb-2">
                      <View className="flex-1">
                        <Text className="text-sm text-gray-600 mb-1">Price/Gal</Text>
                        <TextInput
                          value={option.pricePerGallon.toString()}
                          onChangeText={(text) => {
                            const newOptions = [...(qb.paintOptions || [])];
                            newOptions[index] = { ...newOptions[index], pricePerGallon: parseFloat(text) || 0 };
                            setQb({ ...qb, paintOptions: newOptions });
                          }}
                          keyboardType="numeric"
                          className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-base"
                          placeholder="40"
                        />
                      </View>

                      <View className="flex-1">
                        <Text className="text-sm text-gray-600 mb-1">Coverage (sq ft)</Text>
                        <TextInput
                          value={option.coverageSqFt.toString()}
                          onChangeText={(text) => {
                            const newOptions = [...(qb.paintOptions || [])];
                            newOptions[index] = { ...newOptions[index], coverageSqFt: parseFloat(text) || 350 };
                            setQb({ ...qb, paintOptions: newOptions });
                          }}
                          keyboardType="numeric"
                          className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-base"
                          placeholder="350"
                        />
                      </View>
                    </View>

                    <View className="flex-row gap-2 mb-2">
                      <View className="flex-1">
                        <Text className="text-sm text-gray-600 mb-1">Material Markup</Text>
                        <TextInput
                          value={option.materialMarkup.toString()}
                          onChangeText={(text) => {
                            const newOptions = [...(qb.paintOptions || [])];
                            newOptions[index] = { ...newOptions[index], materialMarkup: parseFloat(text) || 1.0 };
                            setQb({ ...qb, paintOptions: newOptions });
                          }}
                          keyboardType="numeric"
                          className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-base"
                          placeholder="1.10"
                        />
                      </View>

                      <View className="flex-1">
                        <Text className="text-sm text-gray-600 mb-1">Labor Multiplier</Text>
                        <TextInput
                          value={option.laborMultiplier.toString()}
                          onChangeText={(text) => {
                            const newOptions = [...(qb.paintOptions || [])];
                            newOptions[index] = { ...newOptions[index], laborMultiplier: parseFloat(text) || 1.0 };
                            setQb({ ...qb, paintOptions: newOptions });
                          }}
                          keyboardType="numeric"
                          className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-base"
                          placeholder="1.00"
                        />
                      </View>
                    </View>

                    <View className="mb-0">
                      <Text className="text-sm text-gray-600 mb-1">Notes</Text>
                      <TextInput
                        value={option.notes}
                        onChangeText={(text) => {
                          const newOptions = [...(qb.paintOptions || [])];
                          newOptions[index] = { ...newOptions[index], notes: text };
                          setQb({ ...qb, paintOptions: newOptions });
                        }}
                        className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-base"
                        placeholder="Description of paint option"
                        multiline
                        numberOfLines={2}
                      />
                    </View>
                  </>
                )}
              </View>
            ))}

            <ToggleRow
              label="Show Paint Options in Proposal"
              value={qb.showPaintOptionsInProposal ?? true}
              onToggle={() => {
                setQb({ ...qb, showPaintOptionsInProposal: !(qb.showPaintOptionsInProposal ?? true) });
              }}
            />
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
            onPress={handleReset}
            className="flex-1 bg-gray-100 rounded-xl py-3 items-center active:bg-gray-200"
          >
            <Text className="text-gray-900 font-semibold">Reset to Full</Text>
          </Pressable>
          <Pressable
            onPress={handleSave}
            className={`flex-1 rounded-xl py-3 items-center ${
              hasUnsavedChanges ? "bg-blue-600 active:bg-blue-700" : "bg-gray-300"
            }`}
            disabled={!hasUnsavedChanges}
          >
            <Text className="text-white font-semibold">
              {hasUnsavedChanges ? "Save Changes" : "No Changes"}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// Helper component for toggle rows
function ToggleRow({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      onPress={onToggle}
      className="flex-row items-center justify-between py-3 border-b border-gray-100"
    >
      <Text className="text-base text-gray-700">{label}</Text>
      <View
        className={`w-12 h-7 rounded-full ${
          value ? "bg-blue-600" : "bg-gray-300"
        }`}
      >
        <View
          className={`w-5 h-5 rounded-full bg-white mt-1 ${
            value ? "ml-6" : "ml-1"
          }`}
        />
      </View>
    </Pressable>
  );
}
