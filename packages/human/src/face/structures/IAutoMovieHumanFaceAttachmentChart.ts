import type { IAutoMovieHumanFaceAttachmentContinuation } from "./IAutoMovieHumanFaceAttachmentContinuation";

/**
 * A source-compiled material coordinate disk on the actual host triangles.
 * Dimensionless coordinates identify attachment locations, not distances or
 * anatomical measurements. The publisher owns disk topology and positive
 * orientation; runtime geometry reads the current host through exact IDs.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceAttachmentChart {
  /** Host source generation; the chart cannot migrate to another topology. */
  generation: string;

  /** Host surface whose current positions and normals supply geometry. */
  surface: string;

  /** Chart vertex to host-view vertex, with no coordinate-based welding. */
  vertices: number[];

  /** Exact canonical source sample for each chart vertex. */
  sourceVertices: number[];

  /** Actual oriented host triangles addressed in chart vertex order. */
  indices: number[];

  /** Host triangle ordinal for each consecutive chart triangle. */
  sourceTriangles: number[];

  /** Flat dimensionless u,v pairs; these carry no ocular or skin metric. */
  coordinates: number[];

  /** Explicit mathematical recipe, unrelated to texture painting coordinates. */
  method: "uniform-barycentric-convex-disk";

  /** Topological attachment registration supplies no clinical measurement. */
  qualification: "authoredConvention";

  /** Actual source support beyond coarse outer stations; distances are reread on the runtime exterior. */
  continuations?: IAutoMovieHumanFaceAttachmentContinuation[];
}
