import { Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanMounted,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanMountedStirrups } from "./HumanMountedStirrups";
import { respondHumanMounted } from "./respondHumanMounted";

/**
 * The bank seats of a mounted performance (#3946): down a bank the rider sits with the heels down and gives the reins forward while the trunk stays upright in space, and up a bank rides a light seat with the trunk forward over the withers, a hand on the mane where the figure names it. Both keep the trunk's inclination in space against the carrier's pitch and roll at every instant, whatever the carrier's attitude when the performance began, by the response `respondHumanMounted` gives with the start's level heading in place of its attitude.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States both seats, what each keeps and how the lean is read.
 * @evidence contracts/development/design.md#principled-representation A share per instant blended over the transfers, a level heading and a rein give in forearm lengths.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The response and the reins `HumanMounted` reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The pitch and roll are the carrier's own at each instant; the lean is the existing seat response's.
 */
export namespace HumanMountedBank {
  /** How far up the reins toward the bit the descent's hands give them, forearm lengths: the rein let forward as the horse stretches its neck down the bank (provisional; no source read gives it). */
  export const GIVE: number = 0.5;

  /** A mounted clock's phase: the current figure and how far its transfer has gone. */
  export type Phase = Pick<
    IAutoMovieMotionHumanMounted.IPhase,
    "index" | "share"
  >;

  /**
   * Whether a seat kind is a bank seat.
   *
   * @param seat The seat kind.
   * @returns True for the descent and the ascent.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which kinds.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation A membership test.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure read.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function bank(seat: IAutoMovieMotionHumanMounted.Seat): boolean {
    return seat === "descent" || seat === "ascent";
  }

  /**
   * The seat response with the bank seats' own: the author's share of the carrier's turn since the start, raised to the whole of its pitch and roll against the start's level heading over a transfer into a bank seat and lowered back over a transfer out of one.
   *
   * @param body The body.
   * @param posture The posture in the carrier contact's frame.
   * @param figures The figures.
   * @param phase The clock's phase.
   * @param start The carrier contact's rotation at the start.
   * @param now Its rotation now.
   * @param respond The author's share, 0 to 1.
   * @param grips Each holding hand's contact point, in the carrier frame now.
   * @param surge The carrier's surge, metres per second squared.
   * @returns The posture leant.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the blend and the reference attitude.
   * @evidence contracts/development/implementation.md#principled-implementation The reference rotation turns from the start's attitude to its level heading, and the share from the author's to 1, by the bank share; `respondHumanMounted` then cancels the carrier's turn from that reference, so a bank seat keeps the trunk's inclination in space at every instant.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One blend and one call.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A joint at its range stops there, as the response clamps it.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per sample.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure read per sample.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function respond(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    figures: readonly IAutoMovieMotionHumanMounted.IFigure[],
    phase: Phase,
    start: IAutoMovieQuaternion,
    now: IAutoMovieQuaternion,
    respond: number,
    grips: Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>>,
    surge: number,
  ): IAutoMovieMotionHumanPosture {
    const share: number = blend(
      figures,
      phase,
      (seat: IAutoMovieMotionHumanMounted.Seat): number => (bank(seat) ? 1 : 0),
    );
    const level: IAutoMovieQuaternion = resolveHumanPosture.heading({
      yaw: resolveHumanPosture.angles(start).yaw,
      pitch: 0,
      roll: 0,
    });
    return respondHumanMounted(
      body,
      posture,
      share === 0 ? start : Quaternion.slerp(start, level, share),
      now,
      respond + (1 - respond) * share,
      grips,
      surge,
    );
  }

  /**
   * How far up the reins toward the bit the hands take them, forearm lengths: an out-of-saddle seat's shortened reins (`HumanMountedStirrups.profile`) and the descent's given ones, each blended over the transfers.
   *
   * @param figures The figures.
   * @param phase The clock's phase.
   * @returns Forearm lengths.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two contributions.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation Two linear blends.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One sum.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure read.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function reins(
    figures: readonly IAutoMovieMotionHumanMounted.IFigure[],
    phase: Phase,
  ): number {
    return (
      HumanMountedStirrups.blend(
        figures,
        phase.index,
        phase.share,
        (p: HumanMountedStirrups.IProfile): number => p.reins,
      ) +
      blend(
        figures,
        phase,
        (seat: IAutoMovieMotionHumanMounted.Seat): number =>
          seat === "descent" ? GIVE : 0,
      )
    );
  }

  /** A per-seat quantity blended from the previous figure's to the current one's by the transfer's share, 0 before the first. */
  function blend(
    figures: readonly IAutoMovieMotionHumanMounted.IFigure[],
    phase: Phase,
    pick: (seat: IAutoMovieMotionHumanMounted.Seat) => number,
  ): number {
    const at = (i: number): number => (i < 0 ? 0 : pick(figures[i]!.seat));
    return (
      at(phase.index - 1) +
      (at(phase.index) - at(phase.index - 1)) * phase.share
    );
  }
}
