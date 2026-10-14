/**
 * Census of one constructed part: its size, extent and surface topology on
 * locally Float32-published mesh, with bounds reconstructed through ordinary
 * part TRS in model metres. A construction admission carries
 * one record per part so a consumer can check the part population and read
 * where each part lies without opening its geometry.
 *
 * @evidence contracts/common.md#principled-implementation Actual emitted vertices and triangles accompany model-frame bounds and the existing source-incidence or legacy-grid topology instrument's counts.
 * @evidence contracts/common.md#clear-and-simple-design Identity and material lead the size, extent, topology and optional volume/self-crossing observations in one part record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Topology observations do not accept anatomy; degenerate counts follow coordinate-grid collapse rather than claiming every zero-area triangle is detected.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish model-metre extents, edge-incidence modes, grid-collapsed triangles and optional cubic-metre volume.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Constructed-part census result is erased by TypeScript; its runtime consumer owns the actual geometry or measurement traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Constructed-part census result specifies caller data and performs no runtime recomputation or cache lookup.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Constructed-part census result acquires no runtime handle or retained cache; concrete array and map ownership belongs to its producing and consuming functions.
 *
 *
 * @author Samchon
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

  /** Triangles whose corners collapse to fewer than three coordinate-grid cells in the topology instrument. */
  degenerateTriangles: number;

  /** Signed enclosed volume in cubic metres by the divergence sum; meaningful for a closed part, where a negative or near-zero value against its bounds indicates inverted or folded regions. Omitted when the owner does not read it. */
  signedVolumeCubicMetres?: number;

  /** Triangles of the part crossed transversally by another triangle of the same part; omitted when the owner does not read it. */
  selfCrossings?: number;
}
