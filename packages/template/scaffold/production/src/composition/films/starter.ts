import * as THREE from "three";

import type { IFilm } from "../../IFilm";
import type { IFilmProduction } from "../../IFilmProduction";

/**
 * The empty starter film: a fifteen-second neutral scene. Replace it with one
 * film per film folder, each composing its scenes.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The comment states the starter's length and that each film folder replaces it with a film composing its scenes.
 * @evidence contracts/development/implementation.md#principled-implementation The film resolves a fresh scene and camera per mount without loading anything, and its seek updates world matrices for the requested second, so playback, seeking and capture draw the same state.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The film holds only its length and scene assembly; the Viewer entry owns display and the render owns capture.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The starter contains no story, motion or special case; its camera and background are neutral defaults.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each seek updates world matrices once, linear in the scene's object count, which is zero here.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One scene and camera serve every seek of a mount.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each mount owns its scene and camera, and dispose clears the scene when the Viewer page closes.
 */
export function starter(): IFilm {
  return {
    durationSeconds: 15,
    fps: 30,
    create: async (): Promise<IFilmProduction> => {
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
    },
  };
}
