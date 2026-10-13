/**
 * Collisionless spectator motion in metres, with Y as world up. Forward follows the current camera pitch; strafing follows its right axis. Translation moves eye and aim together, so an authored room view never becomes an orbit pivot. Normalized combined input travels at 8 m/s, or 2 m/s while walking. A delayed frame contributes at most 100 ms to avoid jumping after a background pause. Mouse look adopts the current authored quaternion on every input, removes roll and keeps pitch within 89 degrees. Wheel zoom changes only the lens.
 */
import * as THREE from "three";

/** Scales the vertical perspective lens by the wheel delta and clamps it to 5 through 110 degrees without moving the eye. */
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
