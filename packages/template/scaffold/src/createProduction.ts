import * as THREE from "three";

/**
 * Create the production's scene and deterministic performance. Replace the empty
 * scene with authored assets; seek must fully place every displayed object.
 *
 * @evidence contracts/common.md#implementation-and-ownership The production owns scene content and exact-time placement; the shared Viewer owns display and Render owns capture. The empty starter has no authored story or motion.
 * @evidence contracts/common.md#authoring-interface Returns the scene, camera, exact-time seek and resource disposal. Seconds use the duration shared by src/durationSeconds.ts and render.config.ts.
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
