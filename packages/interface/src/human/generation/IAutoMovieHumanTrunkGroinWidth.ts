/** Type contracts exchanged by AutoMovieHumanTrunkGroinWidth; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanTrunkGroinWidth {
  /** What the width reads.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation What the width reads.
   * @evidence contracts/development/design.md#principled-representation `buttock`: The buttock's half width, mm. `thigh`: The thigh tape, mm; absent, the references' median ratio is used. `ratio`: The ring's half girth over the thigh tape, as the leg reports it; absent, the references' median ratio is used.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanTrunkGroinWidth.width.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `thigh`: The thigh tape, mm; absent, the references' median ratio is used. `ratio`: The ring's half girth over the thigh tape, as the leg reports it; absent, the references' median ratio is used.
   */
  export interface IInput {
    /** The buttock's half width, mm. */
    buttock: number;

    /** The thigh tape, mm; absent, the references' median ratio is used. */
    thigh?: number;

    /** The ring's half girth over the thigh tape, as the leg reports it; absent, the references' median ratio is used. */
    ratio?: number;

    /** The ring's girth at a trial half width, mm: the hull of its own section. */
    girth: (width: number) => number;
  }
}
