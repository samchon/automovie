import type { IAutoMovieHumanTrunkKey } from "./IAutoMovieHumanTrunkKey";
import type { IAutoMovieHumanTrunkSection } from "./IAutoMovieHumanTrunkSection";

/**
 * Ordered trunk keys and the millimetre-height section evaluator they define. Runtime construction and admission remain with AutoMovieHumanTrunkColumn in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes ordered trunk keys and the millimetre-height section evaluator they define; nested declarations retain their units, frames, optional states and callback contracts.
 * @evidence contracts/development/design.md#principled-representation Ordered trunk keys and the millimetre-height section evaluator they define. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these dependency-free exchange types for AutoMovieHumanTrunkColumn; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups the existing TrunkColumn contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.
 */
export namespace IAutoMovieHumanTrunkColumn {
  /** The column.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The column.
   * @evidence contracts/development/design.md#principled-representation `at`: The section's measures at a height. `keys`: The keys, by rising height.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanTrunkColumn.create, AutoMovieHumanTrunkKeys.column. Read by AutoMovieHumanTrunkCourses.backNeckToWaist, AutoMovieHumanTrunkCourses.sideNeckToBust, AutoMovieHumanTrunkCourses.acrossBack. Also types AutoMovieHumanTrunkClosure.col, AutoMovieHumanTrunkSolver.col.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `at`, `keys`; callers supply the complete record.
   */
  export interface IColumn {
    /**
     * The section's measures at a height.
     *
     * @evidence contracts/development/common.md#meaningful-documentation The section's measures at a height.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This at signature specifies the documented callback contract without an implementation body; AutoMovieHumanTrunkColumn and its supplied callbacks own the numerical method and its premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The callable member exposes at at the containing contract boundary; decomposition of its implementation remains with AutoMovieHumanTrunkColumn.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or fallback computation occur in this signature; the actual at provider is responsible for satisfying the documented semantics.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This signature chooses no algorithm or allocation strategy; the runtime callback used or returned by AutoMovieHumanTrunkColumn determines the work per at call.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The type itself coordinates no calls or caches; AutoMovieHumanTrunkColumn's runtime provider owns reuse and must preserve the documented source identity and effects.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no state or resources; the at provider and the caller retaining its containing record own the callback and its captured dependencies.
     */
    at: (y: number) => IAutoMovieHumanTrunkSection;

    /** The keys, by rising height. */
    keys: IAutoMovieHumanTrunkKey[];
  }
}
