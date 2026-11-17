import type { IAutoMovieHumanTrunkFeature } from "./IAutoMovieHumanTrunkFeature";
import type { IAutoMovieHumanTrunkReliefNet } from "./IAutoMovieHumanTrunkReliefNet";

/**
 * The gluteal mass, original trunk surface and lateral-to-material-phase lookup used by relief composition. Runtime construction and admission remain with AutoMovieHumanGlutealRelief in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the gluteal mass, original trunk surface and lateral-to-material-phase lookup used by relief composition; nested declarations retain their units, frames, optional states and callback contracts.
 * @evidence contracts/development/design.md#principled-representation The gluteal mass, original trunk surface and lateral-to-material-phase lookup used by relief composition. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these dependency-free exchange types for AutoMovieHumanGlutealRelief; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups the existing GlutealRelief contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.
 */
export namespace IAutoMovieHumanGlutealRelief {
  /** What the merge reads.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation What the merge reads.
   * @evidence contracts/development/design.md#principled-representation `dome`: The gluteal mass. `base`: The trunk's base surface: the body point at a height and a phase. `phaseOf`: The base's phase at a lateral place on the back at the buttock point's height.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanGlutealRelief.create.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `dome`, `base`, `phaseOf`; callers supply the complete record.
   */
  export interface IInput {
    /** The gluteal mass. */
    dome: IAutoMovieHumanTrunkFeature;

    /** The trunk's base surface: the body point at a height and a phase. */
    base: IAutoMovieHumanTrunkReliefNet.Base;

    /**
     * The base's phase at a lateral place on the back at the buttock point's height.
     *
     * @evidence contracts/development/common.md#meaningful-documentation The base's phase at a lateral place on the back at the buttock point's height.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This phaseOf signature specifies the documented callback contract without an implementation body; AutoMovieHumanGlutealRelief and its supplied callbacks own the numerical method and its premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The callable member exposes phaseOf at the containing contract boundary; decomposition of its implementation remains with AutoMovieHumanGlutealRelief.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or fallback computation occur in this signature; the actual phaseOf provider is responsible for satisfying the documented semantics.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This signature chooses no algorithm or allocation strategy; the runtime callback used or returned by AutoMovieHumanGlutealRelief determines the work per phaseOf call.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The type itself coordinates no calls or caches; AutoMovieHumanGlutealRelief's runtime provider owns reuse and must preserve the documented source identity and effects.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no state or resources; the phaseOf provider and the caller retaining its containing record own the callback and its captured dependencies.
     */
    phaseOf: (z: number) => number;
  }
}
