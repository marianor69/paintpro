import {
  Room,
  Staircase,
  Fireplace,
  BrickWall,
  PricingSettings,
  RoomCalculations,
  StaircaseCalculations,
  FireplaceCalculations,
  BrickWallCalculations,
  ProjectSummary,
  Project,
  QuoteBuilder,
  PaintOptionResult,
} from "../types/painting";
import { useCalculationSettings } from "../state/calculationStore";
import {
  computeRoomPricingSummary,
  computeStaircasePricingSummary,
  computeFireplacePricingSummary,
  computeBrickWallPricingSummary
} from "./pricingSummary";

// Helper function to get calculation settings
function getCalculationSettings() {
  return useCalculationSettings.getState().settings;
}

/**
 * Get default paint options (Good/Better/Best)
 */
export function getDefaultPaintOptions() {
  return [
    {
      id: "opt1",
      enabled: true,
      name: "Standard Paint",
      pricePerGallon: 40,
      coverageSqFt: 350,
      materialMarkup: 1.10,
      laborMultiplier: 1.00,
      notes: "Budget-friendly eggshell acrylic."
    },
    {
      id: "opt2",
      enabled: false,
      name: "Premium Paint",
      pricePerGallon: 60,
      coverageSqFt: 350,
      materialMarkup: 1.12,
      laborMultiplier: 1.00,
      notes: "Washable, scrubbable, better hide."
    },
    {
      id: "opt3",
      enabled: false,
      name: "Designer Paint",
      pricePerGallon: 80,
      coverageSqFt: 325,
      materialMarkup: 1.15,
      laborMultiplier: 1.05,
      notes: "Zero-VOC, luxury finish, best leveling."
    }
  ];
}

/**
 * Get default Quote Builder configuration (all items included)
 * COMBINED RULE: Category toggles work with room-level toggles
 * A category is included ONLY if BOTH room.paint[category] AND quoteBuilder.include[category] are true
 */
export function getDefaultQuoteBuilder(): QuoteBuilder {
  return {
    includeAllRooms: true,
    includedRoomIds: [],
    // Category toggles (default all ON)
    includeWalls: true,
    includeCeilings: true,
    includeTrim: true,
    includeDoors: true,
    includeWindows: true,
    includeBaseboards: true,
    includeClosets: true,
    // Structural elements
    includeStaircases: true,
    includeFireplaces: true,
    includeBuiltIns: true,
    includePrimer: true,
    includeFloor1: true,
    includeFloor2: true,
    includeFloor3: true,
    includeFloor4: true,
    includeFloor5: true,
    paintOptions: getDefaultPaintOptions(),
    showPaintOptionsInProposal: true,
  };
}

/**
 * Check if a room should be included in the quote based on Quote Builder settings
 */
export function isRoomIncludedInQuote(room: Room, qb: QuoteBuilder): boolean {
  // Check floor inclusion
  const floor = room.floor || 1;
  const floorKey = `includeFloor${floor}` as keyof QuoteBuilder;
  if (qb[floorKey] === false) {
    console.log(`[isRoomIncludedInQuote] Room "${room.name}" excluded - floor ${floor} not included`);
    return false;
  }

  // Check room inclusion
  if (qb.includeAllRooms) {
    console.log(`[isRoomIncludedInQuote] Room "${room.name}" included - includeAllRooms = true`);
    return true;
  }

  const isIncluded = qb.includedRoomIds.includes(room.id);
  console.log(`[isRoomIncludedInQuote] Room "${room.name}" ${isIncluded ? "included" : "excluded"} - by room ID filter`);
  return isIncluded;
}

/**
 * Safe number helper - converts any value to a finite number or returns fallback
 * Handles null, undefined, NaN, Infinity, and non-numeric values
 */
export function safeNumber(value: unknown, fallback: number = 0): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return n;
}

// Closet geometry constants
const CLOSET_DEPTH_FT = 2; // interior depth
const CLOSET_SINGLE_OPENING_FT = 2.5; // 30" nominal opening
const CLOSET_DOUBLE_OPENING_FT = 5; // 60" double opening

/**
 * Helper to get safe room height
 */
function getRoomHeight(room: Room, defaultHeight: number): number {
  return Math.max(0, safeNumber(room.height, defaultHeight));
}

/**
 * Calculate closet interior metrics for a room
 * Returns wall area, ceiling area, and baseboard LF for closet interiors
 */
export function getClosetInteriorMetrics(room: Room, defaultHeight: number): {
  totalClosetWallArea: number;
  totalClosetCeilingArea: number;
  totalClosetBaseboardLF: number;
  totalClosetCount: number;
  singleCount: number;
  doubleCount: number;
} {
  const h = getRoomHeight(room, defaultHeight);
  const singleCount = safeNumber(room.singleDoorClosets, 0);
  const doubleCount = safeNumber(room.doubleDoorClosets, 0);

  if (singleCount <= 0 && doubleCount <= 0) {
    return {
      totalClosetWallArea: 0,
      totalClosetCeilingArea: 0,
      totalClosetBaseboardLF: 0,
      totalClosetCount: 0,
      singleCount: 0,
      doubleCount: 0
    };
  }

  // Wall area per closet = back wall + 2 side walls
  const singleWallAreaPer = (CLOSET_SINGLE_OPENING_FT + 2 * CLOSET_DEPTH_FT) * h;
  const doubleWallAreaPer = (CLOSET_DOUBLE_OPENING_FT + 2 * CLOSET_DEPTH_FT) * h;

  // Ceiling area per closet
  const singleCeilingPer = CLOSET_SINGLE_OPENING_FT * CLOSET_DEPTH_FT;
  const doubleCeilingPer = CLOSET_DOUBLE_OPENING_FT * CLOSET_DEPTH_FT;

  // Baseboard LF per closet (floor perimeter)
  const singleBaseboardLFPer = 2 * (CLOSET_SINGLE_OPENING_FT + CLOSET_DEPTH_FT);
  const doubleBaseboardLFPer = 2 * (CLOSET_DOUBLE_OPENING_FT + CLOSET_DEPTH_FT);

  const totalClosetWallArea =
    singleCount * singleWallAreaPer +
    doubleCount * doubleWallAreaPer;

  const totalClosetCeilingArea =
    singleCount * singleCeilingPer +
    doubleCount * doubleCeilingPer;

  const totalClosetBaseboardLF =
    singleCount * singleBaseboardLFPer +
    doubleCount * doubleBaseboardLFPer;

  return {
    totalClosetWallArea: Math.max(0, safeNumber(totalClosetWallArea)),
    totalClosetCeilingArea: Math.max(0, safeNumber(totalClosetCeilingArea)),
    totalClosetBaseboardLF: Math.max(0, safeNumber(totalClosetBaseboardLF)),
    totalClosetCount: singleCount + doubleCount,
    singleCount,
    doubleCount
  };
}

/**
 * Cathedral ceiling multiplier helper
 * Returns a multiplier for ceiling area based on peak height vs wall height
 * Clamped between 1.0 and 1.4 for reasonable results
 */
export function getCathedralMultiplier(room: Room): number {
  const wallHeight = safeNumber(room.height);
  const peak = safeNumber(room.cathedralPeakHeight, wallHeight);

  // If peak <= wall, treat as flat (multiplier 1)
  if (!wallHeight || peak <= wallHeight) return 1;

  // Calculate multiplier and clamp to reasonable range (1-1.4)
  const extra = peak - wallHeight;
  const rawMult = 1 + extra / wallHeight;
  return Math.min(Math.max(rawMult, 1), 1.4);
}

export function calculateRoomMetrics(
  room: Room,
  pricing: PricingSettings,
  projectCoats?: 1 | 2,
  projectIncludeClosetInteriorInQuote?: boolean
): RoomCalculations {
  const calcSettings = getCalculationSettings();
  // Use project-level coats if provided, otherwise use room's coats (defaults to 2)
  const coatsWalls = safeNumber(projectCoats || room.coatsWalls, 2);
  const coatsCeiling = safeNumber(projectCoats || room.coatsCeiling, 2);
  const coatsTrim = safeNumber(projectCoats || room.coatsTrim, 2); // Project coats override room setting
  const coatsDoors = safeNumber(projectCoats || room.coatsDoors, 2); // Project coats override room setting

  // Safe geometry values - clamp to non-negative
  // ALL VALUES STORED IN IMPERIAL (FEET) - Unit conversion happens ONLY at display time
  const length = Math.max(0, safeNumber(room.length)); // feet
  const width = Math.max(0, safeNumber(room.width)); // feet
  const height = Math.max(0, safeNumber(room.height)); // feet
  const manualArea = Math.max(0, safeNumber(room.manualArea)); // square feet

  // If manual area is provided, ALWAYS use it and ignore length/width
  const useManualArea = manualArea > 0;
  const hasLengthWidth = !useManualArea && length > 0 && width > 0;

  // PERIMETER CALCULATION: Simple formula, NO UNIT CONVERSION
  // Input: length and width in feet
  // Output: perimeter in feet
  // Example: 10m x 10m room → stored as 32.81ft x 32.81ft → perimeter = 131.23ft → displays as 40m
  const perimeter = hasLengthWidth ? 2 * (length + width) : 0;

  // Determine effective wall height based on ceiling type
  let effectiveWallHeight = height;
  const cathedralPeakHeight = safeNumber(room.cathedralPeakHeight, height);
  if (room.ceilingType === "cathedral" && cathedralPeakHeight > height) {
    // For cathedral ceilings, use average height: (base height + peak height) / 2
    effectiveWallHeight = (height + cathedralPeakHeight) / 2;
  }

  // Calculate wall square footage
  let wallSqFt = 0;
  if (hasLengthWidth) {
    // Use perimeter × effective height when we have dimensions
    wallSqFt = perimeter * effectiveWallHeight;
  } else if (useManualArea && effectiveWallHeight > 0) {
    // If only manual area is provided, estimate walls as 4 × sqrt(area) × height
    // This assumes a roughly square room
    const estimatedPerimeter = 4 * Math.sqrt(manualArea);
    wallSqFt = estimatedPerimeter * effectiveWallHeight;
  }

  // Deduct windows and doors openings ALWAYS (whether painted or not)
  // The paint on trim is calculated separately below
  // Opening deduction = opening area + trim area (because trim covers the wall)

  // Safe counts for windows, doors, and closets
  const windowCount = safeNumber(room.windowCount, 0);
  const doorCount = safeNumber(room.doorCount, 0);
  const singleClosets = safeNumber(room.singleDoorClosets, 0);
  const doubleClosets = safeNumber(room.doubleDoorClosets, 0);

  // Window opening deduction: opening area + trim area (only if windows are included)
  let windowDeduction = 0;
  if (room.includeWindows !== false) { // Default to true if undefined
    const windowOpeningArea = calcSettings.windowWidth * calcSettings.windowHeight;
    const windowTrimPerimeter = 2 * (calcSettings.windowWidth + calcSettings.windowHeight); // All 4 sides
    const windowTrimArea = windowTrimPerimeter * (calcSettings.windowTrimWidth / 12);
    windowDeduction = windowCount * (windowOpeningArea + windowTrimArea);
  }

  // Door opening deduction: opening area + trim area (only if doors are included)
  let doorDeduction = 0;
  if (room.includeDoors !== false) { // Default to true if undefined
    const doorOpeningArea = calcSettings.doorHeight * calcSettings.doorWidth;
    const doorTrimPerimeter = (2 * calcSettings.doorHeight) + calcSettings.doorWidth; // 2 sides + top, no floor
    const doorTrimArea = doorTrimPerimeter * (calcSettings.doorTrimWidth / 12);
    doorDeduction = doorCount * (doorOpeningArea + doorTrimArea);
  }

  // Single closet: opening area + trim area (use room height for closet height)
  const closetHeightFt = height; // Use room ceiling height
  const singleClosetOpeningArea = (calcSettings.singleClosetWidth / 12) * closetHeightFt;
  const singleClosetPerimeterForWall = (2 * closetHeightFt) + (calcSettings.singleClosetWidth / 12);
  const singleClosetTrimArea = singleClosetPerimeterForWall * (calcSettings.singleClosetTrimWidth / 12);
  const singleClosetDeduction = singleClosets * (singleClosetOpeningArea + singleClosetTrimArea);

  // Double closet: opening area + trim area (use room height for closet height)
  const doubleClosetOpeningArea = (calcSettings.doubleClosetWidth / 12) * closetHeightFt;
  const doubleClosetPerimeterForWall = (2 * closetHeightFt) + (calcSettings.doubleClosetWidth / 12);
  const doubleClosetTrimArea = doubleClosetPerimeterForWall * (calcSettings.doubleClosetTrimWidth / 12);
  const doubleClosetDeduction = doubleClosets * (doubleClosetOpeningArea + doubleClosetTrimArea);

  const closetDeduction = singleClosetDeduction + doubleClosetDeduction;

  wallSqFt = Math.max(0, safeNumber(wallSqFt - windowDeduction - doorDeduction - closetDeduction));

  // Calculate ceiling square footage
  // Use manual area if provided, otherwise calculate from length × width
  let ceilingSqFt = useManualArea ? manualArea : length * width;
  if (room.ceilingType === "cathedral") {
    // For cathedral ceilings, calculate the actual sloped surface area
    // Using the formula for a gabled roof: base area × sqrt(1 + (rise/run)^2)
    if (!useManualArea && cathedralPeakHeight > height && width > 0) {
      // Only calculate sloped area if we have width (not using manual area)
      // Rise is the difference between peak and base height
      const rise = cathedralPeakHeight - height;
      // Run is half the width (from wall to peak)
      const run = width / 2;
      // Calculate the slope multiplier (clamped for safety)
      const slopeMultiplier = run > 0 ? Math.sqrt(1 + Math.pow(rise / run, 2)) : 1;
      // Apply the multiplier to get actual sloped ceiling area
      ceilingSqFt *= slopeMultiplier;
    } else {
      // Use getCathedralMultiplier for consistent behavior
      ceilingSqFt *= getCathedralMultiplier(room);
    }
  }
  // Ensure ceiling area is non-negative
  ceilingSqFt = Math.max(0, safeNumber(ceilingSqFt));

  // Calculate closet interior metrics and add to areas if included
  const closetMetrics = getClosetInteriorMetrics(room, height);
  const includeCloset = room.includeClosetInteriorInQuote ?? projectIncludeClosetInteriorInQuote ?? true;

  if (includeCloset) {
    wallSqFt += closetMetrics.totalClosetWallArea;
    ceilingSqFt += closetMetrics.totalClosetCeilingArea;
  }

  // Calculate baseboard linear feet (only if painting baseboard AND trim is included)
  let baseboardLF = 0;
  if (room.paintBaseboard !== false && room.includeTrim !== false) { // Default to true if undefined
    // Door opening width for baseboard = door width + (trim width × 2)
    // Convert trim width from inches to feet
    const doorOpeningWidthForBaseboard = calcSettings.doorWidth + (calcSettings.doorTrimWidth * 2 / 12);
    // Closet opening widths for baseboard
    const singleClosetOpeningWidth = (calcSettings.singleClosetWidth / 12) + (calcSettings.singleClosetTrimWidth * 2 / 12);
    const doubleClosetOpeningWidth = (calcSettings.doubleClosetWidth / 12) + (calcSettings.doubleClosetTrimWidth * 2 / 12);

    if (hasLengthWidth) {
      baseboardLF = Math.max(0, perimeter - (doorCount * doorOpeningWidthForBaseboard) - (singleClosets * singleClosetOpeningWidth) - (doubleClosets * doubleClosetOpeningWidth));
    } else if (useManualArea) {
      // Estimate baseboard from area
      const estimatedPerimeter = 4 * Math.sqrt(manualArea);
      baseboardLF = Math.max(0, estimatedPerimeter - (doorCount * doorOpeningWidthForBaseboard) - (singleClosets * singleClosetOpeningWidth) - (doubleClosets * doubleClosetOpeningWidth));
    }

    // Add closet interior baseboard if included
    if (includeCloset) {
      baseboardLF += closetMetrics.totalClosetBaseboardLF;
    }
  }

  // Calculate trim area for windows and doors (if being painted AND if included)
  let windowDoorTrimSqFt = 0;

  // Add window trim area if painting window frames AND windows exist AND trim is included
  // Window frames are painted separately, controlled by paintWindowFrames toggle
  if ((room.paintWindowFrames ?? true) && windowCount > 0 && room.includeWindows !== false && room.includeTrim !== false) {
    // Trim width from calculation settings
    const trimWidthFt = calcSettings.windowTrimWidth / 12; // Convert inches to feet
    const windowTrimPerimeter = 2 * (calcSettings.windowWidth + calcSettings.windowHeight); // All 4 sides
    const trimAreaPerWindow = windowTrimPerimeter * trimWidthFt;
    windowDoorTrimSqFt += windowCount * trimAreaPerWindow;
  }

  // Add door trim area if painting door frames AND doors exist AND trim is included
  // Door frames are painted separately, controlled by paintDoorFrames toggle (includes closet doors)
  if ((room.paintDoorFrames ?? true) && doorCount > 0 && room.includeDoors !== false && room.includeTrim !== false) {
    const trimWidthFt = calcSettings.doorTrimWidth / 12; // Convert inches to feet
    const doorTrimPerimeter = (2 * calcSettings.doorHeight) + calcSettings.doorWidth; // 2 sides + top, no floor
    const trimAreaPerDoor = doorTrimPerimeter * trimWidthFt;
    windowDoorTrimSqFt += doorCount * trimAreaPerDoor;
  }

  // Add closet door trim area (closet doors are painted if paintDoorFrames is included)
  if ((room.paintDoorFrames ?? true) && room.includeTrim !== false) {
    if (singleClosets > 0) {
      const trimWidthFt = calcSettings.singleClosetTrimWidth / 12; // Convert inches to feet
      // Calculate perimeter: 2 × height + 1 × width (no trim on floor) - use room height
      const singleClosetPerimeter = (2 * height) + (calcSettings.singleClosetWidth / 12);
      const trimAreaPerCloset = singleClosetPerimeter * trimWidthFt;
      windowDoorTrimSqFt += singleClosets * trimAreaPerCloset;
    }

    if (doubleClosets > 0) {
      const trimWidthFt = calcSettings.doubleClosetTrimWidth / 12; // Convert inches to feet
      // Calculate perimeter: 2 × height + 1 × width (no trim on floor) - use room height
      const doubleClosetPerimeter = (2 * height) + (calcSettings.doubleClosetWidth / 12);
      const trimAreaPerCloset = doubleClosetPerimeter * trimWidthFt;
      windowDoorTrimSqFt += doubleClosets * trimAreaPerCloset;
    }
  }

  // Calculate baseboard trim area (5.5" trim) - only if painting baseboard AND trim is included
  let baseboardTrimSqFt = 0;
  if (room.paintBaseboard !== false && room.includeTrim !== false) { // Default to true if undefined
    const baseboardTrimWidthFt = calcSettings.baseboardWidth / 12;
    baseboardTrimSqFt = baseboardLF * baseboardTrimWidthFt;
  }

  // Calculate opening area and trim (pass-through openings without doors)
  // Openings subtract from wall area and baseboard length, but add trim
  let openingWallAreaSqFt = 0;
  let openingTrimSqFt = 0;
  let openingBaseboardLF = 0;
  if (room.openings && room.openings.length > 0 && room.includeTrim !== false) {
    for (const opening of room.openings) {
      const openingWidthFt = opening.width / 12; // Convert inches to feet
      const openingHeightFt = opening.height / 12; // Convert inches to feet

      // Subtract opening area from wall area (opening removes wall)
      openingWallAreaSqFt += openingWidthFt * openingHeightFt;

      // Subtract opening width from baseboard length
      openingBaseboardLF += openingWidthFt;

      // Add trim area around opening
      // Trim goes on 2 sides (full height), 1 top (full width), and optionally 1 back
      const trimWidthFt = calcSettings.openingTrimWidth / 12;
      const interiorTrimPerimeter = opening.hasInteriorTrim
        ? (2 * openingHeightFt) + openingWidthFt  // 2 sides + top
        : 0;
      const exteriorTrimPerimeter = opening.hasExteriorTrim
        ? (2 * openingHeightFt) + openingWidthFt  // 2 sides + top
        : 0;
      const totalOpeningTrimPerimeter = interiorTrimPerimeter + exteriorTrimPerimeter;
      openingTrimSqFt += totalOpeningTrimPerimeter * trimWidthFt;
    }
  }

  // Crown moulding section
  let crownMouldingLF = 0;
  let crownMouldingTrimSqFt = 0;
  if (room.hasCrownMoulding && room.includeTrim !== false) {
    if (hasLengthWidth) {
      crownMouldingLF = perimeter;
    } else if (useManualArea) {
      // Estimate perimeter from area
      crownMouldingLF = 4 * Math.sqrt(manualArea);
    }
    // Calculate crown moulding trim area (5.5" trim)
    const crownMouldingWidthFt = calcSettings.crownMouldingWidth / 12;
    crownMouldingTrimSqFt = crownMouldingLF * crownMouldingWidthFt;
  }

  // Total trim square footage (combining all trim types) - ensure non-negative
  // Include opening trim in the total
  const trimSqFt = Math.max(0, safeNumber(windowDoorTrimSqFt + baseboardTrimSqFt + crownMouldingTrimSqFt + openingTrimSqFt));

  // Adjust wall area and baseboard length for openings
  const adjustedWallSqFt = Math.max(0, wallSqFt - openingWallAreaSqFt);
  const adjustedBaseboardLF = Math.max(0, baseboardLF - openingBaseboardLF);

  // Recalculate baseboard trim area with adjusted length
  let adjustedBaseboardTrimSqFt = baseboardTrimSqFt;
  if (room.paintBaseboard !== false && room.includeTrim !== false) {
    const baseboardTrimWidthFt = calcSettings.baseboardWidth / 12;
    adjustedBaseboardTrimSqFt = adjustedBaseboardLF * baseboardTrimWidthFt;
  }

  // Safe coverage values (minimum 1 to prevent division by zero)
  const wallCoverage = Math.max(1, safeNumber(pricing.wallCoverageSqFtPerGallon, 350));
  const ceilingCoverage = Math.max(1, safeNumber(pricing.ceilingCoverageSqFtPerGallon, 350));
  const trimCoverage = Math.max(1, safeNumber(pricing.trimCoverageSqFtPerGallon, 400));

  // Calculate paint gallons with safe division
  // Use adjusted wall area (subtracts openings)
  const rawWallGallons = (adjustedWallSqFt / wallCoverage) * coatsWalls;
  const rawCeilingGallons = (ceilingSqFt / ceilingCoverage) * coatsCeiling;
  const rawTrimGallons = (trimSqFt / trimCoverage) * coatsTrim;

  const totalWallGallons = Math.max(0, safeNumber(rawWallGallons));
  const totalCeilingGallons = Math.max(0, safeNumber(rawCeilingGallons));
  const totalTrimGallons = Math.max(0, safeNumber(rawTrimGallons));

  // Calculate door paint gallons (door faces - both sides, only if doors are included)
  let totalDoorGallons = 0;
  if (room.paintDoors && room.includeDoors !== false) {
    const doorFacesSqFt = doorCount * (calcSettings.doorHeight * calcSettings.doorWidth) * 2; // Both sides
    totalDoorGallons =
      (doorFacesSqFt * coatsDoors) / wallCoverage;

    // Add jamb area if painting jambs
    // Jamb area = (jamb width × door height × 2 sides) + (jamb width × door width × 1 top)
    if (room.paintJambs) {
      const jambWidthFt = safeNumber(calcSettings.doorJambWidth, 4.5) / 12; // Convert inches to feet, default to 4.5"
      const jambsSqFt = doorCount * (
        (jambWidthFt * calcSettings.doorHeight * 2) + // Two sides
        (jambWidthFt * calcSettings.doorWidth)         // Top
      );
      totalDoorGallons += (jambsSqFt * coatsDoors) / wallCoverage;
    }
  }
  // Ensure door gallons is non-negative
  totalDoorGallons = Math.max(0, safeNumber(totalDoorGallons));

  // Window paint is now included in trim calculation above
  const totalWindowGallons = 0;

  // Calculate labor costs (respecting inclusion flags)
  // Apply secondCoatLaborMultiplier when coats > 1
  const secondCoatMultiplier = safeNumber(pricing.secondCoatLaborMultiplier, 2.0);

  // Helper to calculate labor with coat multiplier
  // For 1 coat: multiplier = 1.0
  // For 2 coats: multiplier = secondCoatLaborMultiplier (e.g., 1.5 or 2.0)
  const getCoatLaborMultiplier = (coats: number): number => {
    if (coats <= 1) return 1.0;
    return secondCoatMultiplier;
  };

  let laborCost = 0;
  const wallLaborMultiplier = getCoatLaborMultiplier(coatsWalls);
  const ceilingLaborMultiplier = getCoatLaborMultiplier(coatsCeiling);
  const trimLaborMultiplier = getCoatLaborMultiplier(coatsTrim);
  const doorLaborMultiplier = getCoatLaborMultiplier(coatsDoors);

  laborCost += wallSqFt * safeNumber(pricing.wallLaborPerSqFt, 0) * wallLaborMultiplier;
  laborCost += ceilingSqFt * safeNumber(pricing.ceilingLaborPerSqFt, 0) * ceilingLaborMultiplier;
  if (room.includeTrim !== false) {
    laborCost += baseboardLF * safeNumber(pricing.baseboardLaborPerLF, 0) * trimLaborMultiplier;
  }

  // Add door labor only if painting doors AND doors are included
  if (room.paintDoors && room.includeDoors !== false) {
    laborCost += doorCount * safeNumber(pricing.doorLabor, 0) * doorLaborMultiplier;
  }

  // Add window labor only if painting window frames AND windows are included
  // Window frames are part of trim work - multiply by coat multiplier
  if ((room.paintWindowFrames ?? true) && room.includeWindows !== false) {
    laborCost += windowCount * safeNumber(pricing.windowLabor, 0) * trimLaborMultiplier;
  }

  // Add closet labor based on quantity (reuse variables from earlier)
  if (singleClosets > 0 || doubleClosets > 0) {
    laborCost += (singleClosets + doubleClosets) * safeNumber(pricing.closetLabor, 0) * wallLaborMultiplier;
  }

  // Add crown moulding labor (only if trim is included)
  if (room.hasCrownMoulding && crownMouldingLF > 0 && room.includeTrim !== false) {
    laborCost += crownMouldingLF * safeNumber(pricing.crownMouldingLaborPerLF, 0) * trimLaborMultiplier;
  }

  // Ensure labor cost is non-negative
  laborCost = Math.max(0, safeNumber(laborCost));

  // Calculate material costs
  let materialCost = 0;
  materialCost += Math.ceil(totalWallGallons) * safeNumber(pricing.wallPaintPerGallon, 0);
  materialCost +=
    Math.ceil(totalCeilingGallons) * safeNumber(pricing.ceilingPaintPerGallon, 0);
  materialCost += Math.ceil(totalTrimGallons) * safeNumber(pricing.trimPaintPerGallon, 0);

  // Add door paint cost using door/trim paint (semi-gloss)
  if (room.paintDoors) {
    materialCost += Math.ceil(totalDoorGallons) * safeNumber(pricing.doorPaintPerGallon, 0);
  }

  // Window paint is included in trim calculation (no separate window sash paint)

  // Ensure material cost is non-negative
  materialCost = Math.max(0, safeNumber(materialCost));

  const totalPrice = Math.max(0, safeNumber(laborCost + materialCost));

  return {
    wallSqFt,
    ceilingSqFt,
    baseboardLF,
    crownMouldingLF,
    totalWallGallons,
    totalCeilingGallons,
    totalTrimGallons,
    totalDoorGallons: totalDoorGallons + totalWindowGallons,
    laborCost,
    materialCost,
    totalPrice,
  };
}

/**
 * COMBINED RULE CALCULATION
 * Calculate room metrics with QuoteBuilder category filters applied
 *
 * RULE: A category is included ONLY IF:
 *   1. room.paint[category] === true (or undefined, defaulting to true) AND
 *   2. quoteBuilder.include[category] === true
 *
 * This creates a single source of truth for room calculations that respects both:
 * - Room-level paint preferences (what the room wants)
 * - Quote-level inclusions (what the quote includes)
 */
export function calculateRoomMetricsWithQB(
  room: Room,
  pricing: PricingSettings,
  quoteBuilder: QuoteBuilder,
  projectCoats?: 1 | 2,
  projectIncludeClosetInteriorInQuote?: boolean
): RoomCalculations {
  // Apply COMBINED RULE to create effective paint settings
  // Category is included ONLY if BOTH room toggle AND QB toggle are true
  const effectivePaintWalls = (room.paintWalls !== false) && quoteBuilder.includeWalls;
  const effectivePaintCeilings = (room.paintCeilings !== false) && quoteBuilder.includeCeilings;
  const effectivePaintTrim = (room.paintTrim !== false) && quoteBuilder.includeTrim;
  const effectivePaintWindowFrames = (room.paintWindowFrames !== false) && quoteBuilder.includeTrim && quoteBuilder.includeWindows;
  const effectivePaintDoorFrames = (room.paintDoorFrames !== false) && quoteBuilder.includeTrim && quoteBuilder.includeDoors;
  const effectivePaintDoors = (room.paintDoors !== false) && quoteBuilder.includeDoors;
  const effectivePaintBaseboard = (room.paintBaseboard !== false) && quoteBuilder.includeBaseboards;
  const effectiveIncludeCloset = (room.includeClosetInteriorInQuote ?? projectIncludeClosetInteriorInQuote ?? true) && quoteBuilder.includeClosets;

  // Create a modified room object with effective paint settings
  const effectiveRoom: Room = {
    ...room,
    paintWalls: effectivePaintWalls,
    paintCeilings: effectivePaintCeilings,
    paintTrim: effectivePaintTrim,
    paintWindowFrames: effectivePaintWindowFrames,
    paintDoorFrames: effectivePaintDoorFrames,
    paintDoors: effectivePaintDoors,
    paintBaseboard: effectivePaintBaseboard,
    includeClosetInteriorInQuote: effectiveIncludeCloset,
    // includeWindows controls whether windows count toward deductions and labor
    includeWindows: quoteBuilder.includeWindows !== false ? room.includeWindows : false,
  };

  // Use the standard calculation function with the effective room settings
  return calculateRoomMetrics(
    effectiveRoom,
    pricing,
    projectCoats,
    projectIncludeClosetInteriorInQuote
  );
}

/**
 * Compute and update room totals (single source of truth)
 * This function calculates the room's labor, materials, and grand total
 * and returns an updated room object with these values persisted.
 */
export function computeAndSetRoomTotals(
  room: Room,
  pricing: PricingSettings,
  projectCoats?: 1 | 2,
  projectIncludeClosetInteriorInQuote?: boolean
): Room {
  const calculations = calculateRoomMetrics(
    room,
    pricing,
    projectCoats,
    projectIncludeClosetInteriorInQuote
  );

  return {
    ...room,
    laborTotal: calculations.laborCost,
    materialsTotal: calculations.materialCost,
    grandTotal: calculations.totalPrice,
  };
}

export function calculateStaircaseMetrics(
  staircase: Staircase,
  pricing: PricingSettings
): StaircaseCalculations {
  // Calculate stair area (original staircase calculation)
  const riserArea = staircase.riserCount * staircase.riserHeight * 3; // Approximate width
  const treadArea = staircase.riserCount * staircase.treadDepth * 3;
  let paintableArea = riserArea + treadArea;

  // Add secondary stairwell wall and ceiling area if enabled
  if (staircase.hasSecondaryStairwell &&
      staircase.tallWallHeight &&
      staircase.shortWallHeight) {

    // Fixed assumptions for typical straight staircase
    const HORIZONTAL_RUN = 12; // ft
    const STAIR_WIDTH = 3.5; // ft
    const SLOPE_LENGTH = 15; // ft

    // Calculate wall area for one wall
    const Hmax = staircase.tallWallHeight;
    const Hmin = staircase.shortWallHeight;
    let stairWallArea = ((Hmax + Hmin) / 2) * HORIZONTAL_RUN;

    // Double the wall area if double-sided
    if (staircase.doubleSidedWalls) {
      stairWallArea *= 2;
    }

    // Calculate ceiling area (simple rectangle approximation)
    const stairCeilingArea = SLOPE_LENGTH * STAIR_WIDTH;

    // Add to total paintable area
    paintableArea += stairWallArea + stairCeilingArea;
  }

  // Calculate paint gallons
  const totalGallons =
    (paintableArea / pricing.wallCoverageSqFtPerGallon) * staircase.coats;

  // Calculate labor costs
  let laborCost = 0;
  laborCost += staircase.riserCount * pricing.riserLabor;
  laborCost += staircase.spindleCount * pricing.spindleLabor;
  laborCost += staircase.handrailLength * pricing.handrailLaborPerLF;

  // Add wall and ceiling labor for secondary stairwell if enabled
  if (staircase.hasSecondaryStairwell &&
      staircase.tallWallHeight &&
      staircase.shortWallHeight) {

    const HORIZONTAL_RUN = 12; // ft
    const STAIR_WIDTH = 3.5; // ft
    const SLOPE_LENGTH = 15; // ft

    const Hmax = staircase.tallWallHeight;
    const Hmin = staircase.shortWallHeight;
    let stairWallArea = ((Hmax + Hmin) / 2) * HORIZONTAL_RUN;

    // Double the wall area if double-sided
    if (staircase.doubleSidedWalls) {
      stairWallArea *= 2;
    }

    // Add wall labor (for stairwell walls)
    laborCost += stairWallArea * pricing.wallLaborPerSqFt;

    // Add ceiling labor (for stairwell ceiling)
    const stairCeilingArea = SLOPE_LENGTH * STAIR_WIDTH;
    laborCost += stairCeilingArea * pricing.ceilingLaborPerSqFt;
  }

  // Calculate material costs
  const materialCost = Math.ceil(totalGallons) * pricing.trimPaintPerGallon;

  const totalPrice = laborCost + materialCost;

  return {
    paintableArea,
    totalGallons,
    laborCost,
    materialCost,
    totalPrice,
  };
}

export function calculateFireplaceMetrics(
  fireplace: Fireplace,
  pricing: PricingSettings
): FireplaceCalculations {
  let paintableArea = 0;
  let totalGallons = 0;
  let laborCost = 0;
  let materialCost = 0;

  // Check if using new 3-part structure or legacy structure
  const usingNewStructure = fireplace.hasMantel !== undefined || fireplace.hasLegs !== undefined || fireplace.hasOverMantel !== undefined;

  if (usingNewStructure) {
    // NEW 3-PART STRUCTURE

    // 1. Mantel: Fixed labor + materials (6ft x 1ft = 6 sq ft)
    if (fireplace.hasMantel) {
      const mantelArea = 6; // 6ft x 1ft
      paintableArea += mantelArea;

      // Fixed labor
      laborCost += pricing.mantelLabor;

      // Calculate materials
      const mantelGallons = (mantelArea / pricing.wallCoverageSqFtPerGallon) * fireplace.coats;
      totalGallons += mantelGallons;
      materialCost += Math.ceil(mantelGallons) * pricing.wallPaintPerGallon;
    }

    // 2. Legs: Fixed labor + materials (6ft x 8" x 2 = 8 sq ft)
    if (fireplace.hasLegs) {
      const legsArea = 6 * (8 / 12) * 2; // 6ft tall x 8" wide x 2 legs = 8 sq ft
      paintableArea += legsArea;

      // Fixed labor
      laborCost += pricing.legsLabor;

      // Calculate materials
      const legsGallons = (legsArea / pricing.wallCoverageSqFtPerGallon) * fireplace.coats;
      totalGallons += legsGallons;
      materialCost += Math.ceil(legsGallons) * pricing.wallPaintPerGallon;
    }

    // 3. Over Mantel: Measured area (width × height, 1 side only)
    if (fireplace.hasOverMantel && fireplace.overMantelWidth && fireplace.overMantelHeight) {
      const overMantelArea = fireplace.overMantelWidth * fireplace.overMantelHeight;
      paintableArea += overMantelArea;

      // Calculate paint gallons for over mantel
      const overMantelGallons = (overMantelArea / pricing.wallCoverageSqFtPerGallon) * fireplace.coats;
      totalGallons += overMantelGallons;

      // Calculate labor cost for over mantel (area-based, like walls)
      laborCost += overMantelArea * pricing.wallLaborPerSqFt * fireplace.coats;

      // Calculate material cost for over mantel
      materialCost += Math.ceil(overMantelGallons) * pricing.wallPaintPerGallon;
    }
  } else {
    // LEGACY STRUCTURE (backward compatibility)
    paintableArea = 2 * (fireplace.width * fireplace.height);
    paintableArea += fireplace.width * fireplace.depth;
    paintableArea += fireplace.height * fireplace.depth;

    if (fireplace.hasTrim) {
      paintableArea += fireplace.trimLinearFeet * 0.5; // Average trim width
    }

    // Calculate paint gallons
    totalGallons = (paintableArea / pricing.wallCoverageSqFtPerGallon) * fireplace.coats;

    // Calculate costs
    laborCost = pricing.fireplaceLabor;
    materialCost = Math.ceil(totalGallons) * pricing.wallPaintPerGallon;
  }

  const totalPrice = laborCost + materialCost;

  return {
    paintableArea,
    totalGallons,
    laborCost,
    materialCost,
    totalPrice,
  };
}

export function calculateBrickWallMetrics(
  brickWall: BrickWall,
  pricing: PricingSettings
): BrickWallCalculations {
  // Calculate paintable area (width × height)
  const paintableArea = brickWall.width * brickWall.height;

  // Calculate primer (if included)
  let primerGallons = 0;
  let primerLaborCost = 0;
  let primerMaterialCost = 0;

  if (brickWall.includePrimer) {
    // Primer: 1 coat
    primerGallons = paintableArea / pricing.wallCoverageSqFtPerGallon;
    primerLaborCost = paintableArea * pricing.wallLaborPerSqFt;
    primerMaterialCost = Math.ceil(primerGallons) * pricing.primerPerGallon;
  }

  // Calculate paint (1 or 2 coats)
  const paintGallons = (paintableArea / pricing.wallCoverageSqFtPerGallon) * brickWall.coats;

  // Paint labor: area × labor rate × coats multiplier
  // If 2 coats, use secondCoatLaborMultiplier (default 2.0)
  const laborMultiplier = brickWall.coats === 2 ? pricing.secondCoatLaborMultiplier : 1.0;
  const paintLaborCost = paintableArea * pricing.wallLaborPerSqFt * laborMultiplier;

  const paintMaterialCost = Math.ceil(paintGallons) * pricing.wallPaintPerGallon;

  // Totals
  const totalGallons = primerGallons + paintGallons;
  const laborCost = primerLaborCost + paintLaborCost;
  const materialCost = primerMaterialCost + paintMaterialCost;
  const totalPrice = laborCost + materialCost;

  return {
    paintableArea,
    primerGallons,
    paintGallons,
    totalGallons,
    primerLaborCost,
    paintLaborCost,
    primerMaterialCost,
    paintMaterialCost,
    laborCost,
    materialCost,
    totalPrice,
  };
}

export function calculateProjectSummary(
  project: Project,
  pricing: PricingSettings
): ProjectSummary {
  let totalWallGallons = 0;
  let totalCeilingGallons = 0;
  let totalTrimGallons = 0;
  let totalDoorGallons = 0;
  let totalPrimerGallons = 0;
  let totalLaborCost = 0;
  let totalMaterialCost = 0;
  let totalDoors = 0;
  let totalWindows = 0;
  // Area totals for proper paint calculation
  let totalWallSqFt = 0;
  let totalCeilingSqFt = 0;
  let totalTrimSqFt = 0;
  let totalDoorSqFt = 0;
  const itemizedPrices: Array<{
    id: string;
    name: string;
    price: number;
    laborCost: number;
    materialsCost: number;
  }> = [];

  // Calculate room totals - only include rooms marked as included (default: true)
  (project.rooms || []).forEach((room) => {
    // Skip if room is explicitly excluded
    if (room.included === false) return;

    const calc = calculateRoomMetrics(room, pricing, project.projectCoats, project.projectIncludeClosetInteriorInQuote);
    totalWallGallons += safeNumber(calc.totalWallGallons);
    totalCeilingGallons += safeNumber(calc.totalCeilingGallons);
    totalTrimGallons += safeNumber(calc.totalTrimGallons);
    totalDoorGallons += safeNumber(calc.totalDoorGallons);
    totalLaborCost += safeNumber(calc.laborCost);
    totalMaterialCost += safeNumber(calc.materialCost);
    // Count all doors: regular doors + closet doors (with safe numbers)
    totalDoors += safeNumber(room.doorCount) + safeNumber(room.singleDoorClosets) + safeNumber(room.doubleDoorClosets);
    totalWindows += safeNumber(room.windowCount);
    // Sum areas
    totalWallSqFt += safeNumber(calc.wallSqFt);
    totalCeilingSqFt += safeNumber(calc.ceilingSqFt);
    itemizedPrices.push({
      id: room.id,
      name: room.name || "Unnamed Room",
      price: safeNumber(calc.totalPrice),
      laborCost: safeNumber(calc.laborCost),
      materialsCost: safeNumber(calc.materialCost),
    });
  });

  // Calculate staircase totals
  (project.staircases || []).forEach((staircase, index) => {
    const calc = calculateStaircaseMetrics(staircase, pricing);
    totalTrimGallons += safeNumber(calc.totalGallons);
    totalLaborCost += safeNumber(calc.laborCost);
    totalMaterialCost += safeNumber(calc.materialCost);
    itemizedPrices.push({
      id: staircase.id,
      name: `Staircase ${index + 1}`,
      price: safeNumber(calc.totalPrice),
      laborCost: safeNumber(calc.laborCost),
      materialsCost: safeNumber(calc.materialCost),
    });
  });

  // Calculate fireplace totals
  (project.fireplaces || []).forEach((fireplace, index) => {
    const calc = calculateFireplaceMetrics(fireplace, pricing);
    totalWallGallons += safeNumber(calc.totalGallons);
    totalLaborCost += safeNumber(calc.laborCost);
    totalMaterialCost += safeNumber(calc.materialCost);
    itemizedPrices.push({
      id: fireplace.id,
      name: `Fireplace ${index + 1}`,
      price: safeNumber(calc.totalPrice),
      laborCost: safeNumber(calc.laborCost),
      materialsCost: safeNumber(calc.materialCost),
    });
  });

  // Add furniture moving fee if enabled
  if (project.includeFurnitureMoving) {
    const furnitureMovingFee = safeNumber(pricing.furnitureMovingFee, 0);
    totalLaborCost += furnitureMovingFee;
    itemizedPrices.push({
      id: "furniture-moving",
      name: "Furniture Moving",
      price: furnitureMovingFee,
      laborCost: furnitureMovingFee,
      materialsCost: 0,
    });
  }

  // Add nails/screws removal fee if enabled
  if (project.includeNailsRemoval) {
    const nailsRemovalFee = safeNumber(pricing.nailsRemovalFee, 0);
    totalLaborCost += nailsRemovalFee;
    itemizedPrices.push({
      id: "nails-removal",
      name: "Nails/Screws Removal",
      price: nailsRemovalFee,
      laborCost: nailsRemovalFee,
      materialsCost: 0,
    });
  }

  // Ensure all totals are safe before final calculations
  totalWallGallons = Math.max(0, safeNumber(totalWallGallons));
  totalCeilingGallons = Math.max(0, safeNumber(totalCeilingGallons));
  totalTrimGallons = Math.max(0, safeNumber(totalTrimGallons));
  totalDoorGallons = Math.max(0, safeNumber(totalDoorGallons));
  totalLaborCost = Math.max(0, safeNumber(totalLaborCost));
  totalMaterialCost = Math.max(0, safeNumber(totalMaterialCost));

  // Calculate primer (20% of total paint)
  totalPrimerGallons = Math.max(0, safeNumber(
    (totalWallGallons + totalCeilingGallons + totalTrimGallons) * 0.2
  ));

  const grandTotal = Math.max(0, safeNumber(totalLaborCost + totalMaterialCost));

  return {
    totalWallGallons,
    totalCeilingGallons,
    totalTrimGallons,
    totalDoorGallons,
    totalPrimerGallons,
    totalLaborCost,
    totalMaterialCost,
    grandTotal,
    itemizedPrices,
    totalDoors: Math.max(0, safeNumber(totalDoors)),
    totalWindows: Math.max(0, safeNumber(totalWindows)),
    totalWallSqFt: Math.max(0, safeNumber(totalWallSqFt)),
    totalCeilingSqFt: Math.max(0, safeNumber(totalCeilingSqFt)),
    totalTrimSqFt: Math.max(0, safeNumber(totalTrimSqFt)),
    totalDoorSqFt: Math.max(0, safeNumber(totalDoorSqFt)),
  };
}

/**
 * Calculate closet statistics for project summary
 * Returns separate included and excluded closet counts and areas
 * RESPECTS quoteBuilder.includeClosets - if false, ALL closets are excluded
 */
export function calculateProjectClosetStats(
  project: Project,
  quoteBuilder?: QuoteBuilder
): {
  includedSingleClosets: number;
  includedDoubleClosets: number;
  excludedSingleClosets: number;
  excludedDoubleClosets: number;
  includedClosetWallArea: number;
  includedClosetCeilingArea: number;
  includedClosetBaseboardLF: number;
  excludedClosetWallArea: number;
  excludedClosetCeilingArea: number;
  excludedClosetBaseboardLF: number;
} {
  // Always prioritize project.quoteBuilder, then parameter, then default
  const qb = project.quoteBuilder || quoteBuilder || getDefaultQuoteBuilder();
  let includedSingleClosets = 0;
  let includedDoubleClosets = 0;
  let excludedSingleClosets = 0;
  let excludedDoubleClosets = 0;
  let includedClosetWallArea = 0;
  let includedClosetCeilingArea = 0;
  let includedClosetBaseboardLF = 0;
  let excludedClosetWallArea = 0;
  let excludedClosetCeilingArea = 0;
  let excludedClosetBaseboardLF = 0;

  (project.rooms || []).forEach((room) => {
    // Skip if room is explicitly excluded
    if (room.included === false) return;

    // Skip if room is filtered out by Quote Builder
    if (!isRoomIncludedInQuote(room, qb)) return;

    // Get floor height for this room
    let floorHeight = 8;
    if (project?.floorHeights && project.floorHeights[room.floor! - 1]) {
      floorHeight = project.floorHeights[room.floor! - 1];
    } else if (room.floor === 2 && project?.secondFloorHeight) {
      floorHeight = project.secondFloorHeight;
    } else if (project?.firstFloorHeight) {
      floorHeight = project.firstFloorHeight;
    }

    const closetMetrics = getClosetInteriorMetrics(room, floorHeight);
    const includeCloset = room.includeClosetInteriorInQuote ?? project.projectIncludeClosetInteriorInQuote ?? true;

    // HARD FILTER: If quoteBuilder.includeClosets is false, ALL closets are excluded
    if (!true) {
      // All closets go to excluded, regardless of room-level setting
      excludedSingleClosets += closetMetrics.singleCount;
      excludedDoubleClosets += closetMetrics.doubleCount;
      excludedClosetWallArea += closetMetrics.totalClosetWallArea;
      excludedClosetCeilingArea += closetMetrics.totalClosetCeilingArea;
      excludedClosetBaseboardLF += closetMetrics.totalClosetBaseboardLF;
    } else if (includeCloset) {
      // Quote Builder allows closets AND room-level setting includes them
      includedSingleClosets += closetMetrics.singleCount;
      includedDoubleClosets += closetMetrics.doubleCount;
      includedClosetWallArea += closetMetrics.totalClosetWallArea;
      includedClosetCeilingArea += closetMetrics.totalClosetCeilingArea;
      includedClosetBaseboardLF += closetMetrics.totalClosetBaseboardLF;
    } else {
      // Quote Builder allows closets BUT room-level setting excludes them
      excludedSingleClosets += closetMetrics.singleCount;
      excludedDoubleClosets += closetMetrics.doubleCount;
      excludedClosetWallArea += closetMetrics.totalClosetWallArea;
      excludedClosetCeilingArea += closetMetrics.totalClosetCeilingArea;
      excludedClosetBaseboardLF += closetMetrics.totalClosetBaseboardLF;
    }
  });

  return {
    includedSingleClosets,
    includedDoubleClosets,
    excludedSingleClosets,
    excludedDoubleClosets,
    includedClosetWallArea: Math.max(0, safeNumber(includedClosetWallArea)),
    includedClosetCeilingArea: Math.max(0, safeNumber(includedClosetCeilingArea)),
    includedClosetBaseboardLF: Math.max(0, safeNumber(includedClosetBaseboardLF)),
    excludedClosetWallArea: Math.max(0, safeNumber(excludedClosetWallArea)),
    excludedClosetCeilingArea: Math.max(0, safeNumber(excludedClosetCeilingArea)),
    excludedClosetBaseboardLF: Math.max(0, safeNumber(excludedClosetBaseboardLF)),
  };
}

/**
 * Calculate room metrics with Quote Builder filters applied at calculation stage
 * HARD FILTERS: Each toggle acts independently - if OFF, that category is completely skipped
 */
export function calculateFilteredRoomMetrics(
  room: Room,
  pricing: PricingSettings,
  projectCoats?: 1 | 2,
  projectIncludeClosetInteriorInQuote?: boolean,
  quoteBuilder?: QuoteBuilder
): RoomCalculations {
  const qb = quoteBuilder || getDefaultQuoteBuilder();
  const calcSettings = getCalculationSettings();

  // Use project-level coats if provided, otherwise use room's coats (defaults to 2)
  const coatsWalls = safeNumber(projectCoats || room.coatsWalls, 2);
  const coatsCeiling = safeNumber(projectCoats || room.coatsCeiling, 2);
  const coatsTrim = safeNumber(projectCoats || room.coatsTrim, 2);
  const coatsDoors = safeNumber(projectCoats || room.coatsDoors, 2);

  // Safe geometry values - clamp to non-negative
  // ALL VALUES STORED IN IMPERIAL (FEET) - Unit conversion happens ONLY at display time
  const length = Math.max(0, safeNumber(room.length)); // feet
  const width = Math.max(0, safeNumber(room.width)); // feet
  const height = Math.max(0, safeNumber(room.height)); // feet
  const manualArea = Math.max(0, safeNumber(room.manualArea)); // square feet

  // If manual area is provided, ALWAYS use it and ignore length/width
  const useManualArea = manualArea > 0;
  const hasLengthWidth = !useManualArea && length > 0 && width > 0;

  // PERIMETER CALCULATION: Simple formula, NO UNIT CONVERSION
  // Input: length and width in feet
  // Output: perimeter in feet
  // Example: 10m x 10m room → stored as 32.81ft x 32.81ft → perimeter = 131.23ft → displays as 40m
  const perimeter = hasLengthWidth ? 2 * (length + width) : 0;

  // Determine effective wall height based on ceiling type
  let effectiveWallHeight = height;
  const cathedralPeakHeight = safeNumber(room.cathedralPeakHeight, height);
  if (room.ceilingType === "cathedral" && cathedralPeakHeight > height) {
    effectiveWallHeight = (height + cathedralPeakHeight) / 2;
  }

  // Safe counts for windows, doors, and closets
  const windowCount = safeNumber(room.windowCount, 0);
  const doorCount = safeNumber(room.doorCount, 0);
  const singleClosets = safeNumber(room.singleDoorClosets, 0);
  const doubleClosets = safeNumber(room.doubleDoorClosets, 0);

  // ========== WALLS CALCULATION ==========
  // HARD FILTER: if includeWalls == false → wallSqFt = 0, wall paint = 0, wall labor = 0
  let wallSqFt = 0;
  if ((room.paintWalls ?? true)) {
    if (hasLengthWidth) {
      wallSqFt = perimeter * effectiveWallHeight;
    } else if (useManualArea && effectiveWallHeight > 0) {
      const estimatedPerimeter = 4 * Math.sqrt(manualArea);
      wallSqFt = estimatedPerimeter * effectiveWallHeight;
    }

    // Deduct window openings ALWAYS (physical reality)
    const windowOpeningArea = calcSettings.windowWidth * calcSettings.windowHeight;
    const windowTrimPerimeter = 2 * (calcSettings.windowWidth + calcSettings.windowHeight);
    const windowTrimArea = windowTrimPerimeter * (calcSettings.windowTrimWidth / 12);
    const windowDeduction = windowCount * (windowOpeningArea + windowTrimArea);

    // Deduct door openings ALWAYS (physical reality)
    const doorOpeningArea = calcSettings.doorHeight * calcSettings.doorWidth;
    const doorTrimPerimeter = (2 * calcSettings.doorHeight) + calcSettings.doorWidth;
    const doorTrimArea = doorTrimPerimeter * (calcSettings.doorTrimWidth / 12);
    const doorDeduction = doorCount * (doorOpeningArea + doorTrimArea);

    // Deduct closet openings ALWAYS (physical reality) - use room height for closet height
    const singleClosetOpeningArea = (calcSettings.singleClosetWidth / 12) * height;
    const singleClosetPerimeterForWall = (2 * height) + (calcSettings.singleClosetWidth / 12);
    const singleClosetTrimArea = singleClosetPerimeterForWall * (calcSettings.singleClosetTrimWidth / 12);
    const singleClosetDeduction = singleClosets * (singleClosetOpeningArea + singleClosetTrimArea);

    const doubleClosetOpeningArea = (calcSettings.doubleClosetWidth / 12) * height;
    const doubleClosetPerimeterForWall = (2 * height) + (calcSettings.doubleClosetWidth / 12);
    const doubleClosetTrimArea = doubleClosetPerimeterForWall * (calcSettings.doubleClosetTrimWidth / 12);
    const doubleClosetDeduction = doubleClosets * (doubleClosetOpeningArea + doubleClosetTrimArea);

    const closetDeduction = singleClosetDeduction + doubleClosetDeduction;

    wallSqFt = Math.max(0, safeNumber(wallSqFt - windowDeduction - doorDeduction - closetDeduction));

    // Add closet interior walls ONLY if includeClosets is true
    if (true) {
      const includeCloset = room.includeClosetInteriorInQuote ?? projectIncludeClosetInteriorInQuote ?? true;
      if (includeCloset) {
        const closetMetrics = getClosetInteriorMetrics(room, height);
        wallSqFt += closetMetrics.totalClosetWallArea;
      }
    }
  }

  // ========== CEILING CALCULATION ==========
  // HARD FILTER: if includeCeilings == false → ceilingSqFt = 0, ceiling paint = 0, ceiling labor = 0
  let ceilingSqFt = 0;
  if ((room.paintCeilings ?? true)) {
    ceilingSqFt = useManualArea ? manualArea : length * width;
    if (room.ceilingType === "cathedral") {
      if (!useManualArea && cathedralPeakHeight > height && width > 0) {
        const rise = cathedralPeakHeight - height;
        const run = width / 2;
        const slopeMultiplier = run > 0 ? Math.sqrt(1 + Math.pow(rise / run, 2)) : 1;
        ceilingSqFt *= slopeMultiplier;
      } else {
        ceilingSqFt *= getCathedralMultiplier(room);
      }
    }
    ceilingSqFt = Math.max(0, safeNumber(ceilingSqFt));

    // Add closet interior ceilings ONLY if includeClosets is true
    if (true) {
      const includeCloset = room.includeClosetInteriorInQuote ?? projectIncludeClosetInteriorInQuote ?? true;
      if (includeCloset) {
        const closetMetrics = getClosetInteriorMetrics(room, height);
        ceilingSqFt += closetMetrics.totalClosetCeilingArea;
      }
    }
  }

  // ========== BASEBOARD CALCULATION ==========
  // HARD FILTER: if includeBaseboards == false → baseboardLF = 0, baseboard paint = 0, baseboard labor = 0
  let baseboardLF = 0;
  if ((room.paintBaseboard ?? true) && room.paintBaseboard !== false) {
    const doorOpeningWidthForBaseboard = calcSettings.doorWidth + (calcSettings.doorTrimWidth * 2 / 12);
    const singleClosetOpeningWidth = (calcSettings.singleClosetWidth / 12) + (calcSettings.singleClosetTrimWidth * 2 / 12);
    const doubleClosetOpeningWidth = (calcSettings.doubleClosetWidth / 12) + (calcSettings.doubleClosetTrimWidth * 2 / 12);

    if (hasLengthWidth) {
      baseboardLF = Math.max(0, perimeter - (doorCount * doorOpeningWidthForBaseboard) - (singleClosets * singleClosetOpeningWidth) - (doubleClosets * doubleClosetOpeningWidth));
    } else if (useManualArea) {
      const estimatedPerimeter = 4 * Math.sqrt(manualArea);
      baseboardLF = Math.max(0, estimatedPerimeter - (doorCount * doorOpeningWidthForBaseboard) - (singleClosets * singleClosetOpeningWidth) - (doubleClosets * doubleClosetOpeningWidth));
    }

    // Add closet interior baseboard ONLY if includeClosets is true
    if (true) {
      const includeCloset = room.includeClosetInteriorInQuote ?? projectIncludeClosetInteriorInQuote ?? true;
      if (includeCloset) {
        const closetMetrics = getClosetInteriorMetrics(room, height);
        baseboardLF += closetMetrics.totalClosetBaseboardLF;
      }
    }
  }

  // ========== CROWN MOULDING CALCULATION ==========
  // HARD FILTER: if includeCrown == false → crownMouldingLF = 0, crown paint = 0, crown labor = 0
  let crownMouldingLF = 0;
  if (room.hasCrownMoulding && room.hasCrownMoulding) {
    if (hasLengthWidth) {
      crownMouldingLF = perimeter;
    } else if (useManualArea) {
      crownMouldingLF = 4 * Math.sqrt(manualArea);
    }
  }

  // ========== TRIM CALCULATION (window trim only - baseboards and crown are separate) ==========
  // HARD FILTER: if includeTrim == false → window trim area = 0, window trim paint = 0, window labor = 0
  let windowTrimSqFt = 0;
  if ((room.paintTrim ?? true)) {
    // Window trim - controlled by paintTrim toggle, not a separate paintWindows
    if (windowCount > 0 && room.includeWindows !== false) {
      const trimWidthFt = calcSettings.windowTrimWidth / 12;
      const windowTrimPerimeter = 2 * (calcSettings.windowWidth + calcSettings.windowHeight);
      const trimAreaPerWindow = windowTrimPerimeter * trimWidthFt;
      windowTrimSqFt += windowCount * trimAreaPerWindow;
    }
  }

  // ========== DOOR TRIM CALCULATION ==========
  // Door trim is only calculated if paintTrim is true and doors exist
  let doorTrimSqFt = 0;
  if ((room.paintTrim ?? true) && doorCount > 0 && room.includeDoors !== false) {
    const trimWidthFt = calcSettings.doorTrimWidth / 12;
    const doorTrimPerimeter = (2 * calcSettings.doorHeight) + calcSettings.doorWidth;
    const trimAreaPerDoor = doorTrimPerimeter * trimWidthFt;
    doorTrimSqFt = doorCount * trimAreaPerDoor;
  }

  // ========== CLOSET DOOR TRIM CALCULATION ==========
  // HARD FILTER: if includeClosets == false → closet trim = 0
  let closetTrimSqFt = 0;
  if (true) {
    if (singleClosets > 0) {
      const trimWidthFt = calcSettings.singleClosetTrimWidth / 12;
      // Use room height for closet perimeter
      const singleClosetPerimeter = (2 * height) + (calcSettings.singleClosetWidth / 12);
      const trimAreaPerCloset = singleClosetPerimeter * trimWidthFt;
      closetTrimSqFt += singleClosets * trimAreaPerCloset;
    }
    if (doubleClosets > 0) {
      const trimWidthFt = calcSettings.doubleClosetTrimWidth / 12;
      // Use room height for closet perimeter
      const doubleClosetPerimeter = (2 * height) + (calcSettings.doubleClosetWidth / 12);
      const trimAreaPerCloset = doubleClosetPerimeter * trimWidthFt;
      closetTrimSqFt += doubleClosets * trimAreaPerCloset;
    }
  }

  // ========== BASEBOARD TRIM AREA ==========
  let baseboardTrimSqFt = 0;
  if ((room.paintBaseboard ?? true) && room.paintBaseboard !== false) {
    const baseboardTrimWidthFt = calcSettings.baseboardWidth / 12;
    baseboardTrimSqFt = baseboardLF * baseboardTrimWidthFt;
  }

  // ========== CROWN MOULDING TRIM AREA ==========
  let crownMouldingTrimSqFt = 0;
  if (room.hasCrownMoulding && room.hasCrownMoulding) {
    const crownMouldingWidthFt = calcSettings.crownMouldingWidth / 12;
    crownMouldingTrimSqFt = crownMouldingLF * crownMouldingWidthFt;
  }

  // Total trim square footage (only what's enabled)
  const trimSqFt = Math.max(0, safeNumber(windowTrimSqFt + doorTrimSqFt + closetTrimSqFt + baseboardTrimSqFt + crownMouldingTrimSqFt));

  // ========== PAINT GALLONS CALCULATION ==========
  const wallCoverage = Math.max(1, safeNumber(pricing.wallCoverageSqFtPerGallon, 350));
  const ceilingCoverage = Math.max(1, safeNumber(pricing.ceilingCoverageSqFtPerGallon, 350));
  const trimCoverage = Math.max(1, safeNumber(pricing.trimCoverageSqFtPerGallon, 400));

  // Wall gallons - only if includeWalls
  const totalWallGallons = (room.paintWalls ?? true) ? Math.max(0, safeNumber((wallSqFt / wallCoverage) * coatsWalls)) : 0;

  // Ceiling gallons - only if includeCeilings
  const totalCeilingGallons = (room.paintCeilings ?? true) ? Math.max(0, safeNumber((ceilingSqFt / ceilingCoverage) * coatsCeiling)) : 0;

  // Trim gallons - based on what's enabled
  const totalTrimGallons = Math.max(0, safeNumber((trimSqFt / trimCoverage) * coatsTrim));

  // ========== DOOR PAINT GALLONS ==========
  // HARD FILTER: if includeDoors == false → door slab paint = 0
  // HARD FILTER: if includeJambs == false → jamb paint = 0
  let totalDoorGallons = 0;
  if (room.paintDoors && room.includeDoors !== false) {
    // Door slabs - only if includeDoors
    if ((room.paintDoors ?? false)) {
      const doorFacesSqFt = doorCount * (calcSettings.doorHeight * calcSettings.doorWidth) * 2;
      totalDoorGallons += (doorFacesSqFt * coatsDoors) / wallCoverage;
    }
    // Jambs - only if includeJambs
    if ((room.paintJambs ?? false) && room.paintJambs) {
      const jambWidthFt = safeNumber(calcSettings.doorJambWidth, 4.5) / 12;
      const jambsSqFt = doorCount * (
        (jambWidthFt * calcSettings.doorHeight * 2) +
        (jambWidthFt * calcSettings.doorWidth)
      );
      totalDoorGallons += (jambsSqFt * coatsDoors) / wallCoverage;
    }
  }
  totalDoorGallons = Math.max(0, safeNumber(totalDoorGallons));

  // ========== LABOR COSTS ==========
  // Apply secondCoatLaborMultiplier when coats > 1
  const secondCoatMultiplier = safeNumber(pricing.secondCoatLaborMultiplier, 2.0);

  // Helper to calculate labor with coat multiplier
  // For 1 coat: multiplier = 1.0
  // For 2 coats: multiplier = secondCoatLaborMultiplier (e.g., 1.5 or 2.0)
  const getCoatLaborMultiplier = (coats: number): number => {
    if (coats <= 1) return 1.0;
    return secondCoatMultiplier;
  };

  let laborCost = 0;
  const wallLaborMultiplier = getCoatLaborMultiplier(coatsWalls);
  const ceilingLaborMultiplier = getCoatLaborMultiplier(coatsCeiling);
  const trimLaborMultiplier = getCoatLaborMultiplier(coatsTrim);
  const doorLaborMultiplier = getCoatLaborMultiplier(coatsDoors);

  // Wall labor - only if includeWalls
  if ((room.paintWalls ?? true)) {
    laborCost += wallSqFt * safeNumber(pricing.wallLaborPerSqFt, 0) * wallLaborMultiplier;
  }

  // Ceiling labor - only if includeCeilings
  if ((room.paintCeilings ?? true)) {
    laborCost += ceilingSqFt * safeNumber(pricing.ceilingLaborPerSqFt, 0) * ceilingLaborMultiplier;
  }

  // Baseboard labor - only if includeBaseboards
  if ((room.paintBaseboard ?? true) && room.paintBaseboard !== false) {
    laborCost += baseboardLF * safeNumber(pricing.baseboardLaborPerLF, 0) * trimLaborMultiplier;
  }

  // Door labor - only if includeDoors OR includeJambs
  if (((room.paintDoors ?? false) || (room.paintJambs ?? false)) && room.paintDoors && room.includeDoors !== false) {
    laborCost += doorCount * safeNumber(pricing.doorLabor, 0) * doorLaborMultiplier;
  }

  // Window labor - only if painting trim and windows exist - multiply by coat multiplier
  if ((room.paintTrim ?? true) && room.includeWindows !== false && windowCount > 0) {
    laborCost += windowCount * safeNumber(pricing.windowLabor, 0) * trimLaborMultiplier;
  }

  // Closet labor - only if includeClosets
  if (true && (singleClosets > 0 || doubleClosets > 0)) {
    laborCost += (singleClosets + doubleClosets) * safeNumber(pricing.closetLabor, 0) * wallLaborMultiplier;
  }

  // Crown moulding labor - only if includeCrown
  if (room.hasCrownMoulding && room.hasCrownMoulding && crownMouldingLF > 0) {
    laborCost += crownMouldingLF * safeNumber(pricing.crownMouldingLaborPerLF, 0) * trimLaborMultiplier;
  }

  laborCost = Math.max(0, safeNumber(laborCost));

  // ========== MATERIAL COSTS ==========
  let materialCost = 0;

  // Wall paint cost - only if includeWalls
  if ((room.paintWalls ?? true)) {
    materialCost += Math.ceil(totalWallGallons) * safeNumber(pricing.wallPaintPerGallon, 0);
  }

  // Ceiling paint cost - only if includeCeilings
  if ((room.paintCeilings ?? true)) {
    materialCost += Math.ceil(totalCeilingGallons) * safeNumber(pricing.ceilingPaintPerGallon, 0);
  }

  // Trim paint cost - only if any trim category is enabled
  if ((room.paintTrim ?? true) || (room.paintBaseboard ?? true) || room.hasCrownMoulding || true) {
    materialCost += Math.ceil(totalTrimGallons) * safeNumber(pricing.trimPaintPerGallon, 0);
  }

  // Door paint cost - only if includeDoors OR includeJambs
  if ((room.paintDoors ?? false) || (room.paintJambs ?? false)) {
    materialCost += Math.ceil(totalDoorGallons) * safeNumber(pricing.doorPaintPerGallon, 0);
  }

  materialCost = Math.max(0, safeNumber(materialCost));

  const totalPrice = Math.max(0, safeNumber(laborCost + materialCost));

  return {
    wallSqFt,
    ceilingSqFt,
    baseboardLF,
    crownMouldingLF,
    totalWallGallons,
    totalCeilingGallons,
    totalTrimGallons,
    totalDoorGallons,
    laborCost,
    materialCost,
    totalPrice,
  };
}

/**
 * Calculate paint option results (Good/Better/Best)
 * Returns array of results for each enabled paint option
 */
function calculatePaintOptionResults(
  qb: QuoteBuilder,
  totalWallSqFt: number,
  baseLaborCost: number,
  baseMaterialCost: number,
  totalCeilingGallons: number,
  totalTrimGallons: number,
  totalDoorGallons: number,
  totalPrimerGallons: number,
  pricing: PricingSettings
): PaintOptionResult[] {
  const paintOptions = qb.paintOptions || getDefaultPaintOptions();
  const results: PaintOptionResult[] = [];

  // Filter to only enabled options
  const enabledOptions = paintOptions.filter(opt => opt.enabled);

  if (enabledOptions.length === 0) {
    // No options enabled, return empty array
    return results;
  }

  enabledOptions.forEach(opt => {
    // Calculate wall gallons based on this paint option's coverage
    const wallGallons = totalWallSqFt / opt.coverageSqFt;
    const wallGallonsRounded = Math.ceil(wallGallons * 10) / 10;

    // Calculate wall paint cost with markup
    const wallPaintCost = wallGallonsRounded * opt.pricePerGallon * opt.materialMarkup;

    // Calculate labor cost with multiplier
    const laborCost = baseLaborCost * opt.laborMultiplier;

    // Calculate non-wall materials (ceiling, trim, door, primer)
    // These use the standard pricing, not the paint option pricing
    // Note: These totals have already been filtered by room-level paint settings
    let nonWallMaterialsCost = 0;

    if (totalCeilingGallons > 0) {
      nonWallMaterialsCost += Math.ceil(totalCeilingGallons) * safeNumber(pricing.ceilingPaintPerGallon, 0);
    }

    if (totalTrimGallons > 0) {
      nonWallMaterialsCost += Math.ceil(totalTrimGallons) * safeNumber(pricing.trimPaintPerGallon, 0);
    }

    if (totalDoorGallons > 0) {
      nonWallMaterialsCost += Math.ceil(totalDoorGallons) * safeNumber(pricing.doorPaintPerGallon, 0);
    }

    if (qb.includePrimer) {
      nonWallMaterialsCost += Math.ceil(totalPrimerGallons) * safeNumber(pricing.primerPerGallon, 0);
    }

    // Calculate total for this paint option
    const total = laborCost + wallPaintCost + nonWallMaterialsCost;

    results.push({
      optionId: opt.id,
      optionName: opt.name,
      notes: opt.notes,
      wallGallons: wallGallonsRounded,
      wallPaintCost: Math.max(0, safeNumber(wallPaintCost)),
      laborCost: Math.max(0, safeNumber(laborCost)),
      nonWallMaterialsCost: Math.max(0, safeNumber(nonWallMaterialsCost)),
      total: Math.max(0, safeNumber(total))
    });
  });

  return results;
}

/**
 * Calculate project summary with Quote Builder filters applied
 * This creates a filtered quote without modifying the underlying project
 * Filters are applied BEFORE calculations, not after
 */
export function calculateFilteredProjectSummary(
  project: Project,
  pricing: PricingSettings,
  quoteBuilder?: QuoteBuilder
): ProjectSummary {
  // IMPORTANT: Prioritize passed quoteBuilder parameter first!
  // This allows callers to pass the active quote's QB for consistency
  // Fallback chain: passed param -> project.quoteBuilder -> default
  const qb = quoteBuilder || project.quoteBuilder || getDefaultQuoteBuilder();

  console.log("[calculateFilteredProjectSummary] QB settings:", {
    includeAllRooms: qb.includeAllRooms,
    includedRoomIds: qb.includedRoomIds,
    totalRooms: project.rooms?.length || 0,
  });

  // 1. RESOLVE ACTIVE ROOMS - Filter by room selection FIRST
  let activeRooms: Room[] = [];

  if (qb.includeAllRooms === true) {
    // Include all rooms from project
    activeRooms = project.rooms || [];
    console.log("[calculateFilteredProjectSummary] Including ALL rooms:", activeRooms.length);
  } else {
    // Filter to only included room IDs
    activeRooms = (project.rooms || []).filter(r =>
      qb.includedRoomIds?.includes(r.id)
    );
    console.log("[calculateFilteredProjectSummary] Filtered to selected rooms:", {
      selectedCount: activeRooms.length,
      selectedRoomNames: activeRooms.map(r => r.name),
    });
  }

  // REMOVED: Early return that prevented staircases/fireplaces from being calculated
  // when there are no rooms. Staircases/fireplaces should still be included even if
  // the project has no rooms yet.
  if (activeRooms.length === 0) {
    console.log("[calculateFilteredProjectSummary] ⚠️ NO ROOMS - Will still process staircases/fireplaces");
  }

  // 2. AGGREGATE PER-ROOM METRICS - Now iterate only over active rooms
  let totalWallGallons = 0;
  let totalCeilingGallons = 0;
  let totalTrimGallons = 0;
  let totalDoorGallons = 0;
  let totalPrimerGallons = 0;
  let totalLaborCost = 0;
  let totalMaterialCost = 0;
  let totalDoors = 0;
  let totalWindows = 0;
  let totalWallSqFt = 0;
  let totalCeilingSqFt = 0;
  let totalTrimSqFt = 0;
  let totalDoorSqFt = 0;
  const itemizedPrices: Array<{
    id: string;
    name: string;
    price: number;
    laborCost: number;
    materialsCost: number;
  }> = [];

  let processedRoomCount = 0;

  // Calculate room totals with Quote Builder filters applied at calculation stage
  activeRooms.forEach((room) => {
    // Skip if room is explicitly excluded at room level
    if (room.included === false) {
      console.log("[calculateFilteredProjectSummary] Skipping room:", room.name, "- explicitly excluded (room.included=false)");
      return;
    }

    // Check floor-level filter (room IDs already filtered above)
    const floor = room.floor || 1;
    const floorKey = `includeFloor${floor}` as keyof QuoteBuilder;
    if (qb[floorKey] === false) {
      console.log("[calculateFilteredProjectSummary] Skipping room:", room.name, `- floor ${floor} excluded by QB`);
      return;
    }

    processedRoomCount++;
    console.log("[calculateFilteredProjectSummary] Processing room:", room.name, `(${processedRoomCount})`);

    // COMBINED RULE: Use centralized pricing summary (SINGLE SOURCE OF TRUTH)
    // This ensures room totals respect BOTH room-level toggles AND quote-level toggles
    const pricingSummary = computeRoomPricingSummary(
      room,
      qb,
      pricing,
      project.projectCoats,
      project.projectIncludeClosetInteriorInQuote
    );

    // Use UI-DISPLAYED values to match what user sees in Room Editor
    const roomLaborCost = safeNumber(pricingSummary.laborDisplayed);
    const roomMaterialCost = safeNumber(pricingSummary.materialsDisplayed);
    const roomTotalPrice = safeNumber(pricingSummary.totalDisplayed);

    console.log("[calculateFilteredProjectSummary] Room totals with COMBINED RULE (UI-DISPLAYED):", room.name, {
      labor: roomLaborCost.toFixed(2),
      materials: roomMaterialCost.toFixed(2),
      total: roomTotalPrice.toFixed(0), // totalDisplayed is already rounded to integer
    });

    totalLaborCost += roomLaborCost;
    totalMaterialCost += roomMaterialCost;

    // Aggregate gallons and areas using the combined-rule calculation
    totalWallGallons += safeNumber(pricingSummary.wallPaintGallons);
    totalCeilingGallons += safeNumber(pricingSummary.ceilingPaintGallons);
    totalTrimGallons += safeNumber(pricingSummary.trimPaintGallons);
    totalDoorGallons += safeNumber(pricingSummary.doorPaintGallons);

    // Count doors and windows - ALWAYS show true physical counts regardless of toggles
    // Quote Builder toggles only affect PAINT AREAS, not object counts
    totalDoors += safeNumber(room.doorCount);
    totalDoors += safeNumber(room.singleDoorClosets) + safeNumber(room.doubleDoorClosets);
    totalWindows += safeNumber(room.windowCount);

    // Sum areas (already zeroed if excluded by combined rule)
    totalWallSqFt += safeNumber(pricingSummary.wallArea);
    totalCeilingSqFt += safeNumber(pricingSummary.ceilingArea);

    itemizedPrices.push({
      id: room.id,
      name: room.name || "Unnamed Room",
      price: roomTotalPrice,
      laborCost: roomLaborCost,
      materialsCost: roomMaterialCost,
    });
  });

  // Calculate staircase totals (if included) - defaults to true if undefined
  console.log("[STAIRCASE DEBUG]", {
    includeStaircases: qb.includeStaircases,
    willInclude: qb.includeStaircases !== false,
    staircaseCount: (project.staircases || []).length,
    staircases: project.staircases
  });
  if (qb.includeStaircases !== false) {
    (project.staircases || []).forEach((staircase, index) => {
      const pricingSummary = computeStaircasePricingSummary(staircase, pricing, project.projectCoats);
      console.log(`[STAIRCASE ${index + 1}]`, {
        riserCount: staircase.riserCount,
        handrailLength: staircase.handrailLength,
        spindleCount: staircase.spindleCount,
        laborCost: pricingSummary.laborDisplayed,
        materialsCost: pricingSummary.materialsDisplayed,
        totalCost: pricingSummary.totalDisplayed
      });
      // Add gallons by paint type
      totalTrimGallons += safeNumber(pricingSummary.trimGallons);
      totalWallGallons += safeNumber(pricingSummary.wallGallons);
      totalCeilingGallons += safeNumber(pricingSummary.ceilingGallons);
      totalLaborCost += safeNumber(pricingSummary.laborDisplayed);
      totalMaterialCost += safeNumber(pricingSummary.materialsDisplayed);
      itemizedPrices.push({
        id: staircase.id,
        name: `Staircase ${index + 1}`,
        price: safeNumber(pricingSummary.totalDisplayed),
        laborCost: safeNumber(pricingSummary.laborDisplayed),
        materialsCost: safeNumber(pricingSummary.materialsDisplayed),
      });
    });
  }

  // Calculate fireplace totals (if included) - defaults to true if undefined
  console.log("[FIREPLACE DEBUG]", {
    includeFireplaces: qb.includeFireplaces,
    willInclude: qb.includeFireplaces !== false,
    fireplaceCount: (project.fireplaces || []).length,
    fireplaces: project.fireplaces
  });
  if (qb.includeFireplaces !== false) {
    (project.fireplaces || []).forEach((fireplace, index) => {
      const pricingSummary = computeFireplacePricingSummary(fireplace, pricing);
      console.log(`[FIREPLACE ${index + 1}]`, {
        width: fireplace.width,
        height: fireplace.height,
        depth: fireplace.depth,
        laborCost: pricingSummary.laborDisplayed,
        materialsCost: pricingSummary.materialsDisplayed,
        totalCost: pricingSummary.totalDisplayed
      });
      totalWallGallons += safeNumber(pricingSummary.totalGallons);
      totalLaborCost += safeNumber(pricingSummary.laborDisplayed);
      totalMaterialCost += safeNumber(pricingSummary.materialsDisplayed);
      itemizedPrices.push({
        id: fireplace.id,
        name: `Fireplace ${index + 1}`,
        price: safeNumber(pricingSummary.totalDisplayed),
        laborCost: safeNumber(pricingSummary.laborDisplayed),
        materialsCost: safeNumber(pricingSummary.materialsDisplayed),
      });
    });
  }

  // Calculate built-in totals (if included)
  // NOTE: Built-ins don't have a pricing summary function yet, so we skip them for now
  // TODO: Implement computeBuiltInPricingSummary() and add calculation here
  if (qb.includeBuiltIns && project.builtIns) {
    // Placeholder for when built-in pricing is implemented
    console.log("[calculateFilteredProjectSummary] Built-ins exist but pricing not yet implemented:", project.builtIns.length);
  }

  // Calculate brick wall totals
  console.log("[calculateFilteredProjectSummary] Processing brick walls:", {
    brickWallCount: (project.brickWalls || []).length,
    brickWalls: project.brickWalls
  });
  (project.brickWalls || []).forEach((brickWall, index) => {
    const pricingSummary = computeBrickWallPricingSummary(brickWall, pricing);
    console.log(`[BRICK WALL ${index + 1}]`, {
      width: brickWall.width,
      height: brickWall.height,
      includePrimer: brickWall.includePrimer,
      coats: brickWall.coats,
      laborCost: pricingSummary.laborDisplayed,
      materialsCost: pricingSummary.materialsDisplayed,
      totalCost: pricingSummary.totalDisplayed
    });
    // Add primer gallons to total
    totalPrimerGallons += safeNumber(pricingSummary.primerGallons);
    // Add paint gallons to wall gallons
    totalWallGallons += safeNumber(pricingSummary.paintGallons);
    totalLaborCost += safeNumber(pricingSummary.laborDisplayed);
    totalMaterialCost += safeNumber(pricingSummary.materialsDisplayed);
    itemizedPrices.push({
      id: brickWall.id,
      name: brickWall.name || `Brick Wall ${index + 1}`,
      price: safeNumber(pricingSummary.totalDisplayed),
      laborCost: safeNumber(pricingSummary.laborDisplayed),
      materialsCost: safeNumber(pricingSummary.materialsDisplayed),
    });
  });

  // Add furniture moving fee if enabled
  if (project.includeFurnitureMoving) {
    const furnitureMovingFee = safeNumber(pricing.furnitureMovingFee, 0);
    totalLaborCost += furnitureMovingFee;
    itemizedPrices.push({
      id: "furniture-moving",
      name: "Furniture Moving",
      price: furnitureMovingFee,
      laborCost: furnitureMovingFee,
      materialsCost: 0,
    });
  }

  // Add nails/screws removal fee if enabled
  if (project.includeNailsRemoval) {
    const nailsRemovalFee = safeNumber(pricing.nailsRemovalFee, 0);
    totalLaborCost += nailsRemovalFee;
    itemizedPrices.push({
      id: "nails-removal",
      name: "Nails/Screws Removal",
      price: nailsRemovalFee,
      laborCost: nailsRemovalFee,
      materialsCost: 0,
    });
  }

  // Ensure all totals are safe
  totalWallGallons = Math.max(0, safeNumber(totalWallGallons));
  totalCeilingGallons = Math.max(0, safeNumber(totalCeilingGallons));
  totalTrimGallons = Math.max(0, safeNumber(totalTrimGallons));
  totalDoorGallons = Math.max(0, safeNumber(totalDoorGallons));
  totalLaborCost = Math.max(0, safeNumber(totalLaborCost));
  totalMaterialCost = Math.max(0, safeNumber(totalMaterialCost));

  // Calculate primer (20% of total paint) - only for categories that have gallons
  // Note: These totals have already been filtered by room-level paint settings
  let primerBase = 0;
  if (totalWallGallons > 0) primerBase += totalWallGallons;
  if (totalCeilingGallons > 0) primerBase += totalCeilingGallons;
  if (totalTrimGallons > 0) primerBase += totalTrimGallons;

  // Apply includePrimer filter
  totalPrimerGallons = qb.includePrimer
    ? Math.max(0, safeNumber(primerBase * 0.2))
    : 0;

  const grandTotal = Math.max(0, safeNumber(totalLaborCost + totalMaterialCost));

  console.log("[calculateFilteredProjectSummary] Final results:", {
    processedRoomCount,
    totalWallGallons: totalWallGallons.toFixed(2),
    totalCeilingGallons: totalCeilingGallons.toFixed(2),
    grandTotal: grandTotal.toFixed(2),
  });

  // Calculate paint option results (Good/Better/Best)
  const paintOptionResults = calculatePaintOptionResults(
    qb,
    totalWallSqFt,
    totalLaborCost,
    totalMaterialCost,
    totalCeilingGallons,
    totalTrimGallons,
    totalDoorGallons,
    totalPrimerGallons,
    pricing
  );

  return {
    totalWallGallons,
    totalCeilingGallons,
    totalTrimGallons,
    totalDoorGallons,
    totalPrimerGallons,
    totalLaborCost,
    totalMaterialCost,
    grandTotal,
    itemizedPrices,
    totalDoors: Math.max(0, safeNumber(totalDoors)),
    totalWindows: Math.max(0, safeNumber(totalWindows)),
    totalWallSqFt: Math.max(0, safeNumber(totalWallSqFt)),
    totalCeilingSqFt: Math.max(0, safeNumber(totalCeilingSqFt)),
    totalTrimSqFt: Math.max(0, safeNumber(totalTrimSqFt)),
    totalDoorSqFt: Math.max(0, safeNumber(totalDoorSqFt)),
    paintOptionResults,
  };
}

export function formatCurrency(amount: number): string {
  // NO ROUNDING - values passed here are already rounded by the pricing engine
  // This function ONLY adds currency symbol and thousand separators
  const safeAmount = safeNumber(amount, 0);
  return `$${safeAmount.toLocaleString()}`;
}

export function formatMeasurement(value: number, unit: string = "ft"): string {
  const safeValue = safeNumber(value, 0);
  return `${safeValue.toFixed(2)} ${unit}`;
}

export function formatGallons(gallons: number): string {
  const safeGallons = safeNumber(gallons, 0);
  return `${Math.ceil(safeGallons)} gal`;
}

// Calculate paint purchase breakdown (5-gallon buckets + single gallons)
// PRIORITIZES 5-gallon buckets first
export function calculatePaintPurchase(totalGallons: number): {
  fiveGallonBuckets: number;
  singleGallons: number;
  totalGallonsToPurchase: number;
} {
  // Guard against invalid input
  const safeGallons = Math.max(0, safeNumber(totalGallons, 0));

  // If gallons is 0 or extremely small, return zeros
  if (safeGallons <= 0) {
    return { fiveGallonBuckets: 0, singleGallons: 0, totalGallonsToPurchase: 0 };
  }

  const fiveGallonBuckets = Math.floor(safeGallons / 5);
  const remainingGallons = safeGallons - (fiveGallonBuckets * 5);
  const singleGallons = Math.ceil(remainingGallons);

  return {
    fiveGallonBuckets,
    singleGallons,
    totalGallonsToPurchase: (fiveGallonBuckets * 5) + singleGallons,
  };
}

// Calculate optimized bucket purchase breakdown for project
// Takes the sum of all room gallons (as decimals) and optimizes bucket purchasing
export function calculateOptimizedBuckets(
  wallGallons: number,
  ceilingGallons: number,
  trimGallons: number,
  doorGallons: number
): {
  wall: { fiveGal: number; singleGal: number; total: number };
  ceiling: { fiveGal: number; singleGal: number; total: number };
  trim: { fiveGal: number; singleGal: number; total: number };
  door: { fiveGal: number; singleGal: number; total: number };
} {
  const wallPurchase = calculatePaintPurchase(wallGallons);
  const ceilingPurchase = calculatePaintPurchase(ceilingGallons);
  const trimPurchase = calculatePaintPurchase(trimGallons);
  const doorPurchase = calculatePaintPurchase(doorGallons);

  return {
    wall: {
      fiveGal: wallPurchase.fiveGallonBuckets,
      singleGal: wallPurchase.singleGallons,
      total: wallPurchase.totalGallonsToPurchase,
    },
    ceiling: {
      fiveGal: ceilingPurchase.fiveGallonBuckets,
      singleGal: ceilingPurchase.singleGallons,
      total: ceilingPurchase.totalGallonsToPurchase,
    },
    trim: {
      fiveGal: trimPurchase.fiveGallonBuckets,
      singleGal: trimPurchase.singleGallons,
      total: trimPurchase.totalGallonsToPurchase,
    },
    door: {
      fiveGal: doorPurchase.fiveGallonBuckets,
      singleGal: doorPurchase.singleGallons,
      total: doorPurchase.totalGallonsToPurchase,
    },
  };
}

// Calculate cost for paint purchase
export function calculatePaintCost(
  totalGallons: number,
  perGallonPrice: number,
  per5GallonPrice?: number
): number {
  // Guard against invalid input
  const safeGallons = Math.max(0, safeNumber(totalGallons, 0));
  const safePerGallon = Math.max(0, safeNumber(perGallonPrice, 0));
  const safePer5Gallon = per5GallonPrice != null ? Math.max(0, safeNumber(per5GallonPrice, 0)) : 0;

  // If no 5-gallon price or it's invalid, just use per-gallon price
  if (!safePer5Gallon) {
    return Math.max(0, safeNumber(Math.ceil(safeGallons) * safePerGallon));
  }

  const purchase = calculatePaintPurchase(safeGallons);
  const cost = (purchase.fiveGallonBuckets * safePer5Gallon) + (purchase.singleGallons * safePerGallon);
  return Math.max(0, safeNumber(cost));
}
