/**
 * The straight distance between two named skin points of the head view,
 * read on the person's skin at rest
 * (`readHumanLandmarkDistance`), as a sliding caliper reads it.
 *
 * The observed range of the cited source sample is recorded for reporting,
 * not as a bound. A named point or area the head view does not declare
 * refuses the rule by name.
 *
 *
 * @evidence contracts/common.md#principled-implementation The kind selects straight rest-skin distance between two named landmarks; cited sample extrema are reporting context and missing names refuse in the reader.
 * @evidence contracts/common.md#clear-and-simple-design Source names configure the caliper rule while readHumanLandmarkDistance owns point lookup and Euclidean distance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Population sample bounds never substitute a person's reading or become hidden acceptance limits.
 * @evidence contracts/common.md#meaningful-documentation The prose states straight-distance semantics, rest state, missing-name refusal and reporting-only metre ranges; fields identify start/end landmark roles.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This distance-rule record performs no landmark lookup or norm calculation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Matching landmark strings alone do not cache or equate mutable head readings.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The few source strings/scalars remain caller-owned configuration, without buffers, tasks or handles.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanLandmarkDistanceMeasurement {
  /** Straight distance between two skin points. */
  kind: "landmark-distance";

  /** The head view's skin landmark the distance starts at. */
  from: string;

  /** The head view's skin landmark the distance ends at. */
  to: string;

  /** Smallest value the cited source sample observed, metres. */
  sampleMinimumMetres: number;

  /** Largest value the cited source sample observed, metres. */
  sampleMaximumMetres: number;
}
