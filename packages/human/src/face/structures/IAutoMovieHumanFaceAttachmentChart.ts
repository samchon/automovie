import type { IAutoMovieHumanFaceAttachmentContinuation } from "./IAutoMovieHumanFaceAttachmentContinuation";

/**
 * A source-compiled material coordinate disk on the actual host triangles.
 * Dimensionless coordinates identify attachment locations, not distances or
 * anatomical measurements. The publisher owns disk topology and positive
 * orientation; runtime geometry reads the current host through exact IDs.
 *
 * @evidence contracts/common.md#principled-implementation Exact source samples and oriented incidence distinguish material attachment coordinates from painted corner UVs.
 * @evidence contracts/common.md#clear-and-simple-design One disk carries correspondence, topology and dimensionless coordinates without a second skin geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No coordinate welding or nearest-surface mapping supplies vertex identity.
 * @evidence contracts/common.md#meaningful-documentation States generation ownership and separates topological coordinates from physical distances.
 * @evidence contracts/modeling.md#shared-boundaries Each chart triangle names the actual host triangle, so its attachment follows the current host geometry.
 * @evidence contracts/modeling.md#spatial-conventions Coordinates are dimensionless; view and canonical source ordinals have explicit separate tables.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The chart is attachment metadata, not another anatomical part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Source preparation adds no public personal shape control.
 * @evidenceExclude contracts/modeling.md#emitted-geometry This type describes existing host incidence rather than deciding emitted geometry.
 * @evidenceExclude contracts/modeling.md#rendered-observation The tissue consumer owns observation of attached geometry.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Topological coordinates claim no measured anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#permitted-range The disk domain is mathematical, not physiological.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Metadata does not extend a person's numerical authoring contract.
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
