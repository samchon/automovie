import { AutoMovieEngineQuaternion } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanMounted,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { seated } from "../../everyday/internal/seated";
import { humanPostureHeading } from "../../posture/internal/humanPostureHeading";
import { HumanMountedStirrups } from "./HumanMountedStirrups";
import { respondHumanMounted } from "./respondHumanMounted";

/*
 * The bank seats of a mounted performance: down a bank the rider sits with the
 * heels down and gives the reins forward while the trunk stays upright in
 * space, and up a bank rides a light seat with the trunk forward over the
 * withers, a hand on the mane where the figure names it. Both keep the trunk's
 * inclination in space against the carrier's pitch and roll at every instant,
 * whatever the carrier's attitude when the performance began, by the response
 * `respondHumanMounted` gives with the start's level heading in place of its
 * attitude.
 */
export namespace HumanMountedBank {
  /*
   * How far the descent's hands let the reins slip through the fingers, away
   * from the bit, forearm lengths: the rein given as the horse stretches its
   * neck down the bank, so the hands keep it without reaching (provisional; no
   * source read gives it).
   */
  export const GIVE: number = 0.5;

  /*
   * A mounted clock's phase: the current figure and how far its transfer has
   * gone.
   */
  export type Phase = Pick<IAutoMovieMotionHumanMounted.IPhase, Phase2>;

  /*
   * Whether a seat kind is a bank seat.
   * Parameter seat: The seat kind.
   * Returns: True for the descent and the ascent.
   */
  export function bank(seat: IAutoMovieMotionHumanMounted.Seat): boolean {
    return seat === "descent" || seat === "ascent";
  }

  /*
   * The trunk joints the descent sets upright: their flexion and lateral bend
   * zeroed, their twist kept.
   */
  export const TRUNK: readonly AutoMovieHumanoidBone[] = ["spine", "chest"];

  /*
   * A bank seat's key: the descent's sits with the pelvis and the trunk upright
   * in the carrier frame, whatever the entry leant, the seat socket where the
   * entry had it, so the response then keeps the trunk upright in space; the
   * ascent's is its out-of-saddle seat as solved.
   * Parameter body: The body.
   * Parameter seat: The bank seat.
   * Parameter key: The seat's posture as solved from the entry or the stirrups.
   * Returns: The key.
   */
  export function key(
    body: IAutoMovieMotionHumanBody,
    seat: IAutoMovieMotionHumanMounted.Seat,
    key: IAutoMovieMotionHumanPosture,
  ): IAutoMovieMotionHumanPosture {
    if (seat !== "descent") return key;
    const attitude: Pick<IAutoMovieMotionHumanPosture, KeyAttitude> = {
      yaw: key.yaw,
      pitch: 0,
      roll: 0,
    };
    const joints: IAutoMovieMotionHumanPosture["joints"] = { ...key.joints };
    for (const bone of TRUNK)
      joints[bone] = [0, 0, (joints[bone] ?? [0, 0, 0])[2]];
    return {
      ...key,
      ...attitude,
      root: seated.root(body, seated.socket(body, key), attitude),
      joints,
    };
  }

  /*
   * The seat response with the bank seats' own: the author's share of the
   * carrier's turn since the start, raised to the whole of its pitch and roll
   * against the start's level heading over a transfer into a bank seat and
   * lowered back over a transfer out of one; the forward lean that brings the
   * holding hands in reach fades by the same share, since a bank seat keeps the
   * trunk's inclination in space and the hands take the reins where they are.
   * Parameter body: The body.
   * Parameter posture: The posture in the carrier contact's frame.
   * Parameter figures: The figures.
   * Parameter phase: The clock's phase.
   * Parameter start: The carrier contact's rotation at the start.
   * Parameter now: Its rotation now.
   * Parameter respond: The author's share, 0 to 1.
   * Parameter grips: Each holding hand's contact point, in the carrier frame now.
   * Parameter surge: The carrier's surge, metres per second squared.
   * Returns: The posture leant.
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
    const level: IAutoMovieQuaternion = humanPostureHeading({
      yaw: humanPostureHeading.angles(start).yaw,
      pitch: 0,
      roll: 0,
    });
    return respondHumanMounted(
      body,
      posture,
      share === 0 ? start : AutoMovieEngineQuaternion.slerp(start, level, share),
      now,
      respond + (1 - respond) * share,
      grips,
      surge,
      1 - share,
    );
  }

  /*
   * How far up the reins toward the bit the hands take them, forearm lengths:
   * an out-of-saddle seat's shortened reins (`HumanMountedStirrups.profile`)
   * less the descent's slipped ones, each blended over the transfers.
   * Parameter figures: The figures.
   * Parameter phase: The clock's phase.
   * Returns: Forearm lengths.
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
          seat === "descent" ? -GIVE : 0,
      )
    );
  }

  /*
   * A per-seat quantity blended from the previous figure's to the current one's
   * by the transfer's share, 0 before the first.
   */
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

/*
 * The alternatives of `KeyAttitude`'s site.
 */
type KeyAttitude = "yaw" | "pitch" | "roll";

/*
 * The alternatives of `Phase2`'s site.
 */
type Phase2 = "index" | "share";
