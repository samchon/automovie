/**
 * The fixed numbering that gathers shared surface vertices into one material
 * region's render vertices. A source/UV chart pair owns each resident, so UV
 * seams duplicate residents without duplicating the physical source answer.
 * Arrays are owned by the compiled correspondence and contain no pose values.
 *
 * @author Samchon
 */
export interface IHumanBasisRegionCorners {
  /** Shared surface vertex copied by each resident render vertex. */
  sources: number[];

  /** Region triangles in resident render-vertex index space. */
  indices: number[];

  /** Two UV components per resident vertex, or null for an untextured region. */
  uvs: number[] | null;
}
