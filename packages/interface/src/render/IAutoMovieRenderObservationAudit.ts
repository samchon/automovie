import type { AutoMovieRenderMetric } from "./AutoMovieRenderMetric.js";
import type { IAutoMovieRenderObservationBreach } from "./IAutoMovieRenderObservationBreach.js";

/**
 * Comparison of submitted-work observations with a declared report. auditAutoMovieRenderObservation returns agreement only when all observable metrics have numeric bounds and none exceeds them; unchecked names expose missing, invalid or duplicated bounds and unavailable/invalid observations.
 *
 * @evidence contracts/development/design.md#principled-representation Comparison of submitted-work observations with a declared report. auditAutoMovieRenderObservation returns agreement only when all observable metrics have numeric bounds and none exceeds them; unchecked names expose missing, invalid or duplicated bounds and unavailable/invalid observations.
 * @evidence contracts/development/design.md#minimal-and-owned-surface auditAutoMovieRenderObservation exchanges agrees, breaches, unchecked; their canonical owner is this contract and their concrete meanings are documented on the members.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Comparison of submitted-work observations with a declared report. auditAutoMovieRenderObservation returns agreement only when all observable metrics have numeric bounds and none exceeds them; unchecked names expose missing, invalid or duplicated bounds and unavailable/invalid observations.
 * @evidence contracts/development/common.md#meaningful-documentation Comparison of submitted-work observations with a declared report. auditAutoMovieRenderObservation returns agreement only when all observable metrics have numeric bounds and none exceeds them; unchecked names expose missing, invalid or duplicated bounds and unavailable/invalid observations. The prose and members document how auditAutoMovieRenderObservation interprets and admits these values.
 */
export interface IAutoMovieRenderObservationAudit {
  /** Whether every observable metric was measured and stayed inside its bound. */
  agrees: boolean;
  /** Every observed value above its report bound, in metric order. */
  breaches: IAutoMovieRenderObservationBreach[];
  /** Observable metrics with missing/invalid/duplicate report bounds or null/nonfinite/negative observations; meshes is not compared. */
  unchecked: AutoMovieRenderMetric[];
}
