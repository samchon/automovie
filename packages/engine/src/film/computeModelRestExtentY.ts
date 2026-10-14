import { IAutoMovieModel, IAutoMovieVector3 } from "@automovie/interface";

import { computeModelRestExtent } from "./computeModelRestExtent";

/**
 * A model's rest-pose vertical extent in model space, in metres: the model-Y range of the supplied portable part geometry or registered collision proxy.
 *
 * This is the subject height the framing grammar needs, and the reason it is not {@link computeRestHeight}. A rig stops at the joints animation requires and the figure does not: the generated `stickman` has no foot bone and no head-top bone, so its joint span is 0.680 of the declared height, and a `full` shot solved from that number shows an actor from the shins up.
 *
 * Returns null when the model has no vertex to measure, leaving the caller's own fallback in charge rather than inventing a height, and throws when the model's skeleton is malformed, both as {@link computeModelRestExtent} does.
 *
 * @evidence contracts/common.md#principled-implementation Projects computeModelRestExtent's portable part/proxy box onto Y using the same part placement and tessellation as its width measurement; external appearance bytes and renderer-only deformation are not measured here.
 * @evidence contracts/common.md#clear-and-simple-design A named one-axis view for `formationMemberExtent` and the public height readers, which need only a height and would otherwise restate the projection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no model; null passes through unchanged instead of becoming a default height, which `formationMemberExtent` and the subject readers apply.
 * @evidence contracts/common.md#meaningful-documentation States the frame, unit and axis, why a joint span is the wrong height with the stickman ratio, and the null and throwing cases it inherits.
 * @evidence contracts/performance.md#efficient-algorithms Adds constant projection work to one computeModelRestExtent call over supplied part vertices and rig rest frames; no second vertex traversal is made for Y.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure projection of one model's measurement that coordinates nothing across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the three-axis box is dropped on return and the caller owns the two numbers.
 */
export function computeModelRestExtentY (
  model: IAutoMovieModel,
): { min: number; max: number } | null {
  const extent: { min: IAutoMovieVector3; max: IAutoMovieVector3 } | null =
    computeModelRestExtent(model);
  return extent === null ? null : { min: extent.min.y, max: extent.max.y };
}
