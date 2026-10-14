/**
 * Collisionless spectator motion in metres, with Y as world up. Forward follows the current camera pitch; strafing follows its right axis. Translation moves eye and aim together, so an authored room view never becomes an orbit pivot. Normalized combined input travels at 8 m/s, or 2 m/s while walking. A delayed frame contributes at most 100 ms to avoid jumping after a background pause. Mouse look adopts the current authored quaternion on every input, removes roll and keeps pitch within 89 degrees. Wheel zoom changes only the lens.
 */
import * as THREE from "three";

/**
 * Apply finite pointer deltas at 0.0025 radians per pixel to the current camera orientation without roll, clamp pitch to 89 degrees, and retain the eye-to-target distance with a 0.001 meter minimum. Camera orientation and coordinates must be finite; numeric admission remains with the host.
 *
 * @evidence contracts/common.md#principled-implementation YXZ Euler decomposition supports world-up yaw and clamped pitch; rebuilding the target along the resulting forward direction preserves the prior aim distance apart from the explicit coincident-target minimum and floating-point precision.
 * @evidence contracts/common.md#clear-and-simple-design Pointer look changes the existing camera and target only, independent of event capture, scene geometry and authored view selection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Sensitivity, pitch cap and coincident-target distance are uniform spectator policy rather than source-model offsets or expected-answer adjustments.
 * @evidence contracts/common.md#meaningful-documentation The comment states pointer sensitivity, pitch and distance limits, roll removal and finite-input premises.
 * @evidence contracts/performance.md#efficient-algorithms Fixed-size quaternion/Euler/vector calculations cost constant time and temporary storage per input.
 * @evidence contracts/performance.md#reuse-equivalent-work Every input reads the camera's current quaternion so a newly selected authored view is adopted immediately without stale orientation state.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary Euler/vector objects are call-local; the host retains camera and target and no native capture handle is acquired here.
 */
export const lookSpectatorCamera: (camera: THREE.PerspectiveCamera, target: THREE.Vector3, movementX: number, movementY: number) => void = (
  camera: THREE.PerspectiveCamera,
  target: THREE.Vector3,
  movementX: number,
  movementY: number,
): void => {
  const distance: number = Math.max(target.distanceTo(camera.position), 0.001);
  const orientation: THREE.Euler = new THREE.Euler().setFromQuaternion(
    camera.quaternion,
    "YXZ",
  );
  orientation.y -= movementX * 0.0025;
  orientation.x = THREE.MathUtils.clamp(
    orientation.x - movementY * 0.0025,
    -THREE.MathUtils.degToRad(89),
    THREE.MathUtils.degToRad(89),
  );
  orientation.z = 0;
  camera.up.set(0, 1, 0);
  camera.quaternion.setFromEuler(orientation);
  target
    .copy(camera.position)
    .addScaledVector(camera.getWorldDirection(new THREE.Vector3()), distance);
};
