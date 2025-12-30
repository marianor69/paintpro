/**
 * Centralized Pricing Summary Module
 *
 * This module provides the SINGLE SOURCE OF TRUTH for all room, staircase, and fireplace pricing calculations.
 * It implements the COMBINED RULE: a category is included ONLY if BOTH room-level AND quote-level toggles are ON.
 *
 * Used by:
 * - RoomEditorScreen (room preview totals)
 * - MaterialsSummaryScreen / Contractor View (breakdown)
 * - ClientProposalScreen (proposal generation)
 * - ProjectDetailScreen (Room Details test export)
 */

import { Room, Staircase, Fireplace, PricingSettings, QuoteBuilder } from "../types/painting";
import {
  safeNumber,
  getClosetInteriorMetrics,
  getCathedralMultiplier
} from "./calculations";
import { useCalculationSettings } from "../state/calculationStore";
import {
  computeResolvedInclusions,
  ResolvedInclusions,
  validateResolvedInclusions
} from "./inclusionResolver";

// ============================================================================
// INTERFACES
// ============================================================================

export interface RoomPricingSummary {
  id: string;
  name: string;
  floor: number | null;
  includeInQuote: boolean;

  // Areas & quantities
  wallArea: number;
  ceilingArea: number;
  baseboardLF: number;
  crownMouldingLF: number;
  closetWallArea: number;
  closetCeilingArea: number;
  closetBaseboardLF: number;
  windowsCount: number;
  doorsCount: number;
  singleDoorClosets: number;
  doubleDoorClosets: number;

  // Coats
  coatsWalls: number;
  coatsCeiling: number;
  coatsTrim: number;
  coatsDoors: number;

  // Paint usage (raw gallons, before bucket optimization)
  wallPaintGallons: number;
  ceilingPaintGallons: number;
  trimPaintGallons: number;
  doorPaintGallons: number;
  primerGallons: number;

  // Pricing (raw values for internal use)
  laborCost: number;
  materialsCost: number;
  totalCost: number;

  // UI-DISPLAYED VALUES (what user sees in Room Summary)
  // These match exactly what's shown in the UI after rounding/formatting
  laborDisplayed: number;      // laborCost.toFixed(2) parsed back to number
  materialsDisplayed: number;   // materialsCost.toFixed(2) parsed back to number
  totalDisplayed: number;       // Math.round(totalCost)

  // RESOLVED INCLUSIONS (single source of truth for what's included)
  resolvedInclusions: ResolvedInclusions;

  // Debug flags (deprecated - use resolvedInclusions instead)
  includedWalls: boolean;
  includedCeilings: boolean;
  includedTrim: boolean;
  includedDoors: boolean;
  includedWindows: boolean;
  includedBaseboards: boolean;
  includedClosets: boolean;
}

export interface StaircasePricingSummary {
  id: string;
  riserCount: number;
  spindleCount: number;
  handrailLength: number;
  hasSecondaryStairwell: boolean;
  doubleSidedWalls: boolean;
  paintableArea: number;
  // Breakdown by paint type
  trimArea: number;       // Risers, spindles, handrails
  wallArea: number;       // Stairwell walls
  ceilingArea: number;    // Stairwell ceiling
  // Gallons by paint type
  trimGallons: number;
  wallGallons: number;
  ceilingGallons: number;
  totalGallons: number;

  // Pricing (raw values for internal use)
  laborCost: number;
  materialsCost: number;
  totalCost: number;

  // UI-DISPLAYED VALUES (match what user sees in Staircase Summary after rounding/formatting)
  laborDisplayed: number;      // laborCost.toFixed(2) parsed back to number
  materialsDisplayed: number;   // materialsCost.toFixed(2) parsed back to number
  totalDisplayed: number;       // Math.round(totalCost)
}

export interface FireplacePricingSummary {
  id: string;
  width: number;
  height: number;
  depth: number;
  hasTrim: boolean;
  trimLinearFeet: number;
  paintableArea: number;
  totalGallons: number;

  // Pricing (raw values for internal use)
  laborCost: number;
  materialsCost: number;
  totalCost: number;

  // UI-DISPLAYED VALUES (match what user sees in Fireplace Summary after rounding/formatting)
  laborDisplayed: number;      // laborCost.toFixed(2) parsed back to number
  materialsDisplayed: number;   // materialsCost.toFixed(2) parsed back to number
  totalDisplayed: number;       // Math.round(totalCost)
}

// ============================================================================
// ROOM PRICING CALCULATION (COMBINED RULE)
// ============================================================================

/**
 * Compute complete pricing summary for a room using the COMBINED AND RULE.
 *
 * COMBINED AND RULE: A category is included ONLY if BOTH room toggle AND QB toggle are true
 *   1. room.paint[X] = false → EXCLUDED (regardless of QB)
 *   2. room.paint[X] = true AND quoteBuilder.include[X] = true → INCLUDED
 *   3. room.paint[X] = true AND quoteBuilder.include[X] = false → EXCLUDED
 *   4. room.paint[X] = undefined → defaults to true, then applies QB toggle
 *
 * This is the SINGLE SOURCE OF TRUTH used by:
 * - Room Editor preview
 * - Contractor View
 * - Client Proposal
 * - Room Details test export
 */
export function computeRoomPricingSummary(
  room: Room,
  quoteBuilder: QuoteBuilder,
  pricing: PricingSettings,
  projectCoats?: 1 | 2,
  projectIncludeClosetInteriorInQuote?: boolean
): RoomPricingSummary {
  const calcSettings = useCalculationSettings.getState().settings;

  // Compute resolved inclusions using the hierarchy
  const resolvedInclusions = computeResolvedInclusions(
    room,
    quoteBuilder,
    projectIncludeClosetInteriorInQuote
  );

  // Extract resolved values for easier access
  const includedWalls = resolvedInclusions.walls;
  const includedCeilings = resolvedInclusions.ceilings;
  const includedTrim = resolvedInclusions.trim;
  const includedDoors = resolvedInclusions.doors;
  const includedWindows = resolvedInclusions.windows;
  const includedBaseboards = resolvedInclusions.baseboards;
  const includedClosets = resolvedInclusions.closetInteriors;

  // Get coats - project-level coats override room-level for all categories
  const coatsWalls = safeNumber(projectCoats || room.coatsWalls, 2);
  const coatsCeiling = safeNumber(projectCoats || room.coatsCeiling, 2);
  const coatsTrim = safeNumber(projectCoats || room.coatsTrim, 2);
  const coatsDoors = safeNumber(projectCoats || room.coatsDoors, 2);

  // Get geometry - ALL VALUES STORED IN IMPERIAL (FEET)
  // Unit conversion happens ONLY at display time, never during calculation
  const length = Math.max(0, safeNumber(room.length)); // feet
  const width = Math.max(0, safeNumber(room.width)); // feet
  const height = Math.max(0, safeNumber(room.height)); // feet
  const manualArea = Math.max(0, safeNumber(room.manualArea)); // square feet

  const useManualArea = manualArea > 0;
  const hasLengthWidth = !useManualArea && length > 0 && width > 0;

  // PERIMETER CALCULATION: Simple formula, NO UNIT CONVERSION
  // Input: length and width in feet
  // Output: perimeter in feet
  // Example: 10m x 10m room → stored as 32.81ft x 32.81ft → perimeter = 131.23ft → displays as 40m
  const perimeter = hasLengthWidth ? 2 * (length + width) : 0;
  console.log("[pricingSummary] Room:", room.name, "| length:", length, "ft, width:", width, "ft | perimeter:", perimeter, "ft");

  // Calculate effective wall height (for cathedral ceilings)
  let effectiveWallHeight = height;
  const cathedralPeakHeight = safeNumber(room.cathedralPeakHeight, height);
  if (room.ceilingType === "cathedral" && cathedralPeakHeight > height) {
    effectiveWallHeight = (height + cathedralPeakHeight) / 2;
  }

  // Calculate wall area
  let wallArea = 0;
  if (hasLengthWidth) {
    wallArea = perimeter * effectiveWallHeight;
  } else if (useManualArea && effectiveWallHeight > 0) {
    const estimatedPerimeter = 4 * Math.sqrt(manualArea);
    wallArea = estimatedPerimeter * effectiveWallHeight;
  }

  // Counts
  const windowCount = safeNumber(room.windowCount, 0);
  const doorCount = safeNumber(room.doorCount, 0);
  const singleClosets = safeNumber(room.singleDoorClosets, 0);
  const doubleClosets = safeNumber(room.doubleDoorClosets, 0);

  // Deduct window openings (only if windows are included in old logic - now always deduct)
  let windowDeduction = 0;
  if (room.includeWindows !== false) {
    const windowOpeningArea = calcSettings.windowWidth * calcSettings.windowHeight;
    const windowTrimPerimeter = 2 * (calcSettings.windowWidth + calcSettings.windowHeight);
    const windowTrimArea = windowTrimPerimeter * (calcSettings.windowTrimWidth / 12);
    windowDeduction = windowCount * (windowOpeningArea + windowTrimArea);
  }

  // Deduct door openings
  let doorDeduction = 0;
  if (room.includeDoors !== false) {
    const doorOpeningArea = calcSettings.doorHeight * calcSettings.doorWidth;
    const doorTrimPerimeter = (2 * calcSettings.doorHeight) + calcSettings.doorWidth;
    const doorTrimArea = doorTrimPerimeter * (calcSettings.doorTrimWidth / 12);
    doorDeduction = doorCount * (doorOpeningArea + doorTrimArea);
  }

  // Deduct closet openings - use room height for closet height
  const singleClosetOpeningArea = (calcSettings.singleClosetWidth / 12) * height;
  const singleClosetPerimeterForWall = (2 * height) + (calcSettings.singleClosetWidth / 12);
  const singleClosetTrimArea = singleClosetPerimeterForWall * (calcSettings.singleClosetTrimWidth / 12);
  const singleClosetDeduction = singleClosets * (singleClosetOpeningArea + singleClosetTrimArea);

  const doubleClosetOpeningArea = (calcSettings.doubleClosetWidth / 12) * height;
  const doubleClosetPerimeterForWall = (2 * height) + (calcSettings.doubleClosetWidth / 12);
  const doubleClosetTrimArea = doubleClosetPerimeterForWall * (calcSettings.doubleClosetTrimWidth / 12);
  const doubleClosetDeduction = doubleClosets * (doubleClosetOpeningArea + doubleClosetTrimArea);

  const closetDeduction = singleClosetDeduction + doubleClosetDeduction;

  wallArea = Math.max(0, safeNumber(wallArea - windowDeduction - doorDeduction - closetDeduction));

  // Calculate ceiling area
  let ceilingArea = useManualArea ? manualArea : length * width;
  if (room.ceilingType === "cathedral") {
    ceilingArea *= getCathedralMultiplier(room);
  }
  ceilingArea = Math.max(0, safeNumber(ceilingArea));

  // Calculate closet interior metrics
  const closetMetrics = getClosetInteriorMetrics(room, height);
  let closetWallArea = 0;
  let closetCeilingArea = 0;
  let closetBaseboardLF = 0;

  if (includedClosets) {
    closetWallArea = closetMetrics.totalClosetWallArea;
    closetCeilingArea = closetMetrics.totalClosetCeilingArea;
    closetBaseboardLF = closetMetrics.totalClosetBaseboardLF;
    wallArea += closetWallArea;
    ceilingArea += closetCeilingArea;
  }

  // Calculate baseboard LF (linear feet) - ALWAYS IN FEET
  // Baseboard = perimeter minus door/closet openings
  // All calculation settings (door width, trim width) are in imperial units (feet/inches)
  let baseboardLF = 0;
  if (includedBaseboards && room.includeTrim !== false) {
    const doorOpeningWidthForBaseboard = calcSettings.doorWidth + (calcSettings.doorTrimWidth * 2 / 12); // feet
    const singleClosetOpeningWidth = (calcSettings.singleClosetWidth / 12) + (calcSettings.singleClosetTrimWidth * 2 / 12); // feet
    const doubleClosetOpeningWidth = (calcSettings.doubleClosetWidth / 12) + (calcSettings.doubleClosetTrimWidth * 2 / 12); // feet

    if (hasLengthWidth) {
      // Use perimeter (in feet) minus opening widths (in feet) = result in feet
      baseboardLF = Math.max(0, perimeter - (doorCount * doorOpeningWidthForBaseboard) - (singleClosets * singleClosetOpeningWidth) - (doubleClosets * doubleClosetOpeningWidth));
    } else if (useManualArea) {
      const estimatedPerimeter = 4 * Math.sqrt(manualArea); // feet
      baseboardLF = Math.max(0, estimatedPerimeter - (doorCount * doorOpeningWidthForBaseboard) - (singleClosets * singleClosetOpeningWidth) - (doubleClosets * doubleClosetOpeningWidth));
    }

    if (includedClosets) {
      baseboardLF += closetBaseboardLF; // feet
    }
  }

  // Calculate trim area for windows, doors, closets
  let windowDoorTrimSqFt = 0;
  let windowTrimSqFt = 0; // Track window trim separately for proper paint calculation

  // Window trim (if painting windows - independent of general trim toggle)
  if (includedWindows && windowCount > 0 && room.includeWindows !== false) {
    const trimWidthFt = calcSettings.windowTrimWidth / 12;
    const windowTrimPerimeter = 2 * (calcSettings.windowWidth + calcSettings.windowHeight);
    const trimAreaPerWindow = windowTrimPerimeter * trimWidthFt;
    windowTrimSqFt = windowCount * trimAreaPerWindow;
    windowDoorTrimSqFt += windowTrimSqFt;
  }

  // Door trim (if painting doors AND doors/trim included)
  if (includedDoors && doorCount > 0 && room.includeDoors !== false && room.includeTrim !== false) {
    const trimWidthFt = calcSettings.doorTrimWidth / 12;
    const doorTrimPerimeter = (2 * calcSettings.doorHeight) + calcSettings.doorWidth;
    const trimAreaPerDoor = doorTrimPerimeter * trimWidthFt;
    windowDoorTrimSqFt += doorCount * trimAreaPerDoor;
  }

  // Closet door trim (if trim included)
  if (includedTrim && room.includeTrim !== false) {
    if (singleClosets > 0) {
      const trimWidthFt = calcSettings.singleClosetTrimWidth / 12;
      // Use room height for closet perimeter
      const singleClosetPerimeter = (2 * height) + (calcSettings.singleClosetWidth / 12);
      const trimAreaPerCloset = singleClosetPerimeter * trimWidthFt;
      windowDoorTrimSqFt += singleClosets * trimAreaPerCloset;
    }

    if (doubleClosets > 0) {
      const trimWidthFt = calcSettings.doubleClosetTrimWidth / 12;
      // Use room height for closet perimeter
      const doubleClosetPerimeter = (2 * height) + (calcSettings.doubleClosetWidth / 12);
      const trimAreaPerCloset = doubleClosetPerimeter * trimWidthFt;
      windowDoorTrimSqFt += doubleClosets * trimAreaPerCloset;
    }
  }

  // Baseboard trim area (if baseboards/trim included)
  let baseboardTrimSqFt = 0;
  if (includedBaseboards && room.includeTrim !== false) {
    const baseboardTrimWidthFt = calcSettings.baseboardWidth / 12;
    baseboardTrimSqFt = baseboardLF * baseboardTrimWidthFt;
  }

  // Crown moulding (if trim included) - ALWAYS IN FEET
  // Crown molding runs along the full perimeter of the room
  let crownMouldingLF = 0;
  let crownMouldingTrimSqFt = 0;
  if (room.hasCrownMoulding && includedTrim && room.includeTrim !== false) {
    if (hasLengthWidth) {
      crownMouldingLF = perimeter; // feet (same as perimeter)
    } else if (useManualArea) {
      crownMouldingLF = 4 * Math.sqrt(manualArea); // feet
    }
    const crownMouldingWidthFt = calcSettings.crownMouldingWidth / 12; // convert inches to feet
    crownMouldingTrimSqFt = crownMouldingLF * crownMouldingWidthFt; // square feet
  }

  // Total trim square footage
  const trimSqFt = Math.max(0, safeNumber(windowDoorTrimSqFt + baseboardTrimSqFt + crownMouldingTrimSqFt));

  // Calculate paint gallons (using COMBINED RULE)
  const wallCoverage = Math.max(1, safeNumber(pricing.wallCoverageSqFtPerGallon, 350));
  const ceilingCoverage = Math.max(1, safeNumber(pricing.ceilingCoverageSqFtPerGallon, 350));
  const trimCoverage = Math.max(1, safeNumber(pricing.trimCoverageSqFtPerGallon, 400));

  let wallPaintGallons = 0;
  let ceilingPaintGallons = 0;
  let trimPaintGallons = 0;
  let doorPaintGallons = 0;

  if (includedWalls) {
    wallPaintGallons = (wallArea / wallCoverage) * coatsWalls;
  }

  if (includedCeilings) {
    ceilingPaintGallons = (ceilingArea / ceilingCoverage) * coatsCeiling;
  }

  // Trim paint: includes baseboards, window/door trim, crown moulding, AND doors/jambs
  // All "trim" items use the same paint type per user specification
  if (includedTrim || includedWindows) {
    // Calculate based on what's actually included
    let effectiveTrimSqFt = 0;
    if (includedTrim) {
      effectiveTrimSqFt = trimSqFt; // Full trim including window trim
    } else if (includedWindows) {
      effectiveTrimSqFt = windowTrimSqFt; // Only window trim
    }
    trimPaintGallons = (effectiveTrimSqFt / trimCoverage) * coatsTrim;
  }

  // Door and jamb paint - uses TRIM paint (same paint type as baseboards, trim, etc.)
  // doorPaintGallons tracks the gallons needed for doors/jambs, but material cost uses trimPaintPerGallon
  if (includedDoors && room.includeDoors !== false) {
    const doorFacesSqFt = doorCount * (calcSettings.doorHeight * calcSettings.doorWidth) * 2;
    doorPaintGallons = (doorFacesSqFt * coatsDoors) / trimCoverage;

    // Add jamb area if painting jambs
    if (room.paintJambs) {
      const jambWidthFt = safeNumber(calcSettings.doorJambWidth, 4.5) / 12;
      const jambsSqFt = doorCount * (
        (jambWidthFt * calcSettings.doorHeight * 2) +
        (jambWidthFt * calcSettings.doorWidth)
      );
      doorPaintGallons += (jambsSqFt * coatsDoors) / trimCoverage;
    }
  }

  wallPaintGallons = Math.max(0, safeNumber(wallPaintGallons));
  ceilingPaintGallons = Math.max(0, safeNumber(ceilingPaintGallons));
  trimPaintGallons = Math.max(0, safeNumber(trimPaintGallons));
  doorPaintGallons = Math.max(0, safeNumber(doorPaintGallons));

  // Calculate labor costs (using COMBINED RULE)
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

  if (includedWalls) {
    const wallLaborMultiplier = getCoatLaborMultiplier(coatsWalls);
    laborCost += wallArea * safeNumber(pricing.wallLaborPerSqFt, 0) * wallLaborMultiplier;
  }

  if (includedCeilings) {
    const ceilingLaborMultiplier = getCoatLaborMultiplier(coatsCeiling);
    laborCost += ceilingArea * safeNumber(pricing.ceilingLaborPerSqFt, 0) * ceilingLaborMultiplier;
  }

  if (includedBaseboards && room.includeTrim !== false) {
    const baseboardLaborMultiplier = getCoatLaborMultiplier(coatsTrim);
    laborCost += baseboardLF * safeNumber(pricing.baseboardLaborPerLF, 0) * baseboardLaborMultiplier;
  }

  if (includedDoors && room.includeDoors !== false) {
    const doorLaborMultiplier = getCoatLaborMultiplier(coatsDoors);
    laborCost += doorCount * safeNumber(pricing.doorLabor, 0) * doorLaborMultiplier;
  }

  if (includedWindows && room.includeWindows !== false) {
    // Window labor multiplied by coats (more coats = more labor)
    const windowLaborMultiplier = getCoatLaborMultiplier(coatsTrim);
    const windowLaborAmount = windowCount * safeNumber(pricing.windowLabor, 0) * windowLaborMultiplier;
    console.log("[WINDOW LABOR DEBUG]", {
      roomName: room.name,
      windowCount,
      windowLaborRate: pricing.windowLabor,
      coatsTrim,
      windowLaborMultiplier,
      calculation: `${windowCount} × $${pricing.windowLabor} × ${windowLaborMultiplier} multiplier`,
      windowLaborAmount,
    });
    laborCost += windowLaborAmount;
  }

  // Add closet labor only if closets are included via combined rule
  if (includedClosets && (singleClosets > 0 || doubleClosets > 0)) {
    // Closet labor applies the wall coat multiplier since closet interiors are walls
    const closetLaborMultiplier = getCoatLaborMultiplier(coatsWalls);
    laborCost += (singleClosets + doubleClosets) * safeNumber(pricing.closetLabor, 0) * closetLaborMultiplier;
  }

  if (room.hasCrownMoulding && crownMouldingLF > 0 && includedTrim && room.includeTrim !== false) {
    const crownLaborMultiplier = getCoatLaborMultiplier(coatsTrim);
    laborCost += crownMouldingLF * safeNumber(pricing.crownMouldingLaborPerLF, 0) * crownLaborMultiplier;
  }

  // Apply accent wall / multiple colors labor multiplier if enabled
  // This adds extra labor for cutting in different colors
  if (room.hasAccentWall && includedWalls) {
    const accentWallMultiplier = safeNumber(pricing.accentWallLaborMultiplier, 1.25);
    laborCost *= accentWallMultiplier;
  }

  laborCost = Math.max(0, safeNumber(laborCost));

  // Calculate material costs (using COMBINED RULE)
  let materialsCost = 0;

  if (includedWalls) {
    materialsCost += Math.ceil(wallPaintGallons) * safeNumber(pricing.wallPaintPerGallon, 0);
  }

  if (includedCeilings) {
    materialsCost += Math.ceil(ceilingPaintGallons) * safeNumber(pricing.ceilingPaintPerGallon, 0);
  }

  // Trim paint cost: include if trim OR windows enabled (window trim uses trim paint)
  if ((includedTrim || includedWindows) && trimPaintGallons > 0) {
    const trimMaterialCost = Math.ceil(trimPaintGallons) * safeNumber(pricing.trimPaintPerGallon, 0);
    console.log("[TRIM MATERIALS DEBUG]", {
      roomName: room.name,
      trimPaintGallons,
      trimPaintGallonsRoundedUp: Math.ceil(trimPaintGallons),
      trimPaintPerGallon: pricing.trimPaintPerGallon,
      trimMaterialCost,
    });
    materialsCost += trimMaterialCost;
  }

  // Door material cost - uses TRIM paint (same as baseboards, window trim, crown moulding)
  // Doors, jambs, baseboards, trim, risers, spindles, handrails, crown moulding all use the same paint
  if (includedDoors) {
    materialsCost += Math.ceil(doorPaintGallons) * safeNumber(pricing.trimPaintPerGallon, 0);
  }

  materialsCost = Math.max(0, safeNumber(materialsCost));

  const totalCost = Math.max(0, safeNumber(laborCost + materialsCost));

  console.log("[ROOM TOTAL DEBUG]", {
    roomName: room.name,
    coatsTrim,
    laborCost,
    materialsCost,
    totalCost,
    breakdown: `Labor $${laborCost.toFixed(2)} + Materials $${materialsCost.toFixed(2)} = $${totalCost.toFixed(2)}`,
  });

  // Primer calculation (20% of total paint, only for included categories)
  let primerGallons = 0;
  let primerBase = 0;
  if (includedWalls && wallPaintGallons > 0) primerBase += wallPaintGallons;
  if (includedCeilings && ceilingPaintGallons > 0) primerBase += ceilingPaintGallons;
  if ((includedTrim || includedWindows) && trimPaintGallons > 0) primerBase += trimPaintGallons;
  if (includedDoors && doorPaintGallons > 0) primerBase += doorPaintGallons;
  primerGallons = primerBase * 0.2;

  return {
    id: room.id,
    name: room.name || "Unnamed Room",
    floor: room.floor ?? null,
    includeInQuote: room.included !== false,

    // Areas & quantities (ZEROED if category excluded via hierarchy rule)
    wallArea: includedWalls ? Math.max(0, safeNumber(wallArea)) : 0,
    ceilingArea: includedCeilings ? Math.max(0, safeNumber(ceilingArea)) : 0,
    baseboardLF: includedBaseboards ? Math.max(0, safeNumber(baseboardLF)) : 0,
    crownMouldingLF: includedTrim ? Math.max(0, safeNumber(crownMouldingLF)) : 0,
    closetWallArea: includedClosets ? Math.max(0, safeNumber(closetWallArea)) : 0,
    closetCeilingArea: includedClosets ? Math.max(0, safeNumber(closetCeilingArea)) : 0,
    closetBaseboardLF: includedClosets ? Math.max(0, safeNumber(closetBaseboardLF)) : 0,
    windowsCount: windowCount,
    doorsCount: doorCount,
    singleDoorClosets: singleClosets,
    doubleDoorClosets: doubleClosets,

    // Coats
    coatsWalls,
    coatsCeiling,
    coatsTrim,
    coatsDoors,

    // Paint usage
    wallPaintGallons,
    ceilingPaintGallons,
    trimPaintGallons,
    doorPaintGallons,
    primerGallons: Math.max(0, safeNumber(primerGallons)),

    // Pricing (raw values for internal use)
    laborCost,
    materialsCost,
    totalCost,

    // UI-DISPLAYED VALUES (match what user sees in Room Summary after rounding/formatting)
    laborDisplayed: parseFloat(laborCost.toFixed(2)),
    materialsDisplayed: parseFloat(materialsCost.toFixed(2)),
    totalDisplayed: Math.round(totalCost),

    // RESOLVED INCLUSIONS (single source of truth)
    resolvedInclusions,

    // Debug flags (deprecated - use resolvedInclusions instead)
    includedWalls,
    includedCeilings,
    includedTrim,
    includedDoors,
    includedWindows,
    includedBaseboards,
    includedClosets,
  };
}

// ============================================================================
// STAIRCASE PRICING CALCULATION
// ============================================================================

export function computeStaircasePricingSummary(
  staircase: Staircase,
  pricing: PricingSettings,
  projectCoats?: 1 | 2
): StaircasePricingSummary {
  // Use project coats if provided, otherwise use staircase's own coats setting
  const effectiveCoats = projectCoats || staircase.coats || 2;

  // Get the second coat labor multiplier
  const secondCoatMultiplier = safeNumber(pricing.secondCoatLaborMultiplier, 2.0);
  const getCoatLaborMultiplier = (coats: number): number => {
    if (coats <= 1) return 1.0;
    return secondCoatMultiplier;
  };
  const laborMultiplier = getCoatLaborMultiplier(effectiveCoats);

  // Calculate trim area (risers, spindles, handrails - painted with trim paint)
  // Riser area: count × height (7.5") × width (36" standard stair width) converted to sq ft
  const riserHeightFt = safeNumber(staircase.riserHeight, 7.5) / 12; // Convert inches to feet
  const stairWidthFt = 3; // Standard 36" stair width
  const riserArea = staircase.riserCount * riserHeightFt * stairWidthFt;

  // Spindle area: each spindle is approximately 0.5 sq ft of paintable surface
  const spindleArea = staircase.spindleCount * 0.5;

  // Handrail area: length × circumference (approx 0.5 ft for standard handrail)
  const handrailArea = staircase.handrailLength * 0.5;

  // Total trim area (risers + spindles + handrails)
  const trimArea = riserArea + spindleArea + handrailArea;

  // Calculate wall and ceiling areas for secondary stairwell
  let wallArea = 0;
  let ceilingArea = 0;

  if (staircase.hasSecondaryStairwell && staircase.tallWallHeight && staircase.shortWallHeight) {
    const HORIZONTAL_RUN = 12; // feet
    const STAIR_WIDTH = 3.5; // feet
    const SLOPE_LENGTH = 15; // feet (approximate sloped ceiling length)

    const Hmax = staircase.tallWallHeight;
    const Hmin = staircase.shortWallHeight;

    // Wall area calculation (trapezoid formula)
    wallArea = ((Hmax + Hmin) / 2) * HORIZONTAL_RUN;

    // Double the wall area if double-sided
    if (staircase.doubleSidedWalls) {
      wallArea *= 2;
    }

    // Ceiling area (sloped ceiling over stairwell)
    ceilingArea = SLOPE_LENGTH * STAIR_WIDTH;
  }

  // Total paintable area
  const paintableArea = trimArea + wallArea + ceilingArea;

  // Calculate paint gallons by type
  const trimCoverage = safeNumber(pricing.trimCoverageSqFtPerGallon, 400);
  const wallCoverage = safeNumber(pricing.wallCoverageSqFtPerGallon, 350);
  const ceilingCoverage = safeNumber(pricing.ceilingCoverageSqFtPerGallon, 350);

  const trimGallons = (trimArea / trimCoverage) * effectiveCoats;
  const wallGallons = (wallArea / wallCoverage) * effectiveCoats;
  const ceilingGallons = (ceilingArea / ceilingCoverage) * effectiveCoats;
  const totalGallons = trimGallons + wallGallons + ceilingGallons;

  // Calculate labor costs
  let laborCost = 0;

  // Riser labor (trim work)
  laborCost += staircase.riserCount * safeNumber(pricing.riserLabor, 0) * laborMultiplier;

  // Spindle labor (trim work)
  laborCost += staircase.spindleCount * safeNumber(pricing.spindleLabor, 0) * laborMultiplier;

  // Handrail labor (trim work)
  laborCost += staircase.handrailLength * safeNumber(pricing.handrailLaborPerLF, 0) * laborMultiplier;

  // Wall labor for stairwell walls (if applicable)
  if (wallArea > 0) {
    laborCost += wallArea * safeNumber(pricing.wallLaborPerSqFt, 0) * laborMultiplier;
  }

  // Ceiling labor for stairwell ceiling (if applicable)
  if (ceilingArea > 0) {
    laborCost += ceilingArea * safeNumber(pricing.ceilingLaborPerSqFt, 0) * laborMultiplier;
  }

  // Calculate material costs by paint type
  let materialsCost = 0;

  // Trim paint for risers, spindles, handrails
  if (trimGallons > 0) {
    materialsCost += Math.ceil(trimGallons) * safeNumber(pricing.trimPaintPerGallon, 0);
  }

  // Wall paint for stairwell walls
  if (wallGallons > 0) {
    materialsCost += Math.ceil(wallGallons) * safeNumber(pricing.wallPaintPerGallon, 0);
  }

  // Ceiling paint for stairwell ceiling
  if (ceilingGallons > 0) {
    materialsCost += Math.ceil(ceilingGallons) * safeNumber(pricing.ceilingPaintPerGallon, 0);
  }

  const totalCost = Math.max(0, safeNumber(laborCost + materialsCost));

  return {
    id: staircase.id,
    riserCount: staircase.riserCount,
    spindleCount: staircase.spindleCount,
    handrailLength: staircase.handrailLength,
    hasSecondaryStairwell: staircase.hasSecondaryStairwell || false,
    doubleSidedWalls: staircase.doubleSidedWalls || false,
    paintableArea: Math.max(0, safeNumber(paintableArea)),
    // Breakdown by paint type
    trimArea: Math.max(0, safeNumber(trimArea)),
    wallArea: Math.max(0, safeNumber(wallArea)),
    ceilingArea: Math.max(0, safeNumber(ceilingArea)),
    // Gallons by paint type
    trimGallons: Math.max(0, safeNumber(trimGallons)),
    wallGallons: Math.max(0, safeNumber(wallGallons)),
    ceilingGallons: Math.max(0, safeNumber(ceilingGallons)),
    totalGallons: Math.max(0, safeNumber(totalGallons)),

    // Pricing (raw values for internal use)
    laborCost: Math.max(0, safeNumber(laborCost)),
    materialsCost: Math.max(0, safeNumber(materialsCost)),
    totalCost,

    // UI-DISPLAYED VALUES (match what user sees in Staircase Summary after rounding/formatting)
    laborDisplayed: parseFloat(Math.max(0, safeNumber(laborCost)).toFixed(2)),
    materialsDisplayed: parseFloat(Math.max(0, safeNumber(materialsCost)).toFixed(2)),
    totalDisplayed: Math.round(totalCost),
  };
}

// ============================================================================
// FIREPLACE PRICING CALCULATION
// ============================================================================

export function computeFireplacePricingSummary(
  fireplace: Fireplace,
  pricing: PricingSettings
): FireplacePricingSummary {
  // Calculate fireplace area (3 visible sides: front + 2 sides)
  const frontArea = fireplace.width * fireplace.height;
  const sideArea = fireplace.depth * fireplace.height * 2;
  const paintableArea = frontArea + sideArea;

  // Calculate paint gallons
  const totalGallons = (paintableArea / safeNumber(pricing.wallCoverageSqFtPerGallon, 350)) * fireplace.coats;

  // Calculate labor costs
  let laborCost = safeNumber(pricing.fireplaceLabor, 0);

  // Add trim labor if applicable
  if (fireplace.hasTrim) {
    laborCost += fireplace.trimLinearFeet * safeNumber(pricing.baseboardLaborPerLF, 0);
  }

  // Calculate material costs
  const materialsCost = Math.ceil(totalGallons) * safeNumber(pricing.wallPaintPerGallon, 0);

  const totalCost = Math.max(0, safeNumber(laborCost + materialsCost));

  return {
    id: fireplace.id,
    width: fireplace.width,
    height: fireplace.height,
    depth: fireplace.depth,
    hasTrim: fireplace.hasTrim,
    trimLinearFeet: fireplace.trimLinearFeet,
    paintableArea: Math.max(0, safeNumber(paintableArea)),
    totalGallons: Math.max(0, safeNumber(totalGallons)),

    // Pricing (raw values for internal use)
    laborCost: Math.max(0, safeNumber(laborCost)),
    materialsCost: Math.max(0, safeNumber(materialsCost)),
    totalCost,

    // UI-DISPLAYED VALUES (match what user sees in Fireplace Summary after rounding/formatting)
    laborDisplayed: parseFloat(Math.max(0, safeNumber(laborCost)).toFixed(2)),
    materialsDisplayed: parseFloat(Math.max(0, safeNumber(materialsCost)).toFixed(2)),
    totalDisplayed: Math.round(totalCost),
  };
}
