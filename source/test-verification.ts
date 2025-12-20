/**
 * MANDATORY VERIFICATION TEST
 *
 * This test verifies the COMBINED AND RULE implementation using the provided test data.
 * Expected totals:
 * - Living Room: $1284
 * - Master Bedroom: $1362
 * - Office: $616
 * - Grand Total: $3262
 */

import { computeRoomPricingSummary } from "./src/utils/pricingSummary";
import { Room, PricingSettings, QuoteBuilder } from "./src/types/painting";
import { getDefaultQuoteBuilder } from "./src/utils/calculations";

// Test Pricing Settings
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

// Test QuoteBuilder
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

// Test Rooms
const livingRoom: Room = {
  id: "r1",
  name: "Living Room",
  length: 20,
  width: 15,
  height: 9,
  ceilingType: "flat",
  paintWindows: true,
  paintDoors: true,
  paintTrim: true,
  paintBaseboard: true,
  paintJambs: true,
  windowCount: 2,
  doorCount: 1,
  singleDoorClosets: 0,
  doubleDoorClosets: 0,
  coatsWalls: 2,
  coatsCeiling: 1,
  coatsTrim: 1,
  coatsDoors: 1,
  floor: 1,
  included: true,
  includeClosetInteriorInQuote: false,
  hasCloset: false,
};

const masterBedroom: Room = {
  id: "r2",
  name: "Master Bedroom",
  length: 18,
  width: 14,
  height: 10,
  ceilingType: "cathedral",
  cathedralPeakHeight: 12, // Estimated peak for cathedral
  paintWindows: true,
  paintDoors: false, // KEY: Doors excluded at room level
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

const office: Room = {
  id: "r3",
  name: "Office",
  length: 12,
  width: 10,
  height: 8,
  ceilingType: "flat",
  paintWindows: false, // KEY: Windows excluded at room level
  paintDoors: true,
  paintTrim: false, // KEY: Trim excluded at room level
  paintBaseboard: false, // KEY: Baseboard excluded at room level
  paintJambs: false,
  windowCount: 1,
  doorCount: 1,
  singleDoorClosets: 0,
  doubleDoorClosets: 0,
  coatsWalls: 1,
  coatsCeiling: 1,
  coatsTrim: 1,
  coatsDoors: 2,
  floor: 2,
  included: true,
  includeClosetInteriorInQuote: false,
  hasCloset: false,
};

// Run verification
function runVerification() {
  console.log("=".repeat(80));
  console.log("COMBINED AND RULE VERIFICATION TEST");
  console.log("=".repeat(80));
  console.log("");

  const rooms = [livingRoom, masterBedroom, office];
  const expected = [1284, 1362, 616];
  const expectedTotal = 3262;

  let allPassed = true;
  let actualTotal = 0;

  rooms.forEach((room, index) => {
    console.log(`\n${"─".repeat(80)}`);
    console.log(`ROOM: ${room.name}`);
    console.log(`${"─".repeat(80)}`);

    const summary = computeRoomPricingSummary(
      room,
      testQuoteBuilder,
      testPricing,
      undefined,
      false
    );

    console.log("\nRESOLVED INCLUSIONS:");
    console.log(`  Walls: ${summary.resolvedInclusions.walls}`);
    console.log(`  Ceilings: ${summary.resolvedInclusions.ceilings}`);
    console.log(`  Trim: ${summary.resolvedInclusions.trim}`);
    console.log(`  Baseboards: ${summary.resolvedInclusions.baseboards}`);
    console.log(`  Windows: ${summary.resolvedInclusions.windows}`);
    console.log(`  Doors: ${summary.resolvedInclusions.doors}`);
    console.log(`  Closets: ${summary.resolvedInclusions.closetInteriors}`);

    console.log("\nAREAS & QUANTITIES:");
    console.log(`  Wall Area: ${summary.wallArea.toFixed(2)} sq ft`);
    console.log(`  Ceiling Area: ${summary.ceilingArea.toFixed(2)} sq ft`);
    console.log(`  Baseboard LF: ${summary.baseboardLF.toFixed(2)} LF`);
    console.log(`  Windows: ${summary.windowsCount}`);
    console.log(`  Doors: ${summary.doorsCount}`);

    console.log("\nPAINT GALLONS:");
    console.log(`  Wall Paint: ${summary.wallPaintGallons.toFixed(2)} gal`);
    console.log(`  Ceiling Paint: ${summary.ceilingPaintGallons.toFixed(2)} gal`);
    console.log(`  Trim Paint: ${summary.trimPaintGallons.toFixed(2)} gal`);
    console.log(`  Door Paint: ${summary.doorPaintGallons.toFixed(2)} gal`);

    console.log("\nCOSTS:");
    console.log(`  Labor: $${summary.laborDisplayed.toFixed(2)}`);
    console.log(`  Materials: $${summary.materialsDisplayed.toFixed(2)}`);
    console.log(`  Total: $${summary.totalDisplayed}`);

    const passed = summary.totalDisplayed === expected[index];
    actualTotal += summary.totalDisplayed;

    console.log(`\nEXPECTED: $${expected[index]}`);
    console.log(`ACTUAL: $${summary.totalDisplayed}`);
    console.log(`STATUS: ${passed ? "✅ PASS" : "❌ FAIL"}`);

    if (!passed) {
      allPassed = false;
      console.log(`\n⚠️  MISMATCH DETECTED: Expected $${expected[index]}, got $${summary.totalDisplayed}`);
      console.log(`Difference: $${summary.totalDisplayed - expected[index]}`);
    }
  });

  console.log(`\n${"=".repeat(80)}`);
  console.log("GRAND TOTAL VERIFICATION");
  console.log(`${"=".repeat(80)}`);
  console.log(`Expected Total: $${expectedTotal}`);
  console.log(`Actual Total: $${actualTotal}`);
  console.log(`Status: ${actualTotal === expectedTotal ? "✅ PASS" : "❌ FAIL"}`);

  if (!allPassed || actualTotal !== expectedTotal) {
    console.log(`\n${"=".repeat(80)}`);
    console.log("❌ COMBINED-RULE MISMATCH DETECTED — FIX NOT APPLIED CORRECTLY");
    console.log(`${"=".repeat(80)}`);
    console.log("\nDIVERGENCE ANALYSIS:");
    rooms.forEach((room, index) => {
      const summary = computeRoomPricingSummary(
        room,
        testQuoteBuilder,
        testPricing,
        undefined,
        false
      );
      const diff = summary.totalDisplayed - expected[index];
      if (diff !== 0) {
        console.log(`\n${room.name}:`);
        console.log(`  Expected: $${expected[index]}`);
        console.log(`  Actual: $${summary.totalDisplayed}`);
        console.log(`  Difference: $${diff}`);
        console.log(`  Possible causes:`);
        if (room.paintDoors === false && summary.resolvedInclusions.doors === true) {
          console.log(`    - Doors included despite paintDoors=false`);
        }
        if (room.paintWindows === false && summary.resolvedInclusions.windows === true) {
          console.log(`    - Windows included despite paintWindows=false`);
        }
        if (room.paintTrim === false && summary.resolvedInclusions.trim === true) {
          console.log(`    - Trim included despite paintTrim=false`);
        }
        if (room.paintBaseboard === false && summary.resolvedInclusions.baseboards === true) {
          console.log(`    - Baseboard included despite paintBaseboard=false`);
        }
      }
    });
    process.exit(1);
  }

  console.log(`\n${"=".repeat(80)}`);
  console.log("✅ ALL TESTS PASSED - COMBINED AND RULE CORRECTLY IMPLEMENTED");
  console.log(`${"=".repeat(80)}`);
  process.exit(0);
}

// Run the test
runVerification();
