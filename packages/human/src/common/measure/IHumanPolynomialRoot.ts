import type { IHumanExactFraction } from "./IHumanExactFraction";

/** A root-bearing exact interval whose contents round to one represented binary64 parameter; it need not contain only one real root.
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
