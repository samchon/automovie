/**
 * One original source vertex in a sample's affine preimage: its ID and its
 * dimensionless positive weight. A sample's weights sum to one.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSourceWeight {
  /** Original source vertex ID. */
  id: number;

  /** Dimensionless positive affine weight of that vertex. */
  weight: number;
}
