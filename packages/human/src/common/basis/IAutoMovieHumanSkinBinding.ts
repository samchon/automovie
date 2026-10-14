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
 * @evidence contracts/common.md#principled-implementation Four nonnegative finite influence weights per vertex address a distinct joint-name table; repeated slot indices and valid zero padding remain allowed.
 * @evidence contracts/common.md#clear-and-simple-design The binding separates joint names from dense per-vertex indices and weights.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Numerical row validity does not establish internal bone correspondence or physiological clearance.
 * @evidence contracts/common.md#meaningful-documentation Members state slot width, padding identity and unit-sum weight semantics.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The four-influence skin binding has no runtime implementation that chooses an algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The four-influence skin binding schema implements no cache or request sharing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The four-influence skin binding declaration allocates no runtime state or handles.
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
