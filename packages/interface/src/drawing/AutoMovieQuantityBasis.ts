/**
 * Whether a number is the design's own arithmetic or an approximation of it.
 *
 * This is a producer-assigned method label, not an accuracy certificate or
 * purchasing recommendation. The implemented formulas use binary64 arithmetic
 * and six-decimal rounding; exact does not promise exact real arithmetic,
 * validated complete geometry, a numerical error bound or a quantity suitable
 * for an order.
 *
 * MeasureAutoMovieQuantities decides the label per subject: space-volume is
 * always approximate with the cell-union explanation, including shell-only
 * designs, and every other subject is exact. Other numerical limits and
 * missing-input gaps do not change this fixed labeling rule.
 */
export type AutoMovieQuantityBasis = "exact" | "approximate";
