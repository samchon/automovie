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

/** Companion constants of {@link carriedAcceleration}. */
export namespace carriedAcceleration {
  /** The term's largest value in squared durations, reached at two fifths of the duration: `54 / 3125`. */
  export const PEAK: number = 54 / 3125;
}
