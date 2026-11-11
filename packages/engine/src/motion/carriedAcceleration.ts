/**
 * What an acceleration at a cut adds to a path that starts without one, so
 * the sum leaves the cut with that acceleration.
 *
 * The companion of {@link carriedRate} one derivative up: the quintic Hermite
 * basis of a unit initial acceleration over `duration` seconds,
 * `D^2 u^2 (1 - u)^3 / 2` with `u = elapsed / D`, the one quintic with zero
 * value and slope and unit acceleration at the start and zero value, slope
 * and acceleration at the end. A minimum-jerk path, `carriedRate` and this
 * term together are the quintic through any value, rate and acceleration at
 * one end and rest at the other, so two motions joined with all three matched
 * meet without a step in acceleration. Read backwards in time, with
 * `duration - elapsed`, the term sets the acceleration a path arrives with;
 * an acceleration keeps its sign under that mirror, where a rate changes it.
 * The term rises to `PEAK` times the squared duration at two fifths of it and
 * returns without crossing zero.
 *
 * @param duration Seconds over which the acceleration is carried; positive.
 * @param elapsed Seconds since the cut; clamped into the duration.
 * @returns Seconds squared: the displacement per unit acceleration.
 * @throws {Error} When the duration is not positive and finite, or the elapsed time is not finite.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the polynomial and its six end conditions, how it completes the quintic with `carriedRate`, the backward reading and its sign, the peak, the units, the clamp and the thrown inputs.
 * @evidence contracts/development/implementation.md#principled-implementation The quintic Hermite basis function of a unit initial second derivative, fixed by zero value and slope at both ends, unit acceleration at the start and zero at the end; scaling by the squared duration maps the unit interval to seconds.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One closed-form polynomial in the normalized time; the caller multiplies by its own acceleration, so the term carries no state and no unit of the path.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The elapsed time is clamped into the duration because the basis is defined there and zero at both ends, so the clamp changes no value; a non-positive or non-finite duration is refused instead of answered with zero.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Six multiplications in constant time, with no algorithm to choose.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of two numbers that coordinates no work across calls.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing; the result is a local number.
 */
export function carriedAcceleration(duration: number, elapsed: number): number {
  if (
    !Number.isFinite(elapsed) ||
    !(duration > 0) ||
    !Number.isFinite(duration)
  )
    throw new Error(
      "A carried acceleration needs a finite elapsed time and a positive duration",
    );
  const u: number = Math.min(1, Math.max(0, elapsed / duration));
  const rest: number = 1 - u;
  return (duration * duration * u * u * rest * rest * rest) / 2;
}

/**
 * Companion constants of {@link carriedAcceleration}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names what the namespace holds; its one member states its value, its unit and where the term reaches it.
 * @evidence contracts/development/design.md#principled-representation The peak is the exact rational `54 / 3125`, the basis at its stationary point two fifths of the way, in squared durations, the unit the function returns per unit acceleration.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One constant, read by callers that bound how far a carried acceleration displaces a path; it lives beside the function whose polynomial fixes it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A plain number derived from the polynomial, with no cast, no optional member and no copy of a value owned elsewhere.
 */
export namespace carriedAcceleration {
  /** The term's largest value in squared durations, reached at two fifths of the duration: `54 / 3125`. */
  export const PEAK: number = 54 / 3125;
}
