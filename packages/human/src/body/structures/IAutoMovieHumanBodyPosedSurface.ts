/**
 * One basis surface after skinning: flat XYZ positions and unit normals.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyPosedSurface {
  /** Posed positions, metres. */
  positions: number[];

  /** Posed unit normals. */
  normals: number[];
}
