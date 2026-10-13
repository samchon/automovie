
/**
 * Clamp a scalar into the closed unit interval [0, 1].
 *
 * Values below zero become zero and values above one become one; NaN stays
 * NaN, so a malformed input is never disguised as an endpoint. Segment
 * parameters and blend fractions share this one owner.
 *
 * @evidence contracts/common.md#principled-implementation Nested min/max project onto the closed interval while propagating NaN under ECMAScript arithmetic.
 * @evidence contracts/common.md#clear-and-simple-design The shared scalar clamp serves segment parameters and blend fractions without duplicated endpoint logic.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Zero and one define the supported interval for every consumer; malformed fractions are not coerced.
 * @evidence contracts/common.md#meaningful-documentation States inclusive endpoints, NaN propagation and the segment/blend parameter responsibility.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Two scalar comparisons take constant time and allocate no interpolation table.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each projection reads its current fraction and keeps no previous sample result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only the projected number returns; no input object, buffer or task survives the call.
 * @author Samchon
 */
export function clampAutoMovieUnitInterval(value: number): number {
  return Math.min(1, Math.max(0, value));
}
