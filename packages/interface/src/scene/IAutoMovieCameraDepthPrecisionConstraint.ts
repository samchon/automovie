/**
 * Measurable depth-buffer precision required by one perspective camera.
 *
 * The engine evaluates standard fixed-point perspective depth at the declared minimum capability. A viewer may provide more bits, but never fewer, and may not silently substitute logarithmic or reversed depth for this metric.
 *
 * @evidence contracts/development/design.md#principled-representation Standard perspective reciprocal-depth mapping is evaluated at the declared minimum fixed-point bit count, comparing the worst adjacent eye-space step with an inclusive positive meter threshold.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Capability and accepted quantization error remain authored together while actual required subject depth range comes from compiled camera grading.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts More actual bits are permitted, fewer are refused, and logarithmic or reversed-depth implementations cannot masquerade as this standard metric.
 * @evidence contracts/development/common.md#meaningful-documentation Defines safe exact code-count premise, minimum bits, meter threshold and equality acceptance.
 */
export interface IAutoMovieCameraDepthPrecisionConstraint {
  /**
   * Minimum standard fixed-point depth-buffer bits the renderer must expose. The resulting code count must remain an exact positive safe integer.
   */
  minimumDepthBits: number;

  /**
   * Greatest accepted adjacent eye-space depth step, in camera-space metres. Exact equality passes.
   */
  maximumStepMeters: number;
}
