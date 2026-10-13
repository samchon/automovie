import type { AutoMovieHumanoidBone } from "@automovie/interface";
import type * as THREE from "three";

import type { IAutoMovieExpressionTarget } from "./IAutoMovieExpressionTarget.js";
import type { IAutoMovieViewerFrame } from "./IAutoMovieViewerFrame.js";

/**
 * A built model: its `three.js` root object and a lookup of its bones.
 *
 * @author Samchon
 */
export interface IAutoMovieModelObject {
  /** Root group; add this to a scene (or a node group) to display the model. */
  object: THREE.Group;

  /** Bones by humanoid slot, for posing. Empty for a non-rigged object. */
  bones: ReadonlyMap<AutoMovieHumanoidBone, THREE.Object3D>;

  /**
   * Parts by {@link IAutoMovieModelPart.id}, for a caller that has to move one.
   *
   * A prop's articulation joint names the part that rides it, and the only way
   * to make that reference true on screen is to reparent that part under the
   * joint's own object. Found by id rather than by traversing for a name,
   * because a part's `name` is optional and a model may carry two parts sharing
   * one, so a name search would move whichever it reached first.
   */
  parts: ReadonlyMap<string, THREE.Object3D>;

  /**
   * Optional expression sinks: morph managers, VRM expression managers, etc.
   */
  expressionTargets?: readonly IAutoMovieExpressionTarget[];

  /** Optional imported-runtime flush after pose and expression are written. */
  afterAutoMovieFrame?: (frame: IAutoMovieViewerFrame) => void;
}
