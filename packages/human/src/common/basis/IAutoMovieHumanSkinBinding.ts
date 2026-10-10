import type { AutoMovieHumanoidBone } from "@automovie/interface";

/**
 * Four joint influences per shared skin vertex, for the body's dual
 * quaternion skinning. Both partition views use this same representation.
 *
 * Indices address the binding's own joint-name table. A table name occurs
 * once, while a vertex may repeat an index and may use zero-weight padding;
 * padding indices still address a declared joint. Weights are dimensionless,
 * nonnegative and sum to one within the source serialization allowance.
 * These numerical conditions establish no internal bone correspondence,
 * physiological motion capacity or absence of posed self-contact.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanSkinBinding {
  /** Distinct declared joint names in the order influence indices address. */
  joints: AutoMovieHumanoidBone[];

  /** Four valid joint indices per shared vertex, including padding slots. */
  boneIndices: number[];

  /** Four nonnegative finite weights per vertex, summing to one. */
  weights: number[];
}
