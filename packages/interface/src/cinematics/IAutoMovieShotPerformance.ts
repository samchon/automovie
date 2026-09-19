/**
 * What one scene node does during a shot.
 *
 * @evidence requirements/camera/framing-and-shot-size.md#camera-framing-delivery-gate Exposes `IAutoMovieShotPerformance` as the portable data boundary for the camera framing delivery gate requirement.
 * @evidence specifications/camera-light-and-visibility/camera-state-projection-and-gate.md#clv-sensor-gate-delivery-mapping Types `IAutoMovieShotPerformance` for the clv sensor gate delivery mapping system contract.
 */
export interface IAutoMovieShotPerformance {
  /**
   * Id of the scene node performing.
   *
   * @evidence requirements/camera/framing-and-shot-size.md#camera-framing-delivery-gate Exposes `node` as the portable data boundary for the camera framing delivery gate requirement.
   * @evidence specifications/camera-light-and-visibility/camera-state-projection-and-gate.md#clv-sensor-gate-delivery-mapping Types `node` for the clv sensor gate delivery mapping system contract.
   */
  node: string;

  /**
   * Id of the motion clip it plays, or `null` to hold its pose.
   *
   * @evidence requirements/camera/framing-and-shot-size.md#camera-framing-delivery-gate Exposes `motion` as the portable data boundary for the camera framing delivery gate requirement.
   * @evidence specifications/camera-light-and-visibility/camera-state-projection-and-gate.md#clv-sensor-gate-delivery-mapping Types `motion` for the clv sensor gate delivery mapping system contract.
   */
  motion: string | null;

  /**
   * Seconds into the shot at which this performance begins.
   *
   * @evidence requirements/camera/framing-and-shot-size.md#camera-framing-delivery-gate Exposes `startOffset` as the portable data boundary for the camera framing delivery gate requirement.
   * @evidence specifications/camera-light-and-visibility/camera-state-projection-and-gate.md#clv-sensor-gate-delivery-mapping Types `startOffset` for the clv sensor gate delivery mapping system contract.
   */
  startOffset: number;
}
