import type { IAutoMovieRenderInventory } from "./IAutoMovieRenderInventory";
import type { IAutoMovieRenderReport } from "./IAutoMovieRenderReport";
import type { IAutoMovieRenderTarget } from "./IAutoMovieRenderTarget";
import type { IAutoMovieSemanticMask } from "./IAutoMovieSemanticMask";

/**
 * One caller-supplied shot's measured inventory and explicit budget assessment,
 * without proving an actual draw or automatic render-job gate.
 */
export interface IAutoMovieRenderBudgetAssessment {
  /** Compiled shot the measurement belongs to. */
  shot: string;

  /**
   * The verdict, including the two that are not a pass.
   *
   * `not-run` is this record's own: no report exists because no renderer
   * identity was supplied. A report's `incomplete` retains its measured
   * findings while one or more analyses have unresolved inputs or bounds;
   * neither state is clearance.
   */
  status: IAutoMovieRenderReport["status"] | "not-run";

  /** Why no report exists, or `null` when one does. */
  reason: string | null;

  /** The bounded verdict, or `null` when the assessment did not run. */
  report: IAutoMovieRenderReport | null;

  /** The measured cost, or `null` when the assessment did not run. */
  inventory: IAutoMovieRenderInventory | null;

  /** The palette the report's owners resolve in, or `null` as above. */
  mask: IAutoMovieSemanticMask | null;

  /** The sealed target, or `null` when the renderer was never identified. */
  target: IAutoMovieRenderTarget | null;
}
