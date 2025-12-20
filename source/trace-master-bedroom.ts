/**
 * DETAILED CALCULATION TRACE
 * This script outputs step-by-step math for Master Bedroom to debug the $119 discrepancy
 */

import { computeRoomPricingSummary } from "./src/utils/pricingSummary";
import { Room, PricingSettings, QuoteBuilder } from "./src/types/painting";
import { getClosetInteriorMetrics } from "./src/utils/calculations";

const testPricing: PricingSettings = {
  wallLaborPerSqFt: 1.1,
  ceilingLaborPerSqFt: 0.95,
  baseboardLaborPerLF: 1.25,
  doorLabor: 35,
  windowLabor: 20,
  closetLabor: 25,
  riserLabor: 15,
  spindleLabor: 8,
  handrailLaborPerLF: 10,
  fireplaceLabor: 150,
  crownMouldingLaborPerLF: 2.5,
  secondCoatLaborMultiplier: 2.0,
  accentWallLaborMultiplier: 1.25,
  wallPaintPerGallon: 30,
  ceilingPaintPerGallon: 28,
  trimPaintPerGallon: 34,
  doorPaintPerGallon: 38,
  primerPerGallon: 22,
  wallCoverageSqFtPerGallon: 350,
  ceilingCoverageSqFtPerGallon: 350,
  trimCoverageSqFtPerGallon: 350,
};

const testQuoteBuilder: QuoteBuilder = {
  includeAllRooms: true,
  includedRoomIds: [],
  includeWalls: true,
  includeCeilings: true,
  includeTrim: true,
  includeDoors: true,
  includeWindows: true,
  includeBaseboards: true,
  includeClosets: true,
  includeStaircases: false,
  includeFireplaces: false,
  includePrimer: true,
  includeFloor1: true,
  includeFloor2: true,
  includeFloor3: true,
  includeFloor4: true,
  includeFloor5: true,
};

const masterBedroom: Room = {
  id: "r2",
  name: "Master Bedroom",
  length: 18,
  width: 14,
  height: 10,
  ceilingType: "cathedral",
  cathedralPeakHeight: 12,
  paintWindows: true,
  paintDoors: false,
  paintTrim: true,
  paintBaseboard: true,
  paintJambs: false,
  windowCount: 3,
  doorCount: 2,
  singleDoorClosets: 1,
  doubleDoorClosets: 1,
  coatsWalls: 2,
  coatsCeiling: 2,
  coatsTrim: 1,
  coatsDoors: 1,
  floor: 1,
  included: true,
  includeClosetInteriorInQuote: true,
  hasCloset: true,
};

console.log("MASTER BEDROOM CALCULATION TRACE");
console.log("=".repeat(80));

// Manual calculation
const L = 18;
const W = 14;
const H = 10;
const peak = 12;

console.log("\nROOM DIMENSIONS:");
console.log(`  Length: ${L} ft`);
console.log(`  Width: ${W} ft`);
console.log(`  Height: ${H} ft`);
console.log(`  Cathedral Peak: ${peak} ft`);

const perimeter = 2 * (L + W);
console.log(`\nPERIMETER: ${perimeter} ft`);

// Effective wall height for cathedral
const effectiveWallHeight = (H + peak) / 2;
console.log(`\nEFFECTIVE WALL HEIGHT (cathedral avg): ${effectiveWallHeight} ft`);

// Wall area before deductions
let wallArea = perimeter * effectiveWallHeight;
console.log(`\nWALL AREA (before deductions): ${wallArea.toFixed(2)} sq ft`);

// Window deductions (3 windows)
const windowOpeningArea = 3 * 5; // 15 sqft
const windowTrimPerimeter = 2 * (3 + 5); // 16 ft
const windowTrimArea = windowTrimPerimeter * (3.5 / 12); // 4.67 sqft
const windowDeduction = 3 * (windowOpeningArea + windowTrimArea);
console.log(`\nWINDOW DEDUCTIONS (3 windows):`);
console.log(`  Opening area per window: ${windowOpeningArea} sq ft`);
console.log(`  Trim area per window: ${(windowTrimPerimeter * (3.5 / 12)).toFixed(2)} sq ft`);
console.log(`  Total window deduction: ${windowDeduction.toFixed(2)} sq ft`);

wallArea -= windowDeduction;

// Door deductions (2 doors)
const doorOpeningArea = 7 * 3; // 21 sqft
const doorTrimPerimeter = (2 * 7) + 3; // 17 ft
const doorTrimArea = doorTrimPerimeter * (3.5 / 12); // 4.96 sqft
const doorDeduction = 2 * (doorOpeningArea + doorTrimArea);
console.log(`\nDOOR DEDUCTIONS (2 doors):`);
console.log(`  Opening area per door: ${doorOpeningArea} sq ft`);
console.log(`  Trim area per door: ${(doorTrimPerimeter * (3.5 / 12)).toFixed(2)} sq ft`);
console.log(`  Total door deduction: ${doorDeduction.toFixed(2)} sq ft`);

wallArea -= doorDeduction;

// Closet deductions (1 single + 1 double)
const singleClosetOpeningArea = (24 / 12) * (80 / 12); // 13.33 sqft
const singleClosetTrimArea = ((2 * (80 / 12)) + (24 / 12)) * (3.5 / 12);
const doubleClosetOpeningArea = (48 / 12) * (80 / 12); // 26.67 sqft
const doubleClosetTrimArea = ((2 * (80 / 12)) + (48 / 12)) * (3.5 / 12);
const closetDeduction = (singleClosetOpeningArea + singleClosetTrimArea) + (doubleClosetOpeningArea + doubleClosetTrimArea);
console.log(`\nCLOSET DEDUCTIONS (1 single + 1 double):`);
console.log(`  Single closet deduction: ${(singleClosetOpeningArea + singleClosetTrimArea).toFixed(2)} sq ft`);
console.log(`  Double closet deduction: ${(doubleClosetOpeningArea + doubleClosetTrimArea).toFixed(2)} sq ft`);
console.log(`  Total closet deduction: ${closetDeduction.toFixed(2)} sq ft`);

wallArea -= closetDeduction;

console.log(`\nWALL AREA (after all deductions): ${wallArea.toFixed(2)} sq ft`);

// Closet interior additions
const closetMetrics = getClosetInteriorMetrics(masterBedroom, H);
console.log(`\nCLOSET INTERIOR ADDITIONS:`);
console.log(`  Single closet wall area: ${((2.5 + 2 * 2) * H).toFixed(2)} sq ft`);
console.log(`  Double closet wall area: ${((5 + 2 * 2) * H).toFixed(2)} sq ft`);
console.log(`  Total closet wall area: ${closetMetrics.totalClosetWallArea.toFixed(2)} sq ft`);

wallArea += closetMetrics.totalClosetWallArea;
console.log(`\nFINAL WALL AREA (with closets): ${wallArea.toFixed(2)} sq ft`);

// Ceiling calculation
const baseCeilingArea = L * W;
console.log(`\nBASE CEILING AREA: ${baseCeilingArea} sq ft`);

// Cathedral multiplier
const rise = peak - H;
const run = W / 2;
const slopeMultiplier = Math.sqrt(1 + Math.pow(rise / run, 2));
let ceilingArea = baseCeilingArea * slopeMultiplier;
console.log(`CATHEDRAL MULTIPLIER: ${slopeMultiplier.toFixed(4)}`);
console.log(`CEILING AREA (cathedral): ${ceilingArea.toFixed(2)} sq ft`);

ceilingArea += closetMetrics.totalClosetCeilingArea;
console.log(`CEILING AREA (with closets): ${ceilingArea.toFixed(2)} sq ft`);

// Baseboard
let baseboardLF = perimeter - (2 * (3 + (3.5 * 2 / 12))) - ((24 / 12) + (3.5 * 2 / 12)) - ((48 / 12) + (3.5 * 2 / 12));
baseboardLF += closetMetrics.totalClosetBaseboardLF;
console.log(`\nBASEBOARD LF: ${baseboardLF.toFixed(2)} LF`);

// Paint gallons
const wallGallons = (wallArea / 350) * 2;
const ceilingGallons = (ceilingArea / 350) * 2;
console.log(`\nPAINT GALLONS:`);
console.log(`  Wall: ${wallGallons.toFixed(2)} gal (${wallArea.toFixed(2)} sq ft / 350 × 2 coats)`);
console.log(`  Ceiling: ${ceilingGallons.toFixed(2)} gal (${ceilingArea.toFixed(2)} sq ft / 350 × 2 coats)`);

// Now run engine and compare
console.log("\n" + "=".repeat(80));
console.log("ENGINE OUTPUT:");
console.log("=".repeat(80));
const summary = computeRoomPricingSummary(masterBedroom, testQuoteBuilder, testPricing, undefined, false);
console.log(JSON.stringify(summary, null, 2));
