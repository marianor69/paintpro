# Export Calculation Trace - Implementation ✅

**Date:** 2025-12-08
**Status:** FULLY IMPLEMENTED

---

## 🎯 Feature Overview

A new Test Mode-only export that generates a complete step-by-step calculation trace for every room, staircase, and fireplace in the project. This export shows ALL inputs, rates, intermediate values, and final results used by the estimator, allowing end-to-end math verification without guessing.

---

## ✅ Implementation Details

### 1. UI Button (Test Mode Only)

**Location:** Project Actions card in ProjectDetailScreen
**Visibility:** Only when `appSettings.testMode === true`
**Color:** Amber/Orange (#F59E0B) to distinguish from other exports
**Icon:** Calculator icon (calculator-outline)

```typescript
{appSettings.testMode && (
  <Pressable
    onPress={handleExportCalculationTrace}
    style={{ backgroundColor: "#F59E0B" }}
  >
    <Ionicons name="calculator-outline" size={20} color={Colors.white} />
    <Text>Export Calculation Trace</Text>
    <Text>
      Export complete step-by-step math for each room, staircase, and
      fireplace showing all inputs, rates, and intermediate calculations
    </Text>
  </Pressable>
)}
```

---

### 2. Export Handler Function

**Function:** `handleExportCalculationTrace()`
**Location:** ProjectDetailScreen.tsx (lines 357-666)

The handler:
1. Gets QuoteBuilder settings
2. Calls `computeRoomPricingSummary()` for each room
3. Calls `computeStaircasePricingSummary()` for each staircase
4. Calls `computeFireplacePricingSummary()` for each fireplace
5. Builds comprehensive trace with all inputs, rates, and calculations
6. Exports JSON file via Share Sheet

---

## 📦 Exported Data Structure

### Top-Level Structure

```json
{
  "_traceMetadata": {
    "exportType": "calculation-trace",
    "version": "1.0",
    "timestamp": "2025-12-08T...",
    "projectId": "abc-123",
    "note": "Complete step-by-step calculation trace..."
  },
  "rooms": [ /* array of room traces */ ],
  "staircases": [ /* array of staircase traces */ ],
  "fireplaces": [ /* array of fireplace traces */ ]
}
```

---

### Room Trace Structure

Each room includes:

```json
{
  "roomId": "room-1",
  "name": "Living Room",

  "inputs": {
    "length": 20,
    "width": 15,
    "height": 8,
    "manualArea": null,
    "ceilingType": "flat",
    "cathedralPeakHeight": null,
    "floor": 1,
    "coatsWalls": 2,
    "coatsCeiling": 2,
    "coatsTrim": 1,
    "coatsDoors": 1,
    "doors": 2,
    "windows": 3,
    "singleDoorClosets": 1,
    "doubleDoorClosets": 0,
    "paintWalls": true,
    "paintCeilings": true,
    "paintTrim": true,
    "paintDoors": true,
    "paintWindows": false,
    "paintBaseboard": true,
    "hasCrownMoulding": false,
    "includeClosetInteriorInQuote": true
  },

  "coverageRules": {
    "wallCoverageSqFtPerGallon": 350,
    "ceilingCoverageSqFtPerGallon": 350,
    "trimCoverageSqFtPerGallon": 350,
    "doorCoverageSqFtPerGallon": 350,
    "primerCoverageSqFtPerGallon": 350
  },

  "laborRates": {
    "wallLaborPerSqFt": 1.5,
    "ceilingLaborPerSqFt": 1.75,
    "baseboardLaborPerLF": 1.25,
    "doorLabor": 50,
    "windowLabor": 35,
    "closetLabor": 75,
    "crownMouldingLaborPerLF": 1.5
  },

  "paintPrices": {
    "wallPaintPerGallon": 45,
    "ceilingPaintPerGallon": 40,
    "trimPaintPerGallon": 50,
    "doorPaintPerGallon": 50,
    "primerPerGallon": 35
  },

  "calculationDimensions": {
    "doorHeight": 7,
    "doorWidth": 3,
    "windowWidth": 3,
    "windowHeight": 5,
    "singleClosetWidth": 24,
    "singleClosetHeight": 80,
    "doubleClosetWidth": 48,
    "doubleClosetHeight": 80,
    "baseboardWidth": 5.5,
    "crownMouldingWidth": 5.5,
    "closetCavityDepth": 2
  },

  "combinedRuleFlags": {
    "includedWalls": true,
    "includedCeilings": true,
    "includedTrim": true,
    "includedDoors": true,
    "includedWindows": false,
    "includedBaseboards": true,
    "includedClosets": true
  },

  "stepByStep": {
    // AREAS CALCULATED
    "wallArea": 560,
    "ceilingArea": 300,
    "baseboardLF": 70,
    "crownMouldingLF": 0,
    "closetWallArea": 48,
    "closetCeilingArea": 8,
    "closetBaseboardLF": 16,

    // COUNTS
    "doorUnits": 2,
    "windowUnits": 3,

    // PAINT GALLONS
    "paintGallonsWalls": 3.2,
    "paintGallonsCeiling": 1.71,
    "paintGallonsTrim": 0.4,
    "paintGallonsDoors": 0.24,
    "paintGallonsPrimer": 1.11,

    // LABOR COSTS (raw per category)
    "laborWallsRaw": 840,
    "laborCeilingRaw": 525,
    "laborBaseboardRaw": 87.5,
    "laborDoorsRaw": 100,
    "laborWindowsRaw": 0,
    "laborClosetsRaw": 75,
    "laborCrownMouldingRaw": 0,

    // LABOR SUBTOTALS
    "laborSubtotalBeforeRounding": 1627.5,
    "laborSubtotalAfterRounding": 1627.5,

    // MATERIAL COSTS (raw per category)
    "materialsWallsRaw": 180,
    "materialsCeilingRaw": 80,
    "materialsTrimRaw": 50,
    "materialsDoorsRaw": 50,

    // MATERIALS SUBTOTALS
    "materialsSubtotalBeforeRounding": 360,
    "materialsSubtotalAfterRounding": 360,

    // FINAL TOTALS
    "finalTotalBeforeRounding": 1987.5,
    "finalTotalDisplayed": 1988
  }
}
```

---

### Staircase Trace Structure

```json
{
  "staircaseId": "stair-1",
  "name": "Staircase",

  "inputs": {
    "riserCount": 14,
    "spindleCount": 28,
    "handrailLength": 12,
    "hasSecondaryStairwell": false,
    "coats": 2
  },

  "laborRates": {
    "riserLabor": 15,
    "spindleLabor": 8,
    "handrailLaborPerLF": 10
  },

  "paintPrices": {
    "trimPaintPerGallon": 50
  },

  "coverageRules": {
    "trimCoverageSqFtPerGallon": 350
  },

  "stepByStep": {
    "paintableArea": 156.5,
    "totalGallons": 0.89,

    "laborRisersRaw": 210,
    "laborSpindlesRaw": 224,
    "laborHandrailRaw": 120,

    "laborSubtotalBeforeRounding": 554,
    "laborSubtotalAfterRounding": 554,

    "materialsSubtotalBeforeRounding": 50,
    "materialsSubtotalAfterRounding": 50,

    "finalTotalBeforeRounding": 604,
    "finalTotalDisplayed": 604
  }
}
```

---

### Fireplace Trace Structure

```json
{
  "fireplaceId": "fp-1",
  "name": "Fireplace",

  "inputs": {
    "width": 5,
    "height": 4,
    "depth": 1.5,
    "hasTrim": true,
    "trimLinearFeet": 18,
    "coats": 2
  },

  "laborRates": {
    "fireplaceLabor": 150,
    "baseboardLaborPerLF": 1.25
  },

  "paintPrices": {
    "wallPaintPerGallon": 45
  },

  "coverageRules": {
    "wallCoverageSqFtPerGallon": 350
  },

  "stepByStep": {
    "paintableArea": 32.5,
    "totalGallons": 0.19,

    "laborFireplaceRaw": 150,
    "laborTrimRaw": 22.5,

    "laborSubtotalBeforeRounding": 172.5,
    "laborSubtotalAfterRounding": 172.5,

    "materialsSubtotalBeforeRounding": 45,
    "materialsSubtotalAfterRounding": 45,

    "finalTotalBeforeRounding": 217.5,
    "finalTotalDisplayed": 218
  }
}
```

---

## 🔍 What Makes This Useful

### 1. Complete Input Visibility
Every single input used in the calculation is shown:
- Room dimensions (length, width, height)
- Feature counts (doors, windows, closets)
- Paint toggles (what's included/excluded)
- Coats applied to each surface

### 2. All Rates Documented
Every rate used in the math:
- Labor rates (per sq ft, per LF, per unit)
- Material prices (per gallon)
- Coverage rules (sq ft per gallon)
- Calculation dimensions (door/window sizes)

### 3. Step-by-Step Breakdown
See intermediate calculations:
- Areas calculated per surface
- Gallons calculated per category
- Labor costs per surface (raw)
- Material costs per category (raw)
- Subtotals before rounding
- Subtotals after rounding
- Final total (displayed in UI)

### 4. Combined Rule Verification
See what's actually included:
- `includedWalls: true` → walls counted
- `includedWindows: false` → windows excluded
- Verify combined rule logic working correctly

### 5. Rounding Transparency
See before and after rounding:
```json
"laborSubtotalBeforeRounding": 1627.5,
"laborSubtotalAfterRounding": 1627.5,
"finalTotalBeforeRounding": 1987.5,
"finalTotalDisplayed": 1988
```

---

## 🎯 Use Cases

### Use Case 1: Verify Room Total

**Problem:** Living Room shows $1,988 but you expect $2,000

**Solution:** Export calculation trace and check:

1. **Check Inputs:**
   ```json
   "inputs": {
     "length": 20,  // ✅ Correct
     "width": 15,   // ✅ Correct
     "height": 8    // ✅ Correct
   }
   ```

2. **Check Labor Rates:**
   ```json
   "laborRates": {
     "wallLaborPerSqFt": 1.5  // ✅ Expected
   }
   ```

3. **Check Calculated Areas:**
   ```json
   "stepByStep": {
     "wallArea": 560  // 20+15+20+15 = 70LF × 8ft = 560 sq ft ✅
   }
   ```

4. **Check Labor Calculation:**
   ```json
   "laborWallsRaw": 840  // 560 × 1.5 = 840 ✅
   ```

5. **Verify Final Total:**
   ```json
   "finalTotalBeforeRounding": 1987.5,
   "finalTotalDisplayed": 1988  // Math.round(1987.5) = 1988 ✅
   ```

**Result:** Math is correct. $1,988 is accurate based on inputs and rates.

---

### Use Case 2: Find Incorrect Rate

**Problem:** Bedroom total seems too high

**Solution:** Export and compare rates:

```json
"laborRates": {
  "wallLaborPerSqFt": 2.0  // ❌ Should be 1.5!
}
```

**Result:** Labor rate was accidentally changed. Reset to 1.5 and recalculate.

---

### Use Case 3: Verify Combined Rule

**Problem:** Windows should be excluded but cost still high

**Solution:** Check combined rule flags:

```json
"inputs": {
  "paintWindows": true  // Room toggle ON
},
"combinedRuleFlags": {
  "includedWindows": false  // ✅ Combined rule correctly excluded
},
"stepByStep": {
  "laborWindowsRaw": 0,  // ✅ No window labor
  "windowUnits": 3       // Count still shown (correct)
}
```

**Result:** Combined rule working correctly. Windows excluded from cost.

---

### Use Case 4: Debug Rounding Discrepancy

**Problem:** UI shows $1,988 but internal calculations say $1,987.50

**Solution:** Check rounding in trace:

```json
"finalTotalBeforeRounding": 1987.5,  // Internal value
"finalTotalDisplayed": 1988          // Math.round(1987.5) = 1988
```

**Result:** UI correctly rounds to $1,988. No issue - this is expected behavior.

---

## 🧪 Testing the Export

### Step 1: Enable Test Mode
1. Open Settings
2. Toggle "Test Mode" ON
3. Navigate to any project

### Step 2: Export Calculation Trace
1. Scroll to "Project Actions" card
2. See amber/orange button: "Export Calculation Trace"
3. Tap button
4. Share/save JSON file

### Step 3: Verify Export Contents
Open JSON and verify:
- All rooms present in export
- All staircases present
- All fireplaces present
- Each entry has:
  - inputs
  - coverageRules
  - laborRates
  - paintPrices
  - calculationDimensions
  - combinedRuleFlags
  - stepByStep

### Step 4: Verify Math
Pick one room and manually verify:
1. Wall area = (L+W+L+W) × H - door openings - window openings
2. Labor = area × rate
3. Materials = Math.ceil(gallons) × price
4. Total = labor + materials

Compare your calculation to `stepByStep` values.

---

## ✅ Requirements Met

### All Rules Followed

✅ **Uses SAME calculation logic as app**
- Calls `computeRoomPricingSummary()` (unified engine)
- Calls `computeStaircasePricingSummary()` (unified engine)
- Calls `computeFireplacePricingSummary()` (unified engine)
- NO duplicate math - uses exact same functions as UI

✅ **Applies rounding EXACTLY as UI**
- `laborDisplayed` = `parseFloat(laborCost.toFixed(2))`
- `materialsDisplayed` = `parseFloat(materialsCost.toFixed(2))`
- `totalDisplayed` = `Math.round(totalCost)`
- Same rounding as displayed in Room Editor

✅ **Allows end-to-end verification**
- All inputs shown
- All rates shown
- All intermediate values shown
- All final values shown
- Can verify math without guessing

✅ **Only in Test Mode**
- Button wrapped in `{appSettings.testMode && (...)}`
- Only visible when testMode = true

---

## 📊 Export Size

**Typical Export:**
- 3 rooms: ~15 KB
- 1 staircase: ~3 KB
- 1 fireplace: ~2 KB
- **Total: ~20 KB**

Human-readable with 2-space indentation.

---

## 📁 Files Modified

1. ✅ `/home/user/workspace/src/screens/ProjectDetailScreen.tsx`
   - Lines 357-666: Added `handleExportCalculationTrace()` function
   - Lines 1394-1417: Added amber export button UI (Test Mode only)

---

## 🎉 Summary

### What Was Built

A comprehensive calculation trace export that shows:
- **ALL inputs** for every room/staircase/fireplace
- **ALL rates** (labor, materials, coverage)
- **ALL dimensions** (door/window/closet sizes)
- **Step-by-step calculations** (areas, gallons, costs)
- **Before & after rounding** (raw vs displayed)
- **Combined rule flags** (what's included/excluded)

### Why It's Useful

**Before:** "Why is this room $1,988?"
→ Have to guess: Is it the rate? The dimensions? The rounding?

**After:** Export trace → See every input, rate, and calculation
→ Verify math end-to-end without guessing

### How to Access

1. Settings → Test Mode ON
2. Any Project → Project Actions
3. Amber button: "Export Calculation Trace"
4. Share/save JSON file
5. Open JSON → See complete math breakdown

---

**Status:** ✅ COMPLETE AND VERIFIED
**TypeScript:** ✅ Passing
**Math Verification:** ✅ Uses same engine as UI
**Rounding:** ✅ Matches UI exactly
