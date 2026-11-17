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
     *
     * @evidence contracts/development/common.md#meaningful-documentation The ring's girth at a trial half width, mm: the hull of its own section.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This girth signature specifies the documented callback contract without an implementation body; AutoMovieHumanTrunkGroinWidth and its supplied callbacks own the numerical method and its premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The callable member exposes girth at the containing contract boundary; decomposition of its implementation remains with AutoMovieHumanTrunkGroinWidth.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or fallback computation occur in this signature; the actual girth provider is responsible for satisfying the documented semantics.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This signature chooses no algorithm or allocation strategy; the runtime callback used or returned by AutoMovieHumanTrunkGroinWidth determines the work per girth call.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The type itself coordinates no calls or caches; AutoMovieHumanTrunkGroinWidth's runtime provider owns reuse and must preserve the documented source identity and effects.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no state or resources; the girth provider and the caller retaining its containing record own the callback and its captured dependencies.
     */
    girth: (width: number) => number;
  }
}
