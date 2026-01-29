import React, { useRef, useId, useCallback, useEffect, useLayoutEffect, useMemo } from "react";
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
import { usePreventRemove } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/RootNavigator";
import { usePricingStore, defaultPricing } from "../state/pricingStore";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius, Shadows, TextInputStyles } from "../utils/designSystem";
import { Card } from "../components/Card";
import { SavePromptModal } from "../components/SavePromptModal";

type Props = NativeStackScreenProps<RootStackParamList, "PricingSettings">;

export default function PricingSettingsScreen({ navigation }: Props) {
  const pricing = usePricingStore();

  const [infoModalVisible, setInfoModalVisible] = React.useState(false);
  const [infoModalTitle, setInfoModalTitle] = React.useState("");
  const [infoModalBody, setInfoModalBody] = React.useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);
  const [showSavePrompt, setShowSavePrompt] = React.useState(false);
  const [discardWidth, setDiscardWidth] = React.useState<number | null>(null);
  const isSavingRef = useRef(false);
  const pendingSavePromptRef = useRef(false);
  const preventedNavigationActionRef = useRef<any>(null);

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
  const [cabinetDoorLabor, setCabinetDoorLabor] = React.useState(
    (pricing.cabinetDoorLabor || 150).toString()
  );
  const [cabinetDrawerLabor, setCabinetDrawerLabor] = React.useState(
    (pricing.cabinetDrawerLabor || 30).toString()
  );
  const [wallCabinetLabor, setWallCabinetLabor] = React.useState(
    (pricing.wallCabinetLabor || 165).toString()
  );
  const [builtInShelfLabor, setBuiltInShelfLabor] = React.useState(
    (pricing.builtInShelfLabor || 25).toString()
  );
  const [vanityDoorLabor, setVanityDoorLabor] = React.useState(
    (pricing.vanityDoorLabor || 150).toString()
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
    (pricing.bathroomLaborMultiplier || 2.5).toString()
  );
  const [bathroomLaborMode, setBathroomLaborMode] = React.useState(
    pricing.bathroomLaborMode || "multiplier"
  );
  const [bathroomTierSmallLabor, setBathroomTierSmallLabor] = React.useState(
    (pricing.bathroomTierSmallLabor ?? 350).toString()
  );
  const [bathroomTierMediumLabor, setBathroomTierMediumLabor] = React.useState(
    (pricing.bathroomTierMediumLabor ?? 400).toString()
  );
  const [bathroomTierLargeBaseLabor, setBathroomTierLargeBaseLabor] = React.useState(
    (pricing.bathroomTierLargeBaseLabor ?? 450).toString()
  );
  const [bathroomTierLargeExtraPerSqFt, setBathroomTierLargeExtraPerSqFt] = React.useState(
    (pricing.bathroomTierLargeExtraPerSqFt ?? 5).toString()
  );
  const [bathroomEnclosedToiletAddOn, setBathroomEnclosedToiletAddOn] = React.useState(
    (pricing.bathroomEnclosedToiletAddOn ?? 50).toString()
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
  const [cabinetPaintPerGallon, setCabinetPaintPerGallon] = React.useState(
    (pricing.cabinetPaintPerGallon || 60).toString()
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
  const [cabinetPaintPer5Gallon, setCabinetPaintPer5Gallon] = React.useState(
    (pricing.cabinetPaintPer5Gallon || 450).toString()
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
  const cabinetDoorLaborRef = useRef<TextInput>(null);
  const cabinetDrawerLaborRef = useRef<TextInput>(null);
  const wallCabinetLaborRef = useRef<TextInput>(null);
  const builtInShelfLaborRef = useRef<TextInput>(null);
  const vanityDoorLaborRef = useRef<TextInput>(null);
  const riserLaborRef = useRef<TextInput>(null);
  const spindleLaborRef = useRef<TextInput>(null);
  const handrailLaborRef = useRef<TextInput>(null);
  const mantelLaborRef = useRef<TextInput>(null);
  const legsLaborRef = useRef<TextInput>(null);
  const crownMouldingRef = useRef<TextInput>(null);
  const secondCoatMultiplierRef = useRef<TextInput>(null);
  const accentWallMultiplierRef = useRef<TextInput>(null);
  const bathroomMultiplierRef = useRef<TextInput>(null);
  const bathroomTierSmallRef = useRef<TextInput>(null);
  const bathroomTierMediumRef = useRef<TextInput>(null);
  const bathroomTierLargeBaseRef = useRef<TextInput>(null);
  const bathroomTierLargeExtraRef = useRef<TextInput>(null);
  const bathroomEnclosedToiletRef = useRef<TextInput>(null);
  const closetMultiplierRef = useRef<TextInput>(null);
  const furnitureMovingFeeRef = useRef<TextInput>(null);
  const nailsRemovalFeeRef = useRef<TextInput>(null);
  const wallPaintGallonRef = useRef<TextInput>(null);
  const ceilingPaintGallonRef = useRef<TextInput>(null);
  const trimPaintGallonRef = useRef<TextInput>(null);
  const cabinetPaintGallonRef = useRef<TextInput>(null);
  const primerGallonRef = useRef<TextInput>(null);
  const wallPaint5GallonRef = useRef<TextInput>(null);
  const ceilingPaint5GallonRef = useRef<TextInput>(null);
  const trimPaint5GallonRef = useRef<TextInput>(null);
  const cabinetPaint5GallonRef = useRef<TextInput>(null);
  const primer5GallonRef = useRef<TextInput>(null);

  // KB-004: Unique IDs for InputAccessoryViews
  const wallLaborID = useId();
  const ceilingLaborID = useId();
  const baseboardLaborID = useId();
  const doorLaborID = useId();
  const windowLaborID = useId();
  const closetLaborID = useId();
  const cabinetDoorLaborID = useId();
  const cabinetDrawerLaborID = useId();
  const wallCabinetLaborID = useId();
  const builtInShelfLaborID = useId();
  const vanityDoorLaborID = useId();
  const riserLaborID = useId();
  const spindleLaborID = useId();
  const handrailLaborID = useId();
  const mantelLaborID = useId();
  const legsLaborID = useId();
  const crownMouldingID = useId();
  const secondCoatMultiplierID = useId();
  const accentWallMultiplierID = useId();
  const bathroomMultiplierID = useId();
  const bathroomTierSmallID = useId();
  const bathroomTierMediumID = useId();
  const bathroomTierLargeBaseID = useId();
  const bathroomTierLargeExtraID = useId();
  const bathroomEnclosedToiletID = useId();
  const closetMultiplierID = useId();
  const furnitureMovingFeeID = useId();
  const nailsRemovalFeeID = useId();
  const wallPaintGallonID = useId();
  const ceilingPaintGallonID = useId();
  const trimPaintGallonID = useId();
  const cabinetPaintGallonID = useId();
  const primerGallonID = useId();
  const wallPaint5GallonID = useId();
  const ceilingPaint5GallonID = useId();
  const trimPaint5GallonID = useId();
  const cabinetPaint5GallonID = useId();
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
      if (pendingSavePromptRef.current) {
        pendingSavePromptRef.current = false;
        setShowSavePrompt(true);
      }
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [scrollFocusedInputIntoView]);

  const handleSave = () => {
    isSavingRef.current = true;
    pricing.updatePricing({
      wallLaborPerSqFt: parseFloat(wallLaborPerSqFt) || 0,
      ceilingLaborPerSqFt: parseFloat(ceilingLaborPerSqFt) || 0,
      baseboardLaborPerLF: parseFloat(baseboardLaborPerLF) || 0,
      doorLabor: parseFloat(doorLabor) || 0,
      windowLabor: parseFloat(windowLabor) || 0,
      closetLabor: parseFloat(closetLabor) || 0,
      cabinetDoorLabor: parseFloat(cabinetDoorLabor) || 150,
      cabinetFrontLabor: parseFloat(cabinetDoorLabor) || 150,
      vanityDoorLabor: parseFloat(vanityDoorLabor) || 150,
      cabinetDrawerLabor: parseFloat(cabinetDrawerLabor) || 30,
      wallCabinetLabor: parseFloat(wallCabinetLabor) || 165,
      builtInShelfLabor: parseFloat(builtInShelfLabor) || 25,
      riserLabor: parseFloat(riserLabor) || 0,
      spindleLabor: parseFloat(spindleLabor) || 0,
      handrailLaborPerLF: parseFloat(handrailLaborPerLF) || 0,
      fireplaceLabor: parseFloat(fireplaceLabor) || 0,
      mantelLabor: parseFloat(mantelLabor) || 100,
      legsLabor: parseFloat(legsLabor) || 100,
      crownMouldingLaborPerLF: parseFloat(crownMouldingLaborPerLF) || 0,
      secondCoatLaborMultiplier: parseFloat(secondCoatLaborMultiplier) || 2.0,
      accentWallLaborMultiplier: parseFloat(accentWallLaborMultiplier) || 1.25,
      bathroomLaborMultiplier: parseFloat(bathroomLaborMultiplier) || 2.5,
      bathroomLaborMode,
      bathroomTierSmallLabor: parseFloat(bathroomTierSmallLabor) || 350,
      bathroomTierMediumLabor: parseFloat(bathroomTierMediumLabor) || 400,
      bathroomTierLargeBaseLabor: parseFloat(bathroomTierLargeBaseLabor) || 450,
      bathroomTierLargeExtraPerSqFt: parseFloat(bathroomTierLargeExtraPerSqFt) || 5,
      bathroomEnclosedToiletAddOn: parseFloat(bathroomEnclosedToiletAddOn) || 50,
      closetLaborMultiplier: parseFloat(closetLaborMultiplier) || 1.0,
      furnitureMovingFee: parseFloat(furnitureMovingFee) || 100,
      nailsRemovalFee: parseFloat(nailsRemovalFee) || 75,
      wallPaintPerGallon: parseFloat(wallPaintPerGallon) || 0,
      ceilingPaintPerGallon: parseFloat(ceilingPaintPerGallon) || 0,
      trimPaintPerGallon: parseFloat(trimPaintPerGallon) || 0,
      doorPaintPerGallon: parseFloat(trimPaintPerGallon) || 0, // Door paint uses trim paint price
      cabinetPaintPerGallon: parseFloat(cabinetPaintPerGallon) || 60,
      primerPerGallon: parseFloat(primerPerGallon) || 0,
      wallPaintPer5Gallon: parseFloat(wallPaintPer5Gallon) || 200,
      ceilingPaintPer5Gallon: parseFloat(ceilingPaintPer5Gallon) || 175,
      trimPaintPer5Gallon: parseFloat(trimPaintPer5Gallon) || 225,
      doorPaintPer5Gallon: parseFloat(trimPaintPer5Gallon) || 225, // Door paint uses trim paint price
      cabinetPaintPer5Gallon: parseFloat(cabinetPaintPer5Gallon) || 450,
      primerPer5Gallon: parseFloat(primerPer5Gallon) || 150,
    });
    setHasUnsavedChanges(false);
    navigation.goBack();
  };

  const handleDiscard = () => {
    if (hasUnsavedChanges) {
      if (isKeyboardVisibleRef.current) {
        pendingSavePromptRef.current = true;
        Keyboard.dismiss();
        return;
      }
      setShowSavePrompt(true);
      return;
    }
    navigation.goBack();
  };

  const handleSaveAndLeave = () => {
    setShowSavePrompt(false);
    isSavingRef.current = true;
    handleSave();
    if (preventedNavigationActionRef.current) {
      navigation.dispatch(preventedNavigationActionRef.current);
      preventedNavigationActionRef.current = null;
      return;
    }
    navigation.goBack();
  };

  const handleDiscardAndLeave = () => {
    setShowSavePrompt(false);
    if (preventedNavigationActionRef.current) {
      navigation.dispatch(preventedNavigationActionRef.current);
      preventedNavigationActionRef.current = null;
      return;
    }
    navigation.goBack();
  };

  const handleCancelExit = () => {
    setShowSavePrompt(false);
  };

  const parseOrDefault = (value: string, fallback: number) => {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const isDirty = useMemo(() => {
    return (
      parseOrDefault(wallLaborPerSqFt, pricing.wallLaborPerSqFt) !== pricing.wallLaborPerSqFt ||
      parseOrDefault(ceilingLaborPerSqFt, pricing.ceilingLaborPerSqFt) !== pricing.ceilingLaborPerSqFt ||
      parseOrDefault(baseboardLaborPerLF, pricing.baseboardLaborPerLF) !== pricing.baseboardLaborPerLF ||
      parseOrDefault(doorLabor, pricing.doorLabor) !== pricing.doorLabor ||
      parseOrDefault(windowLabor, pricing.windowLabor) !== pricing.windowLabor ||
      parseOrDefault(closetLabor, pricing.closetLabor) !== pricing.closetLabor ||
      parseOrDefault(cabinetDoorLabor, pricing.cabinetDoorLabor || 150) !== (pricing.cabinetDoorLabor || 150) ||
      parseOrDefault(vanityDoorLabor, pricing.vanityDoorLabor || 150) !== (pricing.vanityDoorLabor || 150) ||
      parseOrDefault(cabinetDrawerLabor, pricing.cabinetDrawerLabor || 30) !== (pricing.cabinetDrawerLabor || 30) ||
      parseOrDefault(wallCabinetLabor, pricing.wallCabinetLabor || 165) !== (pricing.wallCabinetLabor || 165) ||
      parseOrDefault(builtInShelfLabor, pricing.builtInShelfLabor || 25) !== (pricing.builtInShelfLabor || 25) ||
      parseOrDefault(riserLabor, pricing.riserLabor) !== pricing.riserLabor ||
      parseOrDefault(spindleLabor, pricing.spindleLabor) !== pricing.spindleLabor ||
      parseOrDefault(handrailLaborPerLF, pricing.handrailLaborPerLF) !== pricing.handrailLaborPerLF ||
      parseOrDefault(fireplaceLabor, pricing.fireplaceLabor) !== pricing.fireplaceLabor ||
      parseOrDefault(mantelLabor, pricing.mantelLabor) !== pricing.mantelLabor ||
      parseOrDefault(legsLabor, pricing.legsLabor) !== pricing.legsLabor ||
      parseOrDefault(crownMouldingLaborPerLF, pricing.crownMouldingLaborPerLF) !== pricing.crownMouldingLaborPerLF ||
      parseOrDefault(secondCoatLaborMultiplier, pricing.secondCoatLaborMultiplier || 2.0) !== (pricing.secondCoatLaborMultiplier || 2.0) ||
      parseOrDefault(accentWallLaborMultiplier, pricing.accentWallLaborMultiplier || 1.25) !== (pricing.accentWallLaborMultiplier || 1.25) ||
      parseOrDefault(bathroomLaborMultiplier, pricing.bathroomLaborMultiplier || 2.5) !== (pricing.bathroomLaborMultiplier || 2.5) ||
      bathroomLaborMode !== (pricing.bathroomLaborMode || "multiplier") ||
      parseOrDefault(bathroomTierSmallLabor, pricing.bathroomTierSmallLabor ?? 350) !== (pricing.bathroomTierSmallLabor ?? 350) ||
      parseOrDefault(bathroomTierMediumLabor, pricing.bathroomTierMediumLabor ?? 400) !== (pricing.bathroomTierMediumLabor ?? 400) ||
      parseOrDefault(bathroomTierLargeBaseLabor, pricing.bathroomTierLargeBaseLabor ?? 450) !== (pricing.bathroomTierLargeBaseLabor ?? 450) ||
      parseOrDefault(bathroomTierLargeExtraPerSqFt, pricing.bathroomTierLargeExtraPerSqFt ?? 5) !== (pricing.bathroomTierLargeExtraPerSqFt ?? 5) ||
      parseOrDefault(bathroomEnclosedToiletAddOn, pricing.bathroomEnclosedToiletAddOn ?? 50) !== (pricing.bathroomEnclosedToiletAddOn ?? 50) ||
      parseOrDefault(closetLaborMultiplier, pricing.closetLaborMultiplier || 1.0) !== (pricing.closetLaborMultiplier || 1.0) ||
      parseOrDefault(furnitureMovingFee, pricing.furnitureMovingFee || 100) !== (pricing.furnitureMovingFee || 100) ||
      parseOrDefault(nailsRemovalFee, pricing.nailsRemovalFee || 75) !== (pricing.nailsRemovalFee || 75) ||
      parseOrDefault(wallPaintPerGallon, pricing.wallPaintPerGallon) !== pricing.wallPaintPerGallon ||
      parseOrDefault(ceilingPaintPerGallon, pricing.ceilingPaintPerGallon) !== pricing.ceilingPaintPerGallon ||
      parseOrDefault(trimPaintPerGallon, pricing.trimPaintPerGallon) !== pricing.trimPaintPerGallon ||
      parseOrDefault(primerPerGallon, pricing.primerPerGallon) !== pricing.primerPerGallon ||
      parseOrDefault(wallPaintPer5Gallon, pricing.wallPaintPer5Gallon || 200) !== (pricing.wallPaintPer5Gallon || 200) ||
      parseOrDefault(ceilingPaintPer5Gallon, pricing.ceilingPaintPer5Gallon || 175) !== (pricing.ceilingPaintPer5Gallon || 175) ||
      parseOrDefault(trimPaintPer5Gallon, pricing.trimPaintPer5Gallon || 225) !== (pricing.trimPaintPer5Gallon || 225) ||
      parseOrDefault(cabinetPaintPer5Gallon, pricing.cabinetPaintPer5Gallon || 450) !== (pricing.cabinetPaintPer5Gallon || 450) ||
      parseOrDefault(primerPer5Gallon, pricing.primerPer5Gallon || 150) !== (pricing.primerPer5Gallon || 150) ||
      parseOrDefault(cabinetPaintPerGallon, pricing.cabinetPaintPerGallon || 60) !== (pricing.cabinetPaintPerGallon || 60)
    );
  }, [
    wallLaborPerSqFt,
    ceilingLaborPerSqFt,
    baseboardLaborPerLF,
    doorLabor,
    windowLabor,
    closetLabor,
    cabinetDoorLabor,
    vanityDoorLabor,
    cabinetDrawerLabor,
    wallCabinetLabor,
    builtInShelfLabor,
    riserLabor,
    spindleLabor,
    handrailLaborPerLF,
    fireplaceLabor,
    mantelLabor,
    legsLabor,
    crownMouldingLaborPerLF,
    secondCoatLaborMultiplier,
    accentWallLaborMultiplier,
    bathroomLaborMultiplier,
    bathroomLaborMode,
    bathroomTierSmallLabor,
    bathroomTierMediumLabor,
    bathroomTierLargeBaseLabor,
    bathroomTierLargeExtraPerSqFt,
    bathroomEnclosedToiletAddOn,
    closetLaborMultiplier,
    furnitureMovingFee,
    nailsRemovalFee,
    wallPaintPerGallon,
    ceilingPaintPerGallon,
    trimPaintPerGallon,
    primerPerGallon,
    wallPaintPer5Gallon,
    ceilingPaintPer5Gallon,
    trimPaintPer5Gallon,
    cabinetPaintPer5Gallon,
    primerPer5Gallon,
    cabinetPaintPerGallon,
    pricing,
  ]);

  React.useEffect(() => {
    setHasUnsavedChanges(isDirty);
  }, [isDirty]);

  usePreventRemove(hasUnsavedChanges, ({ data }) => {
    if (isSavingRef.current) return;
    preventedNavigationActionRef.current = data.action;
    if (isKeyboardVisibleRef.current) {
      pendingSavePromptRef.current = true;
      Keyboard.dismiss();
    } else {
      setShowSavePrompt(true);
    }
  });

  useLayoutEffect(() => {
    navigation.setOptions({
      headerBackTitleVisible: false,
      headerBackTitle: "",
      headerBackTitleStyle: { color: "transparent" },
      headerRight: () => (
        <View style={{ flexDirection: "row", gap: Spacing.sm }}>
          <Pressable
            onPress={handleDiscard}
            style={{ paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs }}
            accessibilityRole="button"
            accessibilityLabel="Cancel changes"
          >
            <Text style={{ color: Colors.mediumGray, fontWeight: "600" as any }}>Cancel</Text>
          </Pressable>
          <Pressable
            onPress={handleSave}
            style={{ paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs }}
            accessibilityRole="button"
            accessibilityLabel="Save changes"
          >
            <Text style={{ color: Colors.primaryBlue, fontWeight: "700" as any }}>Save</Text>
          </Pressable>
        </View>
      ),
    });
  }, [navigation, handleDiscard, handleSave]);

  const openInfoModal = useCallback((title: string, body: string) => {
    setInfoModalTitle(title);
    setInfoModalBody(body);
    setInfoModalVisible(true);
  }, []);

  const rowStyle = { flexDirection: "row", alignItems: "center", gap: Spacing.sm, marginBottom: Spacing.md };
  const inlineFieldStyle = { flex: 1, flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" as const };
  const labelStyle = { fontSize: Typography.body.fontSize, fontWeight: "500", color: Colors.darkCharcoal, flex: 1 };
  const inputWidth = 68;
  const inputContainerStyle = { ...TextInputStyles.container, width: inputWidth };
  const inputTextStyle = { ...TextInputStyles.base, textAlign: "right" as const };
  const modeToggleWidth = inputWidth * 2 + Spacing.sm;
  const modeToggleContainerStyle = {
    ...TextInputStyles.container,
    width: modeToggleWidth,
    flexDirection: "row",
    paddingHorizontal: 0,
    paddingVertical: 0,
    overflow: "hidden" as const,
    marginTop: Typography.caption.fontSize + Spacing.xs + Spacing.sm,
  };
  const modeToggleButtonStyle = { flex: 1, paddingVertical: Spacing.sm, alignItems: "center", justifyContent: "center" };
  const materialRowStyle = { flexDirection: "row", alignItems: "flex-start", gap: Spacing.sm, marginBottom: Spacing.md };
  const materialHeaderRowStyle = { flexDirection: "row", alignItems: "center", gap: Spacing.sm, marginBottom: Spacing.xs };
  const columnLabelWrapperStyle = { width: inputWidth, paddingHorizontal: Spacing.md, alignItems: "center" as const };
  const columnLabelStyle = { textAlign: "center" as const, fontSize: Typography.caption.fontSize, color: Colors.mediumGray, width: "100%" as const, marginBottom: Spacing.xs };
  const bubbleHeaderWrapperStyle = { width: inputWidth, alignItems: "flex-end" as const };
  const bubbleHeaderTextStyle = { fontSize: Typography.caption.fontSize, color: Colors.mediumGray, textAlign: "right" as const, paddingRight: Spacing.md, marginBottom: Spacing.xs };
  const bubbleStyleFor = (value: string, originalValue: number) => [
    inputContainerStyle,
    parseOrDefault(value, originalValue) !== originalValue && { borderColor: Colors.success, borderWidth: 3 },
  ];
  const rightAlignedLabelWrapperStyle = { width: inputWidth, alignItems: "flex-end" as const };
  const labelAlignWithBubbleValueStyle = { paddingTop: Typography.caption.fontSize + Spacing.xs };
  const rightAlignedLabelTextStyle = { ...labelStyle, textAlign: "right" as const, paddingRight: Spacing.md };
  const labelCenterTextStyle = { ...labelStyle, marginTop: Typography.caption.fontSize + Spacing.xs };
  const leftAlignedLabelWrapperStyle = { flex: 1, alignItems: "flex-start" as const, minWidth: 0 };
  // Horizontal alignment standard: do not change without explicit approval.
  const leftAlignedLabelTextStyle = { ...labelStyle, textAlign: "left" as const, width: "100%" as const };
  const labelCenterLeftTextStyle = { ...labelStyle, marginTop: Typography.caption.fontSize + Spacing.xs, textAlign: "left" as const };
  const noHeaderLabelStyle = { alignSelf: "center" as const, marginTop: 0 };
  const materialLabelStyle = { marginTop: Spacing.sm };
  const trimPaintLabelRowStyle = { flexDirection: "row", alignItems: "center", gap: Spacing.xs };
  // Vertical alignment standard: do not change without explicit approval.
  const mainLabelStyle = { marginTop: Typography.caption.fontSize + Spacing.xs + Spacing.sm };
  const rowLabelTextStyle = { ...leftAlignedLabelTextStyle, flex: 0, width: "auto" as const };
  const rowLabelBaselineStyle = { flexDirection: "row", alignItems: "center" as const };
  const rowLabelWithBubbleBaselineStyle = { ...leftAlignedLabelWrapperStyle, ...labelAlignWithBubbleValueStyle };
  const labelWithIconRowStyle = { flexDirection: "row", alignItems: "center", gap: Spacing.xs, marginTop: Typography.caption.fontSize + Spacing.xs };

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

            <View style={{ flexDirection: "row", gap: Spacing.md, marginBottom: Spacing.md }}>
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: Spacing.sm }}>
                <View style={leftAlignedLabelWrapperStyle}>
                  <Text style={{ ...leftAlignedLabelTextStyle, ...mainLabelStyle }}>Wall</Text>
                </View>
                <View style={bubbleHeaderWrapperStyle}>
                  <Text style={bubbleHeaderTextStyle}>$/sqft</Text>
                  <View style={bubbleStyleFor(wallLaborPerSqFt, defaultPricing.wallLaborPerSqFt || 1.5)}>
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
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: Spacing.sm }}>
                <View style={leftAlignedLabelWrapperStyle}>
                  <Text style={{ ...leftAlignedLabelTextStyle, ...mainLabelStyle }}>Ceiling</Text>
                </View>
                <View style={bubbleHeaderWrapperStyle}>
                  <Text style={bubbleHeaderTextStyle}>$/sqft</Text>
                  <View style={bubbleStyleFor(ceilingLaborPerSqFt, defaultPricing.ceilingLaborPerSqFt || 1.75)}>
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

            <View style={{ flexDirection: "row", gap: Spacing.md, marginBottom: Spacing.md }}>
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: Spacing.sm }}>
                <View style={leftAlignedLabelWrapperStyle}>
                  <Text style={{ ...leftAlignedLabelTextStyle, ...mainLabelStyle }}>Door</Text>
                </View>
                <View style={bubbleHeaderWrapperStyle}>
                  <Text style={bubbleHeaderTextStyle}>Each/$</Text>
                  <View style={bubbleStyleFor(doorLabor, defaultPricing.doorLabor || 50)}>
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
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: Spacing.sm }}>
                <View style={leftAlignedLabelWrapperStyle}>
                  <Text style={{ ...leftAlignedLabelTextStyle, ...mainLabelStyle }}>Window</Text>
                </View>
                <View style={bubbleHeaderWrapperStyle}>
                  <Text style={bubbleHeaderTextStyle}>Each/$</Text>
                  <View style={bubbleStyleFor(windowLabor, defaultPricing.windowLabor || 35)}>
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

            <View style={{ flexDirection: "row", gap: Spacing.md, marginBottom: Spacing.md }}>
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: Spacing.sm }}>
                <View style={leftAlignedLabelWrapperStyle}>
                  <Text style={{ ...leftAlignedLabelTextStyle, ...mainLabelStyle }}>Baseboard</Text>
                </View>
                <View style={bubbleHeaderWrapperStyle}>
                  <Text style={bubbleHeaderTextStyle}>$/lf</Text>
                  <View style={bubbleStyleFor(baseboardLaborPerLF, defaultPricing.baseboardLaborPerLF || 1.25)}>
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
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: Spacing.sm }}>
                <View style={leftAlignedLabelWrapperStyle}>
                  <Text style={{ ...leftAlignedLabelTextStyle, ...mainLabelStyle }}>Crowns</Text>
                </View>
                <View style={bubbleHeaderWrapperStyle}>
                  <Text style={bubbleHeaderTextStyle}>$/lf</Text>
                  <View style={bubbleStyleFor(crownMouldingLaborPerLF, defaultPricing.crownMouldingLaborPerLF || 1.5)}>
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

            <View style={{ flexDirection: "row", gap: Spacing.md, marginBottom: Spacing.md }}>
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: Spacing.sm }}>
                <View style={leftAlignedLabelWrapperStyle}>
                  <Text style={{ ...leftAlignedLabelTextStyle, ...mainLabelStyle }}>Closet</Text>
                </View>
                <View style={bubbleHeaderWrapperStyle}>
                  <Text style={bubbleHeaderTextStyle}>Each/$</Text>
                  <View style={bubbleStyleFor(closetLabor, defaultPricing.closetLabor || 75)}>
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
              <View style={{ flex: 1 }} />
            </View>
          </Card>

          {/* Labor Rates - Staircases */}
          <Card style={{ marginBottom: Spacing.md }}>
            <Text style={{ ...Typography.h2, marginBottom: Spacing.md }}>
              Labor Rates - Staircases
            </Text>
            <View style={{ flexDirection: "row", gap: Spacing.md, marginBottom: Spacing.md }}>
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: Spacing.sm }}>
                <View style={leftAlignedLabelWrapperStyle}>
                  <Text style={{ ...leftAlignedLabelTextStyle, ...mainLabelStyle }}>Riser</Text>
                </View>
                <View style={bubbleHeaderWrapperStyle}>
                  <Text style={bubbleHeaderTextStyle}>Each/$</Text>
                  <View style={bubbleStyleFor(riserLabor, defaultPricing.riserLabor || 15)}>
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
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: Spacing.sm }}>
                <View style={leftAlignedLabelWrapperStyle}>
                  <Text style={{ ...leftAlignedLabelTextStyle, ...mainLabelStyle }}>Spindle</Text>
                </View>
                <View style={bubbleHeaderWrapperStyle}>
                  <Text style={bubbleHeaderTextStyle}>Each/$</Text>
                  <View style={bubbleStyleFor(spindleLabor, defaultPricing.spindleLabor || 8)}>
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

            <View style={{ flexDirection: "row", gap: Spacing.md, marginBottom: Spacing.md }}>
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: Spacing.sm }}>
                <View style={leftAlignedLabelWrapperStyle}>
                  <Text style={{ ...leftAlignedLabelTextStyle, ...mainLabelStyle }}>Handrail</Text>
                </View>
                <View style={bubbleHeaderWrapperStyle}>
                  <Text style={bubbleHeaderTextStyle}>$/lf</Text>
                  <View style={bubbleStyleFor(handrailLaborPerLF, defaultPricing.handrailLaborPerLF || 10)}>
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
              <View style={{ flex: 1 }} />
            </View>
          </Card>

          {/* Labor Rates - Fireplaces */}
          <Card style={{ marginBottom: Spacing.md }}>
            <Text style={{ ...Typography.h2, marginBottom: Spacing.md }}>
              Labor Rates - Fireplaces
            </Text>
            <View style={{ flexDirection: "row", gap: Spacing.md, marginBottom: Spacing.md }}>
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: Spacing.sm }}>
                <View style={leftAlignedLabelWrapperStyle}>
                  <Text style={{ ...leftAlignedLabelTextStyle, ...mainLabelStyle }}>Mantel</Text>
                </View>
                <View style={bubbleHeaderWrapperStyle}>
                  <Text style={bubbleHeaderTextStyle}>Each/$</Text>
                  <View style={bubbleStyleFor(mantelLabor, defaultPricing.mantelLabor || 100)}>
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
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: Spacing.sm }}>
                <View style={leftAlignedLabelWrapperStyle}>
                  <Text style={{ ...leftAlignedLabelTextStyle, ...mainLabelStyle }}>Legs</Text>
                </View>
                <View style={bubbleHeaderWrapperStyle}>
                  <Text style={bubbleHeaderTextStyle}>Each/$</Text>
                  <View style={bubbleStyleFor(legsLabor, defaultPricing.legsLabor || 100)}>
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

            <View style={{ flexDirection: "row", gap: Spacing.md, marginBottom: Spacing.md }}>
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: Spacing.sm }}>
                <View style={leftAlignedLabelWrapperStyle}>
                  <Text style={{ ...leftAlignedLabelTextStyle, ...mainLabelStyle }}>2-Coat</Text>
                </View>
                <View style={bubbleHeaderWrapperStyle}>
                  <View style={{ height: Typography.caption.fontSize + Spacing.xs, opacity: 0 }} />
                  <View style={bubbleStyleFor(secondCoatLaborMultiplier, defaultPricing.secondCoatLaborMultiplier || 2.0)}>
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
              </View>
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: Spacing.sm }}>
                <View style={leftAlignedLabelWrapperStyle}>
                  <Text style={{ ...leftAlignedLabelTextStyle, ...mainLabelStyle }}>Accent Wall</Text>
                </View>
                <View style={bubbleHeaderWrapperStyle}>
                  <View style={{ height: Typography.caption.fontSize + Spacing.xs, opacity: 0 }} />
                  <View style={bubbleStyleFor(accentWallLaborMultiplier, defaultPricing.accentWallLaborMultiplier || 1.25)}>
                    <TextInput
                      ref={accentWallMultiplierRef}
                      value={accentWallLaborMultiplier}
                      onChangeText={setAccentWallLaborMultiplier}
                      placeholder="1.25"
                      placeholderTextColor={Colors.mediumGray}
                      keyboardType="numeric"
                      returnKeyType="next"
                      onSubmitEditing={() => closetMultiplierRef.current?.focus()}
                      onFocus={handleFieldFocus}
                      blurOnSubmit={false}
                      inputAccessoryViewID={Platform.OS === "ios" ? `pricingAccentWallMultiplier-${accentWallMultiplierID}` : undefined}
                      style={inputTextStyle}
                    />
                  </View>
                </View>
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: Spacing.md, marginBottom: Spacing.md }}>
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: Spacing.sm }}>
                <View style={leftAlignedLabelWrapperStyle}>
                  <Text style={{ ...leftAlignedLabelTextStyle, ...mainLabelStyle }}>Closet</Text>
                </View>
                <View style={bubbleHeaderWrapperStyle}>
                  <View style={{ height: Typography.caption.fontSize + Spacing.xs, opacity: 0 }} />
                  <View style={bubbleStyleFor(closetLaborMultiplier, defaultPricing.closetLaborMultiplier || 1.0)}>
                    <TextInput
                      ref={closetMultiplierRef}
                      value={closetLaborMultiplier}
                      onChangeText={setClosetLaborMultiplier}
                      placeholder="1.0"
                      placeholderTextColor={Colors.mediumGray}
                      keyboardType="numeric"
                      returnKeyType="next"
                      onSubmitEditing={() => {
                        if (bathroomLaborMode === "tiers") {
                          bathroomTierSmallRef.current?.focus();
                          return;
                        }
                        bathroomMultiplierRef.current?.focus();
                      }}
                      onFocus={handleFieldFocus}
                      blurOnSubmit={false}
                      inputAccessoryViewID={Platform.OS === "ios" ? `pricingClosetMultiplier-${closetMultiplierID}` : undefined}
                      style={inputTextStyle}
                    />
                  </View>
                </View>
              </View>
              <View style={{ flex: 1 }} />
            </View>
          </Card>

          {/* Bathroom Labor */}
          <Card style={{ marginBottom: Spacing.md }}>
            <View style={{ marginBottom: Spacing.md }}>
              <Text style={{ ...Typography.h2 }}>
                Bathroom Labor
              </Text>
            </View>

            <View style={rowStyle}>
              <View style={leftAlignedLabelWrapperStyle}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={rowLabelTextStyle}>Use Multiplier</Text>
                </View>
              </View>
              <View style={modeToggleContainerStyle}>
                <Pressable
                  onPress={() => setBathroomLaborMode("multiplier")}
                  style={[
                    modeToggleButtonStyle,
                    { backgroundColor: bathroomLaborMode === "multiplier" ? Colors.primaryBlueLight : Colors.white },
                  ]}
                >
                <Text style={{ fontSize: Typography.caption.fontSize, color: bathroomLaborMode === "multiplier" ? Colors.primaryBlue : Colors.mediumGray, fontWeight: "600" as const }}>
                  Multiplier
                </Text>
                </Pressable>
                <Pressable
                  onPress={() => setBathroomLaborMode("tiers")}
                  style={[
                    modeToggleButtonStyle,
                    { backgroundColor: bathroomLaborMode === "tiers" ? Colors.primaryBlueLight : Colors.white },
                  ]}
                >
                <Text style={{ fontSize: Typography.caption.fontSize, color: bathroomLaborMode === "tiers" ? Colors.primaryBlue : Colors.mediumGray, fontWeight: "600" as const }}>
                  Prices
                </Text>
                </Pressable>
              </View>
            </View>

            {bathroomLaborMode === "multiplier" && (
              <View>
                <View style={rowStyle}>
                  <View style={rowLabelWithBubbleBaselineStyle}>
                    <View style={rowLabelBaselineStyle}>
                      <Text style={rowLabelTextStyle}>Multiplier</Text>
                      <Pressable
                        onPress={() => openInfoModal("Bathroom Labor Multiplier", "Scales standard wall and ceiling labor for bathrooms.")}
                        hitSlop={8}
                        style={{ marginLeft: Spacing.xs, transform: [{ translateY: -2 }] }}
                      >
                        <Ionicons name="help-circle-outline" size={14} color={Colors.mediumGray} accessibilityLabel="Bathroom labor multiplier help" />
                      </Pressable>
                    </View>
                  </View>
                  <View style={bubbleHeaderWrapperStyle}>
                    <Text style={bubbleHeaderTextStyle}>x</Text>
                    <View style={bubbleStyleFor(bathroomLaborMultiplier, defaultPricing.bathroomLaborMultiplier || 2.5)}>
                      <TextInput
                        ref={bathroomMultiplierRef}
                        value={bathroomLaborMultiplier}
                        onChangeText={setBathroomLaborMultiplier}
                        placeholder="2.5"
                        placeholderTextColor={Colors.mediumGray}
                        keyboardType="numeric"
                        returnKeyType="next"
                        onSubmitEditing={() => bathroomEnclosedToiletRef.current?.focus()}
                        onFocus={handleFieldFocus}
                        blurOnSubmit={false}
                        inputAccessoryViewID={Platform.OS === "ios" ? `pricingBathroomMultiplier-${bathroomMultiplierID}` : undefined}
                        style={inputTextStyle}
                      />
                    </View>
                  </View>
                </View>
              </View>
            )}

            {bathroomLaborMode === "tiers" && (
              <View>
                <View style={rowStyle}>
                  <View style={leftAlignedLabelWrapperStyle}>
                    <Text style={{ ...leftAlignedLabelTextStyle, ...mainLabelStyle }}>Small {"(<30 sq ft)"}</Text>
                  </View>
                  <View style={bubbleHeaderWrapperStyle}>
                    <Text style={bubbleHeaderTextStyle}>Each/$</Text>
                    <View style={bubbleStyleFor(bathroomTierSmallLabor, defaultPricing.bathroomTierSmallLabor || 350)}>
                      <TextInput
                        ref={bathroomTierSmallRef}
                        value={bathroomTierSmallLabor}
                        onChangeText={setBathroomTierSmallLabor}
                        placeholder="350"
                        placeholderTextColor={Colors.mediumGray}
                        keyboardType="numeric"
                        returnKeyType="next"
                        onSubmitEditing={() => bathroomTierMediumRef.current?.focus()}
                        onFocus={handleFieldFocus}
                        blurOnSubmit={false}
                        inputAccessoryViewID={Platform.OS === "ios" ? `pricingBathroomTierSmall-${bathroomTierSmallID}` : undefined}
                        style={inputTextStyle}
                      />
                    </View>
                  </View>
                </View>

                <View style={rowStyle}>
                  <View style={leftAlignedLabelWrapperStyle}>
                    <Text style={{ ...leftAlignedLabelTextStyle, ...mainLabelStyle }}>Medium {"(30-50 sq ft)"}</Text>
                  </View>
                  <View style={bubbleHeaderWrapperStyle}>
                    <Text style={bubbleHeaderTextStyle}>Each/$</Text>
                    <View style={bubbleStyleFor(bathroomTierMediumLabor, defaultPricing.bathroomTierMediumLabor || 400)}>
                      <TextInput
                        ref={bathroomTierMediumRef}
                        value={bathroomTierMediumLabor}
                        onChangeText={setBathroomTierMediumLabor}
                        placeholder="400"
                        placeholderTextColor={Colors.mediumGray}
                        keyboardType="numeric"
                        returnKeyType="next"
                        onSubmitEditing={() => bathroomTierLargeBaseRef.current?.focus()}
                        onFocus={handleFieldFocus}
                        blurOnSubmit={false}
                        inputAccessoryViewID={Platform.OS === "ios" ? `pricingBathroomTierMedium-${bathroomTierMediumID}` : undefined}
                        style={inputTextStyle}
                      />
                    </View>
                  </View>
                </View>

                <View style={rowStyle}>
                  <View style={leftAlignedLabelWrapperStyle}>
                    <Text style={{ ...leftAlignedLabelTextStyle, ...mainLabelStyle }}>Large {"(>50 sq ft)"}</Text>
                  </View>
                  <View style={bubbleHeaderWrapperStyle}>
                    <Text style={bubbleHeaderTextStyle}>Each/$</Text>
                    <View style={bubbleStyleFor(bathroomTierLargeBaseLabor, defaultPricing.bathroomTierLargeBaseLabor || 450)}>
                      <TextInput
                        ref={bathroomTierLargeBaseRef}
                        value={bathroomTierLargeBaseLabor}
                        onChangeText={setBathroomTierLargeBaseLabor}
                        placeholder="450"
                        placeholderTextColor={Colors.mediumGray}
                        keyboardType="numeric"
                        returnKeyType="next"
                        onSubmitEditing={() => bathroomTierLargeExtraRef.current?.focus()}
                        onFocus={handleFieldFocus}
                        blurOnSubmit={false}
                        inputAccessoryViewID={Platform.OS === "ios" ? `pricingBathroomTierLargeBase-${bathroomTierLargeBaseID}` : undefined}
                        style={inputTextStyle}
                      />
                    </View>
                  </View>
                </View>

                <View style={rowStyle}>
                  <View style={leftAlignedLabelWrapperStyle}>
                    <Text style={{ ...leftAlignedLabelTextStyle, ...mainLabelStyle }}>Extra per sq ft</Text>
                  </View>
                  <View style={bubbleHeaderWrapperStyle}>
                    <Text style={bubbleHeaderTextStyle}>$/sqft</Text>
                    <View style={bubbleStyleFor(bathroomTierLargeExtraPerSqFt, defaultPricing.bathroomTierLargeExtraPerSqFt || 5)}>
                      <TextInput
                        ref={bathroomTierLargeExtraRef}
                        value={bathroomTierLargeExtraPerSqFt}
                        onChangeText={setBathroomTierLargeExtraPerSqFt}
                        placeholder="5"
                        placeholderTextColor={Colors.mediumGray}
                        keyboardType="numeric"
                        returnKeyType="next"
                        onSubmitEditing={() => bathroomEnclosedToiletRef.current?.focus()}
                        onFocus={handleFieldFocus}
                        blurOnSubmit={false}
                        inputAccessoryViewID={Platform.OS === "ios" ? `pricingBathroomTierLargeExtra-${bathroomTierLargeExtraID}` : undefined}
                        style={inputTextStyle}
                      />
                    </View>
                  </View>
                </View>
              </View>
            )}

            <View style={rowStyle}>
              <View style={rowLabelWithBubbleBaselineStyle}>
                <View style={rowLabelBaselineStyle}>
                  <Text style={rowLabelTextStyle}>Enclosed Toilet</Text>
                  <Pressable
                    onPress={() => openInfoModal("Enclosed Toilet", "Adds a fixed labor amount when the toilet is enclosed as a separate space.")}
                    hitSlop={8}
                    style={{ marginLeft: Spacing.xs, transform: [{ translateY: -2 }] }}
                  >
                    <Ionicons name="help-circle-outline" size={14} color={Colors.mediumGray} accessibilityLabel="Enclosed toilet help" />
                  </Pressable>
                </View>
              </View>
              <View style={bubbleHeaderWrapperStyle}>
                <Text style={bubbleHeaderTextStyle}>Each/$</Text>
                <View style={bubbleStyleFor(bathroomEnclosedToiletAddOn, defaultPricing.bathroomEnclosedToiletAddOn || 50)}>
                  <TextInput
                    ref={bathroomEnclosedToiletRef}
                    value={bathroomEnclosedToiletAddOn}
                    onChangeText={setBathroomEnclosedToiletAddOn}
                    placeholder="50"
                    placeholderTextColor={Colors.mediumGray}
                    keyboardType="numeric"
                    returnKeyType="next"
                    onSubmitEditing={() => vanityDoorLaborRef.current?.focus()}
                    onFocus={handleFieldFocus}
                    blurOnSubmit={false}
                    inputAccessoryViewID={Platform.OS === "ios" ? `pricingBathroomEnclosedToilet-${bathroomEnclosedToiletID}` : undefined}
                    style={inputTextStyle}
                  />
                </View>
              </View>
            </View>

            <View style={rowStyle}>
              <View style={inlineFieldStyle}>
                <View style={leftAlignedLabelWrapperStyle}>
                  <Text style={{ ...leftAlignedLabelTextStyle, ...mainLabelStyle }}>Vanity Door</Text>
                </View>
                <View style={bubbleHeaderWrapperStyle}>
                  <Text style={bubbleHeaderTextStyle}>Each/$</Text>
                  <View style={bubbleStyleFor(vanityDoorLabor, defaultPricing.vanityDoorLabor || 150)}>
                    <TextInput
                      ref={vanityDoorLaborRef}
                      value={vanityDoorLabor}
                      onChangeText={setVanityDoorLabor}
                      placeholder="150"
                      placeholderTextColor={Colors.mediumGray}
                      keyboardType="numeric"
                      returnKeyType="next"
                      onSubmitEditing={() => cabinetDoorLaborRef.current?.focus()}
                      onFocus={handleFieldFocus}
                      blurOnSubmit={false}
                      inputAccessoryViewID={Platform.OS === "ios" ? `pricingVanityDoorLabor-${vanityDoorLaborID}` : undefined}
                      style={inputTextStyle}
                    />
                  </View>
                </View>
              </View>
            </View>
          </Card>

          {/* Cabinets Labor */}
          <Card style={{ marginBottom: Spacing.md }}>
            <Text style={{ ...Typography.h2, marginBottom: Spacing.md }}>
              Cabinets Labor
            </Text>

            <View style={rowStyle}>
              <View style={inlineFieldStyle}>
                <View style={leftAlignedLabelWrapperStyle}>
                  <Text style={{ ...leftAlignedLabelTextStyle, ...mainLabelStyle }}>Cabinet Door & Front</Text>
                </View>
                <View style={bubbleHeaderWrapperStyle}>
                  <Text style={bubbleHeaderTextStyle}>Each/$</Text>
                  <View style={bubbleStyleFor(cabinetDoorLabor, defaultPricing.cabinetDoorLabor || 150)}>
                    <TextInput
                      ref={cabinetDoorLaborRef}
                      value={cabinetDoorLabor}
                      onChangeText={setCabinetDoorLabor}
                      placeholder="150"
                      placeholderTextColor={Colors.mediumGray}
                      keyboardType="numeric"
                      returnKeyType="next"
                      onSubmitEditing={() => cabinetDrawerLaborRef.current?.focus()}
                      onFocus={handleFieldFocus}
                      blurOnSubmit={false}
                      inputAccessoryViewID={Platform.OS === "ios" ? `pricingCabinetDoorLabor-${cabinetDoorLaborID}` : undefined}
                      style={inputTextStyle}
                    />
                  </View>
                </View>
              </View>
            </View>

            <View style={rowStyle}>
              <View style={inlineFieldStyle}>
                <View style={leftAlignedLabelWrapperStyle}>
                  <Text style={{ ...leftAlignedLabelTextStyle, ...mainLabelStyle }}>Drawer</Text>
                </View>
                <View style={bubbleHeaderWrapperStyle}>
                  <Text style={bubbleHeaderTextStyle}>Each/$</Text>
                  <View style={bubbleStyleFor(cabinetDrawerLabor, defaultPricing.cabinetDrawerLabor || 30)}>
                    <TextInput
                      ref={cabinetDrawerLaborRef}
                      value={cabinetDrawerLabor}
                      onChangeText={setCabinetDrawerLabor}
                      placeholder="30"
                      placeholderTextColor={Colors.mediumGray}
                      keyboardType="numeric"
                      returnKeyType="next"
                      onSubmitEditing={() => wallCabinetLaborRef.current?.focus()}
                      onFocus={handleFieldFocus}
                      blurOnSubmit={false}
                      inputAccessoryViewID={Platform.OS === "ios" ? `pricingCabinetDrawerLabor-${cabinetDrawerLaborID}` : undefined}
                      style={inputTextStyle}
                    />
                  </View>
                </View>
              </View>
            </View>

            <View style={rowStyle}>
              <View style={inlineFieldStyle}>
                <View style={leftAlignedLabelWrapperStyle}>
                  <Text style={{ ...leftAlignedLabelTextStyle, ...mainLabelStyle }}>42" Wall Cabinet</Text>
                </View>
                <View style={bubbleHeaderWrapperStyle}>
                  <Text style={bubbleHeaderTextStyle}>Each/$</Text>
                  <View style={bubbleStyleFor(wallCabinetLabor, defaultPricing.wallCabinetLabor || 165)}>
                    <TextInput
                      ref={wallCabinetLaborRef}
                      value={wallCabinetLabor}
                      onChangeText={setWallCabinetLabor}
                      placeholder="165"
                      placeholderTextColor={Colors.mediumGray}
                      keyboardType="numeric"
                      returnKeyType="next"
                      onSubmitEditing={() => builtInShelfLaborRef.current?.focus()}
                      onFocus={handleFieldFocus}
                      blurOnSubmit={false}
                      inputAccessoryViewID={Platform.OS === "ios" ? `pricingWallCabinetLabor-${wallCabinetLaborID}` : undefined}
                      style={inputTextStyle}
                    />
                  </View>
                </View>
              </View>
            </View>
          </Card>

          {/* Built-In Labor */}
          <Card style={{ marginBottom: Spacing.md }}>
            <Text style={{ ...Typography.h2, marginBottom: Spacing.md }}>
              Built-In Labor
            </Text>

            <View style={rowStyle}>
              <View style={inlineFieldStyle}>
                <View style={leftAlignedLabelWrapperStyle}>
                  <Text style={{ ...leftAlignedLabelTextStyle, ...mainLabelStyle }}>Shelf</Text>
                </View>
                <View style={bubbleHeaderWrapperStyle}>
                  <Text style={bubbleHeaderTextStyle}>Each/$</Text>
                  <View style={bubbleStyleFor(builtInShelfLabor, defaultPricing.builtInShelfLabor || 25)}>
                    <TextInput
                      ref={builtInShelfLaborRef}
                      value={builtInShelfLabor}
                      onChangeText={setBuiltInShelfLabor}
                      placeholder="25"
                      placeholderTextColor={Colors.mediumGray}
                      keyboardType="numeric"
                      returnKeyType="next"
                      onSubmitEditing={() => furnitureMovingFeeRef.current?.focus()}
                      onFocus={handleFieldFocus}
                      blurOnSubmit={false}
                      inputAccessoryViewID={Platform.OS === "ios" ? `pricingBuiltInShelfLabor-${builtInShelfLaborID}` : undefined}
                      style={inputTextStyle}
                    />
                  </View>
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
                <View style={leftAlignedLabelWrapperStyle}>
                  <Text style={{ ...leftAlignedLabelTextStyle, ...mainLabelStyle }}>Furniture Moving</Text>
                </View>
                <View style={bubbleHeaderWrapperStyle}>
                  <Text style={bubbleHeaderTextStyle}>Each/$</Text>
                  <View style={bubbleStyleFor(furnitureMovingFee, defaultPricing.furnitureMovingFee || 100)}>
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
                <View style={leftAlignedLabelWrapperStyle}>
                  <Text style={{ ...leftAlignedLabelTextStyle, ...mainLabelStyle }}>Nails/Screws Removal</Text>
                </View>
                <View style={bubbleHeaderWrapperStyle}>
                  <Text style={bubbleHeaderTextStyle}>Each/$</Text>
                  <View style={bubbleStyleFor(nailsRemovalFee, defaultPricing.nailsRemovalFee || 75)}>
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

            <View style={materialHeaderRowStyle}>
              <View style={{ flex: 1 }} />
              <View style={columnLabelWrapperStyle}>
                <Text style={columnLabelStyle}>$/1gal</Text>
              </View>
              <View style={columnLabelWrapperStyle}>
                <Text style={columnLabelStyle}>$/5gal</Text>
              </View>
            </View>

            <View style={materialRowStyle}>
              <View style={leftAlignedLabelWrapperStyle}>
                <Text style={{ ...leftAlignedLabelTextStyle, ...materialLabelStyle }}>Wall Paint</Text>
              </View>
              <View style={bubbleStyleFor(wallPaintPerGallon, defaultPricing.wallPaintPerGallon || 45)}>
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
              <View style={bubbleStyleFor(wallPaintPer5Gallon, defaultPricing.wallPaintPer5Gallon || 200)}>
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
              <View style={leftAlignedLabelWrapperStyle}>
                <Text style={{ ...leftAlignedLabelTextStyle, ...materialLabelStyle }}>Ceiling Paint</Text>
              </View>
              <View style={bubbleStyleFor(ceilingPaintPerGallon, defaultPricing.ceilingPaintPerGallon || 40)}>
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
              <View style={bubbleStyleFor(ceilingPaintPer5Gallon, defaultPricing.ceilingPaintPer5Gallon || 175)}>
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

            <View style={materialRowStyle}>
              <View style={leftAlignedLabelWrapperStyle}>
                <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                  <Text
                    style={{
                      ...leftAlignedLabelTextStyle,
                      ...materialLabelStyle,
                      flex: 0,
                      width: "auto",
                    }}
                  >
                    Trim Paint
                  </Text>
                  <Pressable
                    onPress={() => openInfoModal("Trim Paint", "Explain what this setting controls")}
                    hitSlop={8}
                    style={{ marginLeft: Spacing.xs, marginTop: 2 }}
                  >
                    <Ionicons name="help-circle-outline" size={14} color={Colors.mediumGray} accessibilityLabel="Trim Paint help" />
                  </Pressable>
                </View>
              </View>
              <View style={bubbleStyleFor(trimPaintPerGallon, defaultPricing.trimPaintPerGallon || 50)}>
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
              <View style={bubbleStyleFor(trimPaintPer5Gallon, defaultPricing.trimPaintPer5Gallon || 225)}>
                <TextInput
                  ref={trimPaint5GallonRef}
                  value={trimPaintPer5Gallon}
                  onChangeText={setTrimPaintPer5Gallon}
                  placeholder="225"
                  placeholderTextColor={Colors.mediumGray}
                  keyboardType="numeric"
                  returnKeyType="next"
                  onSubmitEditing={() => cabinetPaintGallonRef.current?.focus()}
                  onFocus={handleFieldFocus}
                  blurOnSubmit={false}
                  inputAccessoryViewID={Platform.OS === "ios" ? `pricingTrimPaint5Gallon-${trimPaint5GallonID}` : undefined}
                  style={inputTextStyle}
                />
              </View>
            </View>

            <View style={materialRowStyle}>
              <View style={leftAlignedLabelWrapperStyle}>
                <Text style={{ ...leftAlignedLabelTextStyle, ...materialLabelStyle }}>Cabinet Paint</Text>
              </View>
              <View style={bubbleStyleFor(cabinetPaintPerGallon, defaultPricing.cabinetPaintPerGallon || 60)}>
                <TextInput
                  ref={cabinetPaintGallonRef}
                  value={cabinetPaintPerGallon}
                  onChangeText={setCabinetPaintPerGallon}
                  placeholder="60"
                  placeholderTextColor={Colors.mediumGray}
                  keyboardType="numeric"
                  returnKeyType="next"
                  onSubmitEditing={() => cabinetPaint5GallonRef.current?.focus()}
                  onFocus={handleFieldFocus}
                  blurOnSubmit={false}
                  inputAccessoryViewID={Platform.OS === "ios" ? `pricingCabinetPaintGallon-${cabinetPaintGallonID}` : undefined}
                  style={inputTextStyle}
                />
              </View>
              <View style={bubbleStyleFor(cabinetPaintPer5Gallon, defaultPricing.cabinetPaintPer5Gallon || 450)}>
                <TextInput
                  ref={cabinetPaint5GallonRef}
                  value={cabinetPaintPer5Gallon}
                  onChangeText={setCabinetPaintPer5Gallon}
                  placeholder="450"
                  placeholderTextColor={Colors.mediumGray}
                  keyboardType="numeric"
                  returnKeyType="next"
                  onSubmitEditing={() => primerGallonRef.current?.focus()}
                  onFocus={handleFieldFocus}
                  blurOnSubmit={false}
                  inputAccessoryViewID={Platform.OS === "ios" ? `pricingCabinetPaint5Gallon-${cabinetPaint5GallonID}` : undefined}
                  style={inputTextStyle}
                />
              </View>
            </View>

            <View style={materialRowStyle}>
              <View style={leftAlignedLabelWrapperStyle}>
                <Text style={{ ...leftAlignedLabelTextStyle, ...materialLabelStyle }}>Primer</Text>
              </View>
              <View style={bubbleStyleFor(primerPerGallon, defaultPricing.primerPerGallon || 35)}>
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
              <View style={bubbleStyleFor(primerPer5Gallon, defaultPricing.primerPer5Gallon || 150)}>
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
      <SavePromptModal
        visible={showSavePrompt}
        onSave={handleSaveAndLeave}
        onDiscard={handleDiscardAndLeave}
        onCancel={handleCancelExit}
        setDiscardButtonWidth={setDiscardWidth}
      />

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
            <Pressable onPress={() => closetMultiplierRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`pricingBathroomMultiplier-${bathroomMultiplierID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => closetMultiplierRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => bathroomEnclosedToiletRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`pricingBathroomTierSmall-${bathroomTierSmallID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => closetMultiplierRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => bathroomTierMediumRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`pricingBathroomTierMedium-${bathroomTierMediumID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => bathroomTierSmallRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => bathroomTierLargeBaseRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`pricingBathroomTierLargeBase-${bathroomTierLargeBaseID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => bathroomTierMediumRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => bathroomTierLargeExtraRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`pricingBathroomTierLargeExtra-${bathroomTierLargeExtraID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => bathroomTierLargeBaseRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => bathroomEnclosedToiletRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`pricingBathroomEnclosedToilet-${bathroomEnclosedToiletID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable
              onPress={() => {
                if (bathroomLaborMode === "tiers") {
                  bathroomTierLargeExtraRef.current?.focus();
                  return;
                }
                bathroomMultiplierRef.current?.focus();
              }}
              style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}
            >
              <Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text>
            </Pressable>
            <Pressable onPress={() => cabinetDoorLaborRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`pricingCabinetDoorLabor-${cabinetDoorLaborID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => vanityDoorLaborRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => cabinetDrawerLaborRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`pricingCabinetDrawerLabor-${cabinetDrawerLaborID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => cabinetDoorLaborRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => wallCabinetLaborRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`pricingWallCabinetLabor-${wallCabinetLaborID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => cabinetDrawerLaborRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => builtInShelfLaborRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`pricingBuiltInShelfLabor-${builtInShelfLaborID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => wallCabinetLaborRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => furnitureMovingFeeRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`pricingVanityDoorLabor-${vanityDoorLaborID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => bathroomEnclosedToiletRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => cabinetDoorLaborRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`pricingClosetMultiplier-${closetMultiplierID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => accentWallMultiplierRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable
              onPress={() => {
                if (bathroomLaborMode === "tiers") {
                  bathroomTierSmallRef.current?.focus();
                  return;
                }
                bathroomMultiplierRef.current?.focus();
              }}
              style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}
            >
              <Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text>
            </Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`pricingFurnitureMovingFee-${furnitureMovingFeeID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => builtInShelfLaborRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
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
            <Pressable onPress={() => cabinetPaintGallonRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`pricingCabinetPaintGallon-${cabinetPaintGallonID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => trimPaint5GallonRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => cabinetPaint5GallonRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`pricingCabinetPaint5Gallon-${cabinetPaint5GallonID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => cabinetPaintGallonRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => primerGallonRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
          </View>
        </InputAccessoryView>
        <InputAccessoryView nativeID={`pricingPrimerGallon-${primerGallonID}`}>
          <View style={{ backgroundColor: "#f1f1f1", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable onPress={() => cabinetPaint5GallonRef.current?.focus()} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.body.fontSize, color: "#007AFF", fontWeight: "400" }}>Previous</Text></Pressable>
            <Pressable onPress={() => primer5GallonRef.current?.focus()} style={{ backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.default }}><Text style={{ fontSize: Typography.body.fontSize, color: Colors.white, fontWeight: "600" }}>Next</Text></Pressable>
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
