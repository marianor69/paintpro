import React, { useState } from "react";
import { View, Text, Pressable, FlatList, Alert, Modal, TextInput, KeyboardAvoidingView, Platform, Share, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { useProjectStore } from "../state/projectStore";
import { useAppSettings } from "../state/appSettings";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { importProjectFromJSON } from "../utils/importProject";
import { Card } from "../components/Card";
import { Colors, Typography, Spacing, BorderRadius, Shadows } from "../utils/designSystem";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  const projects = useProjectStore((s) => s.projects);
  const setCurrentProject = useProjectStore((s) => s.setCurrentProject);
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const testMode = useAppSettings((s) => s.testMode);

  const [importModalVisible, setImportModalVisible] = useState(false);
  const [jsonInput, setJsonInput] = useState("");

  const handleProjectPress = (projectId: string) => {
    setCurrentProject(projectId);
    navigation.navigate("ProjectDetail", { projectId });
  };

  const handleNewProject = () => {
    navigation.navigate("ProjectSetup", { isNew: true });
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

  const handleImportJSON = () => {
    if (!jsonInput.trim()) {
      Alert.alert("Error", "Please paste JSON data first");
      return;
    }

    const result = importProjectFromJSON(jsonInput);

    if (result.success && result.projectId) {
      setImportModalVisible(false);
      setJsonInput("");
      Alert.alert(
        "Success",
        "Project imported successfully!",
        [
          {
            text: "View Project",
            onPress: () => {
              setCurrentProject(result.projectId!);
              navigation.navigate("ProjectDetail", { projectId: result.projectId! });
            },
          },
        ]
      );
    } else {
      Alert.alert("Import Failed", result.error || "Unknown error occurred");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.backgroundWarmGray }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={{ backgroundColor: Colors.white, paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing.xl }}>
          <View style={{ alignItems: "center", marginBottom: Spacing.lg }}>
            <Ionicons name="color-palette" size={56} color={Colors.primaryBlue} />
            <Text style={{ fontSize: 28, fontWeight: "700", color: Colors.darkCharcoal, marginTop: Spacing.md, textAlign: "center" }}>
              New Interface
            </Text>
            <Text style={{ fontSize: 18, fontWeight: "600", color: Colors.mediumGray, marginTop: Spacing.xs, textAlign: "center", fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" }}>
              ADDR-061 (focusOffset=40)
            </Text>
            <Text style={{ ...Typography.body, color: Colors.mediumGray, marginTop: Spacing.xs, textAlign: "center" }}>
              Fast, Accurate, Professional Paint Estimates
            </Text>
          </View>

          {/* Main Action Grid */}
          <View style={{ gap: Spacing.md }}>
            <Pressable
              onPress={handleNewProject}
              style={{
                backgroundColor: Colors.primaryBlue,
                borderRadius: BorderRadius.default,
                paddingVertical: Spacing.lg,
                alignItems: "center",
                ...Shadows.card,
              }}
            >
              <Ionicons name="add-circle-outline" size={32} color={Colors.white} />
              <Text style={{ fontSize: Typography.h3.fontSize, fontWeight: "700", color: Colors.white, marginTop: Spacing.sm }}>
                Create New Project
              </Text>
            </Pressable>

            {projects.length > 0 && (
              <Pressable
                onPress={() => navigation.navigate("ProjectsList")}
                style={{
                  backgroundColor: Colors.white,
                  borderRadius: BorderRadius.default,
                  borderWidth: 2,
                  borderColor: Colors.primaryBlue,
                  paddingVertical: Spacing.lg,
                  alignItems: "center",
                }}
              >
                <Ionicons name="folder-open-outline" size={32} color={Colors.primaryBlue} />
                <Text style={{ fontSize: Typography.h3.fontSize, fontWeight: "700", color: Colors.primaryBlue, marginTop: Spacing.sm }}>
                  Open Existing Projects
                </Text>
                <Text style={{ ...Typography.caption, color: Colors.mediumGray, marginTop: Spacing.xs }}>
                  {projects.length} {projects.length === 1 ? "project" : "projects"} available
                </Text>
              </Pressable>
            )}
          </View>

          {/* Test Mode: Show Import Button */}
          {testMode && (
            <Pressable
              onPress={() => setImportModalVisible(true)}
              style={{
                backgroundColor: Colors.success,
                borderRadius: BorderRadius.default,
                paddingVertical: Spacing.md,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                marginTop: Spacing.md,
              }}
            >
              <Ionicons name="download-outline" size={20} color={Colors.white} />
              <Text style={{ ...Typography.body, color: Colors.white, fontWeight: "600", marginLeft: Spacing.xs }}>
                Import from JSON
              </Text>
            </Pressable>
          )}
        </View>

        {/* Empty State */}
        {projects.length === 0 && (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xl }}>
            <Ionicons name="document-text-outline" size={64} color={Colors.mediumGray} />
            <Text style={{ ...Typography.h2, marginTop: Spacing.md, textAlign: "center" }}>
              No Projects Yet
            </Text>
            <Text style={{ ...Typography.body, color: Colors.mediumGray, textAlign: "center", marginTop: Spacing.sm }}>
              Create your first project to start estimating
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Import Modal */}
      <Modal
        visible={importModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setImportModalVisible(false)}
      >
        <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: Colors.white }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
          >
            {/* Modal Header */}
            <View style={{
              backgroundColor: Colors.white,
              borderBottomWidth: 1,
              borderBottomColor: Colors.neutralGray,
              paddingHorizontal: Spacing.md,
              paddingBottom: Spacing.md
            }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={Typography.h1}>Import Project</Text>
                <Pressable
                  onPress={() => {
                    setImportModalVisible(false);
                    setJsonInput("");
                  }}
                  style={{
                    width: 40,
                    height: 40,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 20,
                    backgroundColor: Colors.neutralGray,
                  }}
                >
                  <Ionicons name="close" size={24} color={Colors.darkCharcoal} />
                </Pressable>
              </View>
              <Text style={{ ...Typography.body, color: Colors.mediumGray, marginTop: Spacing.xs }}>
                Paste your project JSON data below
              </Text>
            </View>

            {/* JSON Input */}
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: Spacing.md }}>
              <TextInput
                value={jsonInput}
                onChangeText={setJsonInput}
                placeholder="Paste JSON here..."
                multiline
                textAlignVertical="top"
                style={{
                  minHeight: 300,
                  backgroundColor: Colors.backgroundWarmGray,
                  borderWidth: 1,
                  borderColor: Colors.neutralGray,
                  borderRadius: BorderRadius.default,
                  padding: Spacing.md,
                  fontSize: Typography.body.fontSize,
                  fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
                  color: Colors.darkCharcoal,
                }}
              />
            </ScrollView>

            {/* Action Buttons */}
            <View style={{
              padding: Spacing.md,
              gap: Spacing.sm,
              borderTopWidth: 1,
              borderTopColor: Colors.neutralGray
            }}>
              <Pressable
                onPress={handleImportJSON}
                disabled={!jsonInput.trim()}
                style={{
                  backgroundColor: jsonInput.trim() ? Colors.success : Colors.neutralGray,
                  borderRadius: BorderRadius.default,
                  paddingVertical: Spacing.md,
                  alignItems: "center",
                }}
              >
                <Text style={{ ...Typography.body, color: Colors.white, fontWeight: "600" }}>
                  Import Project
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setImportModalVisible(false);
                  setJsonInput("");
                }}
                style={{
                  backgroundColor: Colors.neutralGray,
                  borderRadius: BorderRadius.default,
                  paddingVertical: Spacing.md,
                  alignItems: "center",
                }}
              >
                <Text style={{ ...Typography.body, color: Colors.darkCharcoal, fontWeight: "600" }}>
                  Cancel
                </Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}
