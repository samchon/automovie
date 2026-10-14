/**
 * Collisionless spectator motion in metres, with Y as world up. Forward follows the current camera pitch; strafing follows its right axis. Translation moves eye and aim together, so an authored room view never becomes an orbit pivot. Normalized combined input travels at 8 m/s, or 2 m/s while walking. A delayed frame contributes at most 100 ms to avoid jumping after a background pause. Mouse look adopts the current authored quaternion on every input, removes roll and keeps pitch within 89 degrees. Wheel zoom changes only the lens.
 */
import * as THREE from "three";

/**
 * Move eye and aim together along normalized camera-relative input at 8 meters per second, or 2 while walking; clamp finite elapsed time to zero through 100 milliseconds. Camera orientation, axes and time must be finite; malformed numeric input is not admitted here. Return whether a translation was applied.
 *
 * @evidence contracts/common.md#principled-implementation Camera forward, rotated right and world up form the requested direction, normalized before speed scaling so diagonal inputs retain pace; translation preserves eye-to-target displacement within floating-point arithmetic.
 * @evidence contracts/common.md#clear-and-simple-design This pure input-to-camera operation contains no event or clock ownership; mountSpectatorControls supplies current axes and elapsed seconds.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The fixed speeds and pause cap are public spectator interaction policy applied uniformly, with no collision model or production-specific motion branch.
 * @evidence contracts/common.md#meaningful-documentation The comment states meter/second units, walking speed, finite-input premises, time clamp and the mutation result.
 * @evidence contracts/performance.md#efficient-algorithms A fixed number of vector operations and temporary vectors costs constant work per frame independent of scene complexity.
 * @evidence contracts/performance.md#reuse-equivalent-work Camera and target are mutated in place from current input; no stale orientation or per-building movement cache is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary vectors become unreachable after the call and borrowed camera/target ownership stays with the host; no tasks or handles are acquired.
 */
export const moveSpectatorCamera: (
  camera: THREE.PerspectiveCamera,
  target: THREE.Vector3,
  axes: { forward: number; right: number; up: number },
  seconds: number,
  slow: boolean,
) => boolean = (
  camera: THREE.PerspectiveCamera,
  target: THREE.Vector3,
  axes: { forward: number; right: number; up: number },
  seconds: number,
  slow: boolean,
): boolean => {
  const direction: THREE.Vector3 = camera
    .getWorldDirection(new THREE.Vector3())
    .multiplyScalar(axes.forward)
    .addScaledVector(
      new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion),
      axes.right,
    )
    .addScaledVector(new THREE.Vector3(0, 1, 0), axes.up);
  const delta: number = Math.min(Math.max(seconds, 0), 0.1);
  if (direction.lengthSq() === 0 || delta === 0) return false;
  direction.normalize().multiplyScalar((slow ? 2 : 8) * delta);
  camera.position.add(direction);
  target.add(direction);
  return true;
};
