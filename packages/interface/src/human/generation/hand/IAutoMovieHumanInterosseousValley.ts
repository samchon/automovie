/** Type contracts exchanged by AutoMovieHumanInterosseousValley; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanInterosseousValley {
  /** A valley's fixed inputs.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A valley's fixed inputs.
   * @evidence contracts/development/design.md#principled-representation `between`: The two metacarpal axes' places across the hand, mm, the thumb side first. `radius`: The arches' radius, mm.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanInterosseousValley.depth. Also types AutoMovieHumanPalmRelief.valleys.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `between`, `radius`; callers supply the complete record.
   */
  export interface IInput {
    /** The two metacarpal axes' places across the hand, mm, the thumb side first. */
    between: [number, number];

    /** The arches' radius, mm. */
    radius: number;
  }
}
