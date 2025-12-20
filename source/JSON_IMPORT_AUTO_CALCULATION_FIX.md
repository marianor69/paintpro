# JSON Import Auto-Calculation Fix

**Date**: December 9, 2025
**Issue**: Imported projects appeared broken in Contractor View

---

## Problem

When importing a project from JSON:
1. Rooms were created successfully
2. BUT gallon usage was not calculated/saved
3. Contractor View showed 0.00 gal for all categories
4. User had to manually open each room and click "Save" to populate the data
5. This gave the impression of a bug and poor user experience

---

## Root Cause

The `importProjectFromJSON()` function was creating rooms with dimensions and settings, but wasn't triggering the calculation engine to populate:
- `gallonUsage` (wall, ceiling, trim, door)
- `laborTotal`
- `materialsTotal`
- `grandTotal`

These fields are populated when a room is saved in the RoomEditor, but import wasn't doing this step.

---

## Solution

Modified `/src/utils/importProject.ts` to automatically calculate and save all room data during import:

### Changes Made:

1. **Added imports** (lines 5-6):
```typescript
import { computeRoomPricingSummary } from "./pricingSummary";
import { getDefaultQuoteBuilder } from "./calculations";
```

2. **Get pricing data** (lines 149-151):
```typescript
const pricingStore = usePricingStore.getState();
const { updatePricing, resetToDefaults, ...pricing } = pricingStore;
```

3. **Automatic calculation per room** (lines 197-220):
```typescript
// AUTOMATICALLY CALCULATE GALLON USAGE AND TOTALS
const quoteBuilder = project.quoteBuilder || getDefaultQuoteBuilder();
const pricingSummary = computeRoomPricingSummary(
  room,
  quoteBuilder,
  pricing,
  project.projectCoats,
  project.projectIncludeClosetInteriorInQuote
);

// Add calculated data to room
const roomWithCalculations: Room = {
  ...room,
  gallonUsage: {
    wall: pricingSummary.wallPaintGallons,
    ceiling: pricingSummary.ceilingPaintGallons,
    trim: pricingSummary.trimPaintGallons,
    door: pricingSummary.doorPaintGallons,
  },
  laborTotal: pricingSummary.laborDisplayed,
  materialsTotal: pricingSummary.materialsDisplayed,
  grandTotal: pricingSummary.totalDisplayed,
};
```

4. **Enhanced logging** (lines 222-228):
```typescript
console.log(`[importProject] Room ${index + 1} calculated:`, {
  name: roomWithCalculations.name,
  laborTotal: roomWithCalculations.laborTotal,
  materialsTotal: roomWithCalculations.materialsTotal,
  grandTotal: roomWithCalculations.grandTotal,
  gallons: roomWithCalculations.gallonUsage,
});
```

---

## Benefits

### Before Fix:
❌ Import JSON → Contractor View shows 0.00 gal everywhere
❌ Must manually open each room
❌ Must click "Save" in each room (even without changes)
❌ Appears like a bug to the user
❌ Time-consuming for test scenarios

### After Fix:
✅ Import JSON → All data immediately calculated
✅ Contractor View shows correct gallon usage
✅ All totals (labor, materials, grand total) populated
✅ No manual action required
✅ Perfect for testing and demos
✅ Consistent with manual room creation

---

## Technical Details

### Uses Same Calculation Engine:
The import now uses `computeRoomPricingSummary()` - the same function that:
- RoomEditor uses for save (as of today's fix)
- Contractor View uses for display
- All other views use for calculations

This ensures **single source of truth** and **100% consistency**.

### Respects All Settings:
The auto-calculation respects:
- ✅ Project-level settings (coats, floor heights)
- ✅ Quote Builder filters
- ✅ Room-level toggles (paint walls, ceilings, etc.)
- ✅ Current pricing settings
- ✅ Combined rule (room toggle AND quote toggle)

---

## Testing

### Test Case 1: Import Basic Project
```json
{
  "clientInfo": {"name": "Test Client", "address": "123 Main St"},
  "floorCount": 1,
  "floorHeights": [8],
  "rooms": [
    {
      "name": "Living Room",
      "length": 20,
      "width": 15,
      "height": 8,
      "windowCount": 3,
      "doorCount": 2,
      ...
    }
  ]
}
```

**Expected Result**:
- Import succeeds
- Navigate to Contractor View
- Living Room shows non-zero gallon values immediately
- All totals displayed correctly
- No manual save needed

### Test Case 2: Import with Quote Builder Filters
```json
{
  "clientInfo": {...},
  "quoteBuilder": {
    "includeAllRooms": false,
    "includedRoomIds": ["room-1", "room-2"]
  },
  "rooms": [...]
}
```

**Expected Result**:
- Only rooms in `includedRoomIds` are included in calculations
- Excluded rooms still have gallon data, but aren't in project totals
- Quote Builder filters correctly applied

---

## Logs Output

When importing, you'll now see detailed calculation logs:

```
LOG  [importProject] Processing room 1: Living Room
LOG  [importProject] Room 1 calculated: {
  "name": "Living Room",
  "laborTotal": 1064.2,
  "materialsTotal": 220,
  "grandTotal": 1284,
  "gallons": {
    "wall": 3.23,
    "ceiling": 0.86,
    "trim": 0.15,
    "door": 0.14
  }
}
LOG  [importProject] Room 1 added successfully with calculations
```

This helps verify calculations are correct during import.

---

## Files Modified

1. **src/utils/importProject.ts**
   - Lines 5-6: Added imports
   - Lines 145-240: Added automatic calculation logic
   - Total changes: ~60 lines added

2. **README.md**
   - Lines 58-59: Documented automatic calculation feature

---

## Impact

### For Users:
- Seamless JSON import experience
- No confusion about "missing" data
- Instant verification that import worked correctly
- Perfect for test case scenarios

### For Development:
- Consistent calculation across all entry points
- Single source of truth maintained
- Easier to test and debug
- Less room for calculation discrepancies

### For Support:
- Fewer "bug" reports about import
- No need to explain manual save workaround
- Better first impression of the app

---

## Related Fixes Today

This fix complements the earlier RoomEditor fix:

1. **RoomEditor Fix** (earlier today):
   - Fixed save function to use `computeRoomPricingSummary()`
   - Ensures manual room creation/editing uses correct calculation

2. **Import Fix** (this fix):
   - Added automatic calculation during JSON import
   - Ensures imported rooms use correct calculation

**Result**: ALL room creation paths now use the same calculation engine! ✅

---

## Conclusion

Imported projects now work perfectly out of the box. No manual intervention needed, no confusing zero values, just immediate, accurate data ready to use in Contractor View.

**Status**: ✅ Complete and tested
