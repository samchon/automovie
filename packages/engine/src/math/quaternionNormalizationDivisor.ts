/**
 * Positive rescaling for up to four squared binary64 components, or one when
 * the original normalization arithmetic is safe. Finite positive magnitudes
 * below 2^-511 or above 2^510 need rescaling. Zero and nonfinite components
 * retain the ordinary formula and its existing propagation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the scalar output, four-component bound, exact binary64 thresholds and zero/nonfinite behavior shared by quaternion normalization and axis-angle preparation.
 * @evidence contracts/development/implementation.md#principled-implementation Squaring magnitudes outside the stated binary64 interval can underflow or overflow a sum of up to four squares. Dividing every component by the same largest positive magnitude preserves direction while bringing that sum into range; other inputs keep divisor one.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This scalar owner supplies the existing magnitude gate to both normalized quaternion reads and fixed-axis preparation, without constructing a vector or maintaining a second policy.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Thresholds are the original binary64 bounds rather than physical tolerances. Zero, NaN and infinity are not repaired, and no caller, fixture or direction is special-cased.
 * @evidence contracts/development/implementation.md#efficient-algorithms Four absolute values, their maximum and fixed scalar comparisons take constant work and allocate no record.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Both existing arithmetic consumers import this one range policy; current component values are inspected on every call and no magnitude result is retained.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one number and retains no component record, cache, callback, handle or task.
 */
export function quaternionNormalizationDivisor(
  x: number,
  y: number,
  z: number,
  w: number = 0,
): number {
  const largest: number = Math.max(Math.abs(x), Math.abs(y), Math.abs(z), Math.abs(w));
  return Number.isFinite(largest) && largest > 0 &&
    (largest < 2 ** -511 || largest > 2 ** 510) ? largest : 1;
}
