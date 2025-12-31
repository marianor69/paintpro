/**
 * Inclusion Resolver Module
 *
 * This module implements the COMBINED AND RULE for determining scope item inclusion:
 *
 * COMBINED AND RULE:
 * - A category is included ONLY if BOTH room toggle AND QB toggle are true
 * - Room toggle defaults to true if undefined
 * - QuoteBuilder toggle must be explicitly true
 *
 * RULES:
 * - room.paint[X] = false → Item EXCLUDED (regardless of QB)
 * - room.paint[X] = true AND QB.include[X] = true → Item INCLUDED
 * - room.paint[X] = true AND QB.include[X] = false → Item EXCLUDED
 * - room.paint[X] = undefined AND QB.include[X] = true → Item INCLUDED
 * - room.paint[X] = undefined AND QB.include[X] = false → Item EXCLUDED
 *
 * EXAMPLES:
 * - room.paintWindows = false, QB.includeWindows = true → EXCLUDED ❌
 * - room.paintWindows = true, QB.includeWindows = false → EXCLUDED ❌
 * - room.paintWindows = true, QB.includeWindows = true → INCLUDED ✅
 * - room.paintWindows = undefined, QB.includeWindows = false → EXCLUDED ❌
 * - room.paintWindows = undefined, QB.includeWindows = true → INCLUDED ✅
 */

import { Room, QuoteBuilder } from "../types/painting";

export interface ResolvedInclusions {
  walls: boolean;
  ceilings: boolean;
  trim: boolean;
  baseboards: boolean;
  windows: boolean;
  doors: boolean;
  closets: boolean;
  closetInteriors: boolean;
  crownMoulding: boolean;
  jambs: boolean;
}

/**
 * Resolve inclusion for a single category using the COMBINED AND rule
 *
 * @param roomToggle - Room-level toggle (true/false/undefined)
 * @param qbToggle - QuoteBuilder toggle (true/false)
 * @returns Resolved inclusion boolean
 */
function resolveInclusion(
  roomToggle: boolean | undefined,
  qbToggle: boolean
): boolean {
  // COMBINED AND RULE: Both toggles must be true (or undefined defaults to true)
  const roomValue = roomToggle !== false; // undefined or true → true, false → false
  return roomValue && qbToggle;
}

/**
 * Compute resolved inclusions for a room based on COMBINED AND RULE
 *
 * This function applies the COMBINED AND RULE to determine what's included
 * for this specific room in this specific quote.
 *
 * COMBINED AND RULE: Both room toggle AND QB toggle must be true
 *
 * @param room - Room with room-level toggles
 * @param quoteBuilder - QuoteBuilder with project-level toggles
 * @param projectIncludeClosetInteriorInQuote - Project default for closet interiors
 * @returns ResolvedInclusions object with final boolean decisions
 */
export function computeResolvedInclusions(
  room: Room,
  quoteBuilder: QuoteBuilder,
  projectIncludeClosetInteriorInQuote?: boolean
): ResolvedInclusions {
  // Check if room is globally excluded
  const roomIncluded = room.included !== false;

  if (!roomIncluded) {
    // Room is excluded - everything is false
    return {
      walls: false,
      ceilings: false,
      trim: false,
      baseboards: false,
      windows: false,
      doors: false,
      closets: false,
      closetInteriors: false,
      crownMoulding: false,
      jambs: false,
    };
  }

  // Apply hierarchy for each category
  const walls = resolveInclusion(room.paintWalls, quoteBuilder.includeWalls);
  const ceilings = resolveInclusion(room.paintCeilings, quoteBuilder.includeCeilings);
  const trim = resolveInclusion(room.paintTrim, quoteBuilder.includeTrim);
  const baseboards = resolveInclusion(room.paintBaseboard, quoteBuilder.includeBaseboards);
  // Windows and doors use their respective toggles
  const windows = resolveInclusion(room.paintWindows, quoteBuilder.includeWindows);
  const doors = resolveInclusion(room.paintDoors, quoteBuilder.includeDoors);
  const closets = resolveInclusion(undefined, quoteBuilder.includeClosets); // No room-level closet toggle
  const crownMoulding = resolveInclusion(room.hasCrownMoulding, quoteBuilder.includeTrim); // Crown uses trim toggle
  const jambs = resolveInclusion(room.paintJambs, quoteBuilder.includeDoors); // Jambs use doors toggle

  // Closet interiors: Check room toggle first, then project default, then QB toggle
  let closetInteriors = false;
  if (room.includeClosetInteriorInQuote !== undefined) {
    // Room-level toggle exists - use it
    closetInteriors = room.includeClosetInteriorInQuote;
  } else if (projectIncludeClosetInteriorInQuote !== undefined) {
    // Project default exists - use it
    closetInteriors = projectIncludeClosetInteriorInQuote;
  } else {
    // Fall back to true (default)
    closetInteriors = true;
  }

  // Apply QB closets toggle as final filter
  closetInteriors = closetInteriors && quoteBuilder.includeClosets;

  return {
    walls,
    ceilings,
    trim,
    baseboards,
    windows,
    doors,
    closets,
    closetInteriors,
    crownMoulding,
    jambs,
  };
}

/**
 * Validate resolved inclusions against actual computation
 *
 * This function is used in TEST MODE to ensure no component is included
 * when its resolved inclusion is false.
 *
 * @param resolved - Resolved inclusions
 * @param computed - Computed values from calculation engine
 * @returns Array of warning strings for any mismatches
 */
export function validateResolvedInclusions(
  resolved: ResolvedInclusions,
  computed: {
    wallArea: number;
    ceilingArea: number;
    trimSqFt: number;
    baseboardLF: number;
    windowCount: number;
    doorCount: number;
    closetWallArea: number;
    crownMouldingLF: number;
  }
): string[] {
  const warnings: string[] = [];

  if (!resolved.walls && computed.wallArea > 0) {
    warnings.push("⚠️ Walls excluded but wallArea > 0");
  }

  if (!resolved.ceilings && computed.ceilingArea > 0) {
    warnings.push("⚠️ Ceilings excluded but ceilingArea > 0");
  }

  if (!resolved.trim && computed.trimSqFt > 0) {
    warnings.push("⚠️ Trim excluded but trimSqFt > 0");
  }

  if (!resolved.baseboards && computed.baseboardLF > 0) {
    warnings.push("⚠️ Baseboards excluded but baseboardLF > 0");
  }

  if (!resolved.closetInteriors && computed.closetWallArea > 0) {
    warnings.push("⚠️ Closet interiors excluded but closetWallArea > 0");
  }

  if (!resolved.crownMoulding && computed.crownMouldingLF > 0) {
    warnings.push("⚠️ Crown moulding excluded but crownMouldingLF > 0");
  }

  return warnings;
}
