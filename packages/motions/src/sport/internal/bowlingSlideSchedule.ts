import type {
  AutoMovieHumanSide,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBowlingSlide,
  IAutoMovieMotionHumanContactWindow,
} from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";

/*
 * The final slide's sides, cues and foot windows. The sliding (lead) foot is
 * the one opposite the delivery hand (Seiferheld et al. 2023, section 1 and
 * Figure 2). Both feet plant until `slideStarted`. The lead foot then bears
 * through the glide to `slideStopped` and plants to the end. The trailing toe
 * drags on the approach until the recovery step lifts it, `TERMINAL` of the way
 * from the stop to `recoveryPlant`, halfway from the stop to the end, and
 * plants there.
 * Parameter params: The glide's times, its distance and the delivery hand.
 * Parameter leg: The leg's length, thigh and shank, metres.
 * Returns: The schedule.
 * When the times are not ordered `0 < from < to <
 * duration`, or the glide is longer than four tenths of the leg, one
 * walking-length lower-body step.
 */
export function bowlingSlideSchedule(
  params: Pick<
    IAutoMovieMotionHumanBowlingSlide.IParams,
    "distance" | "duration" | "from" | "to" | "hand"
  >,
  leg: number,
): bowlingSlideSchedule.ISchedule {
  const { distance, duration: seconds, from, to } = params;
  if (!(from > 0 && to > from && seconds > to))
    throw new HumanRefusal({
      kind: "parameter",
      axis: "to",
      value: to,
      feasible: null,
      reason:
        "the final slide needs an ordered preparation, glide and recovery",
      fix: "give finite action-local times with 0 < from < to < seconds",
    });
  if (!(distance > 0 && distance <= 0.4 * leg))
    throw new HumanRefusal({
      kind: "reach",
      axis: "distance",
      value: distance,
      feasible: { kind: "range", minimum: 0, maximum: 0.4 * leg, unit: "m" },
      reason: "the final glide must fit one walking-length lower-body step",
      fix: "move the performer closer before the delivery or shorten the glide",
    });
  const lead: AutoMovieHumanSide = params.hand === "left" ? "right" : "left";
  const trail: AutoMovieHumanSide = lead === "left" ? "right" : "left";
  const settle: number = (to + seconds) / 2;
  const window = (
    side: AutoMovieHumanSide,
    kind: "plant" | "bear",
    begin: number,
    end: number,
  ): IAutoMovieMotionHumanContactWindow => ({
    part: `${side}Foot`,
    kind,
    from: begin / seconds,
    to: end / seconds,
    support: { kind: "ground" },
  });
  return {
    lead,
    trail,
    settle,
    events: [
      { name: "slideStarted", share: from / seconds },
      { name: "slideStopped", share: to / seconds },
      { name: "recoveryPlant", share: settle / seconds },
    ],
    contacts: [
      window(lead, "plant", 0, from),
      window(trail, "plant", 0, from),
      window(lead, "bear", from, to),
      window(
        trail,
        "bear",
        from,
        to + (settle - to) * bowlingSlideSchedule.TERMINAL,
      ),
      window(lead, "plant", to, seconds),
      window(trail, "plant", settle, seconds),
    ],
  };
}

/*
 * The slide's schedule.
 */
export namespace bowlingSlideSchedule {
  /*
   * The share of the recovery step in which the trailing foot only comes down:
   * terminal swing, the last third of a swing (Perry and Burnfield, Gait
   * Analysis, 2nd ed.).
   */
  export const TERMINAL: number = 1 / 3;

  /*
   * The slide's sides, recovery plant, cues and foot windows.
   */
  export interface ISchedule {
    /*
     * The sliding foot, opposite the delivery hand.
     */
    lead: AutoMovieHumanSide;

    /*
     * The trailing foot.
     */
    trail: AutoMovieHumanSide;

    /*
     * The recovery plant, action seconds.
     */
    settle: number;

    /*
     * The slide's cues.
     */
    events: IAutoMovieMotionEvent[];

    /*
     * Both feet's windows.
     */
    contacts: IAutoMovieMotionHumanContactWindow[];
  }
}
