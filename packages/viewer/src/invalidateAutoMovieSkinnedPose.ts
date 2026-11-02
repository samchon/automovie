import * as THREE from "three";

import { AutoMovieSkinnedMesh } from "./AutoMovieSkinnedMesh.js";

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
 *
 * @evidence contracts/common.md#principled-implementation Calls AutoMovieSkinnedMesh.invalidatePose, or clears a foreign SkinnedMesh's boundingBox and boundingSphere, which Three's frustum, raycast and Box3 paths recompute when null.
 * @evidence contracts/common.md#clear-and-simple-design One revision step shared by applyPose, applyExpression, the Human rig pose and display geometry swaps.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Recomputes nothing eagerly and never disables culling.
 * @evidence contracts/common.md#meaningful-documentation States who calls it and the foreign-mesh behaviour.
 * @evidence contracts/performance.md#efficient-algorithms One traversal of the subtree with constant work per object.
 * @evidence contracts/performance.md#reuse-equivalent-work Meshes keep their allocated caches for the next evaluation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains nothing; only bound objects are released.
 */
export function invalidateAutoMovieSkinnedPose(root: THREE.Object3D): void {
  root.traverse((object: THREE.Object3D): void => {
    if (object instanceof AutoMovieSkinnedMesh) object.invalidatePose();
    else if (object instanceof THREE.SkinnedMesh)
      AutoMovieSkinnedMesh.clearBounds(object);
  });
}
