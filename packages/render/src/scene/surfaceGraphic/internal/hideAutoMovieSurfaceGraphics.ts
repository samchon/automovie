import type * as THREE from "three";

import { AutoMovieRenderSurfaceGraphicKey } from "../../AutoMovieRenderSurfaceGraphicKey.js";

/*
 * Hide every currently visible surface graphic root in a scene and return the
 * restore that shows them again.
 *
 * The depth, normal, outline, pose and albedo passes leave surface graphics
 * out: the prop's own surface beneath already draws there, and a control
 * channel carries no lettering or overlay. Only roots that were visible are
 * hidden, so a key group that the per-frame applier hid stays hidden after
 * restore.
 */
export function hideAutoMovieSurfaceGraphics(scene: THREE.Scene): () => void {
  const hidden: THREE.Object3D[] = [];
  scene.traverse((object: THREE.Object3D): void => {
    if (
      object.userData[AutoMovieRenderSurfaceGraphicKey] === true &&
      object.visible
    ) {
      object.visible = false;
      hidden.push(object);
    }
  });
  return (): void => {
    for (const object of hidden) object.visible = true;
  };
}
