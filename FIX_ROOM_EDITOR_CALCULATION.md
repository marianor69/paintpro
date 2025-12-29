# Fix: Room Editor Calculation Consistency

## Issue Summary
The Room Editor was using two different calculation engines:
- **Display**: `computeRoomPricingSummary()` (with QuoteBuilder support)
- **Save**: `calculateRoomMetrics()` (without QuoteBuilder support)

This caused displayed totals to not match saved totals, leading to inconsistencies across different views.

## Example
**Master Bedroom** displayed different values:
- Room Editor preview: $1,275 (current unsaved edits with Paint Doors OFF)
- Contractor View: $1,362 (saved data with Paint Doors ON)
- Difference: $87.45 in labor costs

## Root Cause
`RoomEditorScreen.tsx` line 293 used `calculateRoomMetrics()` which:
- ❌ Does NOT consider QuoteBuilder settings
- ❌ Only respects room-level toggles
- ❌ Does NOT apply the COMBINED RULE

## Solution
Changed `RoomEditorScreen.tsx` to use `computeRoomPricingSummary()` for saving:
```typescript
// OLD (line 293):
const roomCalc = calculateRoomMetrics(updatedRoom, pricing, project?.projectCoats);

// NEW:
const pricingSummaryForSave = computeRoomPricingSummary(
  updatedRoom,
  quoteBuilder,
  pricing,
  project?.projectCoats,
  project?.projectIncludeClosetInteriorInQuote
);
```

## Benefits
✅ Displayed totals now match saved totals
✅ Single source of truth: `computeRoomPricingSummary()`
✅ COMBINED RULE consistently applied
✅ QuoteBuilder settings respected in all calculations
✅ Room Editor, Contractor View, and Client Proposal all use same calculation

## Testing
After saving a room in Room Editor:
1. Note the displayed total (e.g., $1,275)
2. Navigate to Contractor View
3. Verify Master Bedroom shows the same total ($1,275)
4. All values should now be consistent across all views

## Files Modified
- `/src/screens/RoomEditorScreen.tsx` (lines 19, 293-328)

Date: December 9, 2025
