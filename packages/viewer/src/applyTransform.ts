import type { IAutoMovieTransform } from "@automovie/interface";
import type * as THREE from "three";

/**
 * Apply a automovie TRS transform onto a `three.js` object.
 *
 * @evidence requirements/rendering/geometry-visibility-and-culling.md#rendering-hierarchical-transforms Keeps this model surface in the compiled transform hierarchy.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-visibility-culling Materializes the same hierarchy for render visibility and culling.
 */
export const applyTransform = (
  obj: THREE.Object3D,
  t: IAutoMovieTransform,
): void => {
  obj.position.set(t.translation.x, t.translation.y, t.translation.z);
  obj.quaternion.set(t.rotation.x, t.rotation.y, t.rotation.z, t.rotation.w);
  obj.scale.set(t.scale.x, t.scale.y, t.scale.z);
};
