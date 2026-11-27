import type * as THREE from "three";

import { AutoMovieRenderThreeKind } from "../AutoMovieRenderThreeKind.js";

/*
 * Invalidate unique scene materials after the effective shadow enablement or
 * filter changes. Three's program keys include shadow state, but changing the
 * renderer flag alone does not always reevaluate an existing material program.
 * The public needsUpdate boundary makes that changed state observable without
 * touching SDK methods or caches. Shared materials are marked only once.
 */
export const invalidateAutoMovieSceneShadowPrograms: (
  scene: THREE.Scene,
) => void = (scene: THREE.Scene): void => {
  const materials: Set<THREE.Material> = new Set();
  if (scene.overrideMaterial !== null) materials.add(scene.overrideMaterial);
  scene.traverse((object: THREE.Object3D): void => {
    // Every drawable that carries materials: meshes, lines, points, sprites.
    if (
      AutoMovieRenderThreeKind.isMesh(object) ||
      AutoMovieRenderThreeKind.isLine(object) ||
      AutoMovieRenderThreeKind.isPoints(object)
    )
      for (const value of [object.material].flat()) materials.add(value);
    else if (AutoMovieRenderThreeKind.isSprite(object))
      materials.add(object.material);
  });
  for (const material of materials) material.needsUpdate = true;
};
