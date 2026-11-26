import { IAutoMovieSubjectBox } from "@automovie/interface";

import { DEFAULT_SUBJECT_HEIGHT } from "../constants/DEFAULT_SUBJECT_HEIGHT";
import { MIN_MEASURED_SUBJECT_HEIGHT } from "../constants/MIN_MEASURED_SUBJECT_HEIGHT";

/**
 * The model-space box a node subject is framed and graded from: its supplied
 * portable rest extent when measured, otherwise the horizontally degenerate
 * segment of its rig span or stand-in height. External asset bytes and
 * renderer-only deformation are not measured by this rule.
 *
 * `extent` is the drawn box `computeModelRestExtent` measured, or null when the
 * model measured nothing; `rigHeight` is the joint span standing in for it, or
 * null when there is no rig either. Without an extent the result is a segment
 * on the node's own vertical axis from `y = 0`, exactly zero wide, which
 * `nodeSubjectBox` recognizes as unmeasured.
 *
 * A height below {@link MIN_MEASURED_SUBJECT_HEIGHT} is replaced by
 * {@link DEFAULT_SUBJECT_HEIGHT}. A measured model keeps its own floor and its
 * own width even then: a plaza slab 60 m across and 20 mm thick is a real
 * horizontal extent even where its vertical one is unusable. The result is
 * stated once because `performShot` measures a node for the framing solve and
 * `realizeShotContract` measures it again for the grade.
 *
 * @param extent Measured model-space box in metres, or null.
 * @param rigHeight Rig joint span in metres, or null.
 * @returns The model-space box to frame and grade, in metres.
 */
export function nodeSubjectExtent(
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
