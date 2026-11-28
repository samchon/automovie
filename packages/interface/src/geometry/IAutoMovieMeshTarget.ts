import type { IAutoMovieTessellation } from "./IAutoMovieTessellation";

/**
 * Mutable attribute buffers filled by flat-triangle procedural builders and
 * handed off with the returned mesh.
 *
 * Positions and indices use the tessellation layout. The flat triangle appender
 * repeats one face normal at all three vertices; a degenerate face whose cross
 * product is zero receives the zero vector. The builder transfers the populated
 * arrays without copying.
 */
export interface IAutoMovieMeshTarget extends IAutoMovieTessellation {
  /**
   * Packed metric UV pairs parallel to the target vertices. Each triangle
   * append adds three pairs in the supplied winding order.
   */
  uvs: number[];
}
