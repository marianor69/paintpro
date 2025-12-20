import React from "react";
import { View, Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useNavigationState } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../utils/designSystem";
import { useAppSettings } from "../state/appSettings";

// Import screens
import HomeScreen from "../screens/HomeScreen";
import ProjectDetailScreen from "../screens/ProjectDetailScreen";
import RoomEditorScreen from "../screens/RoomEditorScreen";
import StaircaseEditorScreen from "../screens/StaircaseEditorScreen";
import FireplaceEditorScreen from "../screens/FireplaceEditorScreen";
import PricingSettingsScreen from "../screens/PricingSettingsScreen";
import CalculationSettingsScreen from "../screens/CalculationSettingsScreen";
import MaterialsSummaryScreen from "../screens/MaterialsSummaryScreen";
import ClientProposalScreen from "../screens/ClientProposalScreen";
import NewProjectScreen from "../screens/NewProjectScreen";
import QuoteBuilderScreen from "../screens/QuoteBuilderScreen";
import QuoteManagerScreen from "../screens/QuoteManagerScreen";
import SettingsGateScreen from "../screens/SettingsGateScreen";

// Type definitions
export type RootStackParamList = {
  MainTabs: undefined;
  Home: undefined; // Keep for backward compatibility
  NewProject: undefined;
  ProjectDetail: { projectId: string };
  RoomEditor: { projectId: string; roomId?: string };
  StaircaseEditor: { projectId: string; staircaseId?: string };
  FireplaceEditor: { projectId: string; fireplaceId?: string };
  PricingSettings: undefined;
  CalculationSettings: undefined;
  MaterialsSummary: { projectId: string };
  ClientProposal: { projectId: string };
  QuoteBuilder: { projectId: string };
  QuoteManager: { projectId: string };
};

export type TabParamList = {
  ProjectsTab: undefined;
  SettingsTab: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// Debug component to show current screen name in test mode
function ScreenNameDebug() {
  const testMode = useAppSettings((s) => s.testMode);
  const insets = useSafeAreaInsets();

  // Get the current route name from navigation state
  const routeName = useNavigationState((state) => {
    if (!state || !state.routes) return "";
    const currentRoute = state.routes[state.index];
    // If it's MainTabs, get the nested tab name
    if (currentRoute.name === "MainTabs" && currentRoute.state) {
      const tabState = currentRoute.state;
      const tabRoute = tabState.routes?.[tabState.index ?? 0];
      return tabRoute?.name || "MainTabs";
    }
    return currentRoute.name;
  });

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
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "home";

          if (route.name === "ProjectsTab") {
            iconName = focused ? "folder" : "folder-outline";
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
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
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
        },
      })}
    >
      <Tab.Screen
        name="ProjectsTab"
        component={HomeScreen as any}
        options={{ title: "Projects", headerShown: true }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsGateScreen as any}
        options={{ title: "Settings", headerShown: true }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <View style={{ flex: 1 }}>
      <Stack.Navigator
        initialRouteName="MainTabs"
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.white,
          },
          headerTintColor: Colors.darkCharcoal,
          headerTitleStyle: {
            fontWeight: "600",
          },
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="NewProject"
          component={NewProjectScreen}
          options={{ title: "New Project", presentation: "modal" }}
        />
        <Stack.Screen
          name="ProjectDetail"
          component={ProjectDetailScreen}
          options={{ title: "Project" }}
        />
        <Stack.Screen
          name="RoomEditor"
          component={RoomEditorScreen}
          options={{
            title: "Edit Room",
            headerShown: true,
            gestureEnabled: true,
          }}
        />
        <Stack.Screen
          name="StaircaseEditor"
          component={StaircaseEditorScreen}
          options={{ title: "Staircase" }}
        />
        <Stack.Screen
          name="FireplaceEditor"
          component={FireplaceEditorScreen}
          options={{ title: "Fireplace" }}
        />
        <Stack.Screen
          name="PricingSettings"
          component={PricingSettingsScreen}
          options={{ title: "Pricing Settings" }}
        />
        <Stack.Screen
          name="CalculationSettings"
          component={CalculationSettingsScreen}
          options={{ title: "Calculation Settings" }}
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
      <ScreenNameDebug />
    </View>
  );
}
