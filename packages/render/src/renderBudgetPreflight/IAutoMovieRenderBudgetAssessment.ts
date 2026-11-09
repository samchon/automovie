import {
  IAutoMovieRenderInventory,
  IAutoMovieRenderReport,
  IAutoMovieRenderTarget,
  IAutoMovieSemanticMask,
} from "@automovie/interface";

/**
 * One caller-supplied shot's measured inventory and explicit budget assessment, without proving an actual draw or automatic render-job gate.
 *
 * @evidence contracts/development/design.md#principled-representation A shot assessment distinguishes not-run from a report's incomplete status and uses nullable inventory, mask and target fields when no renderer was identified.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This record keeps measurement, attribution and sealed target together for one compiled shot's budget decision.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Absent graphics identity is represented by not-run and a reason, not a fabricated renderer or empty passing report.
 * @evidence contracts/development/common.md#meaningful-documentation Members explain nullable state, the not-run versus incomplete distinction and how semantic owners resolve through the mask.
 */
export interface IAutoMovieRenderBudgetAssessment {
  /**
   * Compiled shot the measurement belongs to.
   */
  shot: string;

  /**
   * The verdict, including the two that are not a pass.
   *
   * `not-run` is this record's own: no report exists because no renderer identity was supplied. A report's `incomplete` retains its measured findings while one or more analyses have unresolved inputs or bounds; neither state is clearance.
   */
  status: IAutoMovieRenderReport["status"] | "not-run";

  /**
   * Why no report exists, or `null` when one does.
   */
  reason: string | null;

  /**
   * The bounded verdict, or `null` when the assessment did not run.
   */
  report: IAutoMovieRenderReport | null;

  /**
   * The measured cost, or `null` when the assessment did not run.
   */
  inventory: IAutoMovieRenderInventory | null;

  /**
   * The palette the report's owners resolve in, or `null` as above.
   */
  mask: IAutoMovieSemanticMask | null;

  /**
   * The sealed target, or `null` when the renderer was never identified.
   */
  target: IAutoMovieRenderTarget | null;
}
