import type * as THREE from "three";
import { invalidateAutoMovieSkinnedPose as invalidateAutoMovieSkinnedPoseImplementation } from "./internal/invalidateAutoMovieSkinnedPose.js";
import { type IAutoMovieModelObject } from "./IAutoMovieModelObject.js";
import { type AutoMovieHumanoidBone, type IAutoMovieRigLocalTransform, type IAutoMovieRigidTransform } from "@automovie/interface";
import { applyAutoMovieRigLocals as applyAutoMovieRigLocalsImplementation } from "./internal/applyAutoMovieRigLocals.js";
import { createAutoMoviePhysicalPoseAdapter as createAutoMoviePhysicalPoseAdapterImplementation } from "./internal/createAutoMoviePhysicalPoseAdapter.js";

/** Public operations for Auto Movie Render Scene Motion. */
export namespace AutoMovieRenderSceneMotion {
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
  export function invalidateSkinnedPose(root: THREE.Object3D): void {
    invalidateAutoMovieSkinnedPoseImplementation(root);
  }

  /**
   * Display complete evaluator-produced bone locals, including translations
   * caused by omitted intermediate joints. Values are absolute parent-relative
   * transforms, rather than deltas from the build's rest pose. `root` places the
   * model in its parent's frame. Every written scale becomes one.
   *
   * The map must contain exactly the target's mapped bone slots. Before any
   * mutation, rejects missing or extra slots, nonfinite components, malformed
   * tuples and quaternions whose squared norm differs from one by over 1e-6. An
   * empty map is valid for a nonrigged target. No quaternion is normalized.
   *
   * Refreshes local and world matrices, including changed ancestors, and
   * invalidates skinned bounds and CPU pose caches. The caller owns semantic
   * evaluation, morph weights, imported-runtime flushing and rendering.
   */
  export function applyRigLocals(target: IAutoMovieModelObject, locals: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieRigLocalTransform>, root: IAutoMovieRigLocalTransform): void {
    applyAutoMovieRigLocalsImplementation(target, locals, root);
  }

  /**
   * Apply solved world bone frames to an existing complete skin rig, retaining
   * unlisted bones' authored local transforms.
   */
  export function createPhysicalPoseAdapter(model: IAutoMovieModelObject): (poses: Readonly<Record<string, IAutoMovieRigidTransform>>) => void {
    return createAutoMoviePhysicalPoseAdapterImplementation(model);
  }
}
