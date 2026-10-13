/**
 * Source-projected ordered contour quantities, independent of clinical basal aperture acquisition. The registered source normal owns the reading plane.
 *
 * @evidence contracts/common.md#principled-implementation Ordered source-projected contour area, longest chord and perpendicular extent describe the final registered projection.
 * @evidence contracts/common.md#clear-and-simple-design The producer's source normal owns this plane rather than an inferred basal-camera acquisition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The output is not a clinical tissue-margin measurement or recovered nasal airway.
 * @evidence contracts/common.md#meaningful-documentation Area is square metres while both extents are metres.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Projection, crossing checks and pairwise longest-chord work execute in readHumanFaceNasalContour.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One projected boundary supplies all three quantities from the same native order.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only three scalars escape and projected point buffers remain local to the reader.
 *
 * @author Samchon
 */
export interface IHumanFaceNasalContourReading {
  /** Enclosed orthogonal projection area in square metres. */
  area: number;

  /** Longest projected chord in metres. */
  longAxis: number;

  /** Projected extent perpendicular to that longest chord, in metres. */
  shortAxis: number;
}
