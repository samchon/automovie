/**
 * Collisionless spectator motion in metres, with Y as world up. Forward follows the current camera pitch; strafing follows its right axis. Translation moves eye and aim together, so an authored room view never becomes an orbit pivot. Normalized combined input travels at 8 m/s, or 2 m/s while walking. A delayed frame contributes at most 100 ms to avoid jumping after a background pause. Mouse look adopts the current authored quaternion on every input, removes roll and keeps pitch within 89 degrees. Wheel zoom changes only the lens.
 */
import * as THREE from "three";

/** Moves eye and aim together along normalized camera-relative input at 8 meters per second, or 2 while walking; a delayed frame contributes at most 100 milliseconds. */
export const moveSpectatorCamera: (camera: THREE.PerspectiveCamera, target: THREE.Vector3, axes: { forward: number; right: number; up: number; }, seconds: number, slow: boolean) => boolean = (
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
