import * as THREE from "three";

import type { IAutoMovieInspectionPath } from "./IAutoMovieInspectionPath.js";
import { autoMovieInspectionPathOf } from "./autoMovieInspectionPathOf.js";

/**
 * List every object of a scene that three.js draws, each with its inspection
 * path, in traversal order.
 *
 * Meshes, lines, points and sprites are listed whether or not they are visible,
 * because a path names a part of the scene, not a state of it. Groups, bones,
 * lights and cameras are not listed; their names appear as segments of the
 * paths beneath them.
 *
 * ```ts
 * for (const { path } of listAutoMovieInspectionPaths(scene))
 *   console.log(path);
 * ```
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
