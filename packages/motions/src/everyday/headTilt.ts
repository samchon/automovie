import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanHeadTilt,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanHead } from "../compose/AutoMovieMotionHumanHead";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanBound } from "../law/HumanBound";

/**
 * Plan one lateral roll with its peak at `stroke` and return from `relax`.
 *
 * @param context The authored roll, duration and posture underneath.
 * @returns The head-only plan and its timing events, with the base's support
 *   windows.
 * @throws {HumanRefusal} If `degrees` is outside [-20, 20] or `seconds` is
 *   nonfinite or below 0.6.
 * @evidence contracts/development/common.md#meaningful-documentation States the decisive instant, return onset, input, output and refusals.
 * @evidence contracts/development/implementation.md#principled-implementation Shares the requested roll over both cervical joints and uses the minimum-jerk clock envelope to add it smoothly to the base and release it.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Checks both authored quantities, builds one clock and composes one head primitive over the existing base.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Angles and seconds are checked with HumanBound. The law needs no target, transfers no supports and does not fit a pose to a fixture.
 * @evidence contracts/development/implementation.md#efficient-algorithms Plans a fixed number of events and adds two joint deltas per sample in addition to evaluating the base.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates the cervical split to the head primitive and the time profile to the shared clock.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan holds one base, one clock and one primitive for its lifetime and accumulates no samples.
 */
function planHeadTilt(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanHeadTilt>,
): IAutoMovieMotionHumanActionPlan {
  const degrees: number = HumanBound.within(
    "degrees",
    context.params.degrees,
    -20,
    20,
    "degrees",
  );
  const seconds: number = HumanBound.least(
    "seconds",
    context.params.duration ?? 0.9,
    0.6,
    "s",
  );
  const clock: IAutoMovieMotionClock = AutoMovieMotionClock.of(seconds, [
    { name: "ready", seconds: 0 },
    { name: "strokeStart", seconds: 0 },
    { name: "stroke", seconds: seconds / 3 },
    { name: "strokeEnd", seconds: (2 / 3) * seconds },
    { name: "relax", seconds: (2 / 3) * seconds },
  ]);
  return composeAutoMovieMotionHumanAction({
    base: AutoMovieMotionHumanBase.under(context, clock.duration),
    clock,
    primitives: [
      AutoMovieMotionHumanHead.tilt(
        clock,
        ["start", "stroke"],
        ["relax", "end"],
        degrees,
      ),
    ],
  });
}

/**
 * Tilt toward one shoulder, hold, then return over the entry posture or a
 * carrier that yields its head. Hadar, Steiner and Clifford Rose observed
 * single-direction movements during conversational listening. The 20 degree cap
 * and the default 0.9 second phrase divided into thirds are provisional. The
 * 0.6 second minimum leaves 0.2 seconds for the carrier's fade at each end.
 *
 * @see https://doi.org/10.1007/BF00986881
 */
export const headTilt: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanHeadTilt> =
  {
    name: "headTilt",
    overlay: true,
    interrupts: AutoMovieMotionHumanInterrupt.table({
      any: ["anytime", "smooth"],
    }),
    accepts: AutoMovieMotionHumanInterrupt.table({
      any: ["anytime", "smooth"],
    }),

    plan: planHeadTilt,
  };
