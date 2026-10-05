import type { IAutoMovieHumanBodyBoneWorldRest } from "./IAutoMovieHumanBodyBoneWorldRest";

/**
 * One bone's rest and posed world placement, in the basis frame.
 *
 * Skinning applies `posed ∘ rest⁻¹` to the vertices the bone weights.
 *
 * @evidence contracts/common.md#principled-implementation Both placements travel together so skinning reads one consistent pair.
 * @evidence contracts/common.md#clear-and-simple-design A named pair replacing the inline transform objects.
 * @evidenceExclude contracts/common.md#prohibited-implementation-shortcuts A carrier; it substitutes nothing.
 * @evidence contracts/common.md#meaningful-documentation States how skinning uses the pair.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The map key names the bone.
 * @evidenceExclude contracts/modeling.md#parameter-channels It defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no geometry.
 * @evidence contracts/modeling.md#spatial-conventions Metres and unit quaternions in the basis frame.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation It renders nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source It carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range It admits no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It is not an authoring input.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyBoneTransform {
  /** World placement at the shaped rest. */
  rest: IAutoMovieHumanBodyBoneWorldRest;

  /** World placement after the document's pose. */
  posed: IAutoMovieHumanBodyBoneWorldRest;
}
