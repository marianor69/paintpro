# Standards

## RightAlignColumns

Purpose: Align numeric column headers (e.g., "1 gal", "5 gal") with numeric inputs.

Apply:
- Column header text style: `textAlign: "right"`
- Numeric input text style: `textAlign: "right"`
- Fixed width for headers and input containers so columns line up

Reference implementation:
- `src/screens/PricingSettingsScreen.tsx`

Notes:
- Use the same width for header labels and input containers in that column group.
- Keep labels left-aligned when they are not part of the numeric columns.
