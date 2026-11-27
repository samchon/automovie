import type { IAutoMovieMotionHumanQuadraticProgram } from "@automovie/interface";

import { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanArmTrajectoryInvalid } from "./HumanArmTrajectoryInvalid";
import type { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryTerms as T } from "./HumanArmTrajectoryTerms";

/*
 * Build the elastic domain rows at one arm's inner waypoint.
 * Parameter c: The trajectory context.
 * Parameter a: The arm.
 * Parameter k: The waypoint.
 * Parameter v: The iterate's arm coordinates.
 * Parameter index: The convex model's mapping from arm, waypoint and free
 * coordinate to a variable.
 * Parameter weight: The exact penalty's weight, the one every other constraint row
 * of the subproblem carries.
 * Returns: The chart-disc row where active and the exact coordinate boxes, each
 * in the tolerance units of `HumanArmTrajectoryTerms.RANGE`, as the
 * evaluation reads them (`HumanArmTrajectoryRangeExcess`).
 */
export function HumanArmTrajectoryRanges(
  c: M.IContext,
  a: number,
  k: number,
  v: readonly number[],
  index: (a: number, k: number, f: number) => number,
  weight: number,
): IAutoMovieMotionHumanQuadraticProgram.IRow[] {
  const rows: IAutoMovieMotionHumanQuadraticProgram.IRow[] = [];
  const xy: number = Math.hypot(v[0]!, v[1]!);
  if (xy > 0.6 * G.SCALE)
    rows.push({
      key: `r|${a}|${k}`,
      index: [index(a, k, 0), index(a, k, 1)],
      coef: [(T.RANGE * v[0]!) / xy, (T.RANGE * v[1]!) / xy],
      l: -Infinity,
      u: T.RANGE * (HumanArmTrajectoryInvalid.swing(c, a) - xy),
      weight,
    });
  c.free[a]!.forEach((d: number, f: number): void => {
    const bound: [number, number] | null | undefined = c.bounds[a]![d];
    if (bound === null || bound === undefined) return;
    rows.push({
      key: `b|${a}|${k}|${d}`,
      index: [index(a, k, f)],
      coef: [T.RANGE],
      l: T.RANGE * (bound[0] - v[d]!),
      u: T.RANGE * (bound[1] - v[d]!),
      weight,
    });
  });
  return rows;
}
