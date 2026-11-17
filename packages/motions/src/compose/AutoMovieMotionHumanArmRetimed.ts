import type { IAutoMovieMotionHumanArmPlanned } from "@automovie/interface";

import type { HumanArmTrajectory } from "../posture/HumanArmTrajectory";
import type { AutoMovieMotionHumanArmPlanned } from "./AutoMovieMotionHumanArmPlanned";

/**
 * An earlier plan's solution on a new span's seconds: each knot keeps its
 * share of its own phrase, the reach, the hold or the return, so a hold
 * knot stays a hold knot. A path keeps its shape under a change of its
 * time's scale (Hollerbach 1984, "Dynamic scaling of manipulator
 * trajectories"), which is what a replan over a longer span asks.
 *
 * @param earlier The earlier plan's solution and the span it was reached on.
 * @param span The new span.
 * @returns The solution's state on the new span's seconds; none where the knots would not stay in order, a phrase the new span has no time for.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is carried, how each knot is placed and when nothing is returned.
 * @evidence contracts/development/implementation.md#principled-implementation A piecewise-linear change of the time axis per phrase, which leaves the path in the coordinates unchanged; the result is only a start, admitted anew by the solve that takes it.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One map of the knots' seconds and one order check.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The coordinates and the penalty are handed on untouched; no knot is dropped or merged to force an order.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the knots.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its two records.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh record that borrows the earlier coordinates and retains nothing.
 */
export function AutoMovieMotionHumanArmRetimed(
  earlier: AutoMovieMotionHumanArmPlanned.IWarm,
  span: IAutoMovieMotionHumanArmPlanned.ISpan,
): HumanArmTrajectory.IState | undefined {
  const from: IAutoMovieMotionHumanArmPlanned.ISpan = earlier.span;
  const carried = (t: number, a: number, b: number, p: number, q: number): number =>
    b > a ? p + ((t - a) / (b - a)) * (q - p) : p;
  const times: number[] = earlier.state.times.map((t: number): number =>
    t <= from.ready
      ? carried(t, from.start, from.ready, span.start, span.ready)
      : t <= from.relax
        ? carried(t, from.ready, from.relax, span.ready, span.relax)
        : carried(t, from.relax, from.end, span.relax, span.end),
  );
  for (let k: number = 1; k < times.length; ++k)
    if (!(times[k]! > times[k - 1]!)) return undefined;
  return { times, x: earlier.state.x, penalty: earlier.state.penalty };
}
