import type { IAutoMovieHumanBodyBoneWorldRest } from "./IAutoMovieHumanBodyBoneWorldRest";

/**
 * One bone's rest and posed world placement, in the basis frame.
 *
 * Skinning applies `posed ∘ rest⁻¹` to the vertices the bone weights.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyBoneTransform {
  /** World placement at the shaped rest. */
  rest: IAutoMovieHumanBodyBoneWorldRest;

  /** World placement after the document's pose. */
  posed: IAutoMovieHumanBodyBoneWorldRest;
}
