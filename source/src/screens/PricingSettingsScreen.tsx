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
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { usePricingStore } from "../state/pricingStore";

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

  const [wallCoverage, setWallCoverage] = React.useState(
    pricing.wallCoverageSqFtPerGallon.toString()
  );
  const [ceilingCoverage, setCeilingCoverage] = React.useState(
    pricing.ceilingCoverageSqFtPerGallon.toString()
  );
  const [trimCoverage, setTrimCoverage] = React.useState(
    pricing.trimCoverageSqFtPerGallon.toString()
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
      wallCoverageSqFtPerGallon: parseFloat(wallCoverage) || 350,
      ceilingCoverageSqFtPerGallon: parseFloat(ceilingCoverage) || 350,
      trimCoverageSqFtPerGallon: parseFloat(trimCoverage) || 350,
    });
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      className="flex-1 bg-gray-50"
    >
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View className="p-6">
          {/* Link to Calculation Settings */}
          <Pressable
            onPress={() => navigation.navigate("CalculationSettings")}
            className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 active:bg-blue-100"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-base font-semibold text-blue-900 mb-1">
                  Calculation Settings
                </Text>
                <Text className="text-sm text-blue-700">
                  Adjust default measurements for doors, windows, and closets
                </Text>
              </View>
              <Text className="text-blue-600 text-2xl ml-3">›</Text>
            </View>
          </Pressable>

          {/* Labor Rates */}
          <Text className="text-xl font-bold text-gray-900 mb-4">
            Labor Rates
          </Text>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Wall Labor ($/sq ft)
            </Text>
            <TextInput
              value={wallLaborPerSqFt}
              onChangeText={setWallLaborPerSqFt}
              placeholder="1.50"
              keyboardType="decimal-pad"
              className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Ceiling Labor ($/sq ft)
            </Text>
            <TextInput
              value={ceilingLaborPerSqFt}
              onChangeText={setCeilingLaborPerSqFt}
              placeholder="1.75"
              keyboardType="decimal-pad"
              className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Baseboard Labor ($/LF)
            </Text>
            <TextInput
              value={baseboardLaborPerLF}
              onChangeText={setBaseboardLaborPerLF}
              placeholder="1.25"
              keyboardType="decimal-pad"
              className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base"
            />
          </View>

          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Door Labor ($)
              </Text>
              <TextInput
                value={doorLabor}
                onChangeText={setDoorLabor}
                placeholder="50"
                keyboardType="decimal-pad"
                className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base"
              />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Window Labor ($)
              </Text>
              <TextInput
                value={windowLabor}
                onChangeText={setWindowLabor}
                placeholder="35"
                keyboardType="decimal-pad"
                className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base"
              />
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Closet Labor ($)
            </Text>
            <TextInput
              value={closetLabor}
              onChangeText={setClosetLabor}
              placeholder="75"
              keyboardType="decimal-pad"
              className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base"
            />
          </View>

          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Riser Labor ($)
              </Text>
              <TextInput
                value={riserLabor}
                onChangeText={setRiserLabor}
                placeholder="15"
                keyboardType="decimal-pad"
                className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base"
              />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Spindle Labor ($)
              </Text>
              <TextInput
                value={spindleLabor}
                onChangeText={setSpindleLabor}
                placeholder="8"
                keyboardType="decimal-pad"
                className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base"
              />
            </View>
          </View>

          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Handrail Labor ($/LF)
              </Text>
              <TextInput
                value={handrailLaborPerLF}
                onChangeText={setHandrailLaborPerLF}
                placeholder="10"
                keyboardType="decimal-pad"
                className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base"
              />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Fireplace Labor ($)
              </Text>
              <TextInput
                value={fireplaceLabor}
                onChangeText={setFireplaceLabor}
                placeholder="150"
                keyboardType="decimal-pad"
                className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base"
              />
            </View>
          </View>

          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Crown Moulding Labor ($/LF)
            </Text>
            <TextInput
              value={crownMouldingLaborPerLF}
              onChangeText={setCrownMouldingLaborPerLF}
              placeholder="1.50"
              keyboardType="decimal-pad"
              className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base"
            />
          </View>

          {/* Second Coat Labor Multiplier */}
          <Text className="text-xl font-bold text-gray-900 mb-2">
            2-Coat Labor Multiplier
          </Text>
          <Text className="text-sm text-gray-600 mb-4">
            When 2 coats are selected, labor is multiplied by this value. Example: 1.5 means 2 coats costs 1.5x the labor of 1 coat.
          </Text>

          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Labor Multiplier for 2 Coats
            </Text>
            <TextInput
              value={secondCoatLaborMultiplier}
              onChangeText={setSecondCoatLaborMultiplier}
              placeholder="2.0"
              keyboardType="decimal-pad"
              className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base"
            />
          </View>

          {/* Accent Wall Labor Multiplier */}
          <Text className="text-xl font-bold text-gray-900 mb-2">
            Accent Wall Labor Multiplier
          </Text>
          <Text className="text-sm text-gray-600 mb-4">
            When multiple colors or accent walls are selected, labor is multiplied by this value. Example: 1.25 means 25% more labor.
          </Text>

          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Labor Multiplier for Accent Walls
            </Text>
            <TextInput
              value={accentWallLaborMultiplier}
              onChangeText={setAccentWallLaborMultiplier}
              placeholder="1.25"
              keyboardType="decimal-pad"
              className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base"
            />
          </View>

          {/* Material Prices */}
          <Text className="text-xl font-bold text-gray-900 mb-4">
            Material Prices
          </Text>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Wall Paint ($/gallon)
            </Text>
            <TextInput
              value={wallPaintPerGallon}
              onChangeText={setWallPaintPerGallon}
              placeholder="45"
              keyboardType="decimal-pad"
              className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Ceiling Paint ($/gallon)
            </Text>
            <TextInput
              value={ceilingPaintPerGallon}
              onChangeText={setCeilingPaintPerGallon}
              placeholder="40"
              keyboardType="decimal-pad"
              className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Trim Paint ($/gallon)
            </Text>
            <Text className="text-xs text-gray-500 mb-2">
              Used for: baseboards, doors, jambs, window/door trim, crown moulding, risers, spindles, handrails
            </Text>
            <TextInput
              value={trimPaintPerGallon}
              onChangeText={setTrimPaintPerGallon}
              placeholder="50"
              keyboardType="decimal-pad"
              className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base"
            />
          </View>

          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Primer ($/gallon)
            </Text>
            <TextInput
              value={primerPerGallon}
              onChangeText={setPrimerPerGallon}
              placeholder="35"
              keyboardType="decimal-pad"
              className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base"
            />
          </View>

          {/* 5-Gallon Bucket Prices */}
          <Text className="text-xl font-bold text-gray-900 mb-4">
            5-Gallon Bucket Prices
          </Text>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Wall Paint ($/5-gallon bucket)
            </Text>
            <TextInput
              value={wallPaintPer5Gallon}
              onChangeText={setWallPaintPer5Gallon}
              placeholder="200"
              keyboardType="decimal-pad"
              className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Ceiling Paint ($/5-gallon bucket)
            </Text>
            <TextInput
              value={ceilingPaintPer5Gallon}
              onChangeText={setCeilingPaintPer5Gallon}
              placeholder="175"
              keyboardType="decimal-pad"
              className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Trim Paint ($/5-gallon bucket)
            </Text>
            <Text className="text-xs text-gray-500 mb-2">
              Used for: baseboards, doors, jambs, window/door trim, crown moulding, risers, spindles, handrails
            </Text>
            <TextInput
              value={trimPaintPer5Gallon}
              onChangeText={setTrimPaintPer5Gallon}
              placeholder="225"
              keyboardType="decimal-pad"
              className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base"
            />
          </View>

          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Primer ($/5-gallon bucket)
            </Text>
            <TextInput
              value={primerPer5Gallon}
              onChangeText={setPrimerPer5Gallon}
              placeholder="150"
              keyboardType="decimal-pad"
              className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base"
            />
          </View>

          {/* Coverage Settings */}
          <Text className="text-xl font-bold text-gray-900 mb-4">
            Coverage Settings
          </Text>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Wall Coverage (sq ft/gallon)
            </Text>
            <TextInput
              value={wallCoverage}
              onChangeText={setWallCoverage}
              placeholder="350"
              keyboardType="decimal-pad"
              className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Ceiling Coverage (sq ft/gallon)
            </Text>
            <TextInput
              value={ceilingCoverage}
              onChangeText={setCeilingCoverage}
              placeholder="350"
              keyboardType="decimal-pad"
              className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Trim Coverage (sq ft/gallon)
            </Text>
            <TextInput
              value={trimCoverage}
              onChangeText={setTrimCoverage}
              placeholder="350"
              keyboardType="decimal-pad"
              className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base"
            />
          </View>

          <View className="flex-row gap-3">
            <Pressable
              onPress={() => pricing.resetToDefaults()}
              className="flex-1 bg-gray-200 rounded-xl py-4 items-center active:bg-gray-300"
            >
              <Text className="text-gray-900 font-semibold">
                Reset to Defaults
              </Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              className="flex-1 bg-blue-600 rounded-xl py-4 items-center active:bg-blue-700"
            >
              <Text className="text-white font-semibold">Save Settings</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
