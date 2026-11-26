import type { IAutoMovieSweep } from "@automovie/interface";

import { interpolateAutoMovieSpline } from "./interpolateAutoMovieSpline";

/**
 * Compile a positive radius or scale profile spanning the sweep's whole spine.
 *
 * The C2 scalar spline permits signed overshoot, even when all knots are
 * positive. Radius and scale consumers require positive finite values, so a
 * queried undershoot or arithmetic overflow is refused without clamping the
 * curve or changing its interpolation.
 *
 * @param entries Positive finite values on increasing knots from u 0 to 1
 * @param what The owning guide or scale's diagnostic name
 * @returns The compiled profile, refusing a non-positive or non-finite query
 *   result
 * @throws Error for a profile that does not span the spine, invalid knot/value
 *   data or an invalid queried result
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
    if (knot.value <= 0)
      throw new Error(`${what} values must be positive and finite`);
  });
  const curve: (u: number) => number = interpolateAutoMovieSpline({
    knots: entries.map((knot: IAutoMovieSweep.IKnot): number => knot.at),
    values: entries.map((knot: IAutoMovieSweep.IKnot): number => knot.value),
  });
  return (u: number): number => {
    const value: number = curve(u);
    if (!(value > 0))
      throw new Error(`${what} is not positive and finite at u ${u}`);
    return value;
  };
}
