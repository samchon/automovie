/**
 * Refuse a physical dimension that is not a finite number strictly above zero.
 *
 * The procedural builders, surface-pattern generators, and opening reveal call
 * it on widths, heights, depths, thicknesses, and pattern periods before they
 * emit anything, so a zero, negative, `NaN`, or infinite extent fails with the
 * caller's own name for it instead of producing a collapsed or non-finite mesh.
 *
 * @param value Dimension to admit, in the caller's unit: metres, or pattern-plane units for a pattern period.
 * @param label Name the error message gives the dimension.
 * @throws Error `<label> must be a finite number > 0` when the value is refused.
 *
 * @evidence contracts/common.md#principled-implementation `Number.isFinite` rejects `NaN` and both infinities before the strict `> 0` comparison, so the two tests together admit exactly the open interval a physical extent occupies.
 * @evidence contracts/common.md#clear-and-simple-design One throwing guard shared by the wall, extrusion, opening-reveal and surface-pattern builders, which all need to stop at the first bad dimension; collecting validators use `ViolationCollector.positive` instead because they report every violation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A refused value is never clamped or replaced by a default; the builder stops before emitting geometry.
 * @evidence contracts/common.md#meaningful-documentation States who calls it and when, the admitted interval, the unit of its callers, and the exact error it throws.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Two scalar comparisons; there is no algorithm or data structure to choose.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure check of one number; there is no result to share.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates only the refused error message and retains nothing.
 */
export const positive = (value: number, label: string): void => {
  if (!Number.isFinite(value) || value <= 0)
    throw new Error(`${label} must be a finite number > 0`);
};
