import { IAutoMovieMeshPhysicalSource } from "./IAutoMovieMeshPhysicalSource";

/**
 * Physical source correspondence of a mesh, aligned with its render vertices.
 *
 * A numeric entry in `vertices` references `sources`; `null` retains current
 * position welding. The table survives composition, and indices into it have
 * no physical meaning. A producer owns incidence and must rebind newly
 * created vertices. This correspondence supplies topology, not
 * geometry-validity exemptions.
 *
 * @author Samchon
 */
export interface IAutoMovieMeshPhysicalVertices {
  /** Source points referenced by `vertices`. */
  sources: IAutoMovieMeshPhysicalSource[];

  /**
   * Per render vertex, an index into `sources` or `null` for position welding.
   */
  vertices: (number | null)[];
}
