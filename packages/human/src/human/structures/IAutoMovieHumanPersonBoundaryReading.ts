/**
 * What the two partitions' own fields asked of the shared neck boundary on one
 * evaluation, in metres.
 *
 * `faceFieldMetres` is the largest displacement the face document's channels
 * give a boundary sample from its neutral. `bodyFieldMetres` is the largest
 * displacement the body document gives a boundary sample beyond the rigid
 * carry of the face frame's anchor (the body's eye-joint midpoint): the body's own non-rigid change of the neck at the
 * cut. The one-skin evaluator sums both at the shared samples, so the
 * head-side ring next to the boundary takes the body value as a step and the
 * body-side ring takes the face value; these two numbers bound that step.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonBoundaryReading {
  /** Largest face-field displacement of a shared boundary sample, metres. */
  faceFieldMetres: number;

  /** Largest body-field displacement of a shared boundary sample beyond the head carry, metres. */
  bodyFieldMetres: number;
}
