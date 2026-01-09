# Standards

## KeyboardPrevNextDone

Purpose: Provide consistent keyboard navigation with Previous/Next/Done buttons for form inputs on iOS.

Apply:
- Use `InputAccessoryView` on iOS with three buttons: Previous, Next, Done.
- First field: Previous disabled/hidden, Next enabled, Done hidden.
- Middle fields: Previous + Next enabled, Done hidden.
- Last field: Previous enabled, Next hidden, Done enabled (dismiss keyboard).
- Buttons use iOS blue when enabled and gray when disabled.
- No top border line; toolbar background matches keyboard.

Reference implementation:
- `src/components/FormInput.tsx`
- Editor screens using `FormInput` with `previousFieldRef` / `nextFieldRef`.

Notes:
- Do not remove existing `returnKeyType` or `onSubmitEditing` logic.
- This standard applies only to iOS (InputAccessoryView). Android may omit toolbar.

## DefaultFontSizes

Use these defaults for consistent typography:
- Card title (h2): 20
- Main label (body): 16
- Helper text (caption): 13

Reference implementation:
- `src/utils/designSystem.ts`

## RowLabelAlignment

Definitions (visual standards):
- Top-align: Use the same alignment as CalculationSettings Card 1, Row 1.
- Center-align: Main label aligns with the numeric value inside the bubble (not the unit header). Use CalculationSettings Card 3, Row 1.

Rule:
- Choose Top-align when the label block includes helper text.
- Choose Center-align when the label has no helper text.

Notes:
- These are visual standards; follow the reference examples above for alignment.

## CardNumbering

Rule:
- Cards are numbered per screen for reference only (no UI labels).
- Order is top-to-bottom, left-to-right as they appear on screen.
- Example: "CalculationSettings Card 1" refers to the first visible card from the top.

## RightAlignBubbleHeader

Purpose: Align unit headers (e.g., "Inches", "Feet") to the same right edge as the numeric value in the bubble.

Apply:
- Wrap the header and bubble in a fixed-width container (same width as the bubble).
- Set wrapper `alignItems: "flex-end"`.
- Header text uses `textAlign: "right"` and right padding equal to the bubble's horizontal padding.

Reference implementation:
- `src/screens/CalculationSettingsScreen.tsx`

Notes:
- This matches the visual alignment used in PricingSettings column headers.
