# UI Redesign Progress Report

## ✅ **COMPLETED WORK**

### 1. Core Infrastructure (100% Complete)
- ✅ **Design System** (`/src/utils/designSystem.ts`)
  - All colors: Primary Blue #3A70C8, Warm Gray background #F6F4F2, etc.
  - Typography: H1 (26pt), H2 (20pt), H3 (17pt), Body (16pt), Caption (13pt)
  - 8-point spacing system (4/8/16/24/32)
  - 12px border radius
  - Subtle shadows (rgba(0,0,0,0.08))

- ✅ **Standardized Components**
  - `NumericInput`: Numeric keypad with "Done" button
  - `DimensionInput`: Two-field ft/in input
  - `Toggle`: iOS-style switches
  - `Card`: Consistent card container with shadows

- ✅ **State Management**
  - `/src/state/appSettings.ts`: Centralized paint coverage rules, default coats, test mode
  - Coverage values moved from pricing store to app settings

- ✅ **Bottom Tab Navigation**
  - 4 tabs: Projects, Quote Builder, Contractor View, Settings
  - Fully styled with design system

- ✅ **Settings Screen** (`/src/screens/SettingsScreen.tsx`)
  - Paint Coverage Rules section (single source of truth)
  - Default Coats section
  - App Behavior section with Test Mode toggle
  - Fully redesigned with new components

### 2. Updated Screens (40% Complete)
- ✅ **HomeScreen** - Fully redesigned
  - Uses Card components for project list
  - Test Mode integration (hides/shows JSON import/export)
  - Design system colors, typography, and spacing throughout

- ✅ **NewProjectScreen** - Fully redesigned
  - Card-based layout
  - NumericInput for floor heights
  - Consistent button styling
  - Proper keyboard handling

## 🔨 **REMAINING WORK**

### Priority 1: Critical User-Facing Screens

#### **ProjectDetailScreen** (HIGH PRIORITY)
- [ ] Replace all hardcoded colors with design system
- [ ] Use Card components for room/staircase/fireplace lists
- [ ] Rename "Admin View" → "Contractor View"
- [ ] Test Mode: Conditionally show/hide JSON export button
- [ ] Remove Bluetooth laser UI elements
- [ ] Apply consistent spacing and typography

#### **RoomEditorScreen** (HIGH PRIORITY - COMPLEX)
- [ ] Replace ALL inputs with NumericInput and DimensionInput
- [ ] Use Toggle for all boolean switches
- [ ] Organize into Card sections:
  - Measurements card (length/width with DimensionInput)
  - Openings card (windows, doors, closets)
  - Paint options card (toggles for what to paint)
  - Special features card (ceiling type, crown moulding)
- [ ] **REMOVE** all Bluetooth laser measurement UI
- [ ] Apply design system throughout
- [ ] Ensure proper keyboard handling

### Priority 2: Editor Screens

#### **StaircaseEditorScreen**
- [ ] Use NumericInput for all numeric fields
- [ ] Use Toggle for boolean switches
- [ ] Card-based layout
- [ ] Remove Bluetooth UI

#### **FireplaceEditorScreen**
- [ ] Use NumericInput for dimensions
- [ ] Use Toggle for trim toggle
- [ ] Card-based layout

### Priority 3: Quote System

#### **QuoteBuilderScreen**
- [ ] Create clean card-based UI
- [ ] Show scope toggles in organized card groups
- [ ] Persistent summary card showing:
  - Estimated materials
  - Estimated labor
  - Total project cost
- [ ] Apply design system

#### **MaterialsSummaryScreen** (RENAME TO CONTRACTOR VIEW)
- [ ] Update title and all references to "Contractor View"
- [ ] Use Card components for sections
- [ ] Apply design system colors and typography
- [ ] Test Mode: Conditionally show/hide export buttons

#### **ClientProposalScreen**
- [ ] Use Card for room listings
- [ ] Apply design system
- [ ] Update "Admin" references to "Contractor"

### Priority 4: Settings Screens

#### **PricingSettingsScreen**
- [ ] Use NumericInput for all pricing fields
- [ ] Card-based sections:
  - Labor Rates card
  - Material Prices (Single Gallons) card
  - Material Prices (5-Gallon Buckets) card
- [ ] **REMOVE** coverage settings (moved to main Settings)
- [ ] Add note: "Coverage rules are now in Settings tab"

#### **CalculationSettingsScreen**
- [ ] Use NumericInput for all measurement fields
- [ ] Card-based sections:
  - Door Defaults card
  - Window Defaults card
  - Closet Defaults card
  - Trim Defaults card
- [ ] Apply design system

#### **QuoteManagerScreen**
- [ ] Apply design system
- [ ] Use Card components

## 📋 **IMPLEMENTATION PATTERNS**

### Pattern 1: Numeric Input Replacement
```tsx
// OLD
<TextInput
  value={value}
  onChangeText={setValue}
  keyboardType="numeric"
  className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3"
/>

// NEW
<NumericInput
  label="Field Label"
  value={value}
  onChangeText={setValue}
  unit="ft" // or "sqft", "$/gal", etc.
  placeholder="0"
/>
```

### Pattern 2: Dimension Input Replacement
```tsx
// OLD (separate ft/in inputs)
<TextInput value={feet} onChangeText={setFeet} keyboardType="numeric" />
<TextInput value={inches} onChangeText={setInches} keyboardType="numeric" />

// NEW
<DimensionInput
  label="Room Length"
  feetValue={feet}
  inchesValue={inches}
  onFeetChange={setFeet}
  onInchesChange={setInches}
/>
```

### Pattern 3: Toggle Replacement
```tsx
// OLD
<Switch
  value={value}
  onValueChange={setValue}
  trackColor={{ false: "#ccc", true: "#3b82f6" }}
/>

// NEW
<Toggle
  label="Paint Baseboards"
  value={value}
  onValueChange={setValue}
  description="Optional helper text"
/>
```

### Pattern 4: Card Wrapper
```tsx
// OLD
<View className="bg-white rounded-xl p-4 border border-gray-200">
  {content}
</View>

// NEW
<Card style={{ marginBottom: Spacing.md }}>
  {content}
</Card>
```

### Pattern 5: Test Mode Integration
```tsx
import { useAppSettings } from "../state/appSettings";

const testMode = useAppSettings((s) => s.testMode);

{testMode && (
  <Pressable onPress={handleDebugAction}>
    <Text>Debug Button</Text>
  </Pressable>
)}
```

### Pattern 6: Remove Bluetooth UI
```tsx
// Search for and remove/hide:
- Any "Scan" buttons
- Bluetooth icons (bluetooth, radio icons)
- "Connected to GLM 50C" text
- Bluetooth status indicators
```

### Pattern 7: Admin → Contractor Renaming
```bash
# Find all references:
grep -r "Admin" src/screens/

# Replace with "Contractor View" or "Contractor"
- "Admin View" → "Contractor View"
- "Admin Materials Summary" → "Contractor View"
- "AdminSummary" → "ContractorSummary" (if applicable)
```

## 🎯 **NEXT STEPS (Recommended Order)**

1. **ProjectDetailScreen** - Critical hub screen
2. **RoomEditorScreen** - Most complex, frequently used
3. **StaircaseEditorScreen** - Similar patterns to Room Editor
4. **FireplaceEditorScreen** - Similar patterns to Room Editor
5. **PricingSettingsScreen** - Update with NumericInput
6. **CalculationSettingsScreen** - Update with NumericInput
7. **QuoteBuilderScreen** - Important but less frequently edited
8. **MaterialsSummaryScreen** - Rename + redesign
9. **ClientProposalScreen** - Final polish
10. **QuoteManagerScreen** - Final polish

## ⚠️ **CRITICAL NOTES**

1. **Coverage Settings Migration**:
   - Paint coverage is NOW in Settings screen (`useAppSettings`)
   - Update all calculations to read from `useAppSettings()` instead of `usePricingStore()`
   - Remove coverage fields from PricingSettingsScreen

2. **Test Mode**:
   - Controlled by `useAppSettings((s) => s.testMode)`
   - When OFF: hide JSON import/export, debug buttons
   - When ON: show all debugging utilities

3. **Bluetooth Removal**:
   - Remove ALL Bluetooth UI elements
   - Keep bluetooth service file for future use
   - Hide scan buttons, connection status, etc.

4. **Typography Usage**:
   ```tsx
   <Text style={Typography.h1}>Heading</Text>
   <Text style={Typography.h2}>Subheading</Text>
   <Text style={Typography.h3}>Section Title</Text>
   <Text style={Typography.body}>Body text</Text>
   <Text style={Typography.caption}>Small text</Text>
   ```

5. **Color Usage**:
   ```tsx
   backgroundColor: Colors.primaryBlue
   backgroundColor: Colors.backgroundWarmGray
   color: Colors.darkCharcoal
   color: Colors.mediumGray
   borderColor: Colors.neutralGray
   ```

## 📊 **PROGRESS SUMMARY**

- ✅ **Design System**: 100% Complete
- ✅ **Components**: 100% Complete
- ✅ **State Management**: 100% Complete
- ✅ **Navigation**: 100% Complete
- ✅ **Settings Screen**: 100% Complete
- ✅ **HomeScreen**: 100% Complete
- ✅ **NewProjectScreen**: 100% Complete
- ⏳ **Remaining Screens**: 0% Complete (8 screens to update)

**Overall Progress: ~40% Complete**

## 🚀 **ESTIMATED TIME**

Based on complexity:
- ProjectDetailScreen: 2-3 hours
- RoomEditorScreen: 3-4 hours (most complex)
- Other Editor Screens: 1-2 hours each
- Settings Screens: 1 hour each
- Quote Screens: 1-2 hours each

**Total Estimated Time Remaining: 12-18 hours**

## 💡 **TIPS FOR FAST IMPLEMENTATION**

1. Use find-and-replace for common patterns (className → style)
2. Copy-paste Card wrapper structure from completed screens
3. Replace input fields systematically (one screen section at a time)
4. Test keyboard behavior after each screen update
5. Use design system constants - NEVER hardcode colors/spacing
6. Keep SafeAreaView pattern consistent

---

**The foundation is solid. The remaining work is systematic screen-by-screen updates following the established patterns.**
