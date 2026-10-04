/**
 * Where the chosen neutral source axis meets the native eye surface.
 *
 * The hit is the source-axis/native-triangle intersection, not a
 * maximum-projection vertex, a measured corneal apex or a lid margin. Its
 * barycentric weights are `(1 - u - v, u, v)` over the triangle's corners.
 *
 * @evidence contracts/common.md#principled-implementation Records the actual intersection by native corners and barycentric weights so it survives coordinate edits.
 * @evidence contracts/common.md#clear-and-simple-design Three named fields replace an anonymous property type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No vertex extremum or clinical landmark substitutes for the intersection.
 * @evidence contracts/common.md#meaningful-documentation States the construction, the weight convention and what the point is not.
 * @evidence contracts/modeling.md#spatial-conventions Corners are native vertex IDs and barycentric coordinates are dimensionless.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no channel.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The optical builder owns generated geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Defines no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The connected builder owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source A geometric convention, not a clinical measurement.
 * @evidenceExclude contracts/anatomy.md#permitted-range Introduces no bound.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Placement data, not a control.
 * @author Samchon
 */
export interface IAutoMovieHumanFaceOpticalSupportAnterior {
  /** Native vertex IDs of the hit triangle's corners. */
  triangle: [number, number, number];
  /** Barycentric weight of the second corner. */
  u: number;
  /** Barycentric weight of the third corner. */
  v: number;
}
