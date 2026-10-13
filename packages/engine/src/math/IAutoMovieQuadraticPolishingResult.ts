/**
 * One polishing attempt on a solved quadratic program and its diagnostics, as
 * `polishAutoMovieQuadraticProgram` returns it inside a refinement result.
 *
 * Polishing takes one of two methods, chosen by whether the native primal
 * already satisfies feasibility and complementarity on every original row:
 * if so, it keeps that primal and sweeps the signed multipliers toward
 * stationarity; otherwise it runs active-set steps on exact interval groups.
 * Every step counts against the caller's one `maximumRefinements` budget.
 * `primal` and `dual` are only a candidate: `refineAutoMovieQuadraticProgram`
 * remeasures every original row and alone sets `accepted`, and a rejected
 * candidate never replaces the native solution. Arrays are new and owned by
 * the caller.
 *
 * @evidence contracts/common.md#principled-implementation Records coordinate-wise dual correction for a fixed feasible primal and active-set working steps with blocking constraints, the two corrections the producer runs; admission is a separate full-row KKT measurement by the refinement owner, so nothing here certifies the candidate.
 * @evidence contracts/common.md#clear-and-simple-design One record for both methods, carrying the candidate, the method chosen, and per-step traces a failed solve's error message prints; fields of the method not taken stay empty or zero.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The method is chosen by measured residuals, never by a problem's phase or a particular row, and `accepted` can only be set by the independent admission.
 * @evidence contracts/common.md#meaningful-documentation States how the method is chosen, the shared budget, that the values are an unadmitted candidate, who admits them, and ownership; each field states its unit and which method fills it.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A result record with no algorithm; the correction cost is answered on `polishAutoMovieQuadraticProgram`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A per-call result that coordinates no work across calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owned by the caller; each trace grows by at most two entries per started step, so every trace is linear in `maximumRefinements`, and `activeRows` holds at most one working-row list per step; nothing else is retained.
 * @author Samchon
 */
export interface IAutoMovieQuadraticPolishingResult {
  /** Whether the refinement's full-row admission adopted the candidate. */
  accepted: boolean;

  /**
   * Candidate primal in the program's variables: the native primal, or a
   * working-set point whose full-row merit reached the tolerance.
   */
  primal: number[];

  /**
   * Candidate multipliers in original row order, signed so a positive value
   * presses on the upper endpoint and a negative one on the lower endpoint.
   */
  dual: number[];

  /** Steps started, dual sweeps or working solves; at most the budget. */
  iterations: number;

  /**
   * `"fixed-primal-dual"` when the native primal was already feasible and
   * complementary, `"interval-joint"` otherwise.
   */
  method: "fixed-primal-dual" | "interval-joint";

  /** Dual sweeps started; zero for `"interval-joint"`. */
  dualPasses: number;

  /** Multipliers changed in each dual sweep. */
  dualUpdates: number[];

  /** Rank of the working basis at each working solve, including refused ones. */
  workingRanks: number[];

  /**
   * Working-set changes in order, `leave-wrong-sign:<row>` or
   * `enter-blocking:<row>` with the original row number.
   */
  workingChanges: string[];

  /**
   * Largest of the stationarity residual and the working-equation residual
   * after each working step that produced multipliers.
   */
  linearResiduals: number[];

  /** Full-row KKT merit of each working candidate measured, in order. */
  jointMerits: number[];

  /** Last working-set trial primal; absent when no working step started. */
  trialPrimal?: number[];

  /** Multipliers paired with `trialPrimal`; absent likewise. */
  trialDual?: number[];

  /** Original row numbers of the working equations at each working solve. */
  activeRows: number[][];

  /** Fraction of each taken step, 1 for a full step and less when blocked. */
  stepSizes: number[];

  /**
   * Full-row KKT merit of the native point, then after each dual sweep or of
   * the working candidate that reached the tolerance.
   */
  merits: number[];

  /** Why polishing stopped, as a sentence or a kebab-case refusal code. */
  reason: string;
}
