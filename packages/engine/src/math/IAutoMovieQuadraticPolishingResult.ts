/**
 * Original-coordinate candidate and actual residual-selected correction diagnostics.
 * The refinement owner alone admits the original full KKT. Rejected
 * candidates never replace the caller's preceding native primal or dual.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Preserves the original affine constraints and objective while preparing a numerical correction candidate.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Retains original coordinate and row authority; numerical factorization does not establish geometric validity.
 * @author Samchon
 */
export interface IAutoMovieQuadraticPolishingResult {
  /** Set only by the refinement owner's original full-row KKT admission. */
  accepted: boolean;

  /** Owned original primal candidate, never internal slack coordinates. */
  primal: number[];

  /** Original signed multipliers; approximate inactive duals need not be zero. */
  dual: number[];

  /** Actual started dual sweeps or working solves in the one correction budget. */
  iterations: number;

  /** Selected by independently measured original native residuals, never phase names. */
  method: "fixed-primal-dual" | "interval-joint";

  /** Actual started all-row dual sweeps; zero on the joint correction path. */
  dualPasses: number;

  /** Actual changed original multipliers in each started dual sweep. */
  dualUpdates: number[];

  /** Observed independent working constraint ranks, including refused attempts. */
  workingRanks: number[];

  /** Actual sign departures and original blocking endpoint additions. */
  workingChanges: string[];

  /** Original selected linear KKT infinity residual after each represented candidate. */
  linearResiduals: number[];

  /** Original full-row KKT merit of each represented working trial, not admission. */
  jointMerits: number[];

  /** Owned final joint trial primal, separate from the retained candidate. */
  trialPrimal?: number[];

  /** Owned final joint trial signed duals restored to original row ordinals. */
  trialDual?: number[];

  /** Original endpoint owners of selected exact groups, per working solve. */
  activeRows: number[][];

  /** Factorization-only shifts; no shift remains in original admission. */
  regularizations: number[];

  /** Actual feasible primal fractions, including zero-length blocking changes. */
  stepSizes: number[];

  /** Native and actual completed-sweep/joint-candidate original full-row KKT merits. */
  merits: number[];

  /** Actual merit damping evaluations; working-set correction performs none. */
  dampingEvaluations: number;

  /** Last numerical outcome, separate from the unchanged native status. */
  reason: string;
}
