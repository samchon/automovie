/** JSON representation of a reduced exact rational, without BigInt loss.
 * Decimal strings retain integer identity; denominators are strictly positive.
 *
 * @author Samchon
 */
export interface IHumanExactFractionJson {
  /** Canonical decimal numerator; zero is "0", never "-0". */
  numerator: string;

  /** Canonical positive decimal denominator. */
  denominator: string;
}
