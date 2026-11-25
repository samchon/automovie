import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieVector3,
} from "@automovie/interface";

import { lowerHumanPosture } from "../posture/lowerHumanPosture";

/**
 * The lowering a stepping leg asks of the root (`walkReach.ground`): the drop
 * that lets it reach its ankle with the knee bent at least `KNEE`
 * (`lowerHumanPosture.short`), floored at the leg's whole length of slack.
 */
export namespace walkReachShort {
  /**
   * The least knee flexion of a planted or reaching leg, degrees: held at 10
   * until the posture's lowering (`lowerHumanPosture`) limits the reach softly
   * (soft IK, Nicholas 2009), after which it is the posture's own
   * `lowerHumanPosture.KNEE` (5, Perry and Burnfield). Near a straight knee the
   * knee moves cot(flexion) times as far as the hip-to-ankle distance changes,
   * 11.4 at 5° against 5.7 at 10°, and a hard floor at 5° measured a small
   * woman's knee jumping 21 mm in a frame of a sideways stagger. The run reads
   * this floor too, through the walk's ground solve and descent claims it
   * shares (`walk.locomote`), not through a cadence of its own.
   */
  export const KNEE: number = 10;

  /**
   * The lowering a leg asks of the root to reach an ankle with the knee `KNEE`
   * bent (`lowerHumanPosture.short`).
   *
   * @param body The body.
   * @param hip The hip joint, world metres.
   * @param ankle The ankle, world metres.
   * @param step The hip's largest vertical step a frame, metres, for the soft
   *   reach (`lowerHumanPosture.short`); a hard reach when absent.
   * @returns Metres, negative by the leg's slack and no less than the leg's
   *   length under none (`slack`), which claims as little as any slack does.
   */
  export function short(
    body: IAutoMovieMotionHumanBody,
    hip: IAutoMovieVector3,
    ankle: IAutoMovieVector3,
    step?: number,
  ): number {
    return Math.max(
      -slack(body),
      lowerHumanPosture.short(body, hip, ankle, KNEE, step),
    );
  }

  /**
   * Prepare the fixed body's knee-flexed reach for repeated lowering claims.
   *
   * @param body The body whose measured thigh/shank determine reach, fixed
   *   while the reader is used.
   * @param step The hip's largest vertical step a frame, metres, for the soft
   *   reach (`lowerHumanPosture.prepareShort`); a hard reach when absent.
   * @returns The metre claim for world-metre hip/ankle pairs, bounded below by
   *   the leg's length of slack (`short`).
   */
  export function prepare(
    body: IAutoMovieMotionHumanBody,
    step?: number,
  ): (hip: IAutoMovieVector3, ankle: IAutoMovieVector3) => number {
    const read: ReturnType<typeof lowerHumanPosture.prepareShort> =
      lowerHumanPosture.prepareShort(body, KNEE, step);
    const least: number = -slack(body);
    return (hip: IAutoMovieVector3, ankle: IAutoMovieVector3): number =>
      Math.max(least, read(hip, ankle));
  }

  /**
   * The most slack a claim counts, metres: the leg's whole length, thigh and
   * shank, the most a hip can be lowered toward its ankle; any slack past it
   * claims as little, the ground solve's smooth maximum with none reading it as
   * none.
   */
  function slack(body: IAutoMovieMotionHumanBody): number {
    return body.measure.thigh + body.measure.shank;
  }
}
