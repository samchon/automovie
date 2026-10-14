/**
 * Linear interpolation; callers decide whether extrapolation is meaningful.
 *
 * @evidence contracts/common.md#principled-implementation a+(b-a)*t is affine scalar interpolation with dimensionless t preserving caller units; component callers supply finite supported values. Floating overflow/cancellation remains possible for arbitrary extreme inputs.
 * @evidence contracts/common.md#clear-and-simple-design One scalar owner shares arithmetic without imposing clamping, geometry or a progress policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No clamp/guessed endpoint changes extrapolation; supported domains and final finite geometry remain consumer responsibilities.
 * @evidence contracts/common.md#meaningful-documentation Prose assigns extrapolation meaning to callers; output is a scalar and no input mutates.
 * @evidence contracts/performance.md#efficient-algorithms Three scalar operations take fixed work with no allocation/population scan.
 * @evidence contracts/performance.md#reuse-equivalent-work Consumers share the formula and directly evaluate current inputs without retaining memoized scalar populations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a number transfers and no bytes, state, task or handle is retained.
 */
export const linearInterpolate: (a: number, b: number, t: number) => number = (
  a: number,
  b: number,
  t: number,
): number => a + (b - a) * t;
