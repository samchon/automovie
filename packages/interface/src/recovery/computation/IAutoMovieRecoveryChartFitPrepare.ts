import type {
  AutoMovieVector3Tuple,
  IAutoMovieRecoveryChartControlRelations,
} from "../../index";
import type { IAutoMovieRecoveryChartFit as IAutoMovieRecoveryChartFit_2 } from "./IAutoMovieRecoveryChartFit";

/** Admit and normalize one chart before sparse observation assembly. */

export namespace IAutoMovieRecoveryChartFitPrepare {
  /** Admit and normalize one chart before sparse observation assembly. */

  export type Operation = (input: IAutoMovieRecoveryChartFit_2.Input) => {
    /** Checks finite Cartesian coordinates without repairing or clamping values. */
    finite: (p: Readonly<AutoMovieVector3Tuple>) => boolean;

    /** Lower componentwise physical control bound in registered millimetres. */
    lower: Readonly<AutoMovieVector3Tuple>;

    /** Upper componentwise physical control bound in registered millimetres. */
    upper: Readonly<AutoMovieVector3Tuple>;

    /**
     * Physical millimetre origin subtracted from coefficient positions before
     * normalization.
     */
    origin: number[];

    /**
     * Positive common millimetre scale used to normalize the physical
     * coefficient box.
     */
    scale: number;

    /**
     * Original control index to independent solver slot; fixed or dependent
     * entries retain the owner's sentinel.
     */
    slots: Int32Array;

    /** Admitted ceiling on sparse stencil entries after affine substitution. */
    maximumRowBudget: number;

    /**
     * Admitted acyclic affine substitution, preserving fixed values and
     * independent control identities.
     */
    reduced: ReturnType<IAutoMovieRecoveryChartControlRelations.Operation>;

    /**
     * Number of independent vector controls after fixed and affine dependent
     * controls are eliminated.
     */
    unknowns: number;

    /**
     * Fixed affine contributions after subtracting the admitted origin and
     * dividing by the common scale.
     */
    normalizedConstants: Readonly<AutoMovieVector3Tuple>[];

    /**
     * Sum of positive observation weights used to normalize the assembled
     * objective.
     */
    totalWeight: number;

    /**
     * Evaluates the normalized cubic Bernstein basis at the supplied local
     * parameter.
     */
    basis: (t: number) => number[];
  };
}
