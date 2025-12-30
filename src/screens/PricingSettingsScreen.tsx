import React from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { usePricingStore } from "../state/pricingStore";
import { Colors, Typography, Spacing, BorderRadius, Shadows, TextInputStyles } from "../utils/designSystem";
import { Card } from "../components/Card";

type Props = NativeStackScreenProps<RootStackParamList, "PricingSettings">;

export default function PricingSettingsScreen({ navigation }: Props) {
  const pricing = usePricingStore();

  const [wallLaborPerSqFt, setWallLaborPerSqFt] = React.useState(
    pricing.wallLaborPerSqFt.toString()
  );
  const [ceilingLaborPerSqFt, setCeilingLaborPerSqFt] = React.useState(
    pricing.ceilingLaborPerSqFt.toString()
  );
  const [baseboardLaborPerLF, setBaseboardLaborPerLF] = React.useState(
    pricing.baseboardLaborPerLF.toString()
  );
  const [doorLabor, setDoorLabor] = React.useState(pricing.doorLabor.toString());
  const [windowLabor, setWindowLabor] = React.useState(
    pricing.windowLabor.toString()
  );
  const [closetLabor, setClosetLabor] = React.useState(
    pricing.closetLabor.toString()
  );
  const [riserLabor, setRiserLabor] = React.useState(
    pricing.riserLabor.toString()
  );
  const [spindleLabor, setSpindleLabor] = React.useState(
    pricing.spindleLabor.toString()
  );
  const [handrailLaborPerLF, setHandrailLaborPerLF] = React.useState(
    pricing.handrailLaborPerLF.toString()
  );
  const [fireplaceLabor, setFireplaceLabor] = React.useState(
    pricing.fireplaceLabor.toString()
  );
  const [crownMouldingLaborPerLF, setCrownMouldingLaborPerLF] = React.useState(
    pricing.crownMouldingLaborPerLF.toString()
  );
  const [secondCoatLaborMultiplier, setSecondCoatLaborMultiplier] = React.useState(
    (pricing.secondCoatLaborMultiplier || 2.0).toString()
  );
  const [accentWallLaborMultiplier, setAccentWallLaborMultiplier] = React.useState(
    (pricing.accentWallLaborMultiplier || 1.25).toString()
  );

  const [wallPaintPerGallon, setWallPaintPerGallon] = React.useState(
    pricing.wallPaintPerGallon.toString()
  );
  const [ceilingPaintPerGallon, setCeilingPaintPerGallon] = React.useState(
    pricing.ceilingPaintPerGallon.toString()
  );
  const [trimPaintPerGallon, setTrimPaintPerGallon] = React.useState(
    pricing.trimPaintPerGallon.toString()
  );
  const [primerPerGallon, setPrimerPerGallon] = React.useState(
    pricing.primerPerGallon.toString()
  );

  const [wallPaintPer5Gallon, setWallPaintPer5Gallon] = React.useState(
    (pricing.wallPaintPer5Gallon || 200).toString()
  );
  const [ceilingPaintPer5Gallon, setCeilingPaintPer5Gallon] = React.useState(
    (pricing.ceilingPaintPer5Gallon || 175).toString()
  );
  const [trimPaintPer5Gallon, setTrimPaintPer5Gallon] = React.useState(
    (pricing.trimPaintPer5Gallon || 225).toString()
  );
  const [primerPer5Gallon, setPrimerPer5Gallon] = React.useState(
    (pricing.primerPer5Gallon || 150).toString()
  );

  const handleSave = () => {
    pricing.updatePricing({
      wallLaborPerSqFt: parseFloat(wallLaborPerSqFt) || 0,
      ceilingLaborPerSqFt: parseFloat(ceilingLaborPerSqFt) || 0,
      baseboardLaborPerLF: parseFloat(baseboardLaborPerLF) || 0,
      doorLabor: parseFloat(doorLabor) || 0,
      windowLabor: parseFloat(windowLabor) || 0,
      closetLabor: parseFloat(closetLabor) || 0,
      riserLabor: parseFloat(riserLabor) || 0,
      spindleLabor: parseFloat(spindleLabor) || 0,
      handrailLaborPerLF: parseFloat(handrailLaborPerLF) || 0,
      fireplaceLabor: parseFloat(fireplaceLabor) || 0,
      crownMouldingLaborPerLF: parseFloat(crownMouldingLaborPerLF) || 0,
      secondCoatLaborMultiplier: parseFloat(secondCoatLaborMultiplier) || 2.0,
      accentWallLaborMultiplier: parseFloat(accentWallLaborMultiplier) || 1.25,
      wallPaintPerGallon: parseFloat(wallPaintPerGallon) || 0,
      ceilingPaintPerGallon: parseFloat(ceilingPaintPerGallon) || 0,
      trimPaintPerGallon: parseFloat(trimPaintPerGallon) || 0,
      doorPaintPerGallon: parseFloat(trimPaintPerGallon) || 0, // Door paint uses trim paint price
      primerPerGallon: parseFloat(primerPerGallon) || 0,
      wallPaintPer5Gallon: parseFloat(wallPaintPer5Gallon) || 200,
      ceilingPaintPer5Gallon: parseFloat(ceilingPaintPer5Gallon) || 175,
      trimPaintPer5Gallon: parseFloat(trimPaintPer5Gallon) || 225,
      doorPaintPer5Gallon: parseFloat(trimPaintPer5Gallon) || 225, // Door paint uses trim paint price
      primerPer5Gallon: parseFloat(primerPer5Gallon) || 150,
    });
    navigation.goBack();
  };


  return (
    <SafeAreaView
      edges={["bottom"]}
      style={{ flex: 1, backgroundColor: Colors.backgroundWarmGray }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          contentContainerStyle={{ padding: Spacing.md }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* Labor Rates */}
          <Card style={{ marginBottom: Spacing.md }}>
            <Text style={{ ...Typography.h2, marginBottom: Spacing.md }}>
              Labor Rates
            </Text>

            <View style={{ marginBottom: Spacing.md }}>
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500", color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                Wall Labor ($/sq ft)
              </Text>
              <View style={TextInputStyles.container}>
                <TextInput
                  value={wallLaborPerSqFt}
                  onChangeText={setWallLaborPerSqFt}
                  placeholder="1.50"
                  placeholderTextColor={Colors.mediumGray}
                  keyboardType="numeric"
                  returnKeyType="done"
                  style={TextInputStyles.base}
                />
              </View>
            </View>

            <View style={{ marginBottom: Spacing.md }}>
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500", color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                Ceiling Labor ($/sq ft)
              </Text>
              <View style={TextInputStyles.container}>
                <TextInput
                  value={ceilingLaborPerSqFt}
                  onChangeText={setCeilingLaborPerSqFt}
                  placeholder="1.75"
                  placeholderTextColor={Colors.mediumGray}
                  keyboardType="numeric"
                  returnKeyType="done"
                  style={TextInputStyles.base}
                />
              </View>
            </View>

            <View style={{ marginBottom: Spacing.md }}>
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500", color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                Baseboard Labor ($/LF)
              </Text>
              <View style={TextInputStyles.container}>
                <TextInput
                  value={baseboardLaborPerLF}
                  onChangeText={setBaseboardLaborPerLF}
                  placeholder="1.25"
                  placeholderTextColor={Colors.mediumGray}
                  keyboardType="numeric"
                  returnKeyType="done"
                  style={TextInputStyles.base}
                />
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.md }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500", color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                  Door Labor ($)
                </Text>
                <View style={TextInputStyles.container}>
                  <TextInput
                    value={doorLabor}
                    onChangeText={setDoorLabor}
                    placeholder="50"
                    placeholderTextColor={Colors.mediumGray}
                    keyboardType="numeric"
                    returnKeyType="done"
                    style={TextInputStyles.base}
                  />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500", color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                  Window Labor ($)
                </Text>
                <View style={TextInputStyles.container}>
                  <TextInput
                    value={windowLabor}
                    onChangeText={setWindowLabor}
                    placeholder="35"
                    placeholderTextColor={Colors.mediumGray}
                    keyboardType="numeric"
                    returnKeyType="done"
                    style={TextInputStyles.base}
                  />
                </View>
              </View>
            </View>

            <View style={{ marginBottom: Spacing.md }}>
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500", color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                Closet Labor ($)
              </Text>
              <View style={TextInputStyles.container}>
                <TextInput
                  value={closetLabor}
                  onChangeText={setClosetLabor}
                  placeholder="75"
                  placeholderTextColor={Colors.mediumGray}
                  keyboardType="numeric"
                  returnKeyType="done"
                  style={TextInputStyles.base}
                />
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.md }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500", color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                  Riser Labor ($)
                </Text>
                <View style={TextInputStyles.container}>
                  <TextInput
                    value={riserLabor}
                    onChangeText={setRiserLabor}
                    placeholder="15"
                    placeholderTextColor={Colors.mediumGray}
                    keyboardType="numeric"
                    returnKeyType="done"
                    style={TextInputStyles.base}
                  />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500", color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                  Spindle Labor ($)
                </Text>
                <View style={TextInputStyles.container}>
                  <TextInput
                    value={spindleLabor}
                    onChangeText={setSpindleLabor}
                    placeholder="8"
                    placeholderTextColor={Colors.mediumGray}
                    keyboardType="numeric"
                    returnKeyType="done"
                    style={TextInputStyles.base}
                  />
                </View>
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.md }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500", color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                  Handrail Labor ($/LF)
                </Text>
                <View style={TextInputStyles.container}>
                  <TextInput
                    value={handrailLaborPerLF}
                    onChangeText={setHandrailLaborPerLF}
                    placeholder="10"
                    placeholderTextColor={Colors.mediumGray}
                    keyboardType="numeric"
                    returnKeyType="done"
                    style={TextInputStyles.base}
                  />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500", color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                  Fireplace Labor ($)
                </Text>
                <View style={TextInputStyles.container}>
                  <TextInput
                    value={fireplaceLabor}
                    onChangeText={setFireplaceLabor}
                    placeholder="150"
                    placeholderTextColor={Colors.mediumGray}
                    keyboardType="numeric"
                    returnKeyType="done"
                    style={TextInputStyles.base}
                  />
                </View>
              </View>
            </View>

            <View>
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500", color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                Crown Moulding Labor ($/LF)
              </Text>
              <View style={TextInputStyles.container}>
                <TextInput
                  value={crownMouldingLaborPerLF}
                  onChangeText={setCrownMouldingLaborPerLF}
                  placeholder="1.50"
                  placeholderTextColor={Colors.mediumGray}
                  keyboardType="numeric"
                  returnKeyType="done"
                  style={TextInputStyles.base}
                />
              </View>
            </View>
          </Card>

          {/* Second Coat Labor Multiplier */}
          <Card style={{ marginBottom: Spacing.md }}>
            <Text style={{ ...Typography.h2, marginBottom: Spacing.xs }}>
              2-Coat Labor Multiplier
            </Text>
            <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.md }}>
              When 2 coats are selected, labor is multiplied by this value. Example: 1.5 means 2 coats costs 1.5x the labor of 1 coat.
            </Text>

            <View>
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500", color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                Labor Multiplier for 2 Coats
              </Text>
              <View style={TextInputStyles.container}>
                <TextInput
                  value={secondCoatLaborMultiplier}
                  onChangeText={setSecondCoatLaborMultiplier}
                  placeholder="2.0"
                  placeholderTextColor={Colors.mediumGray}
                  keyboardType="numeric"
                  returnKeyType="done"
                  style={TextInputStyles.base}
                />
              </View>
            </View>
          </Card>

          {/* Accent Wall Labor Multiplier */}
          <Card style={{ marginBottom: Spacing.md }}>
            <Text style={{ ...Typography.h2, marginBottom: Spacing.xs }}>
              Accent Wall Labor Multiplier
            </Text>
            <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.md }}>
              When multiple colors or accent walls are selected, labor is multiplied by this value. Example: 1.25 means 25% more labor.
            </Text>

            <View>
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500", color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                Labor Multiplier for Accent Walls
              </Text>
              <View style={TextInputStyles.container}>
                <TextInput
                  value={accentWallLaborMultiplier}
                  onChangeText={setAccentWallLaborMultiplier}
                  placeholder="1.25"
                  placeholderTextColor={Colors.mediumGray}
                  keyboardType="numeric"
                  returnKeyType="done"
                  style={TextInputStyles.base}
                />
              </View>
            </View>
          </Card>

          {/* Material Prices */}
          <Card style={{ marginBottom: Spacing.md }}>
            <Text style={{ ...Typography.h2, marginBottom: Spacing.md }}>
              Material Prices
            </Text>

            <View style={{ marginBottom: Spacing.md }}>
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500", color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                Wall Paint ($/gallon)
              </Text>
              <View style={TextInputStyles.container}>
                <TextInput
                  value={wallPaintPerGallon}
                  onChangeText={setWallPaintPerGallon}
                  placeholder="45"
                  placeholderTextColor={Colors.mediumGray}
                  keyboardType="numeric"
                  returnKeyType="done"
                  style={TextInputStyles.base}
                />
              </View>
            </View>

            <View style={{ marginBottom: Spacing.md }}>
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500", color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                Ceiling Paint ($/gallon)
              </Text>
              <View style={TextInputStyles.container}>
                <TextInput
                  value={ceilingPaintPerGallon}
                  onChangeText={setCeilingPaintPerGallon}
                  placeholder="40"
                  placeholderTextColor={Colors.mediumGray}
                  keyboardType="numeric"
                  returnKeyType="done"
                  style={TextInputStyles.base}
                />
              </View>
            </View>

            <View style={{ marginBottom: Spacing.md }}>
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500", color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                Trim Paint ($/gallon)
              </Text>
              <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.xs }}>
                Used for: baseboards, doors, jambs, window/door trim, crown moulding, risers, spindles, handrails
              </Text>
              <View style={TextInputStyles.container}>
                <TextInput
                  value={trimPaintPerGallon}
                  onChangeText={setTrimPaintPerGallon}
                  placeholder="50"
                  placeholderTextColor={Colors.mediumGray}
                  keyboardType="numeric"
                  returnKeyType="done"
                  style={TextInputStyles.base}
                />
              </View>
            </View>

            <View>
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500", color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                Primer ($/gallon)
              </Text>
              <View style={TextInputStyles.container}>
                <TextInput
                  value={primerPerGallon}
                  onChangeText={setPrimerPerGallon}
                  placeholder="35"
                  placeholderTextColor={Colors.mediumGray}
                  keyboardType="numeric"
                  returnKeyType="done"
                  style={TextInputStyles.base}
                />
              </View>
            </View>
          </Card>

          {/* 5-Gallon Bucket Prices */}
          <Card style={{ marginBottom: Spacing.md }}>
            <Text style={{ ...Typography.h2, marginBottom: Spacing.md }}>
              5-Gallon Bucket Prices
            </Text>

            <View style={{ marginBottom: Spacing.md }}>
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500", color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                Wall Paint ($/5-gallon bucket)
              </Text>
              <View style={TextInputStyles.container}>
                <TextInput
                  value={wallPaintPer5Gallon}
                  onChangeText={setWallPaintPer5Gallon}
                  placeholder="200"
                  placeholderTextColor={Colors.mediumGray}
                  keyboardType="numeric"
                  returnKeyType="done"
                  style={TextInputStyles.base}
                />
              </View>
            </View>

            <View style={{ marginBottom: Spacing.md }}>
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500", color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                Ceiling Paint ($/5-gallon bucket)
              </Text>
              <View style={TextInputStyles.container}>
                <TextInput
                  value={ceilingPaintPer5Gallon}
                  onChangeText={setCeilingPaintPer5Gallon}
                  placeholder="175"
                  placeholderTextColor={Colors.mediumGray}
                  keyboardType="numeric"
                  returnKeyType="done"
                  style={TextInputStyles.base}
                />
              </View>
            </View>

            <View style={{ marginBottom: Spacing.md }}>
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500", color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                Trim Paint ($/5-gallon bucket)
              </Text>
              <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.xs }}>
                Used for: baseboards, doors, jambs, window/door trim, crown moulding, risers, spindles, handrails
              </Text>
              <View style={TextInputStyles.container}>
                <TextInput
                  value={trimPaintPer5Gallon}
                  onChangeText={setTrimPaintPer5Gallon}
                  placeholder="225"
                  placeholderTextColor={Colors.mediumGray}
                  keyboardType="numeric"
                  returnKeyType="done"
                  style={TextInputStyles.base}
                />
              </View>
            </View>

            <View>
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500", color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                Primer ($/5-gallon bucket)
              </Text>
              <View style={TextInputStyles.container}>
                <TextInput
                  value={primerPer5Gallon}
                  onChangeText={setPrimerPer5Gallon}
                  placeholder="150"
                  placeholderTextColor={Colors.mediumGray}
                  keyboardType="numeric"
                  returnKeyType="done"
                  style={TextInputStyles.base}
                />
              </View>
            </View>
          </Card>

          {/* Action Buttons */}
          <View style={{ gap: Spacing.sm, marginBottom: Spacing.xl }}>
            <Pressable
              onPress={handleSave}
              style={{
                backgroundColor: Colors.primaryBlue,
                borderRadius: BorderRadius.default,
                paddingVertical: Spacing.md,
                alignItems: "center",
                ...Shadows.card,
              }}
              accessibilityRole="button"
              accessibilityLabel="Save changes"
            >
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600", color: Colors.white }}>
                Save Settings
              </Text>
            </Pressable>

            <Pressable
              onPress={() => pricing.resetToDefaults()}
              style={{
                backgroundColor: Colors.neutralGray,
                borderRadius: BorderRadius.default,
                paddingVertical: Spacing.md,
                alignItems: "center",
              }}
              accessibilityRole="button"
              accessibilityLabel="Reset to defaults"
            >
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600", color: Colors.darkCharcoal }}>
                Reset to Defaults
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
