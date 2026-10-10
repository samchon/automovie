/**
 * One sparse anchored displacement row of a compiled facial closure endpoint.
 * The transition vertex moves by the coefficient-weighted sum of its contact
 * drivers' closure displacements, axis by axis, in the performed head frame.
 * The vertex is not itself a contact point, owns at most one row, and each
 * driver is a registered contact point appearing once with a positive weight.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceSourceClosureRow {
  /** Performed source vertex receiving the displacement, never a contact point. */
  readonly vertex: number;

  /** Unique [contact driver vertex, positive dimensionless weight] pairs. */
  readonly coefficients: readonly (readonly [number, number])[];
}
