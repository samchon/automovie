/**
 * The card's rounded end over its tip band: half width times
 * sqrt(1 - x^2) of the band's share x, an elliptic end with no corner, so the
 * strand image's strands converge into points instead of ending in a
 * spike or a square.
 */
export namespace AutoMovieHumanHairCardTipCap {
  /**
   * Width factor at an arc length.
   *
   * @param s Arc length from the root, millimetres
   * @param tipStart Where the tip band starts, millimetres from the root
   * @param tipSpan Length of the tip band, millimetres
   * @returns Factor in [0, 1], 1 before the band and 0 at its end
   */
  export function factor(s: number, tipStart: number, tipSpan: number): number {
    return Math.sqrt(
      Math.max(0, 1 - Math.min(1, Math.max(0, (s - tipStart) / tipSpan)) ** 2),
    );
  }
}
