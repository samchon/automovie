/**
 * Type contracts exchanged by AutoMovieHumanMetacarpalArch; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanMetacarpalArch {
  /** An arch's fixed inputs. */
  export interface IInput {
    /** The metacarpal axis's place in the section, `[b, c]`, mm. */
    centre: [number, number];

    /** The finger root's skin half width, mm. */
    root: number;
  }

  /**
   * Result of AutoMovieHumanMetacarpalArch.arc. Points of the dorsal arc
   * between two angles about the metacarpal axis, angle 0 toward the thumb
   * along `b` and increasing toward the back of the hand (`-c`).
   *
   * @param input The arch's inputs.
   * @param from First angle, radians.
   * @param to Last angle, radians.
   * @param count Points, at least 2.
   */
  export type ArcResult = [number, number][];
}
