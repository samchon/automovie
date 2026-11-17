import type { IAutoMovieHumanSectionSource } from "../limb/IAutoMovieHumanSectionSource";
import type { IAutoMovieHumanArmWalk } from "./IAutoMovieHumanArmWalk";

/**
 * Shared distal arm controls used by hand contacts and explicit whole-arm preparation. Runtime construction and admission remain with AutoMovieHumanArmHandControls in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes shared distal arm controls used by hand contacts and explicit whole-arm preparation; nested declarations retain their units, frames, optional states and callback contracts.
 * @evidence contracts/development/design.md#principled-representation Shared distal arm controls used by hand contacts and explicit whole-arm preparation. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these dependency-free exchange types for AutoMovieHumanArmHandControls; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups the existing ArmHandControls contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.
 */
export namespace IAutoMovieHumanArmHandControls {
  /** Arm publication and digit contacts consume the same complete distal field.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Arm publication and digit contacts consume the same complete distal field.
   * @evidence contracts/development/design.md#principled-representation `hand`: Wrist-to-cap contact domain, with forearm support for the shared scalar jets.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanArmHandControls.create. Also types AutoMovieHumanArmSources.shared, AutoMovieHumanArmWalk.handControls.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `hand`; callers supply the complete record.
   */
  export interface IOutput {
    /** Wrist-to-cap contact domain, with forearm support for the shared scalar jets. */
    hand: IAutoMovieHumanArmWalk.IPrepared;

    /**
     * Attach the original shared parameter, control values and jets to the arm input.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Attach the original shared parameter, control values and jets to the arm input.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This connect signature specifies the documented callback contract without an implementation body; AutoMovieHumanArmHandControls and its supplied callbacks own the numerical method and its premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The callable member exposes connect at the containing contract boundary; decomposition of its implementation remains with AutoMovieHumanArmHandControls.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or fallback computation occur in this signature; the actual connect provider is responsible for satisfying the documented semantics.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This signature chooses no algorithm or allocation strategy; the runtime callback used or returned by AutoMovieHumanArmHandControls determines the work per connect call.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The type itself coordinates no calls or caches; AutoMovieHumanArmHandControls's runtime provider owns reuse and must preserve the documented source identity and effects.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no state or resources; the connect provider and the caller retaining its containing record own the callback and its captured dependencies.
     */
    connect(input: IAutoMovieHumanSectionSource): IAutoMovieHumanSectionSource;

    /**
     * Explicit arm scalar demand reuses identical local tape constraints.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Explicit arm scalar demand reuses identical local tape constraints.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This prepare signature specifies the documented callback contract without an implementation body; AutoMovieHumanArmHandControls and its supplied callbacks own the numerical method and its premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The callable member exposes prepare at the containing contract boundary; decomposition of its implementation remains with AutoMovieHumanArmHandControls.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or fallback computation occur in this signature; the actual prepare provider is responsible for satisfying the documented semantics.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This signature chooses no algorithm or allocation strategy; the runtime callback used or returned by AutoMovieHumanArmHandControls determines the work per prepare call.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The type itself coordinates no calls or caches; AutoMovieHumanArmHandControls's runtime provider owns reuse and must preserve the documented source identity and effects.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no state or resources; the prepare provider and the caller retaining its containing record own the callback and its captured dependencies.
     */
    prepare(
      input: IAutoMovieHumanSectionSource,
    ): IAutoMovieHumanArmWalk.IPrepared;
  }
}
