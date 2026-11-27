import type * as THREE from "three";
import { type IAutoMovieRenderInspectionPath } from "./IAutoMovieRenderInspectionPath.js";
import { listAutoMovieInspectionPaths as listAutoMovieInspectionPathsImplementation } from "./inspection/internal/listAutoMovieInspectionPaths.js";

import { matchAutoMovieInspectionPath as matchAutoMovieInspectionPathImplementation } from "./inspection/internal/matchAutoMovieInspectionPath.js";
import { autoMovieInspectionPathOfImplementation } from "./inspection/internal/autoMovieInspectionPathOfImplementation.js";
import { autoMovieInspectionEntityPathOfImplementation } from "./inspection/internal/autoMovieInspectionEntityPathOfImplementation.js";

/** Public operations for Auto Movie Render Inspection Path. */
export namespace AutoMovieRenderInspectionPath {
  /** Named input contract for making a path from the inspected root. */
    /** Root and object pair used to form one inspection path. */
    export interface IPathOfProps {
      /** Root excluded from the path. */
      root: THREE.Object3D;
      /** Root or descendant whose path is read. */
      object: THREE.Object3D;
    }
  /** Named input contract for making a unique node identity. */
    /** Root, object and optional cache used to form one unique identity. */
    export interface IEntityPathOfProps {
      /** Root excluded from the identity. */
      root: THREE.Object3D;
      /** Root or descendant to identify. */
      object: THREE.Object3D;
      /** Optional named-frontier cache, valid while the scene graph is unchanged. */
      frontiers?: Map<THREE.Object3D, ReadonlyMap<string, readonly THREE.Object3D[]>>;
    }
  /**
   * Return the object path below root, joining nonempty names with /. The root
   * itself has an empty path; unnamed objects add no segment, while a name
   * containing / contributes those segments.
   *
   * @throws {Error} When the object is not the root or beneath it.
   */
  export function pathOf(props: IPathOfProps): string {
    return autoMovieInspectionPathOfImplementation(props.root, props.object);
  }
  /**
   * Return a unique identity below root. Repeated named siblings take #k in
   * depth-first child order; unnamed nodes add their child index. A supplied
   * frontier cache is reused while the graph remains unchanged.
   *
   * @throws {Error} When the object is not the root or beneath it.
   */
  export function entityPathOf(
    props: IEntityPathOfProps,
  ): string {
    return autoMovieInspectionEntityPathOfImplementation(props.root, props.object, props.frontiers);
  }
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
  export function list(root: THREE.Object3D): IAutoMovieRenderInspectionPath[] {
    return listAutoMovieInspectionPathsImplementation(root);
  }
}
