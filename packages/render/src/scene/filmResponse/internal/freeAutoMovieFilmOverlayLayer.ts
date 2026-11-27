import * as THREE from "three";

/*
 * The highest layer bit neither the camera nor any object in the scene uses,
 * for the film response stage to draw the display overlays alone. Throws when
 * all 32 bits are in use.
 */
export function freeAutoMovieFilmOverlayLayer(
  scene: THREE.Scene,
  cameraMask: number,
): number {
  let used: number = cameraMask;
  scene.traverse((object: THREE.Object3D): void => {
    used |= object.layers.mask;
  });
  for (let bit: number = 31; bit >= 0; --bit)
    if ((used & (1 << bit)) === 0) return 1 << bit;
  throw new Error(
    "The film response stage needs one renderer layer that no object uses to draw display overlays",
  );
}
