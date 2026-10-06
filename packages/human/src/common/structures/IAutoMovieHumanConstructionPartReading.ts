/**
 * Census of one constructed part: its size, extent and surface topology on
 * the Float32 coordinates the model emits. A construction admission carries
 * one record per part so a consumer can check the part population and read
 * where each part lies without opening its geometry.
 *
 * @evidence contracts/common.md#principled-implementation Counts and bounds are read from the emitted buffers by the engine's topology instrument, not restated from a generator's intent.
 * @evidence contracts/common.md#clear-and-simple-design One record per model part with the instrument's own quantities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The census reports open or non-manifold surfaces as counted and decides nothing.
 * @evidence contracts/common.md#meaningful-documentation States coordinate precision, units and that an open boundary is a count, not a verdict.
 * @evidence contracts/modeling.md#spatial-conventions Bounds are metres in the owning model's frame.
 * @evidence contracts/modeling.md#emitted-geometry Reports the emitted vertex and triangle counts of each part as constructed.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Names existing part identities without defining one.
 * @evidenceExclude contracts/modeling.md#parameter-channels Carries no channel.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Counts boundary edges; the part owners construct the boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation A numerical census; the part owner owes the rendered observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source A geometric census supplies no biological value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Bounds nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Defines no authoring input.
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

  /** Edges used by exactly one triangle after coordinate welding. */
  boundaryEdges: number;

  /** Edges used by more than two triangles after coordinate welding. */
  nonManifoldEdges: number;

  /** Triangles of zero area. */
  degenerateTriangles: number;

  /** Signed enclosed volume in cubic metres by the divergence sum; meaningful for a closed part, where a negative or near-zero value against its bounds indicates inverted or folded regions. Omitted when the owner does not read it. */
  signedVolumeCubicMetres?: number;

  /** Triangles of the part crossed transversally by another triangle of the same part; omitted when the owner does not read it. */
  selfCrossings?: number;
}
