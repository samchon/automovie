/**
 * Census of one constructed part: its size, extent and surface topology on
 * the Float32 coordinates the model emits. A construction admission carries
 * one record per part so a consumer can check the part population and read
 * where each part lies without opening its geometry.
 */
export interface IAutoMovieHumanConstructionPartReading {
  /** Model part identity. */
  subject: string;

  /** Material the part references, or null for the renderer default. */
  material: string | null;

  /** Emitted vertices. */
  vertices: number;

  /** Emitted triangles. */
  triangles: number;

  /** Smallest coordinate on each axis, metres. */
  minimum: number[];

  /** Largest coordinate on each axis, metres. */
  maximum: number[];

  /** Edges used by one triangle under explicit source incidence, or legacy coordinate-grid welding when metadata is absent. */
  boundaryEdges: number;

  /** Edges used by more than two triangles under the same explicit-source or legacy-coordinate topology. */
  nonManifoldEdges: number;

  /** Triangles of zero area. */
  degenerateTriangles: number;

  /** Signed enclosed volume in cubic metres by the divergence sum; meaningful for a closed part, where a negative or near-zero value against its bounds indicates inverted or folded regions. Omitted when the owner does not read it. */
  signedVolumeCubicMetres?: number;

  /** Triangles of the part crossed transversally by another triangle of the same part; omitted when the owner does not read it. */
  selfCrossings?: number;
}
