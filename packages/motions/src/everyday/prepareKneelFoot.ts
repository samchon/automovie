import { minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
} from "@automovie/interface";

import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { HumanFoot } from "../posture/HumanFoot";
import { kneelKeys } from "./kneelKeys";

/**
 * Prepare one foot's course between fixed kneeling keys. A stationary toe
 * joint remains the pivot while pitch changes; a moving one follows the
 * foot's straight way between its two prepared rigid placements, raised by a
 * lift timed on the phase's linear share: the way and the turn run on the
 * minimum-jerk progress, whose speed vanishes at both ends as the square of
 * the time left, while the lift 4 c l (1 - l) vanishes only linearly in it,
 * so the sole leaves and meets the floor moving straight up and down, at no
 * horizontal speed, as a foot set down onto its toes does instead of
 * skating onto them.
 *
 * @param body The fixed body of this plan.
 * @param side The foot.
 * @param from Its entry key, immutable during the course.
 * @param to Its exit key, immutable during the course.
 * @param clearance The moving foot's vertical clearance in metres.
 * @returns The placement, bearing state and toe flexion in degrees at a progress share and the phase's linear share.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the fixed endpoints, stationary pivot, moving arc, metres and returned degree value.
 * @evidence contracts/development/implementation.md#principled-implementation Classifies the foot by `kneelKeys.still`, interpolates the toes linearly, pivots a staying foot rigidly about its toe joint and carries a moving one on its straight way and turn at the caller's eased progress, lifted on the phase's linear share so its sole meets the floor at zero horizontal speed.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Classifies once, then binds either the pivot or the arc; the result writer adds the bearing state and the toes.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The movement test is the one the plant windows use, so a foot bears exactly where its window says; no contact or range bound is relaxed.
 * @evidence contracts/development/implementation.md#efficient-algorithms Stationary phases prepare fixed heading/socket geometry once; moving phases prepare both actual pivots plus native fixed-endpoint vector/slerp prerequisites once. Each query retains its original current pitch or arc and fresh placement, without rebuilding those constants.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Body and the two authored keys remain fixed, so only progress and interpolated toe flexion vary; no posture fit or evaluated output is cached.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The closure retains two keys and, for a moving foot, two rigid placements until its owning kneel plan is released.
 */
export function prepareKneelFoot(
  body: IAutoMovieMotionHumanBody,
  side: "left" | "right",
  from: kneelKeys.IFoot,
  to: kneelKeys.IFoot,
  clearance: number,
): (share: number, linear: number) => {
  placement: IAutoMovieMotionHumanFoot.IPlacement;
  planted: boolean;
  toes: number;
} {
  const moves: boolean = !kneelKeys.still(from, to);
  const place: (share: number, linear: number) => IAutoMovieMotionHumanFoot.IPlacement = ((): ((
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
    const way: ReturnType<typeof AutoMovieMotionHumanLeg.prepareArc> = AutoMovieMotionHumanLeg.prepareArc(start, end, 0);
    return (share: number, linear: number): IAutoMovieMotionHumanFoot.IPlacement => {
      const placed: IAutoMovieMotionHumanFoot.IPlacement = way(share);
      const l: number = Math.min(1, Math.max(0, linear));
      return {
        ...placed,
        ankle: { ...placed.ankle, y: placed.ankle.y + 4 * clearance * l * (1 - l) },
      };
    };
  })();
  // A foot that lands heel up strikes its toes `STRIKE` into the phase and
  // bears on its toe pads from then on, while the knee comes down and the
  // ankle rolls over them; one that leaves heel up bears on its toe pads
  // until the knee has risen as long, then lifts.
  const strike: number = prepareKneelFoot.arrival(from, to);
  const lift: number = prepareKneelFoot.departure(from, to);
  return (
    share: number,
    linear: number,
  ): { placement: IAutoMovieMotionHumanFoot.IPlacement; planted: boolean; toes: number } => {
    const timed: boolean = strike < 1 || lift > 0;
    const l: number = timed
      ? Math.min(1, Math.max(0, (linear - lift) / (strike - lift)))
      : linear;
    const s: number = timed ? minimumJerk.share(l) : share;
    return {
      placement: place(s, l),
      planted: !moves || s <= 0 || s >= 1,
      toes: from.toes + (to.toes - from.toes) * s,
    };
  };
}

/**
 * Companion constants and readers of {@link prepareKneelFoot}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the strike share and when a foot strikes early or lifts late.
 * @evidence contracts/development/design.md#principled-representation Shares of a phase's linear time.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The shares the foot's course, its plant windows (`kneelContacts`) and its unloaded turn (`kneel`) read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Named and marked provisional.
 */
export namespace prepareKneelFoot {
  /** The share of a phase's linear time by which a foot landing heel up has struck its toes, the rest left for the knee to come down over them (provisional). */
  export const STRIKE: number = 0.8;

  /**
   * When a foot's course ends, as a share of its phase: `STRIKE` for a foot
   * that moves and lands heel up on its toes, the phase's end otherwise.
   *
   * @param from The foot's entry key.
   * @param to The foot's exit key.
   * @returns The share.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two cases.
   * @evidence contracts/development/implementation.md#principled-implementation A foot landing on its toes bears before the knee completes its descent.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One condition.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The movement test is `kneelKeys.still`, the one the windows use.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function arrival(from: kneelKeys.IFoot, to: kneelKeys.IFoot): number {
    return !kneelKeys.still(from, to) && to.pitch < 0 ? STRIKE : 1;
  }

  /**
   * When a foot's course starts, as a share of its phase: `1 - STRIKE` for a
   * foot that moves off a heel-up stance on its toes, the phase's start
   * otherwise.
   *
   * @param from The foot's entry key.
   * @param to The foot's exit key.
   * @returns The share.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two cases.
   * @evidence contracts/development/implementation.md#principled-implementation A foot on its toes bears until the knee has risen off it, the landing's mirror.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One condition.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The movement test is `kneelKeys.still`, the one the windows use.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function departure(from: kneelKeys.IFoot, to: kneelKeys.IFoot): number {
    return !kneelKeys.still(from, to) && from.pitch < 0 ? 1 - STRIKE : 0;
  }
}
