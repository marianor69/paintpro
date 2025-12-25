import React from "react";
import { View, Text, Pressable, FlatList, Alert, Image, Share } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { useProjectStore } from "../state/projectStore";
import { useAppSettings } from "../state/appSettings";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { Card } from "../components/Card";
import { Colors, Typography, Spacing, BorderRadius } from "../utils/designSystem";

type Props = NativeStackScreenProps<RootStackParamList, "ProjectsList">;

export default function ProjectsListScreen({ navigation }: Props) {
  const projects = useProjectStore((s) => s.projects);
  const setCurrentProject = useProjectStore((s) => s.setCurrentProject);
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const testMode = useAppSettings((s) => s.testMode);

  const handleProjectPress = (projectId: string) => {
    setCurrentProject(projectId);
    navigation.navigate("ProjectDetail", { projectId });
  };

  const handleDeleteProject = (projectId: string, projectName: string) => {
    Alert.alert(
      "Delete Project",
      `Are you sure you want to delete "${projectName}"? This will delete all rooms, staircases, and fireplaces in this project.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteProject(projectId),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.backgroundWarmGray }}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.neutralGray }}>
          <Text style={{ fontSize: Typography.h1.fontSize, fontWeight: "700", color: Colors.darkCharcoal }}>
            Projects
          </Text>
          <Text style={{ fontSize: Typography.body.fontSize, color: Colors.mediumGray, marginTop: Spacing.xs }}>
            {projects.length} {projects.length === 1 ? "project" : "projects"}
          </Text>
        </View>

        {/* Projects List */}
        {projects.length > 0 ? (
          <FlatList
            data={projects}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: Spacing.md }}
            renderItem={({ item }) => (
              <Card style={{ marginBottom: Spacing.md }}>
                <Pressable onPress={() => handleProjectPress(item.id)}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                    {/* Project Cover Photo Thumbnail */}
                    {item.coverPhotoUri ? (
                      <Image
                        source={{ uri: item.coverPhotoUri }}
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: 8,
                          marginRight: Spacing.md,
                          backgroundColor: Colors.neutralGray,
                        }}
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: 8,
                          marginRight: Spacing.md,
                          backgroundColor: Colors.neutralGray,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Ionicons name="image-outline" size={24} color={Colors.mediumGray} />
                      </View>
                    )}
                    <View style={{ flex: 1, marginRight: Spacing.md }}>
                      <Text style={Typography.h3}>
                        {item.clientInfo.name || "Unnamed Client"}
                      </Text>
                      <Text style={{ ...Typography.body, color: Colors.mediumGray, marginTop: Spacing.xs }}>
                        {item.clientInfo.address || "No address"}
                      </Text>
                      <Text style={{ ...Typography.caption, marginTop: Spacing.sm }}>
                        {format(item.updatedAt, "MMM d, yyyy")}
                      </Text>
                    </View>
                    <View style={{ backgroundColor: Colors.primaryBlueLight, borderRadius: 8, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs }}>
                      <Text style={{ ...Typography.caption, color: Colors.primaryBlue, fontWeight: "600" }}>
                        {item.rooms.length} rooms
                      </Text>
                    </View>
                  </View>
                </Pressable>

                {/* Action Buttons */}
                <View style={{ flexDirection: "row", marginTop: Spacing.md, gap: Spacing.sm }}>
                  {/* Test Mode: Show Share JSON */}
                  {testMode && (
                    <Pressable
                      onPress={async () => {
                        try {
                          const projectJSON = JSON.stringify(item, null, 2);
                          await Share.share({ message: projectJSON });
                        } catch (error) {
                          console.error("Error sharing:", error);
                        }
                      }}
                      style={{
                        flex: 1,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        paddingVertical: Spacing.sm,
                        backgroundColor: Colors.primaryBlueLight,
                        borderRadius: 8,
                      }}
                    >
                      <Ionicons name="share-outline" size={16} color={Colors.primaryBlue} />
                      <Text style={{ ...Typography.caption, color: Colors.primaryBlue, fontWeight: "600", marginLeft: Spacing.xs }}>
                        Share JSON
                      </Text>
                    </Pressable>
                  )}

                  {/* Delete Button */}
                  <Pressable
                    onPress={() => handleDeleteProject(item.id, item.clientInfo.name || "Unnamed Client")}
                    style={{
                      flex: testMode ? 1 : undefined,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      paddingVertical: Spacing.sm,
                      paddingHorizontal: Spacing.md,
                      backgroundColor: Colors.error + "10",
                      borderRadius: 8,
                    }}
                  >
                    <Ionicons name="trash-outline" size={16} color={Colors.error} />
                    <Text style={{ ...Typography.caption, color: Colors.error, fontWeight: "600", marginLeft: Spacing.xs }}>
                      Delete
                    </Text>
                  </Pressable>
                </View>
              </Card>
            )}
          />
        ) : (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: Spacing.lg }}>
            <Ionicons name="document-text-outline" size={64} color={Colors.mediumGray} />
            <Text style={{ ...Typography.h2, marginTop: Spacing.md, textAlign: "center" }}>
              No Projects Yet
            </Text>
            <Text style={{ ...Typography.body, color: Colors.mediumGray, textAlign: "center", marginTop: Spacing.sm }}>
              Go back and create your first project to get started
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
