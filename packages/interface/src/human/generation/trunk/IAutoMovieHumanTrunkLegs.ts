import type { IAutoMovieHumanSourceDefinition } from "../limb/IAutoMovieHumanSourceDefinition";
import type { IAutoMovieHumanTrunkViewPart } from "./IAutoMovieHumanTrunkViewPart";
import type { IAutoMovieHumanTrunkViews } from "./IAutoMovieHumanTrunkViews";

/**
 * Trunk views and explicit side-qualified factories binding legs to the identical parent. Runtime construction and admission remain with AutoMovieHumanTrunkLegs in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes trunk views and explicit side-qualified factories binding legs to the identical parent; nested declarations retain their units, frames, optional states and callback contracts.
 * @evidence contracts/development/design.md#principled-representation Trunk views and explicit side-qualified factories binding legs to the identical parent. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these dependency-free exchange types for AutoMovieHumanTrunkLegs; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups the existing TrunkLegs contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.
 */
export namespace IAutoMovieHumanTrunkLegs {
  /** Actual source preparation and its call-owned regional leg factory.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Actual source preparation and its call-owned regional leg factory.
   * @evidence contracts/development/design.md#principled-representation `views`: Same complete trunk views used by production. `top`: Same optional source-owned upper closure. `legs`: Retained standalone legs when no coupled factory was supplied.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanTrunkLegs.pair. Read by AutoMovieHumanTrunkLegs.pair, AutoMovieHumanTrunkLegs.trial. Also types AutoMovieHumanTrunkLegs.legs.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `top`: Same optional source-owned upper closure. `legs`: Retained standalone legs when no coupled factory was supplied.
   */
  export interface IInput {
    /** Same complete trunk views used by production. */
    views: IAutoMovieHumanTrunkViews;
    /** Same optional source-owned upper closure. */
    top?: IAutoMovieHumanTrunkViewPart.ITop;
    /** Retained standalone legs when no coupled factory was supplied. */
    legs?: Record<"left" | "right", IAutoMovieHumanSourceDefinition>;
    /**
     * Author and retain the regional leg against this identical parent and its named hip station.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Author and retain the regional leg against this identical parent and its named hip station.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This bindLeg signature specifies the documented callback contract without an implementation body; AutoMovieHumanTrunkLegs and its supplied callbacks own the numerical method and its premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The callable member exposes bindLeg at the containing contract boundary; decomposition of its implementation remains with AutoMovieHumanTrunkLegs.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or fallback computation occur in this signature; the actual bindLeg provider is responsible for satisfying the documented semantics.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This signature chooses no algorithm or allocation strategy; the runtime callback used or returned by AutoMovieHumanTrunkLegs determines the work per bindLeg call.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The type itself coordinates no calls or caches; AutoMovieHumanTrunkLegs's runtime provider owns reuse and must preserve the documented source identity and effects.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no state or resources; the bindLeg provider and the caller retaining its containing record own the callback and its captured dependencies.
     */
    bindLeg?(
      side: "left" | "right",
      parent: IAutoMovieHumanSourceDefinition,
      station: number,
    ): IAutoMovieHumanSourceDefinition;
  }
}
