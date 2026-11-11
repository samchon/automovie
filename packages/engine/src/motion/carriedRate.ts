/**
 * What a rate at a cut adds to a path that starts at rest, so the sum leaves
 * the cut at that rate.
 *
 * A path planned from rest (a minimum-jerk reach, say) joined to a motion
 * that was moving breaks the velocity at the join. Adding the entry rate
 * times this term mends it: the term is the quintic Hermite basis of a unit
 * initial velocity over `duration` seconds, `D (u - 6 u^3 + 8 u^4 - 3 u^5)`
 * with `u = elapsed / D`, the one quintic with zero value, unit slope and
 * zero acceleration at the start and zero value, slope and acceleration at
 * the end. The sum therefore keeps the entry's velocity without a step in
 * acceleration at the cut, and is the planned path again from `duration` on.
 * The term rises to `PEAK` times the duration at a third of it and returns
 * without crossing zero, so a rate `v` displaces the path by at most
 * `PEAK * duration * |v|`: a caller with only so much room shortens the
 * duration to fit it.
 *
 * {@link inertializeOffset} with a zero offset is the same idea with zero
 * jerk at the end instead of zero acceleration at the start; its lobe starts
 * with the acceleration `-8 v / duration`, which shows on a fast limb, so a
 * law that carries a rate into a path of its own uses this term.
 *
 * @param duration Seconds over which the rate is carried; positive.
 * @param elapsed Seconds since the cut; clamped into the duration.
 * @returns Seconds: the displacement per unit rate.
 * @throws {Error} When the duration is not positive and finite, or the elapsed time is not finite.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the break the term mends, the polynomial and its six end conditions, the peak and the room it bounds, how it differs from `inertializeOffset` and when to use which, the units, the clamp and the thrown inputs.
 * @evidence contracts/development/implementation.md#principled-implementation The quintic Hermite basis function of a unit initial first derivative, fixed by zero value and acceleration at both ends, unit slope at the start and zero at the end; scaling by the duration maps the unit interval to seconds.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One closed-form polynomial in the normalized time; the caller multiplies by its own entry rate, so the term carries no state and no unit of the path.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The elapsed time is clamped into the duration because the basis is defined there and zero at both ends, so the clamp changes no value; a non-positive or non-finite duration is refused instead of answered with zero.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Seven multiplications in constant time, with no algorithm to choose.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of two numbers that coordinates no work across calls.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing; the result is a local number.
 */
export function carriedRate(duration: number, elapsed: number): number {
  if (
    !Number.isFinite(elapsed) ||
    !(duration > 0) ||
    !Number.isFinite(duration)
  )
    throw new Error(
      "A carried rate needs a finite elapsed time and a positive duration",
    );
  const u: number = Math.min(1, Math.max(0, elapsed / duration));
  const u3: number = u * u * u;
  return duration * (u - 6 * u3 + 8 * u3 * u - 3 * u3 * u * u);
}

/**
 * Companion constants of {@link carriedRate}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names what the namespace holds; its one member states its value, its unit and where the term reaches it.
 * @evidence contracts/development/design.md#principled-representation The peak is the exact rational `16 / 81`, the basis at its stationary point a third of the way, in durations, the unit the function returns per unit rate.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One constant, read by callers that shorten a carry to fit the room they have; it lives beside the function whose polynomial fixes it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A plain number derived from the polynomial, with no cast, no optional member and no copy of a value owned elsewhere.
 */
export namespace carriedRate {
  /** The term's largest value in durations, reached at a third of the duration: `16 / 81`. */
  export const PEAK: number = 16 / 81;
}
