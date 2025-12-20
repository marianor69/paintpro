# Master Bedroom Pricing Discrepancy Analysis

## Summary of Issue

There are **TWO DIFFERENT CALCULATION ENGINES** being used:

1. **Room Editor UI Display**: Uses `computeRoomPricingSummary()` → Shows $1,362
2. **Room Editor Save Function**: Uses `calculateRoomMetrics()` → Saves $1,275

## The Two Calculation Engines

### Engine 1: `computeRoomPricingSummary()` (pricingSummary.ts)
- **Used by**: RoomEditor UI display, Contractor View, Client Proposal
- **Takes QuoteBuilder into account**: YES ✅
- **Applies COMBINED RULE**: YES ✅ (room toggle AND QuoteBuilder toggle)
- **Location**: `/src/utils/pricingSummary.ts` (lines 147-504)
- **Result for Master Bedroom**: $1,362

### Engine 2: `calculateRoomMetrics()` (calculations.ts)
- **Used by**: RoomEditor save function (line 293)
- **Takes QuoteBuilder into account**: NO ❌
- **Applies COMBINED RULE**: NO ❌ (only room-level toggles)
- **Location**: `/src/utils/calculations.ts` (lines 219-535)
- **Result for Master Bedroom**: $1,275

## Why the Discrepancy?

The difference of **$87** ($1,362 - $1,275) suggests that `computeRoomPricingSummary()` is including additional scope items that `calculateRoomMetrics()` is excluding based on room-level toggles.

### Key Differences in Logic:

**`computeRoomPricingSummary()`** (lines 147-162 in pricingSummary.ts):
```typescript
export function computeRoomPricingSummary(
  room: Room,
  quoteBuilder: QuoteBuilder,  // ← Takes QuoteBuilder parameter
  pricing: PricingSettings,
  projectCoats?: 1 | 2,
  projectIncludeClosetInteriorInQuote?: boolean
): RoomPricingSummary {
  // Compute resolved inclusions using the COMBINED RULE
  const resolvedInclusions = computeResolvedInclusions(
    room,
    quoteBuilder,  // ← Uses QuoteBuilder in calculations
    projectIncludeClosetInteriorInQuote
  );
  // ... then uses resolvedInclusions for all calculations
}
```

**`calculateRoomMetrics()`** (lines 219-224 in calculations.ts):
```typescript
export function calculateRoomMetrics(
  room: Room,
  pricing: PricingSettings,
  projectCoats?: 1 | 2,
  projectIncludeClosetInteriorInQuote?: boolean
  // ← NO QuoteBuilder parameter!
): RoomCalculations {
  // ... only checks room-level toggles like:
  // - room.paintWindows
  // - room.paintDoors
  // - room.paintBaseboard
  // - room.includeWindows
  // Does NOT consider QuoteBuilder toggles
}
```

## The Problem in RoomEditorScreen

**Lines 293-322 of RoomEditorScreen.tsx:**
```typescript
const handleSave = () => {
  // ... validation ...

  // Uses OLD calculation engine (ignores QuoteBuilder)
  const roomCalc = calculateRoomMetrics(updatedRoom, pricing, project?.projectCoats);

  // Saves totals from OLD engine to room data
  const finalRoom = {
    ...updatedRoom,
    laborTotal: roomCalc.laborCost,        // ← $1,275 (wrong)
    materialsTotal: roomCalc.materialCost,
    grandTotal: roomCalc.totalPrice,
  };

  updateRoom(projectId, roomId!, finalRoom);
}
```

**Lines 397-432 of RoomEditorScreen.tsx:**
```typescript
// DISPLAYS using NEW calculation engine (respects QuoteBuilder)
const pricingSummary = room
  ? computeRoomPricingSummary(
      {...room, ...currentState},
      quoteBuilder,  // ← Includes QuoteBuilder
      pricing,
      project?.projectCoats,
      project?.projectIncludeClosetInteriorInQuote
    )
  : null;

// Later displays:
${pricingSummary.totalDisplayed.toLocaleString()} // ← $1,362 (correct)
```

## Answers to Your Questions

### 1. Why is the UI displaying $1,275?

The UI **in the Room Editor preview** is displaying **$1,362**, not $1,275. However, if there's a cached/saved value in the room data (`room.grandTotal`), it might show $1,275 if loaded from a previous save.

### 2. How is $1,275 calculated?

$1,275 is calculated using `calculateRoomMetrics()`, which:
- Ignores QuoteBuilder settings
- Only respects room-level toggles (`room.paintWindows`, `room.paintDoors`, etc.)
- Does NOT apply the COMBINED RULE
- Likely excludes certain scope items that the Master Bedroom has toggled OFF at the room level

### 3. Why does Contractor View show $1,362?

Contractor View correctly uses `computeRoomPricingSummary()` which:
- **Applies the COMBINED RULE** (room toggle AND QuoteBuilder toggle)
- Includes scope items that are enabled in BOTH the room AND the active Quote
- This is the **correct** calculation

**Code evidence from MaterialsSummaryScreen.tsx (lines 66-70):**
```typescript
const summary = calculateFilteredProjectSummary(
  project,
  pricing,
  project.quoteBuilder
);
```

Which internally calls `computeRoomPricingSummary()` for each room (lines 1404-1410 in calculations.ts).

### 4. Which is correct: $1,275 or $1,362?

**$1,362 is correct** because:

1. **It respects the COMBINED RULE**: The system is designed to have TWO levels of control:
   - Room-level toggles (what CAN be painted in this room)
   - QuoteBuilder toggles (what WILL be included in this quote)

2. **It matches the stated architecture**: From README.md and pricingSummary.ts comments, the COMBINED RULE is the intended behavior.

3. **The $87 difference** suggests that the Master Bedroom has some scope items (likely closet interiors, trim, or doors) that are:
   - Toggled ON in the room data
   - Included in the active QuoteBuilder
   - Therefore should be included in the total

4. **Contractor View is authoritative**: The Contractor View is explicitly documented as using the "single source of truth" calculation engine.

### 5. Are there more than one "source of truth"?

**YES - and that's the problem!**

There are **TWO calculation engines**:

1. **OLD ENGINE** (`calculateRoomMetrics` in calculations.ts)
   - Does NOT use QuoteBuilder
   - Used ONLY by RoomEditor save function
   - **Should be deprecated/removed**

2. **NEW ENGINE** (`computeRoomPricingSummary` in pricingSummary.ts)
   - Uses QuoteBuilder and COMBINED RULE
   - Used by: Room Editor display, Contractor View, Client Proposal
   - **This is the intended "single source of truth"**

## The Root Cause

The RoomEditorScreen has a **split personality**:
- **Displays** totals using the NEW engine (`computeRoomPricingSummary`)
- **Saves** totals using the OLD engine (`calculateRoomMetrics`)

This creates a discrepancy where:
- User sees $1,362 in the UI
- System saves $1,275 to the database
- Next time they open the room, if the UI reads from saved data, it might show $1,275
- But Contractor View recalculates fresh and shows $1,362

## Evidence from Logs

From expo.log:
```
LOG  [calculateFilteredProjectSummary] Processing room: Master Bedroom (2)
LOG  [calculateFilteredProjectSummary] Room totals with COMBINED RULE (UI-DISPLAYED): Master Bedroom
  {"labor": "1152.49", "materials": "210.00", "total": "1362"}
```

This shows that when Contractor View calculates the Master Bedroom using `computeRoomPricingSummary()`, it gets:
- Labor: $1,152.49
- Materials: $210.00
- **Total: $1,362**

## Recommendation

**The RoomEditor save function should use `computeRoomPricingSummary()` instead of `calculateRoomMetrics()`.**

This would ensure:
1. Single source of truth across all views
2. Saved totals match displayed totals
3. COMBINED RULE consistently applied everywhere
4. QuoteBuilder settings respected in saved room data
