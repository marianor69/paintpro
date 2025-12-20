import React, { useState } from "react";
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, Keyboard } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { useProjectStore } from "../state/projectStore";
import { Card } from "../components/Card";
import { Colors, Typography, Spacing, BorderRadius, Shadows } from "../utils/designSystem";

type Props = NativeStackScreenProps<RootStackParamList, "NewProject">;

export default function NewProjectScreen({ navigation }: Props) {
  const createProject = useProjectStore((s) => s.createProject);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const handleCreate = () => {
    const projectId = createProject({
      name: name.trim() || "Unnamed Client",
      address: address.trim(),
      phone: phone.trim(),
      email: email.trim(),
    }, {
      floorCount: 1,
      floorHeights: [8],
    });
    navigation.replace("ProjectDetail", { projectId });
  };

  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: Colors.backgroundWarmGray }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ padding: Spacing.md, paddingBottom: Spacing.xl }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* Client Information */}
          <Card style={{ marginBottom: Spacing.md }}>
            <Text style={{ fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
              Client Information
            </Text>
            <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.md, lineHeight: 18 }}>
              Enter the client details for this project
            </Text>

            {/* Client Name */}
            <View style={{ marginBottom: Spacing.md }}>
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                Client Name *
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="John Doe"
                placeholderTextColor={Colors.mediumGray}
                cursorColor={Colors.primaryBlue}
                selectionColor={Colors.primaryBlue}
                returnKeyType="next"
                style={{
                  backgroundColor: Colors.white,
                  borderWidth: 1,
                  borderColor: Colors.neutralGray,
                  borderRadius: BorderRadius.default,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: Typography.body.fontSize,
                  color: Colors.darkCharcoal,
                }}
                accessibilityLabel="Client name input"
              />
            </View>

            {/* Address */}
            <View style={{ marginBottom: Spacing.md }}>
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                Address *
              </Text>
              <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder="123 Main St"
                placeholderTextColor={Colors.mediumGray}
                cursorColor={Colors.primaryBlue}
                selectionColor={Colors.primaryBlue}
                returnKeyType="next"
                style={{
                  backgroundColor: Colors.white,
                  borderWidth: 1,
                  borderColor: Colors.neutralGray,
                  borderRadius: BorderRadius.default,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: Typography.body.fontSize,
                  color: Colors.darkCharcoal,
                }}
                accessibilityLabel="Address input"
              />
            </View>

            {/* Phone */}
            <View style={{ marginBottom: Spacing.md }}>
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                Phone
              </Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="(555) 123-4567"
                placeholderTextColor={Colors.mediumGray}
                cursorColor={Colors.primaryBlue}
                selectionColor={Colors.primaryBlue}
                keyboardType="phone-pad"
                returnKeyType="next"
                style={{
                  backgroundColor: Colors.white,
                  borderWidth: 1,
                  borderColor: Colors.neutralGray,
                  borderRadius: BorderRadius.default,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: Typography.body.fontSize,
                  color: Colors.darkCharcoal,
                }}
                accessibilityLabel="Phone number input"
              />
            </View>

            {/* Email */}
            <View>
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500" as any, color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                Email
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="john@example.com"
                placeholderTextColor={Colors.mediumGray}
                cursorColor={Colors.primaryBlue}
                selectionColor={Colors.primaryBlue}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={() => Keyboard.dismiss()}
                style={{
                  backgroundColor: Colors.white,
                  borderWidth: 1,
                  borderColor: Colors.neutralGray,
                  borderRadius: BorderRadius.default,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: Typography.body.fontSize,
                  color: Colors.darkCharcoal,
                }}
                accessibilityLabel="Email input"
              />
            </View>
          </Card>

          {/* Create Project Button */}
          <Pressable
            onPress={handleCreate}
            disabled={!name.trim()}
            style={{
              backgroundColor: name.trim() ? Colors.primaryBlue : Colors.neutralGray,
              borderRadius: BorderRadius.default,
              paddingVertical: 14,
              alignItems: "center",
              ...(name.trim() ? Shadows.card : {}),
            }}
            accessibilityRole="button"
            accessibilityLabel="Create project"
            accessibilityState={{ disabled: !name.trim() }}
          >
            <Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" as any }}>
              Create Project
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
