import type { solveAutoMovieQuadraticProgram } from "@automovie/engine";
import type { IHumanBodyUnderwearLiftDerivativeFailure } from "./IHumanBodyUnderwearLiftDerivativeFailure";
import type { IHumanBodyUnderwearTrialFailure } from "./IHumanBodyUnderwearTrialFailure";
import type { IHumanBodyUnderwearSurfaceViolation } from "./IHumanBodyUnderwearSurfaceViolation";

/**
 * Raw actual fitting readings, separate from anatomical or rendered acceptance.
 *
 * @author Samchon
 */
export interface IHumanBodyUnderwearFitObservation {
  /** Zero-based native QP call within this component; all native objectives and actual trials spend one shared work bound. */
  round: number;

  /** Native objective: pure L1 feasibility, proximal L1 feasibility, or original feasible edge optimization. Historical feasibility-energy records may carry the retired cap. */
  phase: "feasibility" | "feasibility-energy" | "optimization";

  /** Positive dimensionless coefficient of the rho-normalized point/relative-edge step metric in this returned proximal call; absent for pure L1, ordinary Phase II and historical calls without this metric. */
  proximalCoefficient?: number;

  /** Original native status and iteration/residual values, without normalization. */
  status: number;

  /** Native solver iteration count for this actual restricted master or full Phase II program. */
  nativeIterations: number;

  /** Maximum original-coefficient row violation of this actual native program; dimensionless and distinct from the full separation readings. */
  nativeMaximumViolation: number;

  /** Raw native stationarity residual of that normalized QP, without a metre conversion. */
  nativeStationarityResidual: number;

  /** Maximum original envelope excess at this actual evaluated mesh, metres. */
  fieldResidualMetres: number;

  /** Existing representation-derived movement resolution, metres; no allowance. */
  resolutionMetres: number;

  /** Dimensionless half-sum of actual squared displacement differences divided by original edge lengths. */
  edgeObjective: number;

  /** Actual local geometry failures, whose absence is not a global certificate. */
  geometryViolations: readonly IHumanBodyUnderwearSurfaceViolation[];

  /** Actual dimensionless sum of positive field and unique lift-condition violations. */
  normalizedViolationSum: number;

  /** Raw sum of this native program's selected elastic primal values; neither the full L1 sum nor original geometric acceptance. */
  elasticSlackSum: number;

  /** Actual located derivative failures, without a frozen-normal substitute. */
  derivativeFailures: readonly IHumanBodyUnderwearLiftDerivativeFailure[];

  /** Owned native output, including unmodified primal/dual buffers and original solver residuals. */
  nativeResult: ReturnType<typeof solveAutoMovieQuadraticProgram>;

  /** Complete original unmet candidate conditions, carried once on a successful component's final native observation; failures carry the same history in the thrown result. */
  trialFailures?: readonly IHumanBodyUnderwearTrialFailure[];

  /** Compact native tail columns map to these original logical elastic groups, in order; their nonnegative rows follow the selected affine rows, with a historical cap last only when that old record carries one. */
  selectedElasticGroups?: readonly number[];

  /** Native nonlinear rows map to these original full affine row ordinals, after all original hard rows. */
  originalAffineRows?: readonly number[];

  /** Every original affine row excess at the returned native primal, in original order, including omitted and tied witnesses. */
  originalAffineExcesses?: readonly number[];

  /** Original logical group owning each full affine excess; selected-row indices do not replace this full correspondence. */
  originalElasticGroups?: readonly number[];

  /** Original hard edge and pin rows preceding selected nonlinear rows in the native program. */
  originalHardRows?: number;

  /** Historical full attained L1 cap of the retired internal tie-break; absent in current proximal restoration. */
  attainedElasticCap?: number;
}
