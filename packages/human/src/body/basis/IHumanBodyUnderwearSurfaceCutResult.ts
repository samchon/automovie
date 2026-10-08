/**
 * The indexed garment patch on its source skin, before closing and lift.
 *
 * The cut owns these new buffers. Every point has one interpolated normal,
 * and triangle corners address this output order. Shared source edge
 * crossings and exact-zero source corners use one output vertex. An empty
 * retained surface has three empty arrays. Final mesh and Float32 admission
 * remain with the consuming garment and exporter.
 *
 * @evidence contracts/common.md#principled-implementation Carries the clipping calculation's aligned point, normal and triangle buffers without another geometry reconstruction.
 * @evidence contracts/common.md#clear-and-simple-design One result supplies the existing closing and lift consumer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source corners and edge crossings retain the clipping owner's indices without a second weld or contour offset.
 * @evidence contracts/common.md#meaningful-documentation States buffer ownership, shared incidence, empty output and downstream admission.
 * @evidence contracts/modeling.md#spatial-conventions Points retain the source skin's metre frame and normals are dimensionless directions; indices address the new output buffers.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The garment producer owns the represented part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Contains no authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The clipping function determines the retained population.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The clipping function owns shared crossing construction.
 * @evidenceExclude contracts/modeling.md#rendered-observation The body and person consumers observe the garment.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Contains generated costume geometry, not an anatomical measurement.
 * @evidenceExclude contracts/anatomy.md#permitted-range This result bounds no anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Supplies generated output rather than personal sculpt input.
 * @author Samchon
 */
export interface IHumanBodyUnderwearSurfaceCutResult {
  /** Cut skin points, XYZ metres per output vertex, ready for the lift. */
  points: number[];

  /** Interpolated normal triples in the same output vertex order. */
  normals: number[];

  /** Retained triangles with the source winding, over the cut points. */
  indices: number[];
}
