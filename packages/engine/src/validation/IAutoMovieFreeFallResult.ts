import { IAutoMovieClip, IAutoMovieInteractionEvent, IAutoMovieValidation } from "@automovie/interface";

/**
 * The outcome of a gravity-expectation check: the `warning` envelope, the
 * `fall` interaction event(s), and a suggested fall trajectory (or `null`).
 *
 * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `IAutoMovieFreeFallResult` keeps the support finding, fall event, and suggested arc attached to one evaluated body state.
 * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `IAutoMovieFreeFallResult` separates invalid input, temporal event scope, and optional trajectory output in the gravity check.
 * @author Samchon
 */
export interface IAutoMovieFreeFallResult {
  /**
   * Warning-severity feedback (or an error for bad input).
   *
   * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `validation` locates malformed gravity or body inputs and the unsupported-state warning at their supplied root.
   * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `validation` preserves severity and expected support condition independently from the generated fall data.
   */
  validation: IAutoMovieValidation;
  /**
   * Fall events on the shot clock: "one calculation, two consumers".
   *
   * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `events` identifies the falling node at the evaluated shot-clock time for downstream consumers.
   * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `events` retains subject and temporal scope even when an authored physics intent suppresses advisory output.
   */
  events: IAutoMovieInteractionEvent[];
  /**
   * Suggested free-fall arc from this frame, or `null` when not expected to
   * fall.
   *
   * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `trajectory` records the suggested arc for the body and instant found to be unsupported.
   * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `trajectory` remains null outside the diagnosed fall state, bounding the correction to the affected sample.
   */
  trajectory: IAutoMovieClip | null;
}
