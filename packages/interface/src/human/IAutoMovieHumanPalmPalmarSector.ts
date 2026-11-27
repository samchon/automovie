/**
 * Type contracts exchanged by AutoMovieHumanPalmPalmarSector; runtime
 * evaluation remains in Human.
 */
export namespace IAutoMovieHumanPalmPalmarSector {
  /** A sector's fixed inputs. */
  export interface IInput {
    /**
     * The two side guides' places in the section, `[b, c]`, mm, the thumb side
     * first.
     */
    sides: [[number, number], [number, number]];

    /** The palm's palmar bone line's `c` at the middle, mm. */
    bone: number;
  }

  /**
   * Result of AutoMovieHumanPalmPalmarSector.arc. Points of the sector's arc
   * from the first side guide to the second, a half ellipse through the pad's
   * deepest point.
   *
   * @param input The sector's inputs.
   * @param count Points, at least 2.
   */
  export type ArcResult = [number, number][];
}
