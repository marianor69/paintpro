import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface CalculationSettings {
  // Door settings
  doorHeight: number; // in feet
  doorWidth: number; // in feet
  doorTrimWidth: number; // width of trim around doors in inches
  doorJambWidth: number; // width of door jamb in inches

  // Window settings
  windowWidth: number; // in feet
  windowHeight: number; // in feet
  windowTrimWidth: number; // width of trim around windows in inches

  // Closet settings
  singleClosetWidth: number; // in inches (door opening width)
  singleClosetTrimWidth: number; // width of trim around single closet doors in inches
  singleClosetBaseboardPerimeter: number; // baseboard perimeter inside closet in inches

  doubleClosetWidth: number; // in inches (door opening width)
  doubleClosetTrimWidth: number; // width of trim around double closet doors in inches
  doubleClosetBaseboardPerimeter: number; // baseboard perimeter inside closet in inches

  closetCavityDepth: number; // depth of closet cavity in feet

  // Other trim settings
  baseboardWidth: number; // width of baseboard trim in inches
  crownMouldingWidth: number; // width of crown moulding trim in inches

  // Opening settings (pass-through openings without doors)
  defaultOpeningWidth: number; // default opening width in inches
  defaultOpeningHeight: number; // default opening height in inches
  openingTrimWidth: number; // width of trim around openings in inches
}

interface CalculationStore {
  settings: CalculationSettings;
  updateSettings: (settings: Partial<CalculationSettings>) => void;
  resetToDefaults: () => void;
}

const DEFAULT_SETTINGS: CalculationSettings = {
  // Door defaults (standard 36" x 84" door = 3ft x 7ft)
  doorHeight: 7,
  doorWidth: 3,
  doorTrimWidth: 3.5, // standard trim width in inches
  doorJambWidth: 4.5, // standard door jamb width in inches

  // Window defaults (standard 3ft x 5ft window)
  windowWidth: 3,
  windowHeight: 5,
  windowTrimWidth: 3.5, // standard trim width in inches

  // Single door closet (standard 24" wide opening)
  singleClosetWidth: 24,
  singleClosetTrimWidth: 3.5, // standard trim width in inches
  singleClosetBaseboardPerimeter: 88, // 40" back wall + 24" x 2 sides = 88"

  // Double door closet (standard 48" wide opening)
  doubleClosetWidth: 48,
  doubleClosetTrimWidth: 3.5, // standard trim width in inches
  doubleClosetBaseboardPerimeter: 112, // 64" back wall + 24" x 2 sides = 112"

  // Closet cavity depth
  closetCavityDepth: 2, // 2 feet deep

  // Other trim settings
  baseboardWidth: 5.5, // standard baseboard width in inches
  crownMouldingWidth: 5.5, // standard crown moulding width in inches

  // Opening settings (pass-through openings without doors)
  defaultOpeningWidth: 36, // default opening width in inches (3 feet)
  defaultOpeningHeight: 80, // default opening height in inches (~6.67 feet)
  openingTrimWidth: 3.5, // width of trim around openings in inches
};

export const useCalculationSettings = create<CalculationStore>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      resetToDefaults: () =>
        set({
          settings: DEFAULT_SETTINGS,
        }),
    }),
    {
      name: "calculation-settings",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
