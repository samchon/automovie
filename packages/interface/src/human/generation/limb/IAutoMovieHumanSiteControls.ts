import type { IAutoMovieLoftContract } from "../../../construction/IAutoMovieLoftContract";
import type { IAutoMovieLoftViewSource } from "../../../construction/IAutoMovieLoftViewSource";
import type { IAutoMovieViewAxis } from "../../../construction/IAutoMovieViewAxis";
import type { IAutoMovieViewSection } from "../../../construction/IAutoMovieViewSection";
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

    /** Exact independent tape solutions from this explicit preparation. */
    readonly tapes: readonly ITape[];
  }

  /** A tape's independent numeric declaration and original solver result. */
  export interface ITape {
    /** Same qualified site name used in the solver's diagnostics. */
    readonly name: string;

    /** Positive support distances in +u, +v, -u, -v order, calibration mm. */
    readonly extents: readonly [number, number, number, number];

    /** Requested circumference, calibration mm. */
    readonly girth: number;

    /** The solver's original section and diagnostics for this exact input. */
    readonly result: IAutoMovieViewSection.ISolved;
  }

  /** Exact scalar authority prepared over its declared physical station range. */
  export interface IField {
    /** Original scalar input identity for this admitted scope. */
    readonly scalars: IAutoMovieLoftViewSource.IInput;

    /** Admitted regional coefficients and available native derivatives. */
    readonly source: IAutoMovieLoftViewSource.ISource;
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
