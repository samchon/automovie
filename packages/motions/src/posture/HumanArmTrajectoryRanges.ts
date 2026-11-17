import type { IAutoMovieMotionHumanQuadraticProgram } from "@automovie/interface";

import { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanArmTrajectoryInvalid } from "./HumanArmTrajectoryInvalid";
import type { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";

/**
 * The arm trajectory's hard joint-domain rows: its shoulder chart disc and
 * each coordinate's box. These have no penalty weight and are shared by every
 * convex subproblem independently of its collision and task-point rows.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names both hard domains and distinguishes their unpenalized rows.
 * @evidence contracts/development/design.md#principled-representation The chart disc is linearised at the iterate; coordinate boxes remain exact affine bounds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One row builder extracted from HumanArmTrajectoryConvex, with its variable-index mapping supplied by that owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Preserves the chart's existing active threshold and reads its radius from the same validity owner.
 */
export namespace HumanArmTrajectoryRanges {
  /**
   * Build the hard domain rows at one arm's inner waypoint.
   *
   * @param c The trajectory context.
   * @param a The arm.
   * @param k The waypoint.
   * @param v The iterate's arm coordinates.
   * @param index The convex model's mapping from arm, waypoint and free coordinate to a variable.
   * @returns The chart-disc row where active and the exact coordinate boxes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States inputs and the two returned domains.
   * @evidence contracts/development/implementation.md#principled-implementation The norm gradient linearises the shoulder disc and each box subtracts the current coordinate from its two bounds.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One optional disc row followed by one row per bounded free coordinate.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Moves the existing formulas unchanged; no task-dependent range or penalty is introduced.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the arm's free coordinates.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses HumanArmTrajectoryInvalid.swing for the chart radius and the convex owner's variable mapping.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns rows and retains no state.
   */
  export function of(
    c: M.IContext,
    a: number,
    k: number,
    v: readonly number[],
    index: (a: number, k: number, f: number) => number,
  ): IAutoMovieMotionHumanQuadraticProgram.IRow[] {
    const rows: IAutoMovieMotionHumanQuadraticProgram.IRow[] = [];
    const xy: number = Math.hypot(v[0]!, v[1]!);
    if (xy > 0.6 * G.SCALE)
      rows.push({
        key: `r|${a}|${k}`,
        index: [index(a, k, 0), index(a, k, 1)],
        coef: [v[0]! / xy, v[1]! / xy],
        l: -Infinity,
        u: HumanArmTrajectoryInvalid.swing(c, a) - xy,
      });
    c.free[a]!.forEach((d: number, f: number): void => {
      const bound: [number, number] | null | undefined = c.bounds[a]![d];
      if (bound === null || bound === undefined) return;
      rows.push({
        key: `b|${a}|${k}|${d}`,
        index: [index(a, k, f)],
        coef: [1],
        l: bound[0] - v[d]!,
        u: bound[1] - v[d]!,
      });
    });
    return rows;
  }
}
