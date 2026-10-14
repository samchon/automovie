import { IAutoMovieVisualDeliveryLane } from "./IAutoMovieVisualDeliveryLane";
import { AutoMovieVisualDeliveryDiagnostic } from "./AutoMovieVisualDeliveryDiagnostic";

/**
 * Result of resolving every current occurrence to exactly one visual source.
 *
 * Success owns detached lane copies; any diagnostic makes segments empty. This record describes admitted metadata and neither writes mux bytes nor establishes fresh visual quality.
 *
 * @evidence contracts/common.md#principled-implementation Ordered detached sources escape only when every exact-population/source/observation/policy check succeeds; refusals publish no partial segment plan.
 * @evidence contracts/common.md#clear-and-simple-design Segments and diagnostic codes separate usable planning output from its refusal reasons, leaving mux effects outside the record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An empty refused plan is not a deterministic fallback or an observed visual qualification.
 * @evidence contracts/common.md#meaningful-documentation Members give success-copy ownership and empty-on-diagnostic behavior, with no media publication implied.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This result schema executes no lane clone, traversal or mux algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A result type implements no current-source cache or request coordinator.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The interface acquires no segment buffers or encoder handles; the planner/caller owns actual arrays.
 * @author Samchon
 */
export interface IAutoMovieVisualDeliveryPlan {
  /** Ordered occurrence sources a final mux consumes; empty when any diagnostic exists. */
  segments: IAutoMovieVisualDeliveryLane[];

  /** Exact-join refusals raised before any byte is written. */
  diagnostics: AutoMovieVisualDeliveryDiagnostic[];
}
