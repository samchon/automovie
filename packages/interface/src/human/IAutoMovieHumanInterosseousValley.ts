/**
 * Type contracts exchanged by AutoMovieHumanInterosseousValley; runtime
 * evaluation remains in Human.
 */
export namespace IAutoMovieHumanInterosseousValley {
  /** A valley's fixed inputs. */
  export interface IInput {
    /**
     * The two metacarpal axes' places across the hand, mm, the thumb side
     * first.
     */
    between: [number, number];

    /** The arches' radius, mm. */
    radius: number;
  }
}
