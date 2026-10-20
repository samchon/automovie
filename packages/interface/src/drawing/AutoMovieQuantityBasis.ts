/**
 * Whether a number is the design's own arithmetic or an approximation of it.
 *
 * This is a producer-assigned method label, not an accuracy certificate or purchasing recommendation. The implemented formulas use binary64 arithmetic and six-decimal rounding; exact does not promise exact real arithmetic, validated complete geometry, a numerical error bound or a quantity suitable for an order.
 *
 * measureAutoMovieQuantities decides the label per subject: space-volume is always approximate with the cell-union explanation, including shell-only designs, and every other subject is exact. Other numerical limits and missing-input gaps do not change this fixed labeling rule.
 *
 * @evidence contracts/common.md#principled-implementation The finding function selects approximate exactly when subject is space-volume; this discloses summing overlapping convex cells rather than their union. Shoelace/arc/route formulas and counts receive exact despite binary64, conditioning, tessellation-admission and rounding limits, so consumers must also read gaps and geometry premises.
 * @evidence contracts/common.md#clear-and-simple-design A finding totals one subject over many owners, so the basis is a per-finding label and the reason travels on the finding's `approximation` text rather than on each contributor.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The volume finding is labelled approximate for every design, including all-shell ones, rather than switching labels on what a particular design happens to contain; the over-conservative label for all-shell designs is a stated limitation.
 * @evidence contracts/common.md#meaningful-documentation States what each literal promises, which subject is approximate and why, and that the decision is per subject with the all-shell exception spelled out.
 */
export type AutoMovieQuantityBasis = "exact" | "approximate";
