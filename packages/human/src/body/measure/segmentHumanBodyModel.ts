import type { IAutoMovieModel } from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBuild } from "../structures/IAutoMovieHumanBodyBuild";
import { createHumanBodySegmenter } from "./createHumanBodySegmenter";

/**
 * Split one built body into dominant-bone contact segments on demand.
 *
 * `createHumanBodySegmenter` owns the skin-binding and UV-corner partition.
 * This direct entry compiles it for a single built model; a worker or pose
 * search that evaluates several documents against one immutable basis keeps
 * that compiled function and reuses the same topology. Either path copies
 * each build's own posed metre positions and normals into new mesh parts and
 * returns fresh source-vertex correspondence. Skin contact is still measured
 * separately and this partition does not model internal bone surfaces.
 *
 * @evidence contracts/common.md#principled-implementation It compiles the basis's partition for one built model and applies it, so the result equals the reusable path's and inherits its checks and the dominant-weight meaning of a part.
 * @evidence contracts/common.md#clear-and-simple-design A thin direct entry over the compiled segmenter for a caller with a single build; a worker or pose search keeps the compiled function instead.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No joint, region or contact is special-cased; the segmenter's mismatch refusals pass through.
 * @evidence contracts/common.md#meaningful-documentation States the compile-versus-reuse choice, the copied posed metres, the fresh correspondence and that skin contact and bone surfaces are not modeled here.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The parts and group come from the segmenter, which answers for them; this entry only invokes it.
 * @evidenceExclude contracts/modeling.md#parameter-channels It defines and consumes no morph channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits what the segmenter emits and chooses no population.
 * @evidence contracts/modeling.md#spatial-conventions Positions and normals are the build's posed metres copied by the segmenter; this entry converts nothing.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The segmenter owns the cut; this entry builds no boundary.
 * @evidenceExclude contracts/anatomy.md#anatomical-source It carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range It admits or bounds no anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It is not an input through which a caller shapes a body.
 */
export function segmentHumanBodyModel(
  basis: IAutoMovieHumanBodyBasis,
  built: IAutoMovieHumanBodyBuild,
): { model: IAutoMovieModel; sources: Map<string, number[]> } {
  return createHumanBodySegmenter(basis)(built);
}
