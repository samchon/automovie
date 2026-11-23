import type { IAutoMovieRecoveryChartFitPrepare } from "../../index";
import type { IAutoMovieRecoveryChartFit as IAutoMovieRecoveryChartFit_2 } from "./IAutoMovieRecoveryChartFit";

/** Assemble the same sparse weighted system and its bounded rank diagnostics. */

export namespace IAutoMovieRecoveryChartFitSystem {
  /** Assemble the same sparse weighted system and its bounded rank diagnostics. */

  export type Operation = (
    input: IAutoMovieRecoveryChartFit_2.Input,
    prepared: ReturnType<IAutoMovieRecoveryChartFitPrepare.Operation>,
  ) => {
    /**
     * Hessian diagonal in independent-control slot order, used for congruence
     * scaling.
     */
    diagonal: Float64Array;

    /**
     * Sparse symmetric Hessian rows; each entry stores a column index and its
     * numeric coefficient.
     */
    hessian: Map<number, number>[];

    /**
     * Assembled normalized right-hand-side values in the same unknown-slot
     * order as the Hessian.
     */
    rhs: Float64Array;

    /**
     * Largest assembled sparse observation stencil, including exact-zero
     * retained terms.
     */
    maximumRowTerms: number;

    /**
     * Actual number of signed physical-derivative rows included in the
     * objective.
     */
    physicalJetRows: number;

    /** Constant term of the assembled normalized least-squares objective. */
    leastSquaresConstant: number;

    /**
     * Observed admission failures and qualification limits in production order;
     * an empty array adds no extra certificate.
     */
    diagnostics: string[];

    /** Number of unknown controls with no positive observation-basis support. */
    unseen: number;

    /**
     * Rank of column-scaled twice-reorthogonalized data rows, or null when its
     * work budget is exceeded.
     */
    dataRowRank: number | null;

    /**
     * Smallest accepted over largest data-QR diagonal, or null when
     * unavailable; not a singular-value certificate.
     */
    dataQrDiagonalRatio: number | null;

    /**
     * Relative binary64 rank-admission threshold; this is not an exact rank
     * predicate.
     */
    rankTolerance: number;

    /**
     * Numerically observed Gram rank, or null when the explicit dense
     * diagnostic budget is exceeded.
     */
    observationRank: number | null;

    /**
     * Smallest accepted over largest Cholesky pivot, or null when unavailable;
     * not a condition number.
     */
    gramPivotRatio: number | null;
  };
}
