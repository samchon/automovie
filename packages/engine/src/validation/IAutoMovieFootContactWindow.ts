import { AutoMovieHumanoidBone } from "@automovie/interface";

/**
 * A declared planted-foot window for foot-skate validation.
 *
 * The window is explicit because stance phase is action semantics, not a fact
 * the generic motion validator can safely infer from geometry alone.
 *
 * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `IAutoMovieFootContactWindow` binds one foot identity, film interval, and slip tolerance to the contact declaration that can fail.
 * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `IAutoMovieFootContactWindow` defines the member path and temporal scope from which planted-foot samples are addressed.
 * @author Samchon
 */
export interface IAutoMovieFootContactWindow {
  /**
   * Foot bone that should stay planted through the window.
   *
   * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `bone` identifies the declared foot landmark whose world-space drift produced the skate warning.
   * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `bone` preserves the stable rig identity used to resolve every sample in this contact window.
   */
  bone: AutoMovieHumanoidBone;

  /**
   * Inclusive start time in seconds.
   *
   * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `start` marks the inclusive film-clock instant at which the named foot becomes planted.
   * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `start` supplies the lower temporal boundary checked before adjacent foot samples are compared.
   */
  start: number;

  /**
   * Inclusive end time in seconds.
   *
   * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `end` marks the inclusive film-clock instant at which the named foot may release its plant.
   * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `end` supplies the upper temporal boundary clamped to the motion's declared duration.
   */
  end: number;

  /**
   * Allowed horizontal speed in meters/second for this contact window.
   *
   * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `maxHorizontalSpeed` records the meter-per-second slip threshold used to judge this planted foot.
   * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `maxHorizontalSpeed` keeps the expected contact tolerance separate from the observed adjacent-sample speed.
   */
  maxHorizontalSpeed?: number;
}
