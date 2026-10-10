/**
 * A named point of a basis's skin, face or body: one vertex of one surface.
 *
 * Measurement rules and garments refer to skin points by name, never by
 * vertex number, because vertex numbers belong to one basis's topology: the
 * same index names a different place on another basis. Each basis states
 * where its own named points are. A rule naming a point the basis does not
 * declare refuses by that name.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanSkinLandmark {
  /** Index into the basis's surfaces. */
  surface: number;

  /** Index of the vertex in that surface. */
  vertex: number;
}
