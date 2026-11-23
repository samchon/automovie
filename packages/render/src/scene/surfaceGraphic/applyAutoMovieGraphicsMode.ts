import * as THREE from "three";

import type { IAutoMovieRenderModeHandle } from "../IAutoMovieRenderModeHandle.js";
import { AUTOMOVIE_SURFACE_GRAPHIC_KEY } from "./AUTOMOVIE_SURFACE_GRAPHIC_KEY.js";

/**
 * The `graphics` pass: surface graphics alone, drawn exactly as the beauty pass
 * draws them, over a transparent background.
 *
 * Every mesh outside a surface graphic root takes a material that writes depth
 * but no colour, so a body, a prop's case or a flame in front of a screen still
 * hides it; the graphics keep their own materials, exposure, tone curve and
 * fog. The scene's background is removed, so with a clear alpha of 0 a pixel's
 * alpha is the graphics' coverage. Because graphic materials blend colour by
 * alpha onto a transparent clear, the stored colour is associated with alpha,
 * which the capture divides back into straight colour. The restore puts back
 * every material and the background.
 */
export function applyAutoMovieGraphicsMode(
  scene: THREE.Scene,
): IAutoMovieRenderModeHandle {
  const background: THREE.Scene["background"] = scene.background;
  scene.background = null;
  const graphics: Set<THREE.Object3D> = new Set();
  scene.traverse((object: THREE.Object3D): void => {
    if (object.userData[AUTOMOVIE_SURFACE_GRAPHIC_KEY] === true)
      object.traverse((descendant: THREE.Object3D): void => {
        graphics.add(descendant);
      });
  });

  const holdout: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({
    colorWrite: false,
  });
  const swaps: {
    mesh: THREE.Mesh;
    material: THREE.Material | THREE.Material[];
  }[] = [];
  scene.traverse((object: THREE.Object3D): void => {
    if ((object as THREE.Mesh).isMesh !== true || graphics.has(object)) return;
    const mesh: THREE.Mesh = object as THREE.Mesh;
    swaps.push({ mesh, material: mesh.material });
    mesh.material = holdout;
  });
  return {
    mode: "graphics",
    semantic: null,
    restore: (): void => {
      for (const { mesh, material } of swaps) mesh.material = material;
      holdout.dispose();
      scene.background = background;
    },
  };
}
