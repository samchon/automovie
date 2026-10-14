/**
 * An exact binary value mantissa * 2^exponent.
 *
 * `humanBodyFlexionAxesCollinear` decomposes finite doubles into this form and multiplies them exactly, so cross-product components can be compared for equality without rounding. A zero or subnormal double keeps its exact value.
 *
 * @evidence contracts/common.md#principled-implementation Signed BigInt mantissa and binary exponent preserve finite IEEE-754 component values for exact determinant-product comparison, including zero and subnormals.
 * @evidence contracts/common.md#clear-and-simple-design A small internal dyadic carrier isolates exact binary arithmetic from the public floating direction representation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Exact supplied-double equality does not certify upstream trigonometric accuracy or anatomical axis validity.
 * @evidence contracts/common.md#meaningful-documentation Members give mantissa/exponent meaning and prose explains the exact cross-product use and subnormal preservation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Dyadic typing performs no bit decoding, BigInt multiplication or determinant evaluation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The exact-value carrier stores no memoized direction decomposition across comparisons.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A mantissa/exponent record owns no DataView buffer or long-lived arithmetic workspace.
 * @author Samchon
 */
export interface IHumanBodyDyadicValue {
  /** Signed integer mantissa. */
  mantissa: bigint;

  /** Power-of-two exponent applied to the mantissa. */
  exponent: number;
}
