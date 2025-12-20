import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface AppSettings {
  // App Behavior
  testMode: boolean; // Show/hide debugging utilities

  // Settings Protection
  settingsPin: string | null; // PIN to protect settings, null means no PIN set
  requireSettingsConfirmation: boolean; // Whether to show confirmation dialog before entering settings

  // Paint Coverage Rules (moved from pricing store)
  wallCoverageSqFtPerGallon: number;
  ceilingCoverageSqFtPerGallon: number;
  trimCoverageSqFtPerGallon: number;
  doorCoverageSqFtPerGallon: number;
  primerCoverageSqFtPerGallon: number;

  // Closet settings
  closetCavityDepth: number; // in feet, default 2
}

interface AppSettingsStore extends AppSettings {
  updateSettings: (settings: Partial<AppSettings>) => void;
  resetToDefaults: () => void;
}

const defaultAppSettings: AppSettings = {
  testMode: false,

  // Settings Protection
  settingsPin: null,
  requireSettingsConfirmation: true, // Default to requiring confirmation

  // Paint Coverage
  wallCoverageSqFtPerGallon: 350,
  ceilingCoverageSqFtPerGallon: 350,
  trimCoverageSqFtPerGallon: 350,
  doorCoverageSqFtPerGallon: 350,
  primerCoverageSqFtPerGallon: 350,

  // Closet
  closetCavityDepth: 2, // 2 feet = 24 inches
};

export const useAppSettings = create<AppSettingsStore>()(
  persist(
    (set) => ({
      ...defaultAppSettings,
      updateSettings: (settings) => set((state) => ({ ...state, ...settings })),
      resetToDefaults: () => set(defaultAppSettings),
    }),
    {
      name: "app-settings-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
