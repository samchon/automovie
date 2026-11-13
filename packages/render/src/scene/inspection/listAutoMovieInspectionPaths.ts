import * as THREE from "three";

import type { IAutoMovieInspectionPath } from "./IAutoMovieInspectionPath.js";
import { autoMovieInspectionPathOf } from "./autoMovieInspectionPathOf.js";

/**
 * List every object of a scene that three.js draws, each with its inspection path, in traversal order.
 *
 * Meshes, lines, points and sprites are listed whether or not they are visible, because a path names a part of the scene, not a state of it. Groups, bones, lights and cameras are not listed; their names appear as segments of the paths beneath them.
 *
 * ```ts
 * for (const { path } of listAutoMovieInspectionPaths(scene)) console.log(path);
 * ```
 *
 * @evidence contracts/development/common.md#meaningful-documentation States which objects are listed, that visibility does not filter them, where the other objects' names go and the order.
 * @evidence contracts/development/implementation.md#principled-implementation The listed kinds are the ones a renderer draws, so the listing is the population a selection pattern can show or hide.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One traversal that keeps the drawn kinds and asks the path owner for each path.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No object is skipped by name or by visibility, and objects sharing a path are all returned.
 * @evidence contracts/development/implementation.md#efficient-algorithms One traversal, plus one walk of each drawn object's depth for its path.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Paths come from `autoMovieInspectionPathOf`, the same function a single object's path is read with.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns borrowed object references and their paths; the scene is read and nothing is retained.
 */
export function listAutoMovieInspectionPaths(
  root: THREE.Object3D,
): IAutoMovieInspectionPath[] {
  const paths: IAutoMovieInspectionPath[] = [];
  root.traverse((object: THREE.Object3D): void => {
    if (
      object instanceof THREE.Mesh ||
      object instanceof THREE.Line ||
      object instanceof THREE.Points ||
      object instanceof THREE.Sprite
    )
      paths.push({ path: autoMovieInspectionPathOf(root, object), object });
  });
  return paths;
}
