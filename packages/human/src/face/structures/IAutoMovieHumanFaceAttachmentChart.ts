import type { IAutoMovieHumanFaceAttachmentContinuation } from "./IAutoMovieHumanFaceAttachmentContinuation";

/**
 * A source-compiled material coordinate disk on the actual host triangles.
 * Dimensionless coordinates identify attachment locations, not distances or
 * anatomical measurements. The publisher owns disk topology and positive
 * orientation; runtime geometry reads the current host through exact IDs.
 *
 * @evidence contracts/common.md#principled-implementation Same-generation source samples, exact oriented host incidence and a dimensionless convex-disk chart preserve material attachment correspondence. The actual chart reader checks identities and positive triangle area; the publisher owns disk embedding/nonoverlap.
 * @evidence contracts/common.md#clear-and-simple-design Separate source/view vertices, chart triangles and host ordinals keep topology correspondence explicit, with optional continued support owned by Continuation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Coordinates are neither ocular/skin distances nor paint UVs; no nearest-location fallback, renamed topology or anatomical measurement qualification is encoded.
 * @evidence contracts/common.md#meaningful-documentation Members state every index domain, generation, mathematical recipe and authored-convention limit, distinguishing current host geometry from material coordinates.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This schema performs no disk embedding, barycentric lookup or incidence validation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Chart identity supplies correspondence inputs, not a result cache; the runtime reader owns its copied lookup tables.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The basis publisher owns the arrays and their population; this type allocates no host buffer, task or handle.
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
