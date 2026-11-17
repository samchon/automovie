import type {
  AutoMovieVector3Tuple,
  IAutoMovieRecoveryDirectedEdgeIncidence,
} from "../../index";

/**
 * Incidence and measured geometry of one admitted private feature-cut mesh.
 * Per-vertex/face arrays share the supplied mesh indexing; areas are square millimetres and normals are unit vectors in the registered frame. Maps and arrays are producer-owned mutable topology results.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Incidence and measured geometry of one admitted private feature-cut mesh. Per-vertex/face arrays share the supplied mesh indexing; areas are square millimetres and normals are unit vectors in the registered frame. Maps and arrays are producer-owned mutable topology results.
 * @evidence contracts/development/design.md#principled-representation Per-vertex/face arrays share the supplied mesh indexing; areas are square millimetres and normals are unit vectors in the registered frame. Maps and arrays are producer-owned mutable topology results.
 * @evidence contracts/development/design.md#minimal-and-owned-surface RecoveryFeatureChartCutsTopology produces this shared record for original, subdivided and fan-materialized meshes; subdivision and seam publication read the same owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The observer refuses invalid incidence rather than welding or repairing it. These source observations are not generated coefficient topology.
 */
export type IAutoMovieRecoveryObservedMeshTopology = {
  /** Undirected current-mesh edge key to its directed triangle incidences. */
  edges: Map<string, IAutoMovieRecoveryDirectedEdgeIncidence[]>;

  /** Per-vertex incident undirected edge identities in the current observation topology. */
  vertexEdges: string[][];

  /** Per-vertex triangle ordinals in this current observation mesh. */
  incident: number[][];

  /** Triangle ordinals grouped by edge-connected component of this mesh. */
  components: number[][];

  /** Triangle ordinal to connected-component ordinal in the admitted observation mesh. */
  faceComponent: Int32Array;

  /** Admitted boundary cycles in deterministic traversal order; each entry retains its own incidence rather than coordinate welding. */
  cycles: number[][];

  /** Current triangle areas in square millimetres, aligned with the triangle array. */
  areas: number[];

  /** Unit normals aligned with the current triangles, including subdivision; these remain observation evidence. */
  normals: Readonly<AutoMovieVector3Tuple>[];
};
