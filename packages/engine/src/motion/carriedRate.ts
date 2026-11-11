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

/** Companion constants of {@link carriedRate}. */
export namespace carriedRate {
  /** The term's largest value in durations, reached at a third of the duration: `16 / 81`. */
  export const PEAK: number = 16 / 81;
}
