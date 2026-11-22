import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * Help a partner into a coat (#4015). The dresser stands behind the partner,
 * carries the held open-front jacket up to the partner's collar and holds it
 * there, open, while the partner's arms go back into its sleeves; then the
 * dresser lets go and the jacket is worn on the partner's chest.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States who holds what where, what the partner does meanwhile and when custody passes.
 * @evidence contracts/development/design.md#principled-representation The jacket's own `wear` socket is brought to the partner's collar; the held span is the partner's threading time.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The jacket, the partner, the holding hand and how long it is held open.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A jacket not held, a partner named as the dresser and an unreachable collar are refused at runtime by the law.
 */
export interface IAutoMovieMotionHumanCoatPartner {
  /** The held open-front jacket's scene subject, with `wear` and sleeve openings. */
  prop: string;

  /** The performer helped into the coat. */
  partner: string;

  /** The hand that holds the jacket; whichever hand holds it when absent. */
  hand?: AutoMovieHumanSide;

  /** How long the jacket is held open at the collar while the partner threads both sleeves, seconds. */
  hold: number;
}
