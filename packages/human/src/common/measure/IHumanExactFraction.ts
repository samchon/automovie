/** Exact rational arithmetic over represented binary64 inputs.
 *
 *
 * @evidence contracts/common.md#principled-implementation A signed BigInt numerator and positive BigInt denominator retain exact represented binary64-derived arithmetic; create owns reduction and invalid-denominator refusal.
 * @evidence contracts/common.md#clear-and-simple-design A two-field record separates exact rational data from arithmetic operations and JSON transport.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No rounded Number coefficient or anatomical epsilon is encoded in this rational identity.
 * @evidence contracts/common.md#meaningful-documentation The declaration names exact rational use and both members distinguish signed numerator from positive denominator.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This rational type selects no GCD, multiplication or rounding algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No cache or identity-based sharing is defined by the mutable fraction record shape.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Concrete BigInt magnitudes are held by callers and the interface acquires no buffers, handles or tasks.
 *
 * @author Samchon
 */
export interface IHumanExactFraction {
  /** Signed numerator. */
  numerator: bigint;

  /** Positive denominator. */
  denominator: bigint;
}
