import type { IAutoMovieRenderObservation } from "./IAutoMovieRenderObservation.js";
import type { IAutoMovieRenderReport } from "./IAutoMovieRenderReport.js";

/**
 * A declared render-cost report paired with actual submitted-work observations. auditAutoMovieRenderObservation compares observable metrics only; a null observation cannot establish agreement and no pixel quality or released-memory claim follows.
 *
 * @evidence contracts/development/design.md#principled-representation A declared render-cost report paired with actual submitted-work observations. auditAutoMovieRenderObservation compares observable metrics only; a null observation cannot establish agreement and no pixel quality or released-memory claim follows.
 * @evidence contracts/development/design.md#minimal-and-owned-surface auditAutoMovieRenderObservation exchanges report, observed; their canonical owner is this contract and their concrete meanings are documented on the members.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A declared render-cost report paired with actual submitted-work observations. auditAutoMovieRenderObservation compares observable metrics only; a null observation cannot establish agreement and no pixel quality or released-memory claim follows.
 * @evidence contracts/development/common.md#meaningful-documentation A declared render-cost report paired with actual submitted-work observations. auditAutoMovieRenderObservation compares observable metrics only; a null observation cannot establish agreement and no pixel quality or released-memory claim follows. The prose and members document how auditAutoMovieRenderObservation interprets and admits these values.
 */
export interface IAutoMovieRenderObservationAuditRequest {
  /** The report that cleared the artifact. */
  report: IAutoMovieRenderReport;
  /** What the captured scene actually submits. */
  observed: IAutoMovieRenderObservation;
}
