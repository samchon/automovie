import type { IAutoMovieRecoveryChartFitPrepare } from "..";
import type { IAutoMovieRecoveryChartFit as IAutoMovieRecoveryChartFit_2 } from "./IAutoMovieRecoveryChartFit";

/**
 * Callable assembly of the reduced chart objective and original-data rank
 * diagnostics.
 */

export namespace IAutoMovieRecoveryChartFitSystem {
  /**
   * Stream weighted position and optional derivative rows, expand their
   * independent terms under the stencil cap, and accumulate a sparse normalized
   * Gram system. Record unseen controls and both rank diagnostics when their
   * independent work limits permit.
   */

  export type Operation = (
    input: IAutoMovieRecoveryChartFit_2.Input,
    prepared: ReturnType<IAutoMovieRecoveryChartFitPrepare.Operation>,
  ) => {
    /** Original normalized Gram diagonal in independent slot order. */
    diagonal: Float64Array;

    /** Symmetric sparse normalized Gram maps in independent slot order. */
    hessian: Map<number, number>[];

    /** Normalized right-hand values interleaved by control and coordinate. */
    rhs: Float64Array;

    /** Largest stored reduced row address population before its work cap. */
    maximumRowTerms: number;

    /** Actual derivative rows used during assembly. */
    physicalJetRows: number;

    /** Constant term of the weighted normalized least-squares objective. */
    leastSquaresConstant: number;

    /** Assembly rank and population findings carried to the final report. */
    diagnostics: string[];

    /** Count of independent controls with exact zero Gram diagonal. */
    unseen: number;

    /** Data-row factorization rank, or null at its work limits. */
    dataRowRank: number | null;

    /**
     * Smallest accepted data-row diagonal relative to the observed largest,
     * when available.
     */
    dataQrDiagonalRatio: number | null;

    /** Relative floor for numerical Gram pivots. */
    rankTolerance: number;

    /** Gram pivot rank, or null at the dense diagnostic limit. */
    observationRank: number | null;

    /** Smallest accepted to largest Gram pivot ratio, when available. */
    gramPivotRatio: number | null;
  };
}
