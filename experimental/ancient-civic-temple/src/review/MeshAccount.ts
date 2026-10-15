
/** Topology account of the merged meshes of one model or composite. */
export interface MeshAccount {
  /** Model or composite identity. */
  id: string;
  /** Number of mesh parts merged. */
  parts: number;
  /** Vertex counts in the buffer before welding and after welding. */
  vertices: number;
  /** Vertex count after welding coincident positions. */
  weldedVertices: number;
  /** Triangle count. */
  triangles: number;
  /** Triangles with zero area. */
  degenerate: number;
  /** Vertices with a non-finite coordinate. */
  nonFinite: number;
  /** Welded open edges reported by the engine, including T-junctions. */
  boundaryEdges: number;
  /** Welded edges shared by more than two triangles, as the engine reports them. */
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
  /** Connected components of the welded mesh. */
  components: number;
  /** Whether the engine finds the welded mesh closed. */
  watertight: boolean;
  /** Signed enclosed volume in cubic metres. */
  volume: number;
  /** Axis-aligned bounds of the vertices. */
  bounds: { min: [number, number, number]; max: [number, number, number]; };
  /** Parts carrying vertex normals. */
  partsWithNormals: number;
  /** Parts carrying texture coordinates. */
  partsWithUvs: number;
}
