import type { IAutoMovieHumanSiteControls } from "./IAutoMovieHumanSiteControls";
import type { IAutoMovieHumanSiteViewPart } from "./IAutoMovieHumanSiteViewPart";

/** Type contracts exchanged by AutoMovieHumanSiteRegionControls; runtime evaluation remains in Human. */
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

    /** Supply the same complete local scalar boundary and qualified jets to the host input. */
    connect(
      input: IAutoMovieHumanSiteViewPart.IInput,
    ): IAutoMovieHumanSiteViewPart.IInput;

    /** Explicit whole-host scalar demand; local sites are reused only for identical numeric tuples. */
    prepare(
      input: IAutoMovieHumanSiteViewPart.IInput,
    ): IAutoMovieHumanSiteControls.IOutput;
  }
}
