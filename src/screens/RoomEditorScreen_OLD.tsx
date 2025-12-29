import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { usePreventRemove } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/RootNavigator";
import { useProjectStore } from "../state/projectStore";
import { usePricingStore } from "../state/pricingStore";
import { useCalculationSettings } from "../state/calculationStore";
import { calculateRoomMetrics, formatCurrency } from "../utils/calculations";
import { Ionicons } from "@expo/vector-icons";
import { bluetoothService } from "../services/bluetoothService";
import { Device } from "react-native-ble-plx";

type Props = NativeStackScreenProps<RootStackParamList, "RoomEditor">;

export default function RoomEditorScreen({ route, navigation }: Props) {
  const { projectId, roomId } = route.params;

  const project = useProjectStore((s) =>
    s.projects.find((p) => p.id === projectId)
  );
  const room = project?.rooms.find((r) => r.id === roomId);
  const updateRoom = useProjectStore((s) => s.updateRoom);
  const pricing = usePricingStore();
  const calcSettings = useCalculationSettings((s) => s.settings);

  const [name, setName] = useState(room?.name || "");
  const [length, setLength] = useState(room?.length && room.length > 0 ? room.length.toString() : "");
  const [width, setWidth] = useState(room?.width && room.width > 0 ? room.width.toString() : "");
  const floor = room?.floor || 1; // Floor is fixed - determined when room was created
  const [manualArea, setManualArea] = useState(
    room?.manualArea && room.manualArea > 0 ? room.manualArea.toString() : ""
  );
  const [ceilingType, setCeilingType] = useState(room?.ceilingType || "flat");
  const [windowCount, setWindowCount] = useState(
    room?.windowCount && room.windowCount > 0 ? room.windowCount.toString() : ""
  );
  const [doorCount, setDoorCount] = useState(
    room?.doorCount && room.doorCount > 0 ? room.doorCount.toString() : ""
  );
  const [hasCloset, setHasCloset] = useState(room?.hasCloset || false);
  const [singleDoorClosets, setSingleDoorClosets] = useState(
    room?.singleDoorClosets && room.singleDoorClosets > 0 ? room.singleDoorClosets.toString() : ""
  );
  const [doubleDoorClosets, setDoubleDoorClosets] = useState(
    room?.doubleDoorClosets && room.doubleDoorClosets > 0 ? room.doubleDoorClosets.toString() : ""
  );
  const [includeClosetInteriorInQuote, setIncludeClosetInteriorInQuote] = useState(
    room?.includeClosetInteriorInQuote ?? project?.projectIncludeClosetInteriorInQuote ?? true
  );
  const [paintWindows, setPaintWindows] = useState(room?.paintWindows ?? false);
  const [paintDoors, setPaintDoors] = useState(room?.paintDoors ?? false);
  const [paintJambs, setPaintJambs] = useState(room?.paintJambs ?? false);
  const [paintBaseboard, setPaintBaseboard] = useState(
    room?.paintBaseboard ?? project?.paintBaseboard ?? true
  ); // Use room setting, then project default, then true
  const [hasCrownMoulding, setHasCrownMoulding] = useState(room?.hasCrownMoulding ?? false);
  const [cathedralPeakHeight, setCathedralPeakHeight] = useState(
    room?.cathedralPeakHeight && room.cathedralPeakHeight > 0 ? room.cathedralPeakHeight.toString() : ""
  );

  // Include/exclude toggles for finer control
  const [includeWindows, setIncludeWindows] = useState(room?.includeWindows ?? true);
  const [includeDoors, setIncludeDoors] = useState(room?.includeDoors ?? true);
  const [includeTrim, setIncludeTrim] = useState(room?.includeTrim ?? true);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [isSaved, setIsSaved] = useState(false); // Track if item was explicitly saved

  // Cleanup on unmount - delete if never saved and no name entered
  useEffect(() => {
    return () => {
      if (!isSaved && room) {
        const trimmedName = room.name?.trim() || "";
        if (!trimmedName) {
          const deleteRoomFn = useProjectStore.getState().deleteRoom;
          deleteRoomFn(projectId, roomId!);
        }
      }
    };
  }, [isSaved, projectId, roomId, room]);

  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [measuring, setMeasuring] = useState(false);
  const [measurementTarget, setMeasurementTarget] = useState<
    "length" | "width" | null
  >(null);

  useEffect(() => {
    return () => {
      if (connectedDevice) {
        bluetoothService.disconnect();
      }
    };
  }, [connectedDevice]);

  // Track unsaved changes
  useEffect(() => {
    if (!room) return;

    const hasChanges =
      name !== room.name ||
      length !== (room.length && room.length > 0 ? room.length.toString() : "") ||
      width !== (room.width && room.width > 0 ? room.width.toString() : "") ||
      manualArea !== (room.manualArea && room.manualArea > 0 ? room.manualArea.toString() : "") ||
      ceilingType !== room.ceilingType ||
      cathedralPeakHeight !== (room.cathedralPeakHeight && room.cathedralPeakHeight > 0 ? room.cathedralPeakHeight.toString() : "") ||
      windowCount !== (room.windowCount && room.windowCount > 0 ? room.windowCount.toString() : "") ||
      doorCount !== (room.doorCount && room.doorCount > 0 ? room.doorCount.toString() : "") ||
      hasCloset !== room.hasCloset ||
      singleDoorClosets !== (room.singleDoorClosets && room.singleDoorClosets > 0 ? room.singleDoorClosets.toString() : "") ||
      doubleDoorClosets !== (room.doubleDoorClosets && room.doubleDoorClosets > 0 ? room.doubleDoorClosets.toString() : "") ||
      paintWindows !== (room.paintWindows ?? false) ||
      paintDoors !== (room.paintDoors ?? false) ||
      paintJambs !== (room.paintJambs ?? false) ||
      paintBaseboard !== (room.paintBaseboard ?? project?.paintBaseboard ?? true) ||
      hasCrownMoulding !== (room.hasCrownMoulding ?? false) ||
      includeWindows !== (room.includeWindows ?? true) ||
      includeDoors !== (room.includeDoors ?? true) ||
      includeTrim !== (room.includeTrim ?? true) ||
      includeClosetInteriorInQuote !== (room.includeClosetInteriorInQuote ?? project?.projectIncludeClosetInteriorInQuote ?? true);

    setHasUnsavedChanges(hasChanges);
  }, [
    room,
    project,
    name,
    length,
    width,
    manualArea,
    ceilingType,
    cathedralPeakHeight,
    windowCount,
    doorCount,
    hasCloset,
    singleDoorClosets,
    doubleDoorClosets,
    paintWindows,
    paintDoors,
    paintJambs,
    paintBaseboard,
    hasCrownMoulding,
    includeWindows,
    includeDoors,
    includeTrim,
    includeClosetInteriorInQuote,
  ]);

  // Prevent navigation when there are unsaved changes
  usePreventRemove(hasUnsavedChanges, ({ data }) => {
    setShowSavePrompt(true);
  });

  const handleSave = () => {
    if (!room) return;

    // Validate room name
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert("Room Name Required", "Please enter a name for this room before saving.");
      return;
    }

    // Disable unsaved changes tracking FIRST to prevent modal from showing
    setHasUnsavedChanges(false);
    setIsSaved(true); // Mark as saved

    // Get height from project based on selected floor
    let height = 8;
    if (project?.floorHeights && project.floorHeights[floor - 1]) {
      height = project.floorHeights[floor - 1];
    } else if (floor === 2 && project?.secondFloorHeight) {
      height = project.secondFloorHeight;
    } else if (project?.firstFloorHeight) {
      height = project.firstFloorHeight;
    }

    // Create updated room object for calculation
    const updatedRoom = {
      ...room,
      name: trimmedName,
      length: parseFloat(length) || 0,
      width: parseFloat(width) || 0,
      height,
      floor,
      manualArea: parseFloat(manualArea) || undefined,
      ceilingType,
      cathedralPeakHeight: parseFloat(cathedralPeakHeight) || undefined,
      windowCount: parseInt(windowCount) || 0,
      doorCount: parseInt(doorCount) || 0,
      hasCloset,
      singleDoorClosets: parseInt(singleDoorClosets) || 0,
      doubleDoorClosets: parseInt(doubleDoorClosets) || 0,
      paintWindows,
      paintDoors,
      paintJambs,
      paintBaseboard,
      hasCrownMoulding,
      includeWindows,
      includeDoors,
      includeTrim,
      includeClosetInteriorInQuote,
    };

    // Always calculate and save gallon usage (even if no other changes)
    const roomCalc = calculateRoomMetrics(updatedRoom, pricing, project?.projectCoats);

    console.log("[RoomEditor] Saving room with gallon usage:", {
      wall: roomCalc.totalWallGallons,
      ceiling: roomCalc.totalCeilingGallons,
      trim: roomCalc.totalTrimGallons,
      door: roomCalc.totalDoorGallons,
    });

    updateRoom(projectId, roomId!, {
      ...updatedRoom,
      gallonUsage: {
        wall: roomCalc.totalWallGallons,
        ceiling: roomCalc.totalCeilingGallons,
        trim: roomCalc.totalTrimGallons,
        door: roomCalc.totalDoorGallons,
      },
    });

    // Use a small timeout to ensure state update completes before navigation
    setTimeout(() => {
      navigation.goBack();
    }, 10);
  };

  const handleDiscardAndLeave = () => {
    // If the room has never been saved (no name), delete it
    const trimmedName = name.trim();
    if (!trimmedName && room) {
      const deleteRoomFn = useProjectStore.getState().deleteRoom;
      deleteRoomFn(projectId, roomId!);
    }

    setIsSaved(true); // Prevent cleanup from running
    setHasUnsavedChanges(false);
    setShowSavePrompt(false);
    setTimeout(() => {
      navigation.goBack();
    }, 50);
  };

  const handleSaveAndLeave = () => {
    setShowSavePrompt(false);
    handleSave();
  };

  const handleCancelExit = () => {
    setShowSavePrompt(false);
  };

  const handleScanDevices = async () => {
    setIsScanning(true);
    setDevices([]);
    try {
      const foundDevices: Device[] = [];
      await bluetoothService.scanForDevices((device) => {
        if (!foundDevices.find((d) => d.id === device.id)) {
          foundDevices.push(device);
          setDevices([...foundDevices]);
        }
      });
    } catch (error: any) {
      const errorMessage = error.message || "Unable to scan for Bluetooth devices";
      Alert.alert("Bluetooth Not Available", errorMessage);
    } finally {
      setIsScanning(false);
    }
  };

  const handleConnectDevice = async (device: Device) => {
    try {
      const connected = await bluetoothService.connectToDevice(device.id);
      if (connected) {
        setConnectedDevice(device);
        Alert.alert("Connected", `Connected to ${device.name}`);
      } else {
        Alert.alert("Connection Failed", "Could not connect to device");
      }
    } catch (error: any) {
      Alert.alert("Connection Error", error.message);
    }
  };

  const handleCaptureMeasurement = async (
    target: "length" | "width"
  ) => {
    if (!connectedDevice) {
      Alert.alert(
        "No Device",
        "Please connect to a Bluetooth laser device first",
        [
          {
            text: "Scan Devices",
            onPress: handleScanDevices,
          },
          { text: "Cancel", style: "cancel" },
        ]
      );
      return;
    }

    setMeasuring(true);
    setMeasurementTarget(target);

    try {
      const measurement = await bluetoothService.getMeasurement();
      if (measurement !== null) {
        if (target === "length") setLength(measurement.toFixed(2));
        if (target === "width") setWidth(measurement.toFixed(2));
        // Height is now managed at project level, not room level
      } else {
        Alert.alert("Measurement Failed", "Could not get measurement");
      }
    } catch (error: any) {
      Alert.alert("Measurement Error", error.message);
    } finally {
      setMeasuring(false);
      setMeasurementTarget(null);
    }
  };

  // Get height from project based on selected floor
  let currentHeight = 8;
  if (project?.floorHeights && project.floorHeights[floor - 1]) {
    currentHeight = project.floorHeights[floor - 1];
  } else if (floor === 2 && project?.secondFloorHeight) {
    currentHeight = project.secondFloorHeight;
  } else if (project?.firstFloorHeight) {
    currentHeight = project.firstFloorHeight;
  }

  // Backward compatibility: calculate effective floor count
  const effectiveFloorCount = project?.floorCount || (project?.hasTwoFloors ? 2 : 1);

  const calculations = room
    ? calculateRoomMetrics(
        {
          ...room,
          name: name.trim() || "Unnamed Room",
          length: parseFloat(length) || 0,
          width: parseFloat(width) || 0,
          height: currentHeight,
          floor,
          manualArea: parseFloat(manualArea) || undefined,
          ceilingType,
          cathedralPeakHeight: parseFloat(cathedralPeakHeight) || undefined,
          windowCount: parseInt(windowCount) || 0,
          doorCount: parseInt(doorCount) || 0,
          hasCloset,
          singleDoorClosets: parseInt(singleDoorClosets) || 0,
          doubleDoorClosets: parseInt(doubleDoorClosets) || 0,
          paintWindows,
          paintDoors,
          paintJambs,
          paintBaseboard,
          hasCrownMoulding,
        },
        pricing,
        project?.projectCoats
      )
    : null;

  if (!room) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-2xl text-gray-600">Room not found</Text>
      </View>
    );
  }

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
        {/* Page Name Indicator */}
        <View className="bg-gray-100 px-6 py-2">
          <Text className="text-xl font-bold" style={{ color: '#DC2626' }}>
            PAGE: RoomEditorScreen
          </Text>
        </View>

        <View className="p-6">
          {/* Room Name */}
          <View className="mb-4">
            <Text className="text-2xl font-medium text-gray-700 mb-2">
              Room Name
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              className="bg-white border border-gray-300 rounded-xl px-4 py-4 text-xl"
              returnKeyType="done"
              onSubmitEditing={() => {}}
            />
          </View>

          {/* Bluetooth Connection */}
          <View className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-2xl font-semibold text-blue-900">
                Bluetooth Laser (Optional)
              </Text>
              {connectedDevice ? (
                <View className="bg-green-500 rounded-full px-3 py-1">
                  <Text className="text-xl font-medium text-white">
                    Connected
                  </Text>
                </View>
              ) : (
                <Pressable
                  onPress={handleScanDevices}
                  className="bg-blue-600 rounded-lg px-3 py-1"
                  disabled={isScanning}
                >
                  <Text className="text-xl font-medium text-white">
                    {isScanning ? "Scanning..." : "Scan"}
                  </Text>
                </Pressable>
              )}
            </View>
            {connectedDevice && (
              <Text className="text-xl text-blue-700">
                {connectedDevice.name}
              </Text>
            )}
            {devices.length > 0 && !connectedDevice && (
              <View className="mt-2">
                {devices.map((device) => (
                  <Pressable
                    key={device.id}
                    onPress={() => handleConnectDevice(device)}
                    className="bg-white rounded-lg p-2 mb-2"
                  >
                    <Text className="text-2xl text-gray-900">{device.name}</Text>
                  </Pressable>
                ))}
              </View>
            )}
            <Text className="text-2xl text-blue-700 mt-2 font-medium">
              Connect a Bosch laser meter or enter measurements manually
            </Text>
          </View>

          {/* Measurements */}
          <View className="mb-4">
            <Text className="text-2xl font-medium text-gray-700 mb-2">
              Length (ft)
            </Text>
            <View className="flex-row gap-2">
              <TextInput
                value={length}
                onChangeText={setLength}
                keyboardType="decimal-pad"
                className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-4 text-xl"
                returnKeyType="done"
                onSubmitEditing={() => {}}
              />
              <Pressable
                onPress={() => handleCaptureMeasurement("length")}
                className="bg-blue-600 rounded-xl px-4 py-3 items-center justify-center active:bg-blue-700"
                disabled={measuring}
              >
                {measuring && measurementTarget === "length" ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Ionicons name="radio-outline" size={20} color="#fff" />
                )}
              </Pressable>
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-2xl font-medium text-gray-700 mb-2">
              Width (ft)
            </Text>
            <View className="flex-row gap-2">
              <TextInput
                value={width}
                onChangeText={setWidth}
                keyboardType="decimal-pad"
                className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-4 text-xl"
                returnKeyType="done"
                onSubmitEditing={() => {}}
              />
              <Pressable
                onPress={() => handleCaptureMeasurement("width")}
                className="bg-blue-600 rounded-xl px-4 py-3 items-center justify-center active:bg-blue-700"
                disabled={measuring}
              >
                {measuring && measurementTarget === "width" ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Ionicons name="radio-outline" size={20} color="#fff" />
                )}
              </Pressable>
            </View>
          </View>

          {/* Manual Area Input */}
          <View className="mb-4">
            <Text className="text-2xl font-medium text-gray-700 mb-2">
              Manual Area (sq ft) - Optional
            </Text>
            <TextInput
              value={manualArea}
              onChangeText={setManualArea}
              keyboardType="decimal-pad"
              className="bg-white border border-gray-300 rounded-xl px-4 py-4 text-xl"
              returnKeyType="done"
              onSubmitEditing={() => {}}
            />
            <Text className="text-xl text-gray-500 mt-1">
              If entered, this will override Length × Width for ceiling area
            </Text>
          </View>

          {/* Ceiling Type */}
          <View className="mb-4">
            <Text className="text-2xl font-medium text-gray-700 mb-2">
              Ceiling Type
            </Text>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setCeilingType("flat")}
                className={`flex-1 rounded-xl py-3 items-center ${
                  ceilingType === "flat"
                    ? "bg-blue-600"
                    : "bg-white border border-gray-300"
                }`}
              >
                <Text
                  className={`font-semibold ${
                    ceilingType === "flat" ? "text-white" : "text-gray-700"
                  }`}
                >
                  Flat
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setCeilingType("cathedral")}
                className={`flex-1 rounded-xl py-3 items-center ${
                  ceilingType === "cathedral"
                    ? "bg-blue-600"
                    : "bg-white border border-gray-300"
                }`}
              >
                <Text
                  className={`font-semibold ${
                    ceilingType === "cathedral" ? "text-white" : "text-gray-700"
                  }`}
                >
                  Cathedral
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Cathedral Peak Height - Only show for cathedral ceilings */}
          {ceilingType === "cathedral" && (
            <View className="mb-4">
              <Text className="text-2xl font-medium text-gray-700 mb-2">
                Peak Height (ft)
              </Text>
              <TextInput
                value={cathedralPeakHeight}
                onChangeText={setCathedralPeakHeight}
                keyboardType="decimal-pad"
                className="bg-white border border-gray-300 rounded-xl px-4 py-4 text-xl"
                returnKeyType="done"
                onSubmitEditing={() => {}}
              />
              <Text className="text-xl text-gray-500 mt-1">
                Height at the highest point of the cathedral ceiling
              </Text>
            </View>
          )}

          {/* Paint Baseboard Toggle */}
          <Pressable
            onPress={() => setPaintBaseboard(!paintBaseboard)}
            className="flex-row items-center justify-between bg-white border border-gray-300 rounded-xl px-4 py-3 mb-4"
          >
            <Text className="text-xl text-gray-700">Paint Baseboard</Text>
            <View
              className={`w-12 h-7 rounded-full ${
                paintBaseboard ? "bg-blue-600" : "bg-gray-300"
              }`}
            >
              <View
                className={`w-5 h-5 rounded-full bg-white mt-1 ${
                  paintBaseboard ? "ml-6" : "ml-1"
                }`}
              />
            </View>
          </Pressable>

          {/* Crown Moulding Toggle */}
          <Pressable
            onPress={() => setHasCrownMoulding(!hasCrownMoulding)}
            className="flex-row items-center justify-between bg-white border border-gray-300 rounded-xl px-4 py-3 mb-4"
          >
            <Text className="text-xl text-gray-700">Crown Moulding</Text>
            <View
              className={`w-12 h-7 rounded-full ${
                hasCrownMoulding ? "bg-blue-600" : "bg-gray-300"
              }`}
            >
              <View
                className={`w-5 h-5 rounded-full bg-white mt-1 ${
                  hasCrownMoulding ? "ml-6" : "ml-1"
                }`}
              />
            </View>
          </Pressable>

          {/* Windows and Doors */}
          <View className="mb-4">
            <Text className="text-2xl font-medium text-gray-700 mb-2">
              Windows & Doors
            </Text>

            {/* Windows */}
            <View className="flex-row items-center gap-3 mb-3">
              <View className="flex-row items-center gap-2">
                <Pressable
                  onPress={() => {
                    const current = parseInt(windowCount) || 0;
                    if (current > 0) {
                      setWindowCount((current - 1).toString());
                    }
                  }}
                  className="bg-gray-200 rounded-lg p-2 active:bg-gray-300"
                >
                  <Ionicons name="remove" size={20} color="#374151" />
                </Pressable>
                <Text className="text-xl font-semibold text-gray-900 min-w-[24px] text-center">
                  {windowCount || "0"}
                </Text>
                <Pressable
                  onPress={() => {
                    const current = parseInt(windowCount) || 0;
                    setWindowCount((current + 1).toString());
                  }}
                  className="bg-gray-200 rounded-lg p-2 active:bg-gray-300"
                >
                  <Ionicons name="add" size={20} color="#374151" />
                </Pressable>
              </View>
              <Text className="text-xl text-gray-700 flex-1">Windows</Text>
            </View>

            {/* Doors */}
            <View className="flex-row items-center gap-3">
              <View className="flex-row items-center gap-2">
                <Pressable
                  onPress={() => {
                    const current = parseInt(doorCount) || 0;
                    if (current > 0) {
                      setDoorCount((current - 1).toString());
                    }
                  }}
                  className="bg-gray-200 rounded-lg p-2 active:bg-gray-300"
                >
                  <Ionicons name="remove" size={20} color="#374151" />
                </Pressable>
                <Text className="text-xl font-semibold text-gray-900 min-w-[24px] text-center">
                  {doorCount || "0"}
                </Text>
                <Pressable
                  onPress={() => {
                    const current = parseInt(doorCount) || 0;
                    setDoorCount((current + 1).toString());
                  }}
                  className="bg-gray-200 rounded-lg p-2 active:bg-gray-300"
                >
                  <Ionicons name="add" size={20} color="#374151" />
                </Pressable>
              </View>
              <Text className="text-xl text-gray-700 flex-1">Doors</Text>
            </View>
          </View>

          {/* Include/Exclude from Quote Section */}
          <View className="mb-6 bg-gray-50 rounded-xl p-4">
            <Text className="text-2xl font-semibold text-gray-900 mb-3">
              Include in Quote
            </Text>
            <Text className="text-base text-gray-600 mb-4">
              Toggle items to exclude from calculations for flexible pricing
            </Text>

            {/* Include Windows */}
            {parseInt(windowCount) > 0 && (
              <Pressable
                onPress={() => setIncludeWindows(!includeWindows)}
                className="flex-row items-center justify-between bg-white border border-gray-300 rounded-xl px-4 py-3 mb-3"
              >
                <Text className="text-xl text-gray-700">Include Windows</Text>
                <View
                  className={`w-12 h-7 rounded-full ${
                    includeWindows ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <View
                    className={`w-5 h-5 rounded-full bg-white mt-1 ${
                      includeWindows ? "ml-6" : "ml-1"
                    }`}
                  />
                </View>
              </Pressable>
            )}

            {/* Include Doors */}
            {parseInt(doorCount) > 0 && (
              <Pressable
                onPress={() => setIncludeDoors(!includeDoors)}
                className="flex-row items-center justify-between bg-white border border-gray-300 rounded-xl px-4 py-3 mb-3"
              >
                <Text className="text-xl text-gray-700">Include Doors</Text>
                <View
                  className={`w-12 h-7 rounded-full ${
                    includeDoors ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <View
                    className={`w-5 h-5 rounded-full bg-white mt-1 ${
                      includeDoors ? "ml-6" : "ml-1"
                    }`}
                  />
                </View>
              </Pressable>
            )}

            {/* Include Trim */}
            {(paintBaseboard || hasCrownMoulding) && (
              <Pressable
                onPress={() => setIncludeTrim(!includeTrim)}
                className="flex-row items-center justify-between bg-white border border-gray-300 rounded-xl px-4 py-3"
              >
                <Text className="text-xl text-gray-700">Include Trim</Text>
                <View
                  className={`w-12 h-7 rounded-full ${
                    includeTrim ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <View
                    className={`w-5 h-5 rounded-full bg-white mt-1 ${
                      includeTrim ? "ml-6" : "ml-1"
                    }`}
                  />
                </View>
              </Pressable>
            )}
          </View>

          {/* Paint Windows Toggle */}
          {parseInt(windowCount) > 0 && (
            <Pressable
              onPress={() => setPaintWindows(!paintWindows)}
              className="flex-row items-center justify-between bg-white border border-gray-300 rounded-xl px-4 py-3 mb-4"
            >
              <Text className="text-xl text-gray-700">Paint Windows?</Text>
              <View
                className={`w-12 h-7 rounded-full ${
                  paintWindows ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <View
                  className={`w-5 h-5 rounded-full bg-white mt-1 ${
                    paintWindows ? "ml-6" : "ml-1"
                  }`}
                />
              </View>
            </Pressable>
          )}

          {/* Paint Doors Toggle */}
          {parseInt(doorCount) > 0 && (
            <>
              <Pressable
                onPress={() => setPaintDoors(!paintDoors)}
                className="flex-row items-center justify-between bg-white border border-gray-300 rounded-xl px-4 py-3 mb-4"
              >
                <Text className="text-xl text-gray-700">Paint Doors?</Text>
                <View
                  className={`w-12 h-7 rounded-full ${
                    paintDoors ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <View
                    className={`w-5 h-5 rounded-full bg-white mt-1 ${
                      paintDoors ? "ml-6" : "ml-1"
                    }`}
                  />
                </View>
              </Pressable>

              {/* Paint Jambs Toggle - only show if painting doors */}
              {paintDoors && (
                <Pressable
                  onPress={() => setPaintJambs(!paintJambs)}
                  className="flex-row items-center justify-between bg-white border border-gray-300 rounded-xl px-4 py-3 mb-4"
                >
                  <Text className="text-xl text-gray-700">Paint Door Jambs?</Text>
                  <View
                    className={`w-12 h-7 rounded-full ${
                      paintJambs ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  >
                    <View
                      className={`w-5 h-5 rounded-full bg-white mt-1 ${
                        paintJambs ? "ml-6" : "ml-1"
                      }`}
                    />
                  </View>
                </Pressable>
              )}
            </>
          )}

          {/* Closets */}
          <View className="mb-4">
            <Text className="text-2xl font-medium text-gray-700 mb-2">
              Closets
            </Text>

            {/* Single Door Closets */}
            <View className="flex-row items-center gap-3 mb-3">
              <View className="flex-row items-center gap-2">
                <Pressable
                  onPress={() => {
                    const current = parseInt(singleDoorClosets) || 0;
                    if (current > 0) {
                      setSingleDoorClosets((current - 1).toString());
                      if (current === 1 && (parseInt(doubleDoorClosets) || 0) === 0) {
                        setHasCloset(false);
                      }
                    }
                  }}
                  className="bg-gray-200 rounded-lg p-2 active:bg-gray-300"
                >
                  <Ionicons name="remove" size={20} color="#374151" />
                </Pressable>
                <Text className="text-xl font-semibold text-gray-900 min-w-[24px] text-center">
                  {singleDoorClosets || "0"}
                </Text>
                <Pressable
                  onPress={() => {
                    const current = parseInt(singleDoorClosets) || 0;
                    setSingleDoorClosets((current + 1).toString());
                    setHasCloset(true);
                  }}
                  className="bg-gray-200 rounded-lg p-2 active:bg-gray-300"
                >
                  <Ionicons name="add" size={20} color="#374151" />
                </Pressable>
              </View>
              <Text className="text-xl text-gray-700 flex-1">
                Single Door Closet
              </Text>
            </View>

            {/* Double Door Closets */}
            <View className="flex-row items-center gap-3">
              <View className="flex-row items-center gap-2">
                <Pressable
                  onPress={() => {
                    const current = parseInt(doubleDoorClosets) || 0;
                    if (current > 0) {
                      setDoubleDoorClosets((current - 1).toString());
                      if (current === 1 && (parseInt(singleDoorClosets) || 0) === 0) {
                        setHasCloset(false);
                      }
                    }
                  }}
                  className="bg-gray-200 rounded-lg p-2 active:bg-gray-300"
                >
                  <Ionicons name="remove" size={20} color="#374151" />
                </Pressable>
                <Text className="text-xl font-semibold text-gray-900 min-w-[24px] text-center">
                  {doubleDoorClosets || "0"}
                </Text>
                <Pressable
                  onPress={() => {
                    const current = parseInt(doubleDoorClosets) || 0;
                    setDoubleDoorClosets((current + 1).toString());
                    setHasCloset(true);
                  }}
                  className="bg-gray-200 rounded-lg p-2 active:bg-gray-300"
                >
                  <Ionicons name="add" size={20} color="#374151" />
                </Pressable>
              </View>
              <Text className="text-xl text-gray-700 flex-1">
                Double Doors Closet
              </Text>
            </View>
          </View>

          {/* Include Closet Interior Toggle - only show if there are closets */}
          {((parseInt(singleDoorClosets) || 0) > 0 || (parseInt(doubleDoorClosets) || 0) > 0) && (
            <View className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <Text className="text-base font-semibold text-blue-900 mb-2">
                Closet Interior Calculation
              </Text>
              <Text className="text-sm text-blue-700 mb-3">
                Closets are treated as 2&apos; deep cavities with interior walls, ceiling, and baseboard. Toggle to exclude closet interiors from the quote.
              </Text>
              <Pressable
                onPress={() => setIncludeClosetInteriorInQuote(!includeClosetInteriorInQuote)}
                className="flex-row items-center justify-between bg-white border border-blue-300 rounded-xl px-4 py-3"
              >
                <Text className="text-xl text-gray-700">Include Closet Interiors</Text>
                <View
                  className={`w-12 h-7 rounded-full ${
                    includeClosetInteriorInQuote ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <View
                    className={`w-5 h-5 rounded-full bg-white mt-1 ${
                      includeClosetInteriorInQuote ? "ml-6" : "ml-1"
                    }`}
                  />
                </View>
              </Pressable>
            </View>
          )}

          {/* Calculations Preview */}
          {calculations && (
            <>
              <View className="bg-white rounded-xl p-4 border border-gray-200 mb-4">
                <Text className="text-2xl font-bold text-gray-900 mb-3">
                  Estimate Preview
                </Text>

                {/* Wall Area Calculation */}
                <View className="bg-gray-50 rounded-lg p-3 mb-3">
                  <Text className="text-base font-semibold text-gray-700 mb-2">
                    WALL AREA CALCULATION:
                  </Text>
                  {parseFloat(length) > 0 && parseFloat(width) > 0 ? (
                    <>
                      <View className="flex-row justify-between mb-1">
                        <Text className="text-sm text-gray-600">Perimeter:</Text>
                        <Text className="text-sm text-gray-900">
                          2 × ({length} + {width}) = {(2 * (parseFloat(length) + parseFloat(width))).toFixed(1)} ft
                        </Text>
                      </View>
                      <View className="flex-row justify-between mb-1">
                        <Text className="text-sm text-gray-600">Height:</Text>
                        <Text className="text-sm text-gray-900">
                          {currentHeight.toFixed(1)} ft {ceilingType === "cathedral" && parseFloat(cathedralPeakHeight) > 0 ? `(avg with peak: ${(currentHeight + parseFloat(cathedralPeakHeight)) / 2}ft)` : ""}
                        </Text>
                      </View>
                      <View className="flex-row justify-between mb-1">
                        <Text className="text-sm text-gray-600">Base wall area:</Text>
                        <Text className="text-sm text-gray-900">
                          {(2 * (parseFloat(length) + parseFloat(width))).toFixed(1)} × {ceilingType === "cathedral" && parseFloat(cathedralPeakHeight) > 0
                            ? (currentHeight + parseFloat(cathedralPeakHeight)) / 2
                            : currentHeight} = {(2 * (parseFloat(length) + parseFloat(width)) * (ceilingType === "cathedral" && parseFloat(cathedralPeakHeight) > 0
                            ? (currentHeight + parseFloat(cathedralPeakHeight)) / 2
                            : currentHeight)).toFixed(1)} sq ft
                        </Text>
                      </View>
                      {parseInt(windowCount) > 0 && (
                        <>
                          <View className="flex-row justify-between mb-1">
                            <Text className="text-sm text-gray-600">Less windows opening:</Text>
                            <Text className="text-sm text-gray-900">
                              -{parseInt(windowCount)} × ({calcSettings.windowWidth}ft × {calcSettings.windowHeight}ft) = -{(parseInt(windowCount) * calcSettings.windowWidth * calcSettings.windowHeight).toFixed(1)} sq ft
                            </Text>
                          </View>
                          <View className="flex-row justify-between mb-1">
                            <Text className="text-sm text-gray-600">Less window trim:</Text>
                            <Text className="text-sm text-gray-900">
                              -{parseInt(windowCount)} × [{calcSettings.windowTrimWidth}&quot; × 2×({calcSettings.windowWidth}+{calcSettings.windowHeight})ft] = -{(parseInt(windowCount) * (calcSettings.windowTrimWidth / 12) * 2 * (calcSettings.windowWidth + calcSettings.windowHeight)).toFixed(1)} sq ft
                            </Text>
                          </View>
                        </>
                      )}
                      {parseInt(doorCount) > 0 && (
                        <>
                          <View className="flex-row justify-between mb-1">
                            <Text className="text-sm text-gray-600">Less doors opening:</Text>
                            <Text className="text-sm text-gray-900">
                              -{parseInt(doorCount)} × ({calcSettings.doorHeight}ft × {calcSettings.doorWidth}ft) = -{(parseInt(doorCount) * calcSettings.doorHeight * calcSettings.doorWidth).toFixed(1)} sq ft
                            </Text>
                          </View>
                          <View className="flex-row justify-between mb-1">
                            <Text className="text-sm text-gray-600">Less door trim:</Text>
                            <Text className="text-sm text-gray-900">
                              -{parseInt(doorCount)} × [{calcSettings.doorTrimWidth}&quot; × ((2×{calcSettings.doorHeight})+{calcSettings.doorWidth})ft] = -{(parseInt(doorCount) * (calcSettings.doorTrimWidth / 12) * ((2 * calcSettings.doorHeight) + calcSettings.doorWidth)).toFixed(1)} sq ft
                            </Text>
                          </View>
                          <View className="flex-row justify-between mb-1">
                            <Text className="text-sm font-medium text-gray-700">Total door deduction:</Text>
                            <Text className="text-sm font-bold text-red-600">
                              -{(
                                parseInt(doorCount) * calcSettings.doorHeight * calcSettings.doorWidth +
                                parseInt(doorCount) * (calcSettings.doorTrimWidth / 12) * ((2 * calcSettings.doorHeight) + calcSettings.doorWidth)
                              ).toFixed(1)} sq ft
                            </Text>
                          </View>
                        </>
                      )}
                      {(parseInt(singleDoorClosets) > 0 || parseInt(doubleDoorClosets) > 0) && (
                        <>
                          {parseInt(singleDoorClosets) > 0 && (
                            <>
                              <View className="flex-row justify-between mb-1">
                                <Text className="text-sm text-gray-600">Less single closets:</Text>
                                <Text className="text-sm text-gray-900">
                                  -{parseInt(singleDoorClosets)} × [({calcSettings.singleClosetWidth}&quot;×ceiling)+trim] = -{((parseInt(singleDoorClosets) || 0) * ((calcSettings.singleClosetWidth / 12) * 8 + ((2 * 8) + (calcSettings.singleClosetWidth / 12)) * (calcSettings.singleClosetTrimWidth / 12))).toFixed(1)} sq ft
                                </Text>
                              </View>
                            </>
                          )}
                          {parseInt(doubleDoorClosets) > 0 && (
                            <>
                              <View className="flex-row justify-between mb-1">
                                <Text className="text-sm text-gray-600">Less double closets:</Text>
                                <Text className="text-sm text-gray-900">
                                  -{parseInt(doubleDoorClosets)} × [({calcSettings.doubleClosetWidth}&quot;×ceiling)+trim] = -{((parseInt(doubleDoorClosets) || 0) * ((calcSettings.doubleClosetWidth / 12) * 8 + ((2 * 8) + (calcSettings.doubleClosetWidth / 12)) * (calcSettings.doubleClosetTrimWidth / 12))).toFixed(1)} sq ft
                                </Text>
                              </View>
                            </>
                          )}
                        </>
                      )}
                    </>
                  ) : parseFloat(manualArea) > 0 ? (
                    <>
                      <View className="flex-row justify-between mb-1">
                        <Text className="text-sm text-gray-600">Estimated perimeter:</Text>
                        <Text className="text-sm text-gray-900">
                          4 × √{manualArea} = {(4 * Math.sqrt(parseFloat(manualArea))).toFixed(1)} ft
                        </Text>
                      </View>
                      <View className="flex-row justify-between mb-1">
                        <Text className="text-sm text-gray-600">Base wall area:</Text>
                        <Text className="text-sm text-gray-900">
                          {(4 * Math.sqrt(parseFloat(manualArea))).toFixed(1)} × {currentHeight.toFixed(1)} = {(4 * Math.sqrt(parseFloat(manualArea)) * currentHeight).toFixed(1)} sq ft
                        </Text>
                      </View>
                    </>
                  ) : null}
                  <View className="border-t border-gray-300 mt-2 pt-2">
                    <View className="flex-row justify-between">
                      <Text className="text-base font-bold text-gray-800">Net Wall Area:</Text>
                      <Text className="text-base font-bold text-gray-900">
                        {calculations.wallSqFt.toFixed(1)} sq ft
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Ceiling Area Calculation */}
                <View className="bg-gray-50 rounded-lg p-3 mb-3">
                  <Text className="text-base font-semibold text-gray-700 mb-2">
                    CEILING AREA CALCULATION:
                  </Text>
                  {parseFloat(manualArea) > 0 ? (
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-sm text-gray-600">Manual area:</Text>
                      <Text className="text-sm text-gray-900">{manualArea} sq ft</Text>
                    </View>
                  ) : parseFloat(length) > 0 && parseFloat(width) > 0 ? (
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-sm text-gray-600">Base area:</Text>
                      <Text className="text-sm text-gray-900">
                        {length} × {width} = {(parseFloat(length) * parseFloat(width)).toFixed(0)} sq ft
                      </Text>
                    </View>
                  ) : null}
                  {ceilingType === "cathedral" && (
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-sm text-gray-600">Cathedral multiplier:</Text>
                      <Text className="text-sm text-gray-900">
                        {parseFloat(cathedralPeakHeight) > 0 && parseFloat(width) > 0
                          ? `×${Math.sqrt(1 + Math.pow((parseFloat(cathedralPeakHeight) - currentHeight) / (parseFloat(width) / 2), 2)).toFixed(2)}`
                          : "×1.3 (estimated)"}
                      </Text>
                    </View>
                  )}
                  <View className="border-t border-gray-300 mt-2 pt-2">
                    <View className="flex-row justify-between">
                      <Text className="text-base font-bold text-gray-800">Total Ceiling Area:</Text>
                      <Text className="text-base font-bold text-gray-900">
                        {calculations.ceilingSqFt.toFixed(0)} sq ft
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Trim Calculation */}
                <View className="bg-gray-50 rounded-lg p-3 mb-3">
                  <Text className="text-base font-semibold text-gray-700 mb-2">
                    TRIM CALCULATION:
                  </Text>
                  {paintBaseboard && (
                    <>
                      {parseFloat(length) > 0 && parseFloat(width) > 0 ? (
                        <>
                          <View className="flex-row justify-between mb-1">
                            <Text className="text-sm text-gray-600">Perimeter:</Text>
                            <Text className="text-sm text-gray-900">
                              2 × ({length} + {width}) = {(2 * (parseFloat(length) + parseFloat(width))).toFixed(1)} ft
                            </Text>
                          </View>
                          {parseInt(doorCount) > 0 && (
                            <View className="flex-row justify-between mb-1">
                              <Text className="text-sm text-gray-600">Less door width:</Text>
                              <Text className="text-sm text-gray-900">
                                -{parseInt(doorCount)} × {(calcSettings.doorWidth + (calcSettings.doorTrimWidth * 2 / 12)).toFixed(2)} ft = -{(parseInt(doorCount) * (calcSettings.doorWidth + (calcSettings.doorTrimWidth * 2 / 12))).toFixed(1)} ft
                              </Text>
                            </View>
                          )}
                          <View className="border-t border-gray-300 mt-1 pt-1 flex-row justify-between mb-2">
                            <Text className="text-sm font-bold text-gray-800">Baseboard (linear):</Text>
                            <Text className="text-sm font-bold text-gray-900">
                              {calculations.baseboardLF.toFixed(0)} ft
                            </Text>
                          </View>
                          <View className="flex-row justify-between mb-2">
                            <Text className="text-sm text-gray-600">Baseboard area:</Text>
                            <Text className="text-sm text-gray-900">
                              {calculations.baseboardLF.toFixed(0)} ft × {calcSettings.baseboardWidth}&quot; = {(calculations.baseboardLF * (calcSettings.baseboardWidth / 12)).toFixed(1)} sq ft
                            </Text>
                          </View>
                        </>
                      ) : (
                        <>
                          <View className="flex-row justify-between mb-1">
                            <Text className="text-sm text-gray-600">Baseboard (linear):</Text>
                            <Text className="text-sm text-gray-900">
                              {calculations.baseboardLF.toFixed(0)} ft
                            </Text>
                          </View>
                          <View className="flex-row justify-between mb-2">
                            <Text className="text-sm text-gray-600">Baseboard area:</Text>
                            <Text className="text-sm text-gray-900">
                              {calculations.baseboardLF.toFixed(0)} ft × {calcSettings.baseboardWidth}&quot; = {(calculations.baseboardLF * (calcSettings.baseboardWidth / 12)).toFixed(1)} sq ft
                            </Text>
                          </View>
                        </>
                      )}
                    </>
                  )}
                  {!paintBaseboard && (
                    <Text className="text-sm text-gray-500 italic">
                      Baseboard painting not selected
                    </Text>
                  )}
                  {hasCrownMoulding && calculations.crownMouldingLF > 0 && (
                    <>
                      <View className="flex-row justify-between mb-1">
                        <Text className="text-sm text-gray-600">Crown Moulding (linear):</Text>
                        <Text className="text-sm text-gray-900">
                          {calculations.crownMouldingLF.toFixed(0)} ft
                        </Text>
                      </View>
                      <View className="flex-row justify-between mb-1">
                        <Text className="text-sm text-gray-600">Crown Moulding area:</Text>
                        <Text className="text-sm text-gray-900">
                          {calculations.crownMouldingLF.toFixed(0)} ft × {calcSettings.crownMouldingWidth}&quot; = {(calculations.crownMouldingLF * (calcSettings.crownMouldingWidth / 12)).toFixed(1)} sq ft
                        </Text>
                      </View>
                    </>
                  )}
                </View>

                {/* Door Calculation */}
                {paintDoors && parseInt(doorCount) > 0 && (
                  <View className="bg-gray-50 rounded-lg p-3 mb-3">
                    <Text className="text-base font-semibold text-gray-700 mb-2">
                      DOOR CALCULATION:
                    </Text>
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-sm text-gray-600">Door count:</Text>
                      <Text className="text-sm text-gray-900">{parseInt(doorCount)}</Text>
                    </View>
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-sm text-gray-600">Door faces (both sides):</Text>
                      <Text className="text-sm text-gray-900">
                        {parseInt(doorCount)} × ({calcSettings.doorHeight}ft × {calcSettings.doorWidth}ft × 2) = {(parseInt(doorCount) * calcSettings.doorHeight * calcSettings.doorWidth * 2).toFixed(1)} sq ft
                      </Text>
                    </View>
                    {paintJambs && (
                      <>
                        <View className="flex-row justify-between mb-1">
                          <Text className="text-sm text-gray-600">Door jambs:</Text>
                          <Text className="text-sm text-gray-900">
                            {parseInt(doorCount)} × [({(calcSettings.doorJambWidth || 4.5)}&quot; × {calcSettings.doorHeight}ft × 2) + ({(calcSettings.doorJambWidth || 4.5)}&quot; × {calcSettings.doorWidth}ft)]
                          </Text>
                        </View>
                        <View className="flex-row justify-between mb-1">
                          <Text className="text-sm text-gray-600"></Text>
                          <Text className="text-sm text-gray-900">
                            = {(parseInt(doorCount) * (((calcSettings.doorJambWidth || 4.5) / 12 * calcSettings.doorHeight * 2) + ((calcSettings.doorJambWidth || 4.5) / 12 * calcSettings.doorWidth))).toFixed(1)} sq ft
                          </Text>
                        </View>
                      </>
                    )}
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-sm text-gray-600">Door trim area:</Text>
                      <Text className="text-sm text-gray-900">
                        {parseInt(doorCount)} × [{calcSettings.doorTrimWidth}&quot; × ((2 × {calcSettings.doorHeight}ft) + {calcSettings.doorWidth}ft)]
                      </Text>
                    </View>
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-sm text-gray-600"></Text>
                      <Text className="text-sm text-gray-900">
                        = {(parseInt(doorCount) * (calcSettings.doorTrimWidth / 12) * ((2 * calcSettings.doorHeight) + calcSettings.doorWidth)).toFixed(1)} sq ft
                      </Text>
                    </View>
                    <View className="border-t border-gray-300 mt-2 pt-2">
                      <View className="flex-row justify-between">
                        <Text className="text-base font-bold text-gray-800">Total Door{paintJambs ? " + Jambs" : ""} + Trim:</Text>
                        <Text className="text-base font-bold text-gray-900">
                          {(
                            parseInt(doorCount) * calcSettings.doorHeight * calcSettings.doorWidth * 2 +
                            (paintJambs ? parseInt(doorCount) * (((calcSettings.doorJambWidth || 4.5) / 12 * calcSettings.doorHeight * 2) + ((calcSettings.doorJambWidth || 4.5) / 12 * calcSettings.doorWidth)) : 0) +
                            parseInt(doorCount) * (calcSettings.doorTrimWidth / 12) * ((2 * calcSettings.doorHeight) + calcSettings.doorWidth)
                          ).toFixed(1)} sq ft
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Window Calculation */}
                {paintWindows && parseInt(windowCount) > 0 && (
                  <View className="bg-gray-50 rounded-lg p-3 mb-3">
                    <Text className="text-base font-semibold text-gray-700 mb-2">
                      WINDOW CALCULATION:
                    </Text>
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-sm text-gray-600">Window count:</Text>
                      <Text className="text-sm text-gray-900">{parseInt(windowCount)}</Text>
                    </View>
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-sm text-gray-600">Window trim area:</Text>
                      <Text className="text-sm text-gray-900">
                        {parseInt(windowCount)} × [{calcSettings.windowTrimWidth}&quot; × (2 × ({calcSettings.windowWidth}ft + {calcSettings.windowHeight}ft))]
                      </Text>
                    </View>
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-sm text-gray-600"></Text>
                      <Text className="text-sm text-gray-900">
                        = {(parseInt(windowCount) * (calcSettings.windowTrimWidth / 12) * 2 * (calcSettings.windowWidth + calcSettings.windowHeight)).toFixed(1)} sq ft
                      </Text>
                    </View>
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-sm text-gray-600">Opening deduction:</Text>
                      <Text className="text-sm text-gray-900">
                        {parseInt(windowCount)} × ({calcSettings.windowWidth}ft × {calcSettings.windowHeight}ft) = {(parseInt(windowCount) * calcSettings.windowWidth * calcSettings.windowHeight).toFixed(1)} sq ft (from walls)
                      </Text>
                    </View>
                    <View className="border-t border-gray-300 mt-2 pt-2">
                      <View className="flex-row justify-between">
                        <Text className="text-base font-bold text-gray-800">Total Window Trim Area:</Text>
                        <Text className="text-base font-bold text-gray-900">
                          {(parseInt(windowCount) * (calcSettings.windowTrimWidth / 12) * 2 * (calcSettings.windowWidth + calcSettings.windowHeight)).toFixed(1)} sq ft
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Summary */}
                <View className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-base text-gray-600">Labor Cost:</Text>
                    <Text className="text-base text-gray-900">${calculations.laborCost.toFixed(2)}</Text>
                  </View>
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-base text-gray-600">Material Cost:</Text>
                    <Text className="text-base text-gray-900">${calculations.materialCost.toFixed(2)}</Text>
                  </View>
                  <View className="border-t border-blue-300 pt-2">
                    <View className="flex-row justify-between">
                      <Text className="text-base font-bold text-gray-900">Total Price:</Text>
                      <Text className="text-base font-bold text-blue-600">
                        {formatCurrency(calculations.totalPrice)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Materials Breakdown */}
              <View className="bg-white rounded-xl p-4 border border-gray-200 mb-4">
                <Text className="text-2xl font-bold text-gray-900 mb-3">
                  Materials Breakdown
                </Text>

                {/* Wall Paint (Flat) */}
                {calculations.totalWallGallons > 0 && (
                  <View className="mb-3">
                    <View className="flex-row justify-between items-center mb-1">
                      <Text className="text-2xl font-semibold text-gray-900">
                        Wall Paint (Flat)
                      </Text>
                      <Text className="text-2xl font-bold text-gray-900">
                        {calculations.totalWallGallons.toFixed(1)} gal
                      </Text>
                    </View>
                    <Text className="text-xl text-gray-500">
                      {calculations.wallSqFt.toFixed(0)} sq ft × {project?.projectCoats || room?.coatsWalls || 2} coat(s) ÷ {pricing.wallCoverageSqFtPerGallon} sq ft/gal
                    </Text>
                  </View>
                )}

                {/* Ceiling Paint (Flat) */}
                {calculations.totalCeilingGallons > 0 && (
                  <View className="mb-3">
                    <View className="flex-row justify-between items-center mb-1">
                      <Text className="text-2xl font-semibold text-gray-900">
                        Ceiling Paint (Flat)
                      </Text>
                      <Text className="text-2xl font-bold text-gray-900">
                        {calculations.totalCeilingGallons.toFixed(1)} gal
                      </Text>
                    </View>
                    <Text className="text-xl text-gray-500">
                      {calculations.ceilingSqFt.toFixed(0)} sq ft × {project?.projectCoats || room?.coatsCeiling || 2} coat(s) ÷ {pricing.ceilingCoverageSqFtPerGallon} sq ft/gal
                    </Text>
                  </View>
                )}

                {/* Trim Paint (Semi-Gloss) */}
                {calculations.totalTrimGallons > 0 && (
                  <View className="mb-3">
                    <View className="flex-row justify-between items-center mb-1">
                      <Text className="text-2xl font-semibold text-gray-900">
                        Trim Paint (Semi-Gloss)
                      </Text>
                      <Text className="text-2xl font-bold text-gray-900">
                        {calculations.totalTrimGallons.toFixed(1)} gal
                      </Text>
                    </View>
                    <View className="ml-2">
                      {paintBaseboard && (
                        <Text className="text-xl text-gray-500">
                          • Baseboard: {calculations.baseboardLF.toFixed(0)} ft
                        </Text>
                      )}
                      {calculations.crownMouldingLF > 0 && (
                        <Text className="text-xl text-gray-500">
                          • Crown Moulding: {calculations.crownMouldingLF.toFixed(0)} ft
                        </Text>
                      )}
                      {paintWindows && parseInt(windowCount) > 0 && (
                        <Text className="text-xl text-gray-500">
                          • Window Trim: {parseInt(windowCount)} window(s) × 12 ft = {parseInt(windowCount) * 12} ft
                        </Text>
                      )}
                      {paintDoors && parseInt(doorCount) > 0 && (
                        <Text className="text-xl text-gray-500">
                          • Door Trim: {parseInt(doorCount)} door(s) × 17 ft = {parseInt(doorCount) * 17} ft
                        </Text>
                      )}
                    </View>
                  </View>
                )}

                {/* Door Paint (Semi-Gloss) */}
                {calculations.totalDoorGallons > 0 && paintDoors && (
                  <View className="mb-3">
                    <View className="flex-row justify-between items-center mb-1">
                      <Text className="text-2xl font-semibold text-gray-900">
                        Door Paint (Semi-Gloss)
                      </Text>
                      <Text className="text-2xl font-bold text-gray-900">
                        {calculations.totalDoorGallons.toFixed(1)} gal
                      </Text>
                    </View>
                    <View className="ml-2">
                      <Text className="text-xl text-gray-500">
                        • Door Faces: {parseInt(doorCount)} door(s) × 42 sq ft (both sides)
                      </Text>
                      {paintJambs && (
                        <Text className="text-xl text-gray-500">
                          • Door Jambs: {parseInt(doorCount)} jamb(s) × 20 sq ft
                        </Text>
                      )}
                      <Text className="text-xl text-gray-500">
                        • Coats: {room?.coatsDoors || 1} coat(s)
                      </Text>
                    </View>
                  </View>
                )}

                {/* Window Paint (Semi-Gloss) */}
                {paintWindows && parseInt(windowCount) > 0 && (
                  <View className="mb-3">
                    <View className="flex-row justify-between items-center mb-1">
                      <Text className="text-2xl font-semibold text-gray-900">
                        Window Surfaces
                      </Text>
                      <Text className="text-2xl font-bold text-gray-900">
                        Included in trim
                      </Text>
                    </View>
                    <View className="ml-2">
                      <Text className="text-xl text-gray-500">
                        • Window Count: {parseInt(windowCount)}
                      </Text>
                      <Text className="text-xl text-gray-500">
                        • Trim per Window: 12 linear ft
                      </Text>
                      <Text className="text-xl text-gray-500">
                        • Opening Deduction: 15 sq ft per window (already deducted from walls)
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </>
          )}

          {/* Save Button */}
          <Pressable
            onPress={handleSave}
            className="bg-blue-600 rounded-xl py-4 items-center active:bg-blue-700"
          >
            <Text className="text-white text-2xl font-semibold">Save Room</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Save Confirmation Modal */}
      {showSavePrompt && (
        <View className="absolute top-0 left-0 right-0 bottom-0 bg-black/50 items-center justify-center">
          <View className="bg-white rounded-2xl mx-6 p-6 w-full max-w-sm">
            <Text className="text-2xl font-bold text-gray-900 mb-2">
              Save Changes?
            </Text>
            <Text className="text-xl text-gray-600 mb-6">
              You have unsaved changes. Do you want to save them before leaving?
            </Text>

            <View className="gap-3">
              <Pressable
                onPress={handleSaveAndLeave}
                className="bg-blue-600 rounded-xl py-4 items-center active:bg-blue-700"
              >
                <Text className="text-white text-xl font-semibold">
                  Save Changes
                </Text>
              </Pressable>

              <Pressable
                onPress={handleDiscardAndLeave}
                className="bg-red-600 rounded-xl py-4 items-center active:bg-red-700"
              >
                <Text className="text-white text-xl font-semibold">
                  Discard Changes
                </Text>
              </Pressable>

              <Pressable
                onPress={handleCancelExit}
                className="bg-gray-200 rounded-xl py-4 items-center active:bg-gray-300"
              >
                <Text className="text-gray-900 text-xl font-semibold">
                  Cancel
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
