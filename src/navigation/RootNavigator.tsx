import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainerRef, NavigationState, PartialState } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../utils/designSystem";
import { useAppSettings } from "../state/appSettings";

// Import screens
import HomeScreen from "../screens/HomeScreen";
import ProjectDetailScreen from "../screens/ProjectDetailScreen";
import ProjectSetupScreen from "../screens/ProjectSetupScreen";
import ProjectActionsScreen from "../screens/ProjectActionsScreen";
import ProjectsListScreen from "../screens/ProjectsListScreen";
import RoomEditorScreen from "../screens/RoomEditorScreen";
import BathroomEditorScreen from "../screens/BathroomEditorScreen";
import StaircaseEditorScreen from "../screens/StaircaseEditorScreen";
import FireplaceEditorScreen from "../screens/FireplaceEditorScreen";
import BuiltInEditorScreen from "../screens/BuiltInEditorScreen";
import CabinetEditorScreen from "../screens/CabinetEditorScreen";
import BrickWallEditorScreen from "../screens/BrickWallEditorScreen";
import IrregularRoomEditorScreen from "../screens/IrregularRoomEditorScreen";
import PricingSettingsScreen from "../screens/PricingSettingsScreen";
import CalculationSettingsScreen from "../screens/CalculationSettingsScreen";
import MaterialsSummaryScreen from "../screens/MaterialsSummaryScreen";
import ClientProposalScreen from "../screens/ClientProposalScreen";
import QuoteBuilderScreen from "../screens/QuoteBuilderScreen";
import QuoteManagerScreen from "../screens/QuoteManagerScreen";
import SettingsGateScreen from "../screens/SettingsGateScreen";

// Type definitions
export type RootStackParamList = {
  Home: undefined;
  MainTabs: undefined; // Keep for backward compatibility
  ProjectsList: undefined;
  ProjectDetail: { projectId: string };
  ProjectSetup: { projectId?: string; isNew?: boolean };
  ProjectActions: { projectId: string };
  RoomEditor: { projectId: string; roomId?: string; roomName?: string; floor?: number };
  BathroomEditor: { projectId: string; bathroomId?: string; bathroomName?: string; floor?: number };
  StaircaseEditor: { projectId: string; staircaseId?: string };
  FireplaceEditor: { projectId: string; fireplaceId?: string };
  BuiltInEditor: { projectId: string; builtInId?: string };
  CabinetEditor: { projectId: string; cabinetId?: string };
  BrickWallEditor: { projectId: string; brickWallId?: string };
  IrregularRoomEditor: { projectId: string; irregularRoomId?: string };
  PricingSettings: undefined;
  CalculationSettings: undefined;
  MaterialsSummary: { projectId: string };
  ClientProposal: { projectId: string };
  QuoteBuilder: { projectId: string };
  QuoteManager: { projectId: string };
};

export type TabParamList = {
  HomeTab: undefined;
  SettingsTab: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

type RootNavigatorProps = {
  navigationRef: NavigationContainerRef<RootStackParamList>;
};

function getActiveRouteName(
  state: NavigationState | PartialState<NavigationState> | undefined
): string {
  if (!state || !("routes" in state) || state.routes.length === 0) {
    return "";
  }
  const currentRoute = state.routes[state.index ?? 0];
  if ("state" in currentRoute && currentRoute.state) {
    return getActiveRouteName(currentRoute.state as NavigationState);
  }
  return currentRoute.name;
}

// Debug component to show current screen name in test mode
function ScreenNameDebug({ navigationRef }: RootNavigatorProps) {
  const testMode = useAppSettings((s) => s.testMode);
  const insets = useSafeAreaInsets();
  const [routeName, setRouteName] = useState("");

  useEffect(() => {
    const updateRouteName = () => {
      if (!navigationRef.isReady()) {
        return;
      }
      const state = navigationRef.getRootState();
      setRouteName(getActiveRouteName(state));
    };

    updateRouteName();
    const unsubscribe = navigationRef.addListener("state", updateRouteName);
    return unsubscribe;
  }, [navigationRef]);

  if (!testMode || !routeName) return null;

  return (
    <View
      style={{
        position: "absolute",
        top: insets.top + 50,
        left: 8,
        zIndex: 9999,
        backgroundColor: "rgba(220, 38, 38, 0.9)",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
      }}
      pointerEvents="none"
    >
      <Text style={{ color: "white", fontSize: 11, fontWeight: "600" }}>
        {routeName}
      </Text>
    </View>
  );
}

function MainTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "home";

          if (route.name === "HomeTab") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "SettingsTab") {
            iconName = focused ? "settings" : "settings-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primaryBlue,
        tabBarInactiveTintColor: Colors.mediumGray,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.neutralGray,
          borderTopWidth: 1,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
          height: 60 + (insets.bottom > 0 ? insets.bottom : 0),
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
        headerStyle: {
          backgroundColor: Colors.white,
        },
        headerTintColor: Colors.darkCharcoal,
        headerTitleStyle: {
          fontWeight: "600",
          fontSize: 17,
        },
        headerLargeTitle: false,
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen as any}
        options={{
          title: "Home",
          headerShown: true,
          headerLargeTitle: false,
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsGateScreen as any}
        options={{
          title: "Settings",
          headerShown: true,
          headerLargeTitle: false,
        }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator({ navigationRef }: RootNavigatorProps) {
  return (
    <View style={{ flex: 1 }}>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.white,
          },
          headerTintColor: Colors.darkCharcoal,
          headerTitleStyle: {
            fontWeight: "600",
            fontSize: 17,
          },
          gestureEnabled: true,
          fullScreenGestureEnabled: false,
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen
          name="Home"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ProjectsList"
          component={ProjectsListScreen}
          options={{ title: "Projects" }}
        />
        <Stack.Screen
          name="ProjectDetail"
          component={ProjectDetailScreen}
          options={{ title: "Project" }}
        />
        <Stack.Screen
          name="ProjectSetup"
          component={ProjectSetupScreen}
          options={{ title: "Project Setup" }}
        />
        <Stack.Screen
          name="ProjectActions"
          component={ProjectActionsScreen}
          options={{ title: "Project Actions" }}
        />
        <Stack.Screen
          name="RoomEditor"
          component={RoomEditorScreen}
          options={{
            headerShown: false,
            gestureEnabled: true,
          }}
        />
        <Stack.Screen
          name="BathroomEditor"
          component={BathroomEditorScreen}
          options={({ route }) => {
            const bathroomName = route.params?.bathroomName || "Edit Bathroom";
            return {
              title: `Edit Bathroom: ${bathroomName}`,
              headerShown: false,
              gestureEnabled: true,
            };
          }}
        />
        <Stack.Screen
          name="StaircaseEditor"
          component={StaircaseEditorScreen}
          options={{ title: "Staircase", headerShown: false }}
        />
        <Stack.Screen
          name="FireplaceEditor"
          component={FireplaceEditorScreen}
          options={{ title: "Fireplace", headerShown: false }}
        />
        <Stack.Screen
          name="BuiltInEditor"
          component={BuiltInEditorScreen}
          options={{ title: "Built-In", headerShown: false }}
        />
        <Stack.Screen
          name="CabinetEditor"
          component={CabinetEditorScreen}
          options={{ title: "Cabinet", headerShown: false }}
        />
        <Stack.Screen
          name="BrickWallEditor"
          component={BrickWallEditorScreen}
          options={{ title: "Brick/Panel", headerShown: false }}
        />
        <Stack.Screen
          name="IrregularRoomEditor"
          component={IrregularRoomEditorScreen}
          options={{ title: "Irregular Room", headerShown: false }}
        />
        <Stack.Screen
          name="PricingSettings"
          component={PricingSettingsScreen}
          options={{ title: "Pricing Settings", headerBackTitleVisible: false }}
        />
        <Stack.Screen
          name="CalculationSettings"
          component={CalculationSettingsScreen}
          options={{ title: "Calculation Settings", headerBackTitleVisible: false }}
        />
        <Stack.Screen
          name="MaterialsSummary"
          component={MaterialsSummaryScreen}
          options={{ title: "Contractor View" }}
        />
        <Stack.Screen
          name="ClientProposal"
          component={ClientProposalScreen}
          options={{ title: "Client Proposal", presentation: "modal" }}
        />
        <Stack.Screen
          name="QuoteBuilder"
          component={QuoteBuilderScreen}
          options={{ title: "Quote Builder" }}
        />
        <Stack.Screen
          name="QuoteManager"
          component={QuoteManagerScreen}
          options={{ title: "Quote Manager" }}
        />
      </Stack.Navigator>
      <ScreenNameDebug navigationRef={navigationRef} />
    </View>
  );
}
