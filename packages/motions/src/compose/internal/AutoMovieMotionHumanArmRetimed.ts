import type { IAutoMovieMotionHumanArmPlanned } from "@automovie/interface";

import type { HumanArmTrajectory } from "../../posture/internal/HumanArmTrajectory";
import type { AutoMovieMotionHumanArmPlanned } from "./AutoMovieMotionHumanArmPlanned";

/**
 * An earlier plan's solution on a new span's seconds: each knot keeps its share
 * of its own phrase, the reach, the hold or the return, so a hold knot stays a
 * hold knot. A path keeps its shape under a change of its time's scale
 * (Hollerbach 1984, "Dynamic scaling of manipulator trajectories"), which is
 * what a replan over a longer span asks.
 *
 * @param earlier The earlier plan's solution and the span it was reached on.
 * @param span The new span.
 * @returns The solution's state on the new span's seconds; none where the knots
 *   would not stay in order, a phrase the new span has no time for.
 */
export function AutoMovieMotionHumanArmRetimed(
  earlier: AutoMovieMotionHumanArmPlanned.IWarm,
  span: IAutoMovieMotionHumanArmPlanned.ISpan,
): HumanArmTrajectory.IState | undefined {
  const from: IAutoMovieMotionHumanArmPlanned.ISpan = earlier.span;
  const carried = (
    t: number,
    a: number,
    b: number,
    p: number,
    q: number,
  ): number => (b > a ? p + ((t - a) / (b - a)) * (q - p) : p);
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
