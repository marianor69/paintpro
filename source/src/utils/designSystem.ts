/**
 * GLOBAL DESIGN SYSTEM
 * This file defines all colors, typography, spacing, and shadows for the app
 */

export const Colors = {
  // Primary Colors
  primaryBlue: "#3A70C8",
  primaryBlueLight: "#E6EEF9",
  primaryBlueDark: "#2A4F8A",

  // Neutral Colors
  backgroundWarmGray: "#F6F4F2",
  neutralGray: "#DAD7D3",
  darkCharcoal: "#2E2E2E",
  mediumGray: "#6B6B6B",

  // Functional Colors
  white: "#FFFFFF",
  error: "#D32F2F",
  success: "#4CAF50",
  warning: "#FF9800",
} as const;

export const Typography = {
  h1: {
    fontSize: 26,
    fontWeight: "700" as const,
    color: Colors.darkCharcoal,
  },
  h2: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: Colors.darkCharcoal,
  },
  h3: {
    fontSize: 17,
    fontWeight: "500" as const,
    color: Colors.darkCharcoal,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
    color: Colors.darkCharcoal,
  },
  caption: {
    fontSize: 13,
    fontWeight: "400" as const,
    color: Colors.mediumGray,
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const BorderRadius = {
  default: 12,
} as const;

export const Shadows = {
  card: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
} as const;

/**
 * STANDARDIZED TEXT INPUT STYLES
 *
 * ⚠️ MANDATORY: ALL TextInput components MUST use these constants.
 * DO NOT create custom input styling anywhere in the codebase.
 *
 * Using these constants guarantees:
 * - Consistent cursor color across all inputs
 * - Consistent selection highlight color
 * - Proper cursor visibility (padding: 0 on TextInput, paddingH/V on container)
 * - Consistent typography and spacing
 *
 * These define:
 * - Text styling (fontSize, color, padding: 0 for optimal cursor visibility)
 * - Cursor color (primaryBlue)
 * - Selection color (primaryBlue)
 *
 * USAGE PATTERN:
 * <View style={TextInputStyles.container}>
 *   <TextInput style={TextInputStyles.base} {...props} />
 * </View>
 *
 * For multiline (notes, etc.):
 * <TextInput style={TextInputStyles.multiline} {...props} />
 */
export const TextInputStyles = {
  // Base style for single-line inputs
  base: {
    fontSize: Typography.body.fontSize,
    color: Colors.darkCharcoal,
    padding: 0, // CRITICAL: padding: 0 ensures cursor visibility
    cursorColor: Colors.primaryBlue,
    selectionColor: Colors.primaryBlue,
  } as const,

  // Container style for inputs (provides the border and background)
  container: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.default,
    borderWidth: 1,
    borderColor: Colors.neutralGray,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  } as const,

  // Multiline input style (for notes, etc.)
  multiline: {
    fontSize: Typography.body.fontSize,
    color: Colors.darkCharcoal,
    padding: 0, // CRITICAL: padding: 0 ensures cursor visibility
    cursorColor: Colors.primaryBlue,
    selectionColor: Colors.primaryBlue,
    minHeight: 80,
    textAlignVertical: "top" as const,
  } as const,
} as const;

