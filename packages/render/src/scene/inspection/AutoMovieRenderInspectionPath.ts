import type * as THREE from "three";
import { type IAutoMovieInspectionPath } from "./IAutoMovieInspectionPath.js";
import { listAutoMovieInspectionPaths as listAutoMovieInspectionPathsImplementation } from "./internal/listAutoMovieInspectionPaths.js";

import { matchAutoMovieInspectionPath as matchAutoMovieInspectionPathImplementation } from "./internal/matchAutoMovieInspectionPath.js";

/** Public operations for Auto Movie Render Inspection Path. */
export namespace AutoMovieRenderInspectionPath {
  /**
   * Decide whether a path pattern selects an object path.
   *
   * A path is the names from the scene down to an object, joined by `/`. A
   * pattern is read segment by segment: `*` stands for any run of characters
   * inside one name, and a segment that is exactly `**` stands for any number of
   * names, none included. Letter case counts.
   *
   * A pattern without `/` selects an object when any one name on its path
   * matches, so `head` finds the head wherever it sits in the hierarchy and takes
   * everything beneath it. A pattern with `/` is matched from the first name of
   * the path, and selects the object it reaches and everything beneath that
   * object.
   *
   * | Pattern      | Selects                                              |
   * | ------------ | ---------------------------------------------------- |
   * | `hero`       | Every object named `hero` and everything beneath one |
   * | `*arm*`      | Everything at or beneath a name containing `arm`     |
   * | `hero/torso` | `hero/torso` and everything beneath it               |
   * | `hero/*`     | Every object at or beneath a named child of `hero`   |
   * | `**`         | Every object, those with the empty path included     |
   *
   * An empty pattern throws.
   */
  export function matchPath(path: string, pattern: string): boolean {
    return matchAutoMovieInspectionPathImplementation(path, pattern);
  }

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
  export function list(root: THREE.Object3D): IAutoMovieInspectionPath[] {
    return listAutoMovieInspectionPathsImplementation(root);
  }
}
