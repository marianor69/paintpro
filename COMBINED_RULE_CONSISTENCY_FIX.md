# Combined Rule Consistency Fix - Complete

**Date:** 2025-12-08
**Status:** ✅ ALL FIXES APPLIED

---

## Problem Fixed

### Issue
Inconsistent totals across different views:
- RoomEditorScreen showed different totals than Contractor View
- Some categories (like closets) were being included even when they should be excluded
- Areas were being calculated but not zeroed when categories were excluded

### Root Cause
1. **Closet labor** was being added "regardless" of combined rule (line 377-379 in pricingSummary.ts)
2. **Areas not zeroed** - wall/ceiling areas were calculated but not set to 0 when excluded
3. **Two different calculation paths** - `calculateFilteredProjectSummary` was using `calculateRoomMetricsWithQB` instead of `computeRoomPricingSummary`

---

## Changes Made

### 1. Fixed Closet Labor in `pricingSummary.ts`

**Before (WRONG):**
```typescript
if (singleClosets > 0 || doubleClosets > 0) {
  // Closet labor included regardless (part of room work)
  laborCost += (singleClosets + doubleClosets) * safeNumber(pricing.closetLabor, 0);
}
```

**After (CORRECT):**
```typescript
// Add closet labor only if closets are included via combined rule
if (includedClosets && (singleClosets > 0 || doubleClosets > 0)) {
  laborCost += (singleClosets + doubleClosets) * safeNumber(pricing.closetLabor, 0);
}
```

**Effect:** Closet labor is now ONLY included when both `room.includeClosetInteriorInQuote` AND `quoteBuilder.includeClosets` are true.

---

### 2. Zero Out Areas When Excluded

**Before (WRONG):**
```typescript
return {
  wallArea: Math.max(0, safeNumber(wallArea)),
  ceilingArea: Math.max(0, safeNumber(ceilingArea)),
  baseboardLF: Math.max(0, safeNumber(baseboardLF)),
  // ... etc
}
```

**After (CORRECT):**
```typescript
return {
  // Areas & quantities (ZEROED if category excluded via combined rule)
  wallArea: includedWalls ? Math.max(0, safeNumber(wallArea)) : 0,
  ceilingArea: includedCeilings ? Math.max(0, safeNumber(ceilingArea)) : 0,
  baseboardLF: includedBaseboards ? Math.max(0, safeNumber(baseboardLF)) : 0,
  crownMouldingLF: includedTrim ? Math.max(0, safeNumber(crownMouldingLF)) : 0,
  closetWallArea: includedClosets ? Math.max(0, safeNumber(closetWallArea)) : 0,
  closetCeilingArea: includedClosets ? Math.max(0, safeNumber(closetCeilingArea)) : 0,
  closetBaseboardLF: includedClosets ? Math.max(0, safeNumber(closetBaseboardLF)) : 0,
  // ... etc
}
```

**Effect:** When a category is excluded via the combined rule, its area is set to 0, not just its cost.

---

### 3. Unified Calculation Path

**Before (INCONSISTENT):**
- RoomEditorScreen → uses `computeRoomPricingSummary()` ✅
- Contractor View → uses `calculateFilteredProjectSummary()` → uses `calculateRoomMetricsWithQB()` ❌
- Client Proposal → uses `calculateFilteredProjectSummary()` → uses `calculateRoomMetricsWithQB()` ❌

**After (CONSISTENT):**
- RoomEditorScreen → uses `computeRoomPricingSummary()` ✅
- Contractor View → uses `calculateFilteredProjectSummary()` → uses `computeRoomPricingSummary()` ✅
- Client Proposal → uses `calculateFilteredProjectSummary()` → uses `computeRoomPricingSummary()` ✅

**Changes in `calculations.ts`:**

1. Added import:
```typescript
import { computeRoomPricingSummary } from "./pricingSummary";
```

2. Updated `calculateFilteredProjectSummary()`:
```typescript
// OLD:
const calc = calculateRoomMetricsWithQB(
  room,
  pricing,
  qb,
  project.projectCoats,
  project.projectIncludeClosetInteriorInQuote
);

// NEW:
const pricingSummary = computeRoomPricingSummary(
  room,
  qb,
  pricing,
  project.projectCoats,
  project.projectIncludeClosetInteriorInQuote
);
```

3. Updated references to use `pricingSummary` instead of `calc`:
```typescript
// Gallons
totalWallGallons += safeNumber(pricingSummary.wallPaintGallons);
totalCeilingGallons += safeNumber(pricingSummary.ceilingPaintGallons);
totalTrimGallons += safeNumber(pricingSummary.trimPaintGallons);
totalDoorGallons += safeNumber(pricingSummary.doorPaintGallons);

// Areas
totalWallSqFt += safeNumber(pricingSummary.wallArea);
totalCeilingSqFt += safeNumber(pricingSummary.ceilingArea);

// Costs
const roomLaborCost = safeNumber(pricingSummary.laborCost);
const roomMaterialCost = safeNumber(pricingSummary.materialsCost);
const roomTotalPrice = safeNumber(pricingSummary.totalCost);
```

---

## Combined Rule Verification

### The Rule

```
FINAL_INCLUDED = roomIncludedInQuote && roomLevelToggle && quoteBuilderToggle

Where:
- roomIncludedInQuote = room.included !== false (default true)
- roomLevelToggle = room.paint[category] !== false (default true)
- quoteBuilderToggle = quoteBuilder.include[category] === true
```

### Applied to All Categories

```typescript
const includedWalls = roomIncludedInQuote && (room.paintWalls !== false) && quoteBuilder.includeWalls;
const includedCeilings = roomIncludedInQuote && (room.paintCeilings !== false) && quoteBuilder.includeCeilings;
const includedTrim = roomIncludedInQuote && (room.paintTrim !== false) && quoteBuilder.includeTrim;
const includedDoors = roomIncludedInQuote && (room.paintDoors !== false) && quoteBuilder.includeDoors;
const includedWindows = roomIncludedInQuote && (room.paintWindows !== false) && quoteBuilder.includeWindows;
const includedBaseboards = roomIncludedInQuote && (room.paintBaseboard !== false) && quoteBuilder.includeBaseboards;
const includedClosets = roomIncludedInQuote && includeClosetInterior && quoteBuilder.includeClosets;
```

### What Gets Zeroed When Excluded

When a category is excluded (any of the three conditions is false):

1. **Area = 0** (wallArea, ceilingArea, baseboardLF, etc.)
2. **Paint Gallons = 0** (wallPaintGallons, ceilingPaintGallons, etc.)
3. **Labor Cost = 0** (category contributes $0 to labor)
4. **Material Cost = 0** (category contributes $0 to materials)

**No more partial inclusion** - it's all or nothing per category.

---

## Consistency Guarantee

### All Views Now Use Same Logic

**Data Flow:**

```
User Input (Room Editor Form)
    ↓
computeRoomPricingSummary(room, quoteBuilder, pricing, ...)
    ↓
Apply Combined Rule for Each Category
    ↓
Calculate Areas (zero if excluded)
    ↓
Calculate Paint Gallons (zero if excluded)
    ↓
Calculate Labor (zero if excluded)
    ↓
Calculate Materials (zero if excluded)
    ↓
Return RoomPricingSummary
    ↓
Used by ALL views:
- RoomEditorScreen (direct call)
- calculateFilteredProjectSummary (aggregates for Contractor/Proposal)
  - ContractorViewScreen
  - ClientProposalScreen
- Room Details Export
```

### Test Scenarios

#### Scenario 1: Walls Excluded by Quote Builder
```typescript
room.paintWalls = true
room.included = true
quoteBuilder.includeWalls = false

Result:
- includedWalls = false
- wallArea = 0
- wallPaintGallons = 0
- Labor contribution from walls = 0
- Material cost for walls = 0
```

#### Scenario 2: Closets Excluded by Room
```typescript
room.includeClosetInteriorInQuote = false
room.included = true
quoteBuilder.includeClosets = true

Result:
- includedClosets = false
- closetWallArea = 0
- closetCeilingArea = 0
- closetBaseboardLF = 0
- Closet labor = 0
```

#### Scenario 3: Everything Included
```typescript
room.paintWalls = true
room.paintCeilings = true
room.paintTrim = true
room.included = true
quoteBuilder.includeWalls = true
quoteBuilder.includeCeilings = true
quoteBuilder.includeTrim = true

Result:
- All categories included
- All areas calculated
- All costs calculated
- Total = sum of all category costs
```

---

## Files Modified

1. ✅ `/home/user/workspace/src/utils/pricingSummary.ts`
   - Line 377-380: Fixed closet labor to respect combined rule
   - Lines 427-433: Zero out areas when categories excluded

2. ✅ `/home/user/workspace/src/utils/calculations.ts`
   - Line 15: Added import for `computeRoomPricingSummary`
   - Lines 1398-1441: Updated `calculateFilteredProjectSummary` to use `computeRoomPricingSummary`

---

## Verification Checklist

### ✅ Combined Rule Applied
- [x] Walls: included only if room.paintWalls AND quoteBuilder.includeWalls
- [x] Ceilings: included only if room.paintCeilings AND quoteBuilder.includeCeilings
- [x] Trim: included only if room.paintTrim AND quoteBuilder.includeTrim
- [x] Doors: included only if room.paintDoors AND quoteBuilder.includeDoors
- [x] Windows: included only if room.paintWindows AND quoteBuilder.includeWindows
- [x] Baseboards: included only if room.paintBaseboard AND quoteBuilder.includeBaseboards
- [x] Closets: included only if room.includeClosetInteriorInQuote AND quoteBuilder.includeClosets

### ✅ Zero When Excluded
- [x] Areas set to 0 when category excluded
- [x] Paint gallons set to 0 when category excluded
- [x] Labor cost = 0 contribution when category excluded
- [x] Material cost = 0 contribution when category excluded

### ✅ Consistency Across Views
- [x] RoomEditorScreen uses `computeRoomPricingSummary`
- [x] Contractor View uses `calculateFilteredProjectSummary` → `computeRoomPricingSummary`
- [x] Client Proposal uses `calculateFilteredProjectSummary` → `computeRoomPricingSummary`
- [x] Room Details Export uses `computeRoomPricingSummary`
- [x] All views show SAME totals for same room/quote configuration

### ✅ No Regressions
- [x] No TypeScript errors
- [x] Business formulas unchanged (only inclusion logic modified)
- [x] No stale UI state using room-only flags

---

## Summary

**Problem:** Inconsistent totals across views due to:
1. Closet labor ignoring combined rule
2. Areas not being zeroed when excluded
3. Multiple calculation paths (inconsistent implementations)

**Solution:**
1. Fixed closet labor to respect combined rule
2. Zero out all areas when categories excluded
3. Unified all views to use `computeRoomPricingSummary` (single source of truth)

**Result:**
- All views now show SAME totals
- Combined rule applied consistently everywhere
- Excluded categories contribute 0 area / 0 LF / 0 cost
- No more mysterious mismatches between room preview and final quote

**Testing:**
- Turn off any category in Quote Builder → Room total decreases
- Turn off any category at room level → Room total decreases
- Same room with same settings → Same total in all views
- Export JSON → Debug flags show exactly what's included/excluded
