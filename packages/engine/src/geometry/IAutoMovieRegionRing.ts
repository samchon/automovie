/**
 * One closed ring's span inside a region's shared canonical point list.
 *
 * `canonicalRegion` lays the rings out contiguously in declaration order, outer
 * ring first at index zero and each hole after the previous ring, so the spans
 * tile the point list without gaps. Ear clipping bridges holes along these
 * spans, and region extrusion and loft walk them to emit side walls.
 *
 * @evidence contracts/common.md#principled-implementation A half-open span `[start, start + count)` over one flat array, filled by `canonicalRegion` as it appends each wound ring, so every point belongs to exactly one ring.
 * @evidence contracts/common.md#clear-and-simple-design Offsets into one shared list instead of nested arrays, so triangle indices, source indices and side walls all address the same point numbering without translation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Spans are derived from the rings as authored; no ring is merged, dropped or split to make spans line up.
 * @evidence contracts/common.md#meaningful-documentation States the producer, the layout order and contiguity, and which consumers walk the spans.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Two integers with no runtime body; the layout pass that fills them is linear in the point count inside `canonicalRegion`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Built once per canonical region and read by its consumers; nothing is shared across regions.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Two numbers, one record per ring, released with the region that owns them.
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
