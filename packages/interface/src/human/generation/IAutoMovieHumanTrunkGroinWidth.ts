/**
 * Buttock and optional thigh constraints with the original trial-width girth callback. Runtime construction and admission remain with AutoMovieHumanTrunkGroinWidth in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes buttock and optional thigh constraints with the original trial-width girth callback; nested declarations retain their units, frames, optional states and callback contracts.
 * @evidence contracts/development/design.md#principled-representation Buttock and optional thigh constraints with the original trial-width girth callback. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these dependency-free exchange types for AutoMovieHumanTrunkGroinWidth; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups the existing TrunkGroinWidth contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.
 */
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

    /**
     * The ring's girth at a trial half width, mm: the hull of its own section.
     */
    girth: (width: number) => number;
  }
}
