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
