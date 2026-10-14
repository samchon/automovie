/**
 * Collisionless spectator motion in metres, with Y as world up. Forward follows the current camera pitch; strafing follows its right axis. Translation moves eye and aim together, so an authored room view never becomes an orbit pivot. Normalized combined input travels at 8 m/s, or 2 m/s while walking. A delayed frame contributes at most 100 ms to avoid jumping after a background pause. Mouse look adopts the current authored quaternion on every input, removes roll and keeps pitch within 89 degrees. Wheel zoom changes only the lens.
 */
import * as THREE from "three";

/**
 * Scale a positive finite vertical perspective lens exponentially by a finite wheel delta and clamp it to 5 through 110 degrees without moving the eye. The delta uses the browser's supplied units without deltaMode normalization; NaN input is not rejected here.
 *
 * @evidence contracts/common.md#principled-implementation Exponential scaling composes proportional lens changes, followed by the spectator lens-range clamp and Three projection update; finite producer/browser inputs are premises, and extreme exponent overflow reaches the clamp endpoint for a positive lens.
 * @evidence contracts/common.md#clear-and-simple-design Lens mutation is separate from translation, pointer look and native wheel interception.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The fixed sensitivity and lens limits are shared interaction policy, with no production-specific camera rewrite or fixture lookup.
 * @evidence contracts/common.md#meaningful-documentation The comment gives angle limits, unchanged eye position, browser delta-unit behavior and numeric admission limits.
 * @evidence contracts/performance.md#efficient-algorithms One exponent, clamp and fixed perspective-matrix update cost constant time and storage per wheel event.
 * @evidence contracts/performance.md#reuse-equivalent-work The existing camera lens is updated in place from its current value; effects are not cached or replayed across wheel events.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No listener or GPU resource is acquired; temporary arithmetic values end with the call and the host owns the camera.
 */
export const zoomSpectatorCamera: (camera: THREE.PerspectiveCamera, deltaY: number) => void = (
  camera: THREE.PerspectiveCamera,
  deltaY: number,
): void => {
  camera.fov = THREE.MathUtils.clamp(
    camera.fov * Math.exp(deltaY * 0.001),
    5,
    110,
  );
  camera.updateProjectionMatrix();
};
