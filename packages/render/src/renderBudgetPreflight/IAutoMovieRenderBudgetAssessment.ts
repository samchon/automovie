import { IAutoMovieRenderInventory, IAutoMovieRenderReport, IAutoMovieRenderTarget, IAutoMovieSemanticMask } from "@automovie/interface";


/**
 * One shot's measured cost, checked against the budget the job targets.
 *
 * @evidence requirements/rendering/budgets.md#rendering-budget-decision `IAutoMovieRenderBudgetAssessment` carries the conservative measurement basis and deterministic budget decision.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight `IAutoMovieRenderBudgetAssessment` exposes that responsibility through the package-independent system contract.
 * @author Samchon
 */
export interface IAutoMovieRenderBudgetAssessment {
  /**
   * Compiled shot the measurement belongs to.
   *
   * @evidence requirements/rendering/budgets.md#rendering-budget-decision `IAutoMovieRenderBudgetAssessment.shot` carries the conservative measurement basis and deterministic budget decision.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight `IAutoMovieRenderBudgetAssessment.shot` exposes that responsibility through the package-independent system contract.
   * @author Samchon
   */
  shot: string;

  /**
   * The verdict, including the two that are not a pass.
   *
   * `not-run` is this record's own: the report's `incomplete` says an analysis
   * had no input, and `not-run` says no report exists at all because the job
   * never learned what it draws with.
   *
   * @evidence requirements/rendering/budgets.md#rendering-budget-decision `IAutoMovieRenderBudgetAssessment.status` carries the conservative measurement basis and deterministic budget decision.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight `IAutoMovieRenderBudgetAssessment.status` exposes that responsibility through the package-independent system contract.
   * @author Samchon
   */
  status: IAutoMovieRenderReport["status"] | "not-run";

  /**
   * Why no report exists, or `null` when one does.
   *
   * @evidence requirements/rendering/budgets.md#rendering-budget-decision `IAutoMovieRenderBudgetAssessment.reason` carries the conservative measurement basis and deterministic budget decision.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight `IAutoMovieRenderBudgetAssessment.reason` exposes that responsibility through the package-independent system contract.
   * @author Samchon
   */
  reason: string | null;

  /**
   * The bounded verdict, or `null` when the assessment did not run.
   *
   * @evidence requirements/rendering/budgets.md#rendering-budget-decision `IAutoMovieRenderBudgetAssessment.report` carries the conservative measurement basis and deterministic budget decision.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight `IAutoMovieRenderBudgetAssessment.report` exposes that responsibility through the package-independent system contract.
   * @author Samchon
   */
  report: IAutoMovieRenderReport | null;

  /**
   * The measured cost, or `null` when the assessment did not run.
   *
   * @evidence requirements/rendering/budgets.md#rendering-budget-decision `IAutoMovieRenderBudgetAssessment.inventory` carries the conservative measurement basis and deterministic budget decision.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight `IAutoMovieRenderBudgetAssessment.inventory` exposes that responsibility through the package-independent system contract.
   * @author Samchon
   */
  inventory: IAutoMovieRenderInventory | null;

  /**
   * The palette the report's owners resolve in, or `null` as above.
   *
   * @evidence requirements/rendering/budgets.md#rendering-budget-decision `IAutoMovieRenderBudgetAssessment.mask` carries the conservative measurement basis and deterministic budget decision.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight `IAutoMovieRenderBudgetAssessment.mask` exposes that responsibility through the package-independent system contract.
   * @author Samchon
   */
  mask: IAutoMovieSemanticMask | null;

  /**
   * The sealed target, or `null` when the renderer was never identified.
   *
   * @evidence requirements/rendering/budgets.md#rendering-budget-decision `IAutoMovieRenderBudgetAssessment.target` carries the conservative measurement basis and deterministic budget decision.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight `IAutoMovieRenderBudgetAssessment.target` exposes that responsibility through the package-independent system contract.
   * @author Samchon
   */
  target: IAutoMovieRenderTarget | null;
}
