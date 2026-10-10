/**
 * A part carried by some vertices of a basis surface, such as one brow on a
 * surface that holds both.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFacePeriocularComponent {
  /** ID of the basis surface that carries the part. */
  surface: string;

  /** Vertex indices of that surface owned by the part, ascending. */
  vertices: number[];
}
