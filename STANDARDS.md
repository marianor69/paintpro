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

Rule:
- Center-align labels when there is no helper text.
- Top-align labels when helper text is present.

Notes:
- Use `alignItems: "center"` when there is no helper text.
- Use `alignItems: "flex-start"` and offset the label block when helper text exists.

## CardNumbering

Rule:
- Cards are numbered per screen for reference only (no UI labels).
- Order is top-to-bottom, left-to-right as they appear on screen.
- Example: "CalculationSettings Card 1" refers to the first visible card from the top.
