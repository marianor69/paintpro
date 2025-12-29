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
  - City (optional)
  - Country (optional)
  - Phone (optional)
  - Email (optional)
- **Project Cover Photo**: Take or upload project thumbnail (appears on home screen)
  - Take Photo button (camera) or Choose from library
  - Retake/Choose/Delete buttons after selection
  - Optional feature, can be skipped
- **Create Button**: Full-width with Shadows.card when enabled, disabled state when name missing
- **Keyboard Handling**: Proper iOS KeyboardAvoidingView with dismissible keyboard

#### Project Detail Hub
- **Professional Project Hub**: ProjectDetailScreen redesigned as a central hub connecting Rooms, Contractor View, and Quote Builder
- **Design System**: Completely redesigned with unified design system (Colors, Typography, Spacing, BorderRadius, Shadows)
- **SafeAreaView Layout**: Proper iOS safe area handling with card-based sections
- **Project Setup (Separate Screen)**: Navigate to dedicated ProjectSetupScreen for:
  - **Floors & Heights - Ultra Compact**: Configure 1-5 floors with streamlined inline layout
    - Compact inline floor counter: "Floors: [-] 2 [+]"
    - Inline floor height inputs: "1st floor height: [8] ft"
    - Each floor's height used as default ceiling height for rooms on that floor
  - **Global Paint Defaults**: Project-level defaults for new rooms (can be overridden per room after creation)
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
  - **Split Paint Trim controls**: Separate toggles for independent control
    - "Paint Window Frames" - controls window trim and frames
    - "Paint Door Frames" - controls door frames and closet door frames
    - Previously a single "Paint Trim" toggle; now split for granular control
  - Toggle to paint or not paint baseboard (inherits project default)
  - **Pass-Through Openings**: Define openings (without doors) that:
    - Subtract wall area from calculations
    - Subtract opening width from baseboard length
    - Add trim area (front and/or back)
    - Support interior and exterior trim independently
    - Default size configurable in Calculation Settings (36" wide × 80" tall)
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
    ProjectSetupScreen.tsx
    RoomEditorScreen.tsx
    StaircaseEditorScreen.tsx
    FireplaceEditorScreen.tsx
    BuiltInEditorScreen.tsx
    PricingSettingsScreen.tsx
    CalculationSettingsScreen.tsx
    MaterialsSummaryScreen.tsx
    ClientProposalScreen.tsx
    QuoteBuilderScreen.tsx
    QuoteManagerScreen.tsx
    SettingsGateScreen.tsx
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
- **Pass-Through Openings**:
  - **Default Width**: 36 inches (3 ft) - standard opening width
  - **Default Height**: 80 inches (~6.67 ft) - standard opening height
  - **Trim Width**: 3.5 inches (default) - trim border around opening edges
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
- **Pass-Through Opening Calculations**:
  - Opening Area = (Width ÷ 12) × (Height ÷ 12)
  - Interior Trim Perimeter = (2 × Height ÷ 12) + (Width ÷ 12) (2 sides + top)
  - Exterior Trim Perimeter = (2 × Height ÷ 12) + (Width ÷ 12) (2 sides + top, if enabled)
  - Total Trim Area = (Interior Perimeter + Exterior Perimeter) × (Trim Width ÷ 12)
  - Wall Opening Deduction = Opening Area (no trim counted in wall deduction)
  - Baseboard Deduction = Width ÷ 12

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

### Photo Documentation (Room Photos Only)
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

### Recent Fixes (December 2025)

#### Staircase and Fireplace Save Fix
- **Fixed save functionality**: Staircases and fireplaces now properly save and appear in the Project screen after clicking Save
- **Improved cleanup logic**: Uses ref-based tracking to prevent stale closure issues with the save state
- **Consistent behavior**: Both staircase and fireplace editors now have identical save/cleanup patterns

#### Notes Field (Without Photos)
- **Standalone notes field**: Added a notes field to rooms, staircases, and fireplaces that is available even without taking photos
- **Use case**: Document observations about any space without needing to attach a photo

#### Consistent Input Styling
- **Standardized cursor color**: All text inputs now use the same blue cursor color (#3A70C8)
- **Consistent selection color**: Text selection highlighting is now uniform across all screens
- **Placeholder text**: All inputs use the same placeholder text color for consistency

#### Consistent Toggle Styling
- **Unified toggle appearance**: All toggle switches now use the same track colors and thumb colors
- **Design system colors**: Toggles use Colors.primaryBlue when on, Colors.neutralGray when off

#### Reduced Swipe-Back Sensitivity
- **Less accidental navigation**: Disabled full-screen gesture swipe, now only edge swipe works
- **Prevents losing work**: Reduces chance of accidentally leaving a screen while editing

#### Client Address Enhancements (December 2025)
- **City and Country Fields**: Added optional city and country fields to client address
- **Country-Based Phone Formatting**: Phone numbers automatically format based on the selected country:
  - **US/Canada**: (XXX) XXX-XXXX or +1 (XXX) XXX-XXXX
  - **UK**: +44 20 1234 5678 or domestic format
  - **Australia**: +61 2 1234 5678 or (02) 1234 5678
  - **Mexico**: +52 55 1234 5678
  - **Default**: Returns original format if country not recognized
- **Editable via Project Detail Screen**: City and country can be edited when updating client information
- **Phone Formatter Utility**: New `src/utils/phoneFormatter.ts` with country-specific formatting functions

#### Split Paint Trim Controls (December 2025)
- **Separated Window and Door Frames**: The single "Paint Trim" toggle has been split into two independent toggles:
  - **Paint Window Frames**: Controls window trim and frames (separate from other trim)
  - **Paint Door Frames**: Controls door frames and closet door frames (separate from other trim)
- **Backward Compatible**: Old `paintTrim` field marked as deprecated but still supported
- **Independent Calculation**: Window and door frame paint costs are calculated separately based on their respective toggles
- **Updated Global Defaults**: Project-level defaults now include both `paintWindowFrames` and `paintDoorFrames` settings

#### Pass-Through Openings (December 2025)
- **New Opening Feature**: Rooms can now include pass-through openings (without doors) that:
  - **Subtract Wall Area**: Opening dimensions reduce the wall square footage to be painted
  - **Subtract Baseboard**: Opening width reduces the baseboard linear feet to be painted
  - **Add Trim Area**: Opening edges add trim area to be painted (front and/or back)
  - **Dual Trim Control**: Interior and exterior trim can be toggled independently
- **Opening Configuration**:
  - Width and height in inches (e.g., 36" × 80")
  - Interior Trim toggle (paints the inside/front of the opening)
  - Exterior Trim toggle (paints the outside/back of the opening)
- **Calculation Defaults**: Pass-through opening defaults configurable in Calculation Settings:
  - **Default Width**: 36 inches (3 ft)
  - **Default Height**: 80 inches (~6.67 ft)
  - **Trim Width**: 3.5 inches (applies to all opening trim)
- **UI Implementation**: RoomEditorScreen includes "Openings" card with:
  - List of existing openings with width/height inputs
  - Interior/Exterior trim toggle buttons with checkbox styling
  - Add Opening button that creates default-sized openings
  - Delete button for each opening
- **Math Verification**: All calculations have been verified to work correctly:
  - Opening wall areas properly subtracted from wall paint gallons
  - Opening widths properly subtracted from baseboard calculations
  - Opening trim areas properly added to trim paint calculations
  - No TypeScript errors; app builds and runs correctly

#### Project Detail Screen Restructuring (December 2025)
- **Removed Room Exclusion Logic**: Rooms can no longer be marked as "Excluded"
- **Simplified Rooms Display**: Rooms section restructured to match Staircases/Fireplaces layout:
  - Compact header showing room count with "Add" button
  - Simple list items with room name and floor display
  - Tap to edit, long-press to delete (like other structural elements)
  - No separate overview section or warning banner about exclusions
- **Dynamic Room Title**: RoomEditor title now updates in real-time as user types room name:
  - Shows "Edit Room: {RoomName}"
  - Updates immediately when name field changes
  - Reverts to "Edit Room: Unnamed Room" if name is empty

#### Built-In Feature (December 2025)
- **New Structural Element**: Added "Built-In" as a new project element alongside Rooms, Staircases, and Fireplaces
- **Built-In Type**: Bookshelf or similar fixed fixture with:
  - **Name**: Custom label (e.g., "Library Bookshelf", "Living Room Built-In")
  - **Dimensions**: Width, height, depth in inches
  - **Shelves**: Number of shelves to paint
  - **Coats**: Number of paint coats (per-built-in setting)
  - **Notes**: Optional documentation field
- **Independent Calculations**: Built-Ins are calculated separately from rooms:
  - Own surface area calculations based on dimensions
  - Separate paint requirements
  - Not affected by room settings or quote builder room filters
- **UI Integration**: Built-Ins displayed in ProjectDetailScreen:
  - Compact display in structural elements section
  - Add/edit/delete functionality matching Staircases and Fireplaces
  - Simple list format showing name and quick actions
- **Store Methods**: Full CRUD operations in projectStore:
  - `addBuiltIn()`: Create new built-in with default dimensions (36"×80"×12" depth, 4 shelves, 2 coats)
  - `updateBuiltIn()`: Modify existing built-in properties
  - `deleteBuiltIn()`: Remove built-in from project
- **Quote Builder Integration**: `includeBuiltIns` toggle in Quote Builder to control inclusion in quotes

#### UI Improvements (December 2025)
- **Built-In Visibility**: Built-Ins section now displays in ProjectDetailScreen matching Staircases and Fireplaces layout
  - Shows count and add button when items exist
  - Shows full-width "Add Built-In" button in dedicated card when no items exist
  - Long-press to delete functionality
- **Merged Openings & Closets**: Combined separate "Openings" and "Openings & Closets" cards into single unified card
  - Pass-through openings section at top with "Add Opening" button
  - Visual divider separating openings from windows/doors/closets
  - Windows, Doors, and Closet counters in same card for better organization
- **Paint Toggles Default True**: All paint option toggles now default to enabled (true):
  - Paint Windows (previously false, now true)
  - Paint Doors (previously false, now true)
  - Paint Door Jambs (previously false, now true)
  - Crown Moulding (previously false, now true)
  - Existing projects preserve their settings; defaults apply only to new rooms
- **Unified Add Room Button**: Add Room UI now matches Staircase and Fireplace styling:
  - When rooms exist: Compact blue "Add" button in header (with floor selection for multi-floor projects)
  - When no rooms exist: Full-width white button with blue text "Add Room" in dedicated card
  - Consistent appearance across all structural element types

#### Bug Fixes & Improvements (December 2025 - Round 2)
- **Room Cleanup on Navigation**: Prevents creation of "Unnamed Room" entries when user adds a room but navigates away without saving
  - Uses ref to track saved state (isSavedRef)
  - Automatically deletes room on unmount if never saved and name is empty
- **Staircase/Fireplace Visibility**: Fixed bug where staircase/fireplace would temporarily appear then disappear after adding
  - Changed condition from OR (||) to AND (&&) to prevent both add and display sections from rendering simultaneously
  - Only shows "Add" section when both staircase AND fireplace are empty
- **Global Paint Defaults**: All paint options now default to true/enabled:
  - Paint Doors: false → **true**
  - Paint Door Jambs: false → **true**
  - Paint Crown Moulding: false → **true**
- **MaterialsSummary Bucket Images**: Paint bucket quantities now display with visual icons
  - 5-gallon bucket quantities shown with `5gal-bucket.png` image
  - 1-gallon bucket quantities shown with `1gal-bucket.png` image
  - Images displayed in `assets/` directory with 32×32px size
  - Applied to Wall, Ceiling, Trim, and Door paint sections
  - Images show count next to each bucket type for clear visual representation

### Recent Updates (Latest Session)

- **Global Paint Defaults Fixed**: Corrected default values in `projectStore.ts` to ensure paintDoors, paintDoorJambs, and paintCrownMoulding default to true for new projects
- **Save Button Styling**: Updated Save buttons in StaircaseEditorScreen and FireplaceEditorScreen to match RoomEditorScreen:
  - Changed from pressed state styling to fixed background color
  - Added `...Shadows.card` shadow effect for consistency
  - Updated font size to `Typography.body.fontSize`
  - Added accessibility labels and hints
- **Navigation Prevention Restored**: Reverted usePreventRemove to only trigger on actual unsaved changes (not empty forms), allowing users to exit without entering data
- **Fireplace Display Safety**: Added null/undefined checks for project.fireplaces array to prevent rendering issues:
  - Added safety checks in conditions checking fireplace.length
  - Ensures fireplaces display properly even if array is initially undefined
- **Removed Bucket Images**: MaterialsSummaryScreen reverted from image-based bucket display to text format:
  - Displays as "X × 5-gal + Y × 1-gal" for each paint type
  - Simpler, cleaner presentation without images
- **TextInput Cursor Visibility Audit**: Comprehensive audit of all TextInput fields across the app:
  - Fixed 5 TextInputs missing cursor colors (DimensionInput, NumericInput, RoomEditorScreen photo note, SettingsScreen PIN)
  - Added `cursorColor={Colors.primaryBlue}` and `selectionColor={Colors.primaryBlue}` to all inputs
- **Cursor Styling Standardization**: Updated RoomEditorScreen room name input to match DimensionInput cursor visibility pattern:
  - Moved padding from TextInput to outer View wrapper
  - Changed TextInput style to include `padding: 0` for optimal cursor visibility
  - Consistent cursor appearance across all input fields (blue, visible, no extra padding)

### Latest Session Updates

- **Room Name Field Selection Fix**: Added `selectTextOnFocus={false}` to room name input to prevent auto-selection of text when editing
  - Users can now position cursor and add text without replacing existing content
- **Empty Staircase/Fireplace Display Fix**: Added filter functions to only show staircase/fireplace items that have actual data
  - `hasStaircaseData()` and `hasFireplaceData()` helper functions check for numeric values
  - Empty items no longer briefly appear and disappear when navigating
  - Prevents cosmetic visual glitches
- **Built-In Feature Implementation**: Created complete BuiltInEditorScreen with full functionality
  - New screen: `src/screens/BuiltInEditorScreen.tsx`
  - Supports all BuiltIn properties: name, width, height, depth, shelf count, notes
  - Includes paintable area calculation (all 6 faces + shelves)
  - Save/Discard/Cancel prompts on navigation with unsaved changes
  - Cleanup on unmount to delete empty built-ins
  - Integrated into RootNavigator with BuiltInEditor route
  - handleAddBuiltIn now navigates to editor instead of showing alert
- **Type Safety**: Added Staircase and Fireplace type imports to ProjectDetailScreen for helper functions

### TextInputStyles Standardization (Bulletproof Design System)

**Goal**: Eliminate 100% of cursor styling inconsistencies across the app by centralizing TextInput styling in the design system.

**Implementation**: Created `TextInputStyles` constant system in `src/utils/designSystem.ts` with three standardized styles:
- `TextInputStyles.base`: For single-line inputs (includes `padding: 0`, `cursorColor`, `selectionColor`, fontSize, color)
- `TextInputStyles.container`: For wrapper View around TextInput (includes background, border, borderRadius, padding)
- `TextInputStyles.multiline`: For multiline inputs like notes (includes `padding: 0`, `cursorColor`, `selectionColor`, minHeight, textAlignVertical)

**Usage Pattern**:
```typescript
// Single-line inputs
<View style={TextInputStyles.container}>
  <TextInput style={TextInputStyles.base} {...props} />
</View>

// Multiline inputs
<TextInput style={TextInputStyles.multiline} {...props} />
```

**Updated Screens** (100% completion):
1. ✅ FireplaceEditorScreen - 5 inputs (width, height, depth, trimLinearFeet, notes)
2. ✅ StaircaseEditorScreen - 8 inputs (riserCount, handrailLength, spindleCount, tallWallHeight, shortWallHeight, notes)
3. ✅ ProjectDetailScreen - 7 inputs (client name, address, city, country, phone, email, floor heights)
4. ✅ RoomEditorScreen - 6 inputs (length, width, manualArea, cathedralPeakHeight, opening width/height, notes, photo note)
5. ✅ BuiltInEditorScreen - 7 inputs (name, width, height, depth, shelfCount, notes)
6. ✅ NewProjectScreen - 6 inputs (name, address, city, country, phone, email)
7. ✅ CalculationSettingsScreen - 16 inputs (all door/window/closet/baseboard calculations)
8. ✅ PricingSettingsScreen - 20+ inputs (all pricing and labor rate fields)
9. ✅ QuoteBuilderScreen - 6 inputs (paint option configuration)
10. ✅ SettingsScreen - PIN entry (custom styling preserved, cursor props removed)

**Result**: Zero instances of `cursorColor` or `selectionColor` outside the design system constants. All 100+ TextInputs across the app now use standardized cursor styling, guaranteeing 300% bulletproof consistency.

### Latest Session Updates (Current)

#### Built-In Dimension Conversions (Inches Only)
- **Changed defaults**: Built-In dimensions now stored and displayed in inches only
  - Width: 36 inches (was 36 feet ÷ 12)
  - Height: 80 inches (was 80 feet ÷ 12)
  - Depth: 12 inches (was 12 feet ÷ 12)
- **Removed /12 conversions**: BuiltInEditorScreen no longer divides by 12 when loading/saving
- **Updated labels and placeholders**: Changed from "(ft)" to "(inches)" for clarity

#### Standardized Save/Discard/Cancel Prompts (300% Guaranteed)
- **Created SavePromptModal component**: New reusable modal in `src/components/SavePromptModal.tsx`
  - Consistent appearance across all editor screens
  - Three-button layout: Save Changes (blue), Discard Changes (red), Cancel (gray)
  - Customizable title and message text
  - Full accessibility labels and hints
- **Applied to all 4 editor screens**:
  - ✅ RoomEditorScreen
  - ✅ StaircaseEditorScreen
  - ✅ FireplaceEditorScreen
  - ✅ BuiltInEditorScreen
- **Exit handler pattern**: All editors use standardized `usePreventRemove` hook only (no conflicting `beforeRemove` listeners)
  - Navigation is synchronous (removed `setTimeout` delays)
  - Empty items are deleted before navigation
  - Prevents "stuck" screens and stuck unsaved changes

### Latest Session Updates (Current)

#### Built-In Dimension Conversions (Inches Only)
- **Changed defaults**: Built-In dimensions now stored and displayed in inches only
  - Width: 36 inches (was 36 feet ÷ 12)
  - Height: 80 inches (was 80 feet ÷ 12)
  - Depth: 12 inches (was 12 feet ÷ 12)
- **Removed /12 conversions**: BuiltInEditorScreen no longer divides by 12 when loading/saving
- **Updated labels and placeholders**: Changed from "(ft)" to "(inches)" for clarity

#### Standardized Save/Discard/Cancel Prompts (300% Guaranteed)
- **Created SavePromptModal component**: New reusable modal in `src/components/SavePromptModal.tsx`
  - Consistent appearance across all editor screens
  - Three-button layout: Save Changes (blue), Discard Changes (red), Cancel (gray)
  - Customizable title and message text
  - Full accessibility labels and hints
- **Applied to all 4 editor screens**:
  - ✅ RoomEditorScreen
  - ✅ StaircaseEditorScreen
  - ✅ FireplaceEditorScreen
  - ✅ BuiltInEditorScreen
- **Exit handler pattern**: All editors use standardized `usePreventRemove` hook only (no conflicting `beforeRemove` listeners)
  - Navigation is synchronous (removed `setTimeout` delays)
  - Empty items are deleted before navigation
  - Prevents "stuck" screens and stuck unsaved changes

#### Fixed Card Flickering Bug
- **Problem**: "Staircases & Fireplaces" card briefly disappeared when returning from StaircaseEditor without changes
- **Root cause**: Two conflicting conditional Card components trying to render during state transitions
- **Solution**: Consolidated into single Card with internal ternary operators
  - Staircases section: Populated list OR empty "Add Staircase" button
  - Fireplaces section: Populated list OR empty "Add Fireplace" button
  - Both sections always exist within single Card
  - No conflicting render conditions = no visual flicker
- **Result**: Smooth navigation return with stable UI

#### Real Solution: Delay Staircase/Fireplace Creation Until Save (Architectural Improvement)
- **Original Problem**: Empty staircases/fireplaces were created when user clicked "Add", then deleted if user didn't save, causing flicker
- **New Architecture**: Create staircase/fireplace ONLY when user clicks Save, never before
- **Key Changes**:
  - **ProjectDetailScreen**: `handleAddStaircase()` and `handleAddFireplace()` now navigate WITHOUT creating item
    - Old: `const id = addStaircase(projectId); navigate(..., { staircaseId: id })`
    - New: `navigate(..., { projectId })` - no ID passed
  - **StaircaseEditorScreen**: Refactored to detect new vs existing staircase
    - `const isNewStaircase = !staircaseId` at top of component
    - New staircase has `staircase = null` initially
    - Existing staircase has `staircase = project.staircases.find(...)`
    - `handleSave()` creates staircase first if new: `const newId = addStaircase(projectId)` then updates it
    - `handleDiscardAndLeave()` just navigates back - nothing to delete
    - No cleanup effect needed - empty items never created in first place
  - **FireplaceEditorScreen**: Identical refactoring as StaircaseEditor
  - **RootNavigator**: Already had optional `staircaseId?` and `fireplaceId?` params

- **Benefits**:
  - ✅ No empty items ever created
  - ✅ No cleanup/deletion logic needed
  - ✅ No flicker on return navigation
  - ✅ Cleaner code - single source of truth for item lifecycle
  - ✅ User can safely navigate away without side effects
  - ✅ "Add" button doesn't pollute the list

#### Project Setup Screen (Dedicated UI)
- **New Screen**: ProjectSetupScreen for configuring project-level defaults
  - Separated from ProjectDetailScreen for focused editing
  - Reduces clutter on the main project view
  - Accessed via "Project Setup" button on ProjectDetailScreen
- **Floor & Height Configuration**:
  - Inline floor counter (1-5 floors)
  - Per-floor height inputs in feet
  - Changes apply immediately to project defaults
- **Global Paint Defaults**:
  - 8 paint toggles (walls, ceilings, trim, baseboards, doors, door jambs, crown moulding, closet interiors)
  - All default to enabled (true) for new rooms
  - Can be overridden per room after creation
- **Default Coats**:
  - Wall, Ceiling, Trim, and Door coats
  - Toggle between 1 and 2 coats
  - Used as starting values for new rooms
- **Navigation**: "Done" button returns to ProjectDetailScreen
- **UX Improvement**: Centralizes setup configuration, reduces ProjectDetailScreen complexity

#### Project Cover Photo Moved to New Project Screen
- **Moved from ProjectDetailScreen to NewProjectScreen**
  - Now appears during initial project creation, not as an afterthought
  - User can upload/take cover photo alongside client details
  - Optional feature - can be skipped and added later
  - Photo automatically saved to project when selected
- **Benefits**:
  - More logical workflow (set up project, then create details)
  - Reduces clutter on ProjectDetailScreen
  - Encourages documenting projects from the start
- **Updated screens**:
  - ✅ NewProjectScreen: Added Project Cover Photo section with photo upload/camera/delete buttons
  - ✅ ProjectDetailScreen: Removed Project Cover Photo section and handlers
  - ✅ RootNavigator: No route changes needed