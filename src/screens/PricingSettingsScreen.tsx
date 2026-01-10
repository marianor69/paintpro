import React, { useRef, useId, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  InputAccessoryView,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { usePricingStore } from "../state/pricingStore";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius, Shadows, TextInputStyles } from "../utils/designSystem";
import { Card } from "../components/Card";

type Props = NativeStackScreenProps<RootStackParamList, "PricingSettings">;

export default function PricingSettingsScreen({ navigation }: Props) {
  const pricing = usePricingStore();

  const [infoModalVisible, setInfoModalVisible] = React.useState(false);
  const [infoModalTitle, setInfoModalTitle] = React.useState("");
  const [infoModalBody, setInfoModalBody] = React.useState("");

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
  const [fireplaceLabor] = React.useState(pricing.fireplaceLabor.toString());
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
  const [bathroomLaborMultiplier, setBathroomLaborMultiplier] = React.useState(
    (pricing.bathroomLaborMultiplier || 1.0).toString()
  );
  const [closetLaborMultiplier, setClosetLaborMultiplier] = React.useState(
    (pricing.closetLaborMultiplier || 1.0).toString()
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
  const mantelLaborRef = useRef<TextInput>(null);
  const legsLaborRef = useRef<TextInput>(null);
  const crownMouldingRef = useRef<TextInput>(null);
  const secondCoatMultiplierRef = useRef<TextInput>(null);
  const accentWallMultiplierRef = useRef<TextInput>(null);
  const bathroomMultiplierRef = useRef<TextInput>(null);
  const closetMultiplierRef = useRef<TextInput>(null);
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
  const mantelLaborID = useId();
  const legsLaborID = useId();
  const crownMouldingID = useId();
  const secondCoatMultiplierID = useId();
  const accentWallMultiplierID = useId();
  const bathroomMultiplierID = useId();
  const closetMultiplierID = useId();
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

  const scrollViewRef = useRef<ScrollView>(null);
  const scrollYRef = useRef(0);
  const isKeyboardVisibleRef = useRef(false);
  const pendingFocusRef = useRef(false);
  const focusTargetY = 160;

  const scrollFocusedInputIntoView = useCallback(() => {
    const focusedInput = TextInput.State?.currentlyFocusedInput?.();
    if (!focusedInput || !scrollViewRef.current) {
      return;
    }

    focusedInput.measureInWindow((inputX, inputY) => {
      const delta = inputY - focusTargetY;
      const scrollToY = Math.max(0, scrollYRef.current + delta);
      scrollViewRef.current?.scrollTo({ y: scrollToY, animated: true });
    });
  }, []);

  const handleFieldFocus = useCallback(() => {
    if (isKeyboardVisibleRef.current) {
      scrollFocusedInputIntoView();
      return;
    }

    pendingFocusRef.current = true;
  }, [scrollFocusedInputIntoView]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () => {
      isKeyboardVisibleRef.current = true;
      if (pendingFocusRef.current) {
        pendingFocusRef.current = false;
        scrollFocusedInputIntoView();
      }
    });
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => {
      isKeyboardVisibleRef.current = false;
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [scrollFocusedInputIntoView]);

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
      bathroomLaborMultiplier: parseFloat(bathroomLaborMultiplier) || 1.0,
      closetLaborMultiplier: parseFloat(closetLaborMultiplier) || 1.0,
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

  const openInfoModal = useCallback((title: string, body: string) => {
    setInfoModalTitle(title);
    setInfoModalBody(body);
    setInfoModalVisible(true);
  }, []);

  const rowStyle = { flexDirection: "row", alignItems: "center", gap: Spacing.sm, marginBottom: Spacing.md };
  const inlineFieldStyle = { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between" as const };
  const labelStyle = { fontSize: Typography.body.fontSize, fontWeight: "500", color: Colors.darkCharcoal, flex: 1 };
  const inputWidth = 68;
  const inputContainerStyle = { ...TextInputStyles.container, width: inputWidth };
  const inputTextStyle = { textAlign: "right" as const };
  const materialRowStyle = { flexDirection: "row", alignItems: "center", gap: Spacing.sm, marginBottom: Spacing.md };
  const columnLabelWrapperStyle = { width: inputWidth, paddingHorizontal: Spacing.md, alignItems: "center" as const };
  const columnLabelStyle = { textAlign: "center" as const, fontSize: Typography.caption.fontSize, color: Colors.mediumGray, width: "100%" as const };
  const bubbleHeaderWrapperStyle = { width: inputWidth, alignItems: "flex-end" as const };
  const bubbleHeaderTextStyle = { fontSize: Typography.caption.fontSize, color: Colors.mediumGray, textAlign: "right" as const, paddingRight: Spacing.md, marginBottom: Spacing.xs };
  const rightAlignedLabelWrapperStyle = { width: inputWidth, alignItems: "flex-end" as const };
  const labelAlignWithBubbleValueStyle = { paddingTop: Typography.caption.fontSize + Spacing.xs };
  const labelCenterWithBubbleValueStyle = { paddingTop: Typography.caption.fontSize + Spacing.xs + Spacing.sm };
  const rightAlignedLabelTextStyle = { ...labelStyle, textAlign: "right" as const, paddingRight: Spacing.md };
  const labelCenterTextStyle = { ...labelStyle, marginTop: Typography.caption.fontSize + Spacing.xs + Spacing.sm };
  const leftAlignedLabelWrapperStyle = { flex: 1, alignItems: "flex-start" as const };
  const leftAlignedLabelTextStyle = { ...labelStyle, textAlign: "left" as const };
  const labelCenterLeftTextStyle = { ...labelStyle, marginTop: Typography.caption.fontSize + Spacing.xs + Spacing.sm, textAlign: "left" as const };

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
          ref={scrollViewRef}
          contentContainerStyle={{ padding: Spacing.md }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onScroll={(event) => {
            scrollYRef.current = event.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
        >
          {/* Labor Rates - Rooms */}
          <Card style={{ marginBottom: Spacing.md }}>
            <Text style={{ ...Typography.h2, marginBottom: Spacing.md }}>
              Labor Rates - Rooms
            </Text>

            <View style={rowStyle}>
              <View style={inlineFieldStyle}>
                <View style={[leftAlignedLabelWrapperStyle, labelCenterWithBubbleValueStyle]}>
                  <Text style={leftAlignedLabelTextStyle}>Wall</Text>
                </View>
                <View style={bubbleHeaderWrapperStyle}>
                  <Text style={bubbleHeaderTextStyle}>$/sqft</Text>
                  <View style={inputContainerStyle}>
                    <TextInput
                      ref={wallLaborRef}
                      value={wallLaborPerSqFt}
                      onChangeText={setWallLaborPerSqFt}
                      placeholder="1.50"
                      placeholderTextColor={Colors.mediumGray}
                      keyboardType="numeric"
                      returnKeyType="next"
                      onSubmitEditing={() => ceilingLaborRef.current?.focus()}
                      onFocus={handleFieldFocus}
                      blurOnSubmit={false}
                      inputAccessoryViewID={Platform.OS === "ios" ? `pricingWallLabor-${wallLaborID}` : undefined}
                      style={inputTextStyle}
                    />
                  </View>
                </View>
              </View>
              <View style={inlineFieldStyle}>
                <View style={[leftAlignedLabelWrapperStyle, labelCenterWithBubbleValueStyle]}>
                  <Text style={leftAlignedLabelTextStyle}>Ceiling</Text>
                </View>
                <View style={bubbleHeaderWrapperStyle}>
                  <Text style={bubbleHeaderTextStyle}>$/sqft</Text>
                  <View style={inputContainerStyle}>
                    <TextInput
                      ref={ceilingLaborRef}
                      value={ceilingLaborPerSqFt}
                      onChangeText={setCeilingLaborPerSqFt}
                      placeholder="1.75"
                      placeholderTextColor={Colors.mediumGray}
                      keyboardType="numeric"
                      returnKeyType="next"
                      onSubmitEditing={() => doorLaborRef.current?.focus()}
                      onFocus={handleFieldFocus}
                      blurOnSubmit={false}
                      inputAccessoryViewID={Platform.OS === "ios" ? `pricingCeilingLabor-${ceilingLaborID}` : undefined}
                      style={inputTextStyle}
                    />
                  </View>
                </View>
              </View>
            </View>

            <View style={rowStyle}>
              <View style={inlineFieldStyle}>
                <View style={[leftAlignedLabelWrapperStyle, labelCenterWithBubbleValueStyle]}>
                  <Text style={leftAlignedLabelTextStyle}>Door</Text>
                </View>
                <View style={bubbleHeaderWrapperStyle}>
                  <Text style={bubbleHeaderTextStyle}>Each $</Text>
                  <View style={inputContainerStyle}>
                    <TextInput
                      ref={doorLaborRef}
                      value={doorLabor}
                      onChangeText={setDoorLabor}
                      placeholder="50"
                      placeholderTextColor={Colors.mediumGray}
                      keyboardType="numeric"
                      returnKeyType="next"
                      onSubmitEditing={() => windowLaborRef.current?.focus()}
                      onFocus={handleFieldFocus}
                      blurOnSubmit={false}
                      inputAccessoryViewID={Platform.OS === "ios" ? `pricingDoorLabor-${doorLaborID}` : undefined}
                      style={inputTextStyle}
                    />
                  </View>
                </View>
              </View>
              <View style={inlineFieldStyle}>
                <View style={[leftAlignedLabelWrapperStyle, labelCenterWithBubbleValueStyle]}>
                  <Text style={leftAlignedLabelTextStyle}>Window</Text>
                </View>
                <View style={bubbleHeaderWrapperStyle}>
                  <Text style={bubbleHeaderTextStyle}>Each $</Text>
                  <View style={inputContainerStyle}>
                    <TextInput
                      ref={windowLaborRef}
                      value={windowLabor}
                      onChangeText={setWindowLabor}
                      placeholder="35"
                      placeholderTextColor={Colors.mediumGray}
                      keyboardType="numeric"
                      returnKeyType="next"
                      onSubmitEditing={() => baseboardLaborRef.current?.focus()}
                      onFocus={handleFieldFocus}
                      blurOnSubmit={false}
                      inputAccessoryViewID={Platform.OS === "ios" ? `pricingWindowLabor-${windowLaborID}` : undefined}
                      style={inputTextStyle}
                    />
                  </View>
                </View>
              </View>
            </View>

            <View style={rowStyle}>
              <View style={inlineFieldStyle}>
                <View style={[leftAlignedLabelWrapperStyle, labelCenterWithBubbleValueStyle]}>
                  <Text style={leftAlignedLabelTextStyle}>Baseboard</Text>
                </View>
                <View style={bubbleHeaderWrapperStyle}>
                  <Text style={bubbleHeaderTextStyle}>$/LF</Text>
                  <View style={inputContainerStyle}>
                    <TextInput
                      ref={baseboardLaborRef}
                      value={baseboardLaborPerLF}
                      onChangeText={setBaseboardLaborPerLF}
                      placeholder="1.25"
                      placeholderTextColor={Colors.mediumGray}
                      keyboardType="numeric"
                      returnKeyType="next"
                      onSubmitEditing={() => crownMouldingRef.current?.focus()}
                      onFocus={handleFieldFocus}
                      blurOnSubmit={false}
                      inputAccessoryViewID={Platform.OS === "ios" ? `pricingBaseboardLabor-${baseboardLaborID}` : undefined}
                      style={inputTextStyle}
                    />
                  </View>
                </View>
              </View>
              <View style={inlineFieldStyle}>
                <View style={[leftAlignedLabelWrapperStyle, labelCenterWithBubbleValueStyle]}>
                  <Text style={leftAlignedLabelTextStyle}>Crowns</Text>
                </View>
                <View style={bubbleHeaderWrapperStyle}>
                  <Text style={bubbleHeaderTextStyle}>$/LF</Text>
                  <View style={inputContainerStyle}>
                    <TextInput
                      ref={crownMouldingRef}
                      value={crownMouldingLaborPerLF}
                      onChangeText={setCrownMouldingLaborPerLF}
                      placeholder="1.50"
                      placeholderTextColor={Colors.mediumGray}
                      keyboardType="numeric"
                      returnKeyType="next"
                      onSubmitEditing={() => closetLaborRef.current?.focus()}
                      onFocus={handleFieldFocus}
                      blurOnSubmit={false}
                      inputAccessoryViewID={Platform.OS === "ios" ? `pricingCrownMoulding-${crownMouldingID}` : undefined}
                      style={inputTextStyle}
                    />
                  </View>
                </View>
              </View>
            </View>

            <View style={rowStyle}>
              <View style={inlineFieldStyle}>
                <View style={[leftAlignedLabelWrapperStyle, labelCenterWithBubbleValueStyle]}>
                  <Text style={leftAlignedLabelTextStyle}>Closet</Text>
                </View>
                <View style={bubbleHeaderWrapperStyle}>
                  <Text style={bubbleHeaderTextStyle}>Each $</Text>
                  <View style={inputContainerStyle}>
                    <TextInput
                      ref={closetLaborRef}
                      value={closetLabor}
                      onChangeText={setClosetLabor}
                      placeholder="75"
                      placeholderTextColor={Colors.mediumGray}
                      keyboardType="numeric"
                      returnKeyType="next"
                      onSubmitEditing={() => riserLaborRef.current?.focus()}
                      onFocus={handleFieldFocus}
                      blurOnSubmit={false}
                      inputAccessoryViewID={Platform.OS === "ios" ? `pricingClosetLabor-${closetLaborID}` : undefined}
                      style={inputTextStyle}
                    />
                  </View>
                </View>
              </View>
              <View style={inlineFieldStyle} />
            </View>
          </Card>

          {/* Labor Rates - Staircases */}
          <Card style={{ marginBottom: Spacing.md }}>
            <Text style={{ ...Typography.h2, marginBottom: Spacing.md }}>
              Labor Rates - Staircases
            </Text>
            <View style={rowStyle}>
              <View style={inlineFieldStyle}>
                <View style={[leftAlignedLabelWrapperStyle, labelCenterWithBubbleValueStyle]}>
                  <Text style={leftAlignedLabelTextStyle}>Riser</Text>
                </View>
                <View style={bubbleHeaderWrapperStyle}>
                  <Text style={bubbleHeaderTextStyle}>Each $</Text>
                  <View style={inputContainerStyle}>
                    <TextInput
                      ref={riserLaborRef}
                      value={riserLabor}
                      onChangeText={setRiserLabor}
                      placeholder="15"
                      placeholderTextColor={Colors.mediumGray}
                      keyboardType="numeric"
                      returnKeyType="next"
                      onSubmitEditing={() => spindleLaborRef.current?.focus()}
                      onFocus={handleFieldFocus}
                      blurOnSubmit={false}
                      inputAccessoryViewID={Platform.OS === "ios" ? `pricingRiserLabor-${riserLaborID}` : undefined}
                      style={inputTextStyle}
                    />
                  </View>
                </View>
              </View>
              <View style={inlineFieldStyle}>
                <View style={[leftAlignedLabelWrapperStyle, labelCenterWithBubbleValueStyle]}>
                  <Text style={leftAlignedLabelTextStyle}>Spindle</Text>
                </View>
                <View style={bubbleHeaderWrapperStyle}>
                  <Text style={bubbleHeaderTextStyle}>Each $</Text>
                  <View style={inputContainerStyle}>
                    <TextInput
                      ref={spindleLaborRef}
                      value={spindleLabor}
                      onChangeText={setSpindleLabor}
                      placeholder="8"
                      placeholderTextColor={Colors.mediumGray}
                      keyboardType="numeric"
                      returnKeyType="next"
                      onSubmitEditing={() => handrailLaborRef.current?.focus()}
                      onFocus={handleFieldFocus}
                      blurOnSubmit={false}
                      inputAccessoryViewID={Platform.OS === "ios" ? `pricingSpindleLabor-${spindleLaborID}` : undefined}
                      style={inputTextStyle}
                    />
                  </View>
                </View>
              </View>
            </View>

            <View style={rowStyle}>
              <View style={inlineFieldStyle}>
                <View style={[leftAlignedLabelWrapperStyle, labelCenterWithBubbleValueStyle]}>
                  <Text style={leftAlignedLabelTextStyle}>Handrail</Text>
                </View>
                <View style={bubbleHeaderWrapperStyle}>
                  <Text style={bubbleHeaderTextStyle}>$/LF</Text>
                  <View style={inputContainerStyle}>
                    <TextInput
                      ref={handrailLaborRef}
                      value={handrailLaborPerLF}
                      onChangeText={setHandrailLaborPerLF}
                      placeholder="10"
                      placeholderTextColor={Colors.mediumGray}
                      keyboardType="numeric"
                      returnKeyType="next"
                      onSubmitEditing={() => mantelLaborRef.current?.focus()}
                      onFocus={handleFieldFocus}
                      blurOnSubmit={false}
                      inputAccessoryViewID={Platform.OS === "ios" ? `pricingHandrailLabor-${handrailLaborID}` : undefined}
                      style={inputTextStyle}
                    />
                  </View>
                </View>
              </View>
              <View style={inlineFieldStyle} />
            </View>
          </Card>

          {/* Labor Rates - Fireplaces */}
          <Card style={{ marginBottom: Spacing.md }}>
            <Text style={{ ...Typography.h2, marginBottom: Spacing.md }}>
              Labor Rates - Fireplaces
            </Text>
            <View style={rowStyle}>
              <View style={inlineFieldStyle}>
                <View style={[leftAlignedLabelWrapperStyle, labelCenterWithBubbleValueStyle]}>
                  <Text style={leftAlignedLabelTextStyle}>Mantel</Text>
                </View>
                <View style={bubbleHeaderWrapperStyle}>
                  <Text style={bubbleHeaderTextStyle}>Each $</Text>
                  <View style={inputContainerStyle}>
                    <TextInput
                      ref={mantelLaborRef}
                      value={mantelLabor}
                      onChangeText={setMantelLabor}
                      placeholder="100"
                      placeholderTextColor={Colors.mediumGray}
                      keyboardType="numeric"
                      returnKeyType="next"
                      onSubmitEditing={() => legsLaborRef.current?.focus()}
                      onFocus={handleFieldFocus}
                      blurOnSubmit={false}
                      inputAccessoryViewID={Platform.OS === "ios" ? `pricingMantelLabor-${mantelLaborID}` : undefined}
                      style={inputTextStyle}
                    />
                  </View>
                </View>
              </View>
              <View style={inlineFieldStyle}>
                <View style={[leftAlignedLabelWrapperStyle, labelCenterWithBubbleValueStyle]}>
                  <Text style={leftAlignedLabelTextStyle}>Legs</Text>
                </View>
                <View style={bubbleHeaderWrapperStyle}>
                  <Text style={bubbleHeaderTextStyle}>Each $</Text>
                  <View style={inputContainerStyle}>
                    <TextInput
                      ref={legsLaborRef}
                      value={legsLabor}
                      onChangeText={setLegsLabor}
                      placeholder="100"
                      placeholderTextColor={Colors.mediumGray}
                      keyboardType="numeric"
                      returnKeyType="next"
                      onSubmitEditing={() => secondCoatMultiplierRef.current?.focus()}
                      onFocus={handleFieldFocus}
                      blurOnSubmit={false}
                      inputAccessoryViewID={Platform.OS === "ios" ? `pricingLegsLabor-${legsLaborID}` : undefined}
                      style={inputTextStyle}
                    />
                  </View>
                </View>
              </View>
            </View>
          </Card>

          {/* Multipliers */}
          <Card style={{ marginBottom: Spacing.md }}>
            <Text style={{ ...Typography.h2, marginBottom: Spacing.md }}>
              Labor Multipliers
            </Text>

            <View style={rowStyle}>
              <View style={inlineFieldStyle}>
                <Text style={labelStyle}>2-Coat</Text>
                <View style={inputContainerStyle}>
                  <TextInput
                    ref={secondCoatMultiplierRef}
                    value={secondCoatLaborMultiplier}
                    onChangeText={setSecondCoatLaborMultiplier}
                    placeholder="2.0"
                    placeholderTextColor={Colors.mediumGray}
                    keyboardType="numeric"
                    returnKeyType="next"
                    onSubmitEditing={() => accentWallMultiplierRef.current?.focus()}
                    onFocus={handleFieldFocus}
                    blurOnSubmit={false}
                    inputAccessoryViewID={Platform.OS === "ios" ? `pricing2CoatMultiplier-${secondCoatMultiplierID}` : undefined}
                    style={inputTextStyle}
                  />
                </View>
              </View>
              <View style={inlineFieldStyle}>
                <Text style={labelStyle}>Accent Wall</Text>
                <View style={inputContainerStyle}>
                  <TextInput
                    ref={accentWallMultiplierRef}
                    value={accentWallLaborMultiplier}
                    onChangeText={setAccentWallLaborMultiplier}
                    placeholder="1.25"
                    placeholderTextColor={Colors.mediumGray}
                    keyboardType="numeric"
                    returnKeyType="next"
                    onSubmitEditing={() => bathroomMultiplierRef.current?.focus()}
                    onFocus={handleFieldFocus}
                    blurOnSubmit={false}
                    inputAccessoryViewID={Platform.OS === "ios" ? `pricingAccentWallMultiplier-${accentWallMultiplierID}` : undefined}
                    style={inputTextStyle}
                  />
                </View>
              </View>
            </View>

            <View style={rowStyle}>
              <View style={inlineFieldStyle}>
                <Text style={labelStyle}>Bathroom</Text>
                <View style={inputContainerStyle}>
                  <TextInput
                    ref={bathroomMultiplierRef}
                    value={bathroomLaborMultiplier}
                    onChangeText={setBathroomLaborMultiplier}
                    placeholder="1.0"
                    placeholderTextColor={Colors.mediumGray}
                    keyboardType="numeric"
                    returnKeyType="next"
                    onSubmitEditing={() => closetMultiplierRef.current?.focus()}
                    onFocus={handleFieldFocus}
                    blurOnSubmit={false}
                    inputAccessoryViewID={Platform.OS === "ios" ? `pricingBathroomMultiplier-${bathroomMultiplierID}` : undefined}
                    style={inputTextStyle}
                  />
                </View>
              </View>
              <View style={inlineFieldStyle}>
                <Text style={labelStyle}>Closet</Text>
                <View style={inputContainerStyle}>
                  <TextInput
                    ref={closetMultiplierRef}
                    value={closetLaborMultiplier}
                    onChangeText={setClosetLaborMultiplier}
                    placeholder="1.0"
                    placeholderTextColor={Colors.mediumGray}
                    keyboardType="numeric"
                    returnKeyType="next"
                    onSubmitEditing={() => furnitureMovingFeeRef.current?.focus()}
                    onFocus={handleFieldFocus}
                    blurOnSubmit={false}
                    inputAccessoryViewID={Platform.OS === "ios" ? `pricingClosetMultiplier-${closetMultiplierID}` : undefined}
                    style={inputTextStyle}
                  />
                </View>
              </View>
            </View>
          </Card>

          {/* Fixed Fees */}
          <Card style={{ marginBottom: Spacing.md }}>
            <Text style={{ ...Typography.h2, marginBottom: Spacing.md }}>
              Fixed Fees
            </Text>

            <View style={rowStyle}>
              <View style={inlineFieldStyle}>
                <View style={[leftAlignedLabelWrapperStyle, labelCenterWithBubbleValueStyle]}>
                  <Text style={leftAlignedLabelTextStyle}>Furniture Moving</Text>
                </View>
                <View style={bubbleHeaderWrapperStyle}>
                  <Text style={bubbleHeaderTextStyle}>Each $</Text>
                  <View style={inputContainerStyle}>
                    <TextInput
                      ref={furnitureMovingFeeRef}
                      value={furnitureMovingFee}
                      onChangeText={setFurnitureMovingFee}
                      placeholder="100"
                      placeholderTextColor={Colors.mediumGray}
                      keyboardType="numeric"
                      returnKeyType="next"
                      onSubmitEditing={() => nailsRemovalFeeRef.current?.focus()}
                      onFocus={handleFieldFocus}
                      blurOnSubmit={false}
                      inputAccessoryViewID={Platform.OS === "ios" ? `pricingFurnitureMovingFee-${furnitureMovingFeeID}` : undefined}
                      style={inputTextStyle}
                    />
                  </View>
                </View>
              </View>
            </View>

            <View style={rowStyle}>
              <View style={inlineFieldStyle}>
                <View style={[leftAlignedLabelWrapperStyle, labelCenterWithBubbleValueStyle]}>
                  <Text style={leftAlignedLabelTextStyle}>Nails/Screws Removal</Text>
                </View>
                <View style={bubbleHeaderWrapperStyle}>
                  <Text style={bubbleHeaderTextStyle}>Each $</Text>
                  <View style={inputContainerStyle}>
                    <TextInput
                      ref={nailsRemovalFeeRef}
                      value={nailsRemovalFee}
                      onChangeText={setNailsRemovalFee}
                      placeholder="75"
                      placeholderTextColor={Colors.mediumGray}
                      keyboardType="numeric"
                      returnKeyType="next"
                      onSubmitEditing={() => wallPaintGallonRef.current?.focus()}
                      onFocus={handleFieldFocus}
                      blurOnSubmit={false}
                      inputAccessoryViewID={Platform.OS === "ios" ? `pricingNailsRemovalFee-${nailsRemovalFeeID}` : undefined}
                      style={inputTextStyle}
                    />
                  </View>
                </View>
              </View>
            </View>
          </Card>

          {/* Material Costs */}
          <Card style={{ marginBottom: Spacing.md }}>
            <Text style={{ ...Typography.h2, marginBottom: Spacing.md }}>
              Material Costs
            </Text>

            <View style={materialRowStyle}>
              <View style={{ flex: 1 }} />
              <View style={columnLabelWrapperStyle}>
                <Text style={columnLabelStyle}>1 gal</Text>
              </View>
              <View style={columnLabelWrapperStyle}>
                <Text style={columnLabelStyle}>5 gal</Text>
              </View>
            </View>

            <View style={materialRowStyle}>
              <View style={[leftAlignedLabelWrapperStyle, labelCenterWithBubbleValueStyle]}>
                <Text style={leftAlignedLabelTextStyle}>Wall Paint</Text>
              </View>
              <View style={inputContainerStyle}>
                <TextInput
                  ref={wallPaintGallonRef}
                  value={wallPaintPerGallon}
                  onChangeText={setWallPaintPerGallon}
                  placeholder="45"
                  placeholderTextColor={Colors.mediumGray}
                  keyboardType="numeric"
                  returnKeyType="next"
                  onSubmitEditing={() => wallPaint5GallonRef.current?.focus()}
                  onFocus={handleFieldFocus}
                  blurOnSubmit={false}
                  inputAccessoryViewID={Platform.OS === "ios" ? `pricingWallPaintGallon-${wallPaintGallonID}` : undefined}
                  style={inputTextStyle}
                />
              </View>
              <View style={inputContainerStyle}>
                <TextInput
                  ref={wallPaint5GallonRef}
                  value={wallPaintPer5Gallon}
                  onChangeText={setWallPaintPer5Gallon}
                  placeholder="200"
                  placeholderTextColor={Colors.mediumGray}
                  keyboardType="numeric"
                  returnKeyType="next"
                  onSubmitEditing={() => ceilingPaintGallonRef.current?.focus()}
                  onFocus={handleFieldFocus}
                  blurOnSubmit={false}
                  inputAccessoryViewID={Platform.OS === "ios" ? `pricingWallPaint5Gallon-${wallPaint5GallonID}` : undefined}
                  style={inputTextStyle}
                />
              </View>
            </View>

            <View style={materialRowStyle}>
              <View style={[leftAlignedLabelWrapperStyle, labelCenterWithBubbleValueStyle]}>
                <Text style={leftAlignedLabelTextStyle}>Ceiling Paint</Text>
              </View>
              <View style={inputContainerStyle}>
                <TextInput
                  ref={ceilingPaintGallonRef}
                  value={ceilingPaintPerGallon}
                  onChangeText={setCeilingPaintPerGallon}
                  placeholder="40"
                  placeholderTextColor={Colors.mediumGray}
                  keyboardType="numeric"
                  returnKeyType="next"
                  onSubmitEditing={() => ceilingPaint5GallonRef.current?.focus()}
                  onFocus={handleFieldFocus}
                  blurOnSubmit={false}
                  inputAccessoryViewID={Platform.OS === "ios" ? `pricingCeilingPaintGallon-${ceilingPaintGallonID}` : undefined}
                  style={inputTextStyle}
                />
              </View>
              <View style={inputContainerStyle}>
                <TextInput
                  ref={ceilingPaint5GallonRef}
                  value={ceilingPaintPer5Gallon}
                  onChangeText={setCeilingPaintPer5Gallon}
                  placeholder="175"
                  placeholderTextColor={Colors.mediumGray}
                  keyboardType="numeric"
                  returnKeyType="next"
                  onSubmitEditing={() => trimPaintGallonRef.current?.focus()}
                  onFocus={handleFieldFocus}
                  blurOnSubmit={false}
                  inputAccessoryViewID={Platform.OS === "ios" ? `pricingCeilingPaint5Gallon-${ceilingPaint5GallonID}` : undefined}
                  style={inputTextStyle}
                />
              </View>
            </View>

            <View style={{ marginBottom: Spacing.md }}>
              <View style={materialRowStyle}>
                <View style={[leftAlignedLabelWrapperStyle, labelCenterWithBubbleValueStyle]}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.xs }}>
                    <Text style={leftAlignedLabelTextStyle}>Trim Paint</Text>
                    <Pressable
                      onPress={() => openInfoModal("Trim Paint", "Used for: baseboards, doors, jambs, window/door trim, crown moulding, risers, spindles, handrails")}
                      hitSlop={8}
                    >
                      <Ionicons name="help-circle-outline" size={16} color={Colors.mediumGray} accessibilityLabel="Trim paint help" />
                    </Pressable>
                  </View>
                </View>
                <View style={inputContainerStyle}>
                  <TextInput
                    ref={trimPaintGallonRef}
                    value={trimPaintPerGallon}
                    onChangeText={setTrimPaintPerGallon}
                    placeholder="50"
                    placeholderTextColor={Colors.mediumGray}
                    keyboardType="numeric"
                    returnKeyType="next"
                    onSubmitEditing={() => trimPaint5GallonRef.current?.focus()}
                    onFocus={handleFieldFocus}
                    blurOnSubmit={false}
                    inputAccessoryViewID={Platform.OS === "ios" ? `pricingTrimPaintGallon-${trimPaintGallonID}` : undefined}
                    style={inputTextStyle}
                  />
                </View>
                <View style={inputContainerStyle}>
                  <TextInput
                    ref={trimPaint5GallonRef}
                    value={trimPaintPer5Gallon}
                    onChangeText={setTrimPaintPer5Gallon}
                    placeholder="225"
                    placeholderTextColor={Colors.mediumGray}
                    keyboardType="numeric"
                    returnKeyType="next"
                    onSubmitEditing={() => primerGallonRef.current?.focus()}
                    onFocus={handleFieldFocus}
                    blurOnSubmit={false}
                    inputAccessoryViewID={Platform.OS === "ios" ? `pricingTrimPaint5Gallon-${trimPaint5GallonID}` : undefined}
                    style={inputTextStyle}
                  />
                </View>
              </View>
            </View>

            <View style={materialRowStyle}>
              <View style={[leftAlignedLabelWrapperStyle, labelCenterWithBubbleValueStyle]}>
                <Text style={leftAlignedLabelTextStyle}>Primer</Text>
              </View>
              <View style={inputContainerStyle}>
                <TextInput
                  ref={primerGallonRef}
                  value={primerPerGallon}
                  onChangeText={setPrimerPerGallon}
                  placeholder="35"
                  placeholderTextColor={Colors.mediumGray}
                  keyboardType="numeric"
                  returnKeyType="next"
                  onSubmitEditing={() => primer5GallonRef.current?.focus()}
                  onFocus={handleFieldFocus}
                  blurOnSubmit={false}
                  inputAccessoryViewID={Platform.OS === "ios" ? `pricingPrimerGallon-${primerGallonID}` : undefined}
                  style={inputTextStyle}
                />
              </View>
              <View style={inputContainerStyle}>
                <TextInput
                  ref={primer5GallonRef}
                  value={primerPer5Gallon}
                  onChangeText={setPrimerPer5Gallon}
                  placeholder="150"
                  placeholderTextColor={Colors.mediumGray}
                  keyboardType="numeric"
                  returnKeyType="done"
                  onSubmitEditing={() => Keyboard.dismiss()}
                  onFocus={handleFieldFocus}
                  inputAccessoryViewID={Platform.OS === "ios" ? `pricingPrimer5Gallon-${primer5GallonID}` : undefined}
                  style={inputTextStyle}
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

      <Modal
        visible={infoModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setInfoModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.4)", justifyContent: "center", padding: Spacing.lg }}>
          <Pressable
            onPress={() => setInfoModalVisible(false)}
            style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
          />
          <View style={{ backgroundColor: Colors.white, borderRadius: BorderRadius.default, padding: Spacing.lg, ...Shadows.card }}>
            <Text style={{ fontSize: Typography.h3.fontSize, fontWeight: Typography.h3.fontWeight as any, color: Colors.darkCharcoal, marginBottom: Spacing.sm }}>
              {infoModalTitle}
            </Text>
            <Text style={{ fontSize: Typography.body.fontSize, color: Colors.mediumGray, marginBottom: Spacing.lg }}>
              {infoModalBody}
            </Text>
            <Pressable
              onPress={() => setInfoModalVisible(false)}
              style={{ backgroundColor: Colors.primaryBlue, borderRadius: BorderRadius.default, paddingVertical: Spacing.sm, alignItems: "center" }}
            >
              <Text style={{ fontSize: Typography.body.fontSize, fontWeight: "600" as any, color: Colors.white }}>
                Close
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

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
            <Pressable onPress={() => doorLaborRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`pricingBaseboardLabor-${baseboardLaborID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => windowLaborRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => crownMouldingRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`pricingDoorLabor-${doorLaborID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => ceilingLaborRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => windowLaborRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`pricingWindowLabor-${windowLaborID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => doorLaborRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => baseboardLaborRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`pricingClosetLabor-${closetLaborID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => crownMouldingRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
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
            <Pressable onPress={() => mantelLaborRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`pricingMantelLabor-${mantelLaborID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => handrailLaborRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => legsLaborRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`pricingLegsLabor-${legsLaborID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => mantelLaborRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => secondCoatMultiplierRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`pricingCrownMoulding-${crownMouldingID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => baseboardLaborRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => closetLaborRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`pricing2CoatMultiplier-${secondCoatMultiplierID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => legsLaborRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => accentWallMultiplierRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`pricingAccentWallMultiplier-${accentWallMultiplierID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => secondCoatMultiplierRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => bathroomMultiplierRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`pricingBathroomMultiplier-${bathroomMultiplierID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => accentWallMultiplierRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => closetMultiplierRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`pricingClosetMultiplier-${closetMultiplierID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => bathroomMultiplierRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => furnitureMovingFeeRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`pricingFurnitureMovingFee-${furnitureMovingFeeID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => closetMultiplierRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
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
            <Pressable onPress={() => wallPaint5GallonRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`pricingCeilingPaintGallon-${ceilingPaintGallonID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => wallPaint5GallonRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => ceilingPaint5GallonRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`pricingTrimPaintGallon-${trimPaintGallonID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => ceilingPaint5GallonRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => trimPaint5GallonRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`pricingPrimerGallon-${primerGallonID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => trimPaint5GallonRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => primer5GallonRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`pricingWallPaint5Gallon-${wallPaint5GallonID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => wallPaintGallonRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => ceilingPaintGallonRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`pricingCeilingPaint5Gallon-${ceilingPaint5GallonID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => ceilingPaintGallonRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => trimPaintGallonRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`pricingTrimPaint5Gallon-${trimPaint5GallonID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => trimPaintGallonRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => primerGallonRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`pricingPrimer5Gallon-${primer5GallonID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => primerGallonRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => Keyboard.dismiss()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Done</Text></Pressable>
          </View>
        </InputAccessoryView>
      </>)}
    </SafeAreaView>
  );
}
