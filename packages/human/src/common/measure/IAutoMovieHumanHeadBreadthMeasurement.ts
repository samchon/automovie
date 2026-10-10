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
