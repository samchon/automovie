/**
 * An exact binary value mantissa * 2^exponent.
 *
 * `humanBodyFlexionAxesCollinear` decomposes finite doubles into this form and
 * multiplies them exactly, so cross-product components can be compared for
 * equality without rounding. A zero or subnormal double keeps its exact value.
 *
 * @evidence contracts/common.md#principled-implementation Exact integer mantissas and exponents make the collinearity proof free of floating rounding.
 * @evidence contracts/common.md#clear-and-simple-design One named record replaces the helper's anonymous decomposition type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No tolerance replaces exact equality.
 * @evidence contracts/common.md#meaningful-documentation States the value formula and the subnormal behaviour.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping A number defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels A number is not a shaping channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry A number emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The value is dimensionless arithmetic.
 * @evidenceExclude contracts/modeling.md#shared-boundaries A number builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation Internal arithmetic is not displayed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source A number carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range A number bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Internal arithmetic is not an input.
 * @author Samchon
 */
export interface IHumanBodyDyadicValue {
  /** Signed integer mantissa. */
  mantissa: bigint;

  /** Power-of-two exponent applied to the mantissa. */
  exponent: number;
}
