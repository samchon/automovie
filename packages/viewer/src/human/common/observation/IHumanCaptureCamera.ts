/**
 * A recorded perspective camera in the displayed metre-scale, Y-up frame.
 * Yaw and pitch locate its eye around the target without changing a model.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation Yaw/pitch in degrees, positive distance and metre target define spherical eye placement in the declared Y-up positive-Z frame. Finite values and a valid optional perspective field are runtime admission premises, not constraints enforced by this interface.
 * @evidence contracts/common.md#clear-and-simple-design One numerical camera record separates displayed capture framing from anatomy and native camera object allocation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Angles and distance describe actual recorded framing rather than a view-name or photographed-pose guess. Omitted fov selects the historical consumer's 28-degree convention, not a measured optical claim.
 * @evidence contracts/common.md#meaningful-documentation Each field gives units, sign/frame and optional fov meaning; the comment states eye placement changes display only.
 * @evidence contracts/performance.md#efficient-algorithms The fixed-size scalar/target record adds no traversal; humanCaptureCameraPosition performs constant trigonometric placement work.
 * @evidence contracts/performance.md#reuse-equivalent-work Matching camera records can describe matching framing only with the same source/model/renderer provenance. This type neither caches nor certifies equivalent images.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The record stores numerical values and a target tuple, with no native camera or image handle. The record consumer owns its retention.
 */
export interface IHumanCaptureCamera {
  /** Azimuth in degrees; zero faces the target from positive Z. */
  yaw: number;

  /** Elevation in degrees; positive places the eye above the target. */
  pitch: number;

  /** Positive eye-to-target distance in metres. */
  distance: number;

  /** Target position in displayed-world metres. */
  target: [number, number, number];

  /** Vertical field in degrees; the historical capture uses 28 when absent. */
  fov?: number;
}
