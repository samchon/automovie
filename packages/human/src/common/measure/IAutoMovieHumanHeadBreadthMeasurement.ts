/**
 * The transverse breadth of the head above the ears, read on the person's
 * skin at rest (`readHumanHeadBreadth`): the X extent of the head view
 * skin above each ear, with the ears themselves left out. Each side's
 * bound is the highest point of that side's named ear area, and the
 * triangles touching the area are not searched.
 *
 * The observed range of the cited source sample is recorded for reporting,
 * not as a bound. A named point or area the head view does not declare
 * refuses the rule by name.
 *
 *
 * @evidence contracts/common.md#principled-implementation The breadth kind selects X extent above each named ear top and excludes ear-touching triangles; sample extrema report cited observations rather than admitting a head against limits.
 * @evidence contracts/common.md#clear-and-simple-design Source ear names and sample context are rule data; readHumanHeadBreadth owns triangle/edge search and its result.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Sample bounds never replace this person's skin-derived breadth, and the interface fixes no expected ear identifiers or answer.
 * @evidence contracts/common.md#meaningful-documentation The prose gives rest skin, exclusion/height semantics, missing-name refusal and reporting-only metre ranges.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This breadth rule shape executes no triangle search; that cost stays with its dispatched reader.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No prior ear population or breadth reading is carried by this source-name configuration.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The rule owns no retained collection or async work; its strings and sample numbers remain ordinary caller data.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanHeadBreadthMeasurement {
  /** The X extent above the ears, ears excluded. */
  kind: "head-breadth";

  /** The head view's skin area of the right ear. */
  rightEar: string;

  /** The head view's skin area of the left ear. */
  leftEar: string;

  /** Smallest value the cited source sample observed, metres. */
  sampleMinimumMetres: number;

  /** Largest value the cited source sample observed, metres. */
  sampleMaximumMetres: number;
}
