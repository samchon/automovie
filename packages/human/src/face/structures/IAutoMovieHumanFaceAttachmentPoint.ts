/**
 * One material point on an actual host triangle, retained independently of
 * reference geometry. Coordinates are the triangle's ordered dimensionless
 * barycentric weights; the runtime reads its current corners.
 *
 * @evidence contracts/common.md#principled-implementation Ordered barycentric support names an actual triangle rather than a nearest free point.
 * @evidence contracts/common.md#clear-and-simple-design A triangle and three weights are the complete material attachment identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No coordinate weld or replacement vertex supplies correspondence.
 * @evidence contracts/common.md#meaningful-documentation States ordinal ownership and dimensionless weight meaning.
 * @evidence contracts/modeling.md#spatial-conventions Host triangle ordinals and barycentric weights are dimensionless.
 * @evidence contracts/modeling.md#shared-boundaries Current host corners supply the attachment position on every supported state.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Describes attachment metadata, not an anatomical part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Source metadata defines no personal shape control.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Describes existing triangle support without emitting geometry.
 * @evidenceExclude contracts/modeling.md#rendered-observation The attached tissue consumer owns rendered observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries no clinical measurement.
 * @evidenceExclude contracts/anatomy.md#permitted-range Barycentric support is a mathematical domain.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No attachment points enter a personal numerical document.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceAttachmentPoint {
  /** Triangle ordinal of the registered host index buffer. */
  triangle: number;

  /** Ordered weights for the host triangle's three original corners. */
  weights: number[];
}
