import type { IAutoMovieLoftContract } from "../construction/IAutoMovieLoftContract";
import type { IAutoMovieLoftViewSource } from "../construction/IAutoMovieLoftViewSource";
import type { IAutoMovieViewAxis } from "../construction/IAutoMovieViewAxis";
import type { IAutoMovieHumanSectionSource } from "./IAutoMovieHumanSectionSource";

/**
 * Admitted original scalar controls and shared frame preparation with explicit
 * failure diagnostics. Runtime construction and admission remain with
 * AutoMovieHumanSiteControls in Human.
 */
export namespace IAutoMovieHumanSiteControls {
  /**
   * Actual control admission, retaining failed input/tape diagnostics without
   * an alternative source.
   */
  export interface IOutput {
    /** Null after the original source-control admission failed. */
    controls: IControls | null;

    /** Original source/tape premises in their original order. */
    diagnostics: IAutoMovieLoftContract.IDiagnostic[];
  }

  /**
   * Original mathematical inputs and scalar declarations, before a part, tree
   * view or loft is made.
   */
  export interface IControls {
    /** The unchanged generating inputs and canonical axis declaration. */
    readonly input: IAutoMovieHumanSectionSource;

    /** Actual engine frame mapping, separate from scalar chart coordinates. */
    readonly axis: IAutoMovieViewAxis.IAxis;

    /**
     * Full scalar knots/parameters needed by the existing global interpolation;
     * no complete neighbour is acquired.
     */
    readonly scalars: IAutoMovieLoftViewSource.IInput;

    /**
     * Explicit native scalar preparation, shared by contact consumers; its
     * physical2 refusal stays observable.
     */
    field(): IAutoMovieLoftViewSource.ISource;
  }

  /**
   * Explicitly shared frame preparation of the identical canonical axis
   * declaration.
   */
  export interface IFrame {
    /** Original immutable metre axis record, checked before reuse. */
    definition: IAutoMovieHumanSectionSource["axis"];

    /** Its actual calibration-mm engine frame, including available axis jets. */
    value: IAutoMovieViewAxis.IAxis;
  }
}
