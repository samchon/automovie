/**
 * One closed ring's span inside a region's shared canonical point list.
 *
 * `canonicalRegion` lays the rings out contiguously in declaration order, outer
 * ring first at index zero and each hole after the previous ring, so the spans
 * tile the point list without gaps. Ear clipping bridges holes along these
 * spans, and region extrusion and loft walk them to emit side walls.
 */
export interface IAutoMovieRegionRing {
  /**
   * First index the ring owns in {@link IAutoMovieRegionTriangulation.points};
   * zero for the outer ring.
   */
  start: number;

  /** How many points the ring owns, at least three. */
  count: number;
}
