import type { AutoMovieHumanoidBone } from "@automovie/interface";
import {
  type IAutoMovieModelObject,
  invalidateAutoMovieSkinnedPose,
} from "@automovie/viewer";
import type * as THREE from "three";

import type { AutoMovieHumanRig } from "../../../src/index";

/**
 * Move a built Human's bones to one evaluated pose, leaving its geometry alone.
 *
 * The skinned parts then start a new pose revision, so culling, shadow, framing
 * and picking bounds follow the pose the shaders draw instead of the rest.
 *
 * @param target The built model.
 * @param pose Local transforms from `AutoMovieHumanRig.locals` or `bindLocals`.
 * @throws {Error} When a transform names a bone the model does not carry, before any bone moves.
 *
 * @evidence contracts/common.md#principled-implementation Writes the rig's parent-local translations and rotations onto the model's bones, which Three's skeleton then applies; the deformation stays in the existing skinning shaders and the CPU bounds follow through invalidateAutoMovieSkinnedPose.
 * @evidence contracts/common.md#clear-and-simple-design Pose evaluation stays in Human, geometry construction in buildModel, posed bounds in AutoMovieSkinnedMesh; this function only places bones and starts the revision.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unknown bone refuses the whole pose before anything moves; culling stays on with posed bounds rather than being disabled.
 * @evidence contracts/common.md#meaningful-documentation States the units' owner and the bounds revision.
 * @evidence contracts/performance.md#efficient-algorithms One write per rig bone, one world update and one constant-time revision pass over the model's objects.
 * @evidence contracts/performance.md#reuse-equivalent-work Geometry, materials and bone objects are reused for every pose, so a pose never regenerates the body.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains nothing and acquires no resource.
 */
export function applyHumanRigPose(
  target: IAutoMovieModelObject,
  pose: ReadonlyMap<AutoMovieHumanoidBone, AutoMovieHumanRig.ILocal>,
): void {
  for (const bone of pose.keys())
    if (!target.bones.has(bone))
      throw new Error(`Human pose names a missing bone: ${bone}`);
  for (const [bone, local] of pose) {
    const node: THREE.Object3D = target.bones.get(bone)!;
    node.position.set(...local.translation);
    node.quaternion.set(...local.rotation);
  }
  target.object.updateMatrixWorld(true);
  invalidateAutoMovieSkinnedPose(target.object);
}
