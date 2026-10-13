/**
 * Measurable depth-buffer precision required by one perspective camera.
 *
 * The engine evaluates standard fixed-point perspective depth at the declared
 * minimum capability. A viewer may provide more bits, but never fewer, and may
 * not silently substitute logarithmic or reversed depth for this metric.
 *
 * @author Samchon
 */
export interface IAutoMovieCameraDepthPrecisionConstraint {
  /**
   * Minimum standard fixed-point depth-buffer bits the renderer must expose.
   * The resulting code count must remain an exact positive safe integer.
   */
  minimumDepthBits: number;

  /**
   * Greatest accepted adjacent eye-space depth step, in camera-space metres.
   * Exact equality passes.
   */
  maximumStepMeters: number;
}
