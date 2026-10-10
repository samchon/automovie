/**
 * One material region in an exact partition of a face surface's triangles.
 *
 * The regions of a surface preserve its oriented triples, so connectivity and
 * normals stay owned by the surface across material and UV seams.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceBasisRegion {
  /** Region identity, unique within its surface. */
  id: string;

  /** ID of the resident material this region renders with. */
  material: string;

  /** Oriented triangle corners, each a vertex index of the surface. */
  indices: number[];

  /** Flat UV pairs per triangle corner, or null for untextured geometry. */
  uvs: number[] | null;
}
