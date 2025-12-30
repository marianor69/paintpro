# Fix Log

This document tracks all bug fixes and feature implementations with their IDs, status, and details.

## Current Version
**CAL-001-FIXED** (commit 0f98b93) - Dec 29, 11:15 PM ET

---

## Fixes

### CAL-001: Metric Room Perimeter Calculations ✅ VERIFIED
**Date:** Dec 29, 2024, 11:15 PM ET
**Status:** ✅ Fixed and verified by user
**Severity:** HIGH - Affects pricing accuracy
**Commit:** 0f98b93

#### Issue
- 10m × 10m room in metric mode showed **12.19m** for baseboard and crown moulding
- Expected: **40m** perimeter (2 × (10 + 10) = 40m)
- Actual: **12.19m** (incorrect conversion)

#### Root Cause
Room Summary preview was using `parseFloat()` directly on display values instead of converting from metric to imperial before calculations.

**Code location:** `src/screens/RoomEditorScreen.tsx` lines 674-675
```typescript
// WRONG:
length: parseFloat(length) || 0,  // = 10 when user enters 10m
width: parseFloat(width) || 0,

// Result: perimeter = 2 × (10 + 10) = 40ft → displays as 12.19m (wrong!)
```

#### Solution
Added proper unit conversion to preview calculation:
```typescript
// CORRECT:
const previewLengthFeet = parseDisplayValue(length || "0", 'length', unitSystem);
const previewWidthFeet = parseDisplayValue(width || "0", 'length', unitSystem);

// Result: 10m → 32.81ft → perimeter = 131.23ft → displays as 40m (correct!)
```

#### Files Changed
- `src/screens/RoomEditorScreen.tsx` - Fixed preview conversion (lines 671-686)
- `src/utils/pricingSummary.ts` - Added defensive comments
- `src/utils/calculations.ts` - Added defensive comments

#### Verification
User confirmed: "fixed."

---

### DM-001: Add Name/Location Field to Structural Items ✅ VERIFIED
**Date:** Dec 29, 2024, ~7:00 PM ET
**Status:** ✅ Fixed and verified by user
**Commit:** c539cdc, a7b668c

#### Issue
Staircases, Fireplaces, and Built-ins lacked a Name/Location field for identification.

#### Solution
- Added `name: string` field to Staircase and Fireplace interfaces
- Built-in already had name field
- Added name as FIRST field in all three editor screens using FormInput component
- Integrated with KB-002 keyboard navigation (Next button advances from Name → next field)

#### Files Changed
- `src/types/painting.ts` - Added name field to interfaces
- `src/screens/StaircaseEditorScreen.tsx` - Added name field as first input
- `src/screens/FireplaceEditorScreen.tsx` - Added name field as first input
- `src/screens/BuiltInEditorScreen.tsx` - Converted to use FormInput for name

#### Verification
User tested and confirmed working.

---

### KB-002v4: Keyboard Navigation with Next/Done Buttons ✅ VERIFIED
**Date:** Dec 29, 2024, ~9:15 PM ET
**Status:** ✅ Fixed and verified by user (currently active)
**Commit:** 88be488

#### Issue
Numeric keyboards on iOS don't show return keys, making it impossible to advance between fields or dismiss keyboard.

#### Root Cause
Multiple attempts failed:
1. Changing keyboard type to "default" → showed QWERTY keyboard (wrong)
2. Using shared InputAccessoryView ID → React Native only rendered one toolbar
3. Only showing for numeric keyboards → text fields had no Next button

#### Solution
Use InputAccessoryView with **unique IDs per component instance**:
```typescript
import { useId } from "react";

const uniqueId = useId();
const accessoryID = shouldShowAccessory ? `formInput-${uniqueId}` : undefined;

// Show for ALL keyboards with navigation (not just numeric)
const shouldShowAccessory = Platform.OS === "ios" && (nextFieldRef || isFinal);
```

#### Files Changed
- `src/components/FormInput.tsx` - Added unique InputAccessoryView with useId()
- `src/components/DimensionInput.tsx` - Added unique InputAccessoryView with useId()

#### Verification
User confirmed: "finally...!!" after KB-002v3 deployment.

**Note:** KB-002v4 is the current working version after KB-003 was reverted.

---

### KB-003: iOS-Standard Cursor Behavior ❌ REVERTED
**Date:** Dec 29, 2024, ~10:00 PM ET
**Status:** ❌ Failed - Broke KB-002, reverted to 88be488
**Commit:** 8aac65d (reverted)

#### Issue
User wanted iOS-standard cursor behavior instead of custom blue cursor.

#### Attempted Solution
Removed `cursorColor` and `selectionColor` props from FormInput and DimensionInput components.

#### Result
**Broke KB-002** keyboard navigation in some way (exact cause unknown).

#### Action Taken
Full revert to commit 88be488 (KB-002v4) via:
```bash
git reset --hard 88be488
```

User explicitly stated: "you broke KB-002... revert to 88be488"

#### Lesson Learned
Do not attempt KB-003 again without:
1. Understanding what specifically broke in the previous attempt
2. User confirmation to proceed
3. A different approach that truly doesn't touch KB-002 code

---

## Fix Statistics

- **Total Fixes:** 3
- **Verified Working:** 3 (KB-002v4, DM-001, CAL-001)
- **Reverted:** 1 (KB-003)
- **Current Active:** KB-002v4 (88be488) + DM-001 (c539cdc) + CAL-001 (0f98b93)

## Notes

- All fixes follow the constraint: "SCOPE CONSTRAINT: Fix ONLY this specific issue. Do NOT modify, refactor, or 'improve' any other code."
- Version display on HomeScreen is updated with every fix deployment
- All commits are tagged with fix ID for traceability
- User tests all fixes on actual device before confirmation
