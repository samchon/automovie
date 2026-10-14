import type { IHumanExactFraction } from "./IHumanExactFraction";

/** A root-bearing exact interval whose contents round to one represented binary64 parameter; it need not contain only one real root.
 *
 *
 * @evidence contracts/common.md#principled-implementation Exact lower/upper fractions enclose roots whose entire interval rounds to one binary64 parameter in [0,1]; several real roots can share that represented parameter.
 * @evidence contracts/common.md#clear-and-simple-design The interval retains exact bounds separately from rounded output, preserving the isolator's representational stopping criterion.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The result does not claim one root per interval or add a tolerance/expected parameter to force separation.
 * @evidence contracts/common.md#meaningful-documentation The prose explicitly allows multiple roots and members give exact endpoints and dimensionless represented parameter.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This root record executes no Sturm sequence or dyadic subdivision.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It carries no root-isolation cache across changed coefficients.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returned rational bounds and parameter are caller-owned values, without a retained work stack or live handle.
 *
 * @author Samchon
 */
export interface IHumanPolynomialRoot {
  /** Exact lower endpoint of the root-bearing interval. */
  lower: IHumanExactFraction;

  /** Exact upper endpoint of the same interval. */
  upper: IHumanExactFraction;

  /** Common rounded binary64 parameter of the interval, dimensionless in [0,1]. */
  parameter: number;
}
