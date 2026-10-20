import { IAutoMovieMeshPhysicalSource } from "./IAutoMovieMeshPhysicalSource";

/**
 * Physical source correspondence of a mesh, aligned with its render vertices.
 *
 * A numeric entry in `vertices` references `sources`; `null` retains current position welding. The table survives composition, and indices into it have no physical meaning. A producer owns incidence and must rebind newly created vertices. This correspondence supplies topology, not geometry-validity exemptions.
 *
 * @evidence contracts/common.md#principled-implementation One source-table reference or null aligns with each render vertex; equal source pairs share incidence while null entries use current-position grid welding, and the resolver rejects dangling references or declared aliases that occupy different cells.
 * @evidence contracts/common.md#clear-and-simple-design The source table stores physical identities once and the aligned reference array maps attribute-split vertices to them; table indices carry no meaning outside this indirection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An invalid explicit mapping is refused rather than silently downgraded to position welding; producers must rebind newly created vertices, and neither metadata nor repeated source rows excuse invalid geometry.
 * @evidence contracts/common.md#meaningful-documentation Defines reference alignment, null position welding, table-index meaning, composition survival and producer responsibility for newly generated incidence, distinct from geometry admission.
 */
export interface IAutoMovieMeshPhysicalVertices {
  /** Source points referenced by `vertices`. */
  sources: IAutoMovieMeshPhysicalSource[];

  /**
   * Per render vertex, an index into `sources` or `null` for position welding.
   */
  vertices: (number | null)[];
}
