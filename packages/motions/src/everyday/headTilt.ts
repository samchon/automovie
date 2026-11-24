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
  const clock: IAutoMovieMotionClock = AutoMovieMotionClock(seconds, [
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
