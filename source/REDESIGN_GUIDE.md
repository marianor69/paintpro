# UI Redesign Implementation Guide

## ✅ Completed

### 1. Design System Foundation
- Created `/src/utils/designSystem.ts` with all color, typography, spacing, and shadow constants
- All colors match spec (Primary Blue #3A70C8, Warm Gray background #F6F4F2, etc.)
- Typography system (H1: 26pt, H2: 20pt, H3: 17pt, Body: 16pt, Caption: 13pt)
- 8-point spacing system and 12px border radius

### 2. Standardized Input Components
- **NumericInput** (`/src/components/NumericInput.tsx`): Numeric keypad with "Done" button
- **DimensionInput** (`/src/components/DimensionInput.tsx`): Two-field ft/in input
- **Toggle** (`/src/components/Toggle.tsx`): iOS-style switches
- **Card** (`/src/components/Card.tsx`): Consistent card container with shadows

### 3. Bottom Tab Navigation
- Updated `/src/navigation/RootNavigator.tsx` with 4 tabs:
  - Projects
  - Quote Builder
  - Contractor View (renamed from Admin View)
  - Settings
- Tab bar styled with design system colors

### 4. Settings Screen Reorganization
- Created `/src/screens/SettingsScreen.tsx` with new structure:
  - **Paint Coverage Rules** section (centralized source of truth)
  - **Default Coats** section
  - **App Behavior** section with Test Mode toggle
- Created `/src/state/appSettings.ts` store for centralized paint coverage and app settings

### 5. State Management Updates
- Paint coverage values moved from pricing store to app settings store
- Test Mode toggle controls visibility of JSON import/export buttons

## 🔨 Remaining Work

### Priority 1: Update Existing Screens to Use Design System

#### A. Projects Screen (HomeScreen.tsx)
**Current state:** Uses old Tailwind classes
**Required changes:**
1. Replace Tailwind color classes with design system colors
2. Use Card component for project list items
3. Apply consistent spacing using Spacing constants
4. Update typography to match design system
5. Hide JSON import/export button unless testMode is enabled

**Example pattern:**
```tsx
import { Colors, Typography, Spacing, BorderRadius, Shadows } from "../utils/designSystem";
import { Card } from "../components/Card";
import { useAppSettings } from "../state/appSettings";

// In component:
const { testMode } = useAppSettings();

// Replace old card:
<View className="bg-white rounded-xl p-4">
// With:
<Card>
```

#### B. ProjectDetailScreen.tsx
**Required changes:**
1. Update header section with design system
2. Use Card components for room/staircase/fireplace lists
3. Apply consistent button styling
4. Replace "Admin View" text with "Contractor View"
5. Hide Bluetooth laser icons/buttons

#### C. Quote Builder Screen
**Required changes:**
1. Create clean top-level layout with Cards
2. Show scope toggles in organized card groups
3. Create persistent summary card showing:
   - Estimated materials
   - Estimated labor
   - Total project cost
4. Apply design system throughout

#### D. Room Editor Screen
**Required changes:**
1. Replace all manual inputs with NumericInput and DimensionInput components
2. Use Toggle component for all boolean switches
3. Organize UI into Card sections:
   - Measurements card
   - Openings card (windows, doors)
   - Paint options card
   - Closets card
   - Special features card
4. Remove Bluetooth laser measurement UI
5. Apply consistent spacing and typography

### Priority 2: Rename Admin View → Contractor View

**Files to update:**
- `/src/screens/MaterialsSummaryScreen.tsx`
- `/src/screens/ProjectDetailScreen.tsx`
- `/src/screens/ClientProposalScreen.tsx`
- Any other references to "Admin"

**Search command:**
```bash
grep -r "Admin" src/screens/
```

### Priority 3: Remove Bluetooth UI

**Files to check:**
- `/src/screens/RoomEditorScreen.tsx`
- `/src/screens/StaircaseEditorScreen.tsx`
- `/src/screens/FireplaceEditorScreen.tsx`
- `/src/components/*` (any Bluetooth-related components)

**Action:** Hide or remove all Bluetooth laser measurement buttons/icons

### Priority 4: Test Mode Integration

**Files to update:**
- HomeScreen.tsx: Conditionally show JSON import button
- ProjectDetailScreen.tsx: Conditionally show JSON export button
- Any other screens with debugging utilities

**Pattern:**
```tsx
const { testMode } = useAppSettings();

{testMode && (
  <Pressable onPress={handleDebugAction}>
    <Text>Debug Button</Text>
  </Pressable>
)}
```

## 📋 Implementation Checklist

### Phase 1: Core Screens (Do First)
- [ ] Update HomeScreen.tsx with design system
- [ ] Update ProjectDetailScreen.tsx with design system
- [ ] Update RoomEditorScreen.tsx with new input components
- [ ] Hide Bluetooth UI in all editor screens
- [ ] Integrate testMode toggle in debug UI sections

### Phase 2: Quote System
- [ ] Update QuoteBuilderScreen.tsx with clean card-based UI
- [ ] Update MaterialsSummaryScreen.tsx (Contractor View)
- [ ] Update ClientProposalScreen.tsx
- [ ] Rename all "Admin" references to "Contractor"

### Phase 3: Other Screens
- [ ] Update StaircaseEditorScreen.tsx
- [ ] Update FireplaceEditorScreen.tsx
- [ ] Update PricingSettingsScreen.tsx
- [ ] Update CalculationSettingsScreen.tsx
- [ ] Update NewProjectScreen.tsx

### Phase 4: Polish
- [ ] Ensure keyboard dismisses properly on all numeric inputs
- [ ] Test scrolling and SafeArea on all screens
- [ ] Verify consistent spacing throughout
- [ ] Update README.md with new design system docs

## 🎨 Design System Usage Guide

### Colors
```tsx
import { Colors } from "../utils/designSystem";

<View style={{ backgroundColor: Colors.backgroundWarmGray }}>
  <Text style={{ color: Colors.darkCharcoal }}>Hello</Text>
</View>
```

### Typography
```tsx
import { Typography } from "../utils/designSystem";

<Text style={Typography.h1}>Heading</Text>
<Text style={Typography.body}>Body text</Text>
<Text style={Typography.caption}>Small caption</Text>
```

### Spacing
```tsx
import { Spacing } from "../utils/designSystem";

<View style={{
  padding: Spacing.md,
  marginBottom: Spacing.lg,
  gap: Spacing.sm
}}>
```

### Cards
```tsx
import { Card } from "../components/Card";

<Card>
  <Text>Content here</Text>
</Card>
```

### Input Components
```tsx
import { NumericInput, DimensionInput, Toggle } from "../components";

<NumericInput
  label="Wall Coverage"
  value={value}
  onChangeText={setValue}
  unit="sqft/gal"
/>

<DimensionInput
  label="Room Length"
  feetValue={feet}
  inchesValue={inches}
  onFeetChange={setFeet}
  onInchesChange={setInches}
/>

<Toggle
  label="Paint Baseboards"
  value={paintBaseboards}
  onValueChange={setPaintBaseboards}
  description="Optional description"
/>
```

## 🔄 Coverage Settings Migration

Paint coverage values have been centralized in Settings. Other screens should read from the app settings store:

```tsx
import { useAppSettings } from "../state/appSettings";

// In component:
const appSettings = useAppSettings();
const wallCoverage = appSettings.wallCoverageSqFtPerGallon;
```

## 📝 Notes

1. The design system is now the single source of truth for all styling
2. Test Mode toggle in Settings controls debug UI visibility
3. All numeric inputs use the standardized NumericInput component
4. All dimension inputs use the standardized DimensionInput component
5. All toggles use the Toggle component
6. Cards provide consistent shadows and spacing
7. Contractor View replaces Admin View throughout

## ⚠️ Important Reminders

- Always import design system constants, never hardcode colors/sizes
- Use `as any` type assertion for tab screen components if needed
- Keep SafeAreaView usage consistent (edges: ["bottom"] for most screens)
- Test keyboard behavior on all input screens
- Verify Test Mode toggle properly hides/shows debug UI
