
export interface MeshAccount {
  id: string;
  parts: number;
  /** Vertex counts in the buffer before welding and after welding. */
  vertices: number;
  weldedVertices: number;
  triangles: number;
  degenerate: number;
  nonFinite: number;
  /** Welded open edges reported by the engine, including T-junctions. */
  boundaryEdges: number;
  nonManifoldEdges: number;
  /** Adjacent triangles traversing their shared edge in the same direction (engine validateMeshTopology). */
  windingErrors: number;
  /** Unpaired subedges after T-junction resolution, representing actual gaps. */
  openEdges: number;
  /** Subedges used at least three times after resolution. */
  resolvedNonManifold: number;
  /** Midpoints of the first 8 open or non-manifold subedges, for locating observations. */
  defectSamples: Array<{ kind: "open" | "non-manifold"; at: [number, number, number]; }>;
  /** Vertices lying on edges of other faces. */
  tJunctionVertices: number;
  components: number;
  watertight: boolean;
  volume: number;
  bounds: { min: [number, number, number]; max: [number, number, number]; };
  partsWithNormals: number;
  partsWithUvs: number;
}
