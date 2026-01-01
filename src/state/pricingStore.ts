import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PricingSettings } from "../types/painting";

interface PricingStore extends PricingSettings {
  updatePricing: (settings: Partial<PricingSettings>) => void;
  resetToDefaults: () => void;
}

const defaultPricing: PricingSettings = {
  // Labor rates
  wallLaborPerSqFt: 1.5,
  ceilingLaborPerSqFt: 1.75,
  baseboardLaborPerLF: 1.25,
  doorLabor: 50,
  windowLabor: 35,
  closetLabor: 75,
  riserLabor: 15,
  spindleLabor: 8,
  handrailLaborPerLF: 10,
  fireplaceLabor: 150,
  crownMouldingLaborPerLF: 1.5,

  // Second coat labor multiplier (1.5 = 2 coats cost 1.5x labor of 1 coat)
  secondCoatLaborMultiplier: 2.0,

  // Accent wall / multiple colors labor multiplier
  accentWallLaborMultiplier: 1.25,

  // Furniture moving fee (flat fee per project)
  furnitureMovingFee: 100,

  // Material prices - single gallons
  wallPaintPerGallon: 45,
  ceilingPaintPerGallon: 40,
  trimPaintPerGallon: 50,
  doorPaintPerGallon: 50,
  primerPerGallon: 35,

  // Material prices - 5-gallon buckets
  wallPaintPer5Gallon: 200,
  ceilingPaintPer5Gallon: 175,
  trimPaintPer5Gallon: 225,
  doorPaintPer5Gallon: 225,
  primerPer5Gallon: 150,

  // Coverage settings
  wallCoverageSqFtPerGallon: 350,
  ceilingCoverageSqFtPerGallon: 350,
  trimCoverageSqFtPerGallon: 350,
};

export const usePricingStore = create<PricingStore>()(
  persist(
    (set) => ({
      ...defaultPricing,
      updatePricing: (settings) => set((state) => ({ ...state, ...settings })),
      resetToDefaults: () => set(defaultPricing),
    }),
    {
      name: "pricing-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
