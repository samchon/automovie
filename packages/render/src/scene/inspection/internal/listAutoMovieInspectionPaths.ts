import * as THREE from "three";

import { AutoMovieRenderThreeKind } from "../../AutoMovieRenderThreeKind.js";
import type { IAutoMovieRenderInspectionPath } from "../../IAutoMovieRenderInspectionPath.js";
import { AutoMovieRenderInspectionPath } from "../../AutoMovieRenderInspectionPath.js";

/*
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
): IAutoMovieRenderInspectionPath[] {
  const paths: IAutoMovieRenderInspectionPath[] = [];
  root.traverse((object: THREE.Object3D): void => {
    if (
      AutoMovieRenderThreeKind.isMesh(object) ||
      AutoMovieRenderThreeKind.isLine(object) ||
      AutoMovieRenderThreeKind.isPoints(object) ||
      AutoMovieRenderThreeKind.isSprite(object)
    )
      paths.push({ path: AutoMovieRenderInspectionPath.pathOf({ root, object }), object });
  });
  return paths;
}
