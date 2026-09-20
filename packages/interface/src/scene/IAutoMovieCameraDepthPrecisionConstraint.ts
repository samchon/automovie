/**
 * Measurable depth-buffer precision required by one perspective camera.
 *
 * The engine evaluates standard fixed-point perspective depth at the declared
 * minimum capability. A viewer may provide more bits, but never fewer, and may
 * not silently substitute logarithmic or reversed depth for this metric.
 *
 * @evidence requirements/camera/clipping-occlusion-and-spatial-constraints.md#camera-clipping-range Exposes the minimum depth-buffer capability and accepted camera-space quantization step instead of relying on an undocumented clip-range default.
 * @evidence specifications/camera-light-and-visibility/visibility-and-image-space-observation.md#clv-clipping-clearance-evaluation Types the capability and metre-valued boundary consumed by the required-range depth precision report.
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
