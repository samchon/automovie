import { IAutoMovieSubjectBox } from "@automovie/interface";

import { DEFAULT_SUBJECT_HEIGHT } from "./constants/DEFAULT_SUBJECT_HEIGHT";
import { MIN_MEASURED_SUBJECT_HEIGHT } from "./constants/MIN_MEASURED_SUBJECT_HEIGHT";

/**
 * The model-space box a node subject is framed and graded from: its supplied portable rest extent when measured, otherwise the horizontally degenerate segment of its rig span or stand-in height. External asset bytes and renderer-only deformation are not measured by this rule.
 *
 * `extent` is the drawn box `computeModelRestExtent` measured, or null when the model measured nothing; `rigHeight` is the joint span standing in for it, or null when there is no rig either. Without an extent the result is a segment on the node's own vertical axis from `y = 0`, exactly zero wide, which `nodeSubjectBox` recognizes as unmeasured.
 *
 * A height below {@link MIN_MEASURED_SUBJECT_HEIGHT} is replaced by {@link DEFAULT_SUBJECT_HEIGHT}. A measured model keeps its own floor and its own width even then: a plaza slab 60 m across and 20 mm thick is a real horizontal extent even where its vertical one is unusable. The result is stated once because `performShot` measures a node for the framing solve and `realizeShotContract` measures it again for the grade.
 *
 * @param extent Measured model-space box in metres, or null.
 * @param rigHeight Rig joint span in metres, or null.
 * @returns The model-space box to frame and grade, in metres.
 *
 * @evidence contracts/common.md#principled-implementation Prefers computeModelRestExtent's portable part/proxy bound, then rig span, then stand-in height; a shared floor replaces unusable measured heights. The ordered-box and finite-arithmetic premises belong to the supplied measurements, and nodeSubjectBox recognizes the zero-width encoding exactly. This representation establishes no bound for unmeasured external bytes or renderer deformation.
 * @evidence contracts/common.md#clear-and-simple-design One rule for what a node fills, shared by the framing solve and the contract grade, so a shot is never graded against a subject nobody framed.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The height floor and stand-in are named constants applied to every node alike; a measured width is never discarded because the height was replaced.
 * @evidence contracts/common.md#meaningful-documentation States what each argument is and what null means, the precedence, the zero-width encoding and who reads it, the height floor and its substitute, that a measured floor and width survive, and both consumers.
 * @evidence contracts/performance.md#efficient-algorithms Constant time: one subtraction, one comparison and one box literal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function of its two arguments; `performShot` memoizes the measured extent it passes in, which is the expensive part.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the result references the caller's `extent.min` and the caller owns it.
 */
export function nodeSubjectExtent (
  extent: IAutoMovieSubjectBox | null,
  rigHeight: number | null,
): IAutoMovieSubjectBox {
  const measured: number =
    extent === null ? (rigHeight ?? 0) : extent.max.y - extent.min.y;
  const height: number =
    measured >= MIN_MEASURED_SUBJECT_HEIGHT ? measured : DEFAULT_SUBJECT_HEIGHT;
  if (extent === null)
    return {
      min: { x: 0, y: 0, z: 0 },
      max: { x: 0, y: height, z: 0 },
    };
  return {
    min: extent.min,
    max: { x: extent.max.x, y: extent.min.y + height, z: extent.max.z },
  };
}
