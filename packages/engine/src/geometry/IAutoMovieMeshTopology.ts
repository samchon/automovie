/**
 * What a mesh's triangle topology actually is, measured rather than assumed.
 */
export interface IAutoMovieMeshTopology {
  /** Triangle count, including degenerate ones. */
  triangles: number;
  /** Triangles whose welded corners are not three distinct points. */
  degenerate: number;
  /**
   * Zero-based triangle ordinals skipped by the same positional-weld rule.
   * A count cannot establish whether a later conversion lost a different face
   * while recovering an earlier redundant one; these identities preserve that
   * correspondence without reconstructing the weld calculation in a consumer.
   */
  degenerateTriangles: number[];
  /** Position, normal, or uv components that are not finite numbers. */
  nonFinite: number;
  /** Welded edges used by exactly one triangle: the open boundary. */
  boundaryEdges: number;
  /** Welded edges used by three or more triangles. */
  nonManifoldEdges: number;
  /** True when every welded edge is shared by exactly two triangles. */
  watertight: boolean;
  /** Divergence-theorem signed volume; exact for a closed polyhedron. */
  volume: number;
}
