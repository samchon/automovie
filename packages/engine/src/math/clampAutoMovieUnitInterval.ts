/**
 * Clamp a scalar into the closed unit interval [0, 1].
 *
 * Values below zero become zero and values above one become one; NaN stays
 * NaN, so a malformed input is never disguised as an endpoint. Segment
 * parameters and blend fractions share this one owner.
 *
 * @author Samchon
 */
export function clampAutoMovieUnitInterval(value: number): number {
  return Math.min(1, Math.max(0, value));
}
