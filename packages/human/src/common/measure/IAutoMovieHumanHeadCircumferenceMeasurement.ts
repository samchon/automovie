/**
 * The tape circumference of the head on the plane through a named
 * glabella and the opisthocranion (`findHumanOpisthocranion`),
 * level from side to side, read on the
 * person's skin at rest (`readHumanHeadCircumference`). The tape is
 * the convex hull perimeter of the closed section loop, as a body girth
 * reads it. The tape is not lower in front than at the back and passes above
 * the ears, so the plane is held level where it would rise behind the
 * glabella and raised at the back to clear every corner of triangles touching
 * either named ear area. This selected triangle population can include
 * vertices outside the area's membership and is a source clearance convention.
 *
 * The observed range of the cited source sample is recorded for reporting,
 * not as a bound. A named point or area the head view does not declare
 * refuses the rule by name.
 *
 * @evidence contracts/common.md#principled-implementation The rule is data; its reader owns the instrument.
 * @evidence contracts/common.md#clear-and-simple-design A kind, two skin point names, two skin area names and the source sample range.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The range is a report, never a hidden clamp of the request; a missing name refuses.
 * @evidence contracts/common.md#meaningful-documentation States the instrument, the names it reads and the meaning of the recorded range.
 * @evidence contracts/modeling.md#spatial-conventions Metres of the person frame at rest.
 * @evidence contracts/anatomy.md#anatomical-source Carries the observed range of the population its definition cites.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The rule defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The rule defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The rule emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The rule builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The rule is not displayed; its reading carries the points a render marks.
 * @evidenceExclude contracts/anatomy.md#permitted-range The recorded range is a source population, not an admission bound.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The rule converts no input.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanHeadCircumferenceMeasurement {
  /** Tape circumference through glabella and opisthocranion. */
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
