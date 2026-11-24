/**
 * Refuse a physical dimension that is not a finite number strictly above zero.
 *
 * The procedural builders, surface-pattern generators, and opening reveal call
 * it on widths, heights, depths, thicknesses, and pattern periods before they
 * emit anything, so a zero, negative, `NaN`, or infinite extent fails with the
 * caller's own name for it instead of producing a collapsed or non-finite
 * mesh.
 *
 * @param value Dimension to admit, in the caller's unit: metres, or
 *   pattern-plane units for a pattern period.
 * @param label Name the error message gives the dimension.
 * @throws Error `<label> must be a finite number > 0` when the value is
 *   refused.
 */
export const positive: (value: number, label: string) => void = (
  value: number,
  label: string,
): void => {
  if (value <= 0) throw new Error(`${label} must be a finite number > 0`);
};
