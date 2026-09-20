import { IAutoMovieInteractionEvent, IAutoMovieValidation } from "@automovie/interface";
import { IAutoMovieToppling } from "./IAutoMovieToppling";

/**
 * The outcome of a support check: the `warning` envelope, the `fall`
 * interaction event(s), and a suggested topple (or `null` when stably
 * supported).
 *
 * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `IAutoMovieSupportResult` keeps the support diagnostic, fall event, and topple suggestion attached to one center-and-contact evaluation.
 * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `IAutoMovieSupportResult` separates validation outcome, downstream event scope, and optional physical advice for the subject.
 * @author Samchon
 */
export interface IAutoMovieSupportResult {
  /**
   * Warning-severity feedback (or an error for bad input).
   *
   * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `validation` locates invalid margin or support inputs and the overhang warning at the caller's support root.
   * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `validation` preserves severity, expected hull margin, observed distance, and excess for the support decision.
   */
  validation: IAutoMovieValidation;
  /**
   * Fall events on the shot clock: "one calculation, two consumers".
   *
   * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `events` names the unsupported node in the fall event produced by the same support calculation.
   * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `events` retains subject scope even when physics intent suppresses warnings and topple advice.
   */
  events: IAutoMovieInteractionEvent[];
  /**
   * Suggested topple, or `null` when supported.
   *
   * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `toppling` identifies the suggested pivot and direction only for an unsuppressed overhang.
   * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `toppling` remains null for stable or intentionally unphysical support, limiting advice to the invalid relation.
   */
  toppling: IAutoMovieToppling | null;
}
