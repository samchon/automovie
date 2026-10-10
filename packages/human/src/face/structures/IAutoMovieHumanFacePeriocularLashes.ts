/**
 * One eye's lashes on a lash surface: the surface, its upper and lower lash
 * regions, and the vertices this eye owns.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFacePeriocularLashes {
  /** ID of the basis surface that carries the lashes. */
  surface: string;

  /** ID of the region of that surface drawing the upper lashes. */
  upperRegion: string;

  /** ID of the region of that surface drawing the lower lashes. */
  lowerRegion: string;

  /** Vertex indices of that surface owned by this eye, ascending. */
  vertices: number[];
}
