/**
 * One oriented triangle edge in an observed feature-cut mesh.
 * a and b are ordered vertex indices in the current observation mesh and face is its triangle ordinal; the topology observer admits their bounds. Subdivision changes this indexing, while separate source-face provenance preserves original ownership.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes current mesh vertex/triangle indices from original source-face provenance after subdivision.
 * @evidence contracts/development/design.md#principled-representation Ordered endpoints retain edge direction; face addresses the same current mesh, with integer and range admission owned by RecoveryFeatureChartCutsTopology.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Feature-cut topology, subdivision and seams exchange this one incidence record through their undirected edge registry.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The record preserves face occurrence and direction even when another edge has identical positions; it is not a Cartesian vector.
 */
export type IAutoMovieRecoveryDirectedEdgeIncidence = {
  /** First endpoint index in the current observation mesh's vertex array. */
  a: number;

  /** Second endpoint index in that same vertex array. */
  b: number;

  /** Triangle ordinal in the current observation mesh, before or after subdivision. */
  face: number;
};
