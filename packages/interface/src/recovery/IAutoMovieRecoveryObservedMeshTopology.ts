import type {
  AutoMovieVector3Tuple,
  IAutoMovieRecoveryDirectedEdgeIncidence,
} from "..";

/**
 * Incidence and measured geometry of one admitted private feature-cut mesh.
 * Per-vertex/face arrays share the supplied mesh indexing; areas are square
 * millimetres and normals are unit vectors in the registered frame. Maps and
 * arrays are producer-owned mutable topology results.
 */
export type IAutoMovieRecoveryObservedMeshTopology = {
  /** Undirected current-mesh edge key to its directed triangle incidences. */
  edges: Map<string, IAutoMovieRecoveryDirectedEdgeIncidence[]>;

  /**
   * Per-vertex incident undirected edge identities in the current observation
   * topology.
   */
  vertexEdges: string[][];

  /** Per-vertex triangle ordinals in this current observation mesh. */
  incident: number[][];

  /** Triangle ordinals grouped by edge-connected component of this mesh. */
  components: number[][];

  /**
   * Triangle ordinal to connected-component ordinal in the admitted observation
   * mesh.
   */
  faceComponent: Int32Array;

  /**
   * Admitted boundary cycles in deterministic traversal order; each entry
   * retains its own incidence rather than coordinate welding.
   */
  cycles: number[][];

  /**
   * Current triangle areas in square millimetres, aligned with the triangle
   * array.
   */
  areas: number[];

  /**
   * Unit normals aligned with the current triangles, including subdivision;
   * these remain observation evidence.
   */
  normals: Readonly<AutoMovieVector3Tuple>[];
};
