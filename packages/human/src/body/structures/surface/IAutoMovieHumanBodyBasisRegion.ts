/**
 * One material region of the connected body, retaining its oriented triangle and corner-UV partition.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyBasisRegion {
  /** Source region identity. */
  id: string;

  /** Existing material identity. */
  material: string;

  /** Oriented triangle corners in the shared source vertex order. */
  indices: number[];

  /** UV pairs per corner, or null for untextured geometry. */
  uvs: number[] | null;
}
