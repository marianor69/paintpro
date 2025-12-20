# Paint Estimator App

A professional painting estimation app with Bluetooth laser integration for on-site measurements. Built with React Native and Expo.

## Features

### 📏 Bluetooth Laser Integration
- Connect to Bosch laser distance meters via Bluetooth
- Capture measurements directly into the app
- Assign measurements to room dimensions (length, width, height)

### 🏠 Project Management

#### New Project Creation
- **Compact, Professional Layout**: NewProjectScreen redesigned with design system
- **Client Information Card**: Clean form with proper spacing (14px horizontal, 12px vertical padding)
  - Client Name * (required)
  - Address * (required)
  - Phone (optional)
  - Email (optional)
- **Floor Information Card**: Streamlined floor configuration
  - Compact 32×32 floor counter buttons (white background with borders)
  - Fixed-width floor height inputs (100px) with "ft" label
  - Consistent Typography.body throughout
  - No oversized spacing - optimal vertical compression
- **Create Button**: Full-width with Shadows.card when enabled, disabled state when name missing
- **Keyboard Handling**: Proper iOS KeyboardAvoidingView with dismissible keyboard

#### Project Detail Hub
- **Professional Project Hub**: ProjectDetailScreen redesigned as a central hub connecting Rooms, Contractor View, and Quote Builder
- **Design System**: Completely redesigned with unified design system (Colors, Typography, Spacing, BorderRadius, Shadows)
- **SafeAreaView Layout**: Proper iOS safe area handling with card-based sections
- **Floors & Heights - Ultra Compact**: Configure 1-5 floors with streamlined inline layout
  - Compact inline floor counter: "Floors: [-] 2 [+]"
  - Inline floor height inputs: "1st floor height: [8] ft"
  - Each floor's height used as default ceiling height for rooms on that floor
- **Global Options**: Project-level defaults for new rooms (can be overridden per room after creation)
  - "Default: Paint baseboards in new rooms?" - Clear toggle with explanation
  - Number of Coats: Shows global defaults compactly: "Walls: 2 • Ceilings: 2 • Trim/Doors: 1"
  - iOS-style segmented control (1 Coat / 2 Coats)
  - Note: Trim and doors always use 1 coat regardless of setting
- **Repairs / Extra Work Section**: Placeholder for aggregate repair tracking
  - Currently shows "Repair tracking coming soon" with TODO comments
  - Designed to aggregate: nail pops, holes (small/medium/large), sheetrock patches
  - Repairs tracked per room, displayed as project totals here
- **Rooms Overview**: Enhanced display with clear exclusion logic
  - Room format: "{Room Name} — {Nth floor}" (e.g., "Living Room — 1st floor")
  - Visual pill tags: Gray "Excluded" badge for excluded rooms, blue "Closet" badge
  - Warning banner: "Important: Rooms marked as Excluded are never included in any quote, regardless of quote filters."
  - Quick include/exclude toggle per room
  - Tap to edit, long-press to delete
- **Floor-Specific Room Assignment**: Add rooms to specific floors with separate buttons
- **Room Exclusion Logic**: Rooms with `included === false` completely ignored by Quote Builder and Contractor View
- **JSON Import**: Import complete projects from JSON format
  - Includes client info, pricing settings, all rooms, and **Quote Builder configuration**
  - Quote Builder settings from JSON are preserved and automatically applied
  - **Room IDs are preserved from JSON** to maintain relationship with `includedRoomIds` filter
  - **Automatic Calculation**: All room data (gallon usage, labor, materials) is automatically calculated on import
  - **No Manual Save Required**: Imported rooms immediately display correctly in Contractor View without needing to open/save each room
  - Accessible via "Import from JSON" button on home screen
- **Staircases & Fireplaces Section**: Compact display with counts and inline edit buttons
- **Project Actions Card**: Consolidated tools section with detailed descriptions
  - **Contractor View (Materials & Totals)**: "Use this to see total gallons, 5-gallon vs single gallons, linear feet, and materials list."
  - **Quote Builder**: "Control what is included in the quote (walls, ceilings, trim, floors, closets)."
  - **Client Proposal**: "Create a client-facing proposal PDF or summary with selected items only."
  - **Room Details (Test Export)** *(Test Mode Only)*: Export complete pricing breakdown as JSON
    - Shows exactly what the user sees in the UI (areas, gallons, labor, materials, totals)
    - Includes UI-displayed values (with rounding) for accurate debugging
    - Reflects combined rule filtering (excluded categories show 0 area/cost)
    - Export format includes metadata documenting that UI values take precedence over raw calculations
  - **Export Pricing & Calculation Settings** *(Test Mode Only)*: Export all estimator settings
    - Exports ALL pricing rates (labor costs per unit, material prices)
    - Exports ALL calculation settings (door/window/closet dimensions, trim sizes)
    - Exports ALL coverage rules (paint consumption rates, default coats)
    - Helps debug discrepancies by showing exact values used by estimator
    - JSON format with timestamp and project ID for version tracking
  - **Export Calculation Trace** *(Test Mode Only)*: Export complete step-by-step math
    - Shows ALL inputs for each room/staircase/fireplace (dimensions, toggles, coats)
    - Shows ALL rates used (labor, materials, coverage, dimensions)
    - Shows step-by-step calculations (areas, gallons, costs per category)
    - Shows before & after rounding (raw values vs UI-displayed values)
    - Shows combined rule flags (what's included/excluded)
    - Allows end-to-end math verification without guessing
- **iOS Navigation**: Native stack header with swipe-back gesture enabled
- Track project history and updates

### 🎨 Room Estimation
- **Design System**: Completely redesigned with unified design system (Colors, Typography, Spacing, BorderRadius, Shadows)
- **Card-Based Layout**: Clean, organized sections with Card components for better visual hierarchy
- **Measurements**: Length, width with manual or Bluetooth capture
- **Bluetooth Integration**: Only visible in test mode (testMode setting)
- **Validation**: Room name required before saving; prevents "Unnamed Room" entries
- **Unsaved Changes**: Automatically prompts to save or discard changes when navigating away
  - If discarding an unsaved room (no name entered), the room is automatically deleted
- **Floor Selection**: Assign rooms to specific floors (only shown when project has 2+ floors)
  - Height automatically determined by the floor's configured height
  - Floor selector shows floor number and height (e.g., "1st Floor (8 ft)")
- **Ceiling Types**: Flat or cathedral (with peak height for accurate sloped area calculations)
- **Features**:
  - Windows and doors with modern counter interface (+ / - buttons)
  - Toggle to paint or not paint windows/doors (using standardized Toggle component)
  - Toggle to paint or not paint baseboard (inherits project default)
  - **Closets with 2' deep interior cavity calculations**:
    - Single door or double door options (with quantity counters)
    - Each closet treated as a real 2' deep cavity with:
      - Interior walls (back wall + 2 side walls)
      - Ceiling area
      - Baseboard around interior perimeter
    - **Toggle to include/exclude closet interiors** from quote
      - Default: included (configurable at project level)
      - Can override per room
      - Excluded closets still show in Admin summary for tracking
- **Quote Options Section**: Dedicated card for include/exclude toggles (windows, doors, trim)
- **Room Summary**: Live preview showing wall area, ceiling area, trim lengths, labor, materials, and total
- **Single Source of Truth - Unified Calculation Pipeline**:
  - **ONE calculation engine**: All math happens in `computeRoomPricingSummary()`, `computeStaircasePricingSummary()`, `computeFireplacePricingSummary()`
  - **ONE rounding location**: Rounding applied once inside engine (labor/materials: `.toFixed(2)`, total: `Math.round()`)
  - **ZERO duplicate calculations**: UI components only display engine output, never calculate
  - **Perfect consistency**: Room Editor, Contractor View, Client Proposal, and Export JSON show identical totals
  - **COMBINED AND RULE enforcement**: Room-level toggle AND QuoteBuilder toggle (both must be true)
  - **Resolved Inclusions**: Single source of truth for what's included, computed once per room via `computeResolvedInclusions()`
  - **UI-displayed values**: `laborDisplayed`, `materialsDisplayed`, `totalDisplayed` ensure all views match
  - **Pure formatting**: `formatCurrency()` only adds $ and commas (no rounding)
- **Auto-calculations**:
  - Wall square footage (window/door/closet openings always deducted)
  - Ceiling square footage
  - Baseboard linear feet (only calculated when painting baseboard)
  - Paint quantities (gallons) including semi-gloss for painted windows/doors
  - Labor and material costs (adjusted based on painted surfaces)
- **Accessibility**: Full WCAG AA compliance with proper roles, labels, and hints
- **Keyboard Handling**: KeyboardAvoidingView with proper behavior to prevent input obscuring

### 🪜 Main Staircase Estimation
- Number of risers input (standard 7.5" riser height assumed)
- Handrail length
- Spindle count
- **Validation**: Requires at least one measurement before saving
- **Unsaved Changes**: Automatically prompts to save or discard changes when navigating away
  - If discarding an unsaved staircase (no data entered), the staircase is automatically deleted
- **Secondary Stairwell**: Optional toggle for additional stairwell calculations
  - Tall wall height and short wall height inputs
  - Double-sided walls option
  - Fixed assumptions: 12 ft horizontal run, 3.5 ft stair width, 15 ft slope length
  - Detailed preview showing all measurements and calculated areas
- Automated paintable area calculations

### 🔥 Fireplace Estimation
- Width, height, depth measurements
- Optional trim calculations
- Automated surface area calculations

### 💰 Pricing Engine
- **Labor Rates**: Per sq ft, per linear foot, or flat rates
- **Material Prices**: Wall, ceiling, trim, door, and primer paint
- **Coverage Settings**: Customizable coverage rates
- **Calculation Settings**: Adjustable default measurements for:
  - Door dimensions (height, width, opening deduction, trim perimeter, jamb area)
  - Window dimensions (width, height, opening deduction, trim perimeter)
  - Closet dimensions (single and double door sizes with deductions)
  - All values can be customized from default standards
- **Calculations**: Automatic labor + materials = total price

### 📊 Admin Materials Summary
- Total paint gallons by type
- Material cost breakdown
- Labor cost breakdown
- Room-by-room pricing (internal use)
- **Closet Interior Breakdown**:
  - Separate tracking of included vs excluded closets
  - Shows counts (single/double door closets)
  - Lists wall area, ceiling area, and baseboard LF for each
  - Helps verify quote accuracy
- **Export Options**:
  - Copy to clipboard
  - Share via system share sheet
  - Full detailed breakdown for internal records

### 🔧 Quote Builder
- **Selective Category Inclusion/Exclusion**: Customize what appears in customer proposals without changing the underlying project data
- **Paint System Options (Good/Better/Best)**: Configure up to 3 different paint quality levels
  - Each option has customizable pricing, coverage, markup, and labor multipliers
  - Automatically calculates separate totals for each enabled paint option
  - Options display in both Admin Materials Summary and Client Proposals
  - Toggle visibility of paint options in client proposals
  - Default options: Standard Paint ($40/gal), Premium Paint ($60/gal), Designer Paint ($80/gal)
- **Quick Presets**: One-tap configurations
  - Full Interior (all items included)
  - Walls + Ceilings Only
  - Walls Only
  - Ceilings Only
  - Trim Package
  - Floor 1 Only / Floor 2 Only (when multi-floor)
- **Granular Filtering**:
  - **By Floor**: Toggle individual floors (1-5) on/off
  - **By Room**: "Include All Rooms" toggle, or multi-select specific rooms
  - **By Category**: Toggle each category independently:
    - Walls, Ceilings, Trim, Doors, Jambs, Baseboards, Crown Moulding
    - Closets, Staircases, Fireplaces, Primer
- **Calculation Pipeline Filtering**: Filters are applied DURING calculation stage
  - **Room Selection**: Applied FIRST using `isRoomIncludedInQuote(room, quoteBuilder)`
    - Checks floor inclusion flags (includeFloor1, includeFloor2, etc.)
    - Checks room inclusion mode (includeAllRooms = true, or room.id in includedRoomIds)
    - Only rooms passing BOTH checks proceed to calculation
  - **Category Filtering**: Applied SECOND inside `calculateFilteredRoomMetrics(room, pricing, projectCoats, includeClosets, quoteBuilder)`
    - Each category toggle (includeWalls, includeCeilings, etc.) acts as a hard filter
    - When OFF: area = 0, gallons = 0, labor = 0 for that category
    - When ON: normal calculation proceeds
    - Category filters are independent and do NOT affect each other
  - **Project Totals**: Accumulated in `calculateFilteredProjectSummary(project, pricing, quoteBuilder)`
    - Only processes rooms that pass `isRoomIncludedInQuote`
    - Sums filtered metrics from each room
    - Door/window counts ALWAYS show true physical counts (regardless of paint toggles)
- **Physical Reality Preserved**: Door/window/closet openings always reduce wall area (even if doors/windows excluded from painting)
- **Banner Indicator**: Client Proposal shows "Custom Quote" banner when filters are active
- **Non-Destructive**: All filtering happens at quote generation time; project data remains unchanged
- **Closet Interior Filtering**: When "Closets" is OFF:
  - Excludes closet wall areas from walls calculation
  - Excludes closet ceiling areas from ceilings calculation
  - Excludes closet baseboard LF from baseboard calculation
  - Closet section hidden in Admin Materials Summary
- **Primer Filtering**: When "Primer" is OFF:
  - Primer gallons set to 0
  - Primer cost excluded from materials summary
- **Paint System Options (Good/Better/Best)**:
  - Configure up to 3 paint options with different quality levels and pricing
  - Each option includes:
    - Name (e.g., "Standard Paint", "Premium Paint", "Designer Paint")
    - Price per gallon
    - Coverage (sq ft per gallon)
    - Material markup (multiplier for material costs)
    - Labor multiplier (adjusts labor costs)
    - Notes describing the paint option
  - Calculation Pipeline:
    - Wall gallons calculated based on each option's coverage rate
    - Wall paint cost = gallons × price per gallon × material markup
    - Labor cost = base labor × labor multiplier
    - Non-wall materials (ceiling, trim, door, primer) use standard pricing
    - Total = labor + wall paint cost + non-wall materials
  - Results displayed in:
    - Admin Materials Summary (detailed breakdown)
    - Client Proposal (if enabled, shows all options with pricing)
  - Toggle "Show Paint Options in Proposal" to control client visibility
  - Backward compatible: existing projects automatically get default options

### 📄 Client Proposal
- Clean, professional format
- Room name and price only (no breakdowns)
- **Quote Builder Integration**: Displays filtered totals based on Quote Builder settings
  - Shows "Custom Quote" banner when filters are active
  - Provides "What's Included" section listing enabled categories
  - Link to edit filters from proposal screen
- **Paint Quality Options**: Displays enabled paint options (Good/Better/Best)
  - Each option shows total price, paint name, and description
  - Helps clients choose their preferred quality level
  - Toggle visibility in Quote Builder settings
- **Export Options**:
  - Copy to clipboard
  - Share via system share sheet
  - Send via SMS/text message

## Project Structure

```
/src
  /api          # API integrations (unused in this app)
  /components   # Reusable React components
  /navigation   # React Navigation setup
    RootNavigator.tsx
  /screens      # All app screens
    HomeScreen.tsx
    NewProjectScreen.tsx
    ProjectDetailScreen.tsx
    RoomEditorScreen.tsx
    StaircaseEditorScreen.tsx
    FireplaceEditorScreen.tsx
    PricingSettingsScreen.tsx
    CalculationSettingsScreen.tsx
    MaterialsSummaryScreen.tsx
    ClientProposalScreen.tsx
  /services     # Bluetooth service
    bluetoothService.ts
  /state        # Zustand stores
    pricingStore.ts
    projectStore.ts
    calculationStore.ts
  /types        # TypeScript definitions
    painting.ts
  /utils        # Helper functions
    calculations.ts
    importProject.ts
    cn.ts
```

## Data Models

### Project
- Client info (name, address, phone, email)
- Floor heights (1st floor, optional 2nd floor)
- 2 floors toggle
- **Project-level default: Include closet interiors in quote** (default: true)
- **Quote Builder Settings** (optional): Customizes what appears in proposals
  - Floor inclusion flags (floors 1-5)
  - Room inclusion mode (all rooms or specific room IDs)
  - Category toggles (walls, ceilings, trim, doors, jambs, baseboards, crown, closets, staircases, fireplaces)
  - Non-destructive: does not modify room data
- Rooms array
- Staircases array
- Fireplaces array
- Timestamps

### Room
- Name, dimensions (L×W)
- Floor selection (1 or 2)
- Height (determined by project floor height)
- Ceiling type (flat/cathedral with optional peak height)
- Window count, door count
- Paint Options section: Paint Walls, Paint Ceilings, Paint Trim (door/window frames), Paint Baseboard, Paint Doors, Paint Door Jambs, Crown Moulding
- Single door closets count, double door closets count
- **Include closet interior in quote toggle** (default: true, inherits from project)
- Coat counts (walls, ceiling, trim, doors)

### Staircase
- Number of risers
- Standard 7.5" riser height (assumed)
- Handrail length
- Spindle count
- Secondary stairwell toggle
- Tall/short wall heights (if secondary stairwell)
- Double-sided walls toggle (if secondary stairwell)
- Coat count

### Fireplace
- Width, height, depth
- Has trim flag
- Trim linear feet
- Coat count

### Pricing Settings
Accessible via Settings → Pricing Settings:
- **Labor rates** (11 types): Wall, ceiling, baseboard, door, window, closet, riser, spindle, handrail, fireplace, crown moulding
- **Material prices** (4 types): Wall paint, ceiling paint, trim paint (for all trim items including doors), primer (per gallon)
- **Coverage settings**:
  - Wall coverage: 350 sq ft/gallon (default)
  - Ceiling coverage: 350 sq ft/gallon (default)
  - Trim coverage: 350 sq ft/gallon (default)
  - Door size: 20 sq ft per side (default)

### Calculation Settings (NEW)
All measurement assumptions used in calculations (accessible via Settings → Calculation Settings):

**Editable Base Measurements:**
- **Door Defaults**:
  - Height: 7 ft (default)
  - Width: 3 ft (default)
  - **Trim Width**: 3.5 inches (default) - used to calculate trim area around door openings
  - Jamb Area: 5.5 sq ft (inside door frame area)
- **Window Defaults**:
  - Width: 3 ft (default)
  - Height: 5 ft (default)
  - **Trim Width**: 3.5 inches (default) - used to calculate trim area around window openings
- **Single Door Closet**:
  - Width: 24 inches (default)
  - Height: 80 inches (default)
  - **Trim Width**: 3.5 inches (default) - used to calculate trim area around closet openings
- **Double Door Closet**:
  - Width: 48 inches (default)
  - Height: 80 inches (default)
  - **Trim Width**: 3.5 inches (default) - used to calculate trim area around closet openings
- **Baseboard Width**: 5.5 inches (default) - used to calculate baseboard trim area along walls
- **Crown Moulding Width**: 5.5 inches (default) - used to calculate crown moulding trim area along ceiling perimeter

**Auto-Calculated Values** (not editable, computed from base measurements):
- **Door Calculations**:
  - Opening Area = Height × Width
  - Trim Perimeter = (2 × Height) + Width (3 sides only, no floor)
  - Trim Area = Trim Perimeter × (Trim Width ÷ 12)
  - Wall Opening Deduction = Opening Area + Trim Area
  - Baseboard Deduction = Width + (Trim Width × 2 ÷ 12)
- **Window Calculations**:
  - Opening Area = Width × Height
  - Trim Perimeter = 2 × (Width + Height) (all 4 sides)
  - Trim Area = Trim Perimeter × (Trim Width ÷ 12)
  - Wall Opening Deduction = Opening Area + Trim Area
- **Closet Calculations**:
  - Opening Area = (Width ÷ 12) × (Height ÷ 12)
  - Trim Perimeter = (2 × Height ÷ 12) + (Width ÷ 12) (3 sides, no floor)
  - Trim Area = Trim Perimeter × (Trim Width ÷ 12)
  - Wall Opening Deduction = Opening Area + Trim Area
  - Baseboard Deduction = (Width ÷ 12) + (Trim Width × 2 ÷ 12)

All values are adjustable via Settings → Calculation Settings

## Calculations

### Toggle Combined AND Rule & Inclusion Resolution

The system uses a **COMBINED AND RULE** to determine what scope items are included in calculations. Both the room-level toggle AND the QuoteBuilder toggle must be true for a category to be included.

**COMBINED AND RULE:**
- A category is included **ONLY if BOTH** toggles are true
- Room toggle defaults to `true` if `undefined`
- QuoteBuilder toggle must be explicitly `true`

**RULES:**
- `room.paint[X] = false` → item is **EXCLUDED** (regardless of QB)
- `room.paint[X] = true` AND `QB.include[X] = true` → item is **INCLUDED** ✅
- `room.paint[X] = true` AND `QB.include[X] = false` → item is **EXCLUDED** ❌
- `room.paint[X] = undefined` AND `QB.include[X] = true` → item is **INCLUDED** ✅
- `room.paint[X] = undefined` AND `QB.include[X] = false` → item is **EXCLUDED** ❌

**Examples:**
```typescript
room.paintWindows = false, QB.includeWindows = true → EXCLUDED ❌
room.paintWindows = true,  QB.includeWindows = false → EXCLUDED ❌
room.paintWindows = true,  QB.includeWindows = true → INCLUDED ✅
room.paintWindows = undefined, QB.includeWindows = false → EXCLUDED ❌
room.paintWindows = undefined, QB.includeWindows = true → INCLUDED ✅
```

**Implementation:**
- All inclusion resolution happens in `src/utils/inclusionResolver.ts`
- `computeResolvedInclusions()` computes the final boolean decisions using AND logic
- Result is stored in `RoomPricingSummary.resolvedInclusions`
- This is the **SINGLE SOURCE OF TRUTH** for what's included

**Validation:**
- In TEST MODE, `validateResolvedInclusions()` checks for mismatches
- Warns if any component has area/cost but resolved inclusion is false
- Ensures calculation engine respects resolved inclusions

### Quote Builder Calculation Flow

The Quote Builder applies filters at the calculation stage using the COMBINED AND RULE system above.

**Step 1: Resolve Inclusions for Room**
```typescript
const resolvedInclusions = computeResolvedInclusions(
  room,
  quoteBuilder,
  projectIncludeClosetInteriorInQuote
);

// Result contains final boolean decisions:
// { walls, ceilings, trim, doors, windows, baseboards, closets, ... }
```

**Step 2: Apply Resolved Inclusions to Calculation**
```typescript
let wallSqFt = 0;
if (resolvedInclusions.walls) {
  wallSqFt = perimeter × height;
  wallSqFt -= openings; // Physical deductions always happen
}
// If walls not included → wallSqFt stays 0

// Similar for all categories:
// resolvedInclusions.ceilings → ceilingSqFt
// resolvedInclusions.baseboards → baseboardLF
// resolvedInclusions.trim → trimSqFt
// resolvedInclusions.doors → doorPaintGallons
// resolvedInclusions.closetInteriors → closetWallArea
```

**Step 3: Room Selection Filter**
```typescript
// Only process rooms that pass room selection
let activeRooms = [];
if (quoteBuilder.includeAllRooms === true) {
  activeRooms = project.rooms;
} else {
  activeRooms = project.rooms.filter(r =>
    quoteBuilder.includedRoomIds?.includes(r.id)
  );
}
```

**Step 4: Floor-Level Filtering**
```typescript
activeRooms.forEach(room => {
  const floor = room.floor || 1;
  if (quoteBuilder.includeFloor[floor] === false) {
    skip room;  // Floor excluded
  }
  // Process room with resolved inclusions...
});
```

**Step 5: Project-Wide Accumulation**
```typescript
// Accumulate totals from filtered rooms only
totalWallGallons += roomMetrics.wallPaintGallons;
totalCeilingGallons += roomMetrics.ceilingPaintGallons;
// etc.

// Door/window COUNTS always accumulated (physical reality)
totalDoors += room.doorCount;
totalWindows += room.windowCount;
```

**Key Rules:**
1. **Combined AND rule applied FIRST** - both toggles must be true for inclusion
2. **Room filtering is SECONDARY** - filters which rooms to include
3. **Floor filtering is TERTIARY** - filters within selected rooms
4. **Physical counts always show** - doors/windows reflect reality regardless of paint toggles
5. **Empty selection returns $0** - safety check prevents invalid calculations
6. **No cross-contamination** - disabling one category never affects another

### Wall Area
```
Perimeter = 2 × (Length + Width)
Wall SqFt = Perimeter × Height
Window/door/closet openings are ALWAYS deducted from wall area:
- Wall SqFt -= Windows × [Window Opening Deduction from settings]
- Wall SqFt -= Doors × [Door Opening Deduction from settings]
- Wall SqFt -= Single Door Closets × [Single Closet Deduction from settings]
- Wall SqFt -= Double Door Closets × [Double Closet Deduction from settings]
(Paint for trim is calculated separately)

Default deductions:
- Windows: 15 sq ft each
- Doors: 21 sq ft each
- Single Door Closets: 13.34 sq ft each
- Double Door Closets: 26.68 sq ft each
```

### Ceiling Area
```
Ceiling SqFt = Length × Width (or Manual Area if provided)
If Cathedral with peak height and width:
  Ceiling SqFt × sqrt(1 + (rise/run)²)
Else if Cathedral:
  Ceiling SqFt × 1.3
Manual area ALWAYS overrides length × width

If "Include Closet Interiors" is enabled:
  Closet Ceiling Area = Sum of all closet interior ceiling areas
  Total Ceiling SqFt = Main Room Ceiling SqFt + Closet Ceiling Area

Closet interior ceiling area per closet:
  Single door: 2.5' × 2' = 5 sqft
  Double door: 5' × 2' = 10 sqft
```

### Closet Interior Calculations
```
Each closet is treated as a 2' deep cavity with:

SINGLE DOOR CLOSET (30" = 2.5' opening):
- Interior Wall Area = (back wall + 2 side walls) × height
                     = (2.5' + 2×2') × height
                     = 6.5' × height
- Interior Ceiling Area = 2.5' × 2' = 5 sqft
- Interior Baseboard = 2 × (2.5' + 2') = 9 LF

DOUBLE DOOR CLOSET (60" = 5' opening):
- Interior Wall Area = (5' + 2×2') × height = 9' × height
- Interior Ceiling Area = 5' × 2' = 10 sqft
- Interior Baseboard = 2 × (5' + 2') = 14 LF

These values are ADDED to the room totals only if "Include Closet Interiors"
is enabled (default: true). This can be toggled per room or set as a
project-level default.
```

### Baseboard
```
Only calculated if "Paint Baseboard" is enabled
Main Room Baseboard LF = Perimeter - (Doors × [Door Opening Width from settings])
                                    - (Closets × [Closet Opening Width from settings])

If "Include Closet Interiors" is enabled:
  Closet Interior Baseboard LF = Sum of all closet interior perimeters
  Total Baseboard LF = Main Room Baseboard LF + Closet Interior Baseboard LF

Closet interior perimeter per closet:
  Single door: 2 × (2.5' + 2') = 9 LF
  Double door: 2 × (5' + 2') = 14 LF

Default door opening width: 2.5 ft
Default closet opening widths: 2.5 ft (single), 5 ft (double)
```

### Paint Gallons
```
Gallons = (Area ÷ Coverage) × Coats
Round up for materials list
```

### Pricing
```
Total = Labor Cost + Material Cost
```

## On-Site Workflow

1. **Create Project** → Enter client info and set floor heights
2. **Set Floor Heights** → Enter 1st floor height (default 8ft), toggle 2 floors if needed and enter 2nd floor height
3. **Add Room** → Tap "Add Room"
4. **Select Floor** → Choose 1st or 2nd floor (height automatically set)
5. **Capture Measurements** → Use Bluetooth laser or manual entry for length and width
6. **Input Features** →
   - Enter window and door counts
   - Toggle paint/no paint for windows and doors
   - Use +/- buttons to add single or double door closets
   - **Toggle "Include Closet Interiors"** if you want to exclude closet interiors from the quote
     - Each closet is calculated as a 2' deep cavity by default
     - Toggle shows below closet counters (blue info box)
   - Select ceiling type
7. **Review Calculations** → App auto-calculates price based on painted surfaces (including closet interiors if enabled)
8. **Repeat** → Add all rooms, stairs, fireplaces
9. **Generate Proposal** → Tap "Client Proposal"
10. **Send by Text** → Send estimate before leaving the house

## Bluetooth Setup

The app uses `react-native-ble-plx` for Bluetooth connectivity with **Bosch GLM 50C** integration.

**⚠️ IMPORTANT: This app requires a custom development build (not Expo Go)**

Because Bluetooth functionality requires native modules, you must build and run the app as a development build. The native folders (ios/ and android/) have been generated and configured with the BLE plugin.

**Supported Devices:**
- Bosch GLM 50C (fully tested and supported)
- Bosch GLM series laser distance meters
- Bosch PLR series laser distance meters

**Bluetooth Protocol:**
- Service UUID: `00005301-0000-0041-5253-534f46540000`
- TX Characteristic: `00004301-0000-0041-5253-534f46540000`
- RX Characteristic: `00004302-0000-0041-5253-534f46540000`
- Auto-sync enabled on connection
- Measurements read as float32 (little-endian) and converted from meters to feet

**Permissions:**
- Android: Bluetooth Scan, Bluetooth Connect, Location
- iOS: Bluetooth permissions (handled automatically)

**Usage:**
1. Turn on your Bosch GLM 50C and enable Bluetooth mode (hold BT button)
2. In the app, navigate to Room Editor
3. Tap "Scan" in the blue Bluetooth Laser section
4. Select "GLM 50C" from the device list
5. Once connected, tap the blue radio icon next to any measurement field
6. Take measurement with the physical laser button
7. Measurement automatically populates the field in feet

## Customization

### Accessing Settings
1. **Pricing Settings**: Home Screen → Settings icon (top right) → Adjust labor rates and material prices
2. **Calculation Settings**: Home Screen → Settings icon → "Calculation Settings" card at top → Adjust default measurements

### Default Pricing (in PricingSettings)
- Wall labor: $1.50/sq ft
- Ceiling labor: $1.75/sq ft
- Baseboard labor: $1.25/LF
- Door labor: $50
- Window labor: $35
- Closet labor: $75
- Riser labor: $15
- Spindle labor: $8
- Handrail labor: $10/LF
- Fireplace labor: $150

### Default Material Prices
- Wall paint: $45/gal
- Ceiling paint: $40/gal
- Trim paint: $50/gal (used for baseboards, doors, jambs, window/door trim, crown moulding, risers, spindles, handrails)
- Primer: $35/gal

### Default Coverage
- Wall/Ceiling: 350 sq ft/gallon
- Trim: 150 LF/gallon
- Door size: 20 sq ft

All defaults can be changed in Pricing Settings.

## State Management

Uses **Zustand** with **AsyncStorage** persistence:
- `projectStore`: All projects, rooms, stairs, fireplaces
- `pricingStore`: Labor rates, material prices, coverage settings
- `calculationStore`: Default measurement assumptions for doors, windows, and closets

Data persists between app sessions.

## Export Formats

### Text Message Format
```
Painting Estimate — 123 Elm Street
Client: John Doe
Date: Dec 10, 2025

Living Room — $780
Kitchen — $640
Master Bedroom — $550
Hallway — $295
Stairs — $420

TOTAL: $2,685

Includes all labor, paint, and materials.
Prepared on-site.
```

Clean, copy-ready format for SMS, email, or clipboard.

## Tech Stack

- **Framework**: React Native 0.76.7
- **SDK**: Expo 53
- **Navigation**: React Navigation (Native Stack)
- **State**: Zustand + AsyncStorage
- **Styling**: NativeWind (Tailwind for RN)
- **Bluetooth**: react-native-ble-plx
- **Icons**: @expo/vector-icons (Ionicons)
- **Date**: date-fns
- **SMS**: expo-sms
- **Clipboard**: @react-native-clipboard/clipboard

## Notes

- **No backend required** - all data stored locally
- **iOS optimized** - designed for iPhone use on-site
- **Admin/Client separation** - detailed breakdown stays private
- **One price only** - no Good/Better/Best tiers
- **Gallon rounding** - exact internally, rounded up for materials
- **Fast data entry** - optimized for quick on-site estimates

## Future Enhancements

Potential additions:
- PDF export
- Material supplier integration
- Historical project analytics
- Multi-user/cloud sync
- Actual vs. estimated tracking

## Recent Updates

### Window Calculation Improvements
- **Windows now use dedicated `paintWindows` toggle**: Previously windows were tied to the general `paintTrim` setting, now they use their own `room.paintWindows` property for independent control
- **Window-only projects calculate correctly**: Window trim paint is now calculated independently of general trim, allowing projects with only windows to show proper paint quantities
- **Material costs include window trim paint**: When only windows are enabled (not general trim), the system correctly includes trim paint cost for window frames

### Contractor View Improvements
- **Simplified share options**: Removed duplicate share buttons - now shows single "Share Summary" button when not in Test Mode
- **Test Mode tools**: Copy and Share buttons are now only shown together in the Test Mode section when Test Mode is enabled

### Client Proposal Improvements
- **Paint Quality Options only shown when relevant**: The Good/Better/Best paint options section only appears when there's actual wall area to paint. For window-only or trim-only projects, these options are hidden since they only apply to wall paint upgrades.

### Photo Documentation (No Impact on Calculations)
- **Project Cover Photo**: Take or upload a project cover photo that appears as thumbnail on the Home Screen
- **Room Photos**:
  - "Take Photo" button in each room to document nail pops, holes, sheetrock patches, or other observations
  - Each photo supports optional notes
  - Auto-naming format: `<roomName>_01.jpg`, `<roomName>_02.jpg`, etc.
  - Photos stored under `rooms[n].photos[]`
  - Purely for documentation - no math, labor, or pricing changes triggered

### Restructured Contractor View
The Contractor View (Materials Summary) has been reorganized for clarity:
1. Project header (title, client, address, project cover photo)
2. Summary totals (Labor, Materials, Grand Total)
3. Materials breakdown (paint quantities and bucket purchases)
4. Per-room cost breakdown
5. Doors / Windows / Closets summary
6. Per-room gallons summary
7. Paint System Options (if enabled)
8. Gallery of project photos with filenames and notes
9. Debug/Test Mode tools (only visible when Test Mode is ON)

### Protected Settings Screen
Access to pricing and calculation settings is now protected:
- **Confirmation Dialog**: When enabled, shows warning "This section contains sensitive configuration" before entering settings
- **PIN Protection**: Optional 4-digit PIN for stronger access control
- **Configure Protection**: Settings screen includes "Settings Protection" section to:
  - Toggle "Require Confirmation" on/off
  - Set, change, or remove PIN
- Prevents clients from accidentally (or intentionally) viewing contractor pricing

### 2-Coat Labor Multiplier
- **Configurable second coat labor pricing**: In Pricing Settings, you can now set a "2-Coat Labor Multiplier" that controls how much extra labor is charged when 2 coats are selected
- **Example**: If you set the multiplier to 1.5, then for a room that costs $100 labor with 1 coat, selecting 2 coats will cost $150 (1.5x the base labor)
- **Default value is 2.0**: This means 2 coats will cost exactly double the labor of 1 coat (same as before)
- **Applied per category**: The multiplier applies to walls, ceilings, trim, doors, windows, closets, and crown moulding based on their respective coat settings
- **Materials unaffected**: Paint material costs always scale linearly with coats (2 coats = 2x paint)

### Multiple Colors / Accent Wall Feature
- **Per-room toggle**: Each room now has a "Multiple Colors / Accent Wall" toggle in the Paint Options section
- **Labor multiplier**: When enabled, applies the accent wall labor multiplier (default: 1.25, or 25% more labor)
- **Configurable**: The multiplier can be adjusted in Pricing Settings under "Accent Wall Labor Multiplier"
- **Use case**: For rooms requiring extra cutting-in work due to different wall colors, accent walls, or color transitions
- **Materials unaffected**: Only labor is multiplied; paint quantities remain the same

### Paint Type Differentiation
The app uses **three paint types** for all surfaces:

1. **Wall Paint**: Used for walls and closet interior walls
   - Price and coverage from wall paint settings

2. **Ceiling Paint**: Used for ceilings and closet interior ceilings
   - Price and coverage from ceiling paint settings

3. **Trim Paint**: Used for ALL trim-type items (single paint type for consistency)
   - Baseboards
   - Door slabs and jambs
   - Window frames and door frames
   - Crown moulding
   - Closet door trim
   - Staircase components: risers, spindles, handrails
   - Price and coverage from trim paint settings

**Note**: Stairwell walls and ceilings use their respective paint types (wall paint for walls, ceiling paint for ceilings).

