import type { IAutoMovieJointPose } from "@automovie/interface";

import type { motionHumanLaw } from "./motionHumanLaw";

/**
 * Some of a film's displayed clinical joints of `a` at a second, as text,
 * for a complaint to say which joint moved or differs. Only a failing
 * expectation calls it, since it resolves a pose.
 *
 * @param film The film.
 * @param seconds The film second.
 * @param bones The bones listed, in the pose's own order.
 * @param format One joint's text.
 * @param separator What the joints' texts are joined with.
 * @returns The listed joints, joined.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the subject, the second, the listed bones, the formatting and that only failures call it.
 * @evidence contracts/development/implementation.md#principled-implementation Reads the performance's own displayed clinical pose at the second and formats the caller's chosen joints; it measures nothing.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pose, one filter, one map and one join.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reports the pose's joints unchanged; a missing joint is simply absent from the text.
 * @evidence contracts/development/implementation.md#efficient-algorithms One pose resolution plus a scan of its J joints against the B listed bones, O(J·B).
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A failure's description is built once; there is no repeated work to share.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a string and retains nothing.
 */
export function motionHumanJointText(
  film: motionHumanLaw.IFilm,
  seconds: number,
  bones: readonly string[],
  format: (joint: IAutoMovieJointPose) => string,
  separator: string,
): string {
  return film.performance
    .pose("a", seconds)
    .joints.filter((joint: IAutoMovieJointPose): boolean =>
      bones.includes(joint.bone),
    )
    .map(format)
    .join(separator);
}
