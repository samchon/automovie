import type {
  AutoMovieMotionHumanActionName,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanRelease,
} from "@automovie/interface";

import { releasePlan } from "./releasePlan";

/*
 * Letting go: a hand opens on what it holds, and the held prop leaves it.
 *
 * The hand stays where the hold kept it on the trunk (its grip frame at the
 * entry, read in the chest's frame and carried with the chest the carrier
 * shows), and opens at `open`, the decisive instant, a brief pause
 * (`motionHumanTiming.PAUSES.brief`, provisional) after the entry.
 * Until then its grip window on the prop takes the hand over from the hold; at
 * `open` the prop is launched (`IHumanActionPlan.launches`) with the hand's
 * velocity there, the central difference of the carried grip point at the
 * engine's plan-time step (`AutoMovieEngineMotionTrajectory.integrateMotionTrajectoryStep()`), so a drop from a
 * still hand falls and one from a moving carrier carries its speed.
 *
 * A prop that rests on something the hand held back (an arrow on a drawn
 * string) is launched by `launch` instead: along its line from one of its
 * points to another, at the speed the launcher gives (a bow's `launchSpeed` at
 * the string's travel), plus the hand's velocity.
 *
 * It is performed over a carrier and claims only that hand's arm. A hand that
 * holds nothing is refused.
 */
export namespace release {
  /*
   * The action's name.
   */
  export const name: AutoMovieMotionHumanActionName = "release";

  /*
   * Cancel table: anything may follow once the hand has opened.
   */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    any: [
      {
        window: { start: "open", end: 1 },
        kind: "inertialize",
        entry: 0,
        blend: 0.15,
      },
    ],
  };

  /*
   * Performed over a carrier: it claims only the opening hand's arm.
   */
  export const overlay: boolean = true;

  /*
   * A release's timetable: the grip held a brief pause, then opened over
   * another.
   * Returns: The clock with `hold` and `open`.
   */
  export function timetable(): IAutoMovieMotionClock {
    return releasePlan.timetable();
  }
  /*
   * Plan a release.
   * Parameter context: The action's context.
   * Returns: The plan.
   * When the hand holds nothing and no prop is launched.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanRelease.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    return releasePlan(context, false);
  }
}
