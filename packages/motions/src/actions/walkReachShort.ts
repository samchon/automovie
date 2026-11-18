import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieVector3,
} from "@automovie/interface";

import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * The lowering a stepping leg asks of the root (`walkReach.ground`): the drop
 * that lets it reach its ankle with the knee bent at least `KNEE`
 * (`resolveHumanPosture.short`), floored at the leg's whole length of slack.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the claim, its knee floor and its slack floor.
 * @evidence contracts/development/design.md#principled-representation A leg's claim on the root, in metres, apart from the ground solve that combines the claims.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The knee floor and two claim readers, read by `walkReach` and through it by the walk and the pick-up.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The reach is the body's own measured legs at the knee floor.
 */
export namespace walkReachShort {
  /**
   * The least knee flexion of a planted or reaching leg, degrees: held at 10
   * until the posture's lowering (`lowerHumanPosture`) limits the reach softly
   * (soft IK, Nicholas 2009), after which it is the posture's own
   * `resolveHumanPosture.KNEE` (5, Perry and Burnfield). Near a straight knee
   * the knee moves cot(flexion) times as far as the hip-to-ankle distance
   * changes, 11.4 at 5° against 5.7 at 10°, and a hard floor at 5° measured a
   * small woman's knee jumping 21 mm in a frame of a sideways stagger. The run
   * reads this floor too, through the walk's ground solve and descent claims
   * it shares (`walk.locomote`), not through a cadence of its own.
   */
  export const KNEE: number = 10;

  /**
   * The lowering a leg asks of the root to reach an ankle with the knee
   * `KNEE` bent (`resolveHumanPosture.short`).
   *
   * @param body The body.
   * @param hip The hip joint, world metres.
   * @param ankle The ankle, world metres.
   * @param step The hip's largest vertical step a frame, metres, for the soft reach (`resolveHumanPosture.short`); a hard reach when absent.
   * @returns Metres, negative by the leg's slack and no less than the leg's length under none (`slack`), which claims as little as any slack does.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the unit and both floors.
   * @evidence contracts/development/implementation.md#principled-implementation The shared lowering owner's cosine-law reach at `KNEE`, floored at the leg's length of slack.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One owner call and one floor.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No tuned bound; the outside-reach result is the owner's.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `resolveHumanPosture.short`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function short(
    body: IAutoMovieMotionHumanBody,
    hip: IAutoMovieVector3,
    ankle: IAutoMovieVector3,
    step?: number,
  ): number {
    return Math.max(-slack(body), resolveHumanPosture.short(body, hip, ankle, KNEE, step));
  }

  /**
   * Prepare the fixed body's knee-flexed reach for repeated lowering claims.
   *
   * @param body The body whose measured thigh/shank determine reach, fixed while the reader is used.
   * @param step The hip's largest vertical step a frame, metres, for the soft reach (`resolveHumanPosture.prepareShort`); a hard reach when absent.
   * @returns The metre claim for world-metre hip/ankle pairs, bounded below by the leg's length of slack (`short`).
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the fixed measured-body premise, world-metre varying points, signed claim and slack floor.
   * @evidence contracts/development/implementation.md#principled-implementation Uses the shared lowering owner's cosine-law reach at `KNEE`, its horizontal-distance comparison and Pythagorean vertical reach, floored at the leg's length of slack.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One reach preparation feeds a scalar claim reader, used both by ground's root trials and a walk's descent samples.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Applies `short`'s knee threshold, outside-reach result and slack floor to every point pair, with no tuned bound.
   * @evidence contracts/development/implementation.md#efficient-algorithms The fixed cosine and reach square root prepare once rather than in every root/descent probe; each point pair keeps its horizontal distance and remaining square root.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The ground solve or the take owns the body's measured lengths and the knee floor; another body requires a new reader, and no queried claim is shared.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One owner-local closure retains the scalar reach reader until its solve/take releases it; no hip, ankle, claim or history is retained.
   */
  export function prepare(
    body: IAutoMovieMotionHumanBody,
    step?: number,
  ): (hip: IAutoMovieVector3, ankle: IAutoMovieVector3) => number {
    const read: ReturnType<typeof resolveHumanPosture.prepareShort> = resolveHumanPosture.prepareShort(body, KNEE, step);
    const least: number = -slack(body);
    return (hip: IAutoMovieVector3, ankle: IAutoMovieVector3): number => Math.max(least, read(hip, ankle));
  }

  /** The most slack a claim counts, metres: the leg's whole length, thigh and shank, the most a hip can be lowered toward its ankle; any slack past it claims as little, the ground solve's smooth maximum with none reading it as none. */
  function slack(body: IAutoMovieMotionHumanBody): number {
    return body.measure.thigh + body.measure.shank;
  }
}
