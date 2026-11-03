/**
 * A card's root band: the physical length of its first millimetres, where
 * the strand image's strands start at scattered places and fade in.
 *
 * It is {@link EDGE} mm at the hairline's boundary, where a short one
 * compressed the scattered roots into a row of teeth along the forehead, and
 * {@link INNER} mm from the transition zone's inner edge on: inside the mass
 * a long root band only bares the scalp, since every strand then starts 8
 * mm from its root (it bared a 10 mm strip along f1's parting and a 15 mm
 * spot at f2's whorl). The band is at most two fifths of the card.
 */
export namespace AutoMovieHumanHairRootBand {
  /** Root band at the boundary, mm (convention, kept from the earlier edge). */
  export const EDGE: number = 8;

  /** Root band inside the mass, mm (convention: a visible strand starts at its root; no published value). */
  export const INNER: number = 2;

  /**
   * Physical length of a card's root band.
   *
   * @param feather The root's feather, 0 at the boundary to 1 inside the mass
   * @param length The card's length, mm
   * @returns Root band, mm
   */
  export function band(feather: number, length: number): number {
    return Math.min(EDGE + (INNER - EDGE) * feather, 0.4 * length);
  }
}
