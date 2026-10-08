/**
 * One exact affine construction on a declared native material edge.
 * Vertex addresses identify the parent edge; the fraction remains separate
 * from the rounded chart coordinate used by diagnostic readers.
 *
 * @evidence contracts/common.md#principled-implementation Retains the original edge and affine parameter so exact overlay arithmetic preserves its incidence.
 * @evidence contracts/common.md#clear-and-simple-design Two native vertex IDs and one dimensionless fraction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No nearby coordinate supplies an endpoint alias.
 * @evidence contracts/common.md#meaningful-documentation Separates parent construction from its rounded material coordinate.
 * @evidence contracts/modeling.md#shared-boundaries The source overlay and skin seat read the same native edge point.
 * @evidence contracts/modeling.md#spatial-conventions Native vertex ordinals and a dimensionless affine fraction, not head metres.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Identifies a point on an existing boundary.
 * @evidenceExclude contracts/modeling.md#parameter-channels Adds no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The tissue consumer emits geometry.
 * @evidenceExclude contracts/modeling.md#rendered-observation The tissue consumer owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries incidence rather than a biological measurement.
 * @evidenceExclude contracts/anatomy.md#permitted-range Defines no physiological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no personal shaping input.
 */
export interface IHumanFacePeriocularMaterialEdgePoint {
  /** Actual native edge endpoints, in interpolation order. */
  vertices: [number, number];
  /** Affine fraction from the first endpoint toward the second, in [0,1]. */
  fraction: number;
}
