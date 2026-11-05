import * as THREE from "three";

/**
 * Create the production's scene and deterministic performance. Replace the empty
 * scene with authored assets; seek must fully place every displayed object.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Seek places every displayed object for an exact second and then updates world matrices, so playback, seeking and capture draw the same state; the starter scene holds no authored objects.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The production owns scene content and exact-time placement; the shared Viewer owns display and Render owns capture.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The starter contains no story, motion or special case; its camera and background are neutral defaults that authored work replaces.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states that seek must fully place every displayed object and that authored assets replace the empty scene; the returned fields are the scene, camera, seek and disposal.
 * @evidence contracts/development/implementation.md#efficient-algorithms Seek updates world matrices once per call, linear in the scene's object count; the starter scene is empty.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One scene and camera serve every seek; nothing is rebuilt per second.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The production owns the scene, camera and their resources; dispose clears the scene, and main.ts calls it on pagehide.
 */
export function createProduction(): {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  seek: (seconds: number) => void;
  dispose: () => void;
} {
  const scene: THREE.Scene = new THREE.Scene();
  scene.background = new THREE.Color(0x17202c);
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
    45,
    16 / 9,
    0.1,
    100,
  );
  camera.position.set(0, 1.5, 5);
  camera.lookAt(0, 1, 0);
  return {
    scene,
    camera,
    seek: (_seconds: number): void => {
      scene.updateMatrixWorld(true);
    },
    dispose: (): void => {
      scene.clear();
    },
  };
}
