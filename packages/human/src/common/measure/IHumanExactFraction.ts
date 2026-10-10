/** Exact rational arithmetic over represented binary64 inputs.
 *
 * @author Samchon
 */
export interface IHumanExactFraction {
  /** Signed numerator. */
  numerator: bigint;

  /** Positive denominator. */
  denominator: bigint;
}
