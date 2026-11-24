import * as THREE from "three";

import { AutoMovieSkinnedMesh } from "./AutoMovieSkinnedMesh.js";
import { AutoMovieThreeKind } from "./AutoMovieThreeKind.js";

/**
 * Start a new pose revision for every skinned mesh under `root`: their CPU
 * deformation and bounds recompute on the next query.
 *
 * Every writer of bones, morph influences or skin geometry calls this after
 * writing, so culling, shadows, framing and picking read the pose the shaders
 * draw rather than the one the bounds were last computed for. A foreign
 * `THREE.SkinnedMesh` gets the same treatment Three asks of an animated skin:
 * its bounds are cleared and recomputed when next read.
 *
 * @param root A built model's root, or any subtree containing skinned meshes.
 */
export function invalidateAutoMovieSkinnedPose(root: THREE.Object3D): void {
  root.traverse((object: THREE.Object3D): void => {
    if (AutoMovieThreeKind.isAutoMovieSkinnedMesh(object))
      object.invalidatePose();
    else if (AutoMovieThreeKind.isSkinnedMesh(object))
      AutoMovieSkinnedMesh.clearBounds(object);
  });
}
