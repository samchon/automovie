import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanFloatBeside,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";

/**
 * Admit a float beside a swimming horse and cue it: the rider slides off over a
 * positive transition shorter than the float, on a side the water leaves open
 * (sliding off downstream would put the rider under the horse); `slideOff` cues
 * the start and `afloat` the transition's end.
 *
 * @param params The float's seconds, transition, side and blocked sides.
 * @returns The float's cues.
 * @throws {HumanRefusal} When the transition is not positive and shorter than
 *   the float, or the side is blocked.
 */
export function humanFloatBesideAdmit(
  params: Pick<
    IAutoMovieMotionHumanFloatBeside,
    "duration" | "transition" | "side" | "blocked"
  >,
): IAutoMovieMotionEvent[] {
  const { duration: seconds, transition, side, blocked = [] } = params;
  if (!(transition > 0 && transition < seconds))
    throw new HumanRefusal({
      kind: "parameter",
      axis: "transition",
      value: transition,
      feasible: null,
      reason: "a float needs a positive slide-off shorter than the action",
      fix: "Give a transition shorter than the total seconds.",
    });
  if (blocked.includes(side))
    throw new HumanRefusal({
      kind: "parameter",
      axis: "side",
      value: side,
      feasible: null,
      reason: `the horse's ${side} side is blocked, and sliding off downstream puts the rider under the horse`,
      fix: "Clear the upstream side, or keep the rider seated through the swim.",
    });
  return [
    { name: "slideOff", share: 0 },
    { name: "afloat", share: transition / seconds },
  ];
}
