# Combined Rule Pricing Logic - Implementation Complete

**Date:** 2025-12-08
**Status:** ✅ FULLY IMPLEMENTED

---

## Overview

The **COMBINED RULE** has been implemented across the entire PaintEstimate Pro app. This rule creates a two-layer filtering system for paint categories:

### THE RULE

```
A category (walls, trim, doors, windows, ceilings, baseboards, closets)
is included in a room's calculation ONLY IF:

1. The global QuoteBuilder option for that category is ON AND
2. The room-level toggle for that category is ON

EffectiveInclude(category, room) =
  quoteBuilder.include[category] === true
  && room.paint[category] === true
```

This creates **precise control** where:
- Room toggles define what the room **can** paint
- QuoteBuilder toggles define what the quote **will** include

---

## Implementation Details

### 1. Type Definitions (`src/types/painting.ts`)

**Added to QuoteBuilder interface:**
```typescript
export interface QuoteBuilder {
  includeAllRooms: boolean;
  includedRoomIds: string[];

  // COMBINED RULE TOGGLES
  includeWalls: boolean;
  includeCeilings: boolean;
  includeTrim: boolean;
  includeDoors: boolean;
  includeWindows: boolean;
  includeBaseboards: boolean;
  includeClosets: boolean;

  // Structural elements
  includeStaircases: boolean;
  includeFireplaces: boolean;
  includePrimer: boolean;
  includeFloor1-5: boolean;
  paintOptions?: PaintOption[];
  showPaintOptionsInProposal?: boolean;
}
```

All category toggles default to `true`.

---

### 2. Calculation Engine (`src/utils/calculations.ts`)

#### New Function: `calculateRoomMetricsWithQB()`

```typescript
export function calculateRoomMetricsWithQB(
  room: Room,
  pricing: PricingSettings,
  quoteBuilder: QuoteBuilder,
  projectCoats?: 1 | 2,
  projectIncludeClosetInteriorInQuote?: boolean
): RoomCalculations
```

**How it works:**
1. Applies combined rule to compute effective paint settings:
   ```typescript
   const effectivePaintWalls = (room.paintWalls !== false) && quoteBuilder.includeWalls;
   const effectivePaintCeilings = (room.paintCeilings !== false) && quoteBuilder.includeCeilings;
   // ... etc for all categories
   ```

2. Creates a modified room object with effective settings
3. Passes to standard `calculateRoomMetrics()` function

**Result:** Room totals automatically respect BOTH room-level AND quote-level toggles.

---

#### Updated: `calculateFilteredProjectSummary()`

**Changes:**
- Replaced all room calculation logic to use `calculateRoomMetricsWithQB()`
- Removed old logic that used stored room totals without QuoteBuilder filtering
- Now ALL room totals are recalculated with combined rule on every project summary

**Before:**
```typescript
// Used stored room.laborTotal, room.materialsTotal, room.grandTotal
const roomLaborCost = safeNumber(room.laborTotal);
const roomMaterialCost = safeNumber(room.materialsTotal);
```

**After:**
```typescript
// Recalculate with combined rule
const calc = calculateRoomMetricsWithQB(
  room,
  pricing,
  qb,
  project.projectCoats,
  project.projectIncludeClosetInteriorInQuote
);
const roomLaborCost = safeNumber(calc.laborCost);
const roomMaterialCost = safeNumber(calc.materialCost);
```

---

### 3. RoomEditorScreen (`src/screens/RoomEditorScreen.tsx`)

**Changes:**
- Preview totals now use `calculateRoomMetricsWithQB()` instead of `calculateRoomMetrics()`
- Gets active quote's QuoteBuilder settings
- Shows real-time preview that matches what will appear in:
  - Project Detail Screen
  - Contractor View
  - Client Proposal
  - Materials Summary

**Code:**
```typescript
// Get active quote's QuoteBuilder for combined rule calculation
const getActiveQuote = useProjectStore((s) => s.getActiveQuote);
const activeQuote = project ? getActiveQuote(project.id) : null;
const quoteBuilder = activeQuote?.quoteBuilder || project?.quoteBuilder || getDefaultQuoteBuilder();

// Calculate room metrics using COMBINED RULE
const calculations = room
  ? calculateRoomMetricsWithQB(
      {...room, /* form inputs */},
      pricing,
      quoteBuilder,
      project?.projectCoats
    )
  : null;
```

---

### 4. QuoteBuilderScreen (`src/screens/QuoteBuilderScreen.tsx`)

**Changes:**
- Added "Paint Category Filters" section with 7 toggles:
  - Include Walls
  - Include Ceilings
  - Include Trim
  - Include Doors
  - Include Windows
  - Include Baseboards
  - Include Closets

- Separated "Structural Elements" section:
  - Staircases
  - Fireplaces
  - Primer

- Updated all presets to set category toggles:
  - **Full Interior**: All categories ON
  - **Walls + Ceilings**: Only walls, ceilings, closets ON
  - **Walls Only**: Only walls, closets ON
  - **Ceilings Only**: Only ceilings ON
  - **Trim Package**: Only trim, doors, windows, baseboards ON
  - **Rental Refresh**: Only walls ON
  - **Reset All Off**: All categories OFF

---

### 5. Updated Default QuoteBuilder (`getDefaultQuoteBuilder()`)

```typescript
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
```

---

## Where Combined Rule is Applied

The combined rule is now consistently applied in **ALL** locations that compute room totals:

### ✅ Room Editor Screen
- **Location:** `src/screens/RoomEditorScreen.tsx:389-423`
- **Function:** Preview totals in "Room Summary" card
- **Uses:** `calculateRoomMetricsWithQB()`

### ✅ Project Detail Screen
- **Location:** `src/screens/ProjectDetailScreen.tsx:199`
- **Function:** Header total + room card subtotals
- **Uses:** `calculateFilteredProjectSummary()` → `calculateRoomMetricsWithQB()`

### ✅ Contractor View / Materials Summary
- **Location:** `src/screens/MaterialsSummaryScreen.tsx:43-189`
- **Function:** Complete materials breakdown + room-by-room totals
- **Uses:** `calculateFilteredProjectSummary()` → `calculateRoomMetricsWithQB()`

### ✅ Client Proposal Generation
- **Location:** `src/screens/ClientProposalScreen.tsx:36-153`
- **Function:** Proposal text with itemized prices
- **Uses:** `calculateFilteredProjectSummary()` → `calculateRoomMetricsWithQB()`

### ✅ Quote Builder Preview
- **Location:** `src/screens/QuoteBuilderScreen.tsx`
- **Function:** Real-time updates as toggles change
- **Uses:** Indirectly through project summary recalculations

---

## Room Total Consistency Guarantee

### Single Source of Truth Flow

```
User changes toggle → QuoteBuilder updates → calculateRoomMetricsWithQB()
  → Applies combined rule → Returns filtered totals
  → ALL views use same filtered totals
```

### Recalculation Triggers

Room totals are recalculated with combined rule whenever:
1. A room-level paint toggle changes (in Room Editor)
2. A QuoteBuilder category toggle changes (in Quote Builder)
3. Any view requests project summary (Project Detail, Contractor View, etc.)

### No More Stored Totals (for Quote Views)

**Important Change:**
- Room Editor still stores `room.laborTotal`, `room.materialsTotal`, `room.grandTotal` when saving
- These represent the room's "full potential" (all room toggles ON, all QB toggles ON)
- BUT: All quote-related views **ignore** these stored values
- Instead: They recalculate using `calculateRoomMetricsWithQB()` to get filtered totals

This ensures **perfect consistency** across all views.

---

## Example Scenarios

### Scenario 1: Walls-Only Quote

**Setup:**
- Room has: `paintWalls=true, paintCeilings=true, paintTrim=true`
- QuoteBuilder has: `includeWalls=true, includeCeilings=false, includeTrim=false`

**Result:**
```
Effective: paintWalls=true, paintCeilings=false, paintTrim=false
Room total = walls labor + walls materials only
```

### Scenario 2: Selective Room + Category Filtering

**Setup:**
- Project has 3 rooms: Bedroom, Living Room, Kitchen
- QuoteBuilder: `includedRoomIds = ["bedroom-id"]`, `includeWalls=true, includeCeilings=true`
- All rooms have all paint toggles ON

**Result:**
```
Only Bedroom included in quote
Bedroom shows: walls + ceilings only
Total = Bedroom walls labor + Bedroom ceilings labor + materials
```

### Scenario 3: Room Override

**Setup:**
- Room has: `paintWalls=false` (user doesn't want walls painted)
- QuoteBuilder has: `includeWalls=true`

**Result:**
```
Effective: paintWalls=false (room toggle wins when OFF)
Room total = NO walls included (because room.paintWalls=false)
```

**Key Insight:** If EITHER toggle is OFF, the category is excluded.

---

## Migration & Backwards Compatibility

### Existing Projects
- Old projects without category toggles in QuoteBuilder will automatically get defaults (all ON)
- This is handled by `getDefaultQuoteBuilder()` merging logic in QuoteBuilderScreen
- No data migration needed

### Stored Room Totals
- Existing `room.laborTotal`, `room.materialsTotal`, `room.grandTotal` remain valid
- They represent "full room potential"
- Quote views ignore them and recalculate with filters

---

## Testing Checklist

To verify combined rule is working correctly:

### ✅ Room Editor Preview
1. Open any room in Room Editor
2. Toggle room-level paint options (walls, ceilings, etc.)
3. Verify "Room Summary" totals update immediately
4. Verify totals reflect current QuoteBuilder settings

### ✅ QuoteBuilder Category Filters
1. Go to Quote Builder
2. Toggle "Include Walls" OFF
3. Navigate to Project Detail
4. Verify room totals decrease (walls removed)
5. Open Contractor View
6. Verify same totals as Project Detail
7. Generate Client Proposal
8. Verify same totals in proposal

### ✅ Preset Buttons
1. In Quote Builder, click "Walls Only" preset
2. Verify only "Include Walls" is ON
3. Navigate to Project Detail
4. Verify totals show walls only
5. Click "Full Interior" preset
6. Verify all categories ON
7. Verify totals increase to full amounts

### ✅ Materials Breakdown
1. Go to Contractor View / Materials Summary
2. Verify paint gallon totals match category filters
3. If "Include Ceilings" is OFF, verify ceiling gallons = 0
4. Verify per-room breakdown matches room card totals in Project Detail

### ✅ Consistency Across Views
1. Note down room total in Project Detail
2. Open that room in Room Editor → verify same total in "Room Summary"
3. Go to Contractor View → verify same room total in breakdown
4. Generate Client Proposal → verify same room total in proposal text

---

## Implementation Summary

### Files Modified
1. ✅ `src/types/painting.ts` - Added category toggles to QuoteBuilder
2. ✅ `src/utils/calculations.ts` - Added `calculateRoomMetricsWithQB()`, updated `calculateFilteredProjectSummary()`
3. ✅ `src/screens/RoomEditorScreen.tsx` - Updated preview to use combined rule
4. ✅ `src/screens/QuoteBuilderScreen.tsx` - Added category toggle UI, updated presets

### Lines of Code Changed
- Type definitions: ~20 lines
- Calculation engine: ~150 lines
- Room Editor: ~30 lines
- Quote Builder: ~120 lines

### Total Impact
- **Consistency:** All room totals now use same calculation logic
- **Flexibility:** Two-layer control (room + quote) for precise filtering
- **Correctness:** Combined rule applied consistently in all views
- **User Experience:** Real-time preview matches final quotes

---

## Success Criteria - ALL MET ✅

- ✅ Combined rule implemented in calculation engine
- ✅ Room Editor preview uses combined rule
- ✅ Project Detail room totals use combined rule
- ✅ Contractor View uses combined rule
- ✅ Client Proposal uses combined rule
- ✅ Materials breakdown uses combined rule
- ✅ Room totals match across ALL views
- ✅ Room totals update when room toggles change
- ✅ Room totals update when QuoteBuilder toggles change
- ✅ No TypeScript errors
- ✅ Backwards compatible with existing projects

---

## Next Steps (Optional Enhancements)

### Not Included in This Implementation
1. Visual indicator in Room Editor showing which categories are filtered by QB
2. Warning message when room toggle is ON but QB toggle is OFF
3. Bulk toggle for all categories in Quote Builder
4. Category-specific pricing adjustments in Quote Builder

These can be added in future iterations if needed.

---

**Implementation complete. The combined rule is now the single source of truth for all room total calculations across the entire app.**
