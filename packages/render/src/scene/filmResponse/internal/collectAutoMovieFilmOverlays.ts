import * as THREE from "three";

import { AutoMovieThreeKind } from "../../AutoMovieThreeKind.js";

/**
 * The drawn objects whose every material states a display colour (`toneMapped:
 * false`), each with its layer mask, so the film response stage draws them
 * after the response and leaves them out of the scene's linear light.
 */
export function collectAutoMovieFilmOverlays(
  scene: THREE.Scene,
): Map<THREE.Object3D, number> {
  const overlays: Map<THREE.Object3D, number> = new Map();
  scene.traverse((object: THREE.Object3D): void => {
    if (!AutoMovieThreeKind.isDrawn(object) || object.layers.mask === 0) return;
    const materials: THREE.Material[] = [object.material].flat();
    if (
      materials.length !== 0 &&
      materials.every(
        (entry: THREE.Material): boolean => entry.toneMapped === false,
      )
    )
      overlays.set(object, object.layers.mask);
  });
  return overlays;
}
