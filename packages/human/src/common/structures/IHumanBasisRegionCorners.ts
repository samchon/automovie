/**
 * The fixed numbering that gathers shared surface vertices into one material
 * region's render vertices. A source/UV chart pair owns each resident, so UV
 * seams duplicate residents without duplicating the physical source answer.
 * Arrays are owned by the compiled correspondence and contain no pose values.
 *
 *
 * @evidence contracts/common.md#principled-implementation Source/UV chart pairs assign render residents while preserving shared physical vertices across UV seams.
 * @evidence contracts/common.md#clear-and-simple-design Compiled sources, triangle indices and optional UVs are independent of any pose values used later to gather positions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Duplicating a UV resident does not invent another physical source identity or alter the connected surface's correspondence.
 * @evidence contracts/common.md#meaningful-documentation Members specify shared-source indices, resident triangle space and two UV components per resident or an untextured null.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Compiled material-region correspondence is erased by TypeScript; its runtime consumer owns the actual geometry or measurement traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Compiled material-region correspondence specifies caller data and performs no runtime recomputation or cache lookup.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Compiled material-region correspondence acquires no runtime handle or retained cache; concrete array and map ownership belongs to its producing and consuming functions.
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
