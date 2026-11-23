import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * Help a partner into a coat. The dresser stands behind the partner, carries
 * the held open-front jacket up to the partner's collar and holds it there,
 * open, while the partner's arms go back into its sleeves; then the dresser
 * lets go and the jacket is worn on the partner's chest.
 */
export interface IAutoMovieMotionHumanCoatPartner {
  /**
   * The held open-front jacket's scene subject, with `wear` and sleeve
   * openings.
   */
  prop: string;

  /** The performer helped into the coat. */
  partner: string;

  /** The hand that holds the jacket; whichever hand holds it when absent. */
  hand?: AutoMovieHumanSide;

  /**
   * How long the jacket is held open at the collar while the partner threads
   * both sleeves, seconds. Required: no natural value is defined, so the author
   * sets it (provisional: no timing study was read).
   */
  hold: number;
}
