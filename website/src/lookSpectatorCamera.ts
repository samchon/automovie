/**
 * Collisionless spectator motion in metres, with Y as world up. Forward follows the current camera pitch; strafing follows its right axis. Translation moves eye and aim together, so an authored room view never becomes an orbit pivot. Normalized combined input travels at 8 m/s, or 2 m/s while walking. A delayed frame contributes at most 100 ms to avoid jumping after a background pause. Mouse look adopts the current authored quaternion on every input, removes roll and keeps pitch within 89 degrees. Wheel zoom changes only the lens.
 */
import * as THREE from "three";

/** Applies pointer deltas to the current camera orientation without roll, clamps pitch to 89 degrees, and keeps its world look target at the existing eye-to-target distance. */
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
