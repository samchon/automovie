import { IAutoMovieRenderInventory, IAutoMovieRenderReport, IAutoMovieRenderTarget, IAutoMovieSemanticMask } from "@automovie/interface";


/**
 * One shot's measured cost, checked against the budget the job targets.
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
   * `not-run` is this record's own: the report's `incomplete` says an analysis
   * had no input, and `not-run` says no report exists at all because the job
   * never learned what it draws with.
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
