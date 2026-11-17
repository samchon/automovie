/** Type contracts exchanged by AutoMovieHumanTrunkProfileFront; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanTrunkProfileFront {
  /** The profile.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The profile.
   * @evidence contracts/development/design.md#principled-representation `at`: The forward place of the front midline at a height, mm. `marks`: The landmark stations the profile runs through, `[height, forward place]`, mm.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanTrunkProfileFront.create.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `at`, `marks`; callers supply the complete record.
   */
  export interface IProfile {
    /** The forward place of the front midline at a height, mm. */
    at: (y: number) => number;

    /** The landmark stations the profile runs through, `[height, forward place]`, mm. */
    marks: [number, number][];
  }
}
