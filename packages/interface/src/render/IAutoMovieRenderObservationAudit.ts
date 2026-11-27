import type { AutoMovieRenderMetric } from "./AutoMovieRenderMetric";
import type { IAutoMovieRenderObservationBreach } from "./IAutoMovieRenderObservationBreach";

/**
 * Comparison of submitted-work observations with a declared report.
 * AutoMovieRenderBudgetPreflight.auditObservation returns agreement only when all observable
 * metrics have numeric bounds and none exceeds them; unchecked names expose
 * missing, invalid or duplicated bounds and unavailable/invalid observations.
 */
export interface IAutoMovieRenderObservationAudit {
  /** Whether every observable metric was measured and stayed inside its bound. */
  agrees: boolean;
  /** Every observed value above its report bound, in metric order. */
  breaches: IAutoMovieRenderObservationBreach[];
  /**
   * Observable metrics with missing/invalid/duplicate report bounds or
   * null/nonfinite/negative observations; meshes is not compared.
   */
  unchecked: AutoMovieRenderMetric[];
}
