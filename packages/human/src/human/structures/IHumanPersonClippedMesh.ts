import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * A posed material-region mesh gathered through one frozen person source cut,
 * with its render vertices' source correspondence. Attribute charts may split
 * one source into several residents, so the source list parallels positions
 * rather than the triangle corners. Both arrays belong to the result.
 *
 * @evidence contracts/common.md#principled-implementation Resident vertices retain the source corner stencil identity that clipping uses for all attributes.
 * @evidence contracts/common.md#clear-and-simple-design One mesh and its parallel source list form the clipping result.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Correspondence comes from the frozen cut, never a position search.
 * @evidence contracts/common.md#meaningful-documentation States chart splitting, parallel indexing, posed frame and ownership.
 * @evidence contracts/modeling.md#spatial-conventions Mesh positions retain the input posed metre frame and sources address the frozen cut.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping This result transports an existing region, not a new part.
 * @evidenceExclude contracts/modeling.md#parameter-channels This result defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The clipping owner determines the population.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The frozen source-cut owner determines the boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The assembled seam owns observation of this transported result.
 * @evidenceExclude contracts/anatomy.md#anatomical-source This result adds no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range This result admits no biological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority This result adds no authoring input.
 * @author Samchon
 */
export interface IHumanPersonClippedMesh {
  /** Owned static indexed mesh in the input's posed metre frame. */
  mesh: IAutoMovieMesh;

  /** Frozen cut source identity for each resident mesh vertex. */
  sources: number[];
}
