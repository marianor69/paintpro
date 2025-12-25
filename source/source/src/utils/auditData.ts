// UI Audit Data - Embedded file contents for download functionality

export const AUDIT_FILES = {
  'UI_AUDIT_SUMMARY.md': `# UI Audit Summary - Quick Reference

## Critical Findings

### 1. Design System Usage: 1 of 13 screens ❌
- **HomeScreen**: Partial usage (uses Card component)
- **All other 12 screens**: Use Tailwind exclusively

### 2. Typography Violations - 3 Screens with SEVERE oversizing

| Screen | Issue | Example | Should Be |
|--------|-------|---------|-----------|
| **RoomEditorScreen** | Labels 50% too large | text-2xl (24px) | text-base (16px) |
| **PricingSettingsScreen** | Title/labels oversized | text-4xl (36px) title | text-2xl (26px) |
| **CalculationSettingsScreen** | All text oversized | text-2xl labels | text-base (16px) |

### 3. Component Usage Issues

| Problem | Count | Should Use |
|---------|-------|-----------|
| Custom toggle implementations | 13+ | Toggle component or native Switch |
| Manual card styling | 12+ | Card component |
| Debug indicators (red text) | 5 screens | Remove from production |

### 4. Color Inconsistencies

**Design System Colors:**
- Primary Blue: \`#3A70C8\`
- Background: \`#F6F4F2\`
- Dark Charcoal: \`#2E2E2E\`

**Tailwind Colors Being Used:**
- \`bg-blue-600\` = \`#2563EB\` (different blue!)
- \`bg-gray-50\` = \`#F9FAFB\` (different gray)
- \`text-gray-900\` = \`#111827\` (different dark)

**Non-Design-System Colors Found:**
- Purple buttons (\`bg-purple-600\`) - not in design system
- Green buttons (\`bg-green-600\`) - not in design system
- Debug red (\`#DC2626\`) - should be removed

---

## Screen-by-Screen Status

| Screen | Design System | Typography | Toggles | Debug Indicators |
|--------|--------------|------------|---------|------------------|
| HomeScreen | 🟡 Partial | ✅ Correct | ✅ None | ✅ None |
| ProjectDetailScreen | ❌ None | ✅ Correct | ❌ Custom | ⚠️ Red debug text |
| RoomEditorScreen | ❌ None | ❌ 50% oversized | ❌ Custom | ⚠️ Red debug text |
| NewProjectScreen | ❌ None | ✅ Correct | ❌ Custom | ❌ None |
| StaircaseEditorScreen | ❌ None | ✅ Correct | ✅ Native Switch | ⚠️ Red debug text |
| FireplaceEditorScreen | ❌ None | ✅ Correct | ❌ Custom | ⚠️ Red debug text |
| PricingSettingsScreen | ❌ None | ❌ 38% oversized | ❌ Custom | ⚠️ Red debug text |
| CalculationSettingsScreen | ❌ None | ❌ 38% oversized | ❌ Custom | ❌ None |
| MaterialsSummaryScreen | ❌ None | ✅ Correct | ❌ Custom | ❌ None |
| QuoteBuilderScreen | ❌ None | ✅ Correct | ❌ 10+ custom | ❌ None |
| QuoteManagerScreen | ❌ None | ✅ Correct | ❌ Custom tabs | ❌ None |
| ClientProposalScreen | ❌ None | ✅ Correct | ❌ Custom | ❌ None |
| SettingsScreen | ❌ None | ✅ Correct | ❌ Custom | ❌ None |

---

## Priority Action Items

### HIGH PRIORITY - Typography Fixes
**Fix these 3 screens immediately:**

1. **RoomEditorScreen** - Change ALL labels from \`text-2xl\` to \`text-base\`
2. **PricingSettingsScreen** - Reduce title from \`text-4xl\` to design system h1 (26px)
3. **CalculationSettingsScreen** - Reduce labels from \`text-2xl\` to \`text-base\`

### HIGH PRIORITY - Remove Debug Components
**Remove red debug text from 5 screens:**
- ProjectDetailScreen
- RoomEditorScreen
- StaircaseEditorScreen
- FireplaceEditorScreen
- PricingSettingsScreen

### MEDIUM PRIORITY - Standardize Toggles
**Replace custom toggles with:**
- Option A: Use existing \`Toggle\` component from \`src/components/Toggle.tsx\`
- Option B: Use React Native's native \`Switch\` component (like StaircaseEditorScreen)

### MEDIUM PRIORITY - Use Card Component
**Replace manual card styling with:**
\`\`\`tsx
import { Card } from "@/components/Card"

// Instead of:
<View className="bg-white rounded-xl p-4 border border-gray-200">

// Use:
<Card>
  {/* content */}
</Card>
\`\`\`

### LOW PRIORITY - Color Migration
**Migrate from Tailwind colors to design system colors:**
- Replace \`bg-blue-600\` with \`Colors.primaryBlue\`
- Replace \`bg-gray-50\` with \`Colors.backgroundWarmGray\`
- Replace hardcoded colors with design system constants

---

## Design System Reference (Quick Copy)

\`\`\`typescript
// Import in any file:
import { Colors, Typography, Spacing, BorderRadius, Shadows } from "@/utils/designSystem"

// Colors
Colors.primaryBlue        // "#3A70C8"
Colors.backgroundWarmGray // "#F6F4F2"
Colors.darkCharcoal       // "#2E2E2E"
Colors.mediumGray         // "#6B6B6B"
Colors.white              // "#FFFFFF"

// Typography
Typography.h1    // { fontSize: 26, fontWeight: "700" }
Typography.h2    // { fontSize: 20, fontWeight: "600" }
Typography.h3    // { fontSize: 17, fontWeight: "500" }
Typography.body  // { fontSize: 16, fontWeight: "400" }
Typography.caption // { fontSize: 13, fontWeight: "400" }

// Spacing
Spacing.xs  // 4
Spacing.sm  // 8
Spacing.md  // 16
Spacing.lg  // 24
Spacing.xl  // 32

// Border Radius
BorderRadius.default // 12

// Shadows
Shadows.card // { shadowColor, shadowOffset, shadowOpacity, shadowRadius, elevation }
\`\`\`

---

## Correct vs Incorrect Examples

### Typography - Labels

❌ **INCORRECT** (RoomEditorScreen):
\`\`\`tsx
<Text className="text-2xl font-medium text-gray-700 mb-2">
  Room Name
</Text>
\`\`\`

✅ **CORRECT**:
\`\`\`tsx
<Text style={{
  fontSize: Typography.body.fontSize,  // 16px not 24px
  fontWeight: Typography.body.fontWeight,
  color: Colors.darkCharcoal
}}>
  Room Name
</Text>
\`\`\`

### Toggles

❌ **INCORRECT** (Custom implementation):
\`\`\`tsx
<View className="w-12 h-7 rounded-full bg-blue-600">
  <View className="w-5 h-5 rounded-full bg-white mt-1 ml-6" />
</View>
\`\`\`

✅ **CORRECT** (Use existing component):
\`\`\`tsx
import { Toggle } from "@/components/Toggle"

<Toggle
  label="Paint Baseboard"
  value={paintBaseboard}
  onValueChange={setPaintBaseboard}
/>
\`\`\`

### Cards

❌ **INCORRECT** (Manual styling):
\`\`\`tsx
<View className="bg-white rounded-xl p-4 mb-3 border border-gray-200">
  {/* content */}
</View>
\`\`\`

✅ **CORRECT** (Use Card component):
\`\`\`tsx
import { Card } from "@/components/Card"

<Card className="mb-3">
  {/* content */}
</Card>
\`\`\`

---

## Files Generated
- \`COMPLETE_UI_STRUCTURAL_AUDIT.md\` - Full detailed audit (57KB)
- \`UI_STRUCTURAL_DUMP.json\` - Machine-readable structure (38KB)
- \`UI_AUDIT_SUMMARY.md\` - This quick reference guide

**Generated:** 2025-12-06
`,
  
  'COMPLETE_UI_STRUCTURAL_AUDIT.md': `# COMPLETE UI STRUCTURAL AUDIT
## Paint Estimator App - Exhaustive Screen-by-Screen Breakdown

**Generated:** 2025-12-06
**Purpose:** Full structural dump of every UI component, style, layout, and inconsistency across all screens

---

## TABLE OF CONTENTS

1. [Design System Definition](#design-system-definition)
2. [Component Library](#component-library)
3. [Screen-by-Screen Breakdown](#screen-by-screen-breakdown)
4. [Critical Inconsistencies Summary](#critical-inconsistencies-summary)
5. [Legacy Components Still in Use](#legacy-components-still-in-use)

---

## DESIGN SYSTEM DEFINITION

**File:** \`src/utils/designSystem.ts\`

### Colors
\`\`\`typescript
primaryBlue: "#3A70C8"
primaryBlueLight: "#E6EEF9"
primaryBlueDark: "#2A4F8A"
backgroundWarmGray: "#F6F4F2"
neutralGray: "#DAD7D3"
darkCharcoal: "#2E2E2E"
mediumGray: "#6B6B6B"
white: "#FFFFFF"
error: "#D32F2F"
success: "#4CAF50"
warning: "#FF9800"
\`\`\`

### Typography
\`\`\`typescript
h1: { fontSize: 26, fontWeight: "700", color: "#2E2E2E" }
h2: { fontSize: 20, fontWeight: "600", color: "#2E2E2E" }
h3: { fontSize: 17, fontWeight: "500", color: "#2E2E2E" }
body: { fontSize: 16, fontWeight: "400", color: "#2E2E2E" }
caption: { fontSize: 13, fontWeight: "400", color: "#6B6B6B" }
\`\`\`

### Spacing
\`\`\`typescript
xs: 4
sm: 8
md: 16
lg: 24
xl: 32
\`\`\`

### Border Radius
\`\`\`typescript
default: 12
\`\`\`

### Shadows
\`\`\`typescript
card: {
  shadowColor: "#000000"
  shadowOffset: { width: 0, height: 2 }
  shadowOpacity: 0.08
  shadowRadius: 6
  elevation: 3
}
\`\`\`

---

## COMPONENT LIBRARY

### 1. Card Component
**File:** \`src/components/Card.tsx\`
**Design System Usage:** ✅ FULL

\`\`\`typescript
<Card>
  backgroundColor: Colors.white
  borderRadius: BorderRadius.default (12)
  padding: Spacing.md (16)
  shadow: Shadows.card
</Card>
\`\`\`

**Props:**
- \`children\`: React.ReactNode
- \`className\`: string (optional)
- \`style\`: ViewStyle (optional)

---

### 2. NumericInput Component
**File:** \`src/components/NumericInput.tsx\`
**Design System Usage:** ✅ FULL

\`\`\`typescript
<NumericInput label="..." value="..." onChangeText={...}>
  Label:
    fontSize: Typography.body.fontSize (16)
    fontWeight: Typography.body.fontWeight ("400")
    color: Colors.darkCharcoal
    marginBottom: Spacing.xs (4)

  Input Container:
    backgroundColor: Colors.white
    borderRadius: BorderRadius.default (12)
    borderWidth: 1
    borderColor: error ? Colors.error : Colors.neutralGray
    paddingHorizontal: Spacing.md (16)
    paddingVertical: Spacing.sm (8)

  TextInput:
    fontSize: Typography.body.fontSize (16)
    color: Colors.darkCharcoal
    keyboardType: "numeric"

  Unit Label (optional):
    fontSize: Typography.body.fontSize (16)
    color: Colors.mediumGray
    marginLeft: Spacing.xs (4)

  Done Button:
    backgroundColor: Colors.primaryBlue
    paddingHorizontal: Spacing.md (16)
    paddingVertical: Spacing.xs (4)
    borderRadius: 6
\`\`\`

**Props:**
- \`label\`: string
- \`value\`: string
- \`onChangeText\`: (text: string) => void
- \`placeholder\`: string (optional, default "0")
- \`unit\`: string (optional)
- \`error\`: string (optional)
- \`className\`: string (optional)

---

### 3. Toggle Component
**File:** \`src/components/Toggle.tsx\`
**Design System Usage:** ✅ FULL

\`\`\`typescript
<Toggle label="..." value={...} onValueChange={...}>
  Label:
    fontSize: Typography.body.fontSize (16)
    fontWeight: Typography.body.fontWeight ("400")
    color: Colors.darkCharcoal

  Description (optional):
    fontSize: Typography.caption.fontSize (13)
    color: Colors.mediumGray
    marginTop: Spacing.xs (4)

  Switch:
    trackColor:
      false: Colors.neutralGray
      true: Colors.primaryBlue
    thumbColor: Colors.white
</Toggle>
\`\`\`

**Props:**
- \`label\`: string
- \`value\`: boolean
- \`onValueChange\`: (value: boolean) => void
- \`description\`: string (optional)
- \`className\`: string (optional)

---

## SCREEN-BY-SCREEN BREAKDOWN

---

### 1. HomeScreen (Projects List)

**File:** \`src/screens/HomeScreen.tsx\`
**Background:** \`#F6F4F2\` (Colors.backgroundWarmGray)
**Design System Usage:** 🟡 PARTIAL - Uses designSystem for some components, but mixes with inline styles
**Navigation:** Tab Bar (bottom tabs)

#### Layout Structure:
\`\`\`
SafeAreaView (edges: ["bottom"])
└── FlatList
    ├── Header (ListHeaderComponent)
    │   ├── New Project Button
    │   └── Import JSON Button (test mode only)
    └── Project Cards (FlatList items)
        ├── Card (uses design system)
        │   ├── Client Name & Info
        │   └── Action Buttons (Share JSON, Delete)
        └── Import Modal
\`\`\`

#### Component Breakdown:

**1.1 Header Container**
- backgroundColor: \`#FFFFFF\`
- paddingHorizontal: \`16\`
- paddingTop: \`16\`
- paddingBottom: \`16\`

**1.2 New Project Button**
- Component: \`Pressable\`
- backgroundColor: \`#3A70C8\` (Colors.primaryBlue)
- borderRadius: \`12\`
- paddingVertical: \`16\`
- alignItems: \`"center"\`
- marginBottom: \`8\` (conditional, when test mode button shown)

Text:
- fontSize: \`16\`
- color: \`#FFFFFF\`
- fontWeight: \`"600"\`

**1.3 Import JSON Button** (test mode only)
- Component: \`Pressable\`
- backgroundColor: \`#4CAF50\` (Colors.success)
- borderRadius: \`12\`
- paddingVertical: \`16\`
- flexDirection: \`"row"\`
- justifyContent: \`"center"\`
- alignItems: \`"center"\`

Icon:
- name: \`"download-outline"\`
- size: \`20\`
- color: \`#FFFFFF\`

Text:
- fontSize: \`16\`
- color: \`#FFFFFF\`
- fontWeight: \`"600"\`
- marginLeft: \`4\`

**1.4 Project Card**
- Component: \`Card\` (✅ uses design system)
- style.marginBottom: \`16\`

Inner structure:
\`\`\`
Pressable (navigate to project detail)
└── View (flex-row, justify-between)
    ├── View (flex: 1, marginRight: 16)
    │   ├── Text (Client Name)
    │   │   fontSize: 17 (Typography.h3)
    │   │   fontWeight: "500"
    │   │   color: #2E2E2E (Colors.darkCharcoal)
    │   ├── Text (Address)
    │   │   fontSize: 16 (Typography.body)
    │   │   color: #6B6B6B (Colors.mediumGray)
    │   │   marginTop: 4
    │   └── Text (Date)
    │       fontSize: 13 (Typography.caption)
    │       marginTop: 8
    └── View (Room Count Badge)
        backgroundColor: #E6EEF9 (Colors.primaryBlueLight)
        borderRadius: 8
        paddingHorizontal: 8
        paddingVertical: 4
        └── Text
            fontSize: 13
            color: #3A70C8 (Colors.primaryBlue)
            fontWeight: "600"
\`\`\`

**1.5 Action Buttons Row**
- flexDirection: \`"row"\`
- marginTop: \`16\`
- gap: \`8\`

Share JSON Button:
- flex: \`1\`
- backgroundColor: \`#E6EEF9\` (Colors.primaryBlueLight)
- borderRadius: \`8\`
- paddingVertical: \`8\`
- flexDirection: \`"row"\`
- alignItems: \`"center"\`
- justifyContent: \`"center"\`

Delete Button:
- backgroundColor: \`rgba(211, 47, 47, 0.1)\` (Colors.error with 10% opacity)
- borderRadius: \`8\`
- paddingVertical: \`8\`
- paddingHorizontal: \`16\`
- flexDirection: \`"row"\`

**1.6 Import Modal**
- presentationStyle: \`"pageSheet"\`
- backgroundColor overlay: \`rgba(0,0,0,0.5)\` or default modal

Modal Header:
- backgroundColor: \`#FFFFFF\`
- borderBottomWidth: \`1\`
- borderBottomColor: \`#DAD7D3\` (Colors.neutralGray)
- paddingHorizontal: \`16\`
- paddingBottom: \`16\`

Title:
- fontSize: \`26\` (Typography.h1)
- fontWeight: \`"700"\`

Close Button:
- width: \`40\`
- height: \`40\`
- borderRadius: \`20\`
- backgroundColor: \`#DAD7D3\` (Colors.neutralGray)
- alignItems/justifyContent: \`"center"\`

TextInput:
- minHeight: \`300\`
- backgroundColor: \`#F6F4F2\` (Colors.backgroundWarmGray)
- borderWidth: \`1\`
- borderColor: \`#DAD7D3\`
- borderRadius: \`12\`
- padding: \`16\`
- fontSize: \`16\`
- fontFamily: \`"Menlo"\` / monospace
- color: \`#2E2E2E\`

Import Button:
- backgroundColor: \`#4CAF50\` (enabled) or \`#DAD7D3\` (disabled)
- borderRadius: \`12\`
- paddingVertical: \`16\`

Cancel Button:
- backgroundColor: \`#DAD7D3\`
- borderRadius: \`12\`
- paddingVertical: \`16\`

#### Inconsistencies Found:
1. ✅ Uses Card component correctly with design system
2. ❌ Some inline styles don't reference design system constants (e.g., specific padding values)
3. ❌ Gap value (8) not mapped to Spacing.sm
4. ✅ Colors are consistent with design system

---

### 2. ProjectDetailScreen

**File:** \`src/screens/ProjectDetailScreen.tsx\`
**Background:** TailwindCSS \`bg-gray-50\`
**Design System Usage:** ❌ NO - Uses only TailwindCSS className prop
**Navigation:** Stack Screen

#### Layout Structure:
\`\`\`
View (flex-1, bg-gray-50)
├── ScrollView
│   ├── Page Indicator (DEBUG - RED)
│   ├── Client Info Section
│   ├── Total Estimate Banner
│   ├── Floor Configuration
│   ├── Rooms List
│   ├── Staircases Section
│   └── Fireplaces Section
└── Bottom Actions Bar (absolute)
\`\`\`

#### Component Breakdown:

**2.1 Page Indicator** (DEBUG COMPONENT)
- className: \`"bg-gray-100 px-6 py-2"\`
- Text:
  - className: \`"text-xs font-bold"\`
  - style: \`{ color: "#DC2626" }\` ⚠️ HARDCODED RED DEBUG COLOR
  - content: \`"PAGE: ProjectDetailScreen"\`

**2.2 Client Info Section**
- className: \`"bg-white p-6 border-b border-gray-200"\`

Client Name:
- className: \`"text-2xl font-bold text-gray-900"\`
- Tailwind equivalent: \`fontSize: 24px, fontWeight: 700, color: #111827\`

Address:
- className: \`"text-base text-gray-600 mt-1"\`
- Tailwind: \`fontSize: 16px, color: #4B5563, marginTop: 4px\`

Phone:
- className: \`"text-sm text-gray-500 mt-2"\`
- Tailwind: \`fontSize: 14px, color: #6B7280, marginTop: 8px\`

**2.3 Total Estimate Banner**
- className: \`"bg-blue-600 p-6"\`
- backgroundColor: \`#2563EB\` (Tailwind blue-600)

Label:
- className: \`"text-sm font-medium text-blue-100"\`

Amount:
- className: \`"text-4xl font-bold text-white mt-1"\`
- fontSize: \`36px\` ⚠️ LARGER THAN DESIGN SYSTEM

**2.4 Floor Configuration Section**
- className: \`"p-6 bg-white border-b border-gray-200"\`

Section Header:
- className: \`"text-xl font-bold text-gray-900 mb-4"\`

Label Style:
- className: \`"text-sm font-medium text-gray-700 mb-2"\`

Floor Counter:
\`\`\`
flex-row items-center gap-3
├── Pressable (Minus)
│   className: "bg-gray-200 rounded-lg p-3 active:bg-gray-300"
│   Icon: size 24, color conditional (#374151 enabled / #9CA3AF disabled)
├── Text (Count)
│   className: "text-2xl font-bold text-gray-900 min-w-[40px] text-center"
└── Pressable (Plus)
    className: "bg-gray-200 rounded-lg p-3 active:bg-gray-300"
\`\`\`

**2.5 Floor Height Input**
- Component: \`TextInput\`
- className: \`"bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-base"\`
- keyboardType: \`"decimal-pad"\`

**2.6 Number of Coats Selector**
- Container: \`"flex-row gap-3"\`

Button (unselected):
- className: \`"flex-1 rounded-xl py-3 items-center bg-white border border-gray-300"\`
- Text: \`"text-base font-semibold text-gray-700"\`

Button (selected):
- className: \`"flex-1 rounded-xl py-3 items-center bg-blue-600"\`
- Text: \`"text-base font-semibold text-white"\`

**2.7 Paint Baseboard Toggle**
- Container: \`"flex-row items-center justify-between bg-gray-50 border border-gray-300 rounded-xl px-4 py-3"\`

Toggle Visual:
\`\`\`
View (w-12 h-7 rounded-full bg-blue-600 or bg-gray-300)
└── View (w-5 h-5 rounded-full bg-white mt-1 ml-6 or ml-1)
\`\`\`

⚠️ **CUSTOM TOGGLE** - Not using design system Toggle component or native Switch

**2.8 Add Room Button**
- className: \`"bg-blue-600 rounded-lg px-4 py-3 active:bg-blue-700"\`
- Text: \`"text-white font-semibold text-center"\`

**2.9 Room Card**
- className: \`"bg-white rounded-xl p-4 mb-3 border border-gray-200"\`

Room Name:
- className: \`"text-lg font-semibold text-gray-900"\`

Dimensions:
- className: \`"text-sm text-gray-500 mt-1"\`

Include/Exclude Button:
\`\`\`
Pressable (px-3 py-1.5 rounded-lg bg-gray-300 or bg-blue-600)
└── Text (text-xs font-semibold text-gray-700 or text-white)
\`\`\`

**2.10 Bottom Actions Bar**
- className: \`"absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4"\`
- style: \`{ paddingBottom: insets.bottom + 16 }\`

Button Row:
- className: \`"flex-row gap-3 mb-3"\`

Admin View Button:
- className: \`"flex-1 bg-gray-100 rounded-xl py-3 items-center active:bg-gray-200"\`
- Text: \`"text-gray-900 font-semibold text-sm"\`

Quotes Button:
- className: \`"flex-1 bg-green-600 rounded-xl py-3 items-center active:bg-green-700"\`
- Text: \`"text-white font-semibold text-sm"\`
- ⚠️ Green color not in design system for primary actions

Builder Button:
- className: \`"flex-1 bg-purple-600 rounded-xl py-3 items-center active:bg-purple-700"\`
- Text: \`"text-white font-semibold text-sm"\`
- ⚠️ Purple color not in design system

Generate Proposal Button:
- className: \`"bg-blue-600 rounded-xl py-3 items-center active:bg-blue-700"\`
- Text: \`"text-white font-semibold"\`

#### Inconsistencies Found:
1. ❌ **COMPLETELY TAILWIND** - Does not use design system at all
2. ❌ Hardcoded Tailwind colors don't match design system palette
3. ❌ Text sizes inconsistent (uses text-2xl, text-4xl which are larger than design system)
4. ❌ Custom toggle implementation instead of Toggle component
5. ❌ Page indicator with DEBUG red color (#DC2626)
6. ❌ Green and purple colors for actions not defined in design system
7. ❌ Border colors (border-gray-200, border-gray-300) don't map to neutralGray
8. ❌ No use of Spacing constants

---

### 3. RoomEditorScreen

**File:** \`src/screens/RoomEditorScreen.tsx\`
**Background:** TailwindCSS \`bg-gray-50\`
**Design System Usage:** ❌ NO - Uses only TailwindCSS className prop
**Navigation:** Stack Screen (modal presentation)

#### Layout Structure:
\`\`\`
KeyboardAvoidingView
└── ScrollView
    ├── Page Indicator (DEBUG - RED)
    ├── Room Name Input
    ├── Bluetooth Laser Section
    ├── Measurement Inputs (Length, Width, Height)
    ├── Manual Area Input
    ├── Ceiling Type Selector
    ├── Toggle Options (Paint Baseboard, Paint Walls, etc.)
    ├── Counters (Windows, Doors, Closets)
    ├── Include in Quote Section
    ├── Closets Section
    ├── Calculations Preview
    ├── Materials Breakdown
    └── Save Button
\`\`\`

#### Component Breakdown:

**3.1 Page Indicator** (DEBUG COMPONENT)
- className: \`"bg-gray-100 px-6 py-2"\`
- Text:
  - className: \`"text-xl font-bold"\` ⚠️ LARGER than other screens
  - style: \`{ color: "#DC2626" }\` (RED DEBUG)
  - content: \`"PAGE: RoomEditorScreen"\`

**3.2 Room Name Input**
- Label:
  - className: \`"text-2xl font-medium text-gray-700 mb-2"\` ⚠️ **OVERSIZED LABEL** (24px)
  - Design System expects: \`16px\` (Typography.body)

- Input:
  - className: \`"bg-white border border-gray-300 rounded-xl px-4 py-4 text-xl"\`
  - ⚠️ Input text size \`text-xl\` (20px) is also oversized

**3.3 Bluetooth Laser Section**
- Container:
  - className: \`"bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4"\`

Header Text:
- className: \`"text-2xl font-semibold text-blue-900"\` ⚠️ **OVERSIZED** (24px)

Connected Badge:
- className: \`"bg-green-500 rounded-full px-3 py-1"\`
- Text: \`"text-xl font-medium text-white"\` ⚠️ **OVERSIZED** (20px)

Scan Button:
- className: \`"bg-blue-600 rounded-lg px-3 py-1"\`
- Text: \`"text-xl font-medium text-white"\` ⚠️ **OVERSIZED** (20px)

Description:
- className: \`"text-2xl text-blue-700 mt-2 font-medium"\` ⚠️ **EXTREMELY OVERSIZED** (24px)

**3.4 Measurement Inputs**

Label Pattern (ALL OVERSIZED):
- className: \`"text-2xl font-medium text-gray-700 mb-2"\` ⚠️ Should be \`16px\`

Input Pattern:
- className: \`"bg-white border border-gray-300 rounded-xl px-4 py-4 text-xl"\`
- keyboardType: \`"decimal-pad"\` or \`"numeric"\`

Bluetooth Capture Button (next to input):
- className: \`"bg-blue-600 rounded-xl px-4 py-3 items-center justify-center active:bg-blue-700"\`
- Icon: \`"radio-outline"\`, size \`20\`, color \`#fff\`

**3.5 Manual Area Input**
- Label: \`"text-2xl font-medium text-gray-700 mb-2"\` ⚠️ **OVERSIZED**
- Input: \`"bg-white border border-gray-300 rounded-xl px-4 py-4 text-xl"\`
- Help Text: \`"text-xl text-gray-500 mt-1"\` ⚠️ **OVERSIZED** (should be caption 13px)

**3.6 Ceiling Type Selector**
- Container: \`"flex-row gap-2"\`

Button (unselected):
- className: \`"flex-1 rounded-xl py-3 items-center bg-white border border-gray-300"\`
- Text: \`"font-semibold text-gray-700"\`

Button (selected):
- className: \`"flex-1 rounded-xl py-3 items-center bg-blue-600"\`
- Text: \`"font-semibold text-white"\`

**3.7 Toggle Rows** (Custom Implementation)

Container:
- className: \`"flex-row items-center justify-between bg-white border border-gray-300 rounded-xl px-4 py-3 mb-4"\`

Label:
- className: \`"text-xl text-gray-700"\` ⚠️ **OVERSIZED** (20px vs 16px)

Toggle Visual (CUSTOM):
\`\`\`
View (w-12 h-7 rounded-full bg-blue-600 or bg-gray-300)
└── View (w-5 h-5 rounded-full bg-white mt-1 ml-6 or ml-1)
\`\`\`

⚠️ **NOT using Toggle component from design system**

**3.8 Counter Components**

Label:
- className: \`"text-2xl font-medium text-gray-700 mb-2"\` ⚠️ **OVERSIZED**

Counter Row:
\`\`\`
flex-row items-center gap-3 mb-3
├── Counter Group (flex-row items-center gap-2)
│   ├── Pressable (Minus)
│   │   className: "bg-gray-200 rounded-lg p-2 active:bg-gray-300"
│   │   Icon: size 20, color #374151
│   ├── Text (Count)
│   │   className: "text-xl font-semibold text-gray-900 min-w-[24px] text-center" ⚠️ OVERSIZED
│   └── Pressable (Plus)
│       className: "bg-gray-200 rounded-lg p-2 active:bg-gray-300"
└── Label Text
    className: "text-xl text-gray-700 flex-1" ⚠️ OVERSIZED
\`\`\`

**3.9 Include in Quote Section**
- Container: \`"mb-6 bg-gray-50 rounded-xl p-4"\`

Section Header:
- className: \`"text-2xl font-semibold text-gray-900 mb-3"\` ⚠️ **OVERSIZED**

Description:
- className: \`"text-base text-gray-600 mb-4"\` ✅ Correct size (16px)

**3.10 Closets Section**

Section Header:
- className: \`"text-2xl font-medium text-gray-700 mb-2"\` ⚠️ **OVERSIZED**

Closet Counter Row:
- Similar pattern to Windows/Doors counter
- All text is \`text-xl\` ⚠️ **OVERSIZED**

**3.11 Calculations Preview Card**
- Container: \`"bg-white rounded-xl p-4 border border-gray-200 mb-4"\`

Card Header:
- className: \`"text-2xl font-bold text-gray-900 mb-3"\` ⚠️ **OVERSIZED**

Calculation Block:
- Container: \`"bg-gray-50 rounded-lg p-3 mb-3"\`
- Block Header: \`"text-base font-semibold text-gray-700 mb-2"\` ✅ Correct

Calculation Row:
\`\`\`
View (flex-row justify-between mb-1)
├── Text (Label)
│   className: "text-sm text-gray-600" ✅ Correct
└── Text (Value)
    className: "text-sm text-gray-900" ✅ Correct
\`\`\`

Summary Block:
- Container: \`"bg-blue-50 border border-blue-200 rounded-lg p-3"\`

Labor/Material Row:
- Label: \`"text-base text-gray-600"\` ✅ Correct
- Value: \`"text-base text-gray-900"\` ✅ Correct

Total Row:
- Label: \`"text-base font-bold text-gray-900"\` ✅ Correct
- Value: \`"text-base font-bold text-blue-600"\` ✅ Correct

**3.12 Materials Breakdown Card**
- Container: \`"bg-white rounded-xl p-4 border border-gray-200 mb-4"\`

Card Header:
- className: \`"text-2xl font-bold text-gray-900 mb-3"\` ⚠️ **OVERSIZED**

Material Item:
\`\`\`
View (mb-3)
├── View (flex-row justify-between items-center mb-1)
│   ├── Text (Paint Type)
│   │   className: "text-2xl font-semibold text-gray-900" ⚠️ OVERSIZED (24px)
│   └── Text (Gallons)
│       className: "text-2xl font-bold text-gray-900" ⚠️ OVERSIZED (24px)
└── Text (Formula)
    className: "text-xl text-gray-500" ⚠️ OVERSIZED (20px)
\`\`\`

**3.13 Save Button**
- className: \`"bg-blue-600 rounded-xl py-4 items-center active:bg-blue-700"\`
- Text: \`"text-white text-2xl font-semibold"\` ⚠️ **OVERSIZED** (24px vs 16px)

**3.14 Save Confirmation Modal**
- Container: \`"absolute top-0 left-0 right-0 bottom-0 bg-black/50 items-center justify-center"\`

Modal Card:
- className: \`"bg-white rounded-2xl mx-6 p-6 w-full max-w-sm"\`

Modal Title:
- className: \`"text-2xl font-bold text-gray-900 mb-2"\` ⚠️ **OVERSIZED**

Modal Message:
- className: \`"text-xl text-gray-600 mb-6"\` ⚠️ **OVERSIZED** (20px)

Save Changes Button:
- className: \`"bg-blue-600 rounded-xl py-4 items-center active:bg-blue-700"\`
- Text: \`"text-white text-xl font-semibold"\` ⚠️ **OVERSIZED**

Discard Button:
- className: \`"bg-red-600 rounded-xl py-4 items-center active:bg-red-700"\`
- Text: \`"text-white text-xl font-semibold"\` ⚠️ **OVERSIZED**

Cancel Button:
- className: \`"bg-gray-200 rounded-xl py-4 items-center active:bg-gray-300"\`
- Text: \`"text-gray-900 text-xl font-semibold"\` ⚠️ **OVERSIZED**

#### Inconsistencies Found:
1. ❌ **COMPLETELY TAILWIND** - No design system usage
2. ❌ **EXTREMELY OVERSIZED TEXT** - Most labels are \`text-2xl\` (24px) instead of \`text-base\` (16px)
3. ❌ Input text is \`text-xl\` (20px) instead of standard \`text-base\` (16px)
4. ❌ Button text in modals is \`text-xl\` or \`text-2xl\` instead of \`text-base\`
5. ❌ Help text is \`text-xl\` (20px) instead of \`text-sm\` (13px) for captions
6. ❌ Custom toggle implementation instead of Toggle component
7. ❌ Page indicator with DEBUG red color
8. ❌ Blue section colors don't use design system constants
9. ❌ No use of Spacing, BorderRadius, or Shadows from design system
10. ⚠️ **WORST OFFENDER** - Text is 1.5x larger than it should be throughout entire screen

---

### 4. NewProjectScreen

**File:** \`src/screens/NewProjectScreen.tsx\`
**Background:** TailwindCSS \`bg-gray-50\`
**Design System Usage:** ❌ NO - Uses only TailwindCSS className prop
**Navigation:** Stack Screen

#### Quick Summary:
- Similar styling inconsistencies to ProjectDetailScreen
- All inputs use TailwindCSS classes
- No design system components used

#### Key Patterns:

Labels:
- className: \`"text-sm font-medium text-gray-700 mb-2"\` ✅ **CORRECT SIZE**

Inputs:
- className: \`"bg-white border border-gray-300 rounded-xl px-4 py-3 text-base"\` ✅ **CORRECT SIZE**

Create Button:
- className: \`"bg-blue-600 rounded-xl py-4 items-center active:bg-blue-700"\`

#### Inconsistencies Found:
1. ❌ Uses Tailwind instead of design system
2. ✅ Text sizes are correct (unlike RoomEditorScreen)
3. ❌ No use of Spacing, Colors, or other design system constants
4. ❌ Border and background colors don't map to design system

---

### 5. QuoteBuilderScreen

**File:** \`src/screens/QuoteBuilderScreen.tsx\`
**Background:** TailwindCSS \`bg-gray-50\`
**Design System Usage:** ❌ NO - Uses only TailwindCSS className prop
**Navigation:** Stack Screen

#### Layout Structure:
\`\`\`
ScrollView
├── Page Indicator (DEBUG - RED)
├── Instructions Banner
├── Include Walls Toggle
├── Include Ceilings Toggle
├── Include Doors Toggle
├── Include Jambs Toggle
├── Include Windows Toggle
├── Include Baseboards Toggle
├── Include Crown Toggle
├── Include Closets Toggle
├── Include Staircases Toggle
├── Include Fireplaces Toggle
├── Paint Options Section
├── Reset Button
└── Save Builder Button
\`\`\`

#### Component Breakdown:

**5.1 Page Indicator** (DEBUG)
- Same pattern as other screens
- className: \`"bg-gray-100 px-6 py-2"\`
- Text color: \`#DC2626\` ⚠️ RED DEBUG

**5.2 Instructions Banner**
- className: \`"bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6"\`

Header:
- className: \`"text-lg font-bold text-blue-900 mb-2"\`

Body:
- className: \`"text-sm text-blue-700"\`

**5.3 Toggle Section** (Repeating Pattern)

Container:
- className: \`"bg-white rounded-xl p-4 border border-gray-200 mb-3"\`

Toggle Row:
\`\`\`
Pressable (flex-row items-center justify-between mb-3)
├── Text (Label)
│   className: "text-base font-semibold text-gray-900" ✅ Correct
└── View (Custom Toggle)
    className: "w-12 h-7 rounded-full bg-blue-600 or bg-gray-300"
    └── View (Thumb)
        className: "w-5 h-5 rounded-full bg-white mt-1 ml-6 or ml-1"
\`\`\`

⚠️ **CUSTOM TOGGLE** - Not using Toggle component

Description (if present):
- className: \`"text-sm text-gray-600"\`

**5.4 Paint Options Section**

Section Container:
- className: \`"bg-white rounded-xl p-4 border border-gray-200 mb-4"\`

Section Header:
- className: \`"text-lg font-bold text-gray-900 mb-2"\`

Show in Proposal Toggle:
- Same custom toggle pattern as above

Option Card:
\`\`\`
View (bg-gray-50 rounded-lg p-3 border border-gray-200 mb-3)
├── View (flex-row justify-between items-center mb-2)
│   ├── Text (Option Name)
│   │   className: "text-base font-semibold text-gray-900"
│   └── Pressable (Delete)
│       className: "p-1"
│       Icon: trash-outline, size 20, color #EF4444
└── Text (Notes)
    className: "text-sm text-gray-600 mb-2"
\`\`\`

**5.5 Reset Button**
- className: \`"bg-gray-200 rounded-xl py-4 items-center mb-3 active:bg-gray-300"\`
- Text: \`"text-gray-900 font-semibold"\`

**5.6 Save Button**
- className: \`"bg-blue-600 rounded-xl py-4 items-center active:bg-blue-700"\`
- Text: \`"text-white font-semibold"\`

#### Inconsistencies Found:
1. ❌ **COMPLETELY TAILWIND** - No design system
2. ❌ Custom toggle instead of Toggle component (used 10+ times)
3. ❌ Page indicator with DEBUG red color
4. ✅ Text sizes are mostly correct (16px for labels)
5. ❌ No use of design system constants

---

### 6. QuoteManagerScreen

**File:** \`src/screens/QuoteManagerScreen.tsx\`
**Background:** TailwindCSS \`bg-gray-50\`
**Design System Usage:** ❌ NO - Uses only TailwindCSS className prop
**Navigation:** Stack Screen

#### Layout Structure:
\`\`\`
View
├── Header Section
│   ├── Tabs (Quote A, B, C)
│   └── Add Quote Button
├── Quote Content (ScrollView)
│   └── Quote Summary Info
└── Bottom Actions
    ├── Delete Quote
    ├── Duplicate Quote
    └── Set as Default
\`\`\`

#### Component Breakdown:

**6.1 Tab Bar** (Custom)
\`\`\`
View (flex-row bg-white border-b border-gray-200 px-4)
├── Pressable (Quote A)
│   className: "flex-1 py-3 items-center border-b-2 border-blue-600 or border-transparent"
│   Text:
│     className: "font-semibold text-blue-600 or text-gray-500"
│     Active: text-blue-600
│     Inactive: text-gray-500
└── ... (more tabs)
\`\`\`

**6.2 Add Quote Button**
- className: \`"bg-blue-600 rounded-xl py-3 px-4 mx-4 my-3 active:bg-blue-700"\`
- Icon + Text layout

**6.3 Quote Card**
- className: \`"bg-white rounded-xl p-4 border border-gray-200 m-4"\`

Default Badge:
- className: \`"bg-green-100 rounded-full px-3 py-1"\`
- Text: \`"text-xs font-semibold text-green-700"\`

**6.4 Bottom Actions**
- Similar button patterns to other screens
- Delete: red-600, Duplicate: gray-200, Set Default: blue-600

#### Inconsistencies Found:
1. ❌ **COMPLETELY TAILWIND**
2. ❌ Custom tab bar instead of native tab navigator
3. ❌ No design system usage
4. ✅ Text sizes are correct

---

### 7. SettingsScreen

**File:** \`src/screens/SettingsScreen.tsx\`
**Background:** TailwindCSS \`bg-gray-50\`
**Design System Usage:** ❌ NO - Uses only TailwindCSS className prop
**Navigation:** Tab Screen

#### Layout Structure:
\`\`\`
SafeAreaView
└── ScrollView
    ├── Settings Section Header
    ├── Pricing Settings Button
    ├── Calculation Settings Button
    ├── Test Mode Toggle
    └── App Info
\`\`\`

#### Component Breakdown:

**7.1 Section Header**
- className: \`"px-6 py-4 bg-white border-b border-gray-200"\`
- Title: \`"text-2xl font-bold text-gray-900"\`

**7.2 Settings Button**
\`\`\`
Pressable (flex-row items-center justify-between px-6 py-4 bg-white border-b border-gray-100)
├── View
│   ├── Text (Label)
│   │   className: "text-base font-medium text-gray-900"
│   └── Text (Subtitle)
│       className: "text-sm text-gray-500 mt-1"
└── Icon (chevron-forward)
    size: 20, color: #9CA3AF
\`\`\`

**7.3 Test Mode Toggle**
- Same custom toggle pattern as other screens
- Container: \`"flex-row items-center justify-between px-6 py-4 bg-white"\`

#### Inconsistencies Found:
1. ❌ **COMPLETELY TAILWIND**
2. ❌ Custom toggle instead of Toggle component
3. ❌ No design system usage

---

### 8. PricingSettingsScreen

**File:** \`src/screens/PricingSettingsScreen.tsx\`
**Background:** TailwindCSS \`bg-gray-50\`
**Design System Usage:** ❌ NO - Uses only TailwindCSS className prop
**Navigation:** Stack Screen

#### Layout Structure:
\`\`\`
SafeAreaView
└── KeyboardAvoidingView
    └── ScrollView
        ├── Header
        ├── Labor Rates Section
        ├── Paint Prices Section
        ├── Coverage Rates Section
        └── Save Button
\`\`\`

#### Component Breakdown:

**8.1 Header**
- Title: \`"text-4xl font-bold text-gray-900 mb-2"\` ⚠️ **OVERSIZED** (36px)
- Subtitle: \`"text-lg text-gray-600"\` ⚠️ Larger than body (18px vs 16px)

**8.2 Section Card**
- className: \`"bg-white rounded-xl p-4 mb-4 shadow-sm"\`

Section Header:
- className: \`"text-2xl font-semibold text-gray-900 mb-4"\` ⚠️ **OVERSIZED** (24px)

**8.3 Input Field**

Label:
- className: \`"text-2xl font-medium text-gray-700 mb-1"\` ⚠️ **OVERSIZED** (24px)

Help Text:
- className: \`"text-base text-gray-500 mb-2"\` ✅ Correct (16px)

Input:
- className: \`"bg-gray-50 border border-gray-300 rounded-lg px-3 py-3 text-gray-900 text-lg"\`
- ⚠️ Input text is \`text-lg\` (18px) - slightly oversized

**8.4 Save/Reset Buttons**
- Save: \`"bg-blue-600 rounded-lg py-4 items-center"\`
  - Text: \`"text-white font-semibold text-xl"\` ⚠️ **OVERSIZED** (20px)
- Reset: \`"bg-gray-200 rounded-lg py-4 items-center"\`
  - Text: \`"text-gray-700 font-semibold text-xl"\` ⚠️ **OVERSIZED** (20px)

#### Inconsistencies Found:
1. ❌ **COMPLETELY TAILWIND**
2. ❌ **OVERSIZED TEXT** - Labels are 24px instead of 16px
3. ❌ Title is 36px (text-4xl) - extremely large
4. ❌ Button text is 20px instead of 16px
5. ❌ No design system usage

---

### 9. MaterialsSummaryScreen (Admin View)

**File:** \`src/screens/MaterialsSummaryScreen.tsx\`
**Background:** TailwindCSS \`bg-gray-50\`
**Design System Usage:** ❌ NO - Uses only TailwindCSS className prop
**Navigation:** Stack Screen

#### Layout Structure:
\`\`\`
View
├── ScrollView
│   ├── Warning Banner
│   ├── Paint Materials Card
│   ├── Per-Room Gallon Breakdown
│   ├── Project Summary Card
│   ├── Closet Interiors Card
│   ├── Cost Breakdown Card
│   ├── Paint Options Card
│   └── Room Breakdown Card
└── Bottom Actions Bar (Copy/Share)
\`\`\`

#### Component Breakdown:

**9.1 Warning Banner**
- className: \`"bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6"\`

Title:
- className: \`"text-sm font-semibold text-yellow-900 mb-1"\`

Message:
- className: \`"text-sm text-yellow-700"\`

**9.2 Section Card** (Repeating Pattern)
- className: \`"bg-white rounded-xl p-4 border border-gray-200 mb-4"\`

Card Header:
- className: \`"text-lg font-bold text-gray-900 mb-4"\`

**9.3 Material Row**
\`\`\`
View (flex-row justify-between mb-3)
├── Text (Label)
│   className: "text-sm text-gray-600"
└── View (Value Group)
    ├── Text (Gallons)
    │   className: "text-sm font-medium text-gray-900"
    ├── Text (Purchase Info)
    │   className: "text-xs text-gray-500"
    └── Text (Cost)
        className: "text-xs text-gray-500"
\`\`\`

**9.4 Paint Options Card**

Option Block:
\`\`\`
View (mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200)
├── View (flex-row items-center justify-between mb-2)
│   ├── Text (Option Name)
│   │   className: "text-base font-bold text-gray-900"
│   └── Text (Total Price)
│       className: "text-lg font-bold text-blue-600"
└── Text (Notes)
    className: "text-xs text-gray-600 mb-3 italic"
\`\`\`

**9.5 Bottom Actions Bar**
- className: \`"absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4"\`
- paddingBottom: \`insets.bottom + 16\`

Button Row:
\`\`\`
View (flex-row gap-3)
├── Pressable (Copy)
│   className: "flex-1 bg-gray-100 rounded-xl py-3 items-center active:bg-gray-200"
└── Pressable (Share)
    className: "flex-1 bg-blue-600 rounded-xl py-3 items-center active:bg-blue-700"
\`\`\`

#### Inconsistencies Found:
1. ❌ **COMPLETELY TAILWIND**
2. ✅ Text sizes are mostly correct
3. ❌ No design system usage
4. ❌ Yellow warning colors not in design system

---

### 10. ClientProposalScreen

**File:** \`src/screens/ClientProposalScreen.tsx\`
**Background:** TailwindCSS \`bg-gray-50\`
**Design System Usage:** ❌ NO - Uses only TailwindCSS className prop
**Navigation:** Stack Screen

#### Layout Structure:
\`\`\`
View
└── ScrollView
    ├── Custom Quote Notice
    ├── Header Card (Estimate Title)
    ├── Line Items Card
    ├── Paint Options Card
    ├── Footer Card
    ├── Preview Text
    └── Action Buttons (Copy, Share, SMS)
\`\`\`

#### Component Breakdown:

**10.1 Custom Quote Notice**
- className: \`"bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4"\`

Icon + Title Row:
- Icon: \`"filter"\`, size 20, color \`#9333EA\` (purple-600)
- Title: \`"text-sm font-semibold text-purple-900 ml-2"\`

Message:
- className: \`"text-xs text-purple-700 mt-1"\`

Edit Filters Button:
- className: \`"mt-2 bg-purple-600 rounded-lg py-2 px-3 self-start active:bg-purple-700"\`
- Text: \`"text-white text-xs font-semibold"\`

**10.2 Header Card**
- className: \`"bg-white rounded-xl p-6 border border-gray-200 mb-4"\`

Title:
- className: \`"text-2xl font-bold text-gray-900 mb-2"\` ⚠️ Larger than h1 (24px vs 26px)

Address:
- className: \`"text-base text-gray-600 mb-1"\`

Client/Date:
- className: \`"text-sm text-gray-500"\`

**10.3 Line Items Card**
- className: \`"bg-white rounded-xl p-6 border border-gray-200 mb-4"\`

Line Item Row:
\`\`\`
View (flex-row justify-between mb-4 pb-4 border-b border-gray-100)
├── Text (Room Name)
│   className: "text-base text-gray-900 flex-1 mr-4"
└── Text (Price)
    className: "text-base font-semibold text-gray-900"
\`\`\`

Total Row:
\`\`\`
View (flex-row justify-between pt-4 border-t-2 border-gray-300)
├── Text ("TOTAL")
│   className: "text-xl font-bold text-gray-900"
└── Text (Total Amount)
    className: "text-xl font-bold text-blue-600"
\`\`\`

**10.4 Paint Options Card**
- className: \`"bg-white rounded-xl p-6 border border-gray-200 mb-4"\`

Card Header:
- className: \`"text-lg font-bold text-gray-900 mb-2"\`

Subtitle:
- className: \`"text-sm text-gray-600 mb-4"\`

Option Card:
\`\`\`
View (mb-3 p-4 bg-gray-50 rounded-lg border-2 border-gray-200)
├── View (flex-row items-center justify-between mb-2)
│   ├── Text (Option Letter)
│   │   className: "text-lg font-bold text-gray-900"
│   └── Text (Price)
│       className: "text-2xl font-bold text-blue-600" ⚠️ LARGE (24px)
├── Text (Option Name)
│   className: "text-base font-semibold text-gray-800 mb-1"
├── Text (Notes)
│   className: "text-sm text-gray-600 mb-2"
└── Text (Details)
    className: "text-xs text-gray-500 mt-1"
\`\`\`

**10.5 Footer Card**
- className: \`"bg-white rounded-xl p-6 border border-gray-200 mb-4"\`
- Text: \`"text-sm text-gray-600 text-center"\`

**10.6 Preview Text Box**
- className: \`"bg-gray-100 rounded-xl p-4 mb-4"\`

Label:
- className: \`"text-xs font-medium text-gray-700 mb-2"\`

Preview:
- className: \`"text-xs text-gray-600 font-mono"\`

**10.7 Action Buttons**

Copy Button:
- className: \`"bg-white border border-gray-300 rounded-xl py-4 flex-row items-center justify-center active:bg-gray-50"\`
- Icon + Text

Share Button:
- className: \`"bg-blue-600 rounded-xl py-4 flex-row items-center justify-center active:bg-blue-700"\`
- Icon + Text: \`"text-white text-base font-semibold"\`

Send SMS Button:
- className: \`"bg-green-600 rounded-xl py-4 flex-row items-center justify-center active:bg-green-700"\`
- Icon + Text: \`"text-white text-base font-semibold"\`
- ⚠️ Green color for SMS not in design system

#### Inconsistencies Found:
1. ❌ **COMPLETELY TAILWIND**
2. ❌ Purple color scheme for custom quote notice not in design system
3. ❌ Green color for SMS button not in design system
4. ✅ Most text sizes are correct
5. ❌ Price display in options is \`text-2xl\` (24px) - may be intentional for emphasis
6. ❌ No design system usage

---

### 11. StaircaseEditorScreen

**File:** \`src/screens/StaircaseEditorScreen.tsx\`
**Background:** TailwindCSS \`bg-gray-50\`
**Design System Usage:** ❌ NO - Uses only TailwindCSS className prop
**Navigation:** Stack Screen (modal)

#### Layout Structure:
\`\`\`
KeyboardAvoidingView
└── ScrollView
    ├── Page Indicator (DEBUG - RED)
    ├── Riser Count Input
    ├── Handrail Length Input
    ├── Spindle Count Input
    ├── Secondary Stairwell Section
    │   ├── Toggle
    │   ├── Tall Wall Height
    │   ├── Short Wall Height
    │   └── Double-Sided Walls Toggle
    ├── Calculations Preview
    └── Save Button
\`\`\`

#### Component Breakdown:

**11.1 Page Indicator** (DEBUG)
- Same pattern: \`"bg-gray-100 px-6 py-2"\`
- Text: \`"text-xs font-bold"\`, style: \`{ color: "#DC2626" }\`

**11.2 Input Fields**

Label:
- className: \`"text-sm font-medium text-gray-700 mb-2"\` ✅ **CORRECT**

Input:
- className: \`"bg-white border border-gray-300 rounded-xl px-4 py-3 text-base"\` ✅ **CORRECT**

Help Text:
- className: \`"text-xs text-gray-500 mt-1"\` ✅ **CORRECT**

**11.3 Secondary Stairwell Section**
- Container: \`"mb-4 bg-white rounded-xl p-4 border border-gray-300"\`

Section Toggle:
\`\`\`
View (flex-row justify-between items-center mb-4)
├── Text (Label)
│   className: "text-base font-semibold text-gray-900"
└── Switch (NATIVE!)
    value: boolean
    trackColor: { false: "#D1D5DB", true: "#3B82F6" }
    thumbColor: "#FFFFFF"
\`\`\`

✅ **USING NATIVE SWITCH** (not custom toggle!)

Conditional Inputs (when enabled):
- All inputs use same pattern as above
- Labels: \`"text-sm font-medium text-gray-700 mb-2"\`
- Inputs: \`"bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-base"\`

**11.4 Calculations Preview**
- Same card structure as RoomEditorScreen
- Text sizes are correct

**11.5 Save Button**
- className: \`"bg-blue-600 rounded-xl py-4 items-center active:bg-blue-700"\`
- Text: \`"text-white text-lg font-semibold"\` ⚠️ Slightly oversized (18px vs 16px)

**11.6 Save Modal**
- Same structure as RoomEditorScreen
- Modal text sizes:
  - Title: \`"text-2xl font-bold"\` ⚠️ OVERSIZED (24px)
  - Message: \`"text-xl text-gray-600"\` ⚠️ OVERSIZED (20px)
  - Button text: \`"text-xl font-semibold"\` ⚠️ OVERSIZED (20px)

#### Inconsistencies Found:
1. ❌ **COMPLETELY TAILWIND**
2. ✅ **Text sizes are correct** (unlike RoomEditorScreen!)
3. ✅ **Uses native Switch** (not custom toggle!)
4. ❌ Save button text is slightly oversized (18px vs 16px)
5. ❌ Modal text is oversized (same as RoomEditorScreen)
6. ❌ Page indicator with DEBUG red color
7. ❌ No design system usage

---

### 12. FireplaceEditorScreen

**File:** \`src/screens/FireplaceEditorScreen.tsx\`
**Background:** TailwindCSS \`bg-gray-50\`
**Design System Usage:** ❌ NO - Uses only TailwindCSS className prop
**Navigation:** Stack Screen (modal)

#### Layout Structure:
\`\`\`
KeyboardAvoidingView
└── ScrollView
    ├── Page Indicator (DEBUG - RED)
    ├── Width Input
    ├── Height Input
    ├── Depth Input
    ├── Has Trim Toggle (CUSTOM)
    ├── Trim Linear Feet Input (conditional)
    ├── Calculations Preview
    └── Save Button
\`\`\`

#### Component Breakdown:

**12.1 Page Indicator** (DEBUG)
- Same pattern as others
- className: \`"bg-gray-100 px-6 py-2"\`
- Text color: \`#DC2626\`

**12.2 Input Fields**

Label:
- className: \`"text-sm font-medium text-gray-700 mb-2"\` ✅ **CORRECT**

Input:
- className: \`"bg-white border border-gray-300 rounded-xl px-4 py-3 text-base"\` ✅ **CORRECT**

**12.3 Has Trim Toggle** (CUSTOM IMPLEMENTATION)
\`\`\`
Pressable (flex-row items-center justify-between bg-white border border-gray-300 rounded-xl px-4 py-3 mb-4)
├── Text ("Has Trim")
│   className: "text-base text-gray-700"
└── View (Custom Toggle)
    className: "w-12 h-7 rounded-full bg-blue-600 or bg-gray-300"
    └── View (Thumb)
        className: "w-5 h-5 rounded-full bg-white mt-1 ml-6 or ml-1"
\`\`\`

⚠️ **CUSTOM TOGGLE** - Not using native Switch OR Toggle component

**12.4 Calculations Preview**
- Same card structure
- Text sizes are correct

**12.5 Save Button**
- className: \`"bg-blue-600 rounded-xl py-4 items-center active:bg-blue-700"\`
- Text: \`"text-white text-lg font-semibold"\` ⚠️ Slightly oversized (18px)

**12.6 Save Modal**
- Same oversized text pattern as StaircaseEditorScreen
- Title: \`text-2xl\`, Message: \`text-xl\`, Buttons: \`text-xl\`

#### Inconsistencies Found:
1. ❌ **COMPLETELY TAILWIND**
2. ✅ **Text sizes are correct** for inputs/labels
3. ❌ **CUSTOM TOGGLE** - Should use native Switch or Toggle component
4. ❌ Save button text is slightly oversized
5. ❌ Modal text is oversized
6. ❌ Page indicator with DEBUG red color
7. ❌ No design system usage

---

### 13. CalculationSettingsScreen

**File:** \`src/screens/CalculationSettingsScreen.tsx\`
**Background:** TailwindCSS \`bg-gray-50\`
**Design System Usage:** ❌ NO - Uses only TailwindCSS className prop
**Navigation:** Stack Screen

#### Layout Structure:
\`\`\`
SafeAreaView (edges: ["bottom"])
└── KeyboardAvoidingView
    └── TouchableWithoutFeedback (Keyboard.dismiss)
        └── ScrollView
            ├── Header
            ├── Door Assumptions Section
            ├── Window Assumptions Section
            ├── Closet Assumptions Section
            ├── Baseboard Width Section
            ├── Crown Moulding Width Section
            └── Action Buttons (Save, Reset)
\`\`\`

#### Component Breakdown:

**13.1 Header**
- Container: \`"mb-6"\`

Title:
- className: \`"text-4xl font-bold text-gray-900 mb-2"\` ⚠️ **EXTREMELY OVERSIZED** (36px)

Subtitle:
- className: \`"text-lg text-gray-600"\` ⚠️ Oversized (18px vs 16px)

**13.2 Section Card**
- className: \`"bg-white rounded-xl p-4 mb-4 shadow-sm"\`

Section Header:
- className: \`"text-2xl font-semibold text-gray-900 mb-4"\` ⚠️ **OVERSIZED** (24px)

**13.3 Subsection Header**
- className: \`"text-2xl font-medium text-gray-700 mb-1"\` ⚠️ **OVERSIZED** (24px)

**13.4 Help Text**
- className: \`"text-base text-gray-500 mb-2"\` ✅ Correct (16px)

**13.5 Input Group** (Width × Height pattern)
\`\`\`
View (flex-row gap-3)
├── View (flex-1)
│   ├── Text (Label)
│   │   className: "text-base text-gray-600 mb-1"
│   └── TextInput
│       className: "bg-gray-50 border border-gray-300 rounded-lg px-3 py-3 text-gray-900 text-lg"
│       ⚠️ Input text is text-lg (18px) - oversized
└── View (flex-1)
    └── ... (same pattern)
\`\`\`

**13.6 Calculated Values Display**

Pattern:
- className: \`"text-base text-gray-500 mt-1"\` or \`"text-base text-gray-500"\`
- Shows formulas and results: \`"→ Door face area = X.XX sq ft per side"\`

**13.7 Info Box**
- className: \`"bg-blue-50 p-3 rounded-lg"\`

Title:
- className: \`"text-lg font-medium text-blue-900 mb-1"\` ⚠️ Oversized (18px)

Body:
- className: \`"text-base text-blue-700"\`

**13.8 Action Buttons**

Save Changes Button:
- className: \`"bg-blue-600 rounded-lg py-4 items-center"\`
- Text: \`"text-white font-semibold text-xl"\` ⚠️ **OVERSIZED** (20px)

Reset Button:
- className: \`"bg-gray-200 rounded-lg py-4 items-center"\`
- Text: \`"text-gray-700 font-semibold text-xl"\` ⚠️ **OVERSIZED** (20px)

#### Inconsistencies Found:
1. ❌ **COMPLETELY TAILWIND**
2. ❌ **EXTREMELY OVERSIZED HEADERS** - Title is 36px, section headers are 24px
3. ❌ **OVERSIZED INPUT TEXT** - text-lg (18px) instead of text-base (16px)
4. ❌ **OVERSIZED BUTTON TEXT** - text-xl (20px) instead of text-base (16px)
5. ❌ Subsection headers are 24px instead of 16px or 20px
6. ❌ No design system usage
7. ⚠️ Similar oversizing issues as PricingSettingsScreen

---

## CRITICAL INCONSISTENCIES SUMMARY

### 1. Design System Adoption

| Screen | Design System Usage | Status |
|--------|---------------------|--------|
| HomeScreen | Partial (Card component) | 🟡 |
| ProjectDetailScreen | None | ❌ |
| RoomEditorScreen | None | ❌ |
| NewProjectScreen | None | ❌ |
| QuoteBuilderScreen | None | ❌ |
| QuoteManagerScreen | None | ❌ |
| SettingsScreen | None | ❌ |
| PricingSettingsScreen | None | ❌ |
| MaterialsSummaryScreen | None | ❌ |
| ClientProposalScreen | None | ❌ |
| StaircaseEditorScreen | None | ❌ |
| FireplaceEditorScreen | None | ❌ |
| CalculationSettingsScreen | None | ❌ |

**Result:** Only 1 out of 13 screens uses design system (partially)

---

### 2. Typography Inconsistencies

#### Font Size Violations by Screen:

**RoomEditorScreen** (WORST OFFENDER):
- Labels: \`24px\` instead of \`16px\` ❌ **+50% TOO LARGE**
- Input text: \`20px\` instead of \`16px\` ❌ **+25% TOO LARGE**
- Help text: \`20px\` instead of \`13px\` ❌ **+54% TOO LARGE**
- Button text: \`24px\` instead of \`16px\` ❌ **+50% TOO LARGE**
- Modal text: \`24px\` title, \`20px\` body ❌ **TOO LARGE**
- Materials breakdown: \`24px\` instead of \`16px\` ❌ **TOO LARGE**

**PricingSettingsScreen**:
- Title: \`36px\` instead of \`26px\` ❌ **+38% TOO LARGE**
- Section headers: \`24px\` instead of \`20px\` ❌ **+20% TOO LARGE**
- Labels: \`24px\` instead of \`16px\` ❌ **+50% TOO LARGE**
- Input text: \`18px\` instead of \`16px\` ❌ **+12.5% TOO LARGE**
- Button text: \`20px\` instead of \`16px\` ❌ **+25% TOO LARGE**

**CalculationSettingsScreen**:
- Title: \`36px\` instead of \`26px\` ❌ **+38% TOO LARGE**
- Section headers: \`24px\` instead of \`20px\` ❌ **+20% TOO LARGE**
- Subsection headers: \`24px\` instead of \`16px\` or \`20px\` ❌ **TOO LARGE**
- Input text: \`18px\` instead of \`16px\` ❌ **+12.5% TOO LARGE**
- Button text: \`20px\` instead of \`16px\` ❌ **+25% TOO LARGE**

**ClientProposalScreen**:
- Option prices: \`24px\` (may be intentional for emphasis)

**Modal Components** (all screens with modals):
- Title: \`24px\` instead of \`20px\` ❌
- Message: \`20px\` instead of \`16px\` ❌
- Button text: \`20px\` instead of \`16px\` ❌

**Screens with Correct Sizing:**
- NewProjectScreen ✅
- StaircaseEditorScreen ✅ (except modals)
- FireplaceEditorScreen ✅ (except modals)
- MaterialsSummaryScreen ✅
- QuoteBuilderScreen ✅
- ProjectDetailScreen ✅

---

### 3. Component Inconsistencies

#### Toggle Components:

**3 Different Toggle Implementations:**

1. **Custom Toggle** (used in: ProjectDetailScreen, RoomEditorScreen, QuoteBuilderScreen, FireplaceEditorScreen, SettingsScreen)
\`\`\`tsx
<View className="w-12 h-7 rounded-full bg-blue-600 or bg-gray-300">
  <View className="w-5 h-5 rounded-full bg-white mt-1 ml-6 or ml-1" />
</View>
\`\`\`

2. **Native Switch** (used in: StaircaseEditorScreen)
\`\`\`tsx
<Switch
  value={value}
  onValueChange={onValueChange}
  trackColor={{ false: "#D1D5DB", true: "#3B82F6" }}
  thumbColor="#FFFFFF"
/>
\`\`\`

3. **Toggle Component** (design system - NOT USED in any screen)
\`\`\`tsx
<Toggle label="..." value={value} onValueChange={...} />
\`\`\`

**Problem:** 13+ instances of custom toggle across 5+ screens when design system Toggle exists

---

#### Input Components:

**2 Different Input Patterns:**

1. **Standard Tailwind Input** (most screens):
\`\`\`tsx
<TextInput className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base" />
\`\`\`

2. **NumericInput Component** (design system - NOT USED)
\`\`\`tsx
<NumericInput label="..." value={value} onChangeText={...} unit="ft" />
\`\`\`

**Problem:** No screens use NumericInput component despite its existence

---

#### Card Components:

**2 Different Card Patterns:**

1. **Card Component** (used in: HomeScreen only)
\`\`\`tsx
<Card>...</Card>
\`\`\`

2. **Manual Card** (used everywhere else):
\`\`\`tsx
<View className="bg-white rounded-xl p-4 border border-gray-200">
  ...
</View>
\`\`\`

**Problem:** Only 1 screen uses Card component, others recreate it manually

---

### 4. Color Inconsistencies

#### Tailwind Colors vs Design System:

| Tailwind Class | Actual Color | Design System Equivalent | Match? |
|----------------|--------------|--------------------------|--------|
| \`bg-gray-50\` | \`#F9FAFB\` | \`backgroundWarmGray: #F6F4F2\` | ❌ Different tone |
| \`bg-white\` | \`#FFFFFF\` | \`white: #FFFFFF\` | ✅ |
| \`text-gray-900\` | \`#111827\` | \`darkCharcoal: #2E2E2E\` | ❌ Different darkness |
| \`text-gray-600\` | \`#4B5563\` | \`mediumGray: #6B6B6B\` | ❌ Different gray |
| \`text-gray-500\` | \`#6B7280\` | \`mediumGray: #6B6B6B\` | ❌ Close but not exact |
| \`bg-blue-600\` | \`#2563EB\` | \`primaryBlue: #3A70C8\` | ❌ Different blue |
| \`border-gray-200\` | \`#E5E7EB\` | \`neutralGray: #DAD7D3\` | ❌ Different gray |
| \`border-gray-300\` | \`#D1D5DB\` | \`neutralGray: #DAD7D3\` | ❌ Different gray |

**Result:** Tailwind colors DO NOT match design system colors

---

#### Colors Not in Design System:

**Used in App:**
- \`bg-green-600\` (\`#16A34A\`) - used for success buttons, SMS button
- \`bg-purple-600\` (\`#9333EA\`) - used for Builder button, custom quote notices
- \`bg-red-600\` (\`#DC2626\`) - used for delete/discard buttons
- \`bg-yellow-50/200/700/900\` - used for warning banners

**In Design System:**
- \`error: #D32F2F\` (different red)
- \`success: #4CAF50\` (different green)
- \`warning: #FF9800\` (orange, not yellow)

**Problem:** App uses Tailwind green/purple/red/yellow, design system defines different colors

---

### 5. Spacing Inconsistencies

#### Tailwind Spacing vs Design System:

| Tailwind | Pixels | Design System Equivalent | Match? |
|----------|--------|--------------------------|--------|
| \`p-1\` | \`4px\` | \`Spacing.xs: 4\` | ✅ |
| \`p-2\` | \`8px\` | \`Spacing.sm: 8\` | ✅ |
| \`p-3\` | \`12px\` | Not in system | ❌ |
| \`p-4\` | \`16px\` | \`Spacing.md: 16\` | ✅ |
| \`p-6\` | \`24px\` | \`Spacing.lg: 24\` | ✅ |
| \`p-8\` | \`32px\` | \`Spacing.xl: 32\` | ✅ |
| \`gap-3\` | \`12px\` | Not in system | ❌ |
| \`mb-3\` | \`12px\` | Not in system | ❌ |

**Problem:** App frequently uses \`p-3\`, \`gap-3\`, \`mb-3\` (12px) which doesn't exist in design system

---

### 6. Border Radius Inconsistencies

| Tailwind | Pixels | Design System | Match? |
|----------|--------|---------------|--------|
| \`rounded-xl\` | \`12px\` | \`BorderRadius.default: 12\` | ✅ |
| \`rounded-lg\` | \`8px\` | Not in system | ❌ |
| \`rounded-2xl\` | \`16px\` | Not in system | ❌ |
| \`rounded-full\` | \`9999px\` | Not in system | ❌ |

**Problem:** App uses \`rounded-lg\` and \`rounded-2xl\` which aren't in design system

---

### 7. Debug Components Still in Production

**Page Indicator Component** - Found in:
- ProjectDetailScreen
- RoomEditorScreen
- QuoteBuilderScreen
- StaircaseEditorScreen
- FireplaceEditorScreen

\`\`\`tsx
<View className="bg-gray-100 px-6 py-2">
  <Text className="text-xs font-bold" style={{ color: "#DC2626" }}>
    PAGE: [ScreenName]
  </Text>
</View>
\`\`\`

**Problem:** Debug indicators with RED text (#DC2626) are visible in production code

---

### 8. Modal Inconsistencies

**Modal Title Sizes:**
- RoomEditorScreen: \`text-2xl\` (24px)
- StaircaseEditorScreen: \`text-2xl\` (24px)
- FireplaceEditorScreen: \`text-2xl\` (24px)
- HomeScreen (Import Modal): \`text-4xl\` (36px) ⚠️ **DIFFERENT**

**Modal Message Sizes:**
- Most screens: \`text-xl\` (20px)

**Modal Button Sizes:**
- Most screens: \`text-xl\` (20px)

**Problem:** Modal text is oversized (should be 16px for body, 20px for titles)

---

## LEGACY COMPONENTS STILL IN USE

### Custom Toggle (Manual Implementation)

**Found in 5+ screens:**
- ProjectDetailScreen
- RoomEditorScreen
- QuoteBuilderScreen
- FireplaceEditorScreen
- SettingsScreen

**Should be replaced with:**
- \`<Toggle>\` component from design system, OR
- Native \`<Switch>\` component

**Replacement strategy:**
\`\`\`tsx
// OLD (custom):
<Pressable onPress={() => setValue(!value)}>
  <View className="w-12 h-7 rounded-full bg-blue-600 or bg-gray-300">
    <View className="w-5 h-5 rounded-full bg-white mt-1 ml-6 or ml-1" />
  </View>
</Pressable>

// NEW (design system):
<Toggle
  label="Setting Name"
  value={value}
  onValueChange={setValue}
/>

// OR NEW (native):
<Switch
  value={value}
  onValueChange={setValue}
  trackColor={{ false: Colors.neutralGray, true: Colors.primaryBlue }}
  thumbColor={Colors.white}
/>
\`\`\`

---

### Manual Card Implementation

**Found in 12 screens** (all except HomeScreen)

**Should be replaced with:**
- \`<Card>\` component from design system

**Replacement strategy:**
\`\`\`tsx
// OLD:
<View className="bg-white rounded-xl p-4 border border-gray-200 mb-4">
  {children}
</View>

// NEW:
<Card style={{ marginBottom: 16 }}>
  {children}
</Card>
\`\`\`

---

### Manual TextInput Implementation

**Found in all 13 screens**

**Should be replaced with:**
- \`<NumericInput>\` component for numeric fields

**Replacement strategy:**
\`\`\`tsx
// OLD:
<View>
  <Text className="text-sm font-medium text-gray-700 mb-2">
    Floor Height (ft)
  </Text>
  <TextInput
    value={height}
    onChangeText={setHeight}
    keyboardType="decimal-pad"
    className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base"
  />
</View>

// NEW:
<NumericInput
  label="Floor Height (ft)"
  value={height}
  onChangeText={setHeight}
  unit="ft"
/>
\`\`\`

---

## RECOMMENDED ACTIONS

### Priority 1: Critical Typography Fixes

**Screens needing immediate font size fixes:**

1. **RoomEditorScreen** (URGENT - most severe):
   - ALL labels: \`text-2xl\` (24px) → \`text-base\` (16px)
   - ALL input text: \`text-xl\` (20px) → \`text-base\` (16px)
   - ALL help text: \`text-xl\` (20px) → \`text-sm\` (13px)
   - Materials breakdown text: \`text-2xl\` (24px) → \`text-base\` (16px)
   - Button text: \`text-2xl\` (24px) → \`text-base\` (16px)
   - Bluetooth section: \`text-2xl\` (24px) → \`text-base\` (16px)

2. **PricingSettingsScreen**:
   - Page title: \`text-4xl\` (36px) → \`text-3xl\` (26px)
   - Section headers: \`text-2xl\` (24px) → \`text-xl\` (20px)
   - Labels: \`text-2xl\` (24px) → \`text-base\` (16px)
   - Input text: \`text-lg\` (18px) → \`text-base\` (16px)
   - Button text: \`text-xl\` (20px) → \`text-base\` (16px)

3. **CalculationSettingsScreen**:
   - Same fixes as PricingSettingsScreen

4. **All Modals** (RoomEditor, Staircase, Fireplace):
   - Title: \`text-2xl\` (24px) → \`text-xl\` (20px)
   - Message: \`text-xl\` (20px) → \`text-base\` (16px)
   - Button text: \`text-xl\` (20px) → \`text-base\` (16px)

---

### Priority 2: Replace Custom Components

1. **Replace all custom toggles** (13+ instances) with:
   - Design system \`<Toggle>\` component, OR
   - Native \`<Switch>\` component

2. **Replace all manual card implementations** (12 screens) with:
   - Design system \`<Card>\` component

3. **Consider replacing numeric inputs** with:
   - Design system \`<NumericInput>\` component

---

### Priority 3: Remove Debug Components

1. **Remove all page indicators** from:
   - ProjectDetailScreen
   - RoomEditorScreen
   - QuoteBuilderScreen
   - StaircaseEditorScreen
   - FireplaceEditorScreen

---

### Priority 4: Standardize Colors

**Option A: Update Tailwind Config to Match Design System**
\`\`\`js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3A70C8',
          light: '#E6EEF9',
          dark: '#2A4F8A',
        },
        neutral: {
          DEFAULT: '#DAD7D3',
          gray: '#6B6B6B',
          charcoal: '#2E2E2E',
        },
        background: '#F6F4F2',
        // ... etc
      }
    }
  }
}
\`\`\`

**Option B: Migrate All Screens to Design System**
- Replace all \`className\` usage with \`style\` prop + design system constants
- Remove Tailwind from components entirely

---

### Priority 5: Design System Adoption Roadmap

**Phase 1:** Fix typography (Priority 1)
**Phase 2:** Replace custom components (Priority 2)
**Phase 3:** Remove debug components (Priority 3)
**Phase 4:** Standardize one screen as template (e.g., StaircaseEditorScreen - already has correct sizing)
**Phase 5:** Migrate all screens to design system OR update Tailwind config
**Phase 6:** Document component usage patterns
**Phase 7:** Create design system enforcement (linting, etc.)

---

## CONCLUSION

The app has a **well-defined design system** (\`designSystem.ts\`) and **reusable components** (\`Card\`, \`NumericInput\`, \`Toggle\`), but **only 1 of 13 screens uses them**.

**Major Issues:**
1. ❌ 92% of screens don't use design system (12 of 13)
2. ❌ 3 screens have SEVERELY OVERSIZED text (50-54% too large)
3. ❌ 13+ custom toggle implementations instead of using Toggle component
4. ❌ 12 manual card implementations instead of using Card component
5. ❌ 5 screens have debug components with red text still visible
6. ❌ Tailwind colors don't match design system colors
7. ❌ Modal text is oversized across all modal screens

**Bright Spots:**
1. ✅ Design system is well-defined
2. ✅ Reusable components exist and work well (Card, NumericInput, Toggle)
3. ✅ Some screens have correct text sizing (NewProject, Staircase, Fireplace, Materials, QuoteBuilder, ProjectDetail)
4. ✅ StaircaseEditorScreen uses native Switch (correct implementation)

**Recommended First Step:**
Fix typography in RoomEditorScreen, PricingSettingsScreen, and CalculationSettingsScreen. These 3 screens account for the most severe UI inconsistencies.

---

**End of Complete UI Structural Audit**
`,
  
  'UI_STRUCTURAL_DUMP.json': `{
  "designSystem": {
    "file": "src/utils/designSystem.ts",
    "colors": {
      "primaryBlue": "#3A70C8",
      "primaryBlueLight": "#E6EEF9",
      "primaryBlueDark": "#2A4F8A",
      "backgroundWarmGray": "#F6F4F2",
      "neutralGray": "#DAD7D3",
      "darkCharcoal": "#2E2E2E",
      "mediumGray": "#6B6B6B",
      "white": "#FFFFFF",
      "error": "#D32F2F",
      "success": "#4CAF50",
      "warning": "#FF9800"
    },
    "typography": {
      "h1": { "fontSize": 26, "fontWeight": "700", "color": "#2E2E2E" },
      "h2": { "fontSize": 20, "fontWeight": "600", "color": "#2E2E2E" },
      "h3": { "fontSize": 17, "fontWeight": "500", "color": "#2E2E2E" },
      "body": { "fontSize": 16, "fontWeight": "400", "color": "#2E2E2E" },
      "caption": { "fontSize": 13, "fontWeight": "400", "color": "#6B6B6B" }
    },
    "spacing": {
      "xs": 4,
      "sm": 8,
      "md": 16,
      "lg": 24,
      "xl": 32
    },
    "borderRadius": {
      "default": 12
    },
    "shadows": {
      "card": {
        "shadowColor": "#000000",
        "shadowOffset": { "width": 0, "height": 2 },
        "shadowOpacity": 0.08,
        "shadowRadius": 6,
        "elevation": 3
      }
    }
  },

  "navigation": {
    "file": "src/navigation/RootNavigator.tsx",
    "tabBar": {
      "backgroundColor": "#FFFFFF",
      "borderTopColor": "#DAD7D3",
      "borderTopWidth": 1,
      "paddingBottom": 8,
      "paddingTop": 8,
      "height": 60,
      "activeTintColor": "#3A70C8",
      "inactiveTintColor": "#6B6B6B",
      "labelStyle": {
        "fontSize": 12,
        "fontWeight": "500"
      }
    },
    "header": {
      "backgroundColor": "#FFFFFF",
      "tintColor": "#2E2E2E",
      "titleStyle": {
        "fontWeight": "600"
      }
    }
  },

  "screens": [
    {
      "screenName": "HomeScreen (Projects List)",
      "file": "src/screens/HomeScreen.tsx",
      "background": "#F6F4F2",
      "designSystemUsage": "PARTIAL - Uses designSystem for colors/spacing but mixes with tailwind",
      "components": [
        {
          "type": "View",
          "style": { "backgroundColor": "#FFFFFF", "paddingHorizontal": 16, "paddingTop": 16, "paddingBottom": 16 },
          "children": [
            {
              "type": "Pressable",
              "className": "New Project Button",
              "style": {
                "backgroundColor": "#3A70C8",
                "borderRadius": 12,
                "paddingVertical": 16,
                "alignItems": "center",
                "marginBottom": "conditional 8 or 0"
              },
              "children": [
                {
                  "type": "Text",
                  "style": { "fontSize": 16, "color": "#FFFFFF", "fontWeight": "600" },
                  "text": "New Project"
                }
              ]
            },
            {
              "type": "Pressable",
              "className": "Import Button (test mode only)",
              "style": {
                "backgroundColor": "#4CAF50",
                "borderRadius": 12,
                "paddingVertical": 16,
                "alignItems": "center",
                "flexDirection": "row",
                "justifyContent": "center"
              },
              "children": [
                { "type": "Icon", "name": "download-outline", "size": 20, "color": "#FFFFFF" },
                {
                  "type": "Text",
                  "style": { "fontSize": 16, "color": "#FFFFFF", "fontWeight": "600", "marginLeft": 4 },
                  "text": "Import from JSON"
                }
              ]
            }
          ]
        },
        {
          "type": "FlatList",
          "contentContainerStyle": { "padding": 16 },
          "renderItem": {
            "type": "Card",
            "style": { "marginBottom": 16 },
            "children": [
              {
                "type": "Pressable",
                "children": [
                  {
                    "type": "View",
                    "style": { "flexDirection": "row", "justifyContent": "space-between", "alignItems": "flex-start" },
                    "children": [
                      {
                        "type": "View",
                        "style": { "flex": 1, "marginRight": 16 },
                        "children": [
                          { "type": "Text", "style": { "fontSize": 17, "fontWeight": "500", "color": "#2E2E2E" }, "text": "Client Name" },
                          { "type": "Text", "style": { "fontSize": 16, "color": "#6B6B6B", "marginTop": 4 }, "text": "Address" },
                          { "type": "Text", "style": { "fontSize": 13, "marginTop": 8 }, "text": "Date" }
                        ]
                      },
                      {
                        "type": "View",
                        "style": { "backgroundColor": "#E6EEF9", "borderRadius": 8, "paddingHorizontal": 8, "paddingVertical": 4 },
                        "children": [
                          { "type": "Text", "style": { "fontSize": 13, "color": "#3A70C8", "fontWeight": "600" }, "text": "X rooms" }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                "type": "View",
                "className": "Action Buttons",
                "style": { "flexDirection": "row", "marginTop": 16, "gap": 8 },
                "children": [
                  {
                    "type": "Pressable",
                    "className": "Share JSON (test mode)",
                    "style": {
                      "flex": 1,
                      "flexDirection": "row",
                      "alignItems": "center",
                      "justifyContent": "center",
                      "paddingVertical": 8,
                      "backgroundColor": "#E6EEF9",
                      "borderRadius": 8
                    },
                    "children": [
                      { "type": "Icon", "name": "share-outline", "size": 16, "color": "#3A70C8" },
                      { "type": "Text", "style": { "fontSize": 13, "color": "#3A70C8", "fontWeight": "600", "marginLeft": 4 }, "text": "Share JSON" }
                    ]
                  },
                  {
                    "type": "Pressable",
                    "className": "Delete Button",
                    "style": {
                      "flexDirection": "row",
                      "alignItems": "center",
                      "justifyContent": "center",
                      "paddingVertical": 8,
                      "paddingHorizontal": 16,
                      "backgroundColor": "#D32F2F10",
                      "borderRadius": 8
                    },
                    "children": [
                      { "type": "Icon", "name": "trash-outline", "size": 16, "color": "#D32F2F" },
                      { "type": "Text", "style": { "fontSize": 13, "color": "#D32F2F", "fontWeight": "600", "marginLeft": 4 }, "text": "Delete" }
                    ]
                  }
                ]
              }
            ]
          }
        },
        {
          "type": "Modal",
          "className": "Import Modal",
          "presentationStyle": "pageSheet",
          "components": [
            {
              "type": "SafeAreaView",
              "edges": ["top"],
              "style": { "flex": 1, "backgroundColor": "#FFFFFF" },
              "children": [
                {
                  "type": "View",
                  "className": "Modal Header",
                  "style": { "backgroundColor": "#FFFFFF", "borderBottomWidth": 1, "borderBottomColor": "#DAD7D3", "paddingHorizontal": 16, "paddingBottom": 16 },
                  "children": [
                    {
                      "type": "View",
                      "style": { "flexDirection": "row", "justifyContent": "space-between", "alignItems": "center" },
                      "children": [
                        { "type": "Text", "style": { "fontSize": 26, "fontWeight": "700" }, "text": "Import Project" },
                        {
                          "type": "Pressable",
                          "style": { "width": 40, "height": 40, "alignItems": "center", "justifyContent": "center", "borderRadius": 20, "backgroundColor": "#DAD7D3" },
                          "children": [
                            { "type": "Icon", "name": "close", "size": 24, "color": "#2E2E2E" }
                          ]
                        }
                      ]
                    },
                    { "type": "Text", "style": { "fontSize": 16, "color": "#6B6B6B", "marginTop": 4 }, "text": "Paste your project JSON data below" }
                  ]
                },
                {
                  "type": "ScrollView",
                  "contentContainerStyle": { "padding": 16 },
                  "children": [
                    {
                      "type": "TextInput",
                      "multiline": true,
                      "textAlignVertical": "top",
                      "style": {
                        "minHeight": 300,
                        "backgroundColor": "#F6F4F2",
                        "borderWidth": 1,
                        "borderColor": "#DAD7D3",
                        "borderRadius": 12,
                        "padding": 16,
                        "fontSize": 16,
                        "fontFamily": "Menlo/monospace",
                        "color": "#2E2E2E"
                      }
                    }
                  ]
                },
                {
                  "type": "View",
                  "className": "Action Buttons",
                  "style": { "padding": 16, "gap": 8, "borderTopWidth": 1, "borderTopColor": "#DAD7D3" },
                  "children": [
                    {
                      "type": "Pressable",
                      "className": "Import Button",
                      "style": {
                        "backgroundColor": "#4CAF50 or #DAD7D3 (conditional)",
                        "borderRadius": 12,
                        "paddingVertical": 16,
                        "alignItems": "center"
                      },
                      "children": [
                        { "type": "Text", "style": { "fontSize": 16, "color": "#FFFFFF", "fontWeight": "600" }, "text": "Import Project" }
                      ]
                    },
                    {
                      "type": "Pressable",
                      "className": "Cancel Button",
                      "style": {
                        "backgroundColor": "#DAD7D3",
                        "borderRadius": 12,
                        "paddingVertical": 16,
                        "alignItems": "center"
                      },
                      "children": [
                        { "type": "Text", "style": { "fontSize": 16, "color": "#2E2E2E", "fontWeight": "600" }, "text": "Cancel" }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ],
      "inconsistencies": [
        "MIXING DESIGN SYSTEM: Some components use designSystem constants (Colors, Typography, Spacing), others use inline styles",
        "Card component properly uses design system",
        "Action buttons and list items use design system partially"
      ]
    },

    {
      "screenName": "ProjectDetailScreen",
      "file": "src/screens/ProjectDetailScreen.tsx",
      "background": "TailwindCSS bg-gray-50",
      "designSystemUsage": "NO - Uses only TailwindCSS className prop",
      "components": [
        {
          "type": "ScrollView",
          "className": "flex-1",
          "contentContainerStyle": { "paddingBottom": 100 },
          "children": [
            {
              "type": "View",
              "className": "PAGE INDICATOR - bg-gray-100 px-6 py-2",
              "children": [
                { "type": "Text", "className": "text-xs font-bold", "style": { "color": "#DC2626" }, "text": "PAGE: ProjectDetailScreen" },
                { "type": "Pressable", "className": "Export JSON Button - bg-purple-600 rounded-lg px-3 py-1.5", "children": [
                  { "type": "Text", "className": "text-white text-xs font-semibold", "text": "Export JSON" }
                ]}
              ]
            },
            {
              "type": "View",
              "className": "Client Info - bg-white p-6 border-b border-gray-200",
              "children": [
                { "type": "Text", "className": "text-2xl font-bold text-gray-900", "text": "Client Name" },
                { "type": "Text", "className": "text-base text-gray-600 mt-1", "text": "Address" },
                { "type": "Text", "className": "text-sm text-gray-500 mt-2", "text": "Phone" }
              ]
            },
            {
              "type": "View",
              "className": "Total - bg-blue-600 p-6",
              "children": [
                { "type": "Text", "className": "text-sm font-medium text-blue-100", "text": "Total Estimate" },
                { "type": "Text", "className": "text-4xl font-bold text-white mt-1", "text": "\$X,XXX" }
              ]
            },
            {
              "type": "View",
              "className": "Floor Configuration - p-6 bg-white border-b border-gray-200",
              "children": [
                { "type": "Text", "className": "text-xl font-bold text-gray-900 mb-4", "text": "Floor Configuration" },
                {
                  "type": "View",
                  "className": "Number of Floors",
                  "children": [
                    { "type": "Text", "className": "text-sm font-medium text-gray-700 mb-2", "text": "Number of Floors" },
                    {
                      "type": "View",
                      "className": "flex-row items-center gap-3",
                      "children": [
                        { "type": "Pressable", "className": "bg-gray-200 rounded-lg p-3 active:bg-gray-300", "children": [
                          { "type": "Icon", "name": "remove", "size": 24, "color": "#374151 or #9CA3AF" }
                        ]},
                        { "type": "Text", "className": "text-2xl font-bold text-gray-900 min-w-[40px] text-center", "text": "X" },
                        { "type": "Pressable", "className": "bg-gray-200 rounded-lg p-3 active:bg-gray-300", "children": [
                          { "type": "Icon", "name": "add", "size": 24, "color": "#374151 or #9CA3AF" }
                        ]}
                      ]
                    }
                  ]
                },
                {
                  "type": "TextInput",
                  "className": "Floor Height Input - bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-base",
                  "keyboardType": "decimal-pad"
                },
                {
                  "type": "View",
                  "className": "Number of Coats Section",
                  "children": [
                    { "type": "Text", "className": "text-sm font-medium text-gray-700 mb-2", "text": "Number of Coats" },
                    { "type": "Text", "className": "text-xs text-gray-500 mb-3", "text": "Applies to walls and ceilings for all rooms" },
                    {
                      "type": "View",
                      "className": "flex-row gap-3",
                      "children": [
                        { "type": "Pressable", "className": "flex-1 rounded-xl py-3 items-center bg-blue-600 or bg-white border border-gray-300", "children": [
                          { "type": "Text", "className": "text-base font-semibold text-white or text-gray-700", "text": "1 Coat" }
                        ]},
                        { "type": "Pressable", "className": "flex-1 rounded-xl py-3 items-center bg-blue-600 or bg-white border border-gray-300", "children": [
                          { "type": "Text", "className": "text-base font-semibold text-white or text-gray-700", "text": "2 Coats" }
                        ]}
                      ]
                    }
                  ]
                },
                {
                  "type": "Pressable",
                  "className": "Paint Baseboard Toggle - flex-row items-center justify-between bg-gray-50 border border-gray-300 rounded-xl px-4 py-3",
                  "children": [
                    {
                      "type": "View",
                      "children": [
                        { "type": "Text", "className": "text-base text-gray-700", "text": "Paint Baseboard" },
                        { "type": "Text", "className": "text-xs text-gray-500 mt-0.5", "text": "New rooms will default to this setting" }
                      ]
                    },
                    {
                      "type": "View",
                      "className": "Toggle - w-12 h-7 rounded-full bg-blue-600 or bg-gray-300",
                      "children": [
                        { "type": "View", "className": "w-5 h-5 rounded-full bg-white mt-1 ml-6 or ml-1" }
                      ]
                    }
                  ]
                }
              ]
            },
            {
              "type": "View",
              "className": "Rooms Section - p-6",
              "children": [
                { "type": "Text", "className": "text-xl font-bold text-gray-900 mb-3", "text": "Rooms" },
                { "type": "Pressable", "className": "Add Room Button - bg-blue-600 rounded-lg px-4 py-3 active:bg-blue-700", "children": [
                  { "type": "Text", "className": "text-white font-semibold text-center", "text": "Add Room" }
                ]},
                {
                  "type": "View",
                  "className": "Room Card - bg-white rounded-xl p-4 mb-3 border border-gray-200",
                  "children": [
                    {
                      "type": "View",
                      "className": "flex-row justify-between items-center mb-3",
                      "children": [
                        {
                          "type": "View",
                          "children": [
                            { "type": "Text", "className": "text-lg font-semibold text-gray-900", "text": "Room Name" },
                            { "type": "Text", "className": "text-sm text-gray-500 mt-1", "text": "L × W × H ft" }
                          ]
                        },
                        { "type": "Icon", "name": "chevron-forward", "size": 20, "color": "#9CA3AF" }
                      ]
                    },
                    {
                      "type": "View",
                      "className": "Include/Exclude Toggle - flex-row items-center justify-between pt-3 border-t border-gray-100",
                      "children": [
                        { "type": "Text", "className": "text-sm text-gray-600", "text": "Included/Excluded from calculations" },
                        { "type": "Pressable", "className": "px-3 py-1.5 rounded-lg bg-gray-300 or bg-blue-600", "children": [
                          { "type": "Text", "className": "text-xs font-semibold text-gray-700 or text-white", "text": "Include/Exclude" }
                        ]}
                      ]
                    }
                  ]
                }
              ]
            },
            {
              "type": "View",
              "className": "Staircases Section - px-6 pb-6",
              "children": [
                {
                  "type": "View",
                  "className": "flex-row justify-between items-center mb-4",
                  "children": [
                    { "type": "Text", "className": "text-xl font-bold text-gray-900", "text": "Main Staircase" },
                    { "type": "Pressable", "className": "bg-blue-600 rounded-lg px-4 py-2 active:bg-blue-700", "children": [
                      { "type": "Text", "className": "text-white font-semibold", "text": "Add Staircase" }
                    ]}
                  ]
                },
                {
                  "type": "Pressable",
                  "className": "Staircase Card - bg-white rounded-xl p-4 mb-3 border border-gray-200 active:bg-gray-50",
                  "children": [
                    {
                      "type": "View",
                      "className": "flex-row justify-between items-center",
                      "children": [
                        { "type": "Text", "className": "text-lg font-semibold text-gray-900", "text": "Staircase X" },
                        { "type": "Icon", "name": "chevron-forward", "size": 20, "color": "#9CA3AF" }
                      ]
                    }
                  ]
                }
              ]
            },
            {
              "type": "View",
              "className": "Fireplaces Section - px-6 pb-6",
              "children": [
                {
                  "type": "View",
                  "className": "flex-row justify-between items-center mb-4",
                  "children": [
                    { "type": "Text", "className": "text-xl font-bold text-gray-900", "text": "Fireplaces" },
                    { "type": "Pressable", "className": "bg-blue-600 rounded-lg px-4 py-2 active:bg-blue-700", "children": [
                      { "type": "Text", "className": "text-white font-semibold", "text": "Add Fireplace" }
                    ]}
                  ]
                }
              ]
            }
          ]
        },
        {
          "type": "View",
          "className": "Bottom Actions Bar - absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4",
          "style": { "paddingBottom": "insets.bottom + 16" },
          "children": [
            {
              "type": "View",
              "className": "flex-row gap-3 mb-3",
              "children": [
                { "type": "Pressable", "className": "flex-1 bg-gray-100 rounded-xl py-3 items-center active:bg-gray-200", "children": [
                  { "type": "Text", "className": "text-gray-900 font-semibold text-sm", "text": "Admin View" }
                ]},
                { "type": "Pressable", "className": "flex-1 bg-green-600 rounded-xl py-3 items-center active:bg-green-700", "children": [
                  { "type": "Text", "className": "text-white font-semibold text-sm", "text": "Quotes" }
                ]},
                { "type": "Pressable", "className": "flex-1 bg-purple-600 rounded-xl py-3 items-center active:bg-purple-700", "children": [
                  { "type": "Text", "className": "text-white font-semibold text-sm", "text": "Builder" }
                ]}
              ]
            },
            { "type": "Pressable", "className": "bg-blue-600 rounded-xl py-3 items-center active:bg-blue-700", "children": [
              { "type": "Text", "className": "text-white font-semibold", "text": "Generate Client Proposal" }
            ]}
          ]
        }
      ],
      "inconsistencies": [
        "COMPLETELY TAILWIND - Does not use design system at all",
        "Uses hardcoded color values in tailwind classes (bg-blue-600, text-gray-900, etc.)",
        "No consistency with HomeScreen which uses design system",
        "Page indicator component with red debug color (#DC2626)"
      ]
    },

    {
      "screenName": "RoomEditorScreen",
      "file": "src/screens/RoomEditorScreen.tsx",
      "background": "TailwindCSS bg-gray-50",
      "designSystemUsage": "NO - Uses only TailwindCSS className prop",
      "components": [
        {
          "type": "KeyboardAvoidingView",
          "behavior": "padding",
          "className": "flex-1 bg-gray-50",
          "children": [
            {
              "type": "ScrollView",
              "className": "flex-1",
              "children": [
                {
                  "type": "View",
                  "className": "PAGE INDICATOR - bg-gray-100 px-6 py-2",
                  "children": [
                    { "type": "Text", "className": "text-xl font-bold", "style": { "color": "#DC2626" }, "text": "PAGE: RoomEditorScreen" }
                  ]
                },
                {
                  "type": "View",
                  "className": "p-6",
                  "children": [
                    {
                      "type": "View",
                      "className": "Room Name Input - mb-4",
                      "children": [
                        { "type": "Text", "className": "text-2xl font-medium text-gray-700 mb-2", "text": "Room Name" },
                        { "type": "TextInput", "className": "bg-white border border-gray-300 rounded-xl px-4 py-4 text-xl" }
                      ]
                    },
                    {
                      "type": "View",
                      "className": "Bluetooth Section - bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4",
                      "children": [
                        {
                          "type": "View",
                          "className": "flex-row items-center justify-between mb-2",
                          "children": [
                            { "type": "Text", "className": "text-2xl font-semibold text-blue-900", "text": "Bluetooth Laser (Optional)" },
                            {
                              "type": "View",
                              "className": "Connected Badge - bg-green-500 rounded-full px-3 py-1",
                              "children": [
                                { "type": "Text", "className": "text-xl font-medium text-white", "text": "Connected" }
                              ]
                            },
                            { "type": "Pressable", "className": "Scan Button - bg-blue-600 rounded-lg px-3 py-1", "children": [
                              { "type": "Text", "className": "text-xl font-medium text-white", "text": "Scan" }
                            ]}
                          ]
                        },
                        { "type": "Text", "className": "text-2xl text-blue-700 mt-2 font-medium", "text": "Connect a Bosch laser meter or enter measurements manually" }
                      ]
                    },
                    {
                      "type": "View",
                      "className": "Measurement Input - mb-4",
                      "children": [
                        { "type": "Text", "className": "text-2xl font-medium text-gray-700 mb-2", "text": "Length (ft)" },
                        {
                          "type": "View",
                          "className": "flex-row gap-2",
                          "children": [
                            { "type": "TextInput", "className": "flex-1 bg-white border border-gray-300 rounded-xl px-4 py-4 text-xl", "keyboardType": "decimal-pad" },
                            { "type": "Pressable", "className": "bg-blue-600 rounded-xl px-4 py-3 items-center justify-center active:bg-blue-700", "children": [
                              { "type": "Icon", "name": "radio-outline", "size": 20, "color": "#fff" }
                            ]}
                          ]
                        }
                      ]
                    },
                    {
                      "type": "View",
                      "className": "Manual Area Input - mb-4",
                      "children": [
                        { "type": "Text", "className": "text-2xl font-medium text-gray-700 mb-2", "text": "Manual Area (sq ft) - Optional" },
                        { "type": "TextInput", "className": "bg-white border border-gray-300 rounded-xl px-4 py-4 text-xl", "keyboardType": "decimal-pad" },
                        { "type": "Text", "className": "text-xl text-gray-500 mt-1", "text": "If entered, this will override Length × Width for ceiling area" }
                      ]
                    },
                    {
                      "type": "View",
                      "className": "Ceiling Type Selector - mb-4",
                      "children": [
                        { "type": "Text", "className": "text-2xl font-medium text-gray-700 mb-2", "text": "Ceiling Type" },
                        {
                          "type": "View",
                          "className": "flex-row gap-2",
                          "children": [
                            { "type": "Pressable", "className": "flex-1 rounded-xl py-3 items-center bg-blue-600 or bg-white border border-gray-300", "children": [
                              { "type": "Text", "className": "font-semibold text-white or text-gray-700", "text": "Flat" }
                            ]},
                            { "type": "Pressable", "className": "flex-1 rounded-xl py-3 items-center bg-blue-600 or bg-white border border-gray-300", "children": [
                              { "type": "Text", "className": "font-semibold text-white or text-gray-700", "text": "Cathedral" }
                            ]}
                          ]
                        }
                      ]
                    },
                    {
                      "type": "Pressable",
                      "className": "Toggle Row - flex-row items-center justify-between bg-white border border-gray-300 rounded-xl px-4 py-3 mb-4",
                      "children": [
                        { "type": "Text", "className": "text-xl text-gray-700", "text": "Paint Baseboard" },
                        {
                          "type": "View",
                          "className": "Toggle - w-12 h-7 rounded-full bg-blue-600 or bg-gray-300",
                          "children": [
                            { "type": "View", "className": "w-5 h-5 rounded-full bg-white mt-1 ml-6 or ml-1" }
                          ]
                        }
                      ]
                    },
                    {
                      "type": "View",
                      "className": "Windows & Doors Counter - mb-4",
                      "children": [
                        { "type": "Text", "className": "text-2xl font-medium text-gray-700 mb-2", "text": "Windows & Doors" },
                        {
                          "type": "View",
                          "className": "Counter Row - flex-row items-center gap-3 mb-3",
                          "children": [
                            {
                              "type": "View",
                              "className": "flex-row items-center gap-2",
                              "children": [
                                { "type": "Pressable", "className": "bg-gray-200 rounded-lg p-2 active:bg-gray-300", "children": [
                                  { "type": "Icon", "name": "remove", "size": 20, "color": "#374151" }
                                ]},
                                { "type": "Text", "className": "text-xl font-semibold text-gray-900 min-w-[24px] text-center", "text": "X" },
                                { "type": "Pressable", "className": "bg-gray-200 rounded-lg p-2 active:bg-gray-300", "children": [
                                  { "type": "Icon", "name": "add", "size": 20, "color": "#374151" }
                                ]}
                              ]
                            },
                            { "type": "Text", "className": "text-xl text-gray-700 flex-1", "text": "Windows" }
                          ]
                        }
                      ]
                    },
                    {
                      "type": "View",
                      "className": "Include in Quote Section - mb-6 bg-gray-50 rounded-xl p-4",
                      "children": [
                        { "type": "Text", "className": "text-2xl font-semibold text-gray-900 mb-3", "text": "Include in Quote" },
                        { "type": "Text", "className": "text-base text-gray-600 mb-4", "text": "Toggle items to exclude from calculations for flexible pricing" }
                      ]
                    },
                    {
                      "type": "View",
                      "className": "Closets Section - mb-4",
                      "children": [
                        { "type": "Text", "className": "text-2xl font-medium text-gray-700 mb-2", "text": "Closets" }
                      ]
                    },
                    {
                      "type": "View",
                      "className": "Calculations Preview - bg-white rounded-xl p-4 border border-gray-200 mb-4",
                      "children": [
                        { "type": "Text", "className": "text-2xl font-bold text-gray-900 mb-3", "text": "Estimate Preview" },
                        {
                          "type": "View",
                          "className": "Calculation Block - bg-gray-50 rounded-lg p-3 mb-3",
                          "children": [
                            { "type": "Text", "className": "text-base font-semibold text-gray-700 mb-2", "text": "WALL AREA CALCULATION:" },
                            {
                              "type": "View",
                              "className": "flex-row justify-between mb-1",
                              "children": [
                                { "type": "Text", "className": "text-sm text-gray-600", "text": "Label:" },
                                { "type": "Text", "className": "text-sm text-gray-900", "text": "Value" }
                              ]
                            }
                          ]
                        },
                        {
                          "type": "View",
                          "className": "Summary Block - bg-blue-50 border border-blue-200 rounded-lg p-3",
                          "children": [
                            {
                              "type": "View",
                              "className": "flex-row justify-between mb-1",
                              "children": [
                                { "type": "Text", "className": "text-base text-gray-600", "text": "Labor Cost:" },
                                { "type": "Text", "className": "text-base text-gray-900", "text": "\$XXX" }
                              ]
                            },
                            {
                              "type": "View",
                              "className": "border-t border-blue-300 pt-2",
                              "children": [
                                {
                                  "type": "View",
                                  "className": "flex-row justify-between",
                                  "children": [
                                    { "type": "Text", "className": "text-base font-bold text-gray-900", "text": "Total Price:" },
                                    { "type": "Text", "className": "text-base font-bold text-blue-600", "text": "\$X,XXX" }
                                  ]
                                }
                              ]
                            }
                          ]
                        }
                      ]
                    },
                    {
                      "type": "View",
                      "className": "Materials Breakdown - bg-white rounded-xl p-4 border border-gray-200 mb-4",
                      "children": [
                        { "type": "Text", "className": "text-2xl font-bold text-gray-900 mb-3", "text": "Materials Breakdown" },
                        {
                          "type": "View",
                          "className": "Material Item - mb-3",
                          "children": [
                            {
                              "type": "View",
                              "className": "flex-row justify-between items-center mb-1",
                              "children": [
                                { "type": "Text", "className": "text-2xl font-semibold text-gray-900", "text": "Wall Paint (Flat)" },
                                { "type": "Text", "className": "text-2xl font-bold text-gray-900", "text": "X.X gal" }
                              ]
                            },
                            { "type": "Text", "className": "text-xl text-gray-500", "text": "XXX sq ft × X coat(s) ÷ XXX sq ft/gal" }
                          ]
                        }
                      ]
                    },
                    { "type": "Pressable", "className": "Save Button - bg-blue-600 rounded-xl py-4 items-center active:bg-blue-700", "children": [
                      { "type": "Text", "className": "text-white text-2xl font-semibold", "text": "Save Room" }
                    ]}
                  ]
                }
              ]
            }
          ]
        },
        {
          "type": "Modal",
          "className": "Save Confirmation Modal - absolute top-0 left-0 right-0 bottom-0 bg-black/50 items-center justify-center",
          "children": [
            {
              "type": "View",
              "className": "bg-white rounded-2xl mx-6 p-6 w-full max-w-sm",
              "children": [
                { "type": "Text", "className": "text-2xl font-bold text-gray-900 mb-2", "text": "Save Changes?" },
                { "type": "Text", "className": "text-xl text-gray-600 mb-6", "text": "You have unsaved changes. Do you want to save them before leaving?" },
                {
                  "type": "View",
                  "className": "gap-3",
                  "children": [
                    { "type": "Pressable", "className": "bg-blue-600 rounded-xl py-4 items-center active:bg-blue-700", "children": [
                      { "type": "Text", "className": "text-white text-xl font-semibold", "text": "Save Changes" }
                    ]},
                    { "type": "Pressable", "className": "bg-red-600 rounded-xl py-4 items-center active:bg-red-700", "children": [
                      { "type": "Text", "className": "text-white text-xl font-semibold", "text": "Discard Changes" }
                    ]},
                    { "type": "Pressable", "className": "bg-gray-200 rounded-xl py-4 items-center active:bg-gray-300", "children": [
                      { "type": "Text", "className": "text-gray-900 text-xl font-semibold", "text": "Cancel" }
                    ]}
                  ]
                }
              ]
            }
          ]
        }
      ],
      "inconsistencies": [
        "COMPLETELY TAILWIND - Does not use design system",
        "EXTREMELY LARGE TEXT - Uses text-2xl (24px) for labels instead of standard sizes",
        "INCONSISTENT WITH DESIGN SYSTEM - Should use Typography.body (16px) for labels",
        "Page indicator with debug color",
        "Blue sections use inconsistent blue shades (bg-blue-50, text-blue-900, bg-blue-600)"
      ]
    }
  ]
}
`
};
