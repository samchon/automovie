import { AutoMovieHumanHairOcclusion } from "./AutoMovieHumanHairOcclusion";

/**
 * How many roots carry cards: a card stands for a bundle of hairs, so of
 * width w and in-card coverage a its roots must lie at least
 * rho d / (w a) per unit area to occlude as the hair does
 * (`AutoMovieHumanHairOcclusion`), times an overlap that fills the card
 * edges and alpha gaps with neighbours.
 */
export namespace AutoMovieHumanHairRootCount {
  /**
   * Share of a card's body that survives the alpha cutoff, measured on
   * `AutoMovieHumanHairImage` (root band 0.33, body 0.77, tip band 0.45).
   */
  export const CARD: number = 0.774;

  /** Scalp radius the root lattice is counted at, mm (convention: the adult chart's mean scalp radius). */
  export const RADIUS: number = 95;

  /**
   * Overlap of the cards over the law's minimum: each scalp point lies under
   * 2.5 times the cards the law requires, the summed card width per area of
   * the earlier short cut (5,000 roots of 9 mm), so card edges and alpha
   * gaps are filled by neighbours (convention).
   */
  export const OVERLAP: number = 2.5;

  /**
   * Roots over the whole chart sphere for cards of one width: the law's
   * minimum areal density times {@link OVERLAP}, over a sphere of
   * {@link RADIUS}.
   *
   * @param width Card width at the root, mm
   * @returns Lattice size
   */
  export function count(width: number): number {
    return Math.round(
      (OVERLAP *
        4 *
        Math.PI *
        RADIUS *
        RADIUS *
        AutoMovieHumanHairOcclusion.DENSITY *
        AutoMovieHumanHairOcclusion.DIAMETER) /
        (width * CARD),
    );
  }
}
