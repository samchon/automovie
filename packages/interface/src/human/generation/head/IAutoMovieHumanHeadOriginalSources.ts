import type { IAutoMovieHumanHeadComposer } from "./IAutoMovieHumanHeadComposer";

/**
 * Explicit scoped head-source requests before tree assembly or regional raw lofting. Runtime construction and admission remain with AutoMovieHumanHeadOriginalSources in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes explicit scoped head-source requests before tree assembly or regional raw lofting; nested declarations retain their units, frames, optional states and callback contracts.
 * @evidence contracts/development/design.md#principled-representation Explicit scoped head-source requests before tree assembly or regional raw lofting. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these dependency-free exchange types for AutoMovieHumanHeadOriginalSources; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups the existing HeadOriginalSources contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.
 */
export namespace IAutoMovieHumanHeadOriginalSources {
  /** Source requests before tree assembly or any regional raw loft.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Source requests before tree assembly or any regional raw loft.
   * @evidence contracts/development/design.md#principled-representation Source requests before tree assembly or any regional raw loft.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanHeadOriginalSources.create.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanHeadOriginalSources.create for source requests before tree assembly or any regional raw loft.
   */
  export interface IOutput {
    /**
     * Empty is unrequested, unknown names throw before host work, tape-invariant names use the pre-closure host, exact top-level names select their closed-host factories, and absent/mixed/nested names retain the existing whole regional path.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Empty is unrequested, unknown names throw before host work, tape-invariant names use the pre-closure host, exact top-level names select their closed-host factories, and absent/mixed/nested names retain the existing whole regional path.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This request signature specifies the documented callback contract without an implementation body; AutoMovieHumanHeadOriginalSources and its supplied callbacks own the numerical method and its premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The callable member exposes request at the containing contract boundary; decomposition of its implementation remains with AutoMovieHumanHeadOriginalSources.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or fallback computation occur in this signature; the actual request provider is responsible for satisfying the documented semantics.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This signature chooses no algorithm or allocation strategy; the runtime callback used or returned by AutoMovieHumanHeadOriginalSources determines the work per request call.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The type itself coordinates no calls or caches; AutoMovieHumanHeadOriginalSources's runtime provider owns reuse and must preserve the documented source identity and effects.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no state or resources; the request provider and the caller retaining its containing record own the callback and its captured dependencies.
     */
    request(names?: readonly string[]): IAutoMovieHumanHeadComposer.IDefinition;
  }
}
