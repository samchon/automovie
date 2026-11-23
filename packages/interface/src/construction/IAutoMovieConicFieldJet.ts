/**
 * Data and callback contracts shared by the ConicFieldJet operations.
 *
 * @evidence contracts/development/design.md#principled-representation IJet fixes the six entries of a symmetric two-coordinate Hessian; IAlgebra preserves those coordinates across scalar operations and primal branch reads.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The interface owns the arithmetic boundary used by the engine's NUMBER and AD conic implementations.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The tuple enforces entry count but not finite values or geometric regularity; geometry owners admit divisors and source domains.
 * @evidence contracts/development/common.md#meaningful-documentation States derivative order, absence of factorial scaling and each operation's premises.
 */
export namespace IAutoMovieConicFieldJet {
  /**
   * Value and source partials [value,s,p,ss,sp,pp], in each supplied coordinate's units.
   *
   * @evidence contracts/development/design.md#principled-representation Stores the full symmetric Hessian of one scalar in two source coordinates, without factorial scaling.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Six fixed entries describe exactly the total-order-two source field.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No phase/native-clock derivatives or unavailable physical-pole jets are implied.
   * @evidence contracts/development/common.md#meaningful-documentation Gives entry order, derivative convention and caller-owned coordinate units.
   */
  export type IJet = readonly [number, number, number, number, number, number];

  /**
   * Operations needed by one shared conic preparation formula.
   *
   * @evidence contracts/development/design.md#principled-representation The same arithmetic interface supports ordinary scalars and source partials, with primal branch decisions read through value.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the existing rational, root and logarithmic operations needed by the conic kernels are exposed.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The interface supplies no geometry fallback, derivative estimate or implicit validation.
   * @evidence contracts/development/common.md#meaningful-documentation Each member identifies its scalar meaning; admission remains at the geometry owner.
   */
  export interface IAlgebra<T> {
    /**
     * Primal value used for numerical scaling and declared branch selection.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Identifies primal-only scaling and branch use.
     */
    value(input: T): number;

    /**
     * A coordinate-independent scalar, with zero source partials.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States coordinate independence and the exact zero-partial premise.
     */
    constant(value: number): T;

    /**
     * Scalar addition and corresponding source partials.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Identifies scalar and derivative addition.
     */
    add(a: T, b: T): T;

    /**
     * Scalar subtraction and corresponding source partials.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States scalar and derivative subtraction.
     */
    subtract(a: T, b: T): T;

    /**
     * Product with both first partials and the symmetric Hessian.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Names both first partials and the symmetric Hessian.
     */
    multiply(a: T, b: T): T;

    /**
     * Quotient; the geometry owner requires an admitted nonzero divisor.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States nonzero-divisor admission and quotient meaning.
     */
    divide(a: T, b: T): T;

    /**
     * Positive square root and its source partials on its regular domain.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States positive-root and regular-domain meanings.
     */
    sqrt(input: T): T;

    /**
     * Real cube root and source partials away from its singular zero.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the real branch and singular-zero limitation.
     */
    cbrt(input: T): T;

    /**
     * Natural logarithm and source partials on its positive domain.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States natural logarithm and its positive-domain premise.
     */
    log(input: T): T;

    /**
     * Exponential and its source partials, subject to finite arithmetic.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the exponential and finite-arithmetic premise.
     */
    exp(input: T): T;
  }
}
