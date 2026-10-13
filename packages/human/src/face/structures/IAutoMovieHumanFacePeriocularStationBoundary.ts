/**
 * The source-published native edge cycle through one coarse station row.
 * The cycle keeps every native knot; anchor offsets locate the unchanged
 * coarse columns within it. Host-view vertices and canonical source samples
 * remain separate addresses. The enclosing cage owns generation and surface.
 * A turning-border convention supplies no clinical boundary measurement.
 *
 * @evidence contracts/common.md#principled-implementation readHumanFacePeriocularStationBoundary checks canonical samples, actual native edges and unchanged coarse-anchor offsets before selecting one complete cycle winding and adjacent-anchor segments.
 * @evidence contracts/common.md#clear-and-simple-design One native cycle plus parallel source samples and anchor offsets retains every knot without a private path-search result.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nonresident identities, missing edges, ambiguous winding or nonadjacent anchors refuse; coordinate coincidence and a turning-border label do not reconstruct clinical tissue boundaries.
 * @evidence contracts/common.md#meaningful-documentation Cycle seam convention and separate host/sample/offset domains explain how unchanged station columns address a refined native course.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This registration performs no edge inventory or winding calculation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Persisted native knots are source data, not computed path caching.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The source owns cycle arrays; this record creates no current geometry or path-search state.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFacePeriocularStationBoundary {
  /** Host-view vertices of one native closed cycle, without a repeated seam. */
  vertices: number[];

  /** Actual host source-partition sample at each cycle vertex. */
  sourceSamples: number[];

  /** Cycle offset of every unchanged station column, in station column order. */
  anchorOffsets: number[];

  /** Source-authored turning-border correspondence, without a clinical claim. */
  qualification: "authoredConvention";
}
