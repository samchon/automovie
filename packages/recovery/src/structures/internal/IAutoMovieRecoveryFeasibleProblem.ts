import type { IAutoMovieRecoveryFeasibleModel } from "./IAutoMovieRecoveryFeasibleModel";
import type { IAutoMovieRecoveryUntiltedEstimate } from "./IAutoMovieRecoveryUntiltedEstimate";

/**
 * Fixed-population recovery objective with an owned retraction and exact gates.
 *
 * @evidence contracts/common.md#principled-implementation The actual objective, rank-qualified local metric and full nonlinear feasibility remain with the numerical owner; the controller chooses bounded directions and actual descent trials.
 * @evidence contracts/common.md#clear-and-simple-design Named callbacks let the same controller exercise independent analytic charts and the actual gauge-fixed camera chart, without expected answers or fitted-state replacement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retraction returns detached state, and an infeasible evaluation returns null rather than deleting a residual or clamping depth.
 * @evidence contracts/common.md#meaningful-documentation Members state immutable input, null feasibility, same-population cost and model/work ownership.
 * @evidence contracts/performance.md#efficient-algorithms The owning problem admits and charges evaluation, retraction and linearization costs, which differ between analytic and camera charts.
 * @evidence contracts/performance.md#reuse-equivalent-work A linearization is rebuilt only after accepted state changes; rejected backtracks reuse the current model and direction.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrowed callbacks and initial state live for one fit. Owners admit current/base/checkpoint retention and at most four detached comparison candidates beside their model before copying; unselected states expire and only the last feasible owned state returns.
 */
export interface IAutoMovieRecoveryFeasibleProblem<State> {
  /** Feasible initial state, borrowed without mutation. */
  initial: State;

  /**
   * Evaluate the actual fixed-population objective and all nonlinear gates.
   *
   * @evidence contracts/common.md#principled-implementation Same-population objective values define actual Armijo descent; any failed full gate returns null.
   * @evidence contracts/common.md#clear-and-simple-design The problem owns geometric meaning while the controller owns trial selection.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Failed measurements cannot be deleted or converted to zero residuals to produce a cost.
   * @evidence contracts/common.md#meaningful-documentation Borrows state; returns a finite actual cost or null for infeasibility, with unexpected errors propagated.
   * @evidence contracts/performance.md#efficient-algorithms The problem owner admits and charges evaluation work; the camera implementation includes complete projection and sum(k_point^2) parallax checks, while analytic charts evaluate their full residual arrays.
   * @evidence contracts/performance.md#reuse-equivalent-work Each actual trial is evaluated against the unchanged population; mutable-state-dependent answers are not cached across trials.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Call-local measurements expire on return; the borrowed state and observation ownership remain unchanged.
   */
  evaluate: (state: State) => number | null;

  /**
   * Build the current original-rank-qualified physical and metric model.
   *
   * @evidence contracts/common.md#principled-implementation The same state supplies objective/hard-constraint derivatives and an independently rank-qualified current metric.
   * @evidence contracts/common.md#clear-and-simple-design Model construction keeps camera algebra and generic direction selection with their respective owners.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Hard-constraint rows remain unweighted and damping or constraints cannot provide data rank.
   * @evidence contracts/common.md#meaningful-documentation Borrows state and transfers a model in the current physical tangent coordinates; numerical admission failures propagate.
   * @evidence contracts/performance.md#efficient-algorithms The problem admits and charges model costs; the camera owner includes QR/SVD, whitening and sparse ownership scans. Explicit lagged curvature separately admits/charges its local E derivatives, point/Schur factor and all fixed-row whitening on existing models, while analytic identity charts use direct authored derivatives.
   * @evidence contracts/performance.md#reuse-equivalent-work Rejected backtracks reuse this model; accepted state changes require fresh derivatives, weights and factors.
   * @evidence contracts/performance.md#bound-retention-and-release-resources One model's owned rows and factor closures transfer and expire when replaced; no cross-fit cache or image is retained by this callback contract.
   */
  linearize: (state: State) => IAutoMovieRecoveryFeasibleModel;

  /**
   * Produce a detached actual trial using the current physical tangent step.
   *
   * @evidence contracts/common.md#principled-implementation The camera implementation uses SO3, seed-translation sphere and Euclidean updates matching its derivatives; analytic charts use their authored Euclidean coordinates.
   * @evidence contracts/common.md#clear-and-simple-design The problem supplies its chart while the controller owns step length and actual acceptance.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Retraction preserves every observation and cannot replace the initial state or normalize later translation baselines.
   * @evidence contracts/common.md#meaningful-documentation Borrows state/step and returns a detached trial; feasibility is checked separately by evaluate.
   * @evidence contracts/performance.md#efficient-algorithms The camera owner charges O(V+L+E) detached-state copying and chart updates; analytic charts copy their finite coordinate vector.
   * @evidence contracts/performance.md#reuse-equivalent-work The unchanged current state/model is reused for halved trial steps without refitting observations.
   * @evidence contracts/performance.md#bound-retention-and-release-resources At most four detached same-base candidates coexist with the current and borrowed checkpoint states; the owner admits this peak before allocation. Only one selected trial becomes current, with borrowed inputs unchanged.
   */
  retract: (state: State, step: readonly number[]) => State;

  /**
   * Measure selected original inequalities at one actual failed full trial.
   *
   * @evidence contracts/common.md#principled-implementation Same-order raw g values supply a current-base curvature correction; projection must remain meaningful beyond the pixel gate.
   * @evidence contracts/common.md#clear-and-simple-design This optional owner action measures geometry only; working factors, actual trials and normal termination have separate owners.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No clamped residual, deleted selected row, invented depth or trial-pose Jacobian replaces actual original constraints.
   * @evidence contracts/common.md#meaningful-documentation Borrows trial and increasing original row IDs excluding objective zero; returns owned raw g values or null when measurement is unsupported.
   * @evidence contracts/performance.md#efficient-algorithms The camera owner precharges O(E+n+H) traversal and selected projection; this action runs at most once per current direction model.
   * @evidence contracts/performance.md#reuse-equivalent-work Fixed observation order and calibration are reused without extracting, matching, relinearizing or refactoring at the trial.
   * @evidence contracts/performance.md#bound-retention-and-release-resources At most H scalars transfer for one correction; no rejected geometry or measurement history is cached.
   */
  constraintValues?: (state: State, rows: readonly number[]) => number[] | null;

  /** Explicitly request a charged borrowed untilted estimate on selected updates; true requires accepted. Absence retains the four-argument reaction and no wrapper work. */
  requestUntiltedEstimate?: boolean;

  /**
   * Notify the owner once about a selected qualified local update.
   *
   * @evidence contracts/common.md#principled-implementation The callback receives the unchanged base, exact actual chart increment and same-population old/new costs before the controller changes state; it may prepare only the next existing model.
   * @evidence contracts/common.md#clear-and-simple-design Optional owner reactions keep objective-specific design and metric policy outside generic trial ordering and normal certification.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Qualified unselected candidates, refusals and initial KKT do not notify. Unexpected errors propagate without committing a substitute baseline or refunding consumed trials.
   * @evidence contracts/common.md#meaningful-documentation Base and increment are borrowed immutable for this call; costs belong to the chosen actual evaluation. Only an explicit request supplies the optional fifth argument: a current qualified affine estimate or null. Its readonly arrays are borrowed for this call and require a separately admitted owned copy. This local selection is neither normal convergence nor checkpoint acceptance.
   * @evidence contracts/performance.md#efficient-algorithms Requested selected reactions add32 prepaid generic visits for one fixed wrapper or null, included in directionWork; absent requests retain the four-argument call and no wrapper charge. The owner separately admits and charges validation/copy and agreement before scans; camera agreement uses one O(E*(C+3)+n+L) undamped current-design action and no extra model or trial.
   * @evidence contracts/performance.md#reuse-equivalent-work The current model and exact chosen increment are reused without geometry evaluation, pose differencing, trial reweighting or factorization.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The callback does not retain borrowed increment, base, wrapper or dual arrays. Owner design references are released after reacting; independently admitted owned dual copies may prepare the next existing model and expire within this fit.
   */
  accepted?: (
    base: State,
    increment: readonly number[],
    oldCost: number,
    newCost: number,
    estimate?: IAutoMovieRecoveryUntiltedEstimate | null,
  ) => void;
}
