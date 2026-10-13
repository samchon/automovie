import type { IAutoMovieHumanBodyBoneWorldRest } from "./IAutoMovieHumanBodyBoneWorldRest";

/**
 * One bone's rest and posed world placement, in the basis frame.
 *
 * Skinning applies `posed ∘ rest⁻¹` to the vertices the bone weights.
 *
 * @evidence contracts/common.md#principled-implementation Rest and posed world placements define the rigid skinning map posed composed with inverse rest.
 * @evidence contracts/common.md#clear-and-simple-design The paired record keeps the two frames required for one bone's deformation together.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The pair carries evaluated rig frames without manufacturing independent internal bone geometry.
 * @evidence contracts/common.md#meaningful-documentation The comment states basis-frame ownership and the exact transform composition used for skinning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The paired bone placement contract declares data and signatures without implementing runtime algorithms.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The paired bone placement contract declaration shares no computations across consumers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The paired bone placement contract type has no runtime acquisition, retention or release operation.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyBoneTransform {
  /** World placement at the shaped rest. */
  rest: IAutoMovieHumanBodyBoneWorldRest;

  /** World placement after the document's pose. */
  posed: IAutoMovieHumanBodyBoneWorldRest;
}
