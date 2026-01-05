// Type definitions for the painting estimator app

export interface Room {
  id: string;
  name: string;
  length: number;
  width: number;
  height: number;
  // Manual area override (optional)
  manualArea?: number;
  ceilingType: "flat" | "cathedral";
  // Cathedral ceiling dimensions
  cathedralPeakHeight?: number; // Height at the peak for cathedral ceilings
  windowCount: number;
  doorCount: number;
  hasCloset: boolean;
  // Closet details
  singleDoorClosets?: number;
  doubleDoorClosets?: number;
  includeClosetInteriorInQuote?: boolean; // Whether to include closet interior area in calculations (default: true)
  // Room-level paint options (override global defaults)
  paintWalls?: boolean; // Whether to paint walls in this room
  paintCeilings?: boolean; // Whether to paint ceilings in this room
  paintTrim?: boolean; // Whether to paint trim in this room (deprecated - use paintWindowFrames and paintDoorFrames)
  paintWindowFrames?: boolean; // Whether to paint window frames/trim
  paintDoorFrames?: boolean; // Whether to paint door frames/trim (includes closet doors)
  paintWindows?: boolean;
  paintDoors?: boolean;
  paintJambs?: boolean;
  paintBaseboard?: boolean;
  hasCrownMoulding?: boolean;
  hasAccentWall?: boolean; // Multiple colors / accent wall - adds labor multiplier
  coatsWalls: number;
  coatsCeiling: number;
  coatsTrim: number;
  coatsDoors: number;
  // Floor selection (1 or 2)
  floor?: number;
  // Include/exclude from calculations
  included?: boolean; // Whether to include this room in calculations (default: true)
  includeWindows?: boolean; // Whether to include windows in calculations (default: true)
  includeDoors?: boolean; // Whether to include doors in calculations (default: true)
  includeTrim?: boolean; // Whether to include trim (baseboard/crown) in calculations (default: true)
  // Openings (e.g., pass-through openings without doors)
  openings?: Opening[];
  // Per-room gallon usage (stored as decimals for accurate totaling)
  gallonUsage?: {
    wall: number;
    ceiling: number;
    trim: number;
    door: number;
  };
  // Single source of truth for room totals (computed and persisted)
  laborTotal?: number;
  materialsTotal?: number;
  grandTotal?: number;
  // Photos for documentation (with notes)
  photos?: RoomPhoto[];
  // Standalone notes field (available without photos)
  notes?: string;
}

export interface Opening {
  id: string;
  width: number; // in inches
  height: number; // in inches
  hasInteriorTrim: boolean; // Whether opening has trim on interior side (front)
  hasExteriorTrim: boolean; // Whether opening has trim on exterior side (back)
}

export interface RoomPhoto {
  id: string;
  uri: string;
  fileName: string; // Auto-generated: <roomName>_01.jpg, etc.
  note?: string; // Optional note (e.g., "nail pops", "holes", "sheetrock patch")
  createdAt: number;
}

export interface StaircaseWall {
  id: string;
  tallHeight: number; // Height of tall side of wall (in feet)
  shortHeight: number; // Height of short side of wall (in feet)
}

export interface Staircase {
  id: string;
  name: string; // Name/Location identifier
  riserCount: number;
  riserHeight: number;
  treadDepth: number;
  handrailLength: number;
  spindleCount: number;
  coats: number;
  // Wall fields (up to 4 walls)
  walls?: StaircaseWall[];
  // Notes field (available without photos)
  notes?: string;
}

export interface Fireplace {
  id: string;
  name: string; // Name/Location identifier
  // Legacy fields (backward compatibility)
  width: number;
  height: number;
  depth: number;
  hasTrim: boolean; // Deprecated - use hasLegs
  trimLinearFeet: number; // Deprecated - no longer used
  coats: number;
  // Notes field (available without photos)
  notes?: string;
  // New 3-part structure
  hasMantel?: boolean; // Fixed price
  hasLegs?: boolean; // Fixed price (replaces hasTrim)
  hasOverMantel?: boolean; // Measured area
  overMantelWidth?: number; // in feet
  overMantelHeight?: number; // in feet
}

export interface BuiltIn {
  id: string;
  name: string; // e.g., "Library Bookshelf", "Living Room Built-In"
  width: number; // in inches
  height: number; // in inches
  depth: number; // in inches (how far it protrudes from wall)
  shelfCount: number; // number of shelves
  coats: number; // number of coats to paint
  // Notes field (available without photos)
  notes?: string;
}

export interface BrickWall {
  id: string;
  name: string; // Name/Location identifier (required)
  width: number; // in feet
  height: number; // in feet
  includePrimer: boolean; // Toggle for primer (1 coat)
  coats: number; // Number of coats of wall paint (1 or 2, default 2)
  // Notes field (available without photos)
  notes?: string;
}

export interface IrregularRoom {
  id: string;
  name: string;
  // Area dimensions (width × height = wall area)
  width: number; // in feet
  height: number; // in feet - wall height
  // Cathedral ceiling
  ceilingType: "flat" | "cathedral";
  cathedralPeakHeight?: number;
  // Openings & Closets
  windowCount: number;
  doorCount: number;
  hasCloset: boolean;
  singleDoorClosets?: number;
  doubleDoorClosets?: number;
  includeClosetInteriorInQuote?: boolean;
  // Paint options
  paintWalls?: boolean;
  paintCeilings?: boolean;
  paintWindowFrames?: boolean;
  paintDoorFrames?: boolean;
  paintWindows?: boolean;
  paintDoors?: boolean;
  paintJambs?: boolean;
  paintBaseboard?: boolean;
  hasCrownMoulding?: boolean;
  hasAccentWall?: boolean;
  // Coats
  coatsWalls: number;
  coatsCeiling: number;
  coatsTrim: number;
  coatsDoors: number;
  // Floor selection
  floor?: number;
  // Photos and notes
  photos?: RoomPhoto[];
  notes?: string;
  // Totals
  laborTotal?: number;
  materialsTotal?: number;
  grandTotal?: number;
}

export interface ClientInfo {
  name: string;
  address: string;
  city?: string;
  country?: string;
  phone: string;
  email: string;
}

export interface PaintOption {
  id: string;
  enabled: boolean;
  name: string;
  pricePerGallon: number;
  coverageSqFt: number;
  materialMarkup: number;
  laborMultiplier: number;
  notes: string;
}

export interface QuoteBuilder {
  includeAllRooms: boolean;
  includedRoomIds: string[]; // used only when includeAllRooms = false
  // COMBINED RULE TOGGLES: A category is included ONLY if BOTH room.paint[category] AND quoteBuilder.include[category] are true
  includeWalls: boolean;
  includeCeilings: boolean;
  includeTrim: boolean;
  includeDoors: boolean;
  includeWindows: boolean;
  includeBaseboards: boolean;
  includeClosets: boolean;
  // Structural elements
  includeStaircases: boolean;
  includeFireplaces: boolean;
  includeBuiltIns: boolean;
  includePrimer: boolean;
  includeFloor1: boolean;
  includeFloor2: boolean;
  includeFloor3: boolean;
  includeFloor4: boolean;
  includeFloor5: boolean;
  paintOptions?: PaintOption[];
  showPaintOptionsInProposal?: boolean;
}

export interface Quote {
  id: string;
  title: string;
  quoteBuilder: QuoteBuilder;
  totals?: {
    totalWallGallons: number;
    totalCeilingGallons: number;
    totalTrimGallons: number;
    totalDoorGallons: number;
    totalPrimerGallons: number;
    totalLaborCost: number;
    totalMaterialCost: number;
    grandTotal: number;
    totalDoors: number;
    totalWindows: number;
    totalWallSqFt: number;
    totalCeilingSqFt: number;
    totalTrimSqFt: number;
    totalDoorSqFt: number;
  };
  roomBreakdown?: Array<{ name: string; price: number }>;
}

export interface GlobalPaintDefaults {
  paintWalls: boolean;
  paintCeilings: boolean;
  paintTrim: boolean; // deprecated - use paintWindowFrames and paintDoorFrames
  paintWindowFrames: boolean;
  paintDoorFrames: boolean;
  paintBaseboards: boolean;
  paintDoors: boolean;
  paintDoorJambs: boolean;
  paintWindows: boolean;
  paintCrownMoulding: boolean;
  paintClosetInteriors: boolean;
  includeStaircases: boolean;
  includeFireplaces: boolean;
  // Default coats for new rooms (project-level setting)
  defaultWallCoats: number;
  defaultCeilingCoats: number;
  defaultTrimCoats: number;
  defaultDoorCoats: number;
}

export interface Project {
  id: string;
  clientInfo: ClientInfo;
  rooms: Room[];
  staircases: Staircase[];
  fireplaces: Fireplace[];
  builtIns: BuiltIn[];
  brickWalls: BrickWall[];
  irregularRooms: IrregularRoom[];
  createdAt: number;
  updatedAt: number;
  // Floor information
  floorCount?: number; // Number of floors (1, 2, 3, etc.)
  floorHeights?: number[]; // Array of floor heights [8, 8, 8] for 3 floors
  // Legacy support
  hasTwoFloors?: boolean;
  firstFloorHeight?: number;
  secondFloorHeight?: number;
  // Global paint defaults - used when creating new rooms
  globalPaintDefaults?: GlobalPaintDefaults;
  // Project-level defaults (legacy - kept for backwards compatibility)
  paintBaseboard?: boolean; // Default baseboard painting setting for all rooms
  projectCoats?: 1 | 2; // Number of coats for the entire project (1 or 2)
  projectIncludeClosetInteriorInQuote?: boolean; // Default closet interior inclusion for all rooms (default: true)
  // Quotes system (replaces old quoteBuilder)
  quotes: Quote[]; // Array of quotes for this project
  activeQuoteId?: string; // Currently selected quote ID
  // Legacy support - will be migrated to quotes array
  quoteBuilder?: QuoteBuilder; // Deprecated: Use quotes array instead
  // Project cover photo for home screen thumbnail
  coverPhotoUri?: string;
  // Step progress tracking
  estimateBuildComplete?: boolean; // User explicitly marked Step 2 as done
  proposalSent?: boolean; // User successfully shared/sent the proposal (Step 3 complete)
  // Furniture moving
  includeFurnitureMoving?: boolean; // Whether to include furniture moving fee in quote (default: false)
}

export interface PricingSettings {
  // Labor rates
  wallLaborPerSqFt: number;
  ceilingLaborPerSqFt: number;
  baseboardLaborPerLF: number;
  doorLabor: number;
  windowLabor: number;
  closetLabor: number;
  riserLabor: number;
  spindleLabor: number;
  handrailLaborPerLF: number;
  fireplaceLabor: number; // Legacy - kept for backward compatibility
  mantelLabor: number; // Fixed price for mantel ($100 default)
  legsLabor: number; // Fixed price for legs ($100 default)
  crownMouldingLaborPerLF: number;

  // Second coat labor multiplier (e.g., 1.5 means 2 coats = 1.5x labor of 1 coat)
  // Default: 2.0 (full double labor)
  secondCoatLaborMultiplier: number;

  // Accent wall / multiple colors labor multiplier
  // Default: 1.25 (25% more labor for cutting in different colors)
  accentWallLaborMultiplier: number;

  // Furniture moving fee (flat fee per project)
  // Default: 100
  furnitureMovingFee: number;

  // Material prices - single gallons
  wallPaintPerGallon: number;
  ceilingPaintPerGallon: number;
  trimPaintPerGallon: number;
  doorPaintPerGallon: number;
  primerPerGallon: number;

  // Material prices - 5-gallon buckets
  wallPaintPer5Gallon?: number;
  ceilingPaintPer5Gallon?: number;
  trimPaintPer5Gallon?: number;
  doorPaintPer5Gallon?: number;
  primerPer5Gallon?: number;

  // Coverage settings
  wallCoverageSqFtPerGallon: number;
  ceilingCoverageSqFtPerGallon: number;
  trimCoverageSqFtPerGallon: number; // Coverage for trim paint in sqft
}

export interface RoomCalculations {
  wallSqFt: number;
  ceilingSqFt: number;
  baseboardLF: number;
  crownMouldingLF: number;
  totalWallGallons: number;
  totalCeilingGallons: number;
  totalTrimGallons: number;
  totalDoorGallons: number;
  laborCost: number;
  materialCost: number;
  totalPrice: number;
}

export interface StaircaseCalculations {
  paintableArea: number;
  totalGallons: number;
  laborCost: number;
  materialCost: number;
  totalPrice: number;
}

export interface FireplaceCalculations {
  paintableArea: number;
  totalGallons: number;
  laborCost: number;
  materialCost: number;
  totalPrice: number;
}

export interface BrickWallCalculations {
  paintableArea: number;
  primerGallons: number;
  paintGallons: number;
  totalGallons: number;
  primerLaborCost: number;
  paintLaborCost: number;
  primerMaterialCost: number;
  paintMaterialCost: number;
  laborCost: number;
  materialCost: number;
  totalPrice: number;
}

export interface PaintOptionResult {
  optionId: string;
  optionName: string;
  notes: string;
  wallGallons: number;
  wallPaintCost: number;
  laborCost: number;
  nonWallMaterialsCost: number;
  total: number;
}

export interface ProjectSummary {
  totalWallGallons: number;
  totalCeilingGallons: number;
  totalTrimGallons: number;
  totalDoorGallons: number;
  totalPrimerGallons: number;
  totalLaborCost: number;
  totalMaterialCost: number;
  grandTotal: number;
  itemizedPrices: Array<{
    id: string;
    name: string;
    price: number;
    laborCost: number;
    materialsCost: number;
  }>;
  totalDoors: number;
  totalWindows: number;
  // Area totals for proper paint calculation
  totalWallSqFt: number;
  totalCeilingSqFt: number;
  totalTrimSqFt: number;
  totalDoorSqFt: number;
  // Paint options results (Good/Better/Best)
  paintOptionResults?: PaintOptionResult[];
}
