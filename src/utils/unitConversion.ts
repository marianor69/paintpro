/**
 * Unit conversion utilities for metric/imperial system
 *
 * Strategy:
 * - All measurements stored internally in IMPERIAL (feet, square feet)
 * - Only convert for display
 * - Conversions: 1 ft = 0.3048 m, 1 sqft = 0.092903 m²
 */

export type UnitSystem = 'imperial' | 'metric';

export type MeasurementType =
  | 'length'      // feet to meters
  | 'area'        // sqft to m²
  | 'linearFeet'  // feet to meters (linear)
  | 'volume';     // cubic feet to cubic meters

/**
 * Convert a measurement from one unit system to another
 *
 * @param value - The value to convert (assumed to be in imperial)
 * @param type - Type of measurement
 * @param toSystem - Target unit system ('metric' or 'imperial')
 * @returns Converted value
 */
export function convertMeasurement(
  value: number,
  type: MeasurementType,
  toSystem: UnitSystem
): number {
  // If already in target system, return as-is
  if (toSystem === 'imperial') {
    return value;
  }

  // Convert from imperial to metric
  switch (type) {
    case 'length':
    case 'linearFeet':
      // feet to meters: 1 ft = 0.3048 m
      return value * 0.3048;

    case 'area':
      // sqft to m²: 1 sqft = 0.092903 m²
      return value * 0.092903;

    case 'volume':
      // cubic feet to cubic meters: 1 cu ft = 0.0283168 m³
      return value * 0.0283168;

    default:
      return value;
  }
}

/**
 * Get the appropriate unit label for a measurement type and system
 *
 * @param type - Type of measurement
 * @param unitSystem - Current unit system
 * @returns Unit label string (e.g., "ft", "m", "sqft", "m²")
 */
export function getUnitLabel(
  type: MeasurementType,
  unitSystem: UnitSystem
): string {
  if (unitSystem === 'metric') {
    switch (type) {
      case 'length':
      case 'linearFeet':
        return 'm';
      case 'area':
        return 'm²';
      case 'volume':
        return 'm³';
      default:
        return '';
    }
  } else {
    // imperial
    switch (type) {
      case 'length':
      case 'linearFeet':
        return 'ft';
      case 'area':
        return 'sqft';
      case 'volume':
        return 'cu ft';
      default:
        return '';
    }
  }
}

/**
 * Format a measurement value for display with proper unit label
 * Handles conversion and rounding
 *
 * @param value - Raw value (assumed to be in imperial)
 * @param type - Type of measurement
 * @param unitSystem - Target unit system for display
 * @param decimals - Number of decimal places (default: 2 for most, 0 for counts)
 * @returns Formatted string (e.g., "12.5 ft" or "3.8 m")
 */
export function formatMeasurement(
  value: number | undefined,
  type: MeasurementType,
  unitSystem: UnitSystem,
  decimals: number = 2
): string {
  if (value === undefined || value === null) {
    return '-';
  }

  // Handle NaN and Infinity
  if (!Number.isFinite(value)) {
    return '-';
  }

  // Convert if needed
  const convertedValue = convertMeasurement(value, type, unitSystem);

  // Round to specified decimal places
  const rounded = Math.round(convertedValue * Math.pow(10, decimals)) / Math.pow(10, decimals);

  // Get unit label
  const unit = getUnitLabel(type, unitSystem);

  // Format with unit
  return `${rounded} ${unit}`;
}

/**
 * Format a measurement value without unit label
 * Useful for displaying in input fields where unit is shown separately
 *
 * @param value - Raw value (assumed to be in imperial)
 * @param type - Type of measurement
 * @param unitSystem - Target unit system for display
 * @param decimals - Number of decimal places
 * @returns Formatted number as string
 */
export function formatMeasurementValue(
  value: number | undefined,
  type: MeasurementType,
  unitSystem: UnitSystem,
  decimals: number = 2
): string {
  if (value === undefined || value === null) {
    return '';
  }

  if (!Number.isFinite(value)) {
    return '';
  }

  const convertedValue = convertMeasurement(value, type, unitSystem);
  const rounded = Math.round(convertedValue * Math.pow(10, decimals)) / Math.pow(10, decimals);

  return rounded.toString();
}

/**
 * Parse user input in display units back to imperial for storage
 *
 * @param displayValue - User input (in current unit system)
 * @param type - Type of measurement
 * @param unitSystem - Current unit system the user is working in
 * @returns Value in imperial units for storage
 */
export function parseDisplayValue(
  displayValue: string | number,
  type: MeasurementType,
  unitSystem: UnitSystem
): number {
  const numValue = typeof displayValue === 'string' ? parseFloat(displayValue) : displayValue;

  if (!Number.isFinite(numValue)) {
    return 0;
  }

  // If already in imperial, return as-is
  if (unitSystem === 'imperial') {
    return numValue;
  }

  // Convert from metric to imperial
  switch (type) {
    case 'length':
    case 'linearFeet':
      // meters to feet: 1 m = 3.28084 ft
      return numValue * 3.28084;

    case 'area':
      // m² to sqft: 1 m² = 10.7639 sqft
      return numValue * 10.7639;

    case 'volume':
      // cubic meters to cubic feet: 1 m³ = 35.3147 cu ft
      return numValue * 35.3147;

    default:
      return numValue;
  }
}

/**
 * Get a helpful label for a measurement type
 * Used in input placeholders and form labels
 */
export function getMeasurementLabel(
  type: MeasurementType,
  unitSystem: UnitSystem
): string {
  if (unitSystem === 'metric') {
    switch (type) {
      case 'length':
      case 'linearFeet':
        return 'Meters (m)';
      case 'area':
        return 'Square Meters (m²)';
      case 'volume':
        return 'Cubic Meters (m³)';
      default:
        return 'Measurement';
    }
  } else {
    // imperial
    switch (type) {
      case 'length':
      case 'linearFeet':
        return 'Feet (ft)';
      case 'area':
        return 'Square Feet (sqft)';
      case 'volume':
        return 'Cubic Feet (cu ft)';
      default:
        return 'Measurement';
    }
  }
}

/**
 * Convert area from sqft to gallons needed based on coverage rate
 *
 * @param areaSqft - Area in square feet (imperial)
 * @param coverageSqftPerGal - Coverage rate (sqft per gallon)
 * @param coats - Number of coats
 * @returns Gallons needed
 */
export function calculateGallonsNeeded(
  areaSqft: number,
  coverageSqftPerGal: number,
  coats: number = 1
): number {
  if (areaSqft <= 0 || coverageSqftPerGal <= 0) {
    return 0;
  }

  const gallonsNeeded = (areaSqft * coats) / coverageSqftPerGal;

  // Round up to nearest 0.5 gallon for practical purposes
  return Math.ceil(gallonsNeeded * 2) / 2;
}

/**
 * Optimize gallons into buckets (5-gallon buckets + singles)
 *
 * @param gallonsNeeded - Total gallons needed
 * @returns Object with fiveGalBuckets and singleGallons
 */
export function optimizeBuckets(gallonsNeeded: number): {
  fiveGalBuckets: number;
  singleGallons: number;
} {
  const fiveGalBuckets = Math.floor(gallonsNeeded / 5);
  const singleGallons = gallonsNeeded % 5;

  return {
    fiveGalBuckets,
    singleGallons: singleGallons > 0 ? singleGallons : 0,
  };
}

/**
 * Format bucket recommendation as a user-friendly string
 * e.g., "2 x 5-gal buckets + 1 gal" or "3 gallons"
 */
export function formatBucketRecommendation(gallonsNeeded: number): string {
  const { fiveGalBuckets, singleGallons } = optimizeBuckets(gallonsNeeded);

  const parts: string[] = [];

  if (fiveGalBuckets > 0) {
    parts.push(`${fiveGalBuckets} x 5-gal bucket${fiveGalBuckets > 1 ? 's' : ''}`);
  }

  if (singleGallons > 0) {
    parts.push(`${singleGallons} gal`);
  }

  if (parts.length === 0) {
    return 'No paint needed';
  }

  return parts.join(' + ');
}
