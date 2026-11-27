import { AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
} from "@automovie/interface";

import { AutoMovieMotionHumanLeg } from "../../compose/internal/AutoMovieMotionHumanLeg";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import { kneelKeys } from "./kneelKeys";

/*
 * Prepare one foot's course between fixed kneeling keys. A stationary toe joint
 * remains the pivot while pitch changes; a moving one follows the foot's
 * straight way between its two prepared rigid placements, raised by a lift
 * timed on the phase's linear share: the way and the turn run on the
 * minimum-jerk progress, whose speed vanishes at both ends as the square of the
 * time left, while the lift 4 c l (1 - l) vanishes only linearly in it, so the
 * sole leaves and meets the floor moving straight up and down, at no horizontal
 * speed, as a foot set down onto its toes does instead of skating onto them.
 * Parameter body: The fixed body of this plan.
 * Parameter side: The foot.
 * Parameter from: Its entry key, immutable during the course.
 * Parameter to: Its exit key, immutable during the course.
 * Parameter clearance: The moving foot's vertical clearance in metres.
 * Returns: The placement, bearing state and toe flexion in degrees at a
 * progress share and the phase's linear share.
 */
export function prepareKneelFoot(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  from: kneelKeys.IFoot,
  to: kneelKeys.IFoot,
  clearance: number,
): (share: number, linear: number) => IPrepareKneelFootResult {
  const moves: boolean = !kneelKeys.still(from, to);
  const place: (
    share: number,
    linear: number,
  ) => IAutoMovieMotionHumanFoot.IPlacement = ((): ((
    share: number,
    linear: number,
  ) => IAutoMovieMotionHumanFoot.IPlacement) => {
    if (!moves) {
      const pivot: ReturnType<typeof HumanFoot.preparePivot> =
        HumanFoot.preparePivot(body, side, "mtp", from.at, from.heading);
      return (share: number): IAutoMovieMotionHumanFoot.IPlacement =>
        pivot(from.pitch + (to.pitch - from.pitch) * share);
    }
    const start: IAutoMovieMotionHumanFoot.IPlacement = HumanFoot.pivot(
      body,
      side,
      "mtp",
      from.at,
      from.heading,
      from.pitch,
    );
    const end: IAutoMovieMotionHumanFoot.IPlacement = HumanFoot.pivot(
      body,
      side,
      "mtp",
      to.at,
      to.heading,
      to.pitch,
    );
    const way: ReturnType<typeof AutoMovieMotionHumanLeg.prepareArc> =
      AutoMovieMotionHumanLeg.prepareArc(start, end, 0);
    return (
      share: number,
      linear: number,
    ): IAutoMovieMotionHumanFoot.IPlacement => {
      const placed: IAutoMovieMotionHumanFoot.IPlacement = way(share);
      const l: number = Math.min(1, Math.max(0, linear));
      return {
        ...placed,
        ankle: {
          ...placed.ankle,
          y: placed.ankle.y + 4 * clearance * l * (1 - l),
        },
      };
    };
  })();
  // A foot that lands heel up strikes its toes `STRIKE` into the phase and
  // bears on its toe pads from then on, while the knee comes down and the
  // ankle rolls over them; one that leaves heel up bears on its toe pads
  // until the knee has risen as long, then lifts.
  const strike: number = prepareKneelFoot.arrival(from, to);
  const lift: number = prepareKneelFoot.departure(from, to);
  return (share: number, linear: number): IPrepareKneelFootResult2 => {
    const timed: boolean = strike < 1 || lift > 0;
    const l: number = timed
      ? Math.min(1, Math.max(0, (linear - lift) / (strike - lift)))
      : linear;
    const s: number = timed ? AutoMovieEngineMotionSampling.minimumJerkShare(l) : share;
    return {
      placement: place(s, l),
      planted: !moves || s <= 0 || s >= 1,
      toes: from.toes + (to.toes - from.toes) * s,
    };
  };
}

/*
 * Companion constants and readers of prepareKneelFoot: the share by
 * which a foot landing heel up has struck its toes, and when a foot's course
 * ends and starts within its phase.
 */
export namespace prepareKneelFoot {
  /*
   * The share of a phase's linear time by which a foot landing heel up has
   * struck its toes, the rest left for the knee to come down over them
   * (provisional).
   */
  export const STRIKE: number = 0.8;

  /*
   * When a foot's course ends, as a share of its phase: `STRIKE` for a foot
   * that moves and lands heel up on its toes, the phase's end otherwise.
   * Parameter from: The foot's entry key.
   * Parameter to: The foot's exit key.
   * Returns: The share.
   */
  export function arrival(from: kneelKeys.IFoot, to: kneelKeys.IFoot): number {
    return !kneelKeys.still(from, to) && to.pitch < 0 ? STRIKE : 1;
  }

  /*
   * When a foot's course starts, as a share of its phase: `1 - STRIKE` for a
   * foot that moves off a heel-up stance on its toes, the phase's start
   * otherwise.
   * Parameter from: The foot's entry key.
   * Parameter to: The foot's exit key.
   * Returns: The share.
   */
  export function departure(
    from: kneelKeys.IFoot,
    to: kneelKeys.IFoot,
  ): number {
    return !kneelKeys.still(from, to) && from.pitch < 0 ? 1 - STRIKE : 0;
  }
}

/*
 * The record of `IPrepareKneelFootResult2`'s site.
 */
type IPrepareKneelFootResult2 = {
  placement: IAutoMovieMotionHumanFoot.IPlacement;
  planted: boolean;
  toes: number;
};

/*
 * The record of `IPrepareKneelFootResult`'s site.
 */
type IPrepareKneelFootResult = {
  placement: IAutoMovieMotionHumanFoot.IPlacement;
  planted: boolean;
  toes: number;
};
