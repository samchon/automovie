/**
 * The front-midline height profile and its ordered millimetre landmark pairs. Runtime construction and admission remain with AutoMovieHumanTrunkProfileFront in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the front-midline height profile and its ordered millimetre landmark pairs; nested declarations retain their units, frames, optional states and callback contracts.
 * @evidence contracts/development/design.md#principled-representation The front-midline height profile and its ordered millimetre landmark pairs. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these dependency-free exchange types for AutoMovieHumanTrunkProfileFront; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups the existing TrunkProfileFront contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.
 */
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
    /**
     * The forward place of the front midline at a height, mm.
     *
     * @evidence contracts/development/common.md#meaningful-documentation The forward place of the front midline at a height, mm.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This at signature specifies the documented callback contract without an implementation body; AutoMovieHumanTrunkProfileFront and its supplied callbacks own the numerical method and its premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The callable member exposes at at the containing contract boundary; decomposition of its implementation remains with AutoMovieHumanTrunkProfileFront.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or fallback computation occur in this signature; the actual at provider is responsible for satisfying the documented semantics.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This signature chooses no algorithm or allocation strategy; the runtime callback used or returned by AutoMovieHumanTrunkProfileFront determines the work per at call.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The type itself coordinates no calls or caches; AutoMovieHumanTrunkProfileFront's runtime provider owns reuse and must preserve the documented source identity and effects.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no state or resources; the at provider and the caller retaining its containing record own the callback and its captured dependencies.
     */
    at: (y: number) => number;

    /** The landmark stations the profile runs through, `[height, forward place]`, mm. */
    marks: [number, number][];
  }
}
