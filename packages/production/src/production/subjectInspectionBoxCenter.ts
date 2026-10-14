import { IAutoMovieSubjectBox, IAutoMovieVector3 } from "@automovie/interface";

/**
 * Read the component-wise midpoint of one current box.
 *
 * @evidence contracts/common.md#principled-implementation Each axis averages its supplied minimum and maximum.
 * @evidence contracts/common.md#clear-and-simple-design Fit, grounding and pose construction share this midpoint owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Finite ordered bounds are a caller premise; no geometry measurement or invalid-box repair is performed.
 * @evidence contracts/common.md#meaningful-documentation Coordinates remain in the box's model/world metre frame.
 * @evidence contracts/performance.md#efficient-algorithms Three fixed scalar averages produce one vector.
 * @evidence contracts/performance.md#reuse-equivalent-work Shared arithmetic avoids differently associated centre calculations in the inspection pipeline.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns a fresh vector and no bounds reference is retained.
 */
export function subjectInspectionBoxCenter(
  bounds: IAutoMovieSubjectBox
): IAutoMovieVector3 { return ({
  x: (bounds.min.x + bounds.max.x) / 2,
  y: (bounds.min.y + bounds.max.y) / 2,
  z: (bounds.min.z + bounds.max.z) / 2,
}); }
