import type {
  AutoMovieHumanoidBone,
  IAutoMovieLookAt,
} from "@automovie/interface";
import type * as THREE from "three";

import type { IAutoMovieExpressionTarget } from "./IAutoMovieExpressionTarget.js";
import type { IAutoMovieViewerFrame } from "./IAutoMovieViewerFrame.js";

/**
 * A built model: its `three.js` root object and a lookup of its bones.
 *
 * @evidence contracts/common.md#principled-implementation A root group with semantic bone and authored part-id maps supports common pose and prop-articulation application; imported appearances may supply expression/frame callbacks and an empty part map.
 * @evidence contracts/common.md#clear-and-simple-design Separates root placement, skeletal articulation, authored part lookup, the model's gaze declaration and optional runtime integration without exposing a concrete imported-avatar SDK.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Part ids decide articulation rather than optional nonunique display names; missing imported rig slots are not replaced with invented bones.
 * @evidence contracts/common.md#meaningful-documentation Documents root mounting, nonrigged bone absence, part-id lookup rationale, the optional gaze declaration and optional expression/runtime-flush hooks.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The built-model shape performs no object traversal or forward kinematics.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Maps expose existing runtime identity but the type coordinates no build cache or asynchronous request.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Builders or importing hosts own root geometry/material lifetime; this interface creates no loop, renderer or loaded asset.
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

  /**
   * The model's gaze declaration, {@link IAutoMovieModel.lookAt}; `buildModel`
   * copies it. When it is `"bone"`, `AutoMoviePlayer` turns the eye bones for
   * the gaze channels instead of writing them to morphs and sinks; omitted,
   * gaze stays on morphs and sinks.
   */
  lookAt?: IAutoMovieLookAt;

  /**
   * Optional imported-runtime flush after pose and expression are written.
   *
   * @evidence contracts/common.md#principled-implementation Receives AutoMoviePlayer's actual applied pose/expression frame after both viewer adapters finish, so imported dependent state shares the same elapsed/delta clock.
   * @evidence contracts/common.md#clear-and-simple-design One optional callback adapts foreign runtime integration without exposing its SDK methods throughout model construction and playback.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The host supplies this callback explicitly instead of monkey-patching a runtime update method or synthesizing a global clock.
   * @evidence contracts/common.md#meaningful-documentation States optional imported-runtime flushing and its ordering after pose/expression application.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This callback contract does not select the imported runtime's update algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The player invokes effectful flushing for each update and defines no result-sharing promise here.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Any imported state or task retained by the callback remains host-owned; the model handle acquires no imported manager.
   */
  afterAutoMovieFrame?: (frame: IAutoMovieViewerFrame) => void;
}
