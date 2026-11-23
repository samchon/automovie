import type { IAutoMovieHumanSectionSource } from "./IAutoMovieHumanSectionSource";
import type { IAutoMovieHumanSiteControls } from "./IAutoMovieHumanSiteControls";

/**
 * Shared local constraints with explicit host connection and whole-host preparation requests. Runtime construction and admission remain with AutoMovieHumanSiteRegionControls in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes shared local constraints with explicit host connection and whole-host preparation requests; nested declarations retain their units, frames, optional states and callback contracts.
 * @evidence contracts/development/design.md#principled-representation Shared local constraints with explicit host connection and whole-host preparation requests. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these dependency-free exchange types for AutoMovieHumanSiteRegionControls; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups the existing SiteRegionControls contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.
 */
export namespace IAutoMovieHumanSiteRegionControls {
  /** Both source consumers share one set of independent tape constraints.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Both source consumers share one set of independent tape constraints.
   * @evidence contracts/development/design.md#principled-representation `local`: Actual local scalar controls and site diagnostics, without any proximal constraint.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanSiteRegionControls.create. Also types AutoMovieHumanArmHandControls.shared, AutoMovieHumanLegSourceFamily.controls.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `local`; callers supply the complete record.
   */
  export interface IOutput {
    /** Actual local scalar controls and site diagnostics, without any proximal constraint. */
    local: IAutoMovieHumanSiteControls.IOutput;

    /**
     * Supply the same complete local scalar boundary and qualified jets to the host input.
     */
    connect(input: IAutoMovieHumanSectionSource): IAutoMovieHumanSectionSource;

    /**
     * Explicit whole-host scalar demand; local sites are reused only for identical numeric tuples.
     */
    prepare(
      input: IAutoMovieHumanSectionSource,
    ): IAutoMovieHumanSiteControls.IOutput;
  }
}
