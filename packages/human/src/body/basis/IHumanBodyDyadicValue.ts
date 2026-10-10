/**
 * An exact binary value mantissa * 2^exponent.
 *
 * `humanBodyFlexionAxesCollinear` decomposes finite doubles into this form and
 * multiplies them exactly, so cross-product components can be compared for
 * equality without rounding. A zero or subnormal double keeps its exact value.
 *
 * @author Samchon
 */
export interface IHumanBodyDyadicValue {
  /** Signed integer mantissa. */
  mantissa: bigint;

  /** Power-of-two exponent applied to the mantissa. */
  exponent: number;
}
