import { AutoMovieMotionBound, ROM_TOLERANCE } from "@automovie/engine";
import type { IAutoMovieMotionHumanArmGeometry } from "@automovie/interface";

import { HumanArmGeometry as G } from "./HumanArmGeometry";

/** Positions, velocities and accelerations at one end of a joint curve. */
type Jet = readonly (readonly number[])[];

/**
 * Bound a point's speed on the played joint quintic relative to its shoulder
 * parent. The levers bound its distance from the shoulder, elbow and wrist.
 * Bernstein derivative bounds enclose each joint's rate on the interval. The
 * chain bound sums each angular rate times its lever (Zhang et al. 2007,
 * https://doi.org/10.1145/1239451.1239466, section 6).
 *
 * @param setup The arm's fixed chart and clinical joint definitions.
 * @param levers Maximum point distances from the three driven joints, metres.
 * @returns A bound in metres per second or undefined where this chart proof
 *   does not support a coupled distal clamp or a crossing of the chart centre.
 */
export function prepareHumanArmCurveSpeed(
  setup: IAutoMovieMotionHumanArmGeometry.ISetup,
  levers: readonly [number, number, number],
): ((from: Jet, to: Jet, duration: number) => number | undefined) | undefined {
  if (
    [setup.constraint.lower, setup.constraint.hand].some((joint) =>
      [joint?.swingDeg, joint?.swingTwist, joint?.abductionFlexed].some(
        (limit) => (limit ?? null) !== null,
      ),
    )
  )
    return undefined;
  const radians: number = Math.PI / 180;
  const table: Float64Array = setup.joint.region.table;
  const radius: number = setup.joint.region.greatest * radians;
  const ray: number = (2 * Math.PI) / table.length;
  let steepest: number = 0;
  for (let i: number = 0; i < table.length; ++i)
    steepest = Math.max(
      steepest,
      (Math.abs(table[i]! - table[(i + 1) % table.length]!) * radians) / ray,
    );
  // For the swing vector r(azimuth) q, |q d(azimuth)| <= |dq|.
  const swingRate: number = (radius + steepest) / G.SCALE;
  return (from: Jet, to: Jet, duration: number): number | undefined => {
    const rate = (start: number, end: number): number =>
      AutoMovieMotionBound.quinticHermiteSpeed(
        from[0]!.slice(start, end),
        from[1]!.slice(start, end),
        from[2]!.slice(start, end),
        to[0]!.slice(start, end),
        to[1]!.slice(start, end),
        to[2]!.slice(start, end),
        duration,
      );
    const swing: number = rate(0, 2);
    const centre: number = Math.hypot(from[0]![0]!, from[0]![1]!);
    // The chart's numerical azimuth convention at its centre has no such bound.
    if (
      swing !== 0 &&
      !(
        ((centre - swing * duration) * radius) / G.SCALE >
        ROM_TOLERANCE * radians
      )
    )
      return undefined;
    return AutoMovieMotionBound.chainSpeed(
      0,
      [
        swingRate * swing + radians * rate(2, 3),
        Math.sqrt(3) * radians * rate(3, 6),
        Math.sqrt(3) * radians * rate(6, 9),
      ],
      levers,
    );
  };
}
