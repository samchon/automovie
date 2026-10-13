/**
 * One native edge neighbour and its construction-millimetre distance.
 *
 * @evidence contracts/common.md#principled-implementation A resident neighbouring vertex and nonnegative Euclidean edge length are the graph arc consumed by bounded-reach rim-distance relaxation.
 * @evidence contracts/common.md#clear-and-simple-design Adjacency carries only destination and cost; edge incidence and queue ownership stay with the surface-layer coordinator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The edge cost preserves actual construction length rather than a hop count, while this discrete graph still does not claim exact between-vertex geodesics.
 * @evidence contracts/common.md#meaningful-documentation Members identify refined resident vertex ordinals and millimetre Euclidean arc length.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The neighbour record executes no shortest-path relaxation or distance measurement.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Arc destination/cost implement no distance cache or queue deduplication policy.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type allocates no adjacency population or work queue; the surface-layer call owns actual graph storage.
 * @author Samchon
 */
export interface IPortraitSurfaceNeighbour {
  /** Adjacent vertex ordinal in the refined construction mesh. */
  vertex: number;

  /** Euclidean edge length to that vertex in construction millimetres. */
  length: number;
}
