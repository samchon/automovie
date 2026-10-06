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
 * @evidence contracts/common.md#principled-implementation Both head and body skinning consume the same four-slot addressing and normalized weight representation.
 * @evidence contracts/common.md#clear-and-simple-design One joint-name table and two flat arrays replace independently declared copies of the same binding.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Repeated influence indices and zero padding retain the actual skinning meaning rather than being repaired or discarded.
 * @evidence contracts/common.md#meaningful-documentation States table addressing, padding, repetition, normalization and the qualification boundary.
 * @evidence contracts/modeling.md#spatial-conventions Indices address the binding's own joint list and weights are dimensionless.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping A binding defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels A compiled binding adds no authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry A binding emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Numerical binding layout alone proves no shared-sample correspondence.
 * @evidenceExclude contracts/modeling.md#rendered-observation The table is observed through the assembled skinning consumer.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Rig weights are source data, not anatomical measurements.
 * @evidenceExclude contracts/anatomy.md#permitted-range Numerical weight admission establishes no biological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The table is shared offline source data, not a person's geometry input.
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
