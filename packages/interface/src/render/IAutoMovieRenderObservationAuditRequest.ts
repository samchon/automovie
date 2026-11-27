import type { IAutoMovieRenderObservation } from "./IAutoMovieRenderObservation";
import type { IAutoMovieRenderReport } from "./IAutoMovieRenderReport";

/**
 * A declared render-cost report paired with actual submitted-work observations.
 * AutoMovieRenderBudgetPreflight.auditObservation compares observable metrics only; a null
 * observation cannot establish agreement and no pixel quality or
 * released-memory claim follows.
 */
export interface IAutoMovieRenderObservationAuditRequest {
  /** The report that cleared the artifact. */
  report: IAutoMovieRenderReport;
  /** What the captured scene actually submits. */
  observed: IAutoMovieRenderObservation;
}
