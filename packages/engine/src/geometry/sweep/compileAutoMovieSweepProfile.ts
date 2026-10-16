import { IAutoMovieSweep } from "./IAutoMovieSweep";
import { interpolateAutoMovieSpline } from "./interpolateAutoMovieSpline";

/**
 * Compile a positive radius or scale profile spanning the sweep's whole spine.
 *
 * The C2 scalar spline permits signed overshoot, even when all knots are positive. Radius and scale consumers require positive finite values, so a queried undershoot or arithmetic overflow is refused without clamping the curve or changing its interpolation.
 *
 * @param entries Positive finite values on increasing knots from u 0 to 1
 * @param what The owning guide or scale's diagnostic name
 * @returns The compiled profile, refusing a non-positive or non-finite query result
 * @throws Error for a profile that does not span the spine, invalid knot/value data or an invalid queried result
 *
 * @evidence contracts/common.md#principled-implementation Separates scalar C2 interpolation from the positive radius/scale domain that consumes it; admission preserves the interpolant and refuses values outside that domain.
 * @evidence contracts/common.md#clear-and-simple-design One shared profile admission and query wrapper for sweep guides and scale.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses exact positivity and finiteness, with no clamp, fixture case or changed tension/tolerance.
 * @evidence contracts/common.md#meaningful-documentation States the scalar overshoot limitation, input span, diagnostic ownership and delayed query refusal.
 * @evidence contracts/performance.md#efficient-algorithms O(K) admission plus the K-knot spline compile; each query adds a constant domain check to the spline's O(log K) evaluation and allocates only when refusing an invalid result.
 * @evidence contracts/performance.md#reuse-equivalent-work One compiled immutable scalar spline serves every query of this profile; different owners or inputs compile independently.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned query retains its scalar spline and diagnostic string, released with the owning sweep; input station arrays are copied by the scalar compiler and are not retained by this wrapper.
 */
export function compileAutoMovieSweepProfile(
  entries: readonly IAutoMovieSweep.IKnot[],
  what: string,
): (u: number) => number {
  if (
    entries.length < 2 ||
    entries[0]!.at !== 0 ||
    entries[entries.length - 1]!.at !== 1
  )
    throw new Error(`${what} must span the spine from at 0 to at 1`);
  entries.forEach((knot: IAutoMovieSweep.IKnot): void => {
    if (!Number.isFinite(knot.value) || knot.value <= 0)
      throw new Error(`${what} values must be positive and finite`);
  });
  const curve: (u: number) => number = interpolateAutoMovieSpline({
    knots: entries.map((knot: IAutoMovieSweep.IKnot): number => knot.at),
    values: entries.map((knot: IAutoMovieSweep.IKnot): number => knot.value),
  });
  return (u: number): number => {
    const value: number = curve(u);
    if (!(value > 0) || !Number.isFinite(value))
      throw new Error(`${what} is not positive and finite at u ${u}`);
    return value;
  };
}
