import { IAutoMovieInteractionEvent, IAutoMovieValidation } from "@automovie/interface";
import { IAutoMovieCollisionResponse } from "../physics/IAutoMovieCollisionResponse";

/**
 * The outcome of an inter-body collision check: the `warning`/`error` envelope,
 * the `contact` interaction events for downstream/render, and a suggested
 * response at the deepest penetration (or `null`).
 *
 * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `IAutoMovieBodyCollisionResult` keeps collision diagnostics, contact events, and the deepest-contact response under one participant-pair outcome.
 * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `IAutoMovieBodyCollisionResult` separates invalid input, sampled contact scope, and optional correction data instead of conflating their effects.
 * @author Samchon
 */
export interface IAutoMovieBodyCollisionResult {
  /**
   * Warning-severity feedback (or an error for a bad sampleRate).
   *
   * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `validation` carries capsule-input errors and indexed contact-distance warnings at their discovered paths.
   * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `validation` preserves severity, expected overlap condition, penetration depth, and overshoot for the collision pair.
   */
  validation: IAutoMovieValidation;
  /**
   * Contact events on the shot clock: "one calculation, two consumers".
   *
   * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `events` records each contact's time, actor, target, and midpoint for downstream identification.
   * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `events` preserves the sampled temporal and subject scope even when physics intent suppresses advisory warnings.
   */
  events: IAutoMovieInteractionEvent[];
  /**
   * Suggested response at the deepest contact, or `null` when none applies.
   *
   * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `response` identifies the correction suggested for the single deepest sampled penetration.
   * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `response` remains null when no unsuppressed contact applies, keeping advisory scope distinct from event existence.
   */
  response: IAutoMovieCollisionResponse | null;
}
