/**
 * A canthus registered as one fixed skin vertex, used only where no
 * extreme-type definition exists.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceCanthusVertex {
  /** Discriminant of the fixed-vertex definition. */
  kind: "vertex";

  /** Skin vertex index of the canthus, on the margins' surface. */
  vertex: number;
}
