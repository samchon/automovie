/**
 * The card's narrowing along its length: a quarter narrower at the tip than
 * at the root (a convention of this prototype), a straight, gentle taper
 * that keeps the whole card one bundle; a stronger straight narrowing drew
 * each card's end as a spike or a square and the cut as a saw edge.
 */
export namespace AutoMovieHumanHairCardTaper {
  /** Share of the width lost over the whole length (convention). */
  export const LOSS: number = 0.25;

  /**
   * Width factor at an arc length.
   *
   * @param s Arc length from the root, millimetres
   * @param length The card's length, millimetres
   * @returns Factor in [1 - LOSS, 1]
   */
  export function factor(s: number, length: number): number {
    return 1 - (LOSS * s) / length;
  }
}
