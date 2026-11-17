import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanHandForm } from "./IAutoMovieHumanHandForm";

/**
 * The shared hand form and callbacks mapping its heel into the forearm's left frame. Runtime construction and admission remain with AutoMovieHumanHandHeel in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the shared hand form and callbacks mapping its heel into the forearm's left frame; nested declarations retain their units, frames, optional states and callback contracts.
 * @evidence contracts/development/design.md#principled-representation The shared hand form and callbacks mapping its heel into the forearm's left frame. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these dependency-free exchange types for AutoMovieHumanHandHeel; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups the existing HandHeel contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.
 */
export namespace IAutoMovieHumanHandHeel {
  /** A heel's fixed inputs.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A heel's fixed inputs.
   * @evidence contracts/development/design.md#principled-representation `form`: The hand form, shared by every person. `map`: The hand's map from the form's axes to the left frame, origin placed on the forearm's wrist. `bone`: The bone tube's point at a station `a` of the hand's axis and a phase `t` of the arm's section, left frame, mm: the arm's cut, or the wrist span's end section copied (the heel starts from it).
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanHandHeel.point, AutoMovieHumanHandHeel.creaseJet.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `form`, `map`, `bone`; callers supply the complete record.
   */
  export interface IInput {
    /** The hand form, shared by every person. */
    form: IAutoMovieHumanHandForm;

    /**
     * The hand's map from the form's axes to the left frame, origin placed on the forearm's wrist.
     *
     * @evidence contracts/development/common.md#meaningful-documentation The hand's map from the form's axes to the left frame, origin placed on the forearm's wrist.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This map signature specifies the documented callback contract without an implementation body; AutoMovieHumanHandHeel and its supplied callbacks own the numerical method and its premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The callable member exposes map at the containing contract boundary; decomposition of its implementation remains with AutoMovieHumanHandHeel.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or fallback computation occur in this signature; the actual map provider is responsible for satisfying the documented semantics.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This signature chooses no algorithm or allocation strategy; the runtime callback used or returned by AutoMovieHumanHandHeel determines the work per map call.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The type itself coordinates no calls or caches; AutoMovieHumanHandHeel's runtime provider owns reuse and must preserve the documented source identity and effects.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no state or resources; the map provider and the caller retaining its containing record own the callback and its captured dependencies.
     */
    map: (q: readonly [number, number, number]) => AutoMovieVector3Tuple;

    /**
     * The bone tube's point at a station `a` of the hand's axis and a phase
     * `t` of the arm's section, left frame, mm: the arm's cut, or the wrist
     * span's end section copied (the heel starts from it).
     *
     * @evidence contracts/development/common.md#meaningful-documentation The bone tube's point at a station `a` of the hand's axis and a phase `t` of the arm's section, left frame, mm: the arm's cut, or the wrist span's end section copied (the heel starts from it).
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This bone signature specifies the documented callback contract without an implementation body; AutoMovieHumanHandHeel and its supplied callbacks own the numerical method and its premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The callable member exposes bone at the containing contract boundary; decomposition of its implementation remains with AutoMovieHumanHandHeel.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or fallback computation occur in this signature; the actual bone provider is responsible for satisfying the documented semantics.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This signature chooses no algorithm or allocation strategy; the runtime callback used or returned by AutoMovieHumanHandHeel determines the work per bone call.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The type itself coordinates no calls or caches; AutoMovieHumanHandHeel's runtime provider owns reuse and must preserve the documented source identity and effects.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no state or resources; the bone provider and the caller retaining its containing record own the callback and its captured dependencies.
     */
    bone: (a: number, t: number) => AutoMovieVector3Tuple;
  }
}
