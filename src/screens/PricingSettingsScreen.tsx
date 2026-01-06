import React, { useRef, useId } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  InputAccessoryView,
  Keyboard,
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
  const [mantelLabor, setMantelLabor] = React.useState(
    pricing.mantelLabor.toString()
  );
  const [legsLabor, setLegsLabor] = React.useState(
    pricing.legsLabor.toString()
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
  const [furnitureMovingFee, setFurnitureMovingFee] = React.useState(
    (pricing.furnitureMovingFee || 100).toString()
  );

  const [nailsRemovalFee, setNailsRemovalFee] = React.useState(
    (pricing.nailsRemovalFee || 75).toString()
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

  // KB-004: Refs for keyboard navigation
  const wallLaborRef = useRef<TextInput>(null);
  const ceilingLaborRef = useRef<TextInput>(null);
  const baseboardLaborRef = useRef<TextInput>(null);
  const doorLaborRef = useRef<TextInput>(null);
  const windowLaborRef = useRef<TextInput>(null);
  const closetLaborRef = useRef<TextInput>(null);
  const riserLaborRef = useRef<TextInput>(null);
  const spindleLaborRef = useRef<TextInput>(null);
  const handrailLaborRef = useRef<TextInput>(null);
  const fireplaceRef = useRef<TextInput>(null);
  const mantelLaborRef = useRef<TextInput>(null);
  const legsLaborRef = useRef<TextInput>(null);
  const crownMouldingRef = useRef<TextInput>(null);
  const secondCoatMultiplierRef = useRef<TextInput>(null);
  const accentWallMultiplierRef = useRef<TextInput>(null);
  const furnitureMovingFeeRef = useRef<TextInput>(null);
  const nailsRemovalFeeRef = useRef<TextInput>(null);
  const wallPaintGallonRef = useRef<TextInput>(null);
  const ceilingPaintGallonRef = useRef<TextInput>(null);
  const trimPaintGallonRef = useRef<TextInput>(null);
  const primerGallonRef = useRef<TextInput>(null);
  const wallPaint5GallonRef = useRef<TextInput>(null);
  const ceilingPaint5GallonRef = useRef<TextInput>(null);
  const trimPaint5GallonRef = useRef<TextInput>(null);
  const primer5GallonRef = useRef<TextInput>(null);

  // KB-004: Unique IDs for InputAccessoryViews
  const wallLaborID = useId();
  const ceilingLaborID = useId();
  const baseboardLaborID = useId();
  const doorLaborID = useId();
  const windowLaborID = useId();
  const closetLaborID = useId();
  const riserLaborID = useId();
  const spindleLaborID = useId();
  const handrailLaborID = useId();
  const fireplaceID = useId();
  const mantelLaborID = useId();
  const legsLaborID = useId();
  const crownMouldingID = useId();
  const secondCoatMultiplierID = useId();
  const accentWallMultiplierID = useId();
  const furnitureMovingFeeID = useId();
  const nailsRemovalFeeID = useId();
  const wallPaintGallonID = useId();
  const ceilingPaintGallonID = useId();
  const trimPaintGallonID = useId();
  const primerGallonID = useId();
  const wallPaint5GallonID = useId();
  const ceilingPaint5GallonID = useId();
  const trimPaint5GallonID = useId();
  const primer5GallonID = useId();

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
      mantelLabor: parseFloat(mantelLabor) || 100,
      legsLabor: parseFloat(legsLabor) || 100,
      crownMouldingLaborPerLF: parseFloat(crownMouldingLaborPerLF) || 0,
      secondCoatLaborMultiplier: parseFloat(secondCoatLaborMultiplier) || 2.0,
      accentWallLaborMultiplier: parseFloat(accentWallLaborMultiplier) || 1.25,
      furnitureMovingFee: parseFloat(furnitureMovingFee) || 100,
      nailsRemovalFee: parseFloat(nailsRemovalFee) || 75,
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
                  ref={wallLaborRef}
                  value={wallLaborPerSqFt}
                  onChangeText={setWallLaborPerSqFt}
                  placeholder="1.50"
                  placeholderTextColor={Colors.mediumGray}
                  keyboardType="numeric"
                  returnKeyType="next"
                  onSubmitEditing={() => ceilingLaborRef.current?.focus()}
                  blurOnSubmit={false}
                  inputAccessoryViewID={Platform.OS === "ios" ? `pricingWallLabor-${wallLaborID}` : undefined}
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
                  ref={ceilingLaborRef}
                  value={ceilingLaborPerSqFt}
                  onChangeText={setCeilingLaborPerSqFt}
                  placeholder="1.75"
                  placeholderTextColor={Colors.mediumGray}
                  keyboardType="numeric"
                  returnKeyType="next"
                  onSubmitEditing={() => baseboardLaborRef.current?.focus()}
                  blurOnSubmit={false}
                  inputAccessoryViewID={Platform.OS === "ios" ? `pricingCeilingLabor-${ceilingLaborID}` : undefined}
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
                  ref={baseboardLaborRef}
                  value={baseboardLaborPerLF}
                  onChangeText={setBaseboardLaborPerLF}
                  placeholder="1.25"
                  placeholderTextColor={Colors.mediumGray}
                  keyboardType="numeric"
                  returnKeyType="next"
                  onSubmitEditing={() => doorLaborRef.current?.focus()}
                  blurOnSubmit={false}
                  inputAccessoryViewID={Platform.OS === "ios" ? `pricingBaseboardLabor-${baseboardLaborID}` : undefined}
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
                    ref={doorLaborRef}
                    value={doorLabor}
                    onChangeText={setDoorLabor}
                    placeholder="50"
                    placeholderTextColor={Colors.mediumGray}
                    keyboardType="numeric"
                    returnKeyType="next"
                    onSubmitEditing={() => windowLaborRef.current?.focus()}
                    blurOnSubmit={false}
                    inputAccessoryViewID={Platform.OS === "ios" ? `pricingDoorLabor-${doorLaborID}` : undefined}
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
                    ref={windowLaborRef}
                    value={windowLabor}
                    onChangeText={setWindowLabor}
                    placeholder="35"
                    placeholderTextColor={Colors.mediumGray}
                    keyboardType="numeric"
                    returnKeyType="next"
                    onSubmitEditing={() => closetLaborRef.current?.focus()}
                    blurOnSubmit={false}
                    inputAccessoryViewID={Platform.OS === "ios" ? `pricingWindowLabor-${windowLaborID}` : undefined}
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
                  ref={closetLaborRef}
                  value={closetLabor}
                  onChangeText={setClosetLabor}
                  placeholder="75"
                  placeholderTextColor={Colors.mediumGray}
                  keyboardType="numeric"
                  returnKeyType="next"
                  onSubmitEditing={() => riserLaborRef.current?.focus()}
                  blurOnSubmit={false}
                  inputAccessoryViewID={Platform.OS === "ios" ? `pricingClosetLabor-${closetLaborID}` : undefined}
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
                    ref={riserLaborRef}
                    value={riserLabor}
                    onChangeText={setRiserLabor}
                    placeholder="15"
                    placeholderTextColor={Colors.mediumGray}
                    keyboardType="numeric"
                    returnKeyType="next"
                    onSubmitEditing={() => spindleLaborRef.current?.focus()}
                    blurOnSubmit={false}
                    inputAccessoryViewID={Platform.OS === "ios" ? `pricingRiserLabor-${riserLaborID}` : undefined}
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
                    ref={spindleLaborRef}
                    value={spindleLabor}
                    onChangeText={setSpindleLabor}
                    placeholder="8"
                    placeholderTextColor={Colors.mediumGray}
                    keyboardType="numeric"
                    returnKeyType="next"
                    onSubmitEditing={() => handrailLaborRef.current?.focus()}
                    blurOnSubmit={false}
                    inputAccessoryViewID={Platform.OS === "ios" ? `pricingSpindleLabor-${spindleLaborID}` : undefined}
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
                    ref={handrailLaborRef}
                    value={handrailLaborPerLF}
                    onChangeText={setHandrailLaborPerLF}
                    placeholder="10"
                    placeholderTextColor={Colors.mediumGray}
                    keyboardType="numeric"
                    returnKeyType="next"
                    onSubmitEditing={() => fireplaceRef.current?.focus()}
                    blurOnSubmit={false}
                    inputAccessoryViewID={Platform.OS === "ios" ? `pricingHandrailLabor-${handrailLaborID}` : undefined}
                    style={TextInputStyles.base}
                  />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500", color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                  Fireplace Labor ($) [Legacy]
                </Text>
                <View style={TextInputStyles.container}>
                  <TextInput
                    ref={fireplaceRef}
                    value={fireplaceLabor}
                    onChangeText={setFireplaceLabor}
                    placeholder="150"
                    placeholderTextColor={Colors.mediumGray}
                    keyboardType="numeric"
                    returnKeyType="next"
                    onSubmitEditing={() => mantelLaborRef.current?.focus()}
                    blurOnSubmit={false}
                    inputAccessoryViewID={Platform.OS === "ios" ? `pricingFireplace-${fireplaceID}` : undefined}
                    style={TextInputStyles.base}
                  />
                </View>
              </View>
            </View>

            {/* New Fireplace Labor Inputs */}
            <View style={{ flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.md }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500", color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                  Mantel Labor ($)
                </Text>
                <View style={TextInputStyles.container}>
                  <TextInput
                    ref={mantelLaborRef}
                    value={mantelLabor}
                    onChangeText={setMantelLabor}
                    placeholder="100"
                    placeholderTextColor={Colors.mediumGray}
                    keyboardType="numeric"
                    returnKeyType="next"
                    onSubmitEditing={() => legsLaborRef.current?.focus()}
                    blurOnSubmit={false}
                    inputAccessoryViewID={Platform.OS === "ios" ? `pricingMantelLabor-${mantelLaborID}` : undefined}
                    style={TextInputStyles.base}
                  />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500", color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                  Legs Labor ($)
                </Text>
                <View style={TextInputStyles.container}>
                  <TextInput
                    ref={legsLaborRef}
                    value={legsLabor}
                    onChangeText={setLegsLabor}
                    placeholder="100"
                    placeholderTextColor={Colors.mediumGray}
                    keyboardType="numeric"
                    returnKeyType="next"
                    onSubmitEditing={() => crownMouldingRef.current?.focus()}
                    blurOnSubmit={false}
                    inputAccessoryViewID={Platform.OS === "ios" ? `pricingLegsLabor-${legsLaborID}` : undefined}
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
                  ref={crownMouldingRef}
                  value={crownMouldingLaborPerLF}
                  onChangeText={setCrownMouldingLaborPerLF}
                  placeholder="1.50"
                  placeholderTextColor={Colors.mediumGray}
                  keyboardType="numeric"
                  returnKeyType="next"
                  onSubmitEditing={() => secondCoatMultiplierRef.current?.focus()}
                  blurOnSubmit={false}
                  inputAccessoryViewID={Platform.OS === "ios" ? `pricingCrownMoulding-${crownMouldingID}` : undefined}
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
                  ref={secondCoatMultiplierRef}
                  value={secondCoatLaborMultiplier}
                  onChangeText={setSecondCoatLaborMultiplier}
                  placeholder="2.0"
                  placeholderTextColor={Colors.mediumGray}
                  keyboardType="numeric"
                  returnKeyType="next"
                  onSubmitEditing={() => accentWallMultiplierRef.current?.focus()}
                  blurOnSubmit={false}
                  inputAccessoryViewID={Platform.OS === "ios" ? `pricing2CoatMultiplier-${secondCoatMultiplierID}` : undefined}
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
                  ref={accentWallMultiplierRef}
                  value={accentWallLaborMultiplier}
                  onChangeText={setAccentWallLaborMultiplier}
                  placeholder="1.25"
                  placeholderTextColor={Colors.mediumGray}
                  keyboardType="numeric"
                  returnKeyType="next"
                  onSubmitEditing={() => wallPaintGallonRef.current?.focus()}
                  blurOnSubmit={false}
                  inputAccessoryViewID={Platform.OS === "ios" ? `pricingAccentWallMultiplier-${accentWallMultiplierID}` : undefined}
                  style={TextInputStyles.base}
                />
              </View>
            </View>
          </Card>

          {/* Furniture Moving Fee */}
          <Card style={{ marginBottom: Spacing.md }}>
            <Text style={{ ...Typography.h2, marginBottom: Spacing.xs }}>
              Furniture Moving Fee
            </Text>
            <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.md }}>
              Flat fee added to labor cost when furniture moving is enabled
            </Text>

            <View>
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500", color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                Furniture Moving Fee ($)
              </Text>
              <View style={TextInputStyles.container}>
                <TextInput
                  ref={furnitureMovingFeeRef}
                  value={furnitureMovingFee}
                  onChangeText={setFurnitureMovingFee}
                  placeholder="100"
                  placeholderTextColor={Colors.mediumGray}
                  keyboardType="numeric"
                  returnKeyType="next"
                  onSubmitEditing={() => wallPaintGallonRef.current?.focus()}
                  blurOnSubmit={false}
                  inputAccessoryViewID={Platform.OS === "ios" ? `pricingFurnitureMovingFee-${furnitureMovingFeeID}` : undefined}
                  style={TextInputStyles.base}
                />
              </View>
            </View>
          </Card>

          {/* Nails/Screws Removal Fee */}
          <Card style={{ marginBottom: Spacing.md }}>
            <Text style={{ ...Typography.h2, marginBottom: Spacing.xs }}>
              Nails/Screws Removal Fee
            </Text>
            <Text style={{ fontSize: Typography.caption.fontSize, color: Colors.mediumGray, marginBottom: Spacing.md }}>
              Flat fee added to labor cost when nails/screws removal is enabled
            </Text>

            <View>
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "500", color: Colors.darkCharcoal, marginBottom: Spacing.xs }}>
                Nails/Screws Removal Fee ($)
              </Text>
              <View style={TextInputStyles.container}>
                <TextInput
                  ref={nailsRemovalFeeRef}
                  value={nailsRemovalFee}
                  onChangeText={setNailsRemovalFee}
                  placeholder="75"
                  placeholderTextColor={Colors.mediumGray}
                  keyboardType="numeric"
                  returnKeyType="next"
                  onSubmitEditing={() => wallPaintGallonRef.current?.focus()}
                  blurOnSubmit={false}
                  inputAccessoryViewID={Platform.OS === "ios" ? `pricingNailsRemovalFee-${nailsRemovalFeeID}` : undefined}
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
                  ref={wallPaintGallonRef}
                  value={wallPaintPerGallon}
                  onChangeText={setWallPaintPerGallon}
                  placeholder="45"
                  placeholderTextColor={Colors.mediumGray}
                  keyboardType="numeric"
                  returnKeyType="next"
                  onSubmitEditing={() => ceilingPaintGallonRef.current?.focus()}
                  blurOnSubmit={false}
                  inputAccessoryViewID={Platform.OS === "ios" ? `pricingWallPaintGallon-${wallPaintGallonID}` : undefined}
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
                  ref={ceilingPaintGallonRef}
                  value={ceilingPaintPerGallon}
                  onChangeText={setCeilingPaintPerGallon}
                  placeholder="40"
                  placeholderTextColor={Colors.mediumGray}
                  keyboardType="numeric"
                  returnKeyType="next"
                  onSubmitEditing={() => trimPaintGallonRef.current?.focus()}
                  blurOnSubmit={false}
                  inputAccessoryViewID={Platform.OS === "ios" ? `pricingCeilingPaintGallon-${ceilingPaintGallonID}` : undefined}
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
                  ref={trimPaintGallonRef}
                  value={trimPaintPerGallon}
                  onChangeText={setTrimPaintPerGallon}
                  placeholder="50"
                  placeholderTextColor={Colors.mediumGray}
                  keyboardType="numeric"
                  returnKeyType="next"
                  onSubmitEditing={() => primerGallonRef.current?.focus()}
                  blurOnSubmit={false}
                  inputAccessoryViewID={Platform.OS === "ios" ? `pricingTrimPaintGallon-${trimPaintGallonID}` : undefined}
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
                  ref={primerGallonRef}
                  value={primerPerGallon}
                  onChangeText={setPrimerPerGallon}
                  placeholder="35"
                  placeholderTextColor={Colors.mediumGray}
                  keyboardType="numeric"
                  returnKeyType="next"
                  onSubmitEditing={() => wallPaint5GallonRef.current?.focus()}
                  blurOnSubmit={false}
                  inputAccessoryViewID={Platform.OS === "ios" ? `pricingPrimerGallon-${primerGallonID}` : undefined}
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
                  ref={wallPaint5GallonRef}
                  value={wallPaintPer5Gallon}
                  onChangeText={setWallPaintPer5Gallon}
                  placeholder="200"
                  placeholderTextColor={Colors.mediumGray}
                  keyboardType="numeric"
                  returnKeyType="next"
                  onSubmitEditing={() => ceilingPaint5GallonRef.current?.focus()}
                  blurOnSubmit={false}
                  inputAccessoryViewID={Platform.OS === "ios" ? `pricingWallPaint5Gallon-${wallPaint5GallonID}` : undefined}
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
                  ref={ceilingPaint5GallonRef}
                  value={ceilingPaintPer5Gallon}
                  onChangeText={setCeilingPaintPer5Gallon}
                  placeholder="175"
                  placeholderTextColor={Colors.mediumGray}
                  keyboardType="numeric"
                  returnKeyType="next"
                  onSubmitEditing={() => trimPaint5GallonRef.current?.focus()}
                  blurOnSubmit={false}
                  inputAccessoryViewID={Platform.OS === "ios" ? `pricingCeilingPaint5Gallon-${ceilingPaint5GallonID}` : undefined}
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
                  ref={trimPaint5GallonRef}
                  value={trimPaintPer5Gallon}
                  onChangeText={setTrimPaintPer5Gallon}
                  placeholder="225"
                  placeholderTextColor={Colors.mediumGray}
                  keyboardType="numeric"
                  returnKeyType="next"
                  onSubmitEditing={() => primer5GallonRef.current?.focus()}
                  blurOnSubmit={false}
                  inputAccessoryViewID={Platform.OS === "ios" ? `pricingTrimPaint5Gallon-${trimPaint5GallonID}` : undefined}
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
                  ref={primer5GallonRef}
                  value={primerPer5Gallon}
                  onChangeText={setPrimerPer5Gallon}
                  placeholder="150"
                  placeholderTextColor={Colors.mediumGray}
                  keyboardType="numeric"
                  returnKeyType="done"
                  onSubmitEditing={() => Keyboard.dismiss()}
                  inputAccessoryViewID={Platform.OS === "ios" ? `pricingPrimer5Gallon-${primer5GallonID}` : undefined}
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

      {/* KB-004: InputAccessoryViews for all pricing fields */}
      {Platform.OS === "ios" && (<>
        <InputAccessoryView nativeID={`pricingWallLabor-${wallLaborID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => ceilingLaborRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}>
              <Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text>
            </Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`pricingCeilingLabor-${ceilingLaborID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => wallLaborRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => baseboardLaborRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`pricingBaseboardLabor-${baseboardLaborID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => ceilingLaborRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => doorLaborRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`pricingDoorLabor-${doorLaborID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => baseboardLaborRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => windowLaborRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`pricingWindowLabor-${windowLaborID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => doorLaborRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => closetLaborRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`pricingClosetLabor-${closetLaborID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => windowLaborRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => riserLaborRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`pricingRiserLabor-${riserLaborID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => closetLaborRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => spindleLaborRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`pricingSpindleLabor-${spindleLaborID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => riserLaborRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => handrailLaborRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`pricingHandrailLabor-${handrailLaborID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => spindleLaborRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => fireplaceRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`pricingFireplace-${fireplaceID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => handrailLaborRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => mantelLaborRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`pricingMantelLabor-${mantelLaborID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => fireplaceRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => legsLaborRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`pricingLegsLabor-${legsLaborID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => mantelLaborRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => crownMouldingRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`pricingCrownMoulding-${crownMouldingID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => legsLaborRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => secondCoatMultiplierRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`pricing2CoatMultiplier-${secondCoatMultiplierID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => crownMouldingRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => accentWallMultiplierRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`pricingAccentWallMultiplier-${accentWallMultiplierID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => secondCoatMultiplierRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => furnitureMovingFeeRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`pricingFurnitureMovingFee-${furnitureMovingFeeID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => accentWallMultiplierRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => nailsRemovalFeeRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`pricingNailsRemovalFee-${nailsRemovalFeeID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => furnitureMovingFeeRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => wallPaintGallonRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`pricingWallPaintGallon-${wallPaintGallonID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => nailsRemovalFeeRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => ceilingPaintGallonRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`pricingCeilingPaintGallon-${ceilingPaintGallonID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => wallPaintGallonRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => trimPaintGallonRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`pricingTrimPaintGallon-${trimPaintGallonID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => ceilingPaintGallonRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => primerGallonRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`pricingPrimerGallon-${primerGallonID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => trimPaintGallonRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => wallPaint5GallonRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`pricingWallPaint5Gallon-${wallPaint5GallonID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => primerGallonRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => ceilingPaint5GallonRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`pricingCeilingPaint5Gallon-${ceilingPaint5GallonID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => wallPaint5GallonRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => trimPaint5GallonRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`pricingTrimPaint5Gallon-${trimPaint5GallonID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => ceilingPaint5GallonRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => primer5GallonRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`pricingPrimer5Gallon-${primer5GallonID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => trimPaint5GallonRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => Keyboard.dismiss()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Done</Text></Pressable>
          </View>
        </InputAccessoryView>
      </>)}
    </SafeAreaView>
  );
}
