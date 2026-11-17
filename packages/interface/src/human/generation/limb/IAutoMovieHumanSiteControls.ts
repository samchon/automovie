import type { IAutoMovieLoftContract } from "../../../construction/IAutoMovieLoftContract";
import type { IAutoMovieLoftViewSource } from "../../../construction/IAutoMovieLoftViewSource";
import type { IAutoMovieViewAxis } from "../../../construction/IAutoMovieViewAxis";
import type { IAutoMovieHumanSiteViewPart } from "./IAutoMovieHumanSiteViewPart";

/** Type contracts exchanged by AutoMovieHumanSiteControls; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanSiteControls {
  /** Actual control admission, retaining failed input/tape diagnostics without an alternative source.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Actual control admission, retaining failed input/tape diagnostics without an alternative source.
   * @evidence contracts/development/design.md#principled-representation `controls`: Null after the original source-control admission failed. `diagnostics`: Original source/tape premises in their original order.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanFootInterim.roof, AutoMovieHumanFootPart.controls, AutoMovieHumanSiteControls.prepare. Read by region, AutoMovieHumanFootBreadth.measure, AutoMovieHumanFootPart.controls. Also types AutoMovieHumanArmWalk.prepared, AutoMovieHumanFootBreadth.declarations.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `controls`, `diagnostics`; callers supply the complete record.
   */
  export interface IOutput {
    /** Null after the original source-control admission failed. */
    controls: IControls | null;

    /** Original source/tape premises in their original order. */
    diagnostics: IAutoMovieLoftContract.IDiagnostic[];
  }

  /** Original mathematical inputs and scalar declarations, before a part, tree view or loft is made.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Original mathematical inputs and scalar declarations, before a part, tree view or loft is made.
   * @evidence contracts/development/design.md#principled-representation `input`: The unchanged generating inputs and canonical axis declaration. `axis`: Actual engine frame mapping, separate from scalar chart coordinates. `scalars`: Full scalar knots/parameters needed by the existing global interpolation; no complete neighbour is acquired.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanSiteControls.native. Also types AutoMovieHumanArmWalk.original, AutoMovieHumanFootBreadth.common.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `input`, `axis`, `scalars`; callers supply the complete record.
   */
  export interface IControls {
    /** The unchanged generating inputs and canonical axis declaration. */
    readonly input: IAutoMovieHumanSiteViewPart.IInput;

    /** Actual engine frame mapping, separate from scalar chart coordinates. */
    readonly axis: IAutoMovieViewAxis.IAxis;

    /** Full scalar knots/parameters needed by the existing global interpolation; no complete neighbour is acquired. */
    readonly scalars: IAutoMovieLoftViewSource.IInput;

    /** Explicit native scalar preparation, shared by contact consumers; its physical2 refusal stays observable. */
    field(): IAutoMovieLoftViewSource.ISource;
  }

  /** Explicitly shared frame preparation of the identical canonical axis declaration.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Explicitly shared frame preparation of the identical canonical axis declaration.
   * @evidence contracts/development/design.md#principled-representation `definition`: Original immutable metre axis record, checked before reuse. `value`: Its actual calibration-mm engine frame, including available axis jets.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanSiteControls.prepare.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `definition`, `value`; callers supply the complete record.
   */
  export interface IFrame {
    /** Original immutable metre axis record, checked before reuse. */
    definition: IAutoMovieHumanSiteViewPart.IInput["axis"];

    /** Its actual calibration-mm engine frame, including available axis jets. */
    value: IAutoMovieViewAxis.IAxis;
  }
}
