/**
 * The tape circumference of the head on a plane through a named glabella,
 * level from side to side and as near the plane through the selected
 * opisthocranion (`findHumanOpisthocranion`) as ear clearance and front/back
 * orientation allow, read on the
 * person's skin at rest (`readHumanHeadCircumference`). The tape is
 * the convex hull perimeter of the closed section loop, as a body girth
 * reads it. The tape is not lower in front than at the back and passes above
 * the ears, so the plane is held level where it would rise behind the
 * glabella and raised at the back to clear every corner of triangles touching
 * either named ear area. These constraints can move the plane off the selected
 * opisthocranion. This selected triangle population can include
 * vertices outside the area's membership and is a source clearance convention.
 *
 * The observed range of the cited source sample is recorded for reporting,
 * not as a bound. A named point or area the head view does not declare
 * refuses the rule by name.
 *
 *
 * @evidence contracts/common.md#principled-implementation The glabella plane starts from the selected opisthocranion slope, stays level side-to-side and adjusts for orientation and all ear-touching corners; it need not pass opisthocranion after adjustment and does not certify clinical attachment boundaries.
 * @evidence contracts/common.md#clear-and-simple-design Landmark/ear names configure the protocol; the circumference reader selects the plane and measureHumanSection owns hull perimeter.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Sample ranges remain reporting-only, and selected-triangle clearance is explicit rather than hidden behind target circumferences or specimen exceptions.
 * @evidence contracts/common.md#meaningful-documentation The public prose gives plane orientation, corner population, tape semantics and missing-source refusal; members identify landmark and metre-sample roles.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This circumference configuration performs no section or hull algorithm; the selected reader owns their processing costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Matching rule strings alone do not establish unchanged head geometry, and no cached circumference is declared here.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The record acquires no resident mesh, native handle or task; callers own its few source names and sample scalars.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanHeadCircumferenceMeasurement {
  /** Tape circumference on the glabella plane constrained by the selected opisthocranion and ears. */
  kind: "head-circumference";

  /** The head view's skin landmark the plane passes through at the front. */
  glabella: string;

  /** The head view's skin landmark whose height bounds the opisthocranion search from below. */
  tragion: string;

  /** The head view's skin area of the right ear, which the plane clears. */
  rightEar: string;

  /** The head view's skin area of the left ear, which the plane clears. */
  leftEar: string;

  /** Smallest value the cited source sample observed, metres. */
  sampleMinimumMetres: number;

  /** Largest value the cited source sample observed, metres. */
  sampleMaximumMetres: number;
}
