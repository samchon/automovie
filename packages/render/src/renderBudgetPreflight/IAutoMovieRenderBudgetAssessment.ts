import { IAutoMovieRenderInventory, IAutoMovieRenderReport, IAutoMovieRenderTarget, IAutoMovieSemanticMask } from "@automovie/interface";


/**
 * One caller-supplied shot's measured inventory and explicit budget assessment, without proving an actual draw or automatic render-job gate.
 *
 * @evidence contracts/common.md#principled-implementation A shot assessment distinguishes not-run from a report's incomplete status and uses nullable inventory, mask and target fields when no renderer was identified.
 * @evidence contracts/common.md#clear-and-simple-design This record keeps measurement, attribution and sealed target together for one compiled shot's budget decision.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Absent graphics identity is represented by not-run and a reason, not a fabricated renderer or empty passing report.
 * @evidence contracts/common.md#meaningful-documentation Members explain nullable state, the not-run versus incomplete distinction and how semantic owners resolve through the mask.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The per-shot assessment schema declares data and chooses no runtime algorithm; its producer documents construction cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The attributed measurement data describes an identity boundary and performs no request coordination or result caching.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The erased assessment type acquires no GPU; assessAutoMovieRenderBudget returns report/inventory/mask/target values whose lifetime belongs to the preflight caller.
 *
 * @author Samchon
 */
export interface IAutoMovieRenderBudgetAssessment {
  /**
   * Compiled shot the measurement belongs to.
   *
   * @author Samchon
   */
  shot: string;

  /**
   * The verdict, including the two that are not a pass.
   *
   * `not-run` is this record's own: no report exists because no renderer identity was supplied. A report's `incomplete` retains its measured findings while one or more analyses have unresolved inputs or bounds; neither state is clearance.
   *
   * @author Samchon
   */
  status: IAutoMovieRenderReport["status"] | "not-run";

  /**
   * Why no report exists, or `null` when one does.
   *
   * @author Samchon
   */
  reason: string | null;

  /**
   * The bounded verdict, or `null` when the assessment did not run.
   *
   * @author Samchon
   */
  report: IAutoMovieRenderReport | null;

  /**
   * The measured cost, or `null` when the assessment did not run.
   *
   * @author Samchon
   */
  inventory: IAutoMovieRenderInventory | null;

  /**
   * The palette the report's owners resolve in, or `null` as above.
   *
   * @author Samchon
   */
  mask: IAutoMovieSemanticMask | null;

  /**
   * The sealed target, or `null` when the renderer was never identified.
   *
   * @author Samchon
   */
  target: IAutoMovieRenderTarget | null;
}
