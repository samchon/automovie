import type {
  AutoMovieVector3Tuple,
  IAutoMovieRecoveryChartControlRelations,
} from "..";
import type { IAutoMovieRecoveryChartFit as IAutoMovieRecoveryChartFit_2 } from "./IAutoMovieRecoveryChartFit";

/** Callable preparation of one constrained chart fit in normalized coordinates. */

export namespace IAutoMovieRecoveryChartFitPrepare {
  /**
   * Prepare the physical enclosure, finite control registry and reduced affine
   * identities. Use the enclosure midpoint and its largest extent to normalize
   * positions. Assign one slot per independent control and choose the reduced
   * row cap before assembly.
   */

  export type Operation = (input: IAutoMovieRecoveryChartFit_2.Input) => {
    /** Dense finite XYZ check used by observation, warm-start and report stages. */
    finite: (p: Readonly<AutoMovieVector3Tuple>) => boolean;

    /** Original lower physical control bound in millimetres. */
    lower: Readonly<AutoMovieVector3Tuple>;

    /** Original upper physical control bound in millimetres. */
    upper: Readonly<AutoMovieVector3Tuple>;

    /** Registered physical midpoint used as the normalization origin. */
    origin: number[];

    /**
     * Common millimetre normalization length derived from the largest enclosure
     * extent.
     */
    scale: number;

    /** Original-to-independent slot mapping, with -1 for eliminated controls. */
    slots: Int32Array;

    /**
     * Maximum reduced observation stencil size under the admitted relation
     * policy.
     */
    maximumRowBudget: number;

    /**
     * Prepared fixed and independent affine expressions in original registry
     * order.
     */
    reduced: ReturnType<IAutoMovieRecoveryChartControlRelations.Operation>;

    /** Number of independent three-axis control slots. */
    unknowns: number;

    /**
     * Affine constants adjusted by physical origin, coordinate scale and
     * surviving independent weight mass.
     */
    normalizedConstants: Readonly<AutoMovieVector3Tuple>[];

    /** Sum of original positive observation weights before normalized assembly. */
    totalWeight: number;

    /** Local cubic Bernstein basis evaluator used by residual measurement. */
    basis: (t: number) => number[];
  };
}
