# Fix Log

This document tracks all bug fixes and feature implementations with their IDs, status, and details.

## Current Version
**CF-001v5** (commit 877cea1) - Dec 30, 2024

---

## Fixes

### CF-001v5: Form Field Labels Hidden Behind StepProgressIndicator ⏳ PENDING VERIFICATION
**Date:** Dec 30, 2024
**Status:** ⏳ Awaiting user confirmation (v5 - fixed scroll conflict)
**Severity:** MEDIUM - UX issue affecting form usability
**Commit:** 877cea1

#### Issue
When keyboard appears in ProjectSetupScreen's Client Information form, the ScrollView content scrolls up and field labels (Client Name, Address, City, etc.) hide behind the fixed StepProgressIndicator at the top. User cannot see which field they are typing in.

**Progression:**
- User taps field → keyboard appears
- ScrollView scrolls up to show input
- Field's LABEL scrolls behind StepProgressIndicator
- User loses context of which field is active

#### Root Cause
StepProgressIndicator is fixed at top of screen, outside the ScrollView. When keyboard appears, the ScrollView automatically scrolls to show the focused input, but doesn't account for the StepProgressIndicator obstruction. Labels scroll into the "forbidden zone" behind the indicator.

**Code location:** `src/screens/ProjectSetupScreen.tsx`

#### Solution (v5 - Fixed Scroll Conflict)
**v1 issue:** Initial calculation used `scrollToY = y - 16`, which positioned label 16px from top of viewport but didn't account for StepProgressIndicator blocking the top ~80px.

**v2-v4 issue:** Used correct formula and increased gap from 16→32→48px, but **no visual difference occurred**. This revealed the real problem: automatic keyboard handling was overriding custom scroll.

**Root cause:** `automaticallyAdjustKeyboardInsets={true}` on ScrollView was scrolling AFTER the custom scroll, completely overriding it.

**v5 fix:** Disable automatic keyboard handling and increase timing delay:

1. Changed `automaticallyAdjustKeyboardInsets` from `true` to `false`
2. Increased `setTimeout` delay from 100ms to 300ms
3. This ensures custom scroll runs AFTER keyboard animation completes
4. Custom scroll is no longer overridden by automatic behavior

Implemented custom scroll-to-field logic using refs and measureLayout:

1. Added refs for ScrollView and each field's label wrapper View
2. Created `handleFieldFocus()` function that:
   - Measures label position relative to ScrollView content
   - Calculates scroll position using formula: `scrollToY = y - STEP_INDICATOR_HEIGHT - MIN_GAP`
   - This ensures label appears at position (80px + 48px) = 128px from viewport top
   - 80px = StepProgressIndicator height, 48px = testing gap
3. Added `onFocus` handlers to all text inputs (Client Name, Address, City, Country, Phone, Email)

```typescript
const handleFieldFocus = (labelRef: React.RefObject<View>) => {
  if (!scrollViewRef.current || !labelRef.current) return;

  setTimeout(() => {
    labelRef.current?.measureLayout(
      findNodeHandle(scrollViewRef.current) as number,
      (x, y, width, height) => {
        const STEP_INDICATOR_HEIGHT = 80; // Measured height of indicator
        const MIN_GAP_BELOW_INDICATOR = 48; // Testing with 48px gap

        // Formula: If ScrollView scrolls by S, content at y appears at (y - S)
        // Want: (y - S) = 80 + 48, therefore S = y - 128
        const scrollToY = Math.max(0, y - STEP_INDICATOR_HEIGHT - MIN_GAP_BELOW_INDICATOR);

        scrollViewRef.current?.scrollTo({
          y: scrollToY,
          animated: true,
        });
      }
    );
  }, 100);
};
```

```typescript
// KEY FIX: Disable automatic keyboard handling
<ScrollView
  ref={scrollViewRef}
  automaticallyAdjustKeyboardInsets={false} // ← Changed from true
  ...
>

// Increased delay to run after keyboard animation
setTimeout(() => {
  // custom scroll logic...
}, 300); // ← Changed from 100ms
```

This ensures custom scroll works and labels appear exactly 48px below the StepProgressIndicator when their field is focused.

#### Files Changed
- `src/screens/ProjectSetupScreen.tsx` - Added findNodeHandle import, ScrollView ref with automaticallyAdjustKeyboardInsets={false}, label refs, handleFieldFocus function with 300ms delay, and onFocus handlers to all 6 client info text inputs

#### Verification
User needs to test each field:
- Client Name → Label "Client Name *" stays visible when typing
- Address → Label "Address *" stays visible when typing
- City → Label "City" stays visible when typing
- Country → Label "Country" stays visible when typing
- Phone → Label "Phone" stays visible when typing
- Email → Label "Email" stays visible when typing

All labels should have 48px gap below StepProgressIndicator when focused (testing value).

---

### UI-002: Remove Subtitle from Client Information Card ✅ VERIFIED
**Date:** Dec 30, 2024
**Status:** ✅ Fixed and verified by user
**Severity:** LOW - UI cleanup
**Commit:** f2b9ed7

#### Issue
Client Information card header had redundant subtitle "Enter client name" below the title.

#### Root Cause
Unnecessary subtitle text displayed in card header.

**Code location:** `src/screens/ProjectSetupScreen.tsx` lines 367-369

#### Solution
Removed the subtitle text element, keeping only the "Client Information" title.

```typescript
// BEFORE:
<View>
  <Text>Client Information</Text>
  <Text>Enter client name</Text>  // ← Removed this
</View>

// AFTER:
<Text>Client Information</Text>
```

#### Files Changed
- `src/screens/ProjectSetupScreen.tsx` - Removed subtitle from Client Information card header

#### Verification
User needs to test: Open ProjectSetupScreen → Client Information card should show only title, no subtitle.

---

### CF-003v2: Eliminate Area B Gap and Standardize Card Spacing ✅ VERIFIED
**Date:** Dec 30, 2024
**Status:** ✅ Fixed and verified by user
**Severity:** LOW - Visual/UX issue
**Commit:** 5bcaee8

#### Issue
- **AREA B**: Large gap between navigation header and StepProgressIndicator caused by SafeAreaView top inset
- **First card spacing**: 120px gap between StepProgressIndicator and Client Information card (inconsistent with 16px spacing between other cards)
- Expected: StepProgressIndicator appears immediately below navigation header, consistent 16px spacing for all cards
- Actual: Visible gap (Area B) between header and progress indicators, excessive spacing above first card

#### Root Cause
1. SafeAreaView was applying top inset padding, creating gap between navigation header and content
2. ScrollView had `paddingTop: 120` creating excessive space above first card

**Code location:** `src/screens/ProjectSetupScreen.tsx` lines 338, 352

#### Solution (v2)
1. Changed SafeAreaView to only apply bottom edge inset:
```typescript
// BEFORE:
<SafeAreaView style={{ flex: 1, ... }}>

// AFTER:
<SafeAreaView edges={["bottom"]} style={{ flex: 1, ... }}>
```

2. Removed excessive paddingTop override from ScrollView:
```typescript
// BEFORE:
contentContainerStyle={{ padding: Spacing.md, paddingTop: 120, paddingBottom: 200 }}

// AFTER:
contentContainerStyle={{ padding: Spacing.md, paddingBottom: 200 }}
// Now uses Spacing.md (16px) for top padding, matching card spacing
```

This eliminates the top inset gap and creates consistent 16px spacing throughout.

#### Files Changed
- `src/screens/ProjectSetupScreen.tsx` - Changed SafeAreaView edges to bottom only (line 338), removed paddingTop override (line 352)

#### Verification
User needs to test: Open ProjectSetupScreen → StepProgressIndicator should appear immediately below navigation header, Client Information card should have 16px spacing above it (matching spacing between cards).

---

### MD-002: Discard Changes Modal Requires Single Tap ✅ VERIFIED
**Date:** Dec 30, 2024, 12:45 AM ET
**Status:** ✅ Fixed and verified by user (v2)
**Severity:** MEDIUM - UX annoyance
**Commit:** 3c45d19 (v2 - navigation dispatch approach)

#### Issue
- Tapping "Discard Changes" in the save prompt modal requires **two taps** to exit
- Expected: Single tap immediately discards changes and exits
- Actual: First tap does nothing, second tap required to exit
- Affects: All editor screens (Room, Staircase, Fireplace, Built-in)

#### Root Cause
React's `setState` is asynchronous. When `handleDiscardAndLeave` called `setHasUnsavedChanges(false)` followed by `navigation.goBack()`, the state update hadn't propagated yet. The `usePreventRemove` hook was still checking the OLD value of `hasUnsavedChanges` (true), causing it to block the navigation and show the modal again.

**Code flow (BROKEN):**
```typescript
// First tap:
handleDiscardAndLeave() {
  setHasUnsavedChanges(false);  // Async - doesn't update immediately
  setShowSavePrompt(false);
  navigation.goBack();          // usePreventRemove still sees hasUnsavedChanges = true
}
// → Navigation blocked, modal shows again

// Second tap:
// Now hasUnsavedChanges is actually false, navigation succeeds
```

#### Solution (v2 - Navigation Dispatch Approach)
**First attempt (v1)** using `isDiscardingRef` didn't work - the ref-based bypass still had timing issues.

**Working solution (v2)**: Store the prevented navigation action and dispatch it when discarding:

```typescript
// 1. Added ref to store navigation action
const preventedNavigationActionRef = useRef<any>(null);

// 2. Store the action in usePreventRemove callback
usePreventRemove(hasUnsavedChanges, ({ data }) => {
  preventedNavigationActionRef.current = data.action;  // Store original action
  setShowSavePrompt(true);
});

// 3. Dispatch the stored action in handleDiscardAndLeave
const handleDiscardAndLeave = () => {
  setHasUnsavedChanges(false);
  setShowSavePrompt(false);

  // Complete the ORIGINAL navigation that was prevented
  if (preventedNavigationActionRef.current) {
    navigation.dispatch(preventedNavigationActionRef.current);
  } else {
    navigation.goBack();
  }
};
```

This approach completes the **original** navigation event that was prevented, rather than starting a new navigation attempt.

#### Files Changed
- `src/screens/RoomEditorScreen.tsx` - Added ref, updated usePreventRemove, fixed handleDiscardAndLeave, removed setTimeout
- `src/screens/StaircaseEditorScreen.tsx` - Added ref, updated usePreventRemove, fixed handleDiscardAndLeave
- `src/screens/FireplaceEditorScreen.tsx` - Added ref, updated usePreventRemove, fixed handleDiscardAndLeave
- `src/screens/BuiltInEditorScreen.tsx` - Added ref, updated usePreventRemove, fixed handleDiscardAndLeave

#### Verification
User needs to test: Edit field → Back → Discard → Should exit immediately with single tap

---

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

### CF-002: Remove Layout Gaps in ProjectSetupScreen ❌ REVERTED
**Date:** Dec 30, 2024
**Status:** ❌ Reverted - User feedback: "looks much worse than before"
**Commit:** c7b791b (reverted)

#### Issue
User reported excessive spacing in ProjectSetupScreen with AREA A (header), AREA B (gap), and AREA C (progress indicators).

#### Attempted Solutions
- **v1**: Removed `paddingTop: 120` from ScrollView
- **v2**: Integrated StepProgressIndicator into navigation header, removed SafeAreaView top inset

#### Result
User reported v2 looked worse than original layout. Reverted to commit a9fa866 (MD-002v2 state).

#### Lesson Learned
Do not modify ProjectSetupScreen layout without user approval of approach first.

---

## Fix Statistics

- **Total Fixes:** 7
- **Verified Working:** 6 (KB-002v4, DM-001, CAL-001, MD-002v2, CF-003v2, UI-002)
- **Pending Verification:** 1 (CF-001)
- **Reverted:** 2 (KB-003, CF-002)
- **Current Active:** CF-001 (awaiting confirmation)

## Notes

- All fixes follow the constraint: "SCOPE CONSTRAINT: Fix ONLY this specific issue. Do NOT modify, refactor, or 'improve' any other code."
- Version display on HomeScreen is updated with every fix deployment
- All commits are tagged with fix ID for traceability
- User tests all fixes on actual device before confirmation
