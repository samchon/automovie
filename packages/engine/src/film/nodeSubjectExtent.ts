import { DEFAULT_SUBJECT_HEIGHT } from "./DEFAULT_SUBJECT_HEIGHT";
import { IAutoMovieSubjectBox } from "./IAutoMovieSubjectBox";

/**
 * The model-space box a node subject is framed and graded from: what its model
 * draws when the builder supplied one, and the horizontally degenerate segment
 * a rig span or the stand-in height describes when it did not.
 *
 * Stated once because a node is measured by the framing solve and again by the
 * contract check, and two answers to "what does he fill" is how a shot comes to
 * be graded against a subject nobody framed. `extent` is the drawn box
 * `computeModelRestExtent` measured, or null when the model measured nothing;
 * `rigHeight` is the joint span standing in for it, or null when there is no
 * rig either.
 *
 * A model too short to measure keeps the stand-in height and its own floor, and
 * keeps its measured width: a plaza slab 60 m across and 20 mm thick is a real
 * horizontal extent even where its vertical one is unusable.
 *
 * @evidence requirements/asset-authoring/representations-bounds-and-lod.md#asset-bounds-state-motion nodeSubjectExtent exposes state-dependent asset extent: The model-space box a node subject is framed and graded from, the drawn box when a model was compiled and the degenerate segment a rig span or the stand-in height describes when it was not.
 * @evidence specifications/asset-and-representation/bounds-proxies-and-lod.md#asset-spec-dynamic-bounds-invariants nodeSubjectExtent realizes dynamic-bounds invariants: The model-space box a node subject is framed and graded from: what its model draws when the builder supplied one, and the horizontally degenerate segment a rig span or the stand-in height describes when it did not. Stated once because a node is measured by the framing solve and again by the contract check, and two answers to what he fills is how a shot comes to be graded against a subject nobody framed. A model too short to measure keeps the stand-in height and its own floor, and keeps its measured width: a plaza slab 60 m across and 20 mm thick is a real horizontal extent even where its vertical one is unusable.
 */
export const nodeSubjectExtent = (
  extent: IAutoMovieSubjectBox | null,
  rigHeight: number | null,
): IAutoMovieSubjectBox => {
  const measured =
    extent === null ? (rigHeight ?? 0) : extent.max.y - extent.min.y;
  const height = measured >= 0.1 ? measured : DEFAULT_SUBJECT_HEIGHT;
  const floor = extent === null ? 0 : extent.min.y;
  return extent === null
    ? {
        min: { x: 0, y: floor, z: 0 },
        max: { x: 0, y: floor + height, z: 0 },
      }
    : {
        min: extent.min,
        max: { x: extent.max.x, y: floor + height, z: extent.max.z },
      };
};
