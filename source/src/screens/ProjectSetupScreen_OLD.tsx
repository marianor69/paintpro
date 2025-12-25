import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { useProjectStore } from "../state/projectStore";
import { safeNumber } from "../utils/calculations";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius, Shadows, TextInputStyles } from "../utils/designSystem";
import { Card } from "../components/Card";
import { Toggle } from "../components/Toggle";

type Props = NativeStackScreenProps<RootStackParamList, "ProjectSetup">;

function getOrdinal(num: number): string {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return num + "st";
  if (j === 2 && k !== 12) return num + "nd";
  if (j === 3 && k !== 13) return num + "rd";
  return num + "th";
}

export default function ProjectSetupScreen({ route, navigation }: Props) {
  const { projectId } = route.params;

  const project = useProjectStore((s) =>
    s.projects.find((p) => p.id === projectId)
  );
  const updateProjectFloors = useProjectStore((s) => s.updateProjectFloors);
  const updateGlobalPaintDefaults = useProjectStore((s) => s.updateGlobalPaintDefaults);

  // Normalize initial values
  let effectiveFloorCount = 1;
  let effectiveFloorHeights: number[] = [8];

  if (project) {
    effectiveFloorCount = safeNumber(project.floorCount, project.hasTwoFloors ? 2 : 1);
    if (project.floorHeights && Array.isArray(project.floorHeights)) {
      effectiveFloorHeights = project.floorHeights.map((h) => safeNumber(h, 8));
    } else {
      effectiveFloorHeights = [
        safeNumber(project.firstFloorHeight, 8),
        ...(project.secondFloorHeight != null ? [safeNumber(project.secondFloorHeight, 8)] : [])
      ];
    }
  }

  const [localFloorCount, setLocalFloorCount] = useState(effectiveFloorCount);
  const [localFloorHeights, setLocalFloorHeights] = useState<string[]>(
    effectiveFloorHeights.map(h => safeNumber(h, 8).toString())
  );

  if (!project) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.backgroundWarmGray }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: Typography.h2.fontSize, color: Colors.mediumGray }}>Project not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleFloorCountChange = (newCount: number) => {
    if (newCount < 1 || newCount > 5) return;

    setLocalFloorCount(newCount);

    // Adjust heights array
    let newHeights = [...localFloorHeights];
    if (newCount > newHeights.length) {
      // Add new floor heights
      for (let i = newHeights.length; i < newCount; i++) {
        newHeights.push("8");
      }
    } else {
      // Remove extra floor heights
      newHeights = newHeights.slice(0, newCount);
    }
    setLocalFloorHeights(newHeights);

    // Save to store
    const heightsAsNumbers = newHeights.map((h) => safeNumber(parseFloat(h), 8));
    updateProjectFloors(projectId, newCount, heightsAsNumbers);
  };

  const handleFloorHeightChange = (index: number, value: string) => {
    const newHeights = [...localFloorHeights];
    newHeights[index] = value;
    setLocalFloorHeights(newHeights);

    // Save to store
    const heightsAsNumbers = newHeights.map((h) => safeNumber(parseFloat(h), 8));
    updateProjectFloors(projectId, localFloorCount, heightsAsNumbers);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.backgroundWarmGray }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView style={{ flex: 1, padding: Spacing.md }}>
          {/* Floors & Heights */}
          <Card style={{ marginBottom: Spacing.md }}>
            <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.darkCharcoal, marginBottom: Spacing.md }}>
              Floors & Heights
            </Text>

            {/* Number of Floors - Inline */}
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: Spacing.md }}>
              <Text style={{ fontSize: Typography.body.fontSize, color: Colors.darkCharcoal, marginRight: Spacing.sm }}>
                Floors:
              </Text>
              <Pressable
                onPress={() => handleFloorCountChange(localFloorCount - 1)}
                disabled={localFloorCount <= 1}
                style={{
                  backgroundColor: localFloorCount <= 1 ? Colors.neutralGray : Colors.white,
                  borderRadius: 8,
                  padding: Spacing.xs,
                  width: 32,
                  height: 32,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: Colors.neutralGray,
                  marginRight: Spacing.xs,
                }}
                accessibilityRole="button"
                accessibilityLabel="Decrease floor count"
              >
                <Ionicons name="remove" size={18} color={localFloorCount <= 1 ? Colors.mediumGray : Colors.darkCharcoal} />
              </Pressable>
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "700" as any, color: Colors.darkCharcoal, minWidth: 24, textAlign: "center" }}>
                {localFloorCount}
              </Text>
              <Pressable
                onPress={() => handleFloorCountChange(localFloorCount + 1)}
                disabled={localFloorCount >= 5}
                style={{
                  backgroundColor: localFloorCount >= 5 ? Colors.neutralGray : Colors.white,
                  borderRadius: 8,
                  padding: Spacing.xs,
                  width: 32,
                  height: 32,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: Colors.neutralGray,
                  marginLeft: Spacing.xs,
                }}
                accessibilityRole="button"
                accessibilityLabel="Increase floor count"
              >
                <Ionicons name="add" size={18} color={localFloorCount >= 5 ? Colors.mediumGray : Colors.darkCharcoal} />
              </Pressable>
            </View>

            {/* Floor Heights - Compact Inline */}
            {localFloorHeights.map((height, index) => (
              <View key={index} style={{ flexDirection: "row", alignItems: "center", marginBottom: index < localFloorHeights.length - 1 ? Spacing.sm : 0 }}>
                <Text style={{ fontSize: Typography.body.fontSize, color: Colors.darkCharcoal, width: 120 }}>
                  {getOrdinal(index + 1)} floor height:
                </Text>
                <View style={{ ...TextInputStyles.container, flex: 1, width: 60, marginRight: Spacing.xs, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs }}>
                  <TextInput
                    value={height}
                    onChangeText={(value) => handleFloorHeightChange(index, value)}
                    keyboardType="decimal-pad"
                    placeholder="8"
                    placeholderTextColor={Colors.mediumGray}
                    returnKeyType="done"
                    style={TextInputStyles.base}
                    accessibilityLabel={`${getOrdinal(index + 1)} floor height input`}
                  />
                </View>
                <Text style={{ fontSize: Typography.body.fontSize, color: Colors.mediumGray }}>ft</Text>
              </View>
            ))}

            <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginTop: Spacing.sm }}>
              Used as default ceiling height when adding rooms
            </Text>
          </Card>

          {/* Global Paint Defaults */}
          <Card style={{ marginBottom: Spacing.md }}>
            <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
              Global Paint Defaults
            </Text>
            <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.md, lineHeight: 18 }}>
              Define which elements to paint by default when creating new rooms. These can be overridden per room.
            </Text>

            <View>
              <Toggle
                label="Paint Walls"
                value={project.globalPaintDefaults?.paintWalls ?? true}
                onValueChange={(value) => updateGlobalPaintDefaults(projectId, { paintWalls: value })}
              />
              <Toggle
                label="Paint Ceilings"
                value={project.globalPaintDefaults?.paintCeilings ?? true}
                onValueChange={(value) => updateGlobalPaintDefaults(projectId, { paintCeilings: value })}
              />
              <Toggle
                label="Paint Trim (Door/Window Frames)"
                value={project.globalPaintDefaults?.paintTrim ?? true}
                onValueChange={(value) => updateGlobalPaintDefaults(projectId, { paintTrim: value })}
                description="Includes door frames and window frames"
              />
              <Toggle
                label="Paint Baseboards"
                value={project.globalPaintDefaults?.paintBaseboards ?? true}
                onValueChange={(value) => updateGlobalPaintDefaults(projectId, { paintBaseboards: value })}
              />
              <Toggle
                label="Paint Doors"
                value={project.globalPaintDefaults?.paintDoors ?? true}
                onValueChange={(value) => updateGlobalPaintDefaults(projectId, { paintDoors: value })}
              />
              <Toggle
                label="Paint Door Jambs"
                value={project.globalPaintDefaults?.paintDoorJambs ?? true}
                onValueChange={(value) => updateGlobalPaintDefaults(projectId, { paintDoorJambs: value })}
              />
              <Toggle
                label="Paint Crown Moulding"
                value={project.globalPaintDefaults?.paintCrownMoulding ?? true}
                onValueChange={(value) => updateGlobalPaintDefaults(projectId, { paintCrownMoulding: value })}
              />
              <Toggle
                label="Paint Closet Interiors"
                value={project.globalPaintDefaults?.paintClosetInteriors ?? true}
                onValueChange={(value) => updateGlobalPaintDefaults(projectId, { paintClosetInteriors: value })}
              />
            </View>

            {/* Default Coats Section */}
            <View style={{ height: 1, backgroundColor: Colors.neutralGray, marginVertical: Spacing.md }} />

            <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
              Default Coats for New Rooms
            </Text>
            <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.sm }}>
              Toggle ON for 2 coats, OFF for 1 coat. Affects paint material calculations.
            </Text>

            <Toggle
              label="Wall Coats"
              value={(project.globalPaintDefaults?.defaultWallCoats ?? 2) === 2}
              onValueChange={(value) =>
                updateGlobalPaintDefaults(projectId, {
                  defaultWallCoats: value ? 2 : 1,
                })
              }
              description={`Currently: ${project.globalPaintDefaults?.defaultWallCoats ?? 2} coat(s)`}
            />

            <Toggle
              label="Ceiling Coats"
              value={(project.globalPaintDefaults?.defaultCeilingCoats ?? 2) === 2}
              onValueChange={(value) =>
                updateGlobalPaintDefaults(projectId, {
                  defaultCeilingCoats: value ? 2 : 1,
                })
              }
              description={`Currently: ${project.globalPaintDefaults?.defaultCeilingCoats ?? 2} coat(s)`}
            />

            <Toggle
              label="Trim Coats"
              value={(project.globalPaintDefaults?.defaultTrimCoats ?? 2) === 2}
              onValueChange={(value) =>
                updateGlobalPaintDefaults(projectId, {
                  defaultTrimCoats: value ? 2 : 1,
                })
              }
              description={`Currently: ${project.globalPaintDefaults?.defaultTrimCoats ?? 2} coat(s)`}
            />

            <Toggle
              label="Door Coats"
              value={(project.globalPaintDefaults?.defaultDoorCoats ?? 2) === 2}
              onValueChange={(value) =>
                updateGlobalPaintDefaults(projectId, {
                  defaultDoorCoats: value ? 2 : 1,
                })
              }
              description={`Currently: ${project.globalPaintDefaults?.defaultDoorCoats ?? 2} coat(s)`}
            />

            <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginTop: Spacing.sm, fontStyle: "italic" }}>
              Note: These defaults set initial coat values for new rooms. Paint material costs scale with coats. Labor costs are not affected by coats.
            </Text>
          </Card>

          {/* Done Button */}
          <Pressable
            onPress={() => navigation.goBack()}
            style={{
              backgroundColor: Colors.primaryBlue,
              borderRadius: BorderRadius.default,
              paddingVertical: Spacing.md,
              paddingHorizontal: Spacing.lg,
              marginBottom: Spacing.lg,
              alignItems: "center",
              ...Shadows.card,
            }}
            accessibilityRole="button"
            accessibilityLabel="Done with setup"
            accessibilityHint="Returns to project detail screen"
          >
            <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.white }}>
              Done
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
